// =====================================================================
// SMTP transport. Templates live in ./mail-templates.js — this module
// is responsible only for creating the nodemailer transporter and
// emitting messages over the wire.
//
// Config resolution (priority order):
//   1. settings table row { key: 'smtp', value: {...} } — admin-editable
//   2. process.env.SMTP_HOST / SMTP_PORT / ...                fallback
//
// When the admin saves settings.smtp the route should call
// `resetTransporter()` so the next sendMail uses the new config without
// requiring a restart.
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
let configSnapshot = null;   // last-resolved config (for /test endpoint)

// Read SMTP config from DB (settings.smtp) first; env vars are
// fallback. Synchronous-friendly: caller can `await loadConfig()` once
// at boot and again whenever settings.smtp is PUT.
async function loadConfig() {
  let dbCfg = {};
  try {
    const { one } = require('../db/client');
    const row = await one(`SELECT value FROM settings WHERE key = 'smtp'`);
    if (row && row.value && typeof row.value === 'object') dbCfg = row.value;
  } catch (_) { /* DB not ready / table missing — env fallback */ }

  const cfg = {
    host:           dbCfg.host || process.env.SMTP_HOST || '',
    port:           parseInt(dbCfg.port || process.env.SMTP_PORT || '465', 10),
    secure:         dbCfg.secure != null
                    ? !!dbCfg.secure
                    : (String(process.env.SMTP_SECURE || 'true') === 'true'),
    user:           dbCfg.user || process.env.SMTP_USER || '',
    pass:           dbCfg.pass || process.env.SMTP_PASS || '',
    from:           dbCfg.from || process.env.MAIL_FROM || process.env.SMTP_USER || '',
    recipients:     dbCfg.recipients ||
                    (process.env.INQUIRY_RECIPIENTS || '').split(',').map((s) => s.trim()).filter(Boolean),
    auto_reply:     dbCfg.auto_reply != null
                    ? !!dbCfg.auto_reply
                    : String(process.env.AUTO_REPLY_ENABLED || 'true') === 'true',
  };
  configSnapshot = cfg;
  return cfg;
}

// Build a fresh transporter from current config. Called lazily by
// getTransporter(); resetTransporter() invalidates the cached one so
// the next call rebuilds.
async function buildTransporter() {
  const cfg = await loadConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    console.warn('[mailer] SMTP not configured (host/user/pass missing). Mails will be logged only.');
    return {
      _devOnly: true,
      sendMail: async (opts) => {
        console.log('[mailer:dev]', { to: opts.to, subject: opts.subject });
        return { messageId: 'dev-' + Date.now() };
      },
    };
  }
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

async function getTransporter() {
  if (transporter) return transporter;
  transporter = await buildTransporter();
  return transporter;
}

// Force the next getTransporter() to rebuild from current config.
// Called when admin saves settings.smtp.
function resetTransporter() {
  transporter = null;
  configSnapshot = null;
}

// Inspect last-loaded config (for admin "current config" panel).
// Sensitive fields (pass) are masked.
async function describeConfig() {
  if (!configSnapshot) await loadConfig();
  const c = configSnapshot || {};
  return {
    host: c.host,
    port: c.port,
    secure: c.secure,
    user: c.user,
    pass_set: !!c.pass,
    pass_preview: c.pass ? c.pass.slice(0, 2) + '****' + c.pass.slice(-2) : '',
    from: c.from,
    recipients: c.recipients,
    auto_reply: c.auto_reply,
    source: {
      host: process.env.SMTP_HOST ? 'env+db' : (c.host ? 'db' : 'unset'),
      user: process.env.SMTP_USER ? 'env+db' : (c.user ? 'db' : 'unset'),
    },
  };
}

// Send a one-off test email to verify SMTP works from the admin UI.
// Bypasses the outbox so the result is immediate (success / detailed error).
async function sendTestEmail(toAddr, fromOverride) {
  const cfg = await loadConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    throw new Error('SMTP 配置不完整：host / user / pass 必须都填');
  }
  // Build a fresh one-shot transporter rather than reusing the cached
  // one — useful when admin just changed config and wants to test BEFORE
  // committing to making it the live transporter.
  const t = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  // Verify connection (catches bad credentials / TLS issues early)
  await t.verify();
  // Send the test
  const info = await t.sendMail({
    from: fromOverride || cfg.from || cfg.user,
    to: toAddr,
    subject: '[Test] CMS SMTP 配置测试',
    text: '这是一封来自 CMS 后台的测试邮件。如果你收到这封邮件，说明 SMTP 配置正确。\n\n时间：' + new Date().toISOString(),
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;color:#0f172a;">
        <h2 style="color:#1e40af;">✓ SMTP 测试成功</h2>
        <p>这是一封来自 CMS 后台 SMTP 设置页的测试邮件。如果你看到了这封信，说明：</p>
        <ul>
          <li>SMTP 服务器地址、端口、加密方式都正确</li>
          <li>用户名 / 密码鉴权通过</li>
          <li>From 地址被 SMTP 服务器接受</li>
        </ul>
        <p style="color:#64748b; font-size:12.5px; margin-top:20px;">
          时间：${new Date().toLocaleString()}<br>
          From：<code>${fromOverride || cfg.from || cfg.user}</code><br>
          To：<code>${toAddr}</code>
        </p>
      </div>
    `,
  });
  return { messageId: info.messageId, accepted: info.accepted, response: info.response };
}

// --- Backward-compatible direct senders ---

async function sendInquiryEmails(inq, attachments) {
  const t = await getTransporter();
  const cfg = configSnapshot || await loadConfig();
  const internal = buildInquiryInternalMail(inq, { attachments });
  const internalRes = await t.sendMail({ from: cfg.from || defaultFrom(), ...internal });

  let autoRes = null;
  if (cfg.auto_reply) {
    const auto = buildInquiryAutoReplyMail(inq);
    autoRes = await t.sendMail({ from: cfg.from || defaultFrom(), ...auto });
  }
  return { internal: internalRes, auto: autoRes };
}

async function sendGdprConfirmation(req, link) {
  const t = await getTransporter();
  const cfg = configSnapshot || await loadConfig();
  const msg = buildGdprConfirmMail(req, link);
  return t.sendMail({ from: cfg.from || defaultFrom(), ...msg });
}

module.exports = {
  getTransporter,
  resetTransporter,
  loadConfig,
  describeConfig,
  sendTestEmail,
  sendInquiryEmails,
  sendGdprConfirmation,
  defaultFrom,
  inquiryRecipients,
};
