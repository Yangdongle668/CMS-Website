const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { isSlug, trimStr, asJson, asBool, clamp } = require('../utils/validate');
const { SEO_SELECT } = require('../utils/seo-fields');

const router = express.Router();

const PRODUCT_FIELDS = `
  id, pillar_id, slug, name, model_no, tagline, cover_url, gallery,
  specs, features, description, datasheet_url, is_custom,
  meta_title, meta_description, sort_order, status, created_at, updated_at,
  ${SEO_SELECT}
`;

router.get('/', async (req, res) => {
  const params = [];
  const where = ["status = 'published'"];
  if (req.query.pillar) {
    params.push(String(req.query.pillar));
    where.push(
      `pillar_id = (SELECT id FROM pillar_pages WHERE slug = $${params.length})`
    );
  }
  if (req.query.is_custom != null) {
    params.push(asBool(req.query.is_custom));
    where.push(`is_custom = $${params.length}`);
  }
  const rows = await many(
    `SELECT ${PRODUCT_FIELDS} FROM products WHERE ${where.join(' AND ')} ORDER BY sort_order, id`,
    params
  );
  res.json({ items: rows });
});

router.get('/:slug', async (req, res) => {
  const slug = String(req.params.slug);
  if (!isSlug(slug)) return res.status(400).json({ error: 'invalid_slug' });
  const row = await one(`SELECT ${PRODUCT_FIELDS} FROM products WHERE slug = $1`, [slug]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  const pillar = row.pillar_id
    ? await one('SELECT slug, name, short_name FROM pillar_pages WHERE id = $1', [row.pillar_id])
    : null;
  const related = row.pillar_id
    ? await many(
        `SELECT id, slug, name, model_no, tagline, cover_url FROM products
         WHERE pillar_id = $1 AND id <> $2 AND status='published' ORDER BY sort_order LIMIT 4`,
        [row.pillar_id, row.id]
      )
    : [];
  res.json({ product: row, pillar, related });
});

// ----- Admin -----
router.get('/admin/list', requireAuth, async (_req, res) => {
  const rows = await many(
    `SELECT p.${PRODUCT_FIELDS.split(',').map((s) => 'p.' + s.trim()).join(', p.').replace(/^p\./, '')}, pp.slug AS pillar_slug
     FROM products p LEFT JOIN pillar_pages pp ON pp.id = p.pillar_id
     ORDER BY p.sort_order, p.id`
  ).catch(async () =>
    many(
      `SELECT ${PRODUCT_FIELDS}, (SELECT slug FROM pillar_pages WHERE id = products.pillar_id) AS pillar_slug
       FROM products ORDER BY sort_order, id`
    )
  );
  res.json({ items: rows });
});

router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const slug = trimStr(b.slug, 190).toLowerCase();
  if (!isSlug(slug)) return res.status(400).json({ error: 'invalid_slug' });
  const name = trimStr(b.name, 190);
  if (!name) return res.status(400).json({ error: 'name_required' });
  const result = await query(
    `INSERT INTO products (
       pillar_id, slug, name, model_no, tagline, cover_url, gallery, specs, features,
       description, datasheet_url, is_custom, meta_title, meta_description, sort_order, status,
       focus_keyword, secondary_keywords, canonical_override, robots,
       og_title, og_description, og_image_url,
       twitter_title, twitter_description, twitter_image_url,
       schema_type, schema_extra, seo_score, seo_checks
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
              $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30) RETURNING id`,
    [
      b.pillar_id || null,
      slug,
      name,
      trimStr(b.model_no, 120),
      trimStr(b.tagline, 255),
      trimStr(b.cover_url, 500),
      asJson(b.gallery, []),
      asJson(b.specs, {}),
      asJson(b.features, []),
      trimStr(b.description, 5000),
      trimStr(b.datasheet_url, 500),
      asBool(b.is_custom),
      trimStr(b.meta_title, 255),
      trimStr(b.meta_description, 500),
      clamp(b.sort_order, 0, 999, 0),
      b.status === 'draft' ? 'draft' : 'published',
      trimStr(b.focus_keyword, 190),
      asJson(b.secondary_keywords, []),
      trimStr(b.canonical_override, 500),
      trimStr(b.robots, 80),
      trimStr(b.og_title, 255),
      trimStr(b.og_description, 1000),
      trimStr(b.og_image_url, 500),
      trimStr(b.twitter_title, 255),
      trimStr(b.twitter_description, 1000),
      trimStr(b.twitter_image_url, 500),
      trimStr(b.schema_type, 80),
      asJson(b.schema_extra, {}),
      clamp(b.seo_score, 0, 100, 0),
      asJson(b.seo_checks, []),
    ]
  );
  await recordAudit({ req, action: 'create', entity: 'product', entityId: result.rows[0].id, detail: { slug } });
  res.json({ id: result.rows[0].id });
});

router.put('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const b = req.body || {};
  const fields = {
    pillar_id: b.pillar_id || null,
    name: trimStr(b.name, 190),
    model_no: trimStr(b.model_no, 120),
    tagline: trimStr(b.tagline, 255),
    cover_url: trimStr(b.cover_url, 500),
    gallery: asJson(b.gallery, []),
    specs: asJson(b.specs, {}),
    features: asJson(b.features, []),
    description: trimStr(b.description, 5000),
    datasheet_url: trimStr(b.datasheet_url, 500),
    is_custom: asBool(b.is_custom),
    meta_title: trimStr(b.meta_title, 255),
    meta_description: trimStr(b.meta_description, 500),
    sort_order: clamp(b.sort_order, 0, 999, 0),
    status: b.status === 'draft' ? 'draft' : 'published',
    // RankMath-style per-entity SEO overrides.
    focus_keyword: trimStr(b.focus_keyword, 190),
    secondary_keywords: asJson(b.secondary_keywords, []),
    canonical_override: trimStr(b.canonical_override, 500),
    robots: trimStr(b.robots, 80),
    og_title: trimStr(b.og_title, 255),
    og_description: trimStr(b.og_description, 1000),
    og_image_url: trimStr(b.og_image_url, 500),
    twitter_title: trimStr(b.twitter_title, 255),
    twitter_description: trimStr(b.twitter_description, 1000),
    twitter_image_url: trimStr(b.twitter_image_url, 500),
    schema_type: trimStr(b.schema_type, 80),
    schema_extra: asJson(b.schema_extra, {}),
    seo_score: clamp(b.seo_score, 0, 100, 0),
    seo_checks: asJson(b.seo_checks, []),
  };
  const keys = Object.keys(fields);
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map((k) => fields[k]);
  values.push(id);
  await query(
    `UPDATE products SET ${sets}, updated_at = now() WHERE id = $${values.length}`,
    values
  );
  await recordAudit({ req, action: 'update', entity: 'product', entityId: id });
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  await query('DELETE FROM products WHERE id = $1', [id]);
  await recordAudit({ req, action: 'delete', entity: 'product', entityId: id });
  res.json({ ok: true });
});

module.exports = router;
