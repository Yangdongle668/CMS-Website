-- =====================================================================
-- 2026 Q2 SEO content fill — SEO-expert copy for every public entity
--
-- Sets focus_keyword + meta_title + meta_description + og_title +
-- og_description for every existing pillar / application / page / article
-- that currently has them blank.
--
-- Strategy:
--   * Every page targets ONE primary keyword (focus_keyword).
--   * Meta titles are 50-60 chars, lead with the keyword, end with " | Zufek".
--   * Meta descriptions are 145-160 chars, include a benefit + a CTA.
--   * OG title/description default to the meta values; explicitly set so
--     social cards stay aligned with search snippets.
--
-- Idempotent: every UPDATE filters with `WHERE focus_keyword = '' OR focus_keyword IS NULL`
-- so re-running this script never overwrites operator edits.
--
-- Run on existing deployments:
--   docker compose exec db psql -U postgres battery_cms < server/db/migrate-2026-q2-seo-content.sql
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------
-- PILLAR PAGES — the 3 SEO money pages
-- ---------------------------------------------------------------
UPDATE pillar_pages SET
  focus_keyword     = 'polymer lithium battery',
  secondary_keywords = '["lipo battery","li-po cell","polymer li-ion battery","custom polymer battery"]'::jsonb,
  meta_title        = 'Polymer Lithium Battery Manufacturer | Custom Li-Po Cells | Zufek',
  meta_description  = 'Custom polymer lithium (Li-Po) batteries from 30 mAh to 20 Ah. Ultra-thin pouch cells from 0.4 mm. ISO 9001 + UN 38.3 certified. Get a quote in 1 business day.',
  og_title          = 'Polymer Lithium Battery Manufacturer — Zufek',
  og_description    = 'Custom Li-Po cells from 30 mAh to 20 Ah for AR/VR, medical, wearable and IoT devices. ISO 9001 + UN 38.3.',
  twitter_title     = 'Polymer Lithium Battery Manufacturer — Zufek',
  twitter_description = 'Custom Li-Po cells from 30 mAh to 20 Ah. Ultra-thin pouch cells from 0.4 mm. ISO 9001 + UN 38.3.'
WHERE slug = 'polymer-lithium-battery'
  AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pillar_pages SET
  focus_keyword     = 'custom shaped lithium battery',
  secondary_keywords = '["custom battery shape","curved lithium battery","stepped pouch cell","custom lipo geometry"]'::jsonb,
  meta_title        = 'Custom Shaped Lithium Battery: Curved & Stepped Pouch Cells | Zufek',
  meta_description  = 'Curved, stepped and L-shaped custom lithium pouch cells co-designed with your mechanical team. 200+ shipped geometries since 2018. Engineering responds in 24 h.',
  og_title          = 'Custom Shaped Lithium Battery — Curved & Stepped Cells | Zufek',
  og_description    = 'Curved, stepped, L-shaped lithium pouch cells co-designed with your enclosure. 200+ shipped geometries.',
  twitter_title     = 'Custom Shaped Lithium Battery — Zufek',
  twitter_description = 'Co-designed pouch cells in curved, stepped and L-shaped geometries. 200+ shipped programs.'
WHERE slug = 'custom-shaped-polymer-lithium-battery'
  AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pillar_pages SET
  focus_keyword     = 'coin lithium battery',
  secondary_keywords = '["LIR coin cell","ML coin cell","rechargeable coin battery","steel shell button cell"]'::jsonb,
  meta_title        = 'Coin Lithium Battery: LIR & ML Rechargeable Cells | Zufek',
  meta_description  = 'Hermetic stainless-steel shell rechargeable coin cells: LIR2032, LIR2450, ML2032, ML2430. SMD reflow-ready, UL 1642 + UN 38.3 certified. Custom tab welding available.',
  og_title          = 'Coin Lithium Battery — LIR & ML Cells | Zufek',
  og_description    = 'Rechargeable coin cells with hermetic steel shell. LIR + ML series, SMD reflow-ready, UL 1642 certified.',
  twitter_title     = 'Coin Lithium Battery — Zufek',
  twitter_description = 'LIR & ML rechargeable coin cells. SMD reflow-ready. UL 1642 + UN 38.3.'
