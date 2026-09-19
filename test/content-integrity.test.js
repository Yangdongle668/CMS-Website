// Three defects found in the 2026 Q3 content audit, and the guards that
// keep them fixed:
//
//   1. "Acme" — the placeholder brand — still rendered in the body copy
//      of /products/polymer-lithium-battery. The Q2 cleanup rewrote the
//      plain text columns and silently skipped every JSONB one.
//   2. Articles with no pillar_id got an empty related list, so the five
//      cross-pillar compliance posts shipped with no outbound editorial
//      links at all, and no article cited a primary source.
//   3. A four-month publishing gap that nothing in the system reported.
//
// These are integration tests against a real seeded database because
// all three are failures of data + query + render together; each one
// passes a unit test of its own function.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { startServer } = require('./helpers/server');

const execFileAsync = promisify(execFile);
const ROOT = path.join(__dirname, '..');

// Runs one of the repo's .sql migration files against the test database
// and hands back everything psql said, notices included — the migration
// reports what it rewrote on stderr, and the idempotency check reads it.
async function runMigration(db, relPath) {
  const env = {
    ...process.env,
    PGHOST: process.env.PGHOST || '/tmp',
    PGPORT: process.env.PGPORT || '5432',
    PGUSER: process.env.PGUSER || 'postgres',
    PGDATABASE: db,
  };
  const { stdout, stderr } = await execFileAsync(
    'psql', ['-q', '-f', path.join(ROOT, relPath)], { env }
  );
  return stdout + stderr;
}

// The page is mostly one long line, so count occurrences rather than lines.
const count = (html, needle) => html.split(needle).length - 1;

