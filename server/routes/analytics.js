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
