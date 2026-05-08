const nodemailer = require('nodemailer');
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

async function sendInquiryEmails(inq, attachments) {
  const t = getTransporter();
  const subjectPrefix = process.env.INQUIRY_SUBJECT_PREFIX || '[Inquiry]';
  const fromAddr = defaultFrom();
  const recipients = inquiryRecipients();

  const internalHtml = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;">
      <h2 style="margin:0 0 16px;color:#0b3a82;">New B2B Inquiry</h2>
      <p style="margin:0 0 16px;">A new inquiry has been submitted from the website.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${inquiryRowsHtml(inq)}</table>
      <h3 style="margin:24px 0 8px;">Message</h3>
      <div style="white-space:pre-wrap;background:#f8fafc;padding:12px;border:1px solid #e5e7eb;border-radius:6px;">${escapeHtml(
        inq.message || ''
      )}</div>
      <p style="margin-top:24px;font-size:12px;color:#64748b;">Sent automatically by the CMS. Do not reply directly to the visitor's address before reviewing the request.</p>
    </div>`;

  const internal = await t.sendMail({
    from: fromAddr,
    to: recipients.join(','),
    replyTo: inq.email,
    subject: `${subjectPrefix} ${inq.reference} - ${inq.company || inq.full_name}`,
    html: internalHtml,
    text: `New inquiry ${inq.reference}\nFrom: ${inq.full_name} <${inq.email}>\n\n${inq.message}`,
    attachments: attachments || [],
  });

  let auto = null;
  const autoEnabled = String(process.env.AUTO_REPLY_ENABLED || 'true') === 'true';
  if (autoEnabled) {
    const siteName = process.env.SITE_NAME || 'Acme Battery';
    const autoHtml = `
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
    auto = await t.sendMail({
      from: fromAddr,
      to: inq.email,
      subject: `We received your inquiry - ${inq.reference}`,
      html: autoHtml,
      text: `Dear ${inq.full_name},\n\nThank you for your inquiry. Reference: ${inq.reference}.\nWe will respond within 1 business day.\n\n${siteName}`,
    });
  }

  return { internal, auto };
}

async function sendGdprConfirmation(req, link) {
  const t = getTransporter();
  const fromAddr = defaultFrom();
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
  return t.sendMail({
    from: fromAddr,
    to: req.email,
    subject: `Confirm your GDPR request - ${req.reference}`,
    html,
    text: `Confirm your GDPR ${req.request_type} request: ${link}`,
  });
}

module.exports = { getTransporter, sendInquiryEmails, sendGdprConfirmation };
