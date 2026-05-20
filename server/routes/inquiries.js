const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
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

const ROOT = path.join(__dirname, '..', '..');
const INQUIRY_UPLOADS = path.join(ROOT, 'uploads', 'inquiries');
if (!fs.existsSync(INQUIRY_UPLOADS)) fs.mkdirSync(INQUIRY_UPLOADS, { recursive: true });

const submitLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_inquiries' },
});

// Separate rate limit for the public upload endpoint. Stricter than
// inquiry submission since uploads cost disk + bandwidth.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_uploads' },
});

// ---------- Attachment upload (public, rate-limited) ----------
// Visitors attach datasheets / drawings / sample photos to their RFQ.
// Files go to /uploads/inquiries/<random>.<ext>; the URL is returned to
// the client, which then includes it in the inquiry submission's
// `attachments` array. Files stick around even if the visitor abandons
// the form — that's fine (~few MB max each, GDPR retention job
// auto-cleans inquiry deletes).
const ALLOWED_ATTACHMENT_MIME = new Set([
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/csv',
]);

const attachmentStorage = multer.diskStorage({
  destination: INQUIRY_UPLOADS,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 8) || '.bin';
    const base = path.basename(file.originalname, ext)
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
    const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    cb(null, `${stamp}-${base || 'file'}${ext}`);
  },
});

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_ATTACHMENT_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error('file_type_not_allowed: ' + file.mimetype));
  },
});

router.post('/upload', uploadLimiter, attachmentUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  const url = '/uploads/inquiries/' + req.file.filename;
  res.json({
    url,
    filename: req.file.filename,
    original_name: req.file.originalname,
    mime: req.file.mimetype,
    size: req.file.size,
  });
});

// Allowed widget origins. Anything else collapses to 'main_form' so an
// attacker can't pollute funnel stats by inventing source labels.
const ALLOWED_WIDGETS = new Set([
  'main_form', 'mini_rfq', 'exit_intent', 'resource_pack',
]);

