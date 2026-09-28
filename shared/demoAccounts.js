// Seeded demo customers. Each one exercises a different targeting path in Wingify FE.
// Shared test password for every demo account (demo data only, not a real credential).
export const DEMO_PASSWORD = 'lumen-demo-2026';

export const DEMO_ACCOUNTS = [
  {
    email: 'maya@northwind.io',
    name: 'Maya Chen',
    title: 'Founder',
    company: 'Northwind Labs',
    companySize: 8,
    country: 'US',
    plan: 'free',
    role: 'owner',
    signupDaysAgo: 3,
    persona: 'New free-tier founder',
  },
  {
    email: 'arjun@acmeretail.in',
    name: 'Arjun Mehta',
    title: 'Head of Growth',
    company: 'Acme Retail',
    companySize: 140,
    country: 'IN',
    plan: 'pro',
    role: 'owner',
    signupDaysAgo: 210,
    persona: 'Pro customer in India',
  },
  {
    email: 'sofia@globex.com',
    name: 'Sofia Rossi',
    title: 'VP Product',
    company: 'Globex Corporation',
    companySize: 2400,
    country: 'IT',
    plan: 'enterprise',
    role: 'owner',
    signupDaysAgo: 640,
    persona: 'Enterprise buyer in the EU',
  },
  {
    email: 'admin@lumen.dev',
    name: 'Lumen Admin',
    title: 'Internal QA',
    company: 'Lumen (internal)',
    companySize: 60,
    country: 'US',
    plan: 'enterprise',
    role: 'admin',
    signupDaysAgo: 900,
    persona: 'Internal staff / beta tester',
  },
];
