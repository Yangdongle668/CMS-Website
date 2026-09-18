// Application / industry cards.
//
// Stores application slugs, not copies of their names and images: the
// applications table stays the one source of truth, so renaming an application
// updates every pillar that links to it. That is also why render() is async —
// it is the one block so far that reads other rows.

const imageRender = require('../services/image-render');

module.exports = {
  type: 'application_grid',
  label: '应用行业',
  description: '按 slug 引用应用行业，标题与配图始终跟随原表',
  icon: 'layers',

  schema: {
    title: { type: 'text', label: '标题', max: 200 },
    slugs: { type: 'text', label: '行业 slug（用 | 分隔）', max: 600, required: true },
  },

  // Synchronous render, using rows the loader attached. See resolve() below.
  render(data, ctx) {
    const rows = (data._resolved || []).filter(Boolean);
    if (!rows.length) return '';
    return `<section class="block block--apps" data-block="application_grid">
  <div class="block__inner">
    ${data.title ? `<h2 class="block__title">${ctx.esc(data.title)}</h2>` : ''}
    <div class="app-grid">
      ${rows
        .map((a) => {
          const bg = a.cover_url
            ? ` style="${ctx.escAttr(imageRender.backgroundImageSet(a.cover_url, { width: 768 }))} background-size:cover; background-position:center;"`
            : '';
          return `<a class="app-card" href="/applications/${ctx.esc(a.slug)}.html"${bg}>
        <div class="app-overlay"><h3>${ctx.esc(a.name)}</h3><p>${ctx.esc((a.summary || '').slice(0, 110))}</p></div>
      </a>`;
        })
        .join('\n      ')}
    </div>
  </div>
</section>`;
  },

  // Blocks that need other rows declare a resolve(): the renderer calls it
  // before render() and hands the result back on data._resolved. Doing the
  // lookup here rather than inside render() keeps render() synchronous and
  // pure, which is what makes preview and tests cheap.
  async resolve(data, { many }) {
    const slugs = String(data.slugs || '')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24);
    if (!slugs.length) return [];
    const rows = await many(
      `SELECT slug, name, summary, cover_url FROM applications
       WHERE slug = ANY($1::text[]) AND status = 'published'`,
      [slugs]
    );
    // Preserve the operator's order rather than the database's.
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    return slugs.map((s) => bySlug.get(s)).filter(Boolean);
  },
};
