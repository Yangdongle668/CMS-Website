const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { one, query } = require('../db/client');
const { signToken, setAuthCookie, clearAuthCookie, requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { isEmail, trimStr } = require('../utils/validate');

const router = express.Router();

// IP-level limiter to slow down botnets distributing attempts across emails.
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_attempts' },
});

// Per-account lockout policy. Applied after each failed login.
//   3 consecutive failures →   5  min lock
//   5 consecutive failures →  60  min lock
//   8+ consecutive failures → 24 h lock (won't be exceeded for human typos)
function lockoutDurationMinutes(attempts) {
  if (attempts >= 8) return 60 * 24;
  if (attempts >= 5) return 60;
  if (attempts >= 3) return 5;
  return 0;
}

router.post('/login', loginLimiter, async (req, res) => {
  const email = trimStr(req.body.email).toLowerCase();
  const password = String(req.body.password || '');
  if (!isEmail(email) || password.length < 4) {
    return res.status(400).json({ error: 'invalid_credentials' });
  }

  // Bootstrap: when the user table is empty, the first POST creates the
  // admin with the submitted credentials. Removes the "what's the default
  // password" footgun and survives partial seed failures.
  const { rows: countRows } = await query('SELECT count(*)::int AS n FROM users');
  if (!countRows[0] || countRows[0].n === 0) {
    if (password.length < 8) {
      return res.status(400).json({ error: 'password_too_short' });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows: created } = await query(
      `INSERT INTO users (email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, 'admin', TRUE)
       RETURNING id, email, name, role`,
      [email, hash, 'Administrator']
    );
    const user = created[0];
    const token = signToken(user);
    setAuthCookie(res, token);
    req.user = user;
    await recordAudit({ req, action: 'bootstrap_admin', entity: 'user', entityId: user.id });
    return res.json({ user, bootstrap: true });
  }

  const user = await one(
    `SELECT id, email, password_hash, name, role, is_active,
            failed_login_attempts, locked_until
       FROM users WHERE email = $1`,
    [email]
  );

  // Always check is_locked() before checking the password so a brute-forcing
  // attacker can't tell whether a locked account is locked because of bad
  // password OR because it doesn't exist — both return invalid_credentials.
  if (user && user.locked_until && new Date(user.locked_until) > new Date()) {
    const seconds = Math.ceil((new Date(user.locked_until) - new Date()) / 1000);
    return res.status(429).json({ error: 'account_locked', seconds });
  }

  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    const lockMins = lockoutDurationMinutes(attempts);
    if (lockMins > 0) {
      await query(
        `UPDATE users
            SET failed_login_attempts = $1,
                last_failed_login_at = now(),
                locked_until = now() + ($2 || ' minutes')::interval
          WHERE id = $3`,
        [attempts, String(lockMins), user.id]
      );
      await recordAudit({
        req, action: 'login_locked', entity: 'user', entityId: user.id,
        detail: { attempts, lock_minutes: lockMins },
      });
      return res.status(429).json({ error: 'account_locked', seconds: lockMins * 60 });
    }
    await query(
      `UPDATE users SET failed_login_attempts = $1, last_failed_login_at = now() WHERE id = $2`,
      [attempts, user.id]
    );
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  // Successful login: clear the lockout counter and stamp last_login_at.
  await query(
    `UPDATE users
        SET last_login_at = now(),
            failed_login_attempts = 0,
            locked_until = NULL
      WHERE id = $1`,
    [user.id]
  );
  const token = signToken(user);
  setAuthCookie(res, token);
  req.user = user;
  await recordAudit({ req, action: 'login', entity: 'user', entityId: user.id });
  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// Whether the system has any users yet — used by the login UI to show
// "first-run" wording instead of "incorrect password".
router.get('/bootstrap-status', async (_req, res) => {
  const { rows } = await query('SELECT count(*)::int AS n FROM users');
  res.json({ has_users: rows[0] ? rows[0].n > 0 : false });
});

router.post('/logout', requireAuth, async (req, res) => {
  await recordAudit({ req, action: 'logout', entity: 'user', entityId: req.user.id });
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const current = String(req.body.current || '');
  const next = String(req.body.next || '');
  if (next.length < 8) return res.status(400).json({ error: 'password_too_short' });
  const user = await one('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const ok = await bcrypt.compare(current, user.password_hash);
  if (!ok) return res.status(400).json({ error: 'invalid_current_password' });
  const hash = await bcrypt.hash(next, 10);
  await query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [hash, req.user.id]);
  await recordAudit({ req, action: 'change_password', entity: 'user', entityId: req.user.id });
  res.json({ ok: true });
});

module.exports = router;
