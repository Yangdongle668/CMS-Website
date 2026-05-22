-- ---------------------------------------------------------------------------
-- Rewrite every Unsplash CDN URL stored in the DB to the self-hosted path.
-- Matches: https://images.unsplash.com/photo-<slug>?<any-params>
-- Replaces: /assets/img/seed/photo-<slug>.jpg
--
-- Idempotent — rows that already use /assets/img/seed/ are untouched.
-- ---------------------------------------------------------------------------

UPDATE pillar_pages
   SET hero_image = '/assets/img/seed/' ||
                    (regexp_matches(hero_image, 'photo-[a-zA-Z0-9_-]+'))[1] || '.jpg'
 WHERE hero_image LIKE '%images.unsplash.com/photo-%';

UPDATE products
   SET cover_url = '/assets/img/seed/' ||
                   (regexp_matches(cover_url, 'photo-[a-zA-Z0-9_-]+'))[1] || '.jpg'
 WHERE cover_url LIKE '%images.unsplash.com/photo-%';

UPDATE applications
   SET cover_url = '/assets/img/seed/' ||
                   (regexp_matches(cover_url, 'photo-[a-zA-Z0-9_-]+'))[1] || '.jpg'
 WHERE cover_url LIKE '%images.unsplash.com/photo-%';

UPDATE articles
   SET cover_url = '/assets/img/seed/' ||
                   (regexp_matches(cover_url, 'photo-[a-zA-Z0-9_-]+'))[1] || '.jpg'
 WHERE cover_url LIKE '%images.unsplash.com/photo-%';

UPDATE articles
   SET hero_image = '/assets/img/seed/' ||
                    (regexp_matches(hero_image, 'photo-[a-zA-Z0-9_-]+'))[1] || '.jpg'
 WHERE hero_image LIKE '%images.unsplash.com/photo-%';

UPDATE pages
   SET og_image_url = '/assets/img/seed/' ||
                      (regexp_matches(og_image_url, 'photo-[a-zA-Z0-9_-]+'))[1] || '.jpg'
 WHERE og_image_url LIKE '%images.unsplash.com/photo-%';

UPDATE pages
   SET twitter_image_url = '/assets/img/seed/' ||
                           (regexp_matches(twitter_image_url, 'photo-[a-zA-Z0-9_-]+'))[1] || '.jpg'
 WHERE twitter_image_url LIKE '%images.unsplash.com/photo-%';

UPDATE pages
   SET hero_image = '/assets/img/seed/' ||
                    (regexp_matches(hero_image, 'photo-[a-zA-Z0-9_-]+'))[1] || '.jpg'
 WHERE hero_image LIKE '%images.unsplash.com/photo-%';
