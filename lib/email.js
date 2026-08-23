// Shared Resend sender for one-off transactional emails (as opposed to
// lib/reminders.js's scheduled rundown pings). No-op until RESEND_API_KEY is
// set, same as reminders — callers should fire-and-forget so a Resend outage
// never blocks the caller's own response.
const fs = require('fs');
const path = require('path');

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@thecscd.org';
const PORTAL_URL = (process.env.APP_URL || 'https://delegate.thecscd.org/').replace(/\/?$/, '/');

let resend = null;
try {
  if (process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (e) {
  console.warn('[email] resend not available:', e.message);
}

function renderTemplate(templatePath, vars) {
  let html = fs.readFileSync(templatePath, 'utf8');
  for (const [key, value] of Object.entries(vars)) {
    html = html.split(`{{${key}}}`).join(value);
  }
  return html;
}

// Sent from the AidaForm webhook once a submission is recorded. Mirrors
// credential-email.html's branding (scripts/interview-received-email.html).
async function sendInterviewReceivedEmail({ email, name }) {
  if (!resend || !email) return;
  const vars = { name: name || 'delegate', portal_url: PORTAL_URL };
  try {
    const html = renderTemplate(
      path.join(__dirname, '..', 'scripts', 'interview-received-email.html'),
      vars
    );
    await resend.emails.send({
      from: `CSCD <${FROM_EMAIL}>`,
      to: email,
      subject: "We've received your interview — Youth Strategic Forum, Dubai 2026",
      html,
      text: `Thank you, ${vars.name}.\n\nWe've received your interview submission for the Youth Strategic Forum, Dubai 2026. There's nothing further you need to do — our team will review it and follow up with your result through the portal and by email.\n\nPortal: ${PORTAL_URL}\n\n— The CSCD Team`,
    });
  } catch (e) {
    console.error(`[email] interview-received send failed to ${email}:`, e.message);
  }
}

module.exports = { sendInterviewReceivedEmail };
