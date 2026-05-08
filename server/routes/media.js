const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { clamp, trimStr } = require('../utils/validate');

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
    `SELECT id, filename, original, url, mime, size, alt_text, created_at
     FROM media ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  res.json({ items: rows });
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  const url = '/uploads/' + req.file.filename;
  const r = await query(
    `INSERT INTO media (filename, original, url, mime, size, alt_text, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [
      req.file.filename,
      req.file.originalname,
      url,
      req.file.mimetype,
      req.file.size,
      trimStr(req.body.alt_text, 255),
      req.user.id,
    ]
  );
  await recordAudit({ req, action: 'upload', entity: 'media', entityId: r.rows[0].id });
  res.json({ id: r.rows[0].id, url, filename: req.file.filename });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const row = await one('SELECT filename FROM media WHERE id = $1', [id]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  const filePath = path.join(UPLOAD_DIR, row.filename);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (_) { /* ignore */ }
  }
  await query('DELETE FROM media WHERE id = $1', [id]);
  await recordAudit({ req, action: 'delete', entity: 'media', entityId: id });
  res.json({ ok: true });
});

module.exports = router;
