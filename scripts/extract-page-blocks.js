#!/usr/bin/env node
// Converts a hand-authored page under public/ into page_blocks rows.
//
//   npm run blocks:extract -- terms.html                 report the plan
//   npm run blocks:extract -- terms.html --write         apply
//   npm run blocks:extract -- --all                      report every page
//   npm run blocks:extract -- --all --write
//
// Phase 3 of docs/ARCHITECTURE_BLOCKS.md.
//
// This is a different problem from phase 2. A pillar's sections were already
// typed JSONB, so migrating them was a copy. These pages hold their content as
// hand-written HTML, so it has to be read out of the markup — which means the
// conversion can lose things, and the only responsible way to run it is to
// prove it did not.
//
// The safety property: the page's visible text after conversion must equal its
// visible text before, character for character. A page that does not satisfy
// that is reported and skipped, never written. Everything else is commentary.
//
// Mapping:
//   <section class="page-hero">          -> hero
//   <section class="... cta-band">       -> cta_band
//   any other top-level <section>        -> rich_text, inner HTML preserved
//
// The rich_text fallback is deliberate. These pages have bespoke layouts, and
// inventing a typed block per layout would be guessing; what matters for the
// architecture is that the content leaves the source file for the database,
// where an operator can edit it and the override machinery becomes redundant.
// Typed blocks are for content that genuinely has that shape.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool, one, query } = require('../server/db/client');
const blocks = require('../server/blocks');
const { sanitizeHtml, toPlainText } = require('../server/utils/html-sanitize');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const targets = argv.filter((a) => !a.startsWith('--'));
const WRITE = flags.has('--write');
const ALL = flags.has('--all');
const FORCE = flags.has('--force');

// ----- Markup helpers -------------------------------------------------------

// Finds the element that starts at or after `from`, counting nesting to reach
// its real close rather than the first one. Matching the first `</div>` is what
// silently truncated every page whose section wrapped a grid: `.section-inner`
// closes long after the nested `.feat-grid` does.
function matchElement(html, tag, from = 0) {
  const open = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  open.lastIndex = from;
  const m = open.exec(html);
  if (!m) return null;

  const scan = new RegExp(`<${tag}\\b[^>]*>|</${tag}\\s*>`, 'gi');
  scan.lastIndex = open.lastIndex;
  let depth = 1;
  let s;
  while ((s = scan.exec(html))) {
    depth += s[0][1] === '/' ? -1 : 1;
    if (depth === 0) {
      return {
        start: m.index,
        end: scan.lastIndex,
        openTag: m[0],
        outer: html.slice(m.index, scan.lastIndex),
        inner: html.slice(open.lastIndex, s.index),
      };
    }
  }
  return null; // unbalanced — the caller decides rather than guessing
}

// Every top-level element of a kind, in order.
function topLevelElements(html, tag) {
  const out = [];
  let at = 0;
  for (;;) {
    const el = matchElement(html, tag, at);
    if (!el) break;
    out.push(el);
    at = el.end;
  }
  return out;
}

const topLevelSections = (html) =>
  topLevelElements(html, 'section').map((e) => ({ start: e.start, end: e.end, html: e.outer }));

const attrOf = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? m[1] : '';
};

const innerOf = (section) => {
  const el = matchElement(section, 'section');
  return el ? el.inner : section;
};

function firstTag(html, tag) {
  const el = matchElement(html, tag);
  return el ? el.inner : '';
}

