---
tags: [design, dubai-fork]
---

# Dubai Design System

← [[Home]] · source: `cscd_website/src/components/events/ysf-dubai-2026/` (+ `ysfReference.ts`, the live static-HTML export actually rendered at `/events/ysf-dubai-2026`)

## ⚠️ Two disconnected Dubai implementations exist on the marketing site

- **Live page**: a frozen ~510KB static HTML/CSS/JS export (`ysfReference.ts`) injected via `innerHTML`, GSAP-driven. This is what visitors see.
- **Orphaned React component library** (`ProverbBand`, `ShapeTheFuture`, `TopicsRing`, `LegacyJourney`, `JourneyRow`, `AgendaSection`, `ModulesBook`, `StrategyRoom`, `VenueSection`, `StaySection`, `TierBoardYsf`, `TierConsoleYsf`): built, never mounted — not imported by any route. Only `RegHero`, `RegistrationMarquee`, `RegistrationFormCard`, and the three `*Description` components are actually live, wired into the 3 registration pages.

Use the live export as visual ground truth; use the orphaned components as a **readable source of the same copy** (they mirror it 1:1 per their own code comments) rather than parsing the HTML blob.

## Color palette — NOT the `ysfRed`/`ysfYellow` tokens

Despite the names, `tailwind.config.ts`'s `ysfRed #ea0558` / `ysfYellow #E6EB1C` / `ysfBeige #F9F6F0` / `ysfDark #2c2825` belong to **Jakarta** (`YpdsJakartaClient.tsx` uses them directly as Tailwind classes). Dubai instead overrides the `--forest`/`--gold` variable *names* in a later-cascading `#ysf2026 {}` CSS block:

| token | hex | role |
|---|---|---|
| `--forest` | `#8c2231` | primary — maroon (buttons, headings, accents) |
| `--forest-700` | `#6e1723` | |
| `--deep-forest` | `#3a0e14` | dark card backgrounds |
| `--gold` | `#d9a521` | secondary — mustard (hover fills, badges) |
| `--gold-soft` | `#eac15c` | |
| `--ysf-cream` | `#fbfaf6` | section/body background |
| `--ysf-mist` | `#f4eeee` | card-tint background |
| `--ysf-mint` | `#c24c58` | lighter maroon accent (icons) |
| `--ysf-tint` | `#fbe7c5` | warm parchment — venue bg, form-card panel bg |
| `--ink` | `#1c231f` | unchanged from base site |

Muted maroon/gold/cream, restrained "library/strategic" tone — deliberately different from Jakarta's saturated red/yellow "vintage poster" look. Hero uses a **neutral dark scrim, no color tint** (explicit code comment: "no green tint" — carries over as "no color tint" intent generally).

## Typography

- **Archivo** 800, uppercase, tight leading — display headings
- Italic Archivo in gold — accent word within headings
- **Inter** — body text
- **DM Mono** uppercase, wide tracking — kickers/labels/pills
- **Fraunces** italic — serif accent captions
- **Reem Kufi** — Arabic text (currently unused on the live page)

Entirely disjoint from Jakarta's Cinzel/Cormorant Garamond (marketing site) and the delegate portal's Cinzel/Cormorant/Lato (see [[Design System]]).

## Signature visual patterns

Gold wipe-fill button hover (bottom-up, text flips to deep-forest) · chess-motif pricing (Knight = Fully Funded, Rook = Self Financed) · flipbook module explorer · "Situation Room" laptop boot-sequence demo · soft-blur decorative blobs · kicker pattern (gold ✦ + small-caps maroon label before headings).

## Event facts