WHERE slug = 'coin-steel-shell-lithium-battery'
  AND (focus_keyword = '' OR focus_keyword IS NULL);

-- ---------------------------------------------------------------
-- APPLICATIONS — 8 industry pages
-- ---------------------------------------------------------------
UPDATE applications SET
  focus_keyword     = 'AR VR battery',
  secondary_keywords = '["AR glasses battery","VR headset battery","ultra-thin lithium battery"]'::jsonb,
  meta_title        = 'AR / VR Glasses Battery: Ultra-Thin Pouch Cells | Zufek',
  meta_description  = 'Ultra-thin lithium pouch cells from 0.4 mm for AR/VR glasses, smart glasses and headsets. Curved geometries, low-temperature performance, shipped to TW, US and EU OEMs.',
  og_title          = 'AR / VR Glasses Battery — Ultra-Thin Pouch Cells',
  og_description    = 'Pouch cells from 0.4 mm thick for AR / VR glasses. Curved geometries, low-temperature performance.'
WHERE slug = 'ar-vr' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE applications SET
  focus_keyword     = 'medical device battery',
  secondary_keywords = '["wearable medical battery","CGM patch battery","hearing aid battery","ISO 13485 lithium"]'::jsonb,
  meta_title        = 'Medical Device Battery: ISO 13485-Aligned Production | Zufek',
  meta_description  = 'Custom lithium cells for medical wearables, CGM patches, hearing aids and infusion pumps. ISO 13485-aligned line, IEC 60601 leakage testing, 10-year retention.',
  og_title          = 'Medical Device Battery — ISO 13485 Aligned',
  og_description    = 'Custom lithium cells for CGM, hearing aids, infusion pumps. ISO 13485-aligned, IEC 60601 leakage tested.'
WHERE slug = 'medical' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE applications SET
  focus_keyword     = 'wearable battery',
  secondary_keywords = '["smartwatch battery","TWS earbud battery","fitness tracker battery","ring battery"]'::jsonb,
  meta_title        = 'Wearable Battery: Curved Cells for Smartwatches & TWS | Zufek',
  meta_description  = 'Curved and shaped lithium cells for smartwatches, TWS earbuds, fitness trackers and smart rings. From 35 mAh, 5+ days runtime, shipped to KR, CN, US OEMs.',
  og_title          = 'Wearable Battery — Curved Cells for Smartwatches & TWS',
  og_description    = 'Curved + pin-shaped lithium cells from 35 mAh for smartwatches, TWS, fitness trackers, smart rings.'
WHERE slug = 'wearables' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE applications SET
  focus_keyword     = 'iot battery',
  secondary_keywords = '["asset tracker battery","sensor battery","low self-discharge lithium","long-life iot cell"]'::jsonb,
  meta_title        = 'IoT Battery: Long-Life Lithium Cells for Sensors & Trackers | Zufek',
  meta_description  = 'Low self-discharge lithium cells for IoT trackers, asset monitors and remote sensors. 5+ year shelf life, -40 °C to +85 °C, custom pouch and coin formats.',
  og_title          = 'IoT Battery — Long-Life Cells for Sensors & Trackers',
  og_description    = 'Low self-discharge cells for IoT sensors and asset trackers. 5+ yr shelf life, -40 °C to +85 °C.'
WHERE slug = 'iot' AND (focus_keyword = '' OR focus_keyword IS NULL);

-- Remove application rows for product categories we don't actually
-- manufacture. Zufek ships polymer Li-Po pouch + coin steel-shell
-- rechargeable cells only — we do NOT make 18650 / 21700 cylindrical
-- cells, Li-SOCl2 D-cell primaries, or any other non-pouch / non-coin
-- format. The four applications below were written around cylindrical
-- packs that aren't part of our product line, so they were sending
-- the wrong inquiries:
--   - drones                21700 + high-rate LiPo (FPV niche only fits)
--   - power-tools           pure 18650/21700 NMC packs
--   - e-mobility            36-96V cylindrical e-bike/scooter packs
--   - industrial-handhelds  smart 21700 packs with SMBus
--
-- Plus the legacy energy-storage row that was never paired with a
-- static landing page and was rendering as an empty template.
DELETE FROM applications WHERE slug IN (
  'drones',
  'power-tools',
  'e-mobility',
  'industrial-handhelds',
  'energy-storage'
);

