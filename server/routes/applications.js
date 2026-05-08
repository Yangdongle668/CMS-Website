const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { isSlug, trimStr, clamp } = require('../utils/validate');

const router = express.Router();
const FIELDS = `id, slug, name, icon, cover_url, summary, body, meta_title, meta_description, sort_order, status, created_at, updated_at`;

router.get('/', async (_req, res) => {
  const rows = await many(
    `SELECT ${FIELDS} FROM applications WHERE status='published' ORDER BY sort_order, id`
  );
  res.json({ items: rows });
});

router.get('/:slug', async (req, res) => {
  const slug = String(req.params.slug);
  if (!isSlug(slug)) return res.status(400).json({ error: 'invalid_slug' });
  const row = await one(`SELECT ${FIELDS} FROM applications WHERE slug = $1`, [slug]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  // Find pillars that list this application
  const pillars = await many(
    `SELECT id, slug, name, short_name FROM pillar_pages
     WHERE applications @> to_jsonb(ARRAY[$1]::text[]) AND status='published'`,
    [slug]
  );
  res.json({ application: row, pillars });
});

router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const slug = trimStr(b.slug, 190).toLowerCase();
  if (!isSlug(slug)) return res.status(400).json({ error: 'invalid_slug' });
  const r = await query(
    `INSERT INTO applications (slug, name, icon, cover_url, summary, body, meta_title, meta_description, sort_order, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [
      slug,
      trimStr(b.name, 190),
      trimStr(b.icon, 120),
      trimStr(b.cover_url, 500),
      trimStr(b.summary, 1000),
      trimStr(b.body, 20000),
      trimStr(b.meta_title, 255),
      trimStr(b.meta_description, 500),
      clamp(b.sort_order, 0, 999, 0),
      b.status === 'draft' ? 'draft' : 'published',
    ]
  );
  await recordAudit({ req, action: 'create', entity: 'application', entityId: r.rows[0].id, detail: { slug } });
  res.json({ id: r.rows[0].id });
});

router.put('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const b = req.body || {};
  await query(
    `UPDATE applications SET name=$1, icon=$2, cover_url=$3, summary=$4, body=$5,
       meta_title=$6, meta_description=$7, sort_order=$8, status=$9, updated_at=now()
     WHERE id = $10`,
    [
      trimStr(b.name, 190),
      trimStr(b.icon, 120),
      trimStr(b.cover_url, 500),
      trimStr(b.summary, 1000),
      trimStr(b.body, 20000),
      trimStr(b.meta_title, 255),
      trimStr(b.meta_description, 500),
      clamp(b.sort_order, 0, 999, 0),
      b.status === 'draft' ? 'draft' : 'published',
      id,
    ]
  );
  await recordAudit({ req, action: 'update', entity: 'application', entityId: id });
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  await query('DELETE FROM applications WHERE id = $1', [id]);
  await recordAudit({ req, action: 'delete', entity: 'application', entityId: id });
  res.json({ ok: true });
});

module.exports = router;
