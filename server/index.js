require('dotenv').config();
require('express-async-errors');
const path = require('path');
const fs = require('fs');
const express = require('express');

process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
});
process.on('uncaughtException', (err) => {
  // Don't exit immediately — log and let supervisor decide. An
  // uncaughtException during normal operation usually means a logic
  // bug we want to see in the logs rather than a silent restart.
  console.error('[uncaughtException]', err && err.stack ? err.stack : err);
});
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT = path.join(__dirname, '..');

app.set('trust proxy', 1);

// ----- Response compression -----
// gzip everything textual (HTML/CSS/JS/JSON) above ~1KB. Skips already
// compressed types like images. Brotli would be 15-20% smaller but
// requires nginx/cloudflare in front; gzip works out of the box.
//
// We deliberately skip compression for SSE / streaming responses by
// honoring the standard `x-no-compression` request header.
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ----- Security headers -----
// HTTPS enforcement (HSTS + upgrade-insecure-requests) is only enabled when
// FORCE_HTTPS=true. When the site is served over plain HTTP (e.g. running
// via `docker compose up` without a TLS terminator), forcing upgrades
// breaks every CSS/JS asset because the browser tries to fetch them over
// HTTPS and gets ERR_SSL_PROTOCOL_ERROR.
const forceHttps = String(process.env.FORCE_HTTPS || 'false') === 'true';

// CSP allows the analytics + tag-manager hosts so a configured GA4 ID
// can actually load gtag.js + report events. Only Google-owned hosts
// are whitelisted; Hotjar / Mixpanel etc. would need a future opt-in.
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'", "'unsafe-inline'",
    'https://challenges.cloudflare.com',
    'https://www.googletagmanager.com',
    'https://*.googletagmanager.com',
    // Quill 2.0 — visual editor in /admin/ pages only. Pulled from
    // jsdelivr CDN; admin pages are noindex so no SEO impact.
    'https://cdn.jsdelivr.net',
  ],
  'style-src': [
    "'self'", "'unsafe-inline'",
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net',
  ],
  'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
  'img-src': ["'self'", 'data:', 'blob:', 'http:', 'https:'],
  'connect-src': [
    "'self'",
    'https://challenges.cloudflare.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.googletagmanager.com',
    // jsdelivr serves Quill's .map sourcemaps when devtools is open;
    // also any future CDN-hosted lib lookups.
    'https://cdn.jsdelivr.net',
  ],
  // 'self' allows the live preview iframe in /admin/pages.html to load
  // the same-origin public pages (about/, products/, etc.). Without
  // this, frame-src defaults to 'self' restrictions but Helmet's
  // useDefaults flips it to "none". Explicit 'self' fixes the
  // SecurityError: cross-origin frame visitor saw in /admin/pages.html.
  'frame-src': ["'self'", 'https://challenges.cloudflare.com'],
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

// ----- Health probes -----
// /healthz is the cheap "is the process alive" check used by load
// balancers and container orchestrators. It must not touch the DB so
// that PG hiccups don't take the whole pod out of rotation.
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, ts: Date.now(), uptime: Math.round(process.uptime()) });
});

