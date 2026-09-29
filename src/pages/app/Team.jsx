import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useApi } from '../../lib/useApi';
import { api } from '../../lib/api';
import { PLANS } from '../../../shared/plans';
import { Alert, Badge, Button, Card, CardHeader, PageHeader, Spinner } from '../../components/ui';

const initials = (n) =>
  n
    .split(/[\s.]/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function Team() {
  const { user } = useAuth();
  const { data, setData, loading } = useApi('/team');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const members = data?.members || [];
  const limit = PLANS[user.plan].limits.seats;

  const invite = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { member } = await api('/team', { method: 'POST', body: { email, role } });
      setData({ members: [...members, member] });
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m) => {
    await api(`/team/${m.id}`, { method: 'DELETE' });
    setData({ members: members.filter((x) => x.id !== m.id) });
  };

  return (
    <div>
      <PageHeader title="Team" description={`${members.length + 1} of ${Number.isFinite(limit) ? limit : 'unlimited'} seats used on the ${PLANS[user.plan].name} plan.`} />
      <Card className="mb-6">
        <CardHeader title="Invite teammates" description="They’ll get an email with a link to join your workspace." />
        <form onSubmit={invite} className="flex flex-wrap gap-3 p-5">
          <input type="email" required className="input min-w-60 flex-1" placeholder="colleague@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className="input w-40" value={role} onChange={(e) => setRole(e.target.value)}>
            {['Member', 'Analyst', 'Engineer', 'Admin'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <Button type="submit" loading={busy}>
            <UserPlus className="size-4" /> Send invite
          </Button>
          {error && (
            <div className="w-full">
              <Alert tone="warning">{error}</Alert>
            </div>
          )}
        </form>
      </Card>
      <Card>
        <CardHeader title="Members" />
        {loading ? (
          <div className="grid h-32 place-items-center">
            <Spinner />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            <li className="flex items-center gap-3 px-5 py-3.5">
              <span className="grid size-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{initials(user.name)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{user.name} (you)</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <Badge color="dark">Owner</Badge>
            </li>
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="grid size-9 place-items-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">{initials(m.name)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                </div>
                {m.status === 'invited' && <Badge color="amber">Invited</Badge>}
                <Badge>{m.role}</Badge>
                <button onClick={() => remove(m)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
