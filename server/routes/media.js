const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const express = require('express');
const multer = require('multer');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { clamp, trimStr } = require('../utils/validate');
const imageProcessor = require('../services/image-processor');
const uploadGuard = require('../services/upload-guard');

const router = express.Router();

const ROOT = path.join(__dirname, '..', '..');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Probe for a free filename without blocking. The operator's original name
// is kept so URLs stay readable; on a collision we append "-1", "-2"… and
// fall back to a timestamp suffix if somehow 999 names are taken.
async function findFreeName(base, ext) {
  for (let i = 0; i <= 999; i++) {
    const candidate = i === 0 ? base + ext : `${base}-${i}${ext}`;
    try {
      await fsp.access(path.join(UPLOAD_DIR, candidate));
    } catch {
      return candidate; // access rejected → the name is free
    }
  }
  return `${base}-${Date.now().toString(36)}${ext}`;
}

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    // The extension comes from the declared type, never from the client's
    // filename. `payload.html` announced as image/png must not land on disk
    // as .html and then be served as HTML from our own origin.
    const ext = uploadGuard.extensionFor(file.mimetype);
    if (!ext) return cb(new Error('file_type_not_allowed'));
    let base = path
      .basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60);
    if (!base) base = 'image';
    findFreeName(base, ext).then((name) => cb(null, name), cb);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Note this only screens the *declared* type — it is attacker-controlled.
    // The bytes are checked against it after the write, in the POST handler.
    if (uploadGuard.ALLOWED_MIMES.has(file.mimetype)) cb(null, true);
    else cb(new Error('file_type_not_allowed'));
  },
});

// Verify a written upload against the type it claimed to be, and scrub SVG.
// Returns null when the file is acceptable, or an error code after having
// removed it from disk.
async function screenWrittenUpload(filePath, declaredMime) {
  const detected = uploadGuard.sniffFile(filePath);
  if (!uploadGuard.matchesDeclared(detected, declaredMime)) {
    await fsp.unlink(filePath).catch(() => {});
    console.warn(
      '[media] rejected upload: declared %s but bytes look like %s',
      declaredMime,
      detected || 'nothing recognised'
    );
    return 'content_type_mismatch';
  }

  if (detected === 'image/svg+xml') {
    // Defence in depth — the CSP on /uploads is what actually contains SVG
    // script. See server/services/upload-guard.js.
    const raw = await fsp.readFile(filePath, 'utf8');
    const clean = uploadGuard.sanitizeSvg(raw);
    if (clean !== raw) {
      await fsp.writeFile(filePath, clean, 'utf8');
      console.warn('[media] stripped active content from uploaded SVG %s', path.basename(filePath));
    }
  }

  return null;
}

// Scan /public/assets/img/seed/ — these are the localized "system" images
// downloaded from Unsplash by scripts/download-unsplash-images.js. They're
// not in the media DB table but should still be browseable / pickable from
// the same media library UI so operators can reuse them when replacing
// images on pages.
const SEED_DIR = path.join(ROOT, 'public', 'assets', 'img', 'seed');
function listSeedImages() {
  if (!fs.existsSync(SEED_DIR)) return [];
  const out = [];
  for (const name of fs.readdirSync(SEED_DIR)) {
    if (!/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name)) continue;
    const full = path.join(SEED_DIR, name);
    let stat;
    try { stat = fs.statSync(full); } catch (_) { continue; }
    const ext = path.extname(name).slice(1).toLowerCase();
    const mime = ext === 'jpg' ? 'image/jpeg' : 'image/' + ext;
    out.push({
      id: 'seed:' + name,
      filename: name,
      original: name,
      url: '/assets/img/seed/' + name,
      mime,
      size: stat.size,
      alt_text: '',
      variants: [],
      srcset: {},
      width: 0,
      height: 0,
      created_at: stat.mtime,
      source: 'seed',
      readonly: true,
    });
  }
  return out.sort((a, b) => a.filename.localeCompare(b.filename));
}

router.get('/', requireAuth, async (req, res) => {
  const limit = clamp(req.query.limit, 1, 500, 120);
  const includeSeed = String(req.query.include_seed || '1') !== '0';
  const rows = await many(
    `SELECT id, filename, original, url, mime, size, alt_text,
            variants, srcset, width, height, created_at
     FROM media ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  const uploads = rows.map((r) => Object.assign({}, r, { source: 'upload', readonly: false }));
  const items = includeSeed ? uploads.concat(listSeedImages()) : uploads;
  res.json({ items });
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });

  const rejection = await screenWrittenUpload(
    path.join(UPLOAD_DIR, req.file.filename),
    req.file.mimetype
  );
  if (rejection) return res.status(400).json({ error: rejection });

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

// PATCH /api/media/:id — update editable metadata (alt_text, original name).
router.patch('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const b = req.body || {};
  const fields = [];
  const vals = [];
  if (b.alt_text !== undefined) { fields.push(`alt_text = $${fields.length + 1}`); vals.push(trimStr(b.alt_text, 255)); }
  if (b.original !== undefined) { fields.push(`original = $${fields.length + 1}`); vals.push(trimStr(b.original, 255) || null); }
  if (!fields.length) return res.status(400).json({ error: 'nothing_to_update' });
  vals.push(id);
  await query(`UPDATE media SET ${fields.join(', ')} WHERE id = $${vals.length}`, vals);
  await recordAudit({ req, action: 'update', entity: 'media', entityId: id, detail: b });
  res.json({ ok: true });
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
