// AidaForm submission webhook.
//
// AidaForm POSTs the submission JSON here after an applicant finishes the
// interview. We do not trust the caller: the only thing that identifies the
// submitter is `interview_token`, a per-applicant UUID that was prefilled into
// a hidden field when the portal handed out the form URL.
//
// The endpoint is protected by a secret path segment (AIDAFORM_WEBHOOK_SECRET)
// because AidaForm cannot send custom auth headers. A matching
// `X-Webhook-Secret` header is also accepted if the sender can set one.
const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { serviceClient } = require('../lib/supabase');
const { sendInterviewReceivedEmail } = require('../lib/email');

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// AidaForm's payload shape depends on how the form is built, and the hidden
// field may surface under any key or nesting. Rather than guess a path, collect
// every UUID-looking string and let the DB decide which one is a real token.
function collectUuids(value, found = new Set(), depth = 0) {
  if (depth > 8 || found.size > 50) return found;
  if (typeof value === 'string') {
    const s = value.trim();
    if (UUID_RE.test(s)) found.add(s.toLowerCase());
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectUuids(v, found, depth + 1));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => collectUuids(v, found, depth + 1));
  }
  return found;
}

// Fallback for the current live Dubai form, which was built without a hidden
// candidate_token field — every submission fails the UUID match above. AidaForm
// answers come back as `fields: [{ type, label, value }]`. We pull the visible
// "Applicant ID" short-text answer (prefilled from our URL, but editable) and
// the email answer, and try applicant_id first, then email — no cross-check
// between the two. Applicant_id-only-or-email matching was a deliberate call
// by the client over the earlier cross-check-or-skip approach: the cross-check
// was silently dropping legitimate submissions (typo'd or personal email vs.
// registered email) and neither updating status nor sending the confirmation
// email. The webhook secret path is still the actual access control here.
function extractFallbackIdentity(body) {
  const fields = Array.isArray(body && body.fields) ? body.fields : [];
  let applicantId = null;
  let email = null;
  for (const f of fields) {
    if (!f || typeof f !== 'object') continue;
    if (typeof f.label === 'string' && /applicant\s*id/i.test(f.label) && typeof f.value === 'string') {
      applicantId = f.value.trim();
    } else if (f.type === 'email' && typeof f.value === 'string') {
      email = f.value.trim().toLowerCase();
    }
  }
  return { applicantId, email };
}

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/webhook/:secret?', webhookLimiter, async (req, res) => {
  const expected = process.env.AIDAFORM_WEBHOOK_SECRET;
  if (!expected) {
    console.error('[interview] AIDAFORM_WEBHOOK_SECRET not set — rejecting webhook');
    return res.status(503).json({ error: 'Webhook not configured' });
  }
  const provided = req.params.secret || req.get('X-Webhook-Secret') || '';
  if (!safeEqual(provided, expected)) {
    console.warn('[interview] webhook rejected: bad secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!serviceClient) return res.status(503).json({ error: 'Database not configured' });

  const candidates = [...collectUuids(req.body)];

  let delegate = null;
  let matchedBy = 'token';

  if (candidates.length) {
    const { data: rows, error } = await serviceClient
      .from('delegates')
      .select('id, email, name, interview_status')
      .in('interview_token', candidates);

    if (error) {
      console.error('[interview] token lookup failed', error.message);
      return res.status(500).json({ error: 'Lookup failed' });
    }
    if (rows && rows.length) delegate = rows[0];
  }

  if (!delegate) {
    // No hidden-field token in this payload (or it matched nothing) — fall
    // back to the visible applicant_id answer, then to the email answer if
    // applicant_id didn't match anything.
    const { applicantId, email } = extractFallbackIdentity(req.body);
    if (applicantId) {
      const { data: byId, error: byIdErr } = await serviceClient
        .from('delegates')
        .select('id, email, name, interview_status')
        .eq('applicant_id', applicantId)
        .maybeSingle();
      if (byIdErr) {
        console.error('[interview] fallback lookup failed', byIdErr.message);
        return res.status(500).json({ error: 'Lookup failed' });
      }
      if (byId) {
        delegate = byId;
        matchedBy = 'applicant_id fallback';
      }
    }
    if (!delegate && email) {
      const { data: byEmail, error: byEmailErr } = await serviceClient
        .from('delegates')
        .select('id, email, name, interview_status')
        .eq('email', email)
        .maybeSingle();
      if (byEmailErr) {
        console.error('[interview] fallback lookup failed', byEmailErr.message);
        return res.status(500).json({ error: 'Lookup failed' });
      }
      if (byEmail) {
        delegate = byEmail;
        matchedBy = 'email fallback';
      }
    }
  }

  if (!delegate) {
    // Someone submitted the form without a token or identifiable answers we
    // recognize — worth knowing about.
    console.warn('[interview] webhook matched no applicant');
    return res.status(404).json({ error: 'Unknown candidate token' });
  }

  // Idempotent: AidaForm may retry, and an applicant may double-submit. The
  // first submission is the one that counts; later ones are acknowledged and
  // ignored so the sender stops retrying.
  if (delegate.interview_status === 'submitted') {
    return res.json({ ok: true, already: true });
  }

  const { error: updErr } = await serviceClient
    .from('delegates')
    .update({ interview_status: 'submitted', interview_submitted_at: new Date().toISOString() })
    .eq('id', delegate.id)
    .eq('interview_status', 'not_started'); // lose the race rather than double-write

  if (updErr) {
    console.error('[interview] status update failed', updErr.message);
    return res.status(500).json({ error: 'Update failed' });
  }

  serviceClient
    .from('usage_events')
    .insert({ user_id: delegate.id, email: delegate.email, event_type: 'interview_submitted', detail: matchedBy })
    .then(() => {}, () => {}); // analytics must never fail the webhook

  sendInterviewReceivedEmail({ email: delegate.email, name: delegate.name }); // fire-and-forget, never fail the webhook

  console.log(`[interview] submission recorded for ${delegate.email} (matched by ${matchedBy})`);
  res.json({ ok: true });
});

module.exports = router;
