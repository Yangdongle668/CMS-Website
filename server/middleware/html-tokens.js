// HTML token middleware
//
// Replaces {{CANONICAL_BASE}}, {{SITE_NAME}}, {{CANONICAL_PATH}},
// {{CANONICAL_URL}}, {{ORG_LEGAL_NAME}} and {{DEFAULT_OG_IMAGE}} in the
// initial HTML response. Runs SERVER-SIDE before bytes hit the wire so
// Googlebot, social-card scrapers and AI parsers all see resolved values
// without waiting for JavaScript.
//
// Why a token model rather than a template engine:
// - Existing pages are hand-authored static HTML.
// - We want every HTML response (static files, _template fallbacks for
//   /products/:slug, /blog/:slug, /applications/:slug, and the soon-to-be-
//   added 404.html) to flow through the same replacement pass.
// - Tokens in the source files are inert — opening a file directly in a
//   browser still works, the placeholder text is just visible.
//
// Source of truth resolution (priority order):
//   1. process.env.PUBLIC_URL (set in .env / docker-compose)
//   2. settings.seo.public_url (admin-editable, cached at boot, refreshed
//      by /api/settings/public consumers)
//   3. The current request's host header (last resort, only valid mid-request)

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');

// ----- Asset manifest (Sprint 1 — build pipeline) -----
// public/dist/manifest.json is written by `npm run build` and maps the
// authored asset paths (script.js, styles.css) to the minified+hashed
// equivalents. On HTML responses we substitute the hashed URLs so the
// browser can long-cache them (Cache-Control: immutable). Missing
// manifest = no rewrite, original files served as before. This keeps
// dev / pre-build deployments fully functional.
let assetManifest = null;
function loadManifest() {
  try {
    const p = path.join(PUBLIC_DIR, 'dist', 'manifest.json');
    if (fs.existsSync(p)) {
      assetManifest = JSON.parse(fs.readFileSync(p, 'utf8'));
      const count = Object.keys(assetManifest.entries || {}).length;
      console.log(`[assets] loaded manifest: ${count} hashed asset(s)`);
    } else {
      assetManifest = null;
    }
  } catch (err) {
    console.warn('[assets] manifest load failed (using source files):', err && err.message);
    assetManifest = null;
  }
}
loadManifest();
// Watch for rebuilds — useful in dev so a re-run of `npm run build`
// becomes effective without restarting the server. Ignored if the
// dist directory doesn't exist yet.
try {
  const distDir = path.join(PUBLIC_DIR, 'dist');
  if (fs.existsSync(distDir)) {
    fs.watch(distDir, { persistent: false }, (_evt, name) => {
      if (name === 'manifest.json') loadManifest();
    });
  }
} catch (_) {}

