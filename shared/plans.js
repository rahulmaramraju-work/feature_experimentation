// Plan catalogue shared by the API (limits) and the UI (pricing, gating).
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    monthly: 0,
    annual: 0,
    blurb: 'For individuals exploring product analytics.',
    limits: { projects: 3, seats: 2, eventsPerMonth: 10_000 },
    features: ['3 projects', '2 team seats', '10k events / month', 'Core dashboards', '7-day data retention'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthly: 49,
    annual: 39,
    blurb: 'For growing teams that make decisions with data.',
    limits: { projects: 25, seats: 10, eventsPerMonth: 1_000_000 },
    features: ['25 projects', '10 team seats', '1M events / month', 'AI Insights', 'Funnels & retention', '1-year retention'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: 199,
    annual: 159,
    blurb: 'For organisations with advanced security and scale needs.',
    limits: { projects: Infinity, seats: Infinity, eventsPerMonth: Infinity },
    features: ['Unlimited projects', 'Unlimited seats', 'Unlimited events', 'AI Insights + forecasting', 'CSV & warehouse export', 'SSO, audit log, SLA'],
  },
};

export const PLAN_ORDER = ['free', 'pro', 'enterprise'];

export const planRank = (plan) => PLAN_ORDER.indexOf(plan);
