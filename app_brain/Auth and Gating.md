---
tags: [frontend, auth]
---

# Auth and Gating

← [[Home]] · see also [[Data Model]], [[Frontend Structure]]

## The two-stage model

The portal runs **before and during** the event off one table (`delegates`), split by `status`:

- **`unenrolled` = applicant.** Sees the Interview tab (gated separately, currently off — see [[Interview System]]) and a dashboard that leads with it. Every event section shows **"Coming Soon"** on purpose — tabs stay visible for engagement even with no data.
- **`underprocessing`** = interviewed, awaiting a decision. A transient state between applicant and delegate (added mid-event, see [[Data Model]]).
- **`enrolled` = confirmed delegate.** Interview tab drops away; the full event app opens up as `data/*.json` gets populated.

**Gating is UX, not security.** The security boundary is the server: every per-user route goes through `requireAuth` (`lib/supabase.js`), which verifies a Supabase Auth Bearer JWT. Client-side gating just decides what to *show* — it never gates what's fetchable.

## `authStore.ts` (Zustand)

State: `session`, `profile`, `eventName` (defaults to `'YPDS Jakarta 2026'` — see [[Jakarta Branding Inventory]] — overridden by `GET /api/config`'s server-side `EVENT_NAME` env var if set), `initializing`, `busy`, `error`, `recoveryMode`.

Actions: `init()` (fetch `/api/config`, construct the Supabase client, restore session, subscribe to auth changes), `login`, `logout` (full page reload), `resetPassword`, `updatePassword`, `refreshProfile` (`GET /api/me/profile`).

Gating helpers (module-level exports, **not** store fields):
- `isApplicant(profile)` → `status !== 'enrolled'`
- `showInterviewTab()` → **hardcoded `false` right now** — interviews are closed for this cohort; the comment in the file explains why. Flip this back to a real check for Dubai's next interview cycle.
- `isUnderReview(profile)` → applicant + (`result_status==='evaluated'` or legacy `status==='underprocessing'`/`interview_status==='submitted'`)

⚠️ **Doc drift**: `CLAUDE.md` describes a `showResultsTab()` helper (`isApplicant && !!result_tier`) living in `authStore.ts`. It does not exist there as named — results gating is inlined directly inside `Dashboard.tsx` (`const tier = profile?.result_tier || null`). See [[Known Issues and Dead Code]].

## Component-level gating: `ComingSoon.tsx`

Screens for un-published content render `ComingSoon` instead of hiding the tab entirely — this is deliberate (keeps the nav visible so applicants stay engaged even before there's real content). Each screen owns its own "coming soon" copy, e.g. `Rundown.tsx`'s copy currently says *"The programme for Jakarta is coming together..."* — event-specific text that needs rewriting per screen for Dubai, not a single global toggle.

## `GET /api/me/profile`

Returns `name, email, applicant_id, status, interview_status, result_status, result_tier, scholarship_accepted_at, registration_status, registration_submitted_at` — all individually defaulted server-side (`status: 'unenrolled'`, `interview_status: 'not_started'`, `result_status: 'pending'`, `result_tier: null`, `registration_status: 'not_started'`) so a freshly-provisioned delegate always gets a coherent, fully-shaped profile object.

## Related

[[Data Model]] · [[Frontend Structure]] · [[Results and Tiers]] · [[Known Issues and Dead Code]]
