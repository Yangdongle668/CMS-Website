const express = require('express');
const rateLimit = require('express-rate-limit');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { isEmail, trimStr, asBool, asJson, clamp } = require('../utils/validate');
const { sha256, shortRef } = require('../utils/hash');
const { verifyTurnstile } = require('../services/turnstile');
const { enqueue } = require('../services/mail-outbox');
const {
  buildInquiryInternalMail,
  buildInquiryAutoReplyMail,
} = require('../services/mail-templates');
const { scoreInquiry } = require('../services/lead-scoring');
const emergency = require('../services/emergency-store');

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

  const company = trimStr(b.company, 190);
  const contentHash = sha256(`${email}|${company}|${message}`);

  // Idempotency: same email + same content fingerprint within the last
  // 5 minutes is treated as a duplicate (double-click, network retry,
  // accidental refresh-resubmit). Returns the original reference so the
  // user sees the same success screen.
  const dup = await one(
    `SELECT reference FROM inquiries
     WHERE email = $1 AND content_hash = $2
       AND created_at > now() - interval '5 minutes'
     LIMIT 1`,
    [email, contentHash]
  );
  if (dup) {
    return res.json({ ok: true, reference: dup.reference, deduped: true });
  }

  // Per-email throttle: max 3 inquiries from the same address per hour
  // to mitigate IP-rate-limit bypass via NAT/shared connections.
  const recentByEmail = await one(
    `SELECT count(*)::int AS n FROM inquiries
     WHERE email = $1 AND created_at > now() - interval '1 hour'`,
    [email]
  );
  if (recentByEmail && recentByEmail.n >= 3) {
    return res.status(429).json({ error: 'too_many_inquiries' });
  }

  const reference = shortRef('INQ');
  const inquiry = {
    reference,
    company,
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
    content_hash: contentHash,
  };

  const { score } = scoreInquiry(inquiry);
  inquiry.score = score;

  let inquiryId = null;
  try {
    const r = await query(
      `INSERT INTO inquiries (
         reference, company, full_name, email, phone, country, product_categories,
         capacity_need, annual_volume, application, message, attachments,
         source_page, utm, ip_hash, user_agent, consent_given, consent_at, policy_version,
         content_hash, score
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING id`,
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
        inquiry.content_hash,
        inquiry.score,
      ]
    );
    inquiryId = r.rows[0].id;
  } catch (dbErr) {
    // Last-resort path: PostgreSQL is unreachable / down. Persist the
    // raw inquiry payload to disk so the lead is not lost. A boot-time
    // replay (see server/index.js) will retry insertion once the DB is
    // back. We deliberately return success to the user so they don't
    // resubmit and we don't reveal infrastructure state.
    console.error('[inquiries] DB INSERT failed, falling back to emergency store:', dbErr && dbErr.message);
    const ok = emergency.appendSync({
      ...inquiry,
      // store ISO strings since JSON.stringify already does this
      consent_at: new Date(inquiry.consent_at).toISOString(),
      _captured_at: new Date().toISOString(),
    });
    if (!ok) {
      // Both PG AND filesystem failed — surface a real error so the
      // client can retry rather than silently dropping the lead.
      return res.status(503).json({ error: 'service_unavailable' });
    }
    return res.json({ ok: true, reference, degraded: true });
  }

  // Hand off email delivery to the outbox worker. enqueue() is a single
  // INSERT — never awaits SMTP — so the response below returns in
  // milliseconds even if the mail server is down.
  try {
    const internal = buildInquiryInternalMail(inquiry);
    await enqueue({
      kind: 'inquiry_internal',
      relatedType: 'inquiry',
      relatedId: inquiryId,
      ...internal,
    });
    if (String(process.env.AUTO_REPLY_ENABLED || 'true') === 'true') {
      const auto = buildInquiryAutoReplyMail(inquiry);
      await enqueue({
        kind: 'inquiry_autoreply',
        relatedType: 'inquiry',
        relatedId: inquiryId,
        ...auto,
      });
    }
  } catch (err) {
    // Even if the outbox INSERT itself fails (e.g. PG hiccup), the
    // inquiry row above is already committed, so we never lose the lead.
    // The next /readyz probe will surface any outbox lag.
    console.error('[inquiries] outbox enqueue failed', err && err.message);
  }

  res.json({ ok: true, reference });
});

