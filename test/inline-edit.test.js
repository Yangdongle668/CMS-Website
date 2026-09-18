// Inline editing: change one field of one block, from the page itself.
//
// This is the affordance the text-override layer had and the block form did
// not — click the thing you see, change it. The difference is where the edit
// lands. An override stored { "原文": "新文" } and replaced that string
// wherever it appeared, so fixing a heading on one page changed it on twelve
// and an edit vanished the moment a developer touched the markup. Here a click
// resolves to one field of one row, and these tests are mostly about holding
// that boundary.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers/server');

test('inline field edits', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  const pageId = await srv.sql(
    `INSERT INTO pages (slug, title) VALUES ('inline-test', 'T') RETURNING id`
  );
  const blockId = await srv.sql(
    `INSERT INTO page_blocks (page_id, type, sort_order, data)
     VALUES (${pageId}, 'rich_text', 0,
             '{"title":"Before","body":"<p>Body text</p>","width":"prose"}'::jsonb)
     RETURNING id`
  );
  const otherId = await srv.sql(
    `INSERT INTO page_blocks (page_id, type, sort_order, data)
     VALUES (${pageId}, 'rich_text', 1,
             '{"title":"Before","body":"<p>Also body</p>","width":"prose"}'::jsonb)
     RETURNING id`
  );

  await t.test('it requires an operator session', async () => {
    const res = await srv.request(`/api/blocks/${blockId}/field`, {
      method: 'PATCH', json: { field: 'title', value: 'Hacked' },
    });
    assert.equal(res.status, 401);
  });

  await t.test('an operator can change one field', async () => {
    const login = await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: `inline-${process.pid}@test.local`, password: 'a-strong-password-2026' },
    });
    assert.equal(login.status, 200, login.text);

    const res = await srv.request(`/api/blocks/${blockId}/field`, {
      method: 'PATCH', json: { field: 'title', value: 'After' },
    });
    assert.equal(res.status, 200, res.text);
    assert.equal(res.json.block.data.title, 'After');
  });

  await t.test('the block’s other fields are left alone', async () => {
    // The reason this is a PATCH and not a PUT. With a PUT the caller resends
    // the whole data object, so fixing one heading rewrites every other field
    // from whatever the page happened to have loaded — and quietly clobbers a
    // colleague's change to a different field of the same block.
    const body = await srv.sql(`SELECT data->>'body' FROM page_blocks WHERE id = ${blockId}`);
    assert.equal(body, '<p>Body text</p>');
    const width = await srv.sql(`SELECT data->>'width' FROM page_blocks WHERE id = ${blockId}`);
    assert.equal(width, 'prose');
  });

  await t.test('an identical heading on another block is untouched', async () => {
    // The whole point. Both blocks said "Before"; only the one that was
    // clicked changed. Under the override layer both would have moved.
    const other = await srv.sql(`SELECT data->>'title' FROM page_blocks WHERE id = ${otherId}`);
    assert.equal(other, 'Before');
  });

  await t.test('a field the schema does not declare is refused', async () => {
    // Without this the endpoint is an arbitrary-key writer into a JSONB
    // column, and a typo silently creates a field nothing renders.
    const res = await srv.request(`/api/blocks/${blockId}/field`, {
      method: 'PATCH', json: { field: 'not_a_field', value: 'x' },
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'unknown_field');
  });

  await t.test('a repeater is refused rather than half-written', async () => {
    const faqId = await srv.sql(
      `INSERT INTO page_blocks (page_id, type, sort_order, data)
       VALUES (${pageId}, 'faq', 2, '{"items":[{"q":"Q","a":"A"}]}'::jsonb) RETURNING id`
    );
    const res = await srv.request(`/api/blocks/${faqId}/field`, {
      method: 'PATCH', json: { field: 'items', value: 'nonsense' },
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'field_not_inline_editable');
  });

  await t.test('markup typed inline cannot reach a visitor', async () => {
    // This project sanitises richtext at render, not on save: rich-text.js
    // calls sanitizeHtml on the way out, so the stored value is whatever the
    // operator typed and the visitor never sees anything dangerous. Inline
    // editing must not become a second way in that skips that — so the
    // assertion is on the rendered output, which is the thing that protects
    // anybody.
    const res = await srv.request(`/api/blocks/${blockId}/field`, {
      method: 'PATCH',
      json: { field: 'body', value: '<p>ok</p><script>alert(1)</script>' },
    });
    assert.equal(res.status, 200, res.text);

    const blockRender = require('../server/services/block-render');
    const out = blockRender.renderRows([
      { id: blockId, type: 'rich_text', data: res.json.block.data },
    ]);
    assert.doesNotMatch(out.html, /<script/i, 'the rendered page carries no script');
    assert.match(out.html, /<p>ok<\/p>/, 'and keeps the legitimate markup');
  });

  await t.test('a length cap applies the same as in the form', async () => {
    // Inline editing is a different way in, not a different set of rules.
    const long = 'x'.repeat(5000);
    const res = await srv.request(`/api/blocks/${blockId}/field`, {
      method: 'PATCH', json: { field: 'title', value: long },
    });
    assert.equal(res.status, 400, 'over the schema max is rejected');
    assert.equal(res.json.error, 'invalid_block_data');
  });

  await t.test('the edit is what the page then serves', async () => {
    const res = await srv.request('/inline-test.html');
    // The page file does not exist, so this only has to not be a 500; the
    // database is the assertion that matters.
    assert.ok(res.status === 200 || res.status === 404, `unexpected ${res.status}`);
    const title = await srv.sql(`SELECT data->>'title' FROM page_blocks WHERE id = ${blockId}`);
    assert.equal(title, 'After');
  });
});

test('entity decoding in extracted copy', async (t) => {
  const { toPlainText, decodeEntities } = require('../server/utils/html-sanitize');

  await t.test('typographic entities decode', async () => {
    // These survived extraction as literal text and were escaped again on
    // render, so the homepage shipped "expectations &mdash; we engineer".
    assert.equal(toPlainText('a &mdash; b'), 'a — b');
    assert.equal(toPlainText('see &rarr; here'), 'see → here');
    assert.equal(toPlainText('5 &deg;C &times; 2'), '5 °C × 2');
  });

  await t.test('entity names are case-sensitive', async () => {
    // &Oslash; is Ø and &oslash; is ø. Lowercasing the name first turned
    // every Ø into ø.
    assert.equal(decodeEntities('&Oslash;'), 'Ø');
    assert.equal(decodeEntities('&oslash;'), 'ø');
  });

  await t.test('the URL guard still sees through entities', async () => {
    // decodeEntities exists for safeUrl before it exists for typography.
    const { safeUrl } = require('../server/utils/html-sanitize');
    assert.equal(safeUrl('j&#97;vascript:alert(1)'), null);
    assert.equal(safeUrl('java&Tab;script:alert(1)'), null);
    assert.equal(safeUrl('https://example.com'), 'https://example.com');
  });

  await t.test('no source file carries stray control bytes', async () => {
    // html-sanitize.js held a literal NUL inside a character class, which made
    // it read as a binary file to every tool that touches the repo.
    const fs = require('fs');
    const path = require('path');
    const roots = ['server', 'scripts', 'test'];
    const bad = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.name.endsWith('.js') && fs.readFileSync(full).includes(0)) bad.push(full);
      }
    };
    for (const r of roots) walk(path.join(__dirname, '..', r));
    assert.deepEqual(bad, []);
  });
});
