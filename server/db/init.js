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

  const coverBackfillPath = path.join(__dirname, 'migrate-cover-url-backfill.sql');
  if (fs.existsSync(coverBackfillPath)) {
    console.log('[db:init] applying cover-url backfill migration (idempotent)...');
    await query(fs.readFileSync(coverBackfillPath, 'utf8'));
    console.log('[db:init] cover-url backfill applied.');
  }

  const appsPowerHandheldsPath = path.join(__dirname, 'migrate-applications-power-handhelds.sql');
  if (fs.existsSync(appsPowerHandheldsPath)) {
    console.log('[db:init] applying applications/power-tools + industrial-handhelds migration (idempotent)...');
    await query(fs.readFileSync(appsPowerHandheldsPath, 'utf8'));
    console.log('[db:init] applications/power-tools + industrial-handhelds applied.');
  }

  const localizeImagesPath = path.join(__dirname, 'migrate-localize-images.sql');
  if (fs.existsSync(localizeImagesPath)) {
    console.log('[db:init] applying localize-images migration (rewrites Unsplash CDN URLs to /assets/img/seed/)...');
    await query(fs.readFileSync(localizeImagesPath, 'utf8'));
    console.log('[db:init] localize-images migration applied.');
  }

  const seoDefaultsPath = path.join(__dirname, 'migrate-2026-seed-seo-defaults.sql');
  if (fs.existsSync(seoDefaultsPath)) {
    console.log('[db:init] applying SEO/GEO defaults seed (idempotent — never overwrites)...');
    await query(fs.readFileSync(seoDefaultsPath, 'utf8'));
    console.log('[db:init] SEO/GEO defaults seed applied.');
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
