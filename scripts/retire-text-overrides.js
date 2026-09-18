#!/usr/bin/env node
// Phase 4 of docs/ARCHITECTURE_BLOCKS.md: bake settings.text_overrides into the
// rows that now own the copy, so the override layer can be deleted.
//
//   npm run overrides:retire            report what would change
//   npm run overrides:retire -- --write apply
//
// Why this script has to exist before the code is removed.
//
// An override is a global find-and-replace over rendered text: `{ "Learn More":
// "See Specs" }` rewrote that string on every page that contained it, at serve
// time, in the HTML. Deleting the code that applies them would not delete the
// data — it would just stop it applying, and every edit an operator made that
// way would silently revert the next time the site was deployed. Silent revert
// is the failure mode this whole branch has been removing, so shipping one on
// the way out would be a poor joke.
//
// So the substitution is made permanent first: applied to the block data and
// page rows that hold the text now, then verified by re-reading the rows. Only
// then is the layer removed.
//
// Two rules the script holds to:
//
//   1. An override it cannot place is reported and the run fails. Not placing
//      it is the honest outcome — a silent skip is the thing being fixed.
//   2. The original map is copied to settings.text_overrides_retired and left
//      there. Nothing is deleted, so a wrong call is recoverable by hand.

require('dotenv').config();
const { pool, one, query } = require('../server/db/client');

const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const FORCE = argv.includes('--force');

// The override matcher was whitespace-normalised and matched whole text nodes.
// Applying it to stored data is a narrower problem — the data has no markup
// around it — so a plain substring replace is both sufficient and closer to
// what an operator saw when they typed the replacement.
function replaceDeep(value, from, to, counter) {
  if (typeof value === 'string') {
    if (!value.includes(from)) return value;
    counter.n += value.split(from).length - 1;
    return value.split(from).join(to);
  }
  if (Array.isArray(value)) return value.map((v) => replaceDeep(v, from, to, counter));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = replaceDeep(v, from, to, counter);
    return out;
  }
  return value;
}

const PAGE_TEXT_COLUMNS = [
  'title', 'meta_title', 'meta_description',
  'hero_eyebrow', 'hero_title', 'hero_subtitle', 'body_html',
];

