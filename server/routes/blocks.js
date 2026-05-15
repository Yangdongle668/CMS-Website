// =====================================================================
// Page-builder block API
//
// Routes (all admin except GET /types):
//   GET    /api/blocks/types               → list of registered block types
//   GET    /api/blocks/page/:page_id       → blocks for a page (sorted)
//   POST   /api/blocks                     → create new block at end of page
//   PUT    /api/blocks/:id                 → update content / visibility
//   PUT    /api/blocks/:id/reorder         → set sort_order
//   POST   /api/blocks/reorder             → reorder a whole page in one call
//   DELETE /api/blocks/:id                 → remove block
// =====================================================================
const express = require('express');
const { many, one, query, pool } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { clamp, trimStr, asBool, asJson } = require('../utils/validate');
const registry = require('../services/block-registry');
const cache = require('../services/cache');

const router = express.Router();

// Bust pages-table caches whenever blocks change (so SSR picks up new
// block sets on next request).
async function bustPageCache() {
  await cache.invalidate('page:');
}

// ----- Block type list (public — safe, just schema metadata) -----
router.get('/types', (_req, res) => {
  res.json({ types: registry.listBlockTypes() });
});

// ----- List blocks for a page -----
router.get('/page/:page_id', requireAuth, async (req, res) => {
  const pageId = clamp(req.params.page_id, 1, 1e9, 0);
  if (!pageId) return res.status(400).json({ error: 'invalid_page_id' });
  const rows = await many(
    `SELECT id, page_id, block_type, sort_order, content, is_visible, created_at, updated_at
     FROM page_blocks WHERE page_id = $1
     ORDER BY sort_order, id`,
    [pageId]
  );
  res.json({ items: rows });
});

// ----- Create a new block at the end of a page -----
router.post('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const pageId = clamp(b.page_id, 1, 1e9, 0);
  if (!pageId) return res.status(400).json({ error: 'invalid_page_id' });
  const blockType = trimStr(b.block_type, 40);
  if (!registry.getBlockType(blockType)) {
    return res.status(400).json({ error: 'unknown_block_type' });
  }

  // Verify page exists (FK would catch this but a clean 400 is friendlier)
  const page = await one('SELECT id FROM pages WHERE id = $1', [pageId]);
  if (!page) return res.status(404).json({ error: 'page_not_found' });

  // Default content from registry, optionally overridden by client payload
  const content = (b.content && typeof b.content === 'object')
    ? b.content
    : registry.defaultContent(blockType);

  // Place at end of current sort order
  const maxRow = await one(
    `SELECT COALESCE(MAX(sort_order), -1)::int AS m FROM page_blocks WHERE page_id = $1`,
    [pageId]
  );
  const sortOrder = (maxRow ? maxRow.m : -1) + 1;

  const r = await query(
    `INSERT INTO page_blocks (page_id, block_type, sort_order, content, is_visible)
     VALUES ($1,$2,$3,$4,TRUE) RETURNING id`,
    [pageId, blockType, sortOrder, JSON.stringify(content)]
  );
  await recordAudit({ req, action: 'create', entity: 'block', entityId: r.rows[0].id, detail: { page_id: pageId, block_type: blockType } });
  await bustPageCache();
  res.json({ id: r.rows[0].id, page_id: pageId, block_type: blockType, sort_order: sortOrder, content, is_visible: true });
});

// ----- Update one block -----
router.put('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const b = req.body || {};
  const sets = [];
  const params = [];
  if (b.content && typeof b.content === 'object') {
    params.push(JSON.stringify(b.content));
    sets.push(`content = $${params.length}`);
  }
  if (b.is_visible != null) {
    params.push(asBool(b.is_visible));
    sets.push(`is_visible = $${params.length}`);
  }
  if (b.block_type) {
    const t = trimStr(b.block_type, 40);
    if (!registry.getBlockType(t)) return res.status(400).json({ error: 'unknown_block_type' });
    params.push(t);
    sets.push(`block_type = $${params.length}`);
  }
  if (!sets.length) return res.json({ ok: true });
  params.push(id);
  const r = await query(
    `UPDATE page_blocks SET ${sets.join(', ')}, updated_at = now()
     WHERE id = $${params.length} RETURNING page_id`,
    params
  );
  if (!r.rows.length) return res.status(404).json({ error: 'not_found' });
  await recordAudit({ req, action: 'update', entity: 'block', entityId: id });
  await bustPageCache();
  res.json({ ok: true });
});

