// n8n enroll webhook.
//
// n8n POSTs here (after it sends the delegate their payment receipt email)
// with the applicant's email, name, and applicant_id (assigned upstream by
// the JotForm the payment flow runs on). We do not trust the caller beyond
// the shared secret: the payload is walked defensively, matched against
// `delegates` by applicant_id + email, and any disagreement is logged and
// rejected rather than guessed — same posture as the interview/registration
// webhooks and scripts/reconcile-tiers.js.
//
// On a clean match (or no match at all, meaning this is a brand-new
// applicant) the endpoint:
//   1. Ensures a Supabase Auth user + `delegates` row exist for them.
//   2. Issues a fresh password (we never store passwords, so an existing
//      account gets a new one here too — safe because `credential_email_sent_at`
//      being unset means nobody has been told a password for it yet).
//   3. Emails them their credentials (scripts/credential-email.html, same
//      copy as the manual batch send in scripts/send_credentials.py).
//
// The endpoint is protected by a secret path segment (ENROLL_WEBHOOK_SECRET)
// because n8n's HTTP Request node can't always attach a header the way we'd
// like at the free tier. A matching `X-Webhook-Secret` header is also
// accepted if the sender can set one.
const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { serviceClient } = require('../lib/supabase');
const { sendCredentialEmail } = require('../lib/email');

const router = express.Router();

// Constant-time secret comparison — avoids leaking the webhook secret via
// response-timing differences on a byte-by-byte `!==` compare.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Dubai applicant ids look like YSF-DXB-2026-FF123. Collected anywhere in the
// payload (not just an exact field match) because we don't yet know n8n's
// exact JSON shape — same defensive approach as registration.js/interview.js.
const APPLICANT_ID_RE = /YSF-DXB-\d{4}-FF\d+/gi;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

function collectMatches(value, regex, found = new Set(), depth = 0) {
  if (depth > 8 || found.size > 50) return found;
  if (typeof value === 'string') {
    const matches = value.match(regex);
    if (matches) matches.forEach((m) => found.add(m));
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectMatches(v, regex, found, depth + 1));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => collectMatches(v, regex, found, depth + 1));
  }
  return found;
}

// Real submissions routinely carry a second, DIFFERENT email under an
// "alternate email" field (JotForm's own field for exactly that purpose) —
// treating every email-shaped string as equally valid meant that alone was
// enough to make the payload look "ambiguous" and get rejected, even though
// there's an obvious primary. So: collect emails with their key context,
// keep whichever ones aren't under a key that says "alternate"/"alt", and
// only fall back to the full unfiltered set if that filtering leaves
// nothing. The "pretty" field (JotForm's human-readable summary string) is
// skipped entirely — it flattens primary + alternate into one string with no
// key to distinguish them.
const ALTERNATE_KEY_RE = /alt(ernate)?/i;
const SKIP_KEY_RE = /^pretty$/i;

function collectEmails(value, keyHint, primary, alternate, depth = 0) {
  if (depth > 8) return;
  if (typeof value === 'string') {
    const matches = value.match(EMAIL_RE);
    if (matches) {
      const bucket = keyHint && ALTERNATE_KEY_RE.test(keyHint) ? alternate : primary;
      matches.forEach((m) => bucket.add(m.toLowerCase()));
    }
    const trimmed = value.trim();
    if (trimmed.length > 1 && (trimmed[0] === '{' || trimmed[0] === '[')) {
      try {
        collectEmails(JSON.parse(trimmed), keyHint, primary, alternate, depth + 1);
      } catch {
        // not JSON, nothing more to do with this string
      }
    }
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectEmails(v, keyHint, primary, alternate, depth + 1));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => {
      if (SKIP_KEY_RE.test(k.trim())) return;
      collectEmails(v, k, primary, alternate, depth + 1);
    });
  }
}

