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
  'Polymer Lithium Battery Manufacturer | Custom Li-Po Cells | Acme Battery',
  'Industrial-grade polymer lithium (Li-Po) batteries with custom capacities from 30 mAh to 20 Ah. ISO 9001 certified manufacturer with UN38.3, IEC 62133, CE compliance.',
  'Pillar Series 01',
  'Polymer Lithium Battery',
  'High energy density Li-Po cells engineered for thin, light, and mission-critical applications. From wearables to medical devices, our polymer lithium batteries deliver consistent performance across thousands of cycles.',
  '/assets/img/pillar-polymer.svg',
  'Get a Quote', '/quote', 'Download Datasheet', '/uploads/datasheet-polymer.pdf',
  '{"title":"What is a Polymer Lithium Battery?","body":"Polymer lithium batteries (Li-Po) use a gel-like polymer electrolyte instead of the liquid electrolyte found in conventional lithium-ion cells. This allows for ultra-thin profiles, flexible form factors, and improved safety under abuse conditions. Acme manufactures Li-Po cells from 30 mAh up to 20 Ah, with thicknesses as low as 0.4 mm."}',
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
  '{"title":"Why Custom Geometry?","body":"Modern devices leave little room for off-the-shelf cells. By co-designing the battery with your mechanical team, we recover 10-30% more volumetric energy density and remove dead space. Acme has shipped over 200 custom geometries for medical, wearable and defence customers."}',
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
  'cylindrical-steel-shell-lithium-battery',
  'Cylindrical Steel-Shell Lithium Battery',
  'Cylindrical Li-Ion',
  'Cylindrical Lithium Battery Manufacturer | 18650, 21700, 26650',
  'High-cycle cylindrical lithium-ion batteries in steel cases: 14500, 18650, 21700, 26650, 32700. INR & IFR chemistries for power tools, e-mobility and energy storage.',
  'Pillar Series 03',
  'Cylindrical Steel-Shell Lithium Battery',
  'Robust cylindrical Li-Ion cells in standard 14500, 18650, 21700, 26650 and 32700 formats. Available in INR (NMC) and IFR (LFP) chemistries for power tools, light EVs and stationary storage.',
  '/assets/img/pillar-cylindrical.svg',
  'Request Bulk Pricing', '/quote', 'Compare Sizes', '#variants',
  '{"title":"Steel-Shell Reliability","body":"Steel-cased cylindrical cells offer the highest mechanical robustness in lithium chemistry. Our 18650 and 21700 cells are built on automated lines with laser-welded current collectors, CID safety vents and PTC current interrupt for OEM-grade consistency."}',
  '[
    {"name":"INR (NMC)","summary":"High energy density 3.6 V chemistry. Ideal for power tools, light EV and consumer electronics.","image":"/assets/img/variant-inr.svg"},
    {"name":"IFR (LiFePO4)","summary":"Long cycle life 3.2 V chemistry. Ideal for ESS, telecom backup and solar storage.","image":"/assets/img/variant-ifr.svg"},
    {"name":"Standard Sizes","summary":"14500 / 18650 / 21700 / 26650 / 32700 with stocked SKUs.","image":"/assets/img/variant-standard.svg"},
    {"name":"Custom Packs","summary":"Welded packs, BMS-integrated battery modules, plastic/metal housings.","image":"/assets/img/variant-pack.svg"}
  ]',
  '{
    "headers":["Format","Capacity","Voltage","Max Discharge","Cycles"],
    "rows":[
      ["18650 INR","2,500 – 3,500 mAh","3.6 V","10 A","≥ 500"],
      ["18650 IFR","1,500 – 1,800 mAh","3.2 V","30 A","≥ 2,000"],
      ["21700 INR","4,000 – 5,000 mAh","3.6 V","15 A","≥ 500"],
      ["21700 IFR","3,000 – 3,300 mAh","3.2 V","30 A","≥ 3,000"],
      ["26650 IFR","3,200 – 3,400 mAh","3.2 V","30 A","≥ 3,000"],
      ["32700 IFR","6,000 – 6,500 mAh","3.2 V","30 A","≥ 3,500"]
    ]
  }',
  '["power-tools","e-mobility","energy-storage","iot"]',
  '{
    "enabled": true,
    "items":[
      {"label":"Pack Configuration","value":"Series/parallel up to 14S20P standard"},
      {"label":"BMS","value":"Integrated, with CAN/RS485/UART communication"},
      {"label":"Connectors","value":"XT60, Anderson, M8, custom busbars"},
      {"label":"Housing","value":"Plastic, aluminium, IP65 enclosures"},
      {"label":"Welding","value":"Laser or spot welding, full traceability"}
    ]
  }',
  '{"title":"Automated Cylindrical Cell Line","body":"Our cylindrical cell production runs on Korean and Japanese automation with in-line OCV/IR/CCD inspection. Cells are graded into A/B grades with full traceability by serial number.","image":"/assets/img/manufacturing-cylindrical.svg"}',
  '[
    {"name":"UN 38.3","image":"/assets/img/cert-un38.svg"},
    {"name":"IEC 62133","image":"/assets/img/cert-iec.svg"},
    {"name":"UL 1642","image":"/assets/img/cert-ul.svg"},
    {"name":"KC","image":"/assets/img/cert-kc.svg"},
    {"name":"PSE","image":"/assets/img/cert-pse.svg"}
  ]',
  '[
    {"q":"Do you supply individual cells or only assembled packs?","a":"Both. Our minimum cell order is 500 pieces; pack assembly minimum depends on configuration but typically starts at 50 packs."},
    {"q":"What is the difference between INR and IFR chemistries?","a":"INR (NMC) offers higher energy density (~250 Wh/kg) at 3.6 V, ideal for compact tools and EVs. IFR (LFP) offers longer cycle life (3,000+) at 3.2 V, ideal for stationary storage and safety-critical applications."},
    {"q":"Can you provide test reports?","a":"Yes, every shipment includes UN 38.3 test summary, MSDS and a Certificate of Conformity. IEC 62133, UL 1642 and KC reports are available on request."},
    {"q":"Are LFP cells safe for indoor energy storage?","a":"Yes, LiFePO4 chemistry is non-flammable in normal abuse scenarios and is the preferred chemistry for residential and telecom ESS deployments."}
  ]',
  '["18650 manufacturer","cylindrical lithium battery","21700 cell","LFP cylindrical","steel shell lithium battery"]',
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
 'Acme designs and assembles 36V to 96V battery packs with integrated BMS, CAN bus, and IP67 housings for e-mobility OEMs across Europe and Southeast Asia.',
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
((SELECT id FROM pillar_pages WHERE slug='cylindrical-steel-shell-lithium-battery'),
 'inr21700-50e', 'INR 21700-50E 5000mAh', 'INR21700-50E',
 'High capacity NMC cell',
 '{"voltage":"3.6V","capacity":"5000 mAh","format":"21700","max_discharge":"15A","cycles":"≥ 500"}',
 '["Automated production","Tier-1 quality","Laser welded current collector"]',
 'High-density NMC 21700 for power tools, light EV and high-end portable electronics.',
 FALSE, 1, 'published')
