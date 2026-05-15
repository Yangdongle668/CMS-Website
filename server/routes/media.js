const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
let sharp = null;
try { sharp = require('sharp'); }
catch (err) { console.warn('[media] sharp not available — variants disabled:', err.message); }
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

// Target widths for responsive variants. We never upscale — anything smaller
// than 400px just stores the original. Each width is rendered in the source
// raster format AND a webp twin so callers can decide.
const VARIANT_WIDTHS = [400, 800, 1200, 1600];

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

// Generate responsive variants for a freshly uploaded image. Returns
// { width, height, variants: [{ w, format, url, bytes }] }.
// Errors are swallowed and reported as empty variants so an upload never
// fails because sharp choked on a weird file.
async function buildVariants(filePath, mimetype) {
  if (!sharp) return { width: null, height: null, variants: [] };
  if (mimetype === 'image/svg+xml' || mimetype === 'application/pdf' || mimetype === 'image/gif') {
    // SVG is already vector. Animated GIF / PDF aren't safe to resize.
    return { width: null, height: null, variants: [] };
  }
  try {
    const meta = await sharp(filePath).metadata();
    const variants = [];
    const isPng = mimetype === 'image/png';
    const sourceFmt = isPng ? 'png' : 'jpeg';
    const baseName = path.basename(filePath, path.extname(filePath));

    for (const w of VARIANT_WIDTHS) {
      if (meta.width && meta.width <= w) continue; // skip upscales
      // Source format variant
      const rasterName = `${baseName}.w${w}.${sourceFmt === 'jpeg' ? 'jpg' : sourceFmt}`;
      const rasterPath = path.join(UPLOAD_DIR, rasterName);
      const rasterOpts = sourceFmt === 'jpeg'
        ? { quality: 82, mozjpeg: true }
        : { compressionLevel: 9, palette: true };
      const rasterInfo = await sharp(filePath)
        .resize({ width: w, withoutEnlargement: true })
        .toFormat(sourceFmt, rasterOpts)
        .toFile(rasterPath);
      variants.push({ w, format: sourceFmt, url: '/uploads/' + rasterName, bytes: rasterInfo.size });

      // WebP twin (better compression, supported everywhere modern).
      const webpName = `${baseName}.w${w}.webp`;
      const webpPath = path.join(UPLOAD_DIR, webpName);
      const webpInfo = await sharp(filePath)
        .resize({ width: w, withoutEnlargement: true })
        .toFormat('webp', { quality: 80 })
        .toFile(webpPath);
      variants.push({ w, format: 'webp', url: '/uploads/' + webpName, bytes: webpInfo.size });
    }
    return { width: meta.width || null, height: meta.height || null, variants };
  } catch (err) {
    console.warn('[media] variant generation failed for', filePath, '-', err.message);
    return { width: null, height: null, variants: [] };
  }
}

// Delete a media file plus all its variants. Best-effort — missing files
// are silently skipped because the row may predate the variant pipeline.
function unlinkMediaFiles(row) {
  const main = path.join(UPLOAD_DIR, row.filename);
  if (fs.existsSync(main)) { try { fs.unlinkSync(main); } catch (_) {} }
  const variants = Array.isArray(row.variants) ? row.variants : [];
  for (const v of variants) {
    if (!v || !v.url) continue;
    const fname = v.url.split('/').pop();
    if (!fname) continue;
    const p = path.join(UPLOAD_DIR, fname);
    if (fs.existsSync(p)) { try { fs.unlinkSync(p); } catch (_) {} }
  }
}

router.get('/', requireAuth, async (req, res) => {
  const limit = clamp(req.query.limit, 1, 100, 30);
  const rows = await many(
    `SELECT id, filename, original, url, mime, size, alt_text,
            width, height, variants, created_at
     FROM media ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  res.json({ items: rows });
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  const url = '/uploads/' + req.file.filename;
  const filePath = path.join(UPLOAD_DIR, req.file.filename);

  // Synchronous variant generation. Multer's diskStorage has already written
  // the file, so sharp can read straight from disk. For an 8 MB JPEG this
  // takes ~600ms on commodity hardware — acceptable for manual uploads.
  const { width, height, variants } = await buildVariants(filePath, req.file.mimetype);

  const r = await query(
    `INSERT INTO media (filename, original, url, mime, size, alt_text,
                        width, height, variants, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) RETURNING id`,
    [
      req.file.filename,
      req.file.originalname,
      url,
      req.file.mimetype,
      req.file.size,
      trimStr(req.body.alt_text, 255),
      width,
      height,
      JSON.stringify(variants),
      req.user.id,
    ]
  );
  await recordAudit({ req, action: 'upload', entity: 'media', entityId: r.rows[0].id });
  res.json({
    id: r.rows[0].id,
    url,
    filename: req.file.filename,
    width,
    height,
    variants,
  });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const row = await one('SELECT filename, variants FROM media WHERE id = $1', [id]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  unlinkMediaFiles(row);
  await query('DELETE FROM media WHERE id = $1', [id]);
  await recordAudit({ req, action: 'delete', entity: 'media', entityId: id });
  res.json({ ok: true });
});

module.exports = router;
