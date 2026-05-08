const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST || '127.0.0.1',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'battery_cms',
      max: 10,
      idleTimeoutMillis: 30000,
    });

pool.on('error', (err) => {
  console.error('[pg] unexpected error on idle client', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function one(text, params) {
  const { rows } = await pool.query(text, params);
  return rows[0] || null;
}

async function many(text, params) {
  const { rows } = await pool.query(text, params);
  return rows;
}

module.exports = { pool, query, one, many };
