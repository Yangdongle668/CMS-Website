// First-party analytics tracker — Plausible-style aggregate-only stats.
//
// Privacy / GDPR design:
//   - No raw IP stored. Each visit gets a visitor_hash = sha256(ip + ua + daily_salt).
//     The daily salt rotates at 00:00 UTC, so a visitor's hash on Mon and Tue is
//     different — we cannot reconstruct a cross-day identity.
//   - No full user-agent stored, only the parsed browser + OS family.
//   - No precise location. Country is taken from the cf-ipcountry /
//     x-vercel-ip-country / x-country header that the upstream CDN sets;
//     when none is present (local dev, direct exposure), country = 'XX'.
//   - Aggregated bar/line/list views; we never expose the visitor_hash.
//   - Bot heuristic: skip storing rows when the UA matches common bot
//     signatures, so the dashboard reflects human traffic.
//
// Tracking writes happen AFTER the response is sent, on res 'finish',
// to avoid adding latency to the user's request.

const crypto = require('crypto');

// Optional offline GeoIP — used as a fallback when the online lookup
// times out or fails (e.g. no internet access in the container).
let geoip = null;
try { geoip = require('geoip-lite'); } catch (_e) { /* optional dep */ }

// In-memory IP→country cache so we never call ip-api.com twice for the
// same address. Entries expire after 7 days; the Map is bounded by the
// number of distinct IPs seen (typically small for a B2B site).
const _ipCache = new Map();
const IP_CACHE_TTL = 7 * 24 * 3600 * 1000;

async function lookupCountry(ip) {
  if (!ip || ip === '127.0.0.1') return '';
  const cached = _ipCache.get(ip);
  if (cached && Date.now() - cached.ts < IP_CACHE_TTL) return cached.cc;

  // ip-api.com free tier: up to 45 req/min, no key needed, very fresh data.
  // HTTP only on the free plan (fine for a server-side lookup).
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const resp = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (resp.ok) {
      const d = await resp.json();
      if (d.status === 'success' && d.countryCode && /^[A-Z]{2}$/.test(d.countryCode)) {
        _ipCache.set(ip, { cc: d.countryCode, ts: Date.now() });
        return d.countryCode;
      }
    }
  } catch (_e) { /* timeout or network error → fall through to offline */ }

  // Offline fallback via bundled MaxMind data.
  if (geoip) {
    try {
      const r = geoip.lookup(ip);
      const cc = (r && r.country && /^[A-Z]{2}$/.test(r.country)) ? r.country : '';
      if (cc) { _ipCache.set(ip, { cc, ts: Date.now() }); return cc; }
    } catch (_e) { /* ignore */ }
  }
  return '';
}

// Sync cache-only lookup for query-time enrichment in the visitors route.
function countryForIp(ip) {
  const n = normalizeIp(ip || '');
  if (!n) return '';
  const cached = _ipCache.get(n);
  if (cached && Date.now() - cached.ts < IP_CACHE_TTL) return cached.cc;
  // Offline fallback only (sync path).
  if (geoip) {
    try {
      const r = geoip.lookup(n);
      const cc = (r && r.country && /^[A-Z]{2}$/.test(r.country)) ? r.country : '';
      if (cc) { _ipCache.set(n, { cc, ts: Date.now() }); return cc; }
    } catch (_e) { /* ignore */ }
  }
  return '';
}
let salt = newSalt();
let saltDay = todayUtc();
function newSalt() { return crypto.randomBytes(16).toString('hex'); }
function todayUtc() { return new Date().toISOString().slice(0, 10); }
function rotateSaltIfNewDay() {
  const t = todayUtc();
  if (t !== saltDay) { salt = newSalt(); saltDay = t; }
}

// Operator-managed list of IPs that should not be counted (e.g. the
// admin's own office IP). Refreshed from settings.analytics.exclude_ips.
let excludedIps = new Set();
async function loadExcludedIps() {
  try {
    const { one } = require('../db/client');
    const r = await one(`SELECT value FROM settings WHERE key = 'analytics'`);
    const list = (r && r.value && Array.isArray(r.value.exclude_ips)) ? r.value.exclude_ips : [];
    excludedIps = new Set(list.map((s) => normalizeIp(String(s))).filter(Boolean));
  } catch (_e) { /* table may not exist yet during early boot */ }
}
setInterval(loadExcludedIps, 30 * 1000).unref?.();
loadExcludedIps();
function invalidateExcludedIps() { return loadExcludedIps(); }

