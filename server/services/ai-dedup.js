// Duplicate-content and link checks for generated articles.
//
// Two different problems get called 查重, and they need different
// answers:
//
//   1. The article repeats one already on the site. Publishing it
//      splits the two pages' ranking signals and neither wins. Caught
//      by shingle similarity against the live corpus, before the draft
//      is offered and again after it is written.
//
//   2. The article reads as machine-produced. Handled mostly upstream —
//      rotating shapes and openers in ai-shapes, so a hundred articles
//      do not share one skeleton — plus the existing /detect and
//      /humanize endpoints. What this module adds is a check for the
//      phrasing tells that survive a good system prompt anyway.
//
// Shingling rather than embeddings on purpose: it needs no API call, no
// key, and no network. A generation run already depends on one external
// provider; making the safety check depend on a second one means the
// check is the first thing to fail open.

const SHINGLE = 5;   // words per shingle — long enough that common
                     // technical phrasing ("state of charge", "cycle
                     // life at 80% DoD") does not register as copying

function textOf(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shingles(text, n = SHINGLE) {
  const words = text.split(' ').filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(' '));
  return out;
}

/**
 * Containment rather than plain Jaccard: asks "how much of the NEW text
 * already exists in the old one", which is the question that matters.
 * Jaccard would score a 400-word duplicate inside a 3000-word article
 * as low similarity simply because the lengths differ.
 * @returns {number} 0..1
 */
function containment(candidateText, existingText) {
  const a = shingles(candidateText);
  if (!a.size) return 0;
  const b = shingles(existingText);
  if (!b.size) return 0;
  let shared = 0;
  for (const s of a) if (b.has(s)) shared++;
  return shared / a.size;
}

// Above this, treat the draft as a duplicate and refuse it.
const REJECT_AT = 0.28;
// Above this, let it through but say so, so an operator reviews it.
const WARN_AT = 0.16;

/**
 * Compare a generated body against every published article.
 * `existing` is [{slug,title,content}].
 * @returns {{verdict:'ok'|'review'|'duplicate', score:number, nearest:object|null}}
 */
function checkAgainstCorpus(html, existing) {
  const candidate = textOf(html);
  let best = { score: 0, nearest: null };
  for (const row of existing || []) {
    const score = containment(candidate, textOf(row.content));
    if (score > best.score) best = { score, nearest: { slug: row.slug, title: row.title } };
  }
  const verdict = best.score >= REJECT_AT ? 'duplicate'
    : best.score >= WARN_AT ? 'review' : 'ok';
  return { verdict, score: Number(best.score.toFixed(4)), nearest: best.nearest };
}

// Phrasing that survives a style instruction and still reads as
// generated. Not a detector — a lint. Each hit is cheap to fix and the
// list is short on purpose: flagging ordinary English as suspicious
// trains an operator to ignore the warning.
const TELLS = [
  /\bin today'?s (?:rapidly )?(?:evolving|changing|fast-paced)\b/i,
  /\bin the (?:rapidly )?evolving (?:world|landscape|field)\b/i,
  /\bit(?:'s| is) (?:important|crucial|essential|worth noting) to note\b/i,
  /\bwhen it comes to\b/i,
  /\bplays? a (?:crucial|vital|key|pivotal) role\b/i,
  /\bin conclusion\b/i,
  /\bfurthermore\b/i,
  /\bmoreover\b/i,
  /\bdelve into\b/i,
  /\bnavigating the (?:complex|complexities)\b/i,
  /\bunlock(?:ing)? the (?:potential|power)\b/i,
  /\bever-(?:increasing|growing|evolving)\b/i,
  /\ba testament to\b/i,
  /\bat the end of the day\b/i,
  /\bcutting-edge\b/i,
  /\bgame-?changer\b/i,
  /\brevolutioni[sz](?:e|ing)\b/i,
  /\bseamless(?:ly)?\b/i,
  /\bharness(?:ing)? the power\b/i,
  /\bthe world of\b/i,
];

/**
 * Structural and phrasing lint. Returns the specific problems rather
 * than a score, because a score tells an operator nothing they can act
 * on.
 */
function styleWarnings(html) {
  const text = String(html || '');
  const warnings = [];

  for (const re of TELLS) {
    const m = text.match(re);
    if (m) warnings.push(`stock phrase: "${m[0]}"`);
  }

  // Uniform paragraph length is the structural tell that survives every
  // vocabulary instruction. Real writing varies; generated prose tends
  // towards a steady 40-60 words per paragraph.
  const paras = [...text.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => textOf(m[1]).split(' ').filter(Boolean).length)
    .filter((n) => n > 5);
  if (paras.length >= 5) {
    const mean = paras.reduce((a, b) => a + b, 0) / paras.length;
    const sd = Math.sqrt(paras.reduce((a, b) => a + (b - mean) ** 2, 0) / paras.length);
    if (mean > 0 && sd / mean < 0.28) {
      warnings.push(`paragraph lengths are unusually uniform (mean ${mean.toFixed(0)} words, sd ${sd.toFixed(0)})`);
    }
  }

  const emDashes = (text.match(/—/g) || []).length;
  if (emDashes > 12) warnings.push(`${emDashes} em-dashes — overused`);

  return warnings;
}

/**
 * Rewrite internal links so only real destinations ship.
 *
 * Models invent plausible slugs. An invented /blog/ link is a 404 in the
 * article body, which is worse than no link: it is a broken internal
 * link the crawler finds and the author does not. Anything that does not
 * resolve is unwrapped to its own text, keeping the sentence intact.
 *
 * @param {string} html
 * @param {{articles:Set<string>, pillars:Set<string>}} valid
 * @returns {{html:string, kept:string[], dropped:string[]}}
 */
function sanitiseLinks(html, valid) {
  const kept = [];
  const dropped = [];
  const out = String(html || '').replace(
    /<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi,
    (whole, pre, href, post, inner) => {
      if (/^https?:\/\//i.test(href)) { kept.push(href); return whole; }
      if (!href.startsWith('/')) { dropped.push(href); return inner; }

      const path = href.split('#')[0].split('?')[0];
      const blog = path.match(/^\/blog\/([a-z0-9-]+)\/?$/i);
      if (blog) {
        if (valid.articles.has(blog[1])) { kept.push(path); return whole; }
        dropped.push(path);
        return inner;
      }
      const product = path.match(/^\/products\/([a-z0-9-]+)\/?$/i);
      if (product) {
        if (valid.pillars.has(product[1]) || valid.articles.has(product[1])) {
          kept.push(path); return whole;
        }
        dropped.push(path);
        return inner;
      }
      // Section roots and static pages are stable; anything else is a
      // guess and gets unwrapped.
      if (/^\/(blog|products|applications|solutions|about)\/?$/.test(path)
        || /^\/[a-z0-9-]+\.html$/.test(path)) { kept.push(path); return whole; }
      dropped.push(path);
      return inner;
    }
  );
  return { html: out, kept, dropped };
}

module.exports = {
  checkAgainstCorpus, containment, textOf, shingles,
  styleWarnings, sanitiseLinks,
  REJECT_AT, WARN_AT, TELLS,
};
