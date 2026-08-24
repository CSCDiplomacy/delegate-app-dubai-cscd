#!/usr/bin/env node
// resend-pending-credentials.js — recovery job for the 2026-08-24 Resend
// daily-quota outage (see routes/enroll.js / lib/email.js comments for the
// full story: the SDK returns {error} instead of throwing on a quota/API
// rejection, and the old code marked credential_email_sent_at before
// checking that, so real sends could fail silently).
//
// Rather than a fixed list of applicant_ids, this queries for anyone whose
// credential email is still genuinely pending: created after the last
// confirmed-successful send, with credential_email_sent_at still NULL. That
// safely excludes the original Aug 23 bulk-seed batch (credentialed through
// a separate one-time process, scripts/send_credentials.py — NOT part of
// this webhook flow, and NULL there by design, not by failure) while still
// catching every live registration affected by the outage, including any
// that land after this script was written.
//
// Idempotent and safe to re-run on a schedule: it only ever touches rows
// still NULL, and only sets credential_email_sent_at once send actually
// succeeds. If Resend is still over quota, affected rows are simply left
// for the next run.
//
// Usage: node scripts/resend-pending-credentials.js [--dry-run]
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const liveEnvPath = path.join(__dirname, '..', '.env.live');
if (fs.existsSync(liveEnvPath)) {
  const lines = fs.readFileSync(liveEnvPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const { serviceClient } = require('../lib/supabase');
const { sendCredentialEmail } = require('../lib/email');

const DRY_RUN = process.argv.includes('--dry-run');

// Last confirmed-successful "Welcome / Complete Your Interview" send, per
// Resend's own log (FF412, singharshpreet600@gmail.com, 2026-08-24
// 16:07:38 UTC). Anything with credential_email_sent_at NULL created after
// this is presumed a casualty of the outage, not a not-yet-reached row.
const CUTOFF = '2026-08-24 16:07:38+00';

function passwordFromApplicantId(applicantId) {
  const m = (applicantId || '').match(/(\d+)$/);
  return `ysfcscdff${m ? m[1] : ''}`;
}

async function main() {
  if (!serviceClient) {
    console.error('Supabase service client not configured (check .env).');
    process.exit(1);
  }

  const { data: pending, error } = await serviceClient
    .from('delegates')
    .select('id, applicant_id, name, email, created_at')
    .is('credential_email_sent_at', null)
    .not('applicant_id', 'is', null)
    .gt('created_at', CUTOFF)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  console.log(`${new Date().toISOString()} — ${pending.length} delegate(s) pending credential email.`);
  if (pending.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let sent = 0;
  let stillFailing = 0;

  for (const d of pending) {
    const password = passwordFromApplicantId(d.applicant_id);

    if (DRY_RUN) {
      console.log(`[dry-run] would send ${d.applicant_id} ${d.email}`);
      continue;
    }

    const ok = await sendCredentialEmail({ email: d.email, name: d.name, password });
    if (!ok) {
      console.warn(`- ${d.applicant_id} ${d.email}: send still failing (left pending for next run)`);
      stillFailing++;
      continue;
    }

    const { error: markErr } = await serviceClient
      .from('delegates')
      .update({ credential_email_sent_at: new Date().toISOString() })
      .eq('id', d.id)
      .is('credential_email_sent_at', null);
    if (markErr) {
      console.error(`  (warning) mark-sent failed for ${d.email}: ${markErr.message}`);
    } else {
      console.log(`✓ ${d.applicant_id} ${d.email}`);
      sent++;
    }
  }

  console.log(`\nDone. Sent ${sent}, still failing ${stillFailing}, total pending was ${pending.length}.`);
  if (stillFailing > 0) {
    console.log('Some sends are still failing (likely Resend quota still exhausted) — safe to re-run this script later.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
