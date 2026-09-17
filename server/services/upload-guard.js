// Upload validation helpers.
//
// Threat being addressed: multer's `file.mimetype` is the Content-Type the
// client put on the multipart part. It is not derived from the bytes, so a
// caller can claim `image/png` and send anything. Combined with an extension
// taken from the client's filename, that let an upload land in /uploads as
// `payload.html` and be served as HTML from the site's own origin.
//
// Three layers, in order of how much they are relied on:
//
//   1. The response headers on /uploads (see server/index.js) — a CSP of
//      `default-src 'none'; sandbox` neutralises script in anything served
//      from there, including an SVG opened directly. This is the layer that
//      has to hold; the two below reduce what ever reaches it.
//   2. Extension derived from the declared type (EXT_BY_MIME), never from
//      the client's filename.
//   3. Magic-byte sniffing of the written file (sniff), so a declared type
//      that the bytes contradict is rejected and the file removed.
//
// sanitizeSvg is defence in depth, not a security boundary: SVG is an XML
// dialect and a regex pass cannot be exhaustive. It strips the obvious
// script vectors so a careless upload is inert even if a future change
// loosens the headers in layer 1.

const fs = require('fs');

// The only types accepted, and the extension each one is stored with.
// Anything not listed here is rejected outright.
const EXT_BY_MIME = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
};

const ALLOWED_MIMES = new Set(Object.keys(EXT_BY_MIME));

// RFQ attachments (server/routes/inquiries.js) accept a wider set — visitors
// send datasheets and drawings — but the same rule applies: the stored
// extension is decided here, not by the uploader's filename.
const ATTACHMENT_EXT_BY_MIME = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'text/plain': '.txt',
  'text/csv': '.csv',
};

const ATTACHMENT_MIMES = new Set(Object.keys(ATTACHMENT_EXT_BY_MIME));

function extensionFor(mime) {
  return EXT_BY_MIME[String(mime || '').toLowerCase()] || null;
}

function attachmentExtensionFor(mime) {
  return ATTACHMENT_EXT_BY_MIME[String(mime || '').toLowerCase()] || null;
}

// Longest signature we compare against, plus room for leading whitespace
// and a BOM when sniffing SVG.
const SNIFF_BYTES = 256;

function startsWith(buf, bytes) {
  if (buf.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buf[i] !== bytes[i]) return false;
  }
  return true;
}

// Returns the mime the bytes actually look like, or null if unrecognised.
function sniff(buf) {
  if (!buf || !buf.length) return null;

  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'; // GIF8(7|9)a
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf'; // %PDF-
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04]) ||
      startsWith(buf, [0x50, 0x4b, 0x05, 0x06]) ||
      startsWith(buf, [0x50, 0x4b, 0x07, 0x08])) {
    // Also what .docx / .xlsx are underneath.
    return 'application/zip';
  }
  // OLE2 compound document — legacy .doc / .xls.
  if (startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return 'application/x-ole-storage';
  }

  // RIFF....WEBP
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && buf.length >= 12 &&
      buf.slice(8, 12).toString('latin1') === 'WEBP') {
    return 'image/webp';
  }

  // SVG is text. Skip a UTF-8 BOM and leading whitespace, then require the
  // document to open as XML or as an <svg> element. Comments and doctypes
  // may precede the root element.
  let text = buf.toString('utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const head = text.replace(/^\s+/, '').slice(0, SNIFF_BYTES).toLowerCase();
  if (head.startsWith('<?xml') || head.startsWith('<svg') || head.startsWith('<!doctype svg')) {
    return 'image/svg+xml';
  }

  return null;
}

// Reads the head of a file on disk and reports what it looks like.
function sniffFile(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(SNIFF_BYTES);
    const read = fs.readSync(fd, buf, 0, SNIFF_BYTES, 0);
    return sniff(buf.subarray(0, read));
  } catch (err) {
    return null;
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch { /* already gone */ }
    }
  }
}

// True when the bytes are consistent with the declared type. JPEG is the one
// place we accept a mismatch in both directions, because some clients label
// JPEG as image/pjpeg and the signature is unambiguous either way.
function matchesDeclared(detected, declared) {
  if (!detected) return false;
  if (detected === declared) return true;
  if (declared === 'image/pjpeg' && detected === 'image/jpeg') return true;
  return false;
}

// Attachment types whose bytes carry no signature worth checking. Their
// extension is still forced from the declared type and the CSP on /uploads
// keeps them inert, so the byte check is skipped rather than failed.
const UNSNIFFABLE_ATTACHMENTS = new Set(['text/plain', 'text/csv']);

