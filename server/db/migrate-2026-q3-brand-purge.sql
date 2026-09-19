-- =====================================================================
-- 2026 Q3 — Finish the Acme → Zufek rename (JSONB-aware)
-- =====================================================================
-- The Q2 migration (migrate-2026-q2-seo.sql) cleaned the legacy "Acme"
-- brand out of the plain text columns and stopped there. Every content
-- table also stores prose inside JSONB columns, and none of those were
-- touched. On a deployment seeded before the rename that left, among
-- others:
--
--   pillar_pages.overview->>'body'
--     "Acme manufactures Li-Po cells from 30 mAh up to 20 Ah..."
--
-- which renders as body copy on /products/polymer-lithium-battery. The
-- placeholder brand shipped to production on a page whose whole job is
-- to establish that the manufacturer is real.
--
-- Why this migration discovers its own columns instead of listing them:
-- the Q2 migration listed columns by hand, and the list was wrong the
-- day it was written. Anything that has to be kept in sync by hand
-- drifts, so this walks information_schema for the content tables and
-- rewrites every text and JSONB column it finds. A column added next
-- quarter is covered without anyone remembering this file exists.
--
-- Deliberately NOT in scope (see content_tables below):
--   inquiries      — customer-submitted. "Acme Batteries GmbH" may be a
--                    real prospect's real company name; rewriting it
--                    corrupts a CRM record.
--   settings       — holds the ACME (RFC 8555) / Let's Encrypt config.
--                    "acme" there is the certificate protocol.
--   users, audit_logs, analytics_hits, media — no brand prose.
--
-- Matching is case-sensitive on the word "Acme" with word boundaries
-- (\m \M), so the ACME protocol survives in every spelling that matters
-- ("acme-v02.api.letsencrypt.org", "ACME", "acme-client").

DO $$
DECLARE
  -- Allowlist. Only tables whose text is ours to rewrite.
  content_tables TEXT[] := ARRAY[
    'pillar_pages', 'products', 'articles', 'applications',
    'pages', 'page_blocks', 'authors', 'categories', 'navigation'
  ];
  tbl      TEXT;
  col      RECORD;
  updated  BIGINT;
  total    BIGINT := 0;
BEGIN
  FOREACH tbl IN ARRAY content_tables LOOP
    -- Skip a table this deployment has not created yet. Keeps the
    -- migration runnable against an older schema without erroring out
    -- of the whole DO block.
    IF to_regclass('public.' || tbl) IS NULL THEN
      RAISE NOTICE '[brand-purge] skipping %, table not present', tbl;
      CONTINUE;
    END IF;

    FOR col IN
      SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name   = tbl
         AND data_type IN ('text', 'character varying', 'jsonb')
    LOOP
      IF col.data_type = 'jsonb' THEN
        -- Round-trip through text. Both "Acme" and its replacements are
        -- plain ASCII with no quote or backslash, so no JSON string can
        -- be broken by the substitution and the ::jsonb cast back is
        -- total. Structure, key order and numeric types are preserved
        -- because the document is never re-parsed into a new shape.
        EXECUTE format(
          'UPDATE %I SET %I = regexp_replace(
                              regexp_replace(
                                regexp_replace(%I::text,
                                  ''Acme Battery Co\.,? ?Ltd\.?'', ''Dongguan Zufek Technology Co., Ltd.'', ''g''),
                                ''\mAcme Battery\M'', ''Zufek'', ''g''),
                              ''\mAcme\M'', ''Zufek'', ''g'')::jsonb
             WHERE %I::text LIKE ''%%Acme%%''', tbl, col.column_name, col.column_name, col.column_name);
      ELSE
        -- varchar(n) columns can overflow: "Acme" (4) becomes "Zufek"
        -- (5). Only rewrite rows whose result still fits, and report
        -- the ones left behind rather than aborting the migration and
        -- rolling back every table that came before.
        EXECUTE format(
          'UPDATE %I SET %I = regexp_replace(
                              regexp_replace(
                                regexp_replace(%I,
                                  ''Acme Battery Co\.,? ?Ltd\.?'', ''Dongguan Zufek Technology Co., Ltd.'', ''g''),
                                ''\mAcme Battery\M'', ''Zufek'', ''g''),
                              ''\mAcme\M'', ''Zufek'', ''g'')
             WHERE %I LIKE ''%%Acme%%'' %s',
          tbl, col.column_name, col.column_name, col.column_name,
          CASE WHEN col.character_maximum_length IS NULL THEN ''
               ELSE format('AND length(regexp_replace(regexp_replace(regexp_replace(%I,
                              ''Acme Battery Co\.,? ?Ltd\.?'', ''Dongguan Zufek Technology Co., Ltd.'', ''g''),
                              ''\mAcme Battery\M'', ''Zufek'', ''g''),
                              ''\mAcme\M'', ''Zufek'', ''g'')) <= %s',
                           col.column_name, col.character_maximum_length)
          END);
      END IF;

      GET DIAGNOSTICS updated = ROW_COUNT;
      IF updated > 0 THEN
        total := total + updated;
        RAISE NOTICE '[brand-purge] %.%: % row(s)', tbl, col.column_name, updated;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '[brand-purge] % row-column rewrite(s) total', total;
END$$;

-- ---------------------------------------------------------------------
-- Residue report
-- ---------------------------------------------------------------------
-- Anything still matching after the pass above is a row that could not
-- be rewritten — in practice a varchar(n) that would overflow. Surface
-- it in the migration log so an operator can shorten the copy by hand
-- instead of discovering it on a live product page.
DO $$
DECLARE
  content_tables TEXT[] := ARRAY[
    'pillar_pages', 'products', 'articles', 'applications',
    'pages', 'page_blocks', 'authors', 'categories', 'navigation'
  ];
  tbl  TEXT;
  col  RECORD;
  n    BIGINT;
BEGIN
  FOREACH tbl IN ARRAY content_tables LOOP
    IF to_regclass('public.' || tbl) IS NULL THEN CONTINUE; END IF;
    FOR col IN
      SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = tbl
         AND data_type IN ('text', 'character varying', 'jsonb')
    LOOP
      EXECUTE format(
        'SELECT count(*) FROM %I WHERE %s ~ ''\mAcme\M''',
        tbl,
        CASE WHEN col.data_type = 'jsonb' THEN format('%I::text', col.column_name)
             ELSE format('%I', col.column_name) END
      ) INTO n;
      IF n > 0 THEN
        RAISE WARNING '[brand-purge] RESIDUE %.% still matches "Acme" in % row(s) — needs a manual edit', tbl, col.column_name, n;
      END IF;
    END LOOP;
  END LOOP;
END$$;
