// =====================================================================
// Image processor — turns one upload into a responsive set of
// (size × format) variants. Pure file-system ops; no DB.
//
// Inputs:  source image path on disk
// Outputs: side-by-side files, e.g.:
//   abc-1280.webp / abc-1280.avif / abc-1280.jpg
//   abc-768.webp  / abc-768.avif  / abc-768.jpg
//   abc-480.webp  / abc-480.avif  / abc-480.jpg
//
// The original is left untouched as the "ultimate fallback" plus the
// largest size matching the original's width.
//
// sharp is a native module (libvips). It is fast — ~50ms per variant for
// a 1920×1080 JPEG on a small VM. Processing happens inline on upload
// because the admin needs the resulting URLs to insert into pages.
// =====================================================================
const path = require('path');
const fs = require('fs/promises');

let sharp = null;
try { sharp = require('sharp'); }
catch (err) { console.warn('[image] sharp not installed; image processing disabled:', err && err.message); }

// Default breakpoints (px). Mirror Tailwind's md/lg/xl + a thumb. For
// hero images the largest variant matches typical desktop hero (1920),
// for content images the medium ones are most used.
const SIZES = [480, 768, 1280, 1920];
const FORMATS = ['avif', 'webp', 'jpeg'];   // jpeg = universal fallback

const SKIP_MIME = new Set(['image/svg+xml', 'image/gif']);

function variantName(base, ext, width, format) {
  const fmtExt = format === 'jpeg' ? 'jpg' : format;
  return `${base}-${width}.${fmtExt}`;
}

// Returns { variants: [...], srcset: { avif, webp, jpeg }, original_width, original_height }
// On any error: returns { variants: [], error: '...' } — never throws,
// so a corrupt upload doesn't break the upload route.
async function process(filePath, opts) {
  if (!sharp) return { variants: [], error: 'sharp_unavailable' };
  opts = opts || {};
  const sizes = opts.sizes || SIZES;
  const formats = opts.formats || FORMATS;

  try {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);

    const meta = await sharp(filePath).metadata();
    if (!meta || !meta.width) return { variants: [], error: 'no_metadata' };

    // Don't upscale: if the source is 800px wide, only emit ≤800
    const targetSizes = sizes.filter((w) => w <= meta.width);
    if (!targetSizes.length) targetSizes.push(meta.width);

    const variants = [];
    for (const w of targetSizes) {
      for (const fmt of formats) {
        const outName = variantName(base, ext, w, fmt);
        const outPath = path.join(dir, outName);
        try {
          let pipeline = sharp(filePath, { failOn: 'none' }).resize({ width: w, withoutEnlargement: true });
          if (fmt === 'avif') pipeline = pipeline.avif({ quality: 55, effort: 4 });
          else if (fmt === 'webp') pipeline = pipeline.webp({ quality: 78 });
          else pipeline = pipeline.jpeg({ quality: 82, progressive: true, mozjpeg: true });

          await pipeline.toFile(outPath);
          const stat = await fs.stat(outPath);
          variants.push({
            width: w,
            format: fmt,
            url: `/uploads/${outName}`,
            size: stat.size,
          });
        } catch (err) {
          // One variant failure shouldn't kill the others (e.g. AVIF can
          // be flaky on tiny images). Log and continue.
          console.warn(`[image] variant ${outName} failed: ${err && err.message}`);
        }
      }
    }

    // Build srcset strings keyed by format for easy <picture> generation
    const srcset = {};
    for (const fmt of formats) {
      const list = variants.filter((v) => v.format === fmt)
        .map((v) => `${v.url} ${v.width}w`)
        .join(', ');
      if (list) srcset[fmt] = list;
    }

    return {
      variants,
      srcset,
      original_width: meta.width,
      original_height: meta.height,
      original_format: meta.format,
    };
  } catch (err) {
    return { variants: [], error: String(err && err.message || err) };
  }
}

// Cleanup: remove all variants of a base file. Called before deleting
// a media row so we don't leave orphans on disk.
async function cleanup(filePath) {
  if (!filePath) return;
  try {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d+\\.(avif|webp|jpg)$`);
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (re.test(f)) {
        try { await fs.unlink(path.join(dir, f)); } catch (_) {}
      }
    }
  } catch (_) {}
}

function shouldProcess(mimeType) {
  if (!sharp) return false;
  if (!mimeType) return false;
  if (!mimeType.startsWith('image/')) return false;
  if (SKIP_MIME.has(mimeType)) return false;
  return true;
}

module.exports = { process, cleanup, shouldProcess, SIZES, FORMATS };
