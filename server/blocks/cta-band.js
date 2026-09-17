// Call-to-action band.
//
// Added as the fourth block type to check the claim the registry makes: this
// file is the entire change. No migration (page_blocks.data is JSONB), no
// admin page (the form is generated from `schema`), no route, no CSS surgery.

module.exports = {
  type: 'cta_band',
  label: 'CTA 行动条',
  description: '一句话 + 按钮，用于章节之间的转化点',
  icon: 'megaphone',

  schema: {
    heading: { type: 'text', label: '标题', max: 160, required: true },
    body: { type: 'textarea', label: '说明文字', max: 400 },
    cta_text: { type: 'text', label: '按钮文字', max: 60, required: true },
    cta_link: { type: 'url', label: '按钮链接', max: 500, required: true },
    tone: {
      type: 'select',
      label: '配色',
      options: [
        { value: 'accent', label: '琥珀（强调）' },
        { value: 'dark', label: '深色' },
      ],
      default: 'accent',
    },
  },

  render(data, ctx) {
    if (!data.heading || !data.cta_text || !data.cta_link) return '';
    const href = ctx.safeUrl(data.cta_link);
    if (!href) return '';
    const tone = data.tone === 'dark' ? ' block--cta-dark' : ' block--cta-accent';
    return `<section class="block block--cta${tone}" data-block="cta_band">
  <div class="block__inner block__inner--row">
    <div>
      <h2 class="cta__heading">${ctx.esc(data.heading)}</h2>
      ${data.body ? `<p class="cta__body">${ctx.esc(data.body)}</p>` : ''}
    </div>
    <a class="btn btn-primary" href="${ctx.escAttr(href)}">${ctx.esc(data.cta_text)}</a>
  </div>
</section>`;
  },

  jsonLd() {
    return null;
  },
};
