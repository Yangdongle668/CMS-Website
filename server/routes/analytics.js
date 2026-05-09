// Admin analytics API — aggregate-only views over the analytics_hits
// table. Every endpoint requires admin auth.
//
// Why server-side aggregation (not client-side raw rows):
//   * The hits table can grow large (millions of rows on busy sites).
//     Streaming raw rows to the browser would be wasteful + slow.
//   * Pre-aggregated counts let the dashboard render in <100 ms even
//     on a year of history.
//   * Raw rows include visitor_hash; even though we never expose it,
//     keeping it server-side is one fewer surface where it could leak.

const express = require('express');
const { many, one } = require('../db/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const VALID_RANGES = {
  '24h':  { hours:    24, bucket: 'hour'  },
  '7d':   { hours:  7*24, bucket: 'day'   },
  '30d':  { hours: 30*24, bucket: 'day'   },
  '90d':  { hours: 90*24, bucket: 'day'   },
  '365d': { hours:365*24, bucket: 'week'  },
};

function rangeFromQuery(q) {
  const r = String(q.range || '30d');
  return VALID_RANGES[r] ? { key: r, ...VALID_RANGES[r] } : { key: '30d', ...VALID_RANGES['30d'] };
}

router.use(requireAuth);

// ===== Summary endpoint — drives the dashboard =====
router.get('/summary', async (req, res) => {
  const range = rangeFromQuery(req.query);
  const since = new Date(Date.now() - range.hours * 3600 * 1000);

  const [totals, daily, topPages, topCountries, topBrowsers, topOs, topReferers, topEntry] = await Promise.all([
    one(
      `SELECT
         count(*)::int AS hits,
         count(DISTINCT visitor_hash)::int AS visitors
       FROM analytics_hits WHERE ts >= $1 AND is_bot = FALSE`,
      [since]
    ),
    many(
      `SELECT date_trunc($2, ts AT TIME ZONE 'UTC') AS bucket,
              count(*)::int AS hits,
              count(DISTINCT visitor_hash)::int AS visitors
         FROM analytics_hits
        WHERE ts >= $1 AND is_bot = FALSE
        GROUP BY bucket
        ORDER BY bucket`,
      [since, range.bucket]
    ),
    many(
      `SELECT path, count(*)::int AS hits, count(DISTINCT visitor_hash)::int AS visitors
         FROM analytics_hits
        WHERE ts >= $1 AND is_bot = FALSE
        GROUP BY path
        ORDER BY hits DESC
        LIMIT 20`,
      [since]
    ),
    many(
      `SELECT COALESCE(NULLIF(country,''),'XX') AS country,
              count(*)::int AS hits,
              count(DISTINCT visitor_hash)::int AS visitors
         FROM analytics_hits
        WHERE ts >= $1 AND is_bot = FALSE
        GROUP BY country
        ORDER BY hits DESC
        LIMIT 60`,
      [since]
    ),
    many(
      `SELECT COALESCE(NULLIF(browser,''),'Unknown') AS browser, count(*)::int AS hits
         FROM analytics_hits
        WHERE ts >= $1 AND is_bot = FALSE
        GROUP BY browser
        ORDER BY hits DESC`,
      [since]
    ),
    many(
      `SELECT COALESCE(NULLIF(os,''),'Unknown') AS os, count(*)::int AS hits
         FROM analytics_hits
        WHERE ts >= $1 AND is_bot = FALSE
        GROUP BY os
        ORDER BY hits DESC`,
      [since]
    ),
    many(
      `SELECT referer_host, count(*)::int AS hits
         FROM analytics_hits
        WHERE ts >= $1 AND is_bot = FALSE AND referer_host <> ''
        GROUP BY referer_host
        ORDER BY hits DESC
        LIMIT 15`,
      [since]
    ),
    // Most-active entry hour heat — used to recommend "best time to publish".
    many(
      `SELECT EXTRACT(DOW FROM ts AT TIME ZONE 'UTC')::int AS dow,
              EXTRACT(HOUR FROM ts AT TIME ZONE 'UTC')::int AS hour,
              count(*)::int AS hits
         FROM analytics_hits
        WHERE ts >= $1 AND is_bot = FALSE
        GROUP BY dow, hour`,
      [since]
    ),
  ]);

  res.json({
    range: range.key,
    since: since.toISOString(),
    totals: totals || { hits: 0, visitors: 0 },
    daily,
    top_pages: topPages,
    top_countries: topCountries,
    top_browsers: topBrowsers,
    top_os: topOs,
    top_referers: topReferers,
    heatmap: topEntry,
  });
});

// ===== Recent visitors — paginated list of raw hits, newest first =====
// Includes ip_text + country so the operator can audit traffic origins.
router.get('/visitors', async (req, res) => {
  const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit  || '50', 10)));
  const offset =        Math.max(0, parseInt(req.query.offset || '0', 10));
  const where = ['is_bot = FALSE'];
  const params = [];
  if (req.query.country) {
    params.push(String(req.query.country).toUpperCase().slice(0, 2));
    where.push(`country = $${params.length}`);
  }
  if (req.query.path) {
    params.push(String(req.query.path));
    where.push(`path = $${params.length}`);
  }
  if (req.query.ip) {
    params.push(String(req.query.ip));
    where.push(`ip_text = $${params.length}`);
  }
  params.push(limit);
  params.push(offset);
  const items = await many(
    `SELECT id, ts, path, country, browser, os, referer_host, ip_text
       FROM analytics_hits
      WHERE ${where.join(' AND ')}
      ORDER BY ts DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  const total = await one(
    `SELECT count(*)::int AS n FROM analytics_hits WHERE ${where.join(' AND ')}`,
    params.slice(0, params.length - 2)
  );
  res.json({ items, total: total ? total.n : 0, limit, offset });
});

// ===== Privacy: clear stored raw IPs older than N days =====
// Operator-triggered, non-destructive (keeps the row, only blanks
// ip_text). Useful for GDPR retention compliance.
router.post('/purge-ips', async (req, res) => {
  const days = Math.max(1, Math.min(3650, parseInt((req.body && req.body.days) || '30', 10)));
  const r = await one(
    `WITH updated AS (
        UPDATE analytics_hits SET ip_text = ''
         WHERE ip_text <> '' AND ts < NOW() - ($1 || ' days')::interval
         RETURNING 1
     ) SELECT count(*)::int AS n FROM updated`,
    [String(days)]
  );
  res.json({ ok: true, anonymized: r ? r.n : 0, days });
});

// ===== Realtime — last 5 minutes + last 30 minutes hits per minute =====
router.get('/realtime', async (_req, res) => {
  const since = new Date(Date.now() - 30 * 60 * 1000);
  const [active, perMin, recentPaths] = await Promise.all([
    one(
      `SELECT count(DISTINCT visitor_hash)::int AS active
         FROM analytics_hits
        WHERE ts >= NOW() - INTERVAL '5 minutes' AND is_bot = FALSE`
    ),
    many(
      `SELECT date_trunc('minute', ts) AS bucket, count(*)::int AS hits
         FROM analytics_hits
        WHERE ts >= $1 AND is_bot = FALSE
        GROUP BY bucket
        ORDER BY bucket`,
      [since]
    ),
    many(
      `SELECT path, count(*)::int AS hits
         FROM analytics_hits
        WHERE ts >= NOW() - INTERVAL '5 minutes' AND is_bot = FALSE
        GROUP BY path
        ORDER BY hits DESC
        LIMIT 8`
    ),
  ]);
  res.json({
    active: (active && active.active) || 0,
    per_minute: perMin,
    recent_paths: recentPaths,
  });
});

module.exports = router;