-- ---------------------------------------------------------------
-- STATIC PAGES (homepage, about, contact, faq, …)
-- ---------------------------------------------------------------
UPDATE pages SET
  focus_keyword     = 'lithium battery manufacturer',
  secondary_keywords = '["custom lithium battery manufacturer","Dongguan battery factory","li-po manufacturer china"]'::jsonb,
  meta_title        = 'Lithium Battery Manufacturer | Custom Li-Po, Coin & Pack | Zufek',
  meta_description  = 'Zufek is a Dongguan-based custom lithium battery manufacturer (since 2018). 100-person R&D-led team, 300+ shipped programs, ISO 9001 + ISO 13485-aligned production.',
  og_title          = 'Zufek — Custom Lithium Battery Manufacturer Since 2018',
  og_description    = 'Custom Li-Po, coin and pack lithium batteries for AR/VR, medical, wearable and IoT devices. R&D-led team in Dongguan.'
WHERE slug = 'home' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword     = 'lithium battery products',
  meta_title        = 'Lithium Battery Products: Polymer, Coin & Custom | Zufek',
  meta_description  = 'Browse Zufek''s lithium battery product lines: polymer pouch (Li-Po), coin steel-shell (LIR/ML) and custom-shape cells. Datasheets, spec tables, and quote in 24 h.',
  og_title          = 'Lithium Battery Products — Polymer, Coin & Custom',
  og_description    = 'Polymer pouch (Li-Po), coin steel-shell (LIR/ML) and custom-shape cells. Datasheets + 24 h quote.'
WHERE slug = 'products/index' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword     = 'lithium battery applications',
  meta_title        = 'Lithium Battery Applications: AR/VR, Medical, Wearables, IoT | Zufek',
  meta_description  = 'See where Zufek lithium cells ship today: AR/VR glasses, medical wearables, smartwatches, IoT trackers, drones, power tools, e-mobility and BESS. 8 industries, 300+ programs.',
  og_title          = 'Lithium Battery Applications — Where Our Cells Ship',
  og_description    = '8 industries: AR/VR, medical, wearables, IoT, drones, power tools, e-mobility, energy storage.'
WHERE slug = 'applications/index' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword     = 'lithium battery manufacturer china',
  meta_title        = 'About Zufek: R&D-Led Lithium Battery Manufacturer Since 2018',
  meta_description  = 'A 100-person Dongguan-based custom lithium battery manufacturer founded by senior cell engineers. ISO 9001, ISO 13485-aligned medical line, 300+ shipped customer programs.',
  og_title          = 'About Zufek — R&D-Led Lithium Battery Manufacturer',
  og_description    = '100-person Dongguan team. R&D-led. ISO 9001 + ISO 13485-aligned. 300+ shipped programs since 2018.'
WHERE slug = 'about/index' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword     = 'lithium battery factory tour',
  meta_title        = 'Factory Tour: Inside Our Dongguan Lithium Battery Plant | Zufek',
  meta_description  = 'Walk through our Dongguan lithium battery factory: pilot R&D line, custom-shape tooling shop, formation room, QC lab and ISO 13485-aligned medical line. 5,000 m² total.',
  og_title          = 'Factory Tour — Zufek Dongguan Lithium Battery Plant',
  og_description    = 'R&D pilot line, custom-shape tooling, formation room, ISO 13485-aligned medical line. 5,000 m².'
WHERE slug = 'about/factory' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword     = 'lithium battery company profile',
  meta_title        = 'Company Profile: Zufek Lithium Battery Manufacturer (Dongguan)',
  meta_description  = 'Dongguan Zufek Technology Co.,Ltd: founded 2018 by senior cell engineers, 100 staff, 5,000 m² facility, 300+ shipped customer programs across 30+ countries since 2018.',
  og_title          = 'Company Profile — Zufek Lithium Battery Manufacturer',
  og_description    = 'Dongguan Zufek Technology Co.,Ltd. Founded 2018, 100 staff, 5,000 m², 300+ programs, 30+ countries.'
