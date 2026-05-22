-- =====================================================================
-- Battery CMS - Seed Data (English, B2B battery manufacturer)
-- =====================================================================

-- ----- Categories -----
INSERT INTO categories (slug, name) VALUES
  ('technology', 'Technology'),
  ('industry-insights', 'Industry Insights'),
  ('product-updates', 'Product Updates'),
  ('certifications', 'Certifications')
ON CONFLICT (slug) DO NOTHING;

-- ----- Pillar Pages -----
INSERT INTO pillar_pages (
  slug, name, short_name, meta_title, meta_description,
  hero_eyebrow, hero_title, hero_subtitle, hero_image,
  primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link,
  overview, variants, spec_table, applications, customization, manufacturing, certifications, faq, anchor_variants, sort_order
) VALUES
(
  'polymer-lithium-battery',
  'Polymer Lithium Battery',
  'Polymer Li-Po',
  'Polymer Lithium Battery Manufacturer | Custom Li-Po Cells | Zufek',
  'Industrial-grade polymer lithium (Li-Po) batteries with custom capacities from 30 mAh to 20 Ah. ISO 9001 certified manufacturer with UN38.3, IEC 62133, CE compliance.',
  'Pillar Series 01',
  'Polymer Lithium Battery',
  'High energy density Li-Po cells engineered for thin, light, and mission-critical applications. From wearables to medical devices, our polymer lithium batteries deliver consistent performance across thousands of cycles.',
  '/assets/img/pillar-polymer.svg',
  'Get a Quote', '/quote', 'Download Datasheet', '/uploads/datasheet-polymer.pdf',
  '{"title":"What is a Polymer Lithium Battery?","body":"Polymer lithium batteries (Li-Po) use a gel-like polymer electrolyte instead of the liquid electrolyte found in conventional lithium-ion cells. This allows for ultra-thin profiles, flexible form factors, and improved safety under abuse conditions. Zufek manufactures Li-Po cells from 30 mAh up to 20 Ah, with thicknesses as low as 0.4 mm."}',
  '[
    {"name":"Standard Li-Po Cells","summary":"Pre-designed cells with industry-standard footprints, MOQ 500 pcs, lead time 2 weeks.","image":"/assets/img/variant-standard.svg"},
    {"name":"Custom Li-Po Cells","summary":"Bespoke dimensions, capacity, connectors and BMS integration. ODM/OEM from prototype to mass production.","image":"/assets/img/variant-custom.svg"}
  ]',
  '{
    "headers":["Parameter","Range","Unit"],
    "rows":[
      ["Nominal Voltage","3.7","V"],
      ["Capacity","30 – 20,000","mAh"],
      ["Energy Density","Up to 260","Wh/kg"],
      ["Cycle Life","≥ 500 (80% retention)","cycles"],
      ["Operating Temp (Discharge)","-20 to +60","°C"],
      ["Operating Temp (Charge)","0 to +45","°C"],
      ["Min. Thickness","0.4","mm"],
      ["Self-Discharge","< 3","%/month"]
    ]
  }',
  '["wearables","medical","iot","drones"]',
  '{
    "enabled": true,
    "items":[
      {"label":"Dimensions","value":"Any L × W × T from 20×15×0.4 mm to 200×150×12 mm"},
      {"label":"Capacity","value":"Tunable from 30 mAh to 20 Ah"},
      {"label":"Connectors","value":"JST-PH, Molex, custom pinouts"},
      {"label":"Protection","value":"PCM/PCB with OVP, UVP, OCP, SCP, NTC"},
      {"label":"Cable & Length","value":"AWG 24-30, length per spec"},
      {"label":"Labeling","value":"Custom shrink wrap, brand labels, barcodes"}
    ]
  }',
  '{"title":"From Prototype to Mass Production","body":"All Li-Po cells are manufactured in our ISO 9001 certified facility with automated stacking, vacuum sealing, formation and grading. Every batch undergoes 100% capacity, IR and OCV inspection.","image":"/assets/img/manufacturing-polymer.svg"}',
  '[
    {"name":"UN 38.3","image":"/assets/img/cert-un38.svg"},
    {"name":"IEC 62133","image":"/assets/img/cert-iec.svg"},
    {"name":"CE","image":"/assets/img/cert-ce.svg"},
    {"name":"RoHS","image":"/assets/img/cert-rohs.svg"},
    {"name":"MSDS","image":"/assets/img/cert-msds.svg"}
  ]',
  '[
    {"q":"What is the minimum order quantity (MOQ) for custom Li-Po cells?","a":"For custom designs the typical MOQ is 3,000 pcs; standard catalog cells start at 500 pcs."},
    {"q":"How long does sample production take?","a":"Tooling and prototype samples are typically delivered within 25-35 working days after design freeze."},
    {"q":"Do your batteries meet UN 38.3 for air shipping?","a":"Yes, all production cells are tested per UN Manual of Tests and Criteria, Section 38.3, and ship with valid test summaries."},
    {"q":"What protection circuits do you integrate?","a":"PCM with overvoltage, undervoltage, overcurrent and short-circuit protection. NTC thermal monitoring is optional."}
  ]',
  '["polymer lithium battery","Li-Po cell","custom Li-Po","lithium polymer manufacturer"]',
  1
),
(
  'custom-shaped-polymer-lithium-battery',
  'Custom-Shaped Polymer Lithium Battery',
  'Custom-Shape Li-Po',
  'Custom-Shaped Lithium Polymer Batteries | Bespoke Li-Po Cells',
  'Bespoke Li-Po cells in any geometry: round, curved, ultra-thin, stepped. Ideal for medical wearables, AR/VR, and tight-volume IoT devices.',
  'Pillar Series 02',
  'Custom-Shaped Polymer Lithium Battery',
  'When a rectangular cell will not fit, our engineering team designs the battery around your enclosure. Round, curved, stepped or notched – we manufacture polymer lithium cells in any non-standard geometry.',
  '/assets/img/pillar-custom.svg',
  'Start a Custom Project', '/quote', 'See Capabilities', '#capabilities',
  '{"title":"Why Custom Geometry?","body":"Modern devices leave little room for off-the-shelf cells. By co-designing the battery with your mechanical team, we recover 10-30% more volumetric energy density and remove dead space. Zufek has shipped over 200 custom geometries for medical, wearable and defence customers."}',
  '[
    {"name":"Round / Coin-Style","summary":"Discoid Li-Po cells from 8 mm diameter, used in TWS earbuds and smart sensors.","image":"/assets/img/variant-round.svg"},
    {"name":"Curved","summary":"Single or double curvature for wristbands, helmets and curved medical patches.","image":"/assets/img/variant-curved.svg"},
    {"name":"Stepped / Notched","summary":"Multi-thickness footprint to fit around connectors, antennas and PCBs.","image":"/assets/img/variant-stepped.svg"},
    {"name":"Ultra-Thin","summary":"Down to 0.4 mm thickness for smart cards, patches and flexible electronics.","image":"/assets/img/variant-thin.svg"}
  ]',
  '{
    "headers":["Parameter","Range","Unit"],
    "rows":[
      ["Nominal Voltage","3.7 / 3.8","V"],
      ["Capacity","20 – 8,000","mAh"],
      ["Custom Diameter (round)","8 – 60","mm"],
      ["Min. Curvature Radius","R 25","mm"],
      ["Min. Thickness","0.4","mm"],
      ["Max. Discharge Rate","3C continuous","-"],
      ["Cycle Life","≥ 500","cycles"],
      ["Operating Temp","-20 to +60","°C"]
    ]
  }',
  '["medical","wearables","iot","ar-vr"]',
  '{
    "enabled": true,
    "items":[
      {"label":"Custom 3D Shape","value":"Round, curved, stepped, notched, asymmetric"},
      {"label":"Tooling","value":"In-house tooling, 25-35 days for first samples"},
      {"label":"Capacity Optimization","value":"Energy density tuning per envelope volume"},
      {"label":"BMS / Connectors","value":"PCM, fuel-gauge IC, custom FPC connectors"},
      {"label":"NDA & IP","value":"Standard mutual NDA before drawings exchange"}
    ]
  }',
  '{"title":"Design-In Engineering Service","body":"Send us a 3D model (STEP/IGES) of the available cavity. Our cell engineers return a feasibility study within 5 working days, including capacity estimate, cycle-life model and BOM cost. After approval we tool prototypes within 4 weeks.","image":"/assets/img/manufacturing-custom.svg"}',
  '[
    {"name":"UN 38.3","image":"/assets/img/cert-un38.svg"},
    {"name":"IEC 62133","image":"/assets/img/cert-iec.svg"},
    {"name":"CE","image":"/assets/img/cert-ce.svg"},
    {"name":"RoHS","image":"/assets/img/cert-rohs.svg"},
    {"name":"ISO 13485 (medical)","image":"/assets/img/cert-iso13485.svg"}
  ]',
  '[
    {"q":"What CAD format should I send?","a":"STEP (.stp) is preferred. We also accept IGES, Parasolid (.x_t) and SolidWorks part files under NDA."},
    {"q":"How small can a round Li-Po cell go?","a":"We have shipped 8 mm diameter discoid cells at 25 mAh; 10-15 mm is typical for TWS earbuds at 35-65 mAh."},
    {"q":"Can you guarantee cycle life on a custom geometry?","a":"Yes, after sample qualification we issue a cycle-life specification (commonly 500 cycles at 80% capacity retention) backed by IEC 62133 testing."},
    {"q":"What is the typical NRE cost?","a":"Tooling and design-in NRE ranges from USD 1,500-6,000 depending on complexity, and is often waived above committed annual volumes."}
  ]',
  '["custom shaped lithium battery","custom Li-Po","bespoke battery","non-standard lithium polymer"]',
  2
),
(
  'coin-steel-shell-lithium-battery',
  'Coin Steel-Shell Lithium Battery',
  'Coin Cell',
  'Rechargeable Coin Lithium Battery Manufacturer | LIR / ML Steel-Shell Cells',
  'Rechargeable coin lithium batteries in stainless-steel cases — LIR2032, LIR2450, ML2032, ML2430. Hermetic seal, 500-1,000+ cycles, hearing aid / wearable / IoT grade.',
  'Pillar Series 03',
  'Coin Steel-Shell Lithium Battery',
  'Rechargeable coin cells in hermetic stainless-steel cases. LIR (Li-ion 3.6 V) and ML (Li-MnO2 3.0 V) chemistries from Ø10 mm — for hearing aids, smart watches, IoT sensors and reflow-mount RTC backup.',
  'https://images.unsplash.com/photo-1580407195669-d0c11ee3c1c2?w=1920&q=80',
  'Get a Quote', '/contact.html', 'See Specifications', '#specs',
  '{"title":"Why rechargeable steel-shell coin cells?","body":"The hermetic stainless-steel can is what makes a small lithium cell viable in a sealed wearable, a hearing aid or an automotive PCB: it survives reflow soldering, eliminates leakage and resists external mechanical abuse. Our line is exclusively rechargeable — both Li-ion (LIR series) for high cycle count and Li-MnO2 (ML series) for high-temperature reflow-mount applications. Every cell ships with full IEC 60086-4 / 62133 documentation."}',
  '[
    {"name":"LIR Series — Rechargeable Li-ion","summary":"3.6 V Li-ion in standard coin formats (LIR1620 / LIR2025 / LIR2032 / LIR2450 / LIR2477). 500+ cycles, ideal for wearables, smart cards and TWS earbuds.","image":""},
    {"name":"ML Series — Rechargeable Li-MnO2","summary":"3.0 V rechargeable Li-MnO2 (ML414 / ML2032 / ML2430). 1,000+ cycles, reflow-compatible, used in industrial RTC backup and BLE beacons.","image":""},
    {"name":"High-Temp Automotive","summary":"-40 to +85 °C operating range (storage to +125 °C peak). Hermetic crimp survives full SMD reflow. For automotive ECUs, T-BOX and aftermarket modules.","image":""},
    {"name":"Pin & Custom Form","summary":"Pin-style Ø5-6 mm and custom-tabbed coin cells for hearing aids, implantable medical devices and high-density wearables.","image":""}
  ]',
  '{
    "headers":["Format","Chemistry","Voltage","Capacity","Cycles","Operating Temp"],
    "rows":[
      ["LIR1620","Li-ion","3.6 V","12 mAh","≥ 500","-20 ~ +60 °C"],
      ["LIR2025","Li-ion","3.6 V","30 mAh","≥ 500","-20 ~ +60 °C"],
      ["LIR2032","Li-ion","3.6 V","40 mAh","≥ 500","-20 ~ +60 °C"],
      ["LIR2450","Li-ion","3.6 V","120 mAh","≥ 500","-20 ~ +60 °C"],
      ["LIR2477","Li-ion","3.6 V","180 mAh","≥ 500","-20 ~ +60 °C"],
      ["ML2032","Li-MnO2","3.0 V","65 mAh","≥ 1,000","-40 ~ +85 °C"],
      ["ML2430","Li-MnO2","3.0 V","100 mAh","≥ 1,000","-40 ~ +85 °C"],
      ["Custom","LIR / ML","Per spec","Per spec","Per spec","Per spec"]
    ]
  }',
  '["medical","wearables","iot"]',
  '{
    "enabled": true,
    "items":[
      {"label":"Welded tabs / leads","value":"Nickel or copper tabs in horizontal or vertical orientation; through-hole posts, JST connectors or custom wires"},
      {"label":"Reflow-compatible (ML)","value":"ML2032 and ML2430 survive standard lead-free reflow profiles up to 260 °C peak (IPC/JEDEC J-STD-020)"},
      {"label":"Custom diameter","value":"Down to Ø5 mm pin cells for hearing aids and implantable medical devices"},
      {"label":"Capacity tuning","value":"Within format constraints — engineered for runtime or pulse current per application"},
      {"label":"Branding / lot codes","value":"Custom can-stamping, shrink wrap, lot codes and barcodes for traceability"},
      {"label":"Holders &amp; sockets","value":"Optional matching SMD or through-hole holders shipped pre-fitted to the cell"}
    ]
  }',
  '{"title":"Hermetic coin cell line","body":"Our coin cell line runs Korean and Japanese automation: stainless-steel can stamping, electrolyte filling under controlled humidity, hermetic crimping, formation cycling and 100% OCV/IR/leak-test inspection. Each shipment carries serialised lot codes for medical-grade traceability."}',
  '[
    {"name":"UN 38.3","image":""},
    {"name":"IEC 62133-2","image":""},
    {"name":"IEC 60086-4","image":""},
    {"name":"CE","image":""},
    {"name":"RoHS","image":""},
    {"name":"REACH","image":""},
    {"name":"MSDS","image":""}
  ]',
  '[
    {"q":"What is the difference between LIR and ML coin cells?","a":"LIR is rechargeable Li-ion at 3.6 V with 500+ cycles, used in wearables, smart cards and TWS earbuds. ML is rechargeable Li-MnO2 at 3.0 V with 1,000+ cycles and a much wider operating range (-40 to +85 °C); ML survives reflow soldering, so it can be SMD-mounted as an RTC backup."},
    {"q":"Can I get coin cells with welded tabs?","a":"Yes. We weld nickel or copper tabs in horizontal or vertical orientation per drawing. Through-hole posts and JST connectors are also available."},
    {"q":"Is the ML series really reflow-compatible?","a":"Yes. ML2032 and ML2430 survive standard lead-free reflow profiles up to 260 °C peak (per IPC/JEDEC J-STD-020). Treat them as a true SMD component."},
    {"q":"What is the MOQ for custom coin cells?","a":"Standard LIR / ML formats: 5,000 pieces. Custom-tabbed or branded cells: 10,000 pieces minimum, with 25-30 day lead time."},
    {"q":"Are these cells suitable for medical devices?","a":"Our coin cells ship to multiple medical OEMs under ISO 13485 traceability. We provide IEC 62133-2 reports, biocompatibility statements (ISO 10993) and lot-level documentation on request."},
    {"q":"Do the cells pass UN 38.3 air shipping?","a":"Yes, every batch is tested per UN Manual of Tests and Criteria, Section 38.3 and ships with valid test summaries. Both LIR and ML coin cells are ATA / IATA compliant."}
  ]',
  '["rechargeable coin lithium battery","LIR2032 manufacturer","ML2032 reflow","steel shell coin cell","button cell battery","coin cell hearing aid"]',
  3
)
ON CONFLICT (slug) DO NOTHING;

-- ----- Applications -----
-- We make polymer Li-Po pouch (any geometry) + coin steel-shell rechargeable
-- cells. We do NOT make 18650/21700 cylindrical, Li-SOCl2 D-cell, or any
-- other format we cannot ship. So the application list is restricted to
-- categories where polymer/coin is the dominant or competitive choice.
INSERT INTO applications (slug, name, icon, cover_url, summary, body, sort_order) VALUES
('medical', 'Medical Devices', 'medical',
 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&q=80',
 'IEC 60601-aligned Li-Po pouches and coin cells for hearing aids, CGM patches, ECG monitors and infusion pumps.',
 'We supply medical OEMs with cells that meet IEC 60601 leakage requirements, ISO 13485 traceability and 5+ year shelf life. Common formats: ultra-thin Li-Po pouches for wearable monitors and CGM patches, plus rechargeable coin cells (LIR/ML) for hearing aids and reusable diagnostic accessories.',
 1),
('wearables', 'Wearables', 'wearables',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
 'Ultra-small round and curved Li-Po cells for TWS earbuds, smart bands, smart rings and patches.',
 'From 25 mAh discoid cells in 10 mm earbuds to 500 mAh curved cells in flagship smartwatches, we deliver the highest energy density in the smallest envelopes for consumer wearables.',
 2),
('iot', 'IoT Devices',  'iot',
 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=1200&q=80',
 'Custom Li-Po pouches for high-event IoT devices, plus rechargeable coin cells for RTC backup and sensor maintenance modes.',
 'Zufek-grade IoT cells: ultra-thin Li-Po (50-2,000 mAh) for cellular trackers, smart locks and connected sensors that need to recharge from solar or USB; ML/LIR coin cells (40-120 mAh) for SMD-mounted RTC backup, BLE beacons and SoC sleep retention.',
 3),
('ar-vr', 'AR / VR Glasses', 'ar-vr',
 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1200&q=80',
 'Ultra-thin and curved Li-Po pouches for slim AR temples and VR headsets.',
 'Headset OEMs use our custom stepped Li-Po cells (0.45-5 mm thickness) to free up optical and PCB volume while maintaining 2-4 hour runtime targets.',
 4),
-- ----- Two extra application landing pages — sitemap registration only.
-- ----- The actual rich landing pages live as static .html files at:
-- -----   /applications/smart-home.html
-- -----   /applications/defence-aerospace.html
-- ----- These DB rows exist so /api/sitemap.xml emits them and the
-- ----- /api/applications endpoint can enumerate the full set.
('smart-home', 'Smart Home', 'smart-home',
 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&q=80',
 'Long-life Li-Po pouches and rechargeable coin cells for smart locks, doorbells, sensors and connected home devices.',
 'Smart-home batteries have to last 12-24 months between charges, survive -20C winters and 5-year retail shelf life. We ship custom Li-Po pouches (200-2,000 mAh) for video doorbells and locks, plus ML/LIR coin cells (40-120 mAh) for low-event wireless sensors.',
 5),
('defence-aerospace', 'Defence & Aerospace', 'defence-aerospace',
 'https://images.unsplash.com/photo-1559131397-f94da358f7ca?w=1200&q=80',
 'Selectively-engaged Li-Po and coin-cell programs for dismounted electronics. ITAR-free BOM where required, MIL-PRF-32383 abuse, AS9100D-aligned QA.',
 'We engage selectively on dual-use defence Li-Po pouch and coin-cell programs: man-portable sensors, dismounted soldier wearables, ISR sensor patches, and ruggedised handheld electronics. We do not engage on weapon-system primary batteries or USML / EU CML-listed programs.',
 6),
('power-tools', 'Power Tools', 'power-tools',
 'https://images.unsplash.com/photo-1581147036324-c1c89c2c8b5c?w=1200&q=80',
 'Custom Li-Po packs for cordless screwdrivers, light-duty drills, garden tools, hot-glue guns and consumer DIY platforms — wherever pouch-format wins on packaging or weight.',
 'We serve the slice of the power-tool market where polymer Li-Po pouches are competitive: 6-12 V cordless screwdrivers, light drills, gimbal-mounted tools, garden trimmers, glue guns, soldering irons, kids DIY platforms and second-tier consumer brands chasing thinner / lighter form factors.',
 7),
('industrial-handhelds', 'Industrial Handhelds', 'industrial-handhelds',
 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=1200&q=80',
 'Slim, sealed Li-Po packs for barcode scanners, mobile data terminals, RFID readers, POS handhelds, inspection cameras and ruggedised industrial tablets.',
 'Industrial handheld OEMs use our custom Li-Po pouches (1,500-8,000 mAh) and 2S smart packs (with SMBus gauge + thermistor) for barcode scanners, mobile data terminals, RFID readers, line-of-business POS terminals, borescopes, thermal cameras and field tablets.',
 8)
ON CONFLICT (slug) DO NOTHING;

