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
INSERT INTO applications (slug, name, icon, cover_url, summary, body, sort_order) VALUES
('medical', 'Medical Devices', 'medical',
 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&q=80',
 'IEC 60601-compliant cells for patient monitors, infusion pumps, hearing aids and surgical tools.',
 'We supply medical OEMs with cells that meet IEC 60601 leakage requirements, ISO 13485 traceability and 5+ year shelf life. Common formats include ultra-thin Li-Po for wearable monitors and 18650 packs for portable diagnostic carts.',
 1),
('wearables', 'Wearables', 'wearables',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
 'Ultra-small round and curved Li-Po cells for TWS earbuds, smart bands and patches.',
 'From 25 mAh discoid cells in 10 mm earbuds to 200 mAh curved cells in fitness bands, we deliver the highest energy density in the smallest envelopes for consumer wearables.',
 2),
('iot', 'IoT Devices',  'iot',
 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=1200&q=80',
 'Long shelf-life cells with low self-discharge for asset trackers, gateways and smart meters.',
 'Industrial IoT requires cells that survive on shelves for 12+ months and operate from -20°C to +60°C. Our IFR 18650 and Li-Po cells are widely used in trackers, smart locks and LoRaWAN sensors.',
 3),
('ar-vr', 'AR / VR Glasses', 'ar-vr',
 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1200&q=80',
 'Ultra-thin and curved cells for slim AR temples and VR headsets.',
 'Headset OEMs use our custom stepped Li-Po cells to free up optical and PCB volume while maintaining 2-4 hour runtime targets.',
 4),
('drones', 'Drones & UAV', 'drones',
 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200&q=80',
 'High C-rate Li-Po and 21700 packs for commercial UAV platforms.',
 'We support commercial drone OEMs with 5C-15C continuous discharge cells, balanced BMS and IP-rated battery enclosures certified for outdoor flight operations.',
 5),
('power-tools', 'Power Tools', 'power-tools',
 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&q=80',
 '20A continuous, high cycle 18650/21700 packs for cordless tools.',
 'Our INR 21700 cells support 35A pulse and 15-20A continuous, with proven longevity in 18V/40V/60V cordless tool platforms.',
 6),
('e-mobility', 'E-Mobility', 'e-mobility',
 'https://images.unsplash.com/photo-1556122071-e404eaedb77f?w=1200&q=80',
 'NMC and LFP cylindrical packs for e-bikes, e-scooters, AGVs and light EVs.',
 'Zufek designs and assembles 36V to 96V battery packs with integrated BMS, CAN bus, and IP67 housings for e-mobility OEMs across Europe and Southeast Asia.',
 7),
('energy-storage', 'Energy Storage', 'energy-storage',
 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&q=80',
 'LFP cylindrical and prismatic systems for residential, telecom and commercial ESS.',
 'Cycle-optimised LiFePO4 cells (3,000-6,000 cycles) configured into 48V telecom modules, 5kWh wall-mount residential batteries, and 100kWh+ commercial cabinets.',
 8)
ON CONFLICT (slug) DO NOTHING;

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
INSERT INTO articles (pillar_id, category_id, slug, title, excerpt, content, author, reading_minutes, published_at, status) VALUES
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM categories WHERE slug='technology'),
 'how-to-choose-li-po-capacity-iot',
 'How to Choose Li-Po Battery Capacity for IoT Devices',
 'A practical guide for hardware engineers selecting polymer lithium cells for low-power IoT applications.',
 '<p>Choosing the right polymer lithium (Li-Po) battery for an IoT device is a balance between runtime, form factor and cycle life. In this guide we walk through the four key parameters every hardware engineer should specify before issuing an RFQ.</p><h2>1. Estimate average current draw</h2><p>Compute the average current as the weighted sum of active and sleep currents. For a typical LoRaWAN sensor reporting once per hour, average current is often 50-150 µA.</p><h2>2. Add 25% headroom for ageing</h2><p>Li-Po cells lose ~20% capacity by cycle 500. Spec the nominal capacity 25% above the runtime requirement so the device still meets its target at end-of-life.</p><h2>3. Match the temperature range</h2><p>Standard Li-Po operates -20°C to +60°C in discharge, but charging below 0°C is not allowed. If your device must charge in cold environments, ask for a low-temperature variant.</p>',
 'Zufek Engineering', 6, now() - interval '5 days', 'published'),
((SELECT id FROM pillar_pages WHERE slug='custom-shaped-polymer-lithium-battery'),
 (SELECT id FROM categories WHERE slug='technology'),
 'designing-curved-batteries-for-wearables',
 'Designing Curved Polymer Batteries for Wearable Devices',
 'How curvature radius, electrode coating and stack geometry affect cycle life in curved Li-Po cells.',
 '<p>Curved batteries unlock 10-30% extra volume in wearable enclosures, but they also introduce manufacturing trade-offs that affect cycle life. This article explains what to ask your battery vendor before committing to a curved design.</p><h2>Minimum curvature radius</h2><p>For single-curvature cells we recommend R ≥ 25 mm to maintain coating integrity over 500 cycles. Tighter radii are achievable but require thinner electrodes and reduce capacity.</p>',
 'Zufek Engineering', 7, now() - interval '12 days', 'published'),
