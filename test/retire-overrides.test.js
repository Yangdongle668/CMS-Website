// Phase 4 of docs/ARCHITECTURE_BLOCKS.md: the text-override layer is gone.
//
// An override was a global find-and-replace over rendered HTML, stored in
// settings.text_overrides and applied on the way out. Blocks replace it: text
// lives in the block that owns it, so an edit changes the one place it meant.
//
// Deleting the code that applies overrides would not delete the data, though —
// it would just stop it applying, and every edit an operator made that way
// would silently revert. These tests are about the script that prevents that:
// it bakes the substitutions into the rows first, names anything it cannot
// place instead of dropping it, and keeps the original map.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { startServer } = require('./helpers/server');

const execFileAsync = promisify(execFile);
const SCRIPT = path.join(__dirname, '..', 'scripts', 'retire-text-overrides.js');

// The script exits non-zero by design when an override cannot be placed, so
// the failure has to be caught and inspected rather than thrown.
async function retire(srv, args = []) {
  try {
    const { stdout, stderr } = await execFileAsync('node', [SCRIPT, ...args], {
      env: { ...process.env, PGDATABASE: srv.db },
      maxBuffer: 8 * 1024 * 1024,
    });
    return { code: 0, out: stdout + stderr };
  } catch (err) {
    return { code: err.code ?? 1, out: (err.stdout || '') + (err.stderr || '') };
  }
}

const setOverrides = (srv, map) =>
  srv.sql(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('text_overrides', '${JSON.stringify(map).replace(/'/g, "''")}'::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  );

test('retiring text overrides', async (t) => {
  const srv = await startServer({ seed: true });
  t.after(() => srv.stop());

  const pageId = await srv.sql(
    `INSERT INTO pages (slug, title, hero_title) VALUES ('retire-test', 'T', 'Old Heading') RETURNING id`
  );
  await srv.sql(
    `INSERT INTO page_blocks (page_id, type, sort_order, data)
     VALUES (${pageId}, 'rich_text', 0, '{"html":"<p>Old Heading in prose</p>"}'::jsonb)`
  );

  await t.test('an empty map needs no migration', async () => {
    const { code, out } = await retire(srv);
    assert.equal(code, 0);
    assert.match(out, /nothing saved/);
  });

  await t.test('a dry run changes nothing', async () => {
    await setOverrides(srv, { 'Old Heading': 'New Heading' });
    const { out } = await retire(srv);
    assert.match(out, /dry run/);
    const still = await srv.sql(`SELECT hero_title FROM pages WHERE id = ${pageId}`);
    assert.equal(still, 'Old Heading', 'the row is untouched until --write');
  });

  await t.test('an override that matches nothing fails the run', async () => {
    // The whole point. A silent skip is the failure mode being removed, so the
    // script names the override and refuses rather than dropping it.
    await setOverrides(srv, { 'Nothing Matches This String': 'x' });
    const { code, out } = await retire(srv, ['--write']);
    assert.equal(code, 1, 'the run fails');
    assert.match(out, /matched nothing/);
    assert.match(out, /Nothing Matches This String/, 'and says which one');
    const kept = await srv.sql(`SELECT count(*) FROM settings WHERE key = 'text_overrides'`);
    assert.equal(kept, '1', 'the map is left in place for a second attempt');
  });

  await t.test('it bakes the substitution into the rows that own the text', async () => {
    await setOverrides(srv, { 'Old Heading': 'New Heading' });
    const { code, out } = await retire(srv, ['--write']);
    assert.equal(code, 0, out);

    assert.equal(
      await srv.sql(`SELECT hero_title FROM pages WHERE id = ${pageId}`),
      'New Heading',
      'the page column is rewritten'
    );
    assert.match(
      await srv.sql(`SELECT data->>'html' FROM page_blocks WHERE page_id = ${pageId}`),
      /New Heading in prose/,
      'and so is the block that carries the same words'
    );
  });

  await t.test('the original map is archived, not deleted', async () => {
    assert.equal(
      await srv.sql(`SELECT count(*) FROM settings WHERE key = 'text_overrides'`),
      '0',
      'the live key is gone so nothing re-applies'
    );
    const archived = await srv.sql(
      `SELECT value->'overrides'->>'Old Heading' FROM settings WHERE key = 'text_overrides_retired'`
    );
    assert.equal(archived, 'New Heading', 'what the operator asked for is still recoverable');
  });

  await t.test('the override endpoint is gone', async () => {
    const res = await srv.request('/api/text-overrides');
    assert.equal(res.status, 404, 'nothing can write a new override');
  });

  await t.test('pages still render', async () => {
    // The removal touched the final pass of every HTML response. A page that
    // 500s here is the regression that matters more than any of the above.
    for (const p of ['/', '/terms.html', '/faq.html', '/contact.html', '/blog/']) {
      const res = await srv.request(p);
      assert.equal(res.status, 200, `${p} should render`);
    }
  });
});
