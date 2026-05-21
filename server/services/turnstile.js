const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Resolve the Turnstile secret key. Order of preference:
//   1. settings.turnstile.secret_key (admin UI — hot-reloaded via cache)
//   2. process.env.TURNSTILE_SECRET_KEY (legacy .env fallback)
// Wrapped in try/catch so a circular-require during early boot doesn't crash.
function resolveSecret() {
  try {
    const { settingsCache } = require('../middleware/html-tokens');
    const fromDb = settingsCache && settingsCache.turnstile && settingsCache.turnstile.secret_key;
    if (fromDb) return String(fromDb);
  } catch (_) {}
  return process.env.TURNSTILE_SECRET_KEY || '';
}

async function verifyTurnstile(token, ip) {
  const secret = resolveSecret();
  // Treat blank or placeholder (0x000...) secret as "Turnstile not
  // configured" and SKIP verification in every environment. Blocking real
  // visitor inquiries because the operator hasn't created Cloudflare
  // Turnstile keys yet is a worse failure mode than letting bot traffic
  // through — the honeypot field, rate-limits, dedupe and per-email
  // throttle still apply. Once the operator saves a real secret in
  // /admin/settings.html (or pastes one into .env), this branch is
  // bypassed and full verification runs.
  if (!secret || secret.startsWith('0x000')) {
    return { success: true, skipped: true };
  }
  if (!token) return { success: false, error: 'missing-token' };

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body });
    const json = await res.json();
    return { success: !!json.success, raw: json };
  } catch (err) {
    console.error('[turnstile] verification failed', err);
    return { success: false, error: 'network' };
  }
}

module.exports = { verifyTurnstile, resolveSecret };
