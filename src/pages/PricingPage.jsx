import { useNavigate } from 'react-router-dom';
import PricingTable from '../components/PricingTable';
import { useAuth } from '../lib/auth';

const FAQ = [
  ['Can I change plans later?', 'Yes. Upgrade or downgrade at any time from Billing; changes apply immediately.'],
  ['What counts as an event?', 'Any tracked user action such as a page view, click or purchase.'],
  ['Do you offer discounts for startups?', 'Yes, eligible startups get Pro free for 12 months.'],
  ['Is my data secure?', 'Lumen is SOC 2 Type II certified and encrypts all data at rest and in transit.'],
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <PricingTable onSelect={(plan) => navigate(user ? '/app/billing' : `/signup?plan=${plan}`)} />
      <div className="mx-auto mt-24 max-w-3xl">
        <h2 className="text-center text-2xl font-bold">Frequently asked questions</h2>
        <dl className="mt-8 divide-y divide-slate-200">
          {FAQ.map(([q, a]) => (
            <div key={q} className="py-5">
              <dt className="font-medium text-slate-900">{q}</dt>
              <dd className="mt-1.5 text-sm text-slate-600">{a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
