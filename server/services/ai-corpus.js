// What the site already contains, assembled for the article generator.
//
// The original five prompt templates asked the operator to type the
// topic, the audience, the keyword and the word count. That does not
// scale to a hundred, and every field typed by hand is a field that can
// contradict what is actually on the site — a "related article" that
// does not exist, a pillar named something it is not.
//
// So nothing is typed. This module reads the live tables and hands the
// generator four things:
//
//   pillars      the real topic hubs, with their URLs, so an article can
//                be bound to one and link to it
//   siblings     the published articles already in that hub, by title and
//                real slug, as internal-link targets
//   covered      every existing title and focus keyword, so the model can
//                be told what NOT to write again
//   taxonomy     category and author rows, so a draft lands with a real
//                category_id and author_id instead of nulls
//
// Everything here is read-only and cached briefly: a generation run may
// make several calls, and the corpus does not change between them.

const { many } = require('../db/client');

const TTL_MS = 60 * 1000;
let cache = null;
let cachedAt = 0;

function invalidate() { cache = null; cachedAt = 0; }

/**
 * Snapshot of the publishable corpus. Shape:
 *   { pillars:[{id,slug,name,short_name,url}],
 *     categories:[{id,slug,name}],
 *     authors:[{id,slug,name,job_title}],
 *     articles:[{id,slug,title,excerpt,focus_keyword,pillar_id,category_id}] }
 */
const QUERIES = {
  pillars: `SELECT id, slug, name, short_name FROM pillar_pages
             WHERE status='published' ORDER BY sort_order, id`,
  categories: `SELECT id, slug, name FROM categories ORDER BY id`,
  authors: `SELECT id, slug, name, job_title FROM authors
             WHERE is_active ORDER BY id`,
  articles: `SELECT id, slug, title, excerpt, focus_keyword, pillar_id, category_id
               FROM articles WHERE status='published'
              ORDER BY published_at DESC NULLS LAST, id DESC`,
};

async function loadCorpus() {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;

  // Each query settles on its own. A single Promise.all here used to
  // mean that one failing query — an SEO column added by a migration
  // that had not run yet, say — returned an entirely empty corpus, and
  // the generator went on to build a prompt with no pillar, no link
  // pool and no avoid list. It produced an article, so nothing looked
  // broken; it was just quietly the wrong article. Partial context is
  // worth keeping, silence is not.
  const names = Object.keys(QUERIES);
  const settled = await Promise.allSettled(names.map((n) => many(QUERIES[n])));

  const out = { pillars: [], categories: [], authors: [], articles: [] };
  const errors = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') out[names[i]] = r.value;
    else errors.push(`${names[i]}: ${r.reason && r.reason.message}`);
  });

  if (errors.length) {
    console.error('[ai-corpus] degraded context —', errors.join('; '));
  }
  out.errors = errors;
  out.pillars = out.pillars.map((p) => ({ ...p, url: `/products/${p.slug}` }));

  // Only cache a clean read. A degraded one should be retried on the
  // next call rather than pinned for the whole TTL.
  if (!errors.length) { cache = out; cachedAt = Date.now(); }
  return out;
}

// Normalise a title or keyword for comparison: lowercase, punctuation
// stripped, common filler words dropped. "UN 38.3 & IEC 62133: What
// OEMs Need to Know" and "what oems need to know about un 38.3 and iec
// 62133" reduce to nearly the same bag of words, which is the point.
const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'for', 'to', 'in', 'on', 'at', 'is',
  'are', 'what', 'why', 'how', 'when', 'which', 'with', 'from', 'your',
  'you', 'it', 'its', 'that', 'this', 'vs', 'versus', 'guide', 'battery',
  'batteries', 'lithium', 'cell', 'cells',
]);

function topicTokens(s) {
  return new Set(
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s.-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP.has(w))
  );
}

// Jaccard overlap of two token sets, 0..1.
function tokenOverlap(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / (a.size + b.size - shared);
}

/**
 * Is this angle already covered by a published article?
 * Compares against both titles and focus keywords, because an article
 * may rank for a keyword its title does not contain.
 *
 * @returns {{covered:boolean, score:number, match:object|null}}
 */
function findOverlap(angle, corpus, threshold = 0.6) {
  const want = topicTokens(angle);
  let best = { covered: false, score: 0, match: null };
  for (const a of corpus.articles) {
    const score = Math.max(
      tokenOverlap(want, topicTokens(a.title)),
      tokenOverlap(want, topicTokens(a.focus_keyword))
    );
    if (score > best.score) best = { covered: score >= threshold, score, match: a };
  }
  return best;
}

/**
 * Internal-link targets for an article being written into `pillarId`.
 * Returns the pillar itself plus up to `limit` sibling articles. These
 * are real rows, so a link built from them cannot 404 — which is the
 * whole reason the model is handed a list instead of being asked to
 * invent related reading.
 */
function linkTargets(corpus, pillarId, limit = 8) {
  const pillar = corpus.pillars.find((p) => p.id === pillarId) || null;
  const inPillar = corpus.articles.filter((a) => a.pillar_id === pillarId);
  // Fall back to the most recent articles when the pillar is thin or the
  // piece is cross-pillar: an article with no neighbours to link is the
  // link-island problem again, one layer up.
  const pool = inPillar.length >= 3 ? inPillar : corpus.articles;
  return {
    pillar,
    articles: pool.slice(0, limit).map((a) => ({
      slug: a.slug, title: a.title, url: `/blog/${a.slug}`,
    })),
  };
}

// The set of slugs a generated link is allowed to point at.
function validSlugs(corpus) {
  return {
    articles: new Set(corpus.articles.map((a) => a.slug)),
    pillars: new Set(corpus.pillars.map((p) => p.slug)),
  };
}

module.exports = {
  loadCorpus, invalidate, linkTargets, findOverlap, validSlugs,
  topicTokens, tokenOverlap,
};
