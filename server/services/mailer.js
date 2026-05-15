// =====================================================================
// SMTP transport. Templates live in ./mail-templates.js — this module
// is responsible only for creating the nodemailer transporter and
// emitting messages over the wire.
//
// Direct callers (sendInquiryEmails, sendGdprConfirmation) are kept
// for backward compatibility but new code should enqueue into the
// mail_outbox table via ./mail-outbox.js instead. The outbox decouples
// SMTP latency from the user-facing request.
// =====================================================================
const nodemailer = require('nodemailer');
const {
  defaultFrom,
  inquiryRecipients,
  buildInquiryInternalMail,
  buildInquiryAutoReplyMail,
  buildGdprConfirmMail,
} = require('./mail-templates');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn('[mailer] SMTP not fully configured. Mails will be logged only.');
    transporter = {
      _devOnly: true,
      sendMail: async (opts) => {
        console.log('[mailer:dev]', { to: opts.to, subject: opts.subject });
        return { messageId: 'dev-' + Date.now() };
      },
    };
    return transporter;
  }
  // 15s timeouts so a hung SMTP host can't tie up the outbox worker
  // indefinitely; the worker will retry with exponential backoff.
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
  return transporter;
}

// --- Backward-compatible direct senders (NOT recommended in new code) ---

async function sendInquiryEmails(inq, attachments) {
  const t = getTransporter();
  const fromAddr = defaultFrom();
  const internal = buildInquiryInternalMail(inq, { attachments });
  const internalRes = await t.sendMail({ from: fromAddr, ...internal });

  let autoRes = null;
  if (String(process.env.AUTO_REPLY_ENABLED || 'true') === 'true') {
    const auto = buildInquiryAutoReplyMail(inq);
    autoRes = await t.sendMail({ from: fromAddr, ...auto });
  }
  return { internal: internalRes, auto: autoRes };
}

async function sendGdprConfirmation(req, link) {
  const t = getTransporter();
  const fromAddr = defaultFrom();
  const msg = buildGdprConfirmMail(req, link);
  return t.sendMail({ from: fromAddr, ...msg });
}

module.exports = {
  getTransporter,
  sendInquiryEmails,
  sendGdprConfirmation,
  defaultFrom,
  inquiryRecipients,
};
