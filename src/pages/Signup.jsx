import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { Alert, Button } from '../components/ui';
import { useAuth } from '../lib/auth';

export const COUNTRIES = [
  ['US', 'United States'],
  ['IN', 'India'],
  ['GB', 'United Kingdom'],
  ['DE', 'Germany'],
  ['IT', 'Italy'],
  ['FR', 'France'],
  ['CA', 'Canada'],
  ['AU', 'Australia'],
  ['SG', 'Singapore'],
  ['BR', 'Brazil'],
];

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', companySize: '10', country: 'US' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to="/app" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup(form);
      navigate(params.get('plan') && params.get('plan') !== 'free' ? '/app/billing' : '/app');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Free forever for small teams. No credit card required."
      aside={
        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight">Join 4,000+ product teams building with Lumen.</h2>
          <ul className="mt-8 space-y-4 text-white/80">
            {['Set up in under five minutes', 'Dashboards, funnels and retention out of the box', 'Upgrade to Pro for AI Insights'].map((t) => (
              <li key={t} className="flex gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-white" /> {t}
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" required value={form.name} onChange={set('name')} placeholder="Jane Cooper" />
        </div>
        <div>
          <label className="label" htmlFor="email">Work email</label>
          <input id="email" type="email" className="input" required value={form.email} onChange={set('email')} placeholder="jane@company.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" required minLength={8} value={form.password} onChange={set('password')} placeholder="At least 8 characters" />
        </div>
        <div>
          <label className="label" htmlFor="company">Company</label>
          <input id="company" className="input" value={form.company} onChange={set('company')} placeholder="Acme Inc." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="size">Company size</label>
            <select id="size" className="input" value={form.companySize} onChange={set('companySize')}>
              <option value="5">1–10</option>
              <option value="30">11–50</option>
              <option value="150">51–250</option>
              <option value="800">251–1,000</option>
              <option value="2500">1,000+</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="country">Country</label>
            <select id="country" className="input" value={form.country} onChange={set('country')}>
              {COUNTRIES.map(([c, n]) => (
                <option key={c} value={c}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" className="w-full" loading={busy}>
          Create account
        </Button>
        <p className="text-center text-xs text-slate-400">By signing up you agree to the Terms and Privacy Policy.</p>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