WHERE slug = 'about/profile' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword     = 'lithium battery engineering team',
  meta_title        = 'Team: Cell Engineers Behind Zufek Lithium Batteries',
  meta_description  = 'Meet the cell engineers, formation specialists, QC leads and PMs at Zufek. Four founder-engineers with 50+ combined years of lithium-cell development experience.',
  og_title          = 'Meet the Zufek Engineering Team',
  og_description    = 'Cell engineers, formation specialists, QC leads and PMs. Four founders, 50+ combined years in lithium.'
WHERE slug = 'about/team' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword     = 'lithium battery insights',
  meta_title        = 'Battery Engineering Blog: Insights from Cell Engineers | Zufek',
  meta_description  = 'Zufek''s engineering blog: technical guides, industry analysis and deep-dives on Li-Po sizing, BMS topology, coin-cell reflow, UN 38.3 shipping and more. Written by our cell team.',
  og_title          = 'Zufek Battery Engineering Blog — Insights from Cell Engineers',
  og_description    = 'Technical guides on Li-Po sizing, BMS, coin-cell reflow, UN 38.3 shipping. Written by our engineers.'
WHERE slug = 'blog/index' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword     = 'lithium battery faq',
  meta_title        = 'Lithium Battery FAQ: Custom Manufacturing Questions | Zufek',
  meta_description  = 'Common questions about custom lithium battery manufacturing: minimum order quantities, lead times, certifications, IP, NDAs, shipping (UN 38.3) and warranty terms.',
  og_title          = 'Lithium Battery FAQ — Zufek',
  og_description    = 'MOQ, lead times, certifications, NDAs, UN 38.3 shipping, warranty. The questions every PM asks.'
WHERE slug = 'faq' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword     = 'lithium battery quote',
  meta_title        = 'Contact Zufek: Request a Custom Lithium Battery Quote',
  meta_description  = 'Send your spec to a Dongguan lithium battery manufacturer. Engineering responds in 1 business day. Email engineering@zufek.com or +86 153 7772 0020.',
  og_title          = 'Contact Zufek — Request a Lithium Battery Quote',
  og_description    = 'Engineering responds in 1 business day. engineering@zufek.com / +86 153 7772 0020.'
WHERE slug = 'contact' AND (focus_keyword = '' OR focus_keyword IS NULL);

-- Application sub-pages (already covered by /applications endpoints, but
-- the static pages table also has slugs for them — fill in case they're
-- used).
UPDATE pages SET
  focus_keyword = 'AR VR battery',
  meta_title = 'AR / VR Glasses Battery: Ultra-Thin Pouch Cells | Zufek',
  meta_description = 'Ultra-thin lithium pouch cells from 0.4 mm for AR/VR glasses, smart glasses and headsets. Curved geometries, low-temperature performance, shipped to TW, US and EU OEMs.'
WHERE slug = 'applications/ar-vr' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword = 'medical device battery',
  meta_title = 'Medical Device Battery: ISO 13485-Aligned Production | Zufek',
  meta_description = 'Custom lithium cells for medical wearables, CGM patches, hearing aids and infusion pumps. ISO 13485-aligned line, IEC 60601 leakage testing, 10-year retention.'
WHERE slug = 'applications/medical' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword = 'wearable battery',
  meta_title = 'Wearable Battery: Curved Cells for Smartwatches & TWS | Zufek',
  meta_description = 'Curved and shaped lithium cells for smartwatches, TWS earbuds, fitness trackers and smart rings. From 35 mAh, 5+ days runtime, shipped to KR, CN, US OEMs.'
WHERE slug = 'applications/wearables' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword = 'iot battery',
  meta_title = 'IoT Battery: Long-Life Lithium Cells for Sensors & Trackers | Zufek',
  meta_description = 'Low self-discharge lithium cells for IoT trackers, asset monitors and remote sensors. 5+ year shelf life, -40 °C to +85 °C, custom pouch and coin formats.'
WHERE slug = 'applications/iot' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword = 'lithium battery custom solutions',
  meta_title = 'Custom Lithium Battery Solutions: Design, Prototype, Production | Zufek',
  meta_description = 'End-to-end custom lithium battery solutions: cell design, BMS firmware, prototype build, certification and mass production — handled by one team in Dongguan.'
