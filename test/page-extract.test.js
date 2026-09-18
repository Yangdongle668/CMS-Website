// Phase 3 of docs/ARCHITECTURE_BLOCKS.md: hand-authored pages become blocks.
//
// Phase 2 was a copy between typed columns. This one reads content out of
// markup, so it can lose things — and the only responsible way to run it is to
// prove it did not. These tests are mostly about that proof: that the extractor
// refuses rather than guesses, and that a converted page still says everything
// it said before.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { startServer } = require('./helpers/server');
const { toPlainText } = require('../server/utils/html-sanitize');

const execFileAsync = promisify(execFile);
const SCRIPT = path.join(__dirname, '..', 'scripts', 'extract-page-blocks.js');

const visible = (html) => toPlainText(String(html).replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' '));

// The part of a source file a conversion is responsible for: hero plus body
// mount, minus the breadcrumbs the shared header rebuilds.
function convertedRegion(html) {
  const hero = (html.match(/<section\b[^>]*class="[^"]*\bpage-hero\b[^"]*"[^>]*>[\s\S]*?<\/section>/i) || [''])[0]
    .replace(/<div\b[^>]*class="[^"]*\bbreadcrumbs\b[^"]*"[^>]*>[\s\S]*?<\/div>/i, '');
  const body = (html.match(/<div\b[^>]*\sdata-page-body\b[^>]*>([\s\S]*?)<\/div>\s*<\/main>/i) || ['', ''])[1];
  return hero + ' ' + body;
}

async function extract(srv, args) {
  return execFileAsync('node', [SCRIPT, ...args], {
    env: { ...process.env, PGDATABASE: srv.db },
    maxBuffer: 8 * 1024 * 1024,
  });
}

