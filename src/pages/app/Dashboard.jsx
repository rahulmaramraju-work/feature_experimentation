import clsx from 'clsx';
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useApi } from '../../lib/useApi';
import { Card, CardHeader, PageHeader, Spinner, fmtCompact, fmtNumber, timeAgo } from '../../components/ui';

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

function TrafficChart({ series }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={series} margin={{ left: -12, right: 8, top: 8 }}>
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

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading } = useApi('/dashboard', [user.plan]);

  if (loading && !data)
    return (
      <div className="grid h-96 place-items-center">
        <Spinner className="size-7" />
      </div>
    );

  const trafficCard = (
    <Card>
      <CardHeader title="Traffic overview" description="Active users and sessions, last 30 days" />
      <div className="p-3">
        <TrafficChart series={data.series} />
      </div>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user.name.split(' ')[0]}`}
        description={`Here’s what’s happening across ${data.projectCount} project${data.projectCount === 1 ? '' : 's'} at ${user.company}.`}
      />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.kpis.map((k) => (
            <Kpi key={k.key} k={k} />
          ))}
        </div>
        {trafficCard}
      </div>
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
