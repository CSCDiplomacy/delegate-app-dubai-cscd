---
tags: [frontend]
---

# Frontend Structure

← [[Home]] · see also [[Design System]], [[Auth and Gating]]

React 19 + TypeScript + Vite, `client/src/`. No router — screen switching is a Zustand-driven state machine.

## App shell (`App.tsx`, `main.tsx`)

`main.tsx` mounts `<App/>`, imports `styles/globals.css` (⚠️ **not** `src/index.css`, which is unused Vite-template boilerplate — see [[Known Issues and Dead Code]]), and registers `/sw.js` in production only.

`App.tsx`: `useAuthStore.init()` fires on mount; renders `LoginView` (no session) → `AppLayout` (session present) → a brief `Splash` for returning users mid session-restore → `LoginView` as fallback.

## Routing: `uiStore.ts`

No router library. A `Screen` union type (`dashboard | interview | activity | about | rundown | venue | hotel | schedule | contact`) drives `activeScreen`. `switchScreen()` writes to `location.hash` via `history.replaceState` (bookmarkable/refresh-safe); `initialScreen()` reads the hash on load. `THEME_KEY='cscd_theme'` in localStorage carries over from the legacy vanilla app deliberately.

⚠️ Note: `results` is **not** in this `Screen` union — confirms [[Results and Tiers]]: the Results screen is dead as a *routed* screen, only its `TierResult` export is used, inline on Dashboard.

## Layout (`components/layout/`)

- **AppLayout.tsx** — the shell: `Sidebar` + `TopBar` + active screen component + `MenuDrawer` + `BottomNav`. Computes `showInterview` (currently always `false`, see [[Auth and Gating]]) and `showActivity` (region lookup by email — Jakarta-cohort-only, see [[Known Issues and Dead Code]]). Auto-redirects to dashboard if the active screen becomes gated off.
- **Sidebar.tsx** (desktop) — brand block, nav list, user card, theme toggle, sign out.
- **BottomNav.tsx** (mobile) — hard 5-slot limit; swaps Schedule→Hotel for the ~17 voucher delegates; Activity bumps to 2nd slot when applicable.
- **TopBar.tsx** — mobile brand row + theme toggle + menu button.
- **MenuDrawer.tsx** — mobile secondary menu, external CSCD website link.

## State stores (`stores/`)

- **`authStore.ts`** — session, profile, `eventName`, gating helpers. Full detail in [[Auth and Gating]].
- **`delegateStore.ts`** — `rundown`, `contact`, `actionItems`, `favourites` (Set), `voucherAvailable` (gates Hotel nav — true only for the shared-hotel-booking cohort). `loadAll()` parallel-fetches; `toggleFavourite()` is optimistic with rollback.
- **`uiStore.ts`** — `theme`, `activeScreen`, `menuOpen`, routing whitelist. Theme applied to `<html data-theme>` at module load, before first paint, mirrored by an inline script in `client/index.html`.

## Screens (`components/screens/`)

| Screen | Renders | Status |
|---|---|---|
| **Dashboard** | Boarding-pass hero, `ActivityNotice`, inline `TierResult`, nav tiles, banner | Live, event-specific content — see [[Jakarta Branding Inventory]] |
| **Interview** | AidaForm embed / self-report flow | Currently unreachable (gated off), code intact — see [[Interview System]] |
| **Results** (`Results.tsx`) | Exports `TierResult` used by Dashboard | **Not a routed screen** — see [[Results and Tiers]] |
| **Rundown** | Day-tabbed timeline, favourite toggle | Live |
| **Hotel** | Hotel reference + hardcoded voucher/booking summary for the shared-booking cohort | Live, heavily hardcoded — flagged for a future data-driven rewrite in its own file header |
| **Schedule** | "My Schedule" — favourited sessions | Live, fully generic |
| **Venue** | Institutional visits list, from `/api/visits` | Live, data-driven |
| **Contact** | Contact list + feedback form | Live, mostly generic |
| **About** | "The Summit" narrative from `lib/content.ts` | Live — note one paragraph is hardcoded JSX, bypassing `content.ts` |
| **Activity** | Wraps `CoordinatorActivity` | **Temporary, session-only** — see [[Known Issues and Dead Code]] |
| **ActivityNotice** | Dashboard notice pointing to Activity tab | Temporary, same as above |
| **CoordinatorActivity** | Group activity card, coordinator logins, member roster | Temporary — contains live credentials + participant PII, see [[Known Issues and Dead Code]] |
| **ActionsToDo** | "Actions to do" checklist card | **Dead code** — not imported/rendered anywhere |
| **WhatsAppLinks** | WhatsApp invite buttons | Effectively unreachable (only used by the dead `ActionsToDo`) |

## Data/service layer

- **`services/api.ts`** — thin fetch wrapper, prefixes `/api`, attaches Bearer token from `localStorage['cscd_token']`, plus `track()` analytics. Generic/reusable.
- **`services/data.ts`** — typed loaders wrapping the Express routes (rundown, contact, action items, favourites, voucher, feedback). Generic/reusable.
- **`types/index.ts`** — shared TS interfaces mirroring the API 1:1. Generic/reusable — the contract file a Dubai fork keeps as-is unless the API shape changes.
- **`lib/utils.ts`** — pure formatting helpers (time, date, maps links). Generic/reusable.
- **`lib/content.ts`** — About-screen marketing copy. Entirely Jakarta-specific prose, needs a full Dubai rewrite — see [[Jakarta Branding Inventory]].

## Related

[[Design System]] · [[Auth and Gating]] · [[Known Issues and Dead Code]] · [[Jakarta Branding Inventory]]
