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

-- SEO — only set DEFAULT fields that are missing. Never overwrite the
-- operator's public_url, verification codes or GA4 ID.
INSERT INTO settings (key, value) VALUES (
  'seo',
  $JSON${
    "twitter_handle": "zufek",
    "default_meta_image": "/logo.png"
  }$JSON$::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- For existing seo rows that lack twitter_handle / default_meta_image,
-- backfill ONLY those keys without touching anything else.
UPDATE settings
SET value = jsonb_set(value, '{twitter_handle}', '"zufek"', true)
WHERE key = 'seo'
  AND (value->>'twitter_handle' IS NULL OR value->>'twitter_handle' = '');

UPDATE settings
SET value = jsonb_set(value, '{default_meta_image}', '"/logo.png"', true)
WHERE key = 'seo'
  AND (value->>'default_meta_image' IS NULL OR value->>'default_meta_image' = '');
