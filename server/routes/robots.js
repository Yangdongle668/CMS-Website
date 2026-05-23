const express = require('express');
const { one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

const router = express.Router();
const KEY = 'robots_txt';

// GET /api/robots — return current custom content (null = using default)
router.get('/', requireAuth, async (_req, res) => {
  const row = await one(`SELECT value FROM settings WHERE key = $1`, [KEY]);
  const content = (row && row.value && typeof row.value.content === 'string')
    ? row.value.content : null;
  res.json({ content, is_custom: content !== null });
});

// PUT /api/robots — save custom content
router.put('/', requireAuth, async (req, res) => {
  const content = typeof req.body.content === 'string' ? req.body.content : null;
  if (content === null) return res.status(400).json({ error: 'content_required' });
  await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [KEY, JSON.stringify({ content })]
  );
  await recordAudit({ req, action: 'update', entity: 'settings', entityId: KEY });
  res.json({ ok: true });
});

// DELETE /api/robots — revert to generated default
router.delete('/', requireAuth, async (req, res) => {
  await query(`DELETE FROM settings WHERE key = $1`, [KEY]);
  await recordAudit({ req, action: 'delete', entity: 'settings', entityId: KEY });
  res.json({ ok: true });
});

module.exports = router;
