import { useState } from 'react';
import { CheckCircle2, CreditCard, Lock, ShieldCheck, Undo2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useApi } from '../../lib/useApi';
import { api } from '../../lib/api';
import { PLANS, planRank } from '../../../shared/plans';
import PricingTable, { usePrice } from '../../components/PricingTable';
import { Alert, Badge, Button, Card, CardHeader, Modal, PageHeader, PlanBadge, fmtDate } from '../../components/ui';

// Upgrades show a review step; downgrades a simple confirmation.
function Checkout({ target, onClose, onDone }) {
  const { format } = usePrice();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!target) return null;
  const plan = PLANS[target.plan];
  const trust = true;
  const price = target.interval === 'annual' ? plan.annual * 12 : plan.monthly;
  const downgrade = target.plan === 'free';

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onDone(target);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const trustRow = trust && (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
      <span className="flex items-center gap-1">
        <Lock className="size-3.5" /> 256-bit SSL
      </span>
      <span className="flex items-center gap-1">
        <ShieldCheck className="size-3.5" /> SOC 2 Type II
      </span>
      <span className="flex items-center gap-1">
        <Undo2 className="size-3.5" /> 30-day money-back
      </span>
    </div>
  );

  if (downgrade) {
    return (
      <Modal
        open
        onClose={onClose}
        title={downgrade ? 'Downgrade to Free?' : `Upgrade to ${plan.name}`}
        description={downgrade ? 'You’ll lose access to premium features at the end of this billing period.' : 'One click and you’re in. Your saved card will be charged.'}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant={downgrade ? 'danger' : 'primary'} loading={busy} onClick={confirm}>
              {downgrade ? 'Downgrade' : `Upgrade now · ${format(price)}`}
            </Button>
          </>
        }
      >
        {error && <Alert>{error}</Alert>}
        {!downgrade && (
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <CreditCard className="size-5 text-slate-500" /> Demo card ending 4242
          </div>
        )}
        {trustRow}
      </Modal>
    );
  }

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title="Review your order"
      description="Confirm the details below to complete your upgrade."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button loading={busy} onClick={confirm}>
            Confirm and pay {format(price)}
          </Button>
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      <div className="rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="font-medium">Lumen {plan.name}</p>
            <p className="text-sm text-slate-500">Billed {target.interval}</p>
          </div>
          <p className="font-semibold">{format(price)}</p>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-sm text-slate-600">
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-sm font-semibold rounded-b-xl">
          <span>Total due today</span>
          <span>{format(price)}</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm">
        <CreditCard className="size-5 text-slate-500" /> Demo card ending 4242
        <span className="ml-auto text-xs text-slate-400">No real payment is taken</span>
      </div>
      {trustRow}
    </Modal>
  );
}

export default function Billing() {
  const { user, setUser } = useAuth();
  const { format } = usePrice();
  const { data, setData } = useApi('/billing');
  const [target, setTarget] = useState(null);
  const [success, setSuccess] = useState('');

  const select = (plan, interval) => {
    if (plan === user.plan) return;
    setTarget({ plan, interval });
  };

  const complete = async (t) => {
    const res = await api('/billing/checkout', { method: 'POST', body: t });
    setUser(res.user);
    setData({ ...data, invoices: res.invoices, plan: res.user.plan });
    setTarget(null);
    setSuccess(`You’re now on the ${PLANS[t.plan].name} plan.`);
  };

  return (
    <div>
      <PageHeader title="Billing" description="Manage your plan, payment method and invoices." />
      {success && (
        <div className="mb-6">
          <Alert tone="success">{success}</Alert>
        </div>
      )}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Card className="p-5 md:col-span-2">
          <p className="text-sm text-slate-500">Current plan</p>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-2xl font-semibold">{PLANS[user.plan].name}</p>
            <PlanBadge plan={user.plan} />
          </div>
          <p className="mt-1 text-sm text-slate-600">{PLANS[user.plan].blurb}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Payment method</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="grid h-8 w-12 place-items-center rounded bg-slate-900 text-[10px] font-bold text-white">VISA</div>
            <div>
              <p className="text-sm font-medium">•••• 4242</p>
              <p className="text-xs text-slate-500">Demo card · expires 12/29</p>
            </div>
          </div>
        </Card>
      </div>

      <PricingTable compact currentPlan={user.plan} onSelect={select} />

      <Card className="mt-10">
        <CardHeader title="Invoices" />
        {data?.invoices?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.invoices.map((i) => (
                <tr key={i.id}>
                  <td className="px-5 py-3">{fmtDate(i.date)}</td>
                  <td className="px-5 py-3 capitalize">
                    {i.plan}
                    {i.interval ? ` · ${i.interval}` : ''}
                  </td>
                  <td className="px-5 py-3">{format(i.amount)}</td>
                  <td className="px-5 py-3">
                    <Badge color="green">Paid</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No invoices yet.</p>
        )}
      </Card>
      <Checkout target={target} onClose={() => setTarget(null)} onDone={complete} />
    </div>
  );
}
