// SEO endpoints: robots.txt + sitemap.xml
//
// Per Google's 2025-2026 sitemap guidance:
//   - <loc> MUST be absolute (we resolve via PUBLIC_URL → request host).
//   - <priority> and <changefreq> are ignored by Google so we don't emit them.
//   - <lastmod> is the only attribute Google uses, so we emit ISO 8601.
//   - Image sitemap (xmlns:image) helps Image Search discover the hero /
//     cover images that aren't reachable via plain <img> on every page.
//
// robots.txt:
//   - Sitemap: directive uses an ABSOLUTE URL (Google requirement).
//   - Explicit Allow: blocks for GPTBot / Google-Extended / PerplexityBot
//     so AI search engines have an opt-in to crawl the site.
//   - Disallow /admin, /api, and the /uploads/private/ path reserved for
//     signed datasheets that shouldn't show up in search.

const express = require('express');
const { many } = require('../db/client');

const router = express.Router();

function resolvePublicUrl(req) {
  const fromEnv = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  // Last-resort fallback so robots.txt is never invalid: derive from the
  // request host + protocol. Production should always set PUBLIC_URL.
  if (req && req.headers && req.headers.host) {
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
    return `${proto}://${req.headers.host}`;
  }
  return '';
}

router.get('/robots.txt', (req, res) => {
  const base = resolvePublicUrl(req);
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin/',
      'Disallow: /admin',
      'Disallow: /api/',
      'Disallow: /uploads/private/',
      '',
      // AI search crawlers explicitly allowed. Site owners can flip these to
      // Disallow via a future setting if their content policy changes.
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

// ----- sitemap.xml -----
// One UNION query instead of five separate trips, plus a 5-minute in-memory
// cache so repeated bot hits don't reach Postgres. The cache key is
// publicUrl + node uptime since the values don't change at runtime.
const SITEMAP_TTL_MS = 5 * 60 * 1000;
let sitemapCache = { xml: null, expires: 0, base: '' };

function pageSlugToUrl(slug) {
  if (slug === 'home') return '/';
  if (['contact', 'faq', 'privacy', 'terms', 'legal', 'gdpr'].includes(slug)) return '/' + slug + '.html';
  if (slug.endsWith('/index')) return '/' + slug.replace(/\/index$/, '/');
  return '/' + slug + '.html';
}

function xmlEscape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[c]);
}

function isoDate(d) {
  if (!d) return null;
  try { return new Date(d).toISOString(); } catch (_) { return null; }
}

async function fetchAllRoutes() {
  // Articles include cover_url + hero_image so we can emit <image:image>
  // entries. Pillars / products / applications get their cover too.
  return many(`
    SELECT 'page'    AS kind, slug, updated_at AS lastmod, hero_image AS image FROM pages         WHERE status='published'
    UNION ALL
    SELECT 'pillar'  AS kind, slug, updated_at AS lastmod, hero_image AS image FROM pillar_pages  WHERE status='published'
    UNION ALL
    SELECT 'product' AS kind, slug, updated_at AS lastmod, cover_url  AS image FROM products      WHERE status='published'
    UNION ALL
    SELECT 'app'     AS kind, slug, updated_at AS lastmod, cover_url  AS image FROM applications  WHERE status='published'
    UNION ALL
    SELECT 'article' AS kind, slug, COALESCE(published_at, updated_at) AS lastmod,
           COALESCE(NULLIF(hero_image, ''), cover_url) AS image                FROM articles      WHERE status='published'
  `);
}

async function buildSitemap(base) {
  const rows = await fetchAllRoutes();
  const items = [];
  const seen = new Set();

  function add(loc, lastmod, image) {
    if (seen.has(loc)) return;
    seen.add(loc);
    items.push({ loc, lastmod, image });
  }

  for (const r of rows) {
    const img = r.image || null;
    switch (r.kind) {
      case 'page':    add(pageSlugToUrl(r.slug),                 r.lastmod, img); break;
      case 'pillar':  add(`/products/${r.slug}`,                 r.lastmod, img); break;
      case 'product': add(`/products/${r.slug}`,                 r.lastmod, img); break;
      case 'app':     add(`/applications/${r.slug}.html`,        r.lastmod, img); break;
      case 'article': add(`/blog/${r.slug}`,                     r.lastmod, img); break;
    }
  }
  // Always-on baseline routes — present even if their tables are empty.
  add('/',             null, null);
  add('/blog/',        null, null);
  add('/contact.html', null, null);

  // Absolutise image URLs that start with / (uploads), leave http(s):// alone.
  function absolutiseImage(u) {
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('/')) return base + u;
    return '';
  }

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    items.map((i) => {
      const iso = isoDate(i.lastmod);
      const imgUrl = absolutiseImage(i.image);
      return '  <url>' +
        `<loc>${xmlEscape(base + i.loc)}</loc>` +
        (iso ? `<lastmod>${iso}</lastmod>` : '') +
        (imgUrl ? `<image:image><image:loc>${xmlEscape(imgUrl)}</image:loc></image:image>` : '') +
        '</url>';
    }).join('\n') +
    '\n</urlset>\n';
}

router.get('/sitemap.xml', async (req, res) => {
  const base = resolvePublicUrl(req);
  const now = Date.now();
  if (sitemapCache.xml && sitemapCache.expires > now && sitemapCache.base === base) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.type('application/xml').send(sitemapCache.xml);
  }
  try {
    const xml = await buildSitemap(base);
    sitemapCache = { xml, expires: now + SITEMAP_TTL_MS, base };
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.type('application/xml').send(xml);
  } catch (err) {
    console.error('[sitemap] build failed', err);
    // Serve stale cache rather than 500ing a crawler.
    if (sitemapCache.xml) {
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.type('application/xml').send(sitemapCache.xml);
    }
    res.status(500).type('text/plain').send('sitemap build failed');
  }
});

// Page / article / product writes bust the cache so an admin edit shows up
// in /sitemap.xml within the same minute.
function invalidateSitemap() { sitemapCache = { xml: null, expires: 0, base: '' }; }
router.invalidateSitemap = invalidateSitemap;

module.exports = router;
