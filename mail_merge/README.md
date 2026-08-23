# YSF Dubai 2026 — Credential Email Mail Merge

## What's in this folder

- `credential-email-mailmerge.html` — the email body, ready to paste into your merge tool.
- `recipients.csv` — 222 applicants who have **not** yet received this email (6 already sent separately are excluded).

## Sender

Send from **contact@thecscd.org**. The email invites replies to that address directly — nothing else to configure.

## Subject line

```
Welcome to Youth Strategic Forum, Dubai 2026: Complete Your Interview
```

## Merge tags

The HTML uses three tags, matching `recipients.csv`'s column headers exactly (case-sensitive):

| Tag | Column | Example |
|---|---|---|
| `{{Name}}` | Name | Goh Chen How, Calvin |
| `{{Email Address}}` | Email Address | gohchenhowcalvin@gmail.com |
| `{{Password}}` | Password | ysfcscdff2 |

`Email Address` is also the recipient/"To" column for the merge itself.

There's a fourth column, `Applicant ID`, included for your own reference — it isn't referenced anywhere in the email body, so it's fine if your tool ignores it.

## Steps

1. Open `credential-email-mailmerge.html` in a browser to preview it, then copy the rendered content (not the raw source) into a new Gmail draft from **contact@thecscd.org** — or, if your merge tool supports importing raw HTML directly, use the file as-is.
2. Insert the three merge tags above wherever your tool's editor lets you (they're already sitting in the right places if you paste the HTML source directly — search for `{{Name}}`, `{{Email Address}}`, `{{Password}}`).
3. Set the subject line above.
4. Import `recipients.csv` as your merge data source (Google Sheets: File → Import).
5. **Send yourself a test first.** Check: the CSCD logo loads in the header, the "Start your interview" button links to `https://delegate.thecscd.org/`, and the layout isn't broken on mobile.
6. Run the merge against the full list.

## Known limitation

The HTML has one small mobile-only style rule (`@media max-width:480px`) that tightens the side padding on phones. Most mail clients' compose windows (Gmail included) strip `<style>` blocks when you paste rendered HTML in, so this refinement may not survive — the email will still render correctly, just with slightly wider default margins on small screens instead of the tightened ones. Everything else is inline styling and unaffected.

## After sending

Everyone in `recipients.csv` will have received their first invite. Let us know once the batch is done (a rough count or the export from your tool is enough) so we can reconcile it against `dubai-emails-sent.csv` on our end and avoid anyone getting a duplicate later.
