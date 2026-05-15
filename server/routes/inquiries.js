const express = require('express');
const rateLimit = require('express-rate-limit');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { isEmail, trimStr, asBool, asJson, clamp } = require('../utils/validate');
const { sha256, shortRef } = require('../utils/hash');
const { verifyTurnstile } = require('../services/turnstile');
const { enqueueInquiryEmails, enqueueTestEmail } = require('../services/mailer');

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_inquiries' },
});

// ---------- Public submit ----------
router.post('/', submitLimiter, async (req, res) => {
  const b = req.body || {};

  // Honeypot field (bots fill it in; humans don't see it)
  if (b.website && String(b.website).trim() !== '') {
    return res.status(200).json({ ok: true, reference: 'BOT' });
  }

  const consent = asBool(b.consent_given);
  if (!consent) return res.status(400).json({ error: 'consent_required' });

  const email = trimStr(b.email, 190).toLowerCase();
  const fullName = trimStr(b.full_name, 190);
  if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' });
  if (!fullName) return res.status(400).json({ error: 'name_required' });

  const message = trimStr(b.message, 4000);
  if (message.length < 10) return res.status(400).json({ error: 'message_too_short' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
  const ipHash = sha256(ip);
  const ua = trimStr(req.headers['user-agent'], 500);

  // Verify Turnstile
  const turnstile = await verifyTurnstile(b['cf-turnstile-response'] || b.turnstile, ip);
  if (!turnstile.success) return res.status(400).json({ error: 'turnstile_failed' });

  const reference = shortRef('INQ');
  const inquiry = {
    reference,
    company: trimStr(b.company, 190),
    full_name: fullName,
    email,
    phone: trimStr(b.phone, 60),
    country: trimStr(b.country, 80),
    product_categories: asJson(b.product_categories, []),
    capacity_need: trimStr(b.capacity_need, 120),
    annual_volume: trimStr(b.annual_volume, 120),
    application: trimStr(b.application, 190),
    message,
    attachments: asJson(b.attachments, []),
    source_page: trimStr(b.source_page, 500),
    utm: asJson(b.utm, {}),
    ip_hash: ipHash,
    user_agent: ua,
    consent_given: true,
    consent_at: new Date(),
    policy_version: process.env.PRIVACY_POLICY_VERSION || '1.0',
  };

  // 1) Persist the inquiry first. This is the only step the request blocks on,
  //    so the visitor never loses their RFQ even if SMTP is down. If this
  //    fails we return 5xx so the front-end can show a retry banner.
  let inserted;
  try {
    const r = await query(
      `INSERT INTO inquiries (
         reference, company, full_name, email, phone, country, product_categories,
         capacity_need, annual_volume, application, message, attachments,
         source_page, utm, ip_hash, user_agent, consent_given, consent_at, policy_version
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
      [
        inquiry.reference,
        inquiry.company,
        inquiry.full_name,
        inquiry.email,
        inquiry.phone,
        inquiry.country,
        JSON.stringify(inquiry.product_categories),
        inquiry.capacity_need,
        inquiry.annual_volume,
        inquiry.application,
        inquiry.message,
        JSON.stringify(inquiry.attachments),
        inquiry.source_page,
        JSON.stringify(inquiry.utm),
        inquiry.ip_hash,
        inquiry.user_agent,
        inquiry.consent_given,
        inquiry.consent_at,
        inquiry.policy_version,
      ]
    );
    inserted = r.rows && r.rows[0];
  } catch (err) {
    console.error('[inquiries] insert failed', err);
    return res.status(500).json({ error: 'persist_failed' });
  }
  inquiry.id = inserted ? inserted.id : null;

  // 2) Enqueue notification + auto-reply. Failure to enqueue is logged but does
  //    NOT fail the visitor's request — the inquiry is already safely in the DB
  //    and an operator can resend from the admin UI.
  try {
    await enqueueInquiryEmails(inquiry);
  } catch (err) {
    console.error('[inquiries] enqueue failed', err);
  }

  res.json({ ok: true, reference });
});

// ---------- Admin ----------
router.get('/', requireAuth, async (req, res) => {
  const limit = clamp(req.query.limit, 1, 100, 25);
  const offset = clamp(req.query.offset, 0, 1e6, 0);
  const status = trimStr(req.query.status, 20);
  const params = [];
  const where = ['i.is_deleted = FALSE'];
  if (status) {
    params.push(status);
    where.push(`i.status = $${params.length}`);
  }
  if (req.query.q) {
    params.push('%' + String(req.query.q).slice(0, 100) + '%');
    where.push(
      `(i.email ILIKE $${params.length} OR i.company ILIKE $${params.length} OR i.full_name ILIKE $${params.length} OR i.reference ILIKE $${params.length})`
    );
  }
  const filterClause = where.join(' AND ');
  params.push(limit);
  params.push(offset);
  const rows = await many(
    `SELECT i.id, i.reference, i.company, i.full_name, i.email, i.phone, i.country,
            i.product_categories, i.capacity_need, i.annual_volume, i.application,
            i.source_page, i.status, i.created_at,
            COALESCE((
              SELECT CASE
                WHEN bool_or(status = 'dead')    THEN 'dead'
                WHEN bool_or(status = 'pending') THEN 'pending'
                WHEN bool_or(status = 'sending') THEN 'sending'
                WHEN count(*) > 0                THEN 'sent'
                ELSE 'none'
              END FROM mail_outbox WHERE inquiry_id = i.id
            ), 'none') AS mail_status
     FROM inquiries i
     WHERE ${filterClause}
     ORDER BY i.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  const total = await one(
    `SELECT count(*)::int AS n FROM inquiries i WHERE ${filterClause}`,
    params.slice(0, params.length - 2)
  );
  const stats = await one(
    `SELECT
       count(*)::int AS total,
       count(*) FILTER (WHERE status='new')::int AS unread,
       count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS week
     FROM inquiries WHERE is_deleted = FALSE`
  );
  // Mail queue alarms — surface failed/dead totals so the inquiries page can show a banner.
  const mailQueue = await one(
    `SELECT
       count(*) FILTER (WHERE status='dead')::int    AS dead,
       count(*) FILTER (WHERE status='pending'
                          AND attempts > 0)::int     AS retrying,
       count(*) FILTER (WHERE status='pending'
                          AND attempts = 0)::int     AS pending,
       max(updated_at) FILTER (WHERE status='dead')  AS last_dead_at
     FROM mail_outbox WHERE created_at > now() - interval '30 days'`
  );
  res.json({ items: rows, total: total ? total.n : 0, stats, mailQueue, limit, offset });
});

router.get('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const row = await one('SELECT * FROM inquiries WHERE id = $1 AND is_deleted = FALSE', [id]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ inquiry: row });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const b = req.body || {};
  const status = ['new', 'read', 'replied', 'spam', 'archived'].includes(b.status)
    ? b.status
    : null;
  const notes = b.notes != null ? trimStr(b.notes, 5000) : null;
  const sets = [];
  const params = [];
  if (status) {
    params.push(status);
    sets.push(`status = $${params.length}`);
  }
  if (notes != null) {
    params.push(notes);
    sets.push(`notes = $${params.length}`);
  }
  if (!sets.length) return res.json({ ok: true });
  params.push(id);
  await query(
    `UPDATE inquiries SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length}`,
    params
  );
  await recordAudit({ req, action: 'update', entity: 'inquiry', entityId: id, detail: { status } });
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  await query(
    'UPDATE inquiries SET is_deleted = TRUE, deleted_at = now() WHERE id = $1',
    [id]
  );
  await recordAudit({ req, action: 'soft_delete', entity: 'inquiry', entityId: id });
  res.json({ ok: true });
});

// ---------- Mail delivery status (admin) ----------

// Per-inquiry outbox view: every mail we tried to send for this RFQ.
router.get('/:id/mails', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const rows = await many(
    `SELECT id, kind, to_addr, status, attempts, max_attempts,
            next_attempt_at, last_error, sent_at, created_at, updated_at
       FROM mail_outbox
      WHERE inquiry_id = $1
      ORDER BY created_at ASC`,
    [id]
  );
  res.json({ items: rows });
});

// Manually requeue a failed or dead outbox row. The worker will pick it up
// on the next tick.
router.post('/:id/mails/:mailId/resend', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  const mailId = clamp(req.params.mailId, 1, 1e9, 0);
  if (!id || !mailId) return res.status(400).json({ error: 'invalid_id' });
  const r = await query(
    `UPDATE mail_outbox
        SET status = 'pending',
            next_attempt_at = now(),
            last_error = '',
            updated_at = now()
      WHERE id = $1 AND inquiry_id = $2 AND status IN ('dead','pending','sent')
      RETURNING id`,
    [mailId, id]
  );
  if (!r.rowCount) return res.status(404).json({ error: 'not_found' });
  await recordAudit({ req, action: 'resend_mail', entity: 'inquiry', entityId: id, detail: { mail_id: mailId } });
  res.json({ ok: true });
});

router.get('/export/csv', requireAuth, async (_req, res) => {
  const rows = await many(
    `SELECT reference, created_at, status, full_name, email, company, country, phone,
            capacity_need, annual_volume, application, message
     FROM inquiries WHERE is_deleted = FALSE ORDER BY created_at DESC LIMIT 5000`
  );
  const headers = [
    'reference', 'created_at', 'status', 'full_name', 'email', 'company',
    'country', 'phone', 'capacity_need', 'annual_volume', 'application', 'message',
  ];
  const escape = (v) => {
    const s = v == null ? '' : String(v).replace(/\r?\n/g, ' ').replace(/"/g, '""');
    return `"${s}"`;
  };
  const csv = [headers.join(',')]
    .concat(rows.map((r) => headers.map((h) => escape(r[h])).join(',')))
    .join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="inquiries.csv"');
  res.send('﻿' + csv);
});

module.exports = router;
