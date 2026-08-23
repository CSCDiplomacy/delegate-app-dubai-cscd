---
tags: [architecture]
---

# Architecture

← [[Home]]

## Stack

**Hybrid: static JSON for content, Supabase for auth + dynamic data.**

- **Backend**: Node/Express (`app.js`), deployed to **Hostinger Node hosting via Passenger/LiteSpeed `lsnode`**. See [[Deployment]] for the gotchas.
- **Frontend**: React 19 + TypeScript + Vite, in `client/`. Zustand for state, **no router** — screen switching is a state machine, see [[Frontend Structure]]. Tailwind v4, CSS-first config, see [[Design System]].
- **Database/Auth**: Supabase (Postgres + Supabase Auth). **Jakarta** project `Delegate_app_cscd` (ref `govbfxytrdxpmutxbkds`, eu-central-1). A separate Supabase project `cscd-app` (`pvaygdxzjisphyryepiq`) is the unrelated "Spaces" system — out of scope, never touch it. **Dubai** uses a brand-new, separate project (ref `pjdbvjiemguepdyzhlft`, created 2026-08-23) on the **Diplomark account**, not the Jakarta org — it is not reachable via the Supabase MCP connected to this session (see [[Known Issues and Dead Code]]/session memory `dubai-supabase-no-mcp`). `SUPABASE_URL`/`SUPABASE_ANON_KEY` in this repo's `.env` were updated to the Dubai project on 2026-08-23; `SUPABASE_SERVICE_ROLE_KEY` and the base schema (delegates/favourites/feedback/announcements/usage_events tables — see [[Data Model]]) still need setting up on the new project.
- **Third-party forms embedded via iframe**: AidaForm (interview) and Cognito Forms (registration/payment) — both allowlisted in Express's Helmet CSP (`app.js` `scriptSrc`/`connectSrc`/`frameSrc`).
- **Email**: Resend API, used by `scripts/send_credentials.py` (onboarding) and `lib/reminders.js` (rundown reminders, cron).

## Why "hybrid"

Content that's the same for every delegate and doesn't need per-user access control (rundown, visits, speakers, hotel reference, contact) lives as flat JSON in `data/*.json`, loaded once into memory at server boot (`routes/public.js`) and served with a 5-minute HTTP cache. Content that's per-user or needs auth (profile, favourites, interview status, results, vouchers) lives in Supabase and goes through `requireAuth` (`lib/supabase.js`).

This split matters for the Dubai fork: **rewriting `data/*.json` is a content edit, not a schema change** — see [[Jakarta Branding Inventory]] for what's actually populated right now vs still placeholder.

## Repo layout (top level, active code only)

```
app.js              — Express entrypoint (Passenger startup file, does all the work)
server.js            — 9-line alias: module.exports = require('./app')
routes/               — public.js, data.js, me.js, interview.js, registration.js, analytics.js
lib/                  — supabase.js (auth client + requireAuth), reminders.js (cron)
data/                 — rundown.json, visits.json, hotels.json, speakers.json, contact.json, checkin.json
client/               — React app (src/, dist/ build output, public/ static assets)
public/               — legacy vanilla frontend (retired reference) + fallback static layer for /img, manifest.json, sw.js
scripts/              — provisioning + one-off reconciliation tools, see [[Operational Scripts]]
scripts/migrations/   — incremental SQL ALTERs (NOT a full schema — see [[Data Model]])
```

Two things found during this audit that aren't "architecture" so much as accumulated cruft — see [[Known Issues and Dead Code]] for full detail:
- `client/client/` — a stray, empty (no tracked files) nested scaffold, not part of the real app.
- `color.md` at repo root — stale documentation from an *earlier* Frankfurt/CIPES fork, predates the current Jakarta theme entirely. Do not use it as a design reference.

## Build / run

```bash
npm install
npm run build      # cd client && npm install && npm run build → outputs client/dist
npm start          # node app.js, serves client/dist (falls back to public/)
# Dev: npm start (API) + cd client && npm run dev (Vite :5173, /api proxied)
```

Smoke test after any deploy: `/health`, `/api/config` (must return only public keys), `/api/me/interview` must 401/503 without a Bearer token.

## Related

[[Data Model]] · [[Deployment]] · [[Frontend Structure]] · [[Event Lifecycle Stages]]
