// Aggregator API for the admin "SEO 概览" page. Returns GSC + GA4 + Bing
// data in one shot so the frontend stays simple. Each integration runs
// independently — a failure in one (e.g. Bing key expired) does not
// disable the others; the frontend gets a per-integration error string.

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const seo = require('../services/seo-integrations');

const router = express.Router();
router.use(requireAuth);

const VALID_DAYS = new Set([7, 14, 28, 30, 90]);
function daysFromQuery(q) {
  const n = parseInt(q.days || '28', 10);
  return VALID_DAYS.has(n) ? n : 28;
}

router.get('/', async (req, res) => {
  const days = daysFromQuery(req.query);
  const settings = await seo.loadSettings();

  // Run all three in parallel; capture errors per-integration so the page
  // shows partial data when only one provider is misconfigured.
  const [gsc, ga4, bing] = await Promise.all([
    seo.fetchGsc(settings, days).catch((err) => ({ configured: !!settings.gsc_property, error: shortError(err) })),
    seo.fetchGa4(settings, days).catch((err) => ({ configured: !!settings.ga4_property_id, error: shortError(err) })),
    seo.fetchBing(settings, days).catch((err) => ({ configured: !!settings.bing_api_key, error: shortError(err) })),
  ]);
  res.json({ days, gsc, ga4, bing });
});

function shortError(err) {
  const m = (err && err.message) || String(err || 'unknown');
  return m.length > 200 ? m.slice(0, 200) + '…' : m;
}

module.exports = router;
