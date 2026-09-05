// Auth-gated routes for the logged-in delegate's own data.
// The delegate's profile row lives in Supabase; hotel reference details are
// merged from data/hotels.json by hotel_id.
const fs = require('fs');
const path = require('path');
const express = require('express');
const { requireAuth, serviceClient } = require('../lib/supabase');

const router = express.Router();
const HOTELS_PATH = path.join(__dirname, '..', 'data', 'hotels.json');

function loadHotels() {
  try {
    return JSON.parse(fs.readFileSync(HOTELS_PATH, 'utf8')).hotels || {};
  } catch (e) {
    return {};
  }
}

async function getDelegate(userId) {
  if (!serviceClient) return null;
  const { data, error } = await serviceClient
    .from('delegates')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

// Combined hotel view: the delegate's booking row + the shared hotel reference.
// Locked to confirmed delegates — the hotel (Gevora Hotel) is confidential and
// must not be revealed to applicants still awaiting a decision.
router.get('/hotel', requireAuth, async (req, res) => {
  const delegate = await getDelegate(req.user.id);
  if (!delegate) {
    return res.status(404).json({ error: 'No delegate profile found' });
  }
  if (delegate.status !== 'enrolled') {
    return res.json({ delegate: null, hotel: null, locked: true });
  }
  const hotels = loadHotels();
  // delegate.hotel_id lets a specific delegate be pinned to a different entry;
  // it's unset for the whole cohort today, so fall back to the shared
  // 'dubai-hotel' reference (matches routes/public.js's /hotel fallback) —
  // otherwise this 404s into "Details on the way" for every delegate.
  const hotel =
    (delegate.hotel_id && hotels[delegate.hotel_id]) || hotels['dubai-hotel'] || null;
  res.json({
    delegate: {
      name: delegate.name,
      applicant_id: delegate.applicant_id,
      room: delegate.room,
      booking_ref: delegate.booking_ref,
      check_in: delegate.check_in,
      check_out: delegate.check_out,
      meals: delegate.meals,
    },
    hotel,
  });
});

// Lightweight profile for the dashboard greeting.
// `status` drives the whole Coming Soon gate on the client, so it ships here.
router.get('/profile', requireAuth, async (req, res) => {
  const delegate = await getDelegate(req.user.id);

  // Whether this delegate has already asked to be re-evaluated for the partial
  // (50%) scholarship — drives the dashboard CTA's "Request received" state so
  // the form can't be submitted twice. null = never requested. Only the `self`
  // tier is ever offered the request, so skip the lookup for everyone else (an
  // approved request flips the delegate to `partial`, hiding the card anyway).
  let scholarshipRequestStatus = null;
  if (serviceClient && delegate && delegate.result_tier === 'self') {
    const { data: reqRow } = await serviceClient
      .from('scholarship_requests')
      .select('status')
      .eq('delegate_id', delegate.id)
      .maybeSingle();
    scholarshipRequestStatus = reqRow ? reqRow.status : null;
  }

  res.json({
    name: (delegate && delegate.name) || req.user.email,
    email: req.user.email,
    applicant_id: delegate ? delegate.applicant_id : null,
    status: (delegate && delegate.status) || 'unenrolled',
    interview_status: (delegate && delegate.interview_status) || 'not_started',
    result_status: (delegate && delegate.result_status) || 'pending',
    // null until scripts/reconcile-tiers.js has placed them in a scholarship tier.
    result_tier: (delegate && delegate.result_tier) || null,
    // Set when a full-scholarship delegate accepts their award in the portal.
    scholarship_accepted_at: (delegate && delegate.scholarship_accepted_at) || null,
    // Flipped to 'submitted' by the Cognito registration webhook — swaps the
    // dashboard embed for a "Registration received" card for partial/self tiers.
    registration_status: (delegate && delegate.registration_status) || 'not_started',
    registration_submitted_at: (delegate && delegate.registration_submitted_at) || null,
    // null | 'pending' | 'approved' | 'rejected' — see /scholarship-request below.
    scholarship_request_status: scholarshipRequestStatus,
  });
});

// A no-payment delegate confirming their seat from the dashboard button.
// Only the tiers that owe no registration form — `full` and `special_alumni` —
// may confirm here (partial/self/alumni confirm by submitting their JotForm).
// The client hides the button for everyone else, and this re-checks the tier
// server-side (gating is UX, not security). Idempotent: the guarded WHERE means
// a second click / double-submit is a no-op and returns the original time.
const SEAT_CONFIRM_TIERS = new Set(['full', 'special_alumni']);
router.post('/accept-scholarship', requireAuth, async (req, res) => {
  if (!serviceClient) return res.status(503).json({ error: 'Database not configured' });

  const delegate = await getDelegate(req.user.id);
  if (!delegate) return res.status(404).json({ error: 'No delegate profile found' });
  if (!SEAT_CONFIRM_TIERS.has(delegate.result_tier)) {
    return res.status(403).json({ error: 'Not eligible to confirm a seat' });
  }

  // Already accepted — return the recorded time without touching the row.
  if (delegate.scholarship_accepted_at) {
    return res.json({ accepted_at: delegate.scholarship_accepted_at });
  }

  const acceptedAt = new Date().toISOString();
  const { data, error } = await serviceClient
    .from('delegates')
    .update({ scholarship_accepted_at: acceptedAt })
    .eq('id', delegate.id)
    .is('scholarship_accepted_at', null)
    .select('scholarship_accepted_at')
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  // If the guard matched nothing, another request won the race — re-read it.
  const finalAt = (data && data.scholarship_accepted_at) || acceptedAt;

  serviceClient
    .from('usage_events')
    .insert({
      user_id: delegate.id,
      email: req.user.email,
      event_type: 'scholarship_accepted',
      detail: delegate.applicant_id || null,
    })
    .then(() => {}, () => {});

  return res.json({ accepted_at: finalAt });
});

// A self-financed delegate asking to be re-evaluated for the partial (50%)
// scholarship, from the dashboard. Built in-app, no third-party form. Only the
// `self` tier is eligible — the client hides the CTA for everyone else and this
// re-checks the tier server-side (gating is UX, not security). One row per
// delegate: a second submit returns the existing status untouched (idempotent),
// so the "Request received" state can never be overwritten or duplicated.
const SCHOLARSHIP_REQUEST_TIERS = new Set(['self']);
router.post('/scholarship-request', requireAuth, async (req, res) => {
  if (!serviceClient) return res.status(503).json({ error: 'Database not configured' });

  const delegate = await getDelegate(req.user.id);
  if (!delegate) return res.status(404).json({ error: 'No delegate profile found' });
  if (!SCHOLARSHIP_REQUEST_TIERS.has(delegate.result_tier)) {
    return res.status(403).json({ error: 'Not eligible to request a partial scholarship' });
  }
  // Already paid the self-financed fee — a fee waiver no longer applies. The
  // client hides the card once registration is submitted; this mirrors that
  // server-side (defense-in-depth).
  if (delegate.registration_status === 'submitted') {
    return res.status(403).json({ error: 'Registration already completed' });
  }

  // Already requested — return the recorded status without touching the row.
  const { data: existing } = await serviceClient
    .from('scholarship_requests')
    .select('status')
    .eq('delegate_id', delegate.id)
    .maybeSingle();
  if (existing) {
    return res.json({ state: 'received', status: existing.status });
  }

  const body = req.body || {};
  const email = String(body.email || req.user.email || '').trim();
  const answerFit = String(body.answer_fit || '').trim();
  const answerContribution = String(body.answer_contribution || '').trim();
  if (!email || !answerFit || !answerContribution) {
    return res.status(400).json({ error: 'Please add your email and answer both questions.' });
  }

  // No-approval policy (2026-09-05): every self-financed requester is granted
  // the partial waiver automatically. The row is written straight to 'approved'
  // and the delegate is flipped self -> partial in the same request, so their
  // portal shows the partial (pay-50%) form immediately with no admin step.
  const { error } = await serviceClient.from('scholarship_requests').insert({
    delegate_id: delegate.id,
    email,
    answer_fit: answerFit,
    answer_contribution: answerContribution,
    status: 'approved',
    decided_at: new Date().toISOString(),
    decided_by: 'auto-approved (no-approval policy)',
  });

  // 23505 = unique_violation: a concurrent double-submit won the race between
  // the existence check above and this insert — treat it as already received.
  if (error && error.code !== '23505') {
    return res.status(500).json({ error: error.message });
  }

  // Flip the tier (guarded on still-self so a concurrent flip is a no-op).
  await serviceClient
    .from('delegates')
    .update({ result_tier: 'partial' })
    .eq('id', delegate.id)
    .eq('result_tier', 'self');

  serviceClient
    .from('usage_events')
    .insert({
      user_id: delegate.id,
      email: req.user.email,
      event_type: 'scholarship_requested',
      detail: delegate.applicant_id || null,
    })
    .then(() => {}, () => {});

  return res.json({ state: 'received', status: 'approved' });
});

// Accommodation voucher (PDF). Uploaded once via scripts/upload-vouchers.js
// into the private `accommodation-vouchers` Supabase Storage bucket, keyed
// `{applicant_id}.pdf`. This endpoint returns a short-lived signed URL if a
// voucher exists for the caller, and `{ available: false }` otherwise.
router.get('/voucher', requireAuth, async (req, res) => {
  if (!serviceClient) return res.status(503).json({ error: 'Storage not configured' });
  const delegate = await getDelegate(req.user.id);
  if (!delegate || !delegate.applicant_id) return res.json({ available: false });

  const key = `${delegate.applicant_id}.pdf`;
  const { data, error } = await serviceClient.storage
    .from('accommodation-vouchers')
    .createSignedUrl(key, 60 * 10, { download: key });

  if (error || !data || !data.signedUrl) return res.json({ available: false });
  res.json({ available: true, url: data.signedUrl });
});

// The interview form URL is a secret: anyone holding it can submit without ever
// logging in. So it lives in the server env, never in the client bundle, and is
// handed out only to an authenticated applicant who has not yet submitted.
router.get('/interview', requireAuth, async (req, res) => {
  const delegate = await getDelegate(req.user.id);
  if (!delegate) return res.status(404).json({ error: 'No applicant profile found' });

  if (delegate.interview_status === 'submitted') {
    return res.json({ state: 'submitted', submitted_at: delegate.interview_submitted_at });
  }
  // Enrolled delegates are past the interview stage.
  if (delegate.status === 'enrolled') {
    return res.json({ state: 'not_applicable' });
  }

  const base = process.env.AIDAFORM_BASE_URL;
  if (!base) return res.json({ state: 'unavailable' });

  // The token is what lets the webhook tie a submission back to this applicant.
  const tokenField = process.env.AIDAFORM_TOKEN_FIELD || 'candidate_token';
  const idField = process.env.AIDAFORM_APPLICANT_FIELD || 'applicant_id';
  const url = new URL(base);
  url.searchParams.set(tokenField, delegate.interview_token);
  if (delegate.applicant_id) url.searchParams.set(idField, delegate.applicant_id);

  res.json({ state: 'open', url: url.toString() });
});

// Manual override for applicants who need to mark the interview as taken from
// inside the portal. This follows the same terminal state as the webhook path.
router.post('/interview/mark-taken', requireAuth, async (req, res) => {
  const delegate = await getDelegate(req.user.id);
  if (!delegate) return res.status(404).json({ error: 'No applicant profile found' });

  if (delegate.interview_status === 'submitted') {
    return res.json({ state: 'submitted', submitted_at: delegate.interview_submitted_at });
  }
  if (delegate.status === 'enrolled') {
    return res.json({ state: 'not_applicable' });
  }
  if (!serviceClient) return res.status(503).json({ error: 'Database not configured' });

  const submittedAt = new Date().toISOString();
  const { error } = await serviceClient
    .from('delegates')
    .update({ interview_status: 'submitted', interview_submitted_at: submittedAt })
    .eq('id', delegate.id)
    .eq('interview_status', 'not_started');

  if (error) return res.status(500).json({ error: error.message });

  serviceClient
    .from('usage_events')
    .insert({
      user_id: delegate.id,
      email: req.user.email,
      event_type: 'interview_submitted',
      detail: 'marked_taken',
    })
    .then(() => {}, () => {});

  return res.json({ state: 'submitted', submitted_at: submittedAt });
});

module.exports = router;