// The client-side related-list builder holds a `/blog/${escape(r.slug)}`
// template literal. It is JS source, not a link — strip scripts before
// counting hrefs or the assertions measure the wrong thing.
function hrefs(html) {
  const markup = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  return [...markup.matchAll(/<a\s+[^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]);
}

test('content integrity', async (t) => {
  const srv = await startServer({ seed: true });
  t.after(() => srv.stop());

  await t.test('no placeholder brand survives in JSONB content columns', async () => {
    // Put the pre-rename state back: a deployment seeded before the
    // Zufek rename carried "Acme" inside the JSONB columns too.
    await srv.sql(`UPDATE pillar_pages SET
      overview      = replace(overview::text,      'Zufek', 'Acme')::jsonb,
      manufacturing = replace(manufacturing::text, 'Zufek', 'Acme')::jsonb,
      faq           = replace(faq::text,           'Zufek', 'Acme')::jsonb,
      hero_subtitle = replace(hero_subtitle,       'Zufek', 'Acme')`);

    const before = await srv.sql(
      `SELECT count(*) FROM pillar_pages WHERE overview::text LIKE '%Acme%'`
    );
    assert.ok(Number(before) > 0, 'the pre-rename state really does contain Acme');

    await runMigration(srv.db, 'server/db/migrate-2026-q3-brand-purge.sql');

    for (const col of ['overview', 'manufacturing', 'faq']) {
      const n = await srv.sql(
        `SELECT count(*) FROM pillar_pages WHERE ${col}::text ~ '\\mAcme\\M'`
      );
      assert.equal(Number(n), 0, `${col} (JSONB) still carries the placeholder brand`);
    }
    const heroLeft = await srv.sql(
      `SELECT count(*) FROM pillar_pages WHERE hero_subtitle ~ '\\mAcme\\M'`
    );
    assert.equal(Number(heroLeft), 0, 'hero_subtitle (text) still carries the placeholder brand');
  });

  await t.test('the product page renders the real brand', async () => {
    const res = await srv.request('/products/polymer-lithium-battery');
    assert.equal(res.status, 200);
    const body = res.text.replace(/<script[\s\S]*?<\/script>/gi, '');
    assert.equal(count(body, 'Acme'), 0, 'the placeholder brand reached the rendered page');
    assert.ok(count(body, 'Zufek') > 0, 'the real brand should be present');
  });

  await t.test('the purge leaves customer data and the ACME protocol alone', async () => {
    await srv.sql(`INSERT INTO inquiries (reference, full_name, email, company, message)
      VALUES ('REF-PURGE-1','Jane Doe','jane@example.com','Acme Batteries GmbH','Need 5000 cells')`);
    await srv.sql(`INSERT INTO settings (key, value)
      VALUES ('ssl_test', '{"dir":"https://acme-v02.api.letsencrypt.org/directory"}'::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`);

    await runMigration(srv.db, 'server/db/migrate-2026-q3-brand-purge.sql');

    const company = await srv.sql(
      `SELECT company FROM inquiries WHERE reference = 'REF-PURGE-1'`
    );
    assert.equal(company, 'Acme Batteries GmbH',
      "a prospect's own company name is not ours to rewrite");
    const ssl = await srv.sql(`SELECT value->>'dir' FROM settings WHERE key = 'ssl_test'`);
    assert.match(ssl, /acme-v02\.api\.letsencrypt\.org/,
      'the ACME certificate protocol is not the placeholder brand');
  });

  await t.test('the purge is idempotent', async () => {
    const out = await runMigration(srv.db, 'server/db/migrate-2026-q3-brand-purge.sql');
    assert.doesNotMatch(out, /brand-purge\] \w+\.\w+: \d+ row/,
      're-running on clean data should rewrite nothing');
    assert.doesNotMatch(out, /RESIDUE/, 'no column should be left unpurgeable');
  });

  await t.test('an article with no pillar still links to neighbours', async () => {
    // The seed keeps the compliance cluster cross-pillar on purpose.
    const orphan = await srv.sql(
      `SELECT slug FROM articles WHERE pillar_id IS NULL AND status='published'
       ORDER BY slug LIMIT 1`
    );
    assert.ok(orphan, 'the seed still has a cross-pillar article to test');

    const res = await srv.request('/blog/' + orphan);
    assert.equal(res.status, 200);

    const blogLinks = hrefs(res.text).filter((h) => h.startsWith('/blog/') && h !== '/blog/');
    assert.ok(blogLinks.length >= 4,
      `a cross-pillar article should still carry related links, got ${blogLinks.length}`);

    // And they must be in the server-rendered HTML, not only built by
    // the client — a link a crawler cannot see is not an internal link.
    assert.ok(count(res.text, 'data-side-related-list') > 0);
  });

  await t.test('related articles prefer pillar, then category', async () => {
    const orphan = await srv.sql(
      `SELECT slug FROM articles
        WHERE pillar_id IS NULL AND category_id IS NOT NULL AND status='published'
        ORDER BY slug LIMIT 1`
    );
    const res = await srv.request('/api/articles/' + orphan);
    assert.equal(res.status, 200);
    const { article, related } = res.json;
    assert.equal(related.length, 4, 'the fallback chain should always fill the list');

    // With no pillar, every pick should still be a same-category match
    // while the site has enough of them — not a bare "most recent".
    const sameCat = await srv.sql(
      `SELECT count(*) FROM articles
        WHERE category_id = (SELECT category_id FROM articles WHERE slug='${orphan}')
          AND slug <> '${orphan}' AND status='published'`
    );
    if (Number(sameCat) >= 4) {
      for (const r of related) {
        assert.equal(r.category_name, article.category_name,
          `${r.slug} was picked ahead of an available same-category article`);
      }
    }
  });

  await t.test('an article with a pillar keeps its cluster links', async () => {
    const res = await srv.request('/api/articles/cell-sizing');
    assert.equal(res.status, 200);
    const { article, related } = res.json;
    assert.ok(related.length > 0);
    for (const r of related) {
      assert.equal(r.relation_tier, 1, `${r.slug} displaced a same-pillar article`);
    }
    assert.ok(article.pillar_id, 'this fixture is supposed to have a pillar');
  });

  await t.test('standards articles render crawlable outbound citations', async () => {
    const res = await srv.request('/blog/un-iec-compliance');
    assert.equal(res.status, 200);
    assert.ok(count(res.text, 'article-references') > 0, 'References section is missing');

    const external = hrefs(res.text).filter((h) => /^https?:\/\//i.test(h));
    assert.ok(external.length >= 2,
      `expected outbound references in the SSR HTML, got ${external.length}`);

    // Mirrored into Article JSON-LD so the citation is machine-readable.
    const blocks = [...res.text.matchAll(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
    )];
    const article = blocks
      .flatMap((b) => [].concat(JSON.parse(b[1])))
      .find((n) => n['@type'] === 'Article');
    assert.ok(article, 'the page should carry an Article node');
    assert.ok(Array.isArray(article.citation) && article.citation.length >= 2,
      'Article JSON-LD should mirror the references');
  });

  await t.test('a citation with a non-http scheme is never rendered as a link', async () => {
    await srv.sql(`UPDATE articles SET citations =
      '[{"label":"x","url":"javascript:alert(1)","publisher":"p"}]'::jsonb
      WHERE slug='un-iec-compliance'`);

    const res = await srv.request('/blog/un-iec-compliance');
    assert.equal(res.status, 200);
    const body = res.text.replace(/<script[\s\S]*?<\/script>/gi, '');
    assert.equal(count(body, 'javascript:alert'), 0,
      'a javascript: citation must be dropped, not escaped into the page');

    // Put the real references back for any later subtest.
    await runMigration(srv.db, 'server/db/migrate-2026-q3-article-citations.sql');
  });

  await t.test('the freshness endpoint requires auth', async () => {
    srv.clearCookie();
    const anon = await srv.request('/api/content-freshness');
    assert.equal(anon.status, 401, 'operational data should not be public');
  });

  await t.test('content freshness reports a healthy blog, then a gap', async () => {
    const login = await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'admin@example.test', password: 'a-strong-password-2026' },
    });
    assert.equal(login.status, 200);

    const fresh = (await srv.request('/api/content-freshness')).json;
    assert.equal(fresh.status, 'ok', 'the seed publishes recently, so it starts healthy');
    assert.ok(fresh.published_count > 0);

    // Age every post past the stale threshold, as the live site did.
    await srv.sql(`UPDATE articles SET published_at = published_at - interval '200 days',
                                       updated_at   = updated_at   - interval '200 days'`);

    const stale = (await srv.request('/api/content-freshness')).json;
    assert.equal(stale.status, 'stale');
    assert.ok(stale.days_since_last_publish >= stale.thresholds.stale_days);
    assert.equal(stale.published_last_30d, 0);
    assert.ok(stale.oldest_unrevised.length > 0, 'it should name what to refresh first');
  });
});
