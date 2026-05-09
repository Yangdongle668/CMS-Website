// SSR-friendly detail-page renderer for pillar / blog / application slugs.
//
// Reads the matching DB row, generates server-rendered <head> tags
// (title, meta description, canonical, og:*, twitter:*, JSON-LD) and
// injects them into the corresponding _template.html before sending it
// to the client. The client-side script then hydrates the page body.
//
// Why this matters for SEO (Google JS-SEO docs, 2025-12 update):
//   - Googlebot prefers HTML-rendered <title>/<meta>/<link rel="canonical">.
//   - Social-card scrapers (LinkedIn, Slack, X) and AI parsers
//     (Perplexity, ChatGPT search, Gemini) do NOT execute JavaScript;
//     they need OG meta in the initial HTML.
//   - The previous behaviour was to ship _template.html with empty
//     placeholders, which produced soft-404s and zero card previews.

const fs = require('fs');
const path = require('path');
const { one, many } = require('../db/client');
const { replaceTokens, buildContext } = require('./html-tokens');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function abs(u, base) {
  if (!u) return '';
  return /^https?:\/\//.test(u) ? u : base + u;
}

// Replace the template's placeholder <head> markers with rendered values.
// We anchor on existing tokens so the same _template.html stays
// developer-friendly: opening it directly in a browser still loads
// (the placeholders are inert text), but server-rendered responses get
// fully resolved meta.
function injectIntoHead(html, head) {
  // Replace the template's <title> and <meta description> with rendered text.
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(head.title)}</title>`);
  html = html.replace(
    /<meta\s+name=["']description["'][^>]*content=["'][^"']*["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(head.description)}">`
  );
  // Replace OG/Twitter/canonical that the template ships with empty strings.
  const replacements = [
    [/<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeHtml(head.title)}">`],
    [/<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeHtml(head.description)}">`],
    [/<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${escapeHtml(head.ogImage)}">`],
    [/<meta\s+property=["']og:type["'][^>]*>/i, `<meta property="og:type" content="${head.ogType}">`],
    [/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escapeHtml(head.canonicalUrl)}">`],
  ];
  for (const [re, sub] of replacements) {
    if (re.test(html)) html = html.replace(re, sub);
  }
  // Inject site_name/url + twitter cards if not present.
  const extras = [
    `<meta property="og:site_name" content="${escapeHtml(head.siteName)}">`,
    `<meta property="og:url" content="${escapeHtml(head.canonicalUrl)}">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(head.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(head.description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(head.ogImage)}">`,
    `<meta name="theme-color" content="#0b3a82">`,
  ];
  // Insert after canonical if present, else after the description meta.
  const anchor = /<link\s+rel=["']canonical["'][^>]*>/i;
  if (anchor.test(html)) {
    html = html.replace(anchor, (m) => m + '\n' + extras.join('\n'));
  } else {
    html = html.replace(/(<meta\s+name=["']description["'][^>]*>)/i, `$1\n${extras.join('\n')}`);
  }
  // Replace the empty data-jsonld script with rendered JSON-LD.
  if (head.jsonLd) {
    html = html.replace(
      /<script\s+type=["']application\/ld\+json["']\s+data-jsonld[^>]*>[\s\S]*?<\/script>/i,
      `<script type="application/ld+json" data-jsonld>${head.jsonLd}</script>`
    );
  }
  return html;
}

async function renderPillar(req, res, slug) {
  let pillar;
  try { pillar = await one(`SELECT * FROM pillar_pages WHERE slug=$1 AND status='published'`, [slug]); }
  catch (_) { return false; }
  if (!pillar) return false;

  const tplPath = path.join(PUBLIC_DIR, 'products', '_template.html');
  if (!fs.existsSync(tplPath)) return false;
  let html = fs.readFileSync(tplPath, 'utf8');

  // Resolve common tokens (CANONICAL_BASE, SITE_NAME, etc.).
  const ctx = buildContext(req, req.path);
  html = replaceTokens(html, ctx);

  // Build per-pillar head.
  const title = pillar.meta_title || `${pillar.name} | ${ctx.siteName}`;
  const description = pillar.meta_description || pillar.hero_subtitle || '';
  const ogImage = abs(pillar.hero_image || ctx.defaultOgImage, ctx.canonicalBase);
  const canonicalUrl = ctx.canonicalBase + req.path;

  // Pull related apps and a few articles for richer JSON-LD context.
  let related = [];
  try { related = await many(
    `SELECT slug, name FROM applications WHERE slug = ANY($1::text[])`,
    [Array.isArray(pillar.applications) ? pillar.applications : []]
  ); } catch (_) {}

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': canonicalUrl + '#product',
      name: pillar.name,
      description,
      image: ogImage,
      brand: { '@type': 'Brand', name: ctx.siteName },
      manufacturer: { '@id': ctx.canonicalBase + '/#organization' },
      category: 'Lithium Battery',
      url: canonicalUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: ctx.canonicalBase + '/' },
        { '@type': 'ListItem', position: 2, name: 'Products', item: ctx.canonicalBase + '/products/' },
        { '@type': 'ListItem', position: 3, name: pillar.name, item: canonicalUrl },
      ],
    },
  ];
  if (Array.isArray(pillar.faq) && pillar.faq.length) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: pillar.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  html = injectIntoHead(html, {
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType: 'product',
    siteName: ctx.siteName,
    jsonLd: JSON.stringify(ld),
  });

  res.type('html').send(html);
  return true;
}

async function renderArticle(req, res, slug) {
  let article;
  try { article = await one(`
    SELECT a.*, c.name AS category_name, c.slug AS category_slug,
           p.slug AS pillar_slug, p.short_name AS pillar_short_name, p.name AS pillar_name,
           au.slug AS author_slug, au.name AS author_name, au.job_title AS author_job_title,
           au.bio AS author_bio, au.avatar_url AS author_avatar_url,
           au.knows_about AS author_knows_about, au.same_as AS author_same_as
      FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      LEFT JOIN pillar_pages p ON p.id = a.pillar_id
      LEFT JOIN authors au ON au.id = a.author_id
     WHERE a.slug=$1 AND a.status='published'`, [slug]); }
  catch (_) { return false; }
  if (!article) return false;

  const tplPath = path.join(PUBLIC_DIR, 'blog', '_template.html');
  if (!fs.existsSync(tplPath)) return false;
  let html = fs.readFileSync(tplPath, 'utf8');

  const ctx = buildContext(req, req.path);
  html = replaceTokens(html, ctx);

  const baseTitle = article.meta_title || article.title;
  // Avoid double-brand when seed meta_title already includes site name.
  const includesBrand = new RegExp(`\\|\\s*${ctx.siteName}\\s*$`, 'i').test(baseTitle);
  const title = includesBrand ? baseTitle : `${baseTitle} | ${ctx.siteName}`;
  const description = article.meta_description || article.excerpt || '';
  const ogImage = abs(article.hero_image || article.cover_url || ctx.defaultOgImage, ctx.canonicalBase);
  const canonicalUrl = ctx.canonicalBase + req.path;

  // Build a fully-described Person node when an authors row is linked.
  // Falls back to a Person typed by the legacy free-text author field.
  const authorNode = article.author_slug ? {
    '@type': 'Person',
    '@id': ctx.canonicalBase + '/about/team/' + article.author_slug + '#person',
    name: article.author_name,
    jobTitle: article.author_job_title || undefined,
    description: (article.author_bio || '').slice(0, 320) || undefined,
    image: article.author_avatar_url ? abs(article.author_avatar_url, ctx.canonicalBase) : undefined,
    knowsAbout: Array.isArray(article.author_knows_about) && article.author_knows_about.length
      ? article.author_knows_about : undefined,
    sameAs: Array.isArray(article.author_same_as) && article.author_same_as.length
      ? article.author_same_as : undefined,
    worksFor: { '@id': ctx.canonicalBase + '/#organization' },
    url: ctx.canonicalBase + '/about/team/' + article.author_slug,
  } : {
    '@type': 'Person',
    name: article.author || `${ctx.siteName} Engineering`,
    worksFor: { '@id': ctx.canonicalBase + '/#organization' },
  };

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': canonicalUrl + '#article',
      headline: article.title,
      description,
      image: ogImage,
      author: authorNode,
      publisher: { '@id': ctx.canonicalBase + '/#organization' },
      datePublished: article.published_at ? new Date(article.published_at).toISOString() : undefined,
      dateModified: article.updated_at ? new Date(article.updated_at).toISOString() : undefined,
      mainEntityOfPage: canonicalUrl,
      articleSection: article.category_name || undefined,
      url: canonicalUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: ctx.canonicalBase + '/' },
        { '@type': 'ListItem', position: 2, name: 'Insights', item: ctx.canonicalBase + '/blog/' },
        { '@type': 'ListItem', position: 3, name: article.title, item: canonicalUrl },
      ],
    },
  ];

  html = injectIntoHead(html, {
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType: 'article',
    siteName: ctx.siteName,
    jsonLd: JSON.stringify(ld),
  });

  res.type('html').send(html);
  return true;
}

