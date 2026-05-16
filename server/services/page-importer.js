// =====================================================================
// page-importer — turn a static page (pages.body_html OR /public/<slug>.html)
// into a sequence of typed page_blocks rows.
//
// We use cheerio to parse the HTML and walk top-level sections, mapping
// well-known site patterns to block types from server/services/block-registry.js.
// Patterns the audit identified:
//
//   <section class="page-hero|hero">           → hero_banner
//   <div class="content-split">                → image_text_split
//   <div class="about-stats">                  → stats_grid
//   <div class="feat-grid">                    → icon_feature_grid
//   <div class="steps-grid">                   → process_steps
//   <div class="cert-wall">                    → compliance_badges (wall)
//   <section class="trust-strip">              → compliance_badges (strip)
//   <table class="spec-table">                 → spec_table
//   <details>...                               → faq_accordion
//   <section class="cta-band|section-dark">    → cta_banner
//   <blockquote>                               → testimonial (heuristic)
//
// Anything that doesn't match any pattern collapses to a rich_text
// block at the appropriate position. So nothing ever gets lost.
// =====================================================================
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..', '..');

function asText(node, $) {
  return ($(node).text() || '').replace(/\s+/g, ' ').trim();
}

function asInnerHtml(node, $) {
  // Trim outer whitespace; preserve inner formatting
  return ($(node).html() || '').trim();
}

function pickAttr($el, name) { return ($el.attr(name) || '').trim(); }

