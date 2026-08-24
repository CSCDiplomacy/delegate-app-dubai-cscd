#!/usr/bin/env node
// backfill-missed-enroll.js — one-off recovery for the 2026-08-24 enroll-webhook
// outage (~01:34-07:34 Jotform-local / 05:34-11:34 UTC), during which n8n's
// enroll webhook was down and 28 submissions between applicant_id FF357 and
// FF386 never got a delegate account. This mirrors routes/enroll.js exactly
// (same password scheme, same email template, same idempotency guard) for
// just this fixed list, continuing the FF358..FF385 sequence in the same
// chronological order the submissions came in.
//
// Usage: node scripts/backfill-missed-enroll.js [--dry-run]
//
// Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (from .env) and
// RESEND_API_KEY + FROM_EMAIL + EVENT_NAME + INTERVIEW_DEADLINE (from
// .env.live, same as scripts/send_credentials.py) already loaded into the
// environment before lib/supabase.js and lib/email.js are required, since
// both read process.env at module-load time.
require('dotenv').config(); // .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const fs = require('fs');
const path = require('path');

// Merge .env.live on top (RESEND_API_KEY etc.) without ever printing it —
// same approach as scripts/send_credentials.py: parse KEY=VALUE lines
// ourselves rather than `source`-ing (values can contain unquoted spaces).
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

// Chronological order (oldest first) = the order the automation would have
// assigned these had it not stalled, continuing straight on from FF357.
const MISSED = [
  ['Avi Sharan Gupta', 'godsgrace9201@gmail.com'],
  ['Govindraj Ramakrishna Mane', 'grmanesales@gmail.com'],
  ['Rubiya Aftab Ahmed Siddque', 'rubiyasiddique40@gmail.com'],
  ['Subhash Kumar', 'subhash778184@gmail.com'],
  ['Soofiya', 'soofiyaareefa@gmail.com'],
  ['Khalid Ibnelbachyr', 'kibnelbachyr@gmail.com'],
  ['Aruna Rajan Cheppilate', 'arunac212000@gmail.com'],
  ['Amey Deepak Patil', 'ameypatil43@gmail.com'],
  ['Sahil Dutta', 'sahildutt36@gmail.com'],
  ['Amreen', 'amreenshahrukh5698@gmail.com'],
  ['Chandresh Kalal', 'chandreshkk123@gmail.com'],
  ['Swara Sandeep Borkar', 'borkarswara1@gmail.com'],
  ['Rabia Rasheed', 'rabiarasheed64@gmail.com'],
  ['Kainaat Rehman', 'kainaatrehman92@gmail.com'],
  ['Karla Adaia Reyes Obregon', 'reyesokarlaadaia@gmail.com'],
  ['Rita Alexandra Ramos Fernandes', 'ritaalexandrafernandes@gmail.com'],
  ['Rimsha Akhtar Malik', 'rimsha.maalik96@gmail.com'],
  ['Andreea Stanca', 'andreea.stanca02@yahoo.com'],
  ['Nikhil Kushal Kumar', 'nikhilsinghvi21354@gmail.com'],
  ['Sanjay Rahul Mogilipuri', 'rahulmogilipuri@gmail.com'],
  ['Patel Mohammed Munaf', 'patelmohammed363@gmail.com'],
  ['Karishma Tusharkumar', 'karishma.panchal.patel@gmail.com'],
  ['Naba Ali', 'nabaali943@gmail.com'],
  ['Alisha Abid', 'alishaabidkmk@gmail.com'],
  ['Steffi Abhishek Kamble', 'steffij06@gmail.com'],
  ['Yaseen Akbar', 'yaseenakbar84@gmail.com'],
  ['Abira Abid', 'abira676@gmail.com'],
  ['Aman Mehta', 'mehtaaman888@gmail.com'],
];

const START_N = 358; // continues straight on from FF357

function passwordFromApplicantId(applicantId) {
  const m = applicantId.match(/(\d+)$/);
  return `ysfcscdff${m ? m[1] : ''}`;
}

async function main() {
  if (!serviceClient) {
    console.error('Supabase service client not configured (check .env).');
    process.exit(1);
  }

  const creds = [['email', 'password', 'name', 'applicant_id']];
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < MISSED.length; i++) {
    const [name, emailRaw] = MISSED[i];
    const email = emailRaw.toLowerCase();
    const applicantId = `YSF-DXB-2026-FF${START_N + i}`;
    const password = passwordFromApplicantId(applicantId);

    // Safety re-check right before writing — belt and suspenders against
    // having run this twice, or the gap having been closed some other way
    // since the analysis was done.
    const [{ data: byEmail }, { data: byId }] = await Promise.all([
      serviceClient.from('delegates').select('id,email,applicant_id').eq('email', email).maybeSingle(),
      serviceClient.from('delegates').select('id,email,applicant_id').eq('applicant_id', applicantId).maybeSingle(),
    ]);
    if (byEmail || byId) {
      console.warn(`- ${applicantId} ${email}: already exists (email match=${!!byEmail}, id match=${!!byId}) — skipping`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`[dry-run] would create ${applicantId} ${email} (${name}) password=${password}`);
      created++;
      continue;
    }

    const { data: userData, error: userErr } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (userErr) {
      console.error(`✗ ${applicantId} ${email}: auth create failed — ${userErr.message}`);
      failed++;
      continue;
    }

    const profile = { id: userData.user.id, name, email, applicant_id: applicantId, status: 'unenrolled' };
    const { data: inserted, error: profErr } = await serviceClient
      .from('delegates')
      .insert(profile)
      .select('*')
      .single();
    if (profErr) {
      console.error(`✗ ${applicantId} ${email}: profile insert failed — ${profErr.message}`);
      failed++;
      continue;
    }

    const { error: markErr } = await serviceClient
      .from('delegates')
      .update({ credential_email_sent_at: new Date().toISOString() })
      .eq('id', inserted.id)
      .is('credential_email_sent_at', null);
    if (markErr) console.error(`  (warning) credential_email_sent_at update failed for ${email}: ${markErr.message}`);

    await sendCredentialEmail({ email, name, password });

    serviceClient
      .from('usage_events')
      .insert({ user_id: inserted.id, email, event_type: 'delegate_enrolled', detail: applicantId })
      .then(() => {}, () => {});
    serviceClient
      .from('usage_events')
      .insert({ user_id: inserted.id, email, event_type: 'credential_email_sent', detail: applicantId })
      .then(() => {}, () => {});

    creds.push([email, password, name, applicantId]);
    created++;
    console.log(`✓ ${applicantId} ${email}`);
  }

  if (!DRY_RUN && creds.length > 1) {
    const outPath = path.join(__dirname, '..', 'backfill-missed-enroll-credentials.csv');
    fs.writeFileSync(
      outPath,
      creds.map((r) => r.map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(',')).join('\n')
    );
    console.log(`\nCredentials written to ${outPath} — gitignored (*credentials*.csv), delete once distribution is confirmed.`);
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}, failed ${failed}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
