-- Backfill cover_url on the three initial sample articles that were inserted
-- without a cover image. The WHERE clause is idempotent (only fires when
-- cover_url is still NULL or empty) so re-running this migration is safe.

UPDATE articles
SET cover_url = '/assets/img/seed/photo-1558346490-a72e53ae2d4f.jpg',
    hero_image = COALESCE(NULLIF(hero_image, ''), '/assets/img/seed/photo-1558346490-a72e53ae2d4f.jpg')
WHERE slug = 'how-to-choose-li-po-capacity-iot'
  AND COALESCE(cover_url, '') = '';

UPDATE articles
SET cover_url = '/assets/img/seed/photo-1523275335684-37898b6baf30.jpg',
    hero_image = COALESCE(NULLIF(hero_image, ''), '/assets/img/seed/photo-1523275335684-37898b6baf30.jpg')
WHERE slug = 'designing-curved-batteries-for-wearables'
  AND COALESCE(cover_url, '') = '';

UPDATE articles
SET cover_url = '/assets/img/seed/photo-1580407195669-d0c11ee3c1c2.jpg',
    hero_image = COALESCE(NULLIF(hero_image, ''), '/assets/img/seed/photo-1580407195669-d0c11ee3c1c2.jpg')
WHERE slug = 'lir-vs-ml-coin-cell-which-to-choose'
  AND COALESCE(cover_url, '') = '';
