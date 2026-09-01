// One-off: partial-waiver invitation email for self-financed YSF Dubai 2026
// delegates. Reuses the official CSCD email design from scripts/info-email.html
// (white 640px card, maroon header with the CSCD wordmark, Archivo/Inter,
// #FBFAF6 page) so it matches the confirmation email delegates already got.
// Points delegates to the in-portal "Request a Partial Waiver" card, states the
// two questionnaire questions, the 5 rolling-basis seats, and the deadline.
//
// Dependency-free (global fetch + Resend REST). Reads RESEND_API_KEY from the
// environment or the main checkout's .env.live (never logged). Recipients
// default to the test + contact addresses; pass addresses as args to override.
//
//   node scripts/send-waiver-invite.js [to ...]       (needs network)
//   node scripts/send-waiver-invite.js --domains       (list verified domains)

const fs = require('fs');

function resendKey() {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  const envPath =
    process.env.RESEND_ENV_FILE ||
    '/home/nasir/myComputer/cscd/ysf-dubai-2026/delegate_app_dubai/.env.live';
  try {
    const line = fs
      .readFileSync(envPath, 'utf8')
      .split('\n')
      .find((l) => l.startsWith('RESEND_API_KEY='));
    return line ? line.slice('RESEND_API_KEY='.length).trim() : '';
  } catch {
    return '';
  }
}

const RESEND_API = 'https://api.resend.com/emails';
// Verified sender is the programs.thecscd.org subdomain; display name matches
// the confirmation email ("CSCD").
const FROM = 'CSCD <noreply@programs.thecscd.org>';
const REPLY_TO = 'contact@thecscd.org';
const PORTAL_URL = 'https://delegate.thecscd.org';

const RECIPIENTS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const TO = RECIPIENTS.length ? RECIPIENTS : ['naasrbilal@gmail.com', 'contact@thecscd.org'];

const SUBJECT = 'Youth Strategic Forum, Dubai 2026 - Partial Waiver Opportunity';

