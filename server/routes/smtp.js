// =====================================================================
// SMTP admin routes — let operators configure SMTP via the dashboard
// without touching .env / restarting docker. Settings live in
// settings.smtp (JSONB) and override env vars on read.
// =====================================================================
const express = require('express');
const { one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { trimStr, asBool, clamp } = require('../utils/validate');
const mailer = require('../services/mailer');

const router = express.Router();

// GET current settings (mask password)
router.get('/', requireAuth, async (_req, res) => {
  const desc = await mailer.describeConfig();
  res.json({ config: desc });
});

// Save settings into the settings table (UPSERT) + reset cached transporter
router.put('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  // Build the storage object. Empty string passwords are treated as
  // "keep existing" to prevent the admin from accidentally wiping a
  // good password on a routine save where they didn't re-enter it.
  const existing = await one(`SELECT value FROM settings WHERE key = 'smtp'`);
  const prev = (existing && existing.value && typeof existing.value === 'object') ? existing.value : {};

  const value = {
    host: trimStr(b.host, 190),
    port: clamp(b.port, 1, 65535, 465),
    secure: asBool(b.secure),
    user: trimStr(b.user, 190),
    pass: (b.pass && String(b.pass).trim() && b.pass !== '****') ? String(b.pass) : (prev.pass || ''),
    from: trimStr(b.from, 200),
    recipients: Array.isArray(b.recipients)
      ? b.recipients.map((s) => trimStr(s, 200)).filter(Boolean)
      : (typeof b.recipients === 'string'
          ? b.recipients.split(',').map((s) => trimStr(s, 200)).filter(Boolean)
          : []),
    auto_reply: asBool(b.auto_reply),
  };

  await query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('smtp', $1::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(value)]
  );

  // Force the cached transporter to rebuild on next sendMail
  mailer.resetTransporter();
  // And refresh the snapshot immediately
  await mailer.loadConfig();

  await recordAudit({
    req, action: 'update', entity: 'settings', entityId: null,
    detail: { key: 'smtp', host: value.host, from: value.from },
  });

  const desc = await mailer.describeConfig();
  res.json({ ok: true, config: desc });
});

// Send a one-off test email — uses the CURRENT settings.smtp values
// (whatever is in the DB right now, after the most recent save).
router.post('/test', requireAuth, async (req, res) => {
  const to = trimStr(req.body && req.body.to, 200);
  if (!to || !/.+@.+\..+/.test(to)) {
    return res.status(400).json({ error: 'invalid_to' });
  }
  try {
    const result = await mailer.sendTestEmail(to, trimStr(req.body && req.body.from, 200) || undefined);
    res.json({ ok: true, result });
  } catch (err) {
    // Surface the SMTP error verbatim so admins can debug (e.g.
    // "Invalid login", "ETIMEDOUT", "self signed certificate", etc.)
    res.status(502).json({
      error: 'smtp_failed',
      detail: (err && err.message) || 'unknown SMTP error',
      code: err && err.code,
      command: err && err.command,
    });
  }
});

module.exports = router;
