const express = require('express');
const { many } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { clamp } = require('../utils/validate');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const limit = clamp(req.query.limit, 1, 200, 50);
  const offset = clamp(req.query.offset, 0, 1e6, 0);
  const rows = await many(
    `SELECT id, user_email, action, entity, entity_id, detail, created_at
     FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  res.json({ items: rows });
});

module.exports = router;
