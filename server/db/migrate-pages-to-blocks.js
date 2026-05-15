// =============================================================================
//  One-time migration that converts our hand-authored static About pages into
//  block JSON so operators can edit them through the visual builder.
//
//  Idempotent: only writes blocks when a page row's `blocks` is empty. If an
//  operator has already customised the blocks via the admin, we leave them
//  alone — the migration won't trample on edits.
//
//  Runs from server/index.js after autoMigrate() finishes.
// =============================================================================

const { many, query } = require('./client');

function id() {
  return 'blk_' + Math.random().toString(36).slice(2, 10);
}
function blk(type, data) {
  return { id: id(), type, data };
}

// -- about/index ---------------------------------------------------------------
function aboutIndexBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
      title: 'About',
      subtitle: 'A privately-held lithium-cell manufacturer, founded 2018 in Dongguan. Engineer-led; built so engineers want to call us.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'About' }],
    }),
    blk('content-split', {
      background: 'light',
      eyebrow: 'Origin',
      title: 'Why we built another battery company.',
      subtitle: 'Started in 2018, in a converted machine shop.',
      paragraphs: [
        'Four senior engineers from three different tier-1 cell makers had watched too many promising hardware programs die because the cell vendor wouldn\'t step outside its MP catalogue. So we built the kind of cell shop we always wished we could call.',
        'Eight years on, the rule has not changed: the cell is part of the device, not a commodity bolted to the side of it. Every shipment ties back to a winding machine, a shift, a materials lot.',
      ],
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1000&q=80',
      imagePosition: 'right',
      link: { label: 'Read the full origin story', url: '/about/profile' },
    }),
    blk('stat-strip', {
      dark: true,
      eyebrow: 'By the numbers',
      title: 'Eight years, and still counting.',
      stats: [
        { value: '8',         unit: 'yrs', label: 'since 2018' },
        { value: '100',       unit: '+',   label: 'team members' },
        { value: '3',         unit: '',    label: 'tier-1 OEM programs' },
        { value: 'ISO 9001',  unit: '',    label: 'certified' },
      ],
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'Operating Principles',
      title: 'Three principles, repeated until they\'re boring.',
      columns: 3,
      items: [
        { icon: '①', title: 'The cell is part of the device.', desc: 'We refuse to ship without understanding how the cell sits in the device, what heat sources are nearby, and how it gets charged.' },
        { icon: '②', title: 'Boring is the goal.',             desc: 'Exciting programs mean surprises. We over-document, over-trace and over-test so units at scale are predictable.' },
        { icon: '③', title: 'The PM is the customer\'s engineer.', desc: 'A PM has standing to say no to a cost-cut that degrades cycle life. They negotiate FOR you, not against you.' },
      ],
    }),
    blk('feat-grid', {
      background: 'grey',
      eyebrow: 'Get to know us',
      title: 'Three ways to learn more.',
      columns: 3,
      items: [
        { icon: '◆', title: 'Company Profile', desc: 'Origin story, leadership, corporate facts and operating principles.' },
        { icon: '◆', title: 'Factory Tour',    desc: 'Site layout, production lines, in-line inspection and audit-readiness.' },
        { icon: '◆', title: 'Team',            desc: 'How we\'re organised across R&D, engineering, quality and manufacturing.' },
      ],
    }),
    blk('cert-wall', {
      background: 'grey',
      eyebrow: 'Recognition',
      title: 'Certifications you can audit.',
      lead: 'We hold every certification we\'d want our own suppliers to have. Reports available under NDA on request.',
      chips: ['ISO 9001:2015', 'ISO 13485 aligned', 'ISO 14001:2015', 'IATF 16949 audit', 'UN 38.3', 'IEC 62133-1/-2', 'UL 1642', 'UL 2054', 'CE', 'KC 62133', 'PSE Diamond', 'PSE Round', 'RoHS / REACH', 'MSDS / SDS'],
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Want to visit us in person?',
      subtitle: 'We host customer audits weekly. Fly into Shenzhen (SZX) or Guangzhou (CAN); we arrange transport, accommodation and a 90-minute walkthrough.',
      button: { label: 'Schedule a Visit', url: '/contact.html' },
    }),
  ];
}