// /readyz is the deeper check — touches PG, looks at outbox lag and
// emergency-store backlog. Operators can poll this from monitoring or
// rely on the same endpoint for k8s readiness probes (delay traffic
// during DB warm-up or when the mail queue is badly backed up).
app.get('/readyz', async (_req, res) => {
  const { ping } = require('./db/client');
  const emergency = require('./services/emergency-store');
  const checks = { db: 'unknown', outbox_overdue: 0, dead_letters: 0, emergency: 0 };
  let healthy = true;

  try {
    await ping();
    checks.db = 'ok';
  } catch (err) {
    checks.db = 'fail: ' + (err && err.message);
    healthy = false;
  }

  if (checks.db === 'ok') {
    try {
      const { one } = require('./db/client');
      const lag = await one(
        `SELECT count(*)::int AS n FROM mail_outbox
         WHERE status IN ('pending','failed') AND created_at < now() - interval '10 minutes'`
      );
      const dead = await one(`SELECT count(*)::int AS n FROM mail_outbox WHERE status='dead'`);
      checks.outbox_overdue = lag ? lag.n : 0;
      checks.dead_letters = dead ? dead.n : 0;
      if (checks.outbox_overdue >= 50) healthy = false;
    } catch (_) {}
  }

  try { checks.emergency = await emergency.count(); }
  catch (_) {}
  if (checks.emergency > 0) healthy = false;

  res.status(healthy ? 200 : 503).json({ ok: healthy, ...checks });
});

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
app.use('/api/authors', require('./routes/authors'));
app.use('/api/media/overrides', require('./routes/media-overrides'));
app.use('/api/text-overrides', require('./routes/text-overrides'));
app.use('/api/seo-check', require('./routes/seo-check'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/ai-generate', require('./routes/ai-generate'));
app.use('/api/mail-queue', require('./routes/mail-queue'));
app.use('/api/smtp', require('./routes/smtp'));

// ----- SEO endpoints -----
app.use('/', require('./routes/seo'));

// ----- First-party analytics tracker (aggregate-only, GDPR-friendly) -----
// Mounted BEFORE the HTML token middleware so the tracker sees the
// real path (and HTML responses still get tokens replaced afterwards).
const { trackerMiddleware } = require('./middleware/analytics');
app.use(trackerMiddleware);

// ----- HTML token replacement (canonical, OG, SITE_NAME, etc.) -----
// Mounted BEFORE express.static so .html files flow through replaceTokens.
// Static assets (CSS/JS/images) are short-circuited inside the middleware.
const { htmlTokenMiddleware, tryServeHtml } = require('./middleware/html-tokens');

// ----- SSR for top-level static pages with dynamic widgets -----
// Homepage's "Latest Insights" grid and the blog index featured/grid
// were JS-fetched, which produced a visible empty-then-populate flash.
// Mounted BEFORE htmlTokenMiddleware so we replace the token-only
// service for these specific URLs with our own DB-aware renderer.
const ssrDetail = require('./middleware/ssr-detail');
app.get(['/', '/index.html'], async (req, res, next) => {
  try { if (await ssrDetail.renderHomepage(req, res)) return; }
  catch (err) { console.error('[ssr] / failed:', err && err.message); }
  return next();
});
app.get(['/blog/', '/blog/index.html'], async (req, res, next) => {
  try { if (await ssrDetail.renderBlogIndex(req, res)) return; }
  catch (err) { console.error('[ssr] /blog/ failed:', err && err.message); }
  return next();
});

app.use(htmlTokenMiddleware);

// ----- Static caching strategy -----
// HTML:        no-cache (so admin edits go live immediately on next visit)
// /dist/*:     1 year + immutable (filenames are content-hashed)
// Uploads:     30 days (filenames already include a hash; safe to long-cache)
// Fonts:       1 year
// Other CSS/JS: 1 day (covers source files served when no build manifest)
const staticHeaders = (res, filePath) => {
  if (filePath.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache');
    return;
  }
  // Anything served out of the built bundle directory is content-hashed
  // and therefore safe to cache forever. The HTML rewrite layer swaps
  // references to these whenever a new manifest is loaded.
  if (filePath.includes(path.sep + 'dist' + path.sep)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }
  if (/\.(woff2?|ttf|otf|eot)$/i.test(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }
  if (/\.(png|jpe?g|webp|avif|gif|svg|ico)$/i.test(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=2592000');   // 30 days
    return;
  }
  // CSS/JS/etc. — short cache by default; partials.js / cms-page.js etc.
  // pull `?v=` cache-busters from query strings so browsers revalidate
  // when admin pushes new content.
  res.setHeader('Cache-Control', 'public, max-age=86400');       // 1 day
};

// ----- Static uploads -----
// Uploads use UUID-style filenames so the URL itself is the cache key.
app.use('/uploads', express.static(path.join(ROOT, 'uploads'), {
  maxAge: '30d',
  immutable: false,
  index: false,
}));

// ----- Static admin -----
app.use('/admin', express.static(path.join(ROOT, 'admin'), {
  extensions: ['html'],
  setHeaders: staticHeaders,
}));
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
    setHeaders: staticHeaders,
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
app.get(['/products/:slug', '/applications/:slug', '/blog/:slug'], async (req, res, next) => {
  const segments = req.path.split('/').filter(Boolean);
  const dir = segments[0];
  const slug = segments[1];
  if (!slug) return next();

  // 1. SSR detail render based on the URL section. Order matters under
  //    /products/:slug — try the pillar first (the three pillar slugs are
  //    the canonical product hubs), then fall through to the SKU-level
  //    renderProduct so individual product detail URLs render fully
  //    server-side instead of redirecting to /products/.
  try {
    if (dir === 'products') {
      if (await ssrDetail.renderPillar(req, res, slug)) return;
      if (await ssrDetail.renderProduct(req, res, slug)) return;
    }
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
  if (await tryServeHtml(req, res, candidates, { canonicalPath: req.path })) return;
  return next();
});

// ----- 404 -----
app.use(async (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'not_found' });
  }
  const candidates = [path.join(ROOT, 'public', '404.html')];
  if (await tryServeHtml(req, res, candidates, { status: 404, canonicalPath: req.path })) return;
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
//
// Uses queryNoRetry deliberately: if PG is unreachable, we want each
// statement to fail in ~1ms (ECONNREFUSED is instant), not spin the
// 200ms→400ms retry loop ~80 times and delay app.listen by 50+ seconds.
// The pre-flight ping below short-circuits the entire loop in that case.
async function autoMigrate() {
  const { queryNoRetry, ping } = require('./db/client');
  try {
    await ping();
  } catch (err) {
    console.warn('[migrate] PG not reachable, skipping migrations (will retry on next boot):', err && err.message);
    return;
  }
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
    // Authors table — drives Person JSON-LD on article pages and the
    // author profile cards used for E-E-A-T credibility (2026 Google
    // helpful-content guidance).
    `CREATE TABLE IF NOT EXISTS authors (
       id SERIAL PRIMARY KEY,
       slug VARCHAR(190) UNIQUE NOT NULL,
       name VARCHAR(190) NOT NULL,
       job_title VARCHAR(190) NOT NULL DEFAULT '',
       bio TEXT NOT NULL DEFAULT '',
       avatar_url VARCHAR(500) NOT NULL DEFAULT '',
       email VARCHAR(190) NOT NULL DEFAULT '',
       knows_about JSONB NOT NULL DEFAULT '[]'::jsonb,
       same_as JSONB NOT NULL DEFAULT '[]'::jsonb,
       is_active BOOLEAN NOT NULL DEFAULT TRUE,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_id INT REFERENCES authors(id) ON DELETE SET NULL`,
    // First-party analytics — every public HTML page-view writes one row.
    // Privacy: visitor_hash uses a daily-rotating salt so cross-day
    // identification is impossible; raw IP is never stored.
    `CREATE TABLE IF NOT EXISTS analytics_hits (
       id BIGSERIAL PRIMARY KEY,
       ts TIMESTAMPTZ NOT NULL DEFAULT now(),
       path VARCHAR(500) NOT NULL,
       country VARCHAR(2) NOT NULL DEFAULT '',
       browser VARCHAR(40) NOT NULL DEFAULT '',
       os VARCHAR(40) NOT NULL DEFAULT '',
       referer_host VARCHAR(190) NOT NULL DEFAULT '',
       visitor_hash VARCHAR(64) NOT NULL DEFAULT '',
       ip_text VARCHAR(45) NOT NULL DEFAULT '',
       is_bot BOOLEAN NOT NULL DEFAULT FALSE
     )`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_ts ON analytics_hits(ts DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_path ON analytics_hits(path)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_hits(country)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_visitor ON analytics_hits(visitor_hash, ts)`,
    // Add ip_text column on existing deployments. Stores the raw client
    // IP (caller's choice — operator may purge with /api/analytics/purge-ips).
    `ALTER TABLE analytics_hits ADD COLUMN IF NOT EXISTS ip_text VARCHAR(45) NOT NULL DEFAULT ''`,
    `INSERT INTO authors (slug, name, job_title, bio)
       VALUES ('zufek-engineering', 'Zufek Engineering', 'Cell engineering team',
               'Collective byline for the Zufek cell engineering team. Articles authored under this name are reviewed by our four founder-engineers (Chen Li, et al.) and the lead PM on the relevant pillar program.')
       ON CONFLICT (slug) DO NOTHING`,
    // ----- 2026 Q2 SEO migration: RankMath-style per-entity SEO fields -----
    // Universal columns added to all 5 content tables. Idempotent.
    ...['pages','pillar_pages','products','applications','articles'].flatMap((t) => [
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS focus_keyword VARCHAR(190) NOT NULL DEFAULT ''`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS secondary_keywords JSONB NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS canonical_override VARCHAR(500) NOT NULL DEFAULT ''`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS robots VARCHAR(80) NOT NULL DEFAULT ''`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS og_title VARCHAR(255) NOT NULL DEFAULT ''`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS og_description TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS og_image_url VARCHAR(500) NOT NULL DEFAULT ''`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS twitter_title VARCHAR(255) NOT NULL DEFAULT ''`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS twitter_description TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS twitter_image_url VARCHAR(500) NOT NULL DEFAULT ''`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS schema_type VARCHAR(80) NOT NULL DEFAULT ''`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS schema_extra JSONB NOT NULL DEFAULT '{}'::jsonb`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS seo_score INT NOT NULL DEFAULT 0`,
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS seo_checks JSONB NOT NULL DEFAULT '[]'::jsonb`,
    ]),
    // ----- Mail outbox + inquiry hardening (Sprint 0) -----
    // The outbox decouples SMTP from request handling: inquiry inserts
    // enqueue here, a worker drains them with exponential backoff. Adding
    // these as idempotent migrations so existing deployments self-upgrade.
    `ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64) NOT NULL DEFAULT ''`,
    `ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS score INT NOT NULL DEFAULT 0`,
    `CREATE INDEX IF NOT EXISTS idx_inquiries_dedupe
       ON inquiries(email, content_hash, created_at DESC)`,
    `CREATE TABLE IF NOT EXISTS mail_outbox (
       id              SERIAL PRIMARY KEY,
       kind            VARCHAR(40)  NOT NULL,
       related_type    VARCHAR(40)  NOT NULL DEFAULT '',
       related_id      INT,
       to_addr         TEXT         NOT NULL,
       reply_to        TEXT         NOT NULL DEFAULT '',
       subject         TEXT         NOT NULL,
       html            TEXT         NOT NULL,
       text_body       TEXT         NOT NULL DEFAULT '',
       attachments     JSONB        NOT NULL DEFAULT '[]'::jsonb,
       status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
       attempts        INT          NOT NULL DEFAULT 0,
       max_attempts    INT          NOT NULL DEFAULT 8,
       next_attempt_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
       last_error      TEXT         NOT NULL DEFAULT '',
       locked_by       VARCHAR(80)  NOT NULL DEFAULT '',
       locked_at       TIMESTAMPTZ,
       created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
       sent_at         TIMESTAMPTZ
     )`,
    `CREATE INDEX IF NOT EXISTS idx_outbox_due
       ON mail_outbox(status, next_attempt_at)
       WHERE status IN ('pending', 'failed')`,
    `CREATE INDEX IF NOT EXISTS idx_outbox_related
       ON mail_outbox(related_type, related_id)`,
    `CREATE INDEX IF NOT EXISTS idx_outbox_status_created
       ON mail_outbox(status, created_at DESC)`,
    // ----- Composite & partial indexes for hot read paths (Sprint 1) -----
    `CREATE INDEX IF NOT EXISTS idx_articles_pillar_pub
       ON articles(pillar_id, published_at DESC)
       WHERE status = 'published'`,
    `CREATE INDEX IF NOT EXISTS idx_articles_published
       ON articles(published_at DESC)
       WHERE status = 'published'`,
    `CREATE INDEX IF NOT EXISTS idx_pillar_published_sort
       ON pillar_pages(sort_order, id)
       WHERE status = 'published'`,
    `CREATE INDEX IF NOT EXISTS idx_products_pillar_published
       ON products(pillar_id, sort_order, id)
       WHERE status = 'published'`,
    `CREATE INDEX IF NOT EXISTS idx_applications_published_sort
       ON applications(sort_order, id)
       WHERE status = 'published'`,
    `CREATE INDEX IF NOT EXISTS idx_pages_published_slug
       ON pages(slug)
       WHERE status = 'published'`,
    `CREATE INDEX IF NOT EXISTS idx_inquiries_active_score
       ON inquiries(score DESC, created_at DESC)
       WHERE is_deleted = FALSE`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_path_ts
       ON analytics_hits(path, ts DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_country_ts
       ON analytics_hits(country, ts DESC)
       WHERE country <> ''`,
    // ----- Media variants (Sprint 1 — image processing) -----
    `ALTER TABLE media ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb`,
    `ALTER TABLE media ADD COLUMN IF NOT EXISTS srcset   JSONB NOT NULL DEFAULT '{}'::jsonb`,
    `ALTER TABLE media ADD COLUMN IF NOT EXISTS width    INT   NOT NULL DEFAULT 0`,
    `ALTER TABLE media ADD COLUMN IF NOT EXISTS height   INT   NOT NULL DEFAULT 0`,
    // ----- Inquiry funnel tracking (Sprint 2) -----
    `ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS source_widget VARCHAR(40) NOT NULL DEFAULT 'main_form'`,
    `ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ`,
    `CREATE INDEX IF NOT EXISTS idx_inquiries_widget ON inquiries(source_widget, created_at DESC) WHERE is_deleted = FALSE`,
    // ----- Acme → Zufek cleanup (legacy seed data) -----
    `UPDATE articles SET author = 'Zufek Engineering' WHERE author ILIKE '%acme%' OR author = '' OR author IS NULL`,
    `UPDATE articles SET content = REPLACE(content, 'Acme Engineering', 'Zufek Engineering') WHERE content LIKE '%Acme%'`,
    `UPDATE articles SET content = REPLACE(content, 'Acme', 'Zufek') WHERE content LIKE '%Acme%'`,
    `UPDATE pages SET hero_subtitle = REPLACE(hero_subtitle, 'Acme', 'Zufek'), body_html = REPLACE(body_html, 'Acme', 'Zufek'), meta_title = REPLACE(meta_title, 'Acme', 'Zufek'), meta_description = REPLACE(meta_description, 'Acme', 'Zufek') WHERE hero_subtitle LIKE '%Acme%' OR body_html LIKE '%Acme%' OR meta_title LIKE '%Acme%' OR meta_description LIKE '%Acme%'`,
    `UPDATE pillar_pages SET hero_subtitle = REPLACE(hero_subtitle, 'Acme', 'Zufek'), meta_title = REPLACE(meta_title, 'Acme', 'Zufek'), meta_description = REPLACE(meta_description, 'Acme', 'Zufek') WHERE hero_subtitle LIKE '%Acme%' OR meta_title LIKE '%Acme%' OR meta_description LIKE '%Acme%'`,
    `UPDATE products SET description = REPLACE(description, 'Acme', 'Zufek'), tagline = REPLACE(tagline, 'Acme', 'Zufek'), meta_title = REPLACE(meta_title, 'Acme', 'Zufek'), meta_description = REPLACE(meta_description, 'Acme', 'Zufek') WHERE description LIKE '%Acme%' OR tagline LIKE '%Acme%' OR meta_title LIKE '%Acme%' OR meta_description LIKE '%Acme%'`,
    `UPDATE applications SET summary = REPLACE(summary, 'Acme', 'Zufek'), body = REPLACE(body, 'Acme', 'Zufek'), meta_title = REPLACE(meta_title, 'Acme', 'Zufek'), meta_description = REPLACE(meta_description, 'Acme', 'Zufek') WHERE summary LIKE '%Acme%' OR body LIKE '%Acme%' OR meta_title LIKE '%Acme%' OR meta_description LIKE '%Acme%'`,
    // ----- Round-robin author binding for any article still missing one -----
    `WITH ranked AS (
       SELECT a.id, row_number() OVER (ORDER BY a.published_at DESC NULLS LAST, a.id) AS rn
         FROM articles a WHERE a.author_id IS NULL
     ),
     authors_arr AS (SELECT array_agg(id ORDER BY id) AS ids FROM authors WHERE is_active AND slug <> 'zufek-engineering')
     UPDATE articles a
        SET author_id = (SELECT ids FROM authors_arr)[ ((r.rn - 1) % NULLIF(array_length((SELECT ids FROM authors_arr), 1), 0)) + 1 ]
       FROM ranked r
      WHERE a.id = r.id AND (SELECT array_length(ids, 1) FROM authors_arr) > 0`,
  ];
  for (const sql of stmts) {
    try { await queryNoRetry(sql); }
    catch (err) { console.error('[migrate] statement failed:', err.message); }
  }
  console.log('[migrate] schema check complete');

  // ----- Apply long SQL migration files (idempotent) -----
  // These are kept as standalone .sql files so an operator can also run
  // them manually with psql. Loading them here makes a fresh deployment
  // self-healing without anyone having to remember to run them.
  const fs = require('fs');
  const path = require('path');
  const sqlMigrations = [
    'migrate-2026-q2-seo.sql',          // adds RankMath-style SEO columns + cleans Acme strings
    'migrate-2026-q2-seo-content.sql',  // pre-fills focus_keyword + meta on every entity
  ];
  for (const fname of sqlMigrations) {
    const fpath = path.join(__dirname, 'db', fname);
    if (!fs.existsSync(fpath)) continue;
    try {
      const sql = fs.readFileSync(fpath, 'utf8');
      await queryNoRetry(sql);
      console.log(`[migrate] applied ${fname}`);
    } catch (err) {
      console.error(`[migrate] ${fname} failed:`, err.message);
    }
  }
}

// Block on schema migrations BEFORE accepting traffic. Otherwise an
// admin who hits PUT /api/articles/:id during the first few seconds
// after restart can get a 500 because the SEO columns haven't been
// added yet. The migrations are idempotent so re-running on every
// boot costs only a few ms.
(async () => {
  try {
    await autoMigrate();
  } catch (err) {
    console.error('[migrate] error:', err);
  }
  // Hydrate AI provider snapshot from settings table. ai-generator.js
  // reads from this snapshot synchronously so we don't have to await a
  // DB hop on every LLM call. PUT /api/settings/ai_providers refreshes it.
  try {
    const aiSettings = require('./services/ai-settings');
    await aiSettings.reload();
    console.log('[ai-settings] snapshot loaded');
  } catch (err) {
    console.error('[ai-settings] initial load failed:', err.message);
  }

  // Hydrate SMTP config snapshot from settings.smtp so the first email
  // doesn't pay the DB round-trip + so describeConfig() returns
  // meaningful state for /api/smtp GET on a fresh boot.
  try {
    const mailer = require('./services/mailer');
    await mailer.loadConfig();
    console.log('[smtp] config snapshot loaded');
  } catch (err) {
    console.warn('[smtp] initial load failed:', err && err.message);
  }

  // Initialize cache backend (Redis if REDIS_URL set, else in-memory).
  // Failure to connect Redis automatically falls back to in-memory and
  // the app continues; never blocks boot.
  try {
    const cache = require('./services/cache');
    await cache.init();
  } catch (err) {
    console.error('[cache] init failed (continuing):', err && err.message);
  }

  // Recover any rows a prior process had marked 'sending' before
  // crashing — they'd otherwise be stuck forever.
  try {
    const outbox = require('./services/mail-outbox');
    await outbox.releaseStaleLocks(10);
    if (String(process.env.OUTBOX_DISABLED || 'false') !== 'true') {
      outbox.startWorker();
    } else {
      console.log('[outbox] worker disabled by OUTBOX_DISABLED=true');
    }
  } catch (err) {
    console.error('[outbox] startup failed:', err && err.message);
  }

  // Replay any inquiries that were sidelined to the emergency NDJSON
  // file during a prior PG outage. This is a one-shot replay; the
  // health-alert job will surface any records that fail to land
  // (e.g. DB still unhealthy) so a human can intervene.
  try {
    const emergency = require('./services/emergency-store');
    const inquiriesRouter = require('./routes/inquiries');
    const insertFn = inquiriesRouter.insertInquiryRaw;
    if (typeof insertFn === 'function') {
      const result = await emergency.replay(insertFn);
      if (result.recovered) {
        console.log(`[emergency] recovered ${result.recovered} inquiry record(s) at boot`);
      }
    }
  } catch (err) {
    console.error('[emergency] replay failed at boot:', err && err.message);
  }

  // Background health-alert scheduler (5min poll, 30min per-reason
  // debounce). Skipped if HEALTH_ALERTS_DISABLED=true so a local dev
  // setup doesn't fire alerts for empty configs.
  if (String(process.env.HEALTH_ALERTS_DISABLED || 'false') !== 'true') {
    try {
      const healthAlert = require('./jobs/health-alert');
      healthAlert.start();
    } catch (err) {
      console.error('[health-alert] failed to start:', err && err.message);
    }
  }

  const server = app.listen(PORT, () => {
    console.log(`[battery-cms] running on http://localhost:${PORT}`);
  });

  // ----- Graceful shutdown -----
  // SIGTERM is what `docker stop` / k8s rolling restarts send. We stop
  // accepting new connections, let in-flight requests drain, halt the
  // outbox worker so a half-sent batch doesn't leak, then exit. The
  // 10s hard-kill safety net catches a stuck request hanging the
  // graceful path.
  let shuttingDown = false;
  const shutdown = (sig) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] ${sig} received, draining...`);
    try {
      const outbox = require('./services/mail-outbox');
      outbox.stopWorker();
    } catch (_) {}
    try {
      const healthAlert = require('./jobs/health-alert');
      healthAlert.stop();
    } catch (_) {}
    try {
      const cache = require('./services/cache');
      cache.close();
    } catch (_) {}
    server.close((err) => {
      if (err) console.error('[shutdown] http close error', err.message);
      else console.log('[shutdown] http closed');
      // Best-effort: drain pg pool so PG sees clean disconnects
      const { pool } = require('./db/client');
      pool.end().catch(() => {}).finally(() => process.exit(0));
    });
    setTimeout(() => {
      console.error('[shutdown] forced exit after 10s');
      process.exit(1);
    }, 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})();
