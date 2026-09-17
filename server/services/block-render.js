// Renders a page's blocks server-side.
//
// Server-side is the point. The editing layer this replaces patched already-
// rendered HTML — by CSS selector in the browser, and by global string match on
// the server — which is why an operator's edit silently vanished when a
// developer touched the markup, and why "Learn More" could not be changed on
// one page without changing it on twelve. Blocks render from data, so the
// output is whatever the data says and nothing else.

const blocks = require('../blocks');
const { many } = require('../db/client');
const { safeUrl } = require('../utils/html-sanitize');

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

// For values going into an attribute that already contains quotes of its own,
// such as a style built by imageRender.
function escAttr(s) {
  return String(s == null ? '' : s).replace(/"/g, '&quot;');
}

// The context every block's render() receives. Passing the helpers in rather
// than letting each block require them keeps a block file to its own concern
// and means the escaping can be changed in one place.
function makeContext(extra) {
  return { esc, escAttr, safeUrl, ...extra };
}

async function loadBlocks(pageId, { includeDrafts = false } = {}) {
  if (!pageId) return [];
  return many(
    `SELECT id, type, sort_order, data, status
     FROM page_blocks
     WHERE page_id = $1 ${includeDrafts ? '' : "AND status = 'published'"}
     ORDER BY sort_order, id`,
    [pageId]
  );
}

// Renders rows to { html, jsonLd, rendered, skipped }.
//
// A row whose type is not in the registry is skipped, not fatal: page_blocks
// deliberately has no foreign key to the registry, so removing a block file
// must degrade to "that section disappears", never to "the page 500s".
function renderRows(rows, extraCtx) {
  const ctx = makeContext(extraCtx);
  const html = [];
  const jsonLd = [];
  let rendered = 0;
  const skipped = [];

  for (const row of rows || []) {
    const def = blocks.get(row.type);
    if (!def) {
      skipped.push({ id: row.id, type: row.type, reason: 'unknown type' });
      continue;
    }
    const data = row.data || {};
    try {
      const out = def.render(data, ctx);
      if (out && out.trim()) {
        html.push(out);
        rendered++;
      }
    } catch (err) {
      // One broken block must not take the page with it.
      console.error('[blocks] render failed for %s#%s: %s', row.type, row.id, err && err.message);
      skipped.push({ id: row.id, type: row.type, reason: 'render threw' });
      continue;
    }
    if (typeof def.jsonLd === 'function') {
      try {
        const ld = def.jsonLd(data, ctx);
        if (ld) jsonLd.push(ld);
      } catch (err) {
        console.error('[blocks] jsonLd failed for %s#%s: %s', row.type, row.id, err && err.message);
      }
    }
  }

  return { html: html.join('\n'), jsonLd, rendered, skipped };
}

async function renderPage(pageId, opts = {}) {
  const rows = await loadBlocks(pageId, opts);
  return renderRows(rows, opts.ctx);
}

// The <script type="application/ld+json"> tags for a page's blocks. Each block
// gets its own tag rather than one merged graph: a malformed entry then costs
// that block's rich result instead of the whole page's.
function jsonLdTags(entries, canonicalBase) {
  return (entries || [])
    .map((entry) => {
      const doc = { '@context': 'https://schema.org', ...entry };
      if (canonicalBase && !doc['@id']) doc['@id'] = canonicalBase;
      const json = JSON.stringify(doc).replace(/<\//g, '<\\/');
      return `<script type="application/ld+json" data-jsonld="block">${json}</script>`;
    })
    .join('\n');
}

module.exports = { renderPage, renderRows, loadBlocks, jsonLdTags, esc, escAttr };
