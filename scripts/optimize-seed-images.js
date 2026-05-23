#!/usr/bin/env node
// One-time (idempotent) script: compress every seed JPEG to:
//   1. WebP  — max 1280px wide, quality 75  (for <picture> source)
//   2. JPEG  — max 1280px wide, quality 80, progressive (overwrite original)
//
// Run: node scripts/optimize-seed-images.js
// Safe to re-run: already-compressed files are re-processed but Sharp is
// fast enough (~50ms/file) that it doesn't matter for a one-off run.
// WebP files written to same directory as the JPEG (foo.jpg → foo.webp).

const path = require('path');
const fs = require('fs');

let sharp;
try { sharp = require('sharp'); }
catch (e) {
  console.error('sharp not installed. Run: npm install sharp');
  process.exit(1);
}

const SEED_DIR = path.resolve(__dirname, '..', 'public', 'assets', 'img', 'seed');
const MAX_WIDTH = 1280;
const WEBP_QUALITY = 75;
const JPEG_QUALITY = 80;

async function processOne(jpgPath) {
  const base = path.basename(jpgPath, '.jpg');
  const dir  = path.dirname(jpgPath);
  const webpPath = path.join(dir, base + '.webp');

  try {
    const meta = await sharp(jpgPath).metadata();
    const targetWidth = Math.min(meta.width || MAX_WIDTH, MAX_WIDTH);

    // 1. WebP
    await sharp(jpgPath, { failOn: 'none' })
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(webpPath);

    // 2. Overwrite JPEG with compressed version
    const tmp = jpgPath + '.tmp';
    await sharp(jpgPath, { failOn: 'none' })
      .resize({ width: targetWidth, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true })
      .toFile(tmp);
    fs.renameSync(tmp, jpgPath);

    const origStat = fs.statSync(jpgPath);
    const webpStat = fs.statSync(webpPath);
    console.log(
      `  ✓ ${base.slice(0, 30).padEnd(30)} `
      + `JPEG ${(origStat.size / 1024).toFixed(0).padStart(4)} KB  `
      + `WebP ${(webpStat.size / 1024).toFixed(0).padStart(4)} KB`
    );
  } catch (err) {
    console.error(`  ✗ ${base}: ${err.message}`);
  }
}

async function main() {
  const files = fs.readdirSync(SEED_DIR)
    .filter(f => f.endsWith('.jpg'))
    .map(f => path.join(SEED_DIR, f));

  console.log(`Optimizing ${files.length} seed images in ${SEED_DIR}\n`);
  const before = files.reduce((s, f) => s + fs.statSync(f).size, 0);

  for (const f of files) {
    await processOne(f);
  }

  const afterFiles = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.jpg')).map(f => path.join(SEED_DIR, f));
  const after = afterFiles.reduce((s, f) => s + fs.statSync(f).size, 0);
  const webpFiles = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.webp')).map(f => path.join(SEED_DIR, f));
  const webpTotal = webpFiles.reduce((s, f) => s + fs.statSync(f).size, 0);

  console.log('\n─────────────────────────────────────────────');
  console.log(`JPEG total:  ${(before / 1024 / 1024).toFixed(2)} MB  →  ${(after / 1024 / 1024).toFixed(2)} MB  (saved ${((1 - after / before) * 100).toFixed(0)}%)`);
  console.log(`WebP total:  ${(webpTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Combined:    ${((after + webpTotal) / 1024 / 1024).toFixed(2)} MB total on disk`);
}

main().catch(err => { console.error(err); process.exit(1); });