// ---------- Admin ----------
router.get('/', requireAuth, async (req, res) => {
  const limit = clamp(req.query.limit, 1, 100, 25);
  const offset = clamp(req.query.offset, 0, 1e6, 0);
  const status = trimStr(req.query.status, 20);
  const sort = req.query.sort === 'score' ? 'score' : 'created';
  const params = [];
  const where = ['is_deleted = FALSE'];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (req.query.q) {
    params.push('%' + String(req.query.q).slice(0, 100) + '%');
    where.push(
      `(email ILIKE $${params.length} OR company ILIKE $${params.length} OR full_name ILIKE $${params.length} OR reference ILIKE $${params.length})`
    );
  }
  const orderBy = sort === 'score'
    ? 'score DESC, created_at DESC'
    : 'created_at DESC';
  params.push(limit);
  params.push(offset);
  const rows = await many(
    `SELECT id, reference, company, full_name, email, phone, country, product_categories,
            capacity_need, annual_volume, application, source_page, status, score, created_at
     FROM inquiries WHERE ${where.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  const total = await one(
    `SELECT count(*)::int AS n FROM inquiries WHERE ${where.join(' AND ')}`,
    params.slice(0, params.length - 2)
  );
  const stats = await one(
    `SELECT
       count(*)::int AS total,
       count(*) FILTER (WHERE status='new')::int AS unread,
       count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS week,
       count(*) FILTER (WHERE score >= 60 AND is_deleted = FALSE)::int AS hot
     FROM inquiries WHERE is_deleted = FALSE`
  );
  res.json({ items: rows, total: total ? total.n : 0, stats, limit, offset });
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

router.get('/export/csv', requireAuth, async (_req, res) => {
  const rows = await many(
    `SELECT reference, created_at, status, score, full_name, email, company, country, phone,
            capacity_need, annual_volume, application, message
     FROM inquiries WHERE is_deleted = FALSE ORDER BY created_at DESC LIMIT 5000`
  );
  const headers = [
    'reference', 'created_at', 'status', 'score', 'full_name', 'email', 'company',
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

// Used by the boot-time emergency replay (see server/index.js). Pure
// INSERT — does not re-run scoring, hashing or rate-limiting because
// the record already passed those checks before being sidelined.
async function insertInquiryRaw(rec) {
  const r = await query(
    `INSERT INTO inquiries (
       reference, company, full_name, email, phone, country, product_categories,
       capacity_need, annual_volume, application, message, attachments,
       source_page, utm, ip_hash, user_agent, consent_given, consent_at, policy_version,
       content_hash, score
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
     ON CONFLICT (reference) DO NOTHING
     RETURNING id`,
    [
      rec.reference,
      rec.company || '',
      rec.full_name,
      rec.email,
      rec.phone || '',
      rec.country || '',
      JSON.stringify(rec.product_categories || []),
      rec.capacity_need || '',
      rec.annual_volume || '',
      rec.application || '',
      rec.message || '',
      JSON.stringify(rec.attachments || []),
      rec.source_page || '',
      JSON.stringify(rec.utm || {}),
      rec.ip_hash || '',
      rec.user_agent || '',
      !!rec.consent_given,
      rec.consent_at || new Date(),
      rec.policy_version || '',
      rec.content_hash || '',
      rec.score || 0,
    ]
  );
  return r.rows[0] ? r.rows[0].id : null;
}

module.exports = router;
module.exports.insertInquiryRaw = insertInquiryRaw;