// Rewrite raw source asset references to their hashed counterparts.
// Examples handled:
//   /script.js          → /dist/script.<hash>.js
//   /script.js?v=19     → /dist/script.<hash>.js     (drops the query)
//   /styles.css         → /dist/styles.<hash>.css
// We only touch the exact authored paths so any legitimate use of
// other names (admin/* JS, vendor scripts, etc.) is unaffected.
function rewriteAssetUrls(html) {
  if (!assetManifest || !assetManifest.entries) return html;
  for (const entry of Object.values(assetManifest.entries)) {
    if (!entry || !entry.src || !entry.dist) continue;
    // Match the src path bracketed by " ' or = sign, optionally
    // followed by ?v=NN. Captures preserve the surrounding quote.
    const escSrc = entry.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(["'=])${escSrc}(\\?v=\\d+)?`, 'g');
    html = html.replace(re, `$1${entry.dist}`);
  }
  return html;
}

// In-memory cache of seo + site + organization settings, refreshed on every
// PUT /api/settings/* and on a 30s interval. Avoids a DB hit per request.
const settingsCache = {
  seo: {},
  site: {},
  organization: {},
  media_overrides: {},
  text_overrides: {},
  turnstile: {},
  loadedAt: 0,
};

async function loadSettingsCache() {
  try {
    const { many } = require('../db/client');
    const rows = await many(
      `SELECT key, value FROM settings WHERE key IN ('seo','site','organization','media_overrides','text_overrides','turnstile')`
    );
    for (const r of rows) settingsCache[r.key] = r.value || {};
    settingsCache.loadedAt = Date.now();
  } catch (err) {
    // DB may not be ready during early boot; fall back to env values.
  }
}

// Refresh on a coarse interval so admin edits propagate without a restart.
setInterval(loadSettingsCache, 30 * 1000).unref?.();
loadSettingsCache();

// External hook so the settings PUT route can invalidate immediately.
function invalidateSettingsCache() {
  loadSettingsCache();
}

function isLocalhostUrl(u) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(u);
}

// Reject URLs that have no hostname (e.g. "https://" with empty domain —
// a common mis-configuration where the protocol was set but the domain left blank).
function hasValidHost(u) {
  try { return !!(new URL(u).hostname); } catch (_) { return false; }
}

function resolveCanonicalBase(req) {
  const fromEnv = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (fromEnv && !isLocalhostUrl(fromEnv) && hasValidHost(fromEnv)) return fromEnv;
  const fromDb = String((settingsCache.seo && settingsCache.seo.public_url) || '').replace(/\/$/, '');
  if (fromDb && !isLocalhostUrl(fromDb) && hasValidHost(fromDb)) return fromDb;
  if (req && req.headers && req.headers.host) {
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
    return `${proto}://${req.headers.host}`;
  }
  // Last resort: fall back to env/db even if localhost (dev environments).
  if (fromDb && hasValidHost(fromDb)) return fromDb;
  if (fromEnv && hasValidHost(fromEnv)) return fromEnv;
  return '';
}

function resolveSiteName() {
  return (
    process.env.SITE_NAME ||
    (settingsCache.site && settingsCache.site.name) ||
    'Zufek'
  );
}

function resolveOrgLegalName() {
  return (
    (settingsCache.organization && settingsCache.organization.legal_name) ||
    (settingsCache.site && settingsCache.site.legal_name) ||
    'Dongguan Zufek Technology Co.,Ltd'
  );
}

function resolveDefaultOgImage(canonicalBase) {
  // Default points to /logo.png (1024×1024 PNG that already exists in /public).
  // Operators should upload a 1200×630 brand-aligned image and set
  // settings.seo.default_meta_image to it for best LinkedIn/X rendering.
  const fromSeo = (settingsCache.seo && settingsCache.seo.default_meta_image) || '/logo.png';
  return /^https?:\/\//.test(fromSeo) ? fromSeo : canonicalBase + fromSeo;
}

// Build the search-engine verification + GA4 bootstrap meta/script block
// that has to live in the SERVER-RENDERED HTML. Google's site-verification
// fetcher does NOT execute JavaScript — a JS-injected meta tag fails
// verification — and Bing/IndexNow follow the same rule. GA4 is also
// bootstrapped here so the gtag.js library is in the document before
// first interaction; consent gating still happens client-side via
// gtag('consent', 'update', ...).
function escapeAttr(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function buildVerificationBlock() {
  const seo = settingsCache.seo || {};
  const out = [];
  if (seo.gsc_verify) {
    out.push(`<meta name="google-site-verification" content="${escapeAttr(seo.gsc_verify)}">`);
  }
  if (seo.bing_verify) {
    out.push(`<meta name="msvalidate.01" content="${escapeAttr(seo.bing_verify)}">`);
  }
  if (seo.twitter_handle) {
    const handle = String(seo.twitter_handle).startsWith('@')
      ? seo.twitter_handle : '@' + seo.twitter_handle;
    out.push(`<meta name="twitter:site" content="${escapeAttr(handle)}">`);
  }
  // GA4 with Consent Mode v2: load the library always, but default ALL
  // consent categories to denied so cookies/network calls are blocked
  // until the visitor accepts the analytics category. partials.js fires
  // gtag('consent', 'update', ...) on consent grant.
  if (seo.ga4_measurement_id) {
    const id = escapeAttr(seo.ga4_measurement_id);
    out.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`);
    out.push(
      `<script>` +
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
      `gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});` +
      `gtag('js',new Date());` +
      `gtag('config','${id}',{anonymize_ip:true,send_page_view:true});` +
      `</script>`
    );
  }
  return out.join('\n');
}

// Build the site-wide Organization + WebSite JSON-LD block. Emitted on
// every public HTML response so Google Knowledge Panel, AI Overviews,
// ChatGPT, Claude, Perplexity, etc. all see a consistent entity
// definition without us needing to embed it in every static file.
// Skipped on pages that already declare their own Organization schema
// (lets SSR detail pages override if ever needed).
function buildGlobalSchemaBlock(canonicalBase) {
  if (!canonicalBase) return '';
  const org   = settingsCache.organization || {};
  const site  = settingsCache.site || {};
  const social = settingsCache.social || {};
  const seo   = settingsCache.seo || {};

  const brandName = org.brand_name || site.name || resolveSiteName() || 'Zufek';
  const legalName = org.legal_name || site.legal_name || '';

  const logoRaw = org.logo || (seo.default_meta_image && /\.(png|jpg|jpeg|webp|svg)$/i.test(seo.default_meta_image) ? seo.default_meta_image : '/logo.png');
  const logoUrl = /^https?:\/\//.test(logoRaw) ? logoRaw : canonicalBase + logoRaw;

  // sameAs: merge organization.sameAs (array) + social.* URLs
  const sameAs = [];
  if (Array.isArray(org.sameAs)) {
    for (const u of org.sameAs) {
      if (u && /^https?:\/\//.test(u) && !sameAs.includes(u)) sameAs.push(u);
    }
  }
  for (const k of ['linkedin', 'youtube', 'x', 'twitter', 'facebook', 'instagram', 'github', 'tiktok', 'wechat']) {
    const v = social[k];
    if (v && /^https?:\/\//.test(v) && !sameAs.includes(v)) sameAs.push(v);
  }

  // Organization
  const orgSchema = {
    '@type': 'Organization',
    '@id': canonicalBase + '/#organization',
    name: brandName,
    url: canonicalBase + '/',
    logo: { '@type': 'ImageObject', url: logoUrl, width: 1024, height: 1024, caption: brandName + ' logo' },
  };
  if (legalName) orgSchema.legalName = legalName;
  if (org.founding_date) orgSchema.foundingDate = String(org.founding_date);
  else if (site.founded_year) orgSchema.foundingDate = String(site.founded_year);
  if (site.description) orgSchema.description = site.description;
  if (site.tagline && !orgSchema.description) orgSchema.description = site.tagline;
  if (org.vat_id) orgSchema.vatID = org.vat_id;
  if (org.duns) orgSchema.duns = org.duns;
  if (org.naics) orgSchema.naics = org.naics;
  if (org.iso6523Code) orgSchema.iso6523Code = org.iso6523Code;

  const addr = org.address || {};
  if (addr.streetAddress || addr.addressLocality || addr.addressCountry) {
    const pa = { '@type': 'PostalAddress' };
    if (addr.streetAddress)   pa.streetAddress   = addr.streetAddress;
    if (addr.addressLocality) pa.addressLocality = addr.addressLocality;
    if (addr.addressRegion)   pa.addressRegion   = addr.addressRegion;
    if (addr.postalCode)      pa.postalCode      = addr.postalCode;
    if (addr.addressCountry)  pa.addressCountry  = addr.addressCountry;
    orgSchema.address = pa;
  }

  if (Array.isArray(org.contactPoints) && org.contactPoints.length) {
    orgSchema.contactPoint = org.contactPoints.map((cp) => {
      const c = { '@type': 'ContactPoint', contactType: cp.type || cp.contactType || 'customer service' };
      if (cp.email)              c.email = cp.email;
      if (cp.telephone)          c.telephone = cp.telephone;
      if (cp.areaServed)         c.areaServed = cp.areaServed;
      if (cp.availableLanguage)  c.availableLanguage = cp.availableLanguage;
      return c;
    });
  }

  if (sameAs.length) orgSchema.sameAs = sameAs;

  // WebSite + SearchAction (Sitelinks search box)
  const websiteSchema = {
    '@type': 'WebSite',
    '@id': canonicalBase + '/#website',
    url: canonicalBase + '/',
    name: brandName,
    publisher: { '@id': canonicalBase + '/#organization' },
    inLanguage: 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: canonicalBase + '/?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [orgSchema, websiteSchema],
  };
  return `<script type="application/ld+json" data-jsonld="site">${JSON.stringify(graph)}</script>`;
}

function replaceTokens(html, ctx) {
  let out = html
    .replace(/\{\{CANONICAL_BASE\}\}/g, ctx.canonicalBase)
    .replace(/\{\{CANONICAL_PATH\}\}/g, ctx.canonicalPath)
    .replace(/\{\{CANONICAL_URL\}\}/g, ctx.canonicalBase + ctx.canonicalPath)
    .replace(/\{\{SITE_NAME\}\}/g, ctx.siteName)
    .replace(/\{\{ORG_LEGAL_NAME\}\}/g, ctx.orgLegalName)
    .replace(/\{\{DEFAULT_OG_IMAGE\}\}/g, ctx.defaultOgImage);
  // Inject the verification + GA4 block immediately before </head> so
  // Google's verification fetcher and Bing's fetcher both see it in the
  // initial server response. Skipping admin pages because they have
  // <meta name="robots" content="noindex"> and never need this.
  const block = buildVerificationBlock();
  if (block && out.indexOf('</head>') !== -1 && !/google-site-verification/.test(out)) {
    out = out.replace('</head>', block + '\n</head>');
  }
  // Inject global Organization + WebSite JSON-LD on every public page.
  // Knowledge Panel, AI Overviews and LLM citations all use these. We
  // skip if the page already declared its own Organization to avoid
  // duplicates (e.g. a future SSR detail page that wants to override).
  if (out.indexOf('</head>') !== -1 && !/"@type"\s*:\s*"Organization"/i.test(out)) {
    const schema = buildGlobalSchemaBlock(ctx.canonicalBase);
    if (schema) {
      out = out.replace('</head>', schema + '\n</head>');
    }
  }
  // Inject site favicon (settings.site.favicon) into <head>. Applied to
  // every HTML response — public pages and admin pages — so the browser
  // tab + admin login page show the operator-chosen icon. We only inject
  // when no <link rel="icon"> is already present so source files that
  // ship their own remain authoritative.
  const favicon = (settingsCache.site && settingsCache.site.favicon) || '';
  if (favicon && out.indexOf('</head>') !== -1 && !/<link[^>]+rel=["'](?:shortcut )?icon["']/i.test(out)) {
    out = out.replace('</head>', `<link rel="icon" href="${escapeAttr(favicon)}">\n</head>`);
  }
  // Apply media overrides last so the operator can map an external URL
  // (Unsplash hot-link, etc.) to a self-hosted /uploads/* asset without
  // editing source files. The replacement is exact-match on the full
  // URL string — if the source file uses a different size variant, add
  // a separate override entry for it.
  const overrides = settingsCache.media_overrides || {};
  for (const [src, dst] of Object.entries(overrides)) {
    if (!src || !dst) continue;
    // Use split/join instead of regex to avoid regex-special-character
    // escaping (URLs commonly contain ?, &, =).
    if (out.indexOf(src) !== -1) {
      out = out.split(src).join(dst);
    }
  }
  // Apply text overrides — admin-edited per-text replacements made via
  // the click-to-edit iframe editor in /admin/pages.html. We must only
  // touch real text nodes, never code inside <script> or <style>, so
  // the safe pattern is to:
  //   1. Split the doc into segments around <script>...</script> and
  //      <style>...</style> blocks (which we leave untouched).
  //   2. Within each non-script/style segment, find runs of >...<
  //      (raw text between tags) and replace exact matches there.
  //   3. Re-join.
  // This avoids the brittle whole-document string-replace that would
  // corrupt JSON-LD bodies, JS string literals or CSS selectors.
  const textOverrides = settingsCache.text_overrides || {};
  if (Object.keys(textOverrides).length) {
    out = applyTextOverrides(out, textOverrides);
  }
  // Final pass: swap source asset URLs for content-hashed bundles.
  // Safe to run last because all earlier passes operate on text content
  // and don't touch <script src="..."> / <link href="..."> attributes.
  out = rewriteAssetUrls(out);
  // Performance polish: defer local scripts + async-load Google Fonts.
  // Runs after asset URL rewriting so it sees the hashed paths and can
  // defer them too. Skipped on admin pages by the outer middleware.
  out = optimizeAssetLoading(out);
  return out;
}

// Reduces render-blocking by:
//   1. Adding `defer` to local <script src="/..."> tags (they currently
//      sit at end-of-body without defer, so the browser blocks DCL on
//      them; defer lets HTML parse fully first and the JS run in order
//      after parsing completes).
//   2. Converting <link rel="stylesheet" href="...googleapis.com..."> to
//      the rel=preload + onload + <noscript> fallback pattern, so the
//      font CSS no longer blocks first paint.
//   3. Preconnecting to fonts.gstatic.com (where the .woff2 files live)
//      to save ~100-200ms of TLS / DNS on the font fetch.
//   4. Stripping the obsolete preconnect to images.unsplash.com (every
//      image was localised to /assets/img/seed/).
function optimizeAssetLoading(html) {
  // 1. Add `defer` to local script tags missing async/defer/type=module
  html = html.replace(
    /<script\s+([^>]*?)src=("\/[^"]+\.js[^"]*"|"\/dist\/[^"]+")([^>]*?)><\/script>/gi,
    (match, before, src, after) => {
      const all = (before || '') + (after || '');
      if (/\b(async|defer)\b/.test(all)) return match;
      if (/\btype=["']module/.test(all)) return match;
      return `<script ${before}src=${src}${after} defer></script>`;
    }
  );

  // 2 + 3. Async-load Google Fonts CSS using the media="print" swap technique.
  // The browser fetches the stylesheet without blocking render (because it
  // applies only to "print"), then a small inline script flips media="all"
  // once it loads. We avoid the older onload="..." attribute pattern because
  // Helmet's default CSP sets script-src-attr to 'none' (inline event
  // handlers blocked); a separate <script> tag is fine under script-src
  // 'unsafe-inline'.
  const fontsRe = /<link\s+href=("https:\/\/fonts\.googleapis\.com\/css2\?[^"]+")\s+rel="stylesheet"[^>]*>/i;
  const fontsMatch = html.match(fontsRe);
  if (fontsMatch && !/data-async-font/i.test(html)) {
    const href = fontsMatch[1];
    let replacement = '';
    if (!/preconnect[^>]+fonts\.gstatic/i.test(html)) {
      replacement += '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n';
    }
    replacement += `<link rel="stylesheet" href=${href} media="print" data-async-font>\n`;
    replacement += `<script>(function(){var l=document.querySelector('link[data-async-font]');if(!l)return;function s(){l.media='all';}if(l.sheet)s();else l.addEventListener('load',s);})();</script>\n`;
    replacement += `<noscript><link rel="stylesheet" href=${href}></noscript>`;
    html = html.replace(fontsRe, replacement);
  }

  // 4. Remove obsolete unsplash preconnect (images are local now)
  html = html.replace(
    /[ \t]*<link\s+rel="preconnect"\s+href="https:\/\/images\.unsplash\.com"[^>]*>\s*\n?/gi,
    ''
  );

  return html;
}

function applyTextOverrides(html, map) {
  // Split-preserve regex: matches <script>...</script>, <style>...</style>,
  // or HTML comments. Anything outside these blocks is fair game.
  const protectRe = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>|<!--[\s\S]*?-->/gi;
  const parts = [];
  let last = 0;
  let m;
  while ((m = protectRe.exec(html)) !== null) {
    parts.push({ kind: 'text', body: html.slice(last, m.index) });
    parts.push({ kind: 'protected', body: m[0] });
    last = m.index + m[0].length;
  }
  parts.push({ kind: 'text', body: html.slice(last) });

  return parts.map((p) => {
    if (p.kind !== 'text') return p.body;
    let s = p.body;
    for (const [rawFrom, to] of Object.entries(map)) {
      if (!rawFrom || rawFrom === to) continue;
      // Two reasons to encode the FROM key before searching:
      //   1. HTML serialisation turns `&` into `&amp;`, `<` into `&lt;`,
      //      so a literal "Custom-Shape & Coin Cell" in textContent
      //      lives in source as "Custom-Shape &amp; Coin Cell".
      //   2. Operators paste original text from the iframe's textContent
      //      (i.e. unescaped form), so we have to encode here, not on save.
      const from = encodeHtmlEntities(rawFrom);
      const escFrom = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match the text between > and < (or start/end of segment) only.
      // The pattern: optional whitespace + EXACT from + optional whitespace,
      // bookended by a > or start-of-segment on the left and a < or
      // end-of-segment on the right.
      const re = new RegExp(`(>|^)(\\s*)${escFrom}(\\s*)(<|$)`, 'g');
      s = s.replace(re, (_match, openBoundary, leading, trailing, closeBoundary) =>
        openBoundary + leading + escapeAttr(to) + trailing + closeBoundary
      );
    }
    return s;
  }).join('');
}

function encodeHtmlEntities(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function buildContext(req, canonicalPathOverride) {
  const canonicalBase = resolveCanonicalBase(req);
  const canonicalPath = canonicalPathOverride || (req && req.path) || '/';
  return {
    canonicalBase,
    canonicalPath,
    siteName: resolveSiteName(),
    orgLegalName: resolveOrgLegalName(),
    defaultOgImage: resolveDefaultOgImage(canonicalBase),
  };
}

// Apply admin-managed pages-table overrides to a static HTML file before
// it's sent. Mirrors the cms-page.js client-side hydration logic so the
// initial HTML the visitor receives already contains the operator's
// edits — no JS-driven post-load flash where the page text changes
// from the static fallback to the DB-driven version.
async function applyPageOverrides(html) {
  // The body's data-page="<slug>" attribute identifies which CMS row,
  // if any, governs this page. /admin/pages.html lets the operator
  // manage hero/breadcrumbs/body for that slug.
  const m = html.match(/<body[^>]*\sdata-page=["']([^"']+)["']/i);
  if (!m) return html;
  const slug = m[1];
  if (!slug) return html;

  let page;
  try {
    const { one } = require('../db/client');
    page = await one(
      `SELECT slug, nav, title, meta_title, meta_description,
              hero_eyebrow, hero_title, hero_subtitle, hero_image,
              hero_breadcrumbs, body_html, sections, status,
              focus_keyword, canonical_override, robots,
              og_title, og_description, og_image_url,
              twitter_title, twitter_description, twitter_image_url
         FROM pages WHERE slug = $1 AND status = 'published'`,
      [slug]
    );
  } catch (_) { return html; /* DB unavailable or no pages table */ }
  if (!page) return html;

  // ----- title + meta description -----
  if (page.meta_title || page.title) {
    const t = page.meta_title || page.title;
    html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeAttr(t)}</title>`);
  }
  if (page.meta_description) {
    const d = escapeAttr(page.meta_description);
    html = html.replace(
      /<meta\s+name=["']description["']\s+content=["'][^"']*["']/i,
      `<meta name="description" content="${d}"`
    );
    // Also patch og:description / twitter:description so social cards stay in sync.
    html = html.replace(
      /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']/i,
      `<meta property="og:description" content="${d}"`
    );
    html = html.replace(
      /<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']/i,
      `<meta name="twitter:description" content="${d}"`
    );
  }
  if (page.meta_title) {
    const t = escapeAttr(page.meta_title);
    html = html.replace(
      /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']/i,
      `<meta property="og:title" content="${t}"`
    );
    html = html.replace(
      /<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']/i,
      `<meta name="twitter:title" content="${t}"`
    );
  }
  if (page.hero_image) {
    const u = /^https?:\/\//.test(page.hero_image)
      ? page.hero_image
      : ((settingsCache.seo && settingsCache.seo.public_url) || '') + page.hero_image;
    html = html.replace(
      /<meta\s+property=["']og:image["']\s+content=["'][^"']*["']/i,
      `<meta property="og:image" content="${escapeAttr(u)}"`
    );
    html = html.replace(
      /<meta\s+name=["']twitter:image["']\s+content=["'][^"']*["']/i,
      `<meta name="twitter:image" content="${escapeAttr(u)}"`
    );
  }

  // ----- RankMath-style overrides (per-page) -----
  // Each override is applied LAST so it wins over the meta_title /
  // meta_description / hero_image-derived values above. Empty strings
  // are skipped (fall back to upstream value).
  if (page.og_title) {
    html = html.replace(
      /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']/i,
      `<meta property="og:title" content="${escapeAttr(page.og_title)}"`
    );
  }
  if (page.og_description) {
    html = html.replace(
      /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']/i,
      `<meta property="og:description" content="${escapeAttr(page.og_description)}"`
    );
  }
  if (page.og_image_url) {
    const u = /^https?:\/\//.test(page.og_image_url)
      ? page.og_image_url
      : ((settingsCache.seo && settingsCache.seo.public_url) || '') + page.og_image_url;
    html = html.replace(
      /<meta\s+property=["']og:image["']\s+content=["'][^"']*["']/i,
      `<meta property="og:image" content="${escapeAttr(u)}"`
    );
  }
  if (page.twitter_title) {
    html = html.replace(
      /<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']/i,
      `<meta name="twitter:title" content="${escapeAttr(page.twitter_title)}"`
    );
  }
  if (page.twitter_description) {
    html = html.replace(
      /<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']/i,
      `<meta name="twitter:description" content="${escapeAttr(page.twitter_description)}"`
    );
  }
  if (page.twitter_image_url) {
    const u = /^https?:\/\//.test(page.twitter_image_url)
      ? page.twitter_image_url
      : ((settingsCache.seo && settingsCache.seo.public_url) || '') + page.twitter_image_url;
    html = html.replace(
      /<meta\s+name=["']twitter:image["']\s+content=["'][^"']*["']/i,
      `<meta name="twitter:image" content="${escapeAttr(u)}"`
    );
  }
  if (page.canonical_override) {
    html = html.replace(
      /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']/i,
      `<link rel="canonical" href="${escapeAttr(page.canonical_override)}"`
    );
    html = html.replace(
      /<meta\s+property=["']og:url["']\s+content=["'][^"']*["']/i,
      `<meta property="og:url" content="${escapeAttr(page.canonical_override)}"`
    );
  }
  if (page.robots && page.robots.trim() && page.robots.trim() !== 'index,follow') {
    const robotsTag = `<meta name="robots" content="${escapeAttr(page.robots.trim())}">`;
    if (/<meta\s+name=["']robots["'][^>]*>/i.test(html)) {
      html = html.replace(/<meta\s+name=["']robots["'][^>]*>/i, robotsTag);
    } else {
      html = html.replace(
        /(<meta\s+name=["']description["'][^>]*>)/i,
        `$1\n${robotsTag}`
      );
    }
  }

  // ----- hero block: background image + h1 + first <p> + breadcrumbs -----
  // Anchor on the first <section class="page-hero"> or <section class="hero">
  // so we don't accidentally rewrite content inside other sections that
  // share the same tag types.
  const heroOpenRe = /(<section\s+class="(?:page-)?hero"[^>]*?)>/i;
  const heroOpenMatch = html.match(heroOpenRe);
  if (heroOpenMatch) {
    const heroStart = heroOpenMatch.index;
    const closeIdx = html.indexOf('</section>', heroStart);
    if (closeIdx !== -1) {
      let heroBlock = html.slice(heroStart, closeIdx + '</section>'.length);

      // Background image (replace existing inline style="background-image:...").
      if (page.hero_image) {
        const safeBg = String(page.hero_image).replace(/'/g, "\\'");
        heroBlock = heroBlock.replace(
          /(<section\s+class="(?:page-)?hero"[^>]*?)\sstyle="[^"]*"/i,
          `$1 style="background-image:url('${safeBg}');"`
        );
      }

      // Breadcrumbs.
      if (Array.isArray(page.hero_breadcrumbs) && page.hero_breadcrumbs.length) {
        const crumbsHtml = page.hero_breadcrumbs.map((c, i, arr) => {
          const sep = i < arr.length - 1 ? '<span>/</span>' : '';
          if (c.url && i < arr.length - 1) {
            return `<a href="${escapeAttr(c.url)}">${escapeAttr(c.label)}</a>${sep}`;
          }
          return `<span>${escapeAttr(c.label)}</span>${sep}`;
        }).join('');
        heroBlock = heroBlock.replace(
          /<div class="breadcrumbs"[^>]*>([\s\S]*?)<\/div>/i,
          `<div class="breadcrumbs">${crumbsHtml}</div>`
        );
      }

      // First <h1> inside the hero — usually the page title.
      if (page.hero_title) {
        const escapedTitle = escapeAttr(page.hero_title).replace(/\n/g, '<br>');
        heroBlock = heroBlock.replace(
          /<h1([^>]*)>([\s\S]*?)<\/h1>/i,
          `<h1$1>${escapedTitle}</h1>`
        );
      }

      // First <p> AFTER the h1 — usually the subtitle.
      if (page.hero_subtitle) {
        heroBlock = heroBlock.replace(
          /(<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<p\b[^>]*>)([\s\S]*?)(<\/p>)/i,
          `$1${escapeAttr(page.hero_subtitle)}$3`
        );
      }

      html = html.slice(0, heroStart) + heroBlock + html.slice(closeIdx + '</section>'.length);
    }
  }

  // ----- body override: replace [data-page-body] innerHTML -----
  if (page.body_html && String(page.body_html).trim()) {
    const bodyRe = /(<([a-z0-9]+)\b[^>]*\sdata-page-body\b[^>]*>)([\s\S]*?)(<\/\2>)/i;
    if (bodyRe.test(html)) {
      html = html.replace(bodyRe, (_m, open, _tag, _inner, close) =>
        open + page.body_html + close
      );
    }
  }

  // ----- sections override: rewrite every [data-section="<key>"] node -----
  // Mirrors the client-side logic in cms-page.js so visitors see the
  // operator's edits in the initial HTML — no static-then-DB flash on the
  // homepage hero CTAs / why-us / cta-band labels etc.
  //   string value          → replace textContent
  //   { text, link } object  → replace textContent; if the element is an
  //                            <a>, also rewrite its href
  if (page.sections && typeof page.sections === 'object' && !Array.isArray(page.sections)) {
    // Build a normalised sections map. Two supported shapes:
    //   * Modern:  { hero_cta_primary: { text, link } } — element-keyed
    //   * Legacy:  { hero_cta_primary_text, hero_cta_primary_link } —
    //              two string siblings whose <base>_text / <base>_link
    //              names map to a single [data-section="<base>"] element
    // We collapse the legacy form into the modern shape before applying so
    // both formats end up in the rendered HTML on first paint.
    const merged = {};
    for (const [k, v] of Object.entries(page.sections)) {
      if (!k) continue;
      const matchTextSuffix = k.match(/^(.+)_text$/);
      const matchLinkSuffix = k.match(/^(.+)_link$/);
      if (matchTextSuffix && typeof v === 'string') {
        const base = matchTextSuffix[1];
        merged[base] = Object.assign({}, merged[base], { text: v });
      } else if (matchLinkSuffix && typeof v === 'string') {
        const base = matchLinkSuffix[1];
        merged[base] = Object.assign({}, merged[base], { link: v });
      } else {
        merged[k] = v;
      }
    }

    for (const [key, value] of Object.entries(merged)) {
      if (!key) continue;
      // Escape regex specials in the key (slug-ish keys typically only have
      // [a-z0-9_-], but defend against the general case).
      const safeKey = key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp(
        `(<([a-z0-9]+)\\b[^>]*\\sdata-section=["']${safeKey}["'][^>]*>)([\\s\\S]*?)(</\\2>)`,
        'i'
      );
      if (typeof value === 'string') {
        html = html.replace(re, (_m, open, _tag, _inner, close) =>
          open + escapeAttr(value) + close
        );
      } else if (value && typeof value === 'object' && (value.text != null || value.link != null)) {
        html = html.replace(re, (_m, open, _tag, _inner, close) => {
          // If this is an anchor and value.link is set, swap the href.
          if (value.link && /^<a\b/i.test(open)) {
            if (/href="[^"]*"/i.test(open)) {
              open = open.replace(/href="[^"]*"/i, `href="${escapeAttr(value.link)}"`);
            } else {
              open = open.replace(/^(<a\b)/i, `$1 href="${escapeAttr(value.link)}"`);
            }
          }
          const text = value.text != null ? escapeAttr(value.text) : _inner;
          return open + text + close;
        });
      }
      // Array / nested-object values are still left for cms-page.js to
      // dispatch as page:section events (e.g. products_cards arrays).
    }
  }

  return html;
}

// Reads and serves a public/ HTML file with token replacement + pages-
// table overrides. Returns true if a file was served, false if no
// candidate matched. Async because applyPageOverrides hits the DB.
async function tryServeHtml(req, res, candidates, options) {
  const opts = options || {};
  for (const f of candidates) {
    if (!fs.existsSync(f) || !f.endsWith('.html')) continue;
    let html;
    try { html = fs.readFileSync(f, 'utf8'); }
    catch (_) { return false; }
    const ctx = buildContext(req, opts.canonicalPath);
    let out = replaceTokens(html, ctx);
    // Apply admin pages-table overrides AFTER tokens so the operator's
    // edits beat both the source-file defaults and the {{TOKEN}} fallbacks.
    out = await applyPageOverrides(out);
    // FINAL pass: re-apply text_overrides AFTER applyPageOverrides so an
    // operator's inline-edited string ("click the H1 in the preview iframe
    // → save") wins over pages.hero_title from the DB. Without this pass,
    // applyPageOverrides re-injects the page row's stale hero_title and
    // the operator's edit silently disappears.
    const textOverrides = settingsCache.text_overrides || {};
    if (Object.keys(textOverrides).length) {
      out = applyTextOverrides(out, textOverrides);
    }
    // Expose the text-overrides map to cms-page.js so client-side hydration
    // can re-apply the same substitutions after updating the DOM from the
    // pages API. Without this, hydration overwrites the server's correctly-
    // rendered text and the operator's edits appear to "revert".
    if (Object.keys(textOverrides).length) {
      const safe = JSON.stringify(textOverrides).replace(/<\/script>/gi, '<\\/script>');
      out = out.replace('</body>', `<script>window.__CMS_TEXT_OVERRIDES__=${safe};</script>\n</body>`);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'no-cache');
    if (opts.status) res.status(opts.status);
    res.send(out);
    return true;
  }
  return false;
}

// Express middleware: intercept HTML requests under /public/ before
// express.static runs. Ignores admin/* (CMS UI) and assets.
async function htmlTokenMiddleware(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api/')) return next();
  if (req.path.startsWith('/admin')) return next();
  if (req.path.startsWith('/uploads/')) return next();
  // Skip clearly-static asset requests.
  const isProbablyAsset = /\.(css|js|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|map|json|xml|txt|pdf|mp4|webm)$/i.test(req.path);
  if (isProbablyAsset) return next();

  // Resolve candidates against /public/.
  let p = req.path;
  if (p === '/') p = '/index.html';
  const candidates = [];
  if (p.endsWith('/')) {
    candidates.push(path.join(PUBLIC_DIR, p, 'index.html'));
  } else if (p.endsWith('.html')) {
    candidates.push(path.join(PUBLIC_DIR, p));
  } else {
    candidates.push(path.join(PUBLIC_DIR, p + '.html'));
    candidates.push(path.join(PUBLIC_DIR, p, 'index.html'));
  }

  try {
    if (await tryServeHtml(req, res, candidates)) return;
  } catch (err) {
    return next(err);
  }
  return next();
}

// Re-apply the saved text_overrides map to a final HTML string. Called
// by SSR detail renderers after injectIntoBody so the operator's
// inline-edited copy wins over entity-row data.
function applySavedTextOverrides(html) {
  const map = settingsCache.text_overrides || {};
  if (!Object.keys(map).length) return html;
  return applyTextOverrides(html, map);
}

module.exports = {
  htmlTokenMiddleware,
  tryServeHtml,
  buildContext,
  replaceTokens,
  applyPageOverrides,
  applySavedTextOverrides,
  invalidateSettingsCache,
  loadSettingsCache,
  resolveCanonicalBase,
  settingsCache,
};
