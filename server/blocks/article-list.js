// Article listing.
//
// Reads articles at render time rather than storing copies of them, so a new
// post appears without anyone editing the block — which is the whole point of a
// listing. The operator chooses the filter and how many, not the contents.
//
// The card markup deliberately matches what ssr-detail.js already renders into
// the homepage's insights grid (.blog-card and its __media/__pill/__title/
// __excerpt/__byline children). Those classes are the ones styles.css actually
// styles; the .news-card family it also defines has no rules for the BEM
// children and no `display:grid` on its container, so rendering into that
// family would have converted a finished section into an unstyled column.

const imageRender = require('../services/image-render');

module.exports = {
  type: 'article_list',
  label: '文章列表',
  description: '按支柱/分类筛选的文章卡片，内容随发布自动更新',
  icon: 'list',

  schema: {
    eyebrow: { type: 'text', label: '眉标', max: 120 },
    title: { type: 'text', label: '标题', max: 200 },
    intro: { type: 'textarea', label: '引导语', max: 600 },
    pillar_slug: { type: 'text', label: '限定支柱页 slug（留空为全部）', max: 190 },
    limit: { type: 'number', label: '显示数量', default: 3 },
    more_text: { type: 'text', label: '底部链接文字', max: 120 },
    more_link: { type: 'url', label: '底部链接地址', max: 500 },
  },

  render(data, ctx) {
    const rows = data._resolved || [];
    // The block's own copy renders even with no articles yet. Returning early
    // would drop the heading an operator wrote, which reads as content loss.
    const heading = data.eyebrow || data.title || data.intro || data.more_text;
    if (!rows.length && !heading) return '';

    const fmt = (d) => {
      if (!d) return '';
      try {
        return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
      } catch (_) {
        return '';
      }
    };

    const cards = rows
      .map((a) => {
        const cover = a.cover_url || a.hero_image || '';
        const bg = cover
          ? ` style="${ctx.escAttr(imageRender.backgroundImageSet(cover, { width: 768 }))} background-size:cover; background-position:center;"`
          : '';
        const category = a.category_name || a.pillar_short_name || 'Article';
        const author = a.author_name || a.author || '';
        const date = fmt(a.published_at);
        const byline = [author, `${a.reading_minutes || 5} min`, date].filter(Boolean).join(' &middot; ');
        return `<a class="blog-card" href="/blog/${ctx.esc(a.slug)}">
        <div class="blog-card__media"${bg}></div>
        <div class="blog-card__body">
          <span class="blog-card__pill">${ctx.esc(category)}</span>
          <h3 class="blog-card__title">${ctx.esc(a.title)}</h3>
          <p class="blog-card__excerpt">${ctx.esc((a.excerpt || '').slice(0, 130))}</p>
          <div class="blog-card__byline">${byline}</div>
        </div>
      </a>`;
      })
      .join('\n      ');

    // The trailing "Browse all insights →" link. It is part of the section an
    // operator sees, so it belongs to the block rather than being left behind
    // in the page markup the block replaces.
    const moreHref = data.more_link ? ctx.safeUrl(data.more_link) : null;
    const more =
      data.more_text && moreHref
        ? `<div class="block__more"><a href="${ctx.esc(moreHref)}" class="news-link">${ctx.esc(data.more_text)} &rarr;</a></div>`
        : '';

    return `<section class="section section-grey block block--articles" data-block="article_list">
  <div class="section-inner" style="max-width: 1240px;">
    ${data.eyebrow ? `<span class="eyebrow">${ctx.esc(data.eyebrow)}</span>` : ''}
    ${data.title ? `<h2>${ctx.esc(data.title)}</h2>` : ''}
    ${data.intro ? `<p class="lead">${ctx.esc(data.intro)}</p>` : ''}
    ${rows.length ? `<div class="blog-grid" style="margin-top: 40px;">
      ${cards}
    </div>` : ''}
    ${more}
  </div>
</section>`;
  },

  async resolve(data, { many }) {
    const limit = Math.max(1, Math.min(24, Number(data.limit) || 3));
    const slug = String(data.pillar_slug || '').trim();
    const select = `SELECT a.slug, a.title, a.excerpt, a.cover_url, a.hero_image, a.author,
              a.reading_minutes, a.published_at,
              c.name AS category_name, p.short_name AS pillar_short_name,
              au.name AS author_name
         FROM articles a
         LEFT JOIN categories c ON c.id = a.category_id
         LEFT JOIN pillar_pages p ON p.id = a.pillar_id
         LEFT JOIN authors au ON au.id = a.author_id
        WHERE a.status = 'published'`;
    if (slug) {
      return many(
        `${select} AND p.slug = $1
         ORDER BY a.published_at DESC NULLS LAST, a.id DESC LIMIT $2`,
        [slug, limit]
      );
    }
    return many(
      `${select}
       ORDER BY a.published_at DESC NULLS LAST, a.id DESC LIMIT $1`,
      [limit]
    );
  },
};