test('page extraction', async (t) => {
  const srv = await startServer({ seed: true });
  t.after(() => srv.stop());

  await t.test('a dry run writes nothing', async () => {
    const { stdout } = await extract(srv, ['--all']);
    assert.match(stdout, /dry run/);
    const n = await srv.sql('SELECT count(*) FROM page_blocks WHERE page_id IS NOT NULL');
    assert.equal(n, '0', 'no blocks were created');
  });

  // The regression this file exists for. The words check cannot see an element
  // vanish: a stripped <form> leaves its labels behind as plain text, so every
  // word survives and the page is still broken. That shipped once, taking the
  // RFQ and DSAR forms with it, and eleven FAQ accordions besides.
  await t.test('it refuses a page whose interactive elements it would strip', async () => {
    const { stdout } = await extract(srv, ['--all']);
    assert.match(stdout, /contact\.html\s+REFUSED.*<form>/, 'the RFQ page must not be converted to prose');
    assert.match(stdout, /gdpr\.html\s+REFUSED.*<form>/, 'nor the DSAR page');
  });

  await t.test('disclosure widgets survive conversion', async () => {
    // Eleven pages build their FAQ out of <details>/<summary>. Dropping them
    // left the text readable and the accordions dead — visible to a person,
    // invisible to a word count.
    const { sanitizeHtml } = require('../server/utils/html-sanitize');
    const out = sanitizeHtml('<details><summary>Q</summary><p>A</p></details>');
    assert.match(out, /<details>/);
    assert.match(out, /<summary>/);
  });

  await t.test('inert hook attributes survive conversion', async () => {
    const { sanitizeHtml } = require('../server/utils/html-sanitize');
    const out = sanitizeHtml('<div data-contact-form aria-label="x" role="form" onclick="e()">y</div>');
    assert.match(out, /data-contact-form/, 'scripts find their elements by these');
    assert.match(out, /aria-label="x"/);
    assert.match(out, /role="form"/);
    assert.doesNotMatch(out, /onclick/, 'handlers still go');
  });

  await t.test('it refuses a page whose text it cannot reproduce', async () => {
    const { stdout } = await extract(srv, ['--all']);
    // blog/index.html is a listing the browser drives — search box, filter
    // chips, pagination — and prose cannot carry any of it. A refusal is the
    // correct outcome; the alternative is a page that quietly does less than
    // it did.
    assert.match(stdout, /REFUSED/, 'at least one page must be refused');
  });

  // The two layouts that earned their own block type rather than being flattened
  // into prose. Both carry elements the sanitiser refuses in operator copy — a
  // slider's arrows are <button>s — which is the refusal working as designed:
  // the block file owns the markup, the operator owns the content.
  await t.test('bespoke homepage layouts convert to typed blocks', async () => {
    const { stdout } = await extract(srv, ['index.html']);
    assert.match(stdout, /index\.html\s+->.*slide_deck/, 'the carousel keeps its type');
    assert.match(stdout, /index\.html\s+->.*article_list/, 'so does the insights grid');
    assert.doesNotMatch(stdout, /index\.html\s+REFUSED/);
  });

  await t.test('conversion preserves every word of the converted region', async () => {
    await extract(srv, ['--all', '--write', '--create-pages']);

    // Check the pages that converted, comparing the source region against what
    // the server actually returns.
    const pages = ['terms.html', 'privacy.html', 'faq.html', 'solutions/design.html', 'applications/medical.html'];
    for (const rel of pages) {
      const src = fs.readFileSync(path.join(__dirname, '..', 'public', rel), 'utf8');
      const want = visible(convertedRegion(src)).split(' ').filter(Boolean);
      const res = await srv.request('/' + rel);
      assert.equal(res.status, 200, `${rel} should still render`);
      const got = new Set(visible(res.text).split(' ').filter(Boolean));
      const missing = want.filter((w) => !got.has(w));
      assert.equal(missing.length, 0, `${rel} lost: ${missing.slice(0, 8).join(' ')}`);
    }
  });

  await t.test('a converted page renders from blocks, not from its markup', async () => {
    const res = await srv.request('/terms.html');
    assert.ok((res.text.match(/data-block=/g) || []).length >= 2, 'blocks are in the output');
  });

  await t.test('a refused page is left exactly as it was', async () => {
    const res = await srv.request('/contact.html');
    assert.equal(res.status, 200);
    assert.equal((res.text.match(/data-block=/g) || []).length, 0, 'the RFQ page still renders its own markup');
    // What the refusal is protecting, stated as the test rather than implied.
    assert.match(res.text, /<form\b/, 'the RFQ form is still a form');
    assert.ok((res.text.match(/<input\b/g) || []).length >= 4, 'with its fields');
  });

  await t.test('the converted homepage keeps its carousel and its insight cards', async () => {
    const res = await srv.request('/');
    assert.equal(res.status, 200);
    assert.match(res.text, /data-block="slide_deck"/);
    assert.match(res.text, /data-block="article_list"/);
    const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
    const slides = (src.match(/class="tesla-slide"/g) || []).length;
    assert.ok(slides > 0, 'the source really does have slides');
    assert.equal((res.text.match(/class="tesla-slide"/g) || []).length, slides, 'every slide survives');
    // The trailing link belongs to the block now, so it has to come out the
    // other side — it is the last thing the word check caught going missing.
    assert.match(res.text, /class="news-link">Browse all insights/);
  });

  await t.test('re-running without --force does not clobber existing blocks', async () => {
    const before = await srv.sql('SELECT count(*) FROM page_blocks WHERE page_id IS NOT NULL');
    const { stdout } = await extract(srv, ['--all', '--write']);
    assert.match(stdout, /already has \d+ block\(s\)/);
    const after = await srv.sql('SELECT count(*) FROM page_blocks WHERE page_id IS NOT NULL');
    assert.equal(after, before, 'the block count is unchanged');
  });

  await t.test('deleting a page’s blocks restores its original markup', async () => {
    const pageId = await srv.sql(`SELECT id FROM pages WHERE slug = 'terms'`);
    await srv.sql(`DELETE FROM page_blocks WHERE page_id = ${pageId}`);
    const res = await srv.request('/terms.html');
    assert.equal(res.status, 200);
    assert.equal((res.text.match(/data-block=/g) || []).length, 0);
    // The source file was never edited, so its own sections are back.
    assert.match(res.text, /Acceptance/, 'the authored content renders again');
  });
});
