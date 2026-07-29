#!/usr/bin/env node
// upload-vouchers.js — one-time upload of accommodation voucher PDFs.
//
// Reads accommodation_vouchers/*.pdf (or a directory passed as argv[2]) and
// uploads each to the private `accommodation-vouchers` Supabase Storage bucket
// keyed by applicant_id (e.g. YPDS-JKT-F114.pdf). Filenames in the source
// folder are `YPDS-JKT-26-F###.pdf` — the `26-` is stripped so the key matches
// the applicant_id stored in the delegates table.
//
// Usage:
//   node scripts/upload-vouchers.js [source-dir]
//
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'accommodation-vouchers';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const srcDir = path.resolve(process.argv[2] || 'accommodation_vouchers');
if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) {
  console.error(`Source directory not found: ${srcDir}`);
  process.exit(1);
}

// Turn a source filename into the applicant_id used as the storage key.
// YPDS-JKT-26-F114.pdf → YPDS-JKT-F114  (drops the `26-` cohort segment)
// Also accepts YPDS-JKT-F114.pdf as-is.
function keyFor(filename) {
  const base = path.basename(filename, path.extname(filename));
  const m = base.match(/^YPDS-JKT-(?:\d+-)?F\d+$/);
  if (!m) return null;
  return base.replace(/^YPDS-JKT-\d+-F/, 'YPDS-JKT-F');
}

async function main() {
  const supa = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const files = fs.readdirSync(srcDir).filter((f) => f.toLowerCase().endsWith('.pdf'));
  if (!files.length) {
    console.error(`No .pdf files in ${srcDir}`);
    process.exit(1);
  }

  const validApplicantIds = new Set();
  const { data: rows, error: rowsErr } = await supa
    .from('delegates')
    .select('applicant_id')
    .not('applicant_id', 'is', null);
  if (rowsErr) {
    console.error('Failed to load delegates:', rowsErr.message);
    process.exit(1);
  }
  rows.forEach((r) => validApplicantIds.add(r.applicant_id));

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const file of files) {
    const applicantId = keyFor(file);
    if (!applicantId) {
      console.warn(`SKIP ${file} — cannot derive applicant_id`);
      skipped++;
      continue;
    }
    if (!validApplicantIds.has(applicantId)) {
      console.warn(`SKIP ${file} → ${applicantId} (no matching delegate)`);
      skipped++;
      continue;
    }
    const body = fs.readFileSync(path.join(srcDir, file));
    const key = `${applicantId}.pdf`;
    const { error } = await supa.storage.from(BUCKET).upload(key, body, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (error) {
      console.error(`FAIL ${file} → ${key}: ${error.message}`);
      failed++;
    } else {
      console.log(`OK   ${file} → ${key}`);
      ok++;
    }
  }

  console.log(`\nUploaded ${ok}, skipped ${skipped}, failed ${failed}.`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
