import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth';
import { useFlag } from '../flags/FlagProvider';
import { decidePricing, USD } from './regionalRules';

// Regional pricing, simulated: the visitor's country is matched against the regional_pricing rules
// in the Control Tower. Country = location picker override, else account country, else real location.
const PricingContext = createContext(null);
const OVERRIDE_KEY = 'lumen_view_country';

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
  const { values, flag } = useFlag();
  const [override, setOverrideState] = useState(readOverride);
  const [detected, setDetected] = useState(null);
  const [changedAt, setChangedAt] = useState(0);

  // The visitor's real country, from Netlify's geolocation (asked once).
  useEffect(() => {
    api('/geo')
      .then((d) => setDetected(d.country || null))
      .catch(() => setDetected(null));
  }, []);

  const setLocation = (code) => {
    try {
      if (code) localStorage.setItem(OVERRIDE_KEY, code);
      else localStorage.removeItem(OVERRIDE_KEY);
    } catch {
      // ignore storage failures
    }
    setOverrideState(code || '');
  };

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
  }, [authLoading, user?.id]);

  const country = override || user?.country || detected || 'US';
  const source = override ? 'override' : user ? 'account' : detected ? 'location' : 'default';
  const regionalOff = !values.regional_pricing;
  const decision = useMemo(() => (regionalOff ? { ...USD, rule: null } : decidePricing(country, flag.regionalRules)), [regionalOff, country, flag.regionalRules]);

  // Flash the pricing bar whenever the shown currency or country changes.
  const signature = `${decision.currency}|${country}`;
  const lastSignature = useRef(signature);
  useEffect(() => {
    if (lastSignature.current !== signature) {
      lastSignature.current = signature;
      setChangedAt(Date.now());
    }
  }, [signature]);

  const format = (usd) => {
    if (!usd) return `${decision.symbol}0`;
    return `${decision.symbol}${Math.round(usd * decision.rate).toLocaleString('en-US')}`;
  };

  const value = {
    ...decision,
    country,
    source,
    override,
    detectedCountry: detected,
    accountCountry: user?.country || null,
    regionalOff,
    setLocation,
    format,
    changedAt,
  };
  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export const usePricing = () => useContext(PricingContext);