- **Dates**: September 22–25, 2026. **Venue**: Mohammed Bin Rashid Library, Al Jaddaf, Dubai.
- **Hotel**: Gevora Hotel, Sheikh Zayed Road ("tallest hotel in the world," 75 floors, 356m).
- **Agenda**: Day 1 arrivals + orientation + Marina cruise dinner · Day 2 Modules 1–4 + desert safari · Day 3 Modules 5–6 + certification ceremony + closing · Day 4 checkout.
- **6 program modules**: AI Creativity & Human Expression · Digital Storytelling & Youth Culture · Smart Cities & Creative Communities · Aesthetics of Technology & Lifestyle · Virtual Escapism & Immersive Travel · Art, Media & Cultural Influence.
- **Tiers found**: Fully Funded (applications closed, merit-based) and Self Financed ($599) — both share an 11-bullet feature list. **Summit Pass** exists only as a standalone registration page + AidaForm — no price/feature board built for it anywhere.
- Imagery: `/assets/img/events/ysf-dubai-2026/*.webp`, `/assets/video/dubai-hero.webm`.

## ⚠️ Registration: Dubai uses AidaForm, not Cognito

All three live Dubai registration pages embed **AidaForm** (account **15158**):

| tier | AidaForm URL |
|---|---|
| Fully Funded | `https://15158.aidaform.com/application-form-3-0-young-strategic-forum-dubai-2026` |
| Self Financed | `https://15158.aidaform.com/self-financed-young-strategic-forum-dubai-2026` |
| Summit Pass | `https://15158.aidaform.com/form-access-3-0-youth-strategic-forum-dubai-2026` |

No Cognito account/form ids exist anywhere in the Dubai code path. This is the single biggest structural finding for the fork — see [[Dubai Fork Plan]]'s open decisions. (Side note: the marketing site's own **Jakarta** registration pages use Cognito form ids **65/70/52**, different from the delegate portal's **78/79/81** on the same Cognito account — a pre-existing inconsistency between the two Jakarta codebases, not something to carry forward as correct.)

## 2026-08-23 refinement — card surface, radius/shadow scale, corrected maroon/sand pair

Portal `globals.css` had already done the Phase 1 token swap (see
[[Dubai Fork Progress]]), but a closer source — a spec artifact reconstructing
the live **"About the Forum"** section's actual markup/CSS
(`ysfReference.ts` / `#ysf2026`) — surfaced two component-level gaps between
that swap and the real site, plus the client supplied a corrected color pair
directly from the official crest banner. All three landed in
`client/src/styles/globals.css` this session:

1. **Card surface was wrong.** The real site's content cards
   (`.ysf-about__box`, fact tiles' neighbor surfaces) are **white**, sitting on
   the cream page — the portal had been using the mist tint (`--surface-2`,
   `#f4eeee`) for every card uniformly, which is actually the *tinted-panel*
   role (callouts, CTA borders), not the plain-card role. Added a new
   `--card` token (white in light mode; unchanged deep-forest in dark, since
   there's no dark-mode "white card" equivalent) and repointed the plain
   content-card classes (`.card`, `.login-card`, `.error-card`, `.tile`,
   `.t-card`, `.theme-card`, `.modal`, `.menu-drawer`, `.coming-soon`/
   `.interview-notice`, `.interview-embed-wrap`, `.interview-self-report`) to
   it. Accent-tinted panels that are meant to stand out with a colored border
   (`.result-cta`, `.remind-card`, `.activity-notice`, `.interview-warning`,
   `.coord-cred`) correctly kept `--surface-2` — that matches the real site's
   own tinted-callout pattern.
2. **Radius/shadow scale was much tighter than the real site.** The real
   card is `border-radius: 36px` with a soft `0 40px 100px rgba(15,31,24,.06)`
   shadow; fact tiles and the photo-bento tiles use `18px`; the deadline badge
   uses `24px`. The portal had `--radius-lg: 10px` and a comparatively tight,
   darker shadow. Bumped `--radius-lg` to `18px` (now correct for
   tiles/general cards), added a new `--radius-xl: 28px` for the hero-weight
   cards (`.login-card`, `.pass` credential card, `.countdown-card`,
   `.interview-cta`, `.result-cta` — scaled down from the live 36px for a
   compact mobile column), and softened `--shadow-sm`/`--shadow` to a larger,
   lower-opacity spread in both themes.
3. **Kicker mark.** The real "About" section's kicker (`.r-kicker`) leads with
   a gold `✦` before the uppercase mono label. Added a `::before` `✦` to the
   portal's equivalent kicker classes (`.eyebrow`, `.section-label`,
   `.card-eyebrow`) — colored `--brass-ink` rather than `--brass` itself,
   since `--brass` is now a very pale sand (see below) that wouldn't read
   against the cream page as a small mark.
4. **Color correction, supplied by the client**: the official crest-banner
   artwork (maroon field, cream/sand type, black crest, no gold anywhere) gave
   exact hex — **`#8E2631`** maroon and **`#FCE2C3`** warm sand — which
   superseded the marketing-site-CSS-derived `#8c2231`/`#d9a521` pair this
   doc's color table above still shows. `--signal` and `--brass` (light *and*
   dark) now use the crest pair; `--brass-ink` (`#3a0e14`, dark text on the
   light accent) needed no change. **The color table above is now stale for
   `--forest`/`--gold`'s exact hex** — the *roles* (maroon primary, warm
   secondary) and every other row still hold, just not those two hex values.
   Worth a full re-audit against the crest asset if it turns out to be the
   authoritative brand source going forward, rather than patching this note
   piecemeal.