ON CONFLICT (slug) DO NOTHING;

-- ----- Sample Articles (cluster content) -----
INSERT INTO articles (pillar_id, category_id, slug, title, excerpt, content, author, reading_minutes, published_at, status) VALUES
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM categories WHERE slug='technology'),
 'how-to-choose-li-po-capacity-iot',
 'How to Choose Li-Po Battery Capacity for IoT Devices',
 'A practical guide for hardware engineers selecting polymer lithium cells for low-power IoT applications.',
 '<p>Choosing the right polymer lithium (Li-Po) battery for an IoT device is a balance between runtime, form factor and cycle life. In this guide we walk through the four key parameters every hardware engineer should specify before issuing an RFQ.</p><h2>1. Estimate average current draw</h2><p>Compute the average current as the weighted sum of active and sleep currents. For a typical LoRaWAN sensor reporting once per hour, average current is often 50-150 µA.</p><h2>2. Add 25% headroom for ageing</h2><p>Li-Po cells lose ~20% capacity by cycle 500. Spec the nominal capacity 25% above the runtime requirement so the device still meets its target at end-of-life.</p><h2>3. Match the temperature range</h2><p>Standard Li-Po operates -20°C to +60°C in discharge, but charging below 0°C is not allowed. If your device must charge in cold environments, ask for a low-temperature variant.</p>',
 'Acme Engineering', 6, now() - interval '5 days', 'published'),
