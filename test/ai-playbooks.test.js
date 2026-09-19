// The corpus-aware article generator.
//
// None of this calls an LLM. The parts worth testing are the parts
// around the model: that the prompt is built from the live database
// rather than from typed-in variables, that a link the model invents
// cannot reach the page, that a draft repeating an existing article is
// refused, and that a hundred briefs do not all produce the same
// skeleton — which is what a duplicate-content check actually notices.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers/server');

const playbooks = require('../server/services/ai-playbooks');
const shapes = require('../server/services/ai-shapes');
const dedup = require('../server/services/ai-dedup');

test('ai playbooks', async (t) => {
  await t.test('there are a hundred, and every one is well formed', () => {
    // The module validates itself on require and throws on a bad row, so
    // reaching this line already proves keys are unique and every
    // pillar, category and shape resolves. This pins the count and the
    // spread.
    assert.equal(playbooks.count(), 100);

    const byPillar = {};
    for (const pb of playbooks.all()) byPillar[pb.p] = (byPillar[pb.p] || 0) + 1;
    for (const p of ['polymer', 'custom', 'coin', 'cross']) {
      assert.ok(byPillar[p] >= 15, `only ${byPillar[p]} playbooks for ${p}`);
    }

    // Working titles must be distinct too — two briefs with the same
    // title produce two articles competing for one query.
    const titles = new Set(playbooks.all().map((pb) => pb.t.toLowerCase()));
    assert.equal(titles.size, 100, 'duplicate working title');
  });

  await t.test('the shapes genuinely differ', () => {
    // If every brief produced the same heading sequence, a section of
    // the site would read as templated however varied the prose was.
    const used = new Set(playbooks.all().map((pb) => pb.s));
    assert.ok(used.size >= 8, `only ${used.size} distinct shapes in use`);

    // Most shapes must NOT carry an FAQ: an FAQ block on every article
    // is among the most visible generated-content tells.
    const all = Object.values(shapes.SHAPES);
    const withFaq = all.filter((s) => s.faq).length;
    assert.ok(withFaq <= all.length / 2, 'too many shapes end in an FAQ');

    // Section sequences must not be copies of one another.
    const seqs = new Set(all.map((s) => s.sections.join('|')));
    assert.equal(seqs.size, all.length, 'two shapes share a section sequence');
  });

  await t.test('link sanitiser keeps real links and unwraps invented ones', () => {
    const valid = {
      articles: new Set(['real-article', 'another-real']),
      pillars: new Set(['polymer-lithium-battery']),
    };
    const html = '<p>'
      + '<a href="/blog/real-article">one</a> '
      + '<a href="/blog/made-up-slug">two</a> '
      + '<a href="/products/polymer-lithium-battery">three</a> '
      + '<a href="/products/not-a-pillar">four</a> '
      + '<a href="https://webstore.iec.ch/">five</a> '
      + '<a href="/contact.html">six</a>'
      + '</p>';
    const out = dedup.sanitiseLinks(html, valid);

    assert.ok(out.kept.includes('/blog/real-article'));
    assert.ok(out.kept.includes('/products/polymer-lithium-battery'));
    assert.ok(out.kept.includes('https://webstore.iec.ch/'));
    assert.ok(out.kept.includes('/contact.html'));
    assert.deepEqual(out.dropped.sort(), ['/blog/made-up-slug', '/products/not-a-pillar']);

    // The invented hrefs are gone but the sentence still reads.
    assert.doesNotMatch(out.html, /made-up-slug/);
    assert.doesNotMatch(out.html, /not-a-pillar/);
    assert.match(out.html, /two/);
    assert.match(out.html, /four/);
  });

  await t.test('the duplicate gate separates a copy from fresh writing', () => {
    const existing = [{
      slug: 'a', title: 'A',
      content: '<p>Tab width on a pouch cell is set by the current it has to carry '
        + 'without heating and by the width of seal material left either side of it. '
        + 'Aluminium goes on the positive side and nickel-plated copper on the negative, '
        + 'and that asymmetry follows from the potentials each side sits at.</p>',
    }];

    const copy = dedup.checkAgainstCorpus(existing[0].content, existing);
    assert.equal(copy.verdict, 'duplicate');
    assert.ok(copy.score > 0.9);
    assert.equal(copy.nearest.slug, 'a');

    const fresh = dedup.checkAgainstCorpus(
      '<p>Stack pressure is the constraint nobody writes on a drawing. A pouch held '
      + 'under modest even pressure keeps its electrode layers in contact; one rattling '
      + 'loose in a cavity does not, and the capacity difference shows up within a '
      + 'few hundred cycles.</p>', existing);
    assert.equal(fresh.verdict, 'ok');
    assert.ok(fresh.score < dedup.WARN_AT);
  });

  await t.test('the style lint catches stock phrasing and uniform paragraphs', () => {
    const bad = "<p>In today's rapidly evolving landscape, it is important to note that "
      + 'cells play a crucial role. Furthermore, we delve into the seamless integration. '
      + 'In conclusion, this is a game-changer.</p>';
    const warnings = dedup.styleWarnings(bad);
    assert.ok(warnings.length >= 5, `expected several warnings, got ${warnings.length}`);

    // Paragraphs of near-identical length are the structural tell.
    const uniform = Array.from({ length: 6 },
      () => `<p>${'word '.repeat(45)}</p>`).join('');
    assert.ok(dedup.styleWarnings(uniform).some((w) => /uniform/.test(w)));

    // And ordinary varied writing should stay quiet.
    const ok = '<p>Tab width is set by current.</p>'
      + `<p>${'The seal needs material either side of the tab, and that competes directly '
        .repeat(4)}</p><p>Two sentences. That is all this one needs.</p>`;
    assert.deepEqual(dedup.styleWarnings(ok), []);
  });
});

