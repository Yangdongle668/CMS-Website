// Why so few pages were indexed.
//
// A `site:` check returned far fewer URLs than the sitemap advertises.
// Three things in the rendering path explained it, and each one is
// pinned here because each is easy to reintroduce:
//
//   1. The header and footer existed only in partials.js, so the HTML
//      a crawler is served carried no <nav>, no <footer>, and no link
//      to /solutions/, /terms.html or /legal.html. Six sitemap URLs had
//      nothing at all pointing at them without running the page's JS.
//   2. /blog/<slug>.html answered 200 with an empty _template.html and
//      a canonical pointing at itself, giving every article a
//      contentless twin that claimed to be canonical — and seeded
//      article bodies linked to the twins.
//   3. Catalogue SKUs were in the sitemap with no link anywhere on the
//      site reaching them.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers/server');

// Crawl the way Googlebot's first pass does: parse the served HTML, do
// not execute the page's JS. Query strings are kept — the blog pager is
// ?page=N and dropping it would hide most of the catalogue.
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, '');
function hrefs(html) {
  return [...strip(html).matchAll(/<a\s+[^>]*href=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .filter((h) => h.startsWith('/') && !h.startsWith('//'))
    .map((h) => h.split('#')[0])
    .filter(Boolean);
}

test('indexation', async (t) => {
  const srv = await startServer({ seed: true });
  t.after(() => srv.stop());

  await t.test('every page carries a server-rendered nav and footer', async () => {
    const paths = ['/', '/blog/', '/blog/cell-sizing', '/products/polymer-lithium-battery',
      '/applications/ar-vr.html', '/contact.html'];
    for (const p of paths) {
      const res = await srv.request(p);
      assert.equal(res.status, 200, p);
      const html = strip(res.text);
      assert.match(html, /<header id="site-header">/, `${p} has no server-rendered header`);
      assert.match(html, /<footer>/, `${p} has no server-rendered footer`);
      // Exactly once: partials.js replaces these nodes on hydration, and
      // two navs in the HTML would be two navs for a crawler.
      assert.equal((html.match(/<header id="site-header">/g) || []).length, 1, `${p} duplicate header`);
      assert.equal((html.match(/<footer>/g) || []).length, 1, `${p} duplicate footer`);
    }
  });

  await t.test('the nav and footer links are in the HTML, not only in JS', async () => {
    const html = strip((await srv.request('/')).text);
    // These three reached a visitor only through partials.js before.
    for (const url of ['/solutions/', '/terms.html', '/legal.html']) {
      assert.ok(html.includes(`href="${url}"`), `homepage HTML does not link ${url}`);
    }
  });

  await t.test('the .html spelling of an article redirects to the clean URL', async () => {
    const res = await srv.request('/blog/cell-sizing.html');
    assert.equal(res.status, 301, 'should be a permanent redirect, not a page');
    assert.equal(res.headers.get('location'), '/blog/cell-sizing');
  });

  await t.test('an unknown slug 404s instead of serving an empty template', async () => {
    for (const p of ['/blog/no-such-article', '/blog/no-such-article.html',
      '/products/no-such-product']) {
      const res = await srv.request(p);
      assert.equal(res.status, 404, `${p} should 404`);
      // The old behaviour: 200 with the unfilled template's placeholder title.
      assert.doesNotMatch(res.text, /<title>\s*Engineering Insight/i,
        `${p} served the empty article template`);
    }
  });

  await t.test('applications keep .html as their canonical spelling', async () => {
    // The sitemap emits /applications/<slug>.html, so that must not be
    // swept up by the blog/products redirect.
    const res = await srv.request('/applications/ar-vr.html');
    assert.equal(res.status, 200);
    const canonical = (res.text.match(
      /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1];
    assert.ok(canonical && canonical.endsWith('/applications/ar-vr.html'), canonical);
  });

  await t.test('no article links at a .html twin', async () => {
    const n = await srv.sql(
      `SELECT count(*) FROM articles WHERE content ~ '/blog/[a-z0-9-]+\\.html'`
    );
    assert.equal(Number(n), 0, 'an article still links to a redirecting URL');
  });

  await t.test('a pillar links the catalogue SKUs beneath it', async () => {
    const res = await srv.request('/products/polymer-lithium-battery');
    const linked = hrefs(res.text);
    const slugs = (await srv.sql(
      `SELECT string_agg(slug, ' ') FROM products
        WHERE status='published'
          AND pillar_id = (SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery')`
    )).split(' ').filter(Boolean);
    assert.ok(slugs.length > 0, 'the seed gives this pillar at least one SKU');
    for (const s of slugs) {
      assert.ok(linked.includes(`/products/${s}`), `${s} is not linked from its pillar`);
    }
  });

  await t.test('every sitemap URL is reachable by crawling from the homepage', async () => {
    const sm = await srv.request('/sitemap.xml');
    assert.equal(sm.status, 200);
    const paths = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1].replace(/^https?:\/\/[^/]+/, ''));
    assert.ok(paths.length > 50, `sitemap looks too small: ${paths.length}`);

    const seen = new Set();
    const queue = [['/', 0]];
    while (queue.length) {
      const [p, d] = queue.shift();
      if (seen.has(p)) continue;
      seen.add(p);
      if (d >= 4) continue;
      const r = await srv.request(p);
      if (r.status !== 200) continue;
      for (const l of hrefs(r.text)) if (!seen.has(l)) queue.push([l, d + 1]);
    }

    const orphans = paths.filter((p) => !seen.has(p));
    assert.deepEqual(orphans, [],
      `these sitemap URLs have nothing linking to them: ${orphans.join(', ')}`);
  });

  await t.test('sitemap URLs self-canonicalise and none are noindex', async () => {
    const sm = await srv.request('/sitemap.xml');
    const paths = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1].replace(/^https?:\/\/[^/]+/, ''));
    for (const p of paths) {
      const r = await srv.request(p);
      assert.equal(r.status, 200, `${p} is in the sitemap but returns ${r.status}`);
      const canonical = (r.text.match(
        /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1];
      assert.ok(canonical, `${p} has no canonical`);
      assert.equal(canonical.replace(/^https?:\/\/[^/]+/, ''), p,
        `${p} canonicalises elsewhere`);
      const robots = (r.text.match(
        /<meta\s+name=["']robots["'][^>]*content=["']([^"']+)["']/i) || [])[1] || '';
      assert.doesNotMatch(robots, /noindex/i, `${p} is noindex but is in the sitemap`);
    }
  });
});
