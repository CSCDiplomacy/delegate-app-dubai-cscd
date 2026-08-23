---
tags: [ops]
---

# Deployment

← [[Home]] · see also [[Architecture]]

Hostinger Node hosting via Passenger/LiteSpeed `lsnode`. `app.js` is the startup file; `server.js` is a 9-line alias for hosts whose panel points at `server.js` instead.

**Dubai domain: `delegate.thecscd.org`** (replaces Jakarta's `portal.thecscd.org`). Every hardcoded `portal.thecscd.org` reference needs updating to this — at minimum: `scripts/credential-email.html`'s portal link/button, `APP_URL` env var, any CORS/CSP origin lists, and the [[Jakarta Email Toolkit]]'s templates once that gets rebuilt for Dubai. Confirm whether `HOSTINGER_DEPLOY.md`'s deploy paths/host also change or just the public-facing domain.

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
