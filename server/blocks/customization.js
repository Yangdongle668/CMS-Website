// Numbered customisation options — the "what can be specified" list.
// Mirrors pillar_pages.customization: {enabled, items: [{label, value}]}.

module.exports = {
  type: 'customization',
  label: '定制选项',
  description: '带编号的参数清单',
  icon: 'sliders',

  schema: {
    title: { type: 'text', label: '标题', max: 200 },
    items: {
      type: 'repeater',
      label: '选项',
      min: 1,
      max: 24,
      itemLabel: 'label',
      fields: {
        label: { type: 'text', label: '项目', max: 160, required: true },
        value: { type: 'textarea', label: '可选范围', max: 600 },
      },
    },
  },

  render(data, ctx) {
    const items = (data.items || []).filter((c) => c && c.label);
    if (!items.length) return '';
    return `<section class="block block--custom" data-block="customization">
  <div class="block__inner">
    ${data.title ? `<h2 class="block__title">${ctx.esc(data.title)}</h2>` : ''}
    <div class="cust-grid">
      ${items
        .map(
          (c, i) => `<div class="cust-item">
        <span class="cust-item__num">${String(i + 1).padStart(2, '0')}</span>
        <p class="cust-item__label">${ctx.esc(c.label)}</p>
        <p class="cust-item__value">${ctx.esc(c.value || '')}</p>
      </div>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
  },
};
