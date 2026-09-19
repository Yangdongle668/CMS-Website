// Links inside article body copy.
//
// The stylesheet opens with `a { color: inherit; text-decoration: none }`,
// which is right for navigation, cards and buttons and wrong for prose:
// a link in an article rendered as the same near-black as the sentence
// around it, with no underline. The only rule these had was a :hover
// colour, so the sole way to find a link was to sweep the mouse across
// the paragraph. Every internal link added to the cluster was invisible
// to the reader it was added for.
//
// The second test here covers the other half of the same page: the
// References block was server-rendered and then destroyed by the
// client-side hydration, which rebuilds the body from `content` alone.
// A crawler saw the citations; a reader did not.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'public', 'styles.css'), 'utf8');
const tpl = fs.readFileSync(path.join(ROOT, 'public', 'blog', '_template.html'), 'utf8');

// WCAG relative luminance and contrast ratio.
function luminance(hex) {
  const c = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const cssVar = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{3,8})`, 'i'));
  assert.ok(m, `--${name} is not defined in styles.css`);
  return m[1];
};

test('article body links are visible', async (t) => {
  await t.test('they have a resting colour, not only a hover one', () => {
    // The bug was a rule that existed only as `.article-body a:hover`.
    const resting = css.match(/\.article-body a,[\s\S]{0,240}?\{([\s\S]*?)\}/);
    assert.ok(resting, 'no resting-state rule for .article-body a');
    assert.match(resting[1], /color:\s*var\(--link\)/,
      'the resting rule does not set a link colour');
  });

  await t.test('the link colour differs from body text', () => {
    const link = cssVar('link');
    const text = cssVar('text');
    assert.notEqual(link.toLowerCase(), text.toLowerCase(),
      'link colour is identical to body text — the original complaint');
    // Not just different, but different enough to read as a distinct
    // colour rather than a slightly-off black.
    assert.ok(contrast(link, text) > 1.8,
      `link and body text are too close: ${contrast(link, text).toFixed(2)}:1`);
  });

  await t.test('link and hover colours both clear WCAG AA on white', () => {
    for (const name of ['link', 'link-hover']) {
      const ratio = contrast(cssVar(name), '#ffffff');
      assert.ok(ratio >= 4.5,
        `--${name} is ${ratio.toFixed(2)}:1 against white, below the 4.5:1 minimum`);
    }
  });

  await t.test('the distinction does not rest on colour alone', () => {
    // A reader who cannot separate the two hues still needs to find the
    // link, so the underline is the part that carries the meaning.
    const resting = css.match(/\.article-body a,[\s\S]{0,240}?\{([\s\S]*?)\}/)[1];
    assert.match(resting, /text-decoration:\s*underline/);
  });

  await t.test('keyboard focus is visible', () => {
    assert.match(css, /\.article-body a:focus-visible[\s\S]{0,200}?outline:/,
      'no focus ring for keyboard users');
  });

  await t.test('navigation and cards are left alone', () => {
    // The global reset must stay: restyling every <a> on the site would
    // underline the header, the footer and every card.
    assert.match(css, /(^|\n)a \{\s*\n\s*color: inherit;\s*\n\s*text-decoration: none;/,
      'the global a{color:inherit} reset was removed');
    // Prev/next lives inside .article-body but is navigation.
    assert.match(css, /\.article-body \.article-nav a \{[^}]*text-decoration:\s*none/,
      'prev/next inherited the prose underline');
  });
});

test('references survive client-side hydration', async (t) => {
  await t.test('the client rebuilds the block it would otherwise destroy', () => {
    // Every template branch assigns layoutEl.innerHTML from `content`,
    // which drops whatever the server appended after it.
    assert.match(tpl, /function citationsHtml\(/,
      'the client has no way to render citations');
    assert.match(tpl, /layoutEl\.insertAdjacentHTML\('beforeend', refsHtml\)/,
      'citations are built but never inserted');

    // It must run after the branch, or the innerHTML assignment wipes it.
    const insertAt = tpl.indexOf("insertAdjacentHTML('beforeend', refsHtml)");
    const lastAssign = tpl.lastIndexOf('layoutEl.innerHTML =');
    assert.ok(insertAt > lastAssign,
      'the insert happens before a branch overwrites the body');
  });

  await t.test('the client repeats the http(s) filter', () => {
    // This path never passes through the server renderer, so the filter
    // has to exist on both sides or a javascript: href reaches the page
    // for every reader with JS enabled.
    const fn = tpl.match(/function citationsHtml\(([\s\S]*?)\n {2}\}/);
    assert.ok(fn, 'citationsHtml not found');
    assert.match(fn[1], /\^https\?:\\\/\\\//,
      'the client does not restrict citation URLs to http(s)');
  });

  await t.test('markup matches the server so one stylesheet covers both', () => {
    const server = fs.readFileSync(
      path.join(ROOT, 'server', 'middleware', 'ssr-detail.js'), 'utf8');
    for (const marker of ['article-references', 'article-references__list',
      'article-references-heading', 'ref-publisher']) {
      assert.ok(server.includes(marker), `server markup lost ${marker}`);
      assert.ok(tpl.includes(marker), `client markup lost ${marker}`);
    }
  });
});