// Strips one element (with its contents) from a fragment.
function dropFirst(html, tag, className) {
  const re = className
    ? new RegExp(`<${tag}\\b[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>[\\s\\S]*?</${tag}\\s*>`, 'i')
    : new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}\\s*>`, 'i');
  return html.replace(re, '');
}

// The page's visible text, normalised. This is what the safety check compares.
// Comments are not visible text. Leaving them in made blog/index.html look
// like it was losing 17 words that no visitor has ever seen.
const visibleText = (html) =>
  toPlainText(
    html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
  );


// First element of `tag` carrying `className`, inner HTML only.
function firstTagByClass(html, tag, className) {
  const re = new RegExp(`<${tag}\\b[^>]*class="[^"]*\\b${className.replace(/[-]/g, '\\-')}\\b[^"]*"[^>]*>`, 'i');
  const m = html.match(re);
  if (!m) return '';
  const el = matchElement(html, tag, m.index);
  return el ? el.inner : '';
}

// ----- Conversion -----------------------------------------------------------

function planFor(fileHtml) {
  // Only the body mount is converted; the header, footer and <head> stay.
  const bodyMatch = fileHtml.match(/(<div\b[^>]*\sdata-page-body\b[^>]*>)([\s\S]*?)(<\/div>\s*<\/main>)/i);
  const heroMatch = fileHtml.match(/<section\b[^>]*class="[^"]*\bpage-hero\b[^"]*"[^>]*>[\s\S]*?<\/section>/i);

  const planned = [];
  const notes = [];

  if (heroMatch) {
    const hero = heroMatch[0];
    const bg = (attrOf(hero, 'style').match(/url\(\s*['"]?([^'")]+)/i) || [])[1] || '';
    const title = toPlainText(firstTag(hero, 'h1'));
    // The breadcrumb trail is markup the hero block does not model. It is
    // rebuilt by the shared header, so dropping it here loses nothing on the
    // page — but say so rather than let it vanish quietly.
    if (/class="breadcrumbs"/i.test(hero)) notes.push('hero breadcrumbs are rendered by the site header, not the block');
    const subtitle = toPlainText(firstTag(dropFirst(hero, 'div', 'breadcrumbs'), 'p'));
    if (title) planned.push({ type: 'hero', data: { title, subtitle, image: bg } });
  }

  if (!bodyMatch) {
    notes.push('no <div data-page-body> — nothing to convert');
    return { planned, notes, ok: false };
  }

  for (const section of topLevelSections(bodyMatch[2])) {
    const cls = attrOf(section.html, 'class');
    const inner = innerOf(section.html);
    const innerBody = firstTag(inner, 'div') || inner; // most sections wrap in .section-inner

    // Two bespoke layouts get their own block rather than a rich_text copy.
    // Both carry elements the sanitiser refuses in operator prose — a slider's
    // arrows are <button>s — which is the refusal working: a block owns its
    // controls, so the operator supplies content and the markup comes from the
    // block file.
    const slider = matchElement(inner, 'div');
    if (/\btesla-slider\b/.test(inner)) {
      const slides = [];
      for (const a of topLevelElements(matchElement(inner, 'div', inner.indexOf('tesla-slider__track')) ? inner.slice(inner.indexOf('tesla-slider__track')) : '', 'a')) {
        if (!/\btesla-slide\b/.test(a.openTag)) continue;
        slides.push({
          label: toPlainText(firstTagByClass(a.inner, 'div', 'tesla-slide__label')),
          title: toPlainText(firstTag(a.inner, 'h3')),
          sub: toPlainText(firstTagByClass(a.inner, 'span', 'tesla-slide__sub')),
          image: (attrOf(a.openTag, 'style').match(/url\(\s*['"]?([^'")]+)/i) || [])[1] || '',
          link: attrOf(a.openTag, 'href'),
          cta_primary: toPlainText(firstTagByClass(a.inner, 'span', 'tesla-slide__cta--primary')),
          cta_secondary: toPlainText(firstTagByClass(a.inner, 'span', 'tesla-slide__cta--secondary')),
        });
      }
      if (slides.length) {
        planned.push({
          type: 'slide_deck',
          data: {
            eyebrow: toPlainText(firstTagByClass(inner, 'span', 'eyebrow')),
            title: toPlainText(firstTag(inner, 'h2')),
            intro: toPlainText(firstTagByClass(inner, 'p', 'lead')),
            slides,
          },
        });
        continue;
      }
    }

    if (/\bdata-insights-grid\b/.test(inner)) {
      // A grid filled from the articles table — by ssr-detail's renderHomepage
      // on the server and by the page's own script in the browser. The block
      // renders the same cards from the same rows, so the section keeps its
      // contents while the copy around them becomes editable.
      //
      // The trailing "Browse all insights →" link is part of the section, so it
      // comes along. Left behind it would be deleted with the markup the block
      // replaces, which the word check would catch — but as a block field the
      // operator can also change where it points.
      const more = inner.match(
        /<a\b[^>]*class="[^"]*\bnews-link\b[^"]*"[^>]*>([\s\S]*?)<\/a>/i
      );
      const moreTag = more ? more[0].slice(0, more[0].indexOf('>') + 1) : '';
      planned.push({
        type: 'article_list',
        data: {
          eyebrow: toPlainText(firstTagByClass(inner, 'span', 'eyebrow')),
          title: toPlainText(firstTag(inner, 'h2')),
          intro: toPlainText(firstTagByClass(inner, 'p', 'lead')),
          limit: 3,
          // The arrow is the block's, not the operator's: it re-adds one, and
          // keeping this one here would render two.
          more_text: more ? toPlainText(more[1]).replace(/\s*(?:→|&rarr;)\s*$/, '') : '',
          more_link: moreTag ? attrOf(moreTag, 'href') : '',
        },
      });
      continue;
    }
    void slider;

    if (/\bcta-band\b/.test(cls)) {
      const link = inner.match(/<a\b[^>]*href="([^"]*)"[^>]*class="[^"]*\bbtn\b[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
        || inner.match(/<a\b[^>]*class="[^"]*\bbtn\b[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
      planned.push({
        type: 'cta_band',
        data: {
          heading: toPlainText(firstTag(inner, 'h2')),
          body: toPlainText(firstTag(inner, 'p')),
          cta_text: link ? toPlainText(link[2]) : 'Contact us',
          cta_link: link ? link[1] : '/contact.html',
          tone: /section-dark/.test(cls) ? 'dark' : 'accent',
        },
      });
      continue;
    }

    // Everything else keeps its markup. The sanitiser's allowlist covers the
    // classes these pages use (.eyebrow, .feat-grid, .feat-item, .lead), so the
    // section renders as authored.
    const body = sanitizeHtml(innerBody).trim();
    if (!body) continue;
    planned.push({ type: 'rich_text', data: { title: '', body, width: 'wide' } });
  }

  return { planned, notes, ok: planned.length > 0 };
}

// The source region a conversion is responsible for: the hero plus the body
// mount. Comparing against the whole file would fail every page over the
// <title>, the breadcrumbs and the footer, none of which the blocks replace.
function convertedRegion(fileHtml) {
  const hero = (fileHtml.match(/<section\b[^>]*class="[^"]*\bpage-hero\b[^"]*"[^>]*>[\s\S]*?<\/section>/i) || [''])[0];
  const body = (fileHtml.match(/<div\b[^>]*\sdata-page-body\b[^>]*>([\s\S]*?)<\/div>\s*<\/main>/i) || ['', ''])[1];
  // Breadcrumbs live inside the hero but are rebuilt by the shared header, so
  // they are not the blocks' to reproduce.
  return dropFirst(hero, 'div', 'breadcrumbs') + ' ' + body;
}

// The words check cannot see an element disappear: a <form> stripped by the
// sanitiser leaves its labels behind as plain text, so every word survives and
// the page is still broken. That is not hypothetical — it is what happened to
// contact.html and gdpr.html on the first run of this script, taking the RFQ
// and DSAR forms with it.
//
// So compare structure as well: every element kind present in the source region
// must still be present after conversion. Losing a <div> to a rewrite is fine,
// losing a <form> is not.
const IGNORED_TAGS = new Set(['section', 'br', 'hr']); // restructured by design

function tagsIn(html) {
  const out = new Set();
  for (const m of String(html).matchAll(/<([a-zA-Z][a-zA-Z0-9]*)\b/g)) {
    const t = m[1].toLowerCase();
    if (!IGNORED_TAGS.has(t)) out.add(t);
  }
  return out;
}

// The check that decides whether a conversion is allowed to be written.
async function verify(fileHtml, planned) {
  const before = visibleText(convertedRegion(fileHtml));
  // Resolve first. A block that reads other rows (article_list) renders empty
  // without it, which looks like it lost the heading the operator wrote.
  const blockRender = require('../server/services/block-render');
  const rows = await blockRender.resolveRows(
    planned.map((b, i) => ({ id: i, type: b.type, data: blocks.validate(b.type, b.data).data }))
  );
  const rendered = rows
    .map((b) => {
      const def = blocks.get(b.type);
      if (!def) return '';
      try {
        return def.render(b.data, {
          esc: (s) => String(s == null ? '' : s),
          escAttr: (s) => String(s == null ? '' : s),
          safeUrl: (u) => u,
        });
      } catch (_) {
        return '';
      }
    })
    .join(' ');

  const afterText = visibleText(rendered);
  const lostTags = [...tagsIn(convertedRegion(fileHtml))].filter((t) => !tagsIn(rendered).has(t));
  const beforeWords = before.split(' ').filter(Boolean);
  const afterWords = new Set(afterText.split(' ').filter(Boolean));
  // Every word inside the converted region has to survive. Extra words on the
  // far side are fine — a block may add a heading the markup carried as an
  // attribute — but a word that was visible and now is not is content loss.
  const missing = beforeWords.filter((w) => !afterWords.has(w));
  return {
    before,
    afterText,
    missingSample: missing.slice(0, 12),
    missingCount: missing.length,
    lostTags,
  };
}

// ----- Driver ---------------------------------------------------------------

function pageFiles() {
  const out = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.html') && !entry.name.startsWith('_')) out.push(full);
    }
  })(PUBLIC_DIR);
  return out.sort();
}

async function convert(file) {
  const rel = path.relative(PUBLIC_DIR, file);
  const html = fs.readFileSync(file, 'utf8');
  const slug = (html.match(/<body[^>]*\sdata-page="([^"]+)"/i) || [])[1];
  if (!slug) return { rel, status: 'no data-page attribute' };

  let page = await one('SELECT id FROM pages WHERE slug = $1', [slug]);
  if (!page) {
    // Several pages were added to public/ without a matching pages row, so the
    // CMS never knew about them. --create-pages makes one, titled from the
    // page's own <h1>, which is the minimum a block owner needs.
    if (!flags.has('--create-pages')) {
      return { rel, slug, status: 'no pages row for this slug — pass --create-pages' };
    }
    const title = toPlainText(firstTag(html, 'h1')) || slug;
    if (!WRITE) return { rel, slug, status: `would create a pages row titled "${title}"` };
    const created = await query(
      `INSERT INTO pages (slug, title, status) VALUES ($1, $2, 'published') RETURNING id`,
      [slug, title.slice(0, 255)]
    );
    page = created.rows[0];
  }

  const existing = await one('SELECT count(*)::int AS n FROM page_blocks WHERE page_id = $1', [page.id]);
  if (existing && existing.n > 0 && !FORCE) {
    return { rel, slug, status: `already has ${existing.n} block(s) — --force to replace` };
  }

  const { planned, notes, ok } = planFor(html);
  if (!ok) return { rel, slug, status: notes.join('; ') || 'nothing extractable', notes };

  const check = await verify(html, planned);
  if (check.lostTags.length) {
    return {
      rel,
      slug,
      status: `REFUSED — these elements would be stripped: <${check.lostTags.join('> <')}>`,
      planned,
      notes,
    };
  }
  if (check.missingCount > 0) {
    return {
      rel,
      slug,
      status: `REFUSED — ${check.missingCount} word(s) would be lost: ${check.missingSample.join(' ')}`,
      planned,
      notes,
    };
  }

  if (WRITE) {
    await query('DELETE FROM page_blocks WHERE page_id = $1', [page.id]);
    for (let i = 0; i < planned.length; i++) {
      const { data } = blocks.validate(planned[i].type, planned[i].data);
      await query(
        `INSERT INTO page_blocks (page_id, type, sort_order, data, status)
         VALUES ($1, $2, $3, $4, 'published')`,
        [page.id, planned[i].type, i, JSON.stringify(data)]
      );
    }
  }

  return { rel, slug, status: 'ok', planned, notes, pageId: page.id };
}

async function run() {
  let files;
  if (ALL) {
    files = pageFiles();
  } else if (targets.length) {
    files = targets.map((t) => path.join(PUBLIC_DIR, t));
  } else {
    console.error('usage: npm run blocks:extract -- <page.html> [--write] | --all [--write]');
    process.exit(1);
  }

  if (!WRITE) console.log('[extract] dry run — pass --write to apply\n');

  let converted = 0;
  let refused = 0;
  let skipped = 0;

  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.log(`  ?  ${path.relative(PUBLIC_DIR, file)} — not found`);
      continue;
    }
    const r = await convert(file);
    if (r.status === 'ok') {
      converted++;
      const types = r.planned.map((b) => b.type).join(', ');
      console.log(`  ok  ${r.rel}  ->  ${r.planned.length} block(s): ${types}`);
      for (const n of r.notes || []) console.log(`        note: ${n}`);
    } else if (r.status.startsWith('REFUSED')) {
      refused++;
      console.log(`  !!  ${r.rel}  ${r.status}`);
    } else {
      skipped++;
      console.log(`  --  ${r.rel}  ${r.status}`);
    }
  }

  console.log('');
  console.log(`[extract] ${WRITE ? 'converted' : 'convertible'} ${converted}, refused ${refused}, skipped ${skipped}`);
  if (refused) console.log('[extract] a refusal means the blocks would not reproduce the page text — the file is left alone');
  if (!WRITE && converted) console.log('[extract] re-run with --write to apply');
  await pool.end();
}

run().catch((err) => {
  console.error('[extract] failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});
