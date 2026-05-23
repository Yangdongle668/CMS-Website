-- =====================================================================
-- migrate-2026-seed-seo-defaults.sql
-- =====================================================================
-- Pre-populate settings rows that drive Organization + WebSite JSON-LD,
-- so Knowledge Panel / AI Overviews / ChatGPT citations all work out
-- of the box on a fresh install.
--
-- IDEMPOTENT: existing rows are NEVER overwritten (ON CONFLICT DO NOTHING).
-- Operator edits in /admin/settings.html always win.
-- =====================================================================

-- Organization — used to build Organization JSON-LD + sameAs + ContactPoint
INSERT INTO settings (key, value) VALUES (
  'organization',
  $JSON${
    "brand_name": "Zufek",
    "legal_name": "Dongguan Zufek Technology Co., Ltd.",
    "founding_date": "2018",
    "logo": "/logo.png",
    "vat_id": "",
    "duns": "",
    "naics": "335912",
    "address": {
      "streetAddress": "",
      "addressLocality": "Dongguan",
      "addressRegion": "Guangdong",
      "postalCode": "",
      "addressCountry": "CN"
    },
    "sameAs": [],
    "contactPoints": [
      {
        "type": "sales",
        "email": "info@zufek.com",
        "areaServed": "Worldwide",
        "availableLanguage": ["en", "zh"]
      },
      {
        "type": "technical support",
        "email": "support@zufek.com",
        "areaServed": "Worldwide",
        "availableLanguage": ["en", "zh"]
      }
    ]
  }$JSON$::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Site — basic identity fallback used by header / footer / og:site_name
INSERT INTO settings (key, value) VALUES (
  'site',
  $JSON${
    "name": "Zufek",
    "legal_name": "Dongguan Zufek Technology Co., Ltd.",
    "address": "Dongguan, Guangdong, China",
    "founded_year": 2018,
    "description": "OEM/ODM custom lithium battery manufacturer specialising in polymer Li-Po, custom-shape Li-Po and coin steel-shell lithium cells for AR/VR, medical, wearables and IoT applications. ISO 9001 certified, UN 38.3 / IEC 62133 / CE compliant.",
    "tagline": "Custom lithium batteries engineered to your specs."
  }$JSON$::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- SEO — only seed the default OG image (brand asset that exists at
-- /public/logo.png). Social-media handles (twitter_handle, etc.) are
-- INTENTIONALLY left unset — the operator must opt in by entering their
-- real handle in /admin/settings.html. We never invent handles that
-- might not exist, because <meta name="twitter:site" content="@x"> on
-- a non-existent account hurts trust scoring.
INSERT INTO settings (key, value) VALUES (
  'seo',
  $JSON${
    "default_meta_image": "/logo.png"
  }$JSON$::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Backfill default_meta_image on existing seo rows that lack it.
UPDATE settings
SET value = jsonb_set(value, '{default_meta_image}', '"/logo.png"', true)
WHERE key = 'seo'
  AND (value->>'default_meta_image' IS NULL OR value->>'default_meta_image' = '');

-- Cleanup: previous version of this migration mistakenly seeded
-- twitter_handle="zufek". Remove that exact value here so the
-- twitter:site meta tag and X/Twitter card stop pointing to a
-- non-existent account. Real handles entered via the admin are kept.
UPDATE settings
SET value = value - 'twitter_handle'
WHERE key = 'seo'
  AND value->>'twitter_handle' = 'zufek';
