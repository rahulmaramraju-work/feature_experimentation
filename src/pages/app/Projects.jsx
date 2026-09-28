import { useState } from 'react';
import { FolderKanban, Globe, Pause, Play, Plus, Server, Smartphone, Trash2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useApi } from '../../lib/useApi';
import { api } from '../../lib/api';
import { useFe } from '../../fe/FeProvider';
import { PLANS } from '../../../shared/plans';
import { Alert, Badge, Button, Card, EmptyState, Modal, PageHeader, Spinner, fmtDate } from '../../components/ui';

const PLATFORM_ICON = { Web: Globe, iOS: Smartphone, Android: Smartphone, Server };

export default function Projects() {
  const { user } = useAuth();
  const { track } = useFe();
  const { data, setData, loading } = useApi('/projects');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', platform: 'Web' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const limit = PLANS[user.plan].limits.projects;
  const projects = data?.projects || [];
  const atLimit = projects.length >= limit;

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { project } = await api('/projects', { method: 'POST', body: form });
      setData({ projects: [...projects, project] });
      track('project_created', { platform: project.platform, total: projects.length + 1 });
      setOpen(false);
      setForm({ name: '', platform: 'Web' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (p) => {
    const { project } = await api(`/projects/${p.id}`, { method: 'PATCH', body: { status: p.status === 'active' ? 'paused' : 'active' } });
    setData({ projects: projects.map((x) => (x.id === p.id ? project : x)) });
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"? This removes its data from the workspace.`)) return;
    await api(`/projects/${p.id}`, { method: 'DELETE' });
    setData({ projects: projects.filter((x) => x.id !== p.id) });
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description={`Each project tracks one app, site or service. ${Number.isFinite(limit) ? `${projects.length} of ${limit} used on your ${PLANS[user.plan].name} plan.` : 'Unlimited on Enterprise.'}`}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New project
          </Button>
        }
      />
      {atLimit && (
        <div className="mb-6">
          <Alert tone="warning">
            You’ve reached the {limit}-project limit on the {PLANS[user.plan].name} plan.{' '}
            <a href="/app/billing" className="font-semibold underline">
              Upgrade
            </a>{' '}
            to add more.
          </Alert>
        </div>
      )}
      <Card>
        {loading ? (
          <div className="grid h-48 place-items-center">
            <Spinner />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No projects yet" description="Create a project to start collecting events." action={<Button onClick={() => setOpen(true)}>Create project</Button>} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Platform</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Created</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => {
                const Icon = PLATFORM_ICON[p.platform] || Globe;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{p.name}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="size-4 text-slate-400" /> {p.platform}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3.5 text-slate-500 sm:table-cell">{fmtDate(p.createdAt)}</td>
                    <td className="px-5 py-3.5">{p.status === 'active' ? <Badge color="green">Active</Badge> : <Badge color="amber">Paused</Badge>}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => toggle(p)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title={p.status === 'active' ? 'Pause' : 'Resume'}>
                          {p.status === 'active' ? <Pause className="size-4" /> : <Play className="size-4" />}
                        </button>
                        <button onClick={() => remove(p)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New project"
        description="Connect a website, app or backend service."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="new-project" type="submit" loading={busy}>
              Create project
            </Button>
          </>
        }
      >
        <form id="new-project" onSubmit={create} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div>
            <label className="label" htmlFor="pname">Project name</label>
            <input id="pname" className="input" required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Checkout web app" />
          </div>
          <div>
            <label className="label">Platform</label>
            <div className="grid grid-cols-4 gap-2">
              {['Web', 'iOS', 'Android', 'Server'].map((pl) => (
                <button
                  type="button"
                  key={pl}
                  onClick={() => setForm({ ...form, platform: pl })}
                  className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${form.platform === pl ? 'border-brand bg-brand-soft text-brand' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {pl}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
