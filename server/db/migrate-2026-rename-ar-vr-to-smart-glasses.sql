-- =====================================================================
-- Rename `ar-vr` application + page slug to `smart-glasses` and update
-- copy to focus on AI smart glasses (Meta Ray-Ban, Rokid, Even Realities
-- class) rather than VR headsets. Idempotent: re-running has no effect.
-- =====================================================================

-- ----- applications table -----
UPDATE applications SET
  slug             = 'smart-glasses',
  name             = 'Smart Glasses',
  summary          = 'Ultra-thin Li-Po pouches for AI smart-glasses temples — Meta Ray-Ban, Rokid and Even Realities class frames.',
  body             = 'Smart-glasses OEMs use our 0.45-1.8 mm Li-Po cells (150-380 mAh per temple) for audio-only, camera-enabled and waveguide-display AI eyewear that has to clear a full day of use.',
  meta_title       = 'Smart Glasses Battery Manufacturer — Ultra-Thin Li-Po Cells | Zufek',
  meta_description = 'Ultra-thin Li-Po cells for AI smart glasses (Meta Ray-Ban, Rokid, Even Realities class). 0.45-1.8 mm thickness, 150-380 mAh per temple, 800+ cycle life. ISO 9001 + UN 38.3 certified.',
  updated_at       = now()
WHERE slug = 'ar-vr';

-- ----- pages table (CMS page for /applications/ar-vr.html) -----
UPDATE pages SET
  slug             = 'applications/smart-glasses',
  title            = 'Smart Glasses',
  meta_title       = 'Batteries for AI Smart Glasses — Ultra-Thin Cells',
  meta_description = 'Ultra-thin Li-Po cells for AI smart-glasses temples — Meta Ray-Ban, Rokid and Even Realities class frames.',
  hero_title       = 'Batteries for Smart Glasses.',
  hero_subtitle    = 'Ultra-thin curved cells engineered for the AI smart-glasses temple — audio, camera and waveguide display frames.',
  hero_breadcrumbs = '[{"label":"Home","url":"/"},{"label":"Applications","url":"/applications/"},{"label":"Smart Glasses"}]'::jsonb,
  focus_keyword    = 'smart glasses battery',
  updated_at       = now()
WHERE slug = 'applications/ar-vr';

-- ----- pillar_pages.applications JSONB array (custom-shape pillar lists ar-vr) -----
-- Replace the string element in-place so other entries (medical, wearables, iot)
-- are preserved.
UPDATE pillar_pages
   SET applications = (
         SELECT jsonb_agg(CASE WHEN elem = '"ar-vr"'::jsonb
                                 THEN '"smart-glasses"'::jsonb
                                 ELSE elem
                            END)
           FROM jsonb_array_elements(applications) AS elem
       ),
       updated_at = now()
 WHERE applications @> '["ar-vr"]'::jsonb;

-- ----- settings.site.tagline + settings.nav nav-menu + organization -----
-- Embedded URLs/labels live inside JSONB; cast to text, replace, cast back.
UPDATE settings
   SET value      = replace(
                      replace(
                        replace(value::text,
                          '"/applications/ar-vr.html"', '"/applications/smart-glasses.html"'),
                        '"AR / VR Glasses"', '"Smart Glasses"'),
                      'AR/VR, medical, wearables and IoT',
                      'AI smart glasses, medical, wearables and IoT')::jsonb,
       updated_at = now()
 WHERE key IN ('site','nav','organization')
   AND (value::text LIKE '%ar-vr%' OR value::text LIKE '%AR / VR%' OR value::text LIKE '%AR/VR%');
