// Saving an article from the admin editor.
//
// PUT /api/articles/:id had no test at all, and it was returning 500 on
// every call: Postgres deduces a parameter's type from how it is used,
// and $14 was used twice — `status = $14` (character varying) and
// `$14 = 'published'` (text). Two deductions for one parameter is a
// parse error, 42P08, so the save never reached the database. Nothing
// caught it because nothing exercised the endpoint.
//
// The second test here guards the other half of the same incident: a
// column declared only in schema.sql does not exist in production,
// because a deployment restarts the app and schema.sql only runs under
// `npm run db:init`.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { startServer } = require('./helpers/server');

const ROOT = path.join(__dirname, '..');

test('article save', async (t) => {
  const srv = await startServer({ seed: true });
  t.after(() => srv.stop());

  await srv.request('/api/auth/login', {
    method: 'POST',
    json: { email: 'admin@example.test', password: 'a-strong-password-2026' },
  });

  const id = Number(await srv.sql(`SELECT id FROM articles ORDER BY id LIMIT 1`));

  await t.test('a draft save round-trips', async () => {
    const res = await srv.request('/api/articles/' + id, {
      method: 'PUT',
      json: {
        title: 'Edited title', excerpt: 'Edited excerpt',
        content: '<p>Edited body</p>', status: 'draft', reading_minutes: 7,
      },
    });
    assert.equal(res.status, 200, `save failed: ${res.text}`);

    const row = await srv.sql(
      `SELECT title || '|' || status || '|' || reading_minutes FROM articles WHERE id=${id}`);
    assert.equal(row, 'Edited title|draft|7');
  });

  await t.test('publishing sets published_at once and does not move it', async () => {
    await srv.sql(`UPDATE articles SET published_at = NULL, status='draft' WHERE id=${id}`);

    const pub = await srv.request('/api/articles/' + id, {
      method: 'PUT',
      json: { title: 'Edited title', content: '<p>x</p>', status: 'published' },
    });
    assert.equal(pub.status, 200, pub.text);

    const first = await srv.sql(`SELECT published_at FROM articles WHERE id=${id}`);
    assert.ok(first, 'publishing did not stamp published_at');

    // The COALESCE exists so a later edit keeps the original date. That
    // is the behaviour the doubled $14 was there to provide, so it is
    // worth pinning now that the parameter is cast.
    const again = await srv.request('/api/articles/' + id, {
      method: 'PUT',
      json: { title: 'Edited title', content: '<p>y</p>', status: 'published' },
    });
    assert.equal(again.status, 200);
    assert.equal(await srv.sql(`SELECT published_at FROM articles WHERE id=${id}`), first,
      're-saving a published article moved its publication date');
  });

  await t.test('citations survive a save and a save without them clears them', async () => {
    const withCites = await srv.request('/api/articles/' + id, {
      method: 'PUT',
      json: {
        title: 'Edited title', content: '<p>x</p>', status: 'draft',
        citations: [{ label: 'IEC 62133-2', url: 'https://webstore.iec.ch/', publisher: 'IEC' }],
      },
    });
    assert.equal(withCites.status, 200, withCites.text);
    assert.equal(
      await srv.sql(`SELECT citations->0->>'label' FROM articles WHERE id=${id}`),
      'IEC 62133-2');

    // A non-http citation must not be stored, at the write boundary as
    // well as at the render one.
    const bad = await srv.request('/api/articles/' + id, {
      method: 'PUT',
      json: {
        title: 'Edited title', content: '<p>x</p>', status: 'draft',
        citations: [{ label: 'x', url: 'javascript:alert(1)' }],
      },
    });
    assert.equal(bad.status, 200);
    assert.equal(await srv.sql(`SELECT jsonb_array_length(citations) FROM articles WHERE id=${id}`), '0');
  });

  await t.test('a fresh AI draft can be saved straight after creation', async () => {
    // The reported sequence: generate, save as draft, land on the editor,
    // press save — and get a 500. Walk the same path.
    const draft = await srv.request('/api/ai-generate/save-draft', {
      method: 'POST',
      json: { slug: 'save-path-check', title: 'Save path check', content: '<p>body</p>' },
    });
    assert.equal(draft.status, 200, draft.text);

    const edit = await srv.request('/api/articles/' + draft.json.id, {
      method: 'PUT',
      json: { title: 'Save path check', content: '<p>edited</p>', status: 'published' },
    });
    assert.equal(edit.status, 200, `editing a fresh AI draft failed: ${edit.text}`);
  });
});

test('boot migrations cover every column schema.sql adds', () => {
  // schema.sql carries an "idempotent migrations for existing
  // deployments" block of ALTER TABLE ... ADD COLUMN IF NOT EXISTS. Those
  // lines exist because a database created before the column needs it
  // added — but schema.sql only runs under `npm run db:init`, and a
  // deployment that restarts the app never calls that. autoMigrate() in
  // index.js is what actually runs on boot, so anything in that block
  // needs a twin there or the column simply never appears in production.
  //
  // That is how `citations` shipped: declared in schema.sql, absent from
  // autoMigrate, and every article save 500ing on a production box while
  // passing locally, because locally db:init had been run.
  const schema = fs.readFileSync(path.join(ROOT, 'server', 'db', 'schema.sql'), 'utf8');
  const index = fs.readFileSync(path.join(ROOT, 'server', 'index.js'), 'utf8');

  const alterRe = /ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+(\w+)/gi;
  const inSchema = [...schema.matchAll(alterRe)].map((m) => `${m[1]}.${m[2]}`.toLowerCase());

  // A column counts as covered if autoMigrate either ALTERs it in or
  // declares it in a CREATE TABLE IF NOT EXISTS — mail_outbox is built
  // that way, and only checking ALTERs reports its whole column list as
  // missing when it is not.
  const inBoot = new Set(
    [...index.matchAll(alterRe)].map((m) => `${m[1]}.${m[2]}`.toLowerCase())
  );
  const createRe = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)\s*\(([\s\S]*?)\n\s*\)/gi;
  for (const m of index.matchAll(createRe)) {
    const table = m[1].toLowerCase();
    for (const line of m[2].split('\n')) {
      const col = line.trim().match(/^(\w+)\s+\w/);
      // Skip table-level constraint clauses, which are not columns.
      if (col && !/^(primary|foreign|unique|check|constraint)$/i.test(col[1])) {
        inBoot.add(`${table}.${col[1].toLowerCase()}`);
      }
    }
  }

  assert.ok(inSchema.length > 0, 'no ADD COLUMN statements found in schema.sql');

  const missing = [...new Set(inSchema)].filter((c) => !inBoot.has(c));
  assert.deepEqual(missing, [],
    'these columns are added by schema.sql but not by autoMigrate() in index.js, '
    + 'so they will be missing on any deployment that restarts without running '
    + `db:init: ${missing.join(', ')}`);
});
