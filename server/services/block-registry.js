// =====================================================================
// Block registry — single source of truth for every block type.
//
// Each entry exposes:
//   id          — DB block_type, also the form-builder key
//   label       — what the admin sees in the block library
//   icon        — single-character glyph for the library tile
//   description — one-line help in the admin
//   defaultContent() — what to fill in when a new block of this type is added
//   schema      — admin-form field descriptors (drives the right-pane form)
//   render(content, ctx) — server-side renderer: returns HTML string
//
// Adding a 13th block type = one entry here. No DB migration, no frontend
// changes required — the admin form, library and SSR all read this map.
// =====================================================================

const { escapeHtml } = require('../utils/validate');

function esc(s) { return escapeHtml(s == null ? '' : String(s)); }
function attr(s) { return esc(s).replace(/"/g, '&quot;'); }

// Tiny markdown-ish to HTML (bold + line breaks) — for fields like
// hero subtitles where admins want quick formatting without WYSIWYG.
function lineBreaks(s) {
  return esc(s).replace(/\r?\n/g, '<br>');
}

// Picture tag with srcset for media-library image URLs that have variants
// recorded. For external URLs (e.g. Unsplash) or images uploaded before
// Sprint 1 image processing, fall back to a plain <img>.
function pictureTag(url, alt, width, height, sizesAttr, loading) {
  if (!url) return '';
  const safeAlt = attr(alt || '');
  const wh = width && height ? ` width="${width}" height="${height}"` : '';
  const ld = loading ? ` loading="${loading}"` : ' loading="lazy"';
  return `<img src="${attr(url)}" alt="${safeAlt}"${wh}${ld} decoding="async">`;
}

// ----- field descriptors used by the admin form generator -----
// Supported types: 'text', 'textarea', 'image', 'url', 'select', 'number',
// 'checkbox', 'repeater' (nested fields)
function F(type, name, label, opts) {
  return Object.assign({ type, name, label }, opts || {});
}

// =====================================================================
// 12 standard B2B blocks
// =====================================================================
const BLOCKS = {

  // -------- 1. Hero Banner --------
  hero_banner: {
    id: 'hero_banner',
    label: 'Hero Banner',
    icon: '◆',
    description: '大图 + 标题 + 副标题 + CTA — 页面顶部首屏',
    defaultContent: () => ({
      eyebrow: '',
      title: 'Headline goes here',
      subtitle: 'A 1-2 sentence subtitle that hooks the visitor.',
      image_url: '',
      cta_text: 'Get a Quote',
      cta_link: '/quote.html',
      secondary_cta_text: '',
      secondary_cta_link: '',
      align: 'left',
    }),
    schema: [
      F('text', 'eyebrow', 'Eyebrow（上方小字）', { max: 120 }),
      F('text', 'title', 'Headline', { max: 200, required: true }),
      F('textarea', 'subtitle', 'Subtitle', { max: 500 }),
      F('image', 'image_url', '背景/主图', { hint: '/uploads/... 或外链' }),
      F('text', 'cta_text', '主按钮文字', { max: 60 }),
      F('url', 'cta_link', '主按钮链接', { max: 255 }),
      F('text', 'secondary_cta_text', '次按钮文字（可选）', { max: 60 }),
      F('url', 'secondary_cta_link', '次按钮链接', { max: 255 }),
      F('select', 'align', '对齐', { options: ['left', 'center', 'right'] }),
    ],
    render(c) {
      const align = ['left', 'center', 'right'].includes(c.align) ? c.align : 'left';
      const bg = c.image_url ? `style="background-image:url('${attr(c.image_url)}');"` : '';
      const eyebrow = `<div class="block-hero__eyebrow"${edit('eyebrow')}${c.eyebrow ? '' : ' data-empty="1"'}>${esc(c.eyebrow || '')}</div>`;
      const subtitle = `<p class="block-hero__sub"${editRich('subtitle')}${c.subtitle ? '' : ' data-empty="1"'}>${richHtml(c.subtitle || '')}</p>`;
      const cta = c.cta_link
        ? `<a class="block-hero__cta" href="${attr(c.cta_link)}"${edit('cta_text')} data-edit-link-field="cta_link">${esc(c.cta_text || 'Get a Quote')}</a>` : '';
      const cta2 = c.secondary_cta_link
        ? `<a class="block-hero__cta block-hero__cta--secondary" href="${attr(c.secondary_cta_link)}"${edit('secondary_cta_text')} data-edit-link-field="secondary_cta_link">${esc(c.secondary_cta_text || 'Learn more')}</a>` : '';
      return `
        <section class="block block-hero block-hero--${align}" data-edit-bg="image_url" ${bg}>
          <div class="block-hero__overlay"></div>
          <div class="block-hero__inner">
            ${eyebrow}
            <h1 class="block-hero__title"${edit('title')}>${esc(c.title || '')}</h1>
            ${subtitle}
            <div class="block-hero__ctas">${cta}${cta2}</div>
          </div>
        </section>`;
    },
  },

  // -------- 2. Value Props (3-4 column icon grid) --------
  value_props: {
    id: 'value_props',
    label: 'Value Props',
    icon: '☷',
    description: '3-4 列价值主张（图标+标题+描述）— 建立信任',
    defaultContent: () => ({
      title: 'Why choose us',
      columns: [
        { icon: '✓', title: 'Certified', text: 'IATF 16949 / IEC 62133 certified production lines.' },
        { icon: '⚙', title: 'In-house tooling', text: 'Custom mold development under one roof.' },
        { icon: '⏱', title: '7-day samples', text: 'Engineering samples shipped within one week.' },
      ],
    }),
    schema: [
      F('text', 'title', '区块标题', { max: 120 }),
      F('repeater', 'columns', '价值条目（2-4 项推荐）', {
        fields: [
          F('text', 'icon', '图标字符', { max: 4 }),
          F('text', 'title', '标题', { max: 80 }),
          F('textarea', 'text', '描述', { max: 300 }),
        ],
      }),
    ],
    render(c) {
      const cols = Array.isArray(c.columns) ? c.columns : [];
      const items = cols.map((v, i) => `
        <div class="block-vp__item" data-edit-path="columns.${i}">
          <div class="block-vp__icon"${edit('icon')}>${esc(v.icon || '')}</div>
          <h3 class="block-vp__title"${edit('title')}>${esc(v.title || '')}</h3>
          <p class="block-vp__text"${edit('text')}>${lineBreaks(v.text || '')}</p>
        </div>`).join('');
      return `
        <section class="block block-vp">
          <div class="block-vp__inner">
            <h2 class="block-vp__heading"${edit('title')}>${esc(c.title || '')}</h2>
            <div class="block-vp__grid block-vp__grid--${cols.length || 3}">${items}</div>
          </div>
        </section>`;
    },
  },

  // -------- 3. Product Grid (auto-pulls from products table) --------
  product_grid: {
    id: 'product_grid',
    label: 'Product Grid',
    icon: '▣',
    description: '产品卡片网格 — 从 products 表自动拉取',
    defaultContent: () => ({
      title: 'Our Products',
      subtitle: '',
      source: 'all',        // all | pillar
      pillar_slug: '',
      limit: 6,
      columns: 3,
    }),
    schema: [
      F('text', 'title', '区块标题', { max: 120 }),
      F('textarea', 'subtitle', '副标题', { max: 300 }),
      F('select', 'source', '来源', { options: ['all', 'pillar'] }),
      F('text', 'pillar_slug', 'Pillar slug（如果 source=pillar）', { max: 190 }),
      F('number', 'limit', '最多显示几个', { min: 1, max: 24 }),
      F('number', 'columns', '列数', { min: 2, max: 4 }),
    ],
    async render(c, ctx) {
      const limit = Math.min(24, Math.max(1, parseInt(c.limit || 6, 10)));
      const cols = Math.min(4, Math.max(2, parseInt(c.columns || 3, 10)));
      let rows = [];
      try {
        const { many } = require('../db/client');
        if (c.source === 'pillar' && c.pillar_slug) {
          rows = await many(
            `SELECT p.slug, p.name, p.tagline, p.cover_url FROM products p
             JOIN pillar_pages pp ON pp.id = p.pillar_id
             WHERE p.status='published' AND pp.slug = $1
             ORDER BY p.sort_order, p.id LIMIT $2`,
            [c.pillar_slug, limit]
          );
        } else {
          rows = await many(
            `SELECT slug, name, tagline, cover_url FROM products
             WHERE status='published' ORDER BY sort_order, id LIMIT $1`,
            [limit]
          );
        }
      } catch (_) { /* DB unavailable — render empty grid */ }
      const cards = rows.map((p) => `
        <a class="block-pg__card" href="/products/${attr(p.slug)}">
          ${p.cover_url ? `<div class="block-pg__cover">${pictureTag(p.cover_url, p.name, 0, 0, '', 'lazy')}</div>` : ''}
          <h3 class="block-pg__name">${esc(p.name)}</h3>
          ${p.tagline ? `<p class="block-pg__tagline">${esc(p.tagline)}</p>` : ''}
        </a>`).join('');
      return `
        <section class="block block-pg">
          <div class="block-pg__inner">
            <h2 class="block-pg__heading"${edit('title')}>${esc(c.title || '')}</h2>
            <p class="block-pg__sub"${editRich('subtitle')}${c.subtitle ? '' : ' data-empty="1"'}>${richHtml(c.subtitle || '')}</p>
            <div class="block-pg__grid block-pg__grid--${cols}">${cards || '<p class="block-pg__empty">No products configured yet.</p>'}</div>
          </div>
        </section>`;
    },
  },

  // -------- 4. Logo Wall --------
  logo_wall: {
    id: 'logo_wall',
    label: 'Logo Wall',
    icon: '⊞',
    description: '客户/认证 logo 墙 — 信任背书',
    defaultContent: () => ({
      title: 'Trusted by',
      logos: [
        { alt: 'Logo 1', src: '' },
        { alt: 'Logo 2', src: '' },
        { alt: 'Logo 3', src: '' },
        { alt: 'Logo 4', src: '' },
      ],
    }),
    schema: [
      F('text', 'title', '区块标题', { max: 120 }),
      F('repeater', 'logos', 'Logo 列表', {
        fields: [
          F('text', 'alt', '描述', { max: 120 }),
          F('image', 'src', '图片', {}),
        ],
      }),
    ],
    render(c) {
      const logos = (Array.isArray(c.logos) ? c.logos : [])
        .filter((l) => l.src)
        .map((l) => `<div class="block-lw__cell"><img src="${attr(l.src)}" alt="${attr(l.alt || '')}" loading="lazy" decoding="async"></div>`)
        .join('');
      return `
        <section class="block block-lw">
          <div class="block-lw__inner">
            <div class="block-lw__heading"${edit('title')}>${esc(c.title || '')}</div>
            <div class="block-lw__grid">${logos}</div>
          </div>
        </section>`;
    },
  },

  // -------- 5. Spec Table --------
  spec_table: {
    id: 'spec_table',
    label: 'Spec Table',
    icon: '⊟',
    description: '规格参数表',
    defaultContent: () => ({
      title: 'Specifications',
      headers: ['Parameter', 'Value'],
      rows: [
        ['Capacity', '5000 mAh'],
        ['Voltage', '3.7 V'],
        ['Cycle life', '≥ 500 cycles @ 80% capacity'],
      ],
    }),
    schema: [
      F('text', 'title', '区块标题', { max: 120 }),
      F('table', 'rows', '表格数据', { headersKey: 'headers' }),
    ],
    render(c) {
      const headers = Array.isArray(c.headers) ? c.headers : [];
      const rows = Array.isArray(c.rows) ? c.rows : [];
      const thead = headers.length ? `<thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>` : '';
      const tbody = rows.map((r) => `<tr>${(r || []).map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('');
      return `
        <section class="block block-st">
          <div class="block-st__inner">
            <h2 class="block-st__heading"${edit('title')}>${esc(c.title || '')}</h2>
            <div class="block-st__wrap">
              <table class="block-st__table">${thead}<tbody>${tbody}</tbody></table>
            </div>
          </div>
        </section>`;
    },
  },

  // -------- 6. Application Grid (auto from applications table) --------
  application_grid: {
    id: 'application_grid',
    label: 'Application Grid',
    icon: '◫',
    description: '应用行业卡片 — 自动从 applications 表拉取',
    defaultContent: () => ({
      title: 'Industries we serve',
      limit: 8,
      columns: 4,
    }),
    schema: [
      F('text', 'title', '区块标题', { max: 120 }),
      F('number', 'limit', '最多显示几个', { min: 1, max: 16 }),
      F('number', 'columns', '列数', { min: 2, max: 4 }),
    ],
    async render(c) {
      const limit = Math.min(16, Math.max(1, parseInt(c.limit || 8, 10)));
      const cols = Math.min(4, Math.max(2, parseInt(c.columns || 4, 10)));
      let rows = [];
      try {
        const { many } = require('../db/client');
        rows = await many(
          `SELECT slug, name, icon, summary, cover_url FROM applications
           WHERE status='published' ORDER BY sort_order, id LIMIT $1`,
          [limit]
        );
      } catch (_) {}
      const cards = rows.map((a) => `
        <a class="block-ag__card" href="/applications/${attr(a.slug)}">
          ${a.cover_url ? `<div class="block-ag__cover" style="background-image:url('${attr(a.cover_url)}');"></div>` : `<div class="block-ag__icon">${esc(a.icon || '◆')}</div>`}
          <div class="block-ag__name">${esc(a.name)}</div>
          ${a.summary ? `<div class="block-ag__summary">${esc(a.summary)}</div>` : ''}
        </a>`).join('');
      return `
        <section class="block block-ag">
          <div class="block-ag__inner">
            <h2 class="block-ag__heading"${edit('title')}>${esc(c.title || '')}</h2>
            <div class="block-ag__grid block-ag__grid--${cols}">${cards || '<p>No applications configured.</p>'}</div>
          </div>
        </section>`;
    },
  },

  // -------- 7. Factory Showcase --------
  factory_showcase: {
    id: 'factory_showcase',
    label: 'Factory Showcase',
    icon: '☖',
    description: '工厂图文交替展示',
    defaultContent: () => ({
      title: 'Inside our factory',
      sections: [
        { image: '', title: 'IATF 16949 production line', text: 'Class 10000 clean rooms, AGV-fed assembly.', align: 'left' },
        { image: '', title: 'In-house testing lab', text: 'Cycling chambers, drop-test rigs, IP67/68 chambers.', align: 'right' },
      ],
    }),
    schema: [
      F('text', 'title', '区块标题', { max: 120 }),
      F('repeater', 'sections', '图文条目', {
        fields: [
          F('image', 'image', '图片', {}),
          F('text', 'title', '标题', { max: 120 }),
          F('textarea', 'text', '描述', { max: 500 }),
          F('select', 'align', '布局', { options: ['left', 'right'] }),
        ],
      }),
    ],
    render(c) {
      const items = (c.sections || []).map((s, i) => `
        <div class="block-fs__row block-fs__row--${s.align === 'right' ? 'right' : 'left'}" data-edit-path="sections.${i}">
          <div class="block-fs__media">${s.image ? `<img src="${attr(s.image)}" alt="${attr(s.title || '')}" loading="lazy" decoding="async" data-edit-image="image">` : ''}</div>
          <div class="block-fs__text">
            <h3${edit('title')}>${esc(s.title || '')}</h3>
            <p${edit('text')}>${lineBreaks(s.text || '')}</p>
          </div>
        </div>`).join('');
      return `
        <section class="block block-fs">
          <div class="block-fs__inner">
            <h2 class="block-fs__heading"${edit('title')}>${esc(c.title || '')}</h2>
            ${items}
          </div>
        </section>`;
    },
  },

  // -------- 8. Testimonial --------
  testimonial: {
    id: 'testimonial',
    label: 'Testimonial',
    icon: '❝',
    description: '客户证言 / 案例',
    defaultContent: () => ({
      quote: '"They cut our battery integration time by 40%. Best supplier we have."',
      author: 'CTO',
      company: 'Acme Wearables',
      photo: '',
    }),
    schema: [
      F('textarea', 'quote', '引言', { max: 800, required: true }),
      F('text', 'author', '作者姓名/职位', { max: 120 }),
      F('text', 'company', '公司', { max: 120 }),
      F('image', 'photo', '头像/Logo', {}),
    ],
    render(c) {
      return `
        <section class="block block-tm">
          <div class="block-tm__inner">
            <img class="block-tm__photo" src="${attr(c.photo || '/logo.png')}" alt="${attr(c.author || '')}" loading="lazy" decoding="async" data-edit-image="photo">
            <blockquote class="block-tm__quote"${editRich('quote')}>${richHtml(c.quote || '')}</blockquote>
            <div class="block-tm__author"><span${edit('author')}>${esc(c.author || '')}</span>, <span${edit('company')}>${esc(c.company || '')}</span></div>
          </div>
        </section>`;
    },
  },

  // -------- 9. FAQ Accordion --------
  faq_accordion: {
    id: 'faq_accordion',
    label: 'FAQ',
    icon: '?',
    description: '折叠 FAQ — 同时生成 FAQPage JSON-LD',
    defaultContent: () => ({
      title: 'Frequently asked',
      items: [
        { q: 'What is the MOQ?', a: '500 pcs for stock models; 1000 pcs for custom designs.' },
        { q: 'Sample lead time?', a: '7 business days for standard models; 14-21 days for custom shapes.' },
      ],
    }),
    schema: [
      F('text', 'title', '区块标题', { max: 120 }),
      F('repeater', 'items', '问答', {
        fields: [
          F('text', 'q', '问题', { max: 200 }),
          F('textarea', 'a', '答案', { max: 1500 }),
        ],
      }),
    ],
    render(c) {
      const items = (c.items || []).map((q, i) => `
        <details class="block-faq__item" data-edit-path="items.${i}">
          <summary><span${edit('q')}>${esc(q.q || '')}</span></summary>
          <div class="block-faq__a"${edit('a')}>${lineBreaks(q.a || '')}</div>
        </details>`).join('');
      // FAQPage JSON-LD for SEO
      const jsonld = (c.items || []).filter((q) => q.q && q.a).map((q) => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: { '@type': 'Answer', text: q.a },
      }));
      const schemaTag = jsonld.length
        ? `<script type="application/ld+json">${JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: jsonld,
          })}</script>`
        : '';
      return `
        <section class="block block-faq">
          <div class="block-faq__inner">
            <h2 class="block-faq__heading"${edit('title')}>${esc(c.title || '')}</h2>
            <div class="block-faq__list">${items}</div>
            ${schemaTag}
          </div>
        </section>`;
    },
  },

  // -------- 10. CTA Banner --------
  cta_banner: {
    id: 'cta_banner',
    label: 'CTA Banner',
    icon: '➢',
    description: '强转化 CTA + 询盘按钮',
    defaultContent: () => ({
      title: 'Ready to spec a battery?',
      subtitle: 'Send us your requirements — our engineers reply within one business day.',
      cta_text: 'Get a Quote',
      cta_link: '/quote.html',
      image: '',
    }),
    schema: [
      F('text', 'title', '标题', { max: 200, required: true }),
      F('textarea', 'subtitle', '副标题', { max: 400 }),
      F('text', 'cta_text', '按钮文字', { max: 60 }),
      F('url', 'cta_link', '按钮链接', { max: 255 }),
      F('image', 'image', '背景图（可选）', {}),
    ],
    render(c) {
      const bg = c.image ? `style="background-image:url('${attr(c.image)}');"` : '';
      return `
        <section class="block block-cta" data-edit-bg="image" ${bg}>
          <div class="block-cta__overlay"></div>
          <div class="block-cta__inner">
            <h2 class="block-cta__title"${edit('title')}>${esc(c.title || '')}</h2>
            <p class="block-cta__sub"${editRich('subtitle')}${c.subtitle ? '' : ' data-empty="1"'}>${richHtml(c.subtitle || '')}</p>
            ${c.cta_link ? `<a class="block-cta__btn" href="${attr(c.cta_link)}"${edit('cta_text')} data-edit-link-field="cta_link">${esc(c.cta_text || 'Get a Quote')}</a>` : ''}
          </div>
        </section>`;
    },
  },

  // -------- 11. Embedded Inquiry Form (mini RFQ inline) --------
  inquiry_form: {
    id: 'inquiry_form',
    label: 'Inline Inquiry Form',
    icon: '✉',
    description: '页面内嵌迷你询盘表单 — 转化提升点',
    defaultContent: () => ({
      title: 'Tell us about your project',
      subtitle: 'Email + a short note. Our sales engineer replies within 1 business day.',
    }),
    schema: [
      F('text', 'title', '标题', { max: 200 }),
      F('textarea', 'subtitle', '副标题', { max: 400 }),
    ],
    render(c, ctx) {
      // Render a no-JS-required form that posts to /api/inquiries. The
      // existing site-wide enhancement script wires up Turnstile + AJAX.
      const sourcePage = (ctx && ctx.path) || '';
      return `
        <section class="block block-form">
          <div class="block-form__inner">
            <h2 class="block-form__heading"${edit('title')}>${esc(c.title || '')}</h2>
            <p class="block-form__sub"${editRich('subtitle')}${c.subtitle ? '' : ' data-empty="1"'}>${richHtml(c.subtitle || '')}</p>
            <form class="block-form__form" data-inline-inquiry onsubmit="return handleContactSubmit(event);">
              <input type="hidden" name="source_widget" value="mini_rfq">
              <input type="hidden" name="source_page" value="${attr(sourcePage)}">
              <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;" aria-hidden="true">
              <div class="block-form__row">
                <label><span>Business email *</span><input type="email" name="email" required></label>
                <label><span>Company</span><input type="text" name="company" maxlength="120"></label>
              </div>
              <label><span>How can we help?</span><textarea name="message" rows="3" maxlength="2000"></textarea></label>
              <label class="block-form__consent"><input type="checkbox" name="consent" required> I agree to the <a href="/privacy">privacy policy</a>.</label>
              <div data-turnstile></div>
              <button type="submit" class="block-form__submit">Send</button>
              <p class="form-status"></p>
            </form>
          </div>
        </section>`;
    },
  },

  // -------- 12. Rich Text --------
  rich_text: {
    id: 'rich_text',
    label: 'Rich Text',
    icon: '¶',
    description: '富文本段落 — 自由 HTML',
    defaultContent: () => ({
      html: '<h2>Section heading</h2><p>Write a paragraph or two here. Use the toolbar for formatting.</p>',
      max_width: 'standard',
    }),
    schema: [
      F('richtext', 'html', '正文', { max: 50000 }),
      F('select', 'max_width', '最大宽度', { options: ['narrow', 'standard', 'wide', 'full'] }),
    ],
    render(c) {
      const w = ['narrow', 'standard', 'wide', 'full'].includes(c.max_width) ? c.max_width : 'standard';
      return `
        <section class="block block-rt block-rt--${w}">
          <div class="block-rt__inner" data-edit-field="html" data-edit-rich="1">${richHtml(c.html || '')}</div>
        </section>`;
    },
  },

  // -------- 13. Stats Grid (animated counters — about-stats CSS) --------
  stats_grid: {
    id: 'stats_grid',
    label: 'Stats / Counters',
    icon: '#',
    description: '动画数字面板 — 4 列计数器（年限/产能/规模/客户数）',
    defaultContent: () => ({
      title: '',
      items: [
        { value: '8', unit: '+', label: 'Years', desc: 'Founded 2018' },
        { value: '850', unit: '', label: 'Staff', desc: 'Engineers + ops' },
        { value: '300', unit: '+', label: 'Programs', desc: 'Active customers' },
        { value: '100', unit: 'k/mo', label: 'Cell capacity', desc: 'Polymer + steel' },
      ],
    }),
    schema: [
      F('text', 'title', '区块标题（可选）', { max: 120 }),
      F('repeater', 'items', '数字条目（4 个推荐）', {
        fields: [
          F('text', 'value', '数字', { max: 12 }),
          F('text', 'unit', '单位（如 + / k/mo）', { max: 12 }),
          F('text', 'label', '标签', { max: 60 }),
          F('text', 'desc', '描述（可选）', { max: 200 }),
        ],
      }),
    ],
    render(c) {
      const items = (c.items || []).map((s, i) => `
        <div data-edit-path="items.${i}">
          <strong>
            <span class="counter" data-target="${attr(s.value || '0')}"${edit('value')}>${esc(s.value || '0')}</span>
            ${s.unit ? `<span${edit('unit')}>${esc(s.unit)}</span>` : ''}
          </strong>
          <em${edit('label')}>${esc(s.label || '')}</em>
          ${s.desc ? `<p${edit('desc')}>${esc(s.desc)}</p>` : ''}
        </div>`).join('');
      return `
        <section class="block block-stats">
          <div class="block-stats__inner" style="max-width:1200px; margin:0 auto; padding:0 24px;">
            ${c.title ? `<h2 class="block-stats__heading"${edit('title')} style="font-size:28px; font-weight:800; margin:0 0 28px; text-align:center; color:#0f172a;">${esc(c.title)}</h2>` : ''}
            <div class="about-stats">${items}</div>
          </div>
        </section>`;
    },
  },

  // -------- 14. Icon Feature Grid (feat-grid CSS — most-used pattern) --------
  icon_feature_grid: {
    id: 'icon_feature_grid',
    label: 'Feature Grid (icons)',
    icon: '⊞',
    description: '图标功能网格 — 3-6 列（feat-grid 风格，覆盖现有 40+ 实例）',
    defaultContent: () => ({
      title: '',
      columns: 3,
      items: [
        { icon: '①', title: 'Speed', text: 'Sample within 7 days from spec freeze.' },
        { icon: '②', title: 'Compliance', text: 'IATF 16949 / ISO 14001 audited.' },
        { icon: '③', title: 'Engineering', text: 'In-house cell + BMS + tooling.' },
      ],
    }),
    schema: [
      F('text', 'title', '区块标题（可选）', { max: 120 }),
      F('number', 'columns', '列数 (3 或 6)', { min: 2, max: 6 }),
      F('repeater', 'items', '功能条目', {
        fields: [
          F('text', 'icon', '图标（如 ① / ✓ / 🔧）', { max: 8 }),
          F('text', 'title', '标题', { max: 80 }),
          F('textarea', 'text', '描述', { max: 400 }),
        ],
      }),
    ],
    render(c) {
      const cols = Math.min(6, Math.max(2, parseInt(c.columns || 3, 10)));
      const items = (c.items || []).map((it, i) => `
        <div class="feat-item" data-edit-path="items.${i}">
          <div class="feat-icon"${edit('icon')}>${esc(it.icon || '')}</div>
          <h3${edit('title')}>${esc(it.title || '')}</h3>
          <p${edit('text')}>${lineBreaks(it.text || '')}</p>
        </div>`).join('');
      return `
        <section class="block block-fg" style="padding:60px 24px;">
          <div style="max-width:1200px; margin:0 auto;">
            ${c.title ? `<h2${edit('title')} style="font-size:28px; font-weight:800; margin:0 0 32px; text-align:center; color:#0f172a;">${esc(c.title)}</h2>` : ''}
            <div class="feat-grid feat-grid--${cols}">${items}</div>
          </div>
        </section>`;
    },
  },

  // -------- 15. Image + Text Split (content-split CSS, alternating) --------
  image_text_split: {
    id: 'image_text_split',
    label: 'Image + Text Split',
    icon: '◧',
    description: '图文左右分栏 — 内容详解 + 配图（可正反向）',
    defaultContent: () => ({
      title: 'In-house tooling',
      text: 'Mold-making and SMT lines under one roof — 30% faster NPI than working with two suppliers.',
      image_url: '',
      image_align: 'right',
    }),
    schema: [
      F('text', 'title', '小标题', { max: 200 }),
      F('textarea', 'text', '段落文字', { max: 2000 }),
      F('image', 'image_url', '配图', {}),
      F('select', 'image_align', '图片在左还是右', { options: ['left', 'right'] }),
    ],
    render(c) {
      const reverse = c.image_align === 'left' ? ' reverse' : '';
      return `
        <section class="block block-its" style="padding:60px 24px;">
          <div style="max-width:1200px; margin:0 auto;">
            <div class="content-split${reverse}">
              <div class="text-col">
                <h3${edit('title')}>${esc(c.title || '')}</h3>
                <p${editRich('text')}${c.text ? '' : ' data-empty="1"'}>${richHtml(c.text || '')}</p>
              </div>
              <div class="img-col">
                ${c.image_url ? `<img src="${attr(c.image_url)}" alt="${attr(c.title || '')}" loading="lazy" decoding="async" data-edit-image="image_url">` : '<div style="background:#f1f5f9; aspect-ratio:4/3; border-radius:8px; display:grid; place-items:center; color:#94a3b8;">No image yet</div>'}
              </div>
            </div>
          </div>
        </section>`;
    },
  },

  // -------- 16. Process Steps (steps-grid CSS — numbered + sub-list) --------
  process_steps: {
    id: 'process_steps',
    label: 'Process Steps',
    icon: '⇉',
    description: '编号步骤卡片 — 3-4 步流程（可带子要点列表）',
    defaultContent: () => ({
      title: 'How we work',
      items: [
        { num: '01', title: 'Design', text: 'Cell sizing, chemistry match, BMS topology.', sub: ['DFM review', 'Compliance plan', 'BOM cost target'] },
        { num: '02', title: 'Prototyping', text: 'Pilot line samples in 7 days.', sub: ['First articles', 'Cycle test', 'Drop test'] },
        { num: '03', title: 'Mass Production', text: 'Cell-ID traceable lines.', sub: ['100% screening', 'PPAP', 'Air-DGR docs'] },
      ],
    }),
    schema: [
      F('text', 'title', '区块标题', { max: 120 }),
      F('repeater', 'items', '步骤', {
        fields: [
          F('text', 'num', '编号（如 01 / 02）', { max: 8 }),
          F('text', 'title', '步骤标题', { max: 80 }),
          F('textarea', 'text', '说明', { max: 400 }),
          F('repeater', 'sub', '子要点（可选）', {
            fields: [
              F('text', 'item', '要点文字', { max: 200 }),
            ],
          }),
        ],
      }),
    ],
    render(c) {
      const items = (c.items || []).map((s, i) => {
        const sub = Array.isArray(s.sub) ? s.sub : [];
        const subHtml = sub.length
          ? `<ul class="step-list">${sub.map((x, j) => `<li${edit('item')} data-edit-path="sub.${j}">${esc(typeof x === 'string' ? x : x.item || '')}</li>`).join('')}</ul>`
          : '';
        return `
          <div class="step-card" data-edit-path="items.${i}">
            <div class="step-num"${edit('num')}>${esc(s.num || '')}</div>
            <h3${edit('title')}>${esc(s.title || '')}</h3>
            <p${edit('text')}>${lineBreaks(s.text || '')}</p>
            ${subHtml}
          </div>`;
      }).join('');
      return `
        <section class="block block-ps" style="padding:60px 24px;">
          <div style="max-width:1200px; margin:0 auto;">
            ${c.title ? `<h2${edit('title')} style="font-size:28px; font-weight:800; margin:0 0 32px; text-align:center; color:#0f172a;">${esc(c.title)}</h2>` : ''}
            <div class="steps-grid">${items}</div>
          </div>
        </section>`;
    },
  },

  // -------- 17. Compliance Badges (trust-strip OR cert-wall) --------
  compliance_badges: {
    id: 'compliance_badges',
    label: 'Compliance Badges',
    icon: '◈',
    description: '认证 / 合规标识墙 — 横排徽章或方块墙',
    defaultContent: () => ({
      title: 'Compliant with',
      layout: 'strip',
      items: [
        { text: 'ISO 9001' },
        { text: 'IATF 16949' },
        { text: 'IEC 62133' },
        { text: 'UN38.3' },
        { text: 'CE / UKCA' },
        { text: 'RoHS / REACH' },
      ],
    }),
    schema: [
      F('text', 'title', '标签文字（可选）', { max: 80 }),
      F('select', 'layout', '排版', { options: ['strip', 'wall'] }),
      F('repeater', 'items', '徽章', {
        fields: [
          F('text', 'text', '认证名', { max: 60 }),
        ],
      }),
    ],
    render(c) {
      const layout = c.layout === 'wall' ? 'wall' : 'strip';
      const items = (c.items || []).map((b, i) => {
        const cls = layout === 'wall' ? 'cert-chip' : '';
        return `<span class="${cls}" data-edit-path="items.${i}"${edit('text')}>${esc(b.text || '')}</span>`;
      }).join('');
      if (layout === 'wall') {
        return `
          <section class="block block-cb" style="padding:48px 24px; background:#f8fafc;">
            <div style="max-width:1200px; margin:0 auto;">
              ${c.title ? `<div${edit('title')} style="font-size:12px; text-transform:uppercase; letter-spacing:.12em; color:#64748b; text-align:center; margin:0 0 18px; font-weight:600;">${esc(c.title)}</div>` : ''}
              <div class="cert-wall">${items}</div>
            </div>
          </section>`;
      }
      return `
        <section class="block block-cb trust-strip">
          <div class="trust-strip__inner">
            ${c.title ? `<span class="trust-strip__label"${edit('title')}>${esc(c.title)}</span>` : ''}
            <div class="trust-strip__items">${items}</div>
          </div>
        </section>`;
    },
  },
};

function listBlockTypes() {
  return Object.values(BLOCKS).map((b) => ({
    id: b.id,
    label: b.label,
    icon: b.icon,
    description: b.description,
    schema: b.schema,
  }));
}

function getBlockType(id) {
  return BLOCKS[id] || null;
}

async function renderBlock(block, ctx) {
  const def = BLOCKS[block.block_type];
  if (!def) {
    return `<!-- unknown block type: ${escapeHtml(block.block_type)} -->`;
  }
  try {
    const html = await def.render(block.content || {}, ctx || {});
    // Inject block-id / block-type markers onto the outermost <section>
    // so the in-iframe page-builder runtime can wire up hover, select,
    // inline-edit, and reorder behavior without touching each render
    // function individually. The regex only matches the first <section
    // class="block ..."> per rendered chunk, which is always the
    // block's own outer container.
    const hiddenAttr = (block.is_visible === false || ctx && ctx.forceHidden) ? ' data-block-hidden="1"' : '';
    return html.replace(
      /(<section\b[^>]*\bclass="(?:[^"]*\s)?block(?:\s[^"]*)?"[^>]*)>/,
      `$1 data-block-id="${block.id || ''}" data-block-type="${block.block_type}"${hiddenAttr}>`
    );
  } catch (err) {
    console.error(`[blocks] render ${block.block_type} failed:`, err && err.message);
    return `<!-- block ${block.block_type} render error -->`;
  }
}

// Wrap a text snippet with a data-edit-field attribute so the in-iframe
// runtime can target it for contenteditable. Returns just the
// attribute fragment (no leading space).
function edit(field) {
  return ` data-edit-field="${field}"`;
}

// Like edit() but also marks the field as accepting inline rich-text
// formatting (bold, italic, link). The runtime shows a floating
// toolbar on selection inside these and saves innerHTML rather than
// innerText.
function editRich(field) {
  return ` data-edit-field="${field}" data-edit-rich="1"`;
}

// Pass-through HTML for rich fields with light defensive sanitisation
// (strip <script> / on*= attributes). Admins have full backend access
// anyway, so this is hygiene, not a security boundary.
function richHtml(s) {
  if (s == null) return '';
  let out = String(s);
  out = out.replace(/<script[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<style[\s\S]*?<\/style>/gi, '');
  out = out.replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/ on[a-z]+\s*=\s*'[^']*'/gi, '');
  return out;
}

async function renderBlocks(blocks, ctx) {
  const builderMode = !!(ctx && ctx.builderMode);
  const out = [];
  for (const b of blocks) {
    if (b.is_visible === false && !builderMode) continue;
    out.push(await renderBlock(b, ctx));
  }
  return out.join('\n');
}

function defaultContent(typeId) {
  const def = BLOCKS[typeId];
  return def && def.defaultContent ? def.defaultContent() : {};
}

module.exports = {
  BLOCKS,
  listBlockTypes,
  getBlockType,
  renderBlock,
  renderBlocks,
  defaultContent,
};
