import { useState } from 'react';
import clsx from 'clsx';
import { FlaskConical, Monitor, Play, Server } from 'lucide-react';
import { useFe, toVariables } from '../../fe/FeProvider';
import { useFeature } from '../../fe/useFeature';
import { FLAGS } from '../../fe/flags';
import { Badge, Button, Card, CardHeader, PageHeader } from '../../components/ui';

const HOW_TO = {
  announcement_banner: 'Toggle the flag off in Wingify: the banner disappears for everyone within seconds. Edit the message variable to change copy live.',
  brand_theme: 'Switch the rollout to the "Teal rebrand" variation (or edit primary_color) and the whole product re-skins without a deploy.',
  dashboard_v2: 'Add a rollout rule at 50%. Only half your users (sticky by user id) get the new layout and forecast.',
  onboarding_checklist: 'A/B test: compact vs guided checklist, measured on onboarding_step_completed. Add an audience of user_type = new to show it only to new sign-ups.',
  pricing_experiment: 'A/B test headline, highlighted plan and CTA. Conversion metric: pricing_cta_clicked / plan_upgraded.',
  regional_pricing: 'Personalize rule for country = IN with currency INR, symbol ₹, rate 83. Sign in as Arjun to see it.',
  new_checkout_flow: 'Test one_click vs review_step checkout and measure plan_upgraded (tracked server-side).',
  csv_export: 'Beta gate: enable only for plan = enterprise or is_internal = true.',
  ai_insights: 'Evaluated in a Netlify Function with the Node SDK. Target plan != free, and vary the model / max_insights.',
  smart_recommendations: 'Server-side A/B test between popular and personalized algorithms.',
};

function LabRow({ flagKey }) {
  const meta = FLAGS[flagKey];
  const { decisions } = useFe();
  const client = useFeature(flagKey);
  const decision = meta.evaluatedOn === 'client' ? (client.ready ? client : null) : decisions[flagKey];
  return (
    <li className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_2fr_auto] md:items-center">
      <div>
        <code className="text-sm font-semibold">{flagKey}</code>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge color="brand">{meta.kind}</Badge>
          <Badge color={meta.evaluatedOn === 'server' ? 'violet' : 'gray'}>
            {meta.evaluatedOn === 'server' ? <Server className="size-3" /> : <Monitor className="size-3" />} {meta.evaluatedOn}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-slate-600">{HOW_TO[flagKey]}</p>
      <div className="md:text-right">
        {!decision ? <Badge>not evaluated yet</Badge> : decision.enabled ? <Badge color="green">ON for you</Badge> : <Badge color="red">OFF for you</Badge>}
      </div>
    </li>
  );
}

// Variable that tells variations apart, per flag, for colouring the simulator grid.
const VARIANT_VAR = {
  pricing_experiment: 'highlight_plan',
  new_checkout_flow: 'flow',
  onboarding_checklist: 'variant',
  smart_recommendations: 'algorithm',
  dashboard_v2: 'show_forecast',
  brand_theme: 'primary_color',
  announcement_banner: 'tone',
  regional_pricing: 'currency',
  ai_insights: 'model',
  csv_export: 'formats',
};
const SWATCHES = ['bg-brand', 'bg-amber-400', 'bg-emerald-500', 'bg-sky-500'];

// Evaluates a flag for 100 synthetic users to visualise rollouts, A/B splits and sticky bucketing.
function RolloutSimulator() {
  const { client, env } = useFe();
  const [flagKey, setFlagKey] = useState('pricing_experiment');
  const [plan, setPlan] = useState('pro');
  const [cells, setCells] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!client) return;
    setBusy(true);
    const results = await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        client
          .getFlag(flagKey, { id: `sim_user_${i}`, customVariables: { plan, country: 'US', user_type: 'returning', is_internal: false } })
          .then((f) => {
            if (!f.isEnabled()) return null;
            const v = toVariables(f.getVariables())[VARIANT_VAR[flagKey]];
            return v === undefined ? 'on' : String(v);
          })
          .catch(() => null),
      ),
    );
    setCells(results);
    setBusy(false);
  };

  const groups = cells ? [...new Set(cells.filter((c) => c !== null))] : [];
  const colour = (c) => (c === null ? 'bg-slate-200' : SWATCHES[groups.indexOf(c) % SWATCHES.length]);
  const count = (g) => cells.filter((c) => c === g).length;

  return (
    <Card className="mb-6">
      <CardHeader
        title="Rollout & A/B simulator"
        description="Evaluates a flag for 100 simulated users. Colours show which variation each user gets; re-run it and every user keeps the same decision."
        action={env !== 'prod' ? <Badge color="amber">sends impressions to {env}</Badge> : <Badge color="red">prod: use sparingly</Badge>}
      />
      <div className="flex flex-wrap items-end gap-3 px-5 pt-5">
        <div>
          <label className="label" htmlFor="sim-flag">Flag</label>
          <select id="sim-flag" className="input w-56" value={flagKey} onChange={(e) => (setFlagKey(e.target.value), setCells(null))}>
            {Object.keys(FLAGS).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sim-plan">Simulated plan</label>
          <select id="sim-plan" className="input w-40" value={plan} onChange={(e) => (setPlan(e.target.value), setCells(null))}>
            <option value="free">free</option>
            <option value="pro">pro</option>
            <option value="enterprise">enterprise</option>
          </select>
        </div>
        <Button onClick={run} loading={busy} disabled={!client}>
          <Play className="size-4" /> Simulate 100 users
        </Button>
      </div>
      {cells && (
        <div className="flex flex-wrap gap-x-5 gap-y-2 px-5 pt-4 text-sm">
          {groups.map((g) => (
            <span key={g} className="flex items-center gap-2">
              <span className={clsx('size-3 rounded-sm', colour(g))} />
              <code className="text-slate-700">{VARIANT_VAR[flagKey]} = {g}</code>
              <b className="tabular-nums">{count(g)}%</b>
            </span>
          ))}
          <span className="flex items-center gap-2 text-slate-500">
            <span className="size-3 rounded-sm bg-slate-200" /> not in rule / flag off <b className="tabular-nums">{count(null)}%</b>
          </span>
        </div>
      )}
      <div className="grid gap-1.5 p-5" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
        {Array.from({ length: 100 }, (_, i) => (
          <div key={i} title={`sim_user_${i}${cells ? `: ${cells[i] ?? 'off'}` : ''}`} className={clsx('aspect-square rounded-[4px] transition-colors duration-500', !cells ? 'bg-slate-100' : colour(cells[i]))} />
        ))}
      </div>
    </Card>
  );
}

export default function FeatureLab() {
  return (
    <div>
      <PageHeader
        title="Feature Lab"
        description="Every feature flag in Lumen, what it controls, and how to demo it from the Wingify dashboard."
        actions={
          <Badge color="brand">
            <FlaskConical className="size-3" /> {Object.keys(FLAGS).length} flags
          </Badge>
        }
      />
      <RolloutSimulator />
      <Card>
        <CardHeader title="Flags" description="Status is evaluated live for your current user and environment." />
        <ul className="divide-y divide-slate-100">
          {Object.keys(FLAGS).map((k) => (
            <LabRow key={k} flagKey={k} />
          ))}
        </ul>
      </Card>
    </div>
  );
}
