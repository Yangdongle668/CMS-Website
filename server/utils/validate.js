const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function isEmail(v) {
  return typeof v === 'string' && v.length <= 190 && EMAIL_RE.test(v);
}

function isSlug(v) {
  return typeof v === 'string' && v.length <= 190 && SLUG_RE.test(v);
}

function trimStr(v, max = 255) {
  if (v == null) return '';
  return String(v).trim().slice(0, max);
}

function clamp(n, min, max, def = min) {
  const x = parseInt(n, 10);
  if (Number.isNaN(x)) return def;
  return Math.max(min, Math.min(max, x));
}

function asBool(v) {
  return v === true || v === 'true' || v === 1 || v === '1' || v === 'on';
}

function asJson(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch (_) {
    return fallback;
  }
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { isEmail, isSlug, trimStr, clamp, asBool, asJson, escapeHtml };