// The signature family each attachment type should present as.
const ATTACHMENT_SIGNATURE = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'application/zip',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'application/zip',
  'application/x-zip-compressed': 'application/zip',
  'application/msword': 'application/x-ole-storage',
  'application/vnd.ms-excel': 'application/x-ole-storage',
};

// Like matchesDeclared but for the RFQ attachment set, where several types
// share one container format and a couple have no signature at all.
function attachmentMatchesDeclared(detected, declared) {
  const mime = String(declared || '').toLowerCase();
  if (UNSNIFFABLE_ATTACHMENTS.has(mime)) return true;
  const expected = ATTACHMENT_SIGNATURE[mime] || mime;
  if (detected === expected) return true;
  if (mime === 'image/pjpeg' && detected === 'image/jpeg') return true;
  // Older Office files are sometimes sent with the modern OOXML type and
  // vice versa; both containers are acceptable for any Office type.
  if (ATTACHMENT_SIGNATURE[mime] &&
      (detected === 'application/zip' || detected === 'application/x-ole-storage')) {
    return true;
  }
  return false;
}

// Schemes that execute, or that carry a document able to execute, once the
// value has been entity-decoded and stripped of ignorable whitespace.
const DANGEROUS_SCHEME = /^(javascript|vbscript|livescript|mocha|data:text\/html|data:image\/svg)/;

const NAMED_ENTITIES = {
  tab: '\t', newline: '\n', colon: ':', semi: ';', lt: '<', gt: '>',
  amp: '&', quot: '"', apos: "'", sol: '/', nbsp: ' ',
};

// Resolves the entity forms an XML parser would, so a scheme check sees what
// the browser would see rather than the source text.
function decodeEntities(value) {
  return String(value)
    .replace(/&#x([0-9a-f]+);?/gi, (m, hex) => codePoint(parseInt(hex, 16), m))
    .replace(/&#(\d+);?/g, (m, dec) => codePoint(parseInt(dec, 10), m))
    .replace(/&([a-z]+);?/gi, (m, name) => {
      const hit = NAMED_ENTITIES[name.toLowerCase()];
      return hit === undefined ? m : hit;
    });
}

function codePoint(n, fallback) {
  if (!Number.isFinite(n) || n < 0 || n > 0x10ffff) return fallback;
  try {
    return String.fromCodePoint(n);
  } catch {
    return fallback;
  }
}

// Conservative SVG scrub. See the module header: this is defence in depth,
// the CSP on /uploads is the boundary.
function sanitizeSvg(source) {
  let out = String(source == null ? '' : source);

  // Elements that can execute or embed arbitrary content.
  for (const tag of ['script', 'foreignObject', 'iframe', 'embed', 'object', 'audio', 'video']) {
    // Paired form, including an unterminated trailing one.
    out = out.replace(new RegExp(`<${tag}\\b[\\s\\S]*?(?:</${tag}\\s*>|$)`, 'gi'), '');
    // Self-closing / void form.
    out = out.replace(new RegExp(`<${tag}\\b[^>]*/?>`, 'gi'), '');
  }

  // Inline event handlers: onload=, onclick=, onmouseover= …
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');

  // Script-bearing URLs in any attribute that takes one. Matching the literal
  // text is a losing game — `j&#97;vascript:` and `java&Tab;script:` both
  // survive a textual filter — so decode entities and strip the whitespace
  // the parser ignores, then judge the resulting scheme and drop the whole
  // attribute if it is one that executes.
  out = out.replace(
    /((?:xlink:)?href|src|from|to|values|begin)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    (match, _attr, rawValue) => {
      const value = rawValue.replace(/^(["'])([\s\S]*)\1$/, '$2');
      const scheme = decodeEntities(value).replace(/[\s -]+/g, '').toLowerCase();
      return DANGEROUS_SCHEME.test(scheme) ? '' : match;
    }
  );

  // <use> pointing outside the document can pull in remote markup.
  out = out.replace(/<use\b[^>]*(?:xlink:)?href\s*=\s*["']?\s*(?:https?:)?\/\/[^>]*>/gi, '');

  // SMIL animation can assign to an event-handler attribute at runtime.
  out = out.replace(
    /<(set|animate)\b[^>]*attributeName\s*=\s*["']?\s*on[a-z]+[^>]*>/gi,
    ''
  );

  return out;
}

module.exports = {
  EXT_BY_MIME,
  ALLOWED_MIMES,
  ATTACHMENT_EXT_BY_MIME,
  ATTACHMENT_MIMES,
  extensionFor,
  attachmentExtensionFor,
  sniff,
  sniffFile,
  matchesDeclared,
  attachmentMatchesDeclared,
  sanitizeSvg,
};
