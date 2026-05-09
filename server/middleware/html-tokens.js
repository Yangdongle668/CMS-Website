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

// In-memory cache of seo + site + organization settings, refreshed on every
// PUT /api/settings/* and on a 30s interval. Avoids a DB hit per request.
const settingsCache = {
  seo: {},
  site: {},
  organization: {},
  loadedAt: 0,
};

async function loadSettingsCache() {
  try {
    const { many } = require('../db/client');
    const rows = await many(
      `SELECT key, value FROM settings WHERE key IN ('seo','site','organization')`
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

function resolveCanonicalBase(req) {
  const fromEnv = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const fromDb = (settingsCache.seo && settingsCache.seo.public_url) || '';
  if (fromDb) return String(fromDb).replace(/\/$/, '');
  if (req && req.headers && req.headers.host) {
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
    return `${proto}://${req.headers.host}`;
  }
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
  const fromSeo = (settingsCache.seo && settingsCache.seo.default_meta_image) || '/assets/img/og-default.png';
  return /^https?:\/\//.test(fromSeo) ? fromSeo : canonicalBase + fromSeo;
}

function replaceTokens(html, ctx) {
  return html
    .replace(/\{\{CANONICAL_BASE\}\}/g, ctx.canonicalBase)
    .replace(/\{\{CANONICAL_PATH\}\}/g, ctx.canonicalPath)
    .replace(/\{\{CANONICAL_URL\}\}/g, ctx.canonicalBase + ctx.canonicalPath)
    .replace(/\{\{SITE_NAME\}\}/g, ctx.siteName)
    .replace(/\{\{ORG_LEGAL_NAME\}\}/g, ctx.orgLegalName)
    .replace(/\{\{DEFAULT_OG_IMAGE\}\}/g, ctx.defaultOgImage);
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

// Reads and serves a public/ HTML file with token replacement.
// Returns true if a file was served, false if no candidate matched.
function tryServeHtml(req, res, candidates, options) {
  const opts = options || {};
  for (const f of candidates) {
    if (!fs.existsSync(f) || !f.endsWith('.html')) continue;
    let html;
    try { html = fs.readFileSync(f, 'utf8'); }
    catch (_) { return false; }
    const ctx = buildContext(req, opts.canonicalPath);
    const out = replaceTokens(html, ctx);
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
function htmlTokenMiddleware(req, res, next) {
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

  if (tryServeHtml(req, res, candidates)) return;
  return next();
}

module.exports = {
  htmlTokenMiddleware,
  tryServeHtml,
  buildContext,
  replaceTokens,
  invalidateSettingsCache,
  loadSettingsCache,
};
