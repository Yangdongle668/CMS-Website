const express = require('express');
const { many } = require('../db/client');

const router = express.Router();

function publicUrl() {
  return (process.env.PUBLIC_URL || '').replace(/\/$/, '');
}

router.get('/robots.txt', (_req, res) => {
  const base = publicUrl();
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

router.get('/sitemap.xml', async (_req, res) => {
  const base = publicUrl();
  // Always-on baseline routes — keep these even if pages table is empty.
  const staticPaths = [
    { loc: '/',                priority: 1.0, changefreq: 'weekly' },
    { loc: '/blog/',           priority: 0.7, changefreq: 'weekly' },
    { loc: '/contact.html',    priority: 0.7, changefreq: 'monthly' },
  ];

  // Editable pages from /api/pages
  const pageRows = await many(
    `SELECT slug, updated_at FROM pages WHERE status = 'published'`
  );
  function pageSlugToUrl(slug) {
    if (slug === 'home') return '/';
    if (['contact', 'faq', 'privacy', 'terms', 'legal', 'gdpr'].includes(slug)) return '/' + slug + '.html';
    if (slug.endsWith('/index')) return '/' + slug.replace(/\/index$/, '/');
    return '/' + slug + '.html';
  }
  const pagePaths = pageRows.map((p) => ({
    loc: pageSlugToUrl(p.slug),
    priority: p.slug === 'home' ? 1.0 : (p.slug.includes('/index') ? 0.7 : 0.6),
    changefreq: 'monthly',
    lastmod: p.updated_at,
  }));
  const pillars = await many(
    `SELECT slug, updated_at FROM pillar_pages WHERE status='published' ORDER BY sort_order`
  );
  const products = await many(
    `SELECT slug, updated_at FROM products WHERE status='published'`
  );
  const apps = await many(
    `SELECT slug, updated_at FROM applications WHERE status='published'`
  );
  const articles = await many(
    `SELECT slug, COALESCE(published_at, updated_at) AS lastmod FROM articles WHERE status='published'`
  );
  // Deduplicate: pages table may already include /, /contact.html etc.
  const seen = new Set(pagePaths.map((p) => p.loc));
  const items = [
    ...pagePaths,
    ...staticPaths.filter((p) => !seen.has(p.loc)).map((p) => ({ ...p, lastmod: null })),
    ...pillars.map((p) => ({ loc: `/products/${p.slug}`, priority: 1.0, changefreq: 'weekly', lastmod: p.updated_at })),
    ...products.map((p) => ({ loc: `/products/${p.slug}`, priority: 0.7, changefreq: 'monthly', lastmod: p.updated_at })),
    ...apps.map((p) => ({ loc: `/applications/${p.slug}.html`, priority: 0.7, changefreq: 'monthly', lastmod: p.updated_at })),
    ...articles.map((a) => ({ loc: `/blog/${a.slug}`, priority: 0.7, changefreq: 'monthly', lastmod: a.lastmod })),
  ];
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    items
      .map(
        (i) =>
          `  <url><loc>${base}${i.loc}</loc>` +
          (i.lastmod ? `<lastmod>${new Date(i.lastmod).toISOString().slice(0, 10)}</lastmod>` : '') +
          `<changefreq>${i.changefreq}</changefreq><priority>${i.priority.toFixed(1)}</priority></url>`
      )
      .join('\n') +
    '\n</urlset>\n';
  res.type('application/xml').send(xml);
});

module.exports = router;
