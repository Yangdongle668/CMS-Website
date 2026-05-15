#!/usr/bin/env node
// =====================================================================
// Build script — minify + content-hash the public assets.
//
// Inputs (relative to repo root):
//   public/script.js, public/cms-page.js, public/partials.js
//   public/styles.css, public/assets/css/theme.css
//
// Output:
//   public/dist/<basename>.<sha8>.<ext>     ← minified + hashed
//   public/dist/manifest.json               ← logical name → hashed path
//
// At runtime, server/middleware/html-tokens.js reads the manifest and
// rewrites every `script.js?v=NN` / `styles.css?v=NN` reference in
// served HTML to point at the hashed file. If the manifest is missing
// (build wasn't run, dev environment, etc.) the rewrite is a no-op and
// the original /script.js / /styles.css continue to be served.
//
// Run:
//   npm run build
// =====================================================================
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const crypto = require('crypto');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(PUBLIC, 'dist');

// Source files. Each entry: { in: rel path under public/, name: logical
// label that html-tokens.js will look for }
const TARGETS = [
  { in: 'script.js',           name: 'script.js',          loader: 'js'  },
  { in: 'cms-page.js',         name: 'cms-page.js',        loader: 'js'  },
  { in: 'partials.js',         name: 'partials.js',        loader: 'js'  },
  { in: 'styles.css',          name: 'styles.css',         loader: 'css' },
  { in: 'assets/css/theme.css', name: 'assets/css/theme.css', loader: 'css' },
];

function shortHash(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

async function ensureClean(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function buildOne(target) {
  const inputPath = path.join(PUBLIC, target.in);
  if (!fsSync.existsSync(inputPath)) {
    console.warn(`[build] skip missing source: ${target.in}`);
    return null;
  }

  const result = await esbuild.build({
    entryPoints: [inputPath],
    bundle: false,        // these are hand-written single-file assets, not modules
    minify: true,
    sourcemap: false,
    target: ['es2018', 'chrome80', 'safari13', 'firefox78'],
    write: false,
    loader: { '.js': 'js', '.css': 'css' },
    legalComments: 'none',
  });

  if (!result.outputFiles || !result.outputFiles[0]) return null;
  const out = result.outputFiles[0];
  const hash = shortHash(out.contents);
  const ext = path.extname(target.in);
  const base = path.basename(target.in, ext);
  const subdir = path.dirname(target.in);

  const outRel = subdir === '.'
    ? `${base}.${hash}${ext}`
    : `${subdir}/${base}.${hash}${ext}`;
  const outAbs = path.join(DIST, outRel);
  await fs.mkdir(path.dirname(outAbs), { recursive: true });
  await fs.writeFile(outAbs, out.contents);

  const inputBytes = (await fs.stat(inputPath)).size;
  const outputBytes = out.contents.length;
  const pct = Math.round((1 - outputBytes / inputBytes) * 100);
  console.log(`[build] ${target.in.padEnd(28)} ${inputBytes.toString().padStart(7)} → ${outputBytes.toString().padStart(7)} (-${pct}%)  /dist/${outRel}`);

  return {
    name: target.name,
    src: '/' + target.in,
    dist: '/dist/' + outRel,
    hash,
    bytes_in: inputBytes,
    bytes_out: outputBytes,
  };
}

async function main() {
  console.log(`[build] writing minified assets to ${path.relative(ROOT, DIST)}`);
  await ensureClean(DIST);

  const manifest = {
    built_at: new Date().toISOString(),
    entries: {},
  };
  for (const t of TARGETS) {
    const r = await buildOne(t);
    if (r) manifest.entries[r.name] = r;
  }

  await fs.writeFile(path.join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`[build] manifest written: ${Object.keys(manifest.entries).length} asset(s)`);
}

main().catch((err) => {
  console.error('[build] failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});
