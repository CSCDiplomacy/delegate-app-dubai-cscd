// Shared Resend sender for one-off transactional emails (as opposed to
// lib/reminders.js's scheduled rundown pings). No-op until RESEND_API_KEY is
// set, same as reminders — callers should fire-and-forget so a Resend outage
// never blocks the caller's own response.
const fs = require('fs');
const path = require('path');

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@thecscd.org';
const PORTAL_URL = (process.env.APP_URL || 'https://delegate.thecscd.org/').replace(/\/?$/, '/');
const EVENT_NAME = process.env.EVENT_NAME || 'Youth Strategic Forum, Dubai 2026';
// No confirmed interview deadline exists for Dubai yet (mirrors
// scripts/send_credentials.py's default) — set INTERVIEW_DEADLINE in the
// environment once the client confirms one.
const INTERVIEW_DEADLINE = process.env.INTERVIEW_DEADLINE || 'TBD, check the Interview tab in your portal for the current date';

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

// Sent from the n8n enroll webhook (routes/enroll.js) once a delegate account
// is provisioned. Same template + copy as the manual batch send
// (scripts/send_credentials.py + scripts/credential-email.html) — this just
// automates that same email one delegate at a time.
async function sendCredentialEmail({ email, name, password }) {
  if (!resend || !email) return;
  const greeting = name || 'Delegate';
  const vars = {
    name: greeting,
    email,
    password,
    portal_url: PORTAL_URL,
    interview_deadline: INTERVIEW_DEADLINE,
  };
  try {
    const html = renderTemplate(
      path.join(__dirname, '..', 'scripts', 'credential-email.html'),
      vars
    );
    const text = `Welcome to ${EVENT_NAME}: Complete Your Interview\n\n` +
      `Hi ${greeting},\n\n` +
      `Congratulations, you're part of the Youth Strategic Forum, Dubai 2026 community. Your delegate portal is now live, and your interview for scholarship consideration is ready to complete inside it.\n\n` +
      `YOUR LOGIN\n` +
      `Portal:   ${PORTAL_URL}\n` +
      `Email:    ${email}\n` +
      `Password: ${password}\n\n` +
      `NEXT STEPS\n` +
      `1. Sign in at ${PORTAL_URL}\n` +
      `2. Open the Interview tab and complete your interview. It takes a few minutes. Interview form submission deadline: ${INTERVIEW_DEADLINE}\n` +
      `3. Explore the program, hotel, and venue in your portal\n\n` +
      `Missing the interview deadline affects scholarship eligibility. You'll still be considered for the self-financed option.\n\n` +
      `YOUR PORTAL IS YOUR MAIN CHANNEL FROM HERE\n` +
      `We'll use it for all further communication, including schedule updates and announcements, not just email. Sign in regularly and check it.\n\n` +
      `This is a no-reply email. For questions, contact us at contact@thecscd.org.\n\n` +
      `Welcome aboard,\nThe CSCD Team\nCenter for Strategy and Cultural Diplomacy`;
    await resend.emails.send({
      from: `CSCD <${FROM_EMAIL}>`,
      to: email,
      subject: `Welcome to ${EVENT_NAME}: Complete Your Interview`,
      html,
      text,
    });
  } catch (e) {
    console.error(`[email] credential-email send failed to ${email}:`, e.message);
  }
}

module.exports = { sendInterviewReceivedEmail, sendCredentialEmail };
