---
tags: [core, frontend, backend]
---

# Results and Tiers

← [[Home]] · see also [[Event Lifecycle Stages]], [[Data Model]], [[Registration Flow]]

Interviews are over for Jakarta; results are published. **`result_tier` is the single source of truth for what a delegate sees** — whether they interviewed is irrelevant, since the evaluation workbook is authoritative and many tiered applicants never interviewed. `result_status`/`interview_status` are an earlier, separate axis and **must not** be reintroduced into results gating (this caused wrong screens once already, per `CLAUDE.md`).

Outcomes render **inline on the Dashboard**. There is no dedicated Results screen — `Results.tsx` still exists in the source tree (exports the `TierResult` component Dashboard renders) but is **not** in the `Screen` routing union and **not** in `AppLayout`'s screen map. It was built, then the standalone screen was removed; don't re-add one.

## Tier table

| tier | meaning | what they see | Cognito form |
|---|---|---|---|
| `full` | scholarship covers the fee | congratulations, **no form** — `POST /api/me/accept-scholarship` confirms directly | none |
| `partial` | pays 50% | congratulations + registration/payment form | **79** |
| `self` | pays in full | congratulations + registration/payment form | **78** |
| `alumni` | parked | placeholder card — final treatment still TBD from the client | **81** (per `Results.tsx`'s own comment — not documented in `CLAUDE.md`, worth confirming with the client) |
| `null` | no outcome on record | nothing renders | — |

## The counter-intuitive Cognito form-id mapping — verify before ever touching this

Form **78** is titled *"Self Financed (With Scholarship)"* and belongs to **`self`**. Form **79** is *"Partial (50% Scholarship)"* and belongs to **`partial`**. An earlier spec mapped 78 to `full`, which showed a payment form to people who'd already won a full scholarship — a real bug that happened once. Full-scholarship delegates owe nothing and get **no form at all**.

Implementation: `COGNITO_FORM_IDS = { self: '78', partial: '79', alumni: '81' }` in `client/src/components/CognitoForm.tsx`. Uses Cognito's "seamless" embed script (injected manually via `document.createElement('script')` with `async=false` — load-bearing, since `seamless.js` reads `document.currentScript`, which is `null` if loaded async). `ACCOUNT_KEY = 'ufIsh1RjbUCGYxX0PV-sug'` is CSCD's Cognito account — whether Dubai reuses this account or gets new forms/ids determines whether this whole mapping needs re-verification from scratch (treat it as **needs re-verification**, not **copy as-is**, given the mapping is already known to be error-prone).

The component prefills `?ApplicantId=<id>` on the URL query string before injecting the script, then restores the original query string on cleanup afterward.

`www.cognitoforms.com` must stay in both the `frameSrc` **and** `scriptSrc` CSP directives in `app.js` for the embed to load at all.

## Data provenance

`result_tier` was set by `scripts/reconcile-tiers.js` from the `Self`/`Partial`/`Full`/`Alumni` sheets of `YPDS Video submissions - Evaluation_mapped.xlsx` (exported to `reponses/tiers.csv`) — **not** the workbook's `Evaluation` sheet, whose status column has typos and combined values (`Sef`, `Full/Partial`). Matching: email → alternate email → `applicant_id` (`YPDS-JKT-F{ID}`) → exact normalised name, with email and applicant_id cross-checked — disagreements are reported and skipped, never guessed.

Current Jakarta counts: **full 10, partial 69, self 80, alumni 2, 3 untiered** (unresolved data issues — one applicant has no delegate row, one has an applicant_id belonging to someone else, one is absent from the workbook — they see nothing until resolved).

## Gating

`showResultsTab()` is described in `CLAUDE.md` as living in `authStore.ts` (`isApplicant && !!result_tier`) but **does not exist there as named** in the current code — results gating is inlined directly in `Dashboard.tsx` instead. See [[Known Issues and Dead Code]].

## Related

[[Event Lifecycle Stages]] · [[Registration Flow]] · [[Data Model]] · [[Auth and Gating]]
