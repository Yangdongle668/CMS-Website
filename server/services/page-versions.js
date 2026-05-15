// =====================================================================
// Page version helper — automatic + manual snapshots of a page's
// block state, for "oops, let me roll back" workflows.
//
// Auto behavior: maybeAutoSnapshot(pageId, userId) is called from every
// block write endpoint. It checks the latest version row for that page;
// if older than AUTO_INTERVAL_MIN minutes (default 10), it inserts a
// fresh snapshot. Aggressive coalescing — 50 edits in 5 minutes still
// produce only one auto-snapshot.
// =====================================================================
const { many, one, query } = require('../db/client');

const AUTO_INTERVAL_MIN = parseInt(process.env.PAGE_AUTO_VERSION_MIN || '10', 10);
const MAX_VERSIONS_PER_PAGE = parseInt(process.env.PAGE_VERSION_KEEP || '50', 10);

async function captureBlocks(pageId) {
  return many(
    `SELECT block_type, sort_order, content, is_visible
     FROM page_blocks WHERE page_id = $1 ORDER BY sort_order, id`,
    [pageId]
  );
}

async function createSnapshot(pageId, userId, label) {
  const blocks = await captureBlocks(pageId);
  const r = await query(
    `INSERT INTO page_versions (page_id, label, blocks_snapshot, created_by)
     VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
    [pageId, label || 'manual', JSON.stringify(blocks), userId || null]
  );
  // Prune old versions
  await query(
    `DELETE FROM page_versions
     WHERE page_id = $1
       AND id NOT IN (
         SELECT id FROM page_versions
         WHERE page_id = $1
         ORDER BY created_at DESC
         LIMIT $2
       )`,
    [pageId, MAX_VERSIONS_PER_PAGE]
  );
  return { id: r.rows[0].id, created_at: r.rows[0].created_at };
}

async function maybeAutoSnapshot(pageId, userId) {
  if (!pageId) return null;
  try {
    const last = await one(
      `SELECT created_at FROM page_versions WHERE page_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [pageId]
    );
    if (last) {
      const ageMs = Date.now() - new Date(last.created_at).getTime();
      if (ageMs < AUTO_INTERVAL_MIN * 60 * 1000) return null;
    }
    return await createSnapshot(pageId, userId, 'auto');
  } catch (err) {
    console.warn('[page-versions] maybeAutoSnapshot failed:', err && err.message);
    return null;
  }
}

async function listVersions(pageId, limit) {
  return many(
    `SELECT pv.id, pv.label, pv.created_at, u.email AS author_email, u.name AS author_name,
            jsonb_array_length(pv.blocks_snapshot) AS block_count
     FROM page_versions pv
     LEFT JOIN users u ON u.id = pv.created_by
     WHERE pv.page_id = $1
     ORDER BY pv.created_at DESC
     LIMIT $2`,
    [pageId, Math.min(100, limit || 50)]
  );
}

async function getVersion(versionId) {
  return one(
    `SELECT id, page_id, label, blocks_snapshot, created_at FROM page_versions WHERE id = $1`,
    [versionId]
  );
}

module.exports = {
  AUTO_INTERVAL_MIN,
  captureBlocks,
  createSnapshot,
  maybeAutoSnapshot,
  listVersions,
  getVersion,
};
