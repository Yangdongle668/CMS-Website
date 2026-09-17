// Phase 2 of docs/ARCHITECTURE_BLOCKS.md: pillar pages driven by blocks.
//
// The claim under test is that the existing schema already had the right
// shape, so the migration is a copy rather than a reshaping — and that a
// migrated pillar renders the same content it did before.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { startServer } = require('./helpers/server');

const execFileAsync = promisify(execFile);

// Counts occurrences, not lines: the rendered page is mostly one long line.
const count = (html, needle) => html.split(needle).length - 1;

function fingerprint(html) {
  return {
    specCells: count(html, '<td>'),
    variants: count(html, 'class="feat-item"'),
    customisation: count(html, 'class="cust-item"'),
    applications: count(html, 'class="app-card"'),
    certifications: count(html, 'class="cert-chip"'),
    faq: count(html, '<summary'),
  };
}

test('pillar blocks', async (t) => {
  const srv = await startServer({ seed: true });
  t.after(() => srv.stop());

  const slug = await srv.sql(`SELECT slug FROM pillar_pages ORDER BY sort_order, id LIMIT 1`);
  assert.ok(slug, 'the seed provides at least one pillar');

  let before;
  await t.test('a pillar without blocks renders from its columns', async () => {
    const res = await srv.request('/products/' + slug);
    assert.equal(res.status, 200);
    before = fingerprint(res.text);
    assert.ok(before.specCells > 0, 'the legacy render produces a spec table');
    assert.equal(count(res.text, 'data-block='), 0, 'no blocks yet');
    assert.ok(count(res.text, 'data-legacy-section') > 0, 'the legacy sections are present');
  });

  await t.test('the migration maps every section without validation errors', async () => {
    const { stdout } = await execFileAsync(
      'node',
      [path.join(__dirname, '..', 'scripts', 'migrate-pillars-to-blocks.js'), '--write'],
      { env: { ...process.env, PGDATABASE: srv.db } }
    );
    assert.doesNotMatch(stdout, /^\s*!/m, 'a "!" line means existing data did not fit a block schema');
    assert.match(stdout, /8 block\(s\)/, 'eight sections per pillar');

    const rows = await srv.sql(
      `SELECT string_agg(type, ',' ORDER BY sort_order) FROM page_blocks
       WHERE pillar_id = (SELECT id FROM pillar_pages WHERE slug = '${slug}')`
    );
    assert.equal(
      rows,
      'overview,variant_grid,spec_table,application_grid,customization,manufacturing,certification_wall,faq'
    );
  });

  await t.test('the migrated pillar renders the same content', async () => {
    const res = await srv.request('/products/' + slug);
    assert.equal(res.status, 200);
    const after = fingerprint(res.text);
    assert.deepEqual(after, before, 'block output must match what the columns produced');
    assert.equal(count(res.text, 'data-block='), 8, 'eight blocks rendered');
  });

  await t.test('the legacy sections are gone once blocks take over', async () => {
    const res = await srv.request('/products/' + slug);
    assert.equal(
      count(res.text, '<section data-legacy-section'),
      0,
      'leaving them would render every section twice'
    );
  });

  await t.test('structured data is not duplicated', async () => {
    const res = await srv.request('/products/' + slug);
    // Count the real ld+json documents, not every occurrence of the string:
    // products/_template.html also builds JSON-LD client-side, so its inline
    // script contains the literal text too.
    const docs = (res.text.match(/<script type="application\/ld\+json"[\s\S]*?<\/script>/g) || []);
    const faqDocs = docs.filter((d) => d.includes('"@type":"FAQPage"'));
    // The pillar's own graph already emits FAQPage from pillar_pages.faq, so a
    // second one from the block would be a Search Console warning on a site
    // whose whole thesis is structured data.
    assert.equal(faqDocs.length, 1, `expected one FAQPage document, found ${faqDocs.length}`);
  });

  await t.test('re-running the migration is a no-op', async () => {
    const { stdout } = await execFileAsync(
      'node',
      [path.join(__dirname, '..', 'scripts', 'migrate-pillars-to-blocks.js'), '--write'],
      { env: { ...process.env, PGDATABASE: srv.db } }
    );
    assert.match(stdout, /skip/, 'a pillar that already has blocks is skipped');
    assert.match(stdout, /created 0 block\(s\)/);
  });

  await t.test('the pillar columns are untouched, so rollback is deleting rows', async () => {
    const stillThere = await srv.sql(
      `SELECT (jsonb_array_length(faq) > 0)::text FROM pillar_pages WHERE slug = '${slug}'`
    );
    assert.equal(stillThere, 'true');

    await srv.sql(
      `DELETE FROM page_blocks WHERE pillar_id = (SELECT id FROM pillar_pages WHERE slug = '${slug}')`
    );
    const res = await srv.request('/products/' + slug);
    assert.deepEqual(fingerprint(res.text), before, 'the legacy render comes back unchanged');
  });

  await t.test('blocks can be attached to a pillar through the API', async () => {
    await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'editor@example.test', password: 'a-strong-password-2026' },
    });
    const pillarId = Number(await srv.sql(`SELECT id FROM pillar_pages WHERE slug = '${slug}'`));

    const res = await srv.request(`/api/blocks/pillar/${pillarId}`, {
      method: 'POST',
      json: { type: 'overview', data: { title: 'Added via API', body: '<p>Body.</p>' } },
    });
    assert.equal(res.status, 200);

    const list = await srv.request(`/api/blocks/pillar/${pillarId}`);
    assert.equal(list.status, 200);
    assert.equal(list.json.owner, 'pillar');
    assert.equal(list.json.items.length, 1);

    assert.equal(
      (await srv.request('/api/blocks/pillar/999999')).status,
      404,
      'a block cannot be attached to a pillar that does not exist'
    );
  });

  await t.test('a block belongs to exactly one owner', async () => {
    const pillarId = Number(await srv.sql(`SELECT id FROM pillar_pages WHERE slug = '${slug}'`));
    const pageId = Number(
      await srv.sql(
        `INSERT INTO pages (slug, title, status) VALUES ('owner-check', 'x', 'published') RETURNING id`
      )
    );
    let threw = false;
    try {
      await srv.sql(
        `INSERT INTO page_blocks (page_id, pillar_id, type, data)
         VALUES (${pageId}, ${pillarId}, 'overview', '{}'::jsonb)`
      );
    } catch (err) {
      threw = /page_blocks_one_owner/.test(err.message);
    }
    assert.ok(threw, 'the database refuses a block owned by both a page and a pillar');

    let threwNone = false;
    try {
      await srv.sql(`INSERT INTO page_blocks (type, data) VALUES ('overview', '{}'::jsonb)`);
    } catch (err) {
      threwNone = /page_blocks_one_owner/.test(err.message);
    }
    assert.ok(threwNone, 'and refuses one owned by nothing');
  });
});
