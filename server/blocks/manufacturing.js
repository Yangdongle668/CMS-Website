// Manufacturing / capability section: prose beside an image.
// Mirrors pillar_pages.manufacturing: {title, body, image}.

const { sanitizeHtml } = require('../utils/html-sanitize');
const imageRender = require('../services/image-render');

module.exports = {
  type: 'manufacturing',
  label: '制造能力',
  description: '产线/工艺说明 + 配图',
  icon: 'factory',

  schema: {
    title: { type: 'text', label: '标题', max: 200 },
    body: { type: 'richtext', label: '正文', max: 8000, required: true },
    image: { type: 'image', label: '配图' },
  },

  render(data, ctx) {
    const body = sanitizeHtml(data.body);
    if (!body.trim()) return '';
    // A mid-page image is below the fold, so it takes a width hint rather than
    // the widest variant the way a hero does.
    const media = data.image
      ? `<div class="mfg__media" style="${ctx.escAttr(
          imageRender.backgroundImageSet(data.image, { width: 768 })
        )} background-size:cover; background-position:center;"></div>`
      : '';
    return `<section class="block block--mfg" data-block="manufacturing">
  <div class="block__inner block__inner--split">
    <div class="mfg__text">
      ${data.title ? `<h2 class="block__title">${ctx.esc(data.title)}</h2>` : ''}
      <div class="block__body">${body}</div>
    </div>
    ${media}
  </div>
</section>`;
  },
};
