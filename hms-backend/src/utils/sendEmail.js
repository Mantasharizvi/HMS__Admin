const nodemailer = require('nodemailer');

// Lazily builds a transporter from SMTP_* env vars. Returns null (and logs
// a warning once) when SMTP isn't configured, so the rest of the app can
// keep working (in-app notifications still get created) even without email set up.
let transporter = null;
let warned = false;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (!warned) {
      console.warn(
        '[sendEmail] SMTP_HOST/SMTP_USER/SMTP_PASS not set in .env — emails will be skipped. ' +
        'Set them (see .env.example) to enable real email delivery.'
      );
      warned = true;
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

/**
 * Send an email to one or more addresses.
 * Never throws - failures are logged and swallowed so a failed email
 * never breaks the API request that triggered it.
 * @param {Object} opts
 * @param {string|string[]} opts.to
 * @param {string} opts.subject
 * @param {string} opts.text
 * @param {string} [opts.html]
 */
async function sendEmail({ to, subject, text, html }) {
  const addresses = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (addresses.length === 0) return { sent: false, reason: 'No recipient addresses' };

  const t = getTransporter();
  if (!t) return { sent: false, reason: 'SMTP not configured' };

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: addresses.join(','),
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });
    return { sent: true };
  } catch (err) {
    console.error('[sendEmail] Failed to send email:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = sendEmail;
