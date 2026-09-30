import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useFlag } from '../flags/FlagProvider';
import { Banners, FlagZone } from '../flags/FlagVisuals';
import { Button, Logo } from './ui';

const LINKS = [
  { href: '/#features', label: 'Product' },
  { href: '/#how', label: 'How it works' },
  { to: '/pricing', label: 'Pricing' },
  { href: '/#customers', label: 'Customers' },
];

const NavItem = ({ item, className, onClick }) =>
  item.to ? (
    <NavLink to={item.to} className={className} onClick={onClick}>
      {item.label}
    </NavLink>
  ) : (
    <a href={item.href} className={className} onClick={onClick}>
      {item.label}
    </a>
  );

// navigation = side: a hamburger opens a slide-out side menu instead of the top links.
function SideMenu({ open, onClose, user }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <aside className="relative flex h-full w-72 animate-slide-in-left flex-col bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {LINKS.map((item) => (
            <NavItem key={item.label} item={item} onClick={onClose} className="rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100" />
          ))}
        </nav>
        <div className="mt-auto grid gap-2">
          {user ? (
            <Button to="/app" onClick={onClose}>Open dashboard</Button>
          ) : (
            <>
              <Button to="/signup" onClick={onClose}>Start free</Button>
              <Button to="/login" variant="secondary" onClick={onClose}>Sign in</Button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function MarketingLayout() {
  const { user } = useAuth();
  const { values } = useFlag();
  const side = values.navigation === 'side';
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      <Banners />
      <FlagZone vars={['navigation']} label={`navigation = ${values.navigation}`} as="header" className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {side && (
              <button
                onClick={() => setMenuOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
                <span className="hidden sm:inline">Menu</span>
              </button>
            )}
            <Link to="/">
              <Logo />
            </Link>
          </div>
          {!side && (
            <nav className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm font-medium text-slate-600">
              {LINKS.map((item) => (
                <NavItem key={item.label} item={item} className="shrink-0 rounded-md px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900" />
              ))}
            </nav>
          )}
          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <Button to="/app">Open dashboard</Button>
            ) : (
              <>
                <Button to="/login" variant="ghost" className="hidden sm:inline-flex">Sign in</Button>
                <Button to="/signup">Start free</Button>
              </>
            )}
          </div>
        </div>
      </FlagZone>
      <SideMenu open={side && menuOpen} onClose={() => setMenuOpen(false)} user={user} />
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
