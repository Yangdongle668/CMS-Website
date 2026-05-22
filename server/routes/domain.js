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

// GET /api/domain/diagnostics — surface enough info that an operator
// can self-diagnose a "404 from Let's Encrypt" without command-line tools.
// Returns:
//   * the server's own public IPv4 / IPv6 (so the operator can compare
//     to the DNS records they set);
//   * the A / AAAA records currently resolving for the bound domain
//     (queried via Google's DNS-over-HTTPS so we see the same view a
//     public validator would, not the container's internal resolver);
//   * a list of human-readable mismatch warnings.
router.get('/diagnostics', requireAuth, async (req, res) => {
  const domain = String(req.query.domain || '').trim().toLowerCase() ||
                 (await getDomainConfig()).domain;

  async function fetchTimeout(url, opts) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    try { return await fetch(url, { ...(opts || {}), signal: ctrl.signal }); }
    finally { clearTimeout(t); }
  }

  async function publicIp(host) {
    try {
      const r = await fetchTimeout('https://' + host);
      const txt = (await r.text()).trim();
      return /^[\da-f:.]+$/i.test(txt) ? txt : '';
    } catch (_) { return ''; }
  }

  async function dohLookup(name, type) {
    // type 1=A, 28=AAAA. Google DoH returns { Answer: [{ type, data }] }.
    if (!name) return [];
    try {
      const r = await fetchTimeout(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`);
      const j = await r.json();
      return (j.Answer || []).filter((a) => a.type === type).map((a) => a.data);
    } catch (_) { return []; }
  }

  const [ipv4, ipv6, aRoot, aaaaRoot, aWww, aaaaWww] = await Promise.all([
    publicIp('api.ipify.org'),
    publicIp('api6.ipify.org'),
    dohLookup(domain, 1),
    dohLookup(domain, 28),
    dohLookup(domain ? 'www.' + domain : '', 1),
    dohLookup(domain ? 'www.' + domain : '', 28),
  ]);

  const warnings = [];
  if (domain) {
    if (!aRoot.length && !aaaaRoot.length) {
      warnings.push(`${domain} 还没有任何 A / AAAA 记录 — DNS 还没生效或者填错了。`);
    }
    if (ipv4 && aRoot.length && !aRoot.includes(ipv4)) {
      warnings.push(`${domain} 的 A 记录 (${aRoot.join(', ')}) 不指向本服务器的 IPv4 (${ipv4})。`);
    }
    if (aaaaRoot.length && (!ipv6 || !aaaaRoot.includes(ipv6))) {
      warnings.push(
        `${domain} 配了 AAAA 记录 (${aaaaRoot.join(', ')})，但${ipv6 ? '不指向本服务器的 IPv6 ' + ipv6 : '本服务器没有公网 IPv6'}。` +
        ` Let's Encrypt 会优先用 IPv6 且不回退到 IPv4，所以验证会被路由到错误的服务器并返回 404。` +
        ` 解决：在 DNS 控制台 删除 ${domain} 和 www.${domain} 的所有 AAAA 记录（如果你的服务器没有 IPv6），或者把 AAAA 改成正确的 IPv6。`
      );
    }
    if (!aWww.length && !aaaaWww.length) {
      warnings.push(`www.${domain} 没有 A / AAAA 记录 — 证书申请要求 www 子域名也能解析。`);
    }
  }

  res.json({
    domain,
    server: { ipv4, ipv6 },
    dns: {
      root: { A: aRoot, AAAA: aaaaRoot },
      www:  { A: aWww, AAAA: aaaaWww },
    },
    warnings,
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
