// Backfill responsive variants for the images shipped under public/assets/img/.
//
// This used to live entirely in scripts/optimize-images.js and ran from the
// Dockerfile, which meant every `./update.sh` re-ran it as part of the image
// build. That was the wrong place for it: it is an operator action on content,
// not a step in compiling the app, and it made a routine code deploy pay for
// re-encoding fifty photographs. It is now something an operator triggers from
// the media library when they have actually added images.
//
// The encoding itself is not here — this is a thin driver over
// image-processor.js, the same pipeline that runs on every media upload. What
// this adds is coverage: the pipeline only ever ran on uploads, so the seed
// photographs and the logo never had a single variant generated for them.
//
// Idempotent by design: a source whose variants already exist is skipped, so
// re-running is cheap and safe. That is what makes it usable as a button.

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const imageProcessor = require('./image-processor');

const ROOT = path.join(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const TARGET_DIR = path.join(PUBLIC_DIR, 'assets', 'img');

const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// A generated variant looks like "<base>-<width>.<ext>". Skipped as a source,
// or a re-run would produce variants of variants.
//
// Matched against the widths the pipeline actually emits rather than any run of
// digits. `-\d+\.` also matches an image an operator happened to name
// `banner-2024.png`, which would then be silently treated as a variant of a
// "banner" that does not exist and never get variants of its own — a file
// quietly missing from every responsive srcset, with nothing to show for it.
const VARIANT_RE = new RegExp(`-(${imageProcessor.SIZES.join('|')})\\.(avif|webp|jpg|png)$`, 'i');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

// The URL the variants are served from: the source's own directory, relative
// to public/, with a trailing slash.
function urlBaseFor(filePath) {
  const rel = path.relative(PUBLIC_DIR, path.dirname(filePath));
  return '/' + rel.split(path.sep).join('/') + '/';
}

async function hasVariants(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, path.extname(filePath));
  const entries = await fsp.readdir(dir);
  const re = new RegExp(
    `^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(${imageProcessor.SIZES.join('|')})\\.(avif|webp|jpg|png)$`
  );
  return entries.some((f) => re.test(f));
}

function listSources() {
  if (!fs.existsSync(TARGET_DIR)) return [];
  return walk(TARGET_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return SOURCE_EXT.has(ext) && !VARIANT_RE.test(path.basename(f));
  });
}

// How much work a run would do, without doing any of it. The admin page shows
// this before asking for a click, so the operator knows whether pressing the
// button will take two seconds or two minutes.
async function survey() {
  const sources = listSources();
  let pending = 0;
  let pendingBytes = 0;
  for (const src of sources) {
    if (await hasVariants(src)) continue;
    pending++;
    try {
      pendingBytes += (await fsp.stat(src)).size;
    } catch (_) { /* counted as zero */ }
  }
  return { total: sources.length, pending, done: sources.length - pending, pendingBytes };
}

// Runs the backfill. `onProgress` is called after each source so a caller can
// stream status; `force` regenerates variants that already exist.
async function run({ force = false, dryRun = false, onProgress = null } = {}) {
  const sources = listSources();
  const result = {
    total: sources.length,
    processed: 0,
    skipped: 0,
    failed: 0,
    sourceBytes: 0,
    variantBytes: 0,
    failures: [],
  };

  for (const src of sources) {
    const rel = path.relative(ROOT, src);
    if (!force && (await hasVariants(src))) {
      result.skipped++;
      if (onProgress) onProgress({ file: rel, status: 'skipped', ...result });
      continue;
    }

    let before = 0;
    try {
      before = (await fsp.stat(src)).size;
    } catch (_) { /* keep zero */ }
    result.sourceBytes += before;

    if (dryRun) {
      result.processed++;
      if (onProgress) onProgress({ file: rel, status: 'would-process', ...result });
      continue;
    }

    let processed;
    try {
      processed = await imageProcessor.process(src, { urlBase: urlBaseFor(src) });
    } catch (err) {
      processed = { error: (err && err.message) || String(err) };
    }

    if (!processed || processed.error || !(processed.variants || []).length) {
      result.failed++;
      result.failures.push({ file: rel, error: (processed && processed.error) || 'no variants produced' });
      if (onProgress) onProgress({ file: rel, status: 'failed', ...result });
      continue;
    }

    // The widest modern variant is what a browser on a large screen actually
    // downloads, so that is the honest number to compare against the original.
    const widest = Math.max(...processed.variants.map((v) => v.width));
    const best = processed.variants
      .filter((v) => v.width === widest && (v.format === 'avif' || v.format === 'webp'))
      .sort((a, b) => a.size - b.size)[0];
    if (best) result.variantBytes += best.size;

    result.processed++;
    if (onProgress) {
      onProgress({
        file: rel,
        status: 'ok',
        width: processed.original_width,
        height: processed.original_height,
        before,
        after: best ? best.size : null,
        variants: processed.variants.length,
        ...result,
      });
    }
  }

  return result;
}

module.exports = { run, survey, listSources, hasVariants, TARGET_DIR };
