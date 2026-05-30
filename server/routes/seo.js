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
const { many, one } = require('../db/client');

const router = express.Router();

// Reuse the html-tokens resolver so we have one source of truth across
// canonical tags, sitemap, robots.txt and email templates:
//   1) env PUBLIC_URL
//   2) settings.seo.public_url (cached in memory, refreshed on save + 30s)
//   3) request host (last resort; can produce localhost in dev)
const { resolveCanonicalBase } = require('../middleware/html-tokens');
function resolvePublicUrl(req) { return resolveCanonicalBase(req); }

// Build the comprehensive SEO + GEO default robots.txt.
// Exported so the admin page can show it as the "reset to default" preview.
function buildDefaultRobots(base) {
  const sitemap = base ? `${base}/sitemap.xml` : '';
  return [
    '# =============================================================',
    '# robots.txt — SEO + GEO optimised',
    '# GEO = Generative Engine Optimisation:',
    '#   all known AI crawlers are explicitly allowed so your content',
    '#   can be cited in ChatGPT, Gemini, Claude, Perplexity, etc.',
    '# =============================================================',
    '',
    '# ── Default rule ─────────────────────────────────────────────',
    'User-agent: *',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /uploads/private/',
    'Allow: /',
    '',
    '# ── Google ───────────────────────────────────────────────────',
    'User-agent: Googlebot',
    'Allow: /',
    '',
    'User-agent: Googlebot-Image',
    'Allow: /',
    '',
    '# ── Google AI — Gemini · AI Overviews · SGE ──────────────────',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    '# ── Bing / Microsoft ─────────────────────────────────────────',
    'User-agent: bingbot',
    'Allow: /',
    '',
    'User-agent: BingPreview',
    'Allow: /',
    '',
    '# ── OpenAI — ChatGPT · Operator agents ──────────────────────',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    '',
    '# ── Anthropic — Claude ───────────────────────────────────────',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
    'User-agent: anthropic-ai',
    'Allow: /',
    '',
    '# ── Perplexity AI ────────────────────────────────────────────',
    'User-agent: PerplexityBot',
    'Allow: /',
    '',
    '# ── Apple — Siri · Apple Intelligence ───────────────────────',
    'User-agent: Applebot',
    'Allow: /',
    '',
    'User-agent: Applebot-Extended',
    'Allow: /',
    '',
    '# ── Amazon — Alexa · Rufus shopping AI ──────────────────────',
    'User-agent: Amazonbot',
    'Allow: /',
    '',
    '# ── Meta AI — Llama · Meta AI Assistant ─────────────────────',
    'User-agent: FacebookBot',
    'Allow: /',
    '',
    '# ── Common Crawl — trains most open-source LLMs ─────────────',
    'User-agent: CCBot',
    'Allow: /',
    '',
    '# ── ByteDance — Doubao · Coze ────────────────────────────────',
    'User-agent: Bytespider',
    'Allow: /',
    '',
    '# ── Cohere — Command models ──────────────────────────────────',
    'User-agent: cohere-ai',
    'Allow: /',
    '',
    '# ── You.com AI ───────────────────────────────────────────────',
    'User-agent: YouBot',
    'Allow: /',
    '',
    '# ── Brave Search ────────────────────────────────────────────',
    'User-agent: Brave',
    'Allow: /',
    '',
    '# ── DuckDuckGo ───────────────────────────────────────────────',
    'User-agent: DuckDuckBot',
    'Allow: /',
    '',
    '# ── Other search engines ─────────────────────────────────────',
    'User-agent: Slurp',
    'Allow: /',
    '',
    'User-agent: Baiduspider',
    'Allow: /',
    '',
    'User-agent: YandexBot',
    'Allow: /',
    '',
    '# ── SEO research tools — rate-limited ───────────────────────',
    '# Keeping these lets your site appear in backlink & audit tools.',
    'User-agent: AhrefsBot',
    'Crawl-delay: 10',
    '',
    'User-agent: SemrushBot',
    'Crawl-delay: 10',
    '',
    'User-agent: MajesticSEO',
    'Crawl-delay: 10',
    '',
    '# ── Block aggressive scrapers ────────────────────────────────',
    'User-agent: MJ12bot',
    'Disallow: /',
    '',
    'User-agent: DotBot',
    'Disallow: /',
    '',
    'User-agent: BLEXBot',
    'Disallow: /',
    '',
    'User-agent: DataForSeoBot',
    'Disallow: /',
    '',
    'User-agent: PetalBot',
    'Disallow: /',
    '',
    'User-agent: SeznamBot',
    'Disallow: /',
    '',
    '# ── Sitemap ──────────────────────────────────────────────────',
    sitemap ? `Sitemap: ${sitemap}` : '# Sitemap: https://yourdomain.com/sitemap.xml',
    '',
  ].join('\n');
}
exports.buildDefaultRobots = buildDefaultRobots;

router.get('/robots.txt', async (req, res) => {
  const base = resolvePublicUrl(req);
  res.type('text/plain');

  // Admin-saved custom content takes precedence
  try {
    const row = await one(`SELECT value FROM settings WHERE key = 'robots_txt'`);
    if (row && row.value && typeof row.value.content === 'string') {
      return res.send(row.value.content);
    }
  } catch (_) { /* fall through to default */ }

  res.send(buildDefaultRobots(base));
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
  '/applications/smart-glasses.html',
  '/applications/medical.html',
  '/applications/wearables.html',
  '/applications/iot.html',
  '/applications/smart-home.html',
  '/applications/defence-aerospace.html',
  '/applications/power-tools.html',
  '/applications/industrial-handhelds.html',
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
