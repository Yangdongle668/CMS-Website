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
      const eyebrow = c.eyebrow ? `<div class="block-hero__eyebrow">${esc(c.eyebrow)}</div>` : '';
      const subtitle = c.subtitle ? `<p class="block-hero__sub">${lineBreaks(c.subtitle)}</p>` : '';
      const cta = c.cta_text && c.cta_link
        ? `<a class="block-hero__cta" href="${attr(c.cta_link)}">${esc(c.cta_text)}</a>` : '';
      const cta2 = c.secondary_cta_text && c.secondary_cta_link
        ? `<a class="block-hero__cta block-hero__cta--secondary" href="${attr(c.secondary_cta_link)}">${esc(c.secondary_cta_text)}</a>` : '';
      return `
        <section class="block block-hero block-hero--${align}" ${bg}>
          <div class="block-hero__overlay"></div>
          <div class="block-hero__inner">
            ${eyebrow}
            <h1 class="block-hero__title">${esc(c.title || '')}</h1>
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
      const items = cols.map((v) => `
        <div class="block-vp__item">
          <div class="block-vp__icon">${esc(v.icon || '')}</div>
          <h3 class="block-vp__title">${esc(v.title || '')}</h3>
          <p class="block-vp__text">${lineBreaks(v.text || '')}</p>
        </div>`).join('');
      return `
        <section class="block block-vp">
          <div class="block-vp__inner">
            ${c.title ? `<h2 class="block-vp__heading">${esc(c.title)}</h2>` : ''}
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
            ${c.title ? `<h2 class="block-pg__heading">${esc(c.title)}</h2>` : ''}
            ${c.subtitle ? `<p class="block-pg__sub">${lineBreaks(c.subtitle)}</p>` : ''}
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
            ${c.title ? `<div class="block-lw__heading">${esc(c.title)}</div>` : ''}
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
            ${c.title ? `<h2 class="block-st__heading">${esc(c.title)}</h2>` : ''}
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
            ${c.title ? `<h2 class="block-ag__heading">${esc(c.title)}</h2>` : ''}
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
      const items = (c.sections || []).map((s) => `
        <div class="block-fs__row block-fs__row--${s.align === 'right' ? 'right' : 'left'}">
          <div class="block-fs__media">${s.image ? `<img src="${attr(s.image)}" alt="${attr(s.title || '')}" loading="lazy" decoding="async">` : ''}</div>
          <div class="block-fs__text">
            <h3>${esc(s.title || '')}</h3>
            <p>${lineBreaks(s.text || '')}</p>
          </div>
        </div>`).join('');
      return `
        <section class="block block-fs">
          <div class="block-fs__inner">
            ${c.title ? `<h2 class="block-fs__heading">${esc(c.title)}</h2>` : ''}
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
            ${c.photo ? `<img class="block-tm__photo" src="${attr(c.photo)}" alt="${attr(c.author || '')}" loading="lazy" decoding="async">` : ''}
            <blockquote class="block-tm__quote">${esc(c.quote || '')}</blockquote>
            <div class="block-tm__author">${esc(c.author || '')}${c.company ? `, <span>${esc(c.company)}</span>` : ''}</div>
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
      const items = (c.items || []).map((q) => `
        <details class="block-faq__item">
          <summary>${esc(q.q || '')}</summary>
          <div class="block-faq__a">${lineBreaks(q.a || '')}</div>
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
            ${c.title ? `<h2 class="block-faq__heading">${esc(c.title)}</h2>` : ''}
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
        <section class="block block-cta" ${bg}>
          <div class="block-cta__overlay"></div>
          <div class="block-cta__inner">
            <h2 class="block-cta__title">${esc(c.title || '')}</h2>
            ${c.subtitle ? `<p class="block-cta__sub">${lineBreaks(c.subtitle)}</p>` : ''}
            ${c.cta_text && c.cta_link ? `<a class="block-cta__btn" href="${attr(c.cta_link)}">${esc(c.cta_text)}</a>` : ''}
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
            <h2 class="block-form__heading">${esc(c.title || '')}</h2>
            ${c.subtitle ? `<p class="block-form__sub">${lineBreaks(c.subtitle)}</p>` : ''}
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
          <div class="block-rt__inner">${c.html || ''}</div>
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
    return html;
  } catch (err) {
    console.error(`[blocks] render ${block.block_type} failed:`, err && err.message);
    return `<!-- block ${block.block_type} render error -->`;
  }
}

async function renderBlocks(blocks, ctx) {
  const out = [];
  for (const b of blocks) {
    if (b.is_visible === false) continue;
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
