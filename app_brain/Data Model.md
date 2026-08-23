---
tags: [backend, database]
---

# Data Model

← [[Home]] · see also [[Event Lifecycle Stages]]

## The core table: `delegates`

One row per applicant/delegate. The "unenrolled vs enrolled" split described in [[Auth and Gating]] is just one column on this row — an applicant and a confirmed delegate are **the same row at different `status` values**.

**No base schema file exists in this repo.** The core columns (`id, name, email, applicant_id, status, interview_status, interview_token, interview_submitted_at, hotel_id, room, booking_ref, check_in, check_out, meals`) plus the `favourites`, `feedback`, `announcements`, `action_items`, `usage_events` tables were created directly in the Supabase dashboard/SQL editor and never checked into git. `scripts/migrations/` only holds the *incremental* changes from the most recent reconciliation phase (below). **To get the true full schema for a Dubai fork, query Supabase directly** (`list_tables`/`execute_sql` on `Delegate_app_cscd`) rather than trusting any file in this repo.

## Full state-machine column inventory (verified against routes + migrations)

| column | observed values | set by |
|---|---|---|
| `status` | `unenrolled`, `underprocessing`, `enrolled` | seed script (unenrolled/enrolled) → `set-underprocessing.js` → manual enrollment |
| `interview_status` | `not_started`, `submitted` | AidaForm webhook (`routes/interview.js`), or `POST /api/me/interview/mark-taken` |
| `result_status` | `pending`, `evaluated`, `not_evaluated` | `reconcile-interviews.js` — **legacy axis, no longer drives UI**, see [[Results and Tiers]] |
| `result_tier` | `null`, `self`, `partial`, `full`, `alumni` | `reconcile-tiers.js`, from the evaluation workbook — **the single source of truth for results UI** |
| `registration_status` | `not_started`, `submitted` | Cognito webhook (`routes/registration.js`) |
| `scholarship_accepted_at` | `null` \| timestamptz | `POST /api/me/accept-scholarship` (full tier only) |

`usage_events.event_type` CHECK constraint values: `login`, `pdf_download`, `screen_view`, `interview_open`, `interview_submitted`, `scholarship_accepted`, `registration_submitted`.

## Migration chronology (by actual timestamp inside the files, not filename order)

1. **`2026-07-20-add-underprocessing-status.sql`** (17:55) — widens `status` CHECK to add `underprocessing`. Paired with `scripts/set-underprocessing.js`.
2. **`2026-07-20-add-result-status.sql`** (18:28) — adds `result_status`, deliberately kept separate from `status`/`interview_status` "so a later selected/waitlisted verdict can bolt on beside it."
3. **`2026-07-20-add-result-tier.sql`** (20:19) — adds `result_tier`, explicitly commented as orthogonal to `result_status`.
4. **`2026-07-22-add-scholarship-accepted.sql`** (01:48) — adds `scholarship_accepted_at`.
5. **`2026-07-22-add-registration-status.sql`** (17:34) — adds `registration_status` + `registration_submitted_at`; also **widens the `usage_events.event_type` CHECK** — worth noting this migration retroactively fixed a bug where `scholarship_accepted` events were silently failing to insert against the older, narrower constraint.

This chronology is itself evidence of how the app evolved: it started as a simple applicant/delegate binary, and every later migration bolted on one more axis (evaluation status, tier, scholarship acceptance, registration) as the client's process got more specific mid-event. **Expect the same pattern for Dubai** — the schema is likely to grow the same way rather than being fully specified up front.

## Other tables

- **`favourites`** — `(delegate/user id, session_id)`. `session_id` format is `` `${day.date}T${item.time}` ``, must match `favourites.session_id` rows — this is a client-generated composite key, not a DB-generated id.
- **`feedback`** — rating + comment, `requireAuth`-gated write, read via `routes/analytics.js`.
- **`announcements`** — public read, `active`/`must_read`/`pinned`/`created_at` ordering.
- **`action_items`** — public read, `active`/`due_date` ordering. (Note: the frontend component that would render these, `ActionsToDo.tsx`, is currently dead/unreferenced — see [[Known Issues and Dead Code]].)
- **`usage_events`** — analytics log, `event_type` CHECK-constrained (list above), read via the internal analytics dashboard (`routes/analytics.js`, IP/token-gated).

## Storage buckets

- **`accommodation-vouchers`** (private) — PDF vouchers keyed `{applicant_id}.pdf`, served via 10-minute signed URLs from `GET /api/me/voucher`. Populated by `scripts/upload-vouchers.js` from `accommodation_vouchers/*.pdf`.

## Related

[[Event Lifecycle Stages]] · [[Auth and Gating]] · [[Results and Tiers]] · [[Registration Flow]] · [[Operational Scripts]]
