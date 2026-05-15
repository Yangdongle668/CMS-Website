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

  // -------- Responsive variant helpers --------
  // Every uploaded image goes through sharp on POST /api/media, which emits
  // 4 widths (400/800/1200/1600) in both raster + webp. The variants follow
  // a deterministic naming pattern: foo.jpg -> foo.w800.jpg, foo.w800.webp.
  // So we can synthesize a srcset purely from the URL without an extra
  // round-trip. External URLs (Unsplash etc.) are returned as-is.
  const VARIANT_WIDTHS = [400, 800, 1200, 1600];
  function isUploadUrl(u) { return /^\/uploads\//.test(u); }
  function variantUrl(originalUrl, w, format) {
    // /uploads/abc-foo.jpg  ->  /uploads/abc-foo.w800.webp
    const i = originalUrl.lastIndexOf('.');
    if (i < 0) return originalUrl;
    const base = originalUrl.slice(0, i);
    const ext = format === 'webp' ? '.webp'
              : format === 'png'  ? '.png'
              : '.jpg';
    return `${base}.w${w}${ext}`;
  }
  function isPngLike(u) { return /\.(png)$/i.test(u); }
  // Build an <img>-suitable srcset string for an uploaded image.
  function buildSrcset(url, format) {
    return VARIANT_WIDTHS.map((w) => `${variantUrl(url, w, format)} ${w}w`).join(', ');
  }
  // Render an <img> with responsive variants if the URL is an upload.
  // sizes: viewport-relative widths hint (e.g. "(max-width: 768px) 100vw, 50vw").
  function imgTag(url, alt, sizes, extra) {
    const safe = safeImg(url);
    if (!safe) return '';
    const safeAlt = h(alt || '');
    const sizesAttr = sizes ? ` sizes="${h(sizes)}"` : '';
    const extraAttr = extra ? ' ' + extra : '';
    if (!isUploadUrl(safe)) {
      return `<img src="${h(safe)}" alt="${safeAlt}" loading="lazy" decoding="async"${extraAttr}>`;
    }
    const rasterFmt = isPngLike(safe) ? 'png' : 'jpeg';
    const webpSrcset = h(buildSrcset(safe, 'webp'));
    const rasterSrcset = h(buildSrcset(safe, rasterFmt));
    // Pick the largest variant as the fallback src for browsers that ignore srcset.
    const fallback = h(variantUrl(safe, 1600, rasterFmt));
    return `<picture>
      <source type="image/webp" srcset="${webpSrcset}"${sizesAttr}>
      <img src="${fallback}" srcset="${rasterSrcset}"${sizesAttr} alt="${safeAlt}" loading="lazy" decoding="async"${extraAttr}>
    </picture>`;
  }
  // Pick the best background-image URL for a hero / card. Prefers the
  // 1600-wide webp variant when the source is an uploaded file, otherwise
  // returns the URL untouched (Unsplash already does its own sizing).
  function bgUrl(url) {
    const safe = safeImg(url);
    if (!safe) return '';
    if (!isUploadUrl(safe)) return safe;
    // Most viewports won't get the 1600 anyway thanks to image-set, but
    // single-URL fallback uses the largest webp.
    return variantUrl(safe, 1600, 'webp');
  }
  // CSS image-set so capable browsers pick the best format/density.
  function bgImageSet(url) {
    const safe = safeImg(url);
    if (!safe) return '';
    if (!isUploadUrl(safe)) return `url('${safe}')`;
    const webp1600 = variantUrl(safe, 1600, 'webp');
    const raster1600 = variantUrl(safe, 1600, isPngLike(safe) ? 'png' : 'jpeg');
    return `image-set(url('${webp1600}') type("image/webp") 1x, url('${raster1600}') 1x)`;
  }

  // Section wrapper helper. Every "content" block lives inside
  // <section class="section section-<bg>"><div class="section-inner">...</div></section>.
  // bg can be 'light' (default), 'grey', or 'dark'.
  function section(bg, inner, extra) {
    const cls = 'section section-' + (bg === 'grey' || bg === 'dark' ? bg : 'light') + (extra ? ' ' + extra : '');
    return `<section class="${cls}"><div class="section-inner">${inner}</div></section>`;
  }

  // Eyebrow + h2 + lead trio — used by almost every block as a header.
  function sectionHead(d) {
    const parts = [];
    if (d.eyebrow) parts.push(`<span class="eyebrow">${h(d.eyebrow)}</span>`);
    if (d.title)   parts.push(`<h2>${htitle(d.title)}</h2>`);
    if (d.lead)    parts.push(`<p class="lead">${h(d.lead)}</p>`);
    return parts.join('');
  }

  function arr(v) { return Array.isArray(v) ? v : []; }

  /* ========================================================================
     Block renderers
     ======================================================================== */
  const BLOCK_RENDERERS = {

    // ---- HERO ----------------------------------------------------------------
    hero(d) {
      d = d || {};
      const img = safeImg(d.image);
      // Use image-set so capable browsers pick the WebP variant for uploaded
      // images; fall back to a single url() for external URLs.
      const bg = img
        ? `style="background-image: url('${h(bgUrl(img))}'); background-image: ${bgImageSet(img)};"`
        : '';
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

    // ---- TRUST-STRIP --------------------------------------------------------
    'trust-strip'(d) {
      d = d || {};
      const items = arr(d.items);
      return `
<section class="trust-strip">
  <div class="trust-strip__inner">
    ${d.label ? `<div class="trust-strip__label">${h(d.label)}</div>` : ''}
    <div class="trust-strip__items">
      ${items.map((it) => `<span>${h(typeof it === 'string' ? it : it.label)}</span>`).join('')}
    </div>
  </div>
</section>`;
    },

    // ---- PILLAR-GRID --------------------------------------------------------
    'pillar-grid'(d) {
      d = d || {};
      const cards = arr(d.cards);
      return section(d.background, `
        ${sectionHead(d)}
        <div class="pillar-grid">
          ${cards.map((c) => {
            c = c || {};
            const link = h(safeUrl(c.link));
            const img = safeImg(c.image);
            const specs = arr(c.specs);
            return `
            <a class="pillar-card" href="${link}">
              ${img ? `<div class="pillar-card__media" style="background-image: url('${h(bgUrl(img))}'); background-image: ${bgImageSet(img)};"></div>` : ''}
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
        </div>`);
    },

    // ---- TESLA-SLIDER -------------------------------------------------------
    'tesla-slider'(d) {
      d = d || {};
      const slides = arr(d.slides);
      const hasIntro = d.eyebrow || d.title || d.lead;
      const intro = hasIntro
        ? `<div class="section-inner">${sectionHead(d)}</div>`
        : '';
      const wrapperCls = 'section section-' + (d.background === 'grey' || d.background === 'dark' ? d.background : 'grey');
      return `
<section class="${wrapperCls}">
  ${intro}
  <div class="tesla-slider" data-slider>
    <button type="button" class="tesla-slider__arrow tesla-slider__arrow--prev" aria-label="Previous">‹</button>
    <button type="button" class="tesla-slider__arrow tesla-slider__arrow--next" aria-label="Next">›</button>
    <div class="tesla-slider__track" data-slider-track>
      ${slides.map((s, i) => {
        s = s || {};
        const img = safeImg(s.image);
        const label = s.label || `Application ${String(i + 1).padStart(2, '0')}`;
        const bg = img
          ? `style="background-image: url('${h(bgUrl(img))}'); background-image: ${bgImageSet(img)};"`
          : '';
        return `
        <a class="tesla-slide" href="${h(safeUrl(s.link))}" ${bg}>
          <div class="tesla-slide__label">${h(label)}</div>
          <div class="tesla-slide__bottom">
            ${s.title ? `<h3 class="tesla-slide__title">${h(s.title)}</h3>` : ''}
            ${s.subtitle ? `<span class="tesla-slide__sub">${h(s.subtitle)}</span>` : ''}
            ${(s.primaryCta || s.secondaryCta) ? `
              <div class="tesla-slide__ctas">
                ${s.primaryCta ? `<span class="tesla-slide__cta tesla-slide__cta--primary">${h(s.primaryCta)}</span>` : ''}
                ${s.secondaryCta ? `<span class="tesla-slide__cta tesla-slide__cta--secondary">${h(s.secondaryCta)}</span>` : ''}
              </div>` : ''}
          </div>
        </a>`;
      }).join('')}
    </div>
  </div>
</section>`;
    },

    // ---- CONTENT-SPLIT ------------------------------------------------------
    'content-split'(d) {
      d = d || {};
      const reverse = d.imagePosition === 'left' ? ' reverse' : '';
      const link = (d.link && d.link.label && d.link.url)
        ? `<a href="${h(safeUrl(d.link.url))}" class="news-link">${h(d.link.label)} &rarr;</a>`
        : '';
      // Hint to the browser that this image takes ~half the viewport on
      // desktop, full width on mobile. Matches the .content-split layout.
      const sizes = '(max-width: 768px) 100vw, 50vw';
      return section(d.background, `
        ${(d.eyebrow || d.title) ? `${d.eyebrow ? `<span class="eyebrow">${h(d.eyebrow)}</span>` : ''}${d.title ? `<h2>${htitle(d.title)}</h2>` : ''}` : ''}
        <div class="content-split${reverse}">
          <div class="text-col">
            ${d.subtitle ? `<h3>${h(d.subtitle)}</h3>` : ''}
            ${arr(d.paragraphs).map((p) => `<p>${h(p)}</p>`).join('')}
            ${link}
          </div>
          <div class="img-col">
            ${imgTag(d.image, d.imageAlt || d.title, sizes)}
          </div>
        </div>`);
    },

    // ---- FEAT-GRID ----------------------------------------------------------
    'feat-grid'(d) {
      d = d || {};
      const items = arr(d.items);
      const cols = d.columns === 2 || d.columns === '2' ? 2
                 : d.columns === 4 || d.columns === '4' ? 4
                 : 3;
      const style = cols === 3 ? '' : ` style="grid-template-columns: repeat(${cols}, 1fr);"`;
      return section(d.background, `
        ${sectionHead(d)}
        <div class="feat-grid"${style}>
          ${items.map((it) => {
            it = it || {};
            return `
            <div class="feat-item">
              ${it.icon ? `<div class="feat-icon">${h(it.icon)}</div>` : ''}
              ${it.title ? `<h3>${h(it.title)}</h3>` : ''}
              ${it.desc ? `<p>${h(it.desc)}</p>` : ''}
            </div>`;
          }).join('')}
        </div>`);
    },

    // ---- STEPS-GRID ---------------------------------------------------------
    'steps-grid'(d) {
      d = d || {};
      const steps = arr(d.steps);
      return section(d.background, `
        ${sectionHead(d)}
        <div class="steps-grid">
          ${steps.map((st, i) => {
            st = st || {};
            const num = st.num || String(i + 1).padStart(2, '0');
            const list = arr(st.points);
            return `
            <div class="step-card">
              <div class="step-num">${h(num)}</div>
              ${st.title ? `<h3>${h(st.title)}</h3>` : ''}
              ${st.body ? `<p>${h(st.body)}</p>` : ''}
              ${list.length ? `<ul class="step-list">${list.map((p) => `<li>${h(p)}</li>`).join('')}</ul>` : ''}
            </div>`;
          }).join('')}
        </div>`);
    },

    // ---- STAT-STRIP ---------------------------------------------------------
    'stat-strip'(d) {
      d = d || {};
      const stats = arr(d.stats);
      const cls = d.dark ? 'section section-dark' : 'section section-light';
      return `
<section class="${cls}">
  <div class="section-inner">
    ${sectionHead(d)}
    <div class="about-stats" data-stats-grid>
      ${stats.map((s) => {
        s = s || {};
        const value = s.value || '';
        const isNum = /^[0-9][0-9,]*$/.test(String(value).replace(/,/g, ''));
        const target = isNum ? String(value).replace(/,/g, '') : '';
        const inner = isNum
          ? `<span class="counter" data-target="${h(target)}">0</span>${s.unit ? `<span>${h(s.unit)}</span>` : ''}`
          : `${h(value)}${s.unit ? `<span>${h(s.unit)}</span>` : ''}`;
        return `<div><strong>${inner}</strong><em>${h(s.label || '')}</em></div>`;
      }).join('')}
    </div>
  </div>
</section>`;
    },

    // ---- SPEC-TABLE ---------------------------------------------------------
    'spec-table'(d) {
      d = d || {};
      const headers = arr(d.headers);
      const rows = arr(d.rows);
      return section(d.background, `
        ${sectionHead(d)}
        <table class="spec-table">
          ${headers.length ? `<thead><tr>${headers.map((hd) => `<th>${h(hd)}</th>`).join('')}</tr></thead>` : ''}
          <tbody>
            ${rows.map((row) => {
              const cells = arr(row);
              return `<tr>${cells.map((c) => `<td>${h(c)}</td>`).join('')}</tr>`;
            }).join('')}
          </tbody>
        </table>`);
    },

    // ---- CERT-WALL ----------------------------------------------------------
    'cert-wall'(d) {
      d = d || {};
      const chips = arr(d.chips);
      return section(d.background, `
        ${sectionHead(d)}
        <div class="cert-wall">
          ${chips.map((c) => `<span class="cert-chip">${h(typeof c === 'string' ? c : c.label)}</span>`).join('')}
        </div>`);
    },

    // ---- FAQ ----------------------------------------------------------------
    'faq'(d) {
      d = d || {};
      const items = arr(d.items);
      return section(d.background, `
        ${sectionHead(d)}
        <div class="faq-list">
          ${items.map((f) => `
            <details>
              <summary>${h(f.q || '')}</summary>
              <p>${h(f.a || '')}</p>
            </details>`).join('')}
        </div>`);
    },

    // ---- BLOG-GRID ----------------------------------------------------------
    // Hydrated client-side from /api/articles. Renders a placeholder grid
    // with the right shape; cms-page.js (or a small inline script) fills it.
    'blog-grid'(d) {
      d = d || {};
      const limit = parseInt(d.limit, 10) || 3;
      const source = d.source === 'pillar' ? `data-source="pillar"` : `data-source="latest"`;
      return section(d.background, `
        ${sectionHead(d)}
        <div class="blog-grid" data-insights-grid ${source} data-limit="${limit}" style="margin-top: 40px;"></div>
        ${d.allLink ? `<div style="margin-top: 32px;"><a href="${h(safeUrl(d.allLink))}" class="news-link">${h(d.allLinkText || 'Browse all insights →')}</a></div>` : ''}`);
    },

    // ---- CTA-BAND -----------------------------------------------------------
    'cta-band'(d) {
      d = d || {};
      const bg = d.background || 'dark';
      const sectionClass = 'section section-' + (bg === 'light' ? 'light' : bg === 'grey' ? 'grey' : 'dark') + ' cta-band';
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

    // ---- QUOTE-FORM ---------------------------------------------------------
    // Minimal inline RFQ. Real submission still goes through /api/inquiries.
    // The form is intentionally simple — for the full version operators link
    // to /contact.html. This is for "embed a quick form on a landing page".
    'quote-form'(d) {
      d = d || {};
      return section(d.background, `
        ${sectionHead(d)}
        <form class="rfq-mini" action="/api/inquiries" method="post" style="max-width: 640px; margin: 32px auto 0; display: grid; gap: 12px;">
          <input type="text" name="full_name" placeholder="${h(d.placeholders?.name || '姓名 / Name')}" required style="padding:12px 14px; border:1px solid #d4d4d4; border-radius:8px;">
          <input type="email" name="email" placeholder="${h(d.placeholders?.email || '工作邮箱 / Work email')}" required style="padding:12px 14px; border:1px solid #d4d4d4; border-radius:8px;">
          <input type="text" name="company" placeholder="${h(d.placeholders?.company || '公司 / Company')}" style="padding:12px 14px; border:1px solid #d4d4d4; border-radius:8px;">
          <textarea name="message" placeholder="${h(d.placeholders?.message || '简单描述你的需求 / Briefly describe your need')}" rows="4" required style="padding:12px 14px; border:1px solid #d4d4d4; border-radius:8px; resize:vertical;"></textarea>
          <label style="font-size:12.5px; color:#5c5e62; display:flex; gap:8px; align-items:flex-start;">
            <input type="checkbox" name="consent_given" required style="margin-top:2px;">
            <span>${h(d.consentText || '我同意按隐私政策处理我的数据 / I consent to data processing under the privacy policy.')}</span>
          </label>
          <button type="submit" class="btn btn-primary" style="justify-self: start;">${h(d.buttonLabel || 'Request a Quote')}</button>
        </form>`);
    },

    // ---- RICH-TEXT ----------------------------------------------------------
    // Operator-supplied long-form text. Block stores plain text + a few
    // markers, and we render H2/H3/lists/paragraphs from very simple
    // conventions (markdown-ish) so it stays safe.
    'rich-text'(d) {
      d = d || {};
      const body = renderRichText(d.body || '');
      return section(d.background, `
        ${sectionHead(d)}
        <div class="rich-text" style="max-width: 760px; margin: 0 auto; font-size: 16px; line-height: 1.75; color: #393c41;">
          ${body}
        </div>`);
    },
  };

  /* ========================================================================
     Markdown-ish converter for rich-text block.
     Supports:  ## H2, ### H3, - list, blank-line paragraphs, **bold**, [link](url)
     Anything else is treated as plain paragraph text.
     ======================================================================== */
  function renderRichText(src) {
    const lines = String(src).split(/\r?\n/);
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      if (/^### /.test(line)) { out.push(`<h3>${inline(line.slice(4))}</h3>`); i++; continue; }
      if (/^## /.test(line))  { out.push(`<h2>${inline(line.slice(3))}</h2>`); i++; continue; }
      if (/^[*-] /.test(line)) {
        const items = [];
        while (i < lines.length && /^[*-] /.test(lines[i])) {
          items.push(`<li>${inline(lines[i].slice(2))}</li>`);
          i++;
        }
        out.push(`<ul>${items.join('')}</ul>`);
        continue;
      }
      // Paragraph: gather contiguous lines
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(#{2,3} |[*-] )/.test(lines[i])) {
        buf.push(lines[i]); i++;
      }
      out.push(`<p>${inline(buf.join(' '))}</p>`);
    }
    return out.join('');
  }
  function inline(s) {
    let t = h(s);
    // bold
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // links: [label](url)
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
      const u = safeUrl(url);
      return `<a href="${h(u)}">${label}</a>`;
    });
    return t;
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

  const api = { renderBlocks, renderBlock, BLOCK_RENDERERS };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CMSRender = api;
})(typeof window !== 'undefined' ? window : globalThis);
