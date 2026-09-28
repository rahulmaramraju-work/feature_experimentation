import { useState } from 'react';
import { Download, FileBarChart, FileText, Lock } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { useFeature } from '../../fe/useFeature';
import { useFe } from '../../fe/FeProvider';
import { Badge, Button, Card, CardHeader, PageHeader } from '../../components/ui';

const REPORTS = [
  { id: 'weekly', name: 'Weekly traffic summary', desc: 'Users, sessions and conversions by day', schedule: 'Every Monday' },
  { id: 'funnel', name: 'Signup → activation funnel', desc: 'Step-by-step conversion with drop-off', schedule: 'Daily' },
  { id: 'channels', name: 'Acquisition by channel', desc: 'New users split by source', schedule: 'Monthly' },
  { id: 'pages', name: 'Top content', desc: 'Most viewed pages and bounce rates', schedule: 'Weekly' },
];

function toCsv(rows) {
  const head = Object.keys(rows[0]);
  return [head.join(','), ...rows.map((r) => head.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
}

export default function Reports() {
  const { user } = useAuth();
  const csv = useFeature('csv_export');
  const { track } = useFe();
  const [busy, setBusy] = useState(null);

  const exportReport = async (report) => {
    setBusy(report.id);
    try {
      const d = await api('/dashboard');
      const rows = { weekly: d.series, funnel: d.funnel, channels: d.channels, pages: d.pages.map((p) => ({ ...p, bounce: p.bounce.toFixed(1) })) }[report.id];
      const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: `lumen-${report.id}-${new Date().toISOString().slice(0, 10)}.csv` });
      a.click();
      URL.revokeObjectURL(url);
      track('report_exported', { report: report.id, format: 'csv' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Reports" description="Scheduled reports for your workspace." />
      {!csv.enabled && (
        <Card className="mb-6 flex items-center gap-4 px-5 py-4">
          <div className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-500">
            <Lock className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">CSV export is in private beta</p>
            <p className="text-sm text-slate-500">We’re rolling it out gradually. {user.plan !== 'enterprise' && 'Enterprise workspaces get access first.'}</p>
          </div>
          <Badge color="amber">Beta</Badge>
        </Card>
      )}
      <Card>
        <CardHeader title="Saved reports" description={`${REPORTS.length} reports`} />
        <ul className="divide-y divide-slate-100">
          {REPORTS.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="grid size-10 place-items-center rounded-lg bg-brand-soft text-brand">{r.id === 'weekly' ? <FileBarChart className="size-5" /> : <FileText className="size-5" />}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-sm text-slate-500">{r.desc}</p>
              </div>
              <Badge>{r.schedule}</Badge>
              {csv.enabled ? (
                <Button size="sm" variant="secondary" loading={busy === r.id} onClick={() => exportReport(r)}>
                  <Download className="size-4" /> Export CSV
                </Button>
              ) : (
                <Button size="sm" variant="secondary" disabled title="CSV export is in beta">
                  <Lock className="size-3.5" /> Export
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
