require('dotenv').config();
require('express-async-errors');
const path = require('path');
const fs = require('fs');
const express = require('express');

process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
});
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT = path.join(__dirname, '..');

app.set('trust proxy', 1);

// ----- Security headers -----
// HTTPS enforcement (HSTS + upgrade-insecure-requests) is only enabled when
// FORCE_HTTPS=true. When the site is served over plain HTTP (e.g. running
// via `docker compose up` without a TLS terminator), forcing upgrades
// breaks every CSS/JS asset because the browser tries to fetch them over
// HTTPS and gets ERR_SSL_PROTOCOL_ERROR.
const forceHttps = String(process.env.FORCE_HTTPS || 'false') === 'true';

const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://challenges.cloudflare.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
  'img-src': ["'self'", 'data:', 'blob:', 'http:', 'https:'],
  'connect-src': ["'self'", 'https://challenges.cloudflare.com'],
  'frame-src': ['https://challenges.cloudflare.com'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};
// `useDefaults: true` would inject upgrade-insecure-requests, so explicitly
// null it out unless HTTPS is actually being served.
cspDirectives['upgrade-insecure-requests'] = forceHttps ? [] : null;

app.use(
  helmet({
    contentSecurityPolicy: { useDefaults: true, directives: cspDirectives },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: forceHttps ? undefined : false,
    originAgentCluster: false,
    hsts: forceHttps,
  })
);