5. **Not applied — flagged for later, not dead-coded now**: the "About"
   section also documents a fact-tile 2×2 grid, a gradient flip-unit countdown
   (Archivo tabular numerals, `--maroon-bright`→`--maroon` gradient, cream
   digits), a circular deadline badge, and a tall/top/mid/band photo-bento
   grid. None of these have a consuming component in the portal yet (the
   portal's own countdown/hero patterns are already built differently), so no
   unused CSS was added for them — revisit if/when the About screen or
   Dashboard grows a matching section.

Verified: `npm run build` (client) clean; light + dark login-screen
screenshots (Playwright CLI) confirm the white card, larger radius, softer
shadow, and corrected maroon button color in both themes.

## 2026-08-23, same day — reconciled against `scripts/credential-email.html`

Before pushing, checked the portal tokens against the credential email, which
turned out to already be built against the true palette (client-verified
colors) more precisely than the portal was. Found and fixed real
discrepancies rather than assuming the two should just match on principle:

- **`--ink`**: `#1c231f` (greenish near-black) → **`#241417`** (the email's
  actual text color, warm near-black). `--ink-soft`/`--ink-faint` switched
  from ink-derived `rgba()` to the email's own solid `#5b6660`/`#8a7e7a`.
- **`--line`/`--line-strong`**: rebased from an ink-derived rgb to the email's
  `rgba(26,51,38,…)` — same alpha values kept, hue corrected.
- **`--surface-2` was the wrong tier.** It held the mist color (`#f4eeee`)
  and was used for tinted panels — but the email's tinted inset panels
  ("Your Login," "Next Steps") use **parchment `#faf8f4`**, and mist is only
  the email's outermost footer strip. `--surface-2` → `#faf8f4`; added
  `--surface-3: #f4eeee` for that quieter outer tier (not consumed by any
  portal component yet — kept for palette parity, apply it if the portal ever
  grows a footer-like strip).
- **`--brass` was the wrong hex, from the earlier same-day pass.** The
  crest-banner sand (`#fce2c3`) the client supplied is real, but the email
  only uses it for light label *text* sitting on a maroon fill — never as a
  badge/chip/button background. Badges, the password chip, and the deadline
  banner all use a **medium gold, `#e7c673`**, with maroon (`#8e2631`) as the
  ink on top — not the deep-forest `#3a0e14` the portal had been using as
  "text on brass" since the Jakarta fork. `--brass` → `#e7c673`, `--brass-ink`
  → `#8e2631`. The ✦ kicker mark (added earlier this session) was recolored
  from `--brass-ink` to `--brass` accordingly — it needs the visible gold
  fill, not the maroon ink color, to read as a mark distinct from the kicker
  text next to it.
- **`--shadow-sm`/`--shadow` swapped for the artifact's literal formula** —
  the email's own `box-shadow` turned out to be a verbatim copy of the "About
  the Forum" artifact's `--shadow`/`--shadow-lg` tokens
  (`rgba(15,31,24,…)` base), confirming that artifact as a real source rather
  than a documentation-page invention. Replaced the hand-tuned values from
  earlier today with the exact formula.
- **`border-radius:0` in the email was deliberately NOT carried over.** Every
  box in the email is zero-radius, but that reads as an Outlook-compatibility
  default for HTML email (widely inconsistent border-radius support across
  clients), not a squared-corner brand statement — the soft 18–36px radius
  scale has its own direct source (the live web card geometry) and stayed as
  applied earlier today. Flagging the conflict here rather than silently
  picking a side, in case the client's intent turns out to be a sharper,
  more "formal crest/passport" look across the whole product after all.

Re-verified after this pass: `npm run build` clean, fresh Playwright
screenshot of the login screen.

## 2026-08-23, later same day — radius question resolved: flattened to match the email

The `border-radius:0` conflict flagged as an open question above was put to
the client directly (screenshot of the portal next to a screenshot of the
rendered email). **Decision: flatten the portal, not round the email.**
`--radius`/`--radius-lg`/`--radius-xl` all set to `0` in
`client/src/styles/globals.css` — every card, tile, button, chip, input, and
modal in the portal is now sharp-cornered, matching
`scripts/credential-email.html` exactly.

The tokens themselves were kept (not deleted) with their original 6/18/28px
values preserved in comments, so the soft-radius direction — which does have
real sourcing, the live "About the Forum" web section's actual card geometry
— can be revisited without re-deriving it, if a future design pass wants it.
Everything else from the two passes above (white `--card`, parchment
`--surface-2`, the `--signal`/`--brass` crest-email pair, the softened
diffuse shadows, the ✦ kicker) is unaffected — only the corner radius
reverted.

Re-verified: `npm run build` clean, fresh Playwright screenshot of the login
screen confirms sharp corners throughout.

## 2026-08-23, later still — primary button recolored to the crest pair, new `--sand` token

Client pointed at the crest-banner artwork directly (maroon field, "FRONTIER"
set in a pale sand type) and asked for the primary button to be maroon by
default, hovering to that sand color specifically — not the email's badge
gold (`--brass`, `#e7c673`). Those two light accents are visually close but
are not the same swatch, so rather than overload `--brass` with a second
meaning, added a new token:

- **`--sand: #fce2c3`** (light and dark, theme-invariant like `--brass`) —
  reserved for this hover fill. `--brass` keeps its existing, email-matched
  role (badges, chips, deadline banner) untouched.
- `.btn`'s default shadow switched from the neutral `--shadow-sm` to a
  maroon-tinted one, matching the email's CTA button exactly:
  `0 10px 24px rgba(var(--signal-rgb), .22)`.
- `.btn:hover` now: `background: var(--sand); color: var(--signal);` (maroon
  text on sand, for contrast — white text doesn't work on a pale fill), with
  a deepened version of the same maroon-tinted shadow on hover for lift
  feedback. Nothing else changed `--brass`/`--brass-ink` usages elsewhere
  (badges, chips, deadline-style banners) still read the gold, as verified
  against the email.

Verified: `npm run build` clean; Playwright screenshots of both the resting
and `:hover` state of the login screen's Sign In button confirm maroon
default → sand hover with maroon text, and the maroon-tinted shadow.

## Related

[[Jakarta Branding Inventory]] · [[Design System]] · [[Dubai Fork Plan]] · [[Dubai Fork Progress]] · [[Results and Tiers]]
