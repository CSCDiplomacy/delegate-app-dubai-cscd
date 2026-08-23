---
tags: [email, jakarta, dubai-fork]
---

# Jakarta Email Toolkit (`invitation_email_jakarta`)

← [[Home]] · at `/home/nasir/myComputer/cscd/invitation_email_jakarta` (not a git repo, outside both app repos)

A separate, human-run ops toolkit — Python scripts + Resend, run manually by staff — that sent Jakarta delegates their invitation letters, credentials, reminders, and logistics info. **Distinct from** the delegate portal's own automated onboarding email (`delegate_app_dubai/scripts/credential-email.html` + `send_credentials.py`, see [[Operational Scripts]]): different lifecycle moment (this toolkit's `portal_credentials_email.html` fires *after* selection/registration confirmation; the app's fires at initial pre-interview provisioning), different design system, both need separate Dubai rebrands.

## Palette (identical across all 6 templates)

`#1C1A1A` near-black · `#E6EB1C` acid yellow · `#E90558` magenta · `#C0044A` link color (darkened, AA-safe) · `#e8e5df` outer background · `#faf9f7` card background · `#2a2a2a` body text.

Fonts: **Arial** (body), **Georgia** (serif headers), **Courier New** (monospace — IDs/passwords). Logo: CSCD wordmark via Cloudinary CDN. Consistent header/footer chrome (logo + 3-segment yellow/magenta/black stripe) across 5 of 6 templates.

## The 6 templates, by lifecycle moment

| template | sent by | moment |
|---|---|---|
| `email_preview.html` | — (reference only) | application received (pre-interview) |
| `invitation_email.html` | `send.py` | Fully/Partially Funded invitation letter |
| `invitation_email_forum.html` | `send.py` | Forum Access invitation (no accommodation section) |
| `orientation_reminder_email.html` | `send_reminder.py` | day-of orientation reminder |
| `portal_credentials_email.html` | `send_portal_credentials.py` | post-selection registration-confirmed welcome |
| `logistics_email.html` | `send_logistics_email.py` | pre-departure logistics (most Jakarta-saturated, zero placeholders — fully static) |

## What needs to change for Dubai

Every template's hardcoded facts: dates, hotel, airport, WhatsApp links, orientation link, currency/transit info. Applicant-id format here is **`YPDS-JKT-26-F###`** — note the extra `26-` segment vs. the delegate portal app's `YPDS-JKT-F###` (see [[Registration Flow]]) — a pre-existing inconsistency between the two systems, worth resolving rather than copying forward into Dubai's new id scheme.

## Issues worth fixing during the rebuild, not just rebranding

- `logistics_email.html` signs off with a named person ("Ruhma M. U.") — violates this toolkit's own documented no-personal-names rule (`PROCESS.md`).
- `send.py` and `send_reminder.py` each hardcode their own copy of the orientation date/time/link — duplicated, not shared.
- `send_portal_credentials.py` has a `WELCOME_LINES` dict hand-keyed to two specific Jakarta applicant IDs — manual, not a template to replicate as-is.

## Related

[[Operational Scripts]] · [[Jakarta Branding Inventory]] · [[Dubai Fork Plan]]
