const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { isEmail, trimStr, clamp } = require('../utils/validate');
const { enqueueTestEmail } = require('../services/mailer');
const mailWorker = require('../jobs/mail-worker');

const router = express.Router();

// Aggregate stats for the admin dashboard banner.
router.get('/stats', requireAuth, async (_req, res) => {
  const stats = await one(
    `SELECT
       count(*) FILTER (WHERE status = 'pending')::int AS pending,
       count(*) FILTER (WHERE status = 'sending')::int AS sending,
       count(*) FILTER (WHERE status = 'sent'
                            AND sent_at > now() - interval '24 hours')::int AS sent_24h,
       count(*) FILTER (WHERE status = 'dead')::int    AS dead,
       count(*) FILTER (WHERE status = 'pending'
                            AND attempts > 0)::int     AS retrying,
       max(created_at)                                  AS last_enqueued_at,
       max(sent_at)                                     AS last_sent_at,
       max(updated_at) FILTER (WHERE status = 'dead')   AS last_dead_at
     FROM mail_outbox`
  );
  res.json({ stats });
});

// Paginated list — newest first. Filter by status optionally.
router.get('/', requireAuth, async (req, res) => {
  const limit = clamp(req.query.limit, 1, 200, 50);
  const offset = clamp(req.query.offset, 0, 1e6, 0);
  const status = trimStr(req.query.status, 20);
  const params = [];
  const where = [];
  if (status && ['pending', 'sending', 'sent', 'dead'].includes(status)) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  params.push(limit);
  params.push(offset);
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await many(
    `SELECT id, kind, inquiry_id, to_addr, subject, status, attempts, max_attempts,
            next_attempt_at, last_error, sent_at, created_at, updated_at
       FROM mail_outbox
       ${clause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json({ items: rows });
});

// Force a retry of a single row.
router.post('/:id/retry', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const r = await query(
    `UPDATE mail_outbox
        SET status = 'pending', next_attempt_at = now(), last_error = '', updated_at = now()
      WHERE id = $1 AND status IN ('dead', 'pending', 'sent')
      RETURNING id`,
    [id]
  );
  if (!r.rowCount) return res.status(404).json({ error: 'not_found' });
  await recordAudit({ req, action: 'retry_mail', entity: 'mail_outbox', entityId: id });
  // Kick the worker so the operator sees fast feedback rather than waiting
  // for the next 15s tick.
  mailWorker.tick().catch(() => {});
  res.json({ ok: true });
});

// Retry every dead row at once.
router.post('/retry-all-dead', requireAuth, async (req, res) => {
  const r = await query(
    `UPDATE mail_outbox
        SET status = 'pending', next_attempt_at = now(), last_error = '', updated_at = now()
      WHERE status = 'dead'
      RETURNING id`
  );
  await recordAudit({ req, action: 'retry_all_dead', entity: 'mail_outbox', detail: { count: r.rowCount } });
  mailWorker.tick().catch(() => {});
  res.json({ ok: true, requeued: r.rowCount });
});

// Fire a one-off test email so the operator can verify SMTP after editing settings.
router.post('/test', requireAuth, async (req, res) => {
  const to = trimStr((req.body || {}).to, 190).toLowerCase();
  if (!isEmail(to)) return res.status(400).json({ error: 'invalid_email' });
  const id = await enqueueTestEmail(to);
  await recordAudit({ req, action: 'test_mail', entity: 'mail_outbox', entityId: id, detail: { to } });
  mailWorker.tick().catch(() => {});
  res.json({ ok: true, id });
});

module.exports = router;
