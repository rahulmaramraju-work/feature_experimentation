import { useEffect, useState } from 'react';
import { useFe, toVariables } from './FeProvider';
import { FLAGS } from './flags';

// Evaluates a Wingify FE flag for the current user and re-evaluates when settings or the user change.
export function useFeature(key) {
  const { client, status, context, contextKey, version, recordDecision } = useFe();
  const defaults = FLAGS[key]?.defaults || {};
  const [state, setState] = useState({ ready: false, enabled: false, variables: {} });

  useEffect(() => {
    if (status === 'error') {
      setState({ ready: true, enabled: false, variables: {} });
      return;
    }
    if (!client) return;
    let cancelled = false;
    client
      .getFlag(key, context)
      .then((flag) => {
        if (cancelled) return;
        const next = { ready: true, enabled: flag.isEnabled(), variables: toVariables(flag.getVariables()) };
        setState(next);
        recordDecision(key, { ...next, evaluatedOn: 'client' });
      })
      .catch(() => !cancelled && setState({ ready: true, enabled: false, variables: {} }));
    return () => {
      cancelled = true;
    };
    // contextKey captures context changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, status, key, contextKey, version, recordDecision]);

  // Variables only apply while the flag is on; otherwise fall back to defaults.
  const get = (name, fallback = defaults[name]) => (state.enabled && state.variables[name] !== undefined ? state.variables[name] : fallback);
  return { ...state, get };
}