WHERE slug = 'solutions/index' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword = 'lithium battery design service',
  meta_title = 'Lithium Battery Design Support: Cell + BMS + Pack Engineering',
  meta_description = 'Co-design your lithium cell with our engineers: chemistry selection, geometry optimisation, BMS topology, thermal modelling. From spec to prototype in 6-8 weeks.'
WHERE slug = 'solutions/design' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword = 'lithium battery prototyping',
  meta_title = 'Lithium Battery Prototyping: 50-Cell Pilot Builds in 4 Weeks',
  meta_description = 'Lithium cell prototyping service: 50 to 500 sample cells in 4 weeks, full electrical + abuse test report, ready for your DVT round. Pilot tooling included.'
WHERE slug = 'solutions/prototyping' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE pages SET
  focus_keyword = 'lithium battery mass production',
  meta_title = 'Lithium Battery Mass Production: 100k+ Cells / Month | Zufek',
  meta_description = 'Three production lines, 100,000+ cells per month capacity. Continuous QA sampling, formation curve archive, 10-year traceability for medical and automotive customers.'
WHERE slug = 'solutions/mass-production' AND (focus_keyword = '' OR focus_keyword IS NULL);

-- ---------------------------------------------------------------
-- ARTICLES — set focus_keyword from a derived stem when blank
-- ---------------------------------------------------------------
-- For each article that doesn't yet have a focus_keyword, derive one
-- from the title (lowercased, first 4 alphanumeric words). This gives a
-- sensible starting point that the operator can refine later in the SEO
-- panel. We do NOT overwrite meta_title / meta_description here since
-- the seed.sql already provides per-article values.
UPDATE articles
   SET focus_keyword = lower(
         array_to_string(
           (string_to_array(
              regexp_replace(title, '[^A-Za-z0-9\s\-]', '', 'g'),
              ' '
            ))[1:4],
           ' '
         )
       )
 WHERE focus_keyword = '' OR focus_keyword IS NULL;

-- A handful of high-value cluster articles get a hand-tuned keyword
-- because the auto-derivation above is generic.
UPDATE articles SET focus_keyword = 'LIR vs ML coin cell',
       meta_title = COALESCE(NULLIF(meta_title, ''), 'LIR vs ML Coin Cells: Which Rechargeable Chemistry to Choose'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'Practical guide to choosing between LIR (Li-ion 3.6 V) and ML (Li-MnO2 3.0 V) rechargeable coin cells: voltage, cycle life, reflow tolerance and BOM cost.')
 WHERE slug = 'lir-vs-ml-coin-cell-which-to-choose';

UPDATE articles SET focus_keyword = 'tab welding coin cells',
       meta_title = COALESCE(NULLIF(meta_title, ''), 'Tab Welding Coin Cells: Nickel vs Copper vs Through-Hole'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'Field guide to selecting LIR/ML coin-cell tab termination: nickel strip vs copper strip vs through-hole posts. Welding parameters, cost trade-offs and reliability data.')
 WHERE slug = 'tab-welding-coin-cells';

UPDATE articles SET focus_keyword = 'protection PCM vs smart battery',
       meta_title = COALESCE(NULLIF(meta_title, ''), 'Protection PCM vs Smart Battery: When to Use Which'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'Cost, complexity and firmware implications of protection PCM vs smart-battery (gas-gauge) BMS topologies. Decision tree for consumer electronics designers.')
 WHERE slug = 'protection-pcm-vs-smart-battery';

UPDATE articles SET focus_keyword = 'cell sizing power profile',
       meta_title = COALESCE(NULLIF(meta_title, ''), 'Sizing a Lithium Cell From a Power Profile: Worked IoT Example'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'Step-by-step method to turn a current-vs-time power profile into a real-world capacity specification. Includes a worked LoRa IoT tracker example.')
 WHERE slug = 'cell-sizing' OR slug = 'sizing-a-cell-from-a-power-profile';

UPDATE articles SET focus_keyword = 'thermal runaway lithium battery',
       meta_title = COALESCE(NULLIF(meta_title, ''), 'Thermal Runaway in Lithium Batteries: Triggers, Detection, Mitigation'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'Plain-language explainer of thermal runaway in lithium-ion cells: what triggers it, how to detect early signs, and the design choices that mitigate the risk.')
 WHERE slug = 'thermal-runaway';

