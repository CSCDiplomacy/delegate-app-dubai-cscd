---
tags: [ops]
---

# Deployment

← [[Home]] · see also [[Architecture]]

Hostinger Node hosting via Passenger/LiteSpeed `lsnode`. `app.js` is the startup file; `server.js` is a 9-line alias for hosts whose panel points at `server.js` instead.

**Dubai domain: `delegate.thecscd.org`** (replaces Jakarta's `portal.thecscd.org`). Every hardcoded `portal.thecscd.org` reference needs updating to this — at minimum: `scripts/credential-email.html`'s portal link/button, `APP_URL` env var, any CORS/CSP origin lists, and the [[Jakarta Email Toolkit]]'s templates once that gets rebuilt for Dubai.

### Dubai deploy pipeline — confirmed 2026-08-23, different from Jakarta's

`HOSTINGER_DEPLOY.md` documents Jakarta's `portal.thecscd.org` setup (manual
SSH rsync of the backend into a separate `nodejs/` app root after every
push — the "trap"). **Dubai does not work that way.** Same Hostinger
account, same SSH login (`ssh -p 65002 u441737725@46.202.156.8` — see
`DEPLOY_NOTES.local.md`), but `delegate.thecscd.org` is a **sibling domain
folder** (`domains/delegate.thecscd.org/`) on a newer, fully-automated
versioned pipeline:

```
domains/delegate.thecscd.org/
├── public_html/          # just a .htaccess — Passenger serves straight out of hbuilds/current
└── hbuilds/
    ├── last-source/       # latest git pull
    ├── versions/<uuid>/   # a full build (npm install + npm run build already run — client/dist is real, populated) landed here
    ├── current -> versions/<uuid>   # symlink Passenger's PassengerAppRoot points at (…/hbuilds/current/nodejs)
    ├── config/
    └── logs/
```

**A plain `git push origin main` is enough** — no manual rsync, no manual
worker restart needed, at least for a frontend-only change (verified: pushed
a commit touching only `client/src/styles/globals.css` + docs, and within
the pipeline's own cadence `hbuilds/current` re-pointed to a fresh version
whose `client/dist/assets/*.css` contained the new content, confirmed both
by grepping the file over SSH and by an actual Playwright screenshot of
`https://delegate.thecscd.org/`). Whether *backend* changes (`routes/`,
`lib/`, `package.json`) also deploy automatically through this same pipeline
is **not yet verified** — only a frontend/CSS change has been tested so far.
**Do not assume Jakarta's manual-rsync trap applies here** — check this
pipeline's actual behavior on a backend change before assuming you need to
SSH in for it.

If you do need to poke at it directly: `readlink hbuilds/current` shows the
live version id; `hbuilds/last-source`'s `git log` shows the latest pulled
commit (compare to `origin/main` to confirm it caught up).

## The trap (documented in `HOSTINGER_DEPLOY.md`)

On `portal.thecscd.org`, the GitHub-connected deploy only refreshes the **static frontend** (`public_html/` + `public_html/.builds/last-source`). It does **not** sync the separate Passenger app root (`nodejs/`), which is what actually serves the API. Any backend change (`app.js`, `routes/`, `lib/`, `data/`, `package.json`) needs a **manual SSH rsync** of just those paths into `nodejs/` (explicitly excluding `client/`, `public/`, `.env`, `node_modules/`, `.git/`), followed by killing the running Node worker — `touch tmp/restart.txt` doesn't reliably respawn it on this setup.

**Verification after any backend deploy**: `curl /health`, `curl -o /dev/null -w "%{http_code}" /api/config` (expect 200), check `nodejs/console.log` for a fresh listening line.

Both `app.js` and `server.js` call `app.listen()` **unconditionally** (no `require.main === module` guard) — this is required for Passenger/LiteSpeed's `lsnode` boot detection; guarding it silently breaks the boot.

There's a known, unresolved open issue: the live CSP response header doesn't show helmet's full directive set in production — possibly a CDN/edge header rewrite. Not blocking, just noted in the deploy doc as unexplained.

## Env vars (`.env.example`)

| var | purpose |
|---|---|
| `NODE_ENV`, `PORT`, `APP_URL` | runtime basics |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | public, browser-safe |
| `SUPABASE_SERVICE_ROLE_KEY` | secret, server-only |
| `RESEND_API_KEY`, `FROM_EMAIL` | email sending |
| `EVENT_NAME` | branding string surfaced via `/api/config`, default `CSCD Delegate App` |
| `REMINDER_LEAD_MINUTES` | rundown reminder lead time, default 60 |
| `AIDAFORM_BASE_URL`, `AIDAFORM_TOKEN_FIELD`, `AIDAFORM_APPLICANT_FIELD`, `AIDAFORM_WEBHOOK_SECRET` | interview form, see [[Interview System]] |
| `COGNITO_WEBHOOK_SECRET` | registration webhook, see [[Registration Flow]] |

⚠️ `ANALYTICS_TOKEN` (used by `routes/analytics.js` to gate the internal analytics dashboard) is **not documented in `.env.example`** — a gap to fix while touching this file for Dubai anyway.

**Never read `.env` itself** — only `.env.example` (holds no live secrets).

## Related

[[Architecture]] · [[Interview System]] · [[Registration Flow]]
