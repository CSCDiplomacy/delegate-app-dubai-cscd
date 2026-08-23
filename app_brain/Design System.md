---
tags: [frontend, design]
---

# Design System

← [[Home]] · see also [[Frontend Structure]]

Jakarta **neo-brutalist** theme: cream + near-black base, crimson signal color, electric-yellow accent, hard offset shadows (no blur). Light + dark via `[data-theme]` on `<html>`, persisted in `localStorage` (`cscd_theme`).

**Invariant to preserve in the fork**: no literal brand hex outside the two token blocks. Every component reads CSS variables. This held true in the audit — no hex values were found in `client/src/**/*.tsx`, `public/js/app.js`, or the server `app.js`; the only hex lives inside the token blocks below, plus five minor non-brand exceptions (error red, white icon dots) in the legacy CSS.

## The real design system: `client/src/styles/globals.css` (imported by `main.tsx`)

Tailwind v4, CSS-first. Two token blocks:

**`:root` (light)**
```
--surface:#f9f6f0  --surface-2:#fffdf8  --ink:#2c2825  --ink-strong:#1a1714
--ink-soft/--ink-faint: rgba(44,40,37, .60/.42)
--line/--line-strong: rgba(44,40,37, .14/.24)
--signal:#ea0558  --signal-ink:#ffffff        (crimson = primary action)
--brass:#e6eb1c   --brass-ink:#2c2825          (electric yellow = accent)
--ok:#2f7d54
--form-surface:#ffffff
--radius:6px  --radius-lg:10px
```

**`[data-theme='dark']`**
```
--surface:#14110c  --surface-2:#211d16  --ink:#ece4d5  --ink-strong:#faf5eb
--signal:#ff4d80 (crimson lifted for dark-mode contrast)  --signal-ink:#17130d
--brass:#e6eb1c  --brass-ink:#17130d
--ok:#5ac98d  --form-surface:#ffffff (kept white — Cognito embed forces a white background)
```

`@theme inline` maps these into Tailwind (`--color-surface`, `--color-signal`, `--color-brass`, ...) plus font tokens: `--font-display: 'Cinzel'`, `--font-accent: 'Cormorant Garamond'`, `--font-body: 'Lato', system-ui, sans-serif`. Fonts loaded via Google Fonts `<link>` in `client/index.html`.

## ⚠️ Naming inversion: `globals.css` vs legacy `public/css/app.css`

The legacy vanilla-app CSS (`CLAUDE.md`'s stated "spec" for the React app) has **its own, larger** token set — and critically, `--signal` means something different there:

```
public/css/app.css:  --signal = #E6EB1C (BRASS/yellow)   --signal-crimson = #EA0558 (separate token)
globals.css:          --signal = #EA0558 (crimson)        (no separate --signal-crimson)
```

**Do not treat the legacy CSS as an authoritative token reference without translating `--signal`** — its meaning flipped when the token system moved into React. The legacy file also has tokens never carried into `globals.css`: `--type-meal:#B2560D`, `--type-social:#1F6F8B`, `--type-workshop:#6B3FA0` (used by `typeAccent` in `public/js/app.js:385` to color-code rundown timeline dots by item type).

**Possible parity gap**: the React `Rundown.tsx`/`Icon.tsx` (`typeIcon()` helper) maps item type → icon *shape* only, not to an accent *color*. Worth confirming before assuming the `--type-*` color-coding survived the React port — if it didn't, that's either an intentional simplification or a dropped feature, not something to blindly re-add during the Dubai fork without checking which it was.

## Assets

`client/public/img/` and `public/img/` are near-duplicate sets (6 files, `public/img/` additionally has `logo-wide.png`):

| File | Reusable? |
|---|---|
| `cscd-logo.png` | Reusable — CSCD org logo |
| `icon-192.png`, `icon-512.png` | Reusable — PWA icons |
| `logo-wide.png` | Likely reusable CSCD wordmark — referencer unclear, check before deleting |
| `results-selected-delegates.png` | Possibly dead — no reference found in `client/src` |
| `ypds-jakarta-2026-banner.png` | Jakarta-specific — Dashboard hero banner, needs a Dubai replacement + rename |
| `tugu-kunstkring.webp` | Jakarta-specific — welcome-dinner venue photo, referenced from `data/visits.json` |

## Related

[[Frontend Structure]] · [[Jakarta Branding Inventory]] · [[Known Issues and Dead Code]]
