// Prose section.
//
// The body is operator-authored HTML and is sanitised on the way out, not just
// on the way in: a row written before a tag was removed from the allowlist,
// or one restored from a backup, still renders inert.

const { sanitizeHtml } = require('../utils/html-sanitize');

module.exports = {
  type: 'rich_text',
  label: '正文内容',
  description: '标题 + 富文本段落',
  icon: 'type',

  schema: {
    title: { type: 'text', label: '小节标题', max: 200 },
    body: { type: 'richtext', label: '正文', max: 20000, required: true },
    width: {
      type: 'select',
      label: '宽度',
      options: ['prose', 'wide'],
      default: 'prose',
    },
  },

  render(data, ctx) {
    const body = sanitizeHtml(data.body);
    if (!body.trim()) return '';
    const cls = data.width === 'wide' ? ' block--wide' : '';
    return `<section class="block block--rich-text${cls}" data-block="rich_text">
  <div class="block__inner">
    ${data.title ? `<h2 class="block__title">${ctx.esc(data.title)}</h2>` : ''}
    <div class="block__body">${body}</div>
  </div>
</section>`;
  },

  jsonLd() {
    return null;
  },
};
