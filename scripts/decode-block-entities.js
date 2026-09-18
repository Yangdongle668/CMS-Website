#!/usr/bin/env node
// Repairs block copy that kept HTML entities as literal text.
//
//   npm run blocks:decode-entities            report
//   npm run blocks:decode-entities -- --write apply
//
// Why these rows exist. Phase 3 pulled each page's copy out of its markup with
// toPlainText(), which decodes entities via the sanitiser's table — and that
// table only listed the characters a URL scheme can be smuggled through, the
// handful safeUrl needs. Every typographic entity fell straight through. So a
// page whose source said "expectations &mdash; we engineer" produced a block
// whose stored value contained those nine literal characters, and the block
// escaped them again on render. Visitors saw "expectations &mdash; we engineer".
//
// The table is fixed, which stops new rows being written that way. This fixes
// the ones already stored.
//
// Only fields the schema declares as plain text are touched. A richtext field
// legitimately contains markup, and "&amp;" inside it is how a literal
// ampersand is spelled — decoding that would corrupt it.

require('dotenv').config();
const { pool, query } = require('../server/db/client');
const blocks = require('../server/blocks');
const { decodeEntities } = require('../server/utils/html-sanitize');

const WRITE = process.argv.includes('--write');

// An entity reference that survived extraction. Deliberately narrow: a bare
// "&" or "&&" is ordinary copy, not a mangled entity.
const ENTITY_RE = /&(?:[a-zA-Z][a-zA-Z0-9]{1,10}|#\d{1,6}|#x[0-9a-fA-F]{1,6});/;

async function main() {
  const { rows } = await query('SELECT id, type, data FROM page_blocks ORDER BY id');
  let touched = 0;
  let fields = 0;

  for (const row of rows) {
    const def = blocks.get(row.type);
    if (!def || !def.schema) continue;

    const next = { ...(row.data || {}) };
    const changes = [];

    for (const [key, spec] of Object.entries(def.schema)) {
      // richtext keeps its entities: they are part of the markup.
      if (spec.type === 'richtext' || spec.type === 'repeater') continue;
      const v = next[key];
      if (typeof v !== 'string' || !ENTITY_RE.test(v)) continue;
      const decoded = decodeEntities(v);
      if (decoded !== v) {
        changes.push({ key, from: v.slice(0, 60), to: decoded.slice(0, 60) });
        next[key] = decoded;
      }
    }

    if (!changes.length) continue;
    touched++;
    fields += changes.length;
    console.log(`block ${row.id} (${row.type})`);
    for (const c of changes) console.log(`  ${c.key}: ${JSON.stringify(c.from)} -> ${JSON.stringify(c.to)}`);

    if (WRITE) {
      // Validated the same way a save is, so a decoded value that now exceeds
      // a length cap is caught here rather than on the next edit.
      const { data, errors } = blocks.validate(row.type, next);
      if (errors.length) {
        console.warn(`  SKIPPED — ${errors.join('; ')}`);
        touched--;
        fields -= changes.length;
        continue;
      }
      await query('UPDATE page_blocks SET data = $1, updated_at = now() WHERE id = $2',
        [JSON.stringify(data), row.id]);
    }
  }

  console.log('');
  console.log(`[entities] ${touched} block(s), ${fields} field(s)${WRITE ? ' updated' : ' would change'}`);
  if (!WRITE && touched) console.log('[entities] re-run with --write to apply');
  return 0;
}

main()
  .then((code) => pool.end().then(() => process.exit(code)))
  .catch((err) => {
    console.error('[entities] failed:', (err && err.stack) || err);
    pool.end().then(() => process.exit(1));
  });
