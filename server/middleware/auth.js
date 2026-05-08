const jwt = require('jsonwebtoken');
const { one } = require('../db/client');

const COOKIE_NAME = 'cms_session';

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
}

function setAuthCookie(res, token) {
  // Cookie is "Secure" only when the deployment is actually HTTPS.
  // Setting Secure on a plain-HTTP origin causes browsers to silently
  // drop the cookie, which looks like "login button does nothing".
  const useSecure = String(process.env.FORCE_HTTPS || 'false') === 'true';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: useSecure,
    maxAge: 1000 * 60 * 60 * 12,
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

async function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await one(
      'SELECT id, email, name, role, is_active FROM users WHERE id = $1',
      [payload.sub]
    );
    if (!user || !user.is_active) return res.status(401).json({ error: 'unauthorized' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

module.exports = { signToken, setAuthCookie, clearAuthCookie, requireAuth, COOKIE_NAME };