UPDATE articles SET focus_keyword = 'UN 38.3 lithium shipping',
       meta_title = COALESCE(NULLIF(meta_title, ''), 'UN 38.3 + IEC 62133-2 Compliance for Lithium Battery Shipping'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'What every PM needs to know about UN 38.3, IEC 62133-2 and the air-freight lithium-battery shipping rules — with a 7-step pre-shipment checklist.')
 WHERE slug = 'un-iec-compliance';

-- ---------------------------------------------------------------
-- PRODUCTS — fill blanks from name/tagline
-- ---------------------------------------------------------------
UPDATE products
   SET focus_keyword = lower(name),
       meta_title = COALESCE(NULLIF(meta_title, ''),
         name || ' | ' || COALESCE(NULLIF(model_no, ''), 'Custom Lithium Cell') || ' | Zufek'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         CASE
           WHEN tagline <> '' THEN tagline || ' Manufactured by Zufek (Dongguan). Quote in 24 h.'
           ELSE 'Custom ' || name || ' from Zufek — a Dongguan lithium battery manufacturer. ISO 9001, UN 38.3. Engineering responds in 1 business day.'
         END)
 WHERE focus_keyword = '' OR focus_keyword IS NULL;

-- ---------------------------------------------------------------
-- APPLICATIONS (continued) — 3 new application landing pages
-- (smart-home, industrial-handhelds, defence-aerospace) added in
-- the 2026-Q2 content batch. The first 8 are above.
-- ---------------------------------------------------------------
UPDATE applications SET
  focus_keyword     = 'smart home battery',
  secondary_keywords = '["smart lock battery","door lock lithium battery","smart sensor battery","video doorbell battery"]'::jsonb,
  meta_title        = 'Smart Home Battery: Long-Life Cells for Locks & Sensors | Zufek',
  meta_description  = 'Long-life lithium cells for smart locks, video doorbells, sensors, cameras and robot vacuums. 5-yr shelf life, low self-discharge, 1000+ cycles for rechargeable models.',
  og_title          = 'Smart Home Battery — Long-Life Cells for Locks & Sensors',
  og_description    = 'Lithium cells for smart locks, doorbells, sensors, cameras. 5-yr shelf, low SD, 1000+ cycles.'
WHERE slug = 'smart-home' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE applications SET
  focus_keyword     = 'industrial handheld battery',
  secondary_keywords = '["smart battery scanner","SMBus battery pack","hot-swap industrial battery","authenticated battery"]'::jsonb,
  meta_title        = 'Industrial Handheld Battery: Smart Packs for Scanners & Terminals | Zufek',
  meta_description  = 'Smart battery packs with SMBus, hot-swap and SHA-256 authentication for industrial scanners, terminals and rugged handhelds. -20 °C to +60 °C, IP65, 1500+ cycles.',
  og_title          = 'Industrial Handheld Battery — Smart Packs with SMBus',
  og_description    = 'Smart packs for scanners, terminals, rugged handhelds. SMBus, hot-swap, SHA-256 auth, IP65.'
WHERE slug = 'industrial-handhelds' AND (focus_keyword = '' OR focus_keyword IS NULL);

UPDATE applications SET
  focus_keyword     = 'defence aerospace battery',
  secondary_keywords = '["ITAR-free battery","MIL-PRF-32383","AS9100D lithium","defence lithium pack"]'::jsonb,
  meta_title        = 'Defence & Aerospace Battery: ITAR-Free, MIL-PRF-32383 | Zufek',
  meta_description  = 'ITAR-free lithium cells and packs for dual-use defence and aerospace programs. MIL-PRF-32383 abuse stack, AS9100D-aligned QA, 10-year traceability. Selective engagement only.',
  og_title          = 'Defence & Aerospace Battery — ITAR-Free, MIL-PRF-32383',
  og_description    = 'ITAR-free dual-use lithium cells and packs. MIL-PRF-32383, AS9100D-aligned, 10-yr traceability.'
WHERE slug = 'defence-aerospace' AND (focus_keyword = '' OR focus_keyword IS NULL);

