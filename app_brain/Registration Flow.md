---
tags: [backend]
---

# Registration Flow

← [[Home]] · see also [[Results and Tiers]], [[Event Lifecycle Stages]]

Stage 4 of [[Event Lifecycle Stages]]: once a delegate has a `result_tier`, `partial`/`self` delegates register + pay via a Cognito form; `full` delegates just confirm.

## `POST /api/registration/webhook/:secret?` (`routes/registration.js`)

Structurally identical pattern to the interview webhook (see [[Interview System]]):

- Validates `COGNITO_WEBHOOK_SECRET` via path param or header, rate-limited 30/min.
- Regex `APPLICANT_ID_RE = /YPDS-JKT-F?\d+/gi` finds applicant IDs **anywhere in the payload text** (normalizes a missing `F`), matches against `delegates.applicant_id IN (...)`.
- Idempotently (`WHERE registration_status != 'submitted'`-style guard) flips `registration_status → 'submitted'`, sets `registration_submitted_at`.
- **Does not touch `status`** — moving a delegate to `enrolled` is a deliberate manual team step, decoupled from payment confirmation. Don't automate this without checking with the client first; it's a safeguard, not an oversight.
- Writes a `usage_events` row (`registration_submitted`, detail = `result_tier`).

## The applicant-id regex is a functional dependency, not branding text

`YPDS-JKT-F###` is baked into `APPLICANT_ID_RE` and its normalization logic. This is the **one piece of Jakarta branding that isn't just cosmetic** — a Dubai fork needs a new applicant-id scheme (however that gets decided) and this regex (plus wherever ids are generated — `scripts/seed-delegates.js`, `scripts/reformat-applicant-ids.js`) has to change in lockstep, or registration webhooks will silently fail to match anyone.

`scripts/upload-vouchers.js` has the same dependency for voucher filenames (`YPDS-JKT-26-F###.pdf`).

## `POST /api/me/accept-scholarship` (`routes/me.js`)

Only callable when `result_tier === 'full'`. Idempotent via `WHERE scholarship_accepted_at IS NULL`. Logs `usage_events` (`scholarship_accepted`).

## Related

[[Results and Tiers]] · [[Data Model]] · [[Jakarta Branding Inventory]]
