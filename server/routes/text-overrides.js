// Text overrides — let an admin click any text element in a preview
// iframe and replace its content without editing source files.
//
// Storage: settings.text_overrides — { [originalText]: replacementText }.
// The HTML token middleware applies these overrides in two safe ways
// (text nodes only, never inside <script> or <style>) so an operator
// can confidently rebrand "Pillar Lithium Battery" → "Polymer ..." or
// fix a typo across all pages without touching code.

const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { invalidateSettingsCache } = require('../middleware/html-tokens');

const router = express.Router();

// GET /api/text-overrides — fetch the saved map (admin only).
router.get('/', requireAuth, async (_req, res) => {
  const row = await one(`SELECT value FROM settings WHERE key = 'text_overrides'`);
  res.json({ overrides: (row && row.value) || {} });
});

// PUT /api/text-overrides — replace the entire map. Used by the iframe
// inline editor; it sends the full updated map after every edit.
router.put('/', requireAuth, async (req, res) => {
  const incoming = (req.body && req.body.overrides) || {};
  if (typeof incoming !== 'object' || Array.isArray(incoming)) {
    return res.status(400).json({ error: 'invalid_body' });
  }
  const clean = {};
  for (const [from, to] of Object.entries(incoming)) {
    const f = String(from || '').trim();
    const t = String(to == null ? '' : to);
    if (!f) continue;
    // Cap length to a sensible limit — text overrides should be for
    // titles / paragraphs, not entire articles.
    if (f.length > 5000 || t.length > 5000) continue;
    clean[f] = t;
  }
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('text_overrides', $1, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(clean)]
  );
  await recordAudit({ req, action: 'update', entity: 'settings', entityId: 'text_overrides',
    detail: { count: Object.keys(clean).length } });
  invalidateSettingsCache();
  res.json({ ok: true, count: Object.keys(clean).length });
});

// PATCH /api/text-overrides — single-key update (used by the inline
// editor for one-click saves; cheaper than re-sending the whole map).
router.patch('/', requireAuth, async (req, res) => {
  const from = String((req.body && req.body.from) || '').trim();
  const to = String((req.body && req.body.to) == null ? '' : req.body.to);
  if (!from) return res.status(400).json({ error: 'missing_from' });
  if (from.length > 5000 || to.length > 5000) return res.status(400).json({ error: 'too_long' });
  const row = await one(`SELECT value FROM settings WHERE key = 'text_overrides'`);
  const cur = (row && row.value) || {};
  if (to === '' || to === from) {
    delete cur[from];
  } else {
    cur[from] = to;
  }
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('text_overrides', $1, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(cur)]
  );
  await recordAudit({ req, action: 'update', entity: 'settings', entityId: 'text_overrides',
    detail: { key: from.slice(0, 80), removed: to === '' || to === from } });
  invalidateSettingsCache();
  res.json({ ok: true, count: Object.keys(cur).length });
});

module.exports = router;
