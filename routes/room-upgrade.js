// JotForm room-upgrade webhook.
//
// JotForm (form id 262635649527468, "Room Upgrade Form - Young Strategic Forum
// - Dubai 2026") POSTs the submission here after an enrolled delegate pays
// USD 140 to move from the default twin-sharing room to a single room. This
// route mirrors routes/jotform-registration.js structurally -- multipart via
// multer.none() with the answers JSON-encoded in `rawRequest`, secret-in-path
// with a header fallback, constant-time compare -- but writes to a separate
// table (room_upgrade_requests) instead of flipping a column on delegates, so
// the operator has a durable audit trail plus who/when/notes for the manual
// approval step (scripts/set-room-upgrade-status.js).
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { serviceClient } = require('../lib/supabase');
const { sendRoomUpgradeReceivedEmail } = require('../lib/email');

const router = express.Router();
const upload = multer();

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Broader than jotform-registration's FF-only regex: room upgrades apply to
// enrolled delegates of any tier, so the applicant_id can be YSF-DXB-2026-FF###
// (fully-funded flow) or YSF-DXB-2026-SF### (self-financed public flow). Same
// shape as routes/enroll.js.
const APPLICANT_ID_RE = /YSF-DXB-\d{4}-[A-Z]{2,4}\d+/gi;

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

// Grab the first plausible email out of the payload -- the form has an Email
// field but JotForm's field keys are `q<qid>_<name>` and the qid shifts if the
// form is edited, so we walk the payload the same way we do for applicant ids
// rather than pinning to a key.
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
function collectEmails(value, found = new Set(), depth = 0) {
  if (depth > 8 || found.size > 20) return found;
  if (typeof value === 'string') {
    const m = value.match(EMAIL_RE);
    if (m) found.add(m[0].toLowerCase());
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectEmails(v, found, depth + 1));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => collectEmails(v, found, depth + 1));
  }
  return found;
}

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/webhook/:secret?', webhookLimiter, upload.none(), async (req, res) => {
  const expected = process.env.JOTFORM_ROOM_UPGRADE_WEBHOOK_SECRET;
  if (!expected) {
    console.error('[room-upgrade] JOTFORM_ROOM_UPGRADE_WEBHOOK_SECRET not set -- rejecting webhook');
    return res.status(503).json({ error: 'Webhook not configured' });
  }
  const provided = req.params.secret || req.get('X-Webhook-Secret') || '';
  if (!safeEqual(provided, expected)) {
    console.warn('[room-upgrade] webhook rejected: bad secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!serviceClient) return res.status(503).json({ error: 'Database not configured' });

  let answers = {};
  try {
    answers = req.body && req.body.rawRequest ? JSON.parse(req.body.rawRequest) : req.body;
  } catch (e) {
    console.error('[room-upgrade] rawRequest JSON parse failed:', e.message);
    return res.status(400).json({ error: 'Malformed rawRequest' });
  }

  const candidates = [...collectApplicantIds(answers)];
  if (!candidates.length) {
    const keys = answers && typeof answers === 'object' ? Object.keys(answers).join(',') : typeof answers;
    console.warn('[room-upgrade] webhook payload carried no applicant_id; keys=' + keys);
    return res.status(400).json({ error: 'No candidate applicant_id in payload' });
  }

  const { data: rows, error } = await serviceClient
    .from('delegates')
    .select('id, name, email, applicant_id')
    .in('applicant_id', candidates);

  if (error) {
    console.error('[room-upgrade] applicant_id lookup failed', error.message);
    return res.status(500).json({ error: 'Lookup failed' });
  }
  if (!rows || !rows.length) {
    console.warn('[room-upgrade] webhook applicant_id matched no delegate:', candidates.join(', '));
    return res.status(404).json({ error: 'Unknown candidate applicant_id' });
  }

  // Cross-check: if the payload carries an email too, it must match the row we
  // resolved by applicant_id. This mirrors routes/enroll.js's stance -- refuse
  // to guess on disagreement rather than silently pick a side.
  const submittedEmails = [...collectEmails(answers)];
  const delegateEmails = new Set(rows.map((r) => (r.email || '').toLowerCase()));
  let delegate = rows[0];
  if (submittedEmails.length) {
    const match = rows.find((r) => submittedEmails.includes((r.email || '').toLowerCase()));
    if (match) {
      delegate = match;
    } else {
      console.warn(
        `[room-upgrade] email/applicant_id disagreement -- payload emails ${submittedEmails.join('|')} vs delegate emails ${[...delegateEmails].join('|')}`
      );
      return res.status(409).json({ error: 'Email does not match applicant_id' });
    }
  }

  const submittedEmail = submittedEmails[0] || delegate.email;
  const submissionId = String(req.body.submissionID || answers.submissionID || '').slice(0, 128) || null;

  // Idempotent upsert on unique(delegate_id): a re-submit (double click, JotForm
  // retry) returns the existing row without touching status. `pending` is the
  // default; do NOT overwrite an `approved` or `rejected` decision.
  const { data: existing } = await serviceClient
    .from('room_upgrade_requests')
    .select('id, status')
    .eq('delegate_id', delegate.id)
    .maybeSingle();

  if (existing) {
    console.log(`[room-upgrade] duplicate submission for ${delegate.email} (${delegate.applicant_id}); status=${existing.status}`);
    return res.json({ ok: true, already: true, status: existing.status });
  }

  const { error: insErr } = await serviceClient.from('room_upgrade_requests').insert({
    delegate_id: delegate.id,
    email: submittedEmail,
    applicant_id: delegate.applicant_id,
    payment_reference: submissionId,
  });

  // 23505 = unique_violation: a concurrent double-submit won the race between
  // the existence check above and this insert -- treat it as already received.
  if (insErr && insErr.code !== '23505') {
    console.error('[room-upgrade] insert failed', insErr.message);
    return res.status(500).json({ error: 'Insert failed' });
  }

  serviceClient
    .from('usage_events')
    .insert({
      user_id: delegate.id,
      email: delegate.email,
      event_type: 'room_upgrade_requested',
      detail: delegate.applicant_id || null,
    })
    .then(() => {}, () => {});

  // Best-effort; a failed/misconfigured Resend send must never fail the webhook
  // -- same posture as sendInterviewReceivedEmail / sendRegistrationReceivedEmail.
  sendRoomUpgradeReceivedEmail({
    email: delegate.email,
    name: delegate.name,
    applicantId: delegate.applicant_id,
  });

  console.log(`[room-upgrade] request recorded for ${delegate.email} (${delegate.applicant_id})`);
  res.json({ ok: true });
});

module.exports = router;
