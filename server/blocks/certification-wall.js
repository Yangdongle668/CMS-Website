// Certification chips (UN 38.3, IEC 62133, …).
// Mirrors pillar_pages.certifications: [{name, image}].

module.exports = {
  type: 'certification_wall',
  label: '认证墙',
  description: '认证标识列表',
  icon: 'award',

  schema: {
    title: { type: 'text', label: '标题', max: 200 },
    items: {
      type: 'repeater',
      label: '认证',
      min: 1,
      max: 30,
      itemLabel: 'name',
      fields: {
        name: { type: 'text', label: '名称', max: 120, required: true },
        image: { type: 'image', label: '标识图' },
      },
    },
  },

  render(data, ctx) {
    const items = (data.items || []).filter((c) => c && c.name);
    if (!items.length) return '';
    return `<section class="block block--certs" data-block="certification_wall">
  <div class="block__inner">
    ${data.title ? `<h2 class="block__title">${ctx.esc(data.title)}</h2>` : ''}
    <div class="cert-wall">
      ${items.map((c) => `<span class="cert-chip">${ctx.esc(c.name)}</span>`).join('\n      ')}
    </div>
  </div>
</section>`;
  },
};
