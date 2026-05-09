const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { isSlug, trimStr, asJson, clamp } = require('../utils/validate');
const { SEO_SELECT } = require('../utils/seo-fields');

const router = express.Router();

const PILLAR_FIELDS = `
  id, slug, name, short_name, meta_title, meta_description,
  hero_eyebrow, hero_title, hero_subtitle, hero_image,
  primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link,
  overview, variants, spec_table, applications, customization,
  manufacturing, certifications, faq, anchor_variants,
  sort_order, status, created_at, updated_at,
  ${SEO_SELECT}
`;

router.get('/', async (req, res) => {
  const status = req.query.status === 'all' ? null : 'published';
  const rows = await many(
    status
      ? `SELECT ${PILLAR_FIELDS} FROM pillar_pages WHERE status = $1 ORDER BY sort_order, id`
      : `SELECT ${PILLAR_FIELDS} FROM pillar_pages ORDER BY sort_order, id`,
    status ? [status] : []
  );
  res.json({ items: rows });
});

router.get('/:slug', async (req, res) => {
  const slug = String(req.params.slug);
  if (!isSlug(slug)) return res.status(400).json({ error: 'invalid_slug' });
  const row = await one(`SELECT ${PILLAR_FIELDS} FROM pillar_pages WHERE slug = $1`, [slug]);
  if (!row) return res.status(404).json({ error: 'not_found' });

  // Cluster: latest related articles
  const articles = await many(
    `SELECT id, slug, title, excerpt, cover_url, reading_minutes, published_at
     FROM articles
     WHERE pillar_id = $1 AND status = 'published'
     ORDER BY published_at DESC NULLS LAST LIMIT 6`,
    [row.id]
  );
  // Related products
  const products = await many(
    `SELECT id, slug, name, model_no, tagline, cover_url, specs, is_custom
     FROM products
     WHERE pillar_id = $1 AND status = 'published'
     ORDER BY sort_order, id LIMIT 12`,
    [row.id]
  );
  // Cross-link: other pillars
  const siblings = await many(
    `SELECT id, slug, name, short_name, hero_image
     FROM pillar_pages
     WHERE id <> $1 AND status = 'published'
     ORDER BY sort_order, id`,
    [row.id]
  );
  // Application names lookup
  const appSlugs = Array.isArray(row.applications) ? row.applications : [];
  let appList = [];
  if (appSlugs.length) {
    appList = await many(
      `SELECT slug, name, icon, summary FROM applications WHERE slug = ANY($1::text[]) AND status='published'`,
      [appSlugs]
    );
  }
  res.json({ pillar: row, articles, products, siblings, applications: appList });
});

// ----- Admin -----
router.put('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const b = req.body || {};
  const fields = {
    name: trimStr(b.name, 190),
    short_name: trimStr(b.short_name, 80),
    meta_title: trimStr(b.meta_title, 255),
    meta_description: trimStr(b.meta_description, 1000),
    hero_eyebrow: trimStr(b.hero_eyebrow, 120),
    hero_title: trimStr(b.hero_title, 255),
    hero_subtitle: trimStr(b.hero_subtitle, 1000),
    hero_image: trimStr(b.hero_image, 500),
    primary_cta_text: trimStr(b.primary_cta_text, 80),
    primary_cta_link: trimStr(b.primary_cta_link, 255),
    secondary_cta_text: trimStr(b.secondary_cta_text, 80),
    secondary_cta_link: trimStr(b.secondary_cta_link, 500),
    overview: asJson(b.overview, {}),
    variants: asJson(b.variants, []),
    spec_table: asJson(b.spec_table, {}),
    applications: asJson(b.applications, []),
    customization: asJson(b.customization, {}),
    manufacturing: asJson(b.manufacturing, {}),
    certifications: asJson(b.certifications, []),
    faq: asJson(b.faq, []),
    anchor_variants: asJson(b.anchor_variants, []),
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
    `UPDATE pillar_pages SET ${sets}, updated_at = now() WHERE id = $${values.length}`,
    values
  );
  await recordAudit({ req, action: 'update', entity: 'pillar', entityId: id, detail: { name: fields.name } });
  const row = await one(`SELECT ${PILLAR_FIELDS} FROM pillar_pages WHERE id = $1`, [id]);
  res.json({ pillar: row });
});

module.exports = router;
