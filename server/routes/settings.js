const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { trimStr, asJson } = require('../utils/validate');
const { invalidateSettingsCache } = require('../middleware/html-tokens');
const aiSettings = require('../services/ai-settings');

const router = express.Router();

const PUBLIC_KEYS = new Set(['site', 'social', 'seo', 'gdpr', 'navigation', 'organization']);
// Settings entries that contain secrets. Their values are masked when
// returned to the admin browser (last 4 chars only) and preserved in
// place when the admin re-submits them with the mask still attached.
const SECRET_KEYS = new Set(['ai_providers']);

router.get('/public', async (_req, res) => {
  const rows = await many(`SELECT key, value FROM settings WHERE key = ANY($1::text[])`, [
    Array.from(PUBLIC_KEYS),
  ]);
  const out = {};
  for (const r of rows) out[r.key] = r.value;

  // Auto-expand navigation children from live DB tables. The
  // settings.navigation JSON acts as the SKELETON; nodes whose
  // `nav` key matches a known content collection get their
  // children replaced with the current published rows. This means
  // adding a new application or pillar in the admin shows up in
  // the header dropdown / footer columns automatically — no JSON
  // editing required.
  if (out.navigation && Array.isArray(out.navigation.header)) {
    try {
      const [apps, pillars] = await Promise.all([
        many(
          `SELECT slug, name FROM applications WHERE status='published' ORDER BY sort_order, id`
        ),
        many(
          `SELECT slug, name FROM pillar_pages WHERE status='published' ORDER BY sort_order, id`
        ),
      ]);
      const appChildren = apps.map((a) => ({
        label: a.name,
        url: `/applications/${a.slug}.html`,
      }));
      const pillarChildren = pillars.map((p) => ({
        label: p.name,
        url: `/products/${p.slug}`,
      }));
      out.navigation = {
        ...out.navigation,
        header: out.navigation.header.map((item) => {
          if (item.nav === 'applications' && appChildren.length) {
            return { ...item, children: appChildren };
          }
          if (item.nav === 'products' && pillarChildren.length) {
            return { ...item, children: pillarChildren };
          }
          return item;
        }),
      };
    } catch (_e) {
      // If the auto-expand fails (e.g. tables not yet migrated),
      // fall back to the static skeleton already in `out.navigation`.
    }
  }

  res.json({ settings: out });
});

router.get('/', requireAuth, async (_req, res) => {
  const rows = await many(`SELECT key, value, updated_at FROM settings ORDER BY key`);
  const out = {};
  for (const r of rows) {
    // Always merge the env-fallback view for ai_providers so the admin
    // sees an editable form even before the row exists in DB. Mask any
    // populated secret values to last-4-chars only.
    if (r.key === 'ai_providers') {
      const merged = aiSettings.snapshot();
      out[r.key] = aiSettings.applyMask(merged);
    } else if (SECRET_KEYS.has(r.key)) {
      out[r.key] = aiSettings.applyMask(r.value || {});
    } else {
      out[r.key] = r.value;
    }
  }
  // If ai_providers row hasn't been written yet, still return the env-only
  // snapshot so the form renders.
  if (!out.ai_providers) {
    out.ai_providers = aiSettings.applyMask(aiSettings.snapshot());
  }
  res.json({ settings: out });
});

router.put('/:key', requireAuth, async (req, res) => {
  const key = trimStr(req.params.key, 120);
  if (!key) return res.status(400).json({ error: 'invalid_key' });
  let value = asJson(req.body.value, req.body);
  // For secret-bearing settings, swap any field that's still holding the
  // mask placeholder ("••••XXXX") back to the existing DB value. Without
  // this, hitting "Save" on the settings page after only changing one
  // field would wipe every other API key.
  if (key === 'ai_providers') {
    value = await aiSettings.preserveMaskedKeys(value);
  }
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
  // Hot-reload the AI snapshot so the next /api/ai-generate/* request
  // picks up the new keys / models without a server restart.
  if (key === 'ai_providers') {
    try { await aiSettings.reload(); }
    catch (err) { console.error('[ai-settings] reload failed:', err.message); }
  }
  res.json({ ok: true });
});

module.exports = router;
