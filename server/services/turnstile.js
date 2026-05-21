const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Treat blank or placeholder (0x000...) secret as "Turnstile not
  // configured" and SKIP verification in every environment. Blocking real
  // visitor inquiries because the operator hasn't created Cloudflare
  // Turnstile keys yet is a worse failure mode than letting bot traffic
  // through — the honeypot field, rate-limits, dedupe and per-email
  // throttle still apply. Once the operator pastes a real secret into
  // .env, this branch is bypassed and full verification runs.
  if (!secret || secret.startsWith('0x000')) {
    if (!global.__turnstileWarned) {
      console.warn('[turnstile] TURNSTILE_SECRET_KEY not configured — anti-bot verification disabled');
      global.__turnstileWarned = true;
    }
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

module.exports = { verifyTurnstile };
