// Turns a playbook into a prompt, using the live site as its context.
//
// The operator supplies nothing. The playbook says what the article is
// about and what shape it takes; everything else — the pillar's real
// name and URL, the sibling articles that exist right now with their
// real slugs, the titles already published so the model can be told not
// to repeat them — is read from the database here.
//
// Two of those matter more than the rest:
//
//   the link list   The model is handed real slugs and told to use only
//                   those. It still invents some, which is why
//                   ai-dedup.sanitiseLinks runs on the output — but
//                   handing it a correct list reduces the invention
//                   enormously, and the links it does use are the ones
//                   that build the cluster.
//
//   the avoid list  Nearby titles and their focus keywords, so the model
//                   knows what has been said. Without it the fiftieth
//                   generated article restates the fifth.

const { loadCorpus, linkTargets, findOverlap, validSlugs } = require('./ai-corpus');
const playbooks = require('./ai-playbooks');
const { getShape, openerFor } = require('./ai-shapes');

// Maps a playbook's pillar token to a row in pillar_pages. The tokens
// are stable; the slugs belong to the operator and could change, so the
// lookup is by slug with a name fallback rather than by id.
const PILLAR_SLUG = {
  polymer: 'polymer-lithium-battery',
  custom: 'custom-shaped-polymer-lithium-battery',
  coin: 'coin-steel-shell-lithium-battery',
};

function resolvePillar(corpus, token) {
  if (token === 'cross') return null;
  const slug = PILLAR_SLUG[token];
  return corpus.pillars.find((p) => p.slug === slug) || null;
}

function resolveCategory(corpus, slug) {
  return corpus.categories.find((c) => c.slug === slug) || null;
}

// Authors are assigned by pillar so a cluster keeps a consistent byline,
// which is the point of having named authors at all. Falls back to the
// first active author rather than leaving the draft unattributed.
const AUTHOR_BY_PILLAR = {
  polymer: 'chen-li',
  custom: 'wei-zhang',
  coin: 'lin-zhao',
  cross: 'mei-yang',
};

function resolveAuthor(corpus, token) {
  const slug = AUTHOR_BY_PILLAR[token];
  return corpus.authors.find((a) => a.slug === slug) || corpus.authors[0] || null;
}

/**
 * Which playbooks are still worth writing?
 * Anything whose angle already overlaps a published article is marked
 * covered, with the article that covers it, so the caller can show the
 * operator why rather than silently hiding it.
 */
async function suggest({ limit = 20, pillar = null } = {}) {
  const corpus = await loadCorpus();
  const pool = pillar ? playbooks.byPillar(pillar) : playbooks.all();
  const scored = pool.map((pb) => {
    const overlap = findOverlap(`${pb.t} ${pb.a}`, corpus);
    return {
      key: pb.k,
      title: pb.t,
      pillar: pb.p,
      category: pb.c,
      shape: pb.s,
      covered: overlap.covered,
      overlap: Number(overlap.score.toFixed(3)),
      nearest: overlap.match ? { slug: overlap.match.slug, title: overlap.match.title } : null,
    };
  });
  // Least-covered first: the most valuable thing to write next is the
  // thing least like anything already published.
  scored.sort((a, b) => a.overlap - b.overlap);
  return { total: scored.length, items: scored.slice(0, limit) };
}

/**
 * Build the full prompt for one playbook.
 * @returns {{system:string,user:string,meta:object}} meta carries the
 *   resolved ids so a draft can be saved without a second lookup.
 */