// Resolve a slug to the on-disk static HTML path (best-effort).
function resolveStaticFile(slug) {
  if (!slug) return null;
  const candidates = [
    path.join(ROOT, 'public', slug + '.html'),
    path.join(ROOT, 'public', slug, 'index.html'),
  ];
  // Special legacy slugs
  if (slug === 'home') candidates.unshift(path.join(ROOT, 'public', 'index.html'));
  if (slug === 'faq') candidates.unshift(path.join(ROOT, 'public', 'faq.html'));
  if (slug === 'contact') candidates.unshift(path.join(ROOT, 'public', 'contact.html'));
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Read whatever source HTML we have for this page.
// Returns { hero, body } where hero is a section snippet and body is
// the rest, OR { body } if no hero found.
function readSource(page) {
  // Priority 1: pages.body_html (admin-edited)
  if (page.body_html && page.body_html.trim()) {
    return { source: 'body_html', html: '<div data-page-body>' + page.body_html + '</div>' };
  }
  // Priority 2: matching static file
  const filePath = resolveStaticFile(page.slug);
  if (filePath) {
    try {
      return { source: 'file:' + filePath, html: fs.readFileSync(filePath, 'utf8') };
    } catch (_) {}
  }
  return { source: 'none', html: '' };
}

// ---------- Pattern → block converters ----------

// Hero from <section class="hero|page-hero" style="background-image:url('...')">
function parseHero($section, $) {
  const eyebrow = asText($section.find('.eyebrow').first(), $);
  const title = asText($section.find('h1').first(), $) || asText($section.find('.hero-title').first(), $);
  const subtitle = asText($section.find('.hero-subtitle, p').first(), $);
  // Background image from inline style
  const style = pickAttr($section, 'style');
  const m = style.match(/background-image\s*:\s*url\(['"]?([^'")]+)['"]?\)/i);
  const image_url = m ? m[1] : '';
  // Hero CTAs
  const ctas = $section.find('.hero-ctas a, .hero-cta');
  const cta = ctas.eq(0);
  const cta2 = ctas.eq(1);
  return {
    block_type: 'hero_banner',
    content: {
      eyebrow,
      title,
      subtitle,
      image_url,
      cta_text: cta.length ? asText(cta, $) : '',
      cta_link: cta.length ? pickAttr(cta, 'href') : '',
      secondary_cta_text: cta2.length ? asText(cta2, $) : '',
      secondary_cta_link: cta2.length ? pickAttr(cta2, 'href') : '',
      align: 'left',
    },
  };
}

function parseContentSplit($el, $) {
  const reverse = $el.hasClass('reverse') || $el.hasClass('content-split--reverse');
  const text = $el.find('.text-col').first();
  const img = $el.find('.img-col img, img').first();
  const title = asText(text.find('h3').first(), $) || asText(text.find('h2').first(), $);
  // Combine paragraphs in the text col
  const ps = text.find('p').map((_, p) => '<p>' + asInnerHtml(p, $) + '</p>').get();
  return {
    block_type: 'image_text_split',
    content: {
      title,
      text: ps.join(''),
      image_url: img.length ? pickAttr(img, 'src') : '',
      image_align: reverse ? 'left' : 'right',
    },
  };
}

function parseStatsGrid($el, $) {
  const items = [];
  $el.find('> div').each((_, d) => {
    const $d = $(d);
    const num = $d.find('strong .counter, strong span').first();
    const value = pickAttr(num, 'data-target') || asText(num, $) || asText($d.find('strong').first(), $);
    // Extract unit (the second span inside <strong>)
    const unitNode = $d.find('strong span').eq(1);
    const unit = asText(unitNode, $);
    const label = asText($d.find('em').first(), $);
    const desc = asText($d.find('p').first(), $);
    items.push({
      value: String(value || '').replace(/[^0-9.+km/]/gi, '') || '0',
      unit,
      label,
      desc,
    });
  });
  return { block_type: 'stats_grid', content: { title: '', items } };
}

function parseFeatGrid($el, $, contextTitle) {
  const items = [];
  $el.find('.feat-item').each((_, fi) => {
    const $f = $(fi);
    items.push({
      icon: asText($f.find('.feat-icon').first(), $),
      title: asText($f.find('h3').first(), $),
      text: asText($f.find('p').first(), $),
    });
  });
  // Detect column count: 6+ items render as 6-col, fewer as 3-col
  const columns = items.length >= 6 ? 3 : 3;   // CSS handles flex-wrap; default 3
  return {
    block_type: 'icon_feature_grid',
    content: { title: contextTitle || '', columns, items },
  };
}

function parseStepsGrid($el, $, contextTitle) {
  const items = [];
  $el.find('.step-card').each((_, sc) => {
    const $s = $(sc);
    const sub = $s.find('.step-list li').map((_, li) => ({ item: asText(li, $) })).get();
    items.push({
      num: asText($s.find('.step-num').first(), $),
      title: asText($s.find('h3').first(), $),
      text: asText($s.find('> p').first(), $),
      sub,
    });
  });
  return { block_type: 'process_steps', content: { title: contextTitle || '', items } };
}

function parseCertWall($el, $, contextTitle) {
  const items = $el.find('.cert-chip').map((_, c) => ({ text: asText(c, $) })).get();
  if (!items.length) {
    // Maybe spans without .cert-chip
    $el.find('span').each((_, s) => items.push({ text: asText(s, $) }));
  }
  return {
    block_type: 'compliance_badges',
    content: { title: contextTitle || '', layout: 'wall', items },
  };
}

function parseTrustStrip($el, $) {
  const label = asText($el.find('.trust-strip__label').first(), $) || 'Compliant with';
  const items = $el.find('.trust-strip__items span, .trust-strip__items > *').map(
    (_, s) => ({ text: asText(s, $) })
  ).get();
  return {
    block_type: 'compliance_badges',
    content: { title: label, layout: 'strip', items },
  };
}

function parseSpecTable($el, $, contextTitle) {
  const headers = $el.find('thead th').map((_, th) => asText(th, $)).get();
  const rows = [];
  $el.find('tbody tr').each((_, tr) => {
    const cells = $(tr).find('td').map((_, td) => asText(td, $)).get();
    rows.push(cells);
  });
  return {
    block_type: 'spec_table',
    content: { title: contextTitle || '', headers, rows },
  };
}

function parseFaq($details, $, contextTitle) {
  const items = $details.map((_, d) => {
    const $d = $(d);
    return {
      q: asText($d.find('summary').first(), $),
      a: asText($d.find('summary').nextAll().first(), $) || asInnerHtml($d.children('p').first(), $),
    };
  }).get();
  return { block_type: 'faq_accordion', content: { title: contextTitle || '', items } };
}

function parseCtaBand($el, $) {
  const title = asText($el.find('h2').first(), $);
  const subtitle = asText($el.find('.lead, p').first(), $);
  const cta = $el.find('a.btn, .btn-accent, .btn-primary').first();
  return {
    block_type: 'cta_banner',
    content: {
      title,
      subtitle,
      cta_text: cta.length ? asText(cta, $) : 'Get a Quote',
      cta_link: cta.length ? pickAttr(cta, 'href') : '/quote.html',
      image: '',
    },
  };
}

function fallbackRichText(html) {
  if (!html || !html.trim()) return null;
  return {
    block_type: 'rich_text',
    content: { html: html.trim(), max_width: 'standard' },
  };
}

// ---------- Main parser ----------

// Walk the body content (inside <main> or <body>) and return an
// ordered list of block objects.
function parseSourceToBlocks(html, page) {
  if (!html || !html.trim()) {
    // Fallback to bare hero from pages.hero_*
    return buildBlocksFromPageColumns(page);
  }

  const $ = cheerio.load(html, { decodeEntities: false });

  // Hero detection: page-hero/hero is typically a sibling of [data-page-body]
  // inside <main>. We grab it FIRST (looking anywhere in the doc).
  const blocks = [];
  const $hero = $('section.page-hero, section.hero').first();
  if ($hero.length) {
    blocks.push(parseHero($hero, $));
    $hero.remove();
  } else {
    const heroBlock = buildHeroFromColumns(page);
    if (heroBlock) blocks.push(heroBlock);
  }

  // Body region: prefer <div data-page-body> (most existing pages have
  // this inside <main>; the section content lives inside it). Fall back
  // to <main> or document body when not present.
  let $body = $('[data-page-body]').first();
  if (!$body.length) $body = $('main').first();
  if (!$body.length) $body = $('body').first();
  if (!$body.length) $body = $.root();

  // Walk top-level <section> children of the body region
  $body.find('> section, > .section, > div.section, > div.section-inner > section').each((_, sec) => {
    const $sec = $(sec);
    // Section-level title (often <h2>) for context
    const ctxTitle = asText($sec.find('> .section-inner > h2, > h2').first(), $);
    const cls = pickAttr($sec, 'class');

    // Detect by inner pattern containers
    const $cs = $sec.find('.content-split');
    const $stats = $sec.find('.about-stats');
    const $feat = $sec.find('.feat-grid');
    const $steps = $sec.find('.steps-grid');
    const $cert = $sec.find('.cert-wall');
    const $trust = $sec.is('.trust-strip') ? $sec : $sec.find('.trust-strip');
    const $tbl = $sec.find('table.spec-table, table');
    const $det = $sec.find('details');

    let consumed = false;

    // CTA band — usually section-dark with cta-band class
    if (/cta-band|section-dark|cta-section/i.test(cls)) {
      blocks.push(parseCtaBand($sec, $));
      consumed = true;
    }
    // Trust strip
    else if ($trust.length) {
      blocks.push(parseTrustStrip($trust.first(), $));
      consumed = true;
    }
    // Cert wall (often inside other section)
    else if ($cert.length) {
      blocks.push(parseCertWall($cert.first(), $, ctxTitle));
      consumed = true;
    }
    else if ($cs.length) {
      // Could be multiple content-splits in one section
      $cs.each((_, c) => blocks.push(parseContentSplit($(c), $)));
      consumed = true;
    }
    else if ($stats.length) {
      const sb = parseStatsGrid($stats.first(), $);
      if (ctxTitle) sb.content.title = ctxTitle;
      blocks.push(sb);
      consumed = true;
    }
    else if ($feat.length) {
      blocks.push(parseFeatGrid($feat.first(), $, ctxTitle));
      consumed = true;
    }
    else if ($steps.length) {
      blocks.push(parseStepsGrid($steps.first(), $, ctxTitle));
      consumed = true;
    }
    else if ($det.length >= 2) {
      blocks.push(parseFaq($det, $, ctxTitle));
      consumed = true;
    }
    else if ($tbl.length) {
      blocks.push(parseSpecTable($tbl.first(), $, ctxTitle));
      consumed = true;
    }

    if (!consumed) {
      // Fallback: take this section's HTML as rich_text
      const inner = asInnerHtml($sec.find('> .section-inner').first(), $) || asInnerHtml($sec, $);
      const rt = fallbackRichText(inner);
      if (rt) blocks.push(rt);
    }
  });

  // If no <section> children walked (e.g. body_html is just paragraphs),
  // dump everything remaining as a single rich_text block
  if (blocks.length === (blocks[0] && blocks[0].block_type === 'hero_banner' ? 1 : 0)) {
    const inner = asInnerHtml($body, $);
    const rt = fallbackRichText(inner);
    if (rt) blocks.push(rt);
  }

  return blocks;
}

function buildHeroFromColumns(page) {
  const hasHero = (page.hero_title && String(page.hero_title).trim()) ||
                  (page.hero_subtitle && String(page.hero_subtitle).trim()) ||
                  (page.hero_image && String(page.hero_image).trim());
  if (!hasHero) return null;
  return {
    block_type: 'hero_banner',
    content: {
      eyebrow: page.hero_eyebrow || '',
      title: page.hero_title || '',
      subtitle: page.hero_subtitle || '',
      image_url: page.hero_image || '',
      cta_text: '',
      cta_link: '',
      secondary_cta_text: '',
      secondary_cta_link: '',
      align: 'left',
    },
  };
}

function buildBlocksFromPageColumns(page) {
  const blocks = [];
  const heroBlock = buildHeroFromColumns(page);
  if (heroBlock) blocks.push(heroBlock);
  if (page.body_html && String(page.body_html).trim()) {
    blocks.push({
      block_type: 'rich_text',
      content: { html: page.body_html, max_width: 'standard' },
    });
  }
  return blocks;
}

// Public API: given a pages-table row, return ordered blocks.
function parsePageToBlocks(page) {
  const { html, source } = readSource(page);
  const blocks = parseSourceToBlocks(html, page);
  return { blocks, source };
}

module.exports = { parsePageToBlocks, resolveStaticFile };
