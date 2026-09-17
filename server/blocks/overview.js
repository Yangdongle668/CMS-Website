// Section intro: a heading plus a paragraph.
//
// Maps pillar_pages.overview, which is {title, body} — the simplest of the nine
// and the one that shows the migration is a straight copy rather than a
// reshaping exercise.

const { sanitizeHtml } = require('../utils/html-sanitize');

module.exports = {
  type: 'overview',
  label: '概述',
  description: '小节标题 + 说明段落',
  icon: 'align-left',

  schema: {
    title: { type: 'text', label: '标题', max: 200 },
    body: { type: 'richtext', label: '正文', max: 8000, required: true },
  },

  render(data, ctx) {
    const body = sanitizeHtml(data.body);
    if (!body.trim()) return '';
    return `<section class="block block--overview" data-block="overview">
  <div class="block__inner">
    ${data.title ? `<h2 class="block__title">${ctx.esc(data.title)}</h2>` : ''}
    <div class="block__body">${body}</div>
  </div>
</section>`;
  },
};
