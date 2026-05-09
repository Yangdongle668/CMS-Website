const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { isSlug, trimStr, clamp } = require('../utils/validate');
const { SEO_FIELDS, extractSeoValues, seoValuesPlaceholders, seoSetClause } = require('../utils/seo-fields');

const router = express.Router();
const FIELDS = `
  a.id, a.pillar_id, a.category_id, a.author_id, a.slug, a.title, a.excerpt, a.cover_url,
  a.content, a.author, a.meta_title, a.meta_description, a.reading_minutes,
  a.template, a.hero_image,
  a.published_at, a.status, a.created_at, a.updated_at,
  ${SEO_FIELDS.map((f) => 'a.' + f).join(', ')},
  c.name AS category_name, c.slug AS category_slug,
  p.slug AS pillar_slug, p.short_name AS pillar_short_name, p.name AS pillar_name,
  au.slug AS author_slug, au.name AS author_name, au.job_title AS author_job_title,
  au.bio AS author_bio, au.avatar_url AS author_avatar_url, au.email AS author_email,
  au.knows_about AS author_knows_about, au.same_as AS author_same_as
`;

router.get('/', async (req, res) => {
  const limit = clamp(req.query.limit, 1, 50, 12);
  const offset = clamp(req.query.offset, 0, 1e6, 0);
  const params = [];
  const where = ["a.status = 'published'"];
  if (req.query.pillar) {
    params.push(String(req.query.pillar));
    where.push(`p.slug = $${params.length}`);
  }
  if (req.query.category) {
    params.push(String(req.query.category));
    where.push(`c.slug = $${params.length}`);
  }
  params.push(limit);
  params.push(offset);
  const rows = await many(
    `SELECT ${FIELDS} FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN pillar_pages p ON p.id = a.pillar_id
     LEFT JOIN authors au ON au.id = a.author_id
     WHERE ${where.join(' AND ')}
     ORDER BY a.published_at DESC NULLS LAST
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  const total = await one(
    `SELECT count(*)::int AS n FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN pillar_pages p ON p.id = a.pillar_id
     WHERE ${where.join(' AND ')}`,
    params.slice(0, params.length - 2)
  );
  res.json({ items: rows, total: total ? total.n : 0, limit, offset });
});

router.get('/:slug', async (req, res) => {
  const slug = String(req.params.slug);
  if (!isSlug(slug)) return res.status(400).json({ error: 'invalid_slug' });
  const row = await one(
    `SELECT ${FIELDS} FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN pillar_pages p ON p.id = a.pillar_id
     LEFT JOIN authors au ON au.id = a.author_id
     WHERE a.slug = $1`,
    [slug]
  );
  if (!row) return res.status(404).json({ error: 'not_found' });
  const related = row.pillar_id
    ? await many(
        `SELECT id, slug, title, excerpt, cover_url, reading_minutes, published_at
         FROM articles WHERE pillar_id = $1 AND id <> $2 AND status='published'
         ORDER BY published_at DESC LIMIT 3`,
        [row.pillar_id, row.id]
      )
    : [];
  res.json({ article: row, related });
});

router.get('/admin/list', requireAuth, async (_req, res) => {
  const rows = await many(
    `SELECT ${FIELDS} FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN pillar_pages p ON p.id = a.pillar_id
     LEFT JOIN authors au ON au.id = a.author_id
     ORDER BY a.created_at DESC`
  );
  res.json({ items: rows });
});

router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const slug = trimStr(b.slug, 190).toLowerCase();
  if (!isSlug(slug)) return res.status(400).json({ error: 'invalid_slug' });
  const title = trimStr(b.title, 255);
  if (!title) return res.status(400).json({ error: 'title_required' });
  const status = b.status === 'published' ? 'published' : 'draft';
  const tpl = ['standard','guide','case-study'].includes(b.template) ? b.template : 'standard';
  const seoVals = extractSeoValues(b);
  const r = await query(
    `INSERT INTO articles (
       pillar_id, category_id, author_id, slug, title, excerpt, cover_url, content, author,
       meta_title, meta_description, reading_minutes, template, hero_image, published_at, status,
       focus_keyword, secondary_keywords, canonical_override, robots,
       og_title, og_description, og_image_url,
       twitter_title, twitter_description, twitter_image_url,
       schema_type, schema_extra, seo_score, seo_checks
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, ${seoValuesPlaceholders(17)}) RETURNING id`,
    [
      b.pillar_id || null,
      b.category_id || null,
      b.author_id || null,
      slug,
      title,
      trimStr(b.excerpt, 500),
      trimStr(b.cover_url, 500),
      String(b.content || '').slice(0, 100000),
      trimStr(b.author, 120),
      trimStr(b.meta_title, 255),
      trimStr(b.meta_description, 500),
      clamp(b.reading_minutes, 1, 60, 5),
      tpl,
      trimStr(b.hero_image, 500),
      status === 'published' ? new Date() : null,
      status,
      ...seoVals,
    ]
  );
  await recordAudit({ req, action: 'create', entity: 'article', entityId: r.rows[0].id, detail: { slug } });
  res.json({ id: r.rows[0].id });
});

router.put('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const b = req.body || {};
  const status = b.status === 'published' ? 'published' : 'draft';
  const tpl = ['standard','guide','case-study'].includes(b.template) ? b.template : 'standard';
  const seoVals = extractSeoValues(b);
  // SEO columns sit at $15..$28; status at $14 (referenced twice via $14);
  // WHERE id parameter sits at $29.
  await query(
    `UPDATE articles SET pillar_id=$1, category_id=$2, author_id=$3, title=$4, excerpt=$5, cover_url=$6,
       content=$7, author=$8, meta_title=$9, meta_description=$10, reading_minutes=$11,
       template=$12, hero_image=$13,
       status=$14, published_at=COALESCE(published_at, CASE WHEN $14='published' THEN now() END),
       ${seoSetClause(15)},
       updated_at=now() WHERE id = $${15 + seoVals.length}`,
    [
      b.pillar_id || null,
      b.category_id || null,
      b.author_id || null,
      trimStr(b.title, 255),
      trimStr(b.excerpt, 500),
      trimStr(b.cover_url, 500),
      String(b.content || '').slice(0, 100000),
      trimStr(b.author, 120),
      trimStr(b.meta_title, 255),
      trimStr(b.meta_description, 500),
      clamp(b.reading_minutes, 1, 60, 5),
      tpl,
      trimStr(b.hero_image, 500),
      status,
      ...seoVals,
      id,
    ]
  );
  await recordAudit({ req, action: 'update', entity: 'article', entityId: id });
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  await query('DELETE FROM articles WHERE id = $1', [id]);
  await recordAudit({ req, action: 'delete', entity: 'article', entityId: id });
  res.json({ ok: true });
});

router.get('/categories/list', async (_req, res) => {
  const rows = await many('SELECT id, slug, name FROM categories ORDER BY name');
  res.json({ items: rows });
});

module.exports = router;