((SELECT id FROM pillar_pages WHERE slug='custom-shaped-polymer-lithium-battery'),
 (SELECT id FROM categories WHERE slug='technology'),
 'designing-curved-batteries-for-wearables',
 'Designing Curved Polymer Batteries for Wearable Devices',
 'How curvature radius, electrode coating and stack geometry affect cycle life in curved Li-Po cells.',
 '<p>Curved batteries unlock 10-30% extra volume in wearable enclosures, but they also introduce manufacturing trade-offs that affect cycle life. This article explains what to ask your battery vendor before committing to a curved design.</p><h2>Minimum curvature radius</h2><p>For single-curvature cells we recommend R ≥ 25 mm to maintain coating integrity over 500 cycles. Tighter radii are achievable but require thinner electrodes and reduce capacity.</p>',
 'Acme Engineering', 7, now() - interval '12 days', 'published'),
((SELECT id FROM pillar_pages WHERE slug='cylindrical-steel-shell-lithium-battery'),
 (SELECT id FROM categories WHERE slug='industry-insights'),
 '18650-vs-21700-which-cell-format-to-choose',
 '18650 vs. 21700: Which Cylindrical Cell Format to Choose',
 'A side-by-side comparison of the two most common cylindrical lithium-ion formats for OEM products.',
 '<p>The 21700 cell, popularised by Tesla in the Model 3, has rapidly displaced the 18650 in many high-power applications. But not every product should switch. Here is how we advise our customers.</p><h2>Energy and power</h2><p>A 21700 cell stores roughly 35-40% more energy than an 18650 in the same chemistry, while keeping similar discharge rates. For battery packs, this means fewer cells, lower BMS complexity and reduced welding labour.</p>',
 'Acme Engineering', 8, now() - interval '20 days', 'published')
ON CONFLICT (slug) DO NOTHING;

-- ----- Settings -----
INSERT INTO settings (key, value) VALUES
('site',
 '{"name":"Acme Battery","tagline":"Custom lithium batteries for AR/VR, medical, wearables and IoT. Founded 2018 in Dongguan.","email":"sales@example.com","engineering_email":"engineering@example.com","phone":"+86 755 0000 0000","address":"Building A, Industrial Park, Shenzhen 518000, China","founded_year":2008,"factory_size_sqm":18000,"staff_count":420}'),
('social',
 '{"linkedin":"","whatsapp":""}'),
('seo',
 '{"default_meta_description":"OEM/ODM lithium battery manufacturer specialising in polymer Li-Po, custom-shaped Li-Po and cylindrical Li-Ion cells. ISO 9001, UN 38.3, CE compliant.","default_meta_image":"/assets/img/og-default.svg"}'),
('gdpr',
 '{"retention_days":365,"soft_delete_days":30,"policy_version":"1.0","controller":"Acme Battery Co., Ltd.","controller_email":"privacy@example.com","cookie_categories":{"necessary":{"required":true,"label":"Strictly necessary","description":"Required for the site to function (session, security, language preference)."},"analytics":{"required":false,"label":"Analytics","description":"Aggregated traffic statistics to help us improve the site."},"marketing":{"required":false,"label":"Marketing","description":"Used to measure the performance of advertising campaigns."}}}'),
('mail',
 '{"reply_to":"sales@example.com","subject_prefix":"[Inquiry]","auto_reply_enabled":true}'),
('navigation',
 '{"header":[{"label":"HOME","url":"/","nav":"home"},{"label":"PRODUCTS","url":"/products/","nav":"products","children":[{"label":"Standard Batteries","url":"/products/standard.html"},{"label":"Custom Batteries","url":"/products/custom.html"}]},{"label":"APPLICATIONS","url":"/applications/","nav":"applications","children":[{"label":"AR / VR Glasses","url":"/applications/ar-vr.html"},{"label":"Medical Devices","url":"/applications/medical.html"},{"label":"Wearables","url":"/applications/wearables.html"},{"label":"IoT Devices","url":"/applications/iot.html"}]},{"label":"CUSTOM SOLUTIONS","url":"/solutions/","nav":"solutions","children":[{"label":"Design Support","url":"/solutions/design.html"},{"label":"Prototyping","url":"/solutions/prototyping.html"},{"label":"Mass Production","url":"/solutions/mass-production.html"}]},{"label":"ABOUT US","url":"/about/","nav":"about","children":[{"label":"Company Profile","url":"/about/profile.html"},{"label":"Factory Tour","url":"/about/factory.html"},{"label":"Team","url":"/about/team.html"}]},{"label":"BLOG","url":"/blog/","nav":"blog"},{"label":"FAQ","url":"/faq.html","nav":"faq"},{"label":"CONTACT","url":"/contact.html","nav":"contact"}]}')
ON CONFLICT (key) DO NOTHING;
