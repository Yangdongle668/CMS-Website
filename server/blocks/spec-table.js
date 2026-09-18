// Specification table.
//
// Rows are stored as arrays of cells, which is exactly how pillar_pages
// .spec_table already holds them ({headers: [], rows: [[]]}). The admin form
// takes a row as one comma-free line per cell using | as the separator, since a
// generated form cannot render a ragged grid.

module.exports = {
  type: 'spec_table',
  label: '规格表',
  description: '技术参数表格，表头 + 多行',
  icon: 'table',

  schema: {
    title: { type: 'text', label: '标题', max: 200 },
    headers: { type: 'text', label: '表头（用 | 分隔）', max: 500 },
    rows: {
      type: 'repeater',
      label: '数据行',
      max: 80,
      itemLabel: 'cells',
      fields: {
        cells: { type: 'text', label: '单元格（用 | 分隔）', max: 800, required: true },
      },
    },
  },

  render(data, ctx) {
    const split = (s) => String(s || '').split('|').map((x) => x.trim());
    const headers = data.headers ? split(data.headers).filter(Boolean) : [];
    const rows = (data.rows || []).map((r) => split(r && r.cells)).filter((r) => r.some(Boolean));
    if (!headers.length && !rows.length) return '';
    return `<section class="block block--spec" data-block="spec_table">
  <div class="block__inner">
    ${data.title ? `<h2 class="block__title">${ctx.esc(data.title)}</h2>` : ''}
    <table class="spec-table">
      ${headers.length ? `<thead><tr>${headers.map((h) => `<th>${ctx.esc(h)}</th>`).join('')}</tr></thead>` : ''}
      <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${ctx.esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>
</section>`;
  },
};
