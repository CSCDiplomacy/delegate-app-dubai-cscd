#!/usr/bin/env node
// One-off: verify the 28 backfill credential emails actually sent via
// Resend (not just that our fire-and-forget call didn't throw — Resend's
// SDK can return {error} without throwing, e.g. on a rate limit).
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

const TARGETS = [
  'godsgrace9201@gmail.com','grmanesales@gmail.com','rubiyasiddique40@gmail.com','subhash778184@gmail.com',
  'soofiyaareefa@gmail.com','kibnelbachyr@gmail.com','arunac212000@gmail.com','ameypatil43@gmail.com',
  'sahildutt36@gmail.com','amreenshahrukh5698@gmail.com','chandreshkk123@gmail.com','borkarswara1@gmail.com',
  'rabiarasheed64@gmail.com','kainaatrehman92@gmail.com','reyesokarlaadaia@gmail.com','ritaalexandrafernandes@gmail.com',
  'rimsha.maalik96@gmail.com','andreea.stanca02@yahoo.com','nikhilsinghvi21354@gmail.com','rahulmogilipuri@gmail.com',
  'patelmohammed363@gmail.com','karishma.panchal.patel@gmail.com','nabaali943@gmail.com','alishaabidkmk@gmail.com',
  'steffij06@gmail.com','yaseenakbar84@gmail.com','abira676@gmail.com','mehtaaman888@gmail.com',
];

async function main() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('No RESEND_API_KEY found.');
    process.exit(1);
  }
  const res = await fetch('https://api.resend.com/emails?limit=50', {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.error('Resend list call failed:', res.status, await res.text());
    process.exit(1);
  }
  const body = await res.json();
  const items = body.data || body.emails || [];
  console.log(`Resend returned ${items.length} recent emails (endpoint may cap history depth).`);

  const found = new Map();
  for (const item of items) {
    const to = Array.isArray(item.to) ? item.to[0] : item.to;
    if (to && TARGETS.includes(to.toLowerCase())) {
      found.set(to.toLowerCase(), item.last_event || item.status || 'unknown');
    }
  }

  console.log(`\nMatched ${found.size} of ${TARGETS.length} target recipients in Resend's recent list:`);
  for (const [email, status] of found) console.log(`  ${status.padEnd(12)} ${email}`);

  const missing = TARGETS.filter((t) => !found.has(t));
  if (missing.length) {
    console.log(`\nNOT found in Resend's recent list (${missing.length}):`);
    missing.forEach((e) => console.log(`  ${e}`));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
