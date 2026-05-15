/* ===========================================================================
   Block renderer for CMS pages.

   Each entry in BLOCK_RENDERERS receives the block's `data` object and returns
   an HTML string. Renderers MUST escape every interpolated value (use the
   provided `h()` helper) — block data is operator-supplied and an unescaped
   string would mean any operator with edit access could XSS the public site.

   The same renderer is used by:
     - the live public site (page shells fetch /api/pages/by-slug/<slug>)
     - the admin preview iframe (postMessage drives re-render on every edit)
   =========================================================================== */
(function (root) {
  'use strict';

  function h(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // Block data can carry simple <br> inside titles — let it through as
  // pre-sanitised markup, escape everything else.
  function htitle(s) {
    return h(s).replace(/&lt;br ?\/?&gt;/gi, '<br>');
  }

  // Safe URL: only allow http(s), root-relative, or anchor links. Anything
  // else (javascript:, data:) becomes "#" so a malicious paste can't escape.
  function safeUrl(u) {
    const s = String(u == null ? '' : u).trim();
    if (!s) return '#';
    if (/^(https?:)?\/\//i.test(s)) return s;
    if (/^\//.test(s)) return s;
    if (/^#/.test(s)) return s;
    if (/^mailto:/i.test(s)) return s;
    return '#';
  }

  function safeImg(u) {
    const s = String(u == null ? '' : u).trim();
    if (!s) return '';
    if (/^(https?:)?\/\//i.test(s)) return s;
    if (/^\//.test(s)) return s;
    if (/^data:image\//i.test(s)) return s;
    return '';
  }

  // -------- Block renderers --------
  const BLOCK_RENDERERS = {

    // ---- HERO ----------------------------------------------------------------
    hero(d) {
      d = d || {};
      const img = safeImg(d.image);
      const bg = img ? `style="background-image:url('${h(img)}');"` : '';
      const p1 = d.primary || {};
      const p2 = d.secondary || {};
      return `
<section class="hero" ${bg}>
  <div class="hero-top">
    ${d.eyebrow ? `<span class="eyebrow">${h(d.eyebrow)}</span>` : ''}
    <h1>${htitle(d.title || '')}</h1>
    ${d.subtitle ? `<p class="subtitle">${h(d.subtitle)}</p>` : ''}
  </div>
  <div class="hero-bottom">
    <div class="cta-group">
      ${p1.label ? `<a href="${h(safeUrl(p1.url))}" class="btn btn-primary">${h(p1.label)}</a>` : ''}
      ${p2.label ? `<a href="${h(safeUrl(p2.url))}" class="btn btn-secondary">${h(p2.label)}</a>` : ''}
    </div>
  </div>
</section>`;
    },

    // ---- PILLAR-GRID (3 product-line cards) ----------------------------------
    'pillar-grid'(d) {
      d = d || {};
      const cards = Array.isArray(d.cards) ? d.cards : [];
      return `
<section class="section section-light">
  <div class="section-inner">
    ${d.eyebrow ? `<span class="eyebrow">${h(d.eyebrow)}</span>` : ''}
    ${d.title ? `<h2>${htitle(d.title)}</h2>` : ''}
    ${d.lead ? `<p class="lead">${h(d.lead)}</p>` : ''}
    <div class="pillar-grid">
      ${cards.map((c) => {
        c = c || {};
        const link = h(safeUrl(c.link));
        const img = safeImg(c.image);
        const specs = Array.isArray(c.specs) ? c.specs : [];
        return `
        <a class="pillar-card" href="${link}">
          ${img ? `<div class="pillar-card__media" style="background-image:url('${h(img)}');"></div>` : ''}
          <div class="pillar-card__body">
            ${c.pill ? `<span class="pillar-card__pill">${h(c.pill)}</span>` : ''}
            ${c.title ? `<h3>${h(c.title)}</h3>` : ''}
            ${c.desc ? `<p>${h(c.desc)}</p>` : ''}
            ${specs.length ? `<div class="pillar-card__specs">
              ${specs.map((s) => `<span><strong>${h(s.value)}</strong>${h(s.unit || '')}</span>`).join('')}
            </div>` : ''}
            ${c.linkText ? `<span class="news-link">${h(c.linkText)}</span>` : ''}
          </div>
        </a>`;
      }).join('')}
    </div>
  </div>
</section>`;
    },

    // ---- CTA-BAND ------------------------------------------------------------
    'cta-band'(d) {
      d = d || {};
      const bg = d.background || 'dark'; // dark | light | grey
      const sectionClass = bg === 'light'
        ? 'section section-light cta-band'
        : bg === 'grey'
        ? 'section section-grey cta-band'
        : 'section section-dark cta-band';
      const btnLabel = (d.button && d.button.label) || d.button_label;
      const btnUrl   = (d.button && d.button.url)   || d.button_url;
      return `
<section class="${sectionClass}">
  <div class="section-inner">
    ${d.title ? `<h2>${htitle(d.title)}</h2>` : ''}
    ${d.subtitle ? `<p class="lead">${h(d.subtitle)}</p>` : ''}
    ${btnLabel ? `<a href="${h(safeUrl(btnUrl))}" class="btn btn-accent">${h(btnLabel)}</a>` : ''}
  </div>
</section>`;
    },

    // Placeholders for the not-yet-built block types so an admin saving an
    // unknown block sees a friendly message instead of a blank section.
    // (When we ship each block we replace its placeholder above.)
    'trust-strip'(d)    { return placeholder('Trust strip', d); },
    'tesla-slider'(d)   { return placeholder('Application slider', d); },
    'content-split'(d)  { return placeholder('Content split', d); },
    'feat-grid'(d)      { return placeholder('Feature grid', d); },
    'steps-grid'(d)     { return placeholder('Steps grid', d); },
    'stat-strip'(d)     { return placeholder('Stat strip', d); },
    'spec-table'(d)     { return placeholder('Spec table', d); },
    'cert-wall'(d)      { return placeholder('Certification wall', d); },
    'faq'(d)            { return placeholder('FAQ', d); },
    'blog-grid'(d)      { return placeholder('Blog grid', d); },
    'quote-form'(d)     { return placeholder('Quote form', d); },
    'rich-text'(d)      { return placeholder('Rich text', d); },
  };

  function placeholder(name, d) {
    return `<section class="section section-light">
      <div class="section-inner" style="text-align:center; padding:60px 20px; border:2px dashed #d4d4d4; border-radius:12px;">
        <div style="font-size:14px; font-weight:600; color:#5c5e62; letter-spacing:1px; text-transform:uppercase;">${h(name)} · 即将上线</div>
        <p style="margin-top:8px; color:#86878b;">这种积木还没实现渲染。已保存的数据：${h(JSON.stringify(d || {}).slice(0, 120))}</p>
      </div>
    </section>`;
  }

  function renderBlock(b) {
    if (!b || !b.type) return '';
    const fn = BLOCK_RENDERERS[b.type];
    if (!fn) return '';
    try { return fn(b.data || {}); }
    catch (err) {
      return `<section class="section section-light">
        <div class="section-inner" style="padding:30px; background:#fdecec; border:1px solid #ffa39e; border-radius:8px; color:#820014;">
          <strong>渲染错误：${h(b.type)}</strong><br><span style="font-size:13px;">${h(err.message)}</span>
        </div>
      </section>`;
    }
  }

  function renderBlocks(blocks) {
    if (!Array.isArray(blocks)) return '';
    return blocks.map(renderBlock).join('');
  }

  // -------- Public API --------
  const api = { renderBlocks, renderBlock, BLOCK_RENDERERS };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CMSRender = api;
})(typeof window !== 'undefined' ? window : globalThis);
