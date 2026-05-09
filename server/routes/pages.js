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
  await recordAudit({ req, action: 'create', entity: 'page', entityId: result.rows[0].id, detail: { slug } });
  res.json({ id: result.rows[0].id });
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
  await recordAudit({ req, action: 'update', entity: 'page', entityId: id });
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
