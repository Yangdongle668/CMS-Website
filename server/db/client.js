// =====================================================================
// PostgreSQL client — pooled, with transient-error retry on read/write
// statements. The retry only fires for connection-class errors
// (ECONNRESET, ENOTFOUND, connection terminated, etc.) so we don't
// silently mask logic errors or unique-violation conflicts.
//
// On a hot-failover or brief PG restart, this turns 5xx errors into
// momentary slowness without any application code being aware of it.
// =====================================================================
const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.PGPOOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : new Pool({
      host: process.env.PGHOST || '127.0.0.1',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'battery_cms',
      max: parseInt(process.env.PGPOOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

pool.on('error', (err) => {
  console.error('[pg] unexpected error on idle client', err && err.message);
});

// Retry on connection-level failures only. Application errors
// (syntax_error, unique_violation, etc.) carry a SQLSTATE and should
// surface immediately so callers can react.
const TRANSIENT_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EAI_AGAIN',
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now
  '08000', '08003', '08006', '08001', '08004', // connection_exception class
]);

function isTransient(err) {
  if (!err) return false;
  if (err.code && TRANSIENT_CODES.has(err.code)) return true;
  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes('connection terminated') ||
    msg.includes('connection ended') ||
    msg.includes('server closed the connection') ||
    msg.includes('client has encountered a connection error') ||
    msg.includes('timeout exceeded') ||
    msg.includes('too many connections')
  );
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function runWithRetry(text, params) {
  const max = parseInt(process.env.PG_RETRY_MAX || '3', 10);
  const baseDelay = parseInt(process.env.PG_RETRY_BASE_MS || '200', 10);
  let lastErr;
  for (let attempt = 0; attempt < max; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      lastErr = err;
      if (!isTransient(err)) throw err;
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`[pg] transient error (attempt ${attempt + 1}/${max}), retry in ${delay}ms: ${err.message}`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function query(text, params) {
  return runWithRetry(text, params);
}

async function one(text, params) {
  const { rows } = await runWithRetry(text, params);
  return rows[0] || null;
}

async function many(text, params) {
  const { rows } = await runWithRetry(text, params);
  return rows;
}

async function ping() {
  const r = await pool.query('SELECT 1 AS ok');
  return r.rows[0] && r.rows[0].ok === 1;
}

module.exports = { pool, query, one, many, ping, isTransient };
