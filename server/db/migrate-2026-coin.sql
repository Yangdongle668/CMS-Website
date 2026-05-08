-- =====================================================================
-- Migration: replace the cylindrical Li-Ion pillar with the coin
-- steel-shell pillar, drop the old Standard/Custom static product
-- pages, and reset navigation + home + products/index so the new
-- seed.sql picks them up.
--
-- Run this ONCE on existing deployments BEFORE re-loading seed.sql:
--   docker compose exec db psql -U postgres battery_cms < server/db/migrate-2026-coin.sql
--   docker compose exec db psql -U postgres battery_cms < server/db/seed.sql
-- =====================================================================
BEGIN;

-- 1. Cylindrical pillar and its dependants
DELETE FROM articles      WHERE slug = '18650-vs-21700-which-cell-format-to-choose';
DELETE FROM products      WHERE slug = 'inr21700-50e';
DELETE FROM pillar_pages  WHERE slug = 'cylindrical-steel-shell-lithium-battery';

-- 2. Old Standard / Custom static pages (replaced by 3 pillar pages)
DELETE FROM pages         WHERE slug IN ('products/standard', 'products/custom');

-- 3. Reset settings + key pages so seed.sql can re-insert with new content
--    (seed uses ON CONFLICT DO NOTHING, so we have to clear first)
DELETE FROM settings      WHERE key = 'navigation';
DELETE FROM pages         WHERE slug IN ('home', 'products/index');

COMMIT;
