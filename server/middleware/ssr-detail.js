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

// Pre-fill the visible above-the-fold body placeholders that the
// _template.html ships with empty (e.g. <h1 data-hero-title>Pillar</h1>).
// Without this, visitors see a brief flash of literal "Pillar" text before
// JS finishes hydrating. With this, the page is fully readable from the
// initial HTML response, JS only enhances.
//
// Each entry maps a CSS-style selector (data-attr name) to the rendered
// content type:
//   text  — escapes and replaces innerText
//   bg    — replaces the inline background-image style URL
//   attr  — sets a specific attribute (used for canonical breadcrumb links)
function injectIntoBody(html, body) {
  function setText(html, attrName, value) {
    if (value == null || value === '') return html;
    const safe = escapeHtml(value);
    // Match <tag ... data-attrName ...>...</tag> and replace the inner text.
    const re = new RegExp(
      `(<([a-z0-9]+)\\b[^>]*\\sdata-${attrName}\\b[^>]*>)([\\s\\S]*?)(</\\2>)`,
      'i'
    );
    return html.replace(re, (_m, openTag, _tag, _inner, closeTag) =>
      openTag + safe + closeTag
    );
  }
  function setHtml(html, attrName, htmlContent) {
    // Same as setText but does NOT escape — for cases where we want to
    // inject our own server-rendered markup into a placeholder <div>.
    if (htmlContent == null) return html;
    const re = new RegExp(
      `(<([a-z0-9]+)\\b[^>]*\\sdata-${attrName}\\b[^>]*>)([\\s\\S]*?)(</\\2>)`,
      'i'
    );
    return html.replace(re, (_m, openTag, _tag, _inner, closeTag) =>
      openTag + htmlContent + closeTag
    );
  }
  function setBackground(html, attrName, url) {
    if (!url) return html;
    const safe = String(url).replace(/'/g, "\\'");
    // Replace the entire <tag ... data-attrName ...> opening to inject
    // the background-image style. Preserves all other attributes.
    const re = new RegExp(
      `<([a-z0-9]+)\\b([^>]*\\sdata-${attrName}\\b[^>]*?)>`,
      'i'
    );
    return html.replace(re, (m, tag, attrs) => {
      // Strip any existing inline style="background-image:..." so we don't
      // end up with two competing values.
      const cleaned = attrs.replace(/\s*style="[^"]*"/i, '');
      return `<${tag}${cleaned} style="background-image:url('${safe}');">`;
    });
  }
  function setAttr(html, attrName, attr, value) {
    if (value == null) return html;
    const safe = escapeHtml(value);
    const re = new RegExp(
      `<([a-z0-9]+)\\b([^>]*\\sdata-${attrName}\\b[^>]*?)>`,
      'i'
    );
    return html.replace(re, (m, tag, attrs) => {
      const stripped = attrs.replace(new RegExp(`\\s${attr}="[^"]*"`, 'i'), '');
      return `<${tag}${stripped} ${attr}="${safe}">`;
    });
  }
  for (const entry of body) {
    if (entry.kind === 'text')      html = setText(html, entry.attr, entry.value);
    else if (entry.kind === 'html') html = setHtml(html, entry.attr, entry.value);
    else if (entry.kind === 'bg')   html = setBackground(html, entry.attr, entry.value);
    else if (entry.kind === 'attr') html = setAttr(html, entry.attr, entry.htmlAttr, entry.value);
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

  // Sibling pillars (Compare lines strip — was JS-only and visibly empty
  // until hydration).
  let siblings = [];
  try { siblings = await many(
    `SELECT slug, name, short_name FROM pillar_pages
      WHERE id <> $1 AND status='published' ORDER BY sort_order`,
    [pillar.id]
  ); } catch (_) {}

  // Applications grid + related insights — fetched up-front so we can
  // emit them as plain server-rendered HTML and skip the JS round-trip.
  let appRows = [];
  try { appRows = await many(
    `SELECT slug, name, summary, cover_url FROM applications
      WHERE slug = ANY($1::text[]) AND status='published' ORDER BY sort_order`,
    [Array.isArray(pillar.applications) ? pillar.applications : []]
  ); } catch (_) {}

  let articleRows = [];
  try { articleRows = await many(
    `SELECT slug, title, excerpt, reading_minutes, published_at, cover_url, hero_image
       FROM articles WHERE pillar_id = $1 AND status='published'
       ORDER BY published_at DESC NULLS LAST LIMIT 3`,
    [pillar.id]
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

  // Pre-render every below-the-fold section that the client-side script
  // would normally hydrate from /api/pillars/<slug>. Without this, the
  // visitor sees a brief "empty page" flash between the hero and the JS
  // hydration finishing.
  const variantsHtml = (Array.isArray(pillar.variants) && pillar.variants.length)
    ? pillar.variants.map((v) => `<div class="feat-item">
         <div class="feat-icon">${escapeHtml((v.name || '?').charAt(0))}</div>
         <h3>${escapeHtml(v.name || '')}</h3>
         <p>${escapeHtml(v.summary || '')}</p>
       </div>`).join('')
    : '<p class="muted" style="grid-column:1/-1; text-align:center; color:#5c5e62;">Variant data not configured.</p>';

  const specHeaders = (pillar.spec_table && Array.isArray(pillar.spec_table.headers))
    ? pillar.spec_table.headers : [];
  const specRows    = (pillar.spec_table && Array.isArray(pillar.spec_table.rows))
    ? pillar.spec_table.rows : [];
  const specHtml = specHeaders.length
    ? `<table class="spec-table">
         <thead><tr>${specHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
         <tbody>${specRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
       </table>`
    : '';

  const customHtml = (pillar.customization && pillar.customization.enabled
                     && Array.isArray(pillar.customization.items) && pillar.customization.items.length)
    ? pillar.customization.items.map((c) => `<div class="feat-item">
         <div class="feat-icon">+</div>
         <h3>${escapeHtml(c.label || '')}</h3>
         <p>${escapeHtml(c.value || '')}</p>
       </div>`).join('')
    : '';

  const certsHtml = Array.isArray(pillar.certifications)
    ? pillar.certifications.map((c) => `<span class="cert-chip">${escapeHtml(c.name || '')}</span>`).join('')
    : '';

  const faqHtml = (Array.isArray(pillar.faq) && pillar.faq.length)
    ? pillar.faq.map((f) => `<details><summary>${escapeHtml(f.q || '')}</summary><p>${escapeHtml(f.a || '')}</p></details>`).join('')
    : '<p style="text-align:center; color:#5c5e62;">FAQ not configured.</p>';

  const appsHtml = appRows.map((a) => {
    const bg = a.cover_url ? ` style="background-image:url('${String(a.cover_url).replace(/'/g, "\\'")}');"` : '';
    return `<a class="app-card" href="/applications/${escapeHtml(a.slug)}.html"${bg}>
      <div class="app-overlay"><h3>${escapeHtml(a.name)}</h3><p>${escapeHtml((a.summary || '').slice(0, 110))}</p></div>
    </a>`;
  }).join('');

  const fmtArticleDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-GB', { year:'numeric', month:'short', day:'2-digit' }); }
    catch (_) { return ''; }
  };
  const articlesHtml = articleRows.length
    ? articleRows.map((a) => {
        const date = fmtArticleDate(a.published_at);
        return `<article class="news-card">
          <div class="news-date">${escapeHtml(pillar.short_name || pillar.name)} · ${a.reading_minutes || 5} min${date ? ' · ' + date : ''}</div>
          <h3>${escapeHtml(a.title)}</h3>
          <p>${escapeHtml((a.excerpt || '').slice(0, 130))}</p>
          <a href="/blog/${escapeHtml(a.slug)}" class="news-link">Read more &rarr;</a>
        </article>`;
      }).join('')
    : '<p style="grid-column:1/-1; text-align:center; color:#5c5e62;">No related articles yet.</p>';

  const siblingsHtml = siblings.map((s) =>
    `<a class="news-link" style="color:#171a20; padding:6px 12px; border-radius:20px; background:#fff; border:1px solid #e4e4e4;" href="/products/${escapeHtml(s.slug)}">${escapeHtml(s.short_name || s.name)} &rarr;</a>`
  ).join('');

  // Pre-fill every body placeholder. Hero (above-fold) + every section
  // below it. JS hydration becomes a no-op for already-populated data.
  const bodyEntries = [
    // ---- Above the fold ----
    { kind: 'text', attr: 'hero-title', value: pillar.hero_title || pillar.name },
    { kind: 'text', attr: 'hero-subtitle', value: pillar.hero_subtitle || description },
    { kind: 'text', attr: 'crumb-current', value: pillar.short_name || pillar.name },
    { kind: 'bg', attr: 'pillar-hero', value: pillar.hero_image },
    // ---- Below the fold ----
    { kind: 'html', attr: 'siblings', value: siblingsHtml },
    { kind: 'text', attr: 'overview-title', value: (pillar.overview && pillar.overview.title) || '' },
    { kind: 'text', attr: 'overview-body',  value: (pillar.overview && pillar.overview.body)  || '' },
    { kind: 'html', attr: 'variants', value: variantsHtml },
    { kind: 'html', attr: 'spec-table', value: specHtml },
    { kind: 'html', attr: 'customization', value: customHtml },
    { kind: 'text', attr: 'mfg-title', value: (pillar.manufacturing && pillar.manufacturing.title) || '' },
    { kind: 'text', attr: 'mfg-body',  value: (pillar.manufacturing && pillar.manufacturing.body)  || '' },
    { kind: 'html', attr: 'applications', value: appsHtml },
    { kind: 'html', attr: 'articles', value: articlesHtml },
    { kind: 'html', attr: 'certifications', value: certsHtml },
    { kind: 'html', attr: 'faq', value: faqHtml },
    { kind: 'text', attr: 'cta-title', value: 'Ready for a feasibility review?' },
    { kind: 'text', attr: 'cta-lead',  value: 'Send us your envelope and target spec — engineering will respond within one business day.' },
    { kind: 'text', attr: 'cta-btn',   value: pillar.primary_cta_text || 'Request a Quote' },
    { kind: 'attr', attr: 'cta-btn', htmlAttr: 'href', value: pillar.primary_cta_link || '/contact.html' },
  ];
  // Toggle the customisation section's display:none if there are items.
  if (customHtml) {
    html = html.replace(/<section[^>]*data-customization-section[^>]*>/i, (m) =>
      m.replace(/style="display:none;?"/i, ''));
  }
  html = injectIntoBody(html, bodyEntries);

  res.type('html').send(html);
  return true;
}

// Individual product (SKU) — uses the same /products/_template.html shell
// as the pillar, but sources from the products table. Without this,
// /products/<sku-slug> would fall through to the JS template, which
// previously redirected the visitor to /products/ because fetch() does
// not throw on a 404 from /api/pillars/<sku-slug>.
async function renderProduct(req, res, slug) {
  let row;
  try { row = await one(`SELECT * FROM products WHERE slug=$1 AND status='published'`, [slug]); }
  catch (_) { return false; }
  if (!row) return false;
  let pillar = null;
  if (row.pillar_id) {
    try { pillar = await one(
      `SELECT slug, name, short_name FROM pillar_pages WHERE id=$1`,
      [row.pillar_id]
    ); } catch (_) {}
  }

  const tplPath = path.join(PUBLIC_DIR, 'products', '_template.html');
  if (!fs.existsSync(tplPath)) return false;
  let html = fs.readFileSync(tplPath, 'utf8');

  const ctx = buildContext(req, req.path);
  html = replaceTokens(html, ctx);

  const title = row.meta_title || `${row.name} | ${ctx.siteName}`;
  const description = row.meta_description || row.tagline || row.description || '';
  const ogImage = abs(row.cover_url || ctx.defaultOgImage, ctx.canonicalBase);
  const canonicalUrl = ctx.canonicalBase + req.path;

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': canonicalUrl + '#product',
      name: row.name,
      sku: row.model_no || undefined,
      description,
      image: ogImage,
      brand: { '@type': 'Brand', name: ctx.siteName },
      manufacturer: { '@id': ctx.canonicalBase + '/#organization' },
      isRelatedTo: pillar ? { '@type': 'Product', name: pillar.name, url: ctx.canonicalBase + '/products/' + pillar.slug } : undefined,
      url: canonicalUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: ctx.canonicalBase + '/' },
        { '@type': 'ListItem', position: 2, name: 'Products', item: ctx.canonicalBase + '/products/' },
      ].concat(
        pillar ? [{ '@type': 'ListItem', position: 3, name: pillar.short_name || pillar.name, item: ctx.canonicalBase + '/products/' + pillar.slug }] : []
      ).concat([
        { '@type': 'ListItem', position: pillar ? 4 : 3, name: row.name, item: canonicalUrl },
      ]),
    },
  ];

  html = injectIntoHead(html, {
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType: 'product',
    siteName: ctx.siteName,
    jsonLd: JSON.stringify(ld),
  });
  html = injectIntoBody(html, [
    { kind: 'text', attr: 'hero-title', value: row.name },
    { kind: 'text', attr: 'hero-subtitle', value: row.tagline || description },
    { kind: 'text', attr: 'crumb-current', value: row.model_no || row.name },
    { kind: 'bg', attr: 'pillar-hero', value: row.cover_url },
  ]);

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

  // Pre-fill article hero body placeholders (title / subtitle / pill / meta).
  const fmtDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: '2-digit' }); }
    catch (_) { return ''; }
  };

  // Server-render the article body. The "guide" template auto-generates
  // a TOC by scanning H2s; we emulate that here so the user sees the
  // sidebar TOC on first paint.
  const tpl = article.template || 'standard';
  let layoutHtml = '';
  let tocItems = [];
  if (tpl === 'guide') {
    const content = article.content || '';
    layoutHtml = `<article class="article-body">${content.replace(
      /<h2([^>]*)>([\s\S]*?)<\/h2>/gi,
      (_m, attrs, inner) => {
        const text = inner.replace(/<[^>]+>/g, '').trim();
        const id = 'sec-' + tocItems.length + '-' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
        tocItems.push({ id, text });
        return `<h2${attrs} id="${id}">${inner}</h2>`;
      }
    )}</article>`;
  } else if (tpl === 'case-study') {
    layoutHtml = `<div style="max-width:840px; margin:0 auto;">
      <span class="case-pill">Case Study</span>
      <article class="article-body">${article.content || ''}</article>
    </div>`;
  } else {
    layoutHtml = `<article class="article-body">${article.content || ''}</article>`;
  }

  // Author block (avatar initial + name + role).
  const authorName = article.author_name || article.author || `${ctx.siteName} Engineering`;
  const authorRole = article.author_job_title
    || (article.pillar_short_name ? `Cell engineering — ${article.pillar_short_name}` : 'Cell engineering team');
  const authorInitial = (authorName.charAt(0) || 'A').toUpperCase();

  // Sidebar pillar callout — visible only when this article belongs to a pillar.
  const sidebarPillarHtml = article.pillar_slug
    ? `<a href="/products/${escapeHtml(article.pillar_slug)}">${escapeHtml(article.pillar_name || article.pillar_short_name || 'Pillar')} &rarr;</a>`
    : '';

  // Related articles in the same cluster (up to 4).
  let relatedRows = [];
  if (article.pillar_id) {
    try { relatedRows = await many(
      `SELECT slug, title, reading_minutes, category_id
         FROM articles
        WHERE pillar_id = $1 AND id <> $2 AND status='published'
        ORDER BY published_at DESC NULLS LAST LIMIT 4`,
      [article.pillar_id, article.id]
    ); } catch (_) {}
  }
  const relatedHtml = relatedRows.length
    ? relatedRows.map((r) => `<a href="/blog/${escapeHtml(r.slug)}">
        <strong>${escapeHtml(r.title)}</strong>
        <span class="meta">${escapeHtml(article.category_name || article.pillar_short_name || 'Article')} &middot; ${r.reading_minutes || 5} min read</span>
      </a>`).join('')
    : '';

  // Sidebar TOC (only for guide template).
  const sideTocHtml = tocItems.length
    ? `<ul>${tocItems.map((t) => `<li><a href="#${t.id}">${escapeHtml(t.text)}</a></li>`).join('')}</ul>`
    : '';

  html = injectIntoBody(html, [
    // Above-the-fold hero
    { kind: 'text', attr: 'art-title', value: article.title },
    { kind: 'text', attr: 'art-subtitle', value: article.excerpt || description },
    { kind: 'text', attr: 'art-pill', value: article.category_name || article.pillar_short_name || 'Article' },
    { kind: 'text', attr: 'art-crumb', value: article.title },
    { kind: 'text', attr: 'art-author', value: authorName },
    { kind: 'text', attr: 'art-reading', value: (article.reading_minutes || 5) + ' min read' },
    { kind: 'text', attr: 'art-date', value: fmtDate(article.published_at) },
    { kind: 'bg', attr: 'hero', value: article.hero_image || article.cover_url },
    // Article body + sidebar
    { kind: 'html', attr: 'art-layout', value: layoutHtml },
    { kind: 'text', attr: 'author-initial', value: authorInitial },
    { kind: 'text', attr: 'author-name', value: authorName },
    { kind: 'text', attr: 'author-role', value: authorRole },
  ]);

  // Show optional sidebar blocks server-side if their data is present.
  if (sidebarPillarHtml) {
    // Toggle off the inline display:none + inject the link.
    html = html.replace(
      /<div class="article-side-pillar" data-side-pillar style="display:none;">([\s\S]*?)<a data-side-pillar-link><\/a>/i,
      (m) => m.replace('display:none;', '').replace('<a data-side-pillar-link></a>', `<a data-side-pillar-link href="/products/${escapeHtml(article.pillar_slug)}">${escapeHtml(article.pillar_name || article.pillar_short_name || 'Pillar')} &rarr;</a>`)
    );
  }
  if (relatedHtml) {
    html = html.replace(
      /<div class="article-side-related" data-side-related style="display:none;">([\s\S]*?)<\/div>/i,
      `<div class="article-side-related" data-side-related>
        <h5>Continue reading</h5>
        <div data-side-related-list>${relatedHtml}</div>
      </div>`
    );
  }
  if (sideTocHtml) {
    html = html.replace(
      /<div class="article-side-toc" data-side-toc style="display:none;">([\s\S]*?)<\/div>/i,
      `<div class="article-side-toc" data-side-toc>
        <h5>On this page</h5>
        ${sideTocHtml}
      </div>`
    );
  }

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

  // Pre-fill the application page hero AND the body / pillar grid so
  // the visitor doesn't see the brief empty-page flash.
  let recommendedPillars = [];
  try { recommendedPillars = await many(
    `SELECT slug, name, short_name FROM pillar_pages WHERE status='published' ORDER BY sort_order LIMIT 3`
  ); } catch (_) {}
  const pillarsHtml = recommendedPillars.map((p) => `
    <a class="pillar-card" href="/products/${escapeHtml(p.slug)}">
      <div class="pillar-card__media"></div>
      <div class="pillar-card__body">
        <span class="tag">${escapeHtml(p.short_name)}</span>
        <h3 style="margin-top:10px;">${escapeHtml(p.name)}</h3>
        <span class="pillar-card__cta">Explore →</span>
      </div>
    </a>
  `).join('');

  const bodyHtml = app.body || `<p>${escapeHtml(app.summary || '')}</p>`;

  html = injectIntoBody(html, [
    { kind: 'text', attr: 'app-name', value: app.name },
    { kind: 'text', attr: 'app-title', value: app.name },
    { kind: 'text', attr: 'app-summary', value: app.summary || description },
    { kind: 'html', attr: 'app-body', value: bodyHtml },
    { kind: 'html', attr: 'pillars', value: pillarsHtml },
  ]);

  res.type('html').send(html);
  return true;
}

