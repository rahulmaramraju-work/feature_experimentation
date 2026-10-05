// Seeded demo customers, each with a different plan, country and company size.
// Their password is not stored in code: password sign-in uses the DEMO_PASSWORD
// environment variable, and the one-click buttons on /login need no password.

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