async function renderApplication(req, res, slug) {
  let app;
  try { app = await one(`SELECT * FROM applications WHERE slug=$1 AND status='published'`, [slug]); }
  catch (_) { return false; }
  if (!app) return false;

  const tplPath = path.join(PUBLIC_DIR, 'applications', '_template.html');
  if (!fs.existsSync(tplPath)) return false;
  let html = fs.readFileSync(tplPath, 'utf8');

  const ctx = buildContext(req, req.path);
  html = replaceTokens(html, ctx);

  const title = app.meta_title || `${app.name} | ${ctx.siteName}`;
  const description = app.meta_description || app.summary || '';
  const ogImage = abs(app.cover_url || ctx.defaultOgImage, ctx.canonicalBase);
  const canonicalUrl = ctx.canonicalBase + req.path;

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': canonicalUrl + '#webpage',
      name: app.name,
      description,
      url: canonicalUrl,
      image: ogImage,
      isPartOf: { '@id': ctx.canonicalBase + '/#website' },
      about: { '@id': ctx.canonicalBase + '/#organization' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: ctx.canonicalBase + '/' },
        { '@type': 'ListItem', position: 2, name: 'Applications', item: ctx.canonicalBase + '/applications/' },
        { '@type': 'ListItem', position: 3, name: app.name, item: canonicalUrl },
      ],
    },
  ];

  html = injectIntoHead(html, {
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType: 'website',
    siteName: ctx.siteName,
    jsonLd: JSON.stringify(ld),
  });

  res.type('html').send(html);
  return true;
}

module.exports = { renderPillar, renderArticle, renderApplication };