/* ===== Static-page SSR helpers ============================================
   The pages below ship as plain HTML in /public, but they have one or
   more JS-fetched widgets (Latest Insights on the homepage, the article
   grid on /blog/) that produce a visible blank-then-populate flash on
   first paint. These functions are called from server/index.js BEFORE
   express.static for those specific URLs so the rendered HTML already
   contains the real cards. */

async function renderHomepage(req, res) {
  const tplPath = path.join(PUBLIC_DIR, 'index.html');
  if (!fs.existsSync(tplPath)) return false;
  let html = fs.readFileSync(tplPath, 'utf8');
  const ctx = buildContext(req, '/');
  html = replaceTokens(html, ctx);

  // Latest 3 published articles for the "Latest Insights" grid.
  let items = [];
  try { items = await many(
    `SELECT a.slug, a.title, a.excerpt, a.cover_url, a.hero_image, a.author,
            a.reading_minutes, a.published_at,
            c.name AS category_name, p.short_name AS pillar_short_name
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       LEFT JOIN pillar_pages p ON p.id = a.pillar_id
      WHERE a.status='published'
      ORDER BY a.published_at DESC NULLS LAST
      LIMIT 3`
  ); } catch (_) {}

  if (items.length) {
    const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-GB', { year:'numeric', month:'short', day:'2-digit' }) : '';
    const cardsHtml = items.map((a) => {
      const cover = a.cover_url || a.hero_image || '';
      const cat = a.category_name || a.pillar_short_name || 'Article';
      const date = fmtD(a.published_at);
      const author = a.author || `${ctx.siteName} Engineering`;
      return `<a class="blog-card" href="/blog/${escapeHtml(a.slug)}">
        <div class="blog-card__media"${cover ? ` style="background-image:url('${escapeHtml(cover)}');"` : ''}></div>
        <div class="blog-card__body">
          <span class="blog-card__pill">${escapeHtml(cat)}</span>
          <h3 class="blog-card__title">${escapeHtml(a.title)}</h3>
          <p class="blog-card__excerpt">${escapeHtml((a.excerpt || '').slice(0, 130))}</p>
          <div class="blog-card__byline">${escapeHtml(author)} &middot; ${a.reading_minutes || 5} min${date ? ' &middot; ' + date : ''}</div>
        </div>
      </a>`;
    }).join('');
    html = injectIntoBody(html, [{ kind: 'html', attr: 'insights-grid', value: cardsHtml }]);
  }

  res.type('html').send(html);
  return true;
}

