// Block registry.
//
// A block type is one file in this directory that exports:
//
//   type    unique string, matches page_blocks.type
//   label   what the operator sees in the "add block" gallery
//   schema  field definitions, which drive BOTH the admin form and validation
//   render(data, ctx)  -> HTML string, server-side
//   jsonLd(data, ctx)  -> structured-data object, or null
//
// Adding a block type is adding a file here. No migration (page_blocks.data is
// JSONB), no new admin page (the form is generated from `schema`), no route.
//
// The jsonLd hook is the reason this is a typed registry rather than a
// free-form canvas. A builder that emits anonymous divs cannot tell the server
// that a section is an FAQ, so the structured data that the pillar/cluster SEO
// model depends on has to be hand-entered per page — and it won't be. Here the
// block knows what it is, so the schema comes out right for free.

const fs = require('fs');
const path = require('path');

const registry = new Map();

for (const file of fs.readdirSync(__dirname)) {
  if (!file.endsWith('.js') || file === 'index.js' || file.startsWith('_')) continue;
  const mod = require(path.join(__dirname, file));
  if (!mod || !mod.type) {
    console.warn('[blocks] %s exports no `type` — skipped', file);
    continue;
  }
  if (registry.has(mod.type)) {
    console.warn('[blocks] duplicate type "%s" in %s — keeping the first', mod.type, file);
    continue;
  }
  if (typeof mod.render !== 'function') {
    console.warn('[blocks] "%s" has no render() — skipped', mod.type);
    continue;
  }
  registry.set(mod.type, mod);
}

function get(type) {
  return registry.get(String(type || '')) || null;
}

function has(type) {
  return registry.has(String(type || ''));
}

// What the admin "add block" gallery lists, and what drives its generated
// forms. Deliberately excludes render/jsonLd — those are server-side only.
function catalogue() {
  return [...registry.values()]
    .map((b) => ({
      type: b.type,
      label: b.label || b.type,
      description: b.description || '',
      icon: b.icon || 'square',
      schema: b.schema || {},
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// ----- Validation -----
//
// Runs on write, against the same `schema` the admin form is generated from,
// so the form and the API cannot drift apart. Returns { data, errors }: the
// coerced data with unknown keys dropped, and a list of human-readable
// problems. Unknown keys are dropped rather than rejected so that removing a
// field from a schema does not make every existing row un-saveable.

const MAX_REPEATER_DEFAULT = 50;

function validateField(name, def, value, errors, trail) {
  const where = trail ? `${trail}.${name}` : name;
  const type = def.type || 'text';

  if (type === 'repeater') {
    const list = Array.isArray(value) ? value : [];
    const max = def.max || MAX_REPEATER_DEFAULT;
    if (def.min && list.length < def.min) {
      errors.push(`${where}: needs at least ${def.min} item(s)`);
    }
    if (list.length > max) {
      errors.push(`${where}: at most ${max} item(s)`);
      list.length = max;
    }
    return list.map((item, i) => {
      const out = {};
      for (const [k, sub] of Object.entries(def.fields || {})) {
        out[k] = validateField(k, sub, item && item[k], errors, `${where}[${i}]`);
      }
      return out;
    });
  }

  if (type === 'boolean') return Boolean(value);

  if (type === 'number') {
    const n = Number(value);
    if (value !== undefined && value !== '' && Number.isNaN(n)) {
      errors.push(`${where}: not a number`);
      return def.default ?? 0;
    }
    return Number.isNaN(n) ? (def.default ?? 0) : n;
  }

  if (type === 'select') {
    const options = (def.options || []).map((o) => (typeof o === 'string' ? o : o.value));
    const v = String(value == null ? '' : value);
    if (v && !options.includes(v)) {
      errors.push(`${where}: "${v}" is not one of ${options.join(', ')}`);
      return def.default ?? options[0] ?? '';
    }
    return v || def.default || options[0] || '';
  }

  // Everything else is a string: text, textarea, richtext, image, url.
  let s = value == null ? '' : String(value);
  const max = def.max || (type === 'richtext' ? 20000 : type === 'textarea' ? 4000 : 500);
  if (s.length > max) {
    errors.push(`${where}: longer than ${max} characters`);
    s = s.slice(0, max);
  }
  if (def.required && !s.trim()) errors.push(`${where}: required`);
  return s;
}

function validate(type, data) {
  const block = get(type);
  if (!block) return { data: {}, errors: [`unknown block type "${type}"`] };
  const errors = [];
  const out = {};
  for (const [name, def] of Object.entries(block.schema || {})) {
    out[name] = validateField(name, def, (data || {})[name], errors, '');
  }
  return { data: out, errors };
}

module.exports = { get, has, catalogue, validate, size: () => registry.size };
