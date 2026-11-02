const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { startServer } = require('./helpers/server');
const catalogue = require('../public/assets/img/generated/manifest.json');

const migration = fs.readFileSync(path.join(__dirname, '..', 'server', 'db', 'migrate-2026-scene-imagery.sql'), 'utf8');

test('scene-matched imagery', async (t) => {
  const srv = await startServer({ seed: true });
  t.after(() => srv.stop());

  await t.test('every bundled article receives its own relevant cover and hero', async () => {
    const rows = JSON.parse(await srv.sql('SELECT json_agg(t) FROM (SELECT slug, cover_url, hero_image FROM articles ORDER BY slug) t'));
    const expected = catalogue.assets.filter((a) => a.key.startsWith('article-'));
    assert.equal(rows.length, expected.length);
    for (const asset of expected) {
      const row = rows.find((a) => a.slug === asset.key.slice(8));
      assert.ok(row, asset.key);
      assert.equal(row.cover_url, asset.url);
      assert.equal(row.hero_image, asset.url);
    }
    assert.equal(new Set(rows.map((r) => r.cover_url)).size, rows.length);
  });

  await t.test('existing custom uploads survive while nested legacy defaults are replaced', async () => {
    await srv.sql("UPDATE articles SET cover_url='/uploads/custom-cover.webp', hero_image='/uploads/custom-hero.webp' WHERE slug='ar-thin-battery'");
    await srv.sql(`UPDATE pages SET sections = '{"nested":{"image":"/assets/img/seed/photo-1593642634443-44adaa06623a.jpg","custom":"/uploads/customer.webp"}}'::jsonb WHERE slug='home'`);
    await srv.sql(migration);
    const article = JSON.parse(await srv.sql("SELECT row_to_json(t) FROM (SELECT cover_url, hero_image FROM articles WHERE slug='ar-thin-battery') t"));
    assert.equal(article.cover_url, '/uploads/custom-cover.webp');
    assert.equal(article.hero_image, '/uploads/custom-hero.webp');
    const sections = JSON.parse(await srv.sql("SELECT sections FROM pages WHERE slug='home'"));
    assert.equal(sections.nested.image, '/assets/img/generated/home-battery-range.webp');
    assert.equal(sections.nested.custom, '/uploads/customer.webp');
  });

  await t.test('reapplying the migration preserves selected images', async () => {
    const snapshot = () => srv.sql('SELECT json_agg(t) FROM (SELECT slug,cover_url,hero_image FROM articles ORDER BY slug) t');
    const before = await snapshot();
    await srv.sql(migration);
    assert.equal(await snapshot(), before);
  });
});
