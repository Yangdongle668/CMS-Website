// Shared SEO field definitions for the 5 content tables
// (pages, pillar_pages, products, applications, articles).
//
// Each table now carries the same set of RankMath-style per-entity SEO
// columns (added by the 2026 Q2 migration). This module is the single
// source of truth for the column names and how to (a) embed them in
// SELECT clauses, (b) extract them from a request body, (c) build the
// VALUES placeholders for INSERT, and (d) build the SET clause for
// UPDATE — so each route only references the column list once.

const { trimStr, asJson } = require('./validate');

const SEO_FIELDS = [
  'focus_keyword',
  'secondary_keywords',
  'canonical_override',
  'robots',
  'og_title',
  'og_description',
  'og_image_url',
  'twitter_title',
  'twitter_description',
  'twitter_image_url',
  'schema_type',
  'schema_extra',
  'seo_score',
  'seo_checks',
];

// Comma-separated list ready to drop into a SELECT statement.
const SEO_SELECT = SEO_FIELDS.join(', ');

// Sanitise the SEO subset of a request body into the value tuple that
// matches the order in SEO_FIELDS. Strings are length-clamped; JSONB
// fields are JSON-stringified; numerics are clamped to 0-100.
function extractSeoValues(b) {
  return [
    trimStr(b.focus_keyword, 190),
    JSON.stringify(asJson(b.secondary_keywords, [])),
    trimStr(b.canonical_override, 500),
    trimStr(b.robots, 80),
    trimStr(b.og_title, 255),
    trimStr(b.og_description, 1000),
    trimStr(b.og_image_url, 500),
    trimStr(b.twitter_title, 255),
    trimStr(b.twitter_description, 1000),
    trimStr(b.twitter_image_url, 500),
    trimStr(b.schema_type, 80),
    JSON.stringify(asJson(b.schema_extra, {})),
    Math.max(0, Math.min(100, parseInt(b.seo_score, 10) || 0)),
    JSON.stringify(asJson(b.seo_checks, [])),
  ];
}

// Build "$N, $N+1, ..." placeholders for INSERT VALUES, starting at
// the given offset (so it slots after the entity-specific columns).
function seoValuesPlaceholders(startIndex) {
  return SEO_FIELDS.map((_, i) => '$' + (startIndex + i)).join(', ');
}

// Build "col1=$N, col2=$N+1, ..." for an UPDATE SET, starting at the
// given offset.
function seoSetClause(startIndex) {
  return SEO_FIELDS.map((c, i) => `${c}=$${startIndex + i}`).join(', ');
}

module.exports = {
  SEO_FIELDS,
  SEO_SELECT,
  extractSeoValues,
  seoValuesPlaceholders,
  seoSetClause,
};
