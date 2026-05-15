const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { isSlug, trimStr, clamp } = require('../utils/validate');

const router = express.Router();
const FIELDS = `
  a.id, a.pillar_id, a.category_id, a.slug, a.title, a.excerpt, a.cover_url,
  a.content, a.author, a.meta_title, a.meta_description, a.reading_minutes,
  a.template, a.hero_image,
  a.published_at, a.status, a.created_at, a.updated_at,
  c.name AS category_name, c.slug AS category_slug,
  p.slug AS pillar_slug, p.short_name AS pillar_short_name, p.name AS pillar_name
`;

/* ---------------------------------------------------------------------------
   Version history — same shape as page_versions: every save snapshots the
   full row, and an operator can browse + restore from /admin/articles.html.
   Cap retention at 50 per article.
--------------------------------------------------------------------------- */
const VERSION_KEEP = 50;
const ARTICLE_FIELDS_PLAIN = [
  'id', 'pillar_id', 'category_id', 'slug', 'title', 'excerpt', 'cover_url',
  'content', 'author', 'meta_title', 'meta_description', 'reading_minutes',
  'template', 'hero_image', 'published_at', 'status', 'created_at', 'updated_at',
].join(', ');

async function snapshotArticle(req, articleId, summary) {
  const row = await one(`SELECT ${ARTICLE_FIELDS_PLAIN} FROM articles WHERE id = $1`, [articleId]);
  if (!row) return;
  const userEmail = (req.user && req.user.email) || '';
  await query(
    `INSERT INTO article_versions (article_id, snapshot, summary, created_by, creator_email)
     VALUES ($1, $2::jsonb, $3, $4, $5)`,
    [articleId, JSON.stringify(row), String(summary || '').slice(0, 200), (req.user && req.user.id) || null, userEmail]
  );
  await query(
    `DELETE FROM article_versions
       WHERE article_id = $1
         AND id NOT IN (
           SELECT id FROM article_versions
            WHERE article_id = $1
            ORDER BY created_at DESC
            LIMIT $2
         )`,
    [articleId, VERSION_KEEP]
  );
}

/* ---------- Public ---------------------------------------------------------- */
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

/* ---------- Admin: list + create + update + delete -------------------------- */
router.get('/admin/list', requireAuth, async (_req, res) => {
  const rows = await many(
    `SELECT ${FIELDS} FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN pillar_pages p ON p.id = a.pillar_id
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
  const r = await query(
    `INSERT INTO articles (
       pillar_id, category_id, slug, title, excerpt, cover_url, content, author,
       meta_title, meta_description, reading_minutes, template, hero_image, published_at, status
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
    [
      b.pillar_id || null,
      b.category_id || null,
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
    ]
  );
  const id = r.rows[0].id;
  await snapshotArticle(req, id, 'created');
  await recordAudit({ req, action: 'create', entity: 'article', entityId: id, detail: { slug } });
  res.json({ id });
});

router.put('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const b = req.body || {};
  const status = b.status === 'published' ? 'published' : 'draft';
  const tpl = ['standard','guide','case-study'].includes(b.template) ? b.template : 'standard';
  await query(
    `UPDATE articles SET pillar_id=$1, category_id=$2, title=$3, excerpt=$4, cover_url=$5,
       content=$6, author=$7, meta_title=$8, meta_description=$9, reading_minutes=$10,
       template=$11, hero_image=$12,
       status=$13, published_at=COALESCE(published_at, CASE WHEN $13='published' THEN now() END),
       updated_at=now() WHERE id = $14`,
    [
      b.pillar_id || null,
      b.category_id || null,
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
      id,
    ]
  );
  await snapshotArticle(req, id, trimStr(b._summary, 200) || 'edited');
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

/* ---------- Admin: version history -----------------------------------------
   Mirrors /api/pages/:id/versions* so the admin UI uses the same client code.
--------------------------------------------------------------------------- */
router.get('/:id/versions', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const rows = await many(
    `SELECT id, article_id, summary, creator_email, created_at,
            length(COALESCE(snapshot->>'content', '')) AS content_length
       FROM article_versions
      WHERE article_id = $1
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
    `SELECT id, article_id, snapshot, summary, creator_email, created_at
       FROM article_versions
      WHERE id = $1 AND article_id = $2`,
    [vid, id]
  );
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ version: row });
});

router.post('/:id/versions/:vid/restore', requireAuth, async (req, res) => {
  const id  = clamp(req.params.id, 1, 1e9, 0);
  const vid = clamp(req.params.vid, 1, 1e9, 0);
  if (!id || !vid) return res.status(400).json({ error: 'invalid_id' });
  const v = await one(`SELECT snapshot FROM article_versions WHERE id = $1 AND article_id = $2`, [vid, id]);
  if (!v) return res.status(404).json({ error: 'not_found' });
  const s = v.snapshot || {};

  await snapshotArticle(req, id, `pre-restore-of-v${vid}`);

  // Slug deliberately preserved — restoring shouldn't break inbound links.
  const tpl = ['standard','guide','case-study'].includes(s.template) ? s.template : 'standard';
  const status = s.status === 'published' ? 'published' : 'draft';
  await query(
    `UPDATE articles SET pillar_id=$1, category_id=$2, title=$3, excerpt=$4, cover_url=$5,
       content=$6, author=$7, meta_title=$8, meta_description=$9, reading_minutes=$10,
       template=$11, hero_image=$12, status=$13,
       updated_at=now() WHERE id = $14`,
    [
      s.pillar_id || null,
      s.category_id || null,
      String(s.title || '').slice(0, 255),
      String(s.excerpt || '').slice(0, 500),
      String(s.cover_url || '').slice(0, 500),
      String(s.content || '').slice(0, 100000),
      String(s.author || '').slice(0, 120),
      String(s.meta_title || '').slice(0, 255),
      String(s.meta_description || '').slice(0, 500),
      clamp(s.reading_minutes, 1, 60, 5),
      tpl,
      String(s.hero_image || '').slice(0, 500),
      status,
      id,
    ]
  );
  await snapshotArticle(req, id, `restored from v${vid}`);
  await recordAudit({ req, action: 'restore_version', entity: 'article', entityId: id, detail: { version_id: vid } });
  res.json({ ok: true });
});

router.get('/categories/list', async (_req, res) => {
  const rows = await many('SELECT id, slug, name FROM categories ORDER BY name');
  res.json({ items: rows });
});

module.exports = router;
