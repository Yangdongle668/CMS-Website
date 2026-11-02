#!/usr/bin/env node
// Check the scene-matched image catalogue and public HTML references.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const catalogue = require('../public/assets/img/generated/manifest.json');

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(file);
    return entry.name.endsWith('.html') ? [file] : [];
  });
}

async function main() {
  const failures = [];
  const keys = new Set();
  for (const asset of catalogue.assets) {
    if (keys.has(asset.key)) failures.push(`Duplicate image: ${asset.key}`);
    keys.add(asset.key);
    const file = path.join(PUBLIC, asset.url);
    if (!fs.existsSync(file)) { failures.push(`Missing image: ${asset.url}`); continue; }
    const meta = await sharp(file).metadata();
    if (meta.format !== 'webp' || meta.width < 1280 || meta.height < 800) failures.push(`Unexpected image dimensions/format: ${asset.url}`);
    if (fs.statSync(file).size > 600000) failures.push(`Oversized image: ${asset.url}`);
    for (const width of [480, 768, 1280]) {
      const variant = file.replace(/\.webp$/, `-${width}.webp`);
      if (!fs.existsSync(variant)) failures.push(`Missing responsive variant: ${variant}`);
    }
  }
  for (const file of htmlFiles(PUBLIC)) {
    const html = fs.readFileSync(file, 'utf8');
    // The operator explicitly restored this one original homepage image.
    const inspected = file === path.join(PUBLIC, 'index.html')
      ? html.replaceAll('/assets/img/seed/photo-1593642634443-44adaa06623a.jpg', '') : html;
    if (/\/assets\/img\/seed\/photo-|images\.unsplash\.com/.test(inspected)) failures.push(`Legacy stock reference: ${path.relative(ROOT, file)}`);
    for (const match of html.matchAll(/\/assets\/img\/generated\/[a-z0-9-]+\.webp/g)) {
      if (!fs.existsSync(path.join(PUBLIC, match[0]))) failures.push(`Broken image in ${path.relative(ROOT, file)}: ${match[0]}`);
    }
  }
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log(`Verified ${keys.size} scene images, ${keys.size * 3} responsive variants and all public HTML image references.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
