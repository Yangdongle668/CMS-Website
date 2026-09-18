// Product-variant grid.
//
// Emits the .feat-item markup the pillar template already styles, so a migrated
// pillar looks the same as it did before rather than merely equivalent.

module.exports = {
  type: 'variant_grid',
  label: '型号网格',
  description: '产品型号/变体的卡片网格',
  icon: 'grid',

  schema: {
    title: { type: 'text', label: '标题', max: 200 },
    items: {
      type: 'repeater',
      label: '型号',
      min: 1,
      max: 24,
      itemLabel: 'name',
      fields: {
        name: { type: 'text', label: '名称', max: 160, required: true },
        summary: { type: 'textarea', label: '简介', max: 600 },
        image: { type: 'image', label: '图片' },
      },
    },
  },

  render(data, ctx) {
    const items = (data.items || []).filter((v) => v && v.name);
    if (!items.length) return '';
    return `<section class="block block--variants" data-block="variant_grid">
  <div class="block__inner">
    ${data.title ? `<h2 class="block__title">${ctx.esc(data.title)}</h2>` : ''}
    <div class="feat-grid">
      ${items
        .map(
          (v) => `<div class="feat-item">
        <div class="feat-icon">${ctx.esc((v.name || '?').charAt(0))}</div>
        <h3>${ctx.esc(v.name)}</h3>
        <p>${ctx.esc(v.summary || '')}</p>
      </div>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
  },
};
