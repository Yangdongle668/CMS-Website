const express = require('express');
const bcrypt = require('bcrypt');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { isEmail, trimStr, clamp, asBool } = require('../utils/validate');

const router = express.Router();

router.get('/', requireAuth, async (_req, res) => {
  const rows = await many(
    `SELECT id, email, name, role, is_active, last_login_at, created_at FROM users ORDER BY id`
  );
  res.json({ items: rows });
});

router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const email = trimStr(b.email, 190).toLowerCase();
  const password = String(b.password || '');
  if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' });
  if (password.length < 8) return res.status(400).json({ error: 'password_too_short' });
  const exists = await one('SELECT id FROM users WHERE email = $1', [email]);
  if (exists) return res.status(409).json({ error: 'email_taken' });
  const hash = await bcrypt.hash(password, 10);
  const r = await query(
    `INSERT INTO users (email, password_hash, name, role, is_active)
     VALUES ($1,$2,$3,$4,TRUE) RETURNING id`,
    [email, hash, trimStr(b.name, 120), b.role === 'editor' ? 'editor' : 'admin']
  );
  await recordAudit({ req, action: 'create', entity: 'user', entityId: r.rows[0].id, detail: { email } });
  res.json({ id: r.rows[0].id });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const b = req.body || {};
  const sets = [];
  const params = [];
  if (b.name != null) { params.push(trimStr(b.name, 120)); sets.push(`name = $${params.length}`); }
  if (b.role != null) { params.push(b.role === 'editor' ? 'editor' : 'admin'); sets.push(`role = $${params.length}`); }
  if (b.is_active != null) { params.push(asBool(b.is_active)); sets.push(`is_active = $${params.length}`); }
  if (b.password) {
    if (String(b.password).length < 8) return res.status(400).json({ error: 'password_too_short' });
    const hash = await bcrypt.hash(String(b.password), 10);
    params.push(hash); sets.push(`password_hash = $${params.length}`);
  }
  if (!sets.length) return res.json({ ok: true });
  params.push(id);
  await query(
    `UPDATE users SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length}`,
    params
  );
  await recordAudit({ req, action: 'update', entity: 'user', entityId: id });
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  if (id === req.user.id) return res.status(400).json({ error: 'cannot_delete_self' });
  await query('DELETE FROM users WHERE id = $1', [id]);
  await recordAudit({ req, action: 'delete', entity: 'user', entityId: id });
  res.json({ ok: true });
});

module.exports = router;
