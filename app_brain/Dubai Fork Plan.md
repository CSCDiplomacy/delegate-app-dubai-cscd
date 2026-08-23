---
tags: [core, dubai-fork, plan]
---

# Dubai Fork Plan

← [[Home]] · synthesizes [[Jakarta Branding Inventory]] + [[Dubai Design System]] + [[Jakarta Email Toolkit]] into an execution plan

> **This is the forward-looking plan — for what's actually been completed, see [[Dubai Fork Progress]]**, updated as work lands rather than duplicated here.

Three separate systems carry Jakarta branding and all three need a Dubai pass:
1. **The delegate portal** (`delegate_app_dubai`, this repo) — documented in full across this vault.
2. **The marketing site's Dubai page** (`cscd_website`) — already substantially built, see [[Dubai Design System]].
3. **The email toolkit** (`invitation_email_jakarta`) — human-run, needs a full Dubai sibling, see [[Jakarta Email Toolkit]].

The marketing site is ahead of the portal: it already has real Dubai copy, imagery, and a working AidaForm-based registration flow. The portal is the one that needs the fork. Treat the marketing site as the design/content source of truth, not something to design from scratch.

## Decisions received from the client (2026-08-23)

- **Domain: `delegate.thecscd.org`** (replaces Jakarta's `portal.thecscd.org`). See [[Deployment]] for every place the old domain is hardcoded and needs updating.

- **Registration mechanism: postponed.** The AidaForm registration URLs on the marketing site (Fully Funded/Self Financed/Summit Pass) are backup/another branch, not the live plan. Real registration will use **JotForm**, once the interview stage is finished — not needed for the current sprint. Cognito vs. AidaForm vs. JotForm for registration stays an open question, but it's off the critical path.
- **Interview stage: confirmed, in progress now.** Dubai reuses AidaForm app id **`form202405`** (same as Jakarta) at a new URL: `https://15158.aidaform.com/interview-ysf-dubai-2026`. This resolves decision-in-progress #2 below — yes, Dubai runs an interview stage before anything else, same shape as Jakarta.
- **Supabase: new project created** — ref `pjdbvjiemguepdyzhlft`, on the **Diplomark account** (not the Jakarta org, not reachable via this session's Supabase MCP). `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`APP_URL` in this repo's `.env` were updated 2026-08-23 (blind edit, values not read back into conversation). **Still needed**: `SUPABASE_SERVICE_ROLE_KEY` (paste only into `.env`, never chat), and the base schema — this is a fresh empty project, so `delegates`/`favourites`/`feedback`/`announcements`/`usage_events` tables (see [[Data Model]]) need creating from scratch, ideally as reviewed migrations this time rather than repeating Jakarta's undocumented-base-schema situation.
- **Confirmed: this checkout is a safe copy, not the live deployment.** Jakarta's live portal runs from a separate deployment; this repo (`delegate_app_dubai`, remote `portal-cscd.git`) is a filesystem copy that will eventually move to its own new Dubai repo. Safe to edit `.env`/branding/content here now — just don't push to the `portal-cscd.git` origin, and remember to repoint the remote once the new Dubai repo exists.
- **Applicant IDs: confirmed, roster arrived.** Format is `YSF-DXB-2026-FF###`, from the client's roster export (`delegate-list-ysf-dubai.csv`). 228 of 230 rows seeded already — see [[Dubai Fork Progress]] for the two flagged data issues. `routes/registration.js`'s `APPLICANT_ID_RE` and `scripts/upload-vouchers.js` still expect Jakarta's format and haven't been updated to match yet (low urgency while registration stays postponed).

## Immediate goal: get the portal interview-ready + send delegates their briefing/credential email

This is the current sprint — not the full rebrand. Scope (status per [[Dubai Fork Progress]]):

1. ✅ **New Supabase project** stood up (client-owned) and pointed at from env — see [[Deployment]] for the env vars this touches.
2. ✅ **Seed ~250 delegates** via `scripts/seed-delegates.js` — 228 of 230 seeded, one flagged for a fresh ID.
3. ✅ **Point the interview embed at the new form**: `client/src/components/screens/Interview.tsx`'s `SHARED_FORM_URL` constant → `https://15158.aidaform.com/interview-ysf-dubai-2026`.
4. ✅ **Fix the tokenized-URL bug** — `Interview.tsx` now prefers the server's per-applicant tokenized URL over the shared one.
5. ✅ **Re-enable `showInterviewTab()`** in `authStore.ts`.
6. ✅ **Minimum viable branding** — login/dashboard/interview screens now run the real Dubai tokens (this shipped as part of the full Phase 1/2 pass below, not separately).
7. **Interview briefing + credential email** — `scripts/credential-email.html` is rebranded with Dubai facts/design and a confirmed interview deadline (`INTERVIEW_DEADLINE` set in `.env`, 24 Aug 2026, 8:00 PM GST). **Still open**: whether the briefing content is folded into this same email or sent as a second one — that decision wasn't made, the email was rebranded as a straight reskin of Jakarta's single-email structure. Sending itself hasn't happened yet.

## Remaining open decisions

1. **Cognito vs. AidaForm vs. JotForm for registration** — postponed, not blocking this sprint (see above).
2. **Does Dubai keep a coordinator/group-activity feature?** Jakarta's `coordinatorGroups.ts`/`CoordinatorActivity.tsx` is explicitly session-only and PII-laden — delete outright either way (see [[Known Issues and Dead Code]]); rebuild fresh only if the client wants the same mechanic for Dubai. Not urgent.
3. **Alumni tier equivalent for Dubai?** Jakarta's `alumni` tier is "parked, final treatment TBD" even for Jakarta itself. Revisit once registration/tiering is back in scope.
4. **One email or two** for interview briefing + credential sharing — need the client's call on content/structure before drafting.
5. **Supabase project details** (URL/keys, when ready) and **AidaForm webhook secret + hidden field names** (`AIDAFORM_WEBHOOK_SECRET`, and whether the new Dubai form has `candidate_token`/`applicant_id` hidden fields configured the same way as Jakarta's) — needed before the webhook can be wired up.

## Phase 1 — Design system swap (portal)

Replace the neo-brutalist crimson/yellow/Cinzel-Cormorant-Lato system (see [[Design System]]) with Dubai's maroon/gold/Archivo-Inter-Fraunces-DM Mono system (see [[Dubai Design System]]):
- Rewrite the two token blocks in `client/src/styles/globals.css` (`:root` + `[data-theme='dark']`) to the Dubai palette — `--surface`→`--ysf-cream`, `--signal`→`--forest` (#8c2231), `--brass`→`--gold` (#d9a521), etc. Derive a sensible dark-mode variant (source material doesn't define one — Dubai's site doesn't appear to have dark mode).
- Swap Google Fonts links in `client/index.html`; update `--font-display`/`--font-accent`/`--font-body` in `globals.css`'s `@theme inline` block.
- Delete/ignore `public/css/app.css` and `public/js/app.js` (legacy vanilla reference) rather than re-theme dead code — confirm with the team first since `CLAUDE.md` calls it "the spec," but it's unused by the live React app.
- Rewrite `color.md` or delete it (already stale per [[Known Issues and Dead Code]] — don't let a third stale palette pile up).

## Phase 2 — Content & branding (portal)

Per [[Jakarta Branding Inventory]]'s EVENT-classified list:
- `client/src/lib/content.ts` — full rewrite (About screen), add a Dubai `EDITIONS` entry.
- `data/rundown.json`, `visits.json`, `hotels.json`, `speakers.json`, `contact.json` — replace with real Dubai content: MBR Library venue, Gevora Hotel, the 4-day agenda and 6 modules from [[Dubai Design System]].
- `Dashboard.tsx`, `Hotel.tsx`, `Rundown.tsx`, `About.tsx` — replace hardcoded Jakarta strings (seal text, banner, booking block, ComingSoon copy).
- `authStore.ts` `eventName` default, `app.js`'s ICS `PRODID`, `public/manifest.json`, `client/index.html`/`public/index.html` titles.
- Images: replace `ypds-jakarta-2026-banner.png`, `tugu-kunstkring.webp` with Dubai equivalents (assets already exist at `cscd_website/public/assets/img/events/ysf-dubai-2026/`).

## Phase 3 — Functional/schema changes (portal)

- Update `scripts/seed-delegates.js` for whatever applicant-id pattern arrives with the client's 250-delegate file (see "Immediate goal" above — this is now the priority item, not a later-phase decision).
- Registration mechanism (Cognito/AidaForm/JotForm) — postponed, revisit once the interview stage is done.
- Delete `coordinatorGroups.ts` + `Activity.tsx`/`ActivityNotice.tsx`/`CoordinatorActivity.tsx` and their wiring — not urgent, do whenever convenient.
- Clean up flagged dead code while touching adjacent files anyway: `ActionsToDo.tsx`, `WhatsAppLinks.tsx` (if unused), `client/src/index.css`, `client/client/` stray folder — confirm with user before deleting anything not self-evidently dead.

## Phase 4 — Email toolkit (separate from the portal repo)

Build a Dubai sibling to `invitation_email_jakarta` (see [[Jakarta Email Toolkit]]):
- New palette: Dubai maroon `#8c2231`/gold `#d9a521`/cream `#fbfaf6` (swap from `#1C1A1A`/`#E6EB1C`/`#E90558`), fonts stay email-safe (Georgia/Arial/Courier New — no need to chase Archivo/Inter in HTML email).
- Rewrite all 6 templates' hardcoded facts (dates, hotel, airport, WhatsApp/orientation links, currency) to Dubai equivalents once decisions #1–#3 are settled (template count/structure may itself change if the tier model changes).
- Fix the two process issues found regardless of rebrand: `logistics_email.html`'s personal-name sign-off, and the duplicated orientation-constant hardcoding across `send.py`/`send_reminder.py`.
- Separately rebrand the portal's own `scripts/credential-email.html` + `send_credentials.py` (Phase 2/3 work, different design system than this toolkit — don't conflate the two).

## Status

See [[Dubai Fork Progress]] for the up-to-date running log (Phase 1 & 2 complete and verified, Supabase live with schema + 228 delegates seeded, interview readiness fixed, credential email rebranded with a confirmed deadline). Kept out of this file so status doesn't drift between two places — update the Progress doc, not here.

## Suggested order

Phase 1 and 2 are safe to start immediately (pure content/design, no product-decision blockers). Phase 3 is blocked on decisions #1–#3. Phase 4 is blocked on decisions #1–#3 too (template facts depend on the final registration/tier model). Recommend resolving decisions #1 and #2 first — they're the ones that determine how much of Phase 3 is "edit" vs. "rebuild."

## Related

[[Jakarta Branding Inventory]] · [[Dubai Design System]] · [[Jakarta Email Toolkit]] · [[Event Lifecycle Stages]] · [[Known Issues and Dead Code]]
