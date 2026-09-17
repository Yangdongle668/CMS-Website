// Block CRUD for the admin editor.
//
// Every write validates against the same `schema` the admin form is generated
// from (see server/blocks/index.js), so the form and the API cannot drift: a
// field added to a block file appears in the form and is accepted here in the
// same commit, and nothing else is.

const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { clamp, trimStr } = require('../utils/validate');
const blocks = require('../blocks');
const blockRender = require('../services/block-render');

const router = express.Router();

// GET /api/blocks/types — the "add block" gallery and the form definitions.
router.get('/types', requireAuth, (_req, res) => {
  res.json({ types: blocks.catalogue() });
});

// GET /api/blocks/page/:pageId — a page's blocks, drafts included.
router.get('/page/:pageId', requireAuth, async (req, res) => {
  const pageId = clamp(req.params.pageId, 1, 1e9, 0);
  if (!pageId) return res.status(400).json({ error: 'invalid_page_id' });
  const page = await one('SELECT id, slug, title FROM pages WHERE id = $1', [pageId]);
  if (!page) return res.status(404).json({ error: 'page_not_found' });
  const items = await blockRender.loadBlocks(pageId, { includeDrafts: true });
  res.json({ page, items });
});

// POST /api/blocks/page/:pageId — append a block.
router.post('/page/:pageId', requireAuth, async (req, res) => {
  const pageId = clamp(req.params.pageId, 1, 1e9, 0);
  if (!pageId) return res.status(400).json({ error: 'invalid_page_id' });
  const page = await one('SELECT id FROM pages WHERE id = $1', [pageId]);
  if (!page) return res.status(404).json({ error: 'page_not_found' });

  const type = trimStr(req.body && req.body.type, 60);
  if (!blocks.has(type)) return res.status(400).json({ error: 'unknown_block_type' });

  const { data, errors } = blocks.validate(type, (req.body && req.body.data) || {});
  if (errors.length) return res.status(400).json({ error: 'invalid_block_data', details: errors });

  const status = req.body && req.body.status === 'draft' ? 'draft' : 'published';
  const next = await one(
    'SELECT coalesce(max(sort_order), -1) + 1 AS n FROM page_blocks WHERE page_id = $1',
    [pageId]
  );

  const r = await query(
    `INSERT INTO page_blocks (page_id, type, sort_order, data, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, type, sort_order, data, status`,
    [pageId, type, next ? next.n : 0, JSON.stringify(data), status]
  );
  await recordAudit({ req, action: 'create', entity: 'page_block', entityId: r.rows[0].id,
    detail: { page_id: pageId, type } });
  res.json({ block: r.rows[0] });
});

// PUT /api/blocks/:id — replace a block's data and/or status.
router.put('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const existing = await one('SELECT id, page_id, type FROM page_blocks WHERE id = $1', [id]);
  if (!existing) return res.status(404).json({ error: 'not_found' });

  const { data, errors } = blocks.validate(existing.type, (req.body && req.body.data) || {});
  if (errors.length) return res.status(400).json({ error: 'invalid_block_data', details: errors });

  const status = req.body && req.body.status === 'draft' ? 'draft' : 'published';
  const r = await query(
    `UPDATE page_blocks SET data = $1, status = $2, updated_at = now()
     WHERE id = $3 RETURNING id, type, sort_order, data, status`,
    [JSON.stringify(data), status, id]
  );
  await recordAudit({ req, action: 'update', entity: 'page_block', entityId: id,
    detail: { page_id: existing.page_id, type: existing.type } });
  res.json({ block: r.rows[0] });
});

// PUT /api/blocks/page/:pageId/order — reorder in one statement.
//
// Takes the full ordered list of ids. Sending the whole order rather than
// per-block moves means two operators reordering at once cannot interleave
// into an order neither of them chose.
router.put('/page/:pageId/order', requireAuth, async (req, res) => {
  const pageId = clamp(req.params.pageId, 1, 1e9, 0);
  if (!pageId) return res.status(400).json({ error: 'invalid_page_id' });

  const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.map((n) => parseInt(n, 10)) : null;
  if (!ids || !ids.length || ids.some((n) => !Number.isInteger(n) || n < 1)) {
    return res.status(400).json({ error: 'invalid_ids' });
  }
  if (new Set(ids).size !== ids.length) return res.status(400).json({ error: 'duplicate_ids' });

  const owned = await many('SELECT id FROM page_blocks WHERE page_id = $1', [pageId]);
  const ownedIds = new Set(owned.map((r) => r.id));
  if (ids.length !== ownedIds.size || ids.some((id) => !ownedIds.has(id))) {
    // A partial list would leave the rest at stale positions, which shows up as
    // blocks silently jumping around later.
    return res.status(400).json({ error: 'ids_must_cover_every_block_on_the_page' });
  }

  await query(
    `UPDATE page_blocks AS b SET sort_order = v.ord, updated_at = now()
     FROM (SELECT unnest($2::int[]) AS id, generate_subscripts($2::int[], 1) - 1 AS ord) AS v
     WHERE b.id = v.id AND b.page_id = $1`,
    [pageId, ids]
  );
  await recordAudit({ req, action: 'reorder', entity: 'page_block', entityId: pageId,
    detail: { count: ids.length } });
  res.json({ ok: true, ids });
});

// DELETE /api/blocks/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const existing = await one('SELECT id, page_id, type FROM page_blocks WHERE id = $1', [id]);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  await query('DELETE FROM page_blocks WHERE id = $1', [id]);
  await recordAudit({ req, action: 'delete', entity: 'page_block', entityId: id,
    detail: { page_id: existing.page_id, type: existing.type } });
  res.json({ ok: true });
});

// POST /api/blocks/preview — render without saving, for the editor's preview.
router.post('/preview', requireAuth, async (req, res) => {
  const type = trimStr(req.body && req.body.type, 60);
  if (!blocks.has(type)) return res.status(400).json({ error: 'unknown_block_type' });
  const { data, errors } = blocks.validate(type, (req.body && req.body.data) || {});
  const out = blockRender.renderRows([{ id: 0, type, data, status: 'published' }]);
  res.json({ html: out.html, jsonLd: out.jsonLd, errors });
});

module.exports = router;
