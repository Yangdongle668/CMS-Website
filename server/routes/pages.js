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

const ALLOWED_BLOCK_TYPES = new Set([
  'hero', 'page-hero', 'pillar-grid', 'cta-band',
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
  return out.slice(0, 200);
}

function bumpSlugCache(req, slug) {
  try {
    const fn = req.app && req.app.locals && req.app.locals.invalidateSlugCache;
    if (typeof fn === 'function') fn(slug == null ? undefined : slug);
  } catch (_) { /* not fatal */ }
}

/* ---------------------------------------------------------------------------
   Version history.

   Every save snapshots the *new* state of the page into page_versions. That
   means version[N] always reflects "what the page looked like after save N".
   Restore = update the live row with the snapshot's JSON.

   We keep the last 50 snapshots per page (newest 50 by created_at). The
   pruner runs synchronously after each insert because the DELETE is cheap
   (indexed by page_id).
--------------------------------------------------------------------------- */
const VERSION_KEEP = 50;

async function snapshotPage(req, pageId, summary) {
  const row = await one(`SELECT ${FIELDS} FROM pages WHERE id = $1`, [pageId]);
  if (!row) return;
  const userEmail = (req.user && req.user.email) || '';
  await query(
    `INSERT INTO page_versions (page_id, snapshot, summary, created_by, creator_email)
     VALUES ($1, $2::jsonb, $3, $4, $5)`,
    [pageId, JSON.stringify(row), String(summary || '').slice(0, 200), (req.user && req.user.id) || null, userEmail]
  );
  // Cheap pruning of overflow versions for this page.
  await query(
    `DELETE FROM page_versions
       WHERE page_id = $1
         AND id NOT IN (
           SELECT id FROM page_versions
            WHERE page_id = $1
            ORDER BY created_at DESC
            LIMIT $2
         )`,
    [pageId, VERSION_KEEP]
  );
}

/* ---------- Public ---------------------------------------------------------- */
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

/* ---------- Admin: list ----------------------------------------------------- */
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

/* ---------- Admin: create --------------------------------------------------- */
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
  const id = result.rows[0].id;
  await snapshotPage(req, id, 'created');
  await recordAudit({ req, action: 'create', entity: 'page', entityId: id, detail: { slug } });
  bumpSlugCache(req, slug);
  res.json({ id });
});

/* ---------- Admin: update --------------------------------------------------- */
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
  await snapshotPage(req, id, trimStr(b._summary, 200) || 'edited');
  await recordAudit({ req, action: 'update', entity: 'page', entityId: id });
  bumpSlugCache(req);
  res.json({ ok: true });
});

router.patch('/:id/blocks', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const blocks = sanitiseBlocks((req.body || {}).blocks);
  await query(
    `UPDATE pages SET blocks = $1, updated_at = now() WHERE id = $2`,
    [JSON.stringify(blocks), id]
  );
  await snapshotPage(req, id, 'blocks updated');
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

/* ---------- Admin: version history ------------------------------------------
   GET    /api/pages/:id/versions             timeline (most recent first)
   GET    /api/pages/:id/versions/:vid        full snapshot payload
   POST   /api/pages/:id/versions/:vid/restore  overwrite the live row
--------------------------------------------------------------------------- */
router.get('/:id/versions', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const rows = await many(
    `SELECT id, page_id, summary, creator_email, created_at,
            jsonb_array_length(COALESCE(snapshot->'blocks', '[]'::jsonb)) AS block_count
       FROM page_versions
      WHERE page_id = $1
      ORDER BY created_at DESC
      LIMIT 60`,
    [id]
  );
  res.json({ items: rows });
});

router.get('/:id/versions/:vid', requireAuth, async (req, res) => {
  const id  = clamp(req.params.id, 1, 1e9, 0);
  const vid = clamp(req.params.vid, 1, 1e9, 0);
  if (!id || !vid) return res.status(400).json({ error: 'invalid_id' });
  const row = await one(
    `SELECT id, page_id, snapshot, summary, creator_email, created_at
       FROM page_versions
      WHERE id = $1 AND page_id = $2`,
    [vid, id]
  );
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ version: row });
});

router.post('/:id/versions/:vid/restore', requireAuth, async (req, res) => {
  const id  = clamp(req.params.id, 1, 1e9, 0);
  const vid = clamp(req.params.vid, 1, 1e9, 0);
  if (!id || !vid) return res.status(400).json({ error: 'invalid_id' });

  const v = await one(
    `SELECT snapshot FROM page_versions WHERE id = $1 AND page_id = $2`,
    [vid, id]
  );
  if (!v) return res.status(404).json({ error: 'not_found' });
  const s = v.snapshot || {};

  // First snapshot the CURRENT state so the restore itself is reversible.
  await snapshotPage(req, id, `pre-restore-of-v${vid}`);

  // Then overwrite the live row with the snapshot's contents. Slug is left
  // alone because changing the URL of a published page on restore would be a
  // surprising side-effect (and could break inbound links).
  const blocks = sanitiseBlocks(s.blocks);
  await query(
    `UPDATE pages SET
       nav = $1, title = $2, meta_title = $3, meta_description = $4,
       hero_eyebrow = $5, hero_title = $6, hero_subtitle = $7, hero_image = $8, hero_breadcrumbs = $9,
       body_html = $10, sections = $11, blocks = $12, status = $13, updated_at = now()
     WHERE id = $14`,
    [
      String(s.nav || '').slice(0, 60),
      String(s.title || '').slice(0, 255),
      String(s.meta_title || '').slice(0, 255),
      String(s.meta_description || '').slice(0, 1000),
      String(s.hero_eyebrow || '').slice(0, 120),
      String(s.hero_title || '').slice(0, 255),
      String(s.hero_subtitle || '').slice(0, 1000),
      String(s.hero_image || '').slice(0, 500),
      JSON.stringify(Array.isArray(s.hero_breadcrumbs) ? s.hero_breadcrumbs : []),
      String(s.body_html || '').slice(0, 200000),
      JSON.stringify(s.sections && typeof s.sections === 'object' ? s.sections : {}),
      JSON.stringify(blocks),
      s.status === 'draft' ? 'draft' : 'published',
      id,
    ]
  );
  // Mark the post-restore state too so the timeline reads cleanly.
  await snapshotPage(req, id, `restored from v${vid}`);
  await recordAudit({ req, action: 'restore_version', entity: 'page', entityId: id, detail: { version_id: vid } });
  bumpSlugCache(req);
  res.json({ ok: true });
});

module.exports = router;