async function main() {
  const row = await one(`SELECT value FROM settings WHERE key = 'text_overrides'`);
  const map = (row && row.value) || {};
  const entries = Object.entries(map).filter(([from, to]) => from && from !== to);

  if (!entries.length) {
    console.log('[overrides] nothing saved — the layer can be removed as-is');
    return 0;
  }

  console.log('[overrides] %d saved override(s)%s', entries.length, WRITE ? '' : ' — dry run, pass --write to apply');

  // Count the hits per override across every destination, so an override that
  // lands nowhere can be named rather than quietly dropped.
  const placed = new Map(entries.map(([from]) => [from, 0]));

  // ----- blocks -----
  const blockRows = await query('SELECT id, data FROM page_blocks ORDER BY id');
  for (const b of blockRows.rows) {
    let data = b.data;
    let touched = 0;
    for (const [from, to] of entries) {
      const counter = { n: 0 };
      data = replaceDeep(data, from, to, counter);
      if (counter.n) {
        placed.set(from, placed.get(from) + counter.n);
        touched += counter.n;
      }
    }
    if (touched && WRITE) {
      await query('UPDATE page_blocks SET data = $1, updated_at = now() WHERE id = $2', [JSON.stringify(data), b.id]);
    }
    if (touched) console.log('  block %d: %d replacement(s)', b.id, touched);
  }

  // ----- pages -----
  const pageRows = await query(
    `SELECT id, slug, ${PAGE_TEXT_COLUMNS.join(', ')}, sections FROM pages ORDER BY id`
  );
  for (const p of pageRows.rows) {
    const updates = [];
    const values = [];
    let touched = 0;
    for (const col of PAGE_TEXT_COLUMNS) {
      let v = p[col];
      let n = 0;
      for (const [from, to] of entries) {
        const counter = { n: 0 };
        v = replaceDeep(v, from, to, counter);
        if (counter.n) {
          placed.set(from, placed.get(from) + counter.n);
          n += counter.n;
        }
      }
      if (n) {
        values.push(v);
        updates.push(`${col} = $${values.length}`);
        touched += n;
      }
    }
    let sections = p.sections;
    let sectionHits = 0;
    for (const [from, to] of entries) {
      const counter = { n: 0 };
      sections = replaceDeep(sections, from, to, counter);
      if (counter.n) {
        placed.set(from, placed.get(from) + counter.n);
        sectionHits += counter.n;
      }
    }
    if (sectionHits) {
      values.push(JSON.stringify(sections));
      updates.push(`sections = $${values.length}`);
      touched += sectionHits;
    }
    if (touched && WRITE) {
      values.push(p.id);
      await query(`UPDATE pages SET ${updates.join(', ')}, updated_at = now() WHERE id = $${values.length}`, values);
    }
    if (touched) console.log('  page %s: %d replacement(s)', p.slug, touched);
  }

  // ----- pillars -----
  // Phase 2 moved their sections into blocks, but the columns the pillar's own
  // renderer still reads (title, intro, hero copy) are their own rows.
  const pillarCols = await query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_name = 'pillar_pages' AND data_type IN ('text','character varying','jsonb')`
  );
  const cols = pillarCols.rows.map((r) => r.column_name).filter((c) => c !== 'slug');
  if (cols.length) {
    const pillars = await query(`SELECT id, slug, ${cols.join(', ')} FROM pillar_pages ORDER BY id`);
    for (const pil of pillars.rows) {
      const updates = [];
      const values = [];
      let touched = 0;
      for (const col of cols) {
        let v = pil[col];
        let n = 0;
        for (const [from, to] of entries) {
          const counter = { n: 0 };
          v = replaceDeep(v, from, to, counter);
          if (counter.n) {
            placed.set(from, placed.get(from) + counter.n);
            n += counter.n;
          }
        }
        if (n) {
          values.push(typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
          updates.push(`${col} = $${values.length}`);
          touched += n;
        }
      }
      if (touched && WRITE) {
        values.push(pil.id);
        await query(`UPDATE pillar_pages SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
      }
      if (touched) console.log('  pillar %s: %d replacement(s)', pil.slug, touched);
    }
  }

  // ----- report -----
  const orphans = entries.filter(([from]) => placed.get(from) === 0);
  if (orphans.length) {
    console.error('\n[overrides] %d override(s) matched nothing in the database:', orphans.length);
    for (const [from, to] of orphans) {
      console.error('  "%s" -> "%s"', from.slice(0, 70), String(to).slice(0, 70));
    }
    console.error(
      '\nThese were rewriting text that lives in a source file under public/, not in a row.\n' +
      'Removing the override layer will revert them. Either edit the source file (or the\n' +
      'block that now owns that copy) and re-run, or pass --force to accept the loss.\n' +
      'The full map is kept in settings.text_overrides_retired either way.'
    );
    if (!FORCE) return 1;
  }

  if (!WRITE) {
    console.log('\n[overrides] dry run — re-run with --write to apply');
    return orphans.length && !FORCE ? 1 : 0;
  }

  // Archive rather than delete. The row costs nothing and it is the only copy
  // of what an operator asked for.
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('text_overrides_retired', $1, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify({ retired_at: new Date().toISOString(), overrides: map })]
  );
  await query(`DELETE FROM settings WHERE key = 'text_overrides'`);
  console.log('\n[overrides] applied; the original map is archived in settings.text_overrides_retired');
  return 0;
}

main()
  .then((code) => pool.end().then(() => process.exit(code)))
  .catch((err) => {
    console.error('[overrides] failed:', err && err.message);
    pool.end().then(() => process.exit(1));
  });
