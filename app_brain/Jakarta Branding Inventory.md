---
tags: [core, dubai-fork]
---

# Jakarta Branding Inventory

← [[Home]] · see also [[Design System]], [[Event Lifecycle Stages]]

Exhaustive, file-by-file checklist of every Jakarta/YPDS/Indonesia-specific reference found in the codebase, classified:
- **EVENT** — must change for Dubai
- **REUSABLE** — org-level or generic, keep as-is
- **AMBIGUOUS** — needs a judgment call once Dubai specifics are known

This is the master checklist to work from once the Dubai brief arrives — pair it with [[Event Lifecycle Stages]] to know *when* each piece matters.

## Highest-density rewrite targets

**`client/src/lib/content.ts`** (entire file — About screen copy) — **EVENT**. `SUMMIT` (edition, dates, location, tagline, intro/rationale/participants prose all name Jakarta/Indonesia/SEA), `EXPERIENCE` ("historic Jakarta", Indonesian culinary), `EDITIONS` (past-editions array incl. Baku/Istanbul/Tashkent/Jakarta — Dubai needs a new entry, and whether Jakarta stays listed as history is a content decision). `THEMES` (six diplomacy-theme blurbs) is **AMBIGUOUS/mostly reusable** — generic diplomacy content, likely fine verbatim or lightly edited.

**`client/src/components/screens/About.tsx`** — **EVENT**: lines with "The Jakarta experience", "Jakarta not as tourists", "Indonesian landmarks" — hardcoded JSX, bypasses `content.ts` entirely, easy to miss.