// Name has no fixed pattern to regex for, so we look it up by key instead —
// walk the payload for the first key that looks like a name field. Matches
// n8n's cleaned-up shape (personal_information.full_name) as well as raw
// JotForm field ids (q4_fullName).
const NAME_KEY_RE = /(^|_)(full[_ ]?name|name)$/i;
function findName(value, depth = 0) {
  if (depth > 8) return null;
  if (typeof value === 'string') {
    // Some upstream systems (n8n's raw webhook capture, in particular) embed
    // a whole sub-payload as a JSON-encoded string (e.g. body.rawRequest) —
    // worth a parse attempt so a key-based lookup can still see inside it.
    const trimmed = value.trim();
    if (trimmed.length > 1 && (trimmed[0] === '{' || trimmed[0] === '[')) {
      try {
        return findName(JSON.parse(trimmed), depth + 1);
      } catch {
        return null;
      }
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const v of value) {
      const found = findName(v, depth + 1);
      if (found) return found;
    }
    return null;
  }
  for (const [key, v] of Object.entries(value)) {
    if (NAME_KEY_RE.test(key.trim()) && typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  for (const v of Object.values(value)) {
    const found = findName(v, depth + 1);
    if (found) return found;
  }
  return null;
}

// Matches the convention already used for every delegate seeded so far
// (scripts/seed-delegates.js batches): ysfcscdff<N>, where N is the numeric
// suffix of their applicant_id (YSF-DXB-2026-FF37 -> ysfcscdff37).
function passwordFromApplicantId(applicantId) {
  const m = applicantId.match(/(\d+)$/);
  return `ysfcscdff${m ? m[1] : ''}`;
}

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/webhook/:secret?', webhookLimiter, async (req, res) => {
  const expected = process.env.ENROLL_WEBHOOK_SECRET;
  if (!expected) {
    console.error('[enroll] ENROLL_WEBHOOK_SECRET not set — rejecting webhook');
    return res.status(503).json({ error: 'Webhook not configured' });
  }
  const provided = req.params.secret || req.get('X-Webhook-Secret') || '';
  if (!safeEqual(provided, expected)) {
    console.warn('[enroll] webhook rejected: bad secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!serviceClient) return res.status(503).json({ error: 'Database not configured' });

  const applicantIds = [...collectMatches(req.body, APPLICANT_ID_RE)];

  const primaryEmails = new Set();
  const alternateEmails = new Set();
  collectEmails(req.body, null, primaryEmails, alternateEmails);
  // Prefer emails NOT under an "alternate"-flagged key; only fall back to
  // the full set (primary + alternate together) if that leaves nothing —
  // e.g. a payload where the only email present happens to be alternate_email.
  const uniqueEmails = primaryEmails.size ? [...primaryEmails] : [...new Set([...primaryEmails, ...alternateEmails])];

  const name = findName(req.body) || 'Delegate';

  if (applicantIds.length !== 1 || uniqueEmails.length !== 1) {
    const keys = req.body && typeof req.body === 'object' ? Object.keys(req.body).join(',') : typeof req.body;
    console.warn(
      `[enroll] webhook payload ambiguous: ${applicantIds.length} applicant_id candidate(s), ${uniqueEmails.length} email candidate(s); top-level keys=${keys}`
    );
    return res.status(400).json({ error: 'Could not identify a single applicant_id and email in payload' });
  }

  const applicantId = applicantIds[0].toUpperCase();
  const email = uniqueEmails[0];

  const [{ data: byIdRows, error: byIdErr }, { data: byEmailRow, error: byEmailErr }] = await Promise.all([
    serviceClient.from('delegates').select('*').eq('applicant_id', applicantId),
    serviceClient.from('delegates').select('*').eq('email', email).maybeSingle(),
  ]);

  if (byIdErr || byEmailErr) {
    console.error('[enroll] lookup failed', (byIdErr || byEmailErr).message);
    return res.status(500).json({ error: 'Lookup failed' });
  }

  if (byIdRows.length > 1) {
    console.error(`[enroll] applicant_id ${applicantId} matches ${byIdRows.length} existing delegates — refusing to guess`);
    return res.status(409).json({ error: 'applicant_id is not unique in the database' });
  }

  const byId = byIdRows[0] || null;

  let delegate = null;
  if (byId && byEmailRow) {
    if (byId.id !== byEmailRow.id) {
      console.error(`[enroll] applicant_id ${applicantId} and email ${email} point to two different delegates — refusing to guess`);
      return res.status(409).json({ error: 'applicant_id and email disagree on the delegate' });
    }
    delegate = byId;
  } else if (byId && !byEmailRow) {
    console.error(`[enroll] applicant_id ${applicantId} exists but its stored email doesn't match ${email} — refusing to guess`);
    return res.status(409).json({ error: 'applicant_id already registered under a different email' });
  } else if (!byId && byEmailRow) {
    if (byEmailRow.applicant_id && byEmailRow.applicant_id !== applicantId) {
      console.error(`[enroll] email ${email} already has applicant_id ${byEmailRow.applicant_id}, payload says ${applicantId} — refusing to guess`);
      return res.status(409).json({ error: 'email already registered under a different applicant_id' });
    }
    delegate = byEmailRow;
    if (!byEmailRow.applicant_id) {
      const { error: fillErr } = await serviceClient
        .from('delegates')
        .update({ applicant_id: applicantId })
        .eq('id', byEmailRow.id);
      if (fillErr) console.error('[enroll] failed to backfill applicant_id', fillErr.message);
    }
  }

  let created = false;
  let password = passwordFromApplicantId(applicantId);
  if (!delegate) {
    const { data: userData, error: userErr } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (userErr) {
      console.error(`[enroll] auth user creation failed for ${email}:`, userErr.message);
      return res.status(500).json({ error: 'Account creation failed' });
    }

    const profile = { id: userData.user.id, name, email, applicant_id: applicantId, status: 'unenrolled' };
    const { data: inserted, error: profErr } = await serviceClient
      .from('delegates')
      .insert(profile)
      .select('*')
      .single();
    if (profErr) {
      console.error(`[enroll] profile insert failed for ${email}:`, profErr.message);
      return res.status(500).json({ error: 'Profile creation failed' });
    }

    delegate = inserted;
    created = true;

    serviceClient
      .from('usage_events')
      .insert({ user_id: delegate.id, email, event_type: 'delegate_enrolled', detail: applicantId })
      .then(() => {}, () => {}); // analytics must never fail the webhook

    console.log(`[enroll] created delegate ${email} (${applicantId})`);
  }

  // Idempotent: n8n may retry, and this delegate may already have been
  // emailed by a previous call. credential_email_sent_at is the guard.
  if (delegate.credential_email_sent_at) {
    return res.json({ ok: true, already: true, created });
  }

  // `password` already holds the one generated above — reused as-is if this
  // delegate was just created (it's already their real account password),
  // otherwise pushed to Supabase now so the email below stays accurate.
  if (!created) {
    const { error: pwErr } = await serviceClient.auth.admin.updateUserById(delegate.id, { password });
    if (pwErr) {
      console.error(`[enroll] password reset failed for ${email}:`, pwErr.message);
      return res.status(500).json({ error: 'Password reset failed' });
    }
  }

  // Send FIRST, mark SECOND — sendCredentialEmail resolves false (not a
  // thrown exception) on an API-level rejection like a Resend quota/rate
  // limit, so credential_email_sent_at must only be set once we've actually
  // confirmed the send succeeded. Marking it unconditionally here is exactly
  // what caused 50 delegates to be silently un-emailed on 2026-08-24.
  const sent = await sendCredentialEmail({ email, name: delegate.name || name, password });

  if (!sent) {
    console.error(`[enroll] credential email failed for ${email} (${applicantId}) — leaving credential_email_sent_at unset so a retry can pick it up`);
    return res.status(502).json({ ok: false, created, emailSent: false, error: 'Credential email failed to send' });
  }

  const { error: markErr } = await serviceClient
    .from('delegates')
    .update({ credential_email_sent_at: new Date().toISOString() })
    .eq('id', delegate.id)
    .is('credential_email_sent_at', null); // lose the race rather than double-send

  if (markErr) {
    console.error('[enroll] credential_email_sent_at update failed', markErr.message);
    return res.status(500).json({ error: 'Update failed' });
  }

  serviceClient
    .from('usage_events')
    .insert({ user_id: delegate.id, email, event_type: 'credential_email_sent', detail: applicantId })
    .then(() => {}, () => {}); // analytics must never fail the webhook

  console.log(`[enroll] credentials sent to ${email} (${applicantId}, created=${created})`);
  res.json({ ok: true, created, emailSent: true });
});

module.exports = router;