test('ai playbooks against a live corpus', async (t) => {
  const srv = await startServer({ seed: true });
  t.after(() => srv.stop());

  // These read the database in-process, so point the pooled client at
  // the test database the harness just built.
  process.env.PGDATABASE = srv.db;
  const corpus = require('../server/services/ai-corpus');
  const composer = require('../server/services/ai-composer');
  corpus.invalidate();

  await t.test('a prompt resolves real ids and real link targets', async () => {
    const { user, meta } = await composer.compose('pouch-tab-design');

    assert.ok(meta.pillar_id, 'pillar did not resolve');
    assert.ok(meta.category_id, 'category did not resolve');
    assert.ok(meta.author_id, 'author did not resolve');
    assert.ok(meta.corpus_size > 10, `corpus looks empty: ${meta.corpus_size}`);

    // Every offered link must be a row that exists.
    assert.ok(meta.link_pool.articles.length >= 4);
    for (const a of meta.link_pool.articles) {
      const n = await srv.sql(`SELECT count(*) FROM articles WHERE slug='${a.slug}'`);
      assert.equal(Number(n), 1, `${a.url} is offered but does not exist`);
      assert.ok(user.includes(a.url), 'the link pool is not in the prompt');
    }
    assert.ok(user.includes(meta.link_pool.pillar.url));

    // And the avoid list has to carry real titles, or the model has no
    // way to know what has been said.
    const aTitle = await srv.sql(
      `SELECT title FROM articles WHERE status='published' AND pillar_id=${meta.pillar_id}
        ORDER BY published_at DESC NULLS LAST LIMIT 1`);
    assert.ok(user.includes(aTitle), 'avoid list does not name published articles');
  });

  await t.test('a cross-pillar brief binds to no pillar but keeps an author', async () => {
    const { meta } = await composer.compose('un383-report-reading');
    assert.equal(meta.pillar_id, null);
    assert.ok(meta.author_id, 'cross-pillar drafts still need a byline');
  });

  await t.test('the prompt forbids inventing links and demands a meta line', async () => {
    const { user } = await composer.compose('supplier-audit');
    assert.match(user, /Do NOT invent any other internal\s+link/);
    assert.match(user, /^META: \{/m);
    assert.match(user, /meta_title must be 60 characters or fewer/);
  });

  await t.test('suggest ranks by overlap and flags what is already covered', async () => {
    const out = await composer.suggest({ limit: 100 });
    assert.equal(out.total, 100);
    for (let i = 1; i < out.items.length; i++) {
      assert.ok(out.items[i].overlap >= out.items[i - 1].overlap, 'not sorted by overlap');
    }
    // None of the shipped briefs should duplicate a seeded article; if
    // one does, it is the brief that needs changing.
    const covered = out.items.filter((s) => s.covered);
    assert.deepEqual(covered.map((c) => c.key), [],
      `playbooks overlap published articles: ${covered.map((c) => c.key).join(', ')}`);
  });

  await t.test('the overlap check really fires on a topic already written', async () => {
    // Guards the assertion above: zero covered is only meaningful if the
    // detector can detect anything at all.
    const c = await corpus.loadCorpus();
    const existing = c.articles[0];
    const exact = corpus.findOverlap(existing.title, c);
    assert.equal(exact.covered, true);
    assert.equal(exact.match.slug, existing.slug);
  });

  await t.test('generation is refused when the corpus cannot be read', async () => {
    const original = corpus.loadCorpus;
    corpus.loadCorpus = async () => ({
      pillars: [], categories: [], authors: [], articles: [],
      errors: ['articles: column "focus_keyword" does not exist'],
    });
    try {
      // Re-require the composer so it picks up the patched corpus.
      delete require.cache[require.resolve('../server/services/ai-composer')];
      const patched = require('../server/services/ai-composer');
      await assert.rejects(
        () => patched.compose('pouch-tab-design'),
        (err) => {
          assert.equal(err.code, 'corpus_unavailable');
          assert.match(err.message, /focus_keyword/);
          return true;
        },
        'a context-free prompt should be refused, not quietly generated'
      );
    } finally {
      corpus.loadCorpus = original;
      delete require.cache[require.resolve('../server/services/ai-composer')];
    }
  });

  await t.test('the API exposes the playbooks to an authenticated operator', async () => {
    assert.equal((await srv.request('/api/ai-generate/playbooks')).status, 401);

    await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'admin@example.test', password: 'a-strong-password-2026' },
    });

    const list = await srv.request('/api/ai-generate/playbooks');
    assert.equal(list.status, 200);
    assert.equal(list.json.total, 100);
    assert.equal(list.json.items.length, 100);
    assert.ok(list.json.items[0].key && list.json.items[0].angle);

    const suggest = await srv.request('/api/ai-generate/suggest?limit=5');
    assert.equal(suggest.status, 200);
    assert.equal(suggest.json.items.length, 5);

    const preview = await srv.request('/api/ai-generate/preview-prompt?key=pouch-tab-design');
    assert.equal(preview.status, 200);
    assert.ok(preview.json.prompt.length > 1000);
    assert.ok(preview.json.context.link_pool.length > 0);

    const bad = await srv.request('/api/ai-generate/preview-prompt?key=no-such-playbook');
    assert.equal(bad.status, 400);
  });
});
