#!/usr/bin/env node
// Backfill responsive variants for the images shipped in public/assets/img/.
//
// This is a thin driver over server/services/image-processor.js — the same
// pipeline that already runs on every media-library upload. Nothing about
// the encoding lives here. The gap it closes is coverage: the pipeline only
// ever ran on uploads, so the 49 seed JPEGs (~16MB) and the 1MB logo have
// never had a single variant generated for them.
//
//   npm run images:optimize            process anything without variants
//   npm run images:optimize -- --force regenerate even if variants exist
//   npm run images:optimize -- --dry   report what would happen, write nothing
//
// Idempotent: a source whose variants are all present is skipped, so this is
// safe to re-run and safe to wire into a deploy.
//
// Variants are written next to their source, which means they are served
// from the same public path — see the urlBase option in image-processor.

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const imageProcessor = require('../server/services/image-processor');

const ROOT = path.join(__dirname, '..');
const TARGET_DIR = path.join(ROOT, 'public', 'assets', 'img');
const PUBLIC_DIR = path.join(ROOT, 'public');

const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// A generated variant looks like "<base>-<width>.<ext>". Skip those as
// sources or a re-run would produce variants of variants.
const VARIANT_RE = /-\d+\.(avif|webp|jpg|png)$/i;

const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force');
const DRY = args.has('--dry') || args.has('--dry-run');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

// The URL the variants will be served from: the source's own directory,
// relative to public/, with a trailing slash.
function urlBaseFor(filePath) {
  const rel = path.relative(PUBLIC_DIR, path.dirname(filePath));
  return '/' + rel.split(path.sep).join('/') + '/';
}

async function hasVariants(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, path.extname(filePath));
  const entries = await fsp.readdir(dir);
  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d+\\.(avif|webp|jpg|png)$`);
  return entries.some((f) => re.test(f));
}

function human(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return bytes + ' B';
}

async function main() {
  if (!fs.existsSync(TARGET_DIR)) {
    console.error(`[images] ${TARGET_DIR} does not exist`);
    process.exit(1);
  }

  const sources = walk(TARGET_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return SOURCE_EXT.has(ext) && !VARIANT_RE.test(path.basename(f));
  });

  console.log(`[images] ${sources.length} source image(s) under ${path.relative(ROOT, TARGET_DIR)}`);
  if (DRY) console.log('[images] dry run — nothing will be written');

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let sourceBytes = 0;
  let smallestSetBytes = 0; // best modern format at the largest width, per source

  for (const src of sources) {
    const rel = path.relative(ROOT, src);
    if (!FORCE && (await hasVariants(src))) {
      skipped++;
      continue;
    }

    const before = (await fsp.stat(src)).size;
    sourceBytes += before;

    if (DRY) {
      console.log(`  would process  ${rel}  (${human(before)})`);
      processed++;
      continue;
    }

    const result = await imageProcessor.process(src, { urlBase: urlBaseFor(src) });
    if (result.error) {
      console.warn(`  FAILED  ${rel}: ${result.error}`);
      failed++;
      continue;
    }
    if (!result.variants.length) {
      console.warn(`  FAILED  ${rel}: no variants produced`);
      failed++;
      continue;
    }

    // Report the widest AVIF against the original — that is what a modern
    // browser on a large screen actually downloads after this change.
    const widest = Math.max(...result.variants.map((v) => v.width));
    const best = result.variants
      .filter((v) => v.width === widest && (v.format === 'avif' || v.format === 'webp'))
      .sort((a, b) => a.size - b.size)[0];
    if (best) smallestSetBytes += best.size;

    const saving = best ? Math.round((1 - best.size / before) * 100) : 0;
    console.log(
      `  ok  ${rel}  ${result.original_width}x${result.original_height}  ` +
      `${human(before)} -> ${best ? human(best.size) : '?'} (${saving}% smaller, ` +
      `${result.variants.length} variants)`
    );
    processed++;
  }

  console.log('');
  console.log(`[images] processed ${processed}, skipped ${skipped} (already had variants), failed ${failed}`);
  if (!DRY && smallestSetBytes && sourceBytes) {
    const pct = Math.round((1 - smallestSetBytes / sourceBytes) * 100);
    console.log(
      `[images] widest modern variant vs original, summed: ` +
      `${human(sourceBytes)} -> ${human(smallestSetBytes)} (${pct}% smaller)`
    );
    console.log('[images] originals are kept as the final fallback');
  }
  if (skipped && !FORCE) {
    console.log('[images] re-run with --force to regenerate the skipped ones');
  }

  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('[images] unexpected failure:', err && err.stack ? err.stack : err);
  process.exit(1);
});
