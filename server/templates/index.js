// =====================================================================
// Industry templates — one-click site bootstrap.
//
// Each template is a recipe:
//   {
//     id: 'electronics',
//     label: 'Electronics OEM',
//     industry: 'Consumer / Industrial Electronics',
//     description: '...',
//     pages: [
//       {
//         slug: 'home',
//         title: '...',
//         meta_title: '...',
//         meta_description: '...',
//         hero_*: '...',
//         blocks: [
//           { block_type: 'hero_banner', content: {...} },
//           { block_type: 'value_props', content: {...} },
//           ...
//         ],
//       },
//       ...
//     ],
//   }
//
// Applied via POST /api/templates/apply { template_id, overrides }
// which UPSERTS pages and inserts the block list, idempotent re-apply
// of the same template will reset that page's blocks back to template
// state (handy for "redo" during onboarding).
// =====================================================================

const TEMPLATES = {

  // -------- 1. Electronics OEM --------
  electronics: {
    id: 'electronics',
    label: '消费/工业电子',
    industry: 'Consumer & Industrial Electronics',
    description: 'PCB 板厂、组装代工、配件 OEM — 强调认证、产能、快速打样',
    pages: [
      {
        slug: 'home',
        title: 'Home',
        meta_title: 'Custom Electronics OEM | {{SITE_NAME}}',
        meta_description: 'Certified electronics manufacturer with in-house tooling, IATF 16949 lines, and 7-day sample turnaround.',
        hero_title: '',   // hero handled by block
        blocks: [
          {
            block_type: 'hero_banner',
            content: {
              eyebrow: 'Electronics OEM',
              title: 'Custom electronics, built to last.',
              subtitle: 'ISO 9001 / IATF 16949 certified. In-house mold tooling, SMT lines, and a 7-day sample loop.',
              image_url: '',
              cta_text: 'Get a Quote',
              cta_link: '/quote.html',
              secondary_cta_text: 'Download capability deck',
              secondary_cta_link: '/contact.html',
              align: 'left',
            },
          },
          { block_type: 'logo_wall', content: { title: 'Trusted by OEMs across 28 countries', logos: [] } },
          {
            block_type: 'value_props',
            content: {
              title: 'Why customers choose us',
              columns: [
                { icon: '✓', title: 'Certified production', text: 'IATF 16949, ISO 9001, IEC 62133 — audit-ready facility.' },
                { icon: '⚙', title: 'In-house tooling', text: 'Mold making, SMT, assembly all under one roof — 30% faster NPI.' },
                { icon: '⏱', title: '7-day samples', text: 'Engineering samples shipped within one week from spec freeze.' },
                { icon: '★', title: 'Dedicated PM', text: 'A named engineer handles your project from RFQ to mass production.' },
              ],
            },
          },
          { block_type: 'product_grid', content: { title: 'Our product lines', source: 'all', limit: 6, columns: 3 } },
          { block_type: 'application_grid', content: { title: 'Industries we serve', limit: 8, columns: 4 } },
          {
            block_type: 'factory_showcase',
            content: {
              title: 'Inside our facility',
              sections: [
                { image: '', title: '50,000 sq.m production floor', text: 'Five SMT lines, three assembly lines, automated optical inspection at every step.', align: 'left' },
                { image: '', title: 'In-house testing lab', text: 'IPC-A-610 compliance, drop test, thermal shock, IP67/68 ingress chambers.', align: 'right' },
              ],
            },
          },
          {
            block_type: 'testimonial',
            content: {
              quote: 'Their 7-day sample loop cut our NPI time by 40%. They feel like an extension of our team.',
              author: 'VP Engineering',
              company: 'Smart Wearables Inc.',
              photo: '',
            },
          },
          {
            block_type: 'faq_accordion',
            content: {
              title: 'Frequently asked',
              items: [
                { q: 'What is the minimum order quantity?', a: '500 pcs for standard models, 1000 pcs for fully-custom designs. Lower MOQ available for prototype runs.' },
                { q: 'How fast can you ship engineering samples?', a: 'Standard 7 business days for samples; complex custom shapes 14-21 days.' },
                { q: 'What certifications do you hold?', a: 'IATF 16949, ISO 9001, ISO 14001, IEC 62133, UN38.3, CE/UKCA/FCC.' },
                { q: 'Do you ship internationally?', a: 'Yes — DHL/FedEx air, sea freight via Shenzhen/Yantian, EXW or DDP terms.' },
              ],
            },
          },
          { block_type: 'cta_banner', content: { title: 'Ready to spec your build?', subtitle: 'Send your requirements — our application engineer replies within 1 business day.', cta_text: 'Start an RFQ', cta_link: '/quote.html', image: '' } },
        ],
      },
      {
        slug: 'about',
        title: 'About',
        meta_title: 'About | {{SITE_NAME}}',
        meta_description: 'Family-owned electronics OEM since 2010 — 12 production lines, 850 staff, 28 export markets.',
        blocks: [
          { block_type: 'hero_banner', content: { title: 'Built by engineers, run by engineers.', subtitle: 'Founded 2010 in Dongguan, China. 850 staff, 12 production lines, IATF 16949 certified.', cta_text: 'Visit our factory', cta_link: '/contact.html', align: 'center' } },
          { block_type: 'value_props', content: { title: 'Our numbers', columns: [
            { icon: '🏭', title: '850 staff', text: 'Engineers, technicians and quality inspectors.' },
            { icon: '📦', title: '20M units/year', text: 'Combined output across all lines.' },
            { icon: '🌍', title: '28 markets', text: 'Active customers in EU, NA, MENA, ASEAN.' },
          ] } },
          { block_type: 'rich_text', content: { html: '<h2>Our story</h2><p>Write your founding story here. Talk about what problem you solve, why customers pick you over the alternatives, and what your engineering culture looks like.</p>', max_width: 'standard' } },
          { block_type: 'cta_banner', content: { title: 'Want to visit?', subtitle: 'We host customer audits and walkthroughs every week. Pre-book a slot.', cta_text: 'Schedule a visit', cta_link: '/contact.html' } },
        ],
      },
      {
        slug: 'capability',
        title: 'Capability',
        meta_title: 'Manufacturing Capability | {{SITE_NAME}}',
        meta_description: 'SMT, through-hole, assembly, testing, packaging — full-stack electronics manufacturing capability.',
        blocks: [
          { block_type: 'hero_banner', content: { title: 'From PCB to packaged product.', subtitle: 'One-stop electronics manufacturing — design, tooling, SMT, assembly, testing, packaging.', cta_text: 'Get a Quote', cta_link: '/quote.html' } },
          { block_type: 'factory_showcase', content: { title: 'Capability across the stack', sections: [
            { image: '', title: 'SMT lines', text: 'Yamaha and Panasonic high-speed pick-and-place, 200,000 CPH peak throughput.', align: 'left' },
            { image: '', title: 'AOI + X-Ray', text: 'Inline AOI on every line; X-Ray for BGA and complex multi-layer boards.', align: 'right' },
            { image: '', title: 'Assembly + packaging', text: 'Final assembly, packaging, serialization, drop-ship from our facility.', align: 'left' },
          ] } },
          { block_type: 'spec_table', content: { title: 'Equipment list', headers: ['Equipment', 'Quantity', 'Note'], rows: [
            ['SMT line', '5', 'Yamaha YSM20, ≥85K CPH each'],
            ['Reflow oven', '5', '10-zone, lead-free'],
            ['AOI', '5 inline + 2 standalone', 'Saki'],
            ['X-Ray', '2', 'Nordson Dage'],
            ['Wave solder', '2', 'Lead-free, nitrogen'],
            ['Function test', '12 stations', 'In-house designed fixtures'],
          ] } },
          { block_type: 'inquiry_form', content: { title: 'Discuss your build', subtitle: 'Tell us about your project and we will reply within 1 business day.' } },
        ],
      },
    ],
  },

  // -------- 2. Machining (CNC / Sheet Metal) --------
  machining: {
    id: 'machining',
    label: '机械加工',
    industry: 'CNC Machining & Sheet Metal',
    description: 'CNC 车铣、钣金、激光切割 — 精度、批量、交期是卖点',
    pages: [
      {
        slug: 'home',
        title: 'Home',
        meta_title: 'CNC Machining & Sheet Metal Manufacturer | {{SITE_NAME}}',
        meta_description: '±0.005mm precision CNC, 5-axis machining, sheet metal & laser cutting. 7-day prototype turnaround.',
        blocks: [
          { block_type: 'hero_banner', content: { eyebrow: 'CNC Machining', title: 'Precision parts, every time.', subtitle: '±0.005mm tolerance. 5-axis CNC, sheet metal, laser cutting — under one ISO 9001 roof.', cta_text: 'Upload your DWG', cta_link: '/quote.html', secondary_cta_text: 'Material list', secondary_cta_link: '/contact.html' } },
          { block_type: 'value_props', content: { title: 'Why customers choose us', columns: [
            { icon: '◎', title: '±0.005mm', text: 'Tight-tolerance CNC turning and milling on hardened steel, brass, titanium.' },
            { icon: '⚙', title: '5-axis ready', text: 'Mazak, DMG Mori, Haas — complex geometries in one setup.' },
            { icon: '⏱', title: '7-day prototypes', text: 'Quote in 8h. Sample in 7 days. Volume in 4 weeks.' },
            { icon: '✓', title: 'ISO 9001 / AS9100', text: 'Audit-ready quality system. Material certs and PPAP on request.' },
          ] } },
          { block_type: 'spec_table', content: { title: 'What we machine', headers: ['Material', 'Forms', 'Tolerance'], rows: [
            ['Aluminum 6061 / 7075', 'Bar, plate, casting', '±0.01mm'],
            ['Stainless 304 / 316', 'Bar, sheet', '±0.005mm'],
            ['Brass C360', 'Bar, sheet', '±0.005mm'],
            ['Titanium Grade 5', 'Bar', '±0.01mm'],
            ['Hardened tool steel', 'Block', '±0.005mm'],
            ['Engineering plastics (PEEK, POM)', 'Rod, sheet', '±0.02mm'],
          ] } },
          { block_type: 'application_grid', content: { title: 'Industries we serve', limit: 8 } },
          { block_type: 'factory_showcase', content: { title: 'Our facility', sections: [
            { image: '', title: '5-axis CNC cell', text: 'Five DMG Mori DMU-50, three Mazak Integrex i-200. 24/7 lights-out operation.', align: 'left' },
            { image: '', title: 'CMM-equipped QC', text: 'Zeiss Contura, Mitutoyo CMM, full first-article reporting included.', align: 'right' },
          ] } },
          { block_type: 'faq_accordion', content: { title: 'Frequently asked', items: [
            { q: 'What file formats do you accept?', a: 'STEP, IGES, DWG, DXF, PDF. STEP preferred for 3D parts.' },
            { q: 'Do you provide material certificates?', a: 'Yes — mill cert, RoHS, and PPAP on request for production runs.' },
            { q: 'What is the minimum order?', a: '1 piece for prototypes. Volume pricing kicks in at 50+ pieces.' },
          ] } },
          { block_type: 'cta_banner', content: { title: 'Send us a drawing.', subtitle: 'Quote within 8 business hours.', cta_text: 'Get an Instant Quote', cta_link: '/quote.html' } },
        ],
      },
      { slug: 'about', title: 'About', meta_title: 'About | {{SITE_NAME}}', meta_description: 'CNC machining specialist since 2008.', blocks: [
        { block_type: 'hero_banner', content: { title: 'Engineering precision since 2008.', subtitle: 'Family-owned. 12,000 sq.m facility. ISO 9001 + AS9100.', align: 'center', cta_text: 'Contact us', cta_link: '/contact.html' } },
        { block_type: 'rich_text', content: { html: '<h2>Our story</h2><p>Write your founding story here.</p>', max_width: 'standard' } },
      ] },
    ],
  },

  // -------- 3. Chemical / Materials --------
  chemical: {
    id: 'chemical',
    label: '化工材料',
    industry: 'Specialty Chemicals & Materials',
    description: '化工、涂料、特种材料 — 强调 REACH/RoHS、技术参数、安全',
    pages: [
      {
        slug: 'home',
        title: 'Home',
        meta_title: 'Specialty Chemicals Manufacturer | {{SITE_NAME}}',
        meta_description: 'REACH-registered, GMP-grade specialty chemicals. Bulk and toll manufacturing.',
        blocks: [
          { block_type: 'hero_banner', content: { eyebrow: 'Specialty Chemicals', title: 'Compliant. Consistent. At scale.', subtitle: 'REACH-registered, GMP-grade specialty chemicals. Bulk supply and contract manufacturing.', cta_text: 'Request a quote', cta_link: '/quote.html', secondary_cta_text: 'TDS / SDS library', secondary_cta_link: '/contact.html' } },
          { block_type: 'value_props', content: { title: 'What sets us apart', columns: [
            { icon: '✓', title: 'REACH-registered', text: 'Full REACH dossiers for our active substances; SDS in 11 languages.' },
            { icon: '🧪', title: 'GMP lines', text: 'Cosmetic-grade and pharma-intermediate GMP-compliant production.' },
            { icon: '⚖', title: 'Stable supply', text: 'Multi-site production, strategic raw-material inventory, no single-source risk.' },
          ] } },
          { block_type: 'product_grid', content: { title: 'Product portfolio', source: 'all', limit: 6, columns: 3 } },
          { block_type: 'spec_table', content: { title: 'Specifications snapshot', headers: ['Parameter', 'Spec', 'Test method'], rows: [
            ['Assay (HPLC)', '≥ 99.0%', 'USP <621>'],
            ['Water (KF)', '≤ 0.5%', 'USP <921>'],
            ['Heavy metals', '≤ 10 ppm', 'ICP-MS'],
            ['Residual solvents', 'ICH Q3C compliant', 'GC-FID'],
          ] } },
          { block_type: 'faq_accordion', content: { title: 'Compliance & QA', items: [
            { q: 'Are you REACH registered?', a: 'Yes — all listed actives are REACH-registered. Dossiers shared under NDA.' },
            { q: 'Do you support custom synthesis?', a: 'Yes — from gram-scale to multi-tonne production. NDA-protected.' },
            { q: 'What is your typical lead time?', a: '4-6 weeks for catalogue items in stock; 8-12 weeks for custom synthesis.' },
          ] } },
          { block_type: 'cta_banner', content: { title: 'Request a TDS or sample', cta_text: 'Contact technical sales', cta_link: '/quote.html' } },
        ],
      },
    ],
  },

  // -------- 4. Textile --------
  textile: {
    id: 'textile',
    label: '纺织',
    industry: 'Textile & Apparel Manufacturing',
    description: '面料、服装代工、家纺 — 强调认证、起订量、面料库',
    pages: [
      {
        slug: 'home',
        title: 'Home',
        meta_title: 'Textile Manufacturer & Apparel OEM | {{SITE_NAME}}',
        meta_description: 'OEKO-TEX certified, GOTS organic-compliant textile manufacturer. Knit + woven, MOQ from 300 pcs.',
        blocks: [
          { block_type: 'hero_banner', content: { eyebrow: 'Textile OEM', title: 'Fabrics with a conscience.', subtitle: 'OEKO-TEX certified, GOTS-compliant. Knit and woven. MOQ from 300 pcs per design.', cta_text: 'Request samples', cta_link: '/quote.html', secondary_cta_text: 'Fabric library', secondary_cta_link: '/contact.html' } },
          { block_type: 'value_props', content: { title: 'What we deliver', columns: [
            { icon: '🌿', title: 'OEKO-TEX + GOTS', text: 'Independently audited; full traceability from fibre to ship.' },
            { icon: '📦', title: 'MOQ 300 pcs', text: 'Small-batch friendly for emerging brands; up to 100k+ for established labels.' },
            { icon: '🎨', title: '5000+ fabrics', text: 'In-house library of organic cotton, recycled poly, TENCEL™, bamboo.' },
            { icon: '⏱', title: '8-12 weeks', text: 'From tech-pack to delivered goods, standard timeline.' },
          ] } },
          { block_type: 'product_grid', content: { title: 'Product categories', source: 'all', limit: 8, columns: 4 } },
          { block_type: 'factory_showcase', content: { title: 'Inside the mill', sections: [
            { image: '', title: 'Knitting & weaving', text: '180+ knit and 80+ weaving machines, single-jersey to French terry.', align: 'left' },
            { image: '', title: 'Dyeing & finishing', text: 'Low-water reactive dyeing, full traceability, ZDHC-compliant.', align: 'right' },
          ] } },
          { block_type: 'cta_banner', content: { title: 'Send your tech-pack.', subtitle: 'We will quote within 48 hours and ship samples within 14 days.', cta_text: 'Request a Quote', cta_link: '/quote.html' } },
        ],
      },
    ],
  },

  // -------- 5. New Energy / Battery --------
  new_energy: {
    id: 'new_energy',
    label: '新能源',
    industry: 'New Energy & Batteries',
    description: '锂电、储能、光伏 — 强调安全、循环寿命、UN38.3 等认证',
    pages: [
      {
        slug: 'home',
        title: 'Home',
        meta_title: 'Lithium Battery Manufacturer | {{SITE_NAME}}',
        meta_description: 'UN38.3 / IEC 62133 certified lithium battery manufacturer. Custom shapes, BMS integration, 500+ cycles.',
        blocks: [
          { block_type: 'hero_banner', content: { eyebrow: 'New Energy', title: 'Batteries that last.', subtitle: 'UN38.3 / IEC 62133 / UL 2054 certified. Custom shapes, integrated BMS, 500+ cycles @ 80% capacity.', cta_text: 'Get a Quote', cta_link: '/quote.html', secondary_cta_text: 'Cell datasheet', secondary_cta_link: '/contact.html' } },
          { block_type: 'value_props', content: { title: 'Built for OEMs', columns: [
            { icon: '🔋', title: 'Custom shapes', text: 'Any thickness from 0.4mm, any footprint — we mold to your enclosure.' },
            { icon: '⚡', title: 'Integrated BMS', text: 'In-house BMS design, protection IC selection, balancing, communication.' },
            { icon: '✓', title: 'Full cert pack', text: 'UN38.3, IEC 62133, UL 2054, KC, PSE, BIS — included with first order.' },
            { icon: '♻', title: '500+ cycles', text: 'Verified cycle life at 80% capacity. Longer life on request.' },
          ] } },
          { block_type: 'product_grid', content: { title: 'Cell families', source: 'all', limit: 6, columns: 3 } },
          { block_type: 'spec_table', content: { title: 'Typical 5000mAh cell', headers: ['Parameter', 'Spec'], rows: [
            ['Nominal capacity', '5000 mAh'],
            ['Nominal voltage', '3.7 V'],
            ['Energy density', '≥ 240 Wh/kg'],
            ['Cycle life', '≥ 500 cycles @ 80% capacity'],
            ['Operating temp.', '-20 to +60°C (discharge)'],
            ['Certifications', 'UN38.3, IEC 62133, UL 2054'],
          ] } },
          { block_type: 'application_grid', content: { title: 'Where our cells go', limit: 8, columns: 4 } },
          { block_type: 'testimonial', content: { quote: 'Their cell engineering team caught a thermal-runaway risk in our enclosure design before tooling. Saved us a six-figure recall.', author: 'Hardware Lead', company: 'Medical Devices Co.' } },
          { block_type: 'faq_accordion', content: { title: 'Often-asked', items: [
            { q: 'Can you ship by air?', a: 'Yes — UN38.3-tested, MSDS provided. Air freight via certified DGR forwarders.' },
            { q: 'Custom shape MOQ?', a: '1000 pcs for custom polymer; 5000 pcs for custom steel-shell. Lower for sampling.' },
            { q: 'Lead time for custom?', a: 'Tooling 4-6 weeks + first samples in 10 weeks total. Mass production 12-14 weeks.' },
          ] } },
          { block_type: 'cta_banner', content: { title: 'Discuss your project.', subtitle: 'Engineer-to-engineer call, NDA-friendly. We will respond within 1 business day.', cta_text: 'Start a conversation', cta_link: '/quote.html' } },
        ],
      },
    ],
  },
};

function listTemplates() {
  return Object.values(TEMPLATES).map((t) => ({
    id: t.id,
    label: t.label,
    industry: t.industry,
    description: t.description,
    page_count: t.pages.length,
  }));
}

function getTemplate(id) {
  return TEMPLATES[id] || null;
}

module.exports = { TEMPLATES, listTemplates, getTemplate };
