// Image rendering — turns a public image URL into markup that lets the
// browser pick a modern format.
//
// This module does not encode anything. The variants it finds are produced by
// server/services/image-processor.js (on every media upload) and by
// scripts/optimize-images.js (for the images shipped under public/assets/img).
// Until this module existed, nothing read them: the pipeline wrote AVIF and
// WebP at four widths and every page still requested the original JPEG.
//
// Why CSS image-set() and not <picture>: the SSR layer emits no <img> tags at
// all. Every image it renders is a background-image (see backgroundStyle in
// middleware/ssr-detail.js), and image-set() is the only way to offer a
// background in several formats. renderPicture is here for the <img> case,
// which today means the block renderer described in docs/ARCHITECTURE_BLOCKS.md.
//
// Browser support matters here: a browser that does not understand image-set()
// treats the whole declaration as invalid and shows no background at all. So
// every caller gets a plain url() declaration first and the image-set() one
// after it — browsers that understand the second override the first, browsers
// that do not keep the fallback.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const UPLOAD_DIR = path.join(ROOT, 'uploads');

const MIME_BY_EXT = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

// Most efficient first. The original file is always offered last.
const MODERN_ORDER = ['avif', 'webp'];

const VARIANT_RE = /^(.*)-(\d+)\.(avif|webp|jpg|png)$/i;

// Directory listings are cached because this runs on every rendered page.
// Variants only appear when an upload is processed or the optimize script
// runs, so a short TTL plus the explicit invalidate() below is enough.
const DIR_TTL_MS = 60 * 1000;
const dirCache = new Map(); // absolute dir -> { at, entries }

function listDir(absDir) {
  const hit = dirCache.get(absDir);
  const now = Date.now();
  if (hit && now - hit.at < DIR_TTL_MS) return hit.entries;
  let entries = [];
  try {
    entries = fs.readdirSync(absDir);
  } catch (_) {
    entries = [];
  }
  dirCache.set(absDir, { at: now, entries });
  return entries;
}

// Called after an upload, reprocess or delete so the next render sees the
// change without waiting out the TTL.
function invalidate() {
  dirCache.clear();
}

