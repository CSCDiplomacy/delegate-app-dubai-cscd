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

## `POST /api/enroll/webhook/:secret?` (`routes/enroll.js`) — n8n account provisioning

Separate from the two receipt webhooks above. n8n posts here **after it has sent the delegate their payment receipt** (n8n owns that email, the app does not) to create the delegate's portal account and email them their login (credential email, `scripts/credential-email.html`). Secret is `ENROLL_WEBHOOK_SECRET` (path segment or `X-Webhook-Secret` header), rate-limited 30/min.

Walks the payload defensively — applicant_id by regex, primary email (preferring keys not flagged "alternate"), name (full-name key preferred over `first_name`) — requires exactly one applicant_id + one primary email or 400s. Cross-checks applicant_id vs email against `delegates` and 409s on any disagreement rather than guessing. Creates the Supabase Auth user + `delegates` row (`status: unenrolled`) if new, issues a deterministic password from the id, sends the credential email **then** marks `credential_email_sent_at` only on confirmed send (the send-first/mark-second fix from the 2026-08-24 quota incident). Idempotent on `credential_email_sent_at`.

### Two different Self Financed forms feed two different webhooks

Do not conflate these — same word "self", different form, different price, different code path:

| | Public website Self Financed form | In-portal self registration |
|---|---|---|
| form_id | `261907698196475` | `262375715752463` |
| fee | **USD 599** (subtotal 599, total 658.90) | **USD 499** (`TIER_BASE_FEE.self` in `lib/email.js`) |
| applicant_id prefix | `SF` (`YSF-DXB-2026-SF5`) | `FF` |
| webhook | `routes/enroll.js` (create account + credentials) | `routes/jotform-registration.js` (mark registered + receipt) |
| who sends the receipt | **n8n** | **the app** (`sendRegistrationReceivedEmail`) |

Because the website form's receipt is n8n's job, the enroll webhook itself **does not use the fee at all** — the 599/499 difference lives only in n8n's receipt for the website flow and in `lib/email.js` for the portal flow. If the app is ever asked to send the receipt for website applicants too, `lib/email.js`'s `TIER_BASE_FEE` would need an SF/599 variant.

### applicant_id prefixes are a flow tag

`enroll.js`'s `APPLICANT_ID_RE = /YSF-DXB-\d{4}-[A-Z]{2,4}\d+/gi` matches **any** 2–4 letter prefix: `FF` (general application), `SF` (website Self Financed, added 2026-09-01), and forum-access ids under their own prefix once their payload is known. The password helper folds the lowercased prefix in (`SF5 -> ysfcscdsf5`, `FF37 -> ysfcscdff37` unchanged). Note `jotform-registration.js` still uses the narrower `FF`-only regex — it only ever sees portal (`FF`) forms.

> **Watch:** the seen SF sample carried `YSF-DXB-2026-SF5` — cross-check against the [[Known Issues and Dead Code]] SF-id collision note (autoincrement reset once made `SF0001 == SF1`) before trusting an SF id as unique.

## `POST /api/me/accept-scholarship` (`routes/me.js`)

Only callable when `result_tier === 'full'`. Idempotent via `WHERE scholarship_accepted_at IS NULL`. Logs `usage_events` (`scholarship_accepted`).

## Related

[[Results and Tiers]] · [[Data Model]] · [[Jakarta Branding Inventory]]
