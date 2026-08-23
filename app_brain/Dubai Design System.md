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

## Related

[[Jakarta Branding Inventory]] · [[Design System]] · [[Dubai Fork Plan]] · [[Results and Tiers]]