**`data/rundown.json`, `data/visits.json`, `data/hotels.json`, `data/speakers.json`** — **EVENT**, entire files, fully populated with real Jakarta content (not placeholders — verified 2026-08-23, contradicting `CLAUDE.md`'s "all currently empty" claim, which is now stale for these four). `data/checkin.json` is the one file still genuinely a placeholder. See [[Data Model]] for how this content is served.

**`data/contact.json`** — **AMBIGUOUS**: org/contact email is reusable, but the `socials` entry (`"YPDS Jakarta 2026"` / `thecscd.org/ypds-jakarta-2026/`) is event-specific.

## UI components

- **`Dashboard.tsx`** — **EVENT**: credential-card "seal" text hardcodes `YPDS / JKT / 2026` as three literals (not driven by `eventName`); banner `src="/img/ypds-jakarta-2026-banner.png"` + alt text.
- **`Hotel.tsx`** — **EVENT**, extensively hardcoded: `BOOKING` const (hotel name, dates, booking number, logistics-partner name "Diplomark"), "proof of accommodation in Indonesia", "Arriving in Jakarta" eyebrow. File's own header comment already flags this should move server-side for a future cohort — good opportunity to fix it *while* forking rather than just rename strings in place.
- **`Rundown.tsx`** — **EVENT**: ComingSoon copy "The programme for Jakarta is coming together...".
- **`authStore.ts`** — **EVENT**: `eventName: 'YPDS Jakarta 2026'` default/fallback.

## Server-side

- **`app.js`** line ~107 — **EVENT**: `.ics` calendar `PRODID:-//CSCD//YPDS Jakarta 2026//EN`. The `eventName` fallback (`'CSCD Delegate App'`) itself is **REUSABLE**.
- **`routes/registration.js`** — **EVENT, and functional not cosmetic**: `APPLICANT_ID_RE = /YPDS-JKT-F?\d+/gi` — see [[Registration Flow]] for why this can't just be renamed, it has to be updated in lockstep with however Dubai applicant ids are generated.
- **`routes/me.js`, `routes/public.js`** — **EVENT**: `hotels['jakarta-hotel']` key/fallback, tied to `data/hotels.json`'s key name.
- **`lib/reminders.js`** — **EVENT**: `Asia/Jakarta` timezone fallback.

## Config / manifest / HTML shells

- **`public/manifest.json`** — **EVENT** (name/short_name/description only; `background_color`/`theme_color` are design tokens, **REUSABLE** if the palette carries over).
- **`client/index.html`, `public/index.html`** — **EVENT**: `<title>`, meta description. Icons/fonts/theme-flash script are **REUSABLE**.
- **`.env.example`** — mostly **REUSABLE** (var names generic); the comment documenting `applicant_id (YPDS-JKT-F###)` format is **EVENT**.

## Images

- **EVENT**: `ypds-jakarta-2026-banner.png`, `tugu-kunstkring.webp`.
- **REUSABLE**: `cscd-logo.png`, `logo-wide.png`, `icon-192.png`, `icon-512.png`.
- **AMBIGUOUS**: `results-selected-delegates.png` — filename isn't Jakarta-specific but no code reference was found; check if dead before deciding.

## Legacy vanilla frontend (`public/js/app.js`, `public/css/app.css`)

Retired reference code per `CLAUDE.md`, but still event-specific throughout: `Jakarta 2026` fallback, `Asia/Jakarta` repeated timezone handling, banner path/alt text, ICS `PRODID`, header comments naming Jakarta. **Decide during the fork whether to keep maintaining this as reference or delete it** — it's not served to users (React `client/dist` takes priority) but does still get built/shipped as a fallback static layer.

## Special case — not a rename target, a deletion

**`client/src/data/coordinatorGroups.ts`** and its consumers (`Activity.tsx`, `ActivityNotice.tsx`, `CoordinatorActivity.tsx`) — the file's **own header comment** says: *"These are deliberately shared, disposable workshop accounts. Remove this file and CoordinatorActivity.tsx (+ its use in Dashboard.tsx) after the session."* Contains live shared coordinator credentials and real Jakarta-cohort participant names/emails — this is PII and live credentials, not branding text. **Delete, don't reskin.** Full detail in [[Known Issues and Dead Code]].

## Registration/payment — event-specific but not caught by a Jakarta/YPDS text search

- **`CognitoForm.tsx`**: `ACCOUNT_KEY` (CSCD's Cognito account) and the `78/79/81` form-id mapping — see [[Results and Tiers]] for why this needs careful re-verification, not blind copying.
- **`scripts/upload-vouchers.js`**, **`scripts/reformat-applicant-ids.js`**, **`scripts/reconcile-tiers.js`** — all hardcode the `YPDS-JKT-F###` id format in filename parsing / regex, same caveat as `routes/registration.js`.
- **`scripts/credential-email.html`** — entire onboarding email template, not just variable substitution: title, body copy, interview deadline, venue name are all hardcoded prose, not `{{...}}` placeholders.

## Reference material, not shipped code

- **`jakartaPage.html`** (repo root) — standalone marketing landing page, not served by the app. Source that `content.ts` was "lifted from." Most likely replaced wholesale by an equivalent Dubai page rather than edited in place. (Its internal CSS scoping prefix happens to be `ysf-*` — coincidental, unrelated to the new "YSF Dubai" name, don't read anything into it.)
- **`color.md`** (repo root) — **stale**, describes an *earlier* Frankfurt/CIPES theme, not the current Jakarta one. Recommend deleting or fully rewriting rather than treating as a design reference — see [[Known Issues and Dead Code]].

## Reusable / org-level surfaces (confirmed, not itemized further)

All `CSCD`, `thecscd.org`, `cds.thecscd.org`, `contact@thecscd.org` references, the `delegates` table/noun (explicitly generic per `CLAUDE.md`), `cscd_token`/`cscd_theme` localStorage keys, `cscd-v2` service-worker cache name, `cscd-delegate-app` package name. `portal.thecscd.org` as the deploy domain is **AMBIGUOUS** — reusable if Dubai shares the domain, event-specific if it gets its own subdomain.

## Related

[[Event Lifecycle Stages]] · [[Design System]] · [[Data Model]] · [[Registration Flow]] · [[Known Issues and Dead Code]]
