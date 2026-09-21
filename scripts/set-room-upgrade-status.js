#!/usr/bin/env node
// Flip one room_upgrade_requests row from 'pending' to 'approved' (or
// 'rejected') by applicant_id, guarded so it only touches a currently-'pending'
// row unless --force is passed. Writes a backup of the prior row first. Dry-run
// by default. Mirrors scripts/set-delegate-tier.js.
//
//   node scripts/set-room-upgrade-status.js <applicant_id> <approved|rejected> [--commit] [--force]
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ALLOWED = ['approved', 'rejected'];

const [, , applicantId, status] = process.argv;
const COMMIT = process.argv.includes('--commit');
const FORCE = process.argv.includes('--force');

if (!applicantId || !status || !ALLOWED.includes(status)) {
  console.error(`usage: set-room-upgrade-status.js <applicant_id> <${ALLOWED.join('|')}> [--commit] [--force]`);
  process.exit(1);
}

(async () => {
  const { data: delegate, error: e0 } = await sb
    .from('delegates')
    .select('id,name,email,applicant_id,status')
    .eq('applicant_id', applicantId)
    .maybeSingle();
  if (e0) { console.error(e0); process.exit(1); }
  if (!delegate) { console.error(`No delegate with applicant_id ${applicantId}`); process.exit(1); }

  const { data: before, error: e1 } = await sb
    .from('room_upgrade_requests')
    .select('id,delegate_id,email,applicant_id,status,decided_at,decided_by,payment_reference,created_at')
    .eq('delegate_id', delegate.id)
    .maybeSingle();
  if (e1) { console.error(e1); process.exit(1); }
  if (!before) { console.error(`No room_upgrade_requests row for ${applicantId} (nothing to approve).`); process.exit(1); }

  console.log('DELEGATE:', JSON.stringify(delegate));
  console.log('BEFORE  :', JSON.stringify(before));
  if (before.status === status) { console.log(`Already ${status}; nothing to do.`); return; }
  if (before.status !== 'pending' && !FORCE) {
    console.error(`Refusing: current status is '${before.status}', not 'pending'. Pass --force to override.`);
    process.exit(1);
  }

  if (!COMMIT) { console.log(`DRY RUN: would set status -> '${status}'. Re-run with --commit.`); return; }

  fs.writeFileSync(
    path.join(__dirname, '..', `set-room-upgrade-backup-${applicantId}.json`),
    JSON.stringify(before, null, 2));

  const decidedBy = process.env.USER || 'operator';
  let q = sb
    .from('room_upgrade_requests')
    .update({ status, decided_at: new Date().toISOString(), decided_by: decidedBy })
    .eq('delegate_id', delegate.id);
  if (!FORCE) q = q.eq('status', 'pending');
  const { data: after, error } = await q
    .select('id,delegate_id,applicant_id,status,decided_at,decided_by')
    .maybeSingle();
  if (error) { console.error(error); process.exit(1); }
  console.log('AFTER   :', JSON.stringify(after || '(guard matched nothing)'));
})();
