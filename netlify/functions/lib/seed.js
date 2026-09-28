import * as db from './db.js';
import { hashPassword } from './auth.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../../shared/demoAccounts.js';
import { PLANS } from '../../../shared/plans.js';

const DAY = 86_400_000;

export const demoUserId = (email) => `usr_demo_${email.split('@')[0].replace(/[^a-z0-9]/gi, '')}`;

const SAMPLE_PROJECTS = [
  { name: 'Marketing site', platform: 'Web' },
  { name: 'iOS app', platform: 'iOS' },
  { name: 'Checkout service', platform: 'Server' },
  { name: 'Android app', platform: 'Android' },
  { name: 'Partner portal', platform: 'Web' },
];

const SAMPLE_TEAM = [
  { name: 'Priya Nair', email: 'priya', role: 'Analyst' },
  { name: 'Tom Becker', email: 'tom', role: 'Engineer' },
  { name: 'Lena Ortiz', email: 'lena', role: 'Designer' },
];

// Creates (or resets) a demo account and its workspace data.
export async function seedDemoAccount(acct) {
  const id = demoUserId(acct.email);
  const createdAt = new Date(Date.now() - acct.signupDaysAgo * DAY).toISOString();
  const user = {
    id,
    email: acct.email,
    name: acct.name,
    title: acct.title,
    company: acct.company,
    companySize: acct.companySize,
    country: acct.country,
    plan: acct.plan,
    role: acct.role,
    isDemo: true,
    createdAt,
    passwordHash: await hashPassword(DEMO_PASSWORD),
  };
  await db.set(`users/${id}`, user);
  await db.set(`email/${acct.email}`, id);

  const projectCount = Math.min(PLANS[acct.plan].limits.projects, acct.plan === 'free' ? 2 : 5);
  await db.set(
    `projects/${id}`,
    SAMPLE_PROJECTS.slice(0, projectCount).map((p, i) => ({
      id: `prj_${id.slice(-6)}_${i}`,
      ...p,
      status: 'active',
      createdAt: new Date(Date.now() - (acct.signupDaysAgo - i) * DAY).toISOString(),
    })),
  );

  const domain = acct.email.split('@')[1];
  const teamCount = acct.plan === 'free' ? 1 : 3;
  await db.set(
    `team/${id}`,
    SAMPLE_TEAM.slice(0, teamCount).map((m, i) => ({
      id: `mbr_${id.slice(-6)}_${i}`,
      name: m.name,
      email: `${m.email}@${domain}`,
      role: m.role,
      status: 'active',
    })),
  );

  const invoices = [];
  if (acct.plan !== 'free') {
    for (let m = 0; m < 4; m++) {
      invoices.push({
        id: `inv_${id.slice(-6)}_${m}`,
        date: new Date(Date.now() - m * 30 * DAY).toISOString(),
        plan: acct.plan,
        amount: PLANS[acct.plan].monthly,
        status: 'paid',
      });
    }
  }
  await db.set(`billing/${id}`, invoices);
  await db.set(`activity/${id}`, [
    { id: db.newId('act'), type: 'account', text: 'Workspace created', at: createdAt },
  ]);
  return user;
}

export async function ensureDemoAccount(email) {
  const acct = DEMO_ACCOUNTS.find((a) => a.email === email);
  if (!acct) return null;
  const existing = await db.get(`users/${demoUserId(email)}`);
  return existing || seedDemoAccount(acct);
}

export async function resetAllDemoAccounts() {
  return Promise.all(DEMO_ACCOUNTS.map(seedDemoAccount));
}
