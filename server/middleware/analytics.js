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

let salt = newSalt();
let saltDay = todayUtc();
function newSalt() { return crypto.randomBytes(16).toString('hex'); }
function todayUtc() { return new Date().toISOString().slice(0, 10); }
function rotateSaltIfNewDay() {
  const t = todayUtc();
  if (t !== saltDay) { salt = newSalt(); saltDay = t; }
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

function clientCountry(req) {
  const h = req.headers;
  const v = h['cf-ipcountry'] || h['x-vercel-ip-country'] || h['x-country'] || h['x-ip-country'] || '';
  const code = String(v).trim().toUpperCase().slice(0, 2);
  return /^[A-Z]{2}$/.test(code) && code !== 'XX' && code !== 'T1' ? code : '';
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
  res.on('finish', () => {
    // Only count successful HTML page views. 3xx already redirected;
    // 4xx/5xx aren't real reads.
    const status = res.statusCode;
    if (status < 200 || status >= 400) return;
    const ct = String(res.getHeader('Content-Type') || '');
    if (ct && !ct.includes('text/html')) return;

    const ua = String(req.headers['user-agent'] || '');
    const isBot = BOT_RE.test(ua);
    if (isBot) return; // skip bots from the dashboard entirely

    rotateSaltIfNewDay();
    const ip = clientIp(req);
    const visitorHash = crypto
      .createHash('sha256')
      .update(salt + '|' + ip + '|' + ua)
      .digest('hex')
      .slice(0, 32);
    const { browser, os } = parseUA(ua);
    const country = clientCountry(req);
    const ref = refererHost(req);
    const path = req.path.length > 500 ? req.path.slice(0, 500) : req.path;

    // Async insert. Errors are logged but never block the response.
    const { query } = require('../db/client');
    query(
      `INSERT INTO analytics_hits (path, country, browser, os, referer_host, visitor_hash, ip_text, is_bot)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [path, country, browser, os, ref, visitorHash, ip.slice(0, 45), false]
    ).catch((err) => {
      // Common case during early boot: table doesn't exist yet. The auto-
      // migration in server/index.js will create it. Don't spam the log.
      if (!/relation .*analytics_hits.* does not exist/.test(err.message)) {
        console.warn('[analytics] insert failed:', err.message);
      }
    });
  });
  next();
}

module.exports = { trackerMiddleware };