((SELECT id FROM pillar_pages WHERE slug='coin-steel-shell-lithium-battery'),
 (SELECT id FROM categories WHERE slug='industry-insights'),
 'lir-vs-ml-coin-cell-which-to-choose',
 'LIR vs. ML Coin Cells: Which Rechargeable Chemistry to Choose',
 'A practical decision guide for picking between LIR (Li-ion 3.6 V) and ML (Li-MnO2 3.0 V) rechargeable coin cells.',
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
 '{"name":"Zufek","legal_name":"Dongguan Zufek Technology Co.,Ltd","tagline":"Custom lithium batteries for AR/VR, medical, wearables and IoT. Founded 2018 in Dongguan.","email":"info@zufek.com","engineering_email":"engineering@zufek.com","phone":"+86 153 7772 0020","address":"Room 432, Building 1, No. 34 Jinniu Road, Guancheng Subdistrict, Dongguan City, Guangdong Province, China","founded_year":2018,"factory_size_sqm":18000,"staff_count":100}'),
('social',
 '{"linkedin":"https://www.linkedin.com/company/zufek","whatsapp":"https://wa.me/8615377720020"}'),
('seo',
 '{"public_url":"https://zufek.com","default_meta_description":"OEM/ODM lithium battery manufacturer specialising in polymer Li-Po, custom-shaped Li-Po and coin steel-shell lithium cells. ISO 9001, UN 38.3, CE compliant.","default_meta_image":"/logo.png","twitter_handle":"","ga4_measurement_id":"","gsc_verify":"","bing_verify":""}'),
('organization',
 '{"legal_name":"Dongguan Zufek Technology Co.,Ltd","brand_name":"Zufek","founding_date":"2018","vat_id":"","duns":"","logo":"/logo.png","sameAs":["https://www.linkedin.com/company/zufek"],"address":{"streetAddress":"Room 432, Building 1, No. 34 Jinniu Road, Guancheng Subdistrict","addressLocality":"Dongguan","addressRegion":"Guangdong","postalCode":"523000","addressCountry":"CN"},"contactPoints":[{"type":"sales","email":"info@zufek.com","telephone":"+86 153 7772 0020","areaServed":"Worldwide","availableLanguage":["en","zh"]},{"type":"technical support","email":"engineering@zufek.com","areaServed":"Worldwide","availableLanguage":["en"]}]}'),
('gdpr',
 '{"retention_days":365,"soft_delete_days":30,"policy_version":"1.0","controller":"Dongguan Zufek Technology Co.,Ltd","controller_email":"info@zufek.com","cookie_categories":{"necessary":{"required":true,"label":"Strictly necessary","description":"Required for the site to function (session, security, language preference)."},"analytics":{"required":false,"label":"Analytics","description":"Aggregated traffic statistics to help us improve the site."},"marketing":{"required":false,"label":"Marketing","description":"Used to measure the performance of advertising campaigns."}}}'),
('mail',
 '{"reply_to":"info@zufek.com","subject_prefix":"[Inquiry]","auto_reply_enabled":true}'),
('navigation',
 '{"header":[{"label":"HOME","url":"/","nav":"home"},{"label":"PRODUCTS","url":"/products/","nav":"products","children":[{"label":"Polymer Lithium Battery","url":"/products/polymer-lithium-battery"},{"label":"Custom-Shaped Polymer (Li-Po)","url":"/products/custom-shaped-polymer-lithium-battery"},{"label":"Coin Steel-Shell Lithium","url":"/products/coin-steel-shell-lithium-battery"}]},{"label":"APPLICATIONS","url":"/applications/","nav":"applications","children":[{"label":"AR / VR Glasses","url":"/applications/ar-vr.html"},{"label":"Medical Devices","url":"/applications/medical.html"},{"label":"Wearables","url":"/applications/wearables.html"},{"label":"IoT Devices","url":"/applications/iot.html"}]},{"label":"CUSTOM SOLUTIONS","url":"/solutions/","nav":"solutions","children":[{"label":"Design Support","url":"/solutions/design.html"},{"label":"Prototyping","url":"/solutions/prototyping.html"},{"label":"Mass Production","url":"/solutions/mass-production.html"}]},{"label":"ABOUT US","url":"/about/","nav":"about","children":[{"label":"Company Profile","url":"/about/profile.html"},{"label":"Factory Tour","url":"/about/factory.html"},{"label":"Team","url":"/about/team.html"}]},{"label":"BLOG","url":"/blog/","nav":"blog"},{"label":"FAQ","url":"/faq.html","nav":"faq"},{"label":"CONTACT","url":"/contact.html","nav":"contact"}]}')
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
