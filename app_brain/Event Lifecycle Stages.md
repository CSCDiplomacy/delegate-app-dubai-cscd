---
tags: [lifecycle, core]
---

# Event Lifecycle Stages

← [[Home]]

The portal is **one Express app + one `delegates` table** that has worn five different faces over the life of YPDS Jakarta 2026. Nothing gets rebuilt between stages — a delegate's row just accumulates more status columns, and the UI/routes read those columns to decide what to show. See [[Data Model]] for the exact column-by-column state machine this section summarizes narratively.

This is the most important note for the Dubai fork: **Dubai will re-enter this same lifecycle from stage 1**, so the code paths for every stage still exist and still matter, even though the Jakarta cohort has moved past most of them.

## Stage 1 — Applications open, interviews conducted

- Delegates are provisioned as `status='unenrolled'` rows by `scripts/seed-delegates.js` (creates a Supabase Auth user + `delegates` row per CSV line, emails credentials via `scripts/send_credentials.py`).
- Portal shows the **Interview tab**: an embedded AidaForm, gated by `showInterviewTab()` in `authStore.ts`. See [[Interview System]] for the token/webhook security model.
- Every event content section (Rundown, Visits, Speakers, Hotel, Schedule) shows **"Coming Soon"** — this is intentional, for engagement, not a bug.
- `interview_status` moves `not_started → submitted` via the AidaForm webhook (`routes/interview.js`).

**Current Jakarta state**: `showInterviewTab()` is now **hardcoded to `false`** in `authStore.ts` — interviews are closed. The screen and route code are fully intact, just unreachable. For Dubai this flips back on at launch.

## Stage 2 — Selection / reconciliation

- Interviews close. `scripts/reconcile-interviews.js` cross-matches AidaForm CSV exports against `delegates` (email → applicant_id → name), sets `interview_status='submitted'` and `result_status='evaluated'` or `'not_evaluated'`.
- `scripts/check_missing_interviews.py` is a diagnostic pass to catch webhook/export mismatches.
- `scripts/set-underprocessing.js` bulk-moves interviewed, non-enrolled delegates to `status='underprocessing'` — a transient "we're deciding" state between applicant and delegate.

This is a **one-off migration stage**, not a standing feature — these scripts are re-run tools, not continuously-live code paths.

## Stage 3 — Results & scholarship tiers

- The evaluation workbook (`YPDS Video submissions - Evaluation_mapped.xlsx`, sheets `Self`/`Partial`/`Full`/`Alumni`) is the **single source of truth**, independent of whether someone interviewed.
- `scripts/reconcile-tiers.js` sets `delegates.result_tier` (`self` / `partial` / `full` / `alumni` / `null`) by email → alt-email → applicant_id → name matching, with disagreements skipped and reported (never guessed).
- The portal renders outcomes **inline on the Dashboard** (no dedicated Results screen — see [[Frontend Structure]]).
- See [[Results and Tiers]] for the full tier table and the Cognito form-id mapping this stage wires up.

**Current Jakarta counts** (per `CLAUDE.md`, as of the reconciliation run): full 10, partial 69, self 80, alumni 2, 3 untiered (unresolved data issues).

## Stage 4 — Registration (self/partial pay, full confirms directly)

- `partial` and `self` tier delegates get a **Cognito Forms** embed (form 79 / form 78 respectively — see [[Results and Tiers]] for why this mapping is counter-intuitive) for registration + payment.
- `full` tier delegates hit `POST /api/me/accept-scholarship` instead — no form, no payment, just a confirmation click, idempotent via `scholarship_accepted_at`.
- `routes/registration.js` receives Cognito's webhook, matches the payload's applicant-id text (regex `YPDS-JKT-F?\d+`) against `delegates.applicant_id`, flips `registration_status → 'submitted'`. Does **not** touch `status` — actual enrollment (`status='enrolled'`) is a manual team step, deliberately decoupled from payment confirmation.
- See [[Registration Flow]] for the full webhook mechanics — note the applicant-id regex is a **functional dependency**, not just branding text, and needs a new ID scheme + regex update for Dubai.

## Stage 5 — Event execution (current, live now)

- Enrolled delegates (`status='enrolled'`) see the full app: Rundown, Visits/Venue, Hotel, Schedule (favourited sessions), Contact.
- `data/*.json` is now populated with real Jakarta content (not placeholders — see [[Jakarta Branding Inventory]] for exactly what's filled vs still empty).
- `lib/reminders.js` runs a per-minute cron pushing email reminders ahead of rundown items.
- A **temporary, session-only feature** — the coordinator "Activity" tab (`CoordinatorActivity.tsx`, `coordinatorGroups.ts`) — is bolted on for this specific cohort's group activity, with its own file-level comment saying to delete it after the session. See [[Known Issues and Dead Code]].

**This is where Jakarta is right now** (2026-08-23, mid-event, per the recent commits rebuilding Day 3's rundown and removing some visits).

## What this means for Dubai

Dubai doesn't skip stages — it starts back at Stage 1 with a fresh cohort. The fork work is therefore less "delete the interview/results code" and more "re-skin + re-point every stage's content and secrets," while deciding what to do with Jakarta-only bolt-ons like the Activity tab. See [[Jakarta Branding Inventory]] for the itemized checklist once Dubai's specifics are known.

## Related

[[Data Model]] · [[Auth and Gating]] · [[Interview System]] · [[Results and Tiers]] · [[Registration Flow]] · [[Operational Scripts]]
