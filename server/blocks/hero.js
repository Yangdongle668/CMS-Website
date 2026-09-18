// Page hero.
//
// The background goes through imageRender, so a hero picks up the AVIF/WebP
// variants that scripts/optimize-images.js and the upload pipeline produce —
// the same helper the SSR middleware uses, rather than a second code path that
// would have to be kept in step.

const imageRender = require('../services/image-render');

module.exports = {
  type: 'hero',
  label: '页面 Hero',
  description: '大标题 + 副标题 + 背景图 + 行动按钮',
  icon: 'layout',

  schema: {
    eyebrow: { type: 'text', label: '眉标', max: 120 },
    title: { type: 'text', label: '主标题', max: 200, required: true },
    subtitle: { type: 'textarea', label: '副标题', max: 600 },
    image: { type: 'image', label: '背景图' },
    align: {
      type: 'select',
      label: '对齐',
      options: ['left', 'center'],
      default: 'left',
    },
    cta_text: { type: 'text', label: '主按钮文字', max: 60 },
    cta_link: { type: 'url', label: '主按钮链接', max: 500 },
    cta2_text: { type: 'text', label: '次按钮文字', max: 60 },
    cta2_link: { type: 'url', label: '次按钮链接', max: 500 },
  },

  render(data, ctx) {
    if (!data.title) return '';
    // The hero is above the fold, so its background is the LCP candidate: it
    // takes the widest variant rather than a size hint.
    const bg = data.image ? imageRender.backgroundImageSet(data.image) : '';
    const style = bg ? ` style="${ctx.escAttr(bg)} background-size:cover; background-position:center;"` : '';
    const cls = data.align === 'center' ? ' block--hero-center' : '';

    const cta = (text, link, variant) =>
      text && link
        ? `<a class="btn ${variant}" href="${ctx.escAttr(ctx.safeUrl(link) || '#')}">${ctx.esc(text)}</a>`
        : '';

    const actions = [cta(data.cta_text, data.cta_link, 'btn-primary'), cta(data.cta2_text, data.cta2_link, 'btn-secondary')]
      .filter(Boolean)
      .join('\n      ');

    return `<section class="block block--hero${cls} page-hero" data-block="hero"${style}>
  <div class="block__inner">
    ${data.eyebrow ? `<p class="hero__eyebrow">${ctx.esc(data.eyebrow)}</p>` : ''}
    <h1 class="hero__title">${ctx.esc(data.title)}</h1>
    ${data.subtitle ? `<p class="hero__subtitle">${ctx.esc(data.subtitle)}</p>` : ''}
    ${actions ? `<div class="hero__actions">\n      ${actions}\n    </div>` : ''}
  </div>
</section>`;
  },

  jsonLd() {
    return null; // a hero carries no structured data of its own
  },
};
