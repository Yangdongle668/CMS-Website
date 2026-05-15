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
const { many, one, query } = require('../db/client');
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

module.exports = router;
