// Every Wingify FE flag the product uses, with safe defaults.
// Defaults apply whenever a flag is off, missing, or Wingify is unreachable.
export const FLAGS = {
  announcement_banner: {
    name: 'Announcement banner',
    kind: 'Kill switch',
    where: 'Top of every app page',
    evaluatedOn: 'client',
    defaults: { message: 'Lumen 3.0 is here: faster dashboards and AI Insights.', tone: 'info', cta_text: 'See what’s new', cta_link: '/app/insights' },
  },
  brand_theme: {
    name: 'Brand theme',
    kind: 'Remote config',
    where: 'Whole site colour and badge',
    evaluatedOn: 'client',
    defaults: { primary_color: '#4f46e5', badge_text: 'none' },
  },
  dashboard_v2: {
    name: 'Dashboard v2',
    kind: 'Progressive rollout',
    where: 'Dashboard layout',
    evaluatedOn: 'client',
    defaults: { layout: 'classic', show_forecast: false },
  },
  onboarding_checklist: {
    name: 'Onboarding checklist',
    kind: 'A/B test',
    where: 'Dashboard, new users',
    evaluatedOn: 'client',
    defaults: { variant: 'compact' },
  },
  pricing_experiment: {
    name: 'Pricing page experiment',
    kind: 'A/B test',
    where: 'Pricing section and billing plans',
    evaluatedOn: 'client',
    defaults: { headline: 'Simple pricing that scales with you', highlight_plan: 'pro', cta_text: 'Start free trial', show_annual_savings: false },
  },
  regional_pricing: {
    name: 'Regional pricing',
    kind: 'Personalization',
    where: 'Prices for specific countries',
    evaluatedOn: 'client',
    defaults: { currency: 'USD', symbol: '$', rate: 1 },
  },
  new_checkout_flow: {
    name: 'New checkout flow',
    kind: 'A/B test',
    where: 'Upgrade checkout',
    evaluatedOn: 'client',
    defaults: { flow: 'review_step', show_trust_badges: false },
  },
  csv_export: {
    name: 'CSV export (beta)',
    kind: 'Beta gate',
    where: 'Reports page',
    evaluatedOn: 'client',
    defaults: {},
  },
  ai_insights: {
    name: 'AI Insights',
    kind: 'Personalization + rollout',
    where: 'Insights page (server)',
    evaluatedOn: 'server',
    defaults: { model: 'lumen-lite', max_insights: 3 },
  },
  smart_recommendations: {
    name: 'Smart recommendations',
    kind: 'Server-side A/B test',
    where: 'Insights page (server)',
    evaluatedOn: 'server',
    defaults: { algorithm: 'popular' },
  },
};

export const EVENTS = [
  'signup_completed',
  'pricing_cta_clicked',
  'checkout_started',
  'plan_upgraded',
  'project_created',
  'report_exported',
  'team_invite_sent',
  'onboarding_step_completed',
  'insight_viewed',
];
