const express = require('express');
const { many } = require('../db/client');

const router = express.Router();

function publicUrl() {
  return (process.env.PUBLIC_URL || '').replace(/\/$/, '');
}

router.get('/robots.txt', (_req, res) => {
  const base = publicUrl();
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin/',
      'Disallow: /api/',
      base ? `Sitemap: ${base}/sitemap.xml` : 'Sitemap: /sitemap.xml',
      '',
    ].join('\n')
  );
});

// ----- sitemap.xml -----
// One UNION query instead of five separate trips, plus a 5-minute in-memory
// cache so repeated bot hits don't reach Postgres. The cache is keyed on
// publicUrl + node uptime since the values don't change at runtime.
const SITEMAP_TTL_MS = 5 * 60 * 1000;
let sitemapCache = { xml: null, expires: 0 };

function pageSlugToUrl(slug) {
  if (slug === 'home') return '/';
  if (['contact', 'faq', 'privacy', 'terms', 'legal', 'gdpr'].includes(slug)) return '/' + slug + '.html';
  if (slug.endsWith('/index')) return '/' + slug.replace(/\/index$/, '/');
  return '/' + slug + '.html';
}

async function fetchAllRoutes() {
  const rows = await many(`
    SELECT 'page'     AS kind, slug, updated_at AS lastmod FROM pages          WHERE status='published'
    UNION ALL
    SELECT 'pillar'   AS kind, slug, updated_at AS lastmod FROM pillar_pages   WHERE status='published'
    UNION ALL
    SELECT 'product'  AS kind, slug, updated_at AS lastmod FROM products       WHERE status='published'
    UNION ALL
    SELECT 'app'      AS kind, slug, updated_at AS lastmod FROM applications   WHERE status='published'
    UNION ALL
    SELECT 'article'  AS kind, slug, COALESCE(published_at, updated_at) AS lastmod FROM articles WHERE status='published'
  `);
  return rows;
}

async function buildSitemap() {
  const base = publicUrl();
  const rows = await fetchAllRoutes();
  const items = [];
  const seen = new Set();

  function add(loc, priority, changefreq, lastmod) {
    if (seen.has(loc)) return;
    seen.add(loc);
    items.push({ loc, priority, changefreq, lastmod });
  }

  for (const r of rows) {
    switch (r.kind) {
      case 'page': {
        const loc = pageSlugToUrl(r.slug);
        const priority = r.slug === 'home' ? 1.0 : (r.slug.includes('/index') ? 0.7 : 0.6);
        add(loc, priority, 'monthly', r.lastmod);
        break;
      }
      case 'pillar':  add(`/products/${r.slug}`,      1.0, 'weekly',  r.lastmod); break;
      case 'product': add(`/products/${r.slug}`,      0.7, 'monthly', r.lastmod); break;
      case 'app':     add(`/applications/${r.slug}.html`, 0.7, 'monthly', r.lastmod); break;
      case 'article': add(`/blog/${r.slug}`,          0.7, 'monthly', r.lastmod); break;
    }
  }

  // Always-on baseline routes — keep these even if pages table is empty.
  add('/',             1.0, 'weekly',  null);
  add('/blog/',        0.7, 'weekly',  null);
  add('/contact.html', 0.7, 'monthly', null);

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    items.map((i) =>
      `  <url><loc>${base}${i.loc}</loc>` +
      (i.lastmod ? `<lastmod>${new Date(i.lastmod).toISOString().slice(0, 10)}</lastmod>` : '') +
      `<changefreq>${i.changefreq}</changefreq><priority>${i.priority.toFixed(1)}</priority></url>`
    ).join('\n') +
    '\n</urlset>\n';
}

router.get('/sitemap.xml', async (_req, res) => {
  const now = Date.now();
  if (sitemapCache.xml && sitemapCache.expires > now) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.type('application/xml').send(sitemapCache.xml);
  }
  try {
    const xml = await buildSitemap();
    sitemapCache = { xml, expires: now + SITEMAP_TTL_MS };
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.type('application/xml').send(xml);
  } catch (err) {
    console.error('[sitemap] build failed', err);
    // Serve the stale cache if we have one — better than 500ing crawlers.
    if (sitemapCache.xml) {
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.type('application/xml').send(sitemapCache.xml);
    }
    res.status(500).type('text/plain').send('sitemap build failed');
  }
});

// Allow page/article/product writes to bust the cache when an admin edit
// changes the URL inventory.
function invalidateSitemap() { sitemapCache = { xml: null, expires: 0 }; }
router.invalidateSitemap = invalidateSitemap;

module.exports = router;
