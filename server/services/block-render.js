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

// Owners are polymorphic: a block belongs to a page or to a pillar, and the
// column is chosen from a fixed map rather than interpolated, so an owner type
// can never reach the SQL as caller-supplied text.
const OWNER_COLUMNS = { page: 'page_id', pillar: 'pillar_id' };

function ownerColumn(ownerType) {
  return OWNER_COLUMNS[String(ownerType || 'page')] || null;
}

async function loadBlocks(ownerId, { includeDrafts = false, owner = 'page' } = {}) {
  const column = ownerColumn(owner);
  if (!ownerId || !column) return [];
  return many(
    `SELECT id, type, sort_order, data, status
     FROM page_blocks
     WHERE ${column} = $1 ${includeDrafts ? '' : "AND status = 'published'"}
     ORDER BY sort_order, id`,
    [ownerId]
  );
}

// Renders rows to { html, jsonLd, rendered, skipped }.
//
// A row whose type is not in the registry is skipped, not fatal: page_blocks
// deliberately has no foreign key to the registry, so removing a block file
// must degrade to "that section disappears", never to "the page 500s".
// Stamps a rendered block with the row it came from, so the editor's preview
// can map a click on the page back to the block that produced it.
//
// Only in editing mode, and only ever added to the opening tag a block already
// emits — nothing is wrapped. Wrapping would change the DOM the site's own CSS
// selects against (`.section + .section`, `:first-child`, the grid rules that
// count children), so the preview would stop looking like the page, which
// defeats the point of having one.
function tagForEditor(html, row) {
  return html.replace(
    /^(\s*<[a-zA-Z][a-zA-Z0-9-]*)/,
    `$1 data-block-id="${row.id}" data-block-type="${esc(row.type)}"`
  );
}

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
        html.push(ctx.editing ? tagForEditor(out, row) : out);
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

// Some blocks need rows other than their own — application_grid stores slugs
// rather than copies of the applications' names and images, so that renaming an
// application updates every pillar linking to it. Those blocks declare an async
// resolve(); it runs here, before rendering, and its result is handed to
// render() on data._resolved.
//
// Keeping the lookup out of render() is deliberate: render() stays synchronous
// and pure, which is what makes the preview endpoint and the tests cheap, and
// means one block's slow query cannot deadlock the others.
async function resolveRows(rows) {
  const jobs = [];
  for (const row of rows || []) {
    const def = blocks.get(row.type);
    if (!def || typeof def.resolve !== 'function') continue;
    row.data = row.data || {};
    jobs.push(
      def
        .resolve(row.data, { many })
        .then((resolved) => {
          row.data._resolved = resolved;
        })
        .catch((err) => {
          // A failed lookup costs that block its content, not the page.
          console.error('[blocks] resolve failed for %s#%s: %s', row.type, row.id, err && err.message);
          row.data._resolved = [];
        })
    );
  }
  if (jobs.length) await Promise.all(jobs);
  return rows;
}

async function renderPage(ownerId, opts = {}) {
  const rows = await resolveRows(await loadBlocks(ownerId, opts));
  return renderRows(rows, { ...opts.ctx, editing: Boolean(opts.editing) });
}

// The <script type="application/ld+json"> tags for a page's blocks. Each block
// gets its own tag rather than one merged graph: a malformed entry then costs
// that block's rich result instead of the whole page's.
// Drops entries whose @type the page already carries.
//
// A pillar's own SSR graph already emits FAQPage from pillar_pages.faq, so once
// its FAQ section is a block the page would carry the type twice — and a
// duplicate FAQPage is a Search Console warning, on a site whose whole thesis
// is structured data. The page's existing markup wins; a block only adds a type
// that is not there yet.
function dropDuplicateTypes(entries, html) {
  if (!html) return entries || [];
  return (entries || []).filter((entry) => {
    const type = entry && entry['@type'];
    if (!type) return true;
    return !html.includes(`"@type":"${type}"`) && !html.includes(`"@type": "${type}"`);
  });
}

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

module.exports = {
  renderPage, renderRows, resolveRows, loadBlocks, jsonLdTags, dropDuplicateTypes,
  esc, escAttr, ownerColumn, OWNER_COLUMNS,
};