app.use(cookieParser(process.env.COOKIE_SECRET || 'dev-cookie-secret'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Global gentle limiter for API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// ----- Public env (Turnstile site key + SEO defaults for the client) -----
app.get('/api/public/config', async (_req, res) => {
  // Read latest seo settings so the SPA can populate analytics/verification
  // tags without a separate fetch and without staleness vs. /api/settings/public.
  let seo = {};
  try {
    const { many } = require('./db/client');
    const rows = await many(`SELECT key, value FROM settings WHERE key = 'seo'`);
    seo = (rows[0] && rows[0].value) || {};
  } catch (_) { /* DB might not be ready during early boot */ }
  res.json({
    siteName: process.env.SITE_NAME || 'Zufek',
    publicUrl: process.env.PUBLIC_URL || seo.public_url || '',
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
    privacyPolicyVersion: process.env.PRIVACY_POLICY_VERSION || '1.0',
    ga4: seo.ga4_measurement_id || '',
    gscVerify: seo.gsc_verify || '',
    bingVerify: seo.bing_verify || '',
    twitterHandle: seo.twitter_handle || '',
    defaultOgImage: seo.default_meta_image || '/assets/img/og-default.png',
  });
});

// ----- API routes -----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pillars', require('./routes/pillars'));
app.use('/api/products', require('./routes/products'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/media', require('./routes/media'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/gdpr', require('./routes/gdpr'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/users', require('./routes/users'));
app.use('/api/pages', require('./routes/pages'));

// ----- SEO endpoints -----
app.use('/', require('./routes/seo'));

// ----- HTML token replacement (canonical, OG, SITE_NAME, etc.) -----
// Mounted BEFORE express.static so .html files flow through replaceTokens.
// Static assets (CSS/JS/images) are short-circuited inside the middleware.
const { htmlTokenMiddleware, tryServeHtml } = require('./middleware/html-tokens');
app.use(htmlTokenMiddleware);

// ----- Static uploads -----
app.use('/uploads', express.static(path.join(ROOT, 'uploads'), { maxAge: '7d', index: false }));

// ----- Static admin -----
app.use('/admin', express.static(path.join(ROOT, 'admin'), { extensions: ['html'] }));
app.get('/admin/*', (req, res, next) => {
  // Serve admin/index.html for client-side route fallback only when file doesn't exist
  const filePath = path.join(ROOT, 'admin', req.path.replace(/^\/admin\//, ''));
  if (fs.existsSync(filePath)) return next();
  return res.sendFile(path.join(ROOT, 'admin', 'index.html'));
});

// ----- Static public site (assets only — HTML already handled above) -----
app.use(
  express.static(path.join(ROOT, 'public'), {
    extensions: ['html'],
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  })
);

// ----- Pretty URLs for products / blog / applications -----
// Order:
//   1. Per-slug .html file (already handled by token middleware above for
//      static pages like /applications/medical.html).
//   2. SSR detail render — server reads DB and injects title/meta/canonical
//      /OG/JSON-LD into _template.html before sending. Required for SEO so
//      Googlebot, social-card scrapers and AI parsers see the head in the
//      initial HTML.
//   3. Final fallback: ship _template.html with token replacement only
//      (JS will hydrate body, but head is already populated by tokens).
const ssrDetail = require('./middleware/ssr-detail');
app.get(['/products/:slug', '/applications/:slug', '/blog/:slug'], async (req, res, next) => {
  const segments = req.path.split('/').filter(Boolean);
  const dir = segments[0];
  const slug = segments[1];
  if (!slug) return next();

  // 1. SSR detail render based on the URL section.
  try {
    if (dir === 'products' && await ssrDetail.renderPillar(req, res, slug)) return;
    if (dir === 'blog' && await ssrDetail.renderArticle(req, res, slug)) return;
    if (dir === 'applications' && await ssrDetail.renderApplication(req, res, slug)) return;
  } catch (err) {
    console.error('[ssr] %s %s failed:', dir, slug, err && err.message);
    // Fall through to token-only rendering rather than 500ing.
  }

  // 2. Token-only fallback (per-slug .html or _template.html with placeholders).
  const candidates = [
    path.join(ROOT, 'public', dir, `${slug}.html`),
    path.join(ROOT, 'public', dir, slug, 'index.html'),
    path.join(ROOT, 'public', dir, '_template.html'),
  ];
  if (tryServeHtml(req, res, candidates, { canonicalPath: req.path })) return;
  return next();
});

// ----- 404 -----
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'not_found' });
  }
  const candidates = [path.join(ROOT, 'public', '404.html')];
  if (tryServeHtml(req, res, candidates, { status: 404, canonicalPath: req.path })) return;
  res.status(404).send('Not found');
});

// ----- Error handler -----
app.use((err, req, res, _next) => {
  // Log full error details to stdout so `docker compose logs app` shows
  // the SQL message / stack. Useful for diagnosing 500s in admin.
  console.error('[error] %s %s', req.method, req.originalUrl);
  console.error(err && err.stack ? err.stack : err);
  if (res.headersSent) return;
  // Surface the actual error code to admin clients so the toast is helpful.
  const isApi = req.originalUrl.startsWith('/api/');
  const detail = err && err.code ? ` (${err.code})` : '';
  res.status(err.status || 500).json({
    error: err.expose ? err.message : 'internal_error',
    detail: isApi && err && err.message ? err.message + detail : undefined,
  });
});

// ----- Self-healing schema migrations -----
// Idempotent ALTER TABLEs that bring an older deployment's database
// up to the current schema. Runs once at boot — safe to re-run.
async function autoMigrate() {
  const { query } = require('./db/client');
  const stmts = [
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS template VARCHAR(40) NOT NULL DEFAULT 'standard'`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS hero_image VARCHAR(500) NOT NULL DEFAULT ''`,
    `CREATE TABLE IF NOT EXISTS pages (
       id SERIAL PRIMARY KEY,
       slug VARCHAR(190) UNIQUE NOT NULL,
       nav VARCHAR(60) NOT NULL DEFAULT '',
       title VARCHAR(255) NOT NULL DEFAULT '',
       meta_title VARCHAR(255) NOT NULL DEFAULT '',
       meta_description TEXT NOT NULL DEFAULT '',
       hero_eyebrow VARCHAR(120) NOT NULL DEFAULT '',
       hero_title VARCHAR(255) NOT NULL DEFAULT '',
       hero_subtitle TEXT NOT NULL DEFAULT '',
       hero_image VARCHAR(500) NOT NULL DEFAULT '',
       hero_breadcrumbs JSONB NOT NULL DEFAULT '[]'::jsonb,
       body_html TEXT NOT NULL DEFAULT '',
       sections JSONB NOT NULL DEFAULT '{}'::jsonb,
       status VARCHAR(20) NOT NULL DEFAULT 'published',
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  ];
  for (const sql of stmts) {
    try { await query(sql); }
    catch (err) { console.error('[migrate] statement failed:', err.message); }
  }
  console.log('[migrate] schema check complete');
}

app.listen(PORT, () => {
  console.log(`[battery-cms] running on http://localhost:${PORT}`);
  autoMigrate().catch((err) => console.error('[migrate] error:', err));
});
