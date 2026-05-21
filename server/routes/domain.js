'use strict';
// Domain binding + SSL provisioning API.
//
// POST /api/domain/provision  — set domain and kick off ACME cert request
// GET  /api/domain            — current config + live cert expiry
// DELETE /api/domain          — remove domain binding

const express = require('express');
const { query, one } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

const router = express.Router();
const SETTING_KEY = 'domain_config';

async function getDomainConfig() {
  const row = await one(`SELECT value FROM settings WHERE key = $1`, [SETTING_KEY]);
  return (row && row.value) || { domain: '', status: 'none', error: '', cert_expires_at: null };
}

async function saveDomainConfig(cfg) {
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [SETTING_KEY, JSON.stringify(cfg)]
  );
}

// GET /api/domain
router.get('/', requireAuth, async (_req, res) => {
  const config = await getDomainConfig();
  if (config.status === 'active' && config.domain) {
    try {
      const acme = require('../services/acme-manager');
      const exp = acme.getCertExpiry(config.domain);
      if (exp) config.cert_expires_at = exp.toISOString();
    } catch (_) {}
  }
  res.json({ config });
});

// POST /api/domain/provision
router.post('/provision', requireAuth, async (req, res) => {
  const domain = String((req.body && req.body.domain) || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!domain) return res.status(400).json({ error: 'domain_required' });
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)) {
    return res.status(400).json({ error: 'invalid_domain_format' });
  }

  const email = String((req.body && req.body.email) || process.env.ACME_EMAIL || '');
  const staging = req.body && req.body.staging === true;

  await saveDomainConfig({ domain, status: 'provisioning', error: '', cert_expires_at: null });
  res.json({ ok: true, status: 'provisioning' });

  // Run ACME flow in background so the HTTP response returns immediately.
  const acme = require('../services/acme-manager');
  const sslServer = require('../services/ssl-server');
  sslServer.ensureHttpServer();

  acme.provisionCert(domain, { email, staging }).then(async () => {
    await saveDomainConfig({ domain, status: 'active', error: '', cert_expires_at: null });
    sslServer.reloadCert(domain);
    await recordAudit({ req, action: 'update', entity: 'settings', entityId: SETTING_KEY,
      detail: { domain, action: 'provisioned' } });
    console.log(`[domain] SSL cert provisioned for ${domain}`);
  }).catch(async (err) => {
    const msg = (err && err.message) || String(err);
    console.error(`[domain] provisioning failed for ${domain}:`, msg);
    await saveDomainConfig({ domain, status: 'error', error: msg, cert_expires_at: null });
  });
});

// DELETE /api/domain
router.delete('/', requireAuth, async (req, res) => {
  await saveDomainConfig({ domain: '', status: 'none', error: '', cert_expires_at: null });
  await recordAudit({ req, action: 'delete', entity: 'settings', entityId: SETTING_KEY });
  res.json({ ok: true });
});

module.exports = router;
module.exports.getDomainConfig = getDomainConfig;
