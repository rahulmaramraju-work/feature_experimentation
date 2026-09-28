import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { Alert, Button, PlanBadge } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useFe } from '../fe/FeProvider';

export default function Login() {
  const { user, login, demoLogin } = useAuth();
  const { config } = useFe();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const next = location.state?.from || '/app';

  if (user) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy('form');
    try {
      await login(email, password);
      navigate(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const quick = async (acct) => {
    setBusy(acct.email);
    try {
      await demoLogin(acct.email);
      navigate(next);
    } catch (err) {
      setError(err.message);
      setBusy(null);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Lumen workspace."
      aside={
        <div className="max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/60">Live demo</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight">Sign in as any customer and watch the product adapt.</h2>
          <p className="mt-4 text-white/70">
            Each demo account has a different plan, country and company size. Wingify FE uses those attributes to decide which features, prices and experiments each
            person sees.
          </p>
          <div className="mt-8 space-y-2">
            {config?.demoAccounts?.map((a) => (
              <button
                key={a.email}
                onClick={() => quick(a)}
                disabled={!!busy}
                className="group flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-white/25 hover:bg-white/10"
              >
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-white/60">
                    {a.title}, {a.company} · {a.persona}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <PlanBadge plan={a.plan} />
                  <ArrowRight className="size-4 text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div>
          <label className="label" htmlFor="email">Work email</label>
          <input id="email" type="email" className="input" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            <span className="mb-1.5 text-xs text-slate-400">Forgot password?</span>
          </div>
          <input id="password" type="password" className="input" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" loading={busy === 'form'}>
          Sign in
        </Button>
      </form>

      {/* Demo accounts, visible on small screens where the aside panel is hidden */}
      <div className="mt-8 lg:hidden">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Or use a demo account</p>
        <div className="space-y-2">
          {config?.demoAccounts?.map((a) => (
            <button key={a.email} onClick={() => quick(a)} disabled={!!busy} className="card flex w-full items-center justify-between px-3 py-2.5 text-left">
              <span className="text-sm font-medium">{a.name}</span>
              <PlanBadge plan={a.plan} />
            </button>
          ))}
        </div>
      </div>

      {config?.demoPassword && (
        <p className="mt-6 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
          Demo accounts also work with the form: use any demo email with password <code className="font-semibold">{config.demoPassword}</code>
        </p>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        New to Lumen?{' '}
        <Link to="/signup" className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
