// FAQ accordion.
//
// This is the block that makes the case for the whole typed-registry design.
// Because the server knows this section is a list of questions and answers, it
// can emit FAQPage structured data without anyone entering it by hand. A
// free-form page builder producing nested divs cannot, which is why sites built
// that way tend to lose their rich results.

const { sanitizeHtml, toPlainText } = require('../utils/html-sanitize');

module.exports = {
  type: 'faq',
  label: 'FAQ 手风琴',
  description: '问答列表，自动生成 FAQPage 结构化数据',
  icon: 'help-circle',

  schema: {
    title: { type: 'text', label: '标题', max: 120, default: 'Frequently asked questions' },
    intro: { type: 'textarea', label: '引导语（可选）', max: 400 },
    items: {
      type: 'repeater',
      label: '问答',
      min: 1,
      max: 30,
      itemLabel: 'q',
      fields: {
        q: { type: 'text', label: '问题', max: 300, required: true },
        a: { type: 'richtext', label: '回答', max: 4000, required: true },
      },
    },
  },

  render(data, ctx) {
    const items = (data.items || []).filter((it) => it && it.q && it.a);
    if (!items.length) return '';
    const heading = data.title ? `<h2 class="faq__title">${ctx.esc(data.title)}</h2>` : '';
    const intro = data.intro ? `<p class="faq__intro">${ctx.esc(data.intro)}</p>` : '';
    return `<section class="block block--faq faq" data-block="faq">
  ${heading}
  ${intro}
  <div class="faq__list">
    ${items
      .map(
        (it) => `<details class="faq__item">
      <summary class="faq__q">${ctx.esc(it.q)}</summary>
      <div class="faq__a">${sanitizeHtml(it.a)}</div>
    </details>`
      )
      .join('\n    ')}
  </div>
</section>`;
  },

  // Answers go in as plain text: schema.org expects the answer body, and
  // leaving markup in produces warnings in Search Console.
  jsonLd(data) {
    const items = (data.items || []).filter((it) => it && it.q && it.a);
    if (!items.length) return null;
    return {
      '@type': 'FAQPage',
      mainEntity: items.map((it) => ({
        '@type': 'Question',
        name: toPlainText(it.q),
        acceptedAnswer: { '@type': 'Answer', text: toPlainText(it.a) },
      })),
    };
  },
};