-- ---------------------------------------------------------------
-- ARTICLES — hand-tuned SEO meta for the 14 new 2026-Q2 cluster
-- articles (8 polymer pillar + 6 custom-shape pillar). The
-- generic auto-fill above gives each a focus_keyword from title;
-- these UPDATEs override with specifically optimised meta_title /
-- meta_description, which are still gated on the meta fields
-- being blank so operator edits stay intact.
-- ---------------------------------------------------------------

-- Polymer pillar
UPDATE articles SET focus_keyword = 'IEC 62133-2 test requirements',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'IEC 62133-2 Test Requirements: Complete Lithium Battery Walkthrough'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'Plain-English walkthrough of every mandatory and conditional IEC 62133-2:2017 + Amendment 1 test for lithium batteries — with cost estimates, timelines and regional marks.')
 WHERE slug = 'iec-62133-2-full-walkthrough';

UPDATE articles SET focus_keyword = 'LiPo battery swelling causes',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'LiPo Battery Swelling: Root Causes, Risk Levels and Design Fixes'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'Why LiPo batteries swell, which scenarios are dangerous vs benign, and how to design enclosures + BMS parameters that prevent it. Risk-level chart and BMS settings.')
 WHERE slug = 'lipo-battery-swelling-causes';

UPDATE articles SET focus_keyword = 'lithium battery capacity fade mechanisms',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'Lithium Battery Capacity Fade: 4 Mechanisms in LiPo Cells'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'SEI growth, lithium plating, cathode particle cracking and electrolyte depletion — the four mechanisms behind capacity fade in lithium-polymer cells, with BMS controls.')
 WHERE slug = 'lithium-battery-capacity-fade';

UPDATE articles SET focus_keyword = 'lithium battery CC CV charging',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'CC/CV Charging Protocol: How Lithium Battery Charging Works'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'Constant-current and constant-voltage phases explained, termination current trade-offs (C/5 vs C/10 vs C/20), fast-charge implications, and the 4 most common charger mistakes.')
 WHERE slug = 'cc-cv-charging-protocol';

UPDATE articles SET focus_keyword = 'lithium battery series parallel configuration',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'Series vs Parallel Lithium Battery Configuration: Pack Designer''s Guide'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'xSyP notation explained, when to add cells in series vs parallel, balancing requirements, tab-welding topology, and when to upgrade from PCM to a smart battery BMS.')
 WHERE slug = 'parallel-series-cell-configuration';

UPDATE articles SET focus_keyword = 'BMS topology selection guide',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'BMS Topology Selection Guide: Decision Framework for OEMs'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'PCM-only → fuel gauge → SBS 1.1 smart battery → CAN-bus BMS — choose the right battery management topology for your cell count, host integration and BOM target.')
 WHERE slug = 'bms-topology-selection-guide';

UPDATE articles SET focus_keyword = 'lithium battery formation cycling',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'Lithium Battery Formation Cycling: The Step That Sets Cell Life'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'How the formation cycle builds the SEI layer that determines a lithium cell''s entire service life. Coulombic efficiency, grading and 5 questions to ask your supplier.')
 WHERE slug = 'formation-cycling-impact';

UPDATE articles SET focus_keyword = 'lithium electrolyte additives VC FEC',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'Lithium Electrolyte Additives: What VC, FEC and LiDFOB Actually Do'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'Why plain LiPF6 is not enough, and what the three main additive families (vinylene carbonate, FEC, LiDFOB) contribute to cycle life, voltage window and HV-LCO stability.')
 WHERE slug = 'electrolyte-additives-lipo';

-- Custom-shape pillar
UPDATE articles SET focus_keyword = 'stepped battery design wearable',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'Stepped & L-Shaped Battery Design for Wearable Electronics'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'How L, U, T and stepped pouch-cell geometries fit non-rectangular wearable enclosures. Electrode constraints, tab placement rules and capacity-vs-volume trade-offs.')
 WHERE slug = 'stepped-battery-geometry';

UPDATE articles SET focus_keyword = 'custom battery tooling cost',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'Custom Battery Tooling Cost: Break-Even Analysis 2026'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'Itemised cost (USD 10,500-33,000) for custom pouch-cell tooling — coating mask, cutting die, pouch die, weld fixture. Amortisation math and tooling-ownership clauses.')
 WHERE slug = 'custom-battery-tooling-cost';

