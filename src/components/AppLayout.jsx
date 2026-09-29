import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  BarChart3,
  ChevronsUpDown,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useFlag } from '../flags/FlagProvider';
import { Banners, FlagZone } from '../flags/FlagVisuals';
import { PLANS } from '../../shared/plans';
import { Badge, Logo, PlanBadge } from './ui';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/insights', label: 'AI Insights', icon: Sparkles, pro: true },
  { to: '/app/reports', label: 'Reports', icon: FileText },
  { to: '/app/team', label: 'Team', icon: Users },
];
const NAV_ACCOUNT = [
  { to: '/app/billing', label: 'Billing', icon: CreditCard },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

const initials = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

function SideItem({ item, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
          isActive ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
        )
      }
    >
      <Icon className="size-4.5" />
      <span className="flex-1">{item.label}</span>
      {item.pro && <Badge color="brand">Pro</Badge>}
    </NavLink>
  );
}

function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const plan = PLANS[user.plan];
  return (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <Link to="/app" className="px-2">
        <Logo />
      </Link>
      <button className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm">
        <span className="grid size-8 place-items-center rounded-md bg-slate-900 text-xs font-bold text-white">{user.company.slice(0, 2).toUpperCase()}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{user.company}</span>
          <span className="block text-xs text-slate-500">{plan.name} workspace</span>
        </span>
        <ChevronsUpDown className="size-4 text-slate-400" />
      </button>
      <nav className="space-y-1">
        {NAV.map((i) => (
          <SideItem key={i.to} item={i} onClick={onNavigate} />
        ))}
      </nav>
      <div>
        <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
        <nav className="space-y-1">
          {NAV_ACCOUNT.map((i) => (
            <SideItem key={i.to} item={i} onClick={onNavigate} />
          ))}
          {user.role === 'admin' && <SideItem item={{ to: '/app/admin', label: 'Admin', icon: ShieldCheck }} onClick={onNavigate} />}
        </nav>
      </div>
      <div className="mt-auto">
        {user.plan === 'free' ? (
          <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
            <BarChart3 className="size-5 text-white/70" />
            <p className="mt-2 text-sm font-semibold">Unlock AI Insights</p>
            <p className="mt-1 text-xs text-white/70">Upgrade to Pro for AI Insights, 25 projects and 1M events.</p>
            <Link to="/app/billing" onClick={onNavigate} className="mt-3 inline-block rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900">
              Upgrade
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{plan.name} plan</p>
              <PlanBadge plan={user.plan} />
            </div>
            <p className="mt-1 text-xs text-slate-500">All premium features unlocked.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Top navigation: the whole menu lives in a horizontal bar, no sidebar.
function TopNav() {
  const { user } = useAuth();
  const items = [...NAV, ...NAV_ACCOUNT, ...(user.role === 'admin' ? [{ to: '/app/admin', label: 'Admin', icon: ShieldCheck }] : [])];
  return (
    <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 sm:px-6">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            clsx('flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition', isActive ? 'border-brand text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900')
          }
        >
          <Icon className="size-4" /> {label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const signOut = async () => {
    await logout();
    navigate('/login');
  };
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 rounded-lg p-1 pr-2 hover:bg-slate-100">
        <span className="grid size-8 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{initials(user.name)}</span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight">{user.name}</span>
          <span className="block text-xs leading-tight text-slate-500">{user.email}</span>
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="card absolute right-0 z-20 mt-2 w-56 animate-fade-up p-1.5 shadow-lg">
            <Link to="/app/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100">
              <Settings className="size-4" /> Settings
            </Link>
            <Link to="/app/billing" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100">
              <CreditCard className="size-4" /> Billing
            </Link>
            <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SearchBox() {
  return (
    <div className="relative hidden max-w-md flex-1 sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input className="input pl-9" placeholder="Search dashboards, projects, reports…" aria-label="Search" />
    </div>
  );
}

export default function AppLayout() {
  const { values } = useFlag();
  const side = values.navigation === 'side';
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Banners />
      <div className="flex flex-1">
        {side && (
          <FlagZone vars={['navigation']} label="navigation = side" as="aside" className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-slate-100/60 lg:block">
            <Sidebar />
          </FlagZone>
        )}
        {side && mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
            <aside className="relative h-full w-72 bg-slate-50 shadow-xl">
              <button className="absolute right-3 top-4 p-1 text-slate-500" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {side ? (
            <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6">
              <button className="rounded-md p-1.5 text-slate-600 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu className="size-5" />
              </button>
              <SearchBox />
              <div className="ml-auto">
                <UserMenu />
              </div>
            </header>
          ) : (
            <FlagZone vars={['navigation']} label="navigation = top" as="header" className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
              <div className="flex h-16 items-center gap-6 px-4 sm:px-6">
                <Link to="/app">
                  <Logo />
                </Link>
                <SearchBox />
                <div className="ml-auto">
                  <UserMenu />
                </div>
              </div>
              <TopNav />
            </FlagZone>
          )}
          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
