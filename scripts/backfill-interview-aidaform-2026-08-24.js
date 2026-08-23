#!/usr/bin/env node
// One-off backfill for the 21 AidaForm interview responses (2026-08-23/24)
// that never reached the webhook (routes/interview.js) because AidaForm's
// webhook integration wasn't actually configured — see app_brain/Interview
// System.md's 2026-08-24 entry. Matches by email only (unambiguous in the
// AidaForm Response Inbox export; applicant_id was not reliably parseable
// from the copy-pasted inbox view, so it is intentionally not used here).
//
// For each match: flips interview_status -> 'submitted' (idempotent, skips
// anyone already submitted), records a usage_events row, and sends the same
// confirmation email the webhook would have sent.
//
// Usage:
//   node scripts/backfill-interview-aidaform-2026-08-24.js --dry-run
//   node scripts/backfill-interview-aidaform-2026-08-24.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { sendInterviewReceivedEmail } = require('../lib/email');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
if (!process.env.RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY in .env — emails would silently no-op');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Deduplicated from the AidaForm Response Inbox (21 rows -> 19 unique
// submitters; Manjot Bains and Anish Singh each submitted twice).
const RESPONSES = [
  { name: 'Abul Kalam', email: 'iikabul6990@gmail.com', date: '2026-08-24' },
  { name: 'Rajendra Rai', email: 'rajendrarai@outlook.com', date: '2026-08-24' },
  { name: 'Mohamed Amine Elgharroudi', email: 'amineelg2019@gmail.com', date: '2026-08-24' },
  { name: 'Bhargav Kumar Das', email: 'dasbhargavhkr@gmail.com', date: '2026-08-24' },
  { name: 'Abdulrahman kamil', email: 'ab2006ah.3@gmail.com', date: '2026-08-24' },
  { name: 'Swaraj Borhade', email: 'borhadeswaraj01@gmail.com', date: '2026-08-23' },
  { name: 'Shaheer Qadri', email: 'shaheer.affiliates@gmail.com', date: '2026-08-23' },
  { name: 'Nakshtra jain', email: 'nakshtrajain01621@gmail.com', date: '2026-08-23' },
  { name: 'Aditi Rahegaonkar', email: 'aarahegaonkar@gmail.com', date: '2026-08-23' },
  { name: 'Manjot Bains', email: 'manjotbains823@gmail.com', date: '2026-08-23' },
  { name: 'syed eihab', email: 'titannomius@gmail.com', date: '2026-08-23' },
  { name: 'Ghita Bzazou', email: 'gbzazou8@gmail.com', date: '2026-08-23' },
  { name: 'Anish Singh', email: 'anish2k24@gmail.com', date: '2026-08-23' },
  { name: 'abey thomas', email: 'abey619@gmail.com', date: '2026-08-23' },
  { name: 'Layla Eddiakr', email: 'eddiakrlayla@gmail.com', date: '2026-08-23' },
  { name: 'Elmira Ismayilli', email: 'ismayilovaelmira484@gmail.com', date: '2026-08-23' },
  { name: 'Dixa Patel', email: 'dikshapatel3475@gmail.com', date: '2026-08-23' },
  { name: 'Calvin Goh', email: 'gohchenhowcalvin@gmail.com', date: '2026-08-23' },
  { name: 'Muhammad Nasir Bilal', email: 'naasrbilal@gmail.com', date: '2026-08-23' },
];

async function main() {
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Backfilling ${RESPONSES.length} AidaForm response(s)...\n`);

  const results = { updated: [], alreadySubmitted: [], unmatched: [] };

  for (const resp of RESPONSES) {
    const email = resp.email.trim().toLowerCase();
    const { data: delegate, error } = await admin
      .from('delegates')
      .select('id, name, email, applicant_id, interview_status')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error(`  ! lookup failed for ${email}: ${error.message}`);
      continue;
    }
    if (!delegate) {
      results.unmatched.push(resp);
      console.log(`  ? no delegate row for "${resp.name}" <${email}>`);
      continue;
    }
    if (delegate.interview_status === 'submitted') {
      results.alreadySubmitted.push(delegate);
      console.log(`  = already submitted: ${delegate.name} <${delegate.email}> (${delegate.applicant_id})`);
      continue;
    }

    console.log(`  + ${delegate.name} <${delegate.email}> (${delegate.applicant_id}) -> submitted`);
    results.updated.push({ delegate, resp });

    if (dryRun) continue;

    const { error: updErr } = await admin
      .from('delegates')
      .update({
        interview_status: 'submitted',
        interview_submitted_at: `${resp.date}T12:00:00Z`,
      })
      .eq('id', delegate.id)
      .eq('interview_status', 'not_started');
    if (updErr) {
      console.error(`    ! status update failed: ${updErr.message}`);
      continue;
    }

    await admin
      .from('usage_events')
      .insert({
        user_id: delegate.id,
        email: delegate.email,
        event_type: 'interview_submitted',
        detail: 'backfill email match (aidaform webhook was not configured)',
      });

    await sendInterviewReceivedEmail({ email: delegate.email, name: delegate.name });
  }

  console.log(
    `\n${dryRun ? '[DRY RUN] ' : ''}Done. ${results.updated.length} updated, ` +
      `${results.alreadySubmitted.length} already submitted, ${results.unmatched.length} unmatched.`,
  );
  if (results.unmatched.length) {
    console.log('\nUnmatched — check these manually:');
    results.unmatched.forEach((r) => console.log(`  • ${r.name} <${r.email}>`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
