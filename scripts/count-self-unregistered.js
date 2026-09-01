// Count self-financed delegates who have NOT yet registered/paid — the audience
// for the partial-waiver invite. Reads Supabase URL + service-role key from the
// main checkout's .env.live (never logged) and queries PostgREST directly.
// Also reports how many already submitted a waiver request, and writes the
// recipient list (name,email) to scripts/waiver-invite-recipients.csv.
//
//   node scripts/count-self-unregistered.js       (needs network)

const fs = require('fs');

const ENV_PATH =
  process.env.SUPABASE_ENV_FILE ||
  '/home/nasir/myComputer/cscd/ysf-dubai-2026/delegate_app_dubai/.env.live';

function envVal(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = fs
      .readFileSync(ENV_PATH, 'utf8')
      .split('\n')
      .find((l) => l.startsWith(name + '='));
    return line ? line.slice(name.length + 1).trim() : '';
  } catch {
    return '';
  }
}

async function main() {
  const url = envVal('SUPABASE_URL');
  const key = envVal('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const dRes = await fetch(
    `${url}/rest/v1/delegates?result_tier=eq.self&select=id,name,email,applicant_id,registration_status`,
    { headers }
  );
  if (!dRes.ok) {
    console.error('delegates query failed', dRes.status, await dRes.text());
    process.exit(1);
  }
  const delegates = await dRes.json();

  const rRes = await fetch(
    `${url}/rest/v1/scholarship_requests?select=delegate_id,status`,
    { headers }
  );
  const requests = rRes.ok ? await rRes.json() : [];
  const requestedIds = new Set(requests.map((r) => r.delegate_id));

  const notReg = delegates.filter(
    (d) => (d.registration_status || 'not_started') !== 'submitted'
  );
  const registered = delegates.length - notReg.length;
  const notRegNoEmail = notReg.filter((d) => !d.email);
  const notRegAlreadyRequested = notReg.filter((d) => requestedIds.has(d.id));

  // Context: overall tier + status distribution, to sanity-check the target.
  const allRes = await fetch(
    `${url}/rest/v1/delegates?select=result_tier,status`,
    { headers }
  );
  if (allRes.ok) {
    const all = await allRes.json();
    const byTier = {};
    const selfByStatus = {};
    for (const d of all) {
      const t = d.result_tier || '(none)';
      byTier[t] = (byTier[t] || 0) + 1;
      if (d.result_tier === 'self') {
        const s = d.status || '(none)';
        selfByStatus[s] = (selfByStatus[s] || 0) + 1;
      }
    }
    console.log('all delegates:', all.length);
    console.log('by result_tier:', JSON.stringify(byTier));
    console.log('self by status:', JSON.stringify(selfByStatus));
    console.log('');
  }

  console.log('result_tier = self');
  console.log('  total self:                 ', delegates.length);
  console.log('  registered / paid:          ', registered);
  console.log('  NOT registered (target):    ', notReg.length);
  console.log('    - already requested waiver:', notRegAlreadyRequested.length);
  console.log('    - missing email:          ', notRegNoEmail.length);
  console.log('  => unique emailable target: ', notReg.filter((d) => d.email).length);

  // Write recipient CSV (name,email) for the send step.
  const rows = notReg
    .filter((d) => d.email)
    .map((d) => `${(d.name || '').replace(/"/g, '""')},${d.email}`);
  const out = '/home/nasir/.claude/jobs/8017145e/tmp/waiver-invite-recipients.csv';
  fs.writeFileSync(out, 'name,email\n' + rows.join('\n') + '\n');
  console.log(`\nWrote ${rows.length} recipients to ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
