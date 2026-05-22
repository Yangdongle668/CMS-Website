-- ============================================================
-- Add two application landing pages: power-tools, industrial-handhelds.
-- Idempotent — safe to re-run. The static landing pages live at
--   /public/applications/power-tools.html
--   /public/applications/industrial-handhelds.html
-- These DB rows back the /api/applications enumeration, sitemap.xml
-- emission, and the auto-expanded navigation children.
-- ============================================================

INSERT INTO applications (slug, name, icon, cover_url, summary, body, sort_order, status) VALUES
('power-tools', 'Power Tools', 'power-tools',
 '/assets/img/seed/photo-1581147036324-c1c89c2c8b5c.jpg',
 'Custom Li-Po packs for cordless screwdrivers, light-duty drills, garden tools, hot-glue guns and consumer DIY platforms — wherever pouch-format wins on packaging or weight.',
 'We serve the slice of the power-tool market where polymer Li-Po pouches are competitive: 6–12 V cordless screwdrivers, light drills, gimbal-mounted tools, garden trimmers, glue guns, soldering irons, kids'' DIY platforms and second-tier consumer brands chasing thinner / lighter form factors. We do not make 18650 / 21700 cylindrical packs for 18 V+ heavy-duty platforms — for those, a cylindrical supplier is the right path.',
 7, 'published'),
('industrial-handhelds', 'Industrial Handhelds', 'industrial-handhelds',
 '/assets/img/seed/photo-1556157382-97eda2d62296.jpg',
 'Slim, sealed Li-Po packs for barcode scanners, mobile data terminals, RFID readers, POS handhelds, inspection cameras and ruggedised industrial tablets.',
 'Industrial handheld OEMs use our custom Li-Po pouches (1,500–8,000 mAh) and 2S smart packs (with SMBus gauge + thermistor) for barcode scanners, mobile data terminals, RFID readers, line-of-business POS terminals, borescopes, thermal cameras and field tablets. Polymer wins here because the housing is IP65-sealed and every millimeter of internal volume goes to optics, screen or grip — not to the battery cavity a cylindrical pack would need.',
 8, 'published')
ON CONFLICT (slug) DO NOTHING;

-- Backfill SEO meta. Use UPDATE so re-runs harmlessly overwrite with the
-- canonical copy if the row exists (created by the INSERT above, or by a
-- prior partial seed).
UPDATE applications SET
  meta_title       = 'Power Tool Battery Manufacturer — Custom Li-Po Packs for Cordless Tools | Zufek',
  meta_description = 'Custom Li-Po pouches and smart packs for 6–12 V cordless screwdrivers, light drills, garden tools, glue guns and consumer DIY platforms. UN 38.3 + IEC 62133-2.',
  focus_keyword    = 'power tool Li-Po battery'
WHERE slug = 'power-tools';

UPDATE applications SET
  meta_title       = 'Industrial Handheld Battery — Slim Li-Po Packs for Scanners & MDTs | Zufek',
  meta_description = 'Slim, sealed Li-Po packs and 2S smart packs for barcode scanners, mobile data terminals, RFID readers, POS handhelds and inspection cameras. IP65-housing-friendly.',
  focus_keyword    = 'industrial handheld battery manufacturer'
WHERE slug = 'industrial-handhelds';
