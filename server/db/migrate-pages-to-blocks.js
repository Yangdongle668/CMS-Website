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

// -----------------------------------------------------------------------------

const MIGRATIONS = {
  'about/index':   aboutIndexBlocks,
  'about/profile': aboutProfileBlocks,
  'about/factory': aboutFactoryBlocks,
  'about/team':    aboutTeamBlocks,
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
