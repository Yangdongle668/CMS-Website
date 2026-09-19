// Content freshness — how long it has been since anything was published.
//
// The blog went four months without a post and nothing in the system
// noticed, because nothing was looking. Every existing check answers
// "is the server up"; none answers "is anyone still writing". A topic
// cluster that stops updating decays quietly: the pillar pages keep
// ranking for a while, the articles age out, and the first hard signal
// is a traffic chart six months later.
//
// This computes the numbers once and lets two callers share them —
// the admin SEO overview, which shows them, and the health-alert job,
// which emails when they cross a threshold.
//
// The thresholds are deliberately generous. A B2B manufacturer's blog
// running on a 2-4 week cadence is healthy; the point is to catch a
// publishing pipeline that has actually stopped, not to nag an editor
// who took a fortnight over a piece.

const { one, many } = require('../db/client');

const WARN_DAYS = 45;    // slipped past a monthly cadence
const STALE_DAYS = 90;   // a quarter with nothing published

/**
 * @returns {Promise<object>} freshness report; `status` is
 *   'ok' | 'warning' | 'stale' | 'empty'.
 */
async function report() {
  const summary = await one(`
    SELECT
      count(*)::int                                            AS published_count,
      max(published_at)                                        AS last_published_at,
      count(*) FILTER (WHERE published_at > now() - interval '30 days')::int AS published_last_30d,
      count(*) FILTER (WHERE published_at > now() - interval '90 days')::int AS published_last_90d
    FROM articles
    WHERE status = 'published' AND published_at IS NOT NULL`);

  const publishedCount = (summary && summary.published_count) || 0;
  const lastPublishedAt = (summary && summary.last_published_at) || null;

  if (!publishedCount || !lastPublishedAt) {
    return {
      status: 'empty',
      published_count: publishedCount,
      last_published_at: null,
      days_since_last_publish: null,
      published_last_30d: 0,
      published_last_90d: 0,
      thresholds: { warn_days: WARN_DAYS, stale_days: STALE_DAYS },
      oldest_unrevised: [],
    };
  }

  const days = Math.floor((Date.now() - new Date(lastPublishedAt).getTime()) / 86400000);

  // The articles most worth a refresh pass: published longest ago and
  // not edited since. `updated_at` moving is what we treat as a
  // revision, so an article that was re-checked last month does not
  // show up here just because it is old.
  let oldest = [];
  try {
    oldest = await many(`
      SELECT slug, title, published_at, updated_at,
             (EXTRACT(EPOCH FROM (now() - greatest(published_at, updated_at))) / 86400)::int AS days_since_touched
        FROM articles
       WHERE status = 'published' AND published_at IS NOT NULL
       ORDER BY greatest(published_at, updated_at) ASC
       LIMIT 10`);
  } catch (_) {}

  return {
    status: days >= STALE_DAYS ? 'stale' : days >= WARN_DAYS ? 'warning' : 'ok',
    published_count: publishedCount,
    last_published_at: lastPublishedAt,
    days_since_last_publish: days,
    published_last_30d: (summary && summary.published_last_30d) || 0,
    published_last_90d: (summary && summary.published_last_90d) || 0,
    thresholds: { warn_days: WARN_DAYS, stale_days: STALE_DAYS },
    oldest_unrevised: oldest,
  };
}

// One-line summary for the health-alert email. Returns null when there
// is nothing worth waking anyone for.
async function alertReason() {
  let r;
  try { r = await report(); } catch (_) { return null; }
  if (!r || r.status === 'ok' || r.status === 'empty') return null;
  return `Blog has not published in ${r.days_since_last_publish} days `
    + `(last: ${new Date(r.last_published_at).toISOString().slice(0, 10)}; `
    + `${r.published_last_90d} post(s) in the last 90 days)`;
}

module.exports = { report, alertReason, WARN_DAYS, STALE_DAYS };
