import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth';

// Prices come from the Wingify FE flag regional_pricing, evaluated on the server for the visitor's country.
const PricingContext = createContext(null);
const OVERRIDE_KEY = 'lumen_view_country';
const REFRESH_MS = 15_000;

export const LOCATIONS = [
  ['US', 'United States', '🇺🇸'],
  ['IN', 'India', '🇮🇳'],
  ['GB', 'United Kingdom', '🇬🇧'],
  ['DE', 'Germany', '🇩🇪'],
  ['IT', 'Italy', '🇮🇹'],
  ['FR', 'France', '🇫🇷'],
  ['ES', 'Spain', '🇪🇸'],
  ['CA', 'Canada', '🇨🇦'],
  ['AU', 'Australia', '🇦🇺'],
  ['SG', 'Singapore', '🇸🇬'],
  ['BR', 'Brazil', '🇧🇷'],
];
export const countryName = (code) => LOCATIONS.find(([c]) => c === code)?.[1] || code;
export const countryFlag = (code) => LOCATIONS.find(([c]) => c === code)?.[2] || '🌐';

const readOverride = () => {
  try {
    return localStorage.getItem(OVERRIDE_KEY) || '';
  } catch {
    return '';
  }
};

export function PricingProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [override, setOverrideState] = useState(readOverride);
  const [pricing, setPricing] = useState({ currency: 'USD', symbol: '$', rate: 1, enabled: false, country: 'US', source: 'default' });
  const [loading, setLoading] = useState(true);
  const [changedAt, setChangedAt] = useState(0);

  const load = useCallback(async () => {
    try {
      const next = await api(`/pricing${override ? `?country=${override}` : ''}`);
      setPricing((prev) => {
        if (prev.currency !== next.currency || prev.country !== next.country) setChangedAt(Date.now());
        return next;
      });
    } catch {
      // keep the last known prices
    } finally {
      setLoading(false);
    }
  }, [override]);

  // Re-evaluate when the account or location changes, and periodically for dashboard edits.
  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load, user?.id, user?.country]);

  // Switching account goes back to that account's own country.
  const lastUserId = useRef(null);
  useEffect(() => {
    if (authLoading) return;
    const id = user?.id || 'anonymous';
    if (lastUserId.current === null) lastUserId.current = id; // first load: keep any saved location
    else if (lastUserId.current !== id) {
      lastUserId.current = id;
      setLocation('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const setLocation = (code) => {
    try {
      if (code) localStorage.setItem(OVERRIDE_KEY, code);
      else localStorage.removeItem(OVERRIDE_KEY);
    } catch {
      // ignore storage failures
    }
    setOverrideState(code || '');
  };

  const format = (usd) => {
    if (!usd) return `${pricing.symbol}0`;
    return `${pricing.symbol}${Math.round(usd * pricing.rate).toLocaleString('en-US')}`;
  };

  return <PricingContext.Provider value={{ ...pricing, loading, override, setLocation, format, changedAt, reload: load }}>{children}</PricingContext.Provider>;
}

export const usePricing = () => useContext(PricingContext);
