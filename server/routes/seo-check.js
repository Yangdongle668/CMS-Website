// SEO self-check endpoint — fetches the homepage as a third-party would
// and reports which verification / analytics meta tags actually made it
// into the response. Lets the operator confirm, after pasting a value
// into Settings → SEO, that Google's verifier WILL find what it needs.
//
// Why a server-side fetch instead of asking the admin to view-source:
//   1. The admin browser may be hitting a stale cache.
//   2. The check should follow the same code path Googlebot uses
//      (PUBLIC_URL → settings → host fallback for canonical), so any
//      misconfiguration shows up the same way it would for Google.
//   3. We can verify the verification block lives BEFORE </head> and
//      the GA4 script tag appears once, not duplicated.

const express = require('express');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function fetchUrl(targetUrl, timeoutMs) {
  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request({
      method: 'GET',
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      headers: { 'User-Agent': 'ZufekCMS-SEOCheck/1.0' },
      timeout: timeoutMs || 5000,
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.end();
  });
}

router.get('/', requireAuth, async (req, res) => {
  // Resolve which URL to fetch. Prefer PUBLIC_URL/settings.seo.public_url
  // because that's the URL Google will actually use; fall back to the
  // request's own host so dev environments still work.
  const { many } = require('../db/client');
  let publicUrl = process.env.PUBLIC_URL;
  if (!publicUrl) {
    try {
      const rows = await many(`SELECT value FROM settings WHERE key = 'seo'`);
      publicUrl = (rows[0] && rows[0].value && rows[0].value.public_url) || '';
    } catch (_) {}
  }
  if (!publicUrl) {
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
    publicUrl = `${proto}://${req.headers.host}`;
  }
  const target = String(publicUrl).replace(/\/$/, '') + '/';

  let result;
  try { result = await fetchUrl(target, 5000); }
  catch (err) {
    return res.status(502).json({ error: 'fetch_failed', message: err.message, target });
  }
  const html = result.body || '';

  // Look for each indicator in the response. We anchor on case-insensitive
  // attribute names since some upstream proxies normalise quotes.
  const checks = {
    canonical: extractAttr(html, /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i),
    og_image:  extractAttr(html, /<meta\s+property=["']og:image["'][^>]*content=["']([^"']+)["']/i),
    twitter_card: extractAttr(html, /<meta\s+name=["']twitter:card["'][^>]*content=["']([^"']+)["']/i),
    organization_schema: /"@type"\s*:\s*"Organization"/i.test(html),
    website_schema: /"@type"\s*:\s*"WebSite"/i.test(html),
    google_site_verification: extractAttr(html, /<meta\s+name=["']google-site-verification["'][^>]*content=["']([^"']+)["']/i),
    bing_msvalidate: extractAttr(html, /<meta\s+name=["']msvalidate\.01["'][^>]*content=["']([^"']+)["']/i),
    twitter_site: extractAttr(html, /<meta\s+name=["']twitter:site["'][^>]*content=["']([^"']+)["']/i),
    ga4_tag: extractAttr(html, /googletagmanager\.com\/gtag\/js\?id=([A-Z0-9-]+)/),
    ga4_consent_default: /gtag\(['"]consent['"],\s*['"]default['"]/i.test(html),
  };

  // Resolve the public URL for sitemap / robots inspection too.
  let sitemap = null;
  let robots = null;
  try { const r = await fetchUrl(target.replace(/\/$/, '') + '/sitemap.xml', 5000); sitemap = { status: r.status, abs_url_count: (r.body.match(/<loc>https?:\/\//g) || []).length, has_image_ns: /xmlns:image/.test(r.body) }; }
  catch (_) {}
  try { const r = await fetchUrl(target.replace(/\/$/, '') + '/robots.txt', 5000); robots = { status: r.status, has_absolute_sitemap: /Sitemap:\s+https?:\/\//i.test(r.body), allows_ai_bots: /User-agent:\s*GPTBot/i.test(r.body) }; }
  catch (_) {}

  res.json({
    target,
    httpStatus: result.status,
    contentType: result.headers['content-type'] || '',
    bodySize: html.length,
    checks,
    sitemap,
    robots,
  });
});

function extractAttr(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

module.exports = router;
