import { useState } from 'react';
import { Info } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { COUNTRIES } from '../Signup';
import { Alert, Button, Card, CardHeader, PageHeader } from '../../components/ui';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    title: user.title,
    company: user.company,
    companySize: user.companySize,
    country: user.country,
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { user: u } = await api('/me', { method: 'PATCH', body: form });
      setUser(u);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Manage your profile and workspace details." />
      <Card>
        <CardHeader title="Profile" description="This information is visible to your teammates." />
        <form onSubmit={save} className="space-y-5 p-5">
          {saved && <Alert tone="success">Profile saved. Feature decisions have been re-evaluated for your new attributes.</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="s-name">Full name</label>
              <input id="s-name" className="input" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="label" htmlFor="s-title">Job title</label>
              <input id="s-title" className="input" value={form.title} onChange={set('title')} />
            </div>
            <div>
              <label className="label" htmlFor="s-email">Email</label>
              <input id="s-email" className="input bg-slate-50 text-slate-500" value={user.email} disabled />
            </div>
            <div>
              <label className="label" htmlFor="s-company">Company</label>
              <input id="s-company" className="input" value={form.company} onChange={set('company')} />
            </div>
            <div>
              <label className="label" htmlFor="s-size">Company size (employees)</label>
              <input id="s-size" type="number" min="1" className="input" value={form.companySize} onChange={set('companySize')} />
            </div>
            <div>
              <label className="label" htmlFor="s-country">Country</label>
              <select id="s-country" className="input" value={form.country} onChange={set('country')}>
                {COUNTRIES.map(([c, n]) => (
                  <option key={c} value={c}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-sky-50 px-3.5 py-3 text-sm text-sky-900">
            <Info className="mt-0.5 size-4 shrink-0" />
            Country and company size are sent to Wingify as targeting attributes. Change them to see personalization (e.g. regional pricing) react instantly.
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={busy}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
