// TEST: the partial-waiver APPROVAL (congratulations) email, on the official
// CSCD template (wordmark header), sent to a test address so we can preview
// what an approved delegate receives. Dependency-free (Resend REST); reads
// RESEND_API_KEY from .env.live. Not part of the app flow — preview only.
//
//   node scripts/send-approval-test.js [to]

const fs = require('fs');

function resendKey() {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  try {
    const line = fs
      .readFileSync('/home/nasir/myComputer/cscd/ysf-dubai-2026/delegate_app_dubai/.env.live', 'utf8')
      .split('\n')
      .find((l) => l.startsWith('RESEND_API_KEY='));
    return line ? line.slice('RESEND_API_KEY='.length).trim() : '';
  } catch {
    return '';
  }
}

const FROM = 'CSCD <noreply@programs.thecscd.org>';
const REPLY_TO = 'contact@thecscd.org';
const PORTAL_URL = 'https://delegate.thecscd.org';
const TO = process.argv[2] || 'naasrbilal@gmail.com';
const SUBJECT = 'Congratulations, you have been awarded a Partial Waiver';
const NAME = 'Delegate';

function html() {
  const first = NAME;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light only" />
<title>Partial Waiver Awarded</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background:#FBFAF6; font-family:'Inter',Arial,sans-serif; color:#241417;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBFAF6; padding:32px 14px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; width:100%; background:#FFFFFF; border:1px solid rgba(26,51,38,.14); box-shadow:0 8px 30px rgba(15,31,24,.08);">
        <tr>
          <td style="background:#8E2631; padding:18px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:middle;">
                <img src="https://delegate.thecscd.org/img/cscd-wordmark-reverse.png" width="180" height="33" alt="CSCD" style="display:block; border:0; height:auto; max-width:180px;" />
              </td>
              <td style="vertical-align:middle; text-align:right; font-family:'Inter',sans-serif; font-size:10px; line-height:1.4; letter-spacing:0.1em; text-transform:uppercase; color:#FCE2C3; font-weight:700;">Youth Strategic Forum<br/>Dubai 2026</td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px 6px;">
            <div style="display:inline-block; font-family:'Inter',sans-serif; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:#8E2631; background:#E7C673; padding:5px 11px; font-weight:700;">Partial Waiver Awarded</div>
            <h1 style="margin:16px 0 0; font-family:'Archivo',Arial,sans-serif; font-weight:800; text-transform:uppercase; letter-spacing:-0.02em; font-size:25px; color:#241417;">Congratulations, ${first}!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 4px; font-size:14px; line-height:1.65; color:#5B6660;">
            <p style="margin:14px 0;">We are delighted to let you know that, following review of your request, you have been selected for a <strong style="color:#241417;">Partial Waiver covering 50% of the self-financed participation fee</strong> for the Youth Strategic Forum, Dubai 2026.</p>
            <p style="margin:14px 0;">To secure your place, please log in to your delegate portal to complete your registration and payment of the remaining balance.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:14px 28px 26px;">
            <a href="${PORTAL_URL}" style="display:inline-block; background:#8E2631; color:#FFFFFF; text-decoration:none; font-family:'Inter',sans-serif; font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:0.04em; padding:14px 30px;">Open my delegate portal</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 26px; font-size:14px; line-height:1.55; color:#241417;">
            <p style="margin:0 0 10px; color:#5B6660;">Warm regards,</p>
            <p style="margin:0; font-weight:700;">Binaymeen A. Wahid</p>
            <p style="margin:0; color:#8A7E7A;">Program Coordinator, Department of Programs</p>
            <p style="margin:7px 0 0; color:#8A7E7A;">Center for Strategy and Cultural Diplomacy (CSCD)</p>
            <p style="margin:2px 0 0; color:#8A7E7A;"><a href="mailto:contact@thecscd.org" style="color:#8E2631; text-decoration:none;">contact@thecscd.org</a></p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px; background:#F4EEEE; border-top:1px solid rgba(26,51,38,.14); font-family:'Inter',sans-serif; font-size:10px; color:#8A7E7A;">
            thecscd.org &middot; Youth Strategic Forum, Dubai 2026
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function main() {
  const key = resendKey();
  if (!key) { console.error('Missing RESEND_API_KEY'); process.exit(1); }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: TO, reply_to: REPLY_TO, subject: SUBJECT, html: html() }),
  });
  const text = await res.text();
  if (!res.ok) { console.error(`FAILED ${TO}: ${res.status} ${text}`); process.exit(1); }
  let id = ''; try { id = JSON.parse(text).id || ''; } catch {}
  console.log(`SENT approval test to ${TO} (id ${id})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
