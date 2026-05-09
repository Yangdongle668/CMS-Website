/**
 * cms-page.js — hydrates a static page with content from /api/pages/by-slug/<slug>.
 *
 * On every static page, set <body data-page="<slug>"> (e.g. data-page="about/profile",
 * data-page="home"). This script will:
 *   - update document.title to page.meta_title || page.title
 *   - update <meta name="description"> to page.meta_description
 *   - replace .page-hero h1 with hero_title
 *   - replace .page-hero p (first one) with hero_subtitle
 *   - replace .page-hero inline background-image with hero_image
 *   - rebuild .breadcrumbs from hero_breadcrumbs JSON
 *   - if body_html is set, replace innerHTML of [data-page-body]
 *   - for the home page, apply sections JSON to [data-section="<name>"] elements
 *
 * Failure mode: if API fails, the static fallback content stays. No flash.
 */
(function () {
'use strict';

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function hydrate() {
  const slug = document.body.dataset.page;
  if (!slug) return;
  let page;
  try {
    const res = await fetch('/api/pages/by-slug/' + slug);
    if (!res.ok) return;
    const j = await res.json();
    page = j.page;
  } catch (_) { return; }
  if (!page) return;

  // Title + meta
  const title = page.meta_title || page.title;
  if (title) document.title = title;
  const desc = page.meta_description;
  function upsertMeta(selector, attrs) {
    let m = document.querySelector(selector);
    if (!m) {
      m = document.createElement('meta');
      Object.entries(attrs.baseAttrs).forEach(([k, v]) => m.setAttribute(k, v));
      document.head.appendChild(m);
    }
    m.setAttribute('content', attrs.content);
  }
  if (desc) {
    upsertMeta('meta[name="description"]', { baseAttrs: { name: 'description' }, content: desc });
    upsertMeta('meta[property="og:description"]', { baseAttrs: { property: 'og:description' }, content: desc });
    upsertMeta('meta[name="twitter:description"]', { baseAttrs: { name: 'twitter:description' }, content: desc });
  }
  if (title) {
    upsertMeta('meta[property="og:title"]', { baseAttrs: { property: 'og:title' }, content: title });
    upsertMeta('meta[name="twitter:title"]', { baseAttrs: { name: 'twitter:title' }, content: title });
  }
  if (page.hero_image) {
    upsertMeta('meta[property="og:image"]', { baseAttrs: { property: 'og:image' }, content: page.hero_image });
    upsertMeta('meta[name="twitter:image"]', { baseAttrs: { name: 'twitter:image' }, content: page.hero_image });
  }
  upsertMeta('meta[property="og:type"]', { baseAttrs: { property: 'og:type' }, content: 'website' });
  upsertMeta('meta[name="twitter:card"]', { baseAttrs: { name: 'twitter:card' }, content: 'summary_large_image' });
  // Canonical
  let can = document.querySelector('link[rel="canonical"]');
  if (!can) {
    can = document.createElement('link');
    can.setAttribute('rel', 'canonical');
    document.head.appendChild(can);
  }
  can.setAttribute('href', location.origin + location.pathname);

  // ----- Image-URL fragment parser -----
  // Mirrors admin/assets/js/image-picker.js so URL fragments (#pos=top-
  // left&fit=cover) round-trip through this hydration step. Without this
  // we'd strip the position information when applying the override and
  // the visitor would see the centred crop after JS hydration even when
  // the operator picked a different focal point in the admin.
  function parseImageUrl(rawUrl) {
    if (!rawUrl) return { url: '', position: 'center', fit: 'cover' };
    const i = rawUrl.indexOf('#');
    if (i === -1) return { url: rawUrl, position: 'center', fit: 'cover' };
    const url = rawUrl.slice(0, i);
    const params = {};
    for (const part of rawUrl.slice(i + 1).split('&')) {
      const [k, v = ''] = part.split('=');
      if (k) {
        try { params[decodeURIComponent(k)] = decodeURIComponent(v); }
        catch (_) { params[k] = v; }
      }
    }
    return {
      url,
      position: params.pos || 'center',
      fit: params.fit === 'contain' ? 'contain' : 'cover',
    };
  }

  // Hero — works for both .hero (homepage) and .page-hero (subpages)
  const hero = document.querySelector('.page-hero, .hero');
  if (hero) {
    if (page.hero_image) {
      const parsed = parseImageUrl(page.hero_image);
      const safe = parsed.url.replace(/'/g, "\\'");
      hero.style.backgroundImage = `url('${safe}')`;
      hero.style.backgroundPosition = parsed.position.replace(/-/g, ' ');
      hero.style.backgroundSize = parsed.fit;
      hero.style.backgroundRepeat = 'no-repeat';
    }
    // Breadcrumbs
    const crumbs = hero.querySelector('.breadcrumbs');
    if (crumbs && Array.isArray(page.hero_breadcrumbs) && page.hero_breadcrumbs.length) {
      crumbs.innerHTML = page.hero_breadcrumbs.map((c, i, arr) => {
        const sep = i < arr.length - 1 ? '<span>/</span>' : '';
        if (c.url && i < arr.length - 1) {
          return `<a href="${escapeHtml(c.url)}">${escapeHtml(c.label)}</a>${sep}`;
        }
        return `<span>${escapeHtml(c.label)}</span>${sep}`;
      }).join('');
    }
    // h1 (handle homepage's nested .hero-top h1 too)
    const h1 = hero.querySelector('h1');
    if (h1 && page.hero_title) h1.innerHTML = escapeHtml(page.hero_title).replace(/\n/g, '<br>');
    // first <p> (subtitle / .subtitle)
    const subEl = hero.querySelector('.subtitle, p');
    if (subEl && page.hero_subtitle) subEl.textContent = page.hero_subtitle;
  }

  // Body override
  const bodyMount = document.querySelector('[data-page-body]');
  if (bodyMount && page.body_html && page.body_html.trim()) {
    bodyMount.innerHTML = page.body_html;
  }

  // Section-level overrides (used by homepage)
  if (page.sections && typeof page.sections === 'object') {
    for (const key of Object.keys(page.sections)) {
      const value = page.sections[key];
      const el = document.querySelector(`[data-section="${key}"]`);
      if (!el) continue;
      // If the value is a string → text content
      if (typeof value === 'string') { el.textContent = value; continue; }
      // If it's an object with .text and .href (a CTA), update child <a>
      if (value && typeof value === 'object') {
        if ('text' in value && el.tagName === 'A') {
          el.textContent = value.text;
          if (value.link) el.setAttribute('href', value.link);
          continue;
        }
        // For arrays / structured content, fire a custom event so the page can render
        el.dispatchEvent(new CustomEvent('page:section', { detail: { key, value } }));
      }
    }
    // Also broadcast the full sections object — for pages that handle complex data themselves.
    document.dispatchEvent(new CustomEvent('page:sections', { detail: page.sections }));
  }

  document.dispatchEvent(new CustomEvent('page:ready', { detail: page }));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrate);
} else {
  hydrate();
}
})();
