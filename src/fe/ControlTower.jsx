import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Activity, Braces, Flag, Layers, RefreshCw, Server, Monitor, Users, X, Radio } from 'lucide-react';
import { useFe } from './FeProvider';
import { useFeature } from './useFeature';
import { FLAGS } from './flags';
import { useAuth } from '../lib/auth';
import { Badge, PlanBadge } from '../components/ui';

const ENV_LABEL = { dev: 'Dev', staging: 'Staging', prod: 'Prod' };
const ENV_COLOR = { dev: 'bg-sky-500', staging: 'bg-amber-500', prod: 'bg-emerald-500' };

// Floating "Control Tower": shows exactly what Wingify FE decided for the current user, live.
export default function ControlTower() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('flags');
  const { status, env } = useFe();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full bg-slate-900 py-2.5 pl-3 pr-4 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
      >
        <span className="relative flex size-2.5">
          <span className={clsx('absolute inline-flex size-full animate-ping rounded-full opacity-60', status === 'ready' ? 'bg-emerald-400' : 'bg-amber-400')} />
          <span className={clsx('relative inline-flex size-2.5 rounded-full', status === 'ready' ? 'bg-emerald-400' : 'bg-amber-400')} />
        </span>
        FE Control Tower
        {env && <span className="rounded bg-white/15 px-1.5 py-0.5 text-[11px] uppercase tracking-wide">{env}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-full max-w-md animate-slide-in flex-col bg-white shadow-2xl">
            <Header onClose={() => setOpen(false)} />
            <nav className="flex gap-1 border-b border-slate-200 px-3">
              {[
                ['flags', 'Flags', Flag],
                ['context', 'User context', Users],
                ['events', 'Live log', Activity],
              ].map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={clsx(
                    'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition',
                    tab === id ? 'border-brand text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800',
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </nav>
            <div className="flex-1 overflow-y-auto">
              {tab === 'flags' && <FlagsTab />}
              {tab === 'context' && <ContextTab />}
              {tab === 'events' && <EventsTab />}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function Header({ onClose }) {
  const { env, environments, switchEnv, status, lastSync, syncNow, client } = useFe();
  const [syncing, setSyncing] = useState(false);
  const sync = async () => {
    setSyncing(true);
    await syncNow().finally(() => setSyncing(false));
  };
  return (
    <div className="bg-slate-900 px-5 pb-4 pt-5 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            <Radio className="size-3.5" /> Wingify Feature Experimentation
          </p>
          <h2 className="mt-1 text-lg font-semibold">Control Tower</h2>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      <div className="mt-4">
        <p className="mb-1.5 text-xs text-slate-400">Environment (each uses its own SDK key)</p>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-white/10 p-1">
          {environments.map((e) => (
            <button
              key={e}
              onClick={() => switchEnv(e)}
              className={clsx('flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition', env === e ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white')}
            >
              <span className={clsx('size-1.5 rounded-full', ENV_COLOR[e])} />
              {ENV_LABEL[e]}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>
          SDK {status === 'ready' ? 'connected' : status}
          {client && ` · ${client.originalSettings?.features?.length ?? 0} flags · polling every 10s`}
          {lastSync && ` · synced ${lastSync.toLocaleTimeString()}`}
        </span>
        <button onClick={sync} disabled={!client} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-slate-200 hover:bg-white/10 disabled:opacity-40">
          <RefreshCw className={clsx('size-3.5', syncing && 'animate-spin')} /> Sync
        </button>
      </div>
    </div>
  );
}

function FlagsTab() {
  const { decisions } = useFe();
  return (
    <div className="divide-y divide-slate-100">
      <p className="bg-slate-50 px-5 py-2.5 text-xs text-slate-500">
        Evaluated live for the current user. Change a flag in Wingify and it updates here within ~10 seconds.
      </p>
      {Object.keys(FLAGS).map((key) =>
        FLAGS[key].evaluatedOn === 'client' ? <ClientFlagRow key={key} flagKey={key} /> : <FlagRow key={key} flagKey={key} decision={decisions[key]} />,
      )}
    </div>
  );
}

function ClientFlagRow({ flagKey }) {
  const f = useFeature(flagKey);
  return <FlagRow flagKey={flagKey} decision={f.ready ? { enabled: f.enabled, variables: f.variables, evaluatedOn: 'client' } : null} />;
}

function FlagRow({ flagKey, decision }) {
  const meta = FLAGS[flagKey];
  const [flash, setFlash] = useState(false);
  const sig = JSON.stringify(decision && { e: decision.enabled, v: decision.variables });
  const prev = useRef(sig);
  useEffect(() => {
    if (prev.current !== sig && prev.current !== 'null') {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 900);
      prev.current = sig;
      return () => clearTimeout(t);
    }
    prev.current = sig;
  }, [sig]);

  const vars = decision?.enabled ? Object.entries(decision.variables || {}) : [];
  return (
    <div className={clsx('px-5 py-3.5 transition', flash && 'animate-flash bg-brand-soft')}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <code className="truncate text-[13px] font-semibold text-slate-900">{flagKey}</code>
            {meta.evaluatedOn === 'server' ? (
              <Badge color="violet">
                <Server className="size-3" /> server
              </Badge>
            ) : (
              <Badge color="gray">
                <Monitor className="size-3" /> client
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {meta.kind} · {meta.where}
          </p>
        </div>
        {!decision ? (
          <Badge color="gray">{meta.evaluatedOn === 'server' ? 'Open Insights' : '…'}</Badge>
        ) : decision.enabled ? (
          <Badge color="green">ON</Badge>
        ) : (
          <Badge color="red">OFF</Badge>
        )}
      </div>
      {vars.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {vars.map(([k, v]) => (
            <span key={k} className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
              {k}: <span className="text-brand">{JSON.stringify(v)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ContextTab() {
  const { context, config } = useFe();
  const { user, demoLogin } = useAuth();
  const [busy, setBusy] = useState(null);
  const switchTo = async (email) => {
    setBusy(email);
    await demoLogin(email).finally(() => setBusy(null));
  };
  return (
    <div className="space-y-5 p-5">
      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Braces className="size-4" /> Context sent to Wingify
        </h3>
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-emerald-300">{JSON.stringify(context, null, 2)}</pre>
        <p className="mt-2 text-xs text-slate-500">
          Rules in Wingify target these <code>customVariables</code>. Bucketing is sticky per <code>id</code>, so a user always gets the same variation.
        </p>
      </div>
      {config?.demoAccounts && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Layers className="size-4" /> Switch persona
          </h3>
          <div className="space-y-2">
            {config.demoAccounts.map((a) => (
              <button
                key={a.email}
                onClick={() => switchTo(a.email)}
                disabled={busy}
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition',
                  user?.email === a.email ? 'border-brand bg-brand-soft' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.persona}</p>
                </div>
                <PlanBadge plan={a.plan} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const LOG_STYLE = {
  event: 'bg-emerald-500',
  sync: 'bg-sky-500',
  attribute: 'bg-violet-500',
  integration: 'bg-amber-500',
  error: 'bg-rose-500',
};

function EventsTab() {
  const { log } = useFe();
  if (!log.length) return <p className="p-5 text-sm text-slate-500">No activity yet. Click around the app to see decisions and events stream in.</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {log.map((l) => (
        <li key={l.id} className="px-5 py-3 animate-fade-up">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <span className={clsx('size-2 rounded-full', LOG_STYLE[l.type] || 'bg-slate-400')} />
              {l.title}
            </span>
            <span className="text-[11px] text-slate-400">{l.at.toLocaleTimeString()}</span>
          </div>
          {l.detail && Object.keys(l.detail).length > 0 && (
            <pre className="mt-1.5 overflow-x-auto rounded bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600">{JSON.stringify(l.detail, null, 1)}</pre>
          )}
        </li>
      ))}
    </ul>
  );
}
