// =====================================================================
// Mail body builders — pure functions, no SMTP, no DB.
//
// These produce { to, replyTo, subject, html, text, attachments } shapes
// suitable for passing straight into the outbox. Splitting them out of
// mailer.js lets the inquiry route enqueue without ever loading
// nodemailer or risking a slow SMTP handshake in the hot path.
// =====================================================================
const { escapeHtml } = require('../utils/validate');

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

// Internal alert to the sales team. Subject is prefixed with [HOT] when
// the lead score is high so the inbox triages itself.
function buildInquiryInternalMail(inq, opts) {
  opts = opts || {};
  const subjectPrefix = process.env.INQUIRY_SUBJECT_PREFIX || '[Inquiry]';
  const hot = (inq.score || 0) >= 60 ? '[HOT] ' : '';
  const attachments = Array.isArray(opts.attachments) ? opts.attachments : [];
  // Show the visitor-uploaded files inline in the body so sales sees
  // them at a glance even if their mail client hides the attachment
  // tray. Each row links to the original visitor filename + (KB) size.
  const attachmentsList = (inq.attachments || []).filter((a) => a && a.url);
  const attachmentsBlock = attachmentsList.length ? `
    <h3 style="margin:24px 0 8px;">📎 Attached files</h3>
    <ul style="margin:0; padding-left:18px; font-size:13.5px; line-height:1.7;">
      ${attachmentsList.map((a) => {
        const name = escapeHtml(a.original_name || a.filename || 'file');
        const sizeKb = a.size ? Math.round(a.size / 1024) + ' KB' : '';
        return `<li>${name} ${sizeKb ? '<span style="color:#64748b;">· ' + sizeKb + '</span>' : ''}</li>`;
      }).join('')}
    </ul>
    <p style="margin-top:8px; font-size:12px; color:#64748b;">附件已经附加在邮件里，也可以从 admin 后台询盘详情页下载。</p>` : '';

  const internalHtml = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;">
      <h2 style="margin:0 0 16px;color:#0b3a82;">${hot ? '🔥 ' : ''}New B2B Inquiry</h2>
      <p style="margin:0 0 16px;">A new inquiry has been submitted from the website.</p>
      ${hot ? `<p style="margin:0 0 16px;background:#fef3c7;border:1px solid #f59e0b;padding:10px 14px;border-radius:6px;"><strong>Lead score: ${inq.score}</strong> — high-priority lead, respond ASAP.</p>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${inquiryRowsHtml(inq)}</table>
      <h3 style="margin:24px 0 8px;">Message</h3>
      <div style="white-space:pre-wrap;background:#f8fafc;padding:12px;border:1px solid #e5e7eb;border-radius:6px;">${escapeHtml(
        inq.message || ''
      )}</div>
      ${attachmentsBlock}
      <p style="margin-top:24px;font-size:12px;color:#64748b;">Sent automatically by the CMS. Do not reply directly to the visitor's address before reviewing the request.</p>
    </div>`;

  return {
    to: inquiryRecipients().join(','),
    replyTo: inq.email,
    subject: `${hot}${subjectPrefix} ${inq.reference} - ${inq.company || inq.full_name}${attachments.length ? ' (' + attachments.length + ' files)' : ''}`,
    html: internalHtml,
    text: `New inquiry ${inq.reference}\nFrom: ${inq.full_name} <${inq.email}>\nScore: ${inq.score || 0}\n${attachments.length ? 'Attached files: ' + attachments.length + '\n' : ''}\n${inq.message}`,
    attachments,
  };
}

// Auto-reply confirmation to the visitor.
function buildInquiryAutoReplyMail(inq) {
  const siteName = process.env.SITE_NAME || 'Zufek';
  const publicUrl = process.env.PUBLIC_URL || '';
  const autoHtml = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
      <h2 style="color:#0b3a82;margin:0 0 16px;">Thank you for your inquiry</h2>
      <p>Dear ${escapeHtml(inq.full_name)},</p>
      <p>We have received your request <strong>${escapeHtml(
        inq.reference
      )}</strong>. A member of our sales engineering team will respond within 1 business day with technical questions or a preliminary quotation.</p>
      <p>For your reference, the details we received:</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">${inquiryRowsHtml(inq)}</table>
      <p style="margin-top:24px;font-size:13px;color:#475569;">Your data is processed under our <a href="${publicUrl}/privacy">Privacy Policy</a>. To exercise your GDPR rights at any time, visit our <a href="${publicUrl}/gdpr">data request page</a>.</p>
      <p style="margin-top:16px;">Best regards,<br/>${escapeHtml(siteName)} Sales Team</p>
    </div>`;
  return {
    to: inq.email,
    replyTo: '',
    subject: `We received your inquiry - ${inq.reference}`,
    html: autoHtml,
    text: `Dear ${inq.full_name},\n\nThank you for your inquiry. Reference: ${inq.reference}.\nWe will respond within 1 business day.\n\n${siteName}`,
    attachments: [],
  };
}

function buildGdprConfirmMail(req, link) {
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
  return {
    to: req.email,
    replyTo: '',
    subject: `Confirm your GDPR request - ${req.reference}`,
    html,
    text: `Confirm your GDPR ${req.request_type} request: ${link}`,
    attachments: [],
  };
}

function buildHealthAlertMail(reasons) {
  const items = reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('');
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;color:#0f172a;">
      <h2 style="color:#b91c1c;margin:0 0 12px;">⚠ CMS health alert</h2>
      <p>One or more background checks tripped on the CMS. Please review:</p>
      <ul>${items}</ul>
      <p style="font-size:12px;color:#64748b;margin-top:16px;">Sent automatically by the CMS health monitor. This alert is rate-limited (one per reason per 30 min).</p>
    </div>`;
  return {
    to: inquiryRecipients().join(','),
    replyTo: '',
    subject: `[CMS ALERT] ${reasons[0]}`,
    html,
    text: 'CMS health alert:\n\n' + reasons.map((r) => '- ' + r).join('\n'),
    attachments: [],
  };
}

module.exports = {
  defaultFrom,
  inquiryRecipients,
  buildInquiryInternalMail,
  buildInquiryAutoReplyMail,
  buildGdprConfirmMail,
  buildHealthAlertMail,
};
