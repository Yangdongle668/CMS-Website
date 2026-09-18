// The block editor's preview mode.
//
// The editor shipped as a list of forms, and the operator's verdict was that it
// was worse than the click-to-edit override layer it replaced: hard to change
// anything, nothing visual, and no way to tell which row was which — six of the
// homepage's nine blocks are rich_text and every one of them read "正文内容".
// That was a fair reading. A typed block registry buys structured data and
// per-page edits, but none of that pays for an editor an operator cannot use.
//
// So the page renders with each block tagged by the row that produced it, and
// /admin/blocks.html shows the real page with those tags made clickable. These
// tests cover the half that can break silently: who is allowed to see the tags,
// and whether public output is affected.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers/server');

test('block editor preview', async (t) => {
  const srv = await startServer({ seed: true });
  t.after(() => srv.stop());

  // A page with blocks to look at.
  const pageId = await srv.sql(
    `INSERT INTO pages (slug, title) VALUES ('terms', 'Terms') RETURNING id`
  ).catch(() => srv.sql(`SELECT id FROM pages WHERE slug = 'terms'`));
  await srv.sql(
    `INSERT INTO page_blocks (page_id, type, sort_order, data)
     VALUES (${pageId}, 'rich_text', 0, '{"title":"Preview probe","body":"<p>body</p>"}'::jsonb)`
  );

  await t.test('an ordinary request carries no editing markup', async () => {
    const res = await srv.request('/terms.html');
    assert.equal(res.status, 200);
    assert.doesNotMatch(res.text, /data-block-id=/, 'public HTML must not change');
    assert.doesNotMatch(res.text, /cms-edit-bridge/);
  });

  await t.test('an anonymous visitor cannot ask for it', async () => {
    // The flag says what is wanted; the session says whether it is allowed.
    // Without the session check, anyone could read internal row ids off a
    // public page and get an editing overlay on it.
    const res = await srv.request('/terms.html?__edit=1');
    assert.equal(res.status, 200, 'the page still renders');
    assert.doesNotMatch(res.text, /data-block-id=/, 'but without block ids');
    assert.doesNotMatch(res.text, /cms-edit-bridge/, 'and without the bridge');
  });

  await t.test('an operator gets tagged blocks and the bridge', async () => {
    const login = await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: `editor-${process.pid}@test.local`, password: 'a-strong-password-2026' },
    });
    assert.equal(login.status, 200, login.text);

    const res = await srv.request('/terms.html?__edit=1');
    assert.equal(res.status, 200);
    assert.match(res.text, /data-block-id="\d+"/, 'blocks carry their row id');
    assert.match(res.text, /data-block-type="rich_text"/, 'and their type');
    assert.match(res.text, /cms-edit-bridge/, 'the click bridge is injected');
    assert.match(res.text, /Preview probe/, 'and the block still renders its content');
  });

  await t.test('tagging does not wrap or restructure the block', async () => {
    // The id goes on the opening tag the block already emits. Wrapping it in
    // an extra element would change what the site's own CSS selects against
    // (`.section + .section`, `:first-child`, grids that count children), so
    // the preview would stop looking like the page it is previewing.
    const plain = await srv.request('/terms.html');
    const edit = await srv.request('/terms.html?__edit=1');
    const tagCount = (s) => (s.match(/<section\b/g) || []).length;
    assert.equal(tagCount(edit.text), tagCount(plain.text),
      'the same elements, with an extra attribute — not an extra element');
  });

  await t.test('a logged-out operator loses it again', async () => {
    srv.clearCookie();
    const res = await srv.request('/terms.html?__edit=1');
    assert.doesNotMatch(res.text, /data-block-id=/);
  });
});
