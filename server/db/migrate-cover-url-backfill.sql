-- Backfill cover_url on the three initial sample articles that were inserted
-- without a cover image. The WHERE clause is idempotent (only fires when
-- cover_url is still NULL or empty) so re-running this migration is safe.

UPDATE articles
SET cover_url = '/assets/img/generated/article-how-to-choose-li-po-capacity-iot.webp',
    hero_image = COALESCE(NULLIF(hero_image, ''), '/assets/img/generated/article-how-to-choose-li-po-capacity-iot.webp')
WHERE slug = 'how-to-choose-li-po-capacity-iot'
  AND COALESCE(cover_url, '') = '';

UPDATE articles
SET cover_url = '/assets/img/generated/article-wearable-chemistry.webp',
    hero_image = COALESCE(NULLIF(hero_image, ''), '/assets/img/generated/article-wearable-chemistry.webp')
WHERE slug = 'designing-curved-batteries-for-wearables'
  AND COALESCE(cover_url, '') = '';

UPDATE articles
SET cover_url = '/assets/img/generated/coin-cells.webp',
    hero_image = COALESCE(NULLIF(hero_image, ''), '/assets/img/generated/coin-cells.webp')
WHERE slug = 'lir-vs-ml-coin-cell-which-to-choose'
  AND COALESCE(cover_url, '') = '';
