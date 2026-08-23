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

## Current Dubai state

Stale note superseded — this section described the Jakarta cohort (interviews
closed, tab hardcoded off). For Dubai, per [[Dubai Fork Progress]]'s
"Interview readiness" entry: `showInterviewTab()` in `authStore.ts` is
re-enabled (`isApplicant(profile)`), and `Interview.tsx` points
`SHARED_FORM_URL` at the real Dubai AidaForm
(`https://15158.aidaform.com/interview-ysf-dubai-2026`), preferring the
server's per-applicant tokenized URL when available.

**2026-08-23**: the applicant self-confirm checkbox (Step 2 — "I have
already submitted the form above," a fallback that called `POST
/me/interview/mark-taken` for cases where AidaForm's webhook didn't fire)
was **hidden from the UI** per the client. The screen now shows only the
embedded form; `interview_status` flips to `'submitted'` exclusively via the
webhook (step 6 above). The backend endpoint and the flow it triggers are
untouched — only the client-side checkbox/warning/confirm-modal were
removed from `Interview.tsx` — so it can be reinstated quickly if the
webhook proves unreliable in practice. Worth watching: this removes the only
safety net for a missed/failed webhook call, so a delegate who submits but
whose webhook silently fails now has no way to self-correct from the UI —
they'd need to be caught manually (e.g. cross-checking AidaForm's own
submission list against `delegates.interview_status`).

**2026-08-23 (later)**: the live Dubai AidaForm has no hidden `candidate_token`
field, so every real submission was falling through to a fallback in
`extractFallbackIdentity`/the webhook handler that read the visible
"Applicant ID" answer plus the email answer and only matched if **both**
agreed with the same delegate row. Per the client, this was dropping
legitimate submissions (typo'd/personal email vs. the registered email) — no
status flip and no confirmation email. Changed to try the visible applicant_id
first, then fall back to the email answer if applicant_id doesn't match
anything — no cross-check between the two. `sendInterviewReceivedEmail`
(`lib/email.js`) already fires unconditionally once a delegate is matched and
the status update succeeds — it wasn't reaching that code because the match
itself was failing, not because sending was gated separately. The webhook
secret path remains the actual access control; applicant_id is a small
guessable sequence but isn't treated as a secret on its own.

## Related

[[Event Lifecycle Stages]] · [[Auth and Gating]] · [[Data Model]]
