// =====================================================================
// Admin mail queue routes — visibility + manual control over the
// transactional mail outbox. The worker (services/mail-outbox.js)
// handles automatic delivery; this surface lets a human:
//
//   - list pending / failed / dead / sent messages
//   - inspect the full HTML of any queued message
//   - retry a dead / failed message immediately
//   - cancel a stuck message (mark as 'dead' without sending)
// =====================================================================
const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { clamp, trimStr } = require('../utils/validate');
const cache = require('../services/cache');

const router = express.Router();

router.get('/stats', requireAuth, async (_req, res) => {
  const counts = await one(
    `SELECT
       count(*) FILTER (WHERE status='pending')::int AS pending,
       count(*) FILTER (WHERE status='failed')::int AS failed,
       count(*) FILTER (WHERE status='dead')::int AS dead,
       count(*) FILTER (WHERE status='sending')::int AS sending,
       count(*) FILTER (WHERE status='sent' AND sent_at > now() - interval '24 hours')::int AS sent_24h
     FROM mail_outbox`
  );
  const overdue = await one(
    `SELECT count(*)::int AS n FROM mail_outbox
     WHERE status IN ('pending','failed')
       AND created_at < now() - interval '10 minutes'`
  );
  res.json({
    pending: counts.pending || 0,
    failed: counts.failed || 0,
    dead: counts.dead || 0,
    sending: counts.sending || 0,
    sent_24h: counts.sent_24h || 0,
    overdue: overdue.n || 0,
    cache: cache.getStats(),
  });
});

router.get('/', requireAuth, async (req, res) => {
  const limit = clamp(req.query.limit, 1, 200, 50);
  const offset = clamp(req.query.offset, 0, 1e6, 0);
  const status = trimStr(req.query.status, 20);
  const params = [];
  const where = [];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  params.push(limit);
  params.push(offset);
  const rows = await many(
    `SELECT id, kind, related_type, related_id, to_addr, subject, status,
            attempts, max_attempts, next_attempt_at, last_error, sent_at, created_at
     FROM mail_outbox ${whereSql}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json({ items: rows, limit, offset });
});

router.get('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const row = await one('SELECT * FROM mail_outbox WHERE id = $1', [id]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ mail: row });
});

router.post('/:id/retry', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  // Reset to pending with immediate due time and bumped max_attempts
  // so a manual retry never instantly re-dies on the same threshold.
  const r = await query(
    `UPDATE mail_outbox
     SET status='pending',
         next_attempt_at=now(),
         last_error='',
         locked_by='', locked_at=NULL,
         max_attempts = GREATEST(max_attempts, attempts + 3)
     WHERE id=$1 AND status IN ('failed','dead','sending')
     RETURNING id, kind`,
    [id]
  );
  if (!r.rows.length) return res.status(409).json({ error: 'not_retryable' });
  await recordAudit({ req, action: 'retry', entity: 'mail_outbox', entityId: id });
  res.json({ ok: true });
});

router.post('/:id/cancel', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const r = await query(
    `UPDATE mail_outbox
     SET status='dead', locked_by='', locked_at=NULL,
         last_error = COALESCE(NULLIF(last_error, ''), 'cancelled by admin')
     WHERE id=$1 AND status IN ('pending','failed','sending')
     RETURNING id`,
    [id]
  );
  if (!r.rows.length) return res.status(409).json({ error: 'not_cancellable' });
  await recordAudit({ req, action: 'cancel', entity: 'mail_outbox', entityId: id });
  res.json({ ok: true });
});

router.post('/retry-all-dead', requireAuth, async (req, res) => {
  const r = await query(
    `UPDATE mail_outbox
     SET status='pending', next_attempt_at=now(), last_error='',
         locked_by='', locked_at=NULL,
         max_attempts = attempts + 3
     WHERE status='dead'
     RETURNING id`
  );
  await recordAudit({
    req,
    action: 'retry_all_dead',
    entity: 'mail_outbox',
    detail: { count: r.rowCount },
  });
  res.json({ ok: true, count: r.rowCount });
});

module.exports = router;