async function renderBlogIndex(req, res) {
  const tplPath = path.join(PUBLIC_DIR, 'blog', 'index.html');
  if (!fs.existsSync(tplPath)) return false;
  let html = fs.readFileSync(tplPath, 'utf8');
  const ctx = buildContext(req, '/blog/');
  html = replaceTokens(html, ctx);

  // 18 most-recent published articles + the categories list.
  let items = [];
  let cats = [];
  try { items = await many(
    `SELECT a.slug, a.title, a.excerpt, a.cover_url, a.hero_image, a.author,
            a.reading_minutes, a.published_at,
            c.name AS category_name, p.short_name AS pillar_short_name
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       LEFT JOIN pillar_pages p ON p.id = a.pillar_id
      WHERE a.status='published'
      ORDER BY a.published_at DESC NULLS LAST
      LIMIT 18`
  ); } catch (_) {}
  try { cats = await many(`SELECT slug, name FROM categories ORDER BY name`); }
  catch (_) {}

  const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-GB', { year:'numeric', month:'short', day:'2-digit' }) : '';

  // Featured = newest article. Grid = the rest.
  let featured = null;
  let gridItems = items;
  if (items.length) {
    featured = items[0];
    gridItems = items.slice(1);
  }

  function renderCard(a) {
    const cover = a.cover_url || a.hero_image || '';
    const cat = a.category_name || a.pillar_short_name || 'Article';
    const date = fmtD(a.published_at);
    const author = a.author || `${ctx.siteName} Engineering`;
    return `<a class="blog-card" href="/blog/${escapeHtml(a.slug)}">
      <div class="blog-card__media"${cover ? ` style="background-image:url('${escapeHtml(cover)}');"` : ''}></div>
      <div class="blog-card__body">
        <span class="blog-card__pill">${escapeHtml(cat)}</span>
        <h3 class="blog-card__title">${escapeHtml(a.title)}</h3>
        <p class="blog-card__excerpt">${escapeHtml((a.excerpt || '').slice(0, 140))}</p>
        <div class="blog-card__byline">${escapeHtml(author)} &middot; ${a.reading_minutes || 5} min${date ? ' &middot; ' + date : ''}</div>
      </div>
    </a>`;
  }

  // Inject featured (un-hide the section + populate fields).
  if (featured) {
    const cover = featured.cover_url || featured.hero_image || '';
    const cat = featured.category_name || featured.pillar_short_name || 'Featured';
    const date = fmtD(featured.published_at);
    const author = featured.author || `${ctx.siteName} Engineering`;
    // Un-hide the section.
    html = html.replace(
      /<section class="blog-featured-section" data-featured-section style="display:none;">/i,
      '<section class="blog-featured-section" data-featured-section>'
    );
    html = injectIntoBody(html, [
      { kind: 'attr', attr: 'featured-link', htmlAttr: 'href', value: '/blog/' + featured.slug },
      ...(cover ? [{ kind: 'attr', attr: 'featured-media', htmlAttr: 'style', value: `background-image:url('${cover}');` }] : []),
      { kind: 'text', attr: 'featured-pill', value: cat },
      { kind: 'text', attr: 'featured-title', value: featured.title },
      { kind: 'text', attr: 'featured-excerpt', value: (featured.excerpt || '').slice(0, 240) },
    ]);
    // Byline contains <strong>; use raw HTML.
    html = injectIntoBody(html, [{
      kind: 'html',
      attr: 'featured-byline',
      value: `<strong>${escapeHtml(author)}</strong> &middot; ${featured.reading_minutes || 5} min read${date ? ' &middot; ' + date : ''}`,
    }]);
  }

  // Inject the grid (or empty state).
  const gridHtml = gridItems.length
    ? gridItems.map(renderCard).join('')
    : '<div class="blog-empty">No articles in this category yet.</div>';
  html = injectIntoBody(html, [{ kind: 'html', attr: 'grid', value: gridHtml }]);

  // Inject category filter chips (the JS appends after the "All" chip).
  if (cats.length) {
    const chipsHtml = cats.map((c) =>
      `<button class="chip" data-filter="${escapeHtml(c.slug)}">${escapeHtml(c.name)}</button>`
    ).join('');
    html = html.replace(
      /<div class="blog-filters" data-filters>([\s\S]*?)<\/div>/i,
      `<div class="blog-filters" data-filters><button class="chip is-active" data-filter="">All articles</button>${chipsHtml}</div>`
    );
  }

  res.type('html').send(html);
  return true;
}

module.exports = {
  renderPillar, renderProduct, renderArticle, renderApplication,
  renderHomepage, renderBlogIndex,
};
