# Lumen: feature flag demo

Lumen is a fictional product-analytics SaaS used to demonstrate feature flags visually.
It has one simulated flag, **`master`**, controlled from the **Control Tower** (bottom-left button).
No flag SDK or external service is involved: the flag lives in the browser and syncs across open tabs.

## The `master` flag

| Variable | Type | Control (flag OFF) | Default when ON | What changes |
| --- | --- | --- | --- | --- |
| `banner_count` | number 1–4 | 1 | 3 | Promo banners stacked at the top of every page |
| `support_bot` | boolean | off | on | Floating "Lumi" support chat bot, bottom-right |
| `navigation` | top / side | top | side | App navigation as a top bar or a sidebar |
| `theme_color` | colour | `#4f46e5` | `#0f766e` | Primary colour across the product |

In the Control Tower you can flip the flag, edit each variable, delete variables (the site falls back to control),
create new ones, compare control vs live, and read the change history. **Shift+M** flips the flag from anywhere.

Visual cues: a toast lists every change, changed areas flash with a `master · variable → value` tag,
and **Show flag outlines** draws labelled outlines around every flag-controlled area.

## Stack

React 19 + Vite, Tailwind CSS v4, Netlify Functions (API), Netlify Blobs (database), cookie-based auth.

## Demo accounts

Password for all: `lumen-demo-2026` (or use the one-click buttons on `/login`).
`maya@northwind.io` (Free), `arjun@acmeretail.in` (Pro), `sofia@globex.com` (Enterprise), `admin@lumen.dev` (Admin).

## Run locally

```bash
cp .env.example .env   # set JWT_SECRET
npm install
npm run dev            # http://localhost:8888
```

Deploys to Netlify from `main`; the only required environment variable is `JWT_SECRET`.