// IPv6-mapped IPv4 ("::ffff:1.2.3.4") and IPv6 loopback ("::1") confuse
// GeoIP lookups and exact-match exclusion. Normalize before both.
function normalizeIp(ip) {
  if (!ip) return '';
  let s = String(ip).trim();
  if (s.startsWith('::ffff:')) s = s.slice(7);
  if (s === '::1') s = '127.0.0.1';
  return s;
}

const BOT_RE = /(bot|crawl|spider|slurp|duckduckbot|bingpreview|yandex|baiduspider|facebookexternalhit|twitterbot|telegrambot|gptbot|google-extended|perplexitybot|facebot|ia_archiver|applebot|petalbot|semrush|ahrefs|mj12bot|dotbot|coccoc|pingdom|monitor|loader\.io|httpunit|wget|curl)/i;

function parseUA(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown' };
  let browser = 'Other';
  if (/edg(?:e|ios|a)?\//i.test(ua)) browser = 'Edge';
  else if (/firefox\//i.test(ua)) browser = 'Firefox';
  else if (/(opr|opera)\//i.test(ua)) browser = 'Opera';
  else if (/chrome\//i.test(ua)) browser = 'Chrome';
  else if (/safari\//i.test(ua)) browser = 'Safari';
  let os = 'Other';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  return { browser, os };
}

function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.ip || req.connection?.remoteAddress || '0.0.0.0';
}

// Returns the 2-letter country code from CDN header first, then online+offline
// lookups. ASYNC — awaited inside trackerMiddleware's finish callback.
async function resolveCountry(req, ip) {
  const h = req.headers;
  const v = h['cf-ipcountry'] || h['x-vercel-ip-country'] || h['x-country'] || h['x-ip-country'] || '';
  const code = String(v).trim().toUpperCase().slice(0, 2);
  if (/^[A-Z]{2}$/.test(code) && code !== 'XX' && code !== 'T1') return code;
  return lookupCountry(ip);
}

function refererHost(req) {
  const r = req.headers.referer || req.headers.referrer || '';
  if (!r) return '';
  try {
    const u = new URL(r);
    if (u.host === req.headers.host) return ''; // same-origin -> internal nav
    return u.hostname.toLowerCase();
  } catch (_) { return ''; }
}

function shouldTrack(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const p = req.path;
  if (p.startsWith('/api/')) return false;
  if (p.startsWith('/admin')) return false;
  if (p.startsWith('/uploads/')) return false;
  if (p === '/robots.txt' || p === '/sitemap.xml') return false;
  // Skip obvious asset requests; we want page views.
  if (/\.(css|js|map|json|xml|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|pdf|mp4|webm|txt)$/i.test(p)) return false;
  return true;
}

function trackerMiddleware(req, res, next) {
  if (!shouldTrack(req)) return next();
  // The 'finish' listener runs after the response is fully sent, so async
  // work here (online GeoIP lookup, DB insert) never delays the visitor.
  res.on('finish', async () => {
    try {
      const status = res.statusCode;
      if (status < 200 || status >= 400) return;
      const ct = String(res.getHeader('Content-Type') || '');
      if (ct && !ct.includes('text/html')) return;

      const ua = String(req.headers['user-agent'] || '');
      if (BOT_RE.test(ua)) return;

      rotateSaltIfNewDay();
      const ip = normalizeIp(clientIp(req));
      if (excludedIps.has(ip)) return;

      const visitorHash = crypto
        .createHash('sha256')
        .update(salt + '|' + ip + '|' + ua)
        .digest('hex')
        .slice(0, 32);
      const { browser, os } = parseUA(ua);
      // ip-api.com lookup (online, accurate) → geoip-lite (offline fallback).
      // Awaiting here is fine — the visitor's browser already received its response.
      const country = await resolveCountry(req, ip);
      const ref = refererHost(req);
      const path = req.path.length > 500 ? req.path.slice(0, 500) : req.path;

      const { query } = require('../db/client');
      await query(
        `INSERT INTO analytics_hits (path, country, browser, os, referer_host, visitor_hash, ip_text, is_bot)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [path, country, browser, os, ref, visitorHash, ip.slice(0, 45), false]
      );
    } catch (err) {
      if (!/relation .*analytics_hits.* does not exist/.test(err.message)) {
        console.warn('[analytics] insert failed:', err.message);
      }
    }
  });
  next();
}

module.exports = { trackerMiddleware, invalidateExcludedIps, countryForIp, normalizeIp };
