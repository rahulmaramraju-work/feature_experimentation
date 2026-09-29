import * as db from './lib/db.js';
import { hashPassword, checkPassword, sessionCookie, clearCookie, currentUser, publicUser } from './lib/auth.js';
import { ensureDemoAccount, resetAllDemoAccounts } from './lib/seed.js';
import { workspaceAnalytics } from './lib/analytics.js';
import { PLANS, planRank } from '../../shared/plans.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../shared/demoAccounts.js';

export const config = { path: '/api/*' };

// ---------- helpers ----------
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...headers } });
const fail = (status, error) => json({ error }, status);
const body = async (req) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};
const clean = (s, max = 120) => String(s ?? '').trim().slice(0, max);

async function logActivity(userId, type, text) {
  const items = await db.get(`activity/${userId}`, []);
  items.unshift({ id: db.newId('act'), type, text, at: new Date().toISOString() });
  await db.set(`activity/${userId}`, items.slice(0, 50));
}

// ---------- route handlers ----------
const routes = [];
const route = (method, pattern, handler, { auth = true } = {}) => {
  const keys = [];
  const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
  routes.push({ method, regex, keys, handler, auth });
};

// Deployment health: which required variables are present (names only, never values).
route(
  'GET',
  '/health',
  async () => {
    const names = ['JWT_SECRET'];
    let database = 'ok';
    try {
      await db.set('health/ping', { at: new Date().toISOString() });
      await db.get('health/ping');
    } catch (err) {
      database = `error: ${err.message}`;
    }
    return json({
      ok: names.every((n) => !!process.env[n]) && database === 'ok',
      database,
      env: Object.fromEntries(names.map((n) => [n, !!process.env[n]])),
    });
  },
  { auth: false },
);

// Public config: demo accounts shown on the login page.
route(
  'GET',
  '/config',
  () =>
    json({
      demoAccounts: DEMO_ACCOUNTS.map(({ email, name, title, company, plan, persona, role }) => ({ email, name, title, company, plan, persona, role })),
      demoPassword: DEMO_PASSWORD,
    }),
  { auth: false },
);

route(
  'POST',
  '/auth/signup',
  async (req) => {
    const b = await body(req);
    const email = clean(b.email).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(400, 'Enter a valid work email.');
    if (String(b.password || '').length < 8) return fail(400, 'Password must be at least 8 characters.');
    if (!clean(b.name)) return fail(400, 'Tell us your name.');
    if (await db.get(`email/${email}`)) return fail(409, 'An account with this email already exists.');
    const user = {
      id: db.newId('usr'),
      email,
      name: clean(b.name),
      title: clean(b.title) || 'Member',
      company: clean(b.company) || 'My company',
      companySize: Number(b.companySize) || 1,
      country: clean(b.country, 2).toUpperCase() || 'US',
      plan: 'free',
      role: 'owner',
      createdAt: new Date().toISOString(),
      passwordHash: await hashPassword(String(b.password)),
    };
    await db.set(`users/${user.id}`, user);
    await db.set(`email/${email}`, user.id);
    await db.set(`projects/${user.id}`, []);
    await db.set(`team/${user.id}`, []);
    await db.set(`billing/${user.id}`, []);
    await logActivity(user.id, 'account', 'Workspace created');
    return json({ user: publicUser(user) }, 201, { 'set-cookie': await sessionCookie(user.id, req) });
  },
  { auth: false },
);

route(
  'POST',
  '/auth/login',
  async (req) => {
    const b = await body(req);
    const email = clean(b.email).toLowerCase();
    let id = await db.get(`email/${email}`);
    if (!id && DEMO_ACCOUNTS.some((a) => a.email === email)) id = (await ensureDemoAccount(email)).id;
    const user = id && (await db.get(`users/${id}`));
    if (!user || !(await checkPassword(String(b.password || ''), user.passwordHash))) return fail(401, 'Incorrect email or password.');
    await logActivity(user.id, 'auth', 'Signed in');
    return json({ user: publicUser(user) }, 200, { 'set-cookie': await sessionCookie(user.id, req) });
  },
  { auth: false },
);

route(
  'POST',
  '/auth/demo',
  async (req) => {
    const { email } = await body(req);
    const user = await ensureDemoAccount(email);
    if (!user) return fail(404, 'Unknown demo account.');
    await logActivity(user.id, 'auth', 'Signed in (demo)');
    return json({ user: publicUser(user) }, 200, { 'set-cookie': await sessionCookie(user.id, req) });
  },
  { auth: false },
);

route('POST', '/auth/logout', () => json({ ok: true }, 200, { 'set-cookie': clearCookie() }), { auth: false });

