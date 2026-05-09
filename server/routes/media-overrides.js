// Media overrides — let an admin map any external image URL (typically
// Unsplash hot-links left over from the demo seed) to a self-hosted
// /uploads/<file> URL. The HTML token middleware applies these
// replacements to every HTML response, so the page automatically uses
// the new image as soon as the override is saved.
//
// This avoids having to grep through 25 HTML files every time a
// real factory / team / product photo is uploaded.

const path = require('path');
const fs = require('fs');
const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { invalidateSettingsCache } = require('../middleware/html-tokens');

const router = express.Router();
const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');

// Files that contain image URLs we may want to replace. Excludes admin
// (no SEO impact) and _template.html (per-slug detail pages already
// pull cover_url / hero_image from the DB and admin can change those
// fields directly without going through the override map).
function listHtmlFiles(rootDir) {
  const out = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (name.endsWith('.html') && !name.startsWith('_')) out.push(full);
    }
  }
  walk(rootDir);
  return out;
}

// Find every external URL that looks like an image (used in src=,
// background-image:url() or rel="preload" as="image"). De-dupe and
// record which files reference each URL.
function scanExternalImages() {
  const files = listHtmlFiles(PUBLIC_DIR);
  const found = new Map();      // url -> { url, files: Set, count }
  // Match "src='...'", 'src="..."', src=..., background-image:url('...'), background-image:url("..."), background-image:url(...)
  const re = /(?:src|href)\s*=\s*["']([^"']+)["']|background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    const rel = '/' + path.relative(PUBLIC_DIR, f).replace(/\\/g, '/');
    let m;
    while ((m = re.exec(html))) {
      const url = (m[1] || m[2] || '').trim();
      if (!url) continue;
      // Only external HTTP(S) images.
      if (!/^https?:\/\//i.test(url)) continue;
      // Skip non-image extensions and font URLs.
      if (/^https?:\/\/fonts\./i.test(url)) continue;
      if (/\.(css|js|woff2?|ttf|otf)(\?|$)/i.test(url)) continue;
      // Drop URLs with no path/query — those are preconnect/dns-prefetch
      // hints (e.g. <link rel="preconnect" href="https://images.unsplash.com">),
      // not actual image references.
      try {
        const u = new URL(url);
        if ((!u.pathname || u.pathname === '/') && !u.search) continue;
      } catch (_) { continue; }
      // Strict: keep only known image hosts or recognised image extensions
      // somewhere in the URL (Unsplash uses ?w=...&q=... style without
      // an extension in the path, so include it by host as well).
      const looksLikeImage = /\.(png|jpe?g|gif|webp|avif|svg)(\?|$|\/)/i.test(url)
        || /images\.unsplash\.com|cloudfront\.net|imgix\.net|cdn\./i.test(url);
      if (!looksLikeImage) continue;
      if (!found.has(url)) found.set(url, { url, files: new Set(), count: 0 });
      const ent = found.get(url);
      ent.files.add(rel);
      ent.count += 1;
    }
  }
  return Array.from(found.values()).map((e) => ({
    url: e.url,
    files: Array.from(e.files).sort(),
    count: e.count,
  })).sort((a, b) => b.count - a.count);
}

// GET /api/media/overrides — returns the override map + a fresh scan.
router.get('/', requireAuth, async (_req, res) => {
  const row = await one(`SELECT value FROM settings WHERE key = 'media_overrides'`);
  const overrides = row && row.value ? row.value : {};
  let sources = [];
  try { sources = scanExternalImages(); }
  catch (err) { console.error('[media-overrides] scan failed:', err.message); }
  // Augment each source with the current override target if any.
  const augmented = sources.map((s) => ({
    ...s,
    overrideTo: overrides[s.url] || '',
  }));
  res.json({ overrides, sources: augmented });
});

// PUT /api/media/overrides — replaces the entire map.
router.put('/', requireAuth, async (req, res) => {
  const incoming = (req.body && req.body.overrides) || {};
  if (typeof incoming !== 'object' || Array.isArray(incoming)) {
    return res.status(400).json({ error: 'invalid_body' });
  }
  // Clean: drop empty values, trim keys/values, allow only http(s):// or
  // /uploads/... or /assets/... values.
  const clean = {};
  for (const [src, dst] of Object.entries(incoming)) {
    const s = String(src).trim();
    const d = String(dst || '').trim();
    if (!s || !d) continue;
    if (!/^https?:\/\//i.test(s)) continue;
    if (!/^(https?:\/\/|\/uploads\/|\/assets\/|\/)/i.test(d)) continue;
    clean[s] = d;
  }
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('media_overrides', $1, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(clean)]
  );
  await recordAudit({ req, action: 'update', entity: 'settings', entityId: 'media_overrides',
    detail: { count: Object.keys(clean).length } });
  invalidateSettingsCache();
  res.json({ ok: true, count: Object.keys(clean).length });
});

module.exports = router;
