const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { trimStr, asJson } = require('../utils/validate');
const { invalidateSettingsCache } = require('../middleware/html-tokens');
const { invalidateExcludedIps } = require('../middleware/analytics');
const aiSettings = require('../services/ai-settings');
const seoIntegrations = require('../services/seo-integrations');
const publicSettings = require('../services/public-settings');
const { loadPublicSettings } = publicSettings;

const router = express.Router();

// Settings entries that contain secrets. Their values are masked when
// returned to the admin browser (last 4 chars only) and preserved in
// place when the admin re-submits them with the mask still attached.
const SECRET_KEYS = new Set(['ai_providers', 'seo_integrations']);

router.get('/public', async (_req, res) => {
  // Shared with the server-side chrome renderer so the nav the browser
  // fetches and the nav baked into the HTML cannot disagree.
  res.json({ settings: await loadPublicSettings() });
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
    } else if (r.key === 'turnstile') {
      const v = r.value || {};
      out[r.key] = {
        site_key: v.site_key || '',
        secret_key: v.secret_key ? aiSettings.maskKey(v.secret_key) : '',
      };
    } else if (r.key === 'seo_integrations') {
      out[r.key] = seoIntegrations.applyMask(r.value || {});
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
  // Same for turnstile — return env-fallback view so the form renders
  // before the operator has saved anything.
  if (!out.turnstile) {
    out.turnstile = {
      site_key: process.env.TURNSTILE_SITE_KEY && !process.env.TURNSTILE_SITE_KEY.startsWith('0x000')
        ? process.env.TURNSTILE_SITE_KEY : '',
      secret_key: process.env.TURNSTILE_SECRET_KEY && !process.env.TURNSTILE_SECRET_KEY.startsWith('0x000')
        ? aiSettings.maskKey(process.env.TURNSTILE_SECRET_KEY) : '',
    };
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
  if (key === 'seo_integrations') {
    try {
      value = await seoIntegrations.preserveMaskedKeys(value);
    } catch (err) {
      return res.status(400).json({ error: err.message || 'invalid_payload' });
    }
  }
  // Turnstile: if the operator left secret_key showing the mask ("••••XXXX"),
  // keep the existing DB value instead of overwriting it with the placeholder.
  if (key === 'turnstile' && value && aiSettings.isMasked(value.secret_key)) {
    const cur = await one(`SELECT value FROM settings WHERE key = 'turnstile'`);
    value.secret_key = (cur && cur.value && cur.value.secret_key) || '';
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
  // Same for the public bundle behind /api/settings/public and the
  // server-rendered nav, or an operator's nav edit would not show in
  // the HTML until the TTL lapsed.
  publicSettings.invalidate();
  // Hot-reload the AI snapshot so the next /api/ai-generate/* request
  // picks up the new keys / models without a server restart.
  if (key === 'ai_providers') {
    try { await aiSettings.reload(); }
    catch (err) { console.error('[ai-settings] reload failed:', err.message); }
  }
  // Refresh the analytics IP-exclusion list immediately so the admin
  // doesn't have to wait for the 30s poll.
  if (key === 'analytics') {
    try { await invalidateExcludedIps(); }
    catch (err) { console.error('[analytics] reload excluded IPs failed:', err.message); }
  }
  res.json({ ok: true });
});

module.exports = router;
