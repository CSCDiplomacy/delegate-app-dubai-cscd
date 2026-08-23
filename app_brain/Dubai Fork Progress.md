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

## What's still open

- **`EVENT_NAME` in `.env`** ("YSF Dubai 2026") doesn't match the form used elsewhere in the portal — needs a decision, not resolved here.
- **Sending credentials to the 228 seeded delegates** hasn't happened yet — `scripts/send_credentials.py` is ready, the deadline is set, and the anon key works, so nothing code-side is blocking it anymore. Just needs to actually be run against `dubai-credentials.csv`.
- **Tatiana Zvenigorodskaia** needs a freshly-assigned applicant ID before she can be seeded (see above) — she's the one known gap in the 228. **Decided (2026-08-23): not urgent, deliberately deferred.** A further batch of candidates is expected with IDs greater than 230 — she'll be assigned an ID and seeded together with that batch rather than one-off now. ⏰ **Remind the user about her when they bring the next batch of candidate IDs.**
- `routes/registration.js`'s `APPLICANT_ID_RE` and `scripts/upload-vouchers.js` still expect Jakarta's `YPDS-JKT-F###` format, not the confirmed `YSF-DXB-2026-FF###` — low urgency while registration stays postponed, but a known follow-up.
- **Leaked-password protection** off in Supabase Auth — low-priority toggle.
- **AidaForm webhook secret** needs to be configured on AidaForm's own dashboard (manual, outside this repo) before webhook-driven interview submissions will actually flip `interview_status`.
- Everything else in [[Dubai Fork Plan]]'s Phase 3/4 (registration mechanism, `coordinatorGroups.ts` deletion, email toolkit) is still untouched and still blocked on the same open decisions listed there.

## Related

[[Dubai Fork Plan]] · [[Dubai Design System]] · [[Design System]] · [[Interview System]] · [[Known Issues and Dead Code]]
