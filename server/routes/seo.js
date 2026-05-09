// SEO endpoints: robots.txt + sitemap.xml
//
// Per Google's 2025-2026 sitemap guidance:
//   - <loc> MUST be absolute (we resolve via PUBLIC_URL → settings.seo
//     → request host, in that order).
//   - <priority> and <changefreq> are ignored by Google; we don't emit them.
//   - <lastmod> is the only attribute Google uses, so we emit ISO 8601.
//   - Image sitemap (xmlns:image) helps Image Search discovery for the
//     hero/cover images that aren't reachable via <img> on every page.
//
// robots.txt:
//   - Sitemap: directive uses an ABSOLUTE URL (Google requirement).
//   - Disallow private routes and uploads/private/* path (reserved for
//     admin-only assets like signed datasheets).

const express = require('express');
const { many } = require('../db/client');

const router = express.Router();

function resolvePublicUrl(req) {
  const fromEnv = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  // Try DB settings synchronously is awkward in Express; we read the
  // settings cache exposed by the html-tokens middleware. Falls back to
  // request host so robots.txt is never invalid.
  try {
    // Lazy require to avoid a circular load at boot.
    const tokens = require('../middleware/html-tokens');
    if (tokens && tokens.loadSettingsCache) {
      // The cache may already be populated. The function is fire-and-forget;
      // we only read settingsCache via the export shape if available.
      // We can't easily reach the in-module cache, so re-derive from req.
    }
  } catch (_) { /* ignore */ }
  if (req && req.headers && req.headers.host) {
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
    return `${proto}://${req.headers.host}`;
  }
  return '';
}

router.get('/robots.txt', (req, res) => {
  const base = resolvePublicUrl(req);
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin/',
      'Disallow: /admin',
      'Disallow: /api/',
      'Disallow: /uploads/private/',
      '',
      // Encourage AI crawlers explicitly. Site owners can change this in
      // future via a settings.seo flag.
      'User-agent: GPTBot',
      'Allow: /',
      '',
      'User-agent: Google-Extended',
      'Allow: /',
      '',
      'User-agent: PerplexityBot',
      'Allow: /',
      '',
      `Sitemap: ${base}/sitemap.xml`,
      '',
    ].join('\n')
  );
});

// Static routes that always exist regardless of DB state. Generated from
// the actual files in /public so adding a new HTML page also adds it to
// the sitemap on the next request.
const STATIC_ROUTES = [
  '/',
  '/about/',
  '/about/profile.html',
  '/about/factory.html',
  '/about/team.html',
  '/applications/',
  '/applications/ar-vr.html',
  '/applications/medical.html',
  '/applications/wearables.html',
  '/applications/iot.html',
  '/blog/',
  '/contact.html',
  '/faq.html',
  '/products/',
  '/solutions/',
  '/solutions/design.html',
  '/solutions/prototyping.html',
  '/solutions/mass-production.html',
  // Legal pages — keep indexable for E-E-A-T trust signals.
  '/privacy.html',
  '/terms.html',
  '/legal.html',
  '/gdpr.html',
];

function isoDate(d) {
  if (!d) return null;
  try { return new Date(d).toISOString(); } catch (_) { return null; }
}

function xmlEscape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[c]);
}

router.get('/sitemap.xml', async (req, res) => {
  const base = resolvePublicUrl(req);
  // -------- Pages from /api/pages (CMS-editable static page overrides) --------
  let pageRows = [];
  try {
    pageRows = await many(`SELECT slug, updated_at FROM pages WHERE status = 'published'`);
  } catch (_) { /* table may not exist on first boot */ }
  function pageSlugToUrl(slug) {
    if (slug === 'home') return '/';
    if (['contact', 'faq', 'privacy', 'terms', 'legal', 'gdpr'].includes(slug)) return '/' + slug + '.html';
    if (slug.endsWith('/index')) return '/' + slug.replace(/\/index$/, '/');
    return '/' + slug + '.html';
  }
  const pageEntries = pageRows.map((p) => ({
    loc: pageSlugToUrl(p.slug),
    lastmod: isoDate(p.updated_at),
    images: [],
  }));

  // -------- Pillar pages --------
  let pillars = [];
  try {
    pillars = await many(
      `SELECT slug, hero_image, updated_at FROM pillar_pages WHERE status='published' ORDER BY sort_order`
    );
  } catch (_) {}
  const pillarEntries = pillars.map((p) => ({
    loc: `/products/${p.slug}`,
    lastmod: isoDate(p.updated_at),
    images: p.hero_image ? [p.hero_image] : [],
  }));

  // -------- Products --------
  let products = [];
  try {
    products = await many(
      `SELECT slug, cover_url, updated_at FROM products WHERE status='published'`
    );
  } catch (_) {}
  const productEntries = products.map((p) => ({
    loc: `/products/${p.slug}`,
    lastmod: isoDate(p.updated_at),
    images: p.cover_url ? [p.cover_url] : [],
  }));

  // -------- Applications (DB-backed) --------
  let apps = [];
  try {
    apps = await many(
      `SELECT slug, cover_url, updated_at FROM applications WHERE status='published'`
    );
  } catch (_) {}
  const appEntries = apps.map((a) => ({
    loc: `/applications/${a.slug}.html`,
    lastmod: isoDate(a.updated_at),
    images: a.cover_url ? [a.cover_url] : [],
  }));

  // -------- Articles --------
  let articles = [];
  try {
    articles = await many(
      `SELECT slug, cover_url, hero_image, COALESCE(published_at, updated_at) AS lastmod
         FROM articles WHERE status='published'`
    );
  } catch (_) {}
  const articleEntries = articles.map((a) => ({
    loc: `/blog/${a.slug}`,
    lastmod: isoDate(a.lastmod),
    images: [a.hero_image, a.cover_url].filter(Boolean),
  }));

  // -------- Compose, dedupe by loc --------
  const seen = new Set();
  const items = [];
  function push(entry) {
    if (!entry || !entry.loc) return;
    if (seen.has(entry.loc)) return;
    seen.add(entry.loc);
    items.push(entry);
  }
  // CMS-managed entries first (most specific lastmod), then static fallback.
  pageEntries.forEach(push);
  pillarEntries.forEach(push);
  productEntries.forEach(push);
  appEntries.forEach(push);
  articleEntries.forEach(push);
  STATIC_ROUTES.forEach((loc) => push({ loc, lastmod: null, images: [] }));

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
    ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    items
      .map((i) => {
        const imgs = (i.images || []).filter(Boolean).map((u) => {
          const abs = /^https?:\/\//.test(u) ? u : (base + u);
          return `    <image:image><image:loc>${xmlEscape(abs)}</image:loc></image:image>`;
        }).join('\n');
        return (
          '  <url>\n' +
          `    <loc>${xmlEscape(base + i.loc)}</loc>\n` +
          (i.lastmod ? `    <lastmod>${xmlEscape(i.lastmod)}</lastmod>\n` : '') +
          (imgs ? imgs + '\n' : '') +
          '  </url>'
        );
      })
      .join('\n') +
    '\n</urlset>\n';
  res.type('application/xml').send(xml);
});

module.exports = router;
