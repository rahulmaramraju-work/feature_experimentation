import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Circle, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useApi } from '../../lib/useApi';
import { useFeature } from '../../fe/useFeature';
import { useFe } from '../../fe/FeProvider';
import { Badge, Button, Card, CardHeader, PageHeader, Spinner, fmtCompact, fmtNumber, timeAgo } from '../../components/ui';

function formatKpi(k) {
  if (k.format === 'percent') return `${k.value.toFixed(2)}%`;
  if (k.format === 'currency') return `$${fmtCompact(k.value)}`;
  return fmtCompact(k.value);
}

function Kpi({ k }) {
  const up = k.change >= 0;
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{k.label}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-2xl font-semibold tracking-tight">{formatKpi(k)}</p>
        <span className={clsx('flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold', up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
          {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {Math.abs(k.change).toFixed(1)}%
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400">vs. previous 7 days</p>
    </Card>
  );
}

// Simple linear forecast used by dashboard_v2's show_forecast variable.
function withForecast(series) {
  const n = series.length;
  const xs = series.map((_, i) => i);
  const ys = series.map((s) => s.users);
  const mx = xs.reduce((a, b) => a + b) / n;
  const my = ys.reduce((a, b) => a + b) / n;
  const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const out = series.map((s) => ({ ...s, forecast: null }));
  out[n - 1].forecast = out[n - 1].users;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(series[n - 1].date);
    d.setDate(d.getDate() + i);
    out.push({ date: d.toISOString().slice(0, 10), forecast: Math.round(my + slope * (n - 1 + i - mx)) });
  }
  return out;
}

function TrafficChart({ series, forecast }) {
  const data = useMemo(() => (forecast ? withForecast(series) : series), [series, forecast]);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="usersFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => fmtNumber(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Area type="monotone" dataKey="users" name="Active users" stroke="var(--brand)" strokeWidth={2} fill="url(#usersFill)" />
        <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#94a3b8" strokeWidth={1.5} fill="transparent" />
        {forecast && <Line type="monotone" dataKey="forecast" name="Forecast" stroke="var(--brand)" strokeDasharray="5 5" strokeWidth={2} dot={false} />}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function Funnel({ funnel }) {
  const top = funnel[0].value;
  return (
    <div className="space-y-4 p-5">
      {funnel.map((f, i) => (
        <div key={f.step}>
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-medium text-slate-700">{f.step}</span>
            <span className="text-slate-500">
              {fmtNumber(f.value)} <span className="text-slate-400">({((f.value / top) * 100).toFixed(1)}%)</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(f.value / top) * 100}%`, opacity: 1 - i * 0.18 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const CHANNEL_COLORS = ['var(--brand)', '#0ea5e9', '#f59e0b', '#10b981', '#a855f7'];

function Channels({ channels }) {
  return (
    <div className="h-56 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={channels} layout="vertical" margin={{ left: 24, right: 16 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} width={96} />
          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
            {channels.map((c, i) => (
              <Cell key={c.name} fill={CHANNEL_COLORS[i % 5]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopPages({ pages }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
          <th className="px-5 py-2 font-medium">Page</th>
          <th className="px-5 py-2 text-right font-medium">Views</th>
          <th className="px-5 py-2 text-right font-medium">Bounce</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {pages.map((p) => (
          <tr key={p.path}>
            <td className="px-5 py-2.5 font-mono text-[13px] text-slate-700">{p.path}</td>
            <td className="px-5 py-2.5 text-right">{fmtNumber(p.views)}</td>
            <td className="px-5 py-2.5 text-right text-slate-500">{p.bounce.toFixed(0)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Activity({ items }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
          <span className="text-slate-700">{a.text}</span>
          <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.at)}</span>
        </li>
      ))}
    </ul>
  );
}

const STEPS = [
  { id: 'project', label: 'Create your first project', to: '/app/projects' },
  { id: 'team', label: 'Invite a teammate', to: '/app/team' },
  { id: 'insights', label: 'Explore AI Insights', to: '/app/insights' },
  { id: 'report', label: 'Export a report', to: '/app/reports' },
];

// onboarding_checklist: shown to new users; the variant decides compact vs guided layout.
function Onboarding() {
  const flag = useFeature('onboarding_checklist');
  const { track } = useFe();
  const [done, setDone] = useState([]);
  if (!flag.enabled) return null;
  const variant = flag.get('variant');
  const complete = (s) => {
    if (done.includes(s.id)) return;
    setDone((d) => [...d, s.id]);
    track('onboarding_step_completed', { step: s.id, variant });
  };
  const pct = (done.length / STEPS.length) * 100;

  if (variant === 'guided') {
    return (
      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-brand to-brand-dark px-6 py-5 text-white">
          <div>
            <p className="text-sm font-medium text-white/80">Getting started</p>
            <h2 className="text-lg font-semibold">Let’s set up your workspace in 4 steps</h2>
          </div>
          <div className="w-48">
            <div className="h-2 rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-right text-xs text-white/80">{done.length} of 4 complete</p>
          </div>
        </div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <Link key={s.id} to={s.to} onClick={() => complete(s)} className="bg-white p-5 transition hover:bg-slate-50">
              <span className="text-xs font-semibold text-brand">STEP {i + 1}</span>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                {done.includes(s.id) ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4 text-slate-300" />}
                {s.label}
              </p>
            </Link>
          ))}
        </div>
      </Card>
    );
  }
  return (
    <Card className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
      <p className="text-sm font-semibold">Finish setting up</p>
      {STEPS.map((s) => (
        <Link key={s.id} to={s.to} onClick={() => complete(s)} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          {done.includes(s.id) ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4 text-slate-300" />}
          {s.label}
        </Link>
      ))}
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading } = useApi('/dashboard', [user.plan]);
  const v2 = useFeature('dashboard_v2');
  const layout = v2.enabled ? v2.get('layout') : 'classic';
  const forecast = v2.enabled && v2.get('show_forecast');

  if (loading && !data)
    return (
      <div className="grid h-96 place-items-center">
        <Spinner className="size-7" />
      </div>
    );

  const trafficCard = (
    <Card>
      <CardHeader
        title="Traffic overview"
        description="Active users and sessions, last 30 days"
        action={forecast && <Badge color="brand"><TrendingUp className="size-3" /> 7-day forecast</Badge>}
      />
      <div className="p-3">
        <TrafficChart series={data.series} forecast={forecast} />
      </div>
    </Card>
  );

  const insightStrip = (
    <Card className="flex flex-wrap items-center gap-4 border-brand-ring bg-brand-soft/60 px-5 py-4">
      <div className="grid size-10 place-items-center rounded-lg bg-brand text-white">
        <Sparkles className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Your conversion rate moved {data.kpis[2].change >= 0 ? 'up' : 'down'} {Math.abs(data.kpis[2].change).toFixed(1)}% this week</p>
        <p className="text-sm text-slate-600">Biggest drop-off: Signed up → Activated. See AI recommendations to fix it.</p>
      </div>
      <Button to="/app/insights" size="sm">
        View insights
      </Button>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user.name.split(' ')[0]}`}
        description={`Here’s what’s happening across ${data.projectCount} project${data.projectCount === 1 ? '' : 's'} at ${user.company}.`}
        actions={v2.enabled && <Badge color="brand">Dashboard v2</Badge>}
      />
      <Onboarding />
      {layout === 'insights_first' ? (
        <div className="space-y-6">
          {insightStrip}
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">{trafficCard}</div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              {data.kpis.slice(0, 2).map((k) => (
                <Kpi key={k.key} k={k} />
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.kpis.slice(2).map((k) => (
              <Kpi key={k.key} k={k} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.kpis.map((k) => (
              <Kpi key={k.key} k={k} />
            ))}
          </div>
          {trafficCard}
        </div>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Conversion funnel" description="Last 7 days" />
          <Funnel funnel={data.funnel} />
        </Card>
        <Card>
          <CardHeader title="Acquisition channels" description="Share of new users" />
          <Channels channels={data.channels} />
        </Card>
        <Card>
          <CardHeader title="Recent activity" />
          <Activity items={data.activity} />
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader title="Top pages" description="Most viewed pages in the last 7 days" />
        <TopPages pages={data.pages} />
      </Card>
    </div>
  );
}
