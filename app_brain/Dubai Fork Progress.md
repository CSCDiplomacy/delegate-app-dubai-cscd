---
tags: [dubai-fork, progress]
---

# Dubai Fork Progress

← [[Home]] · running log of what's actually been done against [[Dubai Fork Plan]] — that doc stays the forward-looking plan, this one records completed state so it doesn't need re-deriving. Update this file (don't recreate it) as more lands.

## 2026-08-23

### Supabase — provisioned, schema applied, delegates seeded

- New Supabase project confirmed live: **`delegate-app-ysf-dubai-2026`** (ref `pjdbvjiemguepdyzhlft`, `ap-southeast-1`), on the **Diplomark account**, org `fbcjajfeooelvrmnicrz`. Connected via a dedicated MCP Supabase server (separate from whatever account the pre-existing "claude.ai Supabase" connector uses — that one stays untouched, out of reach of this project on purpose).
- `.env` confirmed populated: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (all present, service-role key is set — the [[Dubai Fork Plan]] doc's "still needed" note for it is now stale), `APP_URL=https://delegate.thecscd.org`, `AIDAFORM_BASE_URL` already pointed at the real Dubai interview form.
- **Schema is live**, matching `scripts/migrations/2026-08-23-dubai-base-schema.sql` (already in-repo, untracked) exactly: `delegates`, `favourites`, `feedback`, `announcements`, `action_items`, `usage_events` — all with RLS enabled. This was **not** run through Supabase's tracked migration system (`list_migrations` returns empty) — it was executed directly, so the SQL file in the repo is the only record of it. Worth formally tracking later if that matters to whoever maintains this project going forward.
- **228 delegate accounts are seeded** — `auth.users` and `public.delegates` match exactly 1:1, every row has an `applicant_id`, all currently `status: unenrolled`, 0 `interview_status: submitted` yet. This directly supersedes [[Dubai Fork Plan]]'s "Immediate goal" step 2 (was blocked on the client's roster file — that file has arrived and been run through `scripts/seed-delegates.js`, done in a separate session in parallel with this one). Seeded from `delegate-list-ysf-dubai.csv`; credentials are in `dubai-credentials.csv` (gitignored, not committed).
  - Two data issues were resolved during seeding: **Tatiana Zvenigorodskaia** was excluded — her row shared `YSF-DXB-2026-FF37` with a different person (Bzazou Ghita, who kept that ID); she's flagged in `dubai-flagged-needs-id.csv` and needs a freshly-assigned ID before she can be seeded. Zhang Kaixin's duplicate submission (`FF97`) was dropped, kept `FF96`. A test entry (the account owner's own name/email, no ID in the source) was assigned `YSF-DXB-2026-FF1` and seeded with everyone else.
- **Applicant-id scheme is now confirmed**: `YSF-DXB-2026-FF###`, from the client's roster export. `routes/registration.js`'s `APPLICANT_ID_RE` (still `/YPDS-JKT-F?\d+/gi`) and `scripts/upload-vouchers.js`'s filename parsing both still expect Jakarta's format and haven't been updated yet — low urgency since registration itself is still postponed, but worth doing before registration is picked up rather than rediscovering this later.
- Storage bucket `accommodation-vouchers` exists (private, matches the migration).
- Security advisor: one low-priority `WARN` — leaked-password protection disabled in Supabase Auth. Not urgent, one toggle in the dashboard when someone gets to it.
- **Correction to an earlier note**: a status update elsewhere in the vault claimed the anon/publishable key was rejected with a 401. Tested live in this session — `GET /api/config` returns a working anon key, a REST call against it returns `200`, and a real (bogus-credentials) sign-in attempt against Supabase Auth returns `400 invalid_credentials` (the correct error for wrong login, not the `401 Invalid API key` a broken key would produce). **The anon key works correctly as of this check** — the earlier 401 was either stale or already fixed. Delegate login is not blocked on this.
- **AidaForm webhook secret** (`AIDAFORM_WEBHOOK_SECRET`) is generated and set in `.env`, but still needs configuring on AidaForm's own dashboard for the Dubai interview form — that's a manual step outside this repo, for whoever has AidaForm admin access.

### Phase 1 — Design system swap (portal) — done

Per [[Dubai Fork Plan]]'s Phase 1 checklist, all complete:
- `client/src/styles/globals.css` — both token blocks (`:root`, `[data-theme='dark']`) rewritten to the Dubai maroon `#8c2231`/gold `#d9a521`/cream `#fbfaf6` palette, mapped onto the existing token names (`--signal`, `--brass`, `--surface`, `--ink`, …) — no component changes needed. Added `--signal-rgb` (was referenced by the coordinator/Activity CSS but never defined — a pre-existing bug, fixed as a side effect).
  - **Dark mode is a derived judgment call** (Dubai has no dark-mode source): `--signal` dark uses `--ysf-mint` (`#c24c58`, a real Dubai-palette token for "lighter maroon accent"), card surfaces use `--deep-forest` (`#3a0e14`), page background is `--deep-forest` darkened further. Built from real palette tokens, not invented, but worth a design pass before shipping.
  - Fonts swapped to Archivo (display) / Fraunces (accent, italic) / Inter (body) / DM Mono (added as `--font-mono`, applied only to the `.eyebrow`/`.section-label` kicker class — deliberately not swept across every small-caps label in the app).
- `client/index.html` — Google Fonts link, title, meta description, `theme-color` (`#3a0e14`, matches the new manifest).
- `public/manifest.json` — name/short_name/description, `background_color`/`theme_color` updated to Dubai tokens.
- Legacy `public/css/app.css` / `public/js/app.js` (vanilla frontend, retired reference code) — **left untouched** per the plan, but flagged: it's now a third stale generation of the theme, and since the old Jakarta banner image it references was deleted, one dead `<img>` path in it is now broken. Harmless (this code isn't reachable — `client/dist` takes priority) but a loose end if anyone ever revives it.
- Verified visually: light + dark mode screenshots of the login screen (Playwright, headless Chromium) confirm the maroon/gold/cream palette, Fraunces italic tagline, and the dark-mode logo-invert filter all render correctly.

### Phase 2 — Content & branding (portal) — done

Per [[Jakarta Branding Inventory]]'s EVENT-classified list, all rewritten with real, sourced Dubai facts (not placeholders) — pulled directly from `cscd_website`'s marketing-site source (`AgendaSection.tsx`, `ModulesBook.tsx`, `VenueSection.tsx`, `StaySection.tsx`, `ysfReference.ts`'s live HTML export):

- `client/src/lib/content.ts` — full rewrite: tagline "Convergence of Innovation", the 6 core-objective theme cards (sourced from the marketing site's "Our Mission" section, not the 6 program modules — those are reserved for the rundown so the two don't duplicate), `EDITIONS` gets a Dubai entry appended (Jakarta stays as history, no longer `current`).
- `client/src/components/screens/About.tsx` — hardcoded JSX paragraph fixed (bypassed `content.ts` before).
- `data/rundown.json` — 4-day agenda (Sep 22–25, 2026), MBR Library + Gevora Hotel + Marina cruise + desert safari, all 6 modules. Clock-times are the marketing site's *published* times; end-times and room numbers aren't confirmed anywhere, so they're **omitted**, not invented.
- `data/visits.json` — rebuilt around Dubai's two shared excursions (Marina cruise, desert safari) rather than Jakarta's named institutional visits — Dubai's programme is modules-based, doesn't have an ASEAN-HQ/Ministry-of-Culture equivalent.
- `data/hotels.json` — key renamed `jakarta-hotel` → `dubai-hotel` (with `routes/me.js`/`routes/public.js` fallbacks updated in lockstep, otherwise the Hotel screen silently breaks). Gevora Hotel facts filled in; room type/sharing arrangement marked `TBD` (operational, arrives with the roster — some of that roster is now in, but room assignments specifically aren't yet).
- `data/speakers.json`, `data/contact.json` — updated (speakers are still generic placeholder panels, matching Jakarta's own pre-speaker-confirmation state).
- `Dashboard.tsx` — seal text `YPDS/JKT/2026` → `YSF/DXB/2026`; banner swapped to `dubai-skyline.webp` (sourced from `cscd_website`'s asset folder, copied into both `client/public/img/` and `public/img/` as `ysf-dubai-2026-banner.webp`; old Jakarta banner + `tugu-kunstkring.webp` deleted).
- `Hotel.tsx` — `BOOKING` const updated; room/meal-plan/booking-number marked `TBD` (not invented); "Diplomark" partner name and "~17 delegates" specifics genericized in code comments too, since that partner isn't confirmed for Dubai.
- `Rundown.tsx` ComingSoon copy, `authStore.ts` `eventName` default, `app.js` ICS `PRODID`, `public/index.html` title — all updated.
- `lib/reminders.js` — `Asia/Jakarta` timezone fallback → `Asia/Dubai` (not in the plan's explicit file list, but directly downstream of the `rundown.json` timezone change).

**`eventName` is inconsistent across three surfaces and not yet resolved:**
| surface | value used |
|---|---|
| Portal (`content.ts`, `authStore.ts`, this doc) | "Youth Strategic Forum, Dubai 2026" |
| Marketing site (mixed usage) | "Youth Strategic Forum, Dubai 2026" *and* "Youth Strategic Forum 2026, Dubai" |
| `.env`'s `EVENT_NAME` (drives the credential email subject/body) | **"YSF Dubai 2026"** — a third form |

Needs a client call on the canonical form; not resolved here.

### Interview readiness — done (was explicitly out of scope earlier, picked up once 228 real accounts existed)

- `client/src/components/screens/Interview.tsx` — `SHARED_FORM_URL` fixed from a stray `interview-copy` form to the real `https://15158.aidaform.com/interview-ysf-dubai-2026`. Also fixed the tokenized-URL bug flagged in [[Known Issues and Dead Code]]: the embed now prefers the server's per-applicant `info.url` (carries `candidate_token`) whenever `GET /me/interview` returns `state: 'open'`, falling back to the shared URL only on failure — so the AidaForm webhook can actually match submissions to delegates now, which it structurally couldn't before.
- `client/src/stores/authStore.ts` — `showInterviewTab()` re-enabled: `isApplicant(profile)` (was hardcoded `false`). Tab now shows for unenrolled/underprocessing applicants, stays visible through submission, disappears on enrollment.
- Both changes verified: `tsc -b` + full `vite build` pass clean.

### Credential email — rebranded, deadline confirmed

- `scripts/credential-email.html` — full Dubai maroon/gold/deep-forest visual pass + Dubai copy. The Jakarta version's specific interview essay-question quote and video-length spec were **not** carried over or replaced with invented equivalents (no Dubai-specific version exists anywhere) — replaced with a generic "the form walks you through it" line instead.
- `scripts/send_credentials.py` — defaults updated to Dubai; `build_text()` (the plain-text fallback) rewritten to match the HTML; added a shared `{{interview_deadline}}` placeholder used by both HTML and text versions (previously they held two independently-hardcoded deadline strings that could silently drift from each other).
- **`INTERVIEW_DEADLINE` is now set** in `.env`: `24 August 2026, 8:00 PM (GST, Dubai time)` — confirmed by the client (corrected once from an initial "11:59 PM" to the actual 8:00 PM). This was a placeholder (`TBD`) until this session. Verified rendering in both `build_html`/`build_text`.
- Verified by rendering both `build_html`/`build_text` with test data — no leftover Jakarta/YPDS strings, no unreplaced `{{...}}` placeholders, deadline renders correctly.

### Delegate passwords — reset to a predictable pattern (explicit client call, not the default)

- All 228 seeded accounts originally got a random per-delegate password (`seed-delegates.js`'s default). The client explicitly asked for a predictable scheme instead: **`ysfcscdff<N>`**, where `<N>` is the numeric suffix of the delegate's `applicant_id` (e.g. `YSF-DXB-2026-FF10` → `ysfcscdff10`).
- **Flagged before doing it**: applicant IDs are sequential and visible in the roster, so this pattern is guessable for any of the 228 accounts without knowing their actual password — and the portal has no forced "change password on first login" flow, so it isn't a temporary weak password, it's the delegate's real login for the duration of the event. Client confirmed they want it anyway, understanding the tradeoff.
- New one-off script: `scripts/reset-passwords-pattern.js` — reads `dubai-seed-input.csv` (email + applicant_id, same file `seed-delegates.js` used), looks up each delegate's `auth.users` id from `public.delegates` by `applicant_id`, calls `admin.auth.admin.updateUserById(id, { password })`. Can't recreate accounts that already exist, so this updates in place rather than re-seeding.
- Run against all 228: **228 updated, 0 failed**. `dubai-credentials.csv` was rewritten in place to match — `send_credentials.py` (see above, ready to run) will now send the `ysfcscdffN` passwords, not the original random ones.
- Tatiana Zvenigorodskaia is unaffected (she was never seeded — still in `dubai-flagged-needs-id.csv`, waiting on a real ID).

### Design system — card surface, radius/shadow, corrected maroon/sand pair — done

A spec artifact reconstructing the live marketing site's "About the Forum"
section markup, plus a client-supplied hex pair from the official crest
banner, refined the Phase 1 token swap in `client/src/styles/globals.css`:
new `--card` token (white, distinct from the `--surface-2` mist tint used for
accent panels), `--radius-lg` 10px→18px, new `--radius-xl: 28px` for hero
cards, softened diffuse shadows, a `✦` kicker mark on `.eyebrow`/
`.section-label`/`.card-eyebrow`, and `--signal`/`--brass` corrected to the
crest pair (`#8E2631` maroon — supersedes `#8c2231`). Same day, reconciled
against `scripts/credential-email.html` (already built against the true,
client-verified palette): `--ink` corrected to the email's warm `#241417`,
`--surface-2` corrected from mist to parchment `#faf8f4` (mist demoted to a
new, currently-unused `--surface-3`), and `--brass` corrected a second time
from the crest sand `#fce2c3` (real, but only used as text-on-maroon in the
email) to the email's actual badge/chip gold `#e7c673` with maroon
(`#8e2631`, not deep-forest) as its ink. `border-radius:0` in the email was
deliberately **not** carried over — read as Outlook-compat, not a brand
signal; flagged as an open question rather than resolved silently. Full
detail and rationale in [[Dubai Design System]]. `npm run build` clean;
verified visually both passes (Playwright, light + dark login screen).

## 2026-08-25

### Admin app — read-only Feedback page

`admin_app_dubai` gets a new `/feedback` nav item: lists the portal's
`feedback` table (Contact-screen ratings/comments), newest first, average
rating in the summary line. Read-only, no `admin_audit_log` writes. Needed
because `feedback` has no client-select RLS policy — previously the only way
to see it was the loopback-token `analytics-dashboard.html` JSON dump.
Non-obvious bit: `feedback.user_id` FKs to `auth.users`, not
`public.delegates`, so PostgREST can't embed the delegate row on that
column — fetched and joined in JS by id instead. `npx tsc --noEmit` and
`next build` both clean; **not yet committed/deployed** — sitting as a local
diff in `admin_app_dubai`, pending push + `vercel deploy --prod`. Full detail
in [[Admin Dashboard]].

## 2026-08-26

### Results/tiers phase — kickoff, still blocked on Cognito form ids

Client hasn't delivered the actual results list yet (no evaluation workbook
for Dubai exists anywhere in the repo/brain), but started getting the portal
ready ahead of it. Audited the results-rendering path
([[Results and Tiers]]'s tier table) against the Dubai codebase: it turns out
**the whole pipeline is already ported over from Jakarta, untouched, sitting
dormant** — `Results.tsx`/`Dashboard.tsx`/`routes/me.js`'s `/profile` +
`/accept-scholarship` all already read `delegates.result_tier` and branch
`full` (renders nothing — the congratulations card was removed per an earlier
client request, team confirms full-scholarship winners directly, matching
today's "for fully they've been selected already") / `partial` (Cognito form
**79**) / `self` (Cognito form **78**) / `alumni` (form **81**). Confirmed via
`git log` these files haven't been touched since **2026-08-21**, i.e. before
the Dubai fork branched on 2026-08-23 — this is inherited Jakarta code, not
something built for Dubai.

Two concrete gaps found before this can actually work for a Dubai delegate:

- **`CognitoForm.tsx`'s `ACCOUNT_KEY` (`ufIsh1RjbUCGYxX0PV-sug`) and
  `COGNITO_FORM_IDS` (`{ self: '78', partial: '79', alumni: '81' }`) are
  CSCD's Jakarta-titled Cognito forms** ("Self Financed", "Partial (50%
  Scholarship)" — YPDS branding). [[Results and Tiers]] already flagged this
  as "needs re-verification, not copy-as-is" for Dubai. Still unresolved:
  unknown whether Dubai reuses this same Cognito account with new
  Dubai-branded forms (new form ids, same `ACCOUNT_KEY`) or a separate
  account entirely. **Blocking — need the real Dubai form ids (and account
  key, if different) from whoever has Cognito admin access before wiring
  self/partial forms in for real.**
- **`routes/registration.js`'s `APPLICANT_ID_RE` is still
  `/YPDS-JKT-F?\d+/gi`** (and `normaliseApplicantId`'s regex matches it) —
  Dubai's confirmed scheme is `YSF-DXB-2026-FF###` (see the 2026-08-23 entry
  above). As-is, the Cognito registration webhook cannot recognise *any*
  Dubai applicant id in a submission payload, so `registration_status` would
  never flip for a Dubai self/partial delegate even with correct form ids
  wired in. Same issue in `scripts/upload-vouchers.js`'s filename regex,
  lower urgency (vouchers aren't part of this phase). Was already tracked as
  a "known follow-up" below; today's audit confirms it's now a hard blocker
  for this specific phase, not just a someday item.

Not blocking, unchanged from Jakarta and presumed fine as-is:
`www.cognitoforms.com` CSP entries in `app.js`, the seamless-embed mechanics
in `CognitoForm.tsx`, the `full`-tier no-form/direct-confirm behavior, and
`COGNITO_WEBHOOK_SECRET` (documented in `.env.example`, presence in the live
`.env` not checked here per the "never read `.env`" rule — worth a
presence-only check before this ships).

**Client decision (same day): registration forms move to JotForm, not
Cognito.** Investigated JotForm before wiring anything — an existing
"Self Financed - Youth Strategic Forum - Dubai 2026" form (id
`261907698196475`) turned out to be a **different, already-live pipeline**
(marketing-site intake, own autoincrement ID scheme, own webhook into an
n8n workflow on Railway) — not something to repurpose blindly. No dedicated
Partial form exists yet either. **Not resolved yet**: whether that Self
Financed form gets adapted (add an `ApplicantId` hidden field + a second
webhook into this portal) or the portal gets its own dedicated forms built
from scratch. Paused pending the results data actually landing (below) —
worth revisiting now that it has.

### Results workbook received, reconciled against Supabase — not yet written

Client delivered `YSF-Dubai_result_list.xlsx` (repo root, gitignored-PII
territory, not `data/*.json`), then a corrected `ysf-dubai-result-recreated.xlsx`
superseding it same day. Structure differs from Jakarta's evaluation workbook
(no dedicated "Self" sheet — confirmed with the client that **self tier is
the implicit remainder**: everyone scored in the master `Sheet1` tab who
isn't already pulled into `Full`/`Partial`/`Alumni`/`Special Alumni`).

**Tier vocabulary just grew by one.** The recreated workbook split what was
one `Alumni` sheet into two:
- `Alumni` (1 person, Ramazan/`FF330`) — **pays**, same treatment as
  `partial`/`self` (client decision, resolving the "TBD" flagged in
  [[Results and Tiers]] since Jakarta).
- **`Special Alumni`** (3 people) — **brand new tier**, not in the schema or
  client code anywhere yet. Client decision: **no payment**, same treatment
  as `full` (congratulations only). Needs a DB migration (constraint/enum
  currently only allows `full`/`partial`/`self`/`alumni`) and new branches in
  `Results.tsx`/`Dashboard.tsx`'s `CATEGORY_LABELS` before it can render
  anything. **Not yet built.**

Reconciled `reponses/dubai-tiers.csv` (gitignored) against a live Supabase
snapshot (491 delegates seeded — up from the 228 the last entry above
recorded, confirming a further batch landed without this doc being updated
at the time) using `scripts/reconcile-tiers.js --dry-run`. Result: **491/491
matched by applicant_id, 0 conflicts** — full 10, partial 30, alumni 1,
special_alumni 3, self 447. The self count includes 76 delegates who had no
evaluation-sheet entry at all; client decision was to fold them into `self`
rather than leave them untiered.

Cross-checking the sheet against real Supabase data (not just internal
consistency) caught one genuine error a name-only read would have missed:
the sheet listed `YSF-DXB-2026-FF47` against "Prashant," but Supabase says
FF47 is Mansi's ID — Prashant/Prashanth Devendrappa's real ID is `FF473`
(digit-drop typo, 473→47). Both are correctly self-tiered now. Three
blank-applicant-id rows (Layla Eddiakr, Elmira İsmayıllı, Dixa Patel) were
also backfilled via a confirmed-unique name match against Supabase, same
method Jakarta's own script already uses as its lowest-confidence fallback.
51 more apparent "mismatches" from that same cross-check turned out to be
spelling/transliteration noise on real matches (Alaru/Aiaru Abzikir,
Ijaz/Iljaz Ajvazi, etc.) — harmless, left as-is.

Also surfaced, not yet resolved: two Dubai-titled JotForm applications
(`FF1`/`naasrbilal@gmail.com`, the documented test entry from original
seeding, and `FF22`/`hassanmehar580@gmail.com`, the JotForm account owner's
own email — an undocumented second test entry) and a duplicate placeholder
pair (`FF1000`/`FF1001`, both "Bzazou Ghita" — leftover from the original
Tatiana/FF37 ID-collision cleanup that the earlier entry above thought was
resolved by her "keeping FF37"; she's actually not at FF37 at all now).
Client decision: fold all of them into `self` anyway with everyone else
rather than special-case-exclude; cleaning up the test/duplicate accounts
themselves is a separate follow-up.

**Written to Supabase** (2026-08-27): all 491 delegates now have
`result_tier` set — full 10, partial 30, alumni 1, special_alumni 3, self
447. Two writes: `node scripts/reconcile-tiers.js --csv reponses/dubai-tiers-live.csv`
for the 488 non-special_alumni rows (schema didn't support the new tier yet
at that point), then a `2026-08-27-add-special-alumni-tier.sql` migration
(applied via the Supabase MCP's `apply_migration` against `pjdbvjiemguepdyzhlft`
— that MCP tool works fine for DDL on this project despite the earlier
`execute_sql`-403 memory; only `execute_sql` was denied, not `apply_migration`)
followed by a second small write for the 3 special_alumni rows.

### Registration moves to JotForm — built same day

Client decision: registration forms are JotForm, not Cognito (the earlier
"needs re-verification" flag in [[Results and Tiers]] is resolved this way).
Three live forms, confirmed by title via the JotForm API, all created
2026-08-26, structurally identical (Full Name, Email, Declarations, a Stripe
payment block, and a visible `applicantId` text field regex-validated
against `YSF-DXB-2026-FF###`):

| tier | JotForm id |
|---|---|
| partial | `262376041526455` |
| self | `262375715752463` |
| alumni | `262375928037465` |

Built:
- `client/src/components/JotForm.tsx` — plain `<iframe>` embed (JotForm's
  payment-enabled forms serve from `pci.jotform.com`), prefills the
  `applicantId` field via a `?applicantId=<id>` query param on the iframe
  src. Simpler than Cognito's script-injected "seamless" embed at the cost of
  not inheriting the portal's CSS. `CognitoForm.tsx` is left in place, unused.
- `Results.tsx` rewritten to use it; `full` and the new `special_alumni` both
  render nothing (no payment); `partial`/`self`/`alumni` all get a JotForm
  embed now (alumni is new — client decision same day: alumni pays, resolving
  the Jakarta-era "TBD" note).
- `types/index.ts`'s `ResultTier` and `Dashboard.tsx`'s `CATEGORY_LABELS`
  extended with `special_alumni`.
- `app.js` CSP: added `https://pci.jotform.com` to `frameSrc`.
- **New route** `routes/jotform-registration.js`, mounted at
  `/api/registration-jotform` — structurally mirrors `routes/registration.js`
  (secret-protected path, idempotent, match-by-applicant-id) but a different
  payload shape: JotForm POSTs `multipart/form-data` with the actual answers
  JSON-encoded inside a `rawRequest` field, so this route needed `multer`
  (`.none()`, no file fields expected) as a new dependency — added at
  `multer@2.x` specifically (1.x has an open CVE). Matches applicant ids with
  a **Dubai-correct** regex (`YSF-DXB-\d{4}-FF\d+`) — `routes/registration.js`
  still has Jakarta's `YPDS-JKT-F?\d+` and is now legacy/unwired, not fixed as
  part of this change since nothing points at it anymore.
- `lib/email.js` gained `sendRegistrationReceivedEmail()` — fired
  best-effort from the new webhook. **Deliberately simple copy**, not the
  itemized-invoice template (fee breakdown, "what happens next" steps,
  scholarship inclusions list) the client shared as an n8n Code-node
  snippet — that template is for a *different* flow (pre-selection
  application-fee receipts, "Applied For: Fully Funded Scholarship") and its
  `d.fee`/`d.id`/`d.txnId`/`d.Date`/`d.bcc` fields aren't confirmed to map
  onto what these three JotForm forms' Stripe blocks actually return in
  `rawRequest`. Guessing that mapping risks a wrong dollar amount reaching a
  real delegate, so it wasn't attempted — **flagged as an unresolved
  follow-up**, not silently done.
- `.env.example` updated: `COGNITO_WEBHOOK_SECRET` re-labeled legacy; new
  `JOTFORM_WEBHOOK_SECRET` documented. The real secret was generated but
  **could not be written to the live `.env`** (editing `.env` is blocked by
  the harness's permission classifier) — handed to the user to add by hand.

**Both resolved same day**: user added `JOTFORM_WEBHOOK_SECRET` via Hostinger's
env panel and the webhook URL by hand on all 3 JotForm forms (confirmed via
the JotForm API's `GET .../webhooks` — all three list the correct URL).

### Shipped to production — 2026-08-27

Committed only the actual touched files (not the working tree's other
in-progress, unrelated changes — a different reminder-email campaign was
mid-flight in the same working directory) as
`7b857de feat(dubai): results announcement + JotForm registration`, merged
`origin/main`'s two already-diverged countdown-deadline commits (same
content, different hashes — likely cherry-picked/squashed onto main
separately from this branch's copies; a plain `git merge` resolved it with
no conflicts), pushed to `main` (`9b29182`).

**Learned about the deploy pipeline** (wasn't documented anywhere before):
Hostinger's Node.js app for `delegate.thecscd.org` is git-based —
`~/domains/delegate.thecscd.org/hbuilds/` on the box (SSH: `ssh -p 65002
u441737725@46.202.156.8`, credential already in shell history from earlier
work — not otherwise documented, worth adding to this repo's deploy notes),
with `last-source` (a live checkout of `origin/main`), `versions/<id>/` (one
immutable built copy per deploy, each running `npm install && npm run
build`), and `current` (a symlink to the active version) — the running
process is literally `lsnode:.../hbuilds/current/...`. **It auto-deploys
on push** — no manual SSH/build/restart step was actually needed; by the
time this was investigated post-push, `last-source` already had the new
commit and a fresh `versions/` build already existed, node already running
warm off it. `.env` for this app lives separately at
`hbuilds/config/.env`, not in the source tree — matches why editing the
repo's own `.env` was never going to reach production anyway.

**Verified live**, not just deployed: `/health` → 200; the new webhook
route rejects a bad secret with `401` (was `404` pre-deploy, confirming the
route exists now); a correct-secret request with no applicant id → `400`;
a correct-secret request with a well-formed but nonexistent applicant id →
`404 Unknown candidate applicant_id`. All match the route's intended
behavior — this is as far as it can be exercised without a real JotForm
submission or fabricating a change to a real delegate's row.

`npm run build` (tsc + vite) and an `app.js` boot smoke test both clean
throughout.

### Scholarship Holders page + real receipt totals — same day

Client asked for a new in-portal page listing the 10 fully-funded and 30
partially-funded names, plus the `result_poster.webp` graphic they supplied
(a genuine Dubai asset — not to be confused with the pre-existing, unused
`public/img/results-selected-delegates.png`, which turned out to be a
**leftover Jakarta/YPDS asset**, wrong event entirely, never referenced in
code; left alone, not deleted).

- New screen `client/src/components/screens/ScholarshipHolders.tsx`, wired
  into `Screen`/`uiStore`/`AppLayout` the same way every other content
  screen is, nav entry in `Sidebar.tsx` + a Dashboard tile, `award` icon.
  Not added to `BottomNav.tsx` (mobile only has 5 slots, already tight).
- Names are **hardcoded** in `lib/content.ts` (`FULLY_FUNDED`/
  `PARTIALLY_FUNDED`), not fetched from `data/*.json` + API like
  Rundown/Visits — same precedent as `THEMES`/`EXPERIENCE`/`EDITIONS` in the
  same file: this is a fixed, one-time roster, not content still being
  published. Pulled from `delegates.name` (Supabase), the source of truth,
  **not** the sheet's informal first-name-only entries — cross-verified
  against the poster image itself (Full tier's 10 names match exactly).
  A few names were display-cleaned (title-case, stripped an obvious
  data-entry artifact — "Sami Fahd Bakr Baghdadi**12**" → without the
  trailing digits) — cosmetic only, `delegates.name` in the DB is untouched.
- Poster copied to both `client/public/img/` and `public/img/` as
  `ysf-dubai-2026-results-poster.webp` (existing dual-copy convention).

**Receipt email fully resolved** (was the one open item from the JotForm
work above): client confirmed reference number = `applicant_id` (not a
separate generated id, and ignore JotForm's txnId entirely), base fees
**self $499 / partial $299 / alumni $250**, flat **8%** tax/processing,
**show only the total** (no line-item breakdown). `lib/email.js`'s
`sendRegistrationReceivedEmail` rewritten accordingly;
`routes/jotform-registration.js` now passes `applicantId` through. No
longer a follow-up.

`npm run build` clean again after this batch; poster confirmed present in
`client/dist/img/`.

## What's still open

- **Results/tiers phase is now started but blocked** — see above: need real
  Dubai Cognito form ids (self/partial, +account key if different) and the
  `APPLICANT_ID_RE` regex fix in `routes/registration.js` before the
  already-built self/partial registration flow can work for a real Dubai
  delegate. No Dubai evaluation workbook/results list exists yet either —
  that's the separate input `scripts/reconcile-tiers.js` will need once the
  client delivers it.
- **`EVENT_NAME` in `.env`** ("YSF Dubai 2026") doesn't match the form used elsewhere in the portal — needs a decision, not resolved here.
- **Sending credentials to the 228 seeded delegates** hasn't happened yet — `scripts/send_credentials.py` is ready, the deadline is set, and the anon key works, so nothing code-side is blocking it anymore. Just needs to actually be run against `dubai-credentials.csv`.
- **Tatiana Zvenigorodskaia** needs a freshly-assigned applicant ID before she can be seeded (see above) — she's the one known gap in the 228. **Decided (2026-08-23): not urgent, deliberately deferred.** A further batch of candidates is expected with IDs greater than 230 — she'll be assigned an ID and seeded together with that batch rather than one-off now. ⏰ **Remind the user about her when they bring the next batch of candidate IDs.**
- `routes/registration.js`'s `APPLICANT_ID_RE` and `scripts/upload-vouchers.js` still expect Jakarta's `YPDS-JKT-F###` format, not the confirmed `YSF-DXB-2026-FF###` — see the results-phase entry above, this is now a hard blocker rather than a someday item.
- **Leaked-password protection** off in Supabase Auth — low-priority toggle.
- **AidaForm webhook secret** needs to be configured on AidaForm's own dashboard (manual, outside this repo) before webhook-driven interview submissions will actually flip `interview_status`.
- Everything else in [[Dubai Fork Plan]]'s Phase 3/4 (registration mechanism, `coordinatorGroups.ts` deletion, email toolkit) is still untouched and still blocked on the same open decisions listed there.

## Related

[[Dubai Fork Plan]] · [[Dubai Design System]] · [[Design System]] · [[Interview System]] · [[Known Issues and Dead Code]]
