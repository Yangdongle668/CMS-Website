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
const compression = require('compression');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT = path.join(__dirname, '..');

app.set('trust proxy', 1);

// gzip/brotli compression for every response that's larger than a few hundred
// bytes. HTML and JSON shrink ~65-75%; cuts payload over WAN dramatically.
// Static assets already on disk get compressed here (express.static doesn't
// pre-compress); for truly hot files in production a CDN would be the right
// place but this covers the common case for free.
app.use(compression({ threshold: 512 }));

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

// ----- Public env (Turnstile site key for client) -----
app.get('/api/public/config', (_req, res) => {
  res.json({
    siteName: process.env.SITE_NAME || 'Acme Battery',
    publicUrl: process.env.PUBLIC_URL || '',
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
    privacyPolicyVersion: process.env.PRIVACY_POLICY_VERSION || '1.0',
  });
});

// ----- Health & readiness probes -----
// /api/health is a fast "process is alive" check for Docker/k8s liveness
// probes — it doesn't touch the DB so it stays cheap even at high probe rate.
// /api/ready actually pings Postgres so a load balancer can drain traffic
// from a node whose DB connection is broken.
const bootedAt = Date.now();
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime_s: Math.round((Date.now() - bootedAt) / 1000) });
});
app.get('/api/ready', async (_req, res) => {
  const started = Date.now();
  try {
    const { one } = require('./db/client');
    await one('SELECT 1 AS ok');
    res.json({ ok: true, db_latency_ms: Date.now() - started });
  } catch (err) {
    res.status(503).json({ ok: false, error: 'db_unavailable', detail: err.message });
  }
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
app.use('/api/mail-queue', require('./routes/mail-queue'));

// ----- SEO endpoints -----
app.use('/', require('./routes/seo'));

// ----- Static uploads -----
// Uploaded media is content-addressed by filename (timestamp+hash) so it never
// changes for a given URL — safe to cache hard.
app.use('/uploads', express.static(path.join(ROOT, 'uploads'), {
  maxAge: '365d',
  immutable: true,
  index: false,
}));

// ----- Static admin -----
app.use('/admin', express.static(path.join(ROOT, 'admin'), { extensions: ['html'] }));
app.get('/admin/*', (req, res, next) => {
  // Serve admin/index.html for client-side route fallback only when file doesn't exist
  const filePath = path.join(ROOT, 'admin', req.path.replace(/^\/admin\//, ''));
  if (fs.existsSync(filePath)) return next();
  return res.sendFile(path.join(ROOT, 'admin', 'index.html'));
});

// ----- Static public site -----
// HTML must never be hard-cached: it embeds dynamic data and a CMS edit must
// be visible on the next reload. JS/CSS/images are cache-busted via ?v=N
// query strings (bumped on every release), so we can set a long max-age and
// rely on the query change to invalidate.
app.use(
  express.static(path.join(ROOT, 'public'), {
    extensions: ['html'],
    setHeaders: (res, filePath, _stat) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
        return;
      }
      if (/\.(js|css|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|ico|mp4|webm)$/i.test(filePath)) {
        // 7 days — long enough to matter, short enough that an emergency
        // un-versioned fix still propagates within a week. Combined with the
        // ?v=N bust this gives us infinite caching in practice on releases.
        res.setHeader('Cache-Control', 'public, max-age=604800');
      }
    },
  })
);

// ----- Pretty URLs for products / blog / applications -----
app.get(['/products/:slug', '/applications/:slug', '/blog/:slug'], (req, res, next) => {
  const segments = req.path.split('/').filter(Boolean);
  const dir = segments[0];
  const slug = segments[1];
  if (!slug) return next();
  const candidates = [
    path.join(ROOT, 'public', dir, `${slug}.html`),
    path.join(ROOT, 'public', dir, slug, 'index.html'),
  ];
  for (const f of candidates) {
    if (fs.existsSync(f)) return res.sendFile(f);
  }
  // Fallback to template that fetches via API
  const tpl = path.join(ROOT, 'public', dir, '_template.html');
  if (fs.existsSync(tpl)) return res.sendFile(tpl);
  return next();
});

// ----- Block-driven pages -----
// Anything that wasn't matched by static files / pretty product URLs and looks
// like a regular page request is checked against the `pages` table. If we find
// a row with non-empty blocks, serve the block shell — the client fetches the
// row again via /api/pages/by-slug/<slug> and renders the blocks. Cached
// briefly so we don't hit Postgres on every 404 attempt.
const blockShellPath = path.join(ROOT, 'public', '_block-shell.html');
const slugLookupCache = new Map();              // slug -> { has, expires }
const SLUG_CACHE_MS = 60 * 1000;
function pathToSlug(p) {
  let s = p.replace(/^\/+|\/+$/g, '');
  if (!s) return 'home';
  s = s.replace(/\.html$/i, '');
  if (s.endsWith('/index')) s = s.slice(0, -6);
  return s || 'home';
}
async function hasBlockPage(slug) {
  const now = Date.now();
  const c = slugLookupCache.get(slug);
  if (c && c.expires > now) return c.has;
  let has = false;
  try {
    const { one } = require('./db/client');
    const row = await one(
      `SELECT (jsonb_typeof(blocks) = 'array' AND jsonb_array_length(blocks) > 0) AS has
         FROM pages
        WHERE slug = $1 AND status = 'published'`,
      [slug]
    );
    has = !!(row && row.has);
  } catch (err) {
    console.error('[block-shell] lookup failed for slug', slug, err.message);
    has = false;
  }
  slugLookupCache.set(slug, { has, expires: now + SLUG_CACHE_MS });
  return has;
}
// Bust the cache whenever the admin saves a page so a freshly created /
// edited block-driven page works without waiting for the TTL.
function invalidateSlugCache(slug) {
  if (slug == null) slugLookupCache.clear();
  else slugLookupCache.delete(slug);
}
app.locals.invalidateSlugCache = invalidateSlugCache;

app.get('*', async (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/')) return next();
  if (req.path.startsWith('/admin/')) return next();
  if (req.path.startsWith('/uploads/')) return next();
  // Skip extensions other than .html / no-extension — never try this on
  // .js / .css / images that we already failed to find statically.
  const last = req.path.split('/').pop() || '';
  if (last.includes('.') && !/\.html?$/i.test(last)) return next();

  const slug = pathToSlug(req.path);
  const has = await hasBlockPage(slug);
  if (has) return res.sendFile(blockShellPath);
  return next();
});

// ----- 404 -----
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'not_found' });
  }
  const file = path.join(ROOT, 'public', '404.html');
  if (fs.existsSync(file)) return res.status(404).sendFile(file);
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
    `CREATE TABLE IF NOT EXISTS mail_outbox (
       id              SERIAL PRIMARY KEY,
       kind            VARCHAR(40) NOT NULL,
       inquiry_id      INT REFERENCES inquiries(id) ON DELETE SET NULL,
       to_addr         TEXT        NOT NULL,
       from_addr       TEXT        NOT NULL DEFAULT '',
       reply_to        TEXT        NOT NULL DEFAULT '',
       subject         TEXT        NOT NULL DEFAULT '',
       body_html       TEXT        NOT NULL DEFAULT '',
       body_text       TEXT        NOT NULL DEFAULT '',
       status          VARCHAR(20) NOT NULL DEFAULT 'pending',
       attempts        INT         NOT NULL DEFAULT 0,
       max_attempts    INT         NOT NULL DEFAULT 6,
       next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       last_error      TEXT        NOT NULL DEFAULT '',
       sent_at         TIMESTAMPTZ,
       created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
    `CREATE INDEX IF NOT EXISTS idx_outbox_ready   ON mail_outbox(next_attempt_at) WHERE status = 'pending'`,
    `CREATE INDEX IF NOT EXISTS idx_outbox_inquiry ON mail_outbox(inquiry_id)`,
    `CREATE INDEX IF NOT EXISTS idx_outbox_status  ON mail_outbox(status, created_at DESC)`,
    `ALTER TABLE pages ADD COLUMN IF NOT EXISTS blocks JSONB NOT NULL DEFAULT '[]'::jsonb`,

    // Performance — indexes covering the hot query paths in admin lists,
    // public lookups, and sitemap building. UNIQUE columns already have an
    // implicit index, so these only add what's missing.
    `CREATE INDEX IF NOT EXISTS idx_inquiries_created  ON inquiries (created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_inquiries_filter   ON inquiries (is_deleted, status, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_articles_published ON articles (published_at DESC) WHERE status = 'published'`,
    `CREATE INDEX IF NOT EXISTS idx_audit_user_recent  ON audit_logs (user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_pages_slug         ON pages (slug)`,
    `CREATE INDEX IF NOT EXISTS idx_pages_published    ON pages (status) WHERE status = 'published'`,

    // Login lockout state on the users table. Existing rows default to no
    // failed attempts / not locked.
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ`,
  ];
  for (const sql of stmts) {
    try { await query(sql); }
    catch (err) { console.error('[migrate] statement failed:', err.message); }
  }
  console.log('[migrate] schema check complete');
}

// In-process daily retention sweep: hard-deletes soft-deleted inquiries past
// their grace period, soft-deletes inquiries past the GDPR retention window,
// and purges old consent + audit logs. Runs once an hour after boot — cheap
// (a few DELETEs) so we don't bother with a cron container.
function scheduleRetentionSweep() {
  const { query } = require('./db/client');
  async function sweep() {
    try {
      const retention = parseInt(process.env.GDPR_RETENTION_DAYS || '365', 10);
      const softDays  = parseInt(process.env.GDPR_SOFT_DELETE_DAYS || '30', 10);
      const r1 = await query(
        `DELETE FROM inquiries WHERE is_deleted = TRUE AND deleted_at < now() - ($1 || ' days')::interval`,
        [softDays]
      );
      const r2 = await query(
        `UPDATE inquiries
            SET is_deleted = TRUE, deleted_at = now()
          WHERE is_deleted = FALSE AND created_at < now() - ($1 || ' days')::interval`,
        [retention]
      );
      const r3 = await query(`DELETE FROM consent_logs WHERE created_at < now() - interval '365 days'`);
      const r4 = await query(`DELETE FROM audit_logs   WHERE created_at < now() - interval '730 days'`);
      const r5 = await query(`DELETE FROM mail_outbox  WHERE status = 'sent' AND sent_at < now() - interval '90 days'`);
      if (r1.rowCount + r2.rowCount + r3.rowCount + r4.rowCount + r5.rowCount > 0) {
        console.log(
          `[retention] hard=${r1.rowCount} soft=${r2.rowCount} consent=${r3.rowCount} audit=${r4.rowCount} mail=${r5.rowCount}`
        );
      }
    } catch (err) {
      console.error('[retention] sweep failed:', err.message);
    }
  }
  // First sweep 60s after boot, then every hour.
  setTimeout(sweep, 60_000);
  setInterval(sweep, 60 * 60 * 1000);
}

app.listen(PORT, () => {
  console.log(`[battery-cms] running on http://localhost:${PORT}`);
  autoMigrate()
    .catch((err) => console.error('[migrate] error:', err))
    .finally(() => {
      try { require('./jobs/mail-worker').start(); }
      catch (err) { console.error('[mail-worker] failed to start:', err); }
      try { scheduleRetentionSweep(); }
      catch (err) { console.error('[retention] failed to schedule:', err); }
    });
});