async function compose(playbookKey) {
  const pb = playbooks.get(playbookKey);
  if (!pb) throw new Error(`unknown playbook: ${playbookKey}`);

  const corpus = await loadCorpus();

  // A prompt built from an empty corpus has no pillar to bind to, no
  // links to offer and no list of what has already been said — which is
  // the entire value of this path over the hand-filled templates. It
  // would still return an article, and that is the danger: the failure
  // is invisible in the output. Refuse instead, and say which read
  // failed.
  if (!corpus.articles.length && !corpus.pillars.length) {
    const why = corpus.errors && corpus.errors.length
      ? ` (${corpus.errors.join('; ')})`
      : ' (no published articles or pillars found)';
    const err = new Error(`corpus unavailable, refusing to generate without context${why}`);
    err.code = 'corpus_unavailable';
    err.status = 503;
    err.expose = true;
    throw err;
  }

  const pillar = resolvePillar(corpus, pb.p);
  const category = resolveCategory(corpus, pb.c);
  const author = resolveAuthor(corpus, pb.p);
  const shape = getShape(pb.s);
  const links = linkTargets(corpus, pillar ? pillar.id : null, 8);

  // Deterministic per playbook, so regenerating the same brief keeps the
  // same opening constraint rather than rolling a new one each time.
  const index = playbooks.all().findIndex((x) => x.k === pb.k);
  const opener = openerFor(index);

  const [minWords, maxWords] = shape.words;

  const linkLines = links.articles
    .map((a) => `  ${a.url}  — ${a.title}`)
    .join('\n');
  const pillarLine = pillar
    ? `  ${pillar.url}  — ${pillar.name} (the topic hub for this cluster)`
    : '  (this piece is cross-cluster; link articles only, no pillar hub)';

  // Nearby titles, so the model can see what has been said. Capped:
  // the whole catalogue would crowd out the brief itself.
  const avoid = corpus.articles
    .filter((a) => (pillar ? a.pillar_id === pillar.id : true))
    .slice(0, 24)
    .map((a) => `  - ${a.title}${a.focus_keyword ? ` [${a.focus_keyword}]` : ''}`)
    .join('\n');

  const user = `Write one article for a lithium-cell manufacturer's engineering blog.

ANGLE
${pb.a}

WORKING TITLE (rewrite it if you can do better; keep the subject)
${pb.t}

MUST COVER — the article is not finished until each of these is addressed
in substance, not mentioned in passing:
${pb.m.map((x) => `  - ${x}`).join('\n')}

SHAPE — ${shape.label}
Target length ${minWords}-${maxWords} words.
Opening: ${shape.open}.
${opener}
Work through these beats in order. Write your own <h2> heading for each —
do NOT reuse the wording below, it describes the beat, it is not a title:
${shape.sections.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}
${shape.table ? `Include ${shape.table}.` : 'Do NOT include a table in this one.'}
Close with ${shape.close}.
${shape.faq
    ? 'End with a short FAQ of 3 questions, each in <details><summary>…</summary><p>…</p></details>.'
    : 'Do NOT add an FAQ section to this article.'}

INTERNAL LINKS — use 4 to 6 of these, worked into sentences where they are
genuinely relevant. Use the exact URLs. Do NOT invent any other internal
link; a URL not on this list does not exist and will be removed:
${pillarLine}
${linkLines || '  (no sibling articles yet — link the hub only)'}

ALREADY PUBLISHED — do not restate these. Where your topic touches one,
link it and move on rather than re-explaining it:
${avoid || '  (nothing published yet)'}

CONSTRAINTS
- Return an HTML body fragment only. No <html>, <head>, <body>, no <h1>
  (the page renders the title), no markdown fences, no preamble.
- Use <p>, <h2>, <h3>, <ul>, <ol>, <strong>, <em>, <table> where earned.
- Open the first paragraph with <p class="lede">.
- Give real engineering figures as ranges with their conditions stated.
  Never invent a precise statistic, a price, a named customer, a test
  report number or a date you cannot support. If a number depends on
  something, say what.
- Vary paragraph length. Some of two sentences, some of six.
- No "in today's", no "it is important to note", no "furthermore", no
  "moreover", no "in conclusion", no "delve", no "seamless".
- British engineering English.

After the HTML, on its own final line, output exactly:
META: {"title":"…","excerpt":"…","meta_title":"…","meta_description":"…","focus_keyword":"…","reading_minutes":N}
meta_title must be 60 characters or fewer. meta_description must be 160
or fewer. excerpt is one or two sentences. Nothing after that line.`;

  return {
    user,
    meta: {
      playbook: pb.k,
      working_title: pb.t,
      pillar_id: pillar ? pillar.id : null,
      pillar_slug: pillar ? pillar.slug : null,
      category_id: category ? category.id : null,
      author_id: author ? author.id : null,
      author_name: author ? author.name : '',
      shape: pb.s,
      link_pool: links,
      valid: validSlugs(corpus),
      corpus_size: corpus.articles.length,
    },
  };
}

module.exports = { compose, suggest, resolvePillar, PILLAR_SLUG, AUTHOR_BY_PILLAR };
