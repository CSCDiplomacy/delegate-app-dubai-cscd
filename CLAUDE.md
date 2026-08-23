# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A mobile-first **web app / PWA** for **CSCD** (Center for Strategy and Cultural
Diplomacy) — **YPDS Jakarta 2026**. Node/Express backend + a **React 19 +
TypeScript + Vite** frontend in [client/](client/) (Zustand stores, Tailwind v4
CSS-first config, no router — screen switching via `uiStore`). Build with
`npm run build` (outputs `client/dist/`, which Express serves; `public/` is
still served as a fallback layer for `/img/*`, `/manifest.json`, `/sw.js`).
Deploys to **Hostinger Node hosting (Passenger)**; `app.js` is the startup file.
The old vanilla frontend ([public/js/app.js](public/js/app.js),
[public/css/app.css](public/css/app.css)) is retired reference code — the
behavior it encodes (gating, favourites ids, interview states) is the spec the
React app mirrors.

It was forked from the CIPES YEF Frankfurt "delegate app" and re-skinned. The
codebase still uses `delegate`/`delegates` throughout as the noun for a portal
user — an applicant and an enrolled delegate are the same table row at different
`status` values.

## The two-stage model (read before touching gating)

The portal runs **before and during** the event and serves one table,
`delegates`, split by a `status` flag (the client's "enrolled / un-enrolled"):

- **`unenrolled` = applicant.** Sees the **Interview** tab (an embedded AidaForm)
  and a dashboard that leads with it. Every event section (Rundown, Visits,
  Speakers, Hotel, Schedule) shows **"Coming Soon"** — the tabs stay visible on
  purpose (engagement), they just have no data yet.
- **`enrolled` = confirmed delegate.** Interview tab drops away; the full event
  app opens up as data is published.

Client gating lives in
[client/src/stores/authStore.ts](client/src/stores/authStore.ts)
(`isApplicant()`, `showInterviewTab()`) and the screens gate themselves with
[client/src/components/ComingSoon.tsx](client/src/components/ComingSoon.tsx).
It is driven by `status` + `interview_status` from `GET /api/me/profile`.
Favourite/session ids are `` `${day.date}T${item.time}` `` (must match the
`favourites.session_id` rows in Supabase).
**Gating is UX, not security** — the security boundary is the server (below).

## Results & scholarship tiers (current phase — read before touching results)

Interviews are **over** and results are **published**. Outcomes render **inline
on the Dashboard**; there is no Results screen (it was built, then removed —
don't re-add one).

**`result_tier` is the single source of truth for what a delegate sees.**
Whether they interviewed is *irrelevant*: the evaluation workbook is the
authority, and many tiered applicants never interviewed. Do **not** re-introduce
`result_status` / `interview_status` into results gating — that was an earlier
model and caused wrong screens.

| tier | meaning | what they see |
|---|---|---|
| `full` | scholarship covers the fee | congratulations, **no form**; team confirms directly |
| `partial` | pays 50% | congratulations + **Cognito form 79** (registration + payment) |
| `self` | pays in full | congratulations + **Cognito form 78** (registration + payment) |
| `alumni` | parked | placeholder card — **final treatment still TBD from the client** |
| `null` | no outcome on record | **nothing renders** |

**Cognito form ids are counter-intuitive — verify before changing.** Form **78**
is titled *"Self Financed (With Scholarship)"* and belongs to **`self`**; form
**79** is *"Partial (50% Scholarship)"*. An earlier spec mapped 78 to `full`,
which showed a payment form to people who had already won a full scholarship.
Full-scholarship delegates owe nothing, so they get **no form at all**.
Ids live in [client/src/components/CognitoForm.tsx](client/src/components/CognitoForm.tsx);
the embed needs both the iframe and Cognito's `iframe.js` loader (React can't
render `<script>` from JSX), and `www.cognitoforms.com` must stay in the
`frameSrc` **and** `scriptSrc` CSP directives in [app.js](app.js).

Gating helper: `showResultsTab()` in
[authStore.ts](client/src/stores/authStore.ts) → `isApplicant && !!result_tier`.
Dashboard renders `{tier && <TierResult/> + <SelectedBanner/>}`.

**Data provenance.** `result_tier` was set by
[scripts/reconcile-tiers.js](scripts/reconcile-tiers.js) from the
`Self`/`Partial`/`Full`/`Alumni` sheets of
`YPDS Video submissions - Evaluation_mapped.xlsx` (exported to
`reponses/tiers.csv`). Use those four sheets, **not** the workbook's
`Evaluation` sheet — its status column has typos and combined values
(`Sef`, `Full/Partial`). Matching is email → alternate email → `applicant_id`
(`YPDS-JKT-F{ID}`, where ID is the workbook's ID column) → exact normalised
name. Email and applicant_id are **cross-checked**; disagreements are reported
and skipped, never guessed. Current DB: **full 10, partial 69, self 80,
alumni 2, 3 untiered.** The 3 untiered are unresolved data issues (one applicant
has no delegate row; one has an applicant_id belonging to someone else; one is
absent from the workbook) — they see nothing until resolved.

`result_status` (`pending`/`evaluated`/`not_evaluated`) still exists from the
interview-reconciliation phase and is still returned by the API, but **no longer
drives any results UI.**

## The interview (security-critical)

The AidaForm URL is a **secret**: anyone who has it can submit without logging
in. So:

- `AIDAFORM_BASE_URL` lives in the server env and is **never** in the client
  bundle. `GET /api/me/interview` ([routes/me.js](routes/me.js)) returns it only
  to an authenticated applicant who has not yet submitted, with the applicant's
  `interview_token` (a per-row UUID) appended as a hidden prefill field.
- `POST /api/interview/webhook/:secret`
  ([routes/interview.js](routes/interview.js)) receives AidaForm's submission,
  verifies the path/header secret, finds the applicant by the token embedded in
  the payload, and flips `interview_status → submitted`. It is **idempotent**
  (guarded `WHERE interview_status='not_started'`) so retries/double-submits are
  no-ops. Token extraction (`collectUuids`) walks the whole payload because
  AidaForm's field nesting isn't fixed.

Residual limitation (inherent to embedding a third-party form, not fixable in
code): once an applicant loads the form they hold its URL and could pass it on.
The token means untokened submissions are rejected and duplicates ignored —
adequate for hiring, not cryptographically airtight.

## Architecture

**Hybrid: static JSON for content, Supabase for auth + dynamic data.**

- **Static content** in [data/*.json](data/) (rundown, visits, speakers, hotels,
  checkin, contact). All currently **empty placeholders** (marked `_note`) — an
  empty array/object is what makes a screen render Coming Soon. Fill them in as
  the client publishes real Jakarta data.
- **Supabase (Postgres)** holds `delegates`, `favourites`, `feedback`,
  `announcements`, `usage_events`. Auth = **Supabase Auth** (email + password),
  **no self-registration** — accounts are pre-created by
  [scripts/seed-delegates.js](scripts/seed-delegates.js) (admin API, generated
  passwords). RLS: a delegate reads only their own row; the service-role key is
  server-only and never reaches the browser.

## Build / run

```bash
npm install
npm run build             # builds the React client → client/dist (runs client npm install too)
npm start                 # Express on PORT (default 3000); app.js = Passenger startup
# Dev with hot reload: npm start (API) + `cd client && npm run dev` (Vite on :5173, /api proxied)
node scripts/seed-delegates.js scripts/delegates.sample.csv creds-out.csv   # provision (needs service-role key)
python3 scripts/send_credentials.py creds-out.csv                           # email logins (needs RESEND_API_KEY)
```

Smoke test: `/health`, `/api/config` (public keys only), and
`/api/me/interview` must **503/401 without a Bearer token**. Env vars documented
in [.env.example](.env.example) — **never read `.env`** (holds live secrets;
refer to vars by name only).

## Supabase project

**`Delegate_app_cscd`** (ref `govbfxytrdxpmutxbkds`, eu-central-1). The MCP is
connected with read-write. A **separate** project `cscd-app`
(`pvaygdxzjisphyryepiq`) is the **Spaces** system — **out of scope, do not
touch.** Apply schema changes as reviewed migrations. The pre-Jakarta Frankfurt
data was backed up to `backup_database/` (gitignored, PII) and then wiped.

## Design system

Jakarta neo-brutalist theme in [public/css/app.css](public/css/app.css):
cream `#F9F6F0` + near-black `#050505`, **crimson `#EA0558`** = primary action
(`--signal`), **electric yellow `#E6EB1C`** = accent (`--brass`), **hard offset
shadows** (no blur). Fonts: **Cinzel** (display), **Cormorant Garamond**
(italic accent), **Lato** (body). Light + dark via `[data-theme]` on `<html>`,
persisted in `localStorage` (`cscd_theme`).

**Invariant: no literal brand hex below the two token blocks** (`:root` +
`[data-theme="dark"]`). Every component reads CSS variables (including
`--signal-rgb` / `--brass-rgb` / `--on-surface-2-rgb` for `rgba()` cases), so a
future event re-skins by editing only those two blocks. `typeAccent` in app.js
also uses `var(--type-*)` tokens — keep JS and CSS in sync. Check before adding
any color: `grep -nE '#[0-9A-Fa-f]{3,6}' public/js/app.js` and the CSS body
should stay clean.

## Deferred (from client voice notes — not built yet)

LMS / evaluation portal / Spaces integration; post-commitment tasks + incubation
centres tab; virtual-forum paid access + course placement for non-selected
applicants; funding-status changes (self-funded → scholarship). The schema is
shaped so these bolt on without another wipe.
