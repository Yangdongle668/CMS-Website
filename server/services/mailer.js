const nodemailer = require('nodemailer');
const { query, one } = require('../db/client');
const { escapeHtml } = require('../utils/validate');

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
      verify: async () => true,
    };
    return transporter;
  }
  transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  return transporter;
}

function defaultFrom() {
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
}

function inquiryRecipients() {
  const list = (process.env.INQUIRY_RECIPIENTS || process.env.SMTP_USER || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : [defaultFrom()];
}

function inquiryRowsHtml(inq) {
  const rows = [
    ['Reference', inq.reference],
    ['Company', inq.company],
    ['Name', inq.full_name],
    ['Email', inq.email],
    ['Phone', inq.phone],
    ['Country', inq.country],
    ['Categories', (inq.product_categories || []).join(', ')],
    ['Capacity Need', inq.capacity_need],
    ['Annual Volume', inq.annual_volume],
    ['Application', inq.application],
    ['Source Page', inq.source_page],
  ];
  return rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">${escapeHtml(
          k
        )}</td><td style="padding:6px 12px;border:1px solid #e5e7eb;">${escapeHtml(v || '-')}</td></tr>`
    )
    .join('');
}

function buildInternalInquiry(inq) {
  const subjectPrefix = process.env.INQUIRY_SUBJECT_PREFIX || '[Inquiry]';
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;">
      <h2 style="margin:0 0 16px;color:#0b3a82;">New B2B Inquiry</h2>
      <p style="margin:0 0 16px;">A new inquiry has been submitted from the website.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${inquiryRowsHtml(inq)}</table>
      <h3 style="margin:24px 0 8px;">Message</h3>
      <div style="white-space:pre-wrap;background:#f8fafc;padding:12px;border:1px solid #e5e7eb;border-radius:6px;">${escapeHtml(
        inq.message || ''
      )}</div>
      <p style="margin-top:24px;font-size:12px;color:#64748b;">Sent automatically by the CMS.</p>
    </div>`;
  const text = `New inquiry ${inq.reference}\nFrom: ${inq.full_name} <${inq.email}>\n\n${inq.message}`;
  return {
    subject: `${subjectPrefix} ${inq.reference} - ${inq.company || inq.full_name}`,
    html,
    text,
  };
}

function buildAutoReply(inq) {
  const siteName = process.env.SITE_NAME || 'Acme Battery';
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
      <h2 style="color:#0b3a82;margin:0 0 16px;">Thank you for your inquiry</h2>
      <p>Dear ${escapeHtml(inq.full_name)},</p>
      <p>We have received your request <strong>${escapeHtml(
        inq.reference
      )}</strong>. A member of our sales engineering team will respond within 1 business day with technical questions or a preliminary quotation.</p>
      <p>For your reference, the details we received:</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">${inquiryRowsHtml(inq)}</table>
      <p style="margin-top:24px;font-size:13px;color:#475569;">Your data is processed under our <a href="${
        process.env.PUBLIC_URL || ''
      }/privacy">Privacy Policy</a>. To exercise your GDPR rights at any time, visit our <a href="${
        process.env.PUBLIC_URL || ''
      }/gdpr">data request page</a>.</p>
      <p style="margin-top:16px;">Best regards,<br/>${escapeHtml(siteName)} Sales Team</p>
    </div>`;
  const text = `Dear ${inq.full_name},\n\nThank you for your inquiry. Reference: ${inq.reference}.\nWe will respond within 1 business day.\n\n${siteName}`;
  return {
    subject: `We received your inquiry - ${inq.reference}`,
    html,
    text,
  };
}

// ---------- Outbox writes ----------

async function enqueueMail({ kind, inquiryId, to, from, replyTo, subject, html, text }) {
  if (!to) throw new Error('mail recipient required');
  const row = await one(
    `INSERT INTO mail_outbox (kind, inquiry_id, to_addr, from_addr, reply_to, subject, body_html, body_text)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [kind, inquiryId || null, String(to), from || defaultFrom(), replyTo || '', subject || '', html || '', text || '']
  );
  return row && row.id;
}

async function enqueueInquiryEmails(inq) {
  const fromAddr = defaultFrom();
  const recipients = inquiryRecipients().join(',');
  const internal = buildInternalInquiry(inq);

  const ids = { internal: null, auto: null };
  ids.internal = await enqueueMail({
    kind: 'inquiry_internal',
    inquiryId: inq.id || null,
    to: recipients,
    from: fromAddr,
    replyTo: inq.email,
    subject: internal.subject,
    html: internal.html,
    text: internal.text,
  });

  const autoEnabled = String(process.env.AUTO_REPLY_ENABLED || 'true') === 'true';
  if (autoEnabled) {
    const auto = buildAutoReply(inq);
    ids.auto = await enqueueMail({
      kind: 'inquiry_auto',
      inquiryId: inq.id || null,
      to: inq.email,
      from: fromAddr,
      subject: auto.subject,
      html: auto.html,
      text: auto.text,
    });
  }
  return ids;
}

async function enqueueGdprConfirmation(req, link) {
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;color:#0f172a;">
      <h2 style="color:#0b3a82;">Confirm your GDPR ${escapeHtml(req.request_type)} request</h2>
      <p>We received a request to <strong>${escapeHtml(
        req.request_type
      )}</strong> data associated with this email address.</p>
      <p>Please confirm by clicking the link below within 48 hours:</p>
      <p><a href="${link}" style="background:#0b3a82;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Confirm Request</a></p>
      <p>Reference: ${escapeHtml(req.reference)}</p>
      <p style="font-size:12px;color:#64748b;">If you did not make this request, you can ignore this email.</p>
    </div>`;
  return enqueueMail({
    kind: 'gdpr_confirm',
    to: req.email,
    from: defaultFrom(),
    subject: `Confirm your GDPR request - ${req.reference}`,
    html,
    text: `Confirm your GDPR ${req.request_type} request: ${link}`,
  });
}

async function enqueueTestEmail(to) {
  return enqueueMail({
    kind: 'test',
    to,
    from: defaultFrom(),
    subject: 'CMS SMTP test email',
    html: `<p>This is a test email from the CMS. If you can read this, SMTP is configured correctly. <br/>Sent at ${new Date().toISOString()}.</p>`,
    text: `CMS SMTP test email. Sent at ${new Date().toISOString()}.`,
  });
}

// ---------- Raw send (used by mail worker) ----------

async function deliver(m) {
  const t = getTransporter();
  return t.sendMail({
    from: m.from_addr || defaultFrom(),
    to: m.to_addr,
    replyTo: m.reply_to || undefined,
    subject: m.subject,
    html: m.body_html,
    text: m.body_text,
  });
}

// ---------- Back-compat shims ----------
// Old code called sendInquiryEmails / sendGdprConfirmation directly. Route
// those through the outbox so legacy call sites keep working without
// changes.
async function sendInquiryEmails(inq) {
  return enqueueInquiryEmails(inq);
}
async function sendGdprConfirmation(req, link) {
  return enqueueGdprConfirmation(req, link);
}

module.exports = {
  getTransporter,
  enqueueInquiryEmails,
  enqueueGdprConfirmation,
  enqueueTestEmail,
  enqueueMail,
  deliver,
  // Back-compat names
  sendInquiryEmails,
  sendGdprConfirmation,
};
