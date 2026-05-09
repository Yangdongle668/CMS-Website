#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { pool, query } = require('./client');

async function run() {
  const wantSeed = process.argv.includes('--seed');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const seedPath = path.join(__dirname, 'seed.sql');

  console.log('[db:init] applying schema...');
  await query(fs.readFileSync(schemaPath, 'utf8'));
  console.log('[db:init] schema applied.');

  const seoMigPath = path.join(__dirname, 'migrate-2026-q2-seo.sql');
  if (fs.existsSync(seoMigPath)) {
    console.log('[db:init] applying 2026-q2-seo migration (idempotent)...');
    await query(fs.readFileSync(seoMigPath, 'utf8'));
    console.log('[db:init] 2026-q2-seo migration applied.');
  }

  if (wantSeed) {
    console.log('[db:init] applying seed data...');
    await query(fs.readFileSync(seedPath, 'utf8'));
    console.log('[db:init] seed applied.');
  }

  // Optional: pre-create an admin from env. If ADMIN_DEFAULT_EMAIL is not
  // set, we leave the user table empty and let the first POST to /api/auth/login
  // bootstrap an admin with whatever credentials the operator submits.
  const email = (process.env.ADMIN_DEFAULT_EMAIL || '').toLowerCase();
  const password = process.env.ADMIN_DEFAULT_PASSWORD || '';
  if (email && password && password.length >= 8) {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(password, 10);
      await query(
        'INSERT INTO users (email, password_hash, name, role, is_active) VALUES ($1, $2, $3, $4, TRUE)',
        [email, hash, 'Administrator', 'admin']
      );
      console.log(`[db:init] default admin created: ${email}`);
    } else {
      console.log(`[db:init] admin already exists: ${email}`);
    }
  } else {
    const { rows } = await query('SELECT count(*)::int AS n FROM users');
    if (rows[0].n === 0) {
      console.log('[db:init] no admin configured. Visit /admin/login.html and submit the email + password you want to use as the first admin.');
    }
  }

  await pool.end();
  console.log('[db:init] done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
