#!/usr/bin/env node
// CLI for the image backfill. The work lives in
// server/services/image-backfill.js so that this and the admin button in the
// media library run exactly the same code.
//
//   npm run images:optimize            process anything without variants
//   npm run images:optimize -- --force regenerate even if variants exist
//   npm run images:optimize -- --dry   report what would happen, write nothing
//
// This is deliberately NOT part of the Docker build any more. Re-encoding the
// shipped photographs is an operator action on content, not a step in
// compiling the app, and having it in the builder stage meant every code
// deploy paid for it. Variants live on a bind-mounted directory, so they
// survive rebuilds and only need regenerating when images actually change.

const backfill = require('../server/services/image-backfill');

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const dryRun = args.has('--dry') || args.has('--dry-run');

function human(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return bytes + ' B';
}

(async () => {
  const { total, pending } = await backfill.survey();
  if (!total) {
    console.error('[images] no source images found under public/assets/img');
    process.exit(1);
  }
  console.log(`[images] ${total} source image(s), ${pending} without variants`);
  if (dryRun) console.log('[images] dry run — nothing will be written');

  const result = await backfill.run({
    force,
    dryRun,
    onProgress: (p) => {
      if (p.status === 'ok') {
        const saving = p.after ? Math.round((1 - p.after / p.before) * 100) : 0;
        console.log(
          `  ok  ${p.file}  ${p.width}x${p.height}  ` +
          `${human(p.before)} -> ${p.after ? human(p.after) : '?'} (${saving}% smaller, ${p.variants} variants)`
        );
      } else if (p.status === 'failed') {
        console.warn(`  FAILED  ${p.file}`);
      } else if (p.status === 'would-process') {
        console.log(`  would process  ${p.file}`);
      }
    },
  });

  console.log('');
  console.log(
    `[images] processed ${result.processed}, skipped ${result.skipped} ` +
    `(already had variants), failed ${result.failed}`
  );
  for (const f of result.failures) console.warn(`  ${f.file}: ${f.error}`);
  if (!dryRun && result.variantBytes && result.sourceBytes) {
    const pct = Math.round((1 - result.variantBytes / result.sourceBytes) * 100);
    console.log(
      `[images] widest modern variant vs original, summed: ` +
      `${human(result.sourceBytes)} -> ${human(result.variantBytes)} (${pct}% smaller)`
    );
    console.log('[images] originals are kept as the final fallback');
  }
  if (result.skipped && !force) {
    console.log('[images] re-run with --force to regenerate the skipped ones');
  }
  process.exit(result.failed ? 1 : 0);
})().catch((err) => {
  console.error('[images] unexpected failure:', (err && err.stack) || err);
  process.exit(1);
});