// -- about/profile -------------------------------------------------------------
function aboutProfileBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
      title: 'Built by engineers, for engineers.',
      subtitle: 'A privately-held lithium-cell manufacturer with one engineering culture, three production lines and one rule: the cell is part of the device.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'About', url: '/about/' }, { label: 'Company Profile' }],
    }),
    blk('content-split', {
      background: 'light',
      eyebrow: 'Origin',
      title: 'Why a fifth battery company was needed.',
      paragraphs: [
        'In 2018 our four founders were senior cell engineers at three different tier-1 manufacturers. Between them they had shipped over 800 million cells — and watched dozens of promising hardware programs die because their cell vendor would not move past their MP catalogue.',
        'Engineer-led: every executive holds a current engineering review on at least one program. One quality system, three lines: polymer Li-Po, custom-shaped Li-Po and cylindrical Li-Ion. NDA in 24 hours so a customer can send drawings on day one.',
      ],
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1000&q=80',
      imagePosition: 'right',
    }),
    blk('stat-strip', {
      dark: false,
      eyebrow: 'Corporate Facts',
      title: 'The numbers behind the company.',
      stats: [
        { value: '2018', unit: '',       label: 'Founded' },
        { value: '100',  unit: '+',      label: 'Engineers & QC' },
        { value: '35',   unit: '+',      label: 'Export markets' },
        { value: '12',   unit: 'm / yr', label: 'Cells shipped' },
      ],
    }),
    blk('spec-table', {
      background: 'grey',
      eyebrow: '',
      title: '',
      headers: ['Field', 'Detail'],
      rows: [
        ['Legal name',     'Acme Battery Co., Ltd. (Dongguan)'],
        ['Ownership',      'Privately held. Founders + management hold 100%. No external investors.'],
        ['Headquarters',   'Building A, Industrial Park, Shenzhen 518000, China'],
        ['Pilot site',     'Block C, Dongguan, Guangdong (separate from MP for parallel programs)'],
        ['Annual capacity','1.5 million cells / month, three lines combined'],
        ['Active programs','180+ live customer programs across 35 countries'],
        ['Top-3 markets',  'EU 38% · North America 27% · Asia ex-China 18%'],
        ['Quality system', 'ISO 9001:2015 + ISO 13485-aligned line for medical'],
        ['Insurance',      'USD 5M product liability + USD 50M cargo through Allianz'],
      ],
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'Leadership',
      title: 'The four founders, still on the floor.',
      lead: 'All four founders remain operational. Each carries a current engineering or quality program and signs off the production routing for at least one tier-1 customer.',
      columns: 4,
      items: [
        { icon: 'CL', title: 'Chen Li · CEO & co-founder',  desc: '14 years in cathode and electrolyte development. Holds 9 patents on high-voltage Li-Po formulations.' },
        { icon: 'WZ', title: 'Wei Zhang · CTO & co-founder', desc: '16 years in winding, stacking and sealing process. Designed the pilot line and the cleanroom medical line.' },
        { icon: 'SH', title: 'Sun Hua · Head of QA',         desc: '11 years running IEC 62133, UN 38.3 and IEC 60601 programs. CAPA reviewer of last resort.' },
        { icon: 'LM', title: 'Liu Min · Head of BD',         desc: 'The engineer who answers your first email. Translates customer specs into program briefs.' },
      ],
    }),
    blk('feat-grid', {
      background: 'grey',
      eyebrow: 'Operating Principles',
      title: 'What everyone here actually believes.',
      columns: 3,
      items: [
        { icon: '①', title: 'The cell is part of the device.', desc: 'We refuse to ship without understanding how the cell sits in the device, what other heat sources are nearby, and how it gets charged.' },
        { icon: '②', title: 'Boring is the goal.',             desc: 'Exciting programs mean surprises. We over-document, over-trace and over-test — so the units that ship at scale are predictable.' },
        { icon: '③', title: 'The PM is the customer\'s engineer.', desc: 'If a process change degrades cycle life by 4% to save 8% cost, the PM has standing to say no on your behalf.' },
        { icon: '④', title: 'Open BOM by default.',           desc: 'You see actual cathode, anode, separator, electrolyte and casing suppliers. We do not run black-box BOMs.' },
        { icon: '⑤', title: 'The truth is faster than the pitch.', desc: 'If your spec is wrong, we will tell you in week one and explain why — even if it loses us the project.' },
        { icon: '⑥', title: '10-year traceability.',          desc: 'Every cell links to its winding machine, shift, materials lot, operator and test station. Retained for 10 years.' },
      ],
    }),
    blk('cert-wall', {
      background: 'light',
      eyebrow: 'Recognition',
      title: 'Audited & recognised.',
      lead: 'We hold every certification we\'d want our own suppliers to have. Reports available under NDA on request.',
      chips: ['ISO 9001:2015', 'ISO 13485 aligned', 'ISO 14001:2015', 'IATF 16949 audit', 'UN 38.3', 'IEC 62133-1/-2', 'UL 1642', 'UL 2054', 'CE', 'KC 62133', 'PSE Diamond', 'PSE Round', 'RoHS / REACH', 'MSDS / SDS'],
    }),
    blk('content-split', {
      background: 'grey',
      eyebrow: 'Responsibility',
      title: 'Sustainability, briefly.',
      paragraphs: [
        'Materials: cobalt sourcing audited annually under the OECD Due Diligence Guidance. Cobalt-free LFP available for energy-storage and consumer programs that don\'t need maximum density.',
        'Manufacturing: solar covers 38% of facility electricity. Wastewater is closed-loop; spent NMP solvent is recovered at 92% efficiency.',
        'End of life: EU Battery Regulation 2023/1542 compliant from day one. We provide an EU Battery Passport per shipment for programs entering the EU after February 2027.',
      ],
      image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1000&q=80',
      imagePosition: 'right',
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Visit the company in person.',
      subtitle: 'We host customer audits weekly. Fly into Shenzhen (SZX) or Guangzhou (CAN); we arrange ground transport, accommodation and a 90-minute site walkthrough.',
      button: { label: 'Schedule a Visit', url: '/contact.html' },
    }),
  ];
}

// -- about/factory -------------------------------------------------------------
function aboutFactoryBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=1920&q=80',
      title: 'Three lines, one quality system.',
      subtitle: '18,000 m² of dedicated battery manufacturing across two sites in Dongguan — engineered for parallel customer programs without contamination.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'About', url: '/about/' }, { label: 'Factory Tour' }],
    }),
    blk('content-split', {
      background: 'light',
      eyebrow: 'Two Sites',
      title: 'Pilot & Mass Production, deliberately separated.',
      paragraphs: [
        'Pilot batches and live MP customer programs run in different buildings on different power supplies. New chemistry trials never share air with a tier-1 medical customer\'s production batch.',
        'Site A — Mass Production: 12,000 m² in Shenzhen Industrial Park, three production lines, automated material handling, in-line dry-room (-40 °C dew point), formation grading, packaging.',
        'Site B — Pilot & NPI: 6,000 m² in Dongguan. Pilot line equipped identically to MP lines, plus a Class 100K cleanroom for medical and aerospace programs.',
      ],
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1000&q=80',
      imagePosition: 'right',
    }),
    blk('stat-strip', {
      dark: false,
      eyebrow: 'Capacity',
      title: 'What we can ship right now.',
      stats: [
        { value: '18000', unit: ' m²',       label: 'Total floor area' },
        { value: '3',     unit: '',          label: 'MP lines' },
        { value: '1500',  unit: 'k / mo',    label: 'Cell capacity' },
        { value: '100',   unit: 'K class',   label: 'Cleanroom' },
      ],
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'Production Lines',
      title: 'Five lines, each tuned for its product.',
      lead: 'All five run on the same quality system but use equipment optimised for the geometry. Process parameters from the pilot line transfer cleanly into MP.',
      columns: 3,
      items: [
        { icon: 'L1', title: 'Polymer Li-Po (MP)',     desc: 'Z-stacking up to 60 layers, vacuum sealing, formation in 8 stages. Capacity 600k cells / mo.' },
        { icon: 'L2', title: 'Custom-Shape Li-Po (MP)', desc: 'In-house tooling shop — new geometry tools in 25–35 days. Round, curved, stepped. 250k cells / mo.' },
        { icon: 'L3', title: 'Cylindrical Li-Ion (MP)', desc: '14500, 18650, 21700, 26650, 32700. Korean and Japanese automation. 650k cells / mo.' },
        { icon: 'L4', title: 'Pack Assembly',           desc: 'Spot and laser welding, BMS integration, IP65 / IP67 housings. 50k packs / mo.' },
        { icon: 'L5', title: 'Cleanroom (Medical)',     desc: 'Class 100K cleanroom for IEC 60601-aligned production. Gowned operators, DHF documentation.' },
        { icon: 'PL', title: 'Pilot Line (NPI)',        desc: 'Identical equipment to L1/L2 at 1/10 scale. Where new geometries qualify before MP transfer.' },
      ],
    }),
    blk('steps-grid', {
      background: 'grey',
      eyebrow: 'Quality Control',
      title: 'Inspection at every stage.',
      lead: '100% in-line inspection on every cell — no statistical sampling shortcuts. Reports flow into your dashboard within 24 hours.',
      steps: [
        { num: '01', title: 'Incoming materials', body: 'Cathode, anode, separator, electrolyte, casing — QC sampled from every lot. Annual supplier audits.', points: ['ICP-MS purity check', 'Dimensional CMM', 'Supplier CoA verified'] },
        { num: '02', title: 'In-process',         body: 'Coating thickness, alignment, slitting and stacking. SPC charts on every line, every shift.', points: ['Beta-gauge thickness', 'CCD edge alignment', 'Sealing peel-strength'] },
        { num: '03', title: 'Formation & grading', body: 'Multi-step formation curves, OCV/IR/capacity grading. A/B grade separation per spec.', points: ['8-step formation', '3-point grading', 'Self-discharge after 7-day rest'] },
        { num: '04', title: 'Final shipment',     body: 'AQL sampling on packaging, drop test on cartons, full UN 38.3 documentation per lot.', points: ['OCV stability', 'Carton drop test', 'UN 38.3 + MSDS attached'] },
      ],
    }),
    blk('spec-table', {
      background: 'light',
      eyebrow: 'Audit Readiness',
      title: 'Walk in, audit anything.',
      lead: 'We host customer audits every week. Document control is live, not staged. Your auditor can pick any cell and we can show every parameter that touched it.',
      headers: ['What you can audit', 'Available', 'Notes'],
      rows: [
        ['Production routing for any cell SN',     '< 5 min',           'Pulled from MES live'],
        ['Operator training & competency records', 'Live',              'Per shift, per machine'],
        ['Equipment calibration records',          'Live',              '10-yr retention'],
        ['Materials traceability for any lot',     'Live',              'To incoming CoA'],
        ['CAPA log (last 24 months)',              'Available on-site', 'Customer-redacted version'],
        ['Internal audit findings & closure',      'Available on-site', 'Quarterly'],
        ['Supplier audit reports',                 'Available under NDA', 'Top 20 suppliers'],
      ],
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Book a factory visit.',
      subtitle: '90-minute walkthrough with the line manager and one of the four founders. We arrange airport pickup from Shenzhen (SZX) or Guangzhou (CAN).',
      button: { label: 'Schedule Your Audit', url: '/contact.html' },
    }),
  ];
}

