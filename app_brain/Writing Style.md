---
tags: [style]
---

# Writing Style

← [[Home]]

## No em dashes, ever

Do not use em dashes (`—`) anywhere in this repo: not in app copy (`data/*.json`,
`client/src/lib/content.ts`, JSX strings), not in code comments, not in vault
notes. This applies to every future edit, including ones made by Claude — it's
a default habit that needs to be actively overridden here.

Use a period (new sentence), a comma, a colon, or parentheses instead,
whichever reads most naturally for that sentence. En dashes for numeric
ranges (`60–90 min`, `Sep 22–25`) are fine and unrelated — only the em dash
is banned.

**Status (2026-08-23):** all user-facing app copy (`data/*.json`,
`client/src/lib/content.ts`, and every JSX-rendered string in
`client/src/components/`) has been swept clean. Code comments and this
vault's older notes still have plenty left over from before this rule
existed — leave them as historical unless you're already editing that line
for another reason, but never *add* a new one anywhere.
