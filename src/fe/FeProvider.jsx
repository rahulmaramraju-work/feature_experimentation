import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { init } from 'vwo-fme-react-sdk';
import { api, setApiFeEnv } from '../lib/api';
import { useAuth } from '../lib/auth';
import { buildFeContext } from '../../shared/feContext';

const FeContext = createContext(null);
const ENV_KEY = 'lumen_fe_env';
const POLL_MS = 10_000;

function anonymousId() {
  try {
    let id = localStorage.getItem('lumen_anon_id');
    if (!id) localStorage.setItem('lumen_anon_id', (id = `anon_${crypto.randomUUID().slice(0, 12)}`));
    return id;
  } catch {
    return 'anon_visitor';
  }
}

const readStoredEnv = () => {
  try {
    return localStorage.getItem(ENV_KEY);
  } catch {
    return null;
  }
};

export function toVariables(raw) {
  if (!raw) return {};
  return Array.isArray(raw) ? Object.fromEntries(raw.map((v) => [v.key, v.value])) : raw;
}

export function FeProvider({ children }) {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [envOverride, setEnvOverride] = useState(readStoredEnv);
  const [client, setClient] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [version, setVersion] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [log, setLog] = useState([]);
  const [anonId, setAnonId] = useState(anonymousId);
  const idRef = useRef(0);

  const push = useCallback((entry) => {
    setLog((l) => [{ id: ++idRef.current, at: new Date(), ...entry }, ...l].slice(0, 150));
  }, []);

  useEffect(() => {
    api('/config')
      .then(setConfig)
      .catch(() => setStatus('error'));
  }, []);

  const env = config && envOverride && config.environments[envOverride] ? envOverride : config?.defaultEnv;

  useEffect(() => {
    setApiFeEnv(env);
  }, [env]);

  // (Re)initialise the SDK whenever the environment changes.
  useEffect(() => {
    if (!config || !env) return;
    const sdkKey = config.environments[env];
    if (!sdkKey) {
      setStatus('error');
      return;
    }
    let cancelled = false;
    let instance;
    setStatus('loading');
    setClient(null);
    setDecisions({});
    init({
      accountId: config.accountId,
      sdkKey,
      logger: { level: 'ERROR' },
      // Stateless evaluation so dashboard changes show up immediately during demos.
      clientStorage: { isDisabled: true },
      integrations: {
        callback: (props) => push({ type: 'integration', title: `Decision: ${props.featureKey || props.featureName || 'flag'}`, detail: props }),
      },
    })
      .then((c) => {
        instance = c;
        if (cancelled) return;
        setClient(c);
        setStatus('ready');
        setLastSync(new Date());
        push({ type: 'sync', title: `SDK initialised (${env})`, detail: { features: c.originalSettings?.features?.length ?? 0 } });
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error');
          push({ type: 'error', title: 'SDK failed to initialise', detail: { message: err?.message } });
        }
      });
    return () => {
      cancelled = true;
      instance?.shutdown?.();
    };
  }, [config, env, push]);

  // Refresh settings on an interval via our API, which fetches them fresh from Wingify server-side
  // (the browser settings endpoint is CDN-cached for about a minute).
  const refreshSettings = useCallback(async () => {
    if (!client) return;
    try {
      const settings = await api('/fe-settings');
      if (settings?.features) await client.updateSettings(settings);
    } catch {
      await client.updateSettings(undefined, false).catch(() => {});
    }
  }, [client]);

  useEffect(() => {
    if (!client) return;
    const t = setInterval(refreshSettings, POLL_MS);
    return () => clearInterval(t);
  }, [client, refreshSettings]);

  // Watch for new settings and re-evaluate every flag on the page.
  useEffect(() => {
    if (!client) return;
    let last = JSON.stringify(client.originalSettings);
    const t = setInterval(() => {
      const now = JSON.stringify(client.originalSettings);
      if (now !== last) {
        last = now;
        setVersion((v) => v + 1);
        setLastSync(new Date());
        push({ type: 'sync', title: 'New settings received from Wingify', detail: { lastUpdatedOn: client.originalSettings?.lastUpdatedOn } });
      }
    }, 1500);
    return () => clearInterval(t);
  }, [client, push]);

  const context = useMemo(() => buildFeContext(user) || { id: anonId, customVariables: { plan: 'anonymous' } }, [user, anonId]);

  // Start over as a brand-new anonymous visitor: a new id means a fresh A/B bucketing decision.
  const newVisitor = useCallback(() => {
    const id = `anon_${crypto.randomUUID().slice(0, 12)}`;
    try {
      localStorage.setItem('lumen_anon_id', id);
    } catch {
      // ignore storage failures
    }
    setAnonId(id);
    push({ type: 'attribute', title: 'New anonymous visitor', detail: { id } });
  }, [push]);
  const contextKey = JSON.stringify(context);

  // Push the user's attributes to Wingify for segmentation in reports.
  useEffect(() => {
    if (!client || !user) return;
    const attrs = { ...context.customVariables };
    client.setAttribute(attrs, context).catch(() => {});
    push({ type: 'attribute', title: 'setAttribute', detail: attrs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, contextKey]);

  const syncNow = useCallback(async () => {
    if (!client) return;
    await refreshSettings();
    setVersion((v) => v + 1);
    setLastSync(new Date());
    push({ type: 'sync', title: 'Manual sync with Wingify' });
  }, [client, push, refreshSettings]);

  const recordDecision = useCallback((key, decision) => {
    setDecisions((d) => ({ ...d, [key]: { ...decision, at: new Date() } }));
  }, []);

  const track = useCallback(
    (event, props = {}, contextOverride) => {
      push({ type: 'event', title: `trackEvent: ${event}`, detail: props });
      if (client) client.trackEvent(event, contextOverride || context, props).catch(() => {});
    },
    [client, context, push],
  );

  const switchEnv = useCallback((next) => {
    try {
      localStorage.setItem(ENV_KEY, next);
    } catch {
      // ignore storage failures
    }
    setEnvOverride(next);
  }, []);

  const value = {
    client,
    status,
    env,
    environments: config ? Object.keys(config.environments) : [],
    switchEnv,
    config,
    context,
    contextKey,
    newVisitor,
    version,
    lastSync,
    syncNow,
    decisions,
    recordDecision,
    log,
    push,
    track,
  };
  return <FeContext.Provider value={value}>{children}</FeContext.Provider>;
}

export const useFe = () => useContext(FeContext);