// -- about/team ----------------------------------------------------------------
function aboutTeamBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80',
      title: 'Team',
      subtitle: 'A hundred engineers, operators and specialists — one building, one shared line.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'About', url: '/about/' }, { label: 'Team' }],
    }),
    blk('content-split', {
      background: 'light',
      eyebrow: 'Headcount',
      title: 'From fifteen to a hundred.',
      paragraphs: [
        'We started with fifteen people — four founders plus engineering, quality and a tiny commercial team. Eight years in we\'re at a hundred and twenty across the two Dongguan sites, with roughly 70% of headcount on engineering, quality and manufacturing roles.',
        'No outsourced QA. No outsourced manufacturing. Even logistics + supply chain run in-house so the same person who promised your lead time is the one who tracks it.',
      ],
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1000&q=80',
      imagePosition: 'right',
    }),
    blk('feat-grid', {
      background: 'grey',
      eyebrow: 'Organisation',
      title: 'Six groups, one line.',
      columns: 3,
      items: [
        { icon: 'R&D',  title: 'R&D',          desc: 'Chemistry, electrode design, new geometry development. 14 staff.' },
        { icon: 'ENG',  title: 'Engineering',  desc: 'Cell engineering, BMS, mechanical CAD, NPI. 22 staff.' },
        { icon: 'QA',   title: 'Quality',      desc: 'In-line SPC, supplier audit, certification programs. 18 staff.' },
        { icon: 'MFG',  title: 'Manufacturing', desc: 'MP line operators, shift supervisors, maintenance. 48 staff.' },
        { icon: 'SCM',  title: 'Supply & Logistics', desc: 'Procurement, inbound QC, shipping, customs. 9 staff.' },
        { icon: 'BD',   title: 'Commercial',   desc: 'Engineer-led BD, customer PMs, account engineers. 7 staff.' },
      ],
    }),
    blk('content-split', {
      background: 'light',
      eyebrow: 'Program teams',
      title: 'One engineer, whole program.',
      paragraphs: [
        'Every active customer program has a named engineering PM — your single point of contact for chemistry decisions, BOM substitutions, sample timing, MP ramp. Your PM has standing to push back on internal trade-offs that would hurt you.',
        'The PM sits with R&D when your spec demands new chemistry, with Quality when an inspection finding affects your lot, and with the line supervisor on production days. They\'re your engineer inside our building.',
      ],
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000&q=80',
      imagePosition: 'left',
    }),
    blk('cta-band', {
      background: 'grey',
      title: 'We hire year-round.',
      subtitle: 'If you\'re a cell engineer, quality engineer or process tech with tier-1 experience, send a CV to careers@acme-battery.com.',
      button: { label: 'See open roles', url: '/contact.html' },
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Meet the team.',
      subtitle: 'Customer visits include a 90-minute lab + line walkthrough led by the engineering PM assigned to your program.',
      button: { label: 'Schedule a Visit', url: '/contact.html' },
    }),
  ];
}

// =============================================================================
//  APPLICATIONS
// =============================================================================

function applicationsIndexBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=80',
      title: 'Where we ship today.',
      subtitle: 'Four core domains and a long tail of bespoke programs — every cell engineered for the device it lives in.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Applications' }],
    }),
    blk('content-split', {
      background: 'light',
      eyebrow: 'How we approach a new application',
      title: 'Each industry brings its own physics — and its own paperwork.',
      paragraphs: [
        'A cell that runs an AR headset is a different chemistry, geometry and certification stack from one that runs a glucose monitor. So we don\'t treat applications as a catalogue lookup — we treat them as engineering problems with regulatory constraints.',
        'You send us the device, the duty cycle and the markets you\'re shipping into. We come back with a cell spec, a chemistry choice, a certification plan and a sample timeline.',
      ],
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1000&q=80',
      imagePosition: 'right',
    }),
    blk('feat-grid', {
      background: 'grey',
      eyebrow: 'Core domains',
      title: 'Four domains we ship into every week.',
      columns: 4,
      items: [
        { icon: '▤', title: 'AR / VR Glasses',  desc: 'Ultra-thin cells that fit inside slim temples and headsets without adding weight.' },
        { icon: '✚', title: 'Medical Devices',  desc: 'ISO 13485-aligned production for wearable monitors, hearing aids and pumps.' },
        { icon: '◔', title: 'Wearables',        desc: 'Curved and shaped cells for smartwatches, TWS earbuds, fitness trackers and rings.' },
        { icon: '◈', title: 'IoT Devices',      desc: 'Long-life cells for sensors, trackers and asset-monitoring edge devices.' },
      ],
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'Long tail',
      title: 'Don\'t see your category?',
      lead: 'These are programs we run regularly but don\'t front-page. Send a brief and we\'ll match you to the closest existing program.',
      columns: 3,
      items: [
        { icon: '⌖', title: 'Drones & Robotics', desc: 'High-discharge LiPo packs (40-80C peak), thermal-runaway hardened pouches, BMS with CAN.' },
        { icon: '⚡', title: 'Power Tools',       desc: '21700 NMC and LFP packs with bus-bar welded tabs, 18-60V configurations.' },
        { icon: '⌬', title: 'E-Mobility',        desc: 'Pouch and prismatic packs for e-scooters, e-bikes and last-mile delivery vehicles.' },
        { icon: '☢', title: 'Aerospace',         desc: 'UN 38.3 + DO-160 documentation. Custom 18650 and prismatic builds for UAVs and avionics.' },
        { icon: '◉', title: 'Energy Storage',    desc: 'LFP modules for residential and small-commercial ESS, 5-15 kWh class.' },
        { icon: '★', title: 'One-off bespoke',   desc: 'Send a CAD model and a duty cycle. We\'ll quote feasibility in 5 working days.' },
      ],
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Tell us what you\'re building.',
      subtitle: 'Programs start with a 30-minute engineering call. NDA in 24 hours so you can share drawings on day one.',
      button: { label: 'Start a Conversation', url: '/contact.html' },
    }),
  ];
}

function applicationsArVrBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1920&q=80',
      title: 'AR / VR Glasses',
      subtitle: 'Ultra-thin polymer cells for slim temples and headsets — engineered to fit, not retrofitted.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Applications', url: '/applications/' }, { label: 'AR / VR Glasses' }],
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'Why teams pick us',
      title: 'Slim temples, all-day runtime.',
      columns: 2,
      items: [
        { icon: '◔', title: 'Ultra-thin pouch cells', desc: 'Down to 0.4 mm thick. Round, rectangular, stepped — sized to fit your existing temple geometry without forcing a redesign.' },
        { icon: '🌡', title: 'Thermal-aware BMS',    desc: 'Skin-contact temperature kept under 41 °C even at peak draw. Active cell balancing for paired temple packs.' },
        { icon: '⚡', title: 'Fast charging',         desc: '1.5C fast-charge profiles supported with cycle-life models showing < 5% SOH loss over 500 cycles.' },
        { icon: '↻', title: 'High cycle count',      desc: '500+ cycles to 80% SOH at 0.5C / 1C protocols. Verified on 20-cell representative samples per build.' },
      ],
    }),
    blk('spec-table', {
      background: 'grey',
      eyebrow: 'Typical specs',
      title: 'What we usually ship into AR/VR.',
      headers: ['Parameter', 'Range', 'Notes'],
      rows: [
        ['Capacity',       '120 - 800 mAh',         'Higher capacities for paired temple builds'],
        ['Thickness',      '0.4 - 3.5 mm',          'Sub-1 mm builds available with NDA'],
        ['Voltage',        '3.7 V / 3.85 V',         'High-voltage 4.45V chemistries on request'],
        ['Form factor',    'Pouch (custom shape)',  'Round, stepped, notched all supported'],
        ['Cycle life',     '500+ @ 0.5C / 0.5C',    'Tested per IEC 62133-2'],
        ['Operating temp', '-10 °C to +55 °C',      'Skin-contact safe to 41 °C surface'],
      ],
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Building the next pair of glasses?',
      subtitle: 'Send a STEP file and the runtime target — we\'ll quote a custom cell in 5 working days.',
      button: { label: 'Request a Quote', url: '/contact.html' },
    }),
  ];
}

function applicationsMedicalBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1920&q=80',
      title: 'Medical Devices',
      subtitle: 'ISO 13485-aligned production for wearable monitors, hearing aids, insulin pumps and single-use devices.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Applications', url: '/applications/' }, { label: 'Medical Devices' }],
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'Why medical OEMs pick us',
      title: 'Built for audited supply chains.',
      columns: 3,
      items: [
        { icon: '✓', title: 'ISO 13485 Alignment',     desc: 'Dedicated clean-room line, document control, CAPA and design-history-file support.' },
        { icon: '✓', title: 'Biocompatible Materials', desc: 'USP Class VI casings and adhesives for skin-contact wearables.' },
        { icon: '✓', title: 'Low Self-Discharge',      desc: '< 2% per month — critical for devices stocked on hospital shelves.' },
        { icon: '✓', title: 'Long Shelf Life',         desc: 'Up to 5 years storage with controlled SOC and humidity.' },
        { icon: '✓', title: 'Sterilization Compatible',desc: 'EtO-stable formulations for sterile-packaged single-use devices.' },
        { icon: '✓', title: 'Serial-Level Traceability',desc: 'Every cell links to its process, materials and test data — retrievable 10 years later.' },
      ],
    }),
    blk('content-split', {
      background: 'grey',
      eyebrow: 'What we power today',
      title: 'Programs already in the field.',
      paragraphs: [
        'Continuous glucose monitors (CGM), wearable cardiac monitors, neurostimulator implants, smart inhalers and hearing aids — all running on cells we manufacture under one quality system.',
        'For Class II and Class III devices we provide a Device Master File extract on request, plus annual change-control updates so your 510(k) or CE-MDR submission stays current.',
      ],
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1000&q=80',
      imagePosition: 'right',
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Working on a medical program?',
      subtitle: 'Send NDA + intended use. We\'ll come back with a chemistry recommendation, a certification path and a DMF excerpt.',
      button: { label: 'Start a Medical Project', url: '/contact.html' },
    }),
  ];
}

function applicationsWearablesBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1920&q=80',
      title: 'Wearables',
      subtitle: 'Curved, shaped and round cells that bend around your product — not the other way around.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Applications', url: '/applications/' }, { label: 'Wearables' }],
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'Geometries we ship',
      title: 'The cell bends around the product, not the other way.',
      columns: 2,
      items: [
        { icon: '◯', title: 'Curved & shaped pouches', desc: 'R ≥ 25 mm bend radius, stepped profiles for slim wristbands, ring-shaped pouches for smart rings.' },
        { icon: '●', title: 'Round coin cells for earbuds & rings', desc: 'LIR 1054 / 1254 / 1454 in stainless steel, reflow-compatible, 500-1000 cycles.' },
      ],
    }),
    blk('content-split', {
      background: 'grey',
      eyebrow: 'Device-level guidance',
      title: 'We help size the cell into the product.',
      paragraphs: [
        'Send us the enclosure CAD and the runtime target. We respond with a cell geometry that fits, a chemistry that hits your cycle-life requirement, and a feasibility note on charging speed + skin-contact temperature.',
        'For TWS earbuds we typically pair a coin cell in each bud with a primary or secondary battery in the case. We can spec all three from one BOM.',
      ],
      image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=1000&q=80',
      imagePosition: 'right',
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Send us the enclosure.',
      subtitle: 'NDA in 24 hours. Feasibility note in 5 working days. Samples in 2-4 weeks.',
      button: { label: 'Request a Quote', url: '/contact.html' },
    }),
  ];
}

function applicationsIotBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=1920&q=80',
      title: 'IoT Devices',
      subtitle: 'Long-life cells for sensors, trackers and asset-monitoring edge devices. From -40 °C cold chain to +85 °C industrial.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Applications', url: '/applications/' }, { label: 'IoT Devices' }],
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'Why IoT vendors pick us',
      title: 'An IoT node is only as reliable as its cell.',
      columns: 3,
      items: [
        { icon: '❆', title: 'Wide Temperature',  desc: '−40 °C to +85 °C variants for cold-chain, outdoor and industrial deployments.' },
        { icon: '⌛', title: 'Long Shelf Life',   desc: 'Li-SOCl₂ primaries with 10+ year passive life. Li-MnO₂ for higher pulse current.' },
        { icon: '⚡', title: 'High-Pulse Ready',  desc: 'Hybrid cell + supercap modules for LoRa, NB-IoT and LTE-M transmission bursts.' },
        { icon: '↻', title: 'Rechargeable Options', desc: 'LiFePO4 and Li-ion for solar-harvesting or wired backup configurations.' },
        { icon: '▣', title: 'IP67 / IP68 Packs', desc: 'Sealed enclosures with gas-vent membranes for outdoor and underground use.' },
        { icon: '✓', title: 'UN 38.3 & ATEX',    desc: 'Certification support for hazardous-area, aerospace and maritime deployments.' },
      ],
    }),
    blk('content-split', {
      background: 'grey',
      eyebrow: 'What we\'ve powered in the field',
      title: 'Programs already running.',
      paragraphs: [
        'Asset trackers shipped on cargo containers across three continents, gas-meter modules in EU smart grids, cold-chain temperature loggers in vaccine distribution, NB-IoT water meters in municipal deployments.',
        'For each we provide a Battery Life Calculator (BLC) — a sheet that takes your duty cycle as input and predicts cell life in months, so you can confidently quote service intervals to your end customer.',
      ],
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&q=80',
      imagePosition: 'right',
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Specifying a node for 10 years in the field?',
      subtitle: 'Send the duty cycle and the deployment environment — we\'ll come back with a cell, a pack design and a BLC tuned to your numbers.',
      button: { label: 'Talk to an Engineer', url: '/contact.html' },
    }),
  ];
}

// =============================================================================
//  SOLUTIONS
// =============================================================================

function solutionsIndexBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80',
      title: 'From napkin sketch to mass production.',
      subtitle: 'Three connected stages — design support, prototyping, mass production — run by the same engineering team. No hand-offs.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Custom Solutions ★' }],
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'Stages',
      title: 'How a custom program runs.',
      columns: 3,
      items: [
        { icon: '①', title: 'Design Support',  desc: 'DFM proposal in 3 working days. Cell sizing, chemistry match, thermal simulation, BMS topology.' },
        { icon: '②', title: 'Prototyping',     desc: 'A-, B- and C-sample stages on a dedicated low-MOQ line. 2-6 weeks per stage.' },
        { icon: '③', title: 'Mass Production', desc: 'Same engineering team, same quality system. 4-6 weeks for first MP lot, 3-4 weeks for repeats.' },
      ],
    }),
    blk('content-split', {
      background: 'grey',
      eyebrow: 'Speed',
      title: 'What "fast" actually means.',
      paragraphs: [
        'DFM proposal: 3 working days. NDA: 24 hours. Feasibility analysis: 5 working days. A-samples: 2 weeks. B-samples: 3-4 weeks. C-samples: 4-6 weeks. First MP lot: 4-6 weeks after sample approval.',
        'These are not best-case numbers — they\'re the typical lead times we hit across the customer book. If we can\'t hit them for your program, you\'ll know in the first feasibility note, not in week four.',
      ],
      image: 'https://images.unsplash.com/photo-1581092920534-2d9c0b1d3ebd?w=1000&q=80',
      imagePosition: 'right',
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'Why hardware leads stay',
      title: 'The reasons hardware leads tell us they stayed.',
      columns: 3,
      items: [
        { icon: '◈', title: 'One PM, end to end',         desc: 'The engineer who quotes the program also signs off the production routing. No hand-offs.' },
        { icon: '◯', title: 'Pilot ≡ MP',                 desc: 'Pilot line uses the same winding, stacking and sealing equipment as MP — process parameters transfer cleanly.' },
        { icon: '⇄', title: 'NDA in 1 day',               desc: 'Mutual NDA, no legal back-and-forth. We sign so you can send drawings and BOMs.' },
        { icon: '△', title: 'Compliance owned by us',     desc: 'UN 38.3, IEC 62133, UL 1642, KC, CE — we file, you receive certificates with shipment.' },
        { icon: '⌥', title: 'BOM transparency',           desc: 'You see actual cathode, anode, separator, electrolyte and casing suppliers. No black-box BOMs.' },
        { icon: '✎', title: 'Datasheet within 5 days',    desc: 'Full datasheet (electrical, mechanical, abuse, transport) released with first samples — not after MP.' },
      ],
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Start a custom program.',
      subtitle: 'Send NDA + a spec sheet (or just a sketch). We\'ll come back within 24 hours with the first engineering questions.',
      button: { label: 'Request a Quote', url: '/contact.html' },
    }),
  ];
}

function solutionsDesignBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1920&q=80',
      title: 'Design Support',
      subtitle: 'A DFM proposal in 3 working days. Cell sizing, chemistry match, thermal simulation, BMS topology — all engineering-led.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Custom Solutions', url: '/solutions/' }, { label: 'Design Support' }],
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'What you get',
      title: 'A DFM proposal in 3 working days.',
      columns: 3,
      items: [
        { icon: '◈', title: 'Cell Sizing',         desc: 'Capacity, thickness and shape optimized against your duty cycle and runtime target.' },
        { icon: '◯', title: 'Chemistry Match',     desc: 'LCO, NMC, LFP, HV, LTO — we select for your energy/power/cycle trade-off.' },
        { icon: '⇄', title: 'Cycle-Life Model',    desc: 'Predicted SOH at 1, 2 and 3 years based on your real use pattern.' },
        { icon: '△', title: 'Thermal Simulation',  desc: 'FEA for skin-contact limits, enclosure heat paths and fast-charge behaviour.' },
        { icon: '⌥', title: 'BMS Topology',        desc: 'PCM, fuel gauge, smart-battery, wireless front-end — spec and reference design.' },
        { icon: '✓', title: 'Compliance Pre-check',desc: 'IEC 62133, UN 38.3, FCC, KC — risks flagged before sample tooling.' },
      ],
    }),
    blk('content-split', {
      background: 'grey',
      eyebrow: 'Inputs we need',
      title: 'The shorter, the better.',
      paragraphs: [
        'Minimum: a CAD model (or sketch) of the cell cavity, a runtime target, and the markets you\'re shipping into. That\'s it.',
        'Optional but speeds things up: existing cell datasheet you\'re replacing, charger spec, expected duty cycle (e.g. "30 minutes use, 2 hours rest, 8 hours charge"), and certification deadlines.',
      ],
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1000&q=80',
      imagePosition: 'right',
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Send us what you have.',
      subtitle: 'Even a Whatsapp screenshot of the enclosure is enough to start the conversation. DFM proposal back in 3 working days.',
      button: { label: 'Start Design Support', url: '/contact.html' },
    }),
  ];
}

function solutionsPrototypingBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=1920&q=80',
      title: 'Prototyping',
      subtitle: 'A dedicated line for low-MOQ runs. A-, B- and C-sample stages with full data on every batch.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Custom Solutions', url: '/solutions/' }, { label: 'Prototyping' }],
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'Stages',
      title: 'A dedicated line for low-MOQ runs.',
      columns: 3,
      items: [
        { icon: 'A', title: 'A-sample: feasibility (2 weeks)', desc: 'Hand-built samples (10-30 pcs) to validate the geometry, chemistry and basic electrical envelope.' },
        { icon: 'B', title: 'B-sample: integration (3-4 weeks)', desc: 'Pilot-line batch (50-200 pcs) with full BMS integration, charging profiles and abuse pre-checks.' },
        { icon: 'C', title: 'C-sample: pre-production (4-6 weeks)', desc: 'MP-equivalent batch (500-1000 pcs) with full QC data, certification submission and DGR packaging.' },
      ],
    }),
    blk('feat-grid', {
      background: 'grey',
      eyebrow: 'Data with every batch',
      title: 'What ships with every batch.',
      columns: 3,
      items: [
        { icon: '⎓', title: 'Capacity & IR',        desc: '100% of cells measured. Min/max/avg, σ, cpk on every batch.' },
        { icon: '↺', title: 'Cycle Data',           desc: 'Representative samples cycled to provide expected SOH curves.' },
        { icon: '🌡', title: 'Thermal Profile',      desc: 'Surface temperature under your real load, with thermal camera images.' },
        { icon: '⚠', title: 'Abuse Pre-check',      desc: 'Sample-size overcharge, short-circuit and nail-penetration before certification submission.' },
        { icon: '✎', title: 'Dimensional Report',   desc: 'CMM measurements against your CAD — tolerances on thickness, length, width.' },
        { icon: '📎', title: 'Full Traceability',   desc: 'Every sample links to its winding machine, shift, materials lot and operator.' },
      ],
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Ready to move from CAD to hardware?',
      subtitle: 'Send specs + NDA. A-samples land on your bench in 2 weeks.',
      button: { label: 'Start Prototyping', url: '/contact.html' },
    }),
  ];
}

function solutionsMassProductionBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=1920&q=80',
      title: 'Mass Production',
      subtitle: 'One facility, one certified line. The same engineering team that ran your prototype runs your MP — no hand-offs, no chemistry drift.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Custom Solutions', url: '/solutions/' }, { label: 'Mass Production' }],
    }),
    blk('feat-grid', {
      background: 'light',
      eyebrow: 'How we ship at scale',
      title: 'One facility, one certified line.',
      columns: 3,
      items: [
        { icon: '▦', title: 'Automated Winding & Stacking', desc: 'Laser-aligned electrode stacking with inline CCD inspection.' },
        { icon: '✓', title: '100% Electrical Screening',    desc: 'Every cell undergoes capacity, IR, OCV-drop and self-discharge aging before shipment.' },
        { icon: '🔒', title: 'Cell-ID Traceability',         desc: 'Laser-engraved serial on every cell links to materials lot, line, shift, operator and test results.' },
        { icon: '⚠', title: 'Safety Testing',               desc: 'Sample-based nail penetration, overcharge, thermal abuse, drop, crush and short-circuit.' },
        { icon: '📦', title: 'DGR Packaging',                desc: 'UN 38.3-compliant packaging for air, sea and rail. DDP shipping available.' },
        { icon: '⏱', title: 'Lead Time',                    desc: '4–6 weeks after sample approval for first MP lot. 3–4 weeks for repeat orders.' },
      ],
    }),
    blk('cert-wall', {
      background: 'grey',
      eyebrow: 'Compliance',
      title: 'Certifications that matter to your buyer.',
      lead: 'Every shipment includes the matching certificate as part of the documentation pack. Reports available under NDA.',
      chips: ['UN 38.3', 'IEC 62133-1', 'IEC 62133-2', 'UL 1642', 'UL 2054', 'CE', 'KC 62133', 'PSE Diamond', 'PSE Round', 'BIS', 'RoHS / REACH', 'MSDS / SDS'],
    }),
    blk('steps-grid', {
      background: 'light',
      eyebrow: 'Lifecycle',
      title: 'How a typical MP program runs.',
      steps: [
        { num: '01', title: 'Pre-production', body: 'Final BOM lock, materials qualified at pilot scale, equipment changeover scheduled.', points: ['Final BOM frozen', 'CoA for every material lot', 'Equipment changeover plan'] },
        { num: '02', title: 'Ramp-up',         body: 'First MP lot 5-10k pcs. Full statistical QC review before scaling up.', points: ['Cpk > 1.33 on every metric', 'Engineering PM on-site', 'Daily yield review'] },
        { num: '03', title: 'Steady state',    body: '20k+ pcs per month. Quarterly review meeting + monthly metric dashboard.', points: ['Yield trends', 'Field failure rate', 'Cost-down opportunities'] },
        { num: '04', title: 'End of life',     body: '6-month notice on chemistry transitions. Last-buy + spares-buy windows offered.', points: ['Last-buy + spares window', '5-year material retention', 'Migration plan to replacement chemistry'] },
      ],
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Ready to lock in your MP supply?',
      subtitle: 'Send your approved sample + forecast. We\'ll come back within 48 hours with a production schedule and a 12-month price commitment.',
      button: { label: 'Lock in MP Capacity', url: '/contact.html' },
    }),
  ];
}

// =============================================================================
//  FAQ
// =============================================================================

function faqBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&q=80',
      title: 'Frequently Asked Questions',
      subtitle: 'The ten things we get asked every week.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'FAQ' }],
    }),
    blk('faq', {
      background: 'light',
      eyebrow: 'MOQ',
      title: 'Minimum order quantity.',
      items: [
        { q: 'What is your MOQ for standard catalog cells?',
          a: '500 pcs per SKU for first orders. Repeat orders accepted from 200 pcs. Sample quantities (10–50 pcs) are always available for qualification.' },
        { q: 'What is your MOQ for custom cells?',
          a: 'Custom cells without new tooling: 1,000 pcs. Custom cells with new tooling (new geometry, new connector): typically 3,000–5,000 pcs per order, 20,000 pcs per year commitment. Prototyping runs from 100 pcs.' },
        { q: 'Can you accept smaller test quantities?',
          a: 'Yes — we routinely ship 100-pc pilot runs for integration testing. The sample fee is refunded against your first MP order.' },
      ],
    }),
    blk('faq', {
      background: 'grey',
      eyebrow: 'Lead Time',
      title: 'How quickly we can ship.',
      items: [
        { q: 'How long for standard catalog cells?',
          a: '7–10 business days from purchase order, including electrical screening and DGR packaging. Stocked SKUs can ship in 3–5 days.' },
        { q: 'How long for custom cell samples?',
          a: 'A-samples: 2 weeks. B-samples: 3–4 weeks. C-samples (MP-equivalent): 4–6 weeks. Tooling lead time may add 1–3 weeks for new geometry.' },
        { q: 'How long for mass production after sample approval?',
          a: '4–6 weeks for first MP lot (includes PPAP or DHF documentation). 3–4 weeks for repeat orders. Urgent programs can be accelerated on a case-by-case basis.' },
        { q: 'What about shipping time?',
          a: 'Air: 3–7 days to most destinations. Sea: 25–45 days. Rail to EU: 18–25 days. DDP terms available.' },
      ],
    }),
    blk('faq', {
      background: 'light',
      eyebrow: 'Customization',
      title: 'How much can be customized.',
      items: [
        { q: 'What can you customize?',
          a: 'Capacity, voltage, shape (including curved, stepped and irregular), thickness, tab position, connector, wire harness, PCM/BMS, fuel gauge, label, and certification targets. Chemistry can be tuned for energy / power / cycle-life / low-temperature priorities.' },
        { q: 'Do you sign NDAs?',
          a: 'Yes — mutual NDAs are signed before any technical exchange. We can also sign exclusivity agreements for strategic projects.' },
        { q: 'Do you handle certification?',
          a: 'IEC 62133, UN 38.3, UL 2054, KC, PSE, BIS and CB reports — we handle these in-house or with accredited partners. FCC and CE marking can be coordinated as part of the program.' },
        { q: 'What CAD formats do you accept?',
          a: 'STEP, IGES, SolidWorks, Creo, Fusion 360. Hand sketches and 2D drawings (PDF / DXF) are also fine for the initial DFM conversation.' },
      ],
    }),
    blk('faq', {
      background: 'grey',
      eyebrow: 'Payment & Logistics',
      title: 'How commercial terms work.',
      items: [
        { q: 'What payment terms do you offer?',
          a: 'First orders: 30% deposit, 70% against BL copy. Established accounts: Net 30 or Net 60 against credit insurance. LC at sight accepted for orders above USD 100k.' },
        { q: 'What Incoterms do you support?',
          a: 'EXW Dongguan, FOB Yantian / Shenzhen, CIF / DDP to all major ports. We handle DGR documentation in-house.' },
        { q: 'Can you hold safety stock?',
          a: 'Yes — VMI arrangements available for programs above 50k pcs / month. Typical holding: 4–8 weeks of rolling forecast.' },
      ],
    }),
    blk('cta-band', {
      background: 'dark',
      title: 'Question not answered here?',
      subtitle: 'Our commercial team replies within one business day. Faster if you ping us on WeChat or WhatsApp.',
      button: { label: 'Ask Us Anything', url: '/contact.html' },
    }),
  ];
}

// =============================================================================
//  LEGAL PAGES (privacy / terms / legal)
// =============================================================================
//  Each is a long single-document page. We compose it as:
//    page-hero          (background image + H1 + breadcrumbs)
//    rich-text          (numbered sections via ## headings; ### sub-headings)
//    cta-band           (link out to /contact.html or /gdpr.html)
//  Operators can edit the markdown-style body directly in the admin drawer.

function privacyBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=80',
      title: 'Privacy Policy',
      subtitle: 'How we handle the data you share when you contact us, request a quote, or browse the site.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Privacy Policy' }],
    }),
    blk('rich-text', {
      background: 'light',
      title: '',
      body: [
        '_Last updated: April 22, 2026_',
        '',
        '## 1. Who we are',
        'This Privacy Policy applies to this site operated by **Acme Battery Co., Ltd.** ("Acme", "we", "us", "our"), with registered address in Dongguan, Guangdong, China. For any privacy-related question, contact us at [privacy@acme-battery.com](mailto:privacy@acme-battery.com).',
        '',
        '## 2. What data we collect',
        'We collect the minimum data needed to respond to your inquiries and to operate the site securely.',
        '',
        '### 2.1 Information you give us',
        '- **Contact-form submissions:** name, company, email, country, phone number, application type, and any message content you send.',
        '- **Email correspondence:** anything you include when you email us directly.',
        '',
        '### 2.2 Information collected automatically',
        '- **Server logs:** IP address, browser type, operating system, referring page, timestamps, and pages visited. Retained for up to 30 days for security and diagnostics.',
        '- **Cookies:** strictly-necessary cookies for site function are always set. Analytics / preference cookies are only set after you accept them in our cookie banner.',
        '',
        '## 3. Why we use it (legal basis under GDPR)',
        '- **Reply to your inquiry** — legitimate interest (6(1)(f)) / pre-contractual steps (6(1)(b)).',
        '- **Site security, fraud prevention, abuse protection** — legitimate interest (6(1)(f)).',
        '- **Analytics and performance monitoring** — consent (6(1)(a)).',
        '- **Legal or regulatory compliance** — legal obligation (6(1)(c)).',
        '',
        '## 4. How long we keep it',
        '- **Inquiry data:** up to 24 months after your last contact with us, unless a commercial relationship has begun — in which case retention is governed by our customer contract and applicable tax/accounting rules.',
        '- **Server logs:** up to 30 days.',
        '- **Cookie preferences:** up to 12 months, then we ask again.',
        '',
        '## 5. Who we share it with',
        'We do not sell your personal data. We share it only with processors that help us run the site and our business, under written data-processing agreements: hosting and CDN providers, email delivery providers, analytics providers (only if you have consented), and professional advisers (legal, accounting, auditors) when strictly necessary.',
        '',
        '## 6. International transfers',
        'Some of our processors are located outside the EEA (mainly in the United States and China). When data is transferred outside the EEA, we rely on the European Commission\'s Standard Contractual Clauses or on adequacy decisions where applicable.',
        '',
        '## 7. Your rights',
        'Under the GDPR you can ask us to: access, correct, delete or restrict processing of your personal data; receive a copy in a portable format; withdraw consent at any time; lodge a complaint with a supervisory authority. Submit a request via our [GDPR Data Subject Request form](/gdpr.html) or by emailing privacy@acme-battery.com.',
        '',
        '## 8. Cookies',
        'See the cookie banner shown on your first visit for the list of categories. You can change your preferences at any time by clicking the cookie icon in the footer.',
        '',
        '## 9. Security',
        'We use industry-standard measures: TLS for all traffic, hashed passwords, restricted database access, audit logging for all admin actions, and regular dependency updates.',
        '',
        '## 10. Children',
        'The site is intended for business audiences. We do not knowingly collect data from anyone under 16.',
        '',
        '## 11. Changes to this policy',
        'Material changes will be announced on this page. The "Last updated" date at the top reflects the most recent revision.',
        '',
        '## 12. Contact',
        'For any privacy-related question or to exercise your rights: [privacy@acme-battery.com](mailto:privacy@acme-battery.com).',
      ].join('\n'),
    }),
    blk('cta-band', {
      background: 'grey',
      title: 'Want to exercise a GDPR right?',
      subtitle: 'Submit an access, correction or deletion request through our verified intake form.',
      button: { label: 'Open GDPR Request Form', url: '/gdpr.html' },
    }),
  ];
}

function termsBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1920&q=80',
      title: 'Terms of Use',
      subtitle: 'The rules that govern your use of this website and our information services.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Terms of Use' }],
    }),
    blk('rich-text', {
      background: 'light',
      title: '',
      body: [
        '_Last updated: April 22, 2026_',
        '',
        '## 1. Acceptance',
        'By accessing this site you accept these Terms of Use. If you disagree, please do not use the site.',
        '',
        '## 2. Purpose of the site',
        'This site is operated by **Acme Battery Co., Ltd.** to present our company, our products, our applications and our custom programs. It is not a webshop; orders are placed only after direct commercial discussion and a signed purchase order.',
        '',
        '## 3. Permitted use',
        'You may browse the site, download published datasheets and request information for legitimate business purposes. You may not scrape the site, attempt to bypass technical limits, or use it to harm third parties.',
        '',
        '## 4. Intellectual property',
        'All text, photos, drawings, logos and other content are owned by us or licensed to us. You may not reproduce or redistribute any content for commercial purposes without our written permission.',
        '',
        '## 5. Inquiries and confidentiality',
        'Inquiries you submit via the contact form are treated as confidential business communication. We will sign a mutual NDA before any technical exchange beyond high-level information. See our [Privacy Policy](/privacy.html) for how we handle your personal data.',
        '',
        '## 6. Third-party links',
        'External links are provided for convenience. We are not responsible for the content or practices of any linked site.',
        '',
        '## 7. No warranty',
        'The site is provided **"as is"**. While we work to keep information accurate, we make no warranty that the site will be error-free or uninterrupted, or that any information will remain current.',
        '',
        '## 8. Limitation of liability',
        'To the maximum extent permitted by applicable law, we are not liable for any indirect, incidental, special, consequential or punitive damages arising from your use of the site.',
        '',
        '## 9. Indemnity',
        'You agree to indemnify and hold us harmless from any claim arising out of your misuse of the site or your violation of these Terms.',
        '',
        '## 10. Changes to the site and to these terms',
        'We may change the site at any time. Material changes to these Terms will be announced on this page; the "Last updated" date reflects the most recent revision.',
        '',
        '## 11. Governing law and disputes',
        'These Terms are governed by the laws of the People\'s Republic of China, without reference to conflict-of-law principles. Disputes that cannot be resolved amicably will be submitted to the competent court of Dongguan, Guangdong.',
        '',
        '## 12. Severability and waiver',
        'If any provision is held unenforceable, the remaining provisions stay in effect. A waiver of any breach is not a waiver of future breaches.',
        '',
        '## 13. Contact',
        'For any question about these Terms, write to [legal@acme-battery.com](mailto:legal@acme-battery.com).',
      ].join('\n'),
    }),
    blk('cta-band', {
      background: 'grey',
      title: 'Need to talk to us?',
      subtitle: 'Sales, technical and legal inquiries all reach a human within one business day.',
      button: { label: 'Contact Us', url: '/contact.html' },
    }),
  ];
}

function legalBlocks() {
  return [
    blk('page-hero', {
      image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1920&q=80',
      title: 'Legal Notice',
      subtitle: 'Company information, content responsibility and trademark details required under EU and Chinese law.',
      breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Legal Notice' }],
    }),
    blk('rich-text', {
      background: 'light',
      title: '',
      body: [
        '## 1. Company information',
        '**Acme Battery Co., Ltd.** — Building A, Industrial Park, Shenzhen 518000, China. Registered with the State Administration for Market Regulation under unified social credit code [USCC placeholder]. VAT / tax registration: [tax-ID placeholder].',
        '',
        '## 2. Responsible for content',
        'Editorial responsibility for the site content rests with the Marketing department of Acme Battery Co., Ltd., reachable at [marketing@acme-battery.com](mailto:marketing@acme-battery.com).',
        '',
        '## 3. Trademarks',
        '"Acme Battery", the Acme logo and the names of our product lines are trademarks of Acme Battery Co., Ltd. Other trademarks shown on the site (e.g. customer logos, technology partners) belong to their respective owners and are used with permission or under fair-use principles.',
        '',
        '## 4. Copyright',
        'Unless otherwise indicated, all text, photos, drawings and source code on this site are © Acme Battery Co., Ltd. and are protected under PRC and international copyright law.',
        '',
        '## 5. Disclaimer on product information',
        'Datasheets, drawings and specifications shown on the site reflect typical values for the product variants listed. Actual cells supplied under a commercial order are governed by the version-controlled datasheet attached to that order.',
        '',
        '## 6. External links',
        'Outbound links are provided for convenience. We have no influence over content on linked sites and assume no responsibility for them.',
        '',
        '## 7. Compliance and export control',
        'Lithium cells are dangerous goods (UN 38.3 class 9) and may be subject to export-control regulations depending on the country of destination and the end use. It is the buyer\'s responsibility to ensure compliance with applicable import / export rules.',
        '',
        '## 8. Online dispute resolution (EU users)',
        'The European Commission provides a platform for online dispute resolution: [ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr/). We are willing to participate in pre-litigation dispute resolution for material consumer disputes.',
        '',
        '## 9. How to reach us',
        'For legal matters: [legal@acme-battery.com](mailto:legal@acme-battery.com). For privacy matters: [privacy@acme-battery.com](mailto:privacy@acme-battery.com). For all other matters: [info@acme-battery.com](mailto:info@acme-battery.com).',
      ].join('\n'),
    }),
    blk('cta-band', {
      background: 'grey',
      title: 'See also: Privacy Policy and Terms of Use.',
      subtitle: 'Together with this Legal Notice they describe how we operate the site.',
      button: { label: 'Read the Privacy Policy', url: '/privacy.html' },
    }),
  ];
}

// =============================================================================

const MIGRATIONS = {
  'about/index':              aboutIndexBlocks,
  'about/profile':            aboutProfileBlocks,
  'about/factory':            aboutFactoryBlocks,
  'about/team':               aboutTeamBlocks,

  'applications/index':       applicationsIndexBlocks,
  'applications/ar-vr':       applicationsArVrBlocks,
  'applications/medical':     applicationsMedicalBlocks,
  'applications/wearables':   applicationsWearablesBlocks,
  'applications/iot':         applicationsIotBlocks,

  'solutions/index':          solutionsIndexBlocks,
  'solutions/design':         solutionsDesignBlocks,
  'solutions/prototyping':    solutionsPrototypingBlocks,
  'solutions/mass-production': solutionsMassProductionBlocks,

  'faq':                      faqBlocks,
  'privacy':                  privacyBlocks,
  'terms':                    termsBlocks,
  'legal':                    legalBlocks,
};

async function run() {
  // Find rows whose blocks are still empty. Don't touch rows an operator
  // has already started editing.
  const rows = await many(
    `SELECT id, slug FROM pages
      WHERE slug = ANY($1)
        AND (blocks IS NULL OR jsonb_typeof(blocks) <> 'array' OR jsonb_array_length(blocks) = 0)`,
    [Object.keys(MIGRATIONS)]
  );
  if (!rows.length) {
    console.log('[migrate-blocks] nothing to migrate (all target rows already have blocks)');
    return;
  }
  for (const row of rows) {
    const blocks = MIGRATIONS[row.slug]();
    await query(
      `UPDATE pages SET blocks = $1::jsonb, updated_at = now() WHERE id = $2`,
      [JSON.stringify(blocks), row.id]
    );
    console.log(`[migrate-blocks] populated ${blocks.length} blocks for ${row.slug}`);
  }
}

module.exports = { run };