// ----- Reorder a whole page (single call) -----
// Body: { page_id, ordered_ids: [3, 1, 2, ...] }
// Each id is given a sort_order matching its position in the array.
router.post('/reorder', requireAuth, async (req, res) => {
  const pageId = clamp(req.body && req.body.page_id, 1, 1e9, 0);
  if (!pageId) return res.status(400).json({ error: 'invalid_page_id' });
  const ids = Array.isArray(req.body && req.body.ordered_ids) ? req.body.ordered_ids : [];
  if (!ids.length) return res.json({ ok: true });
  // Guard against arbitrary IDs being assigned to a page they don't belong to
  for (let i = 0; i < ids.length; i++) {
    const id = clamp(ids[i], 1, 1e9, 0);
    if (!id) continue;
    await query(
      `UPDATE page_blocks SET sort_order = $1, updated_at = now()
       WHERE id = $2 AND page_id = $3`,
      [i, id, pageId]
    );
  }
  await recordAudit({ req, action: 'reorder', entity: 'block', detail: { page_id: pageId, count: ids.length } });
  await bustPageCache();
  res.json({ ok: true });
});

// ----- Delete a block -----
router.delete('/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  await query('DELETE FROM page_blocks WHERE id = $1', [id]);
  await recordAudit({ req, action: 'delete', entity: 'block', entityId: id });
  await bustPageCache();
  res.json({ ok: true });
});

