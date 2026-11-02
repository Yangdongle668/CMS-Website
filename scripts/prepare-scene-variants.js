#!/usr/bin/env node
// Responsive WebP outputs are gitignored and can be rebuilt from shipped sources.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const catalogue = require('../public/assets/img/generated/manifest.json');
const PUBLIC = path.join(__dirname, '..', 'public');

async function main() {
  let count = 0;
  for (const asset of catalogue.assets) {
    const source = path.join(PUBLIC, asset.url);
    for (const width of [480, 768, 1280]) {
      const output = source.replace(/\.webp$/, `-${width}.webp`);
      if (fs.existsSync(output)) continue;
      await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toFile(output);
      count++;
    }
  }
  console.log(`Prepared ${count} missing responsive scene image(s).`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