// ---------- Public submit ----------
router.post('/', submitLimiter, async (req, res) => {
  const b = req.body || {};

  // Honeypot field (bots fill it in; humans don't see it)
  if (b.website && String(b.website).trim() !== '') {
    return res.status(200).json({ ok: true, reference: 'BOT' });
  }

  const widget = ALLOWED_WIDGETS.has(b.source_widget) ? b.source_widget : 'main_form';
  // Mini widgets capture fewer fields; we relax full_name and message
  // requirements for them since the goal is just to start a conversation.
  // Sales follows up via the email auto-reply trail.
  const isMini = widget !== 'main_form';

  const consent = asBool(b.consent_given);
  if (!consent) return res.status(400).json({ error: 'consent_required' });

  const email = trimStr(b.email, 190).toLowerCase();
  const fullName = trimStr(b.full_name, 190) || (isMini ? '(via mini form)' : '');
  if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' });
  if (!isMini && !fullName) return res.status(400).json({ error: 'name_required' });

  let message = trimStr(b.message, 4000);
  if (!isMini && message.length < 10) return res.status(400).json({ error: 'message_too_short' });
  // For mini forms, derive a default message from context so sales has
  // something readable in the email alert.
  if (!message && isMini) {
    const ctx = trimStr(b.source_page, 200) || '(no page)';
    message = `Inline ${widget} request from ${ctx}. Reply to the visitor for full requirements.`;
  }

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
    source_widget: widget,
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
         content_hash, score, source_widget
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING id`,
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
        inquiry.source_widget,
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
  // Convert visitor-supplied attachments (URLs we issued earlier from
  // POST /api/inquiries/upload) to nodemailer-style {filename, path}
  // entries. We validate each URL points into /uploads/inquiries/ and
  // that the file actually exists; anything outside that path or
  // missing on disk is silently dropped (defense against a client
  // forging URLs to attach arbitrary server files).
  const mailAttachments = (inquiry.attachments || [])
    .map((a) => {
      if (!a || typeof a !== 'object') return null;
      const url = String(a.url || '');
      if (!url.startsWith('/uploads/inquiries/')) return null;
      const fname = url.slice('/uploads/inquiries/'.length);
      if (fname.includes('/') || fname.includes('..')) return null;
      const abs = path.join(INQUIRY_UPLOADS, fname);
      if (!fs.existsSync(abs)) return null;
      return {
        filename: a.original_name || a.filename || fname,
        path: abs,
      };
    })
    .filter(Boolean)
    .slice(0, 5);

  try {
    const internal = buildInquiryInternalMail(inquiry, { attachments: mailAttachments });
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
            capacity_need, annual_volume, application, source_page, source_widget,
            status, score, replied_at, created_at
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
    // First-touch reply tracking: stamp replied_at the first time an
    // inquiry flips to 'replied'. Subsequent status changes don't move
    // the timestamp — funnel "avg first response time" stays meaningful.
    if (status === 'replied') {
      sets.push(`replied_at = COALESCE(replied_at, now())`);
    }
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

// ----- Admin funnel analytics -----
// Aggregates that drive /admin/analytics inquiry-funnel panels.
// Cheap queries (the indexes added in Sprint 1 make them ~5ms each).
router.get('/funnel/summary', requireAuth, async (req, res) => {
  const days = clamp(req.query.days, 1, 365, 30);
  const since = `now() - interval '${days} days'`;

  const totals = await one(
    `SELECT
       count(*)::int AS total,
       count(*) FILTER (WHERE status='replied')::int AS replied,
       count(*) FILTER (WHERE score >= 60)::int AS hot,
       count(*) FILTER (WHERE source_widget='mini_rfq')::int AS mini_rfq,
       count(*) FILTER (WHERE source_widget='exit_intent')::int AS exit_intent,
       count(*) FILTER (WHERE source_widget='resource_pack')::int AS resource_pack,
       count(*) FILTER (WHERE source_widget='main_form')::int AS main_form,
       AVG(EXTRACT(EPOCH FROM (replied_at - created_at)) / 3600)
         FILTER (WHERE replied_at IS NOT NULL)::float AS avg_reply_hours
     FROM inquiries
     WHERE is_deleted=FALSE AND created_at > ${since}`
  );

  // Page-view total over the same window (denominator for conversion rate)
  const pageviews = await one(
    `SELECT count(*)::int AS n FROM analytics_hits
     WHERE ts > ${since} AND is_bot = FALSE`
  ).catch(() => ({ n: 0 }));

  const topSourcePages = await many(
    `SELECT source_page, count(*)::int AS n
     FROM inquiries
     WHERE is_deleted=FALSE AND created_at > ${since} AND source_page <> ''
     GROUP BY source_page
     ORDER BY n DESC
     LIMIT 10`
  );

  const topUtm = await many(
    `SELECT
       COALESCE(utm->>'utm_source', '(direct)') AS source,
       COALESCE(utm->>'utm_medium', '(none)')   AS medium,
       count(*)::int AS n
     FROM inquiries
     WHERE is_deleted=FALSE AND created_at > ${since}
     GROUP BY source, medium
     ORDER BY n DESC
     LIMIT 10`
  );

  const daily = await many(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS d,
            count(*)::int AS total,
            count(*) FILTER (WHERE score >= 60)::int AS hot
     FROM inquiries
     WHERE is_deleted=FALSE AND created_at > ${since}
     GROUP BY date_trunc('day', created_at)
     ORDER BY date_trunc('day', created_at)`
  );

  const total = totals ? totals.total : 0;
  const replied = totals ? totals.replied : 0;
  const pv = pageviews ? pageviews.n : 0;

  res.json({
    window_days: days,
    totals: {
      inquiries: total,
      hot_leads: totals ? totals.hot : 0,
      replied,
      pageviews: pv,
      conversion_rate: pv > 0 ? Number((total / pv * 100).toFixed(3)) : null,
      hot_rate: total > 0 ? Number((totals.hot / total * 100).toFixed(1)) : null,
      reply_rate: total > 0 ? Number((replied / total * 100).toFixed(1)) : null,
      avg_reply_hours: totals && totals.avg_reply_hours != null
        ? Number(totals.avg_reply_hours.toFixed(2)) : null,
    },
    widgets: {
      main_form: totals.main_form,
      mini_rfq: totals.mini_rfq,
      exit_intent: totals.exit_intent,
      resource_pack: totals.resource_pack,
    },
    top_source_pages: topSourcePages,
    top_utm: topUtm,
    daily,
  });
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
