const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { trimStr, asJson, clamp } = require('../utils/validate');

const router = express.Router();

const FIELDS = `
  id, slug, nav, title, meta_title, meta_description,
  hero_eyebrow, hero_title, hero_subtitle, hero_image, hero_breadcrumbs,
  body_html, sections, blocks, status, updated_at
`;

// ---------- Block sanitisation ----------
// Defensive: every block must be { id, type, data } and types must be on the
// allowlist. Unknown types are dropped silently so a broken admin save can't
// corrupt the page render.
const ALLOWED_BLOCK_TYPES = new Set([
  'hero', 'pillar-grid', 'cta-band',
  // future block types added here as we build them out
  'trust-strip', 'tesla-slider', 'content-split', 'feat-grid', 'steps-grid',
  'stat-strip', 'spec-table', 'cert-wall', 'faq', 'blog-grid', 'quote-form', 'rich-text',
]);

function sanitiseBlocks(input) {
  const arr = Array.isArray(input) ? input : [];
  const out = [];
  for (const b of arr) {
    if (!b || typeof b !== 'object') continue;
    if (!ALLOWED_BLOCK_TYPES.has(b.type)) continue;
    const id = typeof b.id === 'string' && b.id.length <= 60 ? b.id : ('blk_' + Math.random().toString(36).slice(2, 10));
    const data = b.data && typeof b.data === 'object' ? b.data : {};
    out.push({ id, type: b.type, data });
  }
  // hard cap so a runaway client can't bloat the row
  return out.slice(0, 200);
}

// Bust the block-shell slug cache after an edit so the public site sees
// new pages without waiting for the TTL. The cache lives on app.locals
// (populated by server/index.js).
function bumpSlugCache(req, slug) {
  try {
    const fn = req.app && req.app.locals && req.app.locals.invalidateSlugCache;
    if (typeof fn === 'function') fn(slug == null ? undefined : slug);
  } catch (_) { /* not fatal */ }
}

// ---------- Public ----------
router.get('/', async (_req, res) => {
  const rows = await many(`SELECT ${FIELDS} FROM pages WHERE status='published' ORDER BY slug`);
  res.json({ items: rows });
});

router.get('/by-slug/*', async (req, res) => {
  const slug = req.params[0];
  if (!slug) return res.status(400).json({ error: 'invalid_slug' });
  const row = await one(`SELECT ${FIELDS} FROM pages WHERE slug = $1`, [slug]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ page: row });
});

// ---------- Admin: list ----------
router.get('/admin', requireAuth, async (_req, res) => {
  const rows = await many(`SELECT ${FIELDS} FROM pages ORDER BY slug`);
  res.json({ items: rows });
});

router.get('/admin/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const row = await one(`SELECT ${FIELDS} FROM pages WHERE id = $1`, [id]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ page: row });
});

// ---------- Admin: create ----------
router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const slug = trimStr(b.slug, 190).toLowerCase();
  if (!slug) return res.status(400).json({ error: 'slug_required' });
  const blocks = sanitiseBlocks(b.blocks);
  const result = await query(
    `INSERT INTO pages (
       slug, nav, title, meta_title, meta_description,
       hero_eyebrow, hero_title, hero_subtitle, hero_image, hero_breadcrumbs,
       body_html, sections, blocks, status
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    [
      slug,
      trimStr(b.nav, 60),
      trimStr(b.title, 255),
      trimStr(b.meta_title, 255),
      trimStr(b.meta_description, 1000),
      trimStr(b.hero_eyebrow, 120),
      trimStr(b.hero_title, 255),
      trimStr(b.hero_subtitle, 1000),
      trimStr(b.hero_image, 500),
      JSON.stringify(asJson(b.hero_breadcrumbs, [])),
      String(b.body_html || '').slice(0, 200000),
      JSON.stringify(asJson(b.sections, {})),
      JSON.stringify(blocks),
      b.status === 'draft' ? 'draft' : 'published',
    ]
  );
  await recordAudit({ req, action: 'create', entity: 'page', entityId: result.rows[0].id, detail: { slug } });
  bumpSlugCache(req, slug);
  res.json({ id: result.rows[0].id });
});

// ---------- Admin: update ----------
router.put('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const b = req.body || {};
  const blocks = sanitiseBlocks(b.blocks);
  await query(
    `UPDATE pages SET
       nav = $1, title = $2, meta_title = $3, meta_description = $4,
       hero_eyebrow = $5, hero_title = $6, hero_subtitle = $7, hero_image = $8, hero_breadcrumbs = $9,
       body_html = $10, sections = $11, blocks = $12, status = $13, updated_at = now()
     WHERE id = $14`,
    [
      trimStr(b.nav, 60),
      trimStr(b.title, 255),
      trimStr(b.meta_title, 255),
      trimStr(b.meta_description, 1000),
      trimStr(b.hero_eyebrow, 120),
      trimStr(b.hero_title, 255),
      trimStr(b.hero_subtitle, 1000),
      trimStr(b.hero_image, 500),
      JSON.stringify(asJson(b.hero_breadcrumbs, [])),
      String(b.body_html || '').slice(0, 200000),
      JSON.stringify(asJson(b.sections, {})),
      JSON.stringify(blocks),
      b.status === 'draft' ? 'draft' : 'published',
      id,
    ]
  );
  await recordAudit({ req, action: 'update', entity: 'page', entityId: id });
  bumpSlugCache(req); // bust everything — slug may have been renamed
  res.json({ ok: true });
});

// ---------- Admin: lightweight save (blocks only) ----------
// Used by the visual builder for autosave / per-block edits. Avoids forcing
// the client to round-trip every legacy field on every keystroke.
router.patch('/:id/blocks', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const blocks = sanitiseBlocks((req.body || {}).blocks);
  await query(
    `UPDATE pages SET blocks = $1, updated_at = now() WHERE id = $2`,
    [JSON.stringify(blocks), id]
  );
  await recordAudit({ req, action: 'update_blocks', entity: 'page', entityId: id, detail: { count: blocks.length } });
  bumpSlugCache(req);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  await query('DELETE FROM pages WHERE id = $1', [id]);
  await recordAudit({ req, action: 'delete', entity: 'page', entityId: id });
  bumpSlugCache(req);
  res.json({ ok: true });
});

module.exports = router;