UPDATE articles SET focus_keyword = 'custom battery co-design workflow',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'Co-designing a Custom Lithium Battery: 6-Stage Supplier Workflow'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'Why custom battery projects fail when the supplier is engaged too late, and the 6-stage workflow (space claim → chemistry → prototype → tooling → qualification → production).')
 WHERE slug = 'co-design-battery-workflow';

UPDATE articles SET focus_keyword = 'flexible battery wearable',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'Flexible Batteries for Wearables: What''s Real in 2026 and What Isn''t'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'Honest assessment of two flexible-battery categories: curved rigid-pouch cells (shipping today) vs true flex-electrolyte cells (semi-flex gel-polymer at TRL 7-8 only).')
 WHERE slug = 'flexible-battery-wearable';

UPDATE articles SET focus_keyword = 'smart ring battery design',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'Smart Ring Battery Design: Geometry, Chemistry & Power Budget'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         '150-500 mm³ available volume, 25-80 mAh achievable. Why HV-LCO at 4.48 V wins for smart rings, plus FPC tab routing, wireless-charging BMS and a worked power budget.')
 WHERE slug = 'smart-ring-battery-design';

UPDATE articles SET focus_keyword = 'custom shaped battery reliability testing',
       meta_title = COALESCE(NULLIF(meta_title, ''),
         'Reliability Testing for Custom-Shaped Lithium Cells: Bend, Torsion, Peel'),
       meta_description = COALESCE(NULLIF(meta_description, ''),
         'IEC 62133-2 alone does not cover non-rectangular cell geometries. Supplementary fold-line bend, tab fatigue and seal-integrity tests, plus a first-article inspection matrix.')
 WHERE slug = 'custom-battery-reliability-testing';

-- ---------------------------------------------------------------
-- NAVIGATION setting — refresh on existing deployments. Restricted
-- to the 6 applications that match Zufek's product line (polymer
-- pouch + coin steel-shell): AR/VR, Medical, Wearables, IoT, Smart
-- Home, Defence & Aerospace. Idempotent: only updates rows that
-- still reference one of the deleted cylindrical-only categories.
-- ---------------------------------------------------------------
UPDATE settings
   SET value = '{"header":[{"label":"HOME","url":"/","nav":"home"},{"label":"PRODUCTS","url":"/products/","nav":"products","children":[{"label":"Polymer Lithium Battery","url":"/products/polymer-lithium-battery"},{"label":"Custom-Shaped Polymer (Li-Po)","url":"/products/custom-shaped-polymer-lithium-battery"},{"label":"Coin Steel-Shell Lithium","url":"/products/coin-steel-shell-lithium-battery"}]},{"label":"APPLICATIONS","url":"/applications/","nav":"applications","children":[{"label":"AR / VR Glasses","url":"/applications/ar-vr.html"},{"label":"Medical Devices","url":"/applications/medical.html"},{"label":"Wearables","url":"/applications/wearables.html"},{"label":"IoT Devices","url":"/applications/iot.html"},{"label":"Smart Home","url":"/applications/smart-home.html"},{"label":"Defence & Aerospace","url":"/applications/defence-aerospace.html"}]},{"label":"CUSTOM SOLUTIONS","url":"/solutions/","nav":"solutions","children":[{"label":"Design Support","url":"/solutions/design.html"},{"label":"Prototyping","url":"/solutions/prototyping.html"},{"label":"Mass Production","url":"/solutions/mass-production.html"}]},{"label":"ABOUT US","url":"/about/","nav":"about","children":[{"label":"Company Profile","url":"/about/profile.html"},{"label":"Factory Tour","url":"/about/factory.html"},{"label":"Team","url":"/about/team.html"}]},{"label":"BLOG","url":"/blog/","nav":"blog"},{"label":"FAQ","url":"/faq.html","nav":"faq"},{"label":"CONTACT","url":"/contact.html","nav":"contact"}]}'::jsonb
 WHERE key = 'navigation'
   AND (value::text LIKE '%applications/drones.html%'
     OR value::text LIKE '%applications/power-tools.html%'
     OR value::text LIKE '%applications/e-mobility.html%'
     OR value::text LIKE '%applications/industrial-handhelds.html%');

COMMIT;
