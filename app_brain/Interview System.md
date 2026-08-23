---
tags: [security, backend]
---

# Interview System

← [[Home]] · see also [[Event Lifecycle Stages]], [[Auth and Gating]]

Security-critical, per `CLAUDE.md`: **the AidaForm URL is a secret.** Anyone who has it can submit without logging in — so the URL never reaches the client bundle, and every safeguard here exists to compensate for embedding a third-party form Claude/the team doesn't control.

## The flow

1. `AIDAFORM_BASE_URL` lives in server env only, never shipped to the browser.
2. `GET /api/me/interview` (`routes/me.js`) returns the form URL only to an authenticated applicant who hasn't yet submitted (`interview_status !== 'submitted'` and `status !== 'enrolled'`), with the applicant's `interview_token` (a per-row UUID) and `applicant_id` appended as hidden prefill fields — field *names* configurable via `AIDAFORM_TOKEN_FIELD`/`AIDAFORM_APPLICANT_FIELD` env vars.
3. Applicant fills out the embedded AidaForm.
4. `POST /api/interview/webhook/:secret` (`routes/interview.js`) receives AidaForm's submission payload. Validates the path/header secret (constant-time compare), rate-limited 30/min.
5. `collectUuids` walks the **entire** JSON payload looking for UUID-shaped strings, because AidaForm's field nesting isn't fixed/predictable.
6. Matches found UUIDs against `delegates.interview_token`, flips `interview_status → 'submitted'` **idempotently** (`WHERE interview_status='not_started'`) — retries/double-submits are no-ops.
7. Fires a best-effort `usage_events` insert (`interview_submitted`).

## Residual limitation (inherent, not a code bug)

Once an applicant loads the form, they hold its URL and could pass it on. The per-applicant token means an *untokened* submission is rejected and a *duplicate* submission is a no-op — adequate for a hiring-style process, **not cryptographically airtight**. This is a known, accepted tradeoff of iframing a third-party form; don't try to "fix" it during the Dubai fork without a product conversation first.

## Current Jakarta state

`showInterviewTab()` in `authStore.ts` is hardcoded to `false` — interviews are closed for this cohort. The screen (`client/src/components/screens/Interview.tsx`) and the whole webhook/token mechanism are fully intact and untouched, just unreachable via the UI. `Interview.tsx` currently hardcodes `SHARED_FORM_URL`, `FORM_ID='form202405'`, and `SUPPORT_EMAIL='contact@thecscd.org'` — these are this cohort's specific AidaForm account details and will need fresh values for Dubai's next interview cycle (form/account can likely be reused if CSCD keeps the same AidaForm account — verify before assuming).

## Related

[[Event Lifecycle Stages]] · [[Auth and Gating]] · [[Data Model]]
