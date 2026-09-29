import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Bot, CalendarClock, Flag, Megaphone, MessageCircle, Percent, Send, Wrench, X } from 'lucide-react';
import { useFlag } from './FlagProvider';

// True for ~2.5s after a change that touched any of the given variable keys.
function useFlash(keys) {
  const { pulse } = useFlag();
  const [flash, setFlash] = useState(false);
  const hit = pulse.at && pulse.keys.some((k) => keys.includes(k));
  useEffect(() => {
    if (!hit) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 2600);
    return () => clearTimeout(t);
  }, [pulse.at, hit]);
  return flash;
}

// Wraps a flag-controlled area: flashes when it changes and shows a labelled outline in inspect mode.
export function FlagZone({ vars, label, className, children, as: Tag = 'div', labelAbove = false }) {
  const { outlines, pulse } = useFlag();
  const flash = useFlash(vars);
  const change = pulse.changes?.find((c) => vars.includes(c.key));
  // Keep the caller's positioning (fixed / sticky); only default to relative for the label anchor.
  const positioned = /\b(fixed|sticky|absolute)\b/.test(className || '');
  return (
    <Tag className={clsx(!positioned && 'relative', className, flash && 'flag-flash', outlines && 'flag-outline')}>
      {children}
      {(outlines || flash) && (
        <span className={clsx('pointer-events-none absolute z-30 flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold shadow', labelAbove ? '-top-7 right-0 whitespace-nowrap' : flash ? 'right-2 top-2' : 'right-1 top-1', flash ? 'bg-brand text-white animate-fade-up' : 'bg-fuchsia-600 text-white')}>
          <Flag className="size-3" />
          {flash && change ? `master · ${change.key} → ${change.to}` : `master · ${label || vars.join(', ')}`}
        </span>
      )}
    </Tag>
  );
}

// Big, obvious confirmation whenever the flag or a variable changes.
export function FlagToast() {
  const { pulse } = useFlag();
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (!pulse.at) return;
    setShown(pulse);
    const t = setTimeout(() => setShown(null), 3200);
    return () => clearTimeout(t);
  }, [pulse]);
  if (!shown) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[60] w-[min(92vw,420px)] -translate-x-1/2 animate-fade-up rounded-xl bg-slate-900 px-4 py-3 text-white shadow-2xl">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Flag className="size-4 text-fuchsia-400" /> {shown.message}
      </p>
      {shown.changes?.length > 0 ? (
        <ul className="mt-1.5 space-y-0.5 font-mono text-xs text-slate-300">
          {shown.changes.map((c) => (
            <li key={c.key}>
              {c.key}: <span className="text-slate-500">{c.from}</span> → <span className="text-emerald-300">{c.to}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-slate-400">No visible change (flag is OFF, so variables are not served).</p>
      )}
    </div>
  );
}

// Applies theme_color to the whole product.
export function ThemeColor() {
  const { values } = useFlag();
  useEffect(() => {
    const valid = /^#[0-9a-f]{6}$/i.test(values.theme_color) ? values.theme_color : '#4f46e5';
    document.documentElement.style.setProperty('--brand', valid);
  }, [values.theme_color]);
  return null;
}

const BANNERS = [
  { icon: Megaphone, cls: 'bg-slate-900 text-white', text: 'Lumen 3.0 is here: faster dashboards and AI Insights.', cta: 'See what’s new' },
  { icon: CalendarClock, cls: 'bg-brand text-white', text: 'Live webinar Thursday 5pm: building activation funnels that convert.', cta: 'Save your seat' },
  { icon: Percent, cls: 'bg-emerald-600 text-white', text: 'This week only: 30% off Pro for your first 3 months.', cta: 'Claim offer' },
  { icon: Wrench, cls: 'bg-amber-400 text-amber-950', text: 'Scheduled maintenance Sunday 02:00–03:00 UTC. Dashboards may pause briefly.', cta: 'Status page' },
];

// banner_count: 1 banner for control, up to 4 when the flag serves more.
export function Banners() {
  const { values } = useFlag();
  const count = Math.min(4, Math.max(0, Number(values.banner_count) || 0));
  return (
    <FlagZone vars={['banner_count']} label="banner_count">
      {BANNERS.slice(0, count).map(({ icon: Icon, cls, text, cta }, i) => (
        <div key={text} className={clsx('flex items-center justify-center gap-3 px-4 py-2 text-sm animate-banner', cls)} style={{ animationDelay: `${i * 90}ms` }}>
          <Icon className="size-4 shrink-0" />
          <span className="font-medium">{text}</span>
          <span className="hidden underline underline-offset-2 opacity-90 sm:inline">{cta} →</span>
        </div>
      ))}
    </FlagZone>
  );
}

const QUICK = [
  ['How do I invite my team?', 'Go to Team in the sidebar, enter their email and choose a role. They get an invite right away.'],
  ['Upgrade my plan', 'Open Billing and pick Pro or Enterprise. Changes apply immediately and you can switch back anytime.'],
  ['Talk to a human', 'Connecting you to a specialist. Typical reply time right now: under 2 minutes.'],
];

// support_bot: a floating help assistant that appears or disappears with the flag.
export function SupportBot() {
  const { values } = useFlag();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: 'bot', text: 'Hi! I’m Lumi, the Lumen assistant. How can I help?' }]);
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);
  useEffect(() => {
    if (!values.support_bot) setOpen(false);
  }, [values.support_bot]);

  const ask = (q, a) => {
    setMessages((m) => [...m, { from: 'me', text: q }]);
    setTimeout(() => setMessages((m) => [...m, { from: 'bot', text: a }]), 600);
  };
  const send = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    ask(draft.trim(), 'Thanks! I’ve passed this to our support team. You’ll get an email reply shortly.');
    setDraft('');
  };

  if (!values.support_bot) return null;
  return (
    <FlagZone vars={['support_bot']} label="support_bot" labelAbove className="fixed bottom-20 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="card flex h-[420px] w-[min(88vw,340px)] animate-fade-up flex-col overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 bg-brand px-4 py-3 text-white">
            <span className="grid size-8 place-items-center rounded-full bg-white/20">
              <Bot className="size-4.5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Lumi · Support</p>
              <p className="text-xs text-white/75">Typically replies instantly</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/15" aria-label="Close chat">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
            {messages.map((m, i) => (
              <div key={i} className={clsx('max-w-[85%] rounded-2xl px-3 py-2 text-sm', m.from === 'bot' ? 'bg-white text-slate-800 shadow-sm' : 'ml-auto bg-brand text-white')}>
                {m.text}
              </div>
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK.map(([q, a]) => (
                  <button key={q} onClick={() => ask(q, a)} className="rounded-full border border-brand-ring bg-white px-3 py-1 text-xs font-medium text-brand hover:bg-brand-soft">
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-slate-200 bg-white p-2">
            <input className="input" placeholder="Type a message…" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Message" />
            <button className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand text-white" aria-label="Send">
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} className="grid size-14 animate-pop place-items-center rounded-full bg-brand text-white shadow-xl shadow-slate-900/20 transition hover:scale-105" aria-label="Open support chat">
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </FlagZone>
  );
}
