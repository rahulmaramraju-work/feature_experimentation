import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

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
};

export const DEFAULT_VARIABLES = [
  { key: 'banner_count', type: 'number', value: 3, min: 1, max: 4, description: 'How many promo banners stack at the top of every page' },
  { key: 'support_bot', type: 'boolean', value: true, description: 'Show the floating support chat bot' },
  { key: 'navigation', type: 'select', value: 'side', options: ['top', 'side'], description: 'Top navigation bar or side navigation' },
  { key: 'theme_color', type: 'color', value: '#0f766e', description: 'Primary brand colour across the product' },
];

const initialState = () => ({ enabled: false, variables: DEFAULT_VARIABLES, updatedAt: Date.now() });

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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
    setPulse({ keys: changed, at: Date.now(), message, changes: changed.map((k) => ({ key: k, from: describe(before[k]), to: describe(after[k]) })) });
    setLog((l) => [{ id: ++logId.current, at: new Date(), message, changes: changed.map((k) => `${k}: ${describe(before[k])} → ${describe(after[k])}`) }, ...l].slice(0, 100));
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
      const next = JSON.parse(e.newValue);
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
    reset: () => update(() => initialState(), 'master reset to defaults'),
  };

  return <FlagContext.Provider value={api}>{children}</FlagContext.Provider>;
}

export const useFlag = () => useContext(FlagContext);
