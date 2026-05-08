const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || secret.startsWith('0x000')) {
    // Dev-friendly fallback: if secret not configured, don't block
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[turnstile] secret not configured, skipping verification');
      return { success: true, skipped: true };
    }
    return { success: false, error: 'turnstile-not-configured' };
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
