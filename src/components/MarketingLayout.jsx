import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Banners } from '../flags/FlagVisuals';
import { Button, Logo } from './ui';

export default function MarketingLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <Banners />
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="/#features" className="hover:text-slate-900">Product</a>
            <a href="/#how" className="hover:text-slate-900">How it works</a>
            <NavLink to="/pricing" className="hover:text-slate-900">Pricing</NavLink>
            <a href="/#customers" className="hover:text-slate-900">Customers</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button to="/app">Open dashboard</Button>
            ) : (
              <>
                <Button to="/login" variant="ghost">Sign in</Button>
                <Button to="/signup">Start free</Button>
              </>
            )}
          </div>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-slate-500">Product analytics for teams that ship. Understand every user journey and act on it.</p>
          </div>
          {[
            ['Product', ['Dashboards', 'Funnels', 'AI Insights', 'Integrations']],
            ['Company', ['About', 'Careers', 'Blog', 'Contact']],
            ['Resources', ['Docs', 'API', 'Status', 'Security']],
          ].map(([h, items]) => (
            <div key={h}>
              <h4 className="text-sm font-semibold text-slate-900">{h}</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                {items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          © 2026 Lumen Analytics (demo). Feature flag demo: open the Control Tower to flip the master flag.
        </div>
      </footer>
    </div>
  );
}