route('GET', '/me', (req, { user }) => json({ user: publicUser(user) }));

route('PATCH', '/me', async (req, { user }) => {
  const b = await body(req);
  for (const k of ['name', 'title', 'company']) if (b[k] !== undefined) user[k] = clean(b[k]) || user[k];
  if (b.country) user.country = clean(b.country, 2).toUpperCase();
  if (b.companySize) user.companySize = Math.max(1, Number(b.companySize) || user.companySize);
  await db.set(`users/${user.id}`, user);
  await logActivity(user.id, 'settings', 'Updated profile');
  return json({ user: publicUser(user) });
});

// Projects
route('GET', '/projects', async (req, { user }) => json({ projects: await db.get(`projects/${user.id}`, []) }));

route('POST', '/projects', async (req, { user }) => {
  const b = await body(req);
  const projects = await db.get(`projects/${user.id}`, []);
  const limit = PLANS[user.plan].limits.projects;
  if (projects.length >= limit) return fail(402, `Your ${PLANS[user.plan].name} plan includes ${limit} projects. Upgrade to add more.`);
  const name = clean(b.name, 60);
  if (!name) return fail(400, 'Project name is required.');
  const project = { id: db.newId('prj'), name, platform: clean(b.platform, 20) || 'Web', status: 'active', createdAt: new Date().toISOString() };
  projects.push(project);
  await db.set(`projects/${user.id}`, projects);
  await logActivity(user.id, 'project', `Created project "${name}"`);
  return json({ project }, 201);
});

route('PATCH', '/projects/:id', async (req, { user, params }) => {
  const b = await body(req);
  const projects = await db.get(`projects/${user.id}`, []);
  const p = projects.find((x) => x.id === params.id);
  if (!p) return fail(404, 'Project not found.');
  if (b.name) p.name = clean(b.name, 60);
  if (b.status) p.status = b.status === 'paused' ? 'paused' : 'active';
  await db.set(`projects/${user.id}`, projects);
  return json({ project: p });
});

route('DELETE', '/projects/:id', async (req, { user, params }) => {
  const projects = await db.get(`projects/${user.id}`, []);
  const p = projects.find((x) => x.id === params.id);
  await db.set(`projects/${user.id}`, projects.filter((x) => x.id !== params.id));
  if (p) await logActivity(user.id, 'project', `Deleted project "${p.name}"`);
  return json({ ok: true });
});

// Dashboard analytics
route('GET', '/dashboard', async (req, { user }) => {
  const projects = await db.get(`projects/${user.id}`, []);
  const activity = await db.get(`activity/${user.id}`, []);
  return json({ ...workspaceAnalytics(user, projects), activity: activity.slice(0, 8), projectCount: projects.length });
});

// AI insights (Pro and Enterprise) and recommended next steps.
route('GET', '/insights', async (req, { user }) => {
  const data = workspaceAnalytics(user, await db.get(`projects/${user.id}`, []));
  const [users, sessions, conv, revenue] = data.kpis;
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const all = [
    { title: `Active users ${users.change >= 0 ? 'up' : 'down'} ${Math.abs(users.change).toFixed(1)}% week over week`, body: `${fmt(users.value)} active users in the last 7 days. The lift is concentrated in Organic search traffic.`, impact: 'high' },
    { title: `Conversion rate is ${conv.value.toFixed(2)}%`, body: `Your largest drop-off is between "Signed up" and "Activated". Improving activation by 10% would add ~${fmt(data.funnel[2].value * 0.1)} activated users/week.`, impact: 'high' },
    { title: `/pricing is your most-viewed page`, body: `${fmt(data.pages[0].views)} views with ${data.pages[0].bounce.toFixed(0)}% bounce. Consider testing the headline and plan highlight.`, impact: 'medium' },
    { title: `Revenue trending ${revenue.change >= 0 ? 'up' : 'down'}`, body: `Estimated $${fmt(revenue.value)} this week at an average order value of $${data.aov.toFixed(2)}.`, impact: 'medium' },
    { title: 'Weekend traffic dips ~28%', body: 'Schedule campaigns for Thursday–Friday to capture peak intent.', impact: 'low' },
    { title: `Sessions per user: ${(sessions.value / users.value).toFixed(2)}`, body: 'Engagement is healthy. Returning users are 2.1× more likely to convert.', impact: 'low' },
  ];
  const insights = planRank(user.plan) >= planRank('pro') ? all.slice(0, user.plan === 'enterprise' ? 6 : 3) : [];

  const recommendations =
    user.plan !== 'free'
      ? [
          { title: `Build an activation funnel for ${user.company}`, reason: 'Based on your drop-off between sign-up and activation' },
          { title: 'Set up a retention cohort by plan', reason: `Teams of ~${user.companySize} people usually start here` },
          { title: `Add a ${user.country} regional dashboard`, reason: `Most of your traffic comes from ${user.country}` },
        ]
      : [
          { title: 'Create a conversion funnel', reason: 'Most popular template this week' },
          { title: 'Connect Google Analytics', reason: 'Used by 72% of workspaces' },
          { title: 'Invite your team', reason: 'Teams with 3+ members see 2× more value' },
        ];

  return json({ insights, recommendations, model: user.plan === 'enterprise' ? 'lumen-pro' : 'lumen-lite' });
});

