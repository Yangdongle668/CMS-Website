// The block system (docs/ARCHITECTURE_BLOCKS.md phase 1).
//
// The point of these is the model, not the three block types that happen to
// exist: a block renders from data server-side, a page without blocks is
// untouched, an unknown or broken block costs its own section and not the
// page, and the typed registry produces structured data that a free-form
// builder could not.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers/server');

async function login(srv) {
  await srv.request('/api/auth/login', {
    method: 'POST',
    json: { email: 'editor@example.test', password: 'a-strong-password-2026' },
  });
}

test('blocks', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());
  await login(srv);

  let pageId;
  await t.test('the registry exposes its types and their schemas', async () => {
    const res = await srv.request('/api/blocks/types');
    assert.equal(res.status, 200);
    const types = res.json.types.map((x) => x.type).sort();
    assert.deepEqual(types, ['cta_band', 'faq', 'hero', 'rich_text']);
    const faq = res.json.types.find((x) => x.type === 'faq');
    assert.equal(faq.schema.items.type, 'repeater', 'the schema drives the admin form');
    assert.ok(faq.schema.items.fields.q, 'repeater sub-fields are exposed');
  });

  await t.test('a page can be created to hold blocks', async () => {
    pageId = Number(
      await srv.sql(
        `INSERT INTO pages (slug, title, status) VALUES ('block-demo', 'Block demo', 'published')
         RETURNING id`
      )
    );
    assert.ok(pageId > 0);
  });

  await t.test('rejects an unknown block type', async () => {
    const res = await srv.request(`/api/blocks/page/${pageId}`, {
      method: 'POST',
      json: { type: 'not_a_real_block', data: {} },
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'unknown_block_type');
  });

  await t.test('rejects data that fails the block schema', async () => {
    const res = await srv.request(`/api/blocks/page/${pageId}`, {
      method: 'POST',
      json: { type: 'hero', data: { subtitle: 'no title given' } },
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'invalid_block_data');
    assert.match(res.json.details.join(' '), /title/, 'the error names the offending field');
  });

  const ids = {};
  await t.test('blocks can be added and land in order', async () => {
    const hero = await srv.request(`/api/blocks/page/${pageId}`, {
      method: 'POST',
      json: {
        type: 'hero',
        data: { title: 'Curved cells for wearables', subtitle: 'From 25 mAh', cta_text: 'Get a quote', cta_link: '/quote' },
      },
    });
    assert.equal(hero.status, 200);
    ids.hero = hero.json.block.id;

    const prose = await srv.request(`/api/blocks/page/${pageId}`, {
      method: 'POST',
      json: { type: 'rich_text', data: { title: 'Why curved', body: '<p>Because the cavity is <strong>fixed</strong>.</p>' } },
    });
    ids.prose = prose.json.block.id;

    const faq = await srv.request(`/api/blocks/page/${pageId}`, {
      method: 'POST',
      json: {
        type: 'faq',
        data: {
          title: 'Common questions',
          items: [
            { q: 'What is the minimum order?', a: '<p>3000 units for a custom shape.</p>' },
            { q: 'How long is tooling?', a: '<p>Around 25 days.</p>' },
          ],
        },
      },
    });
    ids.faq = faq.json.block.id;

    const list = await srv.request(`/api/blocks/page/${pageId}`);
    assert.deepEqual(list.json.items.map((b) => b.type), ['hero', 'rich_text', 'faq']);
    assert.deepEqual(list.json.items.map((b) => b.sort_order), [0, 1, 2]);
  });

  await t.test('reordering requires the complete list', async () => {
    const partial = await srv.request(`/api/blocks/page/${pageId}/order`, {
      method: 'PUT',
      json: { ids: [ids.faq] },
    });
    assert.equal(partial.status, 400, 'a partial order would strand the rest at stale positions');
  });

  await t.test('reordering rewrites sort_order', async () => {
    const res = await srv.request(`/api/blocks/page/${pageId}/order`, {
      method: 'PUT',
      json: { ids: [ids.faq, ids.hero, ids.prose] },
    });
    assert.equal(res.status, 200);
    const list = await srv.request(`/api/blocks/page/${pageId}`);
    assert.deepEqual(list.json.items.map((b) => b.type), ['faq', 'hero', 'rich_text']);
    // Put it back for the render tests below.
    await srv.request(`/api/blocks/page/${pageId}/order`, {
      method: 'PUT',
      json: { ids: [ids.hero, ids.prose, ids.faq] },
    });
  });

  await t.test('rich text is sanitised on the way in and out', async () => {
    const res = await srv.request(`/api/blocks/preview`, {
      method: 'POST',
      json: {
        type: 'rich_text',
        data: {
          body:
            '<p onclick="steal()">ok</p><script>alert(1)</script>' +
            '<a href="javascript:alert(1)">x</a><iframe src="//evil"></iframe>' +
            '<a href="/safe" target="_blank">y</a>',
        },
      },
    });
    assert.equal(res.status, 200);
    const html = res.json.html;
    assert.doesNotMatch(html, /<script/i, 'script elements are removed');
    assert.doesNotMatch(html, /onclick/i, 'event handlers are removed');
    assert.doesNotMatch(html, /javascript:/i, 'executing schemes are removed');
    assert.doesNotMatch(html, /<iframe/i, 'frames are removed');
    assert.match(html, /<p[^>]*>ok<\/p>/, 'ordinary prose survives');
    assert.match(html, /rel="noopener noreferrer"/, 'target=_blank gets rel added');
  });

  await t.test('the FAQ block produces FAQPage structured data', async () => {
    const res = await srv.request('/api/blocks/preview', {
      method: 'POST',
      json: {
        type: 'faq',
        data: { items: [{ q: 'Is it indexed?', a: '<p>Yes, <em>automatically</em>.</p>' }] },
      },
    });
    const ld = res.json.jsonLd[0];
    assert.equal(ld['@type'], 'FAQPage');
    assert.equal(ld.mainEntity[0]['@type'], 'Question');
    assert.equal(ld.mainEntity[0].name, 'Is it indexed?');
    assert.equal(
      ld.mainEntity[0].acceptedAnswer.text,
      'Yes, automatically.',
      'the answer is plain text — markup here is a Search Console warning'
    );
  });

  await t.test('blocks are anonymous to the public API', async () => {
    srv.clearCookie();
    for (const [method, path] of [
      ['GET', '/api/blocks/types'],
      ['GET', `/api/blocks/page/${pageId}`],
      ['POST', `/api/blocks/page/${pageId}`],
      ['DELETE', `/api/blocks/${ids.faq}`],
    ]) {
      const res = await srv.request(path, { method });
      assert.equal(res.status, 401, `${method} ${path} must require a session`);
    }
    await login(srv);
  });

  await t.test('a draft block is not rendered publicly', async () => {
    await srv.request(`/api/blocks/${ids.prose}`, {
      method: 'PUT',
      json: { status: 'draft', data: { title: 'Why curved', body: '<p>Hidden for now.</p>' } },
    });
    const published = await srv.sql(
      `SELECT count(*) FROM page_blocks WHERE page_id = ${pageId} AND status = 'published'`
    );
    assert.equal(published, '2');
    // Restore.
    await srv.request(`/api/blocks/${ids.prose}`, {
      method: 'PUT',
      json: { status: 'published', data: { title: 'Why curved', body: '<p>Because the cavity is fixed.</p>' } },
    });
  });

  await t.test('an unknown block type on a page is skipped, not fatal', async () => {
    await srv.sql(
      `INSERT INTO page_blocks (page_id, type, sort_order, data)
       VALUES (${pageId}, 'retired_block_type', 99, '{}'::jsonb)`
    );
    const list = await srv.request(`/api/blocks/page/${pageId}`);
    assert.equal(list.status, 200, 'the admin list still loads');
    assert.ok(list.json.items.some((b) => b.type === 'retired_block_type'));
    await srv.sql(`DELETE FROM page_blocks WHERE type = 'retired_block_type'`);
  });

  await t.test('deleting a block removes it', async () => {
    const res = await srv.request(`/api/blocks/${ids.faq}`, { method: 'DELETE' });
    assert.equal(res.status, 200);
    const list = await srv.request(`/api/blocks/page/${pageId}`);
    assert.ok(!list.json.items.some((b) => b.id === ids.faq));
    assert.equal((await srv.request(`/api/blocks/${ids.faq}`, { method: 'DELETE' })).status, 404);
  });

  // The end-to-end path: a static file opts in with <div data-blocks>, and the
  // page comes back rendered from the database. This is the phase-1
  // acceptance criterion from docs/ARCHITECTURE_BLOCKS.md.
  await t.test('a page with a data-blocks mount renders from the database', async () => {
    const fs = require('fs');
    const path = require('path');
    const file = path.join(__dirname, '..', 'public', '__block_render_test.html');
    fs.writeFileSync(
      file,
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>t</title></head>' +
        '<body data-page="render-test"><div data-blocks>' +
        '<p>STATIC FALLBACK</p></div></body></html>'
    );
    t.after(() => fs.rmSync(file, { force: true }));

    const pid = Number(
      await srv.sql(
        `INSERT INTO pages (slug, title, status)
         VALUES ('render-test', 'Render test', 'published') RETURNING id`
      )
    );

    // With no blocks configured the authored markup must survive untouched —
    // that is what allows pages to be converted one at a time.
    const before = await srv.request('/__block_render_test.html');
    assert.equal(before.status, 200);
    assert.match(before.text, /STATIC FALLBACK/, 'no blocks means no change');

    await srv.request(`/api/blocks/page/${pid}`, {
      method: 'POST',
      json: { type: 'hero', data: { title: 'Rendered from data' } },
    });
    await srv.request(`/api/blocks/page/${pid}`, {
      method: 'POST',
      json: { type: 'faq', data: { items: [{ q: 'Indexed?', a: '<p>Yes.</p>' }] } },
    });

    const after = await srv.request('/__block_render_test.html');
    assert.equal(after.status, 200);
    assert.doesNotMatch(after.text, /STATIC FALLBACK/, 'the mount point is replaced');
    assert.match(after.text, /Rendered from data/, 'hero content comes from the row');
    assert.match(after.text, /data-block="hero"[\s\S]*data-block="faq"/, 'in sort order');
    assert.match(after.text, /"@type":"FAQPage"/, 'the FAQ block emits its structured data');
  });

  await t.test('a block whose render throws costs its own section only', async () => {
    const pid = Number(await srv.sql(`SELECT id FROM pages WHERE slug = 'render-test'`));
    // A hero with no title renders to empty rather than throwing; the row below
    // has data its schema would reject, reaching render() only because it was
    // written directly. The page must still serve.
    await srv.sql(
      `INSERT INTO page_blocks (page_id, type, sort_order, data)
       VALUES (${pid}, 'faq', 50, '{"items": "not-an-array"}'::jsonb)`
    );
    const res = await srv.request('/__block_render_test.html');
    assert.equal(res.status, 200, 'a broken block must not take the page down');
    assert.match(res.text, /Rendered from data/, 'the other blocks still render');
  });
});
