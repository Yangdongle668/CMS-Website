-- =====================================================================
-- 2026 Q3 — Seed outbound citations on the standards-led articles
-- =====================================================================
-- Every published article shipped with zero outbound references. For a
-- blog whose whole subject is compliance and test standards that is the
-- weakest possible position: the articles explain UN 38.3, IEC 62133-2
-- and the EU Batteries Regulation without ever pointing at one of them,
-- so a reader has no way to check a claim and a search engine sees an
-- article about a standard that does not cite the standard.
--
-- This backfills the `citations` column (added in schema.sql) for the
-- articles where the primary source is unambiguous. It is a starting
-- set, not a complete bibliography — the column is operator-editable
-- and the rest of the catalogue should grow its own.
--
-- OPERATOR NOTE: these are the canonical landing pages of the issuing
-- bodies, chosen because deep links into standards catalogues change
-- when the publisher reorganises. Confirm each one resolves for your
-- region before publishing; a dead citation is worse than none.
--
-- Idempotent: only fills rows that have no citations yet, so an
-- operator's own edits are never overwritten by a redeploy.

UPDATE articles SET citations = $json$[
  {"label":"UN Manual of Tests and Criteria, Part III, sub-section 38.3","url":"https://unece.org/transport/dangerous-goods","publisher":"UNECE"},
  {"label":"IEC 62133-2 — Safety requirements for portable sealed secondary lithium cells","url":"https://webstore.iec.ch/","publisher":"International Electrotechnical Commission"}
]$json$::jsonb
 WHERE slug = 'un-iec-compliance' AND citations = '[]'::jsonb;

UPDATE articles SET citations = $json$[
  {"label":"IATA Dangerous Goods Regulations — Lithium Batteries","url":"https://www.iata.org/en/programs/cargo/dgr/","publisher":"IATA"},
  {"label":"UN Manual of Tests and Criteria, Part III, sub-section 38.3","url":"https://unece.org/transport/dangerous-goods","publisher":"UNECE"}
]$json$::jsonb
 WHERE slug IN ('lithium-shipping', 'lithium-air-freight') AND citations = '[]'::jsonb;

UPDATE articles SET citations = $json$[
  {"label":"Regulation (EU) 2023/1542 concerning batteries and waste batteries","url":"https://eur-lex.europa.eu/eli/reg/2023/1542/oj","publisher":"EUR-Lex"}
]$json$::jsonb
 WHERE slug IN ('eu-battery-passport', 'second-life-cells') AND citations = '[]'::jsonb;

UPDATE articles SET citations = $json$[
  {"label":"IEC 62133-2 — Safety requirements for portable sealed secondary lithium cells","url":"https://webstore.iec.ch/","publisher":"International Electrotechnical Commission"}
]$json$::jsonb
 WHERE slug IN ('thermal-runaway', 'cycle-life-curves') AND citations = '[]'::jsonb;

DO $$
DECLARE n BIGINT;
BEGIN
  SELECT count(*) INTO n FROM articles WHERE citations <> '[]'::jsonb;
  RAISE NOTICE '[citations] % article(s) now carry outbound references', n;
END$$;
