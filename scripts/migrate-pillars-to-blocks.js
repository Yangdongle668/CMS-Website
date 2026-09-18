#!/usr/bin/env node
// Converts each pillar_pages row's nine typed sections into page_blocks rows.
//
//   npm run blocks:migrate-pillars            report what would change
//   npm run blocks:migrate-pillars -- --write apply
//   npm run blocks:migrate-pillars -- --write --force  replace existing blocks
//
// Phase 2 of docs/ARCHITECTURE_BLOCKS.md. The claim it tests is that the
// existing schema already had the right shape and the migration is a copy
// rather than a reshaping: pillar_pages.faq is [{q,a}] and the faq block's
// schema is [{q,a}], and so on for the other eight.
//
// Nothing is destroyed. The pillar_pages columns stay exactly as they are, so
// a pillar renders from blocks when it has them and from its columns when it
// does not, and rolling back is deleting the block rows.
//
// Idempotent: a pillar that already has blocks is skipped unless --force.

require('dotenv').config();
const { pool, many, one, query } = require('../server/db/client');
const blocks = require('../server/blocks');

const args = new Set(process.argv.slice(2));
const WRITE = args.has('--write');
const FORCE = args.has('--force');

// Sections in the order they appear on the rendered pillar page today.
function buildBlocks(p) {
  const out = [];
  const push = (type, data) => {
    if (!blocks.has(type)) {
      console.warn('  ! block type "%s" is not registered — skipped', type);
      return;
    }
    const { data: clean, errors } = blocks.validate(type, data);
    if (errors.length) {
      // Reported rather than silently dropped: an error here means the existing
      // data does not fit the block's schema, which is exactly what this
      // migration is meant to surface.
      console.warn('  ! %s: %s', type, errors.join('; '));
    }
    out.push({ type, data: clean });
  };

  // No hero block. products/_template.html still renders the pillar hero, and
  // it carries breadcrumbs and sibling links the hero block does not emit, so
  // producing one here would give a migrated pillar two heroes. The hero_*
  // columns stay where they are and move in phase 3, when that template is
  // replaced. Eight blocks, not nine.

  const ov = p.overview || {};
  if (ov.body) push('overview', { title: ov.title || '', body: ov.body });

  if (Array.isArray(p.variants) && p.variants.length) {
    push('variant_grid', {
      title: 'Variants',
      items: p.variants.map((v) => ({
        name: v.name || '',
        summary: v.summary || '',
        image: v.image || '',
      })),
    });
  }

  const spec = p.spec_table || {};
  if (Array.isArray(spec.rows) && spec.rows.length) {
    push('spec_table', {
      title: 'Specifications',
      // The block stores a row as one pipe-separated string because a generated
      // form cannot render a ragged grid; the cells themselves are unchanged.
      headers: (spec.headers || []).join(' | '),
      rows: spec.rows.map((r) => ({ cells: (Array.isArray(r) ? r : [r]).join(' | ') })),
    });
  }

  if (Array.isArray(p.applications) && p.applications.length) {
    push('application_grid', {
      title: 'Applications',
      slugs: p.applications.join(' | '),
    });
  }

  const cust = p.customization || {};
  if (cust.enabled !== false && Array.isArray(cust.items) && cust.items.length) {
    push('customization', {
      title: 'Customisation',
      items: cust.items.map((c) => ({ label: c.label || '', value: c.value || '' })),
    });
  }

  const mfg = p.manufacturing || {};
  if (mfg.body) {
    push('manufacturing', { title: mfg.title || '', body: mfg.body, image: mfg.image || '' });
  }

  if (Array.isArray(p.certifications) && p.certifications.length) {
    push('certification_wall', {
      title: 'Certifications',
      items: p.certifications.map((c) => ({ name: c.name || '', image: c.image || '' })),
    });
  }

  if (Array.isArray(p.faq) && p.faq.length) {
    push('faq', {
      title: 'Frequently asked questions',
      items: p.faq.map((f) => ({ q: f.q || '', a: f.a || '' })),
    });
  }

  return out;
}

async function run() {
  const pillars = await many(
    `SELECT id, slug, name, hero_eyebrow, hero_title, hero_subtitle, hero_image,
            primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link,
            overview, variants, spec_table, applications, customization,
            manufacturing, certifications, faq
     FROM pillar_pages ORDER BY sort_order, id`
  );

  console.log(`[migrate] ${pillars.length} pillar page(s)`);
  if (!WRITE) console.log('[migrate] dry run — pass --write to apply');

  let created = 0;
  let skipped = 0;

  for (const p of pillars) {
    const existing = await one(
      'SELECT count(*)::int AS n FROM page_blocks WHERE pillar_id = $1',
      [p.id]
    );
    if (existing && existing.n > 0 && !FORCE) {
      console.log(`  skip  ${p.slug} — already has ${existing.n} block(s); --force to replace`);
      skipped++;
      continue;
    }

    const planned = buildBlocks(p);
    console.log(`  ${p.slug}  ->  ${planned.length} block(s): ${planned.map((b) => b.type).join(', ')}`);
    if (!WRITE) continue;

    if (existing && existing.n > 0) {
      await query('DELETE FROM page_blocks WHERE pillar_id = $1', [p.id]);
    }
    for (let i = 0; i < planned.length; i++) {
      await query(
        `INSERT INTO page_blocks (pillar_id, type, sort_order, data, status)
         VALUES ($1, $2, $3, $4, 'published')`,
        [p.id, planned[i].type, i, JSON.stringify(planned[i].data)]
      );
      created++;
    }
  }

  console.log('');
  if (WRITE) {
    console.log(`[migrate] created ${created} block(s), skipped ${skipped} pillar(s)`);
    console.log('[migrate] pillar_pages columns are untouched — delete the block rows to roll back');
  } else {
    console.log('[migrate] nothing written');
  }
  await pool.end();
}

run().catch((err) => {
  console.error('[migrate] failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});
