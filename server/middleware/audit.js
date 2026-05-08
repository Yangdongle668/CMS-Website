const { query } = require('../db/client');
const { sha256 } = require('../utils/hash');

async function recordAudit({ req, action, entity, entityId = '', detail = {} }) {
  try {
    const user = req.user || {};
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
    await query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity, entity_id, detail, ip_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        user.id || null,
        user.email || '',
        String(action).slice(0, 60),
        String(entity).slice(0, 60),
        String(entityId).slice(0, 60),
        detail || {},
        sha256(ip),
      ]
    );
  } catch (err) {
    console.error('[audit] failed to record', err.message);
  }
}

module.exports = { recordAudit };
