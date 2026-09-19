// The five posts added to close the June-September publishing gap, and
// the properties that make them worth publishing rather than just
// present: a cluster binding, a focus keyword and meta pair, internal
// links that resolve, and at least one primary source.
//
// The link check is the one that earns its place. An article body is
// free text in a JSONB-adjacent column; a typo in an href is invisible
// until a crawler finds it, and these articles were written to carry
// internal links, so a broken one defeats the point of adding them.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers/server');

const NEW_SLUGS = [
  'reading-a-lipo-datasheet',
  'battery-connector-harness-selection',
  'c-rate-selection-lipo',
  'pse-kc-bis-regional-certification',
  'lithium-storage-state-of-charge',
];

const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, '');
const hrefs = (h) =>
  [...strip(h).matchAll(/<a\s+[^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]);

test('editorial content', async (t) => {
  const srv = await startServer({ seed: true });
  t.after(() => srv.stop());

  await t.test('all five gap-filling articles are published', async () => {
    const n = await srv.sql(
      `SELECT count(*) FROM articles
        WHERE status='published' AND slug IN (${NEW_SLUGS.map((s) => `'${s}'`).join(',')})`
    );
    assert.equal(Number(n), NEW_SLUGS.length);
  });

  await t.test('each carries the SEO fields it was written for', async () => {
    for (const slug of NEW_SLUGS) {
      const row = await srv.sql(
        `SELECT focus_keyword || '|' || meta_title || '|' || meta_description ||
                '|' || jsonb_array_length(citations) || '|' || coalesce(category_id::text,'')
           FROM articles WHERE slug='${slug}'`
      );
      const [kw, mt, md, cites, cat] = row.split('|');
      assert.ok(kw.length > 3, `${slug}: no focus keyword`);
      // Bounds are what a result actually shows before truncation —
      // roughly 60 characters for a title and 160 for a description.
      // Writing past them is not penalised, it is just wasted.
      assert.ok(mt.length > 20 && mt.length <= 60, `${slug}: meta_title length ${mt.length}`);
      assert.ok(md.length > 70 && md.length <= 160, `${slug}: meta_description length ${md.length}`);
      assert.ok(Number(cites) >= 1, `${slug}: no outbound citation`);
      assert.ok(cat, `${slug}: no category`);
    }
  });

  await t.test('each renders and every internal link in it resolves', async () => {
    for (const slug of NEW_SLUGS) {
      const res = await srv.request('/blog/' + slug);
      assert.equal(res.status, 200, slug);

      const internal = [...new Set(hrefs(res.text))]
        .filter((h) => h.startsWith('/blog/') || h.startsWith('/products/'))
        .filter((h) => h !== `/blog/${slug}`);
      assert.ok(internal.length >= 5,
        `${slug} carries only ${internal.length} internal links`);

      for (const href of internal) {
        const r = await srv.request(href);
        assert.equal(r.status, 200, `${slug} links to ${href} which returns ${r.status}`);
      }
    }
  });

  await t.test('citations render as crawlable external links', async () => {
    for (const slug of NEW_SLUGS) {
      const res = await srv.request('/blog/' + slug);
      const external = hrefs(res.text).filter((h) => /^https?:\/\//i.test(h));
      assert.ok(external.length >= 1, `${slug} renders no outbound reference`);
    }
  });

  await t.test('they join a cluster that the pillar page links back to', async () => {
    // Four of the five are pillar-bound; the compliance piece is
    // deliberately cross-pillar, as the rest of that cluster is.
    const bound = await srv.sql(
      `SELECT count(*) FROM articles
        WHERE pillar_id IS NOT NULL
          AND slug IN (${NEW_SLUGS.map((s) => `'${s}'`).join(',')})`
    );
    assert.equal(Number(bound), 4);

    const res = await srv.request('/products/polymer-lithium-battery');
    assert.equal(res.status, 200);
    const linked = hrefs(res.text);
    for (const slug of ['reading-a-lipo-datasheet', 'c-rate-selection-lipo',
      'lithium-storage-state-of-charge']) {
      assert.ok(linked.includes(`/blog/${slug}`),
        `${slug} is bound to the polymer pillar but the pillar does not link it`);
    }
  });

  await t.test('the new articles are in the sitemap', async () => {
    const sm = await srv.request('/sitemap.xml');
    for (const slug of NEW_SLUGS) {
      assert.match(sm.text, new RegExp(`/blog/${slug}<`), `${slug} missing from sitemap`);
    }
  });

  await t.test('re-running the migration does not duplicate them', async () => {
    const before = await srv.sql(`SELECT count(*) FROM articles`);
    const { execFile } = require('child_process');
    const { promisify } = require('util');
    await promisify(execFile)('psql',
      ['-q', '-f', require('path').join(__dirname, '..', 'server', 'db', 'migrate-2026-q3-new-articles.sql')],
      { env: { ...process.env, PGHOST: process.env.PGHOST || '/tmp', PGDATABASE: srv.db } });
    const after = await srv.sql(`SELECT count(*) FROM articles`);
    assert.equal(after, before, 'the migration inserted duplicates on a second run');
  });
});
