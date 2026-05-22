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
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET_DIR = path.join(ROOT, 'public', 'assets', 'img', 'seed');
const LOCAL_PREFIX = '/assets/img/seed';

// Files we scan. Globbing without a dep — manual recursive walk below.
const SCAN_ROOTS = [
  path.join(ROOT, 'public'),
  path.join(ROOT, 'admin'),
  path.join(ROOT, 'server', 'db'), // seed.sql + migration .sql files
];
const ALLOWED_EXT = new Set(['.html', '.htm', '.sql', '.css', '.js']);

// Match images.unsplash.com/photo-<id>-<hash>?<query>
const URL_RE = /https?:\/\/images\.unsplash\.com\/(photo-[a-zA-Z0-9_-]+)(\?[^"'\s)>]*)?/g;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && ALLOWED_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

async function downloadOne(photoSlug) {
  const out = path.join(TARGET_DIR, `${photoSlug}.jpg`);
  if (fs.existsSync(out) && fs.statSync(out).size > 1024) {
    return { slug: photoSlug, status: 'skip', file: out };
  }
  // 1920w jpg covers every hero / card use in the site (HTML mostly asks 1000–1920).
  const url = `https://images.unsplash.com/${photoSlug}?w=1920&q=80&fm=jpg&auto=format&fit=crop`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const resp = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'Accept':     'image/jpeg,image/*;q=0.8',
        'User-Agent': 'ZufekImageMirror/1.0 (+https://zufek.com)',
      },
    });
    clearTimeout(timer);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 1024) throw new Error(`response too small (${buf.length} bytes)`);
    fs.writeFileSync(out, buf);
    return { slug: photoSlug, status: 'ok', bytes: buf.length, file: out };
  } catch (err) {
    return { slug: photoSlug, status: 'fail', error: err.message };
  }
}

async function main() {
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  // ----- Step 1: gather every file + every unique unsplash slug -----
  const files = SCAN_ROOTS.flatMap((r) => walk(r));
  const slugs = new Set();
  const fileContents = new Map();
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    fileContents.set(f, txt);
    let m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(txt))) slugs.add(m[1]);
  }
  console.log(`[unsplash] ${slugs.size} unique photo IDs in ${files.length} files`);

  // ----- Step 2: download (concurrency 6) -----
  const slugArr = Array.from(slugs);
  const CONCURRENCY = 6;
  let cursor = 0;
  let ok = 0, skip = 0, fail = 0;
  async function worker() {
    while (cursor < slugArr.length) {
      const idx = cursor++;
      const r = await downloadOne(slugArr[idx]);
      if (r.status === 'ok')   { ok++;   console.log(`  ↓ ${r.slug} (${(r.bytes/1024).toFixed(0)} KB)`); }
      if (r.status === 'skip') { skip++; }
      if (r.status === 'fail') { fail++; console.warn(`  ✗ ${r.slug}: ${r.error}`); }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`[unsplash] downloaded ${ok}, skipped ${skip}, failed ${fail}`);

  // ----- Step 3: rewrite every reference in source files -----
  let rewroteFiles = 0;
  let rewroteRefs  = 0;
  for (const [f, txt] of fileContents) {
    URL_RE.lastIndex = 0;
    let next = txt.replace(URL_RE, (_full, slug) => {
      rewroteRefs++;
      return `${LOCAL_PREFIX}/${slug}.jpg`;
    });
    if (next !== txt) {
      fs.writeFileSync(f, next);
      rewroteFiles++;
    }
  }
  console.log(`[unsplash] rewrote ${rewroteRefs} references across ${rewroteFiles} files`);
  console.log(`[unsplash] local images served under ${LOCAL_PREFIX}/<slug>.jpg`);
}

main().catch((err) => { console.error(err); process.exit(1); });
