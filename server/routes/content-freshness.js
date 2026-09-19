// Admin endpoint behind the "内容新鲜度" panel on the SEO overview page.
// Thin wrapper over services/content-freshness so the same numbers back
// the panel and the alert email.

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const freshness = require('../services/content-freshness');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    res.json(await freshness.report());
  } catch (err) {
    res.status(500).json({ error: 'freshness_failed', message: String(err && err.message || err) });
  }
});

module.exports = router;
