---
tags: [dubai-fork, cleanup]
---

# Known Issues and Dead Code

← [[Home]]

Things discovered while documenting the system that don't fit neatly elsewhere — inconsistencies, drift between `CLAUDE.md` and actual code, dead code, and stray files. Worth a decision during the Dubai fork rather than silently dragging forward.

## Documentation drift (CLAUDE.md vs actual code)

- `CLAUDE.md` describes a `showResultsTab()` helper in `authStore.ts` (`isApplicant && !!result_tier`). **It doesn't exist there as named** — results gating is inlined directly in `Dashboard.tsx` instead. See [[Auth and Gating]].
- `CLAUDE.md`'s results-tier table doesn't mention Cognito form **81** (alumni) — but `Results.tsx`'s own code comment documents it consistently. Worth confirming with the client whether alumni registration is actually meant to use form 81, since `CLAUDE.md` is silent on it. See [[Results and Tiers]].
- `CLAUDE.md` says `data/*.json` files are "all currently empty placeholders." **Only `checkin.json` still is.** `rundown.json`, `visits.json`, `hotels.json`, `contact.json` are fully populated with real Jakarta content; `speakers.json` is partially populated (generic panel placeholders, not named speakers). Verified 2026-08-23. See [[Jakarta Branding Inventory]].

## Data inconsistency

- Git history shows a commit (`af50b8a`, "remove Embassy of Pakistan and Gudskul visits") — but **`data/rundown.json` still contains an "Embassy of Pakistan (Tentative)" visit** (day 2, item 4). The removal appears to have only touched `data/visits.json`, not `rundown.json`. Independent of the Dubai fork, but worth flagging/fixing since it's a live content bug right now.

## Design-token naming inversion

`--signal` means **crimson** in `client/src/styles/globals.css` (the live React token system) but means **brass/yellow** in `public/css/app.css` (the legacy vanilla CSS `CLAUDE.md` calls the "spec"). The legacy file has a *separate* `--signal-crimson` token for what React just calls `--signal`. Don't use the legacy CSS as a token reference without translating this. See [[Design System]].

## Dead / unreferenced code

- **`client/src/index.css`** — unused Vite-template boilerplate (generic purple theme), not imported anywhere. Safe to delete.
- **`client/src/components/screens/ActionsToDo.tsx`** — not imported/rendered anywhere in the app. Superseded by `ActivityNotice`/the inline dashboard flow.
- **`client/src/components/screens/WhatsAppLinks.tsx`** — only ever used by the dead `ActionsToDo.tsx`, so effectively unreachable too, despite containing what look like still-relevant WhatsApp invite links.
- **`public/img/results-selected-delegates.png`** — no reference found in `client/src`; likely a dead asset from the removed standalone Results screen.
- **`client/client/`** — a stray, empty nested directory (`components/hooks/lib/services/stores/styles/types` subfolders, all empty — confirmed via `git ls-files`, nothing tracked). Looks like an abandoned alternate scaffold. Not part of the real app; safe to delete, but flag to the user first since its origin is unclear (not something this audit should delete unilaterally).
- **`color.md`** (repo root) — describes an *earlier* Frankfurt/CIPES fork's theme (navy/beige, Playfair Display + Plus Jakarta Sans, `cipes_theme` localStorage key), not the current Jakarta neo-brutalist one. Actively misleading if read as current design truth. Recommend deleting or fully rewriting.

## Temporary, session-only feature — flag for deletion, not re-skinning

`client/src/data/coordinatorGroups.ts` (+ `Activity.tsx`, `ActivityNotice.tsx`, `CoordinatorActivity.tsx`, and their wiring into `AppLayout.tsx`/`Dashboard.tsx`/`BottomNav.tsx`/`Sidebar.tsx`) is explicitly marked in its own header comment: *"These are deliberately shared, disposable workshop accounts. Remove this file and CoordinatorActivity.tsx (+ its use in Dashboard.tsx) after the session."*

This isn't a branding-rename target — it contains **live shared coordinator credentials** (e.g. `east.ypds@thecscd.org` + password) and **real participant names/personal emails** for the Jakarta cohort. It should be deleted outright for the Dubai fork (or rebuilt fresh, empty, if the client wants the same group-activity mechanic for Dubai) — never carried forward as-is.

## Interview embed doesn't actually use the tokenized URL — likely already true for Jakarta, not just a future Dubai concern

`routes/me.js`'s `GET /api/me/interview` correctly builds a **per-applicant tokenized URL** (`AIDAFORM_BASE_URL` + `candidate_token`/`applicant_id` query params) — the whole point being that the webhook (`collectUuids` in `routes/interview.js`) can match a submission back to a delegate via that token. But `client/src/components/screens/Interview.tsx:95` **ignores the server's `url` field entirely**: `const formUrl = SHARED_FORM_URL;` — a hardcoded constant — is used unconditionally to render the embed, regardless of what `GET /api/me/interview` returned.

Practical effect: the embedded form never actually carries a `candidate_token`, so the webhook's token-matching has nothing to match — in practice, `interview_status` is likely flipping to `submitted` almost entirely via the in-app **self-report checkbox** (`POST /me/interview/mark-taken`), not via AidaForm's webhook, undermining the design intent described in [[Interview System]]. Worth fixing before Dubai's interview stage goes live: change `formUrl` to prefer `info.url` when `info.state === 'open'`, falling back to `SHARED_FORM_URL` only if the server call fails.

## Undocumented env var

`ANALYTICS_TOKEN` (gates `routes/analytics.js`'s internal dashboard) is used in code but **not listed in `.env.example`**. Worth adding while touching that file anyway for Dubai.

## Related

[[Jakarta Branding Inventory]] · [[Auth and Gating]] · [[Results and Tiers]] · [[Design System]] · [[Architecture]]
