#!/usr/bin/env node
require('dotenv').config();
const { pool, query } = require('../db/client');

async function run() {
  const retention = parseInt(process.env.GDPR_RETENTION_DAYS || '365', 10);
  const softDays = parseInt(process.env.GDPR_SOFT_DELETE_DAYS || '30', 10);

  // Hard delete soft-deleted inquiries older than softDays
  const r1 = await query(
    `DELETE FROM inquiries WHERE is_deleted = TRUE AND deleted_at < now() - ($1 || ' days')::interval`,
    [softDays]
  );

  // Soft-delete inquiries older than retention period
  const r2 = await query(
    `UPDATE inquiries
     SET is_deleted = TRUE, deleted_at = now()
     WHERE is_deleted = FALSE AND created_at < now() - ($1 || ' days')::interval`,
    [retention]
  );

  // Purge old consent and audit logs (keep 2 years for audit, 1 year for consent)
  const r3 = await query(
    `DELETE FROM consent_logs WHERE created_at < now() - interval '365 days'`
  );
  const r4 = await query(
    `DELETE FROM audit_logs WHERE created_at < now() - interval '730 days'`
  );

  console.log(`[retention] hard-deleted ${r1.rowCount} inquiries, soft-deleted ${r2.rowCount} aged inquiries, purged ${r3.rowCount} consent logs, purged ${r4.rowCount} audit logs.`);
  await pool.end();
}

run().catch((err) => { console.error(err); process.exit(1); });
