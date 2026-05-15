const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { trimStr, asJson, clamp } = require('../utils/validate');
const { SEO_SELECT, extractSeoValues, seoValuesPlaceholders, seoSetClause } = require('../utils/seo-fields');

const router = express.Router();

const FIELDS = `
  id, slug, nav, title, meta_title, meta_description,
  hero_eyebrow, hero_title, hero_subtitle, hero_image, hero_breadcrumbs,
  body_html, sections, status, updated_at,
  ${SEO_SELECT}
`;

/* ---------------------------------------------------------------------------
   Page version history.
   Every save snapshots the new row into page_versions. We keep the newest 50
   per page so the table is bounded. Restore overwrites the live row with
   the snapshot's contents and ALSO snapshots the pre-restore state so the
   restore itself is reversible.
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

// Public list
router.get('/', async (_req, res) => {
  const rows = await many(`SELECT ${FIELDS} FROM pages WHERE status='published' ORDER BY slug`);
  res.json({ items: rows });
});

// Public read by slug — supports nested slugs like 'about/profile'
router.get('/by-slug/*', async (req, res) => {
  const slug = req.params[0];
  if (!slug) return res.status(400).json({ error: 'invalid_slug' });
  const row = await one(`SELECT ${FIELDS} FROM pages WHERE slug = $1`, [slug]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ page: row });
});

// Admin: list with drafts
router.get('/admin', requireAuth, async (_req, res) => {
  const rows = await many(`SELECT ${FIELDS} FROM pages ORDER BY slug`);
  res.json({ items: rows });
});

// Admin: get one by id
router.get('/admin/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const row = await one(`SELECT ${FIELDS} FROM pages WHERE id = $1`, [id]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ page: row });
});

// Admin: create
router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const slug = trimStr(b.slug, 190).toLowerCase();
  if (!slug) return res.status(400).json({ error: 'slug_required' });
  const seoVals = extractSeoValues(b);
  const result = await query(
    `INSERT INTO pages (
       slug, nav, title, meta_title, meta_description,
       hero_eyebrow, hero_title, hero_subtitle, hero_image, hero_breadcrumbs,
       body_html, sections, status,
       focus_keyword, secondary_keywords, canonical_override, robots,
       og_title, og_description, og_image_url,
       twitter_title, twitter_description, twitter_image_url,
       schema_type, schema_extra, seo_score, seo_checks
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, ${seoValuesPlaceholders(14)}) RETURNING id`,
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
      b.status === 'draft' ? 'draft' : 'published',
      ...seoVals,
    ]
  );
  const id = result.rows[0].id;
  await snapshotPage(req, id, 'created');
  await recordAudit({ req, action: 'create', entity: 'page', entityId: id, detail: { slug } });
  res.json({ id });
});

// Admin: update
router.put('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const b = req.body || {};
  const seoVals = extractSeoValues(b);
  // SEO columns sit at $13..$26, the WHERE id parameter sits at $27.
  await query(
    `UPDATE pages SET
       nav = $1, title = $2, meta_title = $3, meta_description = $4,
       hero_eyebrow = $5, hero_title = $6, hero_subtitle = $7, hero_image = $8, hero_breadcrumbs = $9,
       body_html = $10, sections = $11, status = $12,
       ${seoSetClause(13)},
       updated_at = now()
     WHERE id = $${13 + seoVals.length}`,
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
      b.status === 'draft' ? 'draft' : 'published',
      ...seoVals,
      id,
    ]
  );
  await snapshotPage(req, id, trimStr(b._summary, 200) || 'edited');
  await recordAudit({ req, action: 'update', entity: 'page', entityId: id });
  res.json({ ok: true });
});

/* ---------- Admin: version history -----------------------------------------
   GET    /api/pages/:id/versions             timeline (newest first)
   GET    /api/pages/:id/versions/:vid        full snapshot payload
   POST   /api/pages/:id/versions/:vid/restore  overwrite live row
--------------------------------------------------------------------------- */
router.get('/:id/versions', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const rows = await many(
    `SELECT id, page_id, summary, creator_email, created_at
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
  const v = await one(`SELECT snapshot FROM page_versions WHERE id = $1 AND page_id = $2`, [vid, id]);
  if (!v) return res.status(404).json({ error: 'not_found' });
  const s = v.snapshot || {};

  // Snapshot CURRENT state first so the restore is reversible.
  await snapshotPage(req, id, `pre-restore-of-v${vid}`);

  // Slug intentionally preserved — restoring shouldn't move a URL out from
  // under inbound links.
  await query(
    `UPDATE pages SET
       nav = $1, title = $2, meta_title = $3, meta_description = $4,
       hero_eyebrow = $5, hero_title = $6, hero_subtitle = $7, hero_image = $8, hero_breadcrumbs = $9,
       body_html = $10, sections = $11, status = $12, updated_at = now()
     WHERE id = $13`,
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
      s.status === 'draft' ? 'draft' : 'published',
      id,
    ]
  );
  await snapshotPage(req, id, `restored from v${vid}`);
  await recordAudit({ req, action: 'restore_version', entity: 'page', entityId: id, detail: { version_id: vid } });
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  await query('DELETE FROM pages WHERE id = $1', [id]);
  await recordAudit({ req, action: 'delete', entity: 'page', entityId: id });
  res.json({ ok: true });
});

module.exports = router;
