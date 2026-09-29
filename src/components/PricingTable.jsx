import { useState } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import { PLANS, PLAN_ORDER, planRank } from '../../shared/plans';
import { Badge, Button } from './ui';

export function usePrice() {
  return { format: (usd) => `$${Math.round(usd).toLocaleString('en-US')}` };
}

// Pricing plans with a monthly / annual toggle.
export default function PricingTable({ currentPlan, onSelect, busyPlan, compact }) {
  const [interval, setBillingInterval] = useState('monthly');
  const highlight = 'pro';

  const choose = (planId) => onSelect(planId, interval);

  return (
    <div>
      {!compact && (
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Simple pricing that scales with you</h2>
          <p className="mt-3 text-slate-600">Start free. Upgrade when your team needs more. Cancel anytime.</p>
        </div>
      )}
      <div className="mb-8 flex items-center justify-center gap-3">
        <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
          {['monthly', 'annual'].map((i) => (
            <button
              key={i}
              onClick={() => setBillingInterval(i)}
              className={clsx('rounded-md px-4 py-1.5 font-medium capitalize transition', interval === i ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
            >
              {i}
            </button>
          ))}
        </div>
        <Badge color="green">Save 20% annually</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const featured = id === highlight;
          const isCurrent = currentPlan === id;
          const price = interval === 'annual' ? plan.annual : plan.monthly;
          let cta = 'Start free trial';
          if (currentPlan) cta = isCurrent ? 'Current plan' : planRank(id) > planRank(currentPlan) ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`;
          else if (id === 'free') cta = 'Get started';
          else if (id === 'enterprise') cta = 'Talk to sales';
          return (
            <div
              key={id}
              className={clsx(
                'relative flex flex-col rounded-2xl border bg-white p-7 transition',
                featured ? 'border-brand shadow-xl ring-4 ring-brand-ring/30' : 'border-slate-200 shadow-sm',
              )}
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow">Most popular</span>
              )}
              <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
              <p className="mt-1 min-h-10 text-sm text-slate-500">{plan.blurb}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-slate-900">{format(price)}</span>
                <span className="text-sm text-slate-500">/ seat / month</span>
              </div>
              <p className="mt-1 h-5 text-xs text-slate-500">{interval === 'annual' && price > 0 ? `Billed ${format(price * 12)} yearly` : ''}</p>
              <Button
                className="mt-6 w-full"
                variant={featured ? 'primary' : 'secondary'}
                disabled={isCurrent}
                loading={busyPlan === id}
                onClick={() => choose(id)}
              >
                {cta}
              </Button>
              <ul className="mt-7 space-y-3 text-sm text-slate-700">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
