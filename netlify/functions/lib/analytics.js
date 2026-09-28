// Deterministic, realistic-looking analytics for a workspace.
// Seeded by user id so numbers stay stable between refreshes, and scaled by plan.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCALE = { free: 1, pro: 14, enterprise: 90 };

export function workspaceAnalytics(user, projects) {
  const rand = rng(hash(user.id));
  const scale = SCALE[user.plan] * Math.max(1, projects.length);
  const days = 30;
  const series = [];
  let base = 180 * scale * (0.8 + rand() * 0.4);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const weekend = [0, 6].includes(d.getDay()) ? 0.72 : 1;
    base *= 1 + (rand() - 0.42) * 0.06;
    const users = Math.round(base * weekend);
    const sessions = Math.round(users * (1.4 + rand() * 0.5));
    const conversions = Math.round(users * (0.021 + rand() * 0.012));
    series.push({ date: d.toISOString().slice(0, 10), users, sessions, conversions });
  }

  const sum = (k, arr) => arr.reduce((s, r) => s + r[k], 0);
  const last7 = series.slice(-7);
  const prev7 = series.slice(-14, -7);
  const pct = (a, b) => (b ? ((a - b) / b) * 100 : 0);
  const aov = 38 + rand() * 40;

  const kpis = [
    { key: 'users', label: 'Active users', value: sum('users', last7), change: pct(sum('users', last7), sum('users', prev7)) },
    { key: 'sessions', label: 'Sessions', value: sum('sessions', last7), change: pct(sum('sessions', last7), sum('sessions', prev7)) },
    {
      key: 'conversion',
      label: 'Conversion rate',
      value: (sum('conversions', last7) / sum('users', last7)) * 100,
      change: pct(sum('conversions', last7) / sum('users', last7), sum('conversions', prev7) / sum('users', prev7)),
      format: 'percent',
    },
    { key: 'revenue', label: 'Revenue', value: sum('conversions', last7) * aov, change: pct(sum('conversions', last7), sum('conversions', prev7)), format: 'currency' },
  ];

  const top = sum('users', last7);
  const funnel = [
    { step: 'Visited', value: top },
    { step: 'Signed up', value: Math.round(top * (0.32 + rand() * 0.08)) },
    { step: 'Activated', value: Math.round(top * (0.17 + rand() * 0.05)) },
    { step: 'Converted', value: sum('conversions', last7) },
  ];

  const channels = ['Organic search', 'Direct', 'Paid social', 'Referral', 'Email'].map((name) => ({ name, value: Math.round(rand() * 100) + 10 }));
  const pages = ['/pricing', '/features', '/blog/launch', '/docs/quickstart', '/signup', '/integrations'].map((path) => ({
    path,
    views: Math.round(top * (0.2 + rand())),
    bounce: 20 + rand() * 50,
  }));
  pages.sort((a, b) => b.views - a.views);

  return { kpis, series, funnel, channels, pages, aov };
}
