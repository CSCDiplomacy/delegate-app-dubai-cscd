---
tags: [moc]
---

# CSCD Delegate App — System Brain (Jakarta snapshot, 2026-08-23)

This vault documents the **current, live state** of the CSCD delegate portal as it stands mid-way through **YPDS Jakarta 2026** (the event is executing right now — see [[Event Lifecycle Stages]]). It exists so we can compare this system against the upcoming **YSF Dubai 2026** requirements and plan the fork/re-skin without re-deriving context from scratch.

Everything here was verified against the actual code on 2026-08-23, not just against `CLAUDE.md` (which has some drift — see [[Known Issues and Dead Code]]).

## How to read this vault

Start with [[Event Lifecycle Stages]] — it's the spine. The portal isn't one static app; it's the *same table* (`delegates`) wearing five different faces over time, gated by a handful of status columns. Everything else in this vault is a detail view of one part of that lifecycle.

## Map of notes

**The big picture**
- [[Architecture]] — hybrid static-JSON + Supabase stack, repo layout, build/deploy commands
- [[Event Lifecycle Stages]] — the five stages the portal has gone through, and what code is "live" at each
- [[Data Model]] — the `delegates` table state machine, all status columns, migration history

**Each stage in depth**
- [[Auth and Gating]] — the two-stage applicant/delegate split, client-side gating
- [[Interview System]] — AidaForm embed, webhook, token security
- [[Results and Tiers]] — `result_tier`, scholarship tiers, Cognito form mapping
- [[Registration Flow]] — Cognito registration webhook, applicant-id format

**The app itself**
- [[Frontend Structure]] — screens, routing, stores, component tree
- [[Design System]] — colors, fonts, tokens, the Jakarta neo-brutalist theme
- [[Operational Scripts]] — the scripts/ toolbox, mapped to lifecycle stage
- [[Deployment]] — Hostinger/Passenger quirks
- [[Writing Style]] — no em dashes, anywhere, ever

**Admin tooling**
- [[Admin Dashboard]] — separate Next.js app (`admin_app_dubai`, deployed on Vercel) for searching delegates, awarding scholarship tiers, and managing announcements/action items under a real admin login

**For the Dubai fork specifically**
- [[Dubai Fork Plan]] — the phased execution plan and the open product decisions that need a call before Phase 3/4 can start
- [[Dubai Fork Progress]] — **start here to see what's actually done** — running log against the plan, updated as work lands (Supabase live + seeded, Phases 1–2 complete, interview readiness fixed, credential email rebranded)
- [[Dubai Design System]] — the maroon/gold/Archivo palette and content already built on the marketing site (source of truth for Dubai's look)
- [[Jakarta Email Toolkit]] — the separate human-run email system that also needs a Dubai rebrand
- [[Jakarta Branding Inventory]] — exhaustive file-by-file checklist of every Jakarta/YPDS-specific string in the portal, classified EVENT / REUSABLE / AMBIGUOUS
- [[Known Issues and Dead Code]] — stray files, doc drift, dead code, data inconsistencies discovered while documenting — worth cleaning up during the fork rather than dragging forward

## Status

Jakarta side, Dubai marketing-site design, and the Jakarta email toolkit are all documented. [[Dubai Fork Plan]] has the phased plan; [[Dubai Fork Progress]] tracks what's actually landed. As of 2026-08-23: Supabase is live with schema applied and 228 delegates seeded, Phases 1–2 (design + content swap) are complete, interview readiness (form URL, tokenized-URL bug, `showInterviewTab`) is fixed, and the credential email is rebranded with a confirmed interview deadline. Phases 3–4 (registration mechanism, applicant-id regex, email toolkit) are still blocked on the open decisions listed in [[Dubai Fork Plan]].
