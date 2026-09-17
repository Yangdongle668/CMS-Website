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
const mailTemplates = require('./mail-templates');
const {
  defaultFrom,
  inquiryRecipients,
  buildInquiryInternalMail,
  buildInquiryAutoReplyMail,
  buildGdprConfirmMail,
} = mailTemplates;

let transporter = null;
let configSnapshot = null;   // last-resolved config (for /test endpoint)

// Env vars can't hold real newlines, so SMTP_TLS_CA is usually pasted
// with literal "\n". Accept both that and a genuine multi-line PEM.
function normalizePem(v) {
  if (!v) return '';
  return String(v).replace(/\\n/g, '\n').trim();
}

// Translate our config fields into nodemailer's `tls` option bag
// (passed through to tls.connect).
function tlsOptions(cfg) {
  const t = { rejectUnauthorized: cfg.tls_reject_unauthorized !== false };
  if (cfg.tls_ca) t.ca = cfg.tls_ca;
  if (cfg.tls_servername) t.servername = cfg.tls_servername;
  if (cfg.tls_min_version) t.minVersion = cfg.tls_min_version;
  return t;
}

// TLS handshake failures arrive as ESOCKET/CONN with a terse OpenSSL
// string ("certificate has expired"). Run the diagnostic probe and
// attach what it found so the caller can show the actual dates, the
// offending cert in the chain, and any clock skew.
const CERT_ERROR_RE = /certificate|CERT_|self[- ]signed|altname|unable to verify|DEPTH_ZERO|ssl|tls/i;

async function explainSmtpError(err, cfg) {
  const looksTls = !!err && (
    err.code === 'ESOCKET' ||
    err.code === 'ECONNECTION' ||
    CERT_ERROR_RE.test(String(err.message || ''))
  );
  if (!looksTls) return null;
  try {
    const { probeSmtpTls } = require('./smtp-diagnostics');
    return await probeSmtpTls(cfg, { timeoutMs: 8000 });
  } catch (_) {
    return null;
  }
}

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

    // --- TLS knobs -------------------------------------------------
    // Node validates the whole chain the server sends, including the
    // expiry of intermediates; desktop clients let the user click past
    // that. These let an operator work around a server whose chain is
    // broken without patching code.
    tls_reject_unauthorized:
                    dbCfg.tls_reject_unauthorized != null
                    ? !!dbCfg.tls_reject_unauthorized
                    : String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || 'true') !== 'false',
    // PEM of a private/self-signed CA to trust *in addition to* the
    // built-in roots. Preferred over turning verification off.
    tls_ca:         normalizePem(dbCfg.tls_ca || process.env.SMTP_TLS_CA || ''),
    // Override the SNI / hostname checked against the certificate,
    // for servers reached by IP or by a CNAME.
    tls_servername: dbCfg.tls_servername || process.env.SMTP_TLS_SERVERNAME || '',
    // Old on-premise mail servers may only speak TLSv1/1.1, which Node
    // 20 refuses by default (min is TLSv1.2).
    tls_min_version: dbCfg.tls_min_version || process.env.SMTP_TLS_MIN_VERSION || '',
  };
  configSnapshot = cfg;
  // Push the resolved config to mail-templates so that defaultFrom() /
  // inquiryRecipients() / currentAutoReplyEnabled() return the DB-saved
  // values instead of just env vars. Without this push, the admin can
  // save SMTP settings in /admin/smtp.html and the new recipients are
  // silently ignored.
  try { mailTemplates.setLiveConfig(cfg); } catch (_) {}
  return cfg;
}

// Build a fresh transporter from current config. Called lazily by
// getTransporter(); resetTransporter() invalidates the cached one so
// the next call rebuilds.
async function buildTransporter() {
  const cfg = await loadConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    // In production we must NOT pretend mails went through. The previous
    // dev-mock returned a fake "success" messageId which made the outbox
    // worker mark every row as `sent` even though nothing was delivered.
    // Throwing here forces the worker to mark the row `failed` with a
    // clear last_error, so the admin sees the problem in /admin/mail-queue
    // and the row is retried automatically once SMTP is configured.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP not configured — set host / user / pass in /admin/smtp.html');
    }
    console.warn('[mailer] SMTP not configured (host/user/pass missing). Mails will be logged only — set NODE_ENV=production to enforce real delivery.');
    return {
      _devOnly: true,
      sendMail: async (opts) => {
        console.log('[mailer:dev]', { to: opts.to, subject: opts.subject });
        return { messageId: 'dev-' + Date.now() };
      },
    };
  }
  if (cfg.tls_reject_unauthorized === false) {
    console.warn(`[mailer] TLS certificate verification is DISABLED for ${cfg.host}:${cfg.port} — the connection is encrypted but not authenticated (MITM-able). Fix the server certificate or supply a CA and turn this back on.`);
  }
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: tlsOptions(cfg),
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
  // nodemailer memoises DNS per hostname for 5 minutes and stores the
  // servername (SNI) used on first resolution alongside it. Without
  // dropping that entry, editing the host/SNI in the admin UI and
  // hitting "test" again would silently reuse the old SNI and report a
  // certificate error for settings that are actually fine.
  try { require('nodemailer/lib/shared').dnsCache.clear(); } catch (_) { /* internal API — best effort */ }
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
    tls_reject_unauthorized: c.tls_reject_unauthorized !== false,
    tls_ca: c.tls_ca || '',
    tls_servername: c.tls_servername || '',
    tls_min_version: c.tls_min_version || '',
    server_time: new Date().toISOString(),
    server_timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
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
    tls: tlsOptions(cfg),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  // Verify connection (catches bad credentials / TLS issues early).
  // On a TLS failure, re-probe the server so the admin gets the actual
  // certificate dates instead of a bare "certificate has expired".
  try {
    await t.verify();
  } catch (err) {
    err.diagnostics = await explainSmtpError(err, cfg);
    throw err;
  }
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
    const { resolveCanonicalBase } = require('../middleware/html-tokens');
    const auto = buildInquiryAutoReplyMail(inq, { publicUrl: resolveCanonicalBase(null) });
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

// Run the TLS probe against the currently-saved config (admin
// "证书诊断" button / scripts/smtp-doctor.js).
async function diagnose() {
  const cfg = await loadConfig();
  const { probeSmtpTls } = require('./smtp-diagnostics');
  const report = await probeSmtpTls(cfg, { timeoutMs: 10000 });
  report.verify_enabled = cfg.tls_reject_unauthorized !== false;
  if (report.ok && !report.authorized && !report.verify_enabled) {
    report.hints = (report.hints || []).concat(
      '当前已关闭证书校验，所以邮件仍能发出去；连接是加密的但对方身份未经验证，建议尽快修好证书后重新勾选校验。'
    );
  }
  return report;
}

module.exports = {
  getTransporter,
  resetTransporter,
  loadConfig,
  describeConfig,
  diagnose,
  explainSmtpError,
  tlsOptions,
  sendTestEmail,
  sendInquiryEmails,
  sendGdprConfirmation,
  defaultFrom,
  inquiryRecipients,
};
