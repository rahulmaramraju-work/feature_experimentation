import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Activity, Columns2, Flag, Minus, Plus, RotateCcw, ScanSearch, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { CONTROL, useFlag } from './FlagProvider';
import { Toggle } from '../components/ui';

// Variables the site actually renders from. Others can be created but are only stored.
const WIRED = Object.keys(CONTROL);

export default function ControlTower() {
  const { flag, setEnabled } = useFlag();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('variables');

  // Shift+M toggles the flag from anywhere, handy while presenting.
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (e.shiftKey && e.key.toLowerCase() === 'm' && !typing) setEnabled(!flag.enabled);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flag.enabled, setEnabled]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2.5 rounded-full bg-slate-900 py-2.5 pl-3 pr-4 text-sm font-medium text-white shadow-lg shadow-slate-900/25 transition hover:bg-slate-800"
      >
        <Flag className="size-4 text-fuchsia-400" />
        Control Tower
        <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide', flag.enabled ? 'bg-emerald-400 text-emerald-950' : 'bg-white/15 text-slate-300')}>
          master {flag.enabled ? 'ON' : 'OFF'}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-full max-w-md animate-slide-in flex-col bg-white shadow-2xl">
            <MasterHeader onClose={() => setOpen(false)} />
            <nav className="flex gap-1 border-b border-slate-200 px-3">
              {[
                ['variables', 'Variables', SlidersHorizontal],
                ['compare', 'Control vs live', Columns2],
                ['activity', 'Activity', Activity],
              ].map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={clsx('flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition', tab === id ? 'border-brand text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800')}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </nav>
            <div className="flex-1 overflow-y-auto">
              {tab === 'variables' && <VariablesTab />}
              {tab === 'compare' && <CompareTab />}
              {tab === 'activity' && <ActivityTab />}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function MasterHeader({ onClose }) {
  const { flag, setEnabled, outlines, setOutlines, reset } = useFlag();
  return (
    <div className="bg-slate-900 px-5 pb-5 pt-5 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Feature flag</p>
          <h2 className="mt-0.5 font-mono text-2xl font-semibold">master</h2>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>

      <button
        onClick={() => setEnabled(!flag.enabled)}
        className={clsx(
          'mt-4 flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left transition',
          flag.enabled ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400' : 'bg-white/10 text-white hover:bg-white/15',
        )}
      >
        <span>
          <span className="block text-lg font-bold">{flag.enabled ? 'ON' : 'OFF'}</span>
          <span className="block text-xs opacity-80">{flag.enabled ? 'Serving the variables below' : 'Serving the control experience'}</span>
        </span>
        <span className={clsx('relative inline-flex h-8 w-14 items-center rounded-full transition', flag.enabled ? 'bg-emerald-950/25' : 'bg-white/20')}>
          <span className={clsx('inline-block size-6 rounded-full bg-white shadow transition', flag.enabled ? 'translate-x-7' : 'translate-x-1')} />
        </span>
      </button>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <label className="flex cursor-pointer items-center gap-2">
          <Toggle checked={outlines} onChange={setOutlines} label="Show flag outlines" />
          <ScanSearch className="size-3.5" /> Show flag outlines on the page
        </label>
        <button onClick={reset} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-slate-300 hover:bg-white/10">
          <RotateCcw className="size-3.5" /> Reset
        </button>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Tip: press Shift+M anywhere to flip the flag.</p>
    </div>
  );
}

function ValueEditor({ v }) {
  const { setVariable } = useFlag();
  if (v.type === 'boolean') return <Toggle checked={!!v.value} onChange={(val) => setVariable(v.key, val)} label={v.key} />;
  if (v.type === 'number') {
    const min = v.min ?? 0;
    const max = v.max ?? 99;
    return (
      <div className="flex items-center gap-1">
        <button onClick={() => setVariable(v.key, Math.max(min, Number(v.value) - 1))} className="grid size-7 place-items-center rounded-md border border-slate-300 hover:bg-slate-50" aria-label={`Decrease ${v.key}`}>
          <Minus className="size-3.5" />
        </button>
        <span className="w-8 text-center font-mono text-sm font-semibold tabular-nums">{v.value}</span>
        <button onClick={() => setVariable(v.key, Math.min(max, Number(v.value) + 1))} className="grid size-7 place-items-center rounded-md border border-slate-300 hover:bg-slate-50" aria-label={`Increase ${v.key}`}>
          <Plus className="size-3.5" />
        </button>
      </div>
    );
  }
  if (v.type === 'select') {
    return (
      <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
        {v.options.map((o) => (
          <button key={o} onClick={() => setVariable(v.key, o)} className={clsx('rounded-md px-3 py-1 text-xs font-semibold transition', v.value === o ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>
            {o}
          </button>
        ))}
      </div>
    );
  }
  if (v.type === 'color') {
    return (
      <label className="flex items-center gap-2">
        <input type="color" value={v.value} onChange={(e) => setVariable(v.key, e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-slate-300" aria-label={v.key} />
        <span className="font-mono text-xs">{v.value}</span>
      </label>
    );
  }
  return <TextEditor v={v} />;
}

function TextEditor({ v }) {
  const { setVariable } = useFlag();
  const [draft, setDraft] = useState(String(v.value));
  return (
    <input
      className="input h-8 w-40 py-1 text-xs"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== String(v.value) && setVariable(v.key, draft)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      aria-label={v.key}
    />
  );
}

const PRESETS = {
  banner_count: { type: 'number', value: 3, min: 1, max: 4, description: 'How many promo banners stack at the top of every page' },
  support_bot: { type: 'boolean', value: true, description: 'Show the floating support chat bot' },
  navigation: { type: 'select', value: 'side', options: ['top', 'side'], description: 'Top navigation bar or side navigation' },
  theme_color: { type: 'color', value: '#0f766e', description: 'Primary brand colour across the product' },
};

function AddVariable() {
  const { flag, addVariable } = useFlag();
  const [key, setKey] = useState('');
  const [type, setType] = useState('string');
  const [value, setValue] = useState('');
  const missing = Object.keys(PRESETS).filter((k) => !flag.variables.some((v) => v.key === k));

  const create = (e) => {
    e.preventDefault();
    const k = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!k) return;
    if (PRESETS[k]) return addVariable({ key: k, ...PRESETS[k] });
    const parsed = type === 'number' ? Number(value) || 0 : type === 'boolean' ? value === 'true' : value;
    addVariable({ key: k, type, value: parsed, description: 'Custom variable' });
    setKey('');
    setValue('');
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50 p-5">
      <h3 className="text-sm font-semibold">Create a variable</h3>
      {missing.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {missing.map((k) => (
            <button key={k} onClick={() => addVariable({ key: k, ...PRESETS[k] })} className="rounded-full border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs hover:border-brand hover:text-brand">
              + {k}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={create} className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <input className="input font-mono text-xs" placeholder="variable_key" value={key} onChange={(e) => setKey(e.target.value)} aria-label="Variable key" />
        <select className="input w-28 text-xs" value={type} onChange={(e) => setType(e.target.value)} aria-label="Variable type">
          <option value="string">string</option>
          <option value="number">number</option>
          <option value="boolean">boolean</option>
        </select>
        <input className="input text-xs" placeholder="value" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Variable value" />
        <button className="rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">Create</button>
      </form>
    </div>
  );
}

function VariablesTab() {
  const { flag, removeVariable } = useFlag();
  return (
    <div>
      {!flag.enabled && (
        <p className="bg-amber-50 px-5 py-2.5 text-xs text-amber-900">master is OFF, so visitors see the control experience. Edits here apply as soon as you turn it ON.</p>
      )}
      <ul className="divide-y divide-slate-100">
        {flag.variables.map((v) => (
          <li key={v.key} className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-[13px] font-semibold">{v.key}</code>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">{v.type}</span>
                  {!WIRED.includes(v.key) && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">stored only</span>}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{v.description}</p>
                {WIRED.includes(v.key) && <p className="mt-0.5 font-mono text-[11px] text-slate-400">control: {String(CONTROL[v.key])}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ValueEditor v={v} />
                <button onClick={() => removeVariable(v.key)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${v.key}`}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
        {flag.variables.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-500">No variables. The flag serves the control values even when ON.</li>}
      </ul>
      <AddVariable />
    </div>
  );
}

const DESCRIBE = {
  banner_count: (v) => `${v} banner${v === 1 ? '' : 's'}`,
  support_bot: (v) => (v ? 'Support bot shown' : 'No support bot'),
  navigation: (v) => (v === 'side' ? 'Side navigation' : 'Top navigation'),
  theme_color: (v) => v,
};

function CompareTab() {
  const { values } = useFlag();
  return (
    <div className="p-5">
      <p className="mb-3 text-sm text-slate-500">What visitors get with the flag OFF (control) versus what they see right now.</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
            <th className="pb-2 font-medium">Variable</th>
            <th className="pb-2 font-medium">Control</th>
            <th className="pb-2 font-medium">Live now</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {WIRED.map((k) => {
            const changed = values[k] !== CONTROL[k];
            return (
              <tr key={k}>
                <td className="py-2.5 font-mono text-xs">{k}</td>
                <td className="py-2.5 text-slate-500">{DESCRIBE[k](CONTROL[k])}</td>
                <td className={clsx('py-2.5 font-medium', changed ? 'text-brand' : 'text-slate-700')}>
                  {k === 'theme_color' && <span className="mr-1.5 inline-block size-3 rounded-sm align-middle" style={{ background: values[k] }} />}
                  {DESCRIBE[k](values[k])}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTab() {
  const { log } = useFlag();
  if (!log.length) return <p className="p-5 text-sm text-slate-500">No changes yet. Flip master or edit a variable to see the history here.</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {log.map((l) => (
        <li key={l.id} className="px-5 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-800">{l.message}</span>
            <span className="text-[11px] text-slate-400">{l.at.toLocaleTimeString()}</span>
          </div>
          {l.changes.length > 0 && <p className="mt-1 font-mono text-[11px] text-slate-500">{l.changes.join(' · ')}</p>}
        </li>
      ))}
    </ul>
  );
}