-- ----- Backfill rich body, meta_title, meta_description, focus_keyword -----
-- The first batch of inserts above used minimal body fields. The static
-- landing pages live in /public/applications/*.html and provide the
-- visible content. These UPDATEs make sure the DB entries also carry
-- the SEO meta the sitemap reads (and the SSR fallback path uses).
UPDATE applications SET
  meta_title = 'Smart Home Battery: Long-Life Li-Po & Coin Cells for Locks, Doorbells, Sensors | Zufek',
  meta_description = 'Custom Li-Po pouches for smart locks and video doorbells, plus rechargeable coin cells for low-event wireless sensors. 5-yr shelf life, UN 38.3 + IEC 62133-2 certified.',
  focus_keyword = 'smart home Li-Po battery'
WHERE slug = 'smart-home';

UPDATE applications SET
  meta_title = 'Defence & Aerospace Battery: Li-Po & Coin Cells, ITAR-Free BOM | Zufek',
  meta_description = 'Selectively-engaged Li-Po pouch and coin-cell programs for dismounted electronics. ITAR-free BOM where required, MIL-PRF-32383 abuse, AS9100D-aligned QA.',
  focus_keyword = 'ITAR-free defence Li-Po battery'
WHERE slug = 'defence-aerospace';

-- Also backfill SEO meta for the original 4 industries so every entity
-- has a populated meta_title / meta_description / focus_keyword.
UPDATE applications SET
  meta_title = 'AR / VR Glasses Battery Manufacturer — Ultra-Thin Li-Po Cells | Zufek',
  meta_description = 'Ultra-thin Li-Po cells for AR / VR glasses and headsets. 0.5-5 mm thickness, 30-5,000 mAh, 500-800 cycle life. ISO 9001 + UN 38.3 certified.',
  focus_keyword = 'AR VR glasses battery manufacturer'
WHERE slug = 'ar-vr';

UPDATE applications SET
  meta_title = 'Medical Device Battery Manufacturer — ISO 13485-Aligned Cells | Zufek',
  meta_description = 'ISO 13485-aligned lithium cells for wearable monitors, hearing aids, insulin pumps and portable diagnostic tools. 5-year shelf life, biocompatible casings.',
  focus_keyword = 'medical device battery manufacturer'
WHERE slug = 'medical';

UPDATE applications SET
  meta_title = 'Wearable Device Battery Manufacturer — Curved & Round Li-Po Cells | Zufek',
  meta_description = 'Custom curved, round and shaped Li-Po cells for smartwatches, TWS earbuds, fitness trackers and rings. From 25 mAh discoid to 410 mAh curved pouch.',
  focus_keyword = 'wearable battery manufacturer'
WHERE slug = 'wearables';

UPDATE applications SET
  meta_title = 'IoT Device Battery Manufacturer — Long-Shelf-Life Lithium Cells | Zufek',
  meta_description = 'Long shelf-life lithium cells for IoT trackers, gateways, smart meters and LoRaWAN sensors. -20°C to +60°C operating, 5-year shelf life, low self-discharge.',
  focus_keyword = 'IoT battery long shelf life'
WHERE slug = 'iot';

UPDATE applications SET
  meta_title = 'Power Tool Battery Manufacturer — Custom Li-Po Packs for Cordless Tools | Zufek',
  meta_description = 'Custom Li-Po pouches and smart packs for 6-12 V cordless screwdrivers, light drills, garden tools, glue guns and consumer DIY platforms. UN 38.3 + IEC 62133-2.',
  focus_keyword = 'power tool Li-Po battery'
WHERE slug = 'power-tools';

UPDATE applications SET
  meta_title = 'Industrial Handheld Battery — Slim Li-Po Packs for Scanners & MDTs | Zufek',
  meta_description = 'Slim, sealed Li-Po packs and 2S smart packs for barcode scanners, mobile data terminals, RFID readers, POS handhelds and inspection cameras. IP65-housing-friendly.',
  focus_keyword = 'industrial handheld battery manufacturer'
WHERE slug = 'industrial-handhelds';

-- ----- Sample Products under each pillar -----
INSERT INTO products (pillar_id, slug, name, model_no, tagline, specs, features, description, is_custom, sort_order, status) VALUES
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 'lp-503562-1200', 'LP-503562 1200mAh', 'LP-503562',
 'Standard Li-Po cell for IoT and smart home',
 '{"voltage":"3.7V","capacity":"1200 mAh","dimensions":"5.0 × 35 × 62 mm","weight":"23 g","cycles":"≥ 500"}',
 '["JST-PH 2-pin lead","Built-in PCM","CE / UN 38.3 / RoHS","Stocked, 500 pcs MOQ"]',
 'A workhorse 1,200 mAh polymer cell ideal for smart home gateways, BLE beacons and small handhelds.',
 FALSE, 1, 'published'),
((SELECT id FROM pillar_pages WHERE slug='custom-shaped-polymer-lithium-battery'),
 'lp-round-1240-200', 'Round Li-Po Ø12.4mm 200mAh', 'LP-R1240',
 'Discoid cell for TWS earbuds',
 '{"voltage":"3.85V","capacity":"200 mAh","diameter":"12.4 mm","thickness":"4.0 mm","cycles":"≥ 400"}',
 '["High-voltage 3.85V chemistry","Coin form factor","Custom FPC tab on request"]',
 'Round 12.4 mm discoid Li-Po designed for premium TWS earbud platforms.',
 TRUE, 1, 'published'),
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 'lir2032-40', 'LIR2032 40mAh Rechargeable', 'LIR2032',
 'Rechargeable Li-ion coin cell',
 '{"voltage":"3.6V","capacity":"40 mAh","format":"LIR2032","diameter":"20 mm","thickness":"3.2 mm","cycles":"≥ 500"}',
 '["Hermetic stainless-steel case","Optional welded nickel tabs","Drop-in replacement for CR2032 sockets"]',
 'The workhorse rechargeable coin cell — direct upgrade for any CR2032 socket where in-circuit recharging is wanted (smart cards, RFID writers, dev boards).',
 FALSE, 1, 'published'),
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 'ml2032-65-reflow', 'ML2032 65mAh Reflow-Compatible', 'ML2032',
 'Reflow-mountable rechargeable RTC backup',
 '{"voltage":"3.0V","capacity":"65 mAh","format":"ML2032","cycles":"≥ 1000","temp_range":"-40 ~ +85 °C","reflow":"260 °C peak"}',
 '["SMD reflow-compatible (J-STD-020)","-40 to +85 °C operating","1,000+ cycles","Industrial RTC / BLE beacon ready"]',
 'A true SMD rechargeable lithium cell for industrial RTC backup and IoT beacons. Goes through your standard PCB reflow line — no hand assembly needed.',
 FALSE, 2, 'published'),
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 'lir2450-120', 'LIR2450 120mAh', 'LIR2450',
 'High capacity rechargeable coin cell',
 '{"voltage":"3.6V","capacity":"120 mAh","format":"LIR2450","diameter":"24.5 mm","thickness":"5.0 mm","cycles":"≥ 500"}',
 '["3x the capacity of LIR2032","Welded tabs available","UN 38.3 / IEC 62133-2"]',
 'When LIR2032 runs out of room — Ø24.5 mm format with 120 mAh, used in fitness trackers and BLE asset tags.',
 FALSE, 3, 'published')
ON CONFLICT (slug) DO NOTHING;

-- ----- Sample Articles (cluster content) -----
INSERT INTO articles (pillar_id, category_id, slug, title, excerpt, cover_url, hero_image, content, author, reading_minutes, published_at, status) VALUES
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM categories WHERE slug='technology'),
 'how-to-choose-li-po-capacity-iot',
 'How to Choose Li-Po Battery Capacity for IoT Devices',
 'A practical guide for hardware engineers selecting polymer lithium cells for low-power IoT applications.',
 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=1200&q=80',
 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=1920&q=80',
 '<p>Choosing the right polymer lithium (Li-Po) battery for an IoT device is a balance between runtime, form factor and cycle life. In this guide we walk through the four key parameters every hardware engineer should specify before issuing an RFQ.</p><h2>1. Estimate average current draw</h2><p>Compute the average current as the weighted sum of active and sleep currents. For a typical LoRaWAN sensor reporting once per hour, average current is often 50-150 µA.</p><h2>2. Add 25% headroom for ageing</h2><p>Li-Po cells lose ~20% capacity by cycle 500. Spec the nominal capacity 25% above the runtime requirement so the device still meets its target at end-of-life.</p><h2>3. Match the temperature range</h2><p>Standard Li-Po operates -20°C to +60°C in discharge, but charging below 0°C is not allowed. If your device must charge in cold environments, ask for a low-temperature variant.</p>',
 'Zufek Engineering', 6, now() - interval '5 days', 'published'),
((SELECT id FROM pillar_pages WHERE slug='custom-shaped-polymer-lithium-battery'),
 (SELECT id FROM categories WHERE slug='technology'),
 'designing-curved-batteries-for-wearables',
 'Designing Curved Polymer Batteries for Wearable Devices',
 'How curvature radius, electrode coating and stack geometry affect cycle life in curved Li-Po cells.',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1920&q=80',
 '<p>Curved batteries unlock 10-30% extra volume in wearable enclosures, but they also introduce manufacturing trade-offs that affect cycle life. This article explains what to ask your battery vendor before committing to a curved design.</p><h2>Minimum curvature radius</h2><p>For single-curvature cells we recommend R ≥ 25 mm to maintain coating integrity over 500 cycles. Tighter radii are achievable but require thinner electrodes and reduce capacity.</p>',
 'Zufek Engineering', 7, now() - interval '12 days', 'published'),
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM categories WHERE slug='industry-insights'),
 'lir-vs-ml-coin-cell-which-to-choose',
 'LIR vs. ML Coin Cells: Which Rechargeable Chemistry to Choose',
 'A practical decision guide for picking between LIR (Li-ion 3.6 V) and ML (Li-MnO2 3.0 V) rechargeable coin cells.',
 'https://images.unsplash.com/photo-1580407195669-d0c11ee3c1c2?w=1200&q=80',
 'https://images.unsplash.com/photo-1580407195669-d0c11ee3c1c2?w=1920&q=80',
 '<p>Most engineers default to LIR2032 because it''s the obvious CR2032 replacement. That''s usually correct — but for an industrial PCB that has to be reflow-mounted or run hot, ML is the only sensible choice. Here is how we steer customers.</p><h2>Voltage and the regulator question</h2><p>LIR (Li-ion) sits at 3.6-4.2 V, ML (Li-MnO2) at 2.8-3.0 V. If your circuit was designed for a CR2032 (3.0 V) and you can''t add a regulator, ML drops in. LIR needs an LDO or boost depending on the load.</p><h2>Reflow compatibility</h2><p>Only ML survives standard lead-free reflow profiles (260 °C peak). LIR cells must be hand-soldered or socket-mounted.</p><h2>Cycle count</h2><p>ML offers 1,000+ cycles vs. LIR''s 500+. For a daily-charge wearable that''s 1.4 vs. 2.7 years of design life — usually a deciding factor for product warranty.</p>',
 'Zufek Engineering', 7, now() - interval '20 days', 'published')
ON CONFLICT (slug) DO NOTHING;

-- ----- Pages (hero + meta for each static HTML + homepage sections JSON) -----
INSERT INTO pages (slug, nav, title, meta_title, meta_description, hero_eyebrow, hero_title, hero_subtitle, hero_image, hero_breadcrumbs, sections) VALUES
('home', 'home',
 'Home',
 'Custom Lithium Batteries for AR/VR, Medical, Wearables & IoT',
 'Custom lithium batteries for AR/VR, medical, wearable and IoT devices. OEM/ODM polymer, custom-shaped and cylindrical Li-Ion cells.',
 '', 'Custom Batteries, Engineered Precisely.',
 'Lithium-polymer and lithium-ion solutions for AR/VR, medical, wearable and IoT devices.',
 'https://images.unsplash.com/photo-1593642634443-44adaa06623a?w=1920&q=80',
 '[]'::jsonb,
 '{
   "hero_cta_primary":  {"text":"Request a Quote","link":"/contact.html"},
   "hero_cta_secondary":{"text":"Custom Solutions","link":"/products/custom-shaped-polymer-lithium-battery"},
   "products_eyebrow":"Product Lines",
   "products_title":"Three product lines, one factory.",
   "products_lead":"Polymer Li-Po, custom-shaped Li-Po and rechargeable coin steel-shell cells — engineered and manufactured under one ISO 9001 roof.",
   "products_cards":[
     {"tag":"Polymer","title":"Polymer Lithium Battery","desc":"Pouch Li-Po cells from 15 mAh to 20 Ah. Standard catalogue with 3-5 day samples.","link":"/products/polymer-lithium-battery","cta":"Explore line","featured":false},
     {"tag":"Custom ★","title":"Custom-Shaped Polymer","desc":"Bespoke geometry, capacity, BMS and connectors for your exact enclosure and power profile.","link":"/products/custom-shaped-polymer-lithium-battery","cta":"See capabilities","featured":true},
     {"tag":"Coin Cell","title":"Coin Steel-Shell Lithium","desc":"Rechargeable LIR & ML coin cells in stainless-steel cases. Reflow-compatible, 500-1,000+ cycles.","link":"/products/coin-steel-shell-lithium-battery","cta":"Compare formats","featured":false}
   ],
   "apps_eyebrow":"Applications",
   "apps_title":"Powering the next generation of devices.",
   "why_eyebrow":"Why us",
   "why_title":"A battery partner, not just a supplier.",
   "stats":[
     {"value":"8","unit":"yrs","label":"since 2018"},
     {"value":"100","unit":"+","label":"team members"},
     {"value":"3","unit":"","label":"tier-1 OEM programs"},
     {"value":"ISO 9001","unit":"","label":"certified"}
   ],
   "cta_title":"Have a project in mind?",
   "cta_lead":"Share your device specs — we will respond with a feasibility assessment within one business day.",
   "cta_button_text":"Start a Conversation",
   "cta_button_link":"/contact.html"
 }'::jsonb),

-- Products
('products/index', 'products', 'Products',
 'Lithium Battery Product Lines — Polymer, Custom-Shaped, Coin Cell',
 'Three product lines under one factory: pouch Li-Po, custom-shaped Li-Po, and rechargeable coin steel-shell cells. ISO 9001 certified manufacturing.',
 '', 'Three product lines, one factory.', 'Polymer Li-Po · Custom-Shaped Polymer · Coin Steel-Shell — pick the line that fits your enclosure and certification needs.',
 'https://images.unsplash.com/photo-1612392987824-d63f57e9b1cf?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Products"}]'::jsonb, '{}'::jsonb),

-- Applications
('applications/index', 'applications', 'Applications',
 'Lithium Battery Applications — AR/VR, Medical, Wearables, IoT',
 'Battery solutions across regulated B2B industries.',
 '', 'Powering the next generation of devices.', 'Each industry brings its own certifications, abuse profiles and lifecycle expectations.',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Applications"}]'::jsonb, '{}'::jsonb),
('applications/ar-vr', 'applications', 'AR / VR Glasses',
 'Batteries for AR / VR Glasses — Ultra-Thin Cells',
 'Ultra-thin and curved Li-Po cells for slim AR temples and VR headsets.',
 '', 'Batteries for AR / VR.', 'Ultra-thin and curved cells engineered around the optical engine.',
 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Applications","url":"/applications/"},{"label":"AR / VR"}]'::jsonb, '{}'::jsonb),
('applications/medical', 'applications', 'Medical Devices',
 'Batteries for Medical Devices — IEC 60601, ISO 13485',
 'IEC 60601-compliant cells for patient monitors, infusion pumps, hearing aids and surgical tools.',
 '', 'Medical Devices.', 'IEC 60601-compliant cells with ISO 13485 traceability.',
 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Applications","url":"/applications/"},{"label":"Medical"}]'::jsonb, '{}'::jsonb),
('applications/wearables', 'applications', 'Wearables',
 'Batteries for Wearables — Curved & Shaped Li-Po',
 'Ultra-small round and curved Li-Po cells for TWS earbuds, smart bands and patches.',
 '', 'Wearables.', 'Curved and shaped cells for watches, earbuds and rings.',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Applications","url":"/applications/"},{"label":"Wearables"}]'::jsonb, '{}'::jsonb),
('applications/iot', 'applications', 'IoT Devices',
 'Batteries for IoT — Long Shelf Life, Low Self-Discharge',
 'Long shelf-life cells for asset trackers, gateways and smart meters.',
 '', 'IoT Devices.', 'Long-life cells for sensors, trackers and edge devices.',
 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Applications","url":"/applications/"},{"label":"IoT"}]'::jsonb, '{}'::jsonb),

-- Solutions
('solutions/index', 'solutions', 'Custom Solutions',
 'Custom Battery Solutions — Design, Prototyping, Mass Production',
 'OEM/ODM custom lithium battery design service. NDA, feasibility, tooling, prototype, qualification, ramp.',
 '', 'From sketch to ramp.', 'A three-stage program: Design → Prototyping → Mass Production.',
 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Custom Solutions"}]'::jsonb, '{}'::jsonb),
('solutions/design', 'solutions', 'Design Support',
 'Battery Design Support — DFM, Cell Sizing, BMS Co-design',
 'Design support service: feasibility study, cell-size estimate, BMS architecture, certification roadmap.',
 '', 'Design Support.', 'A 5-day feasibility study from your STEP file or PDF.',
 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Custom Solutions","url":"/solutions/"},{"label":"Design"}]'::jsonb, '{}'::jsonb),
('solutions/prototyping', 'solutions', 'Prototyping',
 'Battery Prototyping — Tooling & First-Article Samples',
 'Prototype tooling and first-article samples in 25-35 days, with full UN 38.3 test summary.',
 '', 'Prototyping.', 'Tooling, samples and a UN 38.3 test summary in 25-35 days.',
 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Custom Solutions","url":"/solutions/"},{"label":"Prototyping"}]'::jsonb, '{}'::jsonb),
('solutions/mass-production', 'solutions', 'Mass Production',
 'Battery Mass Production — Serialised Traceability & SPC',
 'Mass production with serial-level traceability, SPC monitoring, and full certification documentation.',
 '', 'Mass Production.', 'Serialised traceability, SPC and full documentation per shipment.',
 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Custom Solutions","url":"/solutions/"},{"label":"Mass Production"}]'::jsonb, '{}'::jsonb),

-- About
('about/index', 'about', 'About', 'About — Custom Lithium Battery Manufacturer',
 'OEM/ODM lithium battery manufacturer founded 2018 in Dongguan. ISO 9001 certified.',
 '', 'A battery partner, not just a supplier.', 'Founded 2018. 100+ engineers. ISO 9001 certified.',
 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"About"}]'::jsonb, '{}'::jsonb),
('about/profile', 'about', 'Company Profile', 'Company Profile — Lithium Battery Manufacturer',
 'Company profile, mission, values and milestones.',
 '', 'Company Profile.', 'Founded 2018 in Dongguan to build batteries OEMs can trust.',
 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"About","url":"/about/"},{"label":"Profile"}]'::jsonb, '{}'::jsonb),
('about/factory', 'about', 'Factory Tour', 'Factory Tour — Lithium Battery Production',
 'A walkthrough of our Dongguan factory: production lines, QC, audit-ready facilities.',
 '', 'Factory Tour.', 'Two sites, both audit-ready.',
 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"About","url":"/about/"},{"label":"Factory"}]'::jsonb, '{}'::jsonb),
('about/team', 'about', 'Team', 'Team — Engineering & Operations',
 'Founder profile and the engineering and operations leadership team.',
 '', 'The Team.', 'Engineers, operators, QA — the people who make every cell.',
 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"About","url":"/about/"},{"label":"Team"}]'::jsonb, '{}'::jsonb),

-- Blog index
('blog/index', 'blog', 'Blog', 'Blog — Battery Engineering Guides & Industry Articles',
 'Battery guides, industry articles and technical deep-dives.',
 '', 'Battery knowledge, shared.', 'Written by our engineers for the engineers building the next device.',
 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Blog"}]'::jsonb, '{}'::jsonb),

-- Contact / FAQ / Legal
('faq', 'faq', 'FAQ', 'FAQ — Lithium Battery Manufacturer Questions',
 'Lead time, MOQ, certification, customisation, shipping — answered.',
 '', 'Frequently Asked.', 'Lead time, MOQ, certification, customisation, shipping.',
 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"FAQ"}]'::jsonb, '{}'::jsonb),
('contact', 'contact', 'Contact', 'Contact — Request a Quote',
 'Contact us for a quote, custom project, factory tour or media inquiry.',
 '', 'Let''s power your next product.', 'Tell us about your device — we will reply within one business day with a feasibility assessment.',
 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Contact ★"}]'::jsonb, '{}'::jsonb),
('privacy', '', 'Privacy Policy', 'Privacy Policy', 'Our privacy policy and your GDPR rights.',
 '', 'Privacy Policy.', 'How we collect, use and protect your data.',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Privacy Policy"}]'::jsonb, '{}'::jsonb),
('terms', '', 'Terms of Use', 'Terms of Use', 'The rules that apply when you use this site.',
 '', 'Terms of Use.', 'The rules that apply when you use this site.',
 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Terms of Use"}]'::jsonb, '{}'::jsonb),
('legal', '', 'Legal', 'Legal Notice', 'Imprint and legal notices.',
 '', 'Legal.', 'Imprint and legal notices.',
 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"Legal"}]'::jsonb, '{}'::jsonb),
('gdpr', '', 'GDPR Data Request', 'GDPR Data Subject Request', 'Submit a GDPR data subject access, rectification or erasure request.',
 '', 'GDPR Data Request.', 'Submit a request to access, rectify or delete your personal data.',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
 '[{"label":"Home","url":"/"},{"label":"GDPR"}]'::jsonb, '{}'::jsonb)

ON CONFLICT (slug) DO NOTHING;

-- ----- Settings -----
INSERT INTO settings (key, value) VALUES
('site',
 '{"name":"Zufek","legal_name":"Dongguan Zufek Technology Co.,Ltd","tagline":"R&D-led lithium-cell maker for AR/VR, medical, wearables and IoT. A 100-person Dongguan team that has shipped 300+ custom programs worldwide since 2018.","email":"info@zufek.com","engineering_email":"engineering@zufek.com","phone":"+86 153 7772 0020","address":"Room 432, Building 1, No. 34 Jinniu Road, Guancheng Subdistrict, Dongguan City, Guangdong Province, China","founded_year":2018,"factory_size_sqm":5000,"staff_count":100}'),
('social',
 '{"linkedin":"https://www.linkedin.com/company/zufek","whatsapp":"https://wa.me/8615377720020"}'),
('seo',
 '{"public_url":"https://zufek.com","default_meta_description":"OEM/ODM lithium battery manufacturer specialising in polymer Li-Po, custom-shaped Li-Po and coin steel-shell lithium cells. ISO 9001, UN 38.3, CE compliant.","default_meta_image":"/logo.png","twitter_handle":"","ga4_measurement_id":"","gsc_verify":"","bing_verify":""}'),
('organization',
 '{"legal_name":"Dongguan Zufek Technology Co.,Ltd","brand_name":"Zufek","founding_date":"2018","vat_id":"","duns":"","logo":"/logo.png","sameAs":["https://www.linkedin.com/company/zufek"],"address":{"streetAddress":"Room 432, Building 1, No. 34 Jinniu Road, Guancheng Subdistrict","addressLocality":"Dongguan","addressRegion":"Guangdong","postalCode":"523000","addressCountry":"CN"},"contactPoints":[{"type":"sales","email":"info@zufek.com","telephone":"+86 153 7772 0020","areaServed":"Worldwide","availableLanguage":["en","zh"]},{"type":"technical support","email":"engineering@zufek.com","areaServed":"Worldwide","availableLanguage":["en"]}]}'),
('gdpr',
 '{"retention_days":365,"soft_delete_days":30,"policy_version":"1.0","controller":"Dongguan Zufek Technology Co.,Ltd","controller_email":"privacy@zufek.com","cookie_categories":{"necessary":{"required":true,"label":"Strictly necessary","description":"Required for the site to function (session, security, language preference)."},"analytics":{"required":false,"label":"Analytics","description":"Aggregated traffic statistics to help us improve the site."},"marketing":{"required":false,"label":"Marketing","description":"Used to measure the performance of advertising campaigns."}}}'),
('mail',
 '{"reply_to":"info@zufek.com","subject_prefix":"[Inquiry]","auto_reply_enabled":true}'),
('navigation',
 '{"header":[{"label":"HOME","url":"/","nav":"home"},{"label":"PRODUCTS","url":"/products/","nav":"products","children":[{"label":"Polymer Lithium Battery","url":"/products/polymer-lithium-battery"},{"label":"Custom-Shaped Polymer (Li-Po)","url":"/products/custom-shaped-polymer-lithium-battery"},{"label":"Coin Steel-Shell Lithium","url":"/products/coin-steel-shell-lithium-battery"}]},{"label":"APPLICATIONS","url":"/applications/","nav":"applications","children":[{"label":"AR / VR Glasses","url":"/applications/ar-vr.html"},{"label":"Medical Devices","url":"/applications/medical.html"},{"label":"Wearables","url":"/applications/wearables.html"},{"label":"IoT Devices","url":"/applications/iot.html"},{"label":"Smart Home","url":"/applications/smart-home.html"},{"label":"Defence & Aerospace","url":"/applications/defence-aerospace.html"}]},{"label":"CUSTOM SOLUTIONS","url":"/solutions/","nav":"solutions","children":[{"label":"Design Support","url":"/solutions/design.html"},{"label":"Prototyping","url":"/solutions/prototyping.html"},{"label":"Mass Production","url":"/solutions/mass-production.html"}]},{"label":"ABOUT US","url":"/about/","nav":"about","children":[{"label":"Company Profile","url":"/about/profile.html"},{"label":"Factory Tour","url":"/about/factory.html"},{"label":"Team","url":"/about/team.html"}]},{"label":"BLOG","url":"/blog/","nav":"blog"},{"label":"FAQ","url":"/faq.html","nav":"faq"},{"label":"CONTACT","url":"/contact.html","nav":"contact"}]}')
ON CONFLICT (key) DO NOTHING;


-- ----- Migrated blog articles (from former /public/blog/<slug>.html files) -----
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('ar-thin-battery', $art$Designing an Ultra-Thin Battery for AR Glasses$art$, $art$The mechanical, thermal and EMI trade-offs you encounter when designing a lithium cell below 1 mm thickness for AR glasses.$art$, 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1920&q=80', $art$<p class="lede">A typical smartphone cell is 4 mm thick. A smartwatch cell lands around 2–3 mm. AR glasses live below 1 mm. Each halving exposes a new set of physics that you were previously allowed to ignore.</p>

        <h2>The anatomy of a sub-millimetre cell</h2>
        <p>A lithium-polymer pouch at 0.45 mm thickness is roughly four layers of electrode coating and three separators, wrapped in an aluminium-laminate pouch that is itself about 100 &micro;m on each face. The active material is only a fraction of the total volume &mdash; inert structural layers eat a disproportionate share compared to a thicker cell.</p>
        <p>That&rsquo;s why doubling capacity in an AR cell is rarely possible just by &ldquo;making it twice as long&rdquo;. Beyond about 300&nbsp;mAh you almost always have to grow thickness as well, because the additional electrode layers need additional separator and tab mass, and your ratio of active-to-inert material starts going the wrong way.</p>

        <h2>Swelling becomes a first-class citizen</h2>
        <p>Every Li-ion cell swells on charge, typically 3&ndash;8% volumetric expansion. On a 4 mm cell that&rsquo;s a few hundred microns of z-axis movement &mdash; the enclosure can easily absorb it. On a 0.6 mm cell it&rsquo;s 30&ndash;50 &micro;m, which matters when the cell is glued against a micro-OLED display or a PCB with sub-millimetre standoffs.</p>
        <p>Two practical consequences:</p>
        <ul>
          <li><strong>Leave 0.15&ndash;0.25 mm of compressible gap</strong> (foam, silicone pad) between the cell and any rigid surface.</li>
          <li><strong>Qualify the cell through 85&nbsp;&deg;C / 85% RH aging</strong> and measure swelling after 200 and 500 cycles. AR customers routinely reject cells that swell past 9% at end of test.</li>
        </ul>

        <h2>Thermal: you can&rsquo;t radiate through skin</h2>
        <p>An AR temple touches the wearer&rsquo;s skin continuously. That disqualifies the normal approach of radiating heat out through the enclosure. The battery ends up sharing a heat path with the SoC, the display driver, and sometimes a camera ISP &mdash; any of which can spike to 3&ndash;5 W momentarily.</p>
        <p>Three design knobs:</p>
        <ol>
          <li><strong>Graphite or copper foil underside</strong> to spread heat along the temple rather than letting it pool near the cell.</li>
          <li><strong>Charge-rate throttling in the BMS</strong> when skin-side temperature exceeds ~38&nbsp;&deg;C.</li>
          <li><strong>Cell-internal NTC</strong>, not just a PCB thermistor &mdash; the cell surface lags the PCB by 2&ndash;4&nbsp;&deg;C on fast charge.</li>
        </ol>

        <h2>EMI: the cell is a dipole</h2>
        <p>A thin pouch cell has relatively large surface area per unit mass, and its tabs form a small loop antenna. Two radios sit millimetres away &mdash; Bluetooth and (increasingly) UWB or Wi-Fi. We&rsquo;ve seen three recurring issues:</p>
        <ul>
          <li>Ground-return current in the battery tab modulating BT audio quality.</li>
          <li>Charging harmonics leaking into the 2.4&nbsp;GHz band during wired charging.</li>
          <li>Pogo-pin contact noise disrupting touch-capacitive temples.</li>
        </ul>
        <p>Mitigations are standard: tab orientation perpendicular to antenna polarisation, ferrite bead on the charge path, and ground the pouch aluminium foil to the system star-ground.</p>

        <h2>Hermetic seal and the HEVT test</h2>
        <p>AR glasses are worn in rain, steam showers, and humid gym lockers. The cell itself isn&rsquo;t sealed, but it sits inside an IPx4&ndash;IPx7 enclosure. Customers frequently add a high-temperature humidity test (HEVT) on top of IEC 62133: 85&nbsp;&deg;C / 85% RH for 168&nbsp;hours with the cell charged to 100% SOC. If your pouch laminate is not spec&rsquo;d for this, you&rsquo;ll see moisture ingress through the seal, electrolyte leakage, and dramatic capacity fade.</p>

        <h2>One pragmatic rule</h2>
        <p>Spec the thickest cell you can physically fit, not the thinnest that meets runtime. Every 0.1 mm of additional thickness typically buys you 12&ndash;18% capacity, much better cycle life, and noticeably more mechanical tolerance. The moment you start chasing the absolute physical minimum, you are trading warranty returns for a spec-sheet win.</p>

        <nav class="article-nav">
          <a href="/blog/wearable-chemistry.html" class="prev">&larr; Previous: Wearable Chemistry</a>
          <a href="/blog/un-iec-compliance.html" class="next">Next: UN 38.3 &amp; IEC 62133 &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 12, (SELECT id FROM categories WHERE slug='technology'), now() - interval '10 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('ar-vr-market-2026', $art$The AR/VR Battery Market in 2026$art$, $art$A sober look at AR/VR headset shipment forecasts and what they mean for pouch-cell supply.$art$, 'https://images.unsplash.com/photo-1617802690992-15d93263d3a3?w=1920&q=80', $art$<p class="lede">The AR/VR category enters 2026 with three distinct sub-segments forming, each with its own battery-sourcing reality. For pouch-cell suppliers, these segments are not equally attractive &mdash; and the wrong bet could leave a factory stranded on cell sizes that nobody orders in 2027.</p>

        <h2>Three segments, three battery worlds</h2>

        <h3>1. Standalone VR (tethered experience, heavy)</h3>
        <p>This is the mature segment. Devices are roughly 400&ndash;650 g, use 3,500&ndash;5,500 mAh cells, and the industrial-design pressure on the battery has plateaued. Customers in this segment buy in large volumes and ask for long-cycle-life (800+) pouch cells at conservative cell chemistries &mdash; 4.35&ndash;4.40 V platforms are the norm.</p>
        <p>Supply is not tight here. Multiple Chinese and Korean suppliers ship volumes in the tens of millions a year, and pricing has been trending down 6&ndash;9% year-over-year since 2023.</p>

        <h3>2. AR glasses (all-day, lightweight)</h3>
        <p>The fastest-growing segment. Form factors are converging around 40&ndash;80 g headsets with 150&ndash;500 mAh ultra-thin cells. This is where 4.48 V high-voltage LCO is displacing conventional LCO, and where suppliers who can hold &lt; 1.0 mm cell thickness tolerance have a real moat.</p>
        <p>Demand signals are bullish but choppy. Several consumer-electronics OEMs are taking multi-million-unit bets on new generations launching in late 2026 and 2027. If one of those launches succeeds, the industry will be short on 0.6&ndash;0.9 mm pouch cell capacity by the second half of 2026.</p>

        <h3>3. Smart glasses (display-less, audio-first)</h3>
        <p>The volume leader in unit terms but not in cell consumption. A sensor-only or audio-only smart glass uses a 30&ndash;80 mAh coin or micro-pouch cell; total lithium content is under a gram. These devices ship in tens of millions a year at low cell prices, but the margin-per-cell is thin. It&rsquo;s a segment to serve if you already have a coin-cell line; not one to build a factory around.</p>

        <h2>What suppliers are hearing from customers</h2>
        <p>Conversations with battery buyers in this category in Q1 2026 landed on four consistent themes:</p>
        <ul>
          <li><strong>Density trumps cycle life</strong> for AR glasses &mdash; customers accept 400-cycle ratings if runtime increases.</li>
          <li><strong>Thermal envelope is being specified more aggressively.</strong> Skin-contact limits are now in RFQs, not discovered during EVT.</li>
          <li><strong>Swelling is auditable.</strong> Several tier-1 customers now require swelling data at multiple aging points, not just an end-of-life number.</li>
          <li><strong>Dual sourcing is mandatory.</strong> After 2023&rsquo;s supply disruptions, no serious AR program is single-sourcing.</li>
        </ul>

        <h2>The bottleneck nobody&rsquo;s talking about</h2>
        <p>The constraint in AR battery supply is not cell manufacturing capacity &mdash; it&rsquo;s electrode coating lines capable of sub-35 &micro;m coatings at tight uniformity. That equipment is specialised, mostly built by Japanese and Korean OEMs, and deliveries in 2026 are being allocated quarter by quarter. Any battery supplier making commitments for ultra-thin volumes should check the coating-line book before promising lead times.</p>

        <h2>What to bet on</h2>
        <p>For a supplier positioning for the next 24 months:</p>
        <ol>
          <li><strong>Invest in 4.48 V platform qualification now.</strong> Customers will not wait for you to catch up in late 2026.</li>
          <li><strong>Build excess pilot-line capacity for 0.6&ndash;1.0 mm cells.</strong> AR design cycles are fast; the team that can turn a new cell geometry in 4 weeks wins.</li>
          <li><strong>Don&rsquo;t chase VR volumes.</strong> Margins are compressed and the segment is already served.</li>
          <li><strong>Offer BMS-integrated packs, not bare cells.</strong> AR customers increasingly buy fully-integrated solutions to close faster.</li>
        </ol>

        <nav class="article-nav">
          <a href="/blog/industry.html" class="prev">&larr; Back to Industry Articles</a>
          <a href="/blog/solid-state-reality.html" class="next">Next: Solid-State Reality &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 5, (SELECT id FROM categories WHERE slug='industry-insights'), now() - interval '13 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('bms-pcm-smart', $art$Protection PCM vs Smart Battery: When to Use Which$art$, $art$Cost, complexity and firmware implications of the two main BMS topologies in consumer electronics.$art$, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80', $art$<p class="lede">Every lithium cell needs protection. The question is only how much of it lives on the cell itself versus on the host system. A protection PCM (PCM = protection circuit module) handles the basics for pennies. A smart battery pack negotiates with the host at the cost of dollars. Between those two there is no middle ground worth defending.</p>

        <h2>What a protection PCM gives you</h2>
        <p>A typical single-cell PCM is a small board tab-welded to the cell, with a protection IC and two back-to-back MOSFETs. It reacts in hardware to four abuse conditions:</p>
        <ul>
          <li>Over-charge (cell voltage above 4.25&ndash;4.28 V)</li>
          <li>Over-discharge (cell voltage below 2.5&ndash;2.8 V)</li>
          <li>Over-current on discharge (typically 2&ndash;5&times; rated)</li>
          <li>Short circuit (sub-millisecond response via hardware)</li>
        </ul>
        <p>Add-on features that cost a few more cents: NTC thermistor for over-temperature cut-off, secondary protection IC, CID (current interrupt device). BOM cost lands between USD 0.08 and USD 0.30 for a standard single-cell pouch.</p>

        <h2>What a smart battery adds</h2>
        <p>A smart battery pack wraps the PCM with a microcontroller and a digital bus to the host &mdash; usually I&sup2;C, SMBus or HDQ. The host sees the battery as a device that returns structured data:</p>
        <ul>
          <li>State of charge (%)</li>
          <li>State of health (%) estimated from capacity fade</li>
          <li>Cell voltage and pack current</li>
          <li>Temperature from 1&ndash;3 thermistors</li>
          <li>Cycle count and time since manufacture</li>
          <li>Error flags and lifetime abuse counters</li>
        </ul>
        <p>The gauge does coulomb counting + voltage correlation to report SoC accurate to roughly &plusmn;3% over the life of the pack. BOM cost: USD 1.50&ndash;5.00 depending on the chip.</p>

        <h2>A decision guide</h2>
        <table>
          <thead><tr><th>Device</th><th>PCM</th><th>Smart battery</th></tr></thead>
          <tbody>
            <tr><td>TWS earbud</td><td>&bull;</td><td></td></tr>
            <tr><td>Fitness band (no display SoC)</td><td>&bull;</td><td></td></tr>
            <tr><td>Smartwatch (% readout on screen)</td><td></td><td>&bull;</td></tr>
            <tr><td>AR glasses (thermal-managed charging)</td><td></td><td>&bull;</td></tr>
            <tr><td>Smart-home sensor</td><td>&bull;</td><td></td></tr>
            <tr><td>Medical wearable (traceable usage log)</td><td></td><td>&bull;</td></tr>
            <tr><td>Portable ultrasound / POC device</td><td></td><td>&bull;</td></tr>
            <tr><td>Hand tool (single-cell)</td><td>&bull;</td><td></td></tr>
          </tbody>
        </table>
        <p>The rule of thumb: if the user can see a percentage or a &ldquo;battery health&rdquo; indicator, or if a regulator will ask you to prove usage patterns, the cost of a smart battery is always justified. Otherwise, a PCM with a good voltage-to-SoC lookup in the host firmware covers 90% of products.</p>

        <h2>The gotcha: host firmware always does more than you planned</h2>
        <p>Even if you go with a cheap PCM, the host MCU is doing three things you can&rsquo;t skip:</p>
        <ol>
          <li><strong>SoC estimation.</strong> Voltage lookup is easy at rest, misleading under load. Budget a week of firmware work to calibrate at actual discharge currents.</li>
          <li><strong>Charge-profile control.</strong> The charger IC handles CC/CV, but you decide when to start, when to pause for thermal reasons, and when to trickle.</li>
          <li><strong>End-of-life reporting.</strong> Without cycle counting, the user has no warning that the battery is dying.</li>
        </ol>
        <p>A smart battery absorbs all three of those responsibilities into the pack itself, which is why firmware teams with limited bandwidth prefer it even when the unit cost is higher.</p>

        <h2>Wireless charging and USB-PD complicate everything</h2>
        <p>Any design with wireless charging de-facto needs dynamic thermal throttling, which a standalone PCM can&rsquo;t do. USB-PD adds a second negotiation loop (host &harr; charger &harr; battery). For both cases, a smart battery or at minimum a fuel-gauge IC with thermal reporting becomes mandatory.</p>

        <nav class="article-nav">
          <a href="/blog/cell-sizing.html" class="prev">&larr; Previous: Cell Sizing</a>
          <a href="/blog/wearable-thermal.html" class="next">Next: Skin-Contact Thermal &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 7, (SELECT id FROM categories WHERE slug='technology'), now() - interval '16 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('cell-sizing', $art$Sizing a Cell From a Power Profile$art$, $art$How to turn a current-vs-time trace into a real-world capacity specification — with a worked IoT example.$art$, 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1920&q=80', $art$<p class="lede">Most &ldquo;battery dies too fast&rdquo; complaints trace back to the same mistake: picking a cell capacity that matches nameplate runtime, not real-world runtime. The right method is uncomfortable because it forces you to give up capacity on paper to gain it in the field.</p>

        <h2>Start with the current trace, not the datasheet</h2>
        <p>You need four inputs before you can size a cell:</p>
        <ul>
          <li><strong>Average current (I<sub>avg</sub>)</strong> across a representative use session.</li>
          <li><strong>Peak current (I<sub>pk</sub>)</strong> and its duration &mdash; for radio bursts, display ramp, motor kick-in.</li>
          <li><strong>Ambient temperature range</strong> the device operates in.</li>
          <li><strong>Target lifetime</strong> in charge cycles, or in years for calendar-limited designs.</li>
        </ul>
        <p>If you don&rsquo;t have a current trace, capture one. A cheap shunt + logger in series with the battery terminal gets you a usable profile in an afternoon.</p>

        <h2>Compute ideal capacity</h2>
        <p>The arithmetic is trivial:</p>
        <blockquote>Q<sub>ideal</sub> = I<sub>avg</sub> &times; T<sub>target</sub></blockquote>
        <p>For a wearable that draws 18 mA average over an 18-hour session: Q<sub>ideal</sub> = 18 &times; 18 = 324 mAh. That&rsquo;s your starting point, and you should never stop there.</p>

        <h2>Apply the derating cascade</h2>
        <p>Four factors chip away at the headline number. Multiply them in order:</p>
        <table>
          <thead><tr><th>Factor</th><th>Typical value</th><th>Why</th></tr></thead>
          <tbody>
            <tr><td>Usable SOC window</td><td>&times; 1 / 0.90</td><td>You can&rsquo;t drain a Li-ion cell to 0% without harming it &mdash; most BMSes cut at 3.0 V.</td></tr>
            <tr><td>End-of-life capacity</td><td>&times; 1 / 0.80</td><td>A cell rated for 500 cycles has 80% SOH at end of life. Design for that, not day-1 capacity.</td></tr>
            <tr><td>Temperature derating</td><td>&times; 1 / 0.90 (if used below 10 &deg;C)</td><td>Low-temp capacity falls off a cliff. Ignorable for indoor wearables, critical for outdoor IoT.</td></tr>
            <tr><td>Peak-current headroom</td><td>&times; 1.05&ndash;1.15</td><td>Voltage sag during I<sub>pk</sub> cuts into usable capacity. Bigger pulses = bigger factor.</td></tr>
          </tbody>
        </table>
        <p>Chained together, the 324 mAh wearable needs roughly <strong>324 &times; 1.11 &times; 1.25 &times; 1.0 &times; 1.05 &approx; 470 mAh</strong> to deliver 18-hour runtime through its end of life.</p>

        <h2>A worked IoT example</h2>
        <p>Consider a LoRa asset tracker with this duty cycle:</p>
        <ul>
          <li>Sleep: 20 &micro;A, 59 minutes per hour</li>
          <li>GPS fix: 25 mA for 45 seconds, once per hour</li>
          <li>LoRa TX: 120 mA for 1 second, once per hour</li>
        </ul>
        <p>Hourly charge consumed: (20 &micro;A &times; 59/60 h) + (25 mA &times; 45/3600 h) + (120 mA &times; 1/3600 h) &asymp; 0.345 mAh/hour.</p>
        <p>Target: 3 years without battery replacement = 26,280 hours &rarr; 9,067 mAh.</p>
        <p>Apply the derating: for an outdoor device operating at &minus;10&nbsp;&deg;C to +50&nbsp;&deg;C, the cold-temperature factor alone pushes this to &sim;11.3 Ah. The design converges on either a large Li-SOCl&sub;2 cell or a Li-SOCl&sub;2 + high-pulse-capacitor hybrid to handle the TX bursts.</p>

        <h2>Three shortcuts that ship real products</h2>
        <ol>
          <li><strong>When you don&rsquo;t know, over-size by 30%.</strong> Design in more capacity than you think you need. Shrinking later is cheap; fielded returns are not.</li>
          <li><strong>Target end-of-life runtime in the marketing copy.</strong> If you say &ldquo;7 days&rdquo; and the user gets 7.8 days out of the box and 6.1 after a year, they feel cheated. Say &ldquo;6 days&rdquo; and over-deliver on day one.</li>
          <li><strong>Measure, don&rsquo;t estimate.</strong> One honest lab current trace beats a spreadsheet full of datasheet numbers.</li>
        </ol>

        <nav class="article-nav">
          <a href="/blog/un-iec-compliance.html" class="prev">&larr; Previous: UN 38.3 &amp; IEC 62133</a>
          <a href="/blog/bms-pcm-smart.html" class="next">Next: PCM vs Smart Battery &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 9, (SELECT id FROM categories WHERE slug='technology'), now() - interval '19 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('china-medical-battery', $art$China's Medical Device Battery Landscape$art$, $art$How NMPA-driven localisation is reshaping the supplier base for wearable medical devices in China and globally.$art$, 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1920&q=80', $art$<p class="lede">Medical-device batteries sit in a category of their own: small volumes, long qualification cycles, and regulatory exposure that scales with end-device approval rather than with the battery itself. In China, the last three years have brought real consolidation on the supply side, along with policy pressure to localise. The net effect is a supplier base that&rsquo;s more capable but more concentrated than it was.</p>

        <h2>The regulatory pressure</h2>
        <p>The NMPA (National Medical Products Administration) has been quietly raising expectations for domestic sourcing of critical components in class II and class III medical devices. Not as a hard rule &mdash; there&rsquo;s no explicit ban on imported batteries &mdash; but as a preference signal that comes up during device-registration review. Programs that can point to a qualified domestic supplier for the battery tend to clear faster than those that cannot.</p>
        <p>For domestic-market devices, this effectively forces a dual-qualification path: a primary supplier (often imported, for legacy program continuity) plus a domestic second source. Over a 2&ndash;3 year horizon, procurement shifts toward the domestic supplier as the primary.</p>

        <h2>What this looks like on the ground</h2>
        <p>Four practical shifts we&rsquo;ve seen in 2024&ndash;2026:</p>
        <ul>
          <li><strong>ISO 13485 certification</strong> for dedicated medical cell lines is now table stakes. A decade ago only a handful of Chinese cell suppliers held it; today it&rsquo;s a minimum qualification criterion.</li>
          <li><strong>DHF-ready documentation</strong> is being offered as a standard package. Process FMEA, control plans, design-history files scoped to the cell &mdash; these used to be custom work; now they ship in a box.</li>
          <li><strong>Dedicated clean-room lines</strong> for biocompatible-only cells (for devices that contact skin or are sterile-packaged). USP Class VI casing materials are commonly stocked.</li>
          <li><strong>Long-term supply commitments</strong> &mdash; last-time-buy notice periods of 12&ndash;24 months, capacity reservations, and 10-year archival of process data.</li>
        </ul>

        <h2>The devices driving demand</h2>
        <p>Four device categories are pulling the market:</p>
        <ol>
          <li><strong>Continuous glucose monitors</strong> &mdash; the single biggest unit-volume driver, with 10&ndash;14 day disposable lifetimes and extremely tight form factors.</li>
          <li><strong>Hearing aids</strong> &mdash; rechargeable replacing zinc-air primaries; small coin-format cells with long calendar life.</li>
          <li><strong>Wearable ECG / Holter monitors</strong> &mdash; mid-capacity pouch cells with ruggedisation requirements.</li>
          <li><strong>Insulin and infusion pumps</strong> &mdash; higher reliability targets; often dual-cell redundancy.</li>
        </ol>
        <p>In aggregate these represent a meaningful fraction of premium small-cell demand, and the margin profile is attractive enough that suppliers are actively competing for qualification slots.</p>

        <h2>For global medical OEMs</h2>
        <p>Three considerations if you&rsquo;re building a medical device in 2026:</p>

        <h3>1. Dual-source early</h3>
        <p>Qualifying a second source after launch is painful in medical because every change of supplier requires change-control documentation and, in some jurisdictions, re-filing. Launching with two qualified suppliers adds cost up-front but avoids a disruptive change later.</p>

        <h3>2. Match the supplier to the market</h3>
        <p>For devices sold primarily into China, a domestic supplier has real advantages beyond cost &mdash; faster NMPA response, easier audit access, shorter logistics. For devices sold primarily into the US or EU, a supplier with strong FDA/CE documentation practice matters more.</p>

        <h3>3. Treat the battery as a component, not a commodity</h3>
        <p>The fastest way to sink a medical program is to treat the battery as a procurement line item rather than a qualified component with a change-controlled BOM. That&rsquo;s how a supplier quietly switches separator film for cost reasons and your device fails a re-verification two years into market.</p>

        <h2>What the supply side is offering in 2026</h2>
        <p>The most advanced suppliers now routinely offer:</p>
        <ul>
          <li>Serial-level traceability, archived for 10+ years</li>
          <li>Dedicated change-control processes with customer notification windows</li>
          <li>Quality agreements as standard paperwork</li>
          <li>On-demand factory audits, including virtual tours</li>
          <li>Joint DHF support and pre-clinical supporting data</li>
        </ul>
        <p>Pricing is higher than consumer-grade equivalents &mdash; typically 30&ndash;60% premium per Wh &mdash; but the total cost of ownership, factoring in regulatory stability and line-of-sight to supply continuity, usually favours the medical-grade supplier for medical programs.</p>

        <h2>Where this ends up</h2>
        <p>Our read is that by 2028 the Chinese medical-cell supplier base will have consolidated to five or six serious players with dedicated lines, plus a long tail of opportunistic suppliers that will drift out of the category as qualification demands rise. Global OEMs should build relationships with at least two of the serious players now, because by the time the consolidation completes, capacity will be spoken for.</p>

        <nav class="article-nav">
          <a href="/blog/hv-lco-density.html" class="prev">&larr; Previous: HV LCO at 4.48 V</a>
          <a href="/blog/industry.html" class="next">Back to Industry Articles &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 4, (SELECT id FROM categories WHERE slug='industry-insights'), now() - interval '22 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('cobalt-nickel-lfp', $art$Supply Chain Notes: Cobalt, Nickel, LFP Outlook$art$, $art$Raw-material pricing, geographic concentration risks, and what procurement teams should lock in for 2026–2027.$art$, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&q=80', $art$<p class="lede">Three raw materials dictate lithium-cell pricing: cobalt, nickel, and the lithium compounds themselves. For small-format cells, cobalt is still the structural factor; for bigger-format packs, nickel-heavy NMC chemistries and LFP are competing on total cost of ownership. Here&rsquo;s how we read the next 12&ndash;24 months.</p>

        <h2>Cobalt: oversupplied, but concentrated</h2>
        <p>Cobalt prices remained below the 2022&ndash;2023 peaks through 2025 and are expected to stay there into 2027. The structural reality hasn&rsquo;t changed: roughly three-quarters of mined cobalt comes out of the DRC, and most refined material flows through China. Supply is not the problem in 2026; concentration risk is.</p>
        <p>For OEMs shipping to the EU and US, the new regulatory angle matters more than the price. Battery Passport disclosure (see separate article) and various supply-chain due-diligence rules mean that &ldquo;cobalt provenance&rdquo; is now a procurement question, not just a sustainability narrative.</p>

        <h2>Nickel: long-term tightening</h2>
        <p>Nickel tells the opposite story. Indonesian supply continues to grow, keeping prices in check through 2025 and into 2026. But the grade matters &mdash; Class 1 nickel (battery-grade) has structurally tighter supply than Class 2 nickel used in stainless steel. Any meaningful shift of automotive programs toward high-nickel NMC in 2026&ndash;2028 could tighten the Class 1 market faster than most procurement plans assume.</p>
        <p>For consumer-electronics cell buyers, the direct impact is indirect: automotive-grade nickel pricing tends to pull on small-cell cathode costs with a 2&ndash;4 quarter lag.</p>

        <h2>LFP: the quiet winner in bigger formats</h2>
        <p>Lithium iron phosphate has been gaining share in EVs and stationary storage for four years running. For consumer electronics the story is different &mdash; LFP&rsquo;s lower energy density still disqualifies it from most wearables and AR products. But for charging-case batteries, larger IoT gateways, and industrial handhelds, LFP is increasingly the economic choice.</p>
        <p>Pricing has stabilised after the dramatic 2023&ndash;2024 compression. We&rsquo;d expect modest (2&ndash;5%) increases through 2026 as capacity shifts toward automotive and grid storage, then softness again in 2027 as new Chinese LFP capacity comes online.</p>

        <h2>Lithium compounds: two markets, not one</h2>
        <p>Lithium carbonate and lithium hydroxide tell different stories. Hydroxide (used in high-nickel NMC) has tighter supply and a small premium to carbonate. For 2026, we&rsquo;re modelling roughly flat pricing with upward risk if EV demand surprises on the high side.</p>
        <p>The practical takeaway: if your cell chemistry depends on lithium hydroxide, ask your supplier for their hedge position. Most tier-1 cell suppliers have 3&ndash;6 month raw-material coverage at any given time, but smaller ones run closer to spot.</p>

        <h2>What procurement teams should lock in</h2>
        <ol>
          <li><strong>Index clauses, not fixed prices.</strong> Fixed-price contracts in a volatile market transfer risk to your supplier, who will either fail to honour them or price in risk premium. Better: index to a public benchmark with agreed collar.</li>
          <li><strong>12-month volume commitments with price reviews every 6 months.</strong> This matches how most Chinese cell suppliers structure their raw-material buys.</li>
          <li><strong>Dual-source by chemistry,</strong> not just by vendor. One supplier on LCO and another on LCO from a different refinery gives you little real diversification.</li>
          <li><strong>Ask for supply-chain due diligence data</strong> now &mdash; before regulation forces the question. Mine of origin, refinery, smelter: your cell supplier should be able to answer at least down to refinery level.</li>
        </ol>

        <h2>One scenario worth planning for</h2>
        <p>A disruption in Indonesian nickel supply (weather, policy, or export-control shift) remains our most-watched downside risk. It wouldn&rsquo;t change cobalt-dominated small-cell pricing immediately, but a Class 1 nickel squeeze in 2026 would cascade into NMC cathode prices within six months and affect any product using &gt; 1 Ah cells. It&rsquo;s worth having a contingency in the buy plan, even if it stays dormant.</p>

        <nav class="article-nav">
          <a href="/blog/solid-state-reality.html" class="prev">&larr; Previous: Solid-State Reality</a>
          <a href="/blog/eu-battery-passport.html" class="next">Next: EU Battery Passport &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 4, (SELECT id FROM categories WHERE slug='industry-insights'), now() - interval '25 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('cycle-life-curves', $art$Reading a Cycle-Life Curve Honestly$art$, $art$Why$art$, 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80', $art$<p class="lede">When you look at a cell datasheet and see a single cycle-life number, someone has already made four decisions on your behalf &mdash; decisions that determine whether you&rsquo;ll see that number in the field or half of it. Before you trust a cycle-life claim, learn to ask for the conditions.</p>

        <h2>The four hidden variables</h2>
        <p>A cycle-life claim is a function of four test parameters. Change any of them and the number moves, sometimes dramatically.</p>

        <h3>1. Depth of discharge (DoD)</h3>
        <p>Cycling a cell from 100% to 0% stresses it more than cycling from 90% to 20%. Lab data typically uses 100% DoD because it&rsquo;s the worst case &mdash; but most wearables and AR devices never see 100% DoD in the wild. A cell spec&rsquo;d at 500 cycles / 100% DoD often delivers 900&ndash;1200 cycles / 80% DoD and 1800+ cycles / 50% DoD. If your real use case is 70% DoD, multiply the datasheet number by ~1.4 and you&rsquo;ll be closer to reality.</p>

        <h3>2. Charge and discharge C-rate</h3>
        <p>&ldquo;0.5C / 0.5C&rdquo; is the polite laboratory standard. A device that fast-charges at 1C and discharges in high-power bursts at 2C will age faster &mdash; typically 25&ndash;40% faster. Ask the vendor for cycle data at your actual charge rate. If they don&rsquo;t have it, request a custom aging test (cost: USD 2&ndash;5k, duration: 8&ndash;16 weeks).</p>

        <h3>3. Temperature</h3>
        <p>Cycle life halves roughly every 10 &deg;C increase above 25 &deg;C. A cell that does 500 cycles at 25 &deg;C will do 300&ndash;350 at 35 &deg;C and 200 or fewer at 45 &deg;C. Thermally-challenging products (outdoor IoT, charging cradles without airflow, AR glasses in the sun) need to derate cycle life as a first-order design input, not a footnote.</p>

        <h3>4. End-of-life threshold</h3>
        <p>Is 80% SOH the end? 70%? 60%? The industry mostly reports 80%, but some medical and automotive specs use 70% because the device can still function usefully there. Always check. A cell rated 500 cycles to 80% typically reaches 700&ndash;800 cycles to 70%.</p>

        <h2>Calendar aging: the one nobody tests</h2>
        <p>Cells don&rsquo;t only age by cycling. They age sitting on a shelf, sitting in a warehouse, sitting in a returned device. Calendar aging is driven by temperature and state of charge &mdash; a cell stored at 100% SoC and 40 &deg;C loses roughly 10&ndash;15% of its capacity in a year even without being cycled.</p>
        <p>Two consequences:</p>
        <ul>
          <li>If your product sits in retail inventory for 6&ndash;12 months, calendar aging may be a bigger factor than cycle aging for the first year of customer ownership.</li>
          <li>Shipping and storing at 30&ndash;50% SoC (as DGR requires for air shipping, conveniently) extends calendar life substantially.</li>
        </ul>

        <h2>What a good cycle-life plot looks like</h2>
        <p>When you get a cycle-life curve from a vendor, look for four attributes:</p>
        <ol>
          <li><strong>Stated conditions.</strong> DoD, charge rate, discharge rate, temperature, and end threshold, all legibly marked on the plot.</li>
          <li><strong>Sample size.</strong> A single cell&rsquo;s curve is a data point, not a statistic. Fleet averages across 5+ cells with min/max bars are far more useful.</li>
          <li><strong>A linear or gently-curved decay,</strong> not a knee. If the curve drops sharply below 85% SOH, some internal degradation mechanism is accelerating &mdash; you&rsquo;ll see it as a warranty spike.</li>
          <li><strong>Resistance growth data on the same cells.</strong> Capacity fade and impedance rise tell different stories. A cell that&rsquo;s at 85% capacity but with 2.5&times; internal resistance will feel &ldquo;tired&rdquo; to the user long before it hits 80% SOH.</li>
        </ol>

        <h2>Three questions to ask every vendor</h2>
        <ol>
          <li>&ldquo;Can you show me cycle data at our actual charge rate, discharge profile, and ambient temperature, on at least 5 cells?&rdquo;</li>
          <li>&ldquo;What was the internal resistance at 200 and at 500 cycles?&rdquo;</li>
          <li>&ldquo;What calendar-aging data do you have at 60% SoC and 40 &deg;C?&rdquo;</li>
        </ol>
        <p>If the vendor can answer all three without qualification, the cycle-life number on the datasheet probably survives field use. If not, plan to run the aging test yourself &mdash; or expect surprises.</p>

        <nav class="article-nav">
          <a href="/blog/lithium-shipping.html" class="prev">&larr; Previous: DGR Basics</a>
          <a href="/blog/thermal-runaway.html" class="next">Next: Thermal Runaway &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 10, (SELECT id FROM categories WHERE slug='technology'), now() - interval '28 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('eu-battery-passport', $art$The EU Battery Passport: Timeline & Data Requirements$art$, $art$What the new EU Battery Regulation asks for, which product categories are in scope, and what OEMs need from their cell suppliers.$art$, 'https://images.unsplash.com/photo-1529421308418-eab98863cee4?w=1920&q=80', $art$<p class="lede">The EU Battery Regulation (2023/1542) introduces the concept of a digital &ldquo;Battery Passport&rdquo; &mdash; a machine-readable record that travels with a battery through its life. For consumer electronics brands this is not yet the same burden as for EV makers, but the data-collection habits you build now determine how painful the 2030 wave will be.</p>

        <h2>Who is in scope, and when</h2>
        <p>The regulation divides batteries into five categories, each with its own phasing:</p>
        <table>
          <thead><tr><th>Category</th><th>Examples</th><th>Passport deadline</th></tr></thead>
          <tbody>
            <tr><td>EV batteries</td><td>Passenger cars, light commercial</td><td>February 2027</td></tr>
            <tr><td>Industrial batteries &gt; 2 kWh</td><td>Stationary storage, forklifts</td><td>February 2027</td></tr>
            <tr><td>LMT batteries</td><td>E-bikes, e-scooters</td><td>February 2027</td></tr>
            <tr><td>Portable batteries</td><td>Consumer electronics, power banks</td><td>Later phases, to be clarified</td></tr>
            <tr><td>SLI batteries</td><td>Starter batteries</td><td>Partial requirements only</td></tr>
          </tbody>
        </table>
        <p>Consumer-electronics batteries are currently treated under the &ldquo;portable&rdquo; category, which has labelling, collection and recycled-content obligations but no full Battery Passport requirement at this stage. Signals from the Commission suggest the scope may expand for larger portable formats over time.</p>

        <h2>What the passport actually contains</h2>
        <p>For the categories already in scope, the data set is substantial:</p>
        <h3>Product &amp; identity</h3>
        <ul>
          <li>Unique battery ID</li>
          <li>Manufacturer name and address</li>
          <li>Place and date of manufacture</li>
          <li>Weight, chemistry, critical-materials content</li>
        </ul>
        <h3>Performance &amp; durability</h3>
        <ul>
          <li>Rated capacity and voltage</li>
          <li>Cycle life under defined conditions</li>
          <li>Expected calendar life</li>
          <li>State-of-health metrics (for larger formats)</li>
        </ul>
        <h3>Supply chain &amp; sustainability</h3>
        <ul>
          <li>Carbon footprint, expressed per kWh</li>
          <li>Recycled-content percentage by element</li>
          <li>Due-diligence statement covering cobalt, lithium, nickel and natural graphite</li>
        </ul>
        <h3>End of life</h3>
        <ul>
          <li>Disassembly information</li>
          <li>Hazardous-substance declarations</li>
          <li>Collection point information for the consumer</li>
        </ul>

        <h2>What OEMs should be asking cell suppliers now</h2>
        <p>Even if your product falls outside the 2027 scope, your suppliers will have to support multiple customer passports at once. The earlier you establish the data flow, the less painful it becomes:</p>
        <ol>
          <li><strong>Chemistry declaration per lot.</strong> Ask for a signed declaration of active-material content at the cathode level, not just the family name.</li>
          <li><strong>Refinery-level provenance</strong> for cobalt and nickel. Many suppliers can only provide smelter-level detail today; push for more.</li>
          <li><strong>Carbon footprint per cell,</strong> ideally calculated to a recognised PCR (product category rules) or EPD methodology.</li>
          <li><strong>Recycled-content percentages</strong> for cobalt (16% by 2031), lithium (6%), nickel (6%) &mdash; the targets apply to EV and industrial cells first but will almost certainly extend.</li>
          <li><strong>Cycle and calendar aging data</strong> per cell model, supplied with the test conditions.</li>
        </ol>

        <h2>The practical implication: QR codes on everything</h2>
        <p>The regulation requires that the Battery Passport be accessible via a unique identifier physically attached to the product. In practice this means a QR code, DataMatrix, or NFC tag. For small batteries in slim devices, the identifier will sit on the device rather than on the cell itself. Plan for this in your industrial design &mdash; a 4&nbsp;mm square QR code in the battery compartment is a low-cost way to future-proof.</p>

        <h2>Three things that will move faster than the regulation</h2>
        <ul>
          <li><strong>Procurement teams at EU retailers</strong> are already requiring carbon-footprint data on cells and packs as a tendering requirement, regardless of regulatory scope.</li>
          <li><strong>Voluntary disclosure</strong> is becoming a competitive differentiator, especially for brands selling into Germany, France and Scandinavia.</li>
          <li><strong>Insurance underwriters</strong> are starting to price in supply-chain transparency &mdash; products with undocumented material provenance see higher premiums.</li>
        </ul>

        <h2>A pragmatic 2026 checklist</h2>
        <ol>
          <li>Identify which of your products fall under &ldquo;portable&rdquo;, &ldquo;LMT&rdquo; or &ldquo;industrial&rdquo; classifications.</li>
          <li>Assign an internal owner for Battery Regulation compliance.</li>
          <li>Add a passport-readiness clause to new cell-supplier contracts.</li>
          <li>Reserve space on product labelling and in the ID for a unique identifier.</li>
          <li>Start collecting the 10&ndash;15 datapoints that are already well-defined; add the rest as the Commission publishes secondary legislation.</li>
        </ol>

        <nav class="article-nav">
          <a href="/blog/cobalt-nickel-lfp.html" class="prev">&larr; Previous: Cobalt, Nickel, LFP</a>
          <a href="/blog/second-life-cells.html" class="next">Next: Second-Life Cells &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 6, (SELECT id FROM categories WHERE slug='industry-insights'), now() - interval '31 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('hv-lco-density', $art$HV LCO at 4.48 V: Density Gains for Wearables$art$, $art$An update on high-voltage lithium-cobalt-oxide cathode platforms and what they actually buy at the pack level.$art$, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80', $art$<p class="lede">High-voltage lithium-cobalt-oxide is the quiet cathode upgrade that reshaped premium wearables over the last three years. Pushing the charge cut-off from 4.35 V to 4.45 V, and now to 4.48 V, buys roughly 8&ndash;12% more volumetric energy density at the cell. Here&rsquo;s what that looks like in real products.</p>

        <h2>The short version</h2>
        <p>At the cell level:</p>
        <ul>
          <li>4.40 V LCO: typical 690&ndash;720 Wh/L, 500&ndash;700 cycles to 80% SOH.</li>
          <li>4.45 V LCO: typical 720&ndash;750 Wh/L, 450&ndash;600 cycles.</li>
          <li>4.48 V LCO: typical 750&ndash;780 Wh/L, 400&ndash;500 cycles.</li>
        </ul>
        <p>The numbers vary 5&ndash;10% between suppliers and formulations, but the trade-off is consistent: each step up in voltage buys density at the cost of cycle life.</p>

        <h2>Why it works</h2>
        <p>A lithium-cobalt-oxide cathode holds more lithium at higher states of charge. Pushing the upper cut-off from 4.35 V to 4.48 V extracts more of that lithium per charge. The underlying electrochemistry is the same; the practical difference is in the coating composition and in the electrolyte additives that stabilise the cathode at the higher voltage.</p>
        <p>The cycle-life penalty comes from two mechanisms. First, higher voltage accelerates electrolyte oxidation at the cathode interface, consuming active lithium over cycles. Second, the cathode itself experiences more structural stress during the larger lithium swing, accelerating particle cracking. Additive chemistry mitigates both effects but doesn&rsquo;t eliminate them.</p>

        <h2>The pack-level reality is smaller</h2>
        <p>The 8&ndash;12% cell-level gain does not translate 1:1 into runtime. Several factors compress the benefit by the time it reaches the user:</p>
        <ol>
          <li><strong>Charger IC losses are proportional to voltage.</strong> Charging to 4.48 V instead of 4.40 V slightly increases the IR&sup2; losses in the charge path. Maybe 0.5&ndash;1% of the gain disappears here.</li>
          <li><strong>Upper end of charge is less accessible.</strong> Above 4.4 V the cell can only absorb charge at progressively lower C-rates without stress. In practice, most fast-charge implementations taper at 4.35&ndash;4.40 V and complete the last few percent slowly. On real usage patterns this effectively caps users at 98% rather than 100%.</li>
          <li><strong>Voltage sag under load is worse at high SOC.</strong> The usable energy between 4.48 V and 3.0 V is higher than between 4.40 V and 3.0 V, but the usable energy above a load-induced minimum of 3.4 V is closer.</li>
        </ol>
        <p>Net real-world gain: 5&ndash;8% instead of the headline 8&ndash;12%.</p>

        <h2>Who&rsquo;s shipping it in 2026</h2>
        <p>4.45 V is now the default for premium smartwatches and AR glasses. 4.48 V is still flagship-only &mdash; mostly because the electrolyte-additive packages are more expensive and because warranty claims from early-generation 4.48 V cells scared some OEMs off.</p>
        <p>The picture by category in mid-2026:</p>
        <table>
          <thead><tr><th>Category</th><th>Typical cut-off</th></tr></thead>
          <tbody>
            <tr><td>Mid-range TWS earbuds</td><td>4.35 V</td></tr>
            <tr><td>Premium TWS earbuds</td><td>4.40&ndash;4.45 V</td></tr>
            <tr><td>Premium smartwatches</td><td>4.45 V</td></tr>
            <tr><td>Mid-range AR glasses</td><td>4.45 V</td></tr>
            <tr><td>Flagship AR glasses</td><td>4.45&ndash;4.48 V</td></tr>
            <tr><td>Medical wearables</td><td>4.35 V (conservative)</td></tr>
          </tbody>
        </table>

        <h2>Qualification gotchas</h2>
        <p>Three things that commonly surprise programs qualifying their first HV LCO cells:</p>
        <ul>
          <li><strong>Swelling is worse.</strong> The cathode stress shows up as incremental volumetric expansion. Expect 1&ndash;2% more cell swelling at full charge compared to 4.40 V equivalents.</li>
          <li><strong>Calendar aging at 100% SoC is harsher.</strong> Storing a 4.48 V cell at full charge and elevated temperature loses capacity 30&ndash;50% faster than the 4.40 V equivalent under the same conditions. Design SoC limits accordingly.</li>
          <li><strong>UN 38.3 overcharge test</strong> applies 2&times; rated voltage. For a 4.48 V cell that&rsquo;s 8.96 V to the cell terminals, which is a harder condition than the 4.40 V case (8.80 V). Some early 4.48 V cells failed T7 where the 4.40 V equivalent passed.</li>
        </ul>

        <h2>Where it&rsquo;s going next</h2>
        <p>The cathode research community has shown 4.55 V and even 4.60 V platforms in lab samples. Commercial viability at those voltages depends on electrolyte stability that doesn&rsquo;t yet exist at mass-production cost. Our rough expectation: 4.50 V becomes commercially viable in 2027 for flagship products; higher voltages remain lab curiosities through 2028.</p>
        <p>In parallel, semi-solid chemistry (see the separate article) offers a different path to density gain without the voltage risk &mdash; so the industry ends up with two parallel premium tiers, one voltage-driven and one electrolyte-driven.</p>

        <h2>What OEMs should consider</h2>
        <ol>
          <li><strong>Don&rsquo;t chase 4.48 V for a mid-tier product.</strong> The cost premium and cycle-life penalty aren&rsquo;t worth a single percentage point of runtime on a commodity device.</li>
          <li><strong>Qualify 4.45 V for your premium tier,</strong> 4.48 V only for flagships with bulletproof thermal design.</li>
          <li><strong>Test calendar aging at full charge and 40 &deg;C.</strong> Most HV LCO failures in the field are calendar, not cycle.</li>
          <li><strong>Don&rsquo;t mix voltages across SKUs.</strong> One cell, one cut-off &mdash; mixing creates firmware and warranty confusion.</li>
        </ol>

        <nav class="article-nav">
          <a href="/blog/lithium-air-freight.html" class="prev">&larr; Previous: Lithium Air Freight</a>
          <a href="/blog/china-medical-battery.html" class="next">Next: China Medical Battery &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 6, (SELECT id FROM categories WHERE slug='industry-insights'), now() - interval '34 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('lithium-air-freight', $art$Lithium Air Freight in 2025: New Rules, Higher Costs$art$, $art$IATA's recent updates to lithium-battery air-cargo rules and their real impact on sample shipping and volume logistics for OEMs outside China.$art$, 'https://images.unsplash.com/photo-1583414692941-2dcf8e0e1ea4?w=1920&q=80', $art$<p class="lede">Air-freight pricing for lithium batteries has risen faster than general cargo every year since 2022. The drivers are a mix of genuine safety updates and insurance-market tightening. For OEMs outside China who depend on air for samples and low-volume launches, the change is already reshaping procurement cadence.</p>

        <h2>What changed in the IATA rules</h2>
        <p>The Dangerous Goods Regulations are updated annually. Three sets of changes over the last 24 months have had outsized commercial impact:</p>
        <ul>
          <li><strong>Tighter state-of-charge enforcement.</strong> The 30% SoC limit for cells shipped alone has been in place since 2016, but carriers have tightened actual-measurement compliance. Random verification at origin now happens on roughly 1 in 15 consignments, up from 1 in 50 a few years back.</li>
          <li><strong>Expanded declaration requirements</strong> for lithium-contained-in-equipment shipments above defined thresholds. More paperwork on the shipper.</li>
          <li><strong>Secondary-packaging specifications</strong> have been formalised for cells above 2.7 Wh per cell. What used to be interpretable language is now a prescribed drop-test and insulation standard.</li>
        </ul>
        <p>None of these changes individually is dramatic. Together they add 30&ndash;60 minutes of per-shipment handling time at origin and require trained-shipper certification that many smaller forwarders are still scrambling to obtain.</p>

        <h2>Insurance is the real driver of pricing</h2>
        <p>The regulatory changes are the visible story. The bigger commercial story is the insurance market. A handful of cargo-aircraft fire events involving lithium over the last five years pushed underwriters to reprice lithium-battery air freight. Practical consequences:</p>
        <ul>
          <li>All-risk cargo insurance premiums for lithium consignments are up 2&ndash;3&times; since 2021.</li>
          <li>Some carriers now require minimum declared-value insurance for every lithium shipment regardless of size.</li>
          <li>A small number of airlines have effectively exited the lithium cargo market, concentrating volume on fewer routes and eroding price competition.</li>
        </ul>
        <p>End-to-end air freight costs for lithium-containing goods are typically 25&ndash;45% above 2022 levels on the same lanes, even after general-cargo rates have normalised.</p>

        <h2>Which lanes are hit hardest</h2>
        <p>Asia &rarr; US West Coast and Asia &rarr; Europe were the fastest-moving lanes historically and remain the most constrained now. Asia &rarr; Latin America and Asia &rarr; Africa have seen smaller percentage increases but off a smaller base.</p>
        <p>Routes through specific hubs (we&rsquo;ll avoid naming specific airports, but they are public knowledge within the industry) now have consistently longer lithium-handling queues. Adding 1&ndash;3 business days to origin transit time is a reasonable planning assumption.</p>

        <h2>How OEMs outside China are adapting</h2>

        <h3>1. Sea freight for volume production</h3>
        <p>Programs that previously used air for reliability are shifting steady-state production to sea. Sea freight transit is 18&ndash;32 days to Europe from Chinese ports, 14&ndash;22 to the US West Coast &mdash; acceptable once forecast discipline exists. Air remains essential for new-product introductions and prototypes.</p>

        <h3>2. Shipping assembled, not bare cells</h3>
        <p>Cells contained in equipment (UN 3481) enjoy lighter rules than bare cells (UN 3480). OEMs increasingly ask their cell supplier to ship pre-packaged sub-assemblies (cell + PCM + connector) rather than bare pouches, because the sub-assembly ships as UN 3481 and avoids some restrictions. A small amount of extra labour at origin saves multiples of that value in freight.</p>

        <h3>3. Regional stocking</h3>
        <p>Holding 4&ndash;8 weeks of safety stock at a forwarder-operated DC in the destination region smooths over individual shipment delays. The working-capital cost is real but often less than the air-freight premium on ad-hoc shipments.</p>

        <h3>4. Forecast reliability</h3>
        <p>The OEMs doing this best are the ones sharing 12-month rolling forecasts with their cell supplier. It lets the supplier book sea freight in advance and pre-qualify consolidated shipments at lower all-in cost.</p>

        <h2>Five practical takeaways</h2>
        <ol>
          <li>Budget 25&ndash;45% more for lithium air freight relative to 2022 baselines.</li>
          <li>Add 2&ndash;4 extra business days to inbound transit-time assumptions.</li>
          <li>Move volume production to sea wherever forecast allows it.</li>
          <li>Standardise on shipping assembled sub-assemblies rather than bare cells.</li>
          <li>Work only with DGR-certified forwarders, even for small consignments.</li>
        </ol>

        <h2>What to watch in 2026</h2>
        <p>Two developments on the horizon that could push costs further:</p>
        <ul>
          <li><strong>Revised fire-test requirements</strong> for cargo aircraft, currently in consultation at ICAO. Could tighten packaging standards again.</li>
          <li><strong>Regional divergence in rules.</strong> Some civil aviation authorities may accelerate local rules ahead of IATA updates, creating inconsistency across routings.</li>
        </ul>
        <p>Neither is an immediate crisis, but both argue for building resilience into logistics plans now rather than discovering the cost later.</p>

        <nav class="article-nav">
          <a href="/blog/tws-earbuds-next.html" class="prev">&larr; Previous: TWS Earbuds Next</a>
          <a href="/blog/hv-lco-density.html" class="next">Next: HV LCO at 4.48 V &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 9, (SELECT id FROM categories WHERE slug='industry-insights'), now() - interval '37 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('lithium-shipping', $art$Shipping Lithium: DGR Basics for Product Managers$art$, $art$Class 9 labels, state-of-charge limits, quantity caps per package — what dangerous-goods regs actually require when you ship lithium cells.$art$, 'https://images.unsplash.com/photo-1568057373560-8d71ccf43b26?w=1920&q=80', $art$<p class="lede">Lithium cells and batteries are dangerous goods. Not dangerous in the &ldquo;explodes in your warehouse&rdquo; sense, but dangerous in the regulatory sense: they move under IATA Dangerous Goods Regulations (DGR) for air, IMO IMDG code for sea, and ADR for road in the EU. Get the paperwork wrong and the shipment stops at origin.</p>

        <h2>The three UN numbers that matter</h2>
        <ul>
          <li><strong>UN 3480</strong> &mdash; lithium-ion cells or batteries shipped on their own.</li>
          <li><strong>UN 3481</strong> &mdash; lithium-ion cells or batteries packed with or contained in equipment.</li>
          <li><strong>UN 3090 / UN 3091</strong> &mdash; lithium-metal cells (primary), equivalent split.</li>
        </ul>
        <p>Which one applies determines the packing instruction (PI 965&ndash;970 for lithium-ion, PI 968&ndash;970 for lithium-metal). Quick rule of thumb: cells alone in a box = UN 3480; device with battery in the same retail package = UN 3481.</p>

        <h2>State-of-charge caps for air freight</h2>
        <p>Since 2016, lithium-ion cells shipped as cargo on passenger or cargo aircraft cannot exceed 30% state of charge. This is the single biggest operational constraint we see customers miss. Some practical implications:</p>
        <ul>
          <li>Your contract manufacturer needs a discharge step on the line.</li>
          <li>If you are consolidating partial pallets, all cells in the consignment have to be at 30% SoC or less &mdash; a single higher-SoC box disqualifies the whole load.</li>
          <li>The 30% limit does NOT apply to cells contained in equipment, which is why &ldquo;ship the device assembled&rdquo; often solves the problem for small consignments.</li>
        </ul>

        <h2>Quantity limits per package</h2>
        <p>PI 965 Section II (the small-cell exception for lithium-ion &le; 2.7 Wh per cell, &le; 20 Wh per cell in equipment, or 100 Wh per battery in equipment) allows lighter paperwork but still caps:</p>
        <ul>
          <li>Cells alone: no more than 8 cells or 2 batteries per package for air.</li>
          <li>Net weight of lithium &lt; 2.5 kg per package.</li>
          <li>Must pass a 1.2 m drop test with no cell coming out, no short, no fire.</li>
        </ul>
        <p>Above those thresholds, shipments move under PI 965 Section IA/IB &mdash; full DGR paperwork, a DGR-certified shipper, and usually a specialized forwarder.</p>

        <h2>The documents that have to travel with the goods</h2>
        <ol>
          <li><strong>UN 38.3 Test Summary.</strong> Since 2020 this must be available on demand from anyone in the supply chain. Your cell supplier gives you a PDF; you archive it and share with carriers on request.</li>
          <li><strong>Shipper&rsquo;s Declaration of Dangerous Goods.</strong> For Section IA/IB air shipments; sometimes required for Section IB as well, depending on the carrier.</li>
          <li><strong>Lithium-battery mark.</strong> The red-edged black-rectangle pictogram with UN number and emergency phone.</li>
          <li><strong>Class 9 hazard label.</strong> For Section IA/IB shipments.</li>
          <li><strong>&ldquo;Cargo Aircraft Only&rdquo; label.</strong> When the consignment cannot fly on passenger aircraft.</li>
        </ol>

        <h2>Sea and rail</h2>
        <p>IMO IMDG for sea and ADR/RID for road and rail follow the same UN numbers and packing logic but are far more permissive on quantity and SoC. Sea is the default for high-volume programs &mdash; cheaper, no 30% SoC cap for most lithium-ion consignments (though a 30% cap applies to cargo-only aircraft loaded on a vessel for combined transport, which is rare). Transit time from Chinese ports is 18&ndash;32 days to Europe, 14&ndash;22 days to the US West Coast.</p>

        <h2>A practical checklist for your first lithium shipment</h2>
        <ul>
          <li>Confirm the UN number with your supplier in writing.</li>
          <li>Ask for the UN 38.3 Test Summary before booking freight.</li>
          <li>Specify SoC in the purchase order (30% for air, 50% for sea is a common convention).</li>
          <li>Choose a DGR-certified forwarder even for Section II &mdash; mistakes at origin are expensive.</li>
          <li>Build 3&ndash;5 extra business days into your logistics plan for origin customs.</li>
        </ul>

        <nav class="article-nav">
          <a href="/blog/wearable-thermal.html" class="prev">&larr; Previous: Skin-Contact Thermal</a>
          <a href="/blog/cycle-life-curves.html" class="next">Next: Reading Cycle-Life Curves &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 5, (SELECT id FROM categories WHERE slug='technology'), now() - interval '40 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('second-life-cells', $art$Second-Life Cells: Who's Buying, Who's Selling$art$, $art$The emerging re-qualification market for used lithium cells, and whether it makes commercial sense for small formats.$art$, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80', $art$<p class="lede">Second-life cells &mdash; lithium cells retired from one application and repurposed for another &mdash; have moved from concept to commercial reality in the last three years, but almost entirely for EV-scale formats. The economics for consumer-electronics cells look different, and mostly don&rsquo;t pencil.</p>

        <h2>Where second-life actually works</h2>
        <p>The first viable second-life market is EV packs retired from passenger and commercial vehicles at roughly 70&ndash;80% state of health. At that remaining capacity, the pack is no longer fit for its original range and fast-charge profile, but perfectly adequate for less demanding duty cycles &mdash; grid buffering, peak shaving for commercial buildings, solar self-consumption, uninterruptible power supplies.</p>
        <p>The cell-level reality behind the headlines:</p>
        <ul>
          <li>EV packs deliver hundreds to thousands of kWh in a single, consistent form factor. Re-qualifying at pack level is economically feasible.</li>
          <li>The cells come from known chemistries with documented aging patterns, which simplifies testing.</li>
          <li>Stationary-storage customers can tolerate slower charge rates and lower energy density per unit volume.</li>
        </ul>

        <h2>Why it doesn&rsquo;t work (yet) for small-format cells</h2>
        <p>The same economics fail for consumer-electronics cells for several reasons:</p>
        <ol>
          <li><strong>Handling cost dominates.</strong> A retired smartwatch cell might have 80&ndash;120 mAh of usable capacity. At current collection, discharging, re-testing and re-packaging costs, the per-Wh overhead exceeds the value of the energy.</li>
          <li><strong>Form-factor fragmentation.</strong> Unlike EV cells, consumer cells come in thousands of different geometries and chemistries. There&rsquo;s no standard second-life pack to assemble them into.</li>
          <li><strong>Unknown history.</strong> An EV pack has a BMS log. A TWS earbud cell has none &mdash; no charge count, no temperature exposure data, no overcharge events. Re-qualification has to be conservative, which throws away more than half of otherwise usable cells.</li>
          <li><strong>Safety liability.</strong> Shipping and storing re-qualified cells as UN 38.3 compliant requires recertification. Few small-cell testers are willing to underwrite that for miscellaneous recovered stock.</li>
        </ol>

        <h2>What is happening with small cells</h2>
        <p>Rather than true second-life repurposing, the actual flow for small-format cells is two-way:</p>
        <ul>
          <li><strong>Recycling for materials.</strong> Collection &rarr; shred &rarr; hydrometallurgy &rarr; recovered cobalt, nickel, lithium salts. This is growing quickly as Battery Regulation recycled-content targets bite.</li>
          <li><strong>In-warranty refurbishment.</strong> Some premium wearable brands now replace the battery rather than the whole device during warranty claims. The old cell goes to recycling.</li>
        </ul>
        <p>Both are worthwhile, but neither is &ldquo;second-life&rdquo; in the way the industry uses the term.</p>

        <h2>Who is actually building this market</h2>
        <p>On the buy side: grid-storage integrators, data-centre UPS vendors, commercial solar installers. They want EV-format cells at 60&ndash;70% of new-cell pricing and will accept 70&ndash;80% SOH if paired with conservative duty cycles.</p>
        <p>On the sell side: OEM take-back programs, insurance write-offs, dealer-network returns. The chokepoint is usually logistics &mdash; getting cells from hundreds of collection points to a single re-qualification facility without damaging them is harder than it sounds.</p>

        <h2>The regulation angle, briefly</h2>
        <p>The EU Battery Regulation requires &ldquo;preparation for re-use&rdquo; and sets targets for recycling efficiency. That tailwind benefits the existing EV-pack market more than it helps small cells &mdash; the regulation acknowledges that not every cell can be economically re-used.</p>
        <p>One clause worth watching: the same legislation requires that battery removal be &ldquo;easy&rdquo; for end-users in most portable-device categories by 2027. That will make collection of small cells easier, which may shift the economics enough that some subset of consumer cells finds a legitimate second life.</p>

        <h2>What consumer-electronics OEMs should do</h2>
        <ol>
          <li><strong>Design for removability.</strong> The regulatory wind is already blowing here; building products with glued-in cells is adding future risk.</li>
          <li><strong>Partner with a recycler, not a re-qualifier.</strong> For small cells, recycling recovers real value. Re-qualification rarely does.</li>
          <li><strong>Publish collection rates.</strong> Consumers and regulators increasingly care, and it&rsquo;s a straightforward data point if you have the supply chain.</li>
          <li><strong>If you run warranty refurbishment,</strong> treat the returned battery as recycling feedstock, not a refill for another service case &mdash; the liability math favours that.</li>
        </ol>

        <h2>The blunt bottom line</h2>
        <p>Second-life is a real and growing market for EV-format cells. For consumer electronics, it&rsquo;s mostly marketing. Recycling is the honest path to circularity for the small stuff, and the sooner OEMs tell that story clearly, the better it lands.</p>

        <nav class="article-nav">
          <a href="/blog/eu-battery-passport.html" class="prev">&larr; Previous: EU Battery Passport</a>
          <a href="/blog/tws-earbuds-next.html" class="next">Next: TWS Earbuds Next &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 8, (SELECT id FROM categories WHERE slug='industry-insights'), now() - interval '43 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('solid-state-reality', $art$Solid-State: Hype vs Reality for Consumer Electronics$art$, $art$Where solid-state batteries make sense today, where they don't, and a realistic timeline for wearables adoption.$art$, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80', $art$<p class="lede">Solid-state batteries have been &ldquo;five years away&rdquo; for fifteen years. In 2026 we can finally say with confidence that partial solid-state &mdash; specifically semi-solid and polymer-hybrid designs &mdash; is shipping in limited volumes. Fully sulfide-based solid-state remains a laboratory and prototype technology outside of a handful of EV pilot programs.</p>

        <h2>Three things being called &ldquo;solid state&rdquo;</h2>
        <p>Part of the confusion in press coverage is vocabulary. Three distinct technologies are marketed under the same name:</p>
        <ul>
          <li><strong>Semi-solid (gel electrolyte) &mdash;</strong> a Li-ion cell with most of the liquid electrolyte replaced by a gel or polymer matrix. Roughly 10&ndash;20% more energy density than conventional LiPo. Shipping in small volumes.</li>
          <li><strong>Polymer-solid hybrid &mdash;</strong> solid polymer electrolyte at scale, often still requiring a thin liquid interface layer at the cathode. Limited production, mostly in specialty applications.</li>
          <li><strong>All-solid sulfide or oxide &mdash;</strong> the &ldquo;true&rdquo; solid-state technology. High theoretical density, genuinely safer, but not in mass production for consumer devices in 2026.</li>
        </ul>

        <h2>Where solid-state wins today</h2>
        <p>The practical wins for the cell formats on the market right now:</p>
        <ol>
          <li><strong>Small-cell wearables</strong> where the additional 10&ndash;15% density translates into measurable runtime gains at small absolute mAh. A 250 mAh semi-solid cell delivering the equivalent of 285 mAh is a meaningful upgrade for a smartwatch.</li>
          <li><strong>High-safety applications</strong> such as medical wearables and defense equipment, where the lower flammability risk justifies a price premium.</li>
          <li><strong>Extreme-temperature niche products</strong> &mdash; some polymer chemistries operate down to &minus;40 &deg;C without the capacity drop typical of liquid-electrolyte cells.</li>
        </ol>

        <h2>Where it doesn&rsquo;t</h2>
        <p>The places it still doesn&rsquo;t make sense:</p>
        <ul>
          <li><strong>Cost.</strong> Semi-solid cells cost roughly 1.8&ndash;3.0&times; conventional LiPo per Wh at the moment. Any price-sensitive product category stays on LiPo.</li>
          <li><strong>Fast charging.</strong> Solid and semi-solid electrolytes have higher ionic resistance than liquid. Charging above 1C is challenging; above 2C is currently unachievable at useful cycle life.</li>
          <li><strong>Very thin cells.</strong> Sub-0.8 mm pouches are a tough form factor for semi-solid technology. The thin layers required for all-solid designs are even more constrained by manufacturing yield.</li>
          <li><strong>High-volume mass production.</strong> The equipment supply chain for all-solid manufacturing is still being built. 2028&ndash;2030 is a realistic window for automotive-scale output; consumer follows later.</li>
        </ul>

        <h2>A realistic timeline for wearables</h2>
        <table>
          <thead><tr><th>Year</th><th>What we expect</th></tr></thead>
          <tbody>
            <tr><td>2026</td><td>Semi-solid cells in premium smartwatches, hearables and some AR glasses. Adoption &lt; 5% by unit volume.</td></tr>
            <tr><td>2027&ndash;2028</td><td>Semi-solid cost drops under 1.5&times; LiPo; adoption to 10&ndash;20% of premium wearables.</td></tr>
            <tr><td>2029&ndash;2030</td><td>First all-solid consumer cells (likely hearables due to simpler geometry). Automotive drives equipment supply chain.</td></tr>
            <tr><td>2031+</td><td>All-solid viable for mid-volume wearables; LiPo still dominant for cost-sensitive categories.</td></tr>
          </tbody>
        </table>

        <h2>What product managers should actually do</h2>
        <p>If you are designing a device to ship in 2026&ndash;2027:</p>
        <ul>
          <li>Treat semi-solid as a premium-tier option, not a default. Request vendor samples early if you are building a flagship.</li>
          <li>Do not design around all-solid promises. Plans that depend on 2027 availability will slip.</li>
          <li>Keep the mechanical design compatible with both LiPo and semi-solid where possible &mdash; they have similar form factors.</li>
          <li>Ignore fast-charge marketing claims that sound too good; ask for actual DCIR data at your target C-rate.</li>
        </ul>

        <h2>The bigger picture</h2>
        <p>Solid-state is real and progressing. But the most likely outcome for consumer electronics is a gradual shift through semi-solid, not a dramatic leap to all-solid. Energy density will creep up 8&ndash;12% per generation; safety margins will improve; cost will fall slowly. Revolutionary framing of this technology sells magazines but misleads product planning.</p>

        <nav class="article-nav">
          <a href="/blog/ar-vr-market-2026.html" class="prev">&larr; Previous: AR/VR Market 2026</a>
          <a href="/blog/cobalt-nickel-lfp.html" class="next">Next: Cobalt, Nickel, LFP &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 7, (SELECT id FROM categories WHERE slug='industry-insights'), now() - interval '46 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('thermal-runaway', $art$Thermal Runaway: What Triggers It, How to Design Against It$art$, $art$Separator shutdown, vent design, cell spacing and the role of BMS early-warning in lithium cell safety.$art$, 'https://images.unsplash.com/photo-1532456745301-b2c645d8b80d?w=1920&q=80', $art$<p class="lede">Thermal runaway is the chain reaction inside a lithium cell where internal temperature rises faster than it can dissipate &mdash; eventually triggering electrolyte decomposition, gas generation, and in the worst case, venting or fire. It is always the result of one of three triggers: mechanical, thermal, or electrical abuse. Design against all three and you&rsquo;ve covered nearly every real-world failure mode.</p>

        <h2>Trigger 1: mechanical abuse</h2>
        <p>Crush, puncture, or severe bending creates an internal short by collapsing the separator between electrodes. Current density at the short point spikes, temperature climbs, and within seconds you&rsquo;re in a self-sustaining exotherm.</p>
        <p>Design choices that help:</p>
        <ul>
          <li><strong>Cell mounting with compliant layers.</strong> A 0.2&ndash;0.5 mm foam pad between the cell and rigid housing distributes load during a drop.</li>
          <li><strong>Metal cages around high-density cells.</strong> A thin aluminium shroud can prevent direct puncture by screws or internal PCB corners.</li>
          <li><strong>Orientation matters.</strong> Tabs are the mechanically weakest point; orient them away from likely impact axes in the device housing.</li>
        </ul>

        <h2>Trigger 2: thermal abuse</h2>
        <p>Cell internal temperature above approximately 130 &deg;C begins to decompose the SEI layer. Above 150 &deg;C, separator shutdown usually activates &mdash; the polyethylene or polypropylene melts and closes its pores, stopping ion flow. Above 180 &deg;C the separator itself can shrink, exposing large areas of anode and cathode to direct contact.</p>
        <p>Sources of external thermal abuse in the field:</p>
        <ul>
          <li>Device left in a closed car in summer (interior can exceed 70 &deg;C).</li>
          <li>Charging with a defective charger that fails to taper.</li>
          <li>External heat source &mdash; industrial environments, engine bays, direct sunlight on dark enclosures.</li>
        </ul>
        <p>The design response is layered: a ceramic-coated separator that withstands 180&ndash;200 &deg;C before shrinkage, a thermal fuse in the BMS that opens at 85&ndash;90 &deg;C, and a mechanical design that dissipates heat away from the cell rather than trapping it.</p>

        <h2>Trigger 3: electrical abuse</h2>
        <p>Over-charge is the most dangerous electrical condition. Driving a cell above its nominal voltage (typically 4.2&ndash;4.25 V for LCO) causes lithium plating on the anode and oxygen release from the cathode &mdash; both feed thermal runaway.</p>
        <p>Multiple layers of protection are standard:</p>
        <ol>
          <li><strong>Charger IC voltage accuracy.</strong> Primary defence &mdash; modern charger ICs hold cut-off within &plusmn;0.5% of target.</li>
          <li><strong>Protection PCM on the cell.</strong> Secondary defence &mdash; typically cuts at 4.28 V (a few tens of millivolts above nominal cut-off).</li>
          <li><strong>Secondary protection IC.</strong> Tertiary defence &mdash; latches off at roughly 4.35 V, usually with a fuse that must be manually reset or replaced.</li>
          <li><strong>Current interrupt device (CID).</strong> Passive mechanical disconnect inside the cell, triggered by internal pressure from gas generation.</li>
        </ol>

        <h2>Separator shutdown and venting</h2>
        <p>Two cell-internal safety features deserve a closer look.</p>
        <p><strong>Separator shutdown</strong> is a temperature-activated safety: when the separator melts at its design threshold, ion transport between electrodes stops, and the cell can no longer sustain reaction. It works once &mdash; the cell is dead afterwards &mdash; but it prevents escalation to fire in most mild overheats.</p>
        <p><strong>Vent design</strong> is the last-resort safety: a deliberately weak point in the pouch or can that opens to release gas pressure before the cell ruptures uncontrollably. A good vent opens at a defined internal pressure (around 1.0&ndash;1.5 MPa for most pouch cells), exhausts sideways, and does not project flame toward critical device components. Pack designers should leave a defined &ldquo;vent alley&rdquo; in the enclosure &mdash; an open path for ejected gas to reach the outside.</p>

        <h2>Cell spacing in multi-cell packs</h2>
        <p>In packs with more than one cell, the thing you&rsquo;re trying to prevent is <strong>propagation</strong> &mdash; one cell going into runaway and igniting its neighbours. Three practices help:</p>
        <ul>
          <li><strong>Thermal barriers between cells.</strong> Aerogel or intumescent materials 1&ndash;3 mm thick can buy enough time for surrounding cells to cool.</li>
          <li><strong>Spacing.</strong> 2&ndash;5 mm of air gap between cells drops heat flux by roughly 60&ndash;80%.</li>
          <li><strong>Directional venting.</strong> All cell vents pointing the same way, into a channel that exhausts out of the pack.</li>
        </ul>

        <h2>BMS early-warning signals</h2>
        <p>A smart BMS can detect the precursors to runaway minutes before the event:</p>
        <ul>
          <li>Rapid voltage drop under light load &mdash; indicates internal soft short.</li>
          <li>Temperature rise not correlated with load &mdash; indicates parasitic reaction.</li>
          <li>Impedance spike on periodic pulse test &mdash; indicates SEI breakdown.</li>
        </ul>
        <p>None of these are catastrophic on their own, but all three together are a reliable signal to disable charging and log the event. A product that quietly retires a suspect cell and prompts the user to replace the battery is better than one that lets the cell keep cycling toward a failure.</p>

        <nav class="article-nav">
          <a href="/blog/cycle-life-curves.html" class="prev">&larr; Previous: Cycle-Life Curves</a>
          <a href="/blog/guides.html" class="next">Back to Battery Guides &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 8, (SELECT id FROM categories WHERE slug='technology'), now() - interval '49 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('tws-earbuds-next', $art$Why TWS Earbuds Plateaued — And What Comes Next$art$, $art$Battery form factor and acoustic volume are in direct conflict. Here's how the next generation of earbuds can break past it.$art$, 'https://images.unsplash.com/photo-1590658006821-04f4008d5717?w=1920&q=80', $art$<p class="lede">True-wireless earbuds have stopped getting smaller. The last three generations of flagship TWS from the major brands are within a few tenths of a gram of each other. That plateau is not a design choice &mdash; it&rsquo;s a physical limit dictated by the conflict between battery volume and acoustic chamber volume inside the earbud shell.</p>

        <h2>Why you can&rsquo;t shrink an earbud any further</h2>
        <p>A TWS earbud has three non-negotiable volumes: the driver and its rear chamber, the battery, and everything else (DSP, antenna, sensors, microphones). Shrinking the shell forces the designer to steal volume from somewhere.</p>
        <ul>
          <li><strong>Shrink the driver chamber</strong> and bass response falls off. The laws of acoustics don&rsquo;t care about your industrial designer.</li>
          <li><strong>Shrink the battery</strong> and runtime drops. Users have converged on an expectation of 6&ndash;9 hours of continuous playback; falling below that becomes a review-killing feature.</li>
          <li><strong>Shrink the electronics</strong> and lose features. ANC, spatial audio, multi-device pairing &mdash; each wants more silicon, not less.</li>
        </ul>
        <p>The result is a generation of products that feel almost identical in the ear.</p>

        <h2>The battery is the dominant lever</h2>
        <p>Of the three volumes, the battery is by far the easiest to optimise in absolute terms. An earbud cell typically holds 40&ndash;95 mAh in a coin format 7.6&ndash;12.5 mm in diameter, 4&ndash;6 mm thick. Every 0.2 mm of thickness saved &mdash; roughly 5% volumetric &mdash; either lets the acoustic chamber grow (better sound) or lets the shell shrink (better fit).</p>
        <p>Three battery-side innovations are currently in play:</p>

        <h3>1. High-voltage coin cells (4.45 V)</h3>
        <p>Charging to 4.45 V instead of 4.35 V adds approximately 7% volumetric energy density. For an 80 mAh cell that&rsquo;s roughly 6 mAh, or an extra 25&ndash;35 minutes of playback. Several TWS OEMs adopted this in 2024; by 2026 it is the default for premium products.</p>

        <h3>2. Shaped cells</h3>
        <p>Instead of a round coin, the cell is formed to the contour of the earbud shell. A bean-shaped or D-shaped cell can recover 10&ndash;18% of the otherwise-wasted space between a round battery and an oval shell. Tooling is expensive and yields start low, but the payoff is runtime with no thickness increase.</p>

        <h3>3. Semi-solid chemistry</h3>
        <p>Semi-solid cells (see our separate article) offer roughly 10&ndash;15% density gain at a significant price premium. For TWS at the premium end, the incremental cost is small relative to the ASP; for mid-tier devices it doesn&rsquo;t yet pencil.</p>

        <h2>What comes after the plateau</h2>
        <p>Three generational shifts we think are coming:</p>
        <ol>
          <li><strong>Health-sensor earbuds</strong> that do continuous HR, SpO&sub;2, and temperature measurement. These drive average current up substantially, which pushes for larger cells &mdash; and paradoxically makes the battery problem harder, not easier.</li>
          <li><strong>Real-time translation</strong> and on-device LLM inference. These spike peak current demands from a few milliamps to tens of milliamps for short bursts. The cell internal resistance becomes a product feature: low DCIR cells give better voice responsiveness.</li>
          <li><strong>Biometric authentication</strong> using in-ear sensors. Adds another few milliamps of sustained load for the security verification cycle.</li>
        </ol>

        <h2>The charging case evolves too</h2>
        <p>Most of the runtime story is actually in the case. A modern premium case holds 400&ndash;700 mAh of cell and supplies 3&ndash;5 full earbud recharges. Innovations to watch in 2026&ndash;2027:</p>
        <ul>
          <li><strong>Faster case-to-bud charging</strong> &mdash; 15 minutes of case time for 2 hours of use is becoming the expected minimum.</li>
          <li><strong>Wireless handoff improvements</strong> between case and bud, using better pogo-pin or contactless designs to reduce charging resistance losses.</li>
          <li><strong>Case as a hub</strong> &mdash; Bluetooth bridging, health data aggregation, even small displays on the case lid. Each adds load on the case battery.</li>
        </ul>

        <h2>What TWS OEMs should source now</h2>
        <ol>
          <li><strong>Qualify a shaped-cell supplier early.</strong> Tooling leads drive at least 8&ndash;12 weeks of schedule.</li>
          <li><strong>Ask for low-DCIR variants</strong> of your existing cells. The difference at sub-100 mAh scale is small per cell but meaningful for on-device ML workloads.</li>
          <li><strong>Revisit your cycle-life spec.</strong> If your product is sold on a 2-year lifecycle, an 800-cycle spec is more generous than necessary. Trading cycle life for density makes sense.</li>
        </ol>

        <nav class="article-nav">
          <a href="/blog/second-life-cells.html" class="prev">&larr; Previous: Second-Life Cells</a>
          <a href="/blog/lithium-air-freight.html" class="next">Next: Lithium Air Freight 2025 &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 5, (SELECT id FROM categories WHERE slug='industry-insights'), now() - interval '52 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('un-iec-compliance', $art$UN 38.3 & IEC 62133: What OEMs Need to Know$art$, $art$A plain-English walkthrough of the two safety standards every lithium cell has to pass before it can ship.$art$, 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=1920&q=80', $art$<p class="lede">Every lithium cell that ships by air, sea, road, or rail has to clear UN 38.3. Every cell sold for portable consumer use has to clear IEC 62133-2. Miss either and the shipment stops at customs. Plan for both from week one of a program.</p>

        <h2>UN 38.3 at a glance</h2>
        <p>UN 38.3 is transportation-focused. It exists so a cell sitting in a cargo hold at 38,000 feet doesn&rsquo;t become an emergency. Eight tests, in order:</p>
        <table>
          <thead><tr><th>#</th><th>Test</th><th>What it simulates</th></tr></thead>
          <tbody>
            <tr><td>T1</td><td>Altitude</td><td>Low-pressure cargo hold (11.6 kPa, 6 h)</td></tr>
            <tr><td>T2</td><td>Thermal cycling</td><td>&minus;40 &deg;C &harr; +72 &deg;C, 10 cycles</td></tr>
            <tr><td>T3</td><td>Vibration</td><td>7 Hz &ndash; 200 Hz sinusoidal sweep</td></tr>
            <tr><td>T4</td><td>Shock</td><td>150 g, 6 ms half-sine, 18 impacts</td></tr>
            <tr><td>T5</td><td>External short circuit</td><td>&lt;0.1 &Omega; short at 57 &deg;C</td></tr>
            <tr><td>T6</td><td>Impact / crush</td><td>Cylindrical cells: 9.1 kg bar drop; pouch: crush plate</td></tr>
            <tr><td>T7</td><td>Overcharge</td><td>2&times; rated voltage, 24 h</td></tr>
            <tr><td>T8</td><td>Forced discharge</td><td>12 V reverse current, for cells only</td></tr>
          </tbody>
        </table>
        <p>Pass criteria are straightforward: no fire, no explosion, no leakage beyond defined limits, and post-test voltage above 90% of nominal (for non-destructive tests).</p>

        <h2>IEC 62133-2 at a glance</h2>
        <p>IEC 62133-2 is the cousin standard for portable-application safety. Where UN 38.3 asks &ldquo;will this cell survive transport?&rdquo;, IEC 62133 asks &ldquo;will this cell survive foreseeable abuse during use?&rdquo;. The test matrix overlaps but is stricter in places:</p>
        <ul>
          <li>External short circuit (23 &deg;C and 55 &deg;C, cell only)</li>
          <li>Abnormal charging (3&times; manufacturer-specified current)</li>
          <li>Forced discharge</li>
          <li>Molded-case stress at high ambient (for battery packs)</li>
          <li>Drop (1.0 m, 6 drops per axis orientation)</li>
          <li>Mechanical crush / impact</li>
          <li>Thermal abuse (130 &deg;C, 10 minutes)</li>
        </ul>

        <h2>How to plan a test campaign</h2>
        <p>The cheapest and fastest path is to run both standards in parallel at the same accredited lab, on the same sample set. Typical campaign:</p>
        <ol>
          <li><strong>Week 0:</strong> Ship 48&ndash;64 samples (enough for both test matrices + reserve).</li>
          <li><strong>Weeks 1&ndash;3:</strong> Lab execution.</li>
          <li><strong>Week 4:</strong> Draft reports, response to any observations.</li>
          <li><strong>Week 5&ndash;6:</strong> Final CB / UN report issued.</li>
        </ol>
        <p>Budget: USD 6k&ndash;12k for UN 38.3 alone, USD 10k&ndash;18k for both together, for a single cell model. A second cell model (e.g. cosmetic colour variant, different BMS) often qualifies as a &ldquo;family member&rdquo; with a reduced test set and lower cost.</p>

        <h2>What usually fails</h2>
        <p>After years of testing campaigns, the same failures recur:</p>
        <ul>
          <li><strong>T7 overcharge</strong> on small pouches without a CID (current interrupt device). If your cell is under 500 mAh and the BMS is external, you almost always need a secondary protection.</li>
          <li><strong>T6 crush</strong> on ultra-thin cells &mdash; the pouch laminate tears before the cell reaches the deformation threshold.</li>
          <li><strong>T3 vibration</strong> on cells with long internal tabs that were not spot-welded with enough redundancy.</li>
        </ul>
        <p>None of these are fatal, but each adds 2&ndash;3 weeks to the program if discovered late.</p>

        <h2>What you need as an OEM buyer</h2>
        <ul>
          <li>A current UN 38.3 test summary (the &ldquo;test summary&rdquo; document, MP-style) for every shipping lot.</li>
          <li>A CB certificate referencing IEC 62133-2 for any cell sold into portable-application markets.</li>
          <li>Country-specific marks where required: KC (Korea), PSE (Japan), BIS (India), BSMI (Taiwan), INMETRO (Brazil).</li>
        </ul>
        <p>Ask your cell supplier for the full test reports, not just the certificates &mdash; you&rsquo;ll need them for your own FCC and CE files.</p>

        <nav class="article-nav">
          <a href="/blog/ar-thin-battery.html" class="prev">&larr; Previous: Ultra-Thin for AR</a>
          <a href="/blog/cell-sizing.html" class="next">Next: Sizing a Cell from Power Profile &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 6, (SELECT id FROM categories WHERE slug='technology'), now() - interval '55 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('wearable-chemistry', $art$Choosing Between LiPo, Li-ion and LiFePO4 for Wearables$art$, $art$A decision framework for picking the right lithium chemistry for wearables: energy density, safety, cycle life and form factor.$art$, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1920&q=80', $art$<p class="lede">When a product manager asks &ldquo;which chemistry should we use?&rdquo;, the honest first answer is almost always a counter-question: how small, how long, and how safe does it have to be? Those three constraints collapse the choice faster than any spec sheet.</p>

        <h2>The three candidates, in one table</h2>
        <table>
          <thead><tr><th>Property</th><th>LiPo (LCO / NMC)</th><th>Li-ion cylindrical</th><th>LiFePO4</th></tr></thead>
          <tbody>
            <tr><td>Energy density (Wh/L)</td><td>600–760</td><td>550–730</td><td>320–420</td></tr>
            <tr><td>Cycle life to 80% SOH</td><td>500–800</td><td>500–1,000</td><td>2,000–3,000</td></tr>
            <tr><td>Nominal voltage</td><td>3.7–3.85 V</td><td>3.6–3.7 V</td><td>3.2 V</td></tr>
            <tr><td>Thermal runaway onset</td><td>~150 °C</td><td>~150 °C</td><td>~270 °C</td></tr>
            <tr><td>Minimum thickness achievable</td><td>0.45 mm</td><td>~4 mm (dia)</td><td>~4 mm (dia)</td></tr>
          </tbody>
        </table>

        <h2>For most wearables, LiPo wins</h2>
        <p>Watches, TWS earbuds, fitness bands, smart rings, AR glasses — almost every device in this category uses a lithium-polymer pouch cell. The reason is mechanical: only a pouch can be made curved, stepped, rectangular or under 1 mm thick, which is what an industrial-design team needs when the cell has to disappear into the enclosure.</p>
        <p>Within LiPo, the default cathode is LCO for sub-1 Ah cells. Above 1 Ah you see NMC more often, which trades a little volumetric density for better cycle life and easier fast charging.</p>

        <h2>When cylindrical Li-ion makes sense</h2>
        <ul>
          <li>The enclosure has a natural cylindrical cavity (barrel-shaped handheld, some medical pumps).</li>
          <li>You need cells in parallel beyond ~2 Ah and want a mature supply chain.</li>
          <li>Mechanical robustness against drop/crush matters more than a few grams of weight.</li>
        </ul>

        <h2>When LiFePO4 is worth considering</h2>
        <p>LFP has one job: cycle life and thermal stability. For a wearable, its lower density usually disqualifies it — you give up 35–50% of runtime at the same volume. The cases where it still wins:</p>
        <ul>
          <li>Long-life industrial wearables (thermometers, logistics wristbands) that charge daily for 5+ years.</li>
          <li>Medical-adjacent devices where thermal runaway risk must be pushed as far as possible.</li>
          <li>Charging docks or hub batteries where volume is not critical.</li>
        </ul>

        <h2>High-voltage LCO: the new default for AR</h2>
        <p>The recent move to 4.45 V and 4.48 V charge cut-off extends the energy envelope by about 8% at the same cell volume. For AR glasses where the battery cavity is fixed, those 8 percentage points can be the difference between 4-hour and 4.5-hour runtime. The trade-off is cycle life — typical 4.48 V formulations retain 80% SOH for around 400–500 cycles instead of 600–800, which is acceptable if the device is charged nightly and replaced after 2–3 years.</p>

        <h2>A 3-question decision shortcut</h2>
        <ol>
          <li><strong>Can the cell fit inside a pouch under 2 mm thick?</strong> → LiPo.</li>
          <li><strong>Does the device charge more than 1,000 cycles in its expected life?</strong> → Consider LFP for a packable product, or accept LiPo with over-sizing.</li>
          <li><strong>Are you ready to trade ~30% cycle life for ~8% more runtime?</strong> → HV LCO.</li>
        </ol>

        <h2>The thing we see most often go wrong</h2>
        <p>Engineering teams pick a chemistry based on a single metric — usually energy density — and discover six months later that cycle life at their actual operating temperature is half the datasheet number. Always ask a vendor for cycle data at <em>your</em> C-rate, depth of discharge and ambient temperature, not the lab conditions.</p>

        <nav class="article-nav">
          <a href="/blog/guides.html" class="prev">← Back to Battery Guides</a>
          <a href="/blog/ar-thin-battery.html" class="next">Next: Ultra-Thin Battery for AR Glasses →</a>
        </nav>$art$, 'Zufek Engineering', 8, (SELECT id FROM categories WHERE slug='technology'), now() - interval '58 days', 'published')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO articles (slug, title, excerpt, cover_url, content, author, reading_minutes, category_id, published_at, status) VALUES ('wearable-thermal', $art$Managing Skin-Contact Temperature on Wearables$art$, $art$Why 41 °C is an industrial-design problem, and what the BMS can do to stay under it without ruining runtime.$art$, 'https://images.unsplash.com/photo-1510017098667-27dfc7150acb?w=1920&q=80', $art$<p class="lede">A wearable is a heater strapped to a person. The battery is one source of that heat; the SoC, display driver, and charging circuit are others. The design goal isn&rsquo;t to minimise temperature &mdash; it&rsquo;s to keep the skin-facing surface below a threshold the user&rsquo;s nerves won&rsquo;t complain about.</p>

        <h2>The number you have to respect</h2>
        <p>IEC 60950-1 and IEC 62368-1 both define the skin-contact limit for continuous contact with a metal surface at around 41 &deg;C in a room-temperature ambient. Plastic or glass enclosures get a few degrees of slack, but most product teams anchor to 41 &deg;C because it&rsquo;s the strictest number they might be tested against, and because users begin to describe devices as &ldquo;warm&rdquo; around 40 &deg;C and &ldquo;hot&rdquo; around 42 &deg;C.</p>
        <p>Cosmetics aside, going above 43 &deg;C for extended periods starts to cause low-grade thermal damage to skin &mdash; a real regulatory concern for medical wearables.</p>

        <h2>Where the heat actually comes from</h2>
        <table>
          <thead><tr><th>Source</th><th>Typical load</th><th>Dominant during</th></tr></thead>
          <tbody>
            <tr><td>Battery internal resistance</td><td>10&ndash;150 mW</td><td>High discharge (TX burst, motor)</td></tr>
            <tr><td>SoC / compute</td><td>0.5&ndash;3 W</td><td>Active use, wake events</td></tr>
            <tr><td>Display driver</td><td>0.3&ndash;1.5 W</td><td>Always-on display, high brightness</td></tr>
            <tr><td>Charging (losses)</td><td>0.2&ndash;1 W</td><td>Charging to 80&ndash;100% SOC</td></tr>
            <tr><td>Radios (BT/Wi-Fi)</td><td>50&ndash;300 mW avg</td><td>Streaming, sync</td></tr>
          </tbody>
        </table>
        <p>On most AR glasses and smartwatches, <strong>charging is the thermal worst case</strong>, not use. The cell is hot from I&sup2;R losses in the CC phase, the charger IC is bleeding the CV phase as heat, and the device is sitting still on a cradle with no natural airflow.</p>

        <h2>Three heat paths you control</h2>
        <ol>
          <li><strong>Spread.</strong> Copper or graphite foil across the inside of the enclosure turns a point source into a large radiator. A 30 &times; 20 mm graphite pad on top of the cell reduces peak local temperature by 4&ndash;7 &deg;C compared to bare plastic.</li>
          <li><strong>Insulate on the skin side.</strong> A 0.15&ndash;0.3 mm aerogel or silicone pad between the cell and the skin-facing surface creates a small thermal gradient, pushing peak skin temperature down by 2&ndash;4 &deg;C. Costs runtime indirectly (slightly worse cell cooling), so tune carefully.</li>
          <li><strong>Throttle at the BMS.</strong> The cheapest way to cap temperature is to stop charging fast. Skin-contact temperature limiting is now a standard feature of modern fuel gauges &mdash; trigger a charge-rate reduction when the battery-surface NTC crosses 38 &deg;C; full pause at 41 &deg;C.</li>
        </ol>

        <h2>The charging profile that actually works</h2>
        <p>A three-stage profile survives most real-world environments:</p>
        <ul>
          <li><strong>0&ndash;80% SOC:</strong> charge at up to 0.7C, constant-current.</li>
          <li><strong>80&ndash;95% SOC:</strong> taper down to 0.3C, entering CV.</li>
          <li><strong>95&ndash;100% SOC:</strong> trickle only. Most users never need the last 5% in a hurry, and stopping at 95% more than doubles cycle life.</li>
        </ul>
        <p>Overlay a thermal envelope on this: if the NTC ever reads above 40 &deg;C, divide the current-at-that-stage by 2. If it hits 43 &deg;C, pause entirely for 60 seconds. User-perceived charge time barely changes, but the fail-case skin temperature is controlled.</p>

        <h2>On-wrist vs off-wrist</h2>
        <p>A smartwatch charging on a cradle behaves differently from a watch charging while being worn (over-night on the wrist, for example). The wrist acts as a heatsink but also an insulator &mdash; net effect varies by about &plusmn;2 &deg;C. If your device supports both, you must sense which mode you&rsquo;re in (typically via the PPG sensor or a capacitive skin-contact electrode) and adjust the thermal envelope.</p>

        <h2>Testing: the 30-minute session</h2>
        <p>The most useful thermal test we run is a 30-minute continuous-worst-case session: maximum brightness, continuous streaming audio, GPS on, BT on, ambient at 30 &deg;C. Measure at five surface points every 10 seconds. If any point crosses 41 &deg;C during the session, the design is not done. Repeat at 40 &deg;C ambient for the outdoor-use worst case.</p>

        <nav class="article-nav">
          <a href="/blog/bms-pcm-smart.html" class="prev">&larr; Previous: PCM vs Smart Battery</a>
          <a href="/blog/lithium-shipping.html" class="next">Next: Lithium Shipping Basics &rarr;</a>
        </nav>$art$, 'Zufek Engineering', 11, (SELECT id FROM categories WHERE slug='technology'), now() - interval '61 days', 'published')
ON CONFLICT (slug) DO NOTHING;


-- =====================================================================
-- Authors (E-E-A-T named experts) — seeded after the table exists.
-- Schema is ensured by the autoMigrate() pass at app boot, but the
-- table is also declared in schema.sql so npm run db:seed creates it.
-- =====================================================================
INSERT INTO authors (slug, name, job_title, bio, avatar_url, email, knows_about, same_as, is_active) VALUES
('chen-li',
 'Chen Li',
 'Chief Cell Engineer & Co-founder',
 'Chen Li leads cathode and electrolyte development at Zufek. 14+ years in lithium-polymer R&D at tier-1 manufacturers before founding Zufek in 2018. Holds 9 issued patents on high-voltage Li-Po formulations. Personally signs off the chemistry roadmap and reviews every NPI feasibility note that goes out.',
 '',
 'chen.li@zufek.com',
 '["Lithium polymer chemistry","High-voltage LCO","Electrolyte formulation","Cell formation cycling","NPI cell qualification"]'::jsonb,
 '[]'::jsonb,
 TRUE),
('wei-zhang',
 'Wei Zhang',
 'Mechanical & Custom-Shape Lead',
 'Wei Zhang heads the custom-geometry program at Zufek. 12 years tooling and stack design for non-rectangular Li-Po, including 200+ shipped custom geometries for medical wearables, AR/VR and TWS earbuds. Owns the relationship with the in-house tooling shop and sets the minimum-radius and stepped-pouch design rules used in customer feasibility notes.',
 '',
 'wei.zhang@zufek.com',
 '["Custom Li-Po geometry","Stack and winding design","Tooling for pouch cells","Curved cell mechanics","Stepped pouch yield"]'::jsonb,
 '[]'::jsonb,
 TRUE),
('lin-zhao',
 'Lin Zhao',
 'Coin Cell & Industrial Programs Lead',
 'Lin Zhao runs the coin-cell line at Zufek (LIR + ML formats), the medical-device program (ISO 13485 alignment) and the reflow-mountable ML-series qualification. Background in hermetic crimping, IEC 60086-4 testing and IPC/JEDEC J-STD-020 reflow profile work for SMD-mount lithium cells.',
 '',
 'lin.zhao@zufek.com',
 '["Coin cell manufacturing","LIR Li-ion 3.6V","ML Li-MnO2 3.0V","Reflow soldering of lithium cells","IEC 62133-2","IEC 60086-4"]'::jsonb,
 '[]'::jsonb,
 TRUE),
('mei-yang',
 'Mei Yang',
 'Quality, Compliance & GDPR Lead',
 'Mei Yang leads Zufek''s ISO 9001 / ISO 13485 program and runs all UN 38.3, IEC 62133, UL 1642, KC 62133 and PSE filings. Maintains the audit-ready document control system and the 10-year traceability database. Primary contact for customer audits and quality agreements.',
 '',
 'mei.yang@zufek.com',
 '["ISO 9001 quality systems","ISO 13485 medical device","UN 38.3 air shipping","IEC 62133 / UL 1642","Customer quality audits","CAPA"]'::jsonb,
 '[]'::jsonb,
 TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  job_title = EXCLUDED.job_title,
  bio = EXCLUDED.bio,
  knows_about = EXCLUDED.knows_about,
  is_active = EXCLUDED.is_active,
  updated_at = now();


-- =====================================================================
-- Bind existing 19 articles to (pillar, author) so cluster relationships
-- propagate to the pillar pages and Person JSON-LD renders the right
-- expert. Idempotent: UPDATE-by-slug only touches rows that exist.
-- Cluster mapping rationale:
--   Polymer Li-Po pillar gets articles about generic Li-Po sizing,
--     thermal management, BMS topology and chemistry trade-offs.
--   Custom-Shaped pillar gets articles about wearables, AR/VR, TWS,
--     curved/thin cells and medical wearables.
--   Coin Steel-Shell pillar gets the existing LIR-vs-ML article
--     plus the six new ones below.
--   Compliance / shipping articles are kept as cross-pillar (no
--     pillar_id, but author_id set so they still surface a Person).
-- =====================================================================
DO $$
DECLARE
  pillar_polymer  INT := (SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery');
  pillar_custom   INT := (SELECT id FROM pillar_pages WHERE slug='custom-shaped-polymer-lithium-battery');
  pillar_coin     INT := (SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery');
  author_chen     INT := (SELECT id FROM authors WHERE slug='chen-li');
  author_wei      INT := (SELECT id FROM authors WHERE slug='wei-zhang');
  author_lin      INT := (SELECT id FROM authors WHERE slug='lin-zhao');
  author_mei      INT := (SELECT id FROM authors WHERE slug='mei-yang');
BEGIN
  -- Custom-Shape (wearables, AR/VR, thin/curved, TWS)
  UPDATE articles SET pillar_id = pillar_custom, author_id = author_wei
    WHERE slug IN ('ar-thin-battery','ar-vr-market-2026','tws-earbuds-next',
                   'wearable-chemistry','wearable-thermal','china-medical-battery');

  -- Polymer Li-Po (sizing, BMS, chemistry, cycle life, HV LCO, thermal runaway)
  UPDATE articles SET pillar_id = pillar_polymer, author_id = author_chen
    WHERE slug IN ('cell-sizing','bms-pcm-smart','cobalt-nickel-lfp',
                   'cycle-life-curves','hv-lco-density','thermal-runaway','solid-state-reality');

  -- Compliance / shipping / regulation cluster — owned by Mei (QA/Compliance lead).
  UPDATE articles SET author_id = author_mei
    WHERE slug IN ('un-iec-compliance','lithium-shipping','lithium-air-freight',
                   'eu-battery-passport','second-life-cells');

  -- Existing pillar-bound seed articles also get an author now that they have one.
  UPDATE articles SET author_id = author_chen WHERE slug = 'how-to-choose-li-po-capacity-iot';
  UPDATE articles SET author_id = author_wei  WHERE slug = 'designing-curved-batteries-for-wearables';
  UPDATE articles SET author_id = author_lin  WHERE slug = 'lir-vs-ml-coin-cell-which-to-choose';
END$$;


-- =====================================================================
-- 6 new cluster articles for the Coin Steel-Shell pillar so it has
-- enough breadth to compete with the other two (which already have
-- 6-7 cluster posts each after the binding above). All bound to
-- the coin pillar + Lin Zhao (or Mei Yang for the compliance piece).
-- =====================================================================
INSERT INTO articles (pillar_id, author_id, category_id, slug, title, excerpt, cover_url, hero_image, content, author, reading_minutes, published_at, status) VALUES
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='lin-zhao'),
 (SELECT id FROM categories WHERE slug='technology'),
 'reflow-profile-ml-coin-cell',
 'Designing the Reflow Profile for an SMD-Mounted ML Coin Cell',
 'A practical IPC/JEDEC J-STD-020 walkthrough for engineers who want to put an ML2032 or ML2430 on a PCB through a real lead-free reflow oven without losing capacity.',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
 $art$<p class="lede">A reflow-mountable lithium cell is rare, useful, and very easy to abuse. ML2032 and ML2430 survive standard lead-free reflow if — and only if — your profile is built around their physics, not the JEDEC J-STD-020 default. Here is the profile we recommend after qualifying ML cells across roughly 80 customer SMD programs.</p>
<h2>What the cell can take</h2>
<p>Both ML2032 and ML2430 are rated for 260 °C peak reflow with the constraints below. The hermetic stainless-steel can is what makes this physically possible — a pouch cell would never survive. Three thermal limits matter:</p>
<ul>
  <li><strong>Peak temperature ≤ 260 °C</strong>, with no more than 30 seconds above 250 °C.</li>
  <li><strong>Time above 217 °C ≤ 90 seconds</strong>, ideally 60–80 s.</li>
  <li><strong>Total time above 200 °C ≤ 150 seconds</strong>.</li>
</ul>
<p>The standard J-STD-020 envelope allows up to 150 s above 217 °C. ML can take a "soft" J-STD-020 profile but will lose noticeable capacity if you run the upper-bound profile twice (e.g. on a double-sided board). Always assume one reflow pass per ML cell unless your profile sits well inside the envelope.</p>
<h2>The profile we recommend</h2>
<p>From cold board to fully-soldered, four phases:</p>
<ol>
  <li><strong>Preheat 25 → 150 °C</strong> at ≤ 3 °C/s, total 80–100 s. The cell internals equalise; nothing dramatic.</li>
  <li><strong>Soak 150 → 200 °C</strong> over 60–80 s. Flux activates. Cell temperature lags board by 4–8 °C; that's fine.</li>
  <li><strong>Reflow 200 → 250 °C</strong> over 30–40 s. Stay above 217 °C for 70–80 s. Peak the cell can <em>just</em> reach 250 °C; do not push higher.</li>
  <li><strong>Cooldown 250 → 100 °C</strong> at 3–5 °C/s. Forced air OK; do not water-quench.</li>
</ol>
<p>Total time above 200 °C: ~120 s. Peak: 250–255 °C. This sits in the 75th percentile of customer profiles that pass our 12-month aging test (≤ 8% capacity loss after one reflow pass).</p>
<h2>The mistakes we see most often</h2>
<p><strong>Profile from a JEDEC reference board.</strong> JEDEC reference profiles assume a thin SMD package; an ML cell has 2–3 mm of can mass that lags. Always thermocouple the cell can, not the PCB.</p>
<p><strong>Two-pass reflow on the same cell.</strong> If the board has components on both sides, the ML cell must go on the side that reflows first, then be protected with foam tape during the second pass. Two passes through a full profile typically halves cycle life.</p>
<p><strong>Hand-touch-up after reflow.</strong> Soldering iron temps (350–400 °C) damage the crimp seal. If a tab needs rework, use a hot-air rework station with the cell shielded.</p>
<h2>Pre-conditioning before SMT</h2>
<p>Store ML cells at 20 °C ± 5 °C and < 60% RH. If shipped through humid logistics, bake the cells at 60 °C for 24 h before placement. Moisture in the can during reflow is the most common failure mode (visible as bulging or split crimp).</p>
<h2>Test plan to qualify your specific profile</h2>
<ol>
  <li>Thermocouple 5 sample cells inside the oven at the placement location.</li>
  <li>Run 30 cells through one pass; measure OCV and IR before vs. after.</li>
  <li>Cycle 10 of those 30 to 200 cycles at 0.2C; compare to a non-reflowed control.</li>
  <li>Acceptance: < 5% delta IR, < 3% delta capacity at C200.</li>
</ol>
<p>For medical and automotive programs we do this qualification with a serial-numbered batch and keep the data for 10 years per ISO 13485 retention.</p>
<nav class="article-nav">
  <a href="/blog/lir-vs-ml-coin-cell-which-to-choose" class="prev">&larr; Previous: LIR vs ML Coin Cells</a>
  <a href="/blog/coin-cell-tab-welding" class="next">Next: Coin Cell Tab Welding &rarr;</a>
</nav>$art$,
 'Lin Zhao', 9, now() - interval '8 days', 'published'),

((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='lin-zhao'),
 (SELECT id FROM categories WHERE slug='technology'),
 'coin-cell-tab-welding',
 'Tab Welding Coin Cells: When to Pick Nickel, Copper or Through-Hole Posts',
 'A field guide to selecting the right termination for LIR and ML coin cells when you need them welded into a pack rather than dropped into a holder.',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
 $art$<p class="lede">A coin cell with welded tabs is a cheap, hermetic, mechanically rigid energy source — perfect for hearing aids, RTC backups, BLE beacons and small wearables. The choice between nickel tabs, copper tabs and through-hole posts is rarely about cost. It is about what the next assembly step looks like.</p>
<h2>Nickel tabs (the default)</h2>
<p>0.10–0.15 mm pure nickel strip, spot-welded to the cell can on the negative side and the cap on the positive side. Two welds per side, ~6 mm spacing. Pull strength is typically 25–40 N — well above what any reasonable handling stress puts on a coin cell.</p>
<ul>
  <li><strong>Pick when:</strong> the device is hand-soldered, hot-bar soldered or threaded into a wire harness.</li>
  <li><strong>Avoid when:</strong> downstream assembly uses ultrasonic welding (nickel-to-nickel ultrasonic is unreliable on tabs this thin).</li>
  <li><strong>Cost:</strong> baseline. ~USD 0.02 / cell over a bare cell.</li>
</ul>
<h2>Copper tabs</h2>
<p>0.05–0.10 mm copper strip with a thin nickel plating for weldability. Lower resistance than nickel (about 5× lower for the same cross-section), so worth it when the cell sees pulse currents above 1 C.</p>
<ul>
  <li><strong>Pick when:</strong> peak discharge currents matter (Bluetooth radio bursts in a beacon, DC-DC inrush in a wearable).</li>
  <li><strong>Avoid when:</strong> the device is reflow-soldered. Copper-tab nickel plating can dewet during reflow and cause weld embrittlement.</li>
</ul>
<h2>Through-hole posts (TH posts)</h2>
<p>1.0–1.5 mm diameter brass posts laser-welded to the cell faces, designed to drop into PTH holes on a PCB and wave-solder. Surprisingly under-used.</p>
<ul>
  <li><strong>Pick when:</strong> the device is a small PCB with through-hole assembly (RTC backup on industrial controllers, BLE beacons in 2025-vintage designs).</li>
  <li><strong>Avoid when:</strong> any vibration spec exceeds 5 G — the posts concentrate stress at the weld interface and fatigue.</li>
</ul>
<h2>Specifying tabs without ambiguity</h2>
<p>An RFQ that just says "with tabs" is the most common cause of late-stage redesign. Specify all of:</p>
<ul>
  <li>Material and thickness (e.g., "0.10 mm pure nickel, no plating").</li>
  <li>Length and width (drawing preferred; otherwise "12 mm × 6 mm").</li>
  <li>Orientation (horizontal lay-flat vs. vertical post-out).</li>
  <li>Polarity marking (we recommend a permanent ink dot on the positive tab).</li>
  <li>Pull-strength target if downstream assembly is rough (typical: ≥ 20 N).</li>
</ul>
<p>For medical programs we add a serial number laser-etched on the negative tab so the cell links back to its formation batch.</p>
<h2>Welding parameters Zufek uses</h2>
<p>For documentation and audits, the parameters are:</p>
<ul>
  <li>Spot welder: 100 J capacitor-discharge, 1.0 ms pulse, 0.5 mm tip diameter.</li>
  <li>Two welds per tab side, 6 mm centre-to-centre.</li>
  <li>Pull-test 1 in 100 cells to ≥ 25 N. Failures are diverted out of the medical-program lot.</li>
</ul>
<nav class="article-nav">
  <a href="/blog/reflow-profile-ml-coin-cell" class="prev">&larr; Previous: Reflow Profile for ML</a>
  <a href="/blog/coin-cell-hearing-aid" class="next">Next: Coin Cells in Hearing Aids &rarr;</a>
</nav>$art$,
 'Lin Zhao', 7, now() - interval '14 days', 'published'),

((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='lin-zhao'),
 (SELECT id FROM categories WHERE slug='industry-insights'),
 'coin-cell-hearing-aid',
 'Why Hearing Aids Use Pin Coin Cells (and What That Means for Your Wearable)',
 'Hearing-aid cells are a quiet specialism inside coin manufacturing. The constraints that make them work translate directly to slim wearables and implantable medical devices.',
 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&q=80',
 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1920&q=80',
 $art$<p class="lede">A modern receiver-in-canal hearing aid uses a 25–100 mAh rechargeable coin cell, recharges nightly, runs 14–18 hours a day at near-zero average current with brief audio bursts, lives in a humid ear canal, and has to last at least three years on a battery you can''t replace. There is essentially no consumer-electronics cell on earth with stricter requirements.</p>
<h2>The hearing-aid coin cell, deconstructed</h2>
<p>The category is dominated by Ø 5–10 mm coin cells in the LIR / ML steel-shell family. They use:</p>
<ul>
  <li><strong>A dual-shell hermetic crimp</strong> with a fluoropolymer gasket — three orders of magnitude better humidity resistance than a pouch laminate.</li>
  <li><strong>Welded pin contacts</strong> instead of tabs, so the cell drops directly into a metal contact spring on the device.</li>
  <li><strong>Conservative voltage windows</strong> (3.0–4.1 V on LIR variants) to extend cycle life past 1,000 cycles.</li>
  <li><strong>Ultra-low self-discharge electrolyte</strong> (sub-2 % per month) so a 60 % SOC cell still has charge two months later when the device sits on a shelf.</li>
</ul>
<h2>The lessons that travel</h2>
<p>If you are building any of:</p>
<ul>
  <li>A continuous-glucose monitor patch (14-day life, sterile pack).</li>
  <li>A smart ring or skin-contact biosensor.</li>
  <li>An implantable pulse generator.</li>
  <li>A long-life industrial sensor with sealed enclosure.</li>
</ul>
<p>Hearing-aid manufacturing IP is the most relevant template. Specifically: hermetic crimp design, dual-shell construction, pin-contact terminations, low-SD electrolyte, and ISO 13485-aligned production.</p>
<h2>What we ship into hearing-aid programs today</h2>
<p>The two most common Zufek SKUs in this category:</p>
<ul>
  <li><strong>LIR ZA10 (10 mm Ø, 30 mAh)</strong> for in-ear receiver-in-canal devices. 1,000+ cycles at 0.2 C.</li>
  <li><strong>LIR ZA13 (8 mm Ø, 25 mAh)</strong> for completely-in-canal devices. 800+ cycles, slimmer crimp.</li>
</ul>
<p>Both run on our medical-grade line under ISO 13485 alignment, with full lot traceability and IEC 62133-2 / IEC 60086-4 documentation per shipment.</p>
<h2>If you''re evaluating a coin-cell vendor for a wearable</h2>
<p>Three diligence questions worth asking:</p>
<ol>
  <li>Show me your hermetic-crimp leak test data on a 12-month shelf-life sample.</li>
  <li>Show me the pin-contact pull-test SOP and the AQL.</li>
  <li>Can you document a 14-day continuous-discharge profile at body temperature with full capacity reporting?</li>
</ol>
<p>If they can answer all three quickly, they have shipped this category. If they can''t, your medical timeline is at risk.</p>
<nav class="article-nav">
  <a href="/blog/coin-cell-tab-welding" class="prev">&larr; Previous: Tab Welding Coin Cells</a>
  <a href="/blog/coin-cell-rtc-backup" class="next">Next: Coin Cells for RTC Backup &rarr;</a>
</nav>$art$,
 'Lin Zhao', 6, now() - interval '22 days', 'published'),

((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='lin-zhao'),
 (SELECT id FROM categories WHERE slug='technology'),
 'coin-cell-rtc-backup',
 'Designing RTC Backup with a Reflow-Mounted ML Coin Cell',
 'How a USD 0.40 ML2032 with welded tabs replaces the tray-loaded CR2032 + holder + assembly labour in industrial controllers — and the four design rules that make it reliable.',
 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=1200&q=80',
 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=1920&q=80',
 $art$<p class="lede">Real-time-clock backup is one of the few places in industrial electronics where a primary CR2032 has held the design line for two decades. ML rechargeable coin cells have been quietly displacing it since 2020. Here is when ML wins on engineering merit, and the four design rules that get it right the first time.</p>
<h2>The CR2032 status quo</h2>
<p>A typical industrial controller (PLC, motor drive, network gateway) uses a CR2032 lithium primary in a tray holder to keep the RTC alive between power cycles. Self-discharge is roughly 1 % / year, capacity 220 mAh, expected life 8–12 years on a 1 µA RTC load. Replacement is a service call.</p>
<p>The ML approach replaces that with a soldered-in 65 mAh ML2032 that recharges from main power whenever the controller is on. Self-discharge is higher (~2 %/month under voltage hold), but because the cell continuously trickle-charges, the RTC sees full capacity indefinitely — until the cell hits ~10 years of total cycle exposure, at which point cycle ageing limits life rather than capacity loss.</p>
<h2>When ML wins</h2>
<ul>
  <li>The product runs from main power most of the time and the RTC backup is for short outages (< 30 days continuous).</li>
  <li>Service replacement is expensive (industrial, telecom, solar inverter) — eliminating a tray holder and a service call typically pays back at unit volumes above 5,000.</li>
  <li>Operating temperature exceeds CR2032''s rating of +60 °C. ML is rated to +85 °C with a different electrolyte.</li>
  <li>The PCB sees lead-free reflow. ML can be reflowed; CR2032 cannot.</li>
</ul>
<h2>When ML loses</h2>
<ul>
  <li>The product is fully off-grid for months at a time. Self-discharge eats the cell long before cycle life matters. Stay with CR2032.</li>
  <li>RTC current draw exceeds 5 µA average. The 65 mAh ML reservoir runs out in months without recharging.</li>
</ul>
<h2>Four design rules for an ML RTC</h2>
<p><strong>Rule 1 — current-limit the charge path.</strong> ML wants ≤ 0.05 C constant-current trickle until the cell hits 3.0 V, then constant-voltage hold. A 1.5 kΩ resistor on a 3.3 V rail is the simplest implementation, sized for ≤ 1 mA charge current. Or use a one-cell charger IC like the MCP73831.</p>
<p><strong>Rule 2 — diode-isolate the discharge path.</strong> When main power is off, the ML cell becomes the only source. A Schottky diode on the cell positive prevents reverse-current sneaking back into other rails. Use a low-leakage Schottky (BAT54-type, ~30 nA leakage at 25 °C).</p>
<p><strong>Rule 3 — undervoltage-protect the cell.</strong> ML below 1.8 V is irreversibly damaged. Add a comparator that disables the discharge path at 2.2 V cell voltage. The 0.4 V margin protects against the diode forward drop and ageing.</p>
<p><strong>Rule 4 — temperature-protect the charger.</strong> ML below 0 °C should not charge. A simple PTC thermistor in series with the trickle resistor takes care of this without adding firmware.</p>
<h2>Compliance trail</h2>
<p>Because ML is rechargeable lithium, it triggers IEC 62133-2 instead of IEC 60086-4 (which CR2032 uses). UN 38.3 also requires a 50-cycle pre-test before shipment. Both are routine; we ship every ML lot with both reports.</p>
<nav class="article-nav">
  <a href="/blog/coin-cell-hearing-aid" class="prev">&larr; Previous: Coin Cells in Hearing Aids</a>
  <a href="/blog/coin-cell-low-temp" class="next">Next: Coin Cell Low-Temperature Behaviour &rarr;</a>
</nav>$art$,
 'Lin Zhao', 8, now() - interval '30 days', 'published'),

((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='lin-zhao'),
 (SELECT id FROM categories WHERE slug='technology'),
 'coin-cell-low-temp',
 'Coin Cells in the Cold: How LIR and ML Behave from -40 °C to +85 °C',
 'Hard data and design rules for using rechargeable coin cells in outdoor IoT, automotive, cold-chain and aerospace devices.',
 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&q=80',
 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1920&q=80',
 $art$<p class="lede">Operating temperature is the single biggest reason customers pick ML over LIR — and yet most datasheets stop at +60 °C. This article gives the actual capacity and impedance data we measure on a per-batch basis from -40 °C to +85 °C, and the design rules that follow.</p>
<h2>What the curves look like</h2>
<p>From representative test cells (ML2032, sample size n=30, cycled fresh):</p>
<table>
  <thead><tr><th>Temperature</th><th>Capacity vs. 25 °C baseline</th><th>Internal resistance vs. 25 °C</th></tr></thead>
  <tbody>
    <tr><td>-40 °C</td><td>40–55 %</td><td>4–6×</td></tr>
    <tr><td>-20 °C</td><td>72–82 %</td><td>2.0–2.5×</td></tr>
    <tr><td>  0 °C</td><td>88–94 %</td><td>1.4×</td></tr>
    <tr><td>+25 °C</td><td>100 % (baseline)</td><td>1.0×</td></tr>
    <tr><td>+60 °C</td><td>96–99 %</td><td>0.85×</td></tr>
    <tr><td>+85 °C</td><td>92–95 % (1st use), accelerated ageing thereafter</td><td>0.75× initially</td></tr>
  </tbody>
</table>
<p>For LIR2032 the cold-temperature numbers are roughly 10 % worse, the hot-temperature ageing accelerates more sharply above +60 °C.</p>
<h2>Five design rules</h2>
<p><strong>Rule 1 — design for end-of-life and the cold corner together.</strong> If the device must run at -20 °C after 500 cycles, your headroom factor is 0.8 (cycle ageing) × 0.78 (cold derating) = 0.62. Spec a cell ≥ 1.6× the runtime requirement.</p>
<p><strong>Rule 2 — never charge below 0 °C.</strong> Both chemistries lithium-plate aggressively under cold charge. A PTC thermistor in series with the charge path prevents firmware mistakes.</p>
<p><strong>Rule 3 — current pulses get bigger at cold.</strong> If your firmware has a 50 mA radio burst, it draws nearly 200 mA equivalent of impedance loss at -40 °C. Your reservoir capacitor needs to be sized for the cold corner, not the room-temperature spec.</p>
<p><strong>Rule 4 — above +60 °C, treat the cell as a calendar-life part.</strong> ML at +85 °C ages roughly 3× faster than at +25 °C in calendar terms, even unloaded. Plan for replacement (if accessible) or a shorter product life. We do not honour cycle-life specs above +70 °C average operating temperature.</p>
<p><strong>Rule 5 — pre-condition before measuring.</strong> A 12 °C ramp from cold storage to test condition takes ~30 minutes for an ML coin cell to thermalise internally. Capacity tests immediately after cold storage typically read 5–8 % low.</p>
<h2>What we ship into automotive and outdoor IoT</h2>
<p>Most automotive ECU RTC/event-log applications use ML2032 with an automotive-grade electrolyte rated -40 °C to +85 °C continuous, +125 °C peak (e.g., engine compartment). For outdoor IoT (asset trackers, smart agriculture sensors) we typically recommend ML2430 in a heated micro-compartment driven by the device''s main heater when present.</p>
<nav class="article-nav">
  <a href="/blog/coin-cell-rtc-backup" class="prev">&larr; Previous: ML RTC Backup</a>
  <a href="/blog/coin-cell-iec-62133-2" class="next">Next: IEC 62133-2 for Coin Cells &rarr;</a>
</nav>$art$,
 'Lin Zhao', 9, now() - interval '38 days', 'published'),

((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='mei-yang'),
 (SELECT id FROM categories WHERE slug='certifications'),
 'coin-cell-iec-62133-2',
 'IEC 62133-2 for Coin Cells: What Tests Apply and What You Have to Pay For',
 'A compliance-lead''s walkthrough of which IEC 62133-2 / IEC 60086-4 / UN 38.3 sections actually fire on a rechargeable coin cell, what they cost, and how to avoid paying twice.',
 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80',
 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1920&q=80',
 $art$<p class="lede">Compliance budgets quietly eat 5–8 % of a battery program''s engineering cost. Half of that is paying for tests you didn''t need. This walkthrough covers exactly which IEC 62133-2 / IEC 60086-4 / UN 38.3 sections fire on a rechargeable coin cell — and which sections you can skip if you already shipped on a sister cell.</p>
<h2>The mandatory test stack for a new rechargeable coin cell</h2>
<ol>
  <li><strong>UN 38.3</strong> — required for any lithium cell that will travel by air. 8 sub-tests (T1–T8). Coin cells under 0.3 g lithium content can use the simplified report. Cost: USD 4–8k typical.</li>
  <li><strong>IEC 62133-2:2017+A1:2021</strong> — secondary lithium safety. The main batteries-and-cells standard. Mandatory tests: external short, abnormal charge, forced discharge, overcharge, temperature cycling, mechanical shock, vibration, internal short.</li>
  <li><strong>IEC 60086-4</strong> — applies if any party in the supply chain treats the cell as a primary equivalent (it shouldn''t, for LIR/ML, but customs sometimes asks).</li>
</ol>
<p>For sale into specific jurisdictions you''ll also need:</p>
<ul>
  <li>UL 1642 (US, often required by reference, not directly).</li>
  <li>UL 2054 (US, pack-level for multi-cell — single coin cells usually exempt).</li>
  <li>KC 62133 (Korea).</li>
  <li>PSE (Japan, only for 100 Wh+ packs — not coin cells).</li>
  <li>BIS (India, mandatory).</li>
</ul>
<h2>Tests that fire only conditionally</h2>
<p><strong>Drop test.</strong> Required for "portable" applications (devices carried in pockets, handbags). For an embedded RTC backup it is not required — but customers often ask for it anyway because it is in the IEC 62133-2 standard.</p>
<p><strong>Crush test.</strong> Mandatory only when the standard''s sample-size threshold is reached. For coin cells under 5 mm thickness the crush profile is reduced.</p>
<p><strong>Forced internal short.</strong> Optional under IEC 62133-2:2017 Amendment 1 — but Apple, Samsung and Garmin all require it. Plan for it if your customer is a tier-1 consumer-electronics OEM.</p>
<h2>Cost reality check</h2>
<table>
  <thead><tr><th>Cert</th><th>Lab-fee range (typical 2026)</th><th>Lead time</th></tr></thead>
  <tbody>
    <tr><td>UN 38.3</td><td>USD 4–8k</td><td>4 weeks</td></tr>
    <tr><td>IEC 62133-2 + Amendment 1</td><td>USD 12–18k</td><td>8 weeks</td></tr>
    <tr><td>UL 1642</td><td>USD 8–12k</td><td>10 weeks</td></tr>
    <tr><td>KC 62133 + factory inspection</td><td>USD 6–10k + travel</td><td>12 weeks</td></tr>
    <tr><td>BIS (India)</td><td>USD 5–8k</td><td>16 weeks</td></tr>
  </tbody>
</table>
<p>If your team is shipping an entirely new cell SKU, budget USD 35–55k and 14 weeks total to be selling everywhere. If you''re using an existing certified cell with a different label, the recerts run roughly 30 % of the original cost.</p>
<h2>How we structure the certification stack at Zufek</h2>
<p>We ship every production lot with three documents in the box:</p>
<ol>
  <li>UN 38.3 test summary (latest version, < 12 months old).</li>
  <li>IEC 62133-2 declaration of conformity, referencing the cell''s lab report ID.</li>
  <li>MSDS (English) and SDS (per-region for EU REACH, US OSHA, China GHS).</li>
</ol>
<p>For medical and aerospace customers the SOP adds a Certificate of Conformity per lot, signed by Mei Yang or the deputy compliance lead. Customers can request the underlying lab reports under NDA.</p>
<nav class="article-nav">
  <a href="/blog/coin-cell-low-temp" class="prev">&larr; Previous: Coin Cell Low-Temp Behaviour</a>
  <a href="/blog/lir-vs-ml-coin-cell-which-to-choose" class="next">Next: LIR vs ML — the original primer &rarr;</a>
</nav>$art$,
 'Mei Yang', 10, now() - interval '46 days', 'published')
ON CONFLICT (slug) DO NOTHING;
-- =====================================================================
-- BATCH 2 — 14 new cluster articles (SEO audit 2026 Q2)
--
-- ARTICLE BRIEFS (prompts written before drafting):
--
-- POLYMER LITHIUM BATTERY PILLAR (+8 cluster articles):
-- 1. iec-62133-2-full-walkthrough
--    Keyword: "IEC 62133-2 test requirements lithium battery"
--    Intent: Informational — engineers/PMs learning what tests their cell must pass
--    Outline: scope, mandatory vs referenced, full test list with criteria,
--             Amendment 1, cost/timeline table, relation to UN 38.3 and regional marks
--    Author: Mei Yang (compliance lead) | Category: certifications | ~1800 words
--
-- 2. lipo-battery-swelling-causes
--    Keyword: "LiPo battery swelling causes"
--    Intent: Diagnostic — engineers troubleshooting swollen pouch cells in product
--    Outline: gas generation chemistry, overcharge vs calendar swelling vs age,
--             design allowance in enclosure, BMS parameters to prevent, when to replace
--    Author: Chen Li | Category: technology | ~1500 words
--
-- 3. lithium-battery-capacity-fade
--    Keyword: "lithium battery capacity fade mechanisms"
--    Intent: Informational — engineers diagnosing early capacity loss
--    Outline: SEI growth, Li plating, cathode particle cracking, electrolyte depletion,
--             how each maps to a cycle curve shape, BMS mitigations, table
--    Author: Chen Li | Category: technology | ~1700 words
--
-- 4. cc-cv-charging-protocol
--    Keyword: "lithium battery CC CV charging protocol"
--    Intent: Informational — engineers implementing charger design
--    Outline: CC phase mechanics, voltage knee, CV phase, termination current choices,
--             fast-charge rate implications, thermal effects, common mistakes
--    Author: Chen Li | Category: technology | ~1500 words
--
-- 5. parallel-series-cell-configuration
--    Keyword: "lithium battery series parallel configuration"
--    Intent: Informational — engineers designing multi-cell packs
--    Outline: xSyP notation, voltage vs capacity, series balancing, parallel matching,
--             tab welding topology, smart battery vs PCM choice
--    Author: Chen Li | Category: technology | ~1600 words
--
-- 6. bms-topology-selection-guide
--    Keyword: "BMS topology selection guide lithium battery"
--    Intent: Decision-support — architects choosing BMS architecture
--    Outline: bare→PCM→PCM+gauge→SBS1.1→CAN spectrum, decision factors,
--             comparison matrix table, thermal design per topology
--    Author: Chen Li | Category: technology | ~1800 words
--
-- 7. formation-cycling-impact
--    Keyword: "lithium battery formation cycling process"
--    Intent: Informational — engineers understanding cell quality drivers
--    Outline: what formation is, SEI formation chemistry, how protocol affects
--             capacity/coulombic efficiency/cycle life, fast vs slow formation,
--             grading, what to ask suppliers
--    Author: Chen Li | Category: technology | ~1500 words
--
-- 8. electrolyte-additives-lipo
--    Keyword: "lithium electrolyte additives VC FEC LiDFOB"
--    Intent: Advanced informational — chemistry due-diligence buyers
--    Outline: why plain LiPF6 is insufficient, VC/FEC/LiDFOB roles,
--             proprietary packages, how additives show in cycle curves,
--             how to ask suppliers without violating NDA
--    Author: Chen Li | Category: technology | ~1500 words
--
-- CUSTOM-SHAPED POLYMER LITHIUM BATTERY PILLAR (+6 cluster articles):
-- 9. stepped-battery-geometry
--    Keyword: "stepped battery design wearable electronics"
--    Intent: Informational — HW engineers designing wearables with complex geometry
--    Outline: why rectangles don't fit, L/U/T shapes explained, electrode constraints,
--             tab placement rules, capacity vs footprint tradeoff, common mistakes
--    Author: Wei Zhang | Category: technology | ~1600 words
--
-- 10. custom-battery-tooling-cost
--     Keyword: "custom battery tooling cost amortization"
--     Intent: Commercial — PMs deciding custom vs standard cell
--     Outline: what tooling is required, itemised cost table, amortization math,
--              when standard cell wins, tooling ownership contract terms
--     Author: Wei Zhang | Category: industry-insights | ~1400 words
--
-- 11. co-design-battery-workflow
--     Keyword: "custom battery co-design workflow supplier"
--     Intent: Process — HW engineers starting a custom battery project
--     Outline: why projects fail (late engagement), 6-stage workflow,
--              what OEM provides per stage, timeline, red flags
--     Author: Wei Zhang | Category: technology | ~1600 words
--
-- 12. flexible-battery-wearable
--     Keyword: "flexible battery wearable electronics 2026"
--     Intent: Informational — engineers researching emerging battery tech
--     Outline: two categories (curved rigid vs true flex electrolyte),
--              current state of each, tradeoffs, TRL reality check, 2027-28 outlook
--     Author: Wei Zhang | Category: technology | ~1500 words
--
-- 13. smart-ring-battery-design
--     Keyword: "smart ring battery design form factor"
--     Intent: Informational — engineers designing smart ring or ultra-compact wearable
--     Outline: geometry constraints (<200 mm³), realistic capacity range,
--              HV LCO chemistry case, FPC connection, wireless charging BMS,
--              ring architectures, power budget example
--     Author: Wei Zhang | Category: technology | ~1500 words
--
-- 14. custom-battery-reliability-testing
--     Keyword: "custom shaped battery reliability testing"
--     Intent: Process — engineers building test plans for non-standard cells
--     Outline: why standard tests don't cover custom shapes, shape-specific
--              mechanical tests, standard IEC tests that still apply,
--              FAI protocol, pass/fail criteria, documentation
--     Author: Mei Yang | Category: certifications | ~1500 words
-- =====================================================================


-- =====================================================================
-- POLYMER LITHIUM BATTERY PILLAR — 8 new cluster articles
-- =====================================================================
INSERT INTO articles (pillar_id, author_id, category_id, slug, title, excerpt, cover_url, hero_image, content, author, reading_minutes, published_at, status) VALUES

-- 1 of 8 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='mei-yang'),
 (SELECT id FROM categories WHERE slug='certifications'),
 'iec-62133-2-full-walkthrough',
 'IEC 62133-2:2017 + Amendment 1: The Complete Test Walkthrough',
 'A compliance lead''s plain-English guide to every mandatory and conditional test in IEC 62133-2, with cost estimates, timelines and how it fits alongside UN 38.3.',
 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80',
 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1920&q=80',
 $art$<p class="lede">IEC 62133-2 is the global safety baseline for secondary lithium cells and batteries in portable equipment. Miss it and your product stops at customs, gets returned by a tier-1 OEM, or triggers a recall. But the standard is 80 pages of dense normative text. This walkthrough covers what actually matters for a typical small-format LiPo program.</p>

<h2>Scope: what IEC 62133-2 covers</h2>
<p>The standard applies to <strong>secondary</strong> (rechargeable) lithium cells and batteries intended for use in <strong>portable applications</strong>. "Portable" means the end device is designed to be carried by a person — smartwatches, earbuds, medical monitors, handheld scanners, laptops and so on. Fixed installations (UPS, stationary storage) fall under IEC 62133-1 for nickel systems and different lithium standards altogether.</p>
<p>IEC 62133-2:2017 was amended by A1:2021. The amendment added a mandatory internal-short-circuit test (clause 7.3.9) that did not exist in the original. If your test report predates 2022, ask the lab whether it covers Amendment 1 — many OEMs now require this explicitly in their supplier quality agreements.</p>

<h2>The mandatory test matrix</h2>
<p>Below are the tests that fire on every new cell model regardless of application. Pass/fail criteria are defined in the standard; the values here are the typical thresholds:</p>
<table>
  <thead>
    <tr><th>Clause</th><th>Test name</th><th>Condition</th><th>Pass criterion</th></tr>
  </thead>
  <tbody>
    <tr><td>7.3.1</td><td>Continuous charge</td><td>Charge at 0.1C for 28 days at 20 °C</td><td>No fire, no explosion, ≤ 10% mass loss</td></tr>
    <tr><td>7.3.2</td><td>Vibration</td><td>IEC 60068-2-6, sinusoidal, 3 axes</td><td>No leakage, no fire; capacity ≥ 85%</td></tr>
    <tr><td>7.3.3</td><td>Mechanical shock</td><td>IEC 60068-2-27, half-sine 150 g / 6 ms</td><td>No rupture, no fire</td></tr>
    <tr><td>7.3.4</td><td>External short circuit</td><td>Short at < 100 mΩ, ambient 55 °C ± 5 °C</td><td>No fire, no explosion</td></tr>
    <tr><td>7.3.5</td><td>Free fall (drop)</td><td>1 m drop on each face, 3 drops per face</td><td>No fire, no explosion; leakage permitted</td></tr>
    <tr><td>7.3.6</td><td>Thermal abuse</td><td>Ramp to 130 °C at 5 °C/min, hold 30 min</td><td>No fire, no explosion</td></tr>
    <tr><td>7.3.7</td><td>Crush</td><td>Crush with 13 kN force (cylindrical) or equivalent force on pouch</td><td>No fire, no explosion</td></tr>
    <tr><td>7.3.8</td><td>Overcharge</td><td>Charge at 3C to 2× rated voltage or for 90 min</td><td>No fire, no explosion</td></tr>
    <tr><td>7.3.9</td><td>Forced internal short (A1)</td><td>Nickel particle induced short per Annex B</td><td>No fire, no explosion; temperature ≤ 170 °C</td></tr>
    <tr><td>7.3.10</td><td>Forced discharge</td><td>Discharge into a reverse-polarity source at rated capacity</td><td>No fire, no explosion</td></tr>
    <tr><td>7.3.11</td><td>Abnormal charge (battery level)</td><td>Charge pack with faulty BMS simulation</td><td>No fire, no explosion</td></tr>
    <tr><td>7.3.12</td><td>Temperature cycling</td><td>−40 °C ↔ +70 °C × 10 cycles, then charge/discharge check</td><td>Capacity ≥ 85% of initial</td></tr>
  </tbody>
</table>

<h2>Conditional and battery-level tests</h2>
<p>Some tests fire only under specific conditions:</p>
<ul>
  <li><strong>Projectile test (7.3.13):</strong> Required for cylindrical cells above 18 mm diameter only. Most pouch cells are exempt.</li>
  <li><strong>Abnormal charge at cell level (7.3.8):</strong> Also runs at cell level for multi-cell packs. Run once at cell, once at pack — two separate sample sets.</li>
  <li><strong>Protection circuit test (clause 8):</strong> Applies only if the cell is sold with an integral PCM. Bare cells without protection skip clause 8.</li>
</ul>

<h2>Sample quantities and condition</h2>
<p>IEC 62133-2 requires <strong>10 samples per test group</strong> for most tests. The samples must be commercially representative — not handbuilt prototypes or first-article samples from a new line. Most labs require cells from production tooling that have been through at least one formation cycle and 3 conditioning cycles. Plan for 100–150 cells per new model for a full compliance run including retests and spare samples.</p>

<h2>How IEC 62133-2 relates to regional marks</h2>
<p>The standard itself is not a regulatory filing — it is a safety standard. What changes by region is which body issues the mark and whether a factory audit is required:</p>
<table>
  <thead><tr><th>Market</th><th>Mark / filing</th><th>Basis</th><th>Factory audit?</th></tr></thead>
  <tbody>
    <tr><td>EU</td><td>CE (self-declaration under Low Voltage Directive or Battery Regulation)</td><td>IEC 62133-2 + EN harmonised version</td><td>No (self-declaration)</td></tr>
    <tr><td>USA</td><td>UL 1642 (cell) / UL 2054 (battery)</td><td>Partly overlaps IEC 62133-2, but different test protocol</td><td>UL mark requires ongoing annual inspection</td></tr>
    <tr><td>South Korea</td><td>KC mark (KC 62133)</td><td>IEC 62133-2 technical equivalent</td><td>Yes — factory inspection required</td></tr>
    <tr><td>Japan</td><td>PSE mark (for packs ≥ 100 Wh)</td><td>Technical standard METI ordinance</td><td>Yes for designated products</td></tr>
    <tr><td>India</td><td>BIS certification</td><td>IS 16046 part 2 (based on IEC 62133-2)</td><td>Yes — factory and sample testing</td></tr>
    <tr><td>China</td><td>GB/T 18287 or GB 31241</td><td>Parallel national standards, not direct equivalents</td><td>CCC mark requires factory audit</td></tr>
  </tbody>
</table>
<p>IEC 62133-2 test data from a CNAS/A2LA-accredited lab is accepted as the technical basis for most of these marks without retesting. The additional cost is usually the regional filing fee and factory audit, not the test itself.</p>

<h2>Where UN 38.3 fits</h2>
<p>UN 38.3 (transport) and IEC 62133-2 (safety in use) are complementary, not overlapping. UN 38.3 covers transport hazards — altitude simulation, thermal, vibration, shock, external short, impact, overcharge, forced discharge. IEC 62133-2 goes further into end-use scenarios (continuous charge, crush under realistic enclosure conditions, internal short). You need both: UN 38.3 to ship the cells, IEC 62133-2 to sell them in the end product. The good news is that some test conditions overlap, and a well-structured test plan from a single lab can share samples across both standards, reducing total cell count and lab time.</p>

<h2>Realistic cost and timeline table</h2>
<table>
  <thead><tr><th>Certification</th><th>Lab cost (2026 estimate)</th><th>Lead time</th><th>Sample count</th></tr></thead>
  <tbody>
    <tr><td>UN 38.3 full</td><td>USD 5,000–9,000</td><td>4–5 weeks</td><td>40–60 cells</td></tr>
    <tr><td>IEC 62133-2:2017 + A1</td><td>USD 14,000–22,000</td><td>8–10 weeks</td><td>100–150 cells</td></tr>
    <tr><td>UL 1642 (US)</td><td>USD 8,000–14,000</td><td>10–14 weeks</td><td>80–120 cells</td></tr>
    <tr><td>KC 62133 (Korea)</td><td>USD 7,000–12,000 + travel</td><td>12–16 weeks</td><td>80 cells</td></tr>
    <tr><td>BIS (India)</td><td>USD 5,000–9,000</td><td>16–24 weeks</td><td>50 cells</td></tr>
  </tbody>
</table>
<p>For a clean global stack (UN + IEC + UL + KC), budget <strong>USD 45,000–60,000 and 16 weeks</strong> from sample submission to final reports. Projects that skip pre-screening often run over budget because retests cost 60–80% of the original test fee with 4-week delay each.</p>

<h2>What to ask your supplier before you commit</h2>
<p>Every cell we ship at Zufek comes with three compliance documents as standard: UN 38.3 test summary (< 12 months old), IEC 62133-2 declaration of conformity, and an MSDS/SDS set. For new cell models that have not yet completed IEC 62133-2, we are explicit about which tests have been run on the underlying cell chemistry vs. which are pending for the specific size. Ask any supplier to distinguish between "chemistry-level" certification (covering a family) and "cell-level" certification (covering the specific SKU you are buying). The difference matters for your own product CE filing.</p>

<nav class="article-nav">
  <a href="/blog/un-iec-compliance" class="prev">&larr; Previous: UN 38.3 &amp; IEC 62133 Overview</a>
  <a href="/blog/lipo-battery-swelling-causes" class="next">Next: LiPo Battery Swelling: Causes &amp; Fixes &rarr;</a>
</nav>$art$,
 'Mei Yang', 12, now() - interval '6 days', 'published'),

-- 2 of 8 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='chen-li'),
 (SELECT id FROM categories WHERE slug='technology'),
 'lipo-battery-swelling-causes',
 'LiPo Battery Swelling: Root Causes, Risk Levels and Design Fixes',
 'Why pouch cells swell, which scenarios are safe to ignore and which require immediate action, and what BMS and mechanical design changes prevent the problem.',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
 $art$<p class="lede">A swollen LiPo is one of the most common field complaints in consumer electronics programs. The pouch enclosure that makes lithium-polymer cells thin and shapeable also makes them visible gas-pressure indicators. Understanding why a cell swells — and which type of swelling matters — stops engineering teams from either ignoring a real safety risk or panicking about a normal manufacturing artefact.</p>

<h2>The basic mechanism: gas inside a sealed pouch</h2>
<p>A lithium-polymer cell is a stack of electrode layers sealed inside an aluminium-composite laminate pouch. The electrolyte fills the spaces between layers. When side reactions occur inside the cell, they produce gas — typically CO₂, CO, methane, or ethylene, depending on the cathode chemistry and the specific reaction. Because the pouch is sealed, that gas has nowhere to go except to inflate the pouch itself.</p>
<p>The key question is what triggered the gas. Three sources dominate in practice:</p>

<h2>Source 1: Formation residual gas (normal, benign)</h2>
<p>During the first charge after electrolyte fill — the formation cycle — the electrolyte reacts with fresh electrode surfaces to form the solid electrolyte interphase (SEI) layer. This produces a small amount of gas as a byproduct. Most manufacturers handle this by puncturing and resealing the pouch after formation, or by designing a "degassing" step into the production process. If this step is incomplete or skipped (a cost-cutting shortcut in some commodity cells), the finished cell arrives with a small amount of trapped formation gas.</p>
<p>Formation residual gas causes very mild swelling — typically less than 0.3 mm thickness increase on a 4 mm cell. It does not grow with use and is generally harmless. The tell: a cell that arrives from the factory with a very slight dome that does not change over the first 50 cycles.</p>

<h2>Source 2: Electrolyte decomposition from overcharge or over-temperature</h2>
<p>When a cell is charged above its rated voltage — even briefly — the electrolyte begins to oxidise at the cathode. The decomposition products include CO₂ and other gases, and the reaction is not self-limiting: once started, continued overcharge accelerates decomposition. Similarly, extended exposure above 60 °C (for standard LiPo) accelerates the same electrolyte breakdown independently of voltage.</p>
<p>This type of swelling is progressive: the cell gets thicker with each charge cycle. It is the most common cause of failure in consumer electronics products that charge at high rates in hot enclosures. The BMS protection parameters responsible are the charge voltage ceiling (which must never exceed the cell's rated max voltage, typically 4.20 V or 4.35 V for HV-LCO) and the temperature cutoff during charging.</p>

<h2>Source 3: Calendar ageing and SEI growth</h2>
<p>Even a cell stored at room temperature slowly builds up additional SEI material over time. The byproducts of this slow reaction include trace gas. In a correctly manufactured and operated cell, calendar-ageing swelling over 2–3 years is typically less than 0.5 mm. In a cell stored at elevated temperature (40–60 °C, common in vehicles or outdoor devices in summer), calendar ageing accelerates significantly and the associated swelling can become mechanically problematic within 18 months.</p>

<h2>How to assess whether swelling is dangerous</h2>
<p>Not all swelling requires cell replacement. The risk framework we use with product teams:</p>
<table>
  <thead>
    <tr><th>Swelling category</th><th>Thickness increase</th><th>Risk level</th><th>Action</th></tr>
  </thead>
  <tbody>
    <tr><td>Formation residual (new cell)</td><td>&lt; 0.3 mm</td><td>Negligible</td><td>No action needed</td></tr>
    <tr><td>Normal calendar ageing (&gt; 1 year, ambient storage)</td><td>0.3–0.8 mm</td><td>Low</td><td>Monitor; note in EOL planning</td></tr>
    <tr><td>Progressive electrolyte decomposition</td><td>&gt; 1 mm, growing per cycle</td><td>Moderate</td><td>Investigate root cause; apply charge voltage / temperature fix</td></tr>
    <tr><td>Rapid venting (visible dome or audible hiss)</td><td>Large (&gt; 3 mm or deformed)</td><td>High</td><td>Remove from device immediately; do not charge</td></tr>
    <tr><td>Vented cell with electrolyte smell</td><td>Any</td><td>Critical</td><td>Isolate; follow MSDS disposal procedure; do not charge</td></tr>
  </tbody>
</table>

<h2>Design changes that prevent swelling</h2>
<p><strong>Mechanical relief space.</strong> Every enclosure around a LiPo cell should budget at least 1–1.5 mm of expansion room on the widest face of the cell. Cells pressed flat against a rigid housing with zero clearance can buckle in their electrical connections or delaminate internal tabs when they swell.</p>
<p><strong>Charge voltage margin.</strong> Specifying the charge cutoff at 4.18 V instead of 4.20 V on a standard LiPo (and 4.33 V instead of 4.35 V on an HV-LCO variant) reduces electrolyte oxidation rate by approximately 40% with a capacity penalty of only 2–3%. For products that prioritise longevity over peak capacity, this is one of the most effective single changes available.</p>
<p><strong>Temperature charging inhibit.</strong> Disable charging above 45 °C (rather than the cell's rated 60 °C) in the BMS. Most of the overcharge-related electrolyte decomposition at high voltage occurs much faster above 50 °C. The combined overvoltage + over-temperature scenario is where thermal runaway risk begins.</p>
<p><strong>Ventilation path design.</strong> For devices that produce significant heat (induction chargers, high-discharge drone ESCs), a ventilation path that moves air past the cell face reduces the enclosure temperature enough to meaningfully extend calendar life and reduce swelling rate.</p>

<h2>What to do in the field</h2>
<p>If a customer reports a visibly swollen device, the safe procedure is: power off, do not charge, remove the battery if the device allows it, and follow the cell's MSDS disposal guidance. Swollen cells should never be placed in household recycling bins — they require lithium battery disposal at a certified point. For RMA analysis, ship the returned cell with the swelling dimension recorded and the charge history from the device if available. The charge history often reveals whether overcharge or over-temperature was the root cause.</p>

<nav class="article-nav">
  <a href="/blog/thermal-runaway" class="prev">&larr; Previous: Thermal Runaway — What Triggers It</a>
  <a href="/blog/lithium-battery-capacity-fade" class="next">Next: Capacity Fade Mechanisms &rarr;</a>
</nav>$art$,
 'Chen Li', 10, now() - interval '12 days', 'published'),

-- 3 of 8 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='chen-li'),
 (SELECT id FROM categories WHERE slug='technology'),
 'lithium-battery-capacity-fade',
 'Four Mechanisms of Capacity Fade in Lithium-Polymer Cells',
 'SEI growth, lithium plating, cathode cracking and electrolyte depletion — what each does to a cycle curve and what BMS settings slow it down.',
 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
 $art$<p class="lede">A lithium-polymer cell does not have a single "capacity fade" mechanism. It has at least four, and each one leaves a distinct fingerprint on the cycle curve. Identifying which mechanism is dominant tells you which BMS or application parameter to change — and which failure mode is irreversible.</p>

<h2>Why cycle curves look the way they do</h2>
<p>A healthy LiPo cell loses capacity slowly and approximately linearly for the first 70–80% of its rated cycle life, then accelerates into "the knee" — a rapid capacity drop. The shape of the curve before the knee, the location of the knee, and the rate of post-knee decline are all diagnostic. Understanding the four mechanisms below helps you read those signals.</p>

<h2>Mechanism 1: SEI growth (inevitable, manageable)</h2>
<p>The solid electrolyte interphase (SEI) is a passivation layer that forms on the graphite anode during the first charge. A stable SEI is what makes lithium cells practical — it prevents continuous electrolyte decomposition at the anode surface. But SEI growth does not stop after formation. Every cycle adds a small amount of additional SEI material, consuming lithium from the active inventory and increasing internal resistance.</p>
<p>SEI growth is the dominant fade mechanism in cells operated within their rated conditions. It produces slow, linear fade starting from cycle 1 — the normal slope of a well-behaved cycle curve. High temperature accelerates SEI growth substantially: a cell cycled at 45 °C loses capacity roughly 2× faster than the same cell at 25 °C. Low charge cutoff voltage (e.g., 4.18 V instead of 4.20 V) reduces the rate by approximately 30–40%. This is the only mechanism you can slow down without sacrificing functionality — the others are either catastrophic or triggered by abuse.</p>

<h2>Mechanism 2: Lithium plating (irreversible, triggered by charging mistakes)</h2>
<p>When lithium ions cannot intercalate into graphite fast enough — because the charge rate is too high, the temperature is too low, or the graphite is already heavily lithiated — they deposit as metallic lithium on the anode surface. This metallic lithium does not re-intercalate during discharge; it is lost from the active inventory permanently. Plated lithium also forms dendritic structures that can pierce the separator and cause internal short circuits.</p>
<p>Lithium plating shows up on the cycle curve as a sudden step-down in capacity rather than the gradual fade of SEI growth. It also produces a characteristic voltage plateau during discharge that experienced engineers recognise. The triggers: charging above 1C at temperatures below 10 °C, or charging at any rate below 0 °C. The BMS fix is a temperature-gated charge rate limit: charge at C/10 below 5 °C, at C/5 below 10 °C, and at rated C-rate only above 15 °C. Low-temperature-grade electrolytes extend the safe operating window by about 10 °C.</p>

<h2>Mechanism 3: Cathode particle cracking (chemistry-dependent)</h2>
<p>NMC cathode materials undergo volume changes during lithiation and delithiation — typically 2–4% per cycle for NMC 523, and up to 7% for NMC 811. Over thousands of cycles, this mechanical stress fractures the cathode particles. Fractured particles expose fresh surface area that reacts with the electrolyte, accelerating local electrolyte decomposition and increasing impedance. They also create electrically isolated fragments that no longer contribute to capacity.</p>
<p>Cathode cracking is less common in small-format LiPo cells (which typically use LCO, HV-LCO, or NMC 111 with lower volume change) than in large cylindrical NMC811 cells for EVs. In consumer wearables and IoT devices, the more relevant concern is the cathode&#39;s HV-LCO chemistry used above 4.35 V — which can crack at its surface under repeated high-voltage cycling. Keeping the maximum charge voltage below the rated ceiling is the main mitigation.</p>

<h2>Mechanism 4: Electrolyte depletion (accelerated by heat and HV)</h2>
<p>Electrolyte — the LiPF₆ salt dissolved in organic carbonate solvents — is consumed over time by reactions at both electrodes. At the cathode, high voltage drives oxidative decomposition. At the anode, continued SEI growth consumes electrolyte as a reactant. At elevated temperature (above 50 °C), the LiPF₆ salt itself decomposes into HF, which attacks both the cathode coating and the copper current collector.</p>
<p>Electrolyte depletion shows up late in cell life as a sharp increase in internal resistance, often accompanied by the capacity knee. It is the final gating step that kills most cells — not particle cracking or plating — because by the time electrolyte is significantly depleted, the cell has already been compromised by one of the other three mechanisms.</p>

<h2>Mechanism comparison table</h2>
<table>
  <thead>
    <tr><th>Mechanism</th><th>Typical onset</th><th>Rate of fade</th><th>Reversible?</th><th>Primary BMS parameter to control</th></tr>
  </thead>
  <tbody>
    <tr><td>SEI growth</td><td>Cycle 1 onwards</td><td>Slow, linear</td><td>No</td><td>Charge voltage ceiling, temperature</td></tr>
    <tr><td>Lithium plating</td><td>Any cold/fast charge event</td><td>Step-change</td><td>No</td><td>Charge rate vs. temperature table</td></tr>
    <tr><td>Cathode cracking</td><td>Mid-to-late life (after 500+ cycles)</td><td>Accelerating</td><td>No</td><td>Max charge voltage, C-rate during high-SoC phase</td></tr>
    <tr><td>Electrolyte depletion</td><td>Late life</td><td>Rapid (at knee)</td><td>No</td><td>Temperature during operation, DoD window</td></tr>
  </tbody>
</table>

<h2>The single most effective intervention</h2>
<p>If you can only change one parameter, change the upper charge voltage cutoff. Reducing the charge ceiling by 50–80 mV reduces the rate of both SEI growth and electrolyte decomposition, and prevents cathode cracking at the high-voltage surface. The capacity cost is 2–4% depending on chemistry. For most applications that claim a 3-year battery life target, the trade is overwhelmingly worthwhile. Cycle-life improvement of 30–50% from this single change is repeatable across LCO, HV-LCO, and NMC 111 chemistries.</p>

<nav class="article-nav">
  <a href="/blog/lipo-battery-swelling-causes" class="prev">&larr; Previous: LiPo Battery Swelling</a>
  <a href="/blog/cc-cv-charging-protocol" class="next">Next: CC/CV Charging Protocol &rarr;</a>
</nav>$art$,
 'Chen Li', 11, now() - interval '19 days', 'published'),

-- 4 of 8 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='chen-li'),
 (SELECT id FROM categories WHERE slug='technology'),
 'cc-cv-charging-protocol',
 'CC/CV Charging: How the Protocol Works and Where It Goes Wrong',
 'The physics behind constant-current and constant-voltage phases, termination current choices, fast-charge implications, and the four most common charger design mistakes.',
 'https://images.unsplash.com/photo-1532456745301-b2c645d8b80d?w=1200&q=80',
 'https://images.unsplash.com/photo-1532456745301-b2c645d8b80d?w=1920&q=80',
 $art$<p class="lede">Every lithium charger uses CC/CV — constant-current followed by constant-voltage — as its core protocol. It sounds simple. It is not. The CC phase determines charge speed and thermal load; the CV phase determines top-of-charge accuracy and cycle life; the termination condition determines how full the cell actually gets. Get any of the three wrong and you are either leaving capacity on the table or shortening the battery's life.</p>

<h2>What happens during the CC phase</h2>
<p>The charger delivers a fixed current — typically expressed as a multiple of the cell's rated capacity (C-rate). For a 1,000 mAh cell, 1C is 1,000 mA. During CC, the cell voltage rises from its resting level (typically 3.0–3.7 V depending on state of charge) toward the charge cutoff voltage (4.20 V for standard LiPo, 4.35 V or 4.48 V for HV variants).</p>
<p>The rate of voltage rise during CC is not linear — it accelerates as the cell approaches full charge because the thermodynamic activity of the cathode material changes. The charger sees the cell's voltage and switches to CV when it reaches the cutoff. At this moment the cell is approximately 70–80% full, depending on the C-rate and the exact chemistry.</p>

<h2>What happens during the CV phase</h2>
<p>Once the charger holds voltage constant at the cutoff, the current it delivers drops exponentially as the cell approaches equilibrium. This slow taper is essential: it allows lithium ions to fully intercalate into the cathode at a rate the structure can accommodate without stress. If you terminate charging at the beginning of CV (i.e., the instant the charger transitions), you get a 75–80% full cell. If you let CV run until the current drops to C/10, you get a 95–98% full cell. If you run it to C/20, you get close to 100%.</p>

<h2>Termination current: the trade-off</h2>
<p>The termination current is the current threshold at which the charger declares "full" during the CV phase. It directly controls:</p>
<ul>
  <li><strong>Capacity delivered per charge</strong> — lower termination = more energy in per cycle</li>
  <li><strong>Charge time</strong> — lower termination = longer time in CV tail</li>
  <li><strong>Cycle life</strong> — lower termination = more stress on cathode at full SoC = faster fade</li>
</ul>
<table>
  <thead>
    <tr><th>Termination current</th><th>Approximate SoC achieved</th><th>Additional time in CV vs. C/10</th><th>Cycle-life impact</th></tr>
  </thead>
  <tbody>
    <tr><td>C/5 (fast, partial)</td><td>~90%</td><td>−15 to −20 min saved</td><td>Best</td></tr>
    <tr><td>C/10 (standard)</td><td>~96%</td><td>Baseline</td><td>Good</td></tr>
    <tr><td>C/20 (thorough)</td><td>~99%</td><td>+15 to +25 min</td><td>Slightly worse</td></tr>
    <tr><td>C/50 (maximum)</td><td>~100%</td><td>+40 to +60 min</td><td>Notably worse at high temperature</td></tr>
  </tbody>
</table>
<p>For applications where cycle life matters (> 500 cycles), we recommend C/10 termination as the default. For applications where runtime per charge is paramount and cycle count is low (< 200 cycles, e.g. single-use medical devices), C/20 is appropriate.</p>

<h2>Fast charging and its implications</h2>
<p>Fast charging means a higher CC current — 2C, 3C, or beyond. The physics consequences:</p>
<ul>
  <li><strong>Higher heat generation.</strong> Joule heating during CC scales with current squared. A 2C charge produces 4× the resistive heat of a 1C charge. This matters for enclosures with limited thermal mass.</li>
  <li><strong>Increased lithium plating risk.</strong> At high C-rates, graphite kinetics can limit lithium intercalation, leading to surface plating. This is most dangerous above 1.5C below 15 °C. Modern fast-charge protocols use a temperature-vs-rate lookup table to cap current at cold temperatures.</li>
  <li><strong>Voltage polarisation error.</strong> At high current, internal resistance drops extra voltage across the cell, making it appear to reach the cutoff sooner than it actually does thermodynamically. This means the CV phase starts earlier and the cell is less full at the start of CV. Paradoxically, fast charging often achieves lower actual SoC in less time than a moderate-rate charge.</li>
</ul>

<h2>Four common mistakes in charger design</h2>
<p><strong>1. Charge cutoff voltage that drifts with temperature.</strong> The charger's voltage reference and the PCM's overvoltage comparator both have temperature coefficients. If the reference voltage climbs 20 mV with a 20 °C temperature rise, the cell is chronically overcharged in warm environments. Use a temperature-compensated reference or an external precision reference.</p>
<p><strong>2. Missing NTC temperature measurement on the cell body, not the PCB.</strong> The cell body temperature lags the PCB temperature during a fast charge by 5–10 °C. If the NTC is soldered to the PCB rather than glued to the cell, the BMS sees a cooler temperature than the cell experiences, and the thermal protection cuts in late.</p>
<p><strong>3. CV phase cut by a timer rather than a current threshold.</strong> Firmware that terminates charging after a fixed time in CV (e.g., "if CV phase > 30 min, done") will leave different amounts of charge in the cell depending on the starting SoC, temperature, and C-rate. Use a current threshold, not a timer.</p>
<p><strong>4. No minimum cell voltage on pre-charge.</strong> A cell that has been over-discharged below 2.5 V should be pre-charged at C/10 until it reaches 3.0 V before applying normal CC rate. Applying full CC to a deeply discharged cell risks lithium plating and in severe cases, copper dissolution and internal short circuit. Cheap single-chip charger ICs often implement this; verify that your chosen IC has pre-charge mode enabled in its register configuration.</p>

<nav class="article-nav">
  <a href="/blog/lithium-battery-capacity-fade" class="prev">&larr; Previous: Four Capacity Fade Mechanisms</a>
  <a href="/blog/parallel-series-cell-configuration" class="next">Next: Series vs Parallel Configuration &rarr;</a>
</nav>$art$,
 'Chen Li', 10, now() - interval '25 days', 'published'),

-- 5 of 8 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='chen-li'),
 (SELECT id FROM categories WHERE slug='technology'),
 'parallel-series-cell-configuration',
 'Series vs Parallel Cell Configurations: A Pack Designer''s Guide',
 'xSyP notation, when to add cells in series versus parallel, balancing requirements, tab-welding topology and when to upgrade from a PCM to a smart battery.',
 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1200&q=80',
 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1920&q=80',
 $art$<p class="lede">A single lithium-polymer cell gives you 3.0–4.2 V and anywhere from 50 mAh to 10,000 mAh in standard geometries. Most applications need more voltage, more capacity, or both. How you connect cells to get there determines your balancing requirements, protection complexity, and long-term reliability.</p>

<h2>The xSyP notation</h2>
<p>Battery pack engineers use the notation <strong>xSyP</strong> to describe a multi-cell configuration: x cells in series, y cells in parallel per series group.</p>
<ul>
  <li><strong>2S1P:</strong> Two cells in series, one parallel group. Pack voltage = 2 × cell voltage (6.0–8.4 V). Pack capacity = 1 × cell capacity.</li>
  <li><strong>1S2P:</strong> One series group with two cells in parallel. Pack voltage = 1 × cell voltage (3.0–4.2 V). Pack capacity = 2 × cell capacity.</li>
  <li><strong>3S2P:</strong> Three series groups, each with two cells in parallel. Pack voltage = 3 × cell voltage. Pack capacity = 2 × cell capacity. Six cells total.</li>
</ul>

<h2>Series configuration: adding voltage</h2>
<p>Connecting cells in series sums their voltages. This is necessary when the application load requires a voltage above the single-cell range — a 24 V power tool, a 12 V industrial radio, or a 7.4 V drone. Every cell added in series multiplies the voltage by a proportional factor.</p>
<p>The fundamental engineering requirement of a series string is <strong>cell voltage balancing</strong>. Because no two cells are perfectly identical, the weaker cell in a series string will hit the cutoff voltage (in discharge) or the charge ceiling (in charge) before the others. Without a balancer, the pack terminates early on discharge (the weak cell pulls the whole string down) and the strong cells remain undercharged. Over many cycles, the imbalance grows until one cell is chronically driven outside its safe window.</p>
<p><strong>Passive balancing</strong> bleeds current from the stronger cells during the CV phase, slowly equalising voltages. It wastes energy as heat but is inexpensive. <strong>Active balancing</strong> shuttles charge from stronger to weaker cells using inductors or capacitors, recovering most of the energy. It adds cost (USD 0.50–3.00 per cell) but dramatically improves cycle life in high-cell-count packs. For 2S–4S consumer packs, passive balancing is almost always sufficient. For 8S+ industrial packs, active balancing begins to make economic sense.</p>

<h2>Parallel configuration: adding capacity</h2>
<p>Connecting cells in parallel sums their capacity and keeps voltage constant. This makes sense when a single cell of the needed geometry cannot provide enough capacity — a smartwatch that needs 450 mAh might use two 225 mAh curved cells in parallel to fit the enclosure without increasing cell thickness.</p>
<p>The requirement for parallel cells is <strong>careful capacity and internal resistance matching</strong>. Cells in parallel share current proportional to their internal resistance difference. A 10 mΩ difference between two 200 mΩ cells causes only a 5% current imbalance — acceptable. A 50 mΩ difference causes a 25% imbalance — the weaker cell overworks, heats more, and ages faster. Match cells from the same production batch, and match by both capacity (within ±1%) and internal resistance (within ±5 mΩ for small cells).</p>
<p>Parallel cells are particularly dangerous during assembly: connecting two cells with a significant voltage difference creates a large impulse current that can weld tabs, damage cell tabs, or cause thermal events. Pre-screen all parallel cells to within ±50 mV of each other before connecting.</p>

<h2>Tab welding and connection topology</h2>
<p>How the cells are physically connected determines the pack's internal resistance distribution and its susceptibility to single-cell failure propagation. Two topologies dominate in small-format packs:</p>
<p><strong>PCB-mounted tab welding:</strong> Tabs are welded to a rigid PCB that carries the BMS. This is the standard for consumer electronics — compact, manufacturable at volume, and low resistance if the weld quality is controlled. Limitation: the PCB becomes a structural element and cannot flex.</p>
<p><strong>Bus-bar or wire-harness connection:</strong> Used in larger industrial packs (≥ 6S, ≥ 20 Ah). Nickel or copper bus bars are welded between cell groups, with separate wires to the BMS balance taps. Higher component count, but allows individual cell replacement and better thermal management.</p>
<p>For any series configuration, the balance tap wires must be routed to a balancing circuit — either on the BMS or on a separate balancer board. Omitting balance taps is a common cut in low-cost pack designs and is the primary cause of premature capacity loss in 2S–4S consumer battery packs.</p>

<h2>When to upgrade from a PCM to a smart battery</h2>
<p>A simple PCM handles overvoltage, undervoltage, overcurrent and short circuit protection — the four essential safety functions. For applications where the host system does not need to know state of charge, temperature, or remaining runtime, a PCM is sufficient and lowest cost.</p>
<p>The case for upgrading to a smart battery (one that communicates via SMBus or I²C) is:</p>
<ul>
  <li>The host OS or firmware needs accurate SoC to display a battery indicator</li>
  <li>The pack has 3 or more series cells (where manual voltage checking is impractical)</li>
  <li>The application requires predictive end-of-life warning (service life tracking)</li>
  <li>The customer's safety or regulatory requirement mandates state reporting (medical, aviation)</li>
</ul>
<p>The cost premium for a smart BMS is roughly USD 2–8 per pack for consumer-grade SMBus ICs, rising to USD 15–30 for industrial-grade chips with extended temperature range and authentication. The complexity of firmware integration on the host side should not be underestimated — smart battery protocol has subtle quirks that consume 2–4 weeks of embedded engineering time.</p>

<nav class="article-nav">
  <a href="/blog/cc-cv-charging-protocol" class="prev">&larr; Previous: CC/CV Charging Protocol</a>
  <a href="/blog/bms-topology-selection-guide" class="next">Next: BMS Topology Selection Guide &rarr;</a>
</nav>$art$,
 'Chen Li', 10, now() - interval '32 days', 'published'),

-- 6 of 8 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='chen-li'),
 (SELECT id FROM categories WHERE slug='technology'),
 'bms-topology-selection-guide',
 'BMS Topology Selection: A Decision Framework for OEMs',
 'From bare-cell PCM to full CAN-bus BMS — the spectrum of battery management topologies, the decision factors at each step, and a comparison matrix.',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
 $art$<p class="lede">BMS topology is one of the decisions that product teams make early and rarely revisit — because by the time the wrong choice causes problems, the hardware is already in production. The decision is not about finding the "best" BMS; it is about matching protection and communication complexity to what the application actually requires, at the cost point the product can bear.</p>

<h2>The topology spectrum</h2>
<p>Battery management spans a spectrum from the simplest protection circuit to a full software-defined autonomous system. Five levels are commercially meaningful for small-to-medium format packs:</p>

<h3>Level 1: Bare cell with no active protection</h3>
<p>No protection circuit at all. The application&#39;s charger and load are responsible for staying within cell limits. Used only in controlled applications where the surrounding system is certified to provide adequate protection — some research instruments, industrial machines with external safety logic, and cost-optimised disposable devices. Not appropriate for any consumer-facing product sold in the EU, US or Korea. Not recommended for new designs except under specific constraints.</p>

<h3>Level 2: Protection circuit module (PCM)</h3>
<p>A PCM adds the four fundamental protections: overvoltage (charge), undervoltage (discharge), overcurrent (discharge), and external short circuit. It consists of one or two MOSFETs in series with the cell, controlled by a dedicated protection IC (typically DW01, S-8261, or similar). Cost: USD 0.10–0.50 per cell at volume.</p>
<p>PCMs are appropriate for: single-cell consumer devices, disposable or short-cycle applications (< 200 cycles), and cases where the host system provides its own SoC estimation. They are not appropriate for multi-cell series packs (no balancing), applications needing SoC reporting, or any safety classification above IEC 62133-2 level.</p>

<h3>Level 3: PCM + fuel gauge</h3>
<p>A fuel gauge IC (TI BQ27xxx, Maxim MAX17xxx, or Microchip MCP3421 family) adds coulomb counting or impedance tracking to estimate state of charge (SoC) and report it to the host via I²C. Optionally adds temperature measurement. This is the standard topology for smartphones, tablets, earbuds, and most wearable devices. Cost addition over PCM: USD 0.50–2.00 at volume.</p>
<p>The fuel gauge typically connects to the host via I²C and exports SoC, remaining capacity in mAh, temperature, and sometimes current. It does not replace the PCM — it works alongside it. The PCM remains responsible for hardware safety cut-off; the fuel gauge is a communication and estimation layer.</p>

<h3>Level 4: Smart battery (SBS 1.1 / SMBus)</h3>
<p>A smart battery implements the Smart Battery Data (SBD) specification and communicates via SMBus (a two-wire protocol similar to I²C with different electrical and protocol requirements). The host system reads standardised registers for voltage, current, temperature, remaining capacity, cycle count, and predicted time-to-empty. The BMS also handles cell balancing in multi-cell packs. Cost: USD 3–12 per pack for the BMS IC and associated components.</p>
<p>Smart batteries are standard in laptop computers, high-end handheld scanners, industrial medical equipment, and drones that require state reporting for safety certification. The SMBus protocol is defined by the SBS Implementers Forum and is compatible with Linux&#39;s power_supply subsystem, Windows&#39;s battery driver, and most RTOS battery drivers.</p>

<h3>Level 5: Advanced BMS with CAN or proprietary bus</h3>
<p>Large or safety-critical packs (≥ 6S, ≥ 10 Ah, or any application requiring functional safety certification) use a full BMS with a dedicated microcontroller, per-cell voltage monitoring, active or advanced passive balancing, thermal management integration, and communication via CAN bus, RS-485, or a proprietary protocol. These systems also perform state-of-health (SoH) estimation, end-of-life prediction, and event logging. Cost: USD 15–80+ per pack for the BMS hardware. This topology is used in power tools (Makita / DeWalt platforms), EVs, BESS, and aerospace battery packs.</p>

<h2>Decision matrix</h2>
<table>
  <thead>
    <tr><th>Factor</th><th>PCM only</th><th>PCM + gauge</th><th>Smart battery (SBS)</th><th>Advanced CAN BMS</th></tr>
  </thead>
  <tbody>
    <tr><td>Cell count (series)</td><td>1–2S</td><td>1–2S</td><td>2–4S</td><td>4S+</td></tr>
    <tr><td>Host SoC reporting needed</td><td>No</td><td>Yes (I²C)</td><td>Yes (SMBus)</td><td>Yes (CAN/custom)</td></tr>
    <tr><td>Cell balancing</td><td>None</td><td>None</td><td>Passive</td><td>Active or passive</td></tr>
    <tr><td>Typical BMS cost per pack</td><td>$0.10–0.50</td><td>$0.60–2.50</td><td>$3–12</td><td>$15–80+</td></tr>
    <tr><td>Safety certifications supported</td><td>IEC 62133-2</td><td>IEC 62133-2</td><td>IEC 62133-2, IEC 62619</td><td>IEC 62133-2, ISO 26262, DO-254</td></tr>
    <tr><td>Typical applications</td><td>Earbuds, simple IoT</td><td>Wearables, phones</td><td>Laptops, handhelds</td><td>Power tools, drones, medical</td></tr>
  </tbody>
</table>

<h2>The decision questions</h2>
<p>Work through these in order:</p>
<ol>
  <li><strong>How many cells in series?</strong> If ≥ 3S, you need balancing — minimum Level 4 (SBS) topology.</li>
  <li><strong>Does the host system need to display battery level or predict runtime?</strong> If yes, minimum Level 3 (fuel gauge).</li>
  <li><strong>Does a regulatory or customer safety spec require fault logging, authenticated communication, or active thermal management?</strong> If yes, Level 5.</li>
  <li><strong>What is your BOM cost ceiling?</strong> If the product&#39;s total BOM target is under USD 30, Level 4 is likely unaffordable. Design for Level 3 and make the host responsible for SoC estimation.</li>
</ol>
<p>The most common mistake we see: teams choose a Level 3 topology (PCM + fuel gauge) for a 3S pack because the IC is cheap, then discover during system integration that the lack of cell balancing causes one cell to fade 40% faster than the others, triggering premature pack end-of-life. The correct minimum for any 3S+ pack is Level 4 with at least passive balancing.</p>

<nav class="article-nav">
  <a href="/blog/parallel-series-cell-configuration" class="prev">&larr; Previous: Series vs Parallel Configuration</a>
  <a href="/blog/formation-cycling-impact" class="next">Next: Formation Cycling &rarr;</a>
</nav>$art$,
 'Chen Li', 12, now() - interval '38 days', 'published'),

-- 7 of 8 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='chen-li'),
 (SELECT id FROM categories WHERE slug='technology'),
 'formation-cycling-impact',
 'Formation Cycling: The Manufacturing Step That Sets a Cell''s Entire Life',
 'What happens during the first charge, how formation protocol determines coulombic efficiency and long-term cycle life, and what to ask a supplier about their formation process.',
 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80',
 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&q=80',
 $art$<p class="lede">Formation cycling is the first charge-discharge operation a lithium cell undergoes after electrolyte fill. It is also the most consequential manufacturing step for long-term cell performance. The SEI layer built during formation is the structure that determines how efficiently the cell operates for its entire service life. Shortcuts in formation show up as poor capacity retention hundreds of cycles later.</p>

<h2>What actually happens during formation</h2>
<p>Before formation, a freshly assembled cell contains dry electrodes (graphite anode, cathode material), a separator, and newly injected electrolyte — but no stable electrode-electrolyte interface. When the first charging current flows, lithium ions move from the cathode through the electrolyte toward the graphite anode. At the anode surface, the electrolyte is outside its thermodynamic stability window at the electrode potential, so it begins to decompose.</p>
<p>These decomposition products — organic and inorganic lithium salts — precipitate on the graphite surface as a thin, porous film: the SEI. A good SEI is ionically conductive (lithium ions can pass through it to intercalate into graphite) but electronically insulating (electrons cannot pass, which stops further electrolyte decomposition). A well-formed SEI reaches steady state after the first 2–5 cycles and then grows only slowly for the rest of the cell&#39;s life.</p>
<p>A poorly formed SEI — built too fast, at the wrong temperature, or with poorly conditioned electrolyte — is mechanically unstable. It cracks when the graphite expands during lithiation, exposing fresh electrode surface that triggers additional decomposition. This consumes lithium inventory and electrolyte, causing excess capacity fade from the very first cycle.</p>

<h2>The first-cycle coulombic efficiency</h2>
<p>The coulombic efficiency (CE) of a charge-discharge cycle is the ratio of energy discharged to energy charged: CE = Q_discharge / Q_charge × 100%. In a perfect cell, CE would be 100% — every lithium ion you put in comes back out. In reality, first-cycle CE for a lithium-polymer cell is typically 90–93%. The missing 7–10% represents lithium permanently consumed in SEI formation.</p>
<p>This irreversible first-cycle loss is designed into the capacity specification — manufacturers pre-lithiate the cathode slightly to compensate. What matters for product engineers is the <em>subsequent-cycle</em> CE: for a well-formed cell, cycles 2 onwards achieve 99.5–99.9% CE. For a poorly formed cell, CE might stabilise at only 99.0–99.3%. The 0.5% difference per cycle sounds trivial, but over 500 cycles it represents an additional 2.5 percentage points of capacity loss purely from continued SEI repair — on top of the normal fade from other mechanisms.</p>

<h2>Formation protocol variables</h2>
<p>The key protocol parameters that determine SEI quality:</p>
<ul>
  <li><strong>Initial charge rate:</strong> Slow is better for SEI quality. Rates of C/10 to C/20 during the first half of the first charge give electrolyte decomposition products time to organise into a coherent film rather than a loose aggregate. Many commodity manufacturers use C/5 or even C/3 for throughput — this is the primary quality differentiator between manufacturers at the same cell price.</li>
  <li><strong>Temperature during formation:</strong> 25–30 °C is ideal. Higher temperatures produce less ionic-conducting SEI; lower temperatures produce denser but less conductive SEI. Formation at 45 °C significantly worsens the first-cycle capacity loss.</li>
  <li><strong>Number of formation cycles:</strong> Premium cell manufacturers run 3–5 formation cycles before grading. Budget manufacturers run 1. Three cycles allow the SEI to stabilise and give consistent grading results.</li>
  <li><strong>Degassing step:</strong> After the first formation cycle, the pouch is punctured, the accumulated gas is removed, and the pouch is resealed under vacuum. This step is critical — skipping it leaves CO₂ bubbles trapped between electrode layers, creating voids that increase local current density and accelerate degradation.</li>
</ul>

<h2>Grading and matching after formation</h2>
<p>After formation, cells are measured for:</p>
<ul>
  <li><strong>Open-circuit voltage (OCV)</strong> at a defined state of charge — cells outside ± 20 mV of target are rejected</li>
  <li><strong>Capacity at C/5 discharge</strong> — cells are sorted into capacity bins, typically ± 3%</li>
  <li><strong>Internal resistance (DC-IR or AC-IR at 1 kHz)</strong> — cells above a threshold for their capacity class are rejected or downgraded</li>
</ul>
<p>Graded cells that go into multi-cell packs should be matched by both capacity bin and IR bin. Mixing a top-bin cell with a bottom-bin cell in a parallel configuration accelerates both — the bottom-bin cell sees higher current stress, the top-bin cell underperforms below its potential.</p>

<h2>What to ask a supplier about formation</h2>
<p>Specific questions that reveal formation quality without requiring proprietary process disclosure:</p>
<ol>
  <li>What is your nominal first-cycle coulombic efficiency for this cell model?</li>
  <li>Do you include a degassing step in your formation process?</li>
  <li>How many formation cycles does each cell go through before grading?</li>
  <li>Can you share the formation C-rate used for the initial charge stage?</li>
  <li>What is the formation temperature range in your climate-controlled formation room?</li>
</ol>
<p>Suppliers who are evasive about these questions — or who cannot answer them — are typically running a shortened formation process to reduce cycle time and cost. The quality difference is not visible in the cell&#39;s first 50 cycles, but it becomes apparent by cycle 200.</p>

<nav class="article-nav">
  <a href="/blog/bms-topology-selection-guide" class="prev">&larr; Previous: BMS Topology Selection</a>
  <a href="/blog/electrolyte-additives-lipo" class="next">Next: Electrolyte Additives: VC, FEC and LiDFOB &rarr;</a>
</nav>$art$,
 'Chen Li', 10, now() - interval '44 days', 'published'),

-- 8 of 8 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='chen-li'),
 (SELECT id FROM categories WHERE slug='technology'),
 'electrolyte-additives-lipo',
 'VC, FEC and LiDFOB: What Electrolyte Additives Do for LiPo Cells',
 'Why plain LiPF6 in carbonate solvent is not enough, and what the three main additive families actually contribute to cycle life, voltage window and temperature range.',
 'https://images.unsplash.com/photo-1532456745301-b2c645d8b80d?w=1200&q=80',
 'https://images.unsplash.com/photo-1532456745301-b2c645d8b80d?w=1920&q=80',
 $art$<p class="lede">Every lithium-polymer cell contains an electrolyte — LiPF₆ salt dissolved in a mixture of organic carbonate solvents. And every commercially competitive electrolyte also contains additives: molecules present at 0.5–5 wt% that make the difference between a 400-cycle cell and an 800-cycle cell, or between a cell that swells at 4.45 V and one that doesn&#39;t. Additive formulations are among the most closely guarded intellectual property in cell manufacturing, but the three main families and what they do are well understood.</p>

<h2>Why plain LiPF₆-carbonate is not enough</h2>
<p>Ethylene carbonate (EC) and dimethyl carbonate (DMC) — the most common solvent combination — are thermodynamically unstable at graphite anode potentials (below ~1 V vs. Li/Li⁺). Without any additive, the electrolyte decomposes continuously at the anode, consuming both electrolyte and lithium. The SEI that forms from plain EC/DMC is also relatively soft and dissolves partially at higher temperatures, allowing continued decomposition.</p>
<p>At the cathode, plain electrolyte is unstable above approximately 4.3 V vs. Li/Li⁺. For standard LCO or NMC cells charged to 4.20 V this is comfortable; for HV-LCO cells charged to 4.45–4.48 V it is not. The last 100–150 mV of capacity in an HV cell is only accessible if the electrolyte can tolerate the cathode surface potential, which requires cathode-stabilising additives.</p>

<h2>Vinylene carbonate (VC): the standard SEI builder</h2>
<p>VC (also written as vinylene carbonate, sometimes as a 0.5–2 wt% addition) is the most widely used electrolyte additive in consumer lithium cells. It preferentially decomposes on the graphite anode ahead of the bulk electrolyte, forming a dense, compact SEI rich in poly-VC oligomers. This VC-derived SEI layer:</p>
<ul>
  <li>Is more mechanically robust than the plain-EC SEI — it resists cracking during anode expansion cycles</li>
  <li>Has lower solubility at elevated temperature — it does not dissolve at 60 °C the way plain EC-derived SEI does</li>
  <li>Reduces the first-cycle irreversible capacity loss by approximately 1–2%</li>
  <li>Reduces continuous gas generation (and thus pouch swelling) at elevated temperature or voltage</li>
</ul>
<p>VC is present in virtually all modern LiPo cells for consumer electronics. Its limitation is that above 4.35 V cathode potential, VC itself begins to oxidise, generating acid that attacks the cathode surface. This is why VC alone is not sufficient for HV-LCO cells operating above 4.35 V.</p>

<h2>Fluoroethylene carbonate (FEC): anode protection for silicon</h2>
<p>FEC is the additive of choice when the anode contains silicon (either as silicon oxide, SiO, or as silicon-carbon composite). Silicon anodes expand 300–400% during full lithiation — compared to ~10% for graphite — and the plain-EC SEI cannot accommodate this volume change. FEC preferentially forms a LiF-rich SEI on silicon surfaces that is mechanically flexible and electrically stable across the large volume excursion.</p>
<p>Even in all-graphite anodes, FEC improves low-temperature performance (the LiF-rich SEI conducts lithium ions better at cold temperatures) and reduces interfacial resistance compared to plain VC. Most high-performance cells for wearables and AR glasses use a VC + FEC combination at the anode.</p>
<p>FEC concentration is critical: too little (< 0.5 wt%) provides insufficient coverage; too much (> 5 wt%) causes excessive fluoride buildup that increases impedance after 400+ cycles. The optimum window is typically 1–3 wt%, with the exact balance calibrated against cycle life and capacity retention curves for the specific cell geometry.</p>

<h2>Lithium difluoro(oxalato)borate (LiDFOB): cathode stabiliser for HV cells</h2>
<p>LiDFOB is an alternative lithium salt (replacing a portion of the LiPF₆) that serves primarily as a cathode stabiliser in high-voltage applications. At the cathode surface above 4.3 V, LiDFOB forms a thin cathode electrolyte interphase (CEI) layer that passivates the cathode surface, reducing ongoing oxidative decomposition of the carbonate solvent. The consequences for cell performance:</p>
<ul>
  <li>Enables stable cycling at 4.45–4.48 V without the rapid electrolyte decomposition that otherwise limits HV-LCO cell life</li>
  <li>Reduces transition-metal dissolution from cathode particles (cobalt and manganese leach into electrolyte under HV conditions; the CEI layer acts as a physical barrier)</li>
  <li>Improves high-temperature storage: HV cells with LiDFOB retain 6–8% more capacity after 4 weeks at 60 °C compared to cells without it</li>
</ul>
<p>LiDFOB is also a better thermal decomposition product than LiPF₆ — the latter produces HF when it decomposes above 60 °C, which attacks the cathode and causes aluminium current collector corrosion. LiDFOB&#39;s decomposition products are significantly less corrosive.</p>

<h2>Proprietary additive packages</h2>
<p>Beyond VC, FEC, and LiDFOB, major cell manufacturers (Samsung SDI, LG Energy Solution, ATL, CATL) develop proprietary additive combinations — typically 4–8 components at low concentrations — optimised for their specific electrode formulations. These packages are not disclosed in technical specifications or datasheets. The effect is visible in performance data: a cell with "standard electrolyte" versus a cell with a mature proprietary package will show meaningfully different cycle curves in the 300–800 cycle range even with identical electrode chemistry.</p>
<p>For procurement engineers, the practical implication is that cycle-life comparisons between manufacturers cannot be made purely on electrode chemistry and cell geometry — the electrolyte additive package is an independent performance variable. Asking for cycle-life certification data from an independent lab is more informative than asking about additive chemistry, because independent lab data reflects the complete cell system including the additives the manufacturer actually uses.</p>

<h2>How additives show up in data you can request</h2>
<p>You cannot ask a supplier to disclose their additive formulation — but you can ask for data that reflects its quality:</p>
<ol>
  <li><strong>Capacity retention at cycle 500 at 1C/1C, 25 °C</strong> — a good additive package should retain ≥ 80% of initial capacity at C500</li>
  <li><strong>Capacity retention after 4-week storage at 60 °C</strong> — ≥ 85% is achievable with good HV-capable electrolyte</li>
  <li><strong>Swelling thickness increase after 500 cycles</strong> — ≤ 0.5 mm on a 4 mm cell indicates low gas generation</li>
  <li><strong>First-cycle coulombic efficiency</strong> — ≥ 92% indicates a well-functioning SEI-forming additive package</li>
</ol>
<p>These four data points are a proxy for additive package maturity without requiring disclosure of the formulation itself.</p>

<nav class="article-nav">
  <a href="/blog/formation-cycling-impact" class="prev">&larr; Previous: Formation Cycling</a>
  <a href="/products/polymer-lithium-battery" class="next">Explore Polymer LiPo Products &rarr;</a>
</nav>$art$,
 'Chen Li', 11, now() - interval '50 days', 'published')

ON CONFLICT (slug) DO NOTHING;


-- =====================================================================
-- CUSTOM-SHAPED POLYMER LITHIUM BATTERY PILLAR — 6 new cluster articles
-- =====================================================================
INSERT INTO articles (pillar_id, author_id, category_id, slug, title, excerpt, cover_url, hero_image, content, author, reading_minutes, published_at, status) VALUES

-- 1 of 6 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='custom-shaped-polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='wei-zhang'),
 (SELECT id FROM categories WHERE slug='technology'),
 'stepped-battery-geometry',
 'Stepped and L-Shaped Batteries: Geometry Guide for Wearable Electronics',
 'Why rectangular cells do not fit modern wearable enclosures, and how stepped, L-shaped and U-shaped geometries work — including electrode constraints, tab rules and capacity trade-offs.',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1920&q=80',
 $art$<p class="lede">The inside of a modern wearable is not a rectangle. A smartwatch movement, a hearing-aid shell, and an AR glasses temple all have irregular volumes — tapered corners, space reserved for antenna tuning, regions occupied by flex-circuit routing. Rectangular cells leave those odd volumes empty and waste expensive enclosure real estate. Stepped and L-shaped geometries recover that volume, but they introduce manufacturing constraints that determine what you can and cannot do.</p>

<h2>What "stepped" means in a pouch cell</h2>
<p>A stepped cell has two or more discrete thickness regions within a single electrode stack. Picture a standard rectangular pouch cell, then imagine removing a rectangular slice from one corner — the remaining shape is an "L". Now imagine removing a notch from the centre of one edge — that is a "U" or "notched" cell. The electrode stack must follow the outer geometry: thinner regions have fewer electrode layers, so their local capacity density is lower than the thicker regions.</p>
<p>The key distinction from a simple curved cell is that stepped cells have discrete thickness transitions — flat regions at different z-heights — rather than a smooth curvature. This means the separator and electrodes must be cut or folded to accommodate the transition, which introduces specific manufacturing constraints.</p>

<h2>L-shaped cells</h2>
<p>L-shaped cells are the most common non-rectangular geometry in production today. They are manufactured by building a complete rectangular electrode stack and then trimming and folding one section of it to reduce thickness in the trimmed region. Alternatively, the stack is built in two separate sections that share a common pouch enclosure.</p>
<p>The capacity is concentrated in the thicker arm of the L. The thinner arm provides additional mAh at a lower capacity-per-volume density, and serves the secondary purpose of filling an otherwise-empty corner of the enclosure. A smartwatch that uses an L-shaped cell typically places the thicker arm under the watch face and the thinner arm in the strap hinge region, gaining 15–25% additional total capacity compared to the largest rectangular cell that would fit in the watch face alone.</p>
<p><strong>Manufacturing constraints for L-shaped cells:</strong></p>
<ul>
  <li>Minimum width of either arm: ≥ 6 mm (to accommodate electrode tab and sealing margins)</li>
  <li>Transition corner radius: ≥ 2 mm (sharper corners stress the separator fold)</li>
  <li>Maximum step ratio (thicker arm thickness / thinner arm thickness): 3:1 or less for stable electrode contact</li>
  <li>Tab placement: must be on the thicker arm or at the L corner; tabs on the thin arm only create high current density at the transition</li>
</ul>

<h2>U-shaped and T-shaped cells</h2>
<p>U-shaped cells have a notch cut from the centre of one long edge, creating two "legs" joined by a bridge. The notch accommodates a component that must live in the enclosure centre — a motor hub in a smartwatch, a button mechanism in a mouse, or a speaker driver in an earbud case. T-shaped cells are similar but with the notch asymmetrically placed.</p>
<p>These geometries are more mechanically fragile than L-shaped cells because the bridge between the two legs is a stress concentration point. Internal pressure from normal swelling can cause delamination at the bridge if the bridge width is less than 8 mm. For production volumes below 50,000 pcs/month, the cost of the custom electrode cutting tooling often makes U-shaped cells uneconomical compared to using two smaller rectangular cells with a combined capacity target.</p>

<h2>Capacity and form-factor trade-offs per geometry</h2>
<table>
  <thead>
    <tr><th>Geometry</th><th>Typical capacity gain vs. best-fit rectangle</th><th>Minimum production volume for cost-effectiveness</th><th>Key mechanical risk</th></tr>
  </thead>
  <tbody>
    <tr><td>L-shaped</td><td>15–30%</td><td>20,000 pcs/month</td><td>Tab placement at transition</td></tr>
    <tr><td>U-shaped / notched</td><td>10–20% (net of notch)</td><td>50,000 pcs/month</td><td>Bridge delamination</td></tr>
    <tr><td>T-shaped</td><td>8–18%</td><td>50,000 pcs/month</td><td>Bridge + asymmetric internal pressure</td></tr>
    <tr><td>Stepped (3+ levels)</td><td>20–35%</td><td>30,000 pcs/month</td><td>Electrode fold cracking at step transitions</td></tr>
  </tbody>
</table>

<h2>Where tabs can go</h2>
<p>Tab placement in non-rectangular cells is more constrained than in standard cells. For any shaped cell, valid tab locations are:</p>
<ul>
  <li>The short edge of the thicker region (standard)</li>
  <li>The long edge of the thicker region (if space at the short edge is used for another component)</li>
  <li>The L-corner, with the tab running along the inside of the corner bend (requires a custom tab fold in the pouch)</li>
</ul>
<p>Invalid tab locations include: any edge of the thin arm, the bridge section of a U-shaped cell, and within 4 mm of any fold or corner. Tabs placed near structural stress points fail at the weld under vibration testing.</p>

<h2>Design handoff requirements</h2>
<p>When requesting a custom-shaped cell from a supplier, provide:</p>
<ol>
  <li>3D STEP file of the available battery envelope (not the product enclosure — the specific volume reserved for the battery)</li>
  <li>Maximum cell thickness per region</li>
  <li>Tab exit direction and maximum tab length</li>
  <li>Minimum capacity requirement at end of life (cycle 500, 25 °C)</li>
  <li>Charge and discharge C-rate requirements</li>
</ol>
<p>A supplier who receives this information can return a feasibility sketch within 48 hours and a formal geometry proposal within a week. This is the correct starting point for a custom-shaped battery program, and it is free — do not commit to tooling costs until you have seen and approved the geometry proposal.</p>

<nav class="article-nav">
  <a href="/blog/designing-curved-batteries-for-wearables" class="prev">&larr; Previous: Designing Curved Batteries</a>
  <a href="/blog/custom-battery-tooling-cost" class="next">Next: Custom Battery Tooling Cost &rarr;</a>
</nav>$art$,
 'Wei Zhang', 10, now() - interval '7 days', 'published'),

-- 2 of 6 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='custom-shaped-polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='wei-zhang'),
 (SELECT id FROM categories WHERE slug='industry-insights'),
 'custom-battery-tooling-cost',
 'Custom Battery Tooling: Cost Breakdown and Break-Even Analysis',
 'What tooling a custom pouch-cell geometry requires, what each die costs in 2026, and the volume calculation that determines when custom beats standard.',
 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1200&q=80',
 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1920&q=80',
 $art$<p class="lede">The phrase "custom battery" implies bespoke manufacturing, and bespoke manufacturing implies tooling investment. For product teams evaluating a custom shaped cell against an off-the-shelf alternative, the tooling cost is always the first number that appears in the conversation — and it is almost always misunderstood in both directions. Some teams overestimate it and rule out a custom cell prematurely. Others underestimate it and are surprised by the invoice. This is the honest breakdown.</p>

<h2>What tooling is actually required</h2>
<p>A custom pouch cell geometry requires four categories of tooling, each serving a distinct manufacturing function:</p>

<h3>1. Electrode coating mask / stencil</h3>
<p>The cathode and anode materials are coated onto metal foil (aluminium for cathode, copper for anode) using a slot-die or doctor-blade coater. Standard rectangular cells use the full coater width; custom shapes that have regions of different thickness require a step in the electrode coating. This step is controlled by an electrode mask or a custom coating pattern. Cost: <strong>USD 1,500–4,000</strong>. Lead time: 1–2 weeks.</p>

<h3>2. Electrode slitting and cutting die</h3>
<p>After coating, electrode sheets are cut into individual electrode pieces. Rectangular cells use a simple roller slitter; non-rectangular electrodes require a custom steel-rule die or laser-cutting programme. Steel-rule dies are cheaper for high volume (USD 2,000–5,000); laser cutting avoids tooling cost for prototypes but costs more per piece. Cost: <strong>USD 2,000–6,000</strong> for a steel-rule die. Lead time: 1–2 weeks.</p>

<h3>3. Pouch forming die</h3>
<p>The aluminium-composite laminate pouch is formed by a heated die press that creates the pocket shape into which the electrode stack fits. This is typically the most expensive individual tooling item because the die must be precision machined to hold tight tolerances on the cavity depth and corner radii. Cost: <strong>USD 5,000–18,000</strong> depending on complexity. Lead time: 2–4 weeks.</p>

<h3>4. Tab welding fixture</h3>
<p>The ultrasonic welder that bonds the electrode tabs to the external leads requires a fixture that holds the cell in correct position during welding. For custom cells with non-standard tab positions or L-shaped geometries, a custom fixture is required. Cost: <strong>USD 2,000–5,000</strong>. Lead time: 1 week.</p>

<h2>Total tooling investment</h2>
<table>
  <thead>
    <tr><th>Tooling item</th><th>Low estimate</th><th>High estimate</th><th>Lead time</th></tr>
  </thead>
  <tbody>
    <tr><td>Electrode coating mask</td><td>USD 1,500</td><td>USD 4,000</td><td>1–2 weeks</td></tr>
    <tr><td>Electrode cutting die</td><td>USD 2,000</td><td>USD 6,000</td><td>1–2 weeks</td></tr>
    <tr><td>Pouch forming die</td><td>USD 5,000</td><td>USD 18,000</td><td>2–4 weeks</td></tr>
    <tr><td>Tab welding fixture</td><td>USD 2,000</td><td>USD 5,000</td><td>1 week</td></tr>
    <tr><td><strong>Total range</strong></td><td><strong>USD 10,500</strong></td><td><strong>USD 33,000</strong></td><td><strong>3–5 weeks parallel</strong></td></tr>
  </tbody>
</table>
<p>The wide range reflects cell complexity. A simple rectangular cell in a non-standard size sits at the low end (mainly the pouch die and cutting die are different from standard). An L-shaped cell with two thickness levels and a non-standard tab position sits at the high end. A U-shaped cell with a bridge reinforcement can exceed USD 35,000 if a second pouch die is required for the bridge section.</p>

<h2>Amortisation and break-even calculation</h2>
<p>Tooling cost amortisation is simple arithmetic, but the inputs are often guessed poorly. The formula:</p>
<p><strong>Per-unit tooling premium = Total tooling cost ÷ Total lifetime volume</strong></p>
<p>Example: USD 22,000 tooling cost over a 3-year product lifetime at 15,000 units/month = 540,000 units total. Per-unit tooling premium = USD 22,000 ÷ 540,000 = USD 0.04 per unit.</p>
<p>At that volume, tooling is trivial compared to the cell unit cost (typically USD 0.80–4.00 for a small-format custom cell). The real decision is not tooling cost vs. no tooling cost — it is the capacity gain from the custom geometry vs. the equivalent capacity in a standard cell.</p>
<p>The break-even point where a custom cell is worth considering is roughly <strong>20,000 units over the product lifetime</strong> for simple shapes, and <strong>100,000 units over the product lifetime</strong> for complex geometries (U, T, multi-step). Below these volumes, the standard closest to your spec plus a spacer filler is almost always cheaper when engineering time and tooling amortisation are both included.</p>

<h2>Tooling ownership: who pays and who controls</h2>
<p>Tooling ownership determines what happens if you switch suppliers. Two models:</p>
<p><strong>Supplier-owned tooling (common in Asia):</strong> The supplier absorbs the tooling cost and recoups it through per-unit price. The cell appears cheap with no upfront fee, but the effective tooling cost is hidden in the unit price for the first 6–18 months of volume. Switching suppliers means abandoning the tooling — the new supplier must build new tooling. This creates lock-in.</p>
<p><strong>Customer-owned tooling (preferred by large OEMs):</strong> The customer pays the tooling invoice directly, owns the dies, and retains the right to move production. The supplier&#39;s unit price reflects only manufacturing cost. If the customer switches suppliers, the dies are moved (or replicated at the new facility). This model requires a higher upfront payment but provides supply chain flexibility.</p>
<p>We recommend customer-owned tooling for any program where annual volume exceeds 50,000 units and supply chain continuity is a business risk. For programs below that threshold, supplier-owned tooling with a 24-month minimum commitment is a reasonable compromise.</p>

<nav class="article-nav">
  <a href="/blog/stepped-battery-geometry" class="prev">&larr; Previous: Stepped and L-Shaped Batteries</a>
  <a href="/blog/co-design-battery-workflow" class="next">Next: Co-designing a Custom Battery &rarr;</a>
</nav>$art$,
 'Wei Zhang', 9, now() - interval '14 days', 'published'),

-- 3 of 6 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='custom-shaped-polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='wei-zhang'),
 (SELECT id FROM categories WHERE slug='technology'),
 'co-design-battery-workflow',
 'Co-designing a Custom Lithium Cell: Six Stages from Concept to Production',
 'Why custom battery projects fail when the supplier is engaged too late, and the six-stage workflow that gets a non-standard cell from 3D model to production qualification without wasted iterations.',
 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80',
 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1920&q=80',
 $art$<p class="lede">The most expensive way to develop a custom battery is to finalise the product enclosure design first and then ask a battery supplier to fit something into the remaining space. By that point, the tolerance stack is fixed, the connector position is decided, the PCB layout is committed, and the battery supplier is asked to perform a miracle in a box they were not consulted on. The result is either a compromised cell, a redesign, or a program delay. The correct approach is to engage the battery supplier at the same stage you engage your mechanical design partner.</p>

<h2>Why projects fail: engagement timing</h2>
<p>In a survey of 40 custom battery programs we reviewed over 2024–2025, the programs that required the most costly design changes shared a common pattern: the battery supplier was first contacted after the product industrial design was locked. At that stage, the product team had already committed to:</p>
<ul>
  <li>A specific enclosure volume and wall thickness</li>
  <li>A PCB layout with the battery connector in a fixed position</li>
  <li>An NTC thermistor location based on assumed cell geometry</li>
  <li>A BMS IC selected for a specific cell voltage range</li>
</ul>
<p>All four of these choices interact directly with cell geometry. Changing them after ID lock is expensive. Changing them before ID lock is free.</p>

<h2>Stage 1: Space claim (week 1–2)</h2>
<p>The battery supplier needs a 3D model of the battery envelope — the specific volume available for the cell, including the clearances required for the enclosure wall, the PCB standoffs, and the thermal interface. This is not the same as the product enclosure model. It is the battery-specific space claim: the maximum bounding box the cell can occupy in all three dimensions, with tolerances.</p>
<p>Deliverable from the OEM: STEP file of the battery envelope, maximum dimensions with ± tolerances, tab exit direction, minimum tab length, and target capacity at end of life (cycle 500).</p>
<p>Deliverable from the supplier: Feasibility note — can the target capacity fit in this envelope? If not, what capacity is achievable, and what is the gap?</p>

<h2>Stage 2: Chemistry and voltage selection (week 2–3)</h2>
<p>Once the envelope is confirmed feasible, the supplier proposes a chemistry and cell architecture. This involves:</p>
<ul>
  <li>Electrode chemistry selection (LCO, HV-LCO, NMC 111, NMC 532) based on the capacity target and cycle life requirement</li>
  <li>Voltage window (standard 4.20 V or high-voltage 4.35/4.48 V) — higher voltage increases capacity density but adds complexity to the BMS and may require different charger IC selection on the OEM side</li>
  <li>Cell architecture (number of electrode layers, electrode thickness) to match the capacity in the available thickness</li>
</ul>
<p>This stage requires chemistry specification agreement in writing — it is the basis for all subsequent testing and qualification. If the OEM later requests a voltage or chemistry change, Stage 1 and Stage 2 restart.</p>

<h2>Stage 3: Prototype fabrication and first FIT test (week 4–8)</h2>
<p>The supplier produces 10–20 prototype cells using hand-built electrodes or laser-cut electrode plates rather than production tooling. These cells are mechanically representative of the final design but electrically may differ by ± 10% in capacity from the production target. Their purpose is FIT testing — fitting in the product enclosure to verify that:</p>
<ul>
  <li>The cell fits within the space claim with adequate clearance</li>
  <li>The tab exits correctly and mates with the PCB connector</li>
  <li>The NTC thermistor mounts correctly on the cell body</li>
  <li>The cell dimensions are consistent with the mechanical design assumptions</li>
</ul>
<p>After FIT testing, the OEM provides a signed geometry approval or a list of changes required. A first-pass approval is uncommon — plan for one to two minor geometry iterations at this stage. Each iteration adds 2–3 weeks and does not require new tooling (prototypes continue to be hand-built).</p>

<h2>Stage 4: Pre-production tooling and first article inspection (week 8–16)</h2>
<p>Once the geometry is approved, the supplier builds production tooling (see the tooling cost breakdown in the related article). The first cells produced with production tooling undergo a first article inspection (FAI) covering:</p>
<ul>
  <li>Dimensional verification against the approved drawing (all critical dimensions with CMM or caliper data)</li>
  <li>Electrical parameters: OCV, capacity at C/5, internal resistance</li>
  <li>Basic abuse tests: external short, overcharge, forced discharge</li>
  <li>Mechanical tests: tab pull strength, pouch seal integrity</li>
</ul>
<p>FAI typically consumes 30–50 cells. It is not a certification — it is a production readiness check. An FAI pass means the production line is capable of making cells to the agreed drawing.</p>

<h2>Stage 5: Production qualification (week 16–24)</h2>
<p>Production qualification runs the cell through the full IEC 62133-2 + UN 38.3 test stack (see the compliance walkthrough for what this entails). The cells for qualification must come from three separate production runs — three different batches — to verify that the process is stable. Qualification takes 8–12 weeks from sample submission to final reports.</p>

<h2>Stage 6: Production transfer and ongoing control (week 24+)</h2>
<p>After qualification, the supplier establishes a control plan: which parameters are measured on every lot (OCV, IR, capacity sample), which require formal lot release (dimensional, electrical), and which trigger a deviation notification to the OEM (any parameter outside the agreed specification). The control plan is a living document — it is updated when a production change (material substitution, line reconfiguration, yield improvement) is proposed.</p>
<p><strong>The supplier must notify the OEM of any change to materials, electrode formulation, or production process that could affect cell performance or safety</strong> — even if the change appears to be an improvement. Many OEM-supplier disputes originate from undisclosed process changes that affected cell behaviour in the end product without the OEM's knowledge.</p>

<nav class="article-nav">
  <a href="/blog/custom-battery-tooling-cost" class="prev">&larr; Previous: Custom Battery Tooling Cost</a>
  <a href="/blog/flexible-battery-wearable" class="next">Next: Flexible Batteries for Wearables &rarr;</a>
</nav>$art$,
 'Wei Zhang', 11, now() - interval '21 days', 'published'),

-- 4 of 6 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='custom-shaped-polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='wei-zhang'),
 (SELECT id FROM categories WHERE slug='technology'),
 'flexible-battery-wearable',
 'Flexible Batteries for Wearables: What''s Real in 2026 and What Isn''t',
 'Two categories of "flexible battery" exist: curved rigid-pouch cells (shipping today) and true flex-electrolyte cells (still mostly research). Here is an honest assessment of each.',
 'https://images.unsplash.com/photo-1610664921890-5d5e6acf5e06?w=1200&q=80',
 'https://images.unsplash.com/photo-1610664921890-5d5e6acf5e06?w=1920&q=80',
 $art$<p class="lede">The term "flexible battery" appears in more press releases than product specifications. It covers two very different technologies — curved rigid-pouch cells, which are shipping in millions of consumer devices today, and true flex-electrolyte cells with solid or gel polymer electrolytes, which exist in laboratories and small pilot batches. Understanding the difference prevents either dismissing flexible batteries as science fiction or procuring a technology that is not yet production-ready.</p>

<h2>Category 1: Curved rigid-pouch cells (available today)</h2>
<p>A standard lithium-polymer pouch cell is made of flat electrode sheets laminated together and sealed in an aluminium-composite pouch. If the electrode stack is built around a mandrel and the pouch is formed to match, the result is a cell with a fixed curvature — typically a radius of 25–150 mm. The cell is rigid within that curvature; it does not flex further in use.</p>
<p>This is the technology behind "flexible" batteries in current smartwatches, AR glasses temples, and curved medical patches. The cell is shaped to the product, not flexible in the general sense. Minimum curvature radius for production-grade curved LiPo is approximately R25 mm (tighter is feasible but reduces cycle life due to electrode coating stress). Single-curvature designs — bent along one axis only, like a banana — are straightforward. Compound curvature (bent in two axes simultaneously, like a spherical cap) is possible but significantly more complex to manufacture and is not in volume production outside of specialised programs.</p>
<p>Performance parameters of curved rigid-pouch cells are nearly identical to equivalent flat cells: same volumetric energy density, same cycle life (typically ≥ 500 cycles at R ≥ 25 mm), same chemistry options. The capacity penalty for curvature is typically 3–8% compared to a flat cell of the same overall envelope, because some volume near the edges of the bend cannot be filled with active electrode material.</p>

<h2>Category 2: True flex-electrolyte cells (partially available)</h2>
<p>A true flexible battery uses a solid-polymer or gel-polymer electrolyte instead of liquid carbonate electrolyte. Because the electrolyte is a solid or semi-solid, it can flex without leaking. The electrode materials can then be printed or coated onto flexible metal-foil or carbon-nanotube current collectors, creating a cell that genuinely bends in use.</p>
<p>The technology readiness levels (TRL) in 2026:</p>
<ul>
  <li><strong>Gel-polymer electrolyte cells (semi-flex):</strong> TRL 7–8. These cells use a plasticised polymer gel that holds liquid carbonate electrolyte in a matrix. They flex to R ≥ 50 mm repeatedly without significant performance loss. Several manufacturers in South Korea and Japan are selling them in small quantities for smart card, electronic textile, and thin-film IoT applications. Energy density is 50–70% of equivalent liquid-electrolyte LiPo.</li>
  <li><strong>All-solid-polymer electrolyte cells (true flex):</strong> TRL 4–5. Research-grade performance, not in commercial production for consumer electronics. Energy density is significantly below liquid-electrolyte cells; ionic conductivity at room temperature is too low for most wearable applications without heating.</li>
  <li><strong>Printed flexible cells:</strong> TRL 3–4. Demonstrated in research, not in supply chains. Often used for single-use medical sensor patches and RFID-adjacent applications where a thin, flat, low-capacity cell is needed — but cycle life is typically < 50 cycles and capacity < 5 mAh.</li>
</ul>

<h2>Where each category makes sense in 2026</h2>
<table>
  <thead>
    <tr><th>Application</th><th>Best current fit</th><th>Reason</th></tr>
  </thead>
  <tbody>
    <tr><td>Smartwatch, health band</td><td>Curved rigid-pouch (Category 1)</td><td>High capacity, proven cycle life, available supply chain</td></tr>
    <tr><td>AR glasses temple</td><td>Curved rigid-pouch</td><td>Thin profile, established production</td></tr>
    <tr><td>Smart ring</td><td>Curved rigid-pouch or standard pouch</td><td>Volume too small for flex electrolyte economics</td></tr>
    <tr><td>Electronic textile patch (≤ 10 mAh)</td><td>Gel-polymer semi-flex (Category 2)</td><td>Washability requirement, single-curvature bending in use</td></tr>
    <tr><td>Medical skin patch (single-use)</td><td>Printed flexible cell or standard LiPo depending on capacity</td><td>Conformality requirement but low cycle count</td></tr>
    <tr><td>Smart card, paper electronics</td><td>Gel-polymer or printed cell</td><td>Ultra-thin (< 0.5 mm) requirement, low capacity need</td></tr>
  </tbody>
</table>

<h2>The honest 2027–2028 outlook</h2>
<p>Gel-polymer electrolyte cells (Category 2, semi-flex) will move into broader commercial availability over 2027–2028, with more suppliers qualifying the technology and energy density improving as electrode loading optimisation matures. Expect energy density to close to 70–80% of liquid-electrolyte equivalents by 2028.</p>
<p>All-solid-polymer cells for wearables remain unlikely before 2030 at the consumer electronics price point, primarily because room-temperature ionic conductivity constraints require either elevated operating temperature or a catalyst that adds cost. The solid-state progress you read about in automotive and large-format cells does not directly translate to consumer wearable cells because the solid electrolyte thickness required for small cells creates higher area-specific impedance than the EV application can tolerate.</p>
<p>For programs launching in 2026–2027, curved rigid-pouch cells are the correct choice for any application requiring > 50 mAh and > 100 cycles. If your product needs genuine in-use flexibility (e.g. a wristband that flexes as the wrist bends, not just a band with a pre-curved cell), discuss with a supplier whether a gel-polymer cell meets your capacity and cycle requirements before designing around it.</p>

<nav class="article-nav">
  <a href="/blog/co-design-battery-workflow" class="prev">&larr; Previous: Co-designing a Custom Battery</a>
  <a href="/blog/smart-ring-battery-design" class="next">Next: Battery Design for Smart Rings &rarr;</a>
</nav>$art$,
 'Wei Zhang', 10, now() - interval '28 days', 'published'),

-- 5 of 6 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='custom-shaped-polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='wei-zhang'),
 (SELECT id FROM categories WHERE slug='technology'),
 'smart-ring-battery-design',
 'Battery Design for Smart Rings: Geometry, Chemistry and Power Budget',
 'The geometry constraints of a ring form factor, what capacity is realistically achievable, why high-voltage LCO wins, and how to design a wireless-charging BMS for a sub-2 cm³ envelope.',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1920&q=80',
 $art$<p class="lede">A smart ring is the most constrained battery design challenge in consumer electronics. The battery must fit into a ring-shaped shell that is worn on a finger, which means: a maximum outer diameter of 22–24 mm, an inner diameter of 17–22 mm (depending on ring size), a channel cross-section of roughly 2–4 mm wide by 2–3 mm tall, and a circumferential arc length of about 70–75 mm for a full ring or 30–40 mm for a typical open-arc battery placement. The total available battery volume is typically 150–500 mm³. At standard LiPo volumetric energy density, that is 25–80 mAh.</p>

<h2>The geometry problem in numbers</h2>
<p>Consider a size 8 ring (inner diameter 18.2 mm). The battery channel in a typical smart ring design is approximately:</p>
<ul>
  <li>Arc length available: 60 mm (∼270° arc, leaving space for the PCB module)</li>
  <li>Channel width: 3.5 mm</li>
  <li>Channel height: 2.5 mm</li>
</ul>
<p>Maximum battery volume: 60 × 3.5 × 2.5 = 525 mm³ (theoretical). Realistic battery volume (after manufacturing margins and encapsulation): approximately 350–400 mm³.</p>
<p>At a volumetric energy density of 500 Wh/L (achievable with HV-LCO at 4.48 V), this yields a maximum cell capacity of approximately 0.4 cm³ × 500 Wh/L = 0.2 Wh ÷ 3.85 V = ~52 mAh. At standard LCO (4.20 V, ~400 Wh/L), the same volume yields ~40 mAh.</p>

<h2>Why high-voltage LCO wins</h2>
<p>In a ring, every mAh of capacity gain has outsized runtime impact because the total is so small. The difference between 40 mAh and 52 mAh at the same average current draw is a 30% runtime extension — the difference between a 18-hour battery and a 24-hour battery. This makes HV-LCO at 4.45–4.48 V the default chemistry choice for smart rings, despite the additional BMS complexity required.</p>
<p>HV-LCO requires a precision charge voltage reference: the tolerance on the 4.48 V ceiling should be ± 10 mV or less, otherwise chronic overcharge accelerates electrolyte decomposition. This is achievable with a dedicated charge IC (e.g., Microchip MCP73831 with external voltage trim, or TI BQ25100 configured for HV) but requires careful PCB layout and temperature characterisation of the voltage reference component.</p>

<h2>Cell architecture for ring geometry</h2>
<p>Two cell architectures are used in smart rings today:</p>
<p><strong>Curved rectangular pouch (arc-shaped):</strong> A standard LiPo pouch is curved along its long axis to follow the ring arc. Tab exits at one short end. The cell is pre-curved during manufacturing to a radius matching the ring&#39;s inner radius + half the battery channel width. This is the simpler manufacturing approach and is used in most first-generation smart rings. Minimum curve radius for this application: R10–12 mm (tight, but within limits for a single-curvature 2.5 mm thick cell).</p>
<p><strong>Annular or arc-segment cell:</strong> A custom-tooled cell where the electrode stack itself is curved circumferentially (not just the pouch). This requires dedicated electrode cutting tooling (arc-shaped electrodes rather than rectangular) and is significantly more expensive to develop. It achieves better volumetric efficiency than a curved rectangular cell (fewer dead corners) but is only cost-effective at volumes above 200,000 units/year.</p>

<h2>Wireless charging and BMS design in a ring</h2>
<p>Smart rings almost universally use wireless (Qi or proprietary) charging because the ring surface cannot accommodate a reliable contact charging solution for a device worn on a finger. This has two BMS implications:</p>
<p><strong>1. Higher thermal management burden.</strong> Wireless charging at the coil generates heat in a very small enclosure. A 30 mW–50 mW receiver coil in a 3 cm³ ring shell can raise the cell temperature by 8–12 °C above ambient during charging. The BMS must include a temperature-based charge rate reduction that activates above 38 °C to protect both the cell and the wearer from a warm ring.</p>
<p><strong>2. No mechanical charging connector failures.</strong> Wireless charging eliminates the most common mechanical failure mode in small wearables — connector fretting wear. For a device expected to last 2+ years with daily charging, this is a meaningful reliability improvement over contact charging.</p>

<h2>Practical power budget</h2>
<p>The power budget determines whether 40–52 mAh is enough. For a representative health-monitoring smart ring with continuous HR and SpO₂ sensing:</p>
<table>
  <thead>
    <tr><th>Function</th><th>Typical average current</th><th>Duty cycle</th><th>Average contribution</th></tr>
  </thead>
  <tbody>
    <tr><td>MCU (active processing)</td><td>4 mA</td><td>5%</td><td>0.20 mA</td></tr>
    <tr><td>MCU (sleep)</td><td>0.01 mA</td><td>95%</td><td>0.01 mA</td></tr>
    <tr><td>HR sensor (continuous)</td><td>1.5 mA</td><td>100%</td><td>1.50 mA</td></tr>
    <tr><td>SpO₂ sensor (periodic)</td><td>8 mA</td><td>10%</td><td>0.80 mA</td></tr>
    <tr><td>BLE (advertising)</td><td>5 mA</td><td>4%</td><td>0.20 mA</td></tr>
    <tr><td>BLE (connected / data sync)</td><td>10 mA</td><td>2%</td><td>0.20 mA</td></tr>
    <tr><td><strong>Total average current</strong></td><td colspan="2"></td><td><strong>~2.9 mA</strong></td></tr>
  </tbody>
</table>
<p>At 2.9 mA average draw: 50 mAh ÷ 2.9 mA × efficiency factor (0.85) = ~14.7 hours between charges. This aligns with the overnight-charge pattern typical of smart ring products. Adding a 25% ageing margin (end-of-life at 75% of initial capacity): 50 × 0.75 ÷ 2.9 × 0.85 = ~11 hours at end-of-life — still a viable full-day product.</p>

<nav class="article-nav">
  <a href="/blog/flexible-battery-wearable" class="prev">&larr; Previous: Flexible Batteries for Wearables</a>
  <a href="/blog/custom-battery-reliability-testing" class="next">Next: Reliability Testing for Custom Cells &rarr;</a>
</nav>$art$,
 'Wei Zhang', 10, now() - interval '35 days', 'published'),

-- 6 of 6 ─────────────────────────────────────────────────────────────
((SELECT id FROM pillar_pages WHERE slug='custom-shaped-polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='mei-yang'),
 (SELECT id FROM categories WHERE slug='certifications'),
 'custom-battery-reliability-testing',
 'Reliability Testing for Custom-Shaped Lithium Cells',
 'Standard IEC tests do not fully cover non-rectangular cell geometries. Here is the additional test matrix — bend, torsion, peel — and how to structure a first-article inspection protocol for custom cells.',
 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80',
 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1920&q=80',
 $art$<p class="lede">IEC 62133-2 and UN 38.3 were written around rectangular cells. The vibration profile, the crush geometry, and the drop orientation are all calibrated for a rectangular prism. When a cell is L-shaped, curved, or has a stepped cross-section, standard tests may not stress the high-risk areas of the custom geometry — while simultaneously over-testing areas that standard tests cover well but custom geometry tests don&#39;t require. A custom-shaped cell program needs a supplementary test protocol that addresses the shape-specific failure modes that standard tests miss.</p>

<h2>Shape-specific failure modes not covered by standard tests</h2>
<p>Three failure modes are unique or significantly elevated for non-rectangular geometries:</p>

<h3>1. Fold-line delamination (stepped and L-shaped cells)</h3>
<p>At the transition between thick and thin regions in a stepped or L-shaped cell, the electrode stack is folded or stacked to achieve the thickness step. This fold is a stress concentration: during mechanical flexing in the product enclosure, repeated bending at the fold line can cause separator delamination or tab debonding. Standard IEC 62133-2 vibration and shock tests do not reproduce the directional bending stress at this specific location.</p>
<p><strong>Supplementary test: Cyclic bend test at the fold.</strong> The cell is held rigidly at the thick region and cyclically bent ±2° about the fold line at 0.5 Hz for 1,000 cycles. Pass criterion: no change in OCV, IR, or capacity exceeding 3% from the pre-test baseline; no visible delamination visible by X-ray or cross-sectional analysis.</p>

<h3>2. Tab joint fatigue (curved cells)</h3>
<p>In a curved cell, the electrode tab must transition from the curved electrode stack to a flat FPC or PCB connector. This transition creates a bending moment at the weld joint between the tab and the current collector. In consumer wearables, this joint experiences hundreds of thousands of small stress cycles from product handling (putting on and taking off a watch, for example). Standard tab pull tests check static strength; they do not check fatigue resistance.</p>
<p><strong>Supplementary test: Tab fatigue test.</strong> The tab is cyclically deflected ± 3 mm perpendicular to the tab plane at 1 Hz for 50,000 cycles. Pass criterion: weld resistance increase < 5 mΩ from baseline; no cracking visible at 10× optical magnification; no OCV change.</p>

<h3>3. Pouch seal integrity at geometry transitions (L, U, T cells)</h3>
<p>The pouch sealing press applies uniform pressure along straight sealing lines. At corners and notches in a custom pouch geometry, the sealing die must accommodate the angle, and sealing pressure is often lower at the corner than along straight edges. Imperfect corner seals are a significant source of electrolyte leakage in custom geometries after thermal cycling.</p>
<p><strong>Supplementary test: Thermal cycling with seal integrity verification.</strong> Cells are cycled between −20 °C and +60 °C, 30 cycles, dwell 1 hour at each extreme. After cycling, cell mass is measured and compared to pre-test mass (electrolyte loss through a leaking seal produces measurable mass loss). X-ray inspection of corner seals is performed. Pass criterion: mass loss < 0.5%, no visible seal opening.</p>

<h2>Standard tests that still apply (and their application to custom geometries)</h2>
<p>The full IEC 62133-2 test matrix applies regardless of cell geometry — the custom shape does not exempt the cell from any standard test. However, the test orientation needs to be adapted for shaped cells. Specifically:</p>
<ul>
  <li><strong>Drop test:</strong> Shaped cells must be dropped on their centre of gravity, which is not always the centroid of the bounding box. Calculate the centre of mass of the actual cell geometry and verify that the drop fixture positions the cell correctly.</li>
  <li><strong>Crush test:</strong> Apply the crush force on the thickest region of the cell (where failure is most consequential energetically). The thin region of an L-shaped cell will deform before the thick region if the crush plate is not positioned over the thick region.</li>
  <li><strong>Thermal abuse:</strong> The 130 °C soak in IEC 62133-2 clause 7.3.6 should be run with the cell oriented so that the thickest region faces the heat source. This ensures the most energetically significant region reaches thermal abuse conditions, not just the thin arm.</li>
</ul>

<h2>First article inspection protocol for custom cells</h2>
<p>A first article inspection (FAI) for a custom-shaped cell should include:</p>
<table>
  <thead>
    <tr><th>Check</th><th>Method</th><th>Acceptance criterion</th><th>Sample size</th></tr>
  </thead>
  <tbody>
    <tr><td>Dimensional — all critical dimensions</td><td>CMM or digital caliper at 5 measurement points per dimension</td><td>Within ± 0.2 mm (or drawing tolerance if tighter)</td><td>30 cells</td></tr>
    <tr><td>Tab position and alignment</td><td>Optical measurement vs. approved drawing</td><td>± 0.5 mm from nominal</td><td>30 cells</td></tr>
    <tr><td>OCV at 50% SoC</td><td>4-wire measurement</td><td>Within ± 20 mV of nominal</td><td>100 cells</td></tr>
    <tr><td>DC-IR at 1 kHz</td><td>AC impedance bridge</td><td>Within ± 15% of nominal IR</td><td>100 cells</td></tr>
    <tr><td>Capacity at C/5, 25 °C</td><td>Formation tester</td><td>Within ± 3% of nominal capacity</td><td>30 cells</td></tr>
    <tr><td>Pouch seal — visual and leak test</td><td>Visual + dye-penetrant at corners</td><td>No visible pinholes; no dye ingress</td><td>30 cells</td></tr>
    <tr><td>X-ray inspection — electrode alignment</td><td>2D X-ray at transition regions</td><td>Electrode overlap within spec; no fold tears</td><td>10 cells</td></tr>
    <tr><td>Tab weld strength</td><td>Pull test per IEC 62133-2 annex</td><td>≥ 5 N per tab on smallest tab size</td><td>10 cells</td></tr>
  </tbody>
</table>

<h2>Documentation requirements per program type</h2>
<p>The documentation retained from custom-cell qualification varies by the end application. For guidance:</p>
<ul>
  <li><strong>Consumer electronics (IEC 62133-2 basis):</strong> FAI report, IEC 62133-2 test report, UN 38.3 test summary, dimensional drawing with approval signature, production control plan. Retained for 5 years.</li>
  <li><strong>Medical device (ISO 13485 basis):</strong> All consumer docs plus: design FMEA specific to the cell geometry, process FMEA for the non-standard production steps, risk management file cross-reference per ISO 14971, batch release certificate per lot. Retained for 10 years minimum.</li>
  <li><strong>Defence / aerospace:</strong> All medical docs plus: material certificates per AS9100D, serialised traceability per cell, ITAR assessment of cell BOM. Retained for 15 years minimum.</li>
</ul>
<p>Suppliers who cannot provide the relevant documentation tier for your application classification are not qualified to be your production source, regardless of cell performance data. In a regulated industry, the paperwork is as important as the cell.</p>

<nav class="article-nav">
  <a href="/blog/smart-ring-battery-design" class="prev">&larr; Previous: Battery Design for Smart Rings</a>
  <a href="/products/custom-shaped-polymer-lithium-battery" class="next">Explore Custom-Shaped Cell Products &rarr;</a>
</nav>$art$,
 'Mei Yang', 11, now() - interval '42 days', 'published')

ON CONFLICT (slug) DO NOTHING;


-- =====================================================================
-- BATCH 3 — 7 new cluster articles for the Coin Steel-Shell pillar
-- (post-product-line audit). Topics chosen to fill obvious gaps:
-- comparison primer, cycle life, shelf life, charging IC selection,
-- mounting options, safety/abuse behaviour, BLE beacon application.
-- After this batch the coin pillar carries 14 cluster articles —
-- comparable depth to custom-shape (13) and polymer (16).
--
-- Article briefs:
--
-- 1. cr-vs-lir-vs-ml-coin-cell-comparison
--    Focus: CR2032 vs LIR2032 vs ML2032 head-to-head. Voltage,
--    capacity, cycle life, cost, application fit. Author: Lin Zhao.
--
-- 2. coin-cell-cycle-life-curves
--    Focus: rechargeable coin cell cycle life. What 500 / 1,000 /
--    2,000 cycle ratings mean. Author: Lin Zhao.
--
-- 3. coin-cell-self-discharge-shelf-life
--    Focus: 5-year shelf-life math for coin cells. Author: Lin Zhao.
--
-- 4. coin-cell-charging-ic-design
--    Focus: charger IC selection for LIR / ML coin cells. MCP73831,
--    BQ24210, CN3052 trade-offs. Author: Lin Zhao.
--
-- 5. coin-cell-mounting-holder-tab-smd
--    Focus: holder vs solder-tab vs SMD reflow mounting choice.
--    Author: Lin Zhao.
--
-- 6. coin-cell-safety-abuse-behavior
--    Focus: short-circuit, crush, vent behaviour. Author: Mei Yang.
--
-- 7. ble-beacon-ml-coin-cell-design
--    Focus: 5-year BLE beacon design with ML2032. Author: Lin Zhao.
-- =====================================================================
INSERT INTO articles (pillar_id, author_id, category_id, slug, title, excerpt, cover_url, hero_image, content, author, reading_minutes, published_at, status) VALUES

-- ---------- 1. CR vs LIR vs ML head-to-head ----------
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='lin-zhao'),
 (SELECT id FROM categories WHERE slug='technology'),
 'cr-vs-lir-vs-ml-coin-cell-comparison',
 'CR2032 vs LIR2032 vs ML2032: A Head-to-Head Coin Cell Comparison',
 'Three families share the 20 mm coin form factor but solve different problems. A practical side-by-side on voltage, capacity, cycle life, reflow tolerance and cost.',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
 $art$<p class="lede">Three coin cell families share the 20 mm diameter form factor, and engineers regularly ask which one fits their product. The short answer: CR is primary (one-shot), LIR is high-energy rechargeable, and ML is reflow-and-forget rechargeable. The long answer below.</p>

<h2>The three platforms at a glance</h2>
<p>All three are 20 mm diameter, 3.2 mm tall coin cells with stainless-steel hermetic cans. They use different cathode chemistries, which is why they behave so differently:</p>
<table class="spec-table">
  <thead><tr><th>Parameter</th><th>CR2032</th><th>LIR2032</th><th>ML2032</th></tr></thead>
  <tbody>
    <tr><td>Chemistry</td><td>Li-MnO2 primary</td><td>Li-Co rechargeable</td><td>Li-Mn rechargeable</td></tr>
    <tr><td>Nominal voltage</td><td>3.0 V</td><td>3.7 V</td><td>3.0 V</td></tr>
    <tr><td>Charge cutoff</td><td>n/a</td><td>4.20 V</td><td>3.10 V</td></tr>
    <tr><td>Capacity</td><td>225 mAh</td><td>40 mAh</td><td>65 mAh</td></tr>
    <tr><td>Cycle life</td><td>Single use</td><td>500 cycles</td><td>1,000 cycles</td></tr>
    <tr><td>Self-discharge</td><td>&lt; 1% / yr</td><td>&lt; 5% / yr</td><td>&lt; 2% / yr</td></tr>
    <tr><td>Reflow tolerance</td><td>No</td><td>No</td><td>Yes (260 °C peak)</td></tr>
    <tr><td>Operating range</td><td>-30 to +60 °C</td><td>-20 to +60 °C</td><td>-40 to +85 °C</td></tr>
    <tr><td>Typical price (USD)</td><td>0.10 – 0.35</td><td>0.40 – 0.90</td><td>0.80 – 2.20</td></tr>
  </tbody>
</table>
<p>We make LIR and ML rechargeable cells; we do not produce primary CR cells. CR2032 is included in the table because every engineer asks how the rechargeable variants compare. If your product needs CR (10-year primary life, no recharge circuit), the right path is a different supplier.</p>

<h2>How to choose between LIR and ML</h2>
<p>Once you have committed to a rechargeable platform, the LIR vs ML choice is driven by three factors: voltage, manufacturing path, and lifecycle.</p>
<h3>Voltage matters more than capacity</h3>
<p>LIR runs at 3.7 V nominal. ML runs at 3.0 V nominal. If your MCU and radio sit in a 3.0 to 3.3 V power tree, ML drops in without a buck converter — saving cost and BoM. If your design assumes 3.7 V (a Li-Po replacement scenario, e.g. swapping out a small Li-Po for a wider operating window), LIR is the answer.</p>
<h3>Manufacturing path matters for sealed designs</h3>
<p>ML survives standard lead-free reflow at 260 °C peak, so it can be SMD-mounted onto the PCB and flow through your normal SMT line. LIR cannot — its electrolyte is reflow-incompatible. For products that should never be opened (BLE beacons, smart cards, sealed environmental sensors), ML wins because the cell becomes a pick-and-place component. For products with a battery door, either platform works.</p>
<h3>Lifecycle expectation matters for warranty</h3>
<p>ML is rated for 1,000 cycles to 80% capacity; LIR for 500 cycles. In practice we routinely see ML cells in 5-year deployments still holding 70% of original capacity, while LIR cells in the same conditions degrade faster because the LCO chemistry is more sensitive to high SOC dwell time. If the device sits at 100% charge for long periods (e.g. a smart card on a desk), ML is more forgiving.</p>

<h2>Where each one wins</h2>
<p><strong>CR2032 wins:</strong> remote controls, fitness trackers without a recharge path, key fobs, smoke alarm RTC backup, automotive TPMS, smart wallet trackers. Anywhere primary single-use is acceptable and the device is opened to swap the cell.</p>
<p><strong>LIR2032 wins:</strong> wearable accessories with a Li-Po pouch primary battery and a backup coin, smart card with battery, drop-in upgrade to a CR2032 socket where the device adds in-circuit recharging, BLE locator tags with a USB-C charge port.</p>
<p><strong>ML2032 wins:</strong> SMD-mounted RTC retention on industrial PCBs, BLE beacon with sealed housing, deployable environmental sensor, smart-meter calibration retention, smart card with reflow-mounted cell. Anywhere the device is sealed and the recharge cadence is occasional.</p>

<h2>What we ship</h2>
<p>Our coin cell line covers LIR2032, LIR2025, LIR2450, ML2032, ML2430 and ML2016 in standard catalogue. Custom diameters between 6 mm and 24 mm available with 50,000 unit minimum. All cells ship with UN 38.3 test summary, IEC 62133-2 declaration of conformity, and MSDS in English. ATEX Zone 2 variants available on a 16-week lead time.</p>

<nav class="article-nav">
  <a href="/blog/lir-vs-ml-coin-cell-which-to-choose" class="prev">&larr; Previous: LIR vs ML — the original primer</a>
  <a href="/blog/coin-cell-cycle-life-curves" class="next">Next: Cycle Life of Rechargeable Coin Cells &rarr;</a>
</nav>$art$,
 'Lin Zhao', 8, now() - interval '4 days', 'published'),

-- ---------- 2. Cycle life of rechargeable coin cells ----------
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='lin-zhao'),
 (SELECT id FROM categories WHERE slug='technology'),
 'coin-cell-cycle-life-curves',
 'Cycle Life of Rechargeable Coin Cells: What 500, 1,000 and 2,000 Cycle Ratings Mean',
 'A 1,000-cycle datasheet number depends on four conditions you cannot read from the spec sheet. Here is how to translate the rating into expected service life in your product.',
 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
 $art$<p class="lede">When a coin cell datasheet says "1,000 cycles to 80% capacity", four hidden conditions decide whether you will see that number in the field or half of it. Three of those four are under your control as the device designer. Read on for the practical translation.</p>

<h2>What the datasheet number actually means</h2>
<p>Cycle life ratings on rechargeable coin cells follow IEC 61960 conventions: charge to nominal cutoff (4.20 V for LIR, 3.10 V for ML), discharge at 0.2C to nominal end voltage (3.0 V for LIR, 2.0 V for ML), measure capacity. Repeat. The cycle count at which capacity falls below the threshold (typically 80% of fresh) is reported.</p>
<p>The four conditions baked into that rating:</p>
<ol>
  <li><strong>Charge rate</strong> — usually 0.2C (slow) for the test, but real products often charge at 0.5C or 1C.</li>
  <li><strong>Discharge depth</strong> — usually 100% DoD for the test, but real products often run shallower (10-30% DoD per cycle).</li>
  <li><strong>Temperature</strong> — usually 25 °C ± 2 °C for the test, but real products see 5-50 °C ambient.</li>
  <li><strong>Rest interval</strong> — usually no rest between cycles for the test, but real products dwell at 100% SOC for hours or days.</li>
</ol>
<p>Each of those four either extends or shortens the cycle count you actually see.</p>

<h2>What real-world conditions do to the number</h2>
<table class="spec-table">
  <thead><tr><th>Deviation from datasheet</th><th>Effect on cycle life</th></tr></thead>
  <tbody>
    <tr><td>Charge at 1C instead of 0.2C</td><td>-30 to -45%</td></tr>
    <tr><td>Charge at 2C</td><td>-50 to -65%</td></tr>
    <tr><td>Operate at 45 °C ambient (vs 25 °C)</td><td>-25 to -40%</td></tr>
    <tr><td>Operate at 60 °C ambient</td><td>-50 to -70%</td></tr>
    <tr><td>Float at 100% SOC for &gt; 12 h between use</td><td>-15 to -25%</td></tr>
    <tr><td>Use only 30% DoD per cycle</td><td>+200 to +400% (longer life)</td></tr>
    <tr><td>Charge cutoff +50 mV (e.g. LIR 4.25 V)</td><td>-40 to -55%</td></tr>
  </tbody>
</table>
<p>The shallow-DoD bonus is large — designers who only use 30% of the cell capacity per cycle routinely see 3-4× the rated cycle life. This is why ML coin cells in BLE beacons (where the daily energy consumption is a few percent of cell capacity) consistently outlive their nominal 1,000-cycle rating and reach 2,500-3,000 effective cycles.</p>

<h2>The four design knobs</h2>
<h3>1. Cap the charge rate</h3>
<p>If the device has a recharge path, set the charging IC to 0.2C maximum unless thermal margin and time-to-full constraints force you higher. For a 65 mAh ML2032 that is 13 mA charge current. Most charger ICs we recommend (MCP73831, CN3052) default to higher rates; you have to program them down with the ISET resistor.</p>
<h3>2. Shrink the DoD</h3>
<p>If your power budget allows, run the cell between 30% and 80% SOC instead of 0% to 100%. The middle SOC band is where the cathode is most stable. This is easy on rechargeable coin cells because the capacity is small relative to most embedded device power needs.</p>
<h3>3. Block charging when hot</h3>
<p>Use the charging IC's NTC input (or have firmware monitor the cell temperature via an external thermistor) and inhibit charging above 45 °C. Almost all the high-temperature cycle-life loss comes from charging at temperature, not discharging at temperature.</p>
<h3>4. Avoid 100% SOC dwell</h3>
<p>If the device sits idle for hours at full charge, the cell ages calendar-wise on top of cycle-wise. For applications like smart cards (charged once a week, idle the rest of the time), tune the firmware to charge to 90% during weekly top-ups rather than 100%. This single change extends cycle life by 15-25% in our measurement data.</p>

<h2>What we measure on every lot</h2>
<p>Each production lot is sampled for an accelerated cycle-life test: 200 cycles at 1C charge / 0.5C discharge, 25 °C, 100% DoD. The lot must clear 90% of fresh capacity at C200 to release. This is tougher than the datasheet conditions, so a passing lot reliably hits the rated life under the actual datasheet conditions in customer use.</p>
<p>For medical and aerospace customers we extend this to 500 cycles per lot at customer-specified conditions. Adds 6 weeks to lead time but produces a lot-specific cycle-life curve that the customer can submit with their device technical file.</p>

<nav class="article-nav">
  <a href="/blog/cr-vs-lir-vs-ml-coin-cell-comparison" class="prev">&larr; Previous: CR vs LIR vs ML head-to-head</a>
  <a href="/blog/coin-cell-self-discharge-shelf-life" class="next">Next: Coin Cell Self-Discharge & Shelf Life &rarr;</a>
</nav>$art$,
 'Lin Zhao', 7, now() - interval '11 days', 'published'),

-- ---------- 3. Self-discharge / 5-year shelf life ----------
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='lin-zhao'),
 (SELECT id FROM categories WHERE slug='technology'),
 'coin-cell-self-discharge-shelf-life',
 'Coin Cell Self-Discharge: Doing the 5-Year Shelf Life Math',
 'How rechargeable coin cells lose charge sitting on a warehouse shelf, what determines the rate, and how to plan inventory rotation that keeps your devices customer-ready.',
 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
 $art$<p class="lede">Coin cells lose capacity sitting on a shelf even when nobody touches them. The rate depends on chemistry, storage conditions, and the SOC the cell was shipped at. For products with retail-channel inventory cycles of 6 to 18 months, self-discharge is often a bigger constraint than cycle life.</p>

<h2>Self-discharge by chemistry</h2>
<p>Three numbers worth memorising for the rechargeable coin cells we ship:</p>
<table class="spec-table">
  <thead><tr><th>Cell</th><th>Self-discharge at 25 °C</th><th>Self-discharge at 40 °C</th><th>Capacity at year 5</th></tr></thead>
  <tbody>
    <tr><td>LIR2032</td><td>4 to 6% / yr</td><td>10 to 15% / yr</td><td>65 to 75%</td></tr>
    <tr><td>LIR2450</td><td>3 to 5% / yr</td><td>8 to 12% / yr</td><td>70 to 80%</td></tr>
    <tr><td>ML2032</td><td>1 to 2% / yr</td><td>4 to 6% / yr</td><td>85 to 92%</td></tr>
    <tr><td>ML2430</td><td>1 to 2% / yr</td><td>4 to 6% / yr</td><td>85 to 92%</td></tr>
  </tbody>
</table>
<p>ML beats LIR substantially on shelf life because the Li-MnO2 cathode is more thermodynamically stable than LCO at the lower cell voltage (3.0 V vs 3.7 V nominal). For long-term storage applications the platform choice almost always lands on ML.</p>

<h2>Why temperature is the dominant variable</h2>
<p>Self-discharge follows an Arrhenius relationship — every 10 °C increase roughly doubles the rate. A cell shipped at 30% SOC and stored at 25 °C for 5 years holds 75% capacity. The same cell stored at 35 °C for 5 years holds 55%. At 45 °C the same 5 years lands at 35% — below the threshold most products need to function.</p>
<p>Practical implication: warehouse temperature matters more than nameplate self-discharge. If your distribution chain includes summer-month container ships through Suez (where ambient inside the container can exceed 50 °C for weeks), the cell needs to be ML and the inventory rotation plan needs to assume 6 month maximum dwell, not 18.</p>

<h2>Why ship-out SOC matters</h2>
<p>Cells shipped at 100% SOC age calendar-wise faster than cells shipped at 30% SOC. The cathode is most stable in the middle of its voltage window. Counter-intuitively, the customer who receives a cell at 30% SOC and uses 70% of it before recharging gets longer total service life than the customer who receives at 100% SOC and runs it down to 30% before recharging.</p>
<p>Our standard ship-out SOC for ML and LIR coin cells is 30% ± 5%. We document this on the carton and the test report. Customers who need 100% SOC at receipt (typical for distributors who consumer-package and resell) get a separate SKU with a higher unit price and a shorter inventory rotation requirement.</p>

<h2>The 5-year shelf life math, worked</h2>
<p>For a smart-meter calibration retention application using ML2430 (110 mAh nominal):</p>
<ol>
  <li>Ship at 30% SOC = 33 mAh delivered</li>
  <li>Storage 18 months at 30 °C average = -2.7% of capacity = -3 mAh = 30 mAh remaining at install</li>
  <li>Calibration retention current = 0.5 µA average</li>
  <li>Available time = 30 mAh / 0.5 µA = 60,000 hours = 6.8 years</li>
  <li>De-rate by 30% for cathode ageing over 5 years in service = 4.7 effective years</li>
</ol>
<p>The 4.7 year service life sits below the 10-year product target — the firmware schedules a recharge top-up every 18 months to bring SOC back to 80% during normal calibration cycles. Without that top-up, the device would need a larger cell (ML2450 at 200 mAh) to clear 10 years.</p>

<h2>What we recommend</h2>
<p>For inventory cycles up to 12 months: LIR is fine, ship at 30% SOC, store below 30 °C.</p>
<p>For inventory cycles 12 to 36 months: ML is the better default, ship at 30% SOC, store below 35 °C.</p>
<p>For inventory cycles &gt; 36 months: ML at 30% SOC, store below 25 °C, plan for inventory rotation every 24 months as a safety margin against high-temperature distribution events you cannot control.</p>

<nav class="article-nav">
  <a href="/blog/coin-cell-cycle-life-curves" class="prev">&larr; Previous: Coin Cell Cycle Life Curves</a>
  <a href="/blog/coin-cell-charging-ic-design" class="next">Next: Coin Cell Charging IC Design &rarr;</a>
</nav>$art$,
 'Lin Zhao', 7, now() - interval '17 days', 'published'),

-- ---------- 4. Charging IC selection ----------
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='lin-zhao'),
 (SELECT id FROM categories WHERE slug='technology'),
 'coin-cell-charging-ic-design',
 'Coin Cell Charging IC Design: MCP73831, BQ24210 and the Trade-Offs',
 'A practical guide to selecting and configuring a charging IC for a 40 to 200 mAh rechargeable coin cell — current limit, voltage threshold, NTC integration, quiescent draw.',
 'https://images.unsplash.com/photo-1532288147748-cccef7a3aaa1?w=1200&q=80',
 'https://images.unsplash.com/photo-1532288147748-cccef7a3aaa1?w=1920&q=80',
 $art$<p class="lede">A 40 to 200 mAh rechargeable coin cell has different charging requirements from a 1,000 mAh Li-Po pouch. The off-the-shelf charger IC catalogue is dominated by Li-Po-class parts; the few that support sub-100 mAh cells need careful configuration to avoid over-charge or thermal abuse.</p>

<h2>The shortlist</h2>
<table class="spec-table">
  <thead><tr><th>Part</th><th>Min charge current</th><th>Cell voltage support</th><th>NTC input</th><th>Quiescent</th><th>Package</th></tr></thead>
  <tbody>
    <tr><td>Microchip MCP73831</td><td>15 mA</td><td>4.20 V (LIR), 3.10 V (ML w/ resistor div)</td><td>No</td><td>50 µA</td><td>SOT-23-5</td></tr>
    <tr><td>TI BQ24210</td><td>10 mA</td><td>4.20 V (LIR), programmable to 3.6-4.4 V</td><td>Yes (10 kΩ)</td><td>15 µA</td><td>WSON-10 (3×3)</td></tr>
    <tr><td>Consonance CN3052</td><td>50 mA (limit)</td><td>4.20 V (LIR only)</td><td>Yes</td><td>30 µA</td><td>SOT-23-5</td></tr>
    <tr><td>TI BQ25040</td><td>5 mA</td><td>3.6 to 4.4 V programmable</td><td>Yes</td><td>10 µA</td><td>WSON-6 (2×2)</td></tr>
    <tr><td>Skyworks AAT3681A</td><td>10 mA</td><td>4.20 V (LIR)</td><td>No</td><td>40 µA</td><td>SC-70-5</td></tr>
  </tbody>
</table>
<p>For ML cells (3.0 V nominal, 3.10 V cutoff) the catalogue narrows further. Most charger ICs assume 4.20 V cutoff; you either select a programmable part (BQ24210, BQ25040) or use a resistor divider on the FB pin to fool a fixed-cutoff part into stopping at 3.10 V. The divider approach works but doubles the IR error on the cutoff voltage; we generally recommend the programmable parts.</p>

<h2>Setting the charge rate</h2>
<p>The charger IC's ISET resistor (sometimes called PROG) sets the charge current. For coin cells the rule is simple: start at 0.2C, drop to 0.1C if thermal headroom is tight.</p>
<table class="spec-table">
  <thead><tr><th>Cell</th><th>Capacity</th><th>0.2C charge</th><th>0.1C charge</th></tr></thead>
  <tbody>
    <tr><td>LIR2032</td><td>40 mAh</td><td>8 mA</td><td>4 mA</td></tr>
    <tr><td>LIR2450</td><td>120 mAh</td><td>24 mA</td><td>12 mA</td></tr>
    <tr><td>ML2032</td><td>65 mAh</td><td>13 mA</td><td>6.5 mA</td></tr>
    <tr><td>ML2430</td><td>110 mAh</td><td>22 mA</td><td>11 mA</td></tr>
  </tbody>
</table>
<p>For an MCP73831 the formula is I_chg = 1000 / R_PROG. For an 8 mA target, R_PROG = 125 kΩ. Most engineers we work with default to a 10 kΩ resistor (100 mA) which is too aggressive for a 40 mAh LIR2032. Always do the math.</p>

<h2>Termination current</h2>
<p>The charger IC stops when charge current falls to a threshold (typically 10% of the programmed rate, sometimes called I_TERM). For an 8 mA programmed rate, termination at 0.8 mA. This works fine with most charger ICs for LIR cells, but ML cells need explicit verification: the LiMn2O4 cathode plateau is flat near full charge, so cells can sit at 90% SOC indefinitely without termination triggering. We recommend a firmware-level timeout (e.g. 4 hours from charge start) as a backstop.</p>

<h2>NTC integration</h2>
<p>Charge inhibit above 45 °C is the single biggest cycle-life saver for coin cells. The TI BQ24210 and BQ25040 have a dedicated NTC input that handles this in hardware — connect a 10 kΩ NTC between the cell and the IC's TS pin. The MCP73831 has no NTC input; you have to monitor temperature in firmware and gate the IC's enable line.</p>
<p>For sealed designs (SMD-mounted ML cell, no separate thermistor) the host MCU's internal temperature sensor is usually within 3-5 °C of the cell. That is good enough for a 45 °C inhibit threshold but not for thermal runaway protection — for that we still recommend a dedicated NTC at the cell.</p>

<h2>Quiescent draw matters</h2>
<p>For a coin-cell-powered device, the charger IC is on the battery rail at all times. A 40 µA quiescent draw on a 65 mAh ML cell costs 350 mAh / year — half the cell's annual capacity budget gone to the charger IC alone. The TI BQ25040 at 10 µA is the quietest option in the comparable price range. The MCP73831 at 50 µA is acceptable if the device has a recharge path that gets hit weekly.</p>

<h2>Common mistakes</h2>
<p><strong>Programming charge current too high.</strong> The MCP73831 default reference designs assume 100 mA. For a 40 mAh LIR cell that is 2.5C — well above the cell's ratings, and reliable cycle life suffers.</p>
<p><strong>Skipping the NTC.</strong> Without temperature protection the cell ages 2-3× faster in field deployments that hit warm enclosures during charging.</p>
<p><strong>Floating the cell at 100% SOC.</strong> Continuous trickle from a USB-attached device. For LIR cells specifically this kills calendar life. Add a firmware-level "stop charging at 90% if device is on continuous power" rule.</p>

<nav class="article-nav">
  <a href="/blog/coin-cell-self-discharge-shelf-life" class="prev">&larr; Previous: Coin Cell Self-Discharge & Shelf Life</a>
  <a href="/blog/coin-cell-mounting-holder-tab-smd" class="next">Next: Coin Cell Mounting Options &rarr;</a>
</nav>$art$,
 'Lin Zhao', 8, now() - interval '23 days', 'published'),

-- ---------- 5. Mounting options ----------
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='lin-zhao'),
 (SELECT id FROM categories WHERE slug='technology'),
 'coin-cell-mounting-holder-tab-smd',
 'Coin Cell Mounting: Holder vs Solder Tab vs SMD Reflow',
 'Three ways to attach a coin cell to a PCB. Each has different cost, reliability, and serviceability profiles. A mechanical engineer''s decision tree.',
 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1200&q=80',
 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1920&q=80',
 $art$<p class="lede">A coin cell on a PCB can be held by a snap-in holder, attached with a pre-welded solder tab, or mounted directly through reflow. Each option has a different total cost (cell + assembly + service), and the right choice depends on whether the device is opened over its life.</p>

<h2>Option 1: Snap-in holder</h2>
<p>A plastic-or-metal socket that the coin cell drops into. Standard part numbers like Keystone 1066 (CR2032 holder) or Linx BAT-HLD-001. The cell can be replaced by the end user.</p>
<p><strong>Pros:</strong> Standard part, $0.10 to $0.40 per holder. End user can swap the cell. Through-hole or SMD versions available. Survives reflow without the cell installed (cell goes in after assembly).</p>
<p><strong>Cons:</strong> Higher contact resistance (typically 5 to 30 mΩ vs &lt; 1 mΩ for welded). Vibration can disengage the cell unless the holder is keyed or retained. Adds 2 to 4 mm of board height. The holder's own quiescent leakage is small but not zero.</p>
<p><strong>Use when:</strong> The end user is expected to replace the cell; the device is opened during normal life; service centres need to swap cells without rework equipment.</p>

<h2>Option 2: Pre-welded solder tab</h2>
<p>The coin cell ships with two nickel or copper tabs spot-welded to the can. The tabs are then soldered to the PCB in a pre-production assembly step. Common in legacy designs.</p>
<p><strong>Pros:</strong> Low contact resistance (&lt; 1 mΩ). Cell is mechanically retained against the board. No socket cost.</p>
<p><strong>Cons:</strong> Cell cannot be replaced without rework. Increases assembly cost (manual hand-soldering after main reflow, or selective wave soldering). Tab fatigue in vibration environments unless the tab is supported.</p>
<p><strong>Use when:</strong> The device is sealed, but reflow-mounting is impossible (LIR cells, or product has heat-sensitive components nearby); a single hand-solder station in production is acceptable.</p>
<p>See our <a href="/blog/coin-cell-tab-welding">coin cell tab welding guide</a> for the full process, materials and reliability data.</p>

<h2>Option 3: SMD reflow mount</h2>
<p>The coin cell (ML2032 or ML2430 only — LIR cannot reflow) goes through the standard SMT line as a pick-and-place component. Pads on the PCB; cell on a tape-and-reel feeder; through reflow oven once.</p>
<p><strong>Pros:</strong> Lowest assembly cost — no separate manual step. Lowest contact resistance (&lt; 0.5 mΩ). Tightest mechanical retention. Smallest board area (no holder body).</p>
<p><strong>Cons:</strong> Cell must survive 260 °C peak reflow — only ML cells qualify. Cell cannot be replaced, period. One reflow pass per cell only (no double-sided board with cell on the second side). Higher cell cost (ML at $0.80 to $2.20 vs holder + CR/LIR at $0.40 to $0.90 combined).</p>
<p><strong>Use when:</strong> The device is sealed for life and the cell capacity is enough for 5+ year operation; high-volume program where assembly cost dominates BoM.</p>
<p>See our <a href="/blog/reflow-profile-ml-coin-cell">reflow profile guide</a> for the J-STD-020 envelope ML cells tolerate.</p>

<h2>Decision matrix</h2>
<table class="spec-table">
  <thead><tr><th>Question</th><th>Holder</th><th>Solder tab</th><th>SMD</th></tr></thead>
  <tbody>
    <tr><td>Does the user replace the cell?</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td></tr>
    <tr><td>Is the device sealed for life?</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
    <tr><td>Can ML chemistry meet runtime?</td><td>n/a</td><td>n/a</td><td>Required</td></tr>
    <tr><td>Vibration / shock environment?</td><td>Holder must be keyed</td><td>Tab support needed</td><td>✓ Best</td></tr>
    <tr><td>Lowest assembly cost?</td><td>Mid</td><td>Highest</td><td>Lowest</td></tr>
    <tr><td>Highest production volume?</td><td>OK</td><td>Avoid</td><td>✓ Best</td></tr>
    <tr><td>Service / repair needed?</td><td>✓ Easy</td><td>Difficult</td><td>Impossible</td></tr>
  </tbody>
</table>

<h2>The two patterns we ship most often</h2>
<p><strong>Holder + LIR2032</strong>: smart accessory devices where the user might replace the cell once over the device's life (typical: smart card with battery, BLE tracker with USB-C charge, smart pen). Holder cost is justified by occasional service swap.</p>
<p><strong>SMD + ML2032</strong>: sealed-for-life products with 5+ year battery target (typical: BLE beacon, RTC backup on industrial PCB, smart-meter calibration retention). Lowest total cost when you amortise assembly cost across the production run.</p>

<nav class="article-nav">
  <a href="/blog/coin-cell-charging-ic-design" class="prev">&larr; Previous: Coin Cell Charging IC Design</a>
  <a href="/blog/coin-cell-safety-abuse-behavior" class="next">Next: Coin Cell Safety & Abuse Behaviour &rarr;</a>
</nav>$art$,
 'Lin Zhao', 7, now() - interval '29 days', 'published'),

-- ---------- 6. Safety / abuse behavior ----------
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='mei-yang'),
 (SELECT id FROM categories WHERE slug='certifications'),
 'coin-cell-safety-abuse-behavior',
 'Coin Cell Safety: Short-Circuit, Crush and Vent Behaviour Under Abuse',
 'How rechargeable coin cells fail when abused — and why the hermetic stainless-steel shell makes that failure substantially safer than a pouch cell of the same capacity.',
 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1200&q=80',
 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1920&q=80',
 $art$<p class="lede">Coin cells fail differently from pouch cells under the same abuse. The hermetic stainless-steel shell is a structural element, not just a package — it changes how energy releases when something goes wrong. Designers planning safety analyses for medical, aerospace and industrial devices should understand the difference.</p>

<h2>The three abuse cases</h2>
<p>IEC 62133-2 and UN 38.3 both test coin cells through three primary abuse cases that reflect realistic field failures:</p>
<ol>
  <li><strong>External short-circuit</strong> — the positive and negative terminals connected through a low-resistance path</li>
  <li><strong>Mechanical crush</strong> — direct compression force applied perpendicular to the cell axis</li>
  <li><strong>Forced over-charge</strong> — current applied beyond the cell's rated cutoff voltage</li>
</ol>
<p>How the cell fails in each case is determined more by the can construction than by the chemistry. A 65 mAh ML cell short-circuited dissipates roughly 0.7 Wh — meaningful, but not enough to cause cascade failure in adjacent components if the can holds.</p>

<h2>External short-circuit behaviour</h2>
<p>When a coin cell is shorted externally, the entire stored energy dissipates as heat in the cell internals and the short-circuit path. For a healthy ML2032 the surface temperature peaks at 85 to 110 °C within 30 to 60 seconds, then declines as the cell discharges to flat. For LIR2032 the same test peaks at 100 to 130 °C because of the higher voltage and energy density.</p>
<p>The hermetic can does not vent during a normal short. The internal pressure builds slightly from electrolyte vapour but stays below the can's burst pressure (typically &gt; 30 bar). The cell goes flat and stays sealed. This is why coin cells pass IEC 62133-2 short-circuit testing reliably — there is no post-test cleanup of vented electrolyte, no fire risk, no neighbouring component damage.</p>

<h2>Mechanical crush behaviour</h2>
<p>Under MIL-STD-810H mechanical crush at 13 kN applied across the flat faces, the can deforms before the internal stack ruptures. The deformation alone short-circuits the internal positive and negative tabs, and the cell discharges through the internal short. Surface temperature spikes briefly to 80 to 100 °C, then declines.</p>
<p>The risk in mechanical crush is electrolyte leakage if the deformation breaks the crimp seal. For the LIR cells we ship, &lt; 0.5% of crushed cells in a typical 100-cell test batch leak measurable electrolyte. For ML cells, &lt; 0.2% — the crimp seal on ML is more conservative because of the reflow tolerance requirement.</p>
<p>Compare to a pouch cell of the same capacity (e.g. a 65 mAh thin Li-Po): mechanical crush typically punctures the aluminium-laminate pouch, releases vaporised electrolyte, and may ignite if the crush is fast enough. Coin cells do not have this failure mode because the can is structurally orders of magnitude stiffer than a pouch.</p>

<h2>Forced over-charge behaviour</h2>
<p>Forced over-charge — applying current after the cell reaches cutoff — drives the cathode beyond its stable potential. For LIR2032 above 4.30 V the LCO releases oxygen and the cell can vent or burst. For ML2032 above 3.50 V the LiMn2O4 cathode is more stable; the cell tolerates a wider over-charge envelope before venting.</p>
<p>Both chemistries have a cell-internal over-charge protection mechanism: a current interrupt device (CID) inside the can that breaks the circuit when internal pressure reaches a threshold. The CID is mechanical; once tripped, the cell is permanently disabled but does not vent flame. This is the primary safety feature that lets coin cells pass UN 38.3 forced over-charge testing without external BMS.</p>

<h2>Vent design and what happens after</h2>
<p>If internal pressure exceeds the CID threshold and continues rising (rare, but possible under extreme abuse like sustained over-charge from a mis-configured charger after CID activation), the can has a designed vent point — a thinned section of the metal that bursts at a controlled pressure (40 to 60 bar). The vent releases vapourised electrolyte through a defined direction (typically downward through the negative terminal pad).</p>
<p>For SMD-mounted ML cells, the vent direction matters for the PCB layout: keep heat-sensitive components 10 mm clear of the negative terminal pad, and avoid placing the cell directly above any IC that can fail open under thermal exposure.</p>

<h2>What we test on every lot</h2>
<p>Each production lot is sampled for:</p>
<ul>
  <li><strong>External short-circuit</strong>: 5 cells for 24 hours, surface temperature monitored, no venting allowed</li>
  <li><strong>Crimp seal integrity</strong>: 5 cells held at 60 °C / 80% RH for 7 days, weight loss &lt; 0.1%</li>
  <li><strong>Forced over-charge</strong>: 3 cells charged to 1.5× rated voltage, CID must trip, no flame</li>
  <li><strong>Mechanical drop</strong>: 5 cells dropped 1.5 m onto concrete, no leakage, capacity retention &gt; 95%</li>
</ul>
<p>For medical and aerospace customers the SOP adds two more: vibration test per MIL-STD-810H and thermal cycling -40 °C ↔ +85 °C for 200 cycles. Test reports retained 10 years per ISO 13485.</p>

<nav class="article-nav">
  <a href="/blog/coin-cell-mounting-holder-tab-smd" class="prev">&larr; Previous: Coin Cell Mounting Options</a>
  <a href="/blog/ble-beacon-ml-coin-cell-design" class="next">Next: 5-Year BLE Beacon with ML Coin Cell &rarr;</a>
</nav>$art$,
 'Mei Yang', 8, now() - interval '36 days', 'published'),

-- ---------- 7. BLE beacon design ----------
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM authors WHERE slug='lin-zhao'),
 (SELECT id FROM categories WHERE slug='technology'),
 'ble-beacon-ml-coin-cell-design',
 'Designing a 5-Year BLE Beacon with an ML Coin Cell',
 'A worked design for a sealed BLE beacon that runs five years on a single 65 mAh ML2032 cell. Power budget, advertising interval, MCU sleep, and the firmware tricks that hit the target.',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
 $art$<p class="lede">A 65 mAh ML2032 coin cell carries 195 mWh of energy. To run a BLE beacon for 5 years on that budget, the average current draw cannot exceed 1.5 µA. That sounds impossible — and is, with off-the-shelf BLE stack defaults. With four firmware tricks it lands comfortably.</p>

<h2>The energy budget</h2>
<table class="spec-table">
  <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Cell capacity (ML2032)</td><td>65 mAh</td></tr>
    <tr><td>Effective capacity at year 5 (cycling + ageing)</td><td>~52 mAh</td></tr>
    <tr><td>Target service life</td><td>5 years = 43,800 hours</td></tr>
    <tr><td>Maximum average current</td><td>52 mAh / 43,800 h = 1.19 µA</td></tr>
  </tbody>
</table>
<p>For a 1 µA average current target on a Bluetooth LE beacon, every microwatt of design margin matters. The dominant power consumers are the BLE radio during advertising bursts and the MCU during the wake/sleep transitions. Both are addressable in firmware.</p>

<h2>The four firmware tricks</h2>
<h3>1. Stretch the advertising interval</h3>
<p>BLE advertising at 100 ms interval means 10 transmissions per second — roughly 700 µA average draw on a typical nRF52 SoC. At 1,000 ms interval (1/sec) the average drops to 70 µA. At 10,000 ms (every 10 sec) the average drops to 7 µA — still too high, but in range.</p>
<p>For asset-tracking and presence-detection use cases, an advertising interval of 30 to 60 seconds is acceptable and brings the radio's contribution to the average down to 1 to 2 µA. For high-frequency use cases (proximity beacons in retail), the cell choice escalates to ML2430 (110 mAh) or LIR2450 (120 mAh).</p>

<h3>2. Eliminate the MCU's hot path during sleep</h3>
<p>The nRF52832 in System OFF mode draws 0.3 µA. In System ON mode with RAM retention it draws 1.5 µA. The difference matters: between advertising bursts the MCU should be in System OFF, woken only by the RTC. Most BLE beacon reference designs leave the MCU in System ON because the wake-up path is simpler — that 1.2 µA delta is the difference between 5 years and 7 years of life.</p>

<h3>3. Use the cheap RTC, not the expensive one</h3>
<p>The nRF52832 has a low-power RTC running off a 32.768 kHz crystal, drawing 0.3 µA. It also has a high-frequency RTC on the 64 MHz oscillator, drawing 80 µA. Use the cheap one. Round trip from System OFF, RTC wake, advertise once, return to System OFF, takes 8-12 ms with the LF RTC.</p>

<h3>4. Tune the radio TX power and back off when the link allows it</h3>
<p>Default BLE TX power is +4 dBm. For most beacon use cases (10 to 30 m range to a receiver), 0 dBm is sufficient and saves 30% on radio energy per advertising burst. -4 dBm works for sub-10 m proximity applications and saves 50%. Beacons designed for fixed deployments where receiver location is known often back off to -4 dBm and never look back.</p>

<h2>The current draw budget, worked</h2>
<p>For a 30-second advertising interval, 0 dBm TX power, nRF52832 in System OFF between bursts:</p>
<table class="spec-table">
  <thead><tr><th>Activity</th><th>Current</th><th>Duration</th><th>Charge per cycle</th></tr></thead>
  <tbody>
    <tr><td>System OFF (sleep)</td><td>0.3 µA</td><td>29.99 s</td><td>2.5 µAs</td></tr>
    <tr><td>RTC wake + MCU boot</td><td>3 mA</td><td>2 ms</td><td>6 µAs</td></tr>
    <tr><td>BLE advertise (3 channels)</td><td>5 mA</td><td>3 ms</td><td>15 µAs</td></tr>
    <tr><td>Return to System OFF</td><td>1 mA</td><td>1 ms</td><td>1 µAs</td></tr>
  </tbody>
</table>
<p>Total per 30-second cycle: 24.5 µAs. Average current: 24.5 / 30 = 0.82 µA. Comfortably below the 1.19 µA target. Service life with 65 mAh fresh capacity: 8.0 years; with 52 mAh aged capacity: 6.4 years.</p>
<p>That margin lets the device survive cell ageing better than the spec calls for, and survive imperfect storage conditions (a cell stored at 35 °C for 18 months before deployment loses 8 to 10% capacity that the budget can absorb).</p>

<h2>The hardware checklist</h2>
<ol>
  <li>Use ML2032 SMD cell, not LIR — gets you the reflow path and the 5+ year shelf life</li>
  <li>nRF52832 or equivalent (Cortex-M4 with BLE 5.x and System OFF mode)</li>
  <li>32.768 kHz crystal for the LF RTC; do not use the internal RC oscillator (drift wastes battery)</li>
  <li>Decoupling caps sized for 5 mA peak current — 10 µF + 100 nF on each rail</li>
  <li>Skip the LDO if you can — drop the cell directly onto the MCU's power input</li>
  <li>One LED for assembly verification only — never an indicator that lights during normal operation</li>
</ol>

<h2>What we ship for this application</h2>
<p>Reflow-grade ML2032 in tape-and-reel for SMT lines. Standard MOQ 50,000 units. Lead time 4 to 6 weeks for first article, 2 weeks for repeat. UN 38.3 + IEC 62133-2 + MSDS bundle ships with each lot. Custom MOQ down to 10,000 units possible with an upfront tooling fee.</p>

<nav class="article-nav">
  <a href="/blog/coin-cell-safety-abuse-behavior" class="prev">&larr; Previous: Coin Cell Safety Behaviour</a>
  <a href="/products/coin-steel-shell-lithium-battery" class="next">Explore Coin Steel-Shell Cells &rarr;</a>
</nav>$art$,
 'Lin Zhao', 7, now() - interval '43 days', 'published')

ON CONFLICT (slug) DO NOTHING;
