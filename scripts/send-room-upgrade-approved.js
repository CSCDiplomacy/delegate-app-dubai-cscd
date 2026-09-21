// Room-upgrade APPROVAL email for YSF Dubai 2026 delegates whose in-portal
// room-upgrade request was flipped to 'approved' by scripts/set-room-upgrade-
// status.js. Same brand and structure as send-waiver-approval.js.
//
// Dependency-free (global fetch + Resend REST). Reads RESEND_API_KEY from the
// environment or .env.live (never logged). Recipients come from the
// room_upgrade_requests table -- rows with status='approved' whose email is
// not yet in the sent-log CSV (idempotent).
//
//   node scripts/send-room-upgrade-approved.js --test [to]   # one preview email
//   node scripts/send-room-upgrade-approved.js --send        # the real recipients

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOG = path.join(__dirname, 'room-upgrade-approved-sent-log.csv');
const TEMPLATE = path.join(__dirname, 'room-upgrade-approved-email.html');

function resendKey() {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  try {
    const line = fs
      .readFileSync(path.join(ROOT, '.env.live'), 'utf8')
      .split('\n')
      .find((l) => l.startsWith('RESEND_API_KEY='));
    return line ? line.slice('RESEND_API_KEY='.length).trim() : '';
  } catch {
    return '';
  }
}

function supabaseCreds() {
  const envUrl = process.env.SUPABASE_URL;
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (envUrl && envKey) return { url: envUrl, key: envKey };
  try {
    const envLive = fs.readFileSync(path.join(ROOT, '.env.live'), 'utf8').split('\n');
    const pick = (k) => {
      const line = envLive.find((l) => l.startsWith(`${k}=`));
      return line ? line.slice(k.length + 1).trim() : '';
    };
    return { url: pick('SUPABASE_URL'), key: pick('SUPABASE_SERVICE_ROLE_KEY') };
  } catch {
    return { url: '', key: '' };
  }
}

const FROM = 'CSCD <noreply@programs.thecscd.org>';
const REPLY_TO = 'contact@thecscd.org';
const SUBJECT = 'Your single-room upgrade is confirmed';

function firstName(name) {
  const tok = String(name || '').trim().split(/\s+/)[0] || 'Delegate';
  return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
}

const HTML_TEMPLATE = fs.readFileSync(TEMPLATE, 'utf8');
function html(name) {
  return HTML_TEMPLATE.split('{{first_name}}').join(firstName(name));
}

async function sendOne(key, to, name) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, reply_to: REPLY_TO, subject: SUBJECT, html: html(name) }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  let id = ''; try { id = JSON.parse(text).id || ''; } catch {}
  return id;
}

function alreadySent() {
  try {
    return new Set(
      fs.readFileSync(LOG, 'utf8').trim().split('\n').slice(1)
        .map((l) => (l.split(',')[0] || '').trim().toLowerCase())
        .filter(Boolean)
    );
  } catch { return new Set(); }
}

function logSent(email, name, id) {
  if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, 'email,name,resend_id,sent_at\n');
  fs.appendFileSync(LOG, `${email},"${(name || '').replace(/"/g, '')}",${id},${new Date().toISOString()}\n`);
}

async function fetchApprovedRecipients() {
  const { url, key } = supabaseCreds();
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  // room_upgrade_requests -> delegates join via PostgREST embed. Only rows with
  // status='approved' and a delegate row with a non-null email are eligible.
  const q = `${url.replace(/\/$/, '')}/rest/v1/room_upgrade_requests?status=eq.approved&select=applicant_id,email,delegate:delegate_id(name,email)`;
  const res = await fetch(q, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const rows = await res.json();
  return rows.map((r) => ({
    applicant_id: r.applicant_id,
    email: (r.delegate && r.delegate.email) || r.email,
    name: (r.delegate && r.delegate.name) || '',
  }));
}

async function main() {
  const key = resendKey();
  if (!key) { console.error('Missing RESEND_API_KEY (env or .env.live)'); process.exit(1); }

  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  const isSend = args.includes('--send');

  if (!isTest && !isSend) {
    console.error('Pass --test [to]  or  --send'); process.exit(1);
  }

  if (isTest) {
    const to = args.find((a) => a.includes('@')) || 'naasrbilal@gmail.com';
    const id = await sendOne(key, to, 'Delegate');
    console.log(`SENT test approval to ${to} (id ${id})`);
    return;
  }

  const recipients = await fetchApprovedRecipients();
  const sent = alreadySent();
  console.log(`${recipients.length} approved recipients; ${sent.size} already sent.\n`);
  for (const r of recipients) {
    const email = (r.email || '').trim();
    if (!email) { console.log(`SKIP (no email): ${r.applicant_id}`); continue; }
    if (sent.has(email.toLowerCase())) { console.log(`SKIP (already sent): ${email}`); continue; }
    try {
      const id = await sendOne(key, email, r.name);
      logSent(email, r.name, id);
      console.log(`SENT ${r.name || r.applicant_id} <${email}> (id ${id})`);
    } catch (e) {
      console.error(`FAILED ${email}: ${e.message}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
