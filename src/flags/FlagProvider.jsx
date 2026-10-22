import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_RULE_STATE, REGIONAL_RULES } from '../lib/regionalRules';

// A self-contained, simulated feature flag for the demo: one flag, "master", with typed variables.
// State lives in localStorage and syncs across open tabs, so a toggle in one window updates the other.
const STORAGE_KEY = 'lumen_master_flag_v1';
const FlagContext = createContext(null);

// What the site shows when the flag is OFF (or a variable has been deleted).
export const CONTROL = {
  banner_count: 1,
  support_bot: false,
  navigation: 'top',
  theme_color: '#4f46e5',
  regional_pricing: false,
};

export const DEFAULT_VARIABLES = [
  { key: 'banner_count', type: 'number', value: 3, min: 1, max: 4, description: 'How many banners rotate in the top carousel' },
  { key: 'support_bot', type: 'boolean', value: true, description: 'Show the floating support chat bot' },
  { key: 'navigation', type: 'select', value: 'side', options: ['top', 'side'], description: 'Top navigation bar or side navigation' },
  { key: 'theme_color', type: 'color', value: '#0f766e', description: 'Primary brand colour across the product' },
  { key: 'regional_pricing', type: 'boolean', value: true, description: 'Local-currency prices by country, using the regional pricing rules below' },
];

// Older saved states predate regional_pricing: add it once, without restoring variables the presenter deleted.
function migrate(state) {
  // Keep descriptions of built-in variables current; values the presenter set are untouched.
  const variables = state.variables.map((v) => {
    const d = DEFAULT_VARIABLES.find((x) => x.key === v.key);
    return d ? { ...v, description: d.description } : v;
  });
  let next = { ...state, variables, regionalRules: state.regionalRules || { ...DEFAULT_RULE_STATE } };
  if (next.migratedRegional) return next;
  const has = next.variables.some((v) => v.key === 'regional_pricing');
  return {
    ...next,
    migratedRegional: true,
    variables: has ? next.variables : [...next.variables, DEFAULT_VARIABLES.find((v) => v.key === 'regional_pricing')],
  };
}

const initialState = () => ({ enabled: false, variables: DEFAULT_VARIABLES, regionalRules: { ...DEFAULT_RULE_STATE }, migratedRegional: true, updatedAt: Date.now() });

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const state = migrate(JSON.parse(raw));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    }
  } catch {
    // ignore unreadable storage
  }
  return initialState();
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

const describe = (v) => (typeof v === 'boolean' ? (v ? 'on' : 'off') : String(v));

export function FlagProvider({ children }) {
  const [flag, setFlag] = useState(load);
  const [log, setLog] = useState([]);
  const [pulse, setPulse] = useState({ keys: [], at: 0, message: '' });
  const [outlines, setOutlines] = useState(false);
  const logId = useRef(0);

  // Resolved values the site renders: variables when ON, control values when OFF.
  const resolve = useCallback((state) => {
    const out = { ...CONTROL };
    if (state.enabled) for (const v of state.variables) out[v.key] = v.value;
    return out;
  }, []);

  const values = useMemo(() => resolve(flag), [flag, resolve]);

  const announce = useCallback((prev, next, message) => {
    const before = resolve(prev);
    const after = resolve(next);
    const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((k) => before[k] !== after[k]);
    const changes = changed.map((k) => ({ key: k, from: describe(before[k]), to: describe(after[k]) }));
    // Regional pricing rule switches are part of the flag too.
    for (const r of REGIONAL_RULES) {
      const from = prev.regionalRules?.[r.id] !== false;
      const to = next.regionalRules?.[r.id] !== false;
      if (from !== to) changes.push({ key: 'regional_pricing', label: `rule ${r.name}`, from: describe(from), to: describe(to) });
    }
    const keys = [...new Set(changes.map((c) => c.key))];
    setPulse({ keys, at: Date.now(), message, changes });
    setLog((l) => [{ id: ++logId.current, at: new Date(), message, changes: changes.map((c) => `${c.label || c.key}: ${c.from} → ${c.to}`) }, ...l].slice(0, 100));
  }, [resolve]);

  const update = useCallback(
    (mutate, message) => {
      setFlag((prev) => {
        const next = { ...mutate(prev), updatedAt: Date.now() };
        save(next);
        announce(prev, next, message);
        return next;
      });
    },
    [announce],
  );

  // Changes made in another tab arrive through the storage event.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      const next = migrate(JSON.parse(e.newValue));
      setFlag((prev) => {
        announce(prev, next, 'Updated from another window');
        return next;
      });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [announce]);

  const api = {
    flag,
    values,
    pulse,
    log,
    outlines,
    setOutlines,
    setEnabled: (enabled) => update((f) => ({ ...f, enabled }), `master turned ${enabled ? 'ON' : 'OFF'}`),
    setVariable: (key, value) =>
      update((f) => ({ ...f, variables: f.variables.map((v) => (v.key === key ? { ...v, value } : v)) }), `Variable ${key} set to ${describe(value)}`),
    addVariable: (variable) => update((f) => ({ ...f, variables: [...f.variables.filter((v) => v.key !== variable.key), variable] }), `Variable ${variable.key} created`),
    removeVariable: (key) => update((f) => ({ ...f, variables: f.variables.filter((v) => v.key !== key) }), `Variable ${key} deleted`),
    setRegionalRule: (id, on) =>
      update(
        (f) => ({ ...f, regionalRules: { ...DEFAULT_RULE_STATE, ...f.regionalRules, [id]: on } }),
        `Rule ${REGIONAL_RULES.find((r) => r.id === id)?.name} turned ${on ? 'ON' : 'OFF'}`,
      ),
    reset: () => update(() => initialState(), 'master reset to defaults'),
  };

  return <FlagContext.Provider value={api}>{children}</FlagContext.Provider>;
}

export const useFlag = () => useContext(FlagContext);
