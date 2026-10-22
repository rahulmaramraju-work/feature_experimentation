// Simulated regional_pricing personalization rules, evaluated top to bottom like flag rules:
// the first enabled rule whose audience includes the visitor's country decides the currency.
export const REGIONAL_RULES = [
  { id: 'india', name: 'India audience', countries: ['IN'], currency: 'INR', symbol: '₹', rate: 83 },
  { id: 'europe', name: 'Europe audience', countries: ['IT', 'DE', 'FR', 'ES'], currency: 'EUR', symbol: '€', rate: 0.92 },
  { id: 'uk', name: 'UK audience', countries: ['GB'], currency: 'GBP', symbol: '£', rate: 0.79 },
];

export const DEFAULT_RULE_STATE = Object.fromEntries(REGIONAL_RULES.map((r) => [r.id, true]));

export const USD = { currency: 'USD', symbol: '$', rate: 1 };

export function decidePricing(country, ruleState = DEFAULT_RULE_STATE) {
  const rule = REGIONAL_RULES.find((r) => ruleState[r.id] !== false && r.countries.includes(country));
  return rule ? { currency: rule.currency, symbol: rule.symbol, rate: rule.rate, rule } : { ...USD, rule: null };
}
