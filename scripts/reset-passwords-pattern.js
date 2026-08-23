#!/usr/bin/env node
// One-off: reset already-seeded delegates' passwords to ysfcscdff<applicant-id-number>.
// Reads the same seed input CSV (email, applicant_id), looks up each delegate's
// auth user id from the `delegates` table, and updates their password via the
// Supabase admin API. Rewrites the credentials CSV to match.
//
// Usage: node scripts/reset-passwords-pattern.js dubai-seed-input.csv dubai-credentials.csv
require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const inputPath = process.argv[2];
const outputPath = process.argv[3] || 'dubai-credentials.csv';
if (!inputPath) {
  console.error('Usage: node scripts/reset-passwords-pattern.js <seed-input.csv> [credentials-out.csv]');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = {};
    header.forEach((h, i) => (row[h] = (cells[i] || '').trim()));
    return row;
  });
}
function csvEscape(v) {
  const s = (v ?? '').toString();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const rows = parseCsv(fs.readFileSync(inputPath, 'utf8'));
  const creds = [['email', 'password', 'name', 'applicant_id']];
  let updated = 0, failed = 0;

  for (const row of rows) {
    const email = (row['Email'] || '').toLowerCase();
    const name = row['Full Name'] || '';
    const applicantId = row['applicant_id'] || '';
    const m = applicantId.match(/FF(\d+)$/i);
    if (!m) {
      console.error(`✗ ${email}: applicant_id "${applicantId}" doesn't match FF<number>, skipped`);
      failed++;
      continue;
    }
    const newPassword = `ysfcscdff${m[1]}`;

    // Look up the delegate's auth user id by applicant_id.
    const { data: delRows, error: lookupErr } = await admin
      .from('delegates')
      .select('id')
      .eq('applicant_id', applicantId)
      .limit(1);
    if (lookupErr || !delRows || !delRows.length) {
      console.error(`✗ ${email}: no delegate row found for applicant_id ${applicantId}`);
      failed++;
      continue;
    }
    const userId = delRows[0].id;

    const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (updErr) {
      console.error(`✗ ${email}: password update failed — ${updErr.message}`);
      failed++;
      continue;
    }

    creds.push([email, newPassword, name, applicantId]);
    updated++;
    console.log(`✓ ${email} -> ${newPassword}`);
  }

  fs.writeFileSync(outputPath, creds.map((r) => r.map(csvEscape).join(',')).join('\n'));
  console.log(`\nDone. Updated ${updated}, failed ${failed}.`);
  console.log(`Credentials rewritten to ${outputPath}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