// Maps a public URL to a file on disk, refusing anything that escapes the two
// directories we serve. The URL reaches us from the database, so it is
// operator-controlled rather than trusted.
function resolveOnDisk(publicUrl) {
  if (!publicUrl || typeof publicUrl !== 'string') return null;
  if (/^https?:\/\//i.test(publicUrl)) return null; // remote, nothing to discover
  const clean = publicUrl.split('?')[0].split('#')[0];
  if (!clean.startsWith('/')) return null;

  const base = clean.startsWith('/uploads/') ? UPLOAD_DIR : PUBLIC_DIR;
  const rel = clean.startsWith('/uploads/') ? clean.slice('/uploads/'.length) : clean.slice(1);
  const abs = path.resolve(base, rel);
  if (abs !== base && !abs.startsWith(base + path.sep)) return null;
  return abs;
}

// Discovers the variants sitting next to a source image.
// Returns { byFormat: { avif: [{width, url}], ... }, widths: [...], original }
// with empty collections when the image has never been processed.
function variantsFor(publicUrl) {
  const empty = { byFormat: {}, widths: [], original: publicUrl || '' };
  const abs = resolveOnDisk(publicUrl);
  if (!abs) return empty;

  const dir = path.dirname(abs);
  const ext = path.extname(abs);
  const base = path.basename(abs, ext);
  const urlDir = publicUrl.slice(0, publicUrl.lastIndexOf('/') + 1);

  const byFormat = {};
  const widths = new Set();
  for (const entry of listDir(dir)) {
    const m = VARIANT_RE.exec(entry);
    if (!m || m[1] !== base) continue;
    const width = parseInt(m[2], 10);
    const fmt = m[3].toLowerCase();
    if (!byFormat[fmt]) byFormat[fmt] = [];
    byFormat[fmt].push({ width, url: urlDir + entry });
    widths.add(width);
  }
  for (const list of Object.values(byFormat)) list.sort((a, b) => a.width - b.width);

  return {
    byFormat,
    widths: Array.from(widths).sort((a, b) => a - b),
    original: publicUrl,
  };
}

// Picks the variant at or just above `want`, falling back to the widest.
function pickWidth(list, want) {
  if (!list || !list.length) return null;
  if (!want) return list[list.length - 1];
  return list.find((v) => v.width >= want) || list[list.length - 1];
}

// Every caller drops the result into style="…" in server-rendered HTML, so a
// URL has to be safe twice over: it must not close the url('…') it sits in,
// and it must not close the attribute around that. Percent-encoding the few
// characters that could do either is both — and it is what these characters
// should be in a URL anyway. The previous inline version escaped only the
// single quote, which left a double quote free to end the style attribute.
const UNSAFE_IN_URL = /["'()\\\s\x00-\x1f<>]/g;

function cssUrl(url) {
  return String(url).replace(UNSAFE_IN_URL, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase());
}

function mimeFor(url) {
  const ext = path.extname(String(url).split('?')[0]).slice(1).toLowerCase();
  return MIME_BY_EXT[ext] || '';
}

// The `background-image` declarations for a URL: a plain url() fallback, then
// an image-set() offering AVIF and WebP ahead of the original. Returns just
// the fallback when no variants exist, so callers need no special case.
//
// opts.width — the rendered width to target in CSS pixels. image-set() cannot
// select by layout width (it has no `w` descriptor), so one variant is chosen
// here; hero backgrounds should pass nothing and get the widest.
function backgroundImageSet(publicUrl, opts) {
  if (!publicUrl) return '';
  opts = opts || {};
  const fallback = `background-image:url('${cssUrl(publicUrl)}');`;

  const { byFormat } = variantsFor(publicUrl);
  const candidates = [];
  for (const fmt of MODERN_ORDER) {
    const pick = pickWidth(byFormat[fmt], opts.width);
    if (pick) candidates.push(`url('${cssUrl(pick.url)}') type('${MIME_BY_EXT[fmt]}')`);
  }
  if (!candidates.length) return fallback;

  const originalMime = mimeFor(publicUrl);
  candidates.push(
    originalMime
      ? `url('${cssUrl(publicUrl)}') type('${originalMime}')`
      : `url('${cssUrl(publicUrl)}')`
  );

  // Both declarations, fallback first — see the module header.
  return `${fallback} background-image:image-set(${candidates.join(', ')});`;
}

// A <picture> element for the <img> case. The SSR layer has no <img> tags to
// upgrade today; this exists for the block renderer, which emits its own
// markup. Attributes are the caller's to escape.
function renderPicture(publicUrl, opts) {
  if (!publicUrl) return '';
  opts = opts || {};
  const { byFormat } = variantsFor(publicUrl);
  const attrs = [
    `src="${publicUrl}"`,
    opts.alt != null ? `alt="${opts.alt}"` : 'alt=""',
    opts.width ? `width="${opts.width}"` : '',
    opts.height ? `height="${opts.height}"` : '',
    opts.className ? `class="${opts.className}"` : '',
    opts.loading === false ? '' : `loading="${opts.loading || 'lazy'}"`,
    opts.fetchPriority ? `fetchpriority="${opts.fetchPriority}"` : '',
    'decoding="async"',
  ].filter(Boolean).join(' ');

  const sources = [];
  for (const fmt of MODERN_ORDER) {
    const list = byFormat[fmt];
    if (!list || !list.length) continue;
    const srcset = list.map((v) => `${v.url} ${v.width}w`).join(', ');
    const sizes = opts.sizes ? ` sizes="${opts.sizes}"` : '';
    sources.push(`<source type="${MIME_BY_EXT[fmt]}" srcset="${srcset}"${sizes}>`);
  }
  if (!sources.length) return `<img ${attrs}>`;

  return `<picture>${sources.join('')}<img ${attrs}></picture>`;
}

module.exports = {
  variantsFor,
  backgroundImageSet,
  renderPicture,
  invalidate,
  MODERN_ORDER,
};
