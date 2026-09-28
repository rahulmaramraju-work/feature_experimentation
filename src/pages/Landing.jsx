import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ArrowRight, BarChart3, BellRing, Bot, Filter, GitBranch, Lock, Sparkles, Users, Zap } from 'lucide-react';
import { Button } from '../components/ui';
import PricingTable from '../components/PricingTable';
import { useAuth } from '../lib/auth';

const hero = Array.from({ length: 24 }, (_, i) => ({ v: 40 + i * 3 + Math.sin(i / 2) * 12 + (i % 5) * 2 }));

const FEATURES = [
  { icon: BarChart3, title: 'Real-time dashboards', body: 'Every KPI your team cares about, updated the second it happens.' },
  { icon: Filter, title: 'Funnels & retention', body: 'Find exactly where users drop off and which cohorts come back.' },
  { icon: Sparkles, title: 'AI Insights', body: 'Lumen reads your data and tells you what changed, and why it matters.' },
  { icon: Users, title: 'Built for teams', body: 'Shared workspaces, roles and permissions for every function.' },
  { icon: BellRing, title: 'Smart alerts', body: 'Get notified in Slack when metrics break from their normal range.' },
  { icon: Lock, title: 'Enterprise security', body: 'SSO, audit logs, data residency and SOC 2 Type II.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const onSelect = (plan) => navigate(user ? '/app/billing' : `/signup?plan=${plan}`);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <a href="#how" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">NEW</span>
              AI Insights is now generally available <ArrowRight className="size-3" />
            </a>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              Know what your users do. <span className="text-brand">Ship what they need.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Lumen is the product analytics platform for modern teams: dashboards, funnels and AI-powered insights in one place.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button size="lg" to="/signup">
                Start free <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="secondary" to="/login">
                Try a live demo account
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-500">Free forever plan · No credit card required</p>
          </div>

          {/* Product preview */}
          <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6">
              <div className="grid gap-4 sm:grid-cols-4">
                {[
                  ['Active users', '48.2k', '+12.4%'],
                  ['Sessions', '91.7k', '+8.1%'],
                  ['Conversion', '3.42%', '+0.6pt'],
                  ['Revenue', '$184k', '+15.2%'],
                ].map(([l, v, c]) => (
                  <div key={l} className="card p-4">
                    <p className="text-xs text-slate-500">{l}</p>
                    <p className="mt-1 text-2xl font-semibold">{v}</p>
                    <p className="text-xs font-medium text-emerald-600">{c}</p>
                  </div>
                ))}
              </div>
              <div className="card mt-4 h-56 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hero}>
                    <defs>
                      <linearGradient id="heroFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="var(--brand)" strokeWidth={2.5} fill="url(#heroFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section id="customers" className="border-y border-slate-100 bg-slate-50/60 py-10">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Trusted by product teams at</p>
        <div className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-4 text-xl font-bold text-slate-300">
          {['Northwind', 'Globex', 'Acme Retail', 'Initech', 'Umbrella', 'Hooli'].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-brand">Everything in one place</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Analytics your whole team will actually use</h2>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="grid size-10 place-items-center rounded-lg bg-brand-soft text-brand">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-slate-900 py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-indigo-300">Ship safely</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Every feature here is behind a feature flag</h2>
            <p className="mt-4 text-slate-300">
              This site is a live demo of Wingify Feature Experimentation. Banners, pricing, dashboards and AI features are all controlled remotely:
              rolled out gradually, A/B tested, personalised per customer and switched off instantly.
            </p>
            <p className="mt-4 text-slate-300">Open the <strong className="text-white">FE Control Tower</strong> (bottom right) to watch every decision in real time.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [Zap, 'Kill switches', 'Turn any feature off in seconds, no deploy.'],
              [GitBranch, 'Progressive rollouts', 'Release to 5%, 25%, 100% of users.'],
              [BarChart3, 'A/B experiments', 'Test pricing and checkout on real conversions.'],
              [Bot, 'Server-side decisions', 'AI and recommendation logic flagged on the backend.'],
            ].map(([Icon, t, b]) => (
              <div key={t} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <Icon className="size-5 text-indigo-300" />
                <h3 className="mt-3 font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-slate-400">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <PricingTable onSelect={onSelect} />
      </section>

      {/* CTA */}
      <section className="mx-auto mb-24 max-w-5xl px-4 sm:px-6">
        <div className="rounded-3xl bg-brand px-8 py-14 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold tracking-tight">Start understanding your users today</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">Set up in five minutes. Free for small teams, forever.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" variant="secondary" to="/signup">
              Create free account
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
