const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { trimStr, asJson } = require('../utils/validate');
const { invalidateSettingsCache } = require('../middleware/html-tokens');

const router = express.Router();

const PUBLIC_KEYS = new Set(['site', 'social', 'seo', 'gdpr', 'navigation', 'organization']);

router.get('/public', async (_req, res) => {
  const rows = await many(`SELECT key, value FROM settings WHERE key = ANY($1::text[])`, [
    Array.from(PUBLIC_KEYS),
  ]);
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  res.json({ settings: out });
});

router.get('/', requireAuth, async (_req, res) => {
  const rows = await many(`SELECT key, value, updated_at FROM settings ORDER BY key`);
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  res.json({ settings: out });
});

router.put('/:key', requireAuth, async (req, res) => {
  const key = trimStr(req.params.key, 120);
  if (!key) return res.status(400).json({ error: 'invalid_key' });
  const value = asJson(req.body.value, req.body);
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, value]
  );
  await recordAudit({ req, action: 'update', entity: 'settings', entityId: key });
  // Refresh the in-memory cache used by the HTML token middleware so the
  // edit is reflected on the very next page load (no need to wait for the
  // 30s polling interval).
  invalidateSettingsCache();
  res.json({ ok: true });
});

module.exports = router;
