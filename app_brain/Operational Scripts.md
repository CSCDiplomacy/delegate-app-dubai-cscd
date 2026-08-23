---
tags: [backend, scripts]
---

# Operational Scripts

← [[Home]] · see also [[Event Lifecycle Stages]]

Everything in `scripts/`, mapped to the lifecycle stage it belongs to (see [[Event Lifecycle Stages]]) and whether it's a reusable tool or a one-off migration.

## Stage 1 — provisioning

| script | reusable? | does |
|---|---|---|
| `seed-delegates.js` | reusable | Reads a CSV, creates a Supabase Auth user per row (admin API), upserts the `delegates` row, writes out a credentials CSV. `status` column currently only accepts `enrolled`/`unenrolled` — doesn't yet know about `underprocessing`. |
| `add-passwords.js` | reusable, idempotent | Fills a CSV's blank `Password` column with a generated token; safe to re-run on partially-completed rosters. |
| `send_credentials.py` | reusable | Emails each delegate their login via Resend's HTTP API directly (no SDK), rendering `scripts/credential-email.html`. **Heavily Jakarta-worded**, not just templated — see [[Jakarta Branding Inventory]]. |
| `verify-env.js` | reusable, any stage | Checks required env vars are set, prints masked values. |

## Stage 2 — selection / reconciliation

| script | reusable? | does |
|---|---|---|
| `reconcile-interviews.js` | one-off (has `--dry-run`) | Matches AidaForm CSV export to `delegates`, sets `interview_status`/`result_status`. Never touches `enrolled` delegates. |
| `check_missing_interviews.py` | one-off diagnostic | Cross-checks Supabase `interview_status='submitted'` against AidaForm exports to catch webhook/export mismatches. |
| `set-underprocessing.js` | one-off (has `--dry-run`) | Bulk-moves interviewed, non-enrolled delegates to `status='underprocessing'`. |
| `backfill-names.js` | reusable, targeted | Fills `name` from a CSV by email match; `--force` overwrites existing. |

## Stage 3 — results & tiers

| script | reusable? | does |
|---|---|---|
| `reconcile-tiers.js` | one-off (has `--dry-run`) | Sets `result_tier` from `reponses/tiers.csv` (exported from the evaluation workbook), cross-checking email vs applicant_id. This is the script CLAUDE.md cites as `result_tier`'s provenance — see [[Results and Tiers]]. |

## Cleanup / one-time migrations

| script | does |
|---|---|
| `reformat-applicant-ids.js` | Rewrites `YPDS-JKT-{N}-F` → `YPDS-JKT-F{N}`. Dry-run by default, `--apply` to write, auto-backs-up first. Likely fully obsolete for Dubai (a fresh one-off script would be written if a similar reformat is ever needed) rather than reusable. |

## Stage 4/5 — registration & event execution

| script | does |
|---|---|
| `upload-vouchers.js` | One-time bulk upload of `accommodation_vouchers/*.pdf` into the private Storage bucket, deriving keys from filename `YPDS-JKT-(26-)?F###.pdf` — **functionally tied to the applicant-id format**, same caveat as [[Registration Flow]]. |

## Related

[[Event Lifecycle Stages]] · [[Data Model]] · [[Jakarta Branding Inventory]]
