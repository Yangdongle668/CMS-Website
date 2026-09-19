// The public settings bundle — site details, social links and the
// navigation tree — resolved once and shared by everything that needs
// it: /api/settings/public (which the browser fetches) and the
// server-side chrome renderer (which puts the same nav into the HTML
// before the browser runs any JS).
//
// It lives in its own module because those two had to agree and there
// was no way to make them agree while each built the tree itself. The
// navigation JSON in `settings` is only a skeleton: nodes tagged with a
// known `nav` key get their children replaced by the live published
// rows, so adding an application or a pillar in the admin shows up in
// the header and footer without anyone editing JSON.

const { many } = require('../db/client');

const PUBLIC_KEYS = ['site', 'social', 'seo', 'gdpr', 'navigation', 'organization'];

// Short TTL rather than an explicit invalidation graph: the nav changes
// when an operator saves settings or publishes a pillar, and half a
// minute of staleness on a footer column is not worth the bookkeeping.
// invalidate() is still called on save so the admin sees its own edit.
const TTL_MS = 30 * 1000;
let cache = null;
let cachedAt = 0;

function invalidate() { cache = null; cachedAt = 0; }

async function loadPublicSettings() {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;

  const out = {};
  try {
    const rows = await many(
      `SELECT key, value FROM settings WHERE key = ANY($1::text[])`, [PUBLIC_KEYS]
    );
    for (const r of rows) out[r.key] = r.value;
  } catch (_) {
    // First boot before the settings table exists. Callers fall back to
    // their own defaults rather than rendering a page with no nav.
    return out;
  }

  if (out.navigation && Array.isArray(out.navigation.header)) {
    try {
      const [apps, pillars] = await Promise.all([
        many(`SELECT slug, name FROM applications WHERE status='published' ORDER BY sort_order, id`),
        many(`SELECT slug, name FROM pillar_pages WHERE status='published' ORDER BY sort_order, id`),
      ]);
      const appChildren = apps.map((a) => ({ label: a.name, url: `/applications/${a.slug}.html` }));
      const pillarChildren = pillars.map((p) => ({ label: p.name, url: `/products/${p.slug}` }));
      out.navigation = {
        ...out.navigation,
        header: out.navigation.header.map((item) => {
          if (item.nav === 'applications' && appChildren.length) return { ...item, children: appChildren };
          if (item.nav === 'products' && pillarChildren.length) return { ...item, children: pillarChildren };
          return item;
        }),
      };
    } catch (_) {
      // Auto-expand failed (tables not migrated yet) — the static
      // skeleton already in out.navigation is a correct, if staler, nav.
    }
  }

  cache = out;
  cachedAt = Date.now();
  return out;
}

module.exports = { loadPublicSettings, invalidate, PUBLIC_KEYS };
