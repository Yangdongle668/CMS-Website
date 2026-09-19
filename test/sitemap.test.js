// What the sitemap promises Google.
//
// Two separate guarantees, and only one of them was being kept.
//
// The URL list is live: /sitemap.xml queries the database on every
// request, so publishing adds a URL and unpublishing removes it with no
// rebuild step. That worked and is pinned here so it keeps working.
//
// lastmod was not. The articles query read
// COALESCE(published_at, updated_at), and a published article always has
// published_at set, so updated_at was never reached — revising an
// article left its lastmod at the original publication date. lastmod is
// the one sitemap attribute Google uses to decide whether to re-crawl,
// so every edit was invisible to it, on the content type that gets
// revised most.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers/server');

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].replace(/^https?:\/\/[^/]+/, ''));

// <lastmod> for one <loc>, or null when the entry carries none.
function lastmodFor(xml, path) {
  const esc = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = xml.match(new RegExp(`<loc>[^<]*${esc}</loc>\\s*<lastmod>([^<]+)</lastmod>`));
  return m ? m[1] : null;
}
const day = (iso) => (iso ? iso.slice(0, 10) : null);

test('sitemap', async (t) => {
  const srv = await startServer({ seed: true });
  t.after(() => srv.stop());

  await srv.request('/api/auth/login', {
    method: 'POST',
    json: { email: 'admin@example.test', password: 'a-strong-password-2026' },
  });

  await t.test('publishing adds a URL and unpublishing removes it', async () => {
    const before = locs((await srv.request('/sitemap.xml')).text).length;

    const draft = await srv.request('/api/ai-generate/save-draft', {
      method: 'POST',
      json: { slug: 'sitemap-lifecycle-probe', title: 'Probe', content: '<p>x</p>' },
    });
    assert.equal(draft.status, 200);
    const url = '/blog/sitemap-lifecycle-probe';

    assert.ok(!locs((await srv.request('/sitemap.xml')).text).includes(url),
      'a draft must not be advertised to crawlers');

    const publish = async (status) => srv.request('/api/articles/' + draft.json.id, {
      method: 'PUT', json: { title: 'Probe', content: '<p>x</p>', status },
    });

    assert.equal((await publish('published')).status, 200);
    const after = locs((await srv.request('/sitemap.xml')).text);
    assert.ok(after.includes(url), 'publishing did not add the URL');
    assert.equal(after.length, before + 1);

    assert.equal((await publish('draft')).status, 200);
    assert.ok(!locs((await srv.request('/sitemap.xml')).text).includes(url),
      'unpublishing did not remove the URL');
  });

  await t.test('an unrevised article reports its publication date', async () => {
    const slug = await srv.sql(
      `SELECT slug FROM articles WHERE status='published' ORDER BY id LIMIT 1`);
    // Publication in the past, no edit since.
    await srv.sql(`UPDATE articles
                      SET published_at = timestamptz '2026-06-12 09:00:00+00',
                          updated_at   = timestamptz '2026-06-12 09:00:00+00'
                    WHERE slug = '${slug}'`);
    const xml = (await srv.request('/sitemap.xml')).text;
    assert.equal(day(lastmodFor(xml, '/blog/' + slug)), '2026-06-12');
  });

  await t.test('revising an article moves its lastmod forward', async () => {
    const slug = await srv.sql(
      `SELECT slug FROM articles WHERE status='published' ORDER BY id LIMIT 1`);
    const id = await srv.sql(`SELECT id FROM articles WHERE slug='${slug}'`);

    await srv.sql(`UPDATE articles
                      SET published_at = timestamptz '2026-06-12 09:00:00+00',
                          updated_at   = timestamptz '2026-06-12 09:00:00+00'
                    WHERE id = ${id}`);
    const before = lastmodFor((await srv.request('/sitemap.xml')).text, '/blog/' + slug);
    assert.equal(day(before), '2026-06-12');

    // A real edit through the API, which is what sets updated_at.
    const title = await srv.sql(`SELECT title FROM articles WHERE id=${id}`);
    const res = await srv.request('/api/articles/' + id, {
      method: 'PUT',
      json: { title, content: '<p>substantially revised</p>', status: 'published' },
    });
    assert.equal(res.status, 200, res.text);

    const after = lastmodFor((await srv.request('/sitemap.xml')).text, '/blog/' + slug);
    assert.ok(new Date(after) > new Date(before),
      `lastmod did not move after an edit: ${before} -> ${after}`);

    // And publication date itself must not be rewritten by the edit.
    assert.equal(
      day(await srv.sql(`SELECT published_at FROM articles WHERE id=${id}`)),
      '2026-06-12', 'editing moved the publication date');
  });

  await t.test('published_at acts as a floor, not a ceiling', async () => {
    // GREATEST, not updated_at alone: a row touched out of order must
    // not report a lastmod earlier than its own publication.
    const slug = await srv.sql(
      `SELECT slug FROM articles WHERE status='published' ORDER BY id DESC LIMIT 1`);
    await srv.sql(`UPDATE articles
                      SET published_at = timestamptz '2026-08-01 09:00:00+00',
                          updated_at   = timestamptz '2026-05-01 09:00:00+00'
                    WHERE slug = '${slug}'`);
    const xml = (await srv.request('/sitemap.xml')).text;
    assert.equal(day(lastmodFor(xml, '/blog/' + slug)), '2026-08-01',
      'lastmod fell back below the publication date');
  });

  await t.test('the other content types report their own edits too', async () => {
    const slug = await srv.sql(
      `SELECT slug FROM pillar_pages WHERE status='published' ORDER BY sort_order LIMIT 1`);
    await srv.sql(`UPDATE pillar_pages SET updated_at = timestamptz '2026-07-04 09:00:00+00'
                    WHERE slug = '${slug}'`);
    const xml = (await srv.request('/sitemap.xml')).text;
    assert.equal(day(lastmodFor(xml, '/products/' + slug)), '2026-07-04');
  });

  await t.test('every entry carries a well-formed lastmod', async () => {
    const xml = (await srv.request('/sitemap.xml')).text;
    const stamps = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
    assert.ok(stamps.length > 50, `only ${stamps.length} entries carry a lastmod`);
    for (const s of stamps) {
      assert.match(s, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, `bad lastmod: ${s}`);
      assert.ok(!Number.isNaN(Date.parse(s)), `unparseable lastmod: ${s}`);
    }
  });

  await t.test('robots.txt advertises an absolute sitemap URL', async () => {
    const robots = (await srv.request('/robots.txt')).text;
    const line = (robots.match(/^Sitemap:\s*(\S+)$/m) || [])[1];
    assert.ok(line, 'robots.txt has no Sitemap: line');
    assert.match(line, /^https?:\/\/.+\/sitemap\.xml$/, `not absolute: ${line}`);
  });
});
