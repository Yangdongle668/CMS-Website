-- =====================================================================
-- 2026 Q3 — Point internal article links at canonical URLs
-- =====================================================================
-- Article bodies linked to /blog/<slug>.html. That spelling used to
-- answer 200 with an empty _template.html whose canonical pointed at
-- itself, so every article had a contentless twin competing with it,
-- and the articles themselves were the thing feeding those twins to
-- the crawler.
--
-- The router now 301s /blog/<slug>.html to /blog/<slug>, so nothing is
-- broken either way — but an internal link should not need a redirect
-- to arrive. A 301 hop costs crawl budget on every pass, and this site
-- has crawl budget to spare precisely because it was wasting it here.
--
-- Two link targets were never articles at all: "Back to Industry
-- Articles" and "Back to Battery Guides" pointed at /blog/industry.html
-- and /blog/guides.html, neither of which has ever existed. They become
-- the category-filtered blog index they were describing.
--
-- Idempotent: the patterns no longer match once rewritten.

UPDATE articles
   SET content = replace(content, '/blog/industry.html', '/blog/?category=industry-insights')
 WHERE content LIKE '%/blog/industry.html%';

UPDATE articles
   SET content = replace(content, '/blog/guides.html', '/blog/?category=technology')
 WHERE content LIKE '%/blog/guides.html%';

-- Remaining /blog/<slug>.html references are real articles. The capture
-- keeps the slug and drops only the extension.
UPDATE articles
   SET content = regexp_replace(content, '/blog/([a-z0-9-]+)\.html', '/blog/\1', 'g')
 WHERE content ~ '/blog/[a-z0-9-]+\.html';

-- Page bodies and pillar blocks can carry the same links.
UPDATE pages
   SET body_html = regexp_replace(body_html, '/blog/([a-z0-9-]+)\.html', '/blog/\1', 'g')
 WHERE body_html ~ '/blog/[a-z0-9-]+\.html';

UPDATE page_blocks
   SET data = regexp_replace(data::text, '/blog/([a-z0-9-]+)\.html', '/blog/\1', 'g')::jsonb
 WHERE data::text ~ '/blog/[a-z0-9-]+\.html';

DO $$
DECLARE n BIGINT;
BEGIN
  SELECT count(*) INTO n FROM articles WHERE content ~ '/blog/[a-z0-9-]+\.html';
  IF n > 0 THEN
    RAISE WARNING '[canonical-links] % article(s) still link to a .html twin', n;
  ELSE
    RAISE NOTICE '[canonical-links] all internal article links are canonical';
  END IF;
END$$;
