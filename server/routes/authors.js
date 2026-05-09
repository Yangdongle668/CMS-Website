// Authors — named experts for E-E-A-T signals on articles.
//
// Each author drives:
//   - The blog article byline (replaces the legacy free-text author field).
//   - A Person JSON-LD node attached to Article schema (server-side rendered).
//   - Optional public author profile pages (future Step).
//
// Public read; admin-only write.

const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { isSlug, trimStr, clamp } = require('../utils/validate');

const router = express.Router();

const FIELDS = `id, slug, name, job_title, bio, avatar_url, email,
                knows_about, same_as, is_active, created_at, updated_at`;

router.get('/', async (req, res) => {
  const where = req.query.all === '1' ? '' : 'WHERE is_active = TRUE';
  const rows = await many(
    `SELECT ${FIELDS} FROM authors ${where} ORDER BY name`
  );
  res.json({ items: rows });
});

router.get('/:slug', async (req, res) => {
  const slug = String(req.params.slug);
  if (!isSlug(slug)) return res.status(400).json({ error: 'invalid_slug' });
  const row = await one(`SELECT ${FIELDS} FROM authors WHERE slug = $1`, [slug]);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ author: row });
});

router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const slug = trimStr(b.slug, 190).toLowerCase();
  if (!isSlug(slug)) return res.status(400).json({ error: 'invalid_slug' });
  const name = trimStr(b.name, 190);
  if (!name) return res.status(400).json({ error: 'name_required' });
  const r = await query(
    `INSERT INTO authors (slug, name, job_title, bio, avatar_url, email, knows_about, same_as, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [
      slug, name,
      trimStr(b.job_title, 190),
      String(b.bio || '').slice(0, 8000),
      trimStr(b.avatar_url, 500),
      trimStr(b.email, 190),
      JSON.stringify(Array.isArray(b.knows_about) ? b.knows_about : []),
      JSON.stringify(Array.isArray(b.same_as) ? b.same_as : []),
      b.is_active !== false,
    ]
  );
  await recordAudit({ req, action: 'create', entity: 'author', entityId: r.rows[0].id, detail: { slug } });
  res.json({ id: r.rows[0].id });
});

router.put('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const b = req.body || {};
  await query(
    `UPDATE authors SET name=$1, job_title=$2, bio=$3, avatar_url=$4, email=$5,
       knows_about=$6, same_as=$7, is_active=$8, updated_at=now() WHERE id=$9`,
    [
      trimStr(b.name, 190),
      trimStr(b.job_title, 190),
      String(b.bio || '').slice(0, 8000),
      trimStr(b.avatar_url, 500),
      trimStr(b.email, 190),
      JSON.stringify(Array.isArray(b.knows_about) ? b.knows_about : []),
      JSON.stringify(Array.isArray(b.same_as) ? b.same_as : []),
      b.is_active !== false,
      id,
    ]
  );
  await recordAudit({ req, action: 'update', entity: 'author', entityId: id });
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  // Detach from articles before delete (FK has ON DELETE SET NULL but we
  // record the reassignment in audit log explicitly).
  await query(`UPDATE articles SET author_id = NULL WHERE author_id = $1`, [id]);
  await query(`DELETE FROM authors WHERE id = $1`, [id]);
  await recordAudit({ req, action: 'delete', entity: 'author', entityId: id });
  res.json({ ok: true });
});

module.exports = router;
