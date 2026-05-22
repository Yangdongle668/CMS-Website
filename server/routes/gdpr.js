const express = require('express');
const rateLimit = require('express-rate-limit');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { isEmail, trimStr, clamp, asJson } = require('../utils/validate');
const { sha256, shortRef, randomToken } = require('../utils/hash');
const { sendGdprConfirmation } = require('../services/mailer');

const router = express.Router();

const dsarLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true });

// ---------- Public: submit consent log (cookie banner) ----------
router.post('/consent', async (req, res) => {
  const b = req.body || {};
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
  const visitorHash = sha256(ip + (req.headers['user-agent'] || ''));
  const categories = asJson(b.categories, {});
  const policy = trimStr(b.policy_version, 20) || process.env.PRIVACY_POLICY_VERSION || '1.0';
  await query(
    `INSERT INTO consent_logs (visitor_hash, consent_type, categories, policy_version, user_agent)
     VALUES ($1, 'cookie', $2, $3, $4)`,
    [visitorHash, categories, policy, trimStr(req.headers['user-agent'], 500)]
  );
  res.json({ ok: true });
});

// ---------- Public: submit DSAR ----------
router.post('/request', dsarLimiter, async (req, res) => {
  const b = req.body || {};
  const email = trimStr(b.email, 190).toLowerCase();
  const type = ['access', 'delete', 'rectify'].includes(b.request_type) ? b.request_type : null;
  if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' });
  if (!type) return res.status(400).json({ error: 'invalid_type' });
  const details = trimStr(b.details, 2000);
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
  const reference = shortRef('DSAR');
  const verifyToken = randomToken(20);

  await query(
    `INSERT INTO gdpr_requests (reference, request_type, email, details, verify_token, ip_hash)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [reference, type, email, details, verifyToken, sha256(ip)]
  );

  const { resolveCanonicalBase } = require('../middleware/html-tokens');
  const base = resolveCanonicalBase(req) || '';
  const link = `${base}/api/gdpr/verify?token=${verifyToken}`;
  try {
    await sendGdprConfirmation({ reference, email, request_type: type }, link);
  } catch (err) {
    console.error('[gdpr] confirmation mail failed', err);
  }
  res.json({ ok: true, reference });
});

// ---------- Public: verify token ----------
router.get('/verify', async (req, res) => {
  const token = String(req.query.token || '').slice(0, 80);
  if (!token) return res.status(400).send('Invalid link');
  const r = await query(
    `UPDATE gdpr_requests SET verified_at = now(), status = 'verified'
     WHERE verify_token = $1 AND verified_at IS NULL
     RETURNING reference`,
    [token]
  );
  if (!r.rows.length) return res.status(400).send('Link already used or invalid.');
  res.send(`
    <!doctype html><html><head><meta charset="utf-8"><title>Request verified</title>
    <style>body{font-family:Inter,Arial,sans-serif;max-width:600px;margin:60px auto;padding:24px;color:#0f172a;}
    h1{color:#0b3a82;}a{color:#0b3a82;}</style></head>
    <body><h1>Request verified</h1>
    <p>Thank you. Your request <strong>${r.rows[0].reference}</strong> has been verified and queued for processing. We will respond within 30 days as required by GDPR Article 12.</p>
    <p><a href="/">Return to homepage</a></p></body></html>`);
});

// ---------- Admin ----------
router.get('/', requireAuth, async (_req, res) => {
  const rows = await many(
    `SELECT id, reference, request_type, email, details, status, verified_at, handled_at, created_at
     FROM gdpr_requests ORDER BY created_at DESC LIMIT 200`
  );
  res.json({ items: rows });
});

router.post('/:id/complete', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const r = await one('SELECT * FROM gdpr_requests WHERE id = $1', [id]);
  if (!r) return res.status(404).json({ error: 'not_found' });
  if (r.request_type === 'delete') {
    // Soft-delete inquiries with this email; the retention job will hard-delete later
    await query(
      `UPDATE inquiries SET is_deleted = TRUE, deleted_at = now()
       WHERE email = $1 AND is_deleted = FALSE`,
      [r.email]
    );
  }
  await query(
    `UPDATE gdpr_requests SET status='completed', handled_by = $1, handled_at = now() WHERE id = $2`,
    [req.user.id, id]
  );
  await recordAudit({ req, action: 'complete', entity: 'gdpr_request', entityId: id, detail: { type: r.request_type, email: r.email } });
  res.json({ ok: true });
});

router.get('/:id/export', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const r = await one('SELECT * FROM gdpr_requests WHERE id = $1', [id]);
  if (!r) return res.status(404).json({ error: 'not_found' });
  const inquiries = await many(
    `SELECT reference, created_at, company, full_name, email, phone, country,
            product_categories, capacity_need, annual_volume, application,
            message, source_page, status
     FROM inquiries WHERE email = $1`,
    [r.email]
  );
  await recordAudit({ req, action: 'export', entity: 'gdpr_request', entityId: id, detail: { email: r.email } });
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="gdpr-${r.reference}.json"`);
  res.send(JSON.stringify({ subject: r.email, generated_at: new Date(), inquiries }, null, 2));
});

module.exports = router;
