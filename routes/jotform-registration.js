// JotForm registration webhook.
//
// JotForm POSTs the submission here after a partial/self/alumni delegate
// completes their scholarship registration + payment form. Registration
// forms moved from Cognito to JotForm on 2026-08-27 (see
// app_brain/Dubai Fork Progress.md) — routes/registration.js is the old
// Cognito-flavored webhook, left in place but no longer wired to any live
// form. This route is its JotForm equivalent, structurally the same
// (secret-protected path, match-by-applicant-id, idempotent update) but a
// different payload shape: JotForm sends multipart/form-data, not JSON, with
// the actual answers JSON-encoded inside a `rawRequest` field. Multer parses
// the multipart envelope (`.none()` — no file fields expected on these three
// forms); rawRequest is then parsed as JSON and walked the same
// walk-everything way routes/interview.js's collectUuids and
// routes/registration.js's collectApplicantIds already do, because
// JotForm's field keys are `q<qid>_<name>` and the qid shifts if the form is
// ever edited — matching by regex-anywhere is more robust than a fixed key.
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { serviceClient } = require('../lib/supabase');
const { sendRegistrationReceivedEmail } = require('../lib/email');

const router = express.Router();
const upload = multer();

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Dubai's applicant-id scheme, confirmed 2026-08-23: YSF-DXB-2026-FF###.
// (routes/registration.js's Cognito webhook still has Jakarta's
// YPDS-JKT-F?\d+ — that route is dead now, not fixed as part of this change.)
const APPLICANT_ID_RE = /YSF-DXB-\d{4}-FF\d+/gi;

function normaliseApplicantId(raw) {
  return raw.toUpperCase();
}

function collectApplicantIds(value, found = new Set(), depth = 0) {
  if (depth > 8 || found.size > 50) return found;
  if (typeof value === 'string') {
    const matches = value.match(APPLICANT_ID_RE);
    if (matches) matches.forEach((m) => found.add(normaliseApplicantId(m)));
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectApplicantIds(v, found, depth + 1));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => collectApplicantIds(v, found, depth + 1));
  }
  return found;
}

// Which of the three live forms this submission came from, by JotForm's
// formID — used only to pick the confirmation-email tier label, never to
// decide identity (applicant_id does that). Kept here rather than imported
// from the client bundle since the client doesn't need to know form IDs
// beyond what it already embeds.
const FORM_TIER = {
  '262376041526455': 'partial',
  '262375715752463': 'self',
  '262375928037465': 'alumni',
};

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/webhook/:secret?', webhookLimiter, upload.none(), async (req, res) => {
  const expected = process.env.JOTFORM_WEBHOOK_SECRET;
  if (!expected) {
    console.error('[jotform-registration] JOTFORM_WEBHOOK_SECRET not set — rejecting webhook');
    return res.status(503).json({ error: 'Webhook not configured' });
  }
  const provided = req.params.secret || req.get('X-Webhook-Secret') || '';
  if (!safeEqual(provided, expected)) {
    console.warn('[jotform-registration] webhook rejected: bad secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!serviceClient) return res.status(503).json({ error: 'Database not configured' });

  let answers = {};
  try {
    answers = req.body && req.body.rawRequest ? JSON.parse(req.body.rawRequest) : req.body;
  } catch (e) {
    console.error('[jotform-registration] rawRequest JSON parse failed:', e.message);
    return res.status(400).json({ error: 'Malformed rawRequest' });
  }

  const candidates = [...collectApplicantIds(answers)];
  if (!candidates.length) {
    const keys = answers && typeof answers === 'object' ? Object.keys(answers).join(',') : typeof answers;
    console.warn('[jotform-registration] webhook payload carried no applicant_id; keys=' + keys);
    return res.status(400).json({ error: 'No candidate applicant_id in payload' });
  }

  const { data: rows, error } = await serviceClient
    .from('delegates')
    .select('id, name, email, applicant_id, registration_status')
    .in('applicant_id', candidates);

  if (error) {
    console.error('[jotform-registration] applicant_id lookup failed', error.message);
    return res.status(500).json({ error: 'Lookup failed' });
  }
  if (!rows || !rows.length) {
    console.warn('[jotform-registration] webhook applicant_id matched no delegate:', candidates.join(', '));
    return res.status(404).json({ error: 'Unknown candidate applicant_id' });
  }

  const delegate = rows[0];

  if (delegate.registration_status === 'submitted') {
    return res.json({ ok: true, already: true });
  }

  const { error: updErr } = await serviceClient
    .from('delegates')
    .update({ registration_status: 'submitted', registration_submitted_at: new Date().toISOString() })
    .eq('id', delegate.id)
    .eq('registration_status', 'not_started');

  if (updErr) {
    console.error('[jotform-registration] status update failed', updErr.message);
    return res.status(500).json({ error: 'Update failed' });
  }

  serviceClient
    .from('usage_events')
    .insert({
      user_id: delegate.id,
      email: delegate.email,
      event_type: 'registration_submitted',
      detail: FORM_TIER[req.body.formID] || null,
    })
    .then(() => {}, () => {});

  // Best-effort — a failed/misconfigured Resend send never fails the webhook,
  // same posture as sendInterviewReceivedEmail.
  sendRegistrationReceivedEmail({
    email: delegate.email,
    name: delegate.name,
    tier: FORM_TIER[req.body.formID] || null,
    applicantId: delegate.applicant_id,
  });

  console.log(`[jotform-registration] submission recorded for ${delegate.email} (${delegate.applicant_id})`);
  res.json({ ok: true });
});

module.exports = router;
