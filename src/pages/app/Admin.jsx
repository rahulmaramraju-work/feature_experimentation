import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useApi } from '../../lib/useApi';
import { api } from '../../lib/api';
import { PLAN_ORDER, PLANS } from '../../../shared/plans';
import { Alert, Badge, Button, Card, CardHeader, PageHeader, Spinner, fmtDate } from '../../components/ui';

export default function Admin() {
  const { user } = useAuth();
  const { data, setData, loading, reload } = useApi('/admin/users');
  const [msg, setMsg] = useState('');
  const [resetting, setResetting] = useState(false);
  if (user.role !== 'admin') return <Navigate to="/app" replace />;

  const setPlan = async (u, plan) => {
    const { user: updated } = await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { plan } });
    setData({ users: data.users.map((x) => (x.id === u.id ? updated : x)) });
    setMsg(`${updated.name} is now on ${PLANS[plan].name}. Their FE targeting updates on their next page load.`);
  };

  const reset = async () => {
    if (!confirm('Reset all demo accounts to their original plans and data?')) return;
    setResetting(true);
    await api('/admin/reset-demo', { method: 'POST' });
    await reload();
    setResetting(false);
    setMsg('Demo accounts reset.');
  };

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Every account in the Lumen database. Change a plan to move a customer into a different Wingify audience."
        actions={
          <Button variant="secondary" onClick={reset} loading={resetting}>
            <RotateCcw className="size-4" /> Reset demo data
          </Button>
        }
      />
      {msg && (
        <div className="mb-6">
          <Alert tone="success">{msg}</Alert>
        </div>
      )}
      <Card>
        <CardHeader title="Accounts" description={data ? `${data.users.length} users` : ''} />
        {loading && !data ? (
          <div className="grid h-40 place-items-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Country</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium">
                        {u.name} {u.isDemo && <Badge color="gray">demo</Badge>} {u.role === 'admin' && <Badge color="dark">admin</Badge>}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                      <p className="font-mono text-[11px] text-slate-400">{u.id}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {u.company} <span className="text-slate-400">· {u.companySize}</span>
                    </td>
                    <td className="px-5 py-3">{u.country}</td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      <select className="input w-36 py-1.5" value={u.plan} onChange={(e) => setPlan(u, e.target.value)}>
                        {PLAN_ORDER.map((p) => (
                          <option key={p} value={p}>{PLANS[p].name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
