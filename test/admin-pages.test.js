// Structural checks on the admin pages.
//
// These exist because /admin/blocks.html shipped broken and stayed broken: it
// called bootShell() but had no <div data-admin-shell> for renderShell to fill,
// so renderShell returned undefined, bootShell handed back an object with no
// `content`, and the first render threw
//
//   Cannot set properties of undefined (setting 'innerHTML')
//
// before the page drew anything. The block editor — the replacement for the
// override machinery this branch removed — had never once been opened.
//
// The lesson is not "check blocks.html". It is that an admin page has a
// contract with admin.js that nothing enforced, so any new page could break the
// same way. These are cheap static checks over the files, no browser and no
// database, so they run everywhere the suite runs.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ADMIN_DIR = path.join(__dirname, '..', 'admin');
const pages = fs.readdirSync(ADMIN_DIR)
  .filter((f) => f.endsWith('.html'))
  .map((f) => ({ name: f, html: fs.readFileSync(path.join(ADMIN_DIR, f), 'utf8') }));

// A page "uses the shell" if it takes what bootShell returns and reads a
// property off it. visual-edit.html destructures bootShell from AdminAPI but
// deliberately renders its own toolbar and never calls it, so it is not bound
// by the contract — the test has to tell those two apart.
const usesShell = (p) => /const\s+shell\s*=\s*await\s+bootShell\s*\(/.test(p.html);

test('admin pages', async (t) => {
  await t.test('there are admin pages to check', () => {
    assert.ok(pages.length > 10, `found ${pages.length}`);
    assert.ok(pages.some(usesShell), 'at least one page boots the shell');
  });

  await t.test('every page that boots the shell provides its mount', () => {
    // renderShell() bails out returning undefined when [data-admin-shell] is
    // missing. bootShell then returns { user } with no content/actions, and the
    // page throws on first render. This is exactly how blocks.html broke.
    const missing = pages.filter(usesShell).filter((p) => !/data-admin-shell/.test(p.html));
    assert.deepEqual(missing.map((p) => p.name), [],
      'these pages call bootShell() but have no <div data-admin-shell> for it to fill');
  });

  await t.test('every page that boots the shell loads admin.js', () => {
    const missing = pages.filter(usesShell)
      .filter((p) => !/admin\/assets\/js\/admin\.js/.test(p.html));
    assert.deepEqual(missing.map((p) => p.name), [], 'bootShell comes from admin.js');
  });

  await t.test('shell.content and shell.actions are the only shell fields used', () => {
    // renderShell returns exactly { content, actions } (plus `user` from
    // bootShell). Reading anything else is a typo that only shows up at
    // runtime, on the page, in front of an operator.
    const allowed = new Set(['content', 'actions', 'user']);
    const bad = [];
    for (const p of pages) {
      for (const m of p.html.matchAll(/\bshell\.([a-zA-Z_$][\w$]*)/g)) {
        if (!allowed.has(m[1])) bad.push(`${p.name}: shell.${m[1]}`);
      }
    }
    assert.deepEqual(bad, []);
  });

  await t.test('every page loads the admin stylesheet', () => {
    const missing = pages.filter((p) => !/admin\/assets\/css\/admin\.css/.test(p.html));
    assert.deepEqual(missing.map((p) => p.name), []);
  });
});
