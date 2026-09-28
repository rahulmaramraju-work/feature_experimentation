# Lumen: Wingify Feature Experimentation demo

Lumen is a fictional product-analytics SaaS built to showcase **Wingify Feature Experimentation (FE)** end to end:
client-side and server-side flags, rollouts, A/B tests, personalization, remote config, kill switches, event tracking and multiple environments.

## Stack

| Layer | Tech |
| --- | --- |
| Front end | React 19 + Vite, Tailwind CSS v4, Recharts |
| API | Netlify Functions (`netlify/functions/api.js`) |
| Database | Netlify Blobs (users, projects, team, invoices, activity) |
| Auth | bcrypt-hashed passwords, signed JWT in an httpOnly cookie |
| Feature flags | `vwo-fme-react-sdk` (browser) + `vwo-fme-node-sdk` (server) |

## Demo accounts

Seeded automatically on first sign-in. Password for all: `lumen-demo-2026` (or use the one-click buttons on `/login`).

| Email | Plan | Why it's interesting |
| --- | --- | --- |
| maya@northwind.io | Free | New user (`user_type = new`), US |
| arjun@acmeretail.in | Pro | India (`country = IN`) for regional pricing |
| sofia@globex.com | Enterprise | Large EU company |
| admin@lumen.dev | Enterprise, admin | Internal user; can change anyone's plan at `/app/admin` |

## Feature flags

| Key | Type | Where | Variables |
| --- | --- | --- | --- |
| `announcement_banner` | Kill switch | Every page | `message`, `tone` (info/success/warning/critical), `cta_text`, `cta_link` |
| `brand_theme` | Remote config | Whole site | `primary_color` (hex), `badge_text` |
| `dashboard_v2` | Progressive rollout | Dashboard | `layout` (classic/insights_first), `show_forecast` |
| `onboarding_checklist` | Personalization | Dashboard | `variant` (compact/guided) |
| `pricing_experiment` | A/B test | Pricing + Billing | `headline`, `highlight_plan`, `cta_text`, `show_annual_savings` |
| `regional_pricing` | Personalization | Prices | `currency`, `symbol`, `rate` |
| `new_checkout_flow` | A/B test | Upgrade checkout | `flow` (one_click/review_step), `show_trust_badges` |
| `csv_export` | Beta gate | Reports | none |
| `ai_insights` | Server-side | Insights | `model`, `max_insights` |
| `smart_recommendations` | Server-side A/B | Insights | `algorithm` (popular/personalized) |

User context attributes (`customVariables`): `plan`, `country`, `company_size`, `role`, `is_internal`, `days_since_signup`, `user_type`.

Tracked events: `signup_completed`, `pricing_cta_clicked`, `checkout_started`, `plan_upgraded` (server-side), `project_created`,
`report_exported`, `team_invite_sent`, `onboarding_step_completed`, `insight_viewed`.

## Environments

| Netlify context | Wingify environment |
| --- | --- |
| Production (`main`) | Prod |
| Branch deploy of `staging` | Staging |
| Deploy previews / local | Dev |

Presenters can also switch environment live from the **FE Control Tower** (bottom-right button).

## Run locally

```bash
cp .env.example .env   # fill in the values
npm install
npm run dev            # http://localhost:8888 (Netlify dev: site + functions + Blobs)
```

## Deploy on Netlify

1. Import this GitHub repo in Netlify (build command and publish dir come from `netlify.toml`).
2. Add the variables from `.env.example` under Site configuration → Environment variables.
3. Optional: in Wingify, add a webhook to `https://<site>/api/webhooks/wingify` so the server SDK refreshes instantly.