// ----- Bulk replace a page's blocks (used by undo/redo) -----
// Atomic transaction: DELETE all existing rows for the page, then INSERT
// the supplied list in order. New rows get fresh IDs — undo callers
// must refresh their local block array after this returns.
router.post('/replace-page', requireAuth, async (req, res) => {
  const pageId = clamp(req.body && req.body.page_id, 1, 1e9, 0);
  if (!pageId) return res.status(400).json({ error: 'invalid_page_id' });
  const list = Array.isArray(req.body && req.body.blocks) ? req.body.blocks : [];
  // Validate every block_type up front so a single bad entry doesn't
  // get half-applied before we hit the bad row.
  for (const b of list) {
    if (!b || !registry.getBlockType(trimStr(b.block_type, 40))) {
      return res.status(400).json({ error: 'unknown_block_type', detail: b && b.block_type });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM page_blocks WHERE page_id = $1', [pageId]);
    const insertedIds = [];
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      const r = await client.query(
        `INSERT INTO page_blocks (page_id, block_type, sort_order, content, is_visible)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          pageId,
          trimStr(b.block_type, 40),
          i,
          JSON.stringify(b.content || {}),
          b.is_visible !== false,
        ]
      );
      insertedIds.push(r.rows[0].id);
    }
    await client.query('COMMIT');
    await recordAudit({ req, action: 'replace_page', entity: 'block', detail: { page_id: pageId, count: list.length } });
    await bustPageCache();
    res.json({ ok: true, ids: insertedIds });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
});

// ----- Hot-render: server renders just this one block's HTML for the
// builder runtime to swap into the iframe DOM. Faster than reloading
// the whole page after a text/image edit.
router.get('/:id/render', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  const row = await one(
    `SELECT id, block_type, content, is_visible FROM page_blocks WHERE id = $1`, [id]
  );
  if (!row) return res.status(404).json({ error: 'not_found' });
  try {
    const html = await registry.renderBlock(row, { path: '/preview', builderMode: true });
    res.json({ id: row.id, html });
  } catch (err) {
    res.status(500).json({ error: 'render_failed', detail: err.message });
  }
});

// ----- Server-side preview (used by the page builder right pane) -----
// Renders an arbitrary { block_type, content } against the registry
// without persisting anything. Useful for live preview as the operator
// edits the form.
router.post('/preview', requireAuth, async (req, res) => {
  const blockType = trimStr(req.body && req.body.block_type, 40);
  const def = registry.getBlockType(blockType);
  if (!def) return res.status(400).json({ error: 'unknown_block_type' });
  const content = (req.body && req.body.content) || {};
  try {
    const html = await registry.renderBlock(
      { block_type: blockType, content, is_visible: true },
      { path: '/preview' }
    );
    res.json({ html });
  } catch (err) {
    res.status(500).json({ error: 'render_failed', detail: err.message });
  }
});

// =====================================================================
// Block snippets — reusable presets
// =====================================================================
router.get('/snippets', requireAuth, async (req, res) => {
  const blockType = trimStr(req.query.block_type, 40);
  const params = [];
  let sql = `SELECT id, name, block_type, content, created_at FROM block_snippets`;
  if (blockType) { params.push(blockType); sql += ` WHERE block_type = $1`; }
  sql += ` ORDER BY created_at DESC LIMIT 100`;
  const rows = await many(sql, params);
  res.json({ items: rows });
});

router.post('/snippets', requireAuth, async (req, res) => {
  const b = req.body || {};
  const name = trimStr(b.name, 120);
  const blockType = trimStr(b.block_type, 40);
  if (!name) return res.status(400).json({ error: 'name_required' });
  if (!registry.getBlockType(blockType)) return res.status(400).json({ error: 'unknown_block_type' });
  const content = (b.content && typeof b.content === 'object') ? b.content : {};
  const r = await query(
    `INSERT INTO block_snippets (name, block_type, content, created_by)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [name, blockType, JSON.stringify(content), req.user.id]
  );
  await recordAudit({ req, action: 'create', entity: 'block_snippet', entityId: r.rows[0].id, detail: { name, block_type: blockType } });
  res.json({ id: r.rows[0].id, name, block_type: blockType, content });
});

router.delete('/snippets/:id', requireAuth, async (req, res) => {
  const id = clamp(req.params.id, 1, 1e9, 0);
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  await query('DELETE FROM block_snippets WHERE id = $1', [id]);
  await recordAudit({ req, action: 'delete', entity: 'block_snippet', entityId: id });
  res.json({ ok: true });
});

// Create a block from a snippet (place at end of page; reorder if needed)
router.post('/from-snippet', requireAuth, async (req, res) => {
  const b = req.body || {};
  const pageId = clamp(b.page_id, 1, 1e9, 0);
  const snippetId = clamp(b.snippet_id, 1, 1e9, 0);
  if (!pageId || !snippetId) return res.status(400).json({ error: 'invalid_params' });
  const snippet = await one('SELECT block_type, content FROM block_snippets WHERE id = $1', [snippetId]);
  if (!snippet) return res.status(404).json({ error: 'snippet_not_found' });
  const max = await one(`SELECT COALESCE(MAX(sort_order), -1)::int AS m FROM page_blocks WHERE page_id = $1`, [pageId]);
  const sortOrder = (max ? max.m : -1) + 1;
  const r = await query(
    `INSERT INTO page_blocks (page_id, block_type, sort_order, content, is_visible)
     VALUES ($1, $2, $3, $4, TRUE) RETURNING id`,
    [pageId, snippet.block_type, sortOrder, JSON.stringify(snippet.content || {})]
  );
  await recordAudit({ req, action: 'create_from_snippet', entity: 'block', entityId: r.rows[0].id, detail: { snippet_id: snippetId } });
  await bustPageCache();
  res.json({
    id: r.rows[0].id,
    page_id: pageId,
    block_type: snippet.block_type,
    sort_order: sortOrder,
    content: snippet.content,
    is_visible: true,
  });
});

module.exports = router;
