#!/usr/bin/env node
// ---------------------------------------------------------------------------
// One-shot script that downloads every images.unsplash.com hot-link
// referenced in our HTML / SQL files, stores each photo locally under
// /public/assets/img/seed/, and rewrites all references to point at the
// self-hosted copy. Idempotent — re-running it skips files that already
// downloaded and re-applies the URL rewrite (cheap regex pass).
//
// Run it on a host with outbound internet access:
//   node scripts/download-unsplash-images.js
//
// Why: we want zero runtime dependency on Unsplash CDN — they can rate-limit,
// rotate photo IDs, or block hot-linking at any time. Hosting the assets
// ourselves makes the site self-contained, faster on first paint, and
// indexable in Google Image Search under our own domain.
//
// Implementation note: uses node:https (not fetch / AbortController) so the
// script runs on Node 12+ — the operator's deploy host doesn't always ship
// the same Node version as the Docker container.
// ---------------------------------------------------------------------------

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const TARGET_DIR = path.join(ROOT, 'public', 'assets', 'img', 'seed');
const LOCAL_PREFIX = '/assets/img/seed';

const SCAN_ROOTS = [
  path.join(ROOT, 'public'),
  path.join(ROOT, 'admin'),
  path.join(ROOT, 'server', 'db'),
];
const ALLOWED_EXT = new Set(['.html', '.htm', '.sql', '.css', '.js']);

const URL_RE = /https?:\/\/images\.unsplash\.com\/(photo-[a-zA-Z0-9_-]+)(\?[^"'\s)>]*)?/g;

function walk(dir, out) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && ALLOWED_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

// Promise-wrapped GET with redirect follow + socket timeout. Returns a Buffer.
function httpsGet(rawUrl, maxRedirects) {
  if (maxRedirects == null) maxRedirects = 5;
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn, v) => { if (!settled) { settled = true; fn(v); } };
    const u = new URL(rawUrl);
    const req = https.get({
      protocol: u.protocol,
      hostname: u.hostname,
      port:     u.port || 443,
      path:     u.pathname + u.search,
      headers: {
        'Accept':     'image/jpeg,image/*;q=0.8',
        'User-Agent': 'ZufekImageMirror/1.0 (+https://zufek.com)',
      },
    }, (resp) => {
      // Follow 3xx redirects (Unsplash hands out 301/302 to its real CDN edge).
      if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
        resp.resume();
        if (maxRedirects <= 0) return done(reject, new Error('too many redirects'));
        const next = new URL(resp.headers.location, rawUrl).toString();
        return httpsGet(next, maxRedirects - 1).then((b) => done(resolve, b), (e) => done(reject, e));
      }
      if (resp.statusCode !== 200) {
        resp.resume();
        return done(reject, new Error('HTTP ' + resp.statusCode));
      }
      const chunks = [];
      resp.on('data', (c) => chunks.push(c));
      resp.on('end',  () => done(resolve, Buffer.concat(chunks)));
      resp.on('error', (e) => done(reject, e));
    });
    req.setTimeout(30_000, () => { req.destroy(new Error('timeout')); });
    req.on('error', (e) => done(reject, e));
  });
}

async function downloadOne(slug) {
  const out = path.join(TARGET_DIR, slug + '.jpg');
  if (fs.existsSync(out) && fs.statSync(out).size > 1024) {
    return { slug, status: 'skip', file: out };
  }
  const url = 'https://images.unsplash.com/' + slug + '?w=1920&q=80&fm=jpg&auto=format&fit=crop';
  try {
    const buf = await httpsGet(url);
    if (!buf || buf.length < 1024) throw new Error('response too small (' + (buf ? buf.length : 0) + ' bytes)');
    fs.writeFileSync(out, buf);
    return { slug, status: 'ok', bytes: buf.length, file: out };
  } catch (err) {
    return { slug, status: 'fail', error: err.message };
  }
}

async function main() {
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  const files = SCAN_ROOTS.reduce((acc, r) => acc.concat(walk(r)), []);
  const slugs = new Set();
  const fileContents = new Map();
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    fileContents.set(f, txt);
    URL_RE.lastIndex = 0;
    let m;
    while ((m = URL_RE.exec(txt))) slugs.add(m[1]);
  }
  console.log('[unsplash] ' + slugs.size + ' unique photo IDs in ' + files.length + ' files');

  const slugArr = Array.from(slugs);
  const CONCURRENCY = 6;
  let cursor = 0, ok = 0, skip = 0, fail = 0;
  async function worker() {
    while (cursor < slugArr.length) {
      const r = await downloadOne(slugArr[cursor++]);
      if (r.status === 'ok')   { ok++;   console.log('  ↓ ' + r.slug + ' (' + (r.bytes / 1024).toFixed(0) + ' KB)'); }
      if (r.status === 'skip') { skip++; }
      if (r.status === 'fail') { fail++; console.warn('  ✗ ' + r.slug + ': ' + r.error); }
    }
  }
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
  await Promise.all(workers);
  console.log('[unsplash] downloaded ' + ok + ', skipped ' + skip + ', failed ' + fail);

  let rewroteFiles = 0, rewroteRefs = 0;
  for (const [f, txt] of fileContents) {
    URL_RE.lastIndex = 0;
    const next = txt.replace(URL_RE, (_full, slug) => {
      rewroteRefs++;
      return LOCAL_PREFIX + '/' + slug + '.jpg';
    });
    if (next !== txt) {
      fs.writeFileSync(f, next);
      rewroteFiles++;
    }
  }
  console.log('[unsplash] rewrote ' + rewroteRefs + ' references across ' + rewroteFiles + ' files');
  console.log('[unsplash] local images served under ' + LOCAL_PREFIX + '/<slug>.jpg');
}

main().catch((err) => { console.error(err); process.exit(1); });