function html() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light only" />
<title>Partial Waiver Opportunity</title>
<!--[if !mso]><!-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<!--<![endif]-->
<style>
  @media only screen and (max-width:480px) {
    .email-wrap { padding: 16px 8px !important; }
    .px { padding-left: 18px !important; padding-right: 18px !important; }
    h1.hero { font-size: 21px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background:#FBFAF6; -webkit-font-smoothing:antialiased; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; color:#241417;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#FBFAF6; font-size:1px; line-height:1px;">
    You are invited to request a Partial Waiver on your YSF Dubai 2026 participation fee. 5 seats, awarded on a rolling basis. Deadline 3 September 2026, 11:59 PM (GST).
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-wrap" style="background:#FBFAF6; padding:32px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; width:100%; background:#FFFFFF; border:1px solid rgba(26,51,38,.14); border-radius:0; overflow:hidden; box-shadow:0 1px 2px rgba(15,31,24,.06), 0 8px 30px rgba(15,31,24,.08);">

          <!-- Header -->
          <tr>
            <td class="px" style="background:#8E2631; padding:18px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="https://delegate.thecscd.org/img/cscd-wordmark-reverse.png" width="180" height="33" alt="CSCD, Center for Strategy and Cultural Diplomacy" style="display:block; border:0; outline:none; height:auto; max-width:180px;" />
                  </td>
                  <td style="vertical-align:middle; text-align:right; font-family:'Inter',sans-serif; font-size:10px; line-height:1.4; letter-spacing:0.1em; text-transform:uppercase; color:#FCE2C3; font-weight:700;">Youth Strategic Forum<br/>Dubai 2026</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td class="px" style="padding:30px 28px 6px; font-size:14px; line-height:1.65; color:#241417;">
              <div style="display:inline-block; margin-bottom:15px; font-family:'Inter',sans-serif; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:#8E2631; background:#E7C673; padding:5px 11px; font-weight:700;">Waiver Opportunity</div>
              <h1 class="hero" style="margin:0 0 15px; font-family:'Archivo','Avenir Next Condensed','Segoe UI Semibold',Arial,sans-serif; font-weight:800; text-transform:uppercase; letter-spacing:-0.02em; line-height:1.06; font-size:25px; color:#241417;">Request a Partial Waiver</h1>
              <p style="margin:0 0 12px; color:#5B6660;">Dear Delegate,</p>
              <p style="margin:0 0 12px; color:#5B6660;">Thank you for your interest in the <strong style="color:#241417;">Youth Strategic Forum (YSF) Dubai 2026</strong>.</p>
              <p style="margin:0; color:#5B6660;">Given the exceptional interest and participation from delegates across many nationalities, we are pleased to invite self-financed delegates to be considered for a <strong style="color:#241417;">Partial Waiver covering 50% of the self-financed participation fee</strong>, to further support emerging leaders who can contribute meaningfully to the Forum's themes and institutional engagements.</p>
            </td>
          </tr>

          <!-- Availability + deadline callout -->
          <tr>
            <td class="px" style="padding:16px 28px 2px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E7C673; border-left:5px solid #8E2631; background:#FBF6E6;">
                <tr>
                  <td style="padding:18px 20px; font-family:'Inter',sans-serif; font-size:14px; line-height:1.65; color:#5B6660;">
                    <div style="font-family:'Archivo',Arial,sans-serif; font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.03em; color:#8E2631; padding-bottom:8px;">Limited Availability</div>
                    <p style="margin:0 0 8px; color:#241417;">We have <strong>5 partial waiver seats</strong> available, awarded on a <strong>rolling basis</strong>. Early submissions are encouraged, as seats may be filled before the deadline.</p>
                    <p style="margin:0; color:#241417;"><strong>Deadline:</strong> 3 September 2026, 11:59 PM (Dubai time, GST).</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- How to apply -->
          <tr>
            <td class="px" style="padding:20px 28px 4px; font-size:14px; line-height:1.65; color:#5B6660;">
              <h2 style="margin:12px 0 6px; font-family:'Archivo',Arial,sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:0.02em; font-size:13px; color:#8E2631;">How to Apply</h2>
              <p style="margin:0 0 12px;">Submit your request directly in your delegate portal. Log in at <a href="${PORTAL_URL}" style="color:#8E2631; text-decoration:none; font-weight:700;">delegate.thecscd.org</a> and open the <strong style="color:#241417;">Request a Partial Waiver</strong> card on your dashboard, then answer the two questions below:</p>
              <p style="margin:0 0 6px; color:#241417;"><strong>1.</strong> What unique perspective, impact, and motivation make you a strong candidate for this waiver?</p>
              <p style="margin:0 0 12px; color:#241417;"><strong>2.</strong> How will your participation contribute to the global strategy and cultural diplomacy dialogue?</p>

              <div style="font-family:'Inter',sans-serif; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#8A7E7A; font-weight:700; padding:4px 0 4px;">Guidelines</div>
              <p style="margin:0 0 6px;">&bull; Maximum 150 to 200 words per answer.</p>
              <p style="margin:0 0 6px;">&bull; Focus on your unique perspective, impact, and motivation.</p>
              <p style="margin:0 0 14px;">&bull; Highlight your potential contribution to the Forum's high-level discussions and engagements.</p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="px" style="padding:2px 28px 6px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#8E2631;">
                    <a href="${PORTAL_URL}" style="display:inline-block; font-family:'Inter',sans-serif; font-size:13px; font-weight:700; color:#FFFFFF; text-decoration:none; text-transform:uppercase; letter-spacing:0.04em; padding:12px 22px;">Open my delegate portal</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Review note -->
          <tr>
            <td class="px" style="padding:14px 28px 4px; font-size:14px; line-height:1.65; color:#5B6660;">
              <p style="margin:0;">Upon review, shortlisted candidates may be offered the waiver to support their participation. If you have already completed your registration and payment, no action is needed.</p>
            </td>
          </tr>

          <!-- No-reply notice -->
          <tr>
            <td class="px" style="padding:16px 28px 0; font-family:'Inter',sans-serif; font-size:13px; line-height:1.6; color:#8A7E7A;">
              <p style="margin:0;">This is a no-reply email. For any questions, please write to us at <a href="mailto:contact@thecscd.org" style="color:#8E2631; text-decoration:none;">contact@thecscd.org</a>.</p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td class="px" style="padding:16px 28px 26px; font-family:'Inter',sans-serif; font-size:14px; line-height:1.55; color:#241417;">
              <p style="margin:0 0 10px; color:#5B6660;">Warm regards,</p>
              <p style="margin:0; font-weight:700; color:#241417;">Binaymeen A. Wahid</p>
              <p style="margin:0; color:#8A7E7A;">Program Coordinator, Department of Programs</p>
              <p style="margin:7px 0 0; color:#8A7E7A;">Center for Strategy and Cultural Diplomacy (CSCD)</p>
              <p style="margin:2px 0 0; color:#8A7E7A;"><a href="mailto:contact@thecscd.org" style="color:#8E2631; text-decoration:none;">contact@thecscd.org</a> &nbsp;&middot;&nbsp; <a href="https://thecscd.org" style="color:#8E2631; text-decoration:none;">thecscd.org</a></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="px" style="padding:16px 28px; background:#F4EEEE; border-top:1px solid rgba(26,51,38,.14); font-family:'Inter',sans-serif; font-size:10px; color:#8A7E7A; line-height:1.5;">
              thecscd.org<br/>
              Youth Strategic Forum, Dubai 2026
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function main() {
  const key = resendKey();
  if (!key) {
    console.error('Missing RESEND_API_KEY (env or .env.live)');
    process.exit(1);
  }

  if (process.argv.includes('--domains')) {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
    });
    console.log(res.status, await res.text());
    return;
  }

  const body = html();
  for (const to of TO) {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, reply_to: REPLY_TO, subject: SUBJECT, html: body }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`FAILED ${to}: ${res.status} ${text}`);
    } else {
      let id = '';
      try { id = JSON.parse(text).id || ''; } catch {}
      console.log(`SENT ${to} (id ${id})`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
