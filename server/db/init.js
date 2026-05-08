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

  if (wantSeed) {
    console.log('[db:init] applying seed data...');
    await query(fs.readFileSync(seedPath, 'utf8'));
    console.log('[db:init] seed applied.');
  }

  // Always ensure a default admin exists
  const email = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeMe!2026';
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

  await pool.end();
  console.log('[db:init] done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
