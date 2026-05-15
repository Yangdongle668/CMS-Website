const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { clamp, trimStr } = require('../utils/validate');
const imageProcessor = require('../services/image-processor');
const imageAi = require('../services/image-ai');

const router = express.Router();

const ROOT = path.join(__dirname, '..', '..');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif',
  'application/pdf',
]);

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 8);
    const base = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60);
    const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    cb(null, `${stamp}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new Error('file_type_not_allowed'));
  },
});

router.get('/', requireAuth, async (req, res) => {
  const limit = clamp(req.query.limit, 1, 100, 30);
  const rows = await many(
    `SELECT id, filename, original, url, mime, size, alt_text,
            variants, srcset, width, height, created_at
     FROM media ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  res.json({ items: rows });
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  const url = '/uploads/' + req.file.filename;

  // Auto-process images: emit AVIF + WebP + JPEG at 4 sizes for
  // responsive <picture> usage. Failure here doesn't fail the upload —
  // the original file is still usable as src.
  let result = { variants: [], srcset: {}, original_width: 0, original_height: 0 };
  if (imageProcessor.shouldProcess(req.file.mimetype)) {
    result = await imageProcessor.process(path.join(UPLOAD_DIR, req.file.filename));
    if (result.error) {
      console.warn('[media] image processing failed:', result.error);
    }
  }

  const r = await query(
    `INSERT INTO media (filename, original, url, mime, size, alt_text,
                        variants, srcset, width, height, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [
      req.file.filename,
      req.file.originalname,
      url,
      req.file.mimetype,
      req.file.size,
      trimStr(req.body.alt_text, 255),
      JSON.stringify(result.variants || []),
      JSON.stringify(result.srcset || {}),
      result.original_width || 0,
      result.original_height || 0,
      req.user.id,
    ]
  );
  await recordAudit({ req, action: 'upload', entity: 'media', entityId: r.rows[0].id });
  res.json({
    id: r.rows[0].id,
    url,
    filename: req.file.filename,
    variants: result.variants || [],
    srcset: result.srcset || {},
    width: result.original_width || 0,
    height: result.original_height || 0,
  });
});

// Reprocess endpoint — regenerate variants for an existing media row.
// Useful after upgrading sharp / changing the size matrix, or for
// images uploaded before image processing was wired up.
router.post('/:id/reprocess', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const row = await one('SELECT filename, mime FROM media WHERE id = $1', [id]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  if (!imageProcessor.shouldProcess(row.mime)) {
    return res.status(400).json({ error: 'unsupported_format' });
  }
  const filePath = path.join(UPLOAD_DIR, row.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'file_missing' });
  const result = await imageProcessor.process(filePath);
  await query(
    `UPDATE media SET variants=$1, srcset=$2, width=$3, height=$4 WHERE id=$5`,
    [
      JSON.stringify(result.variants || []),
      JSON.stringify(result.srcset || {}),
      result.original_width || 0,
      result.original_height || 0,
      id,
    ]
  );
  await recordAudit({ req, action: 'reprocess', entity: 'media', entityId: id });
  res.json({ ok: true, variants: result.variants, srcset: result.srcset });
});

// ----- Update alt text (manual save from media library) -----
router.put('/:id/alt', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const alt = trimStr(req.body && req.body.alt_text, 255);
  const r = await query('UPDATE media SET alt_text = $1 WHERE id = $2 RETURNING id', [alt, id]);
  if (!r.rows.length) return res.status(404).json({ error: 'not_found' });
  await recordAudit({ req, action: 'update_alt', entity: 'media', entityId: id });
  res.json({ ok: true, alt_text: alt });
});

// ----- AI auto-alt -----
// Sends the image to a vision-capable LLM and stores the suggested alt
// text. Admin-triggered (button on media library) rather than automatic
// on upload so they get explicit control + cost visibility.
router.post('/:id/auto-alt', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const row = await one('SELECT id, url, mime, original FROM media WHERE id = $1', [id]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  if (!row.mime || !row.mime.startsWith('image/')) {
    return res.status(400).json({ error: 'not_an_image' });
  }
  if (row.mime === 'image/svg+xml') {
    return res.status(400).json({ error: 'svg_not_supported' });
  }
  try {
    const result = await imageAi.generateAlt(row.url, row.original || '');
    await query('UPDATE media SET alt_text = $1 WHERE id = $2', [result.alt, id]);
    await recordAudit({ req, action: 'auto_alt', entity: 'media', entityId: id, detail: { provider: result.provider } });
    res.json({ ok: true, alt: result.alt, provider: result.provider, model: result.model });
  } catch (err) {
    res.status(err.code === 'ai_not_configured' ? 503 : 502).json({
      error: err.code || 'generate_failed',
      detail: err.message,
    });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const row = await one('SELECT filename FROM media WHERE id = $1', [id]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  const filePath = path.join(UPLOAD_DIR, row.filename);
  // Drop variant files first so we don't orphan them on disk
  await imageProcessor.cleanup(filePath);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (_) { /* ignore */ }
  }
  await query('DELETE FROM media WHERE id = $1', [id]);
  await recordAudit({ req, action: 'delete', entity: 'media', entityId: id });
  res.json({ ok: true });
});

module.exports = router;
