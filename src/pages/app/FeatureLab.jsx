import { useState } from 'react';
import clsx from 'clsx';
import { FlaskConical, Monitor, Play, Server } from 'lucide-react';
import { useFe } from '../../fe/FeProvider';
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

// Evaluates a flag for 100 synthetic users to visualise percentage rollouts and sticky bucketing.
function RolloutSimulator() {
  const { client, env } = useFe();
  const [flagKey, setFlagKey] = useState('dashboard_v2');
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
          .then((f) => f.isEnabled())
          .catch(() => false),
      ),
    );
    setCells(results);
    setBusy(false);
  };

  const on = cells ? cells.filter(Boolean).length : 0;
  return (
    <Card className="mb-6">
      <CardHeader
        title="Rollout simulator"
        description="Evaluates a flag for 100 simulated users. Re-run it and the same users keep the same decision (deterministic bucketing)."
        action={env !== 'prod' ? <Badge color="amber">sends impressions to {env}</Badge> : <Badge color="red">prod: use sparingly</Badge>}
      />
      <div className="flex flex-wrap items-end gap-3 px-5 pt-5">
        <div>
          <label className="label">Flag</label>
          <select className="input w-56" value={flagKey} onChange={(e) => setFlagKey(e.target.value)}>
            {Object.keys(FLAGS)
              .filter((k) => FLAGS[k].evaluatedOn === 'client')
              .map((k) => (
                <option key={k}>{k}</option>
              ))}
          </select>
        </div>
        <div>
          <label className="label">Simulated plan</label>
          <select className="input w-40" value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="free">free</option>
            <option value="pro">pro</option>
            <option value="enterprise">enterprise</option>
          </select>
        </div>
        <Button onClick={run} loading={busy} disabled={!client}>
          <Play className="size-4" /> Simulate 100 users
        </Button>
        {cells && (
          <p className="ml-auto text-sm">
            <span className="text-2xl font-semibold text-brand">{on}%</span> <span className="text-slate-500">received the feature</span>
          </p>
        )}
      </div>
      <div className="grid grid-cols-20 gap-1.5 p-5" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
        {Array.from({ length: 100 }, (_, i) => (
          <div
            key={i}
            title={`sim_user_${i}`}
            className={clsx('aspect-square rounded-[4px] transition-colors duration-500', !cells ? 'bg-slate-100' : cells[i] ? 'bg-brand' : 'bg-slate-200')}
          />
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
