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
// the email answer, and only accept the pair if BOTH point at the same
// delegate row — matching the cross-check-or-skip approach already used by
// scripts/reconcile-tiers.js, since applicant_id alone is a small guessable
// sequence (YSF-DXB-2026-FF1, FF2, ...) and isn't a secret.
function extractFallbackIdentity(body) {
  const fields = Array.isArray(body && body.fields) ? body.fields : [];
  let email = null;
  let applicantId = null;
  for (const f of fields) {
    if (!f || typeof f !== 'object') continue;
    if (f.type === 'email' && typeof f.value === 'string') {
      email = f.value.trim().toLowerCase();
    } else if (typeof f.label === 'string' && /applicant\s*id/i.test(f.label) && typeof f.value === 'string') {
      applicantId = f.value.trim();
    }
  }
  return { email, applicantId };
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
      .select('id, email, interview_status')
      .in('interview_token', candidates);

    if (error) {
      console.error('[interview] token lookup failed', error.message);
      return res.status(500).json({ error: 'Lookup failed' });
    }
    if (rows && rows.length) delegate = rows[0];
  }

  if (!delegate) {
    // No hidden-field token in this payload (or it matched nothing) — fall
    // back to the visible applicant_id + email answers, cross-checked.
    const { email, applicantId } = extractFallbackIdentity(req.body);
    if (email && applicantId) {
      const { data: byId, error: byIdErr } = await serviceClient
        .from('delegates')
        .select('id, email, interview_status')
        .eq('applicant_id', applicantId)
        .maybeSingle();
      if (byIdErr) {
        console.error('[interview] fallback lookup failed', byIdErr.message);
        return res.status(500).json({ error: 'Lookup failed' });
      }
      if (byId && typeof byId.email === 'string' && byId.email.trim().toLowerCase() === email) {
        delegate = byId;
        matchedBy = 'applicant_id+email fallback';
      } else if (byId) {
        console.warn(`[interview] fallback applicant_id ${applicantId} matched a delegate but email disagreed — skipped`);
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

  console.log(`[interview] submission recorded for ${delegate.email} (matched by ${matchedBy})`);
  res.json({ ok: true });
});

module.exports = router;
