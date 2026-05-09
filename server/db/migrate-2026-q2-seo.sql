-- =====================================================================
-- 2026 Q2 SEO migration
--
-- 1) Adds RankMath-style SEO columns to all 5 content tables:
--    pages, pillar_pages, products, applications, articles.
--    All columns are idempotent (ADD COLUMN IF NOT EXISTS) so this is
--    safe to re-run.
--
-- 2) Cleans up legacy "Acme" author strings in the articles table
--    (left over from before the brand was unified to "Zufek" in
--    seed.sql). Article rows whose author_id is set will display the
--    named author from the authors table (driven by the SSR JOIN);
--    rows that fall back to the legacy a.author column will now
--    correctly show "Zufek Engineering".
--
-- Run on existing deployments:
--   docker compose exec db psql -U postgres battery_cms < server/db/migrate-2026-q2-seo.sql
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------
-- 1. SEO columns — applied to all 5 content tables
-- ---------------------------------------------------------------
-- focus_keyword       primary keyword the page is optimised around
-- secondary_keywords  []string, JSONB
-- canonical_override  full URL when canonical needs to differ from default
-- robots              "index,follow" | "noindex,follow" | "noindex,nofollow"
-- og_title / og_description / og_image_url
--                     overrides for OpenGraph tags (else fall back to
--                     meta_title / meta_description / DEFAULT_OG_IMAGE)
-- twitter_title / twitter_description / twitter_image_url
--                     overrides for Twitter Card (else fall back to og_*)
-- schema_type         override for primary JSON-LD @type (e.g. Article →
--                     TechArticle, WebPage → AboutPage)
-- schema_extra        JSONB blob merged into the primary @graph entity
--                     (e.g. for Product: aggregateRating, review)
-- seo_score           0-100 last computed score from the admin panel
-- seo_checks          JSONB snapshot of last analysis (which checks passed)

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['pages','pillar_pages','products','applications','articles'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS focus_keyword VARCHAR(190) NOT NULL DEFAULT '''';', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS secondary_keywords JSONB NOT NULL DEFAULT ''[]''::jsonb;', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS canonical_override VARCHAR(500) NOT NULL DEFAULT '''';', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS robots VARCHAR(80) NOT NULL DEFAULT '''';', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS og_title VARCHAR(255) NOT NULL DEFAULT '''';', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS og_description TEXT NOT NULL DEFAULT '''';', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS og_image_url VARCHAR(500) NOT NULL DEFAULT '''';', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS twitter_title VARCHAR(255) NOT NULL DEFAULT '''';', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS twitter_description TEXT NOT NULL DEFAULT '''';', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS twitter_image_url VARCHAR(500) NOT NULL DEFAULT '''';', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS schema_type VARCHAR(80) NOT NULL DEFAULT '''';', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS schema_extra JSONB NOT NULL DEFAULT ''{}''::jsonb;', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS seo_score INT NOT NULL DEFAULT 0;', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS seo_checks JSONB NOT NULL DEFAULT ''[]''::jsonb;', t);
  END LOOP;
END$$;

-- ---------------------------------------------------------------
-- 2. Cleanup legacy "Acme" strings in the articles table
-- ---------------------------------------------------------------
-- articles.author is the legacy free-text author column (kept for back-
-- compat). Anything still saying "Acme Engineering" comes from the
-- pre-Zufek seed; flip it forward.
UPDATE articles
   SET author = 'Zufek Engineering'
 WHERE author ILIKE '%acme%'
    OR author = ''
    OR author IS NULL;

-- Same defensive replacement for any embedded references inside the
-- article HTML body.
UPDATE articles
   SET content = REPLACE(content, 'Acme Engineering', 'Zufek Engineering')
 WHERE content LIKE '%Acme%';
UPDATE articles
   SET content = REPLACE(content, 'Acme', 'Zufek')
 WHERE content LIKE '%Acme%';

-- And the same for any pillar/product/application/page that might still
-- carry an Acme reference in user-editable text columns.
UPDATE pages
   SET hero_subtitle = REPLACE(hero_subtitle, 'Acme', 'Zufek'),
       body_html     = REPLACE(body_html,     'Acme', 'Zufek'),
       meta_title    = REPLACE(meta_title,    'Acme', 'Zufek'),
       meta_description = REPLACE(meta_description, 'Acme', 'Zufek')
 WHERE hero_subtitle LIKE '%Acme%' OR body_html LIKE '%Acme%'
    OR meta_title LIKE '%Acme%'    OR meta_description LIKE '%Acme%';

UPDATE pillar_pages
   SET hero_subtitle = REPLACE(hero_subtitle, 'Acme', 'Zufek'),
       meta_title    = REPLACE(meta_title,    'Acme', 'Zufek'),
       meta_description = REPLACE(meta_description, 'Acme', 'Zufek')
 WHERE hero_subtitle LIKE '%Acme%' OR meta_title LIKE '%Acme%'
    OR meta_description LIKE '%Acme%';

UPDATE products
   SET description   = REPLACE(description, 'Acme', 'Zufek'),
       tagline       = REPLACE(tagline,     'Acme', 'Zufek'),
       meta_title    = REPLACE(meta_title,  'Acme', 'Zufek'),
       meta_description = REPLACE(meta_description, 'Acme', 'Zufek')
 WHERE description LIKE '%Acme%' OR tagline LIKE '%Acme%'
    OR meta_title LIKE '%Acme%' OR meta_description LIKE '%Acme%';

UPDATE applications
   SET summary       = REPLACE(summary, 'Acme', 'Zufek'),
       body          = REPLACE(body,    'Acme', 'Zufek'),
       meta_title    = REPLACE(meta_title, 'Acme', 'Zufek'),
       meta_description = REPLACE(meta_description, 'Acme', 'Zufek')
 WHERE summary LIKE '%Acme%' OR body LIKE '%Acme%'
    OR meta_title LIKE '%Acme%' OR meta_description LIKE '%Acme%';

-- ---------------------------------------------------------------
-- 3. Round-robin author binding for any article still missing
--    author_id (so the blog cards never fall back to the generic
--    "Zufek Engineering" string when we have a real author available).
-- ---------------------------------------------------------------
WITH ranked AS (
  SELECT a.id,
         row_number() OVER (ORDER BY a.published_at DESC NULLS LAST, a.id) AS rn
    FROM articles a
   WHERE a.author_id IS NULL
),
authors_arr AS (
  SELECT array_agg(id ORDER BY id) AS ids FROM authors WHERE is_active
)
UPDATE articles a
   SET author_id = (SELECT ids FROM authors_arr)[ ((r.rn - 1) % array_length((SELECT ids FROM authors_arr), 1)) + 1 ]
  FROM ranked r
 WHERE a.id = r.id
   AND (SELECT array_length(ids, 1) FROM authors_arr) > 0;

COMMIT;
