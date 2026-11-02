-- Restore the bundled original homepage image, preserving custom uploads.
UPDATE pages SET hero_image = '/assets/img/seed/photo-1593642634443-44adaa06623a.jpg'
WHERE slug = 'home' AND hero_image = '/assets/img/generated/home-battery-range.webp';
