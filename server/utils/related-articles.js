// Related-article resolution, shared by the JSON API (routes/articles.js)
// and the SSR renderer (middleware/ssr-detail.js).
//
// Both call sites used to run their own copy of this:
//
//   if (article.pillar_id) { SELECT ... WHERE pillar_id = $1 ... }
//
// Two things were wrong with it. The gate meant an article with no
// pillar got an empty list and rendered with no outbound editorial
// links at all — and the seed deliberately leaves the compliance and
// shipping cluster cross-pillar, so five published articles were link
// islands by design rather than by accident. And the query ignored
// category_id and author_id, which those same articles do have, so
// even the obvious neighbours went unlinked.
//
// The replacement ranks every other published article into tiers and
// takes the best `limit` of them. Tier 4 matches unconditionally, so
// the list is only ever short when the site genuinely has fewer than
// `limit` other published articles.
//
//   1  same pillar    — the topic cluster, strongest signal
//   2  same category  — the editorial grouping
//   3  same author    — a named expert's other work (E-E-A-T)
//   4  anything else  — most recent, so the slot is never wasted
//
// Ordering inside a tier is newest-first with `id` as the tiebreaker,
// so the result is stable across calls and two articles published in
// the same second do not swap places between the SSR render and the
// client-side hydration.

const RELATED_FIELDS = `
  a.id, a.slug, a.title, a.excerpt, a.cover_url, a.reading_minutes,
  a.published_at, c.name AS category_name, p.short_name AS pillar_short_name
`;

// Keep in step with the sidebar, which shows at most four.
const DEFAULT_LIMIT = 4;

/**
 * @param {Function} many  db client's `many` (sql, params) => rows
 * @param {object} article the article being rendered; needs id and,
 *                         where set, pillar_id / category_id / author_id
 * @param {number} limit   how many to return
 * @returns {Promise<Array>} ranked neighbours, possibly empty only when
 *                           this is the site's sole published article
 */
async function findRelated(many, article, limit = DEFAULT_LIMIT) {
  if (!article || !article.id) return [];
  const n = Math.max(1, Math.min(12, parseInt(limit, 10) || DEFAULT_LIMIT));

  // The ::int casts matter: a NULL parameter has no type of its own, and
  // without them Postgres cannot resolve the `=` operator in the CASE.
  const rows = await many(
    `SELECT ${RELATED_FIELDS},
            CASE
              WHEN $2::int IS NOT NULL AND a.pillar_id   = $2::int THEN 1
              WHEN $3::int IS NOT NULL AND a.category_id = $3::int THEN 2
              WHEN $4::int IS NOT NULL AND a.author_id   = $4::int THEN 3
              ELSE 4
            END AS relation_tier
       FROM articles a
       LEFT JOIN categories c   ON c.id = a.category_id
       LEFT JOIN pillar_pages p ON p.id = a.pillar_id
      WHERE a.id <> $1::int
        AND a.status = 'published'
      ORDER BY relation_tier ASC, a.published_at DESC NULLS LAST, a.id DESC
      LIMIT $5::int`,
    [article.id, article.pillar_id || null, article.category_id || null, article.author_id || null, n]
  );
  return rows;
}

module.exports = { findRelated, RELATED_FIELDS, DEFAULT_LIMIT };