// Team
route('GET', '/team', async (req, { user }) => json({ members: await db.get(`team/${user.id}`, []) }));

route('POST', '/team', async (req, { user }) => {
  const b = await body(req);
  const members = await db.get(`team/${user.id}`, []);
  const limit = PLANS[user.plan].limits.seats;
  if (members.length + 1 >= limit) return fail(402, `Your ${PLANS[user.plan].name} plan includes ${limit} seats. Upgrade to invite more.`);
  const email = clean(b.email).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(400, 'Enter a valid email.');
  const member = { id: db.newId('mbr'), name: email.split('@')[0], email, role: clean(b.role, 20) || 'Member', status: 'invited' };
  members.push(member);
  await db.set(`team/${user.id}`, members);
  await logActivity(user.id, 'team', `Invited ${email}`);
  return json({ member }, 201);
});

route('DELETE', '/team/:id', async (req, { user, params }) => {
  const members = await db.get(`team/${user.id}`, []);
  await db.set(`team/${user.id}`, members.filter((m) => m.id !== params.id));
  return json({ ok: true });
});

// Billing (simulated checkout, no real payment)
route('GET', '/billing', async (req, { user }) => json({ plan: user.plan, invoices: await db.get(`billing/${user.id}`, []) }));

route('POST', '/billing/checkout', async (req, { user }) => {
  const b = await body(req);
  const plan = PLANS[b.plan];
  if (!plan) return fail(400, 'Unknown plan.');
  const interval = b.interval === 'annual' ? 'annual' : 'monthly';
  const previous = user.plan;
  user.plan = plan.id;
  await db.set(`users/${user.id}`, user);
  const invoices = await db.get(`billing/${user.id}`, []);
  if (plan.id !== 'free') {
    const amount = interval === 'annual' ? plan.annual * 12 : plan.monthly;
    invoices.unshift({ id: db.newId('inv'), date: new Date().toISOString(), plan: plan.id, interval, amount, status: 'paid' });
    await db.set(`billing/${user.id}`, invoices);
  }
  await logActivity(user.id, 'billing', `Changed plan from ${PLANS[previous].name} to ${plan.name}`);
  return json({ user: publicUser(user), invoices });
});

// Activity
route('GET', '/activity', async (req, { user }) => json({ activity: await db.get(`activity/${user.id}`, []) }));

// Admin: see every account and change plans live (great for targeting demos).
route('GET', '/admin/users', async (req, { user }) => {
  if (user.role !== 'admin') return fail(403, 'Admins only.');
  const keys = await db.list('users/');
  const users = (await Promise.all(keys.map((k) => db.get(k)))).filter(Boolean).map(publicUser);
  users.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return json({ users });
});

route('PATCH', '/admin/users/:id', async (req, { user, params }) => {
  if (user.role !== 'admin') return fail(403, 'Admins only.');
  const b = await body(req);
  const target = await db.get(`users/${params.id}`);
  if (!target) return fail(404, 'User not found.');
  if (b.plan && PLANS[b.plan]) target.plan = b.plan;
  if (b.country) target.country = clean(b.country, 2).toUpperCase();
  await db.set(`users/${target.id}`, target);
  await logActivity(target.id, 'billing', `Plan set to ${PLANS[target.plan].name} by an admin`);
  return json({ user: publicUser(target) });
});

route('POST', '/admin/reset-demo', async (req, { user }) => {
  if (user.role !== 'admin') return fail(403, 'Admins only.');
  const users = await resetAllDemoAccounts();
  return json({ reset: users.length });
});

// ---------- dispatcher ----------
export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, '') || '/';
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = path.match(r.regex);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    try {
      const user = await currentUser(req);
      if (r.auth && !user) return fail(401, 'Please sign in.');
      return await r.handler(req, { user, params });
    } catch (err) {
      console.error(err);
      return fail(500, 'Something went wrong. Please try again.');
    }
  }
  return fail(404, 'Not found');
};
