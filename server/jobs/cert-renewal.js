'use strict';
// Daily certificate renewal job.
// Checks whether the active domain's cert expires within 30 days;
// if so, re-runs the ACME provisioning flow automatically.

const RENEW_DAYS_BEFORE = 30;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 h
const BOOT_DELAY_MS     = 10 * 60 * 1000;       // wait 10 min after boot

let timer = null;

async function checkAndRenew() {
  try {
    const { getDomainConfig } = require('../routes/domain');
    const { query } = require('../db/client');
    const acme = require('../services/acme-manager');
    const sslServer = require('../services/ssl-server');

    const config = await getDomainConfig();
    if (config.status !== 'active' || !config.domain) return;

    const expiry = acme.getCertExpiry(config.domain);
    if (!expiry) return;

    const daysLeft = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysLeft > RENEW_DAYS_BEFORE) return;

    console.log(`[cert-renewal] ${config.domain} expires in ${Math.floor(daysLeft)}d — renewing`);

    await query(
      `UPDATE settings SET value = jsonb_set(value, '{status}', '"renewing"'), updated_at = now()
       WHERE key = 'domain_config'`
    );

    sslServer.ensureHttpServer();
    await acme.provisionCert(config.domain, { email: process.env.ACME_EMAIL || '' });
    sslServer.reloadCert(config.domain);

    await query(
      `UPDATE settings
       SET value = value || '{"status":"active","error":""}'::jsonb, updated_at = now()
       WHERE key = 'domain_config'`
    );
    console.log(`[cert-renewal] cert renewed for ${config.domain}`);
  } catch (err) {
    console.error('[cert-renewal] error:', err && err.message);
  }
}

function start() {
  if (timer) return;
  // Delay the first check so the DB is fully settled at boot time.
  setTimeout(() => {
    checkAndRenew();
    timer = setInterval(checkAndRenew, CHECK_INTERVAL_MS);
    timer.unref?.();
  }, BOOT_DELAY_MS);
  console.log('[cert-renewal] job scheduled (daily, first check in 10 min)');
}

function stop() {
  if (timer) { clearInterval(timer); timer = null; }
}

module.exports = { start, stop };
