-- ---------------------------------------------------------------------------
-- Rewrite every Unsplash CDN URL stored in the DB to the self-hosted path.
-- Matches: https://images.unsplash.com/photo-<slug>?<any-params>
-- Replaces: /assets/img/seed/photo-<slug>.jpg
--
-- Uses regexp_replace with a capture group — set-returning functions
-- (regexp_matches) are not allowed in UPDATE SET clauses in PostgreSQL.
-- Idempotent — rows that already use /assets/img/seed/ are untouched.
-- ---------------------------------------------------------------------------

UPDATE pillar_pages
   SET hero_image = regexp_replace(
         hero_image,
         'https?://images\.unsplash\.com/(photo-[a-zA-Z0-9_-]+)(\?[^'']*)?',
         '/assets/img/seed/\1.jpg'
       )
 WHERE hero_image LIKE '%images.unsplash.com/photo-%';

UPDATE products
   SET cover_url = regexp_replace(
         cover_url,
         'https?://images\.unsplash\.com/(photo-[a-zA-Z0-9_-]+)(\?[^'']*)?',
         '/assets/img/seed/\1.jpg'
       )
 WHERE cover_url LIKE '%images.unsplash.com/photo-%';

UPDATE applications
   SET cover_url = regexp_replace(
         cover_url,
         'https?://images\.unsplash\.com/(photo-[a-zA-Z0-9_-]+)(\?[^'']*)?',
         '/assets/img/seed/\1.jpg'
       )
 WHERE cover_url LIKE '%images.unsplash.com/photo-%';

UPDATE articles
   SET cover_url = regexp_replace(
         cover_url,
         'https?://images\.unsplash\.com/(photo-[a-zA-Z0-9_-]+)(\?[^'']*)?',
         '/assets/img/seed/\1.jpg'
       )
 WHERE cover_url LIKE '%images.unsplash.com/photo-%';

UPDATE articles
   SET hero_image = regexp_replace(
         hero_image,
         'https?://images\.unsplash\.com/(photo-[a-zA-Z0-9_-]+)(\?[^'']*)?',
         '/assets/img/seed/\1.jpg'
       )
 WHERE hero_image LIKE '%images.unsplash.com/photo-%';

UPDATE pages
   SET og_image_url = regexp_replace(
         og_image_url,
         'https?://images\.unsplash\.com/(photo-[a-zA-Z0-9_-]+)(\?[^'']*)?',
         '/assets/img/seed/\1.jpg'
       )
 WHERE og_image_url LIKE '%images.unsplash.com/photo-%';

UPDATE pages
   SET twitter_image_url = regexp_replace(
         twitter_image_url,
         'https?://images\.unsplash\.com/(photo-[a-zA-Z0-9_-]+)(\?[^'']*)?',
         '/assets/img/seed/\1.jpg'
       )
 WHERE twitter_image_url LIKE '%images.unsplash.com/photo-%';

UPDATE pages
   SET hero_image = regexp_replace(
         hero_image,
         'https?://images\.unsplash\.com/(photo-[a-zA-Z0-9_-]+)(\?[^'']*)?',
         '/assets/img/seed/\1.jpg'
       )
 WHERE hero_image LIKE '%images.unsplash.com/photo-%';
