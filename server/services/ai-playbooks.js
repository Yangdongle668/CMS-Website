// One hundred article playbooks.
//
// A playbook is an editorial brief, not a template. It carries the
// angle, the cluster it belongs to, the shape it should take and two to
// four things it must actually cover. Everything else — the pillar's
// real name and URL, the sibling articles to link, the category and
// author ids, the list of topics already written — is read from the
// database at generation time by services/ai-corpus, so none of it is
// typed by an operator and none of it can contradict the live site.
//
// Field legend (short on purpose; there are a hundred of these):
//   k  key, stable identifier
//   t  working title the generator may rewrite
//   p  pillar: polymer | custom | coin | cross
//        cross = deliberately not bound to a pillar, matching how the
//        existing compliance and logistics cluster is organised
//   c  category slug: technology | industry-insights | certifications
//                   | product-updates
//   s  shape key from services/ai-shapes
//   a  the angle, in one sentence, written to the model
//   m  two to four things the piece must cover, so two runs of the same
//      playbook land on the same subject rather than drifting
//
// The angles were chosen against the articles already published: each
// one is a gap, not a restatement. The runtime overlap check in
// ai-corpus is the backstop for the cases where that judgement is wrong
// or where the catalogue has grown since.

const PLAYBOOKS = [
  // ============================ POLYMER ============================
  { k: 'pouch-tab-design', t: 'Pouch Cell Tab Design: Material, Width and Weld', p: 'polymer', c: 'technology', s: 'deep_dive',
    a: 'How the tab that leaves a pouch cell is specified, and why it is a thermal and mechanical decision rather than just a conductor.',
    m: ['aluminium positive vs nickel-plated copper negative and why they differ', 'tab width driven by current and by seal geometry', 'ultrasonic weld quality and what a pull test proves'] },

  { k: 'lipo-cold-discharge', t: 'Li-Po Below Zero: What Cold Does to Available Capacity', p: 'polymer', c: 'technology', s: 'deep_dive',
    a: 'What actually happens to a polymer cell in the cold, separating reversible voltage sag from permanent damage.',
    m: ['impedance rise and the resulting voltage sag under load', 'why the discharge window is wider than the charge window', 'self-heating strategies and when they are worth the complexity'] },

  { k: 'lipo-fast-charge', t: 'Fast Charge Without Wrecking Cycle Life', p: 'polymer', c: 'technology', s: 'decision_framework',
    a: 'The trade you are making when you raise charge current, and how multi-stage profiles buy back some of it.',
    m: ['where lithium plating risk actually starts', 'multi-stage CC steps vs a single high CC', 'what to measure to prove a profile is safe on your cell'] },

  { k: 'lipo-stack-pressure', t: 'Stack Pressure: The Constraint Nobody Specifies', p: 'polymer', c: 'technology', s: 'deep_dive',
    a: 'Why a pouch cell held under modest, even pressure outlives one rattling in a cavity, and how to design the fixture.',
    m: ['what uniform pressure does to electrode contact', 'the difference between constraint and compression', 'foam selection and how it ages'] },

  { k: 'formation-gas', t: 'First-Cycle Gas: What Degassing Removes and Why', p: 'polymer', c: 'technology', s: 'process_spec',
    a: 'The gas generated during formation, why the pouch is opened and resealed, and what it means if a cell gasses later.',
    m: ['SEI formation as the gas source', 'the degas and reseal step in the process flow', 'how to tell formation gas from a field fault'] },

  { k: 'soc-estimation', t: 'Coulomb Counting vs OCV: Choosing a Fuel Gauge', p: 'polymer', c: 'technology', s: 'comparison',
    a: 'The two ways to know how full a cell is, where each drifts, and why production gauges use both.',
    m: ['coulomb counting drift and what resets it', 'OCV lookup and the flat-plateau problem', 'what a gauge needs from the cell characterisation'] },

  { k: 'eis-incoming-qc', t: 'Using Impedance as an Incoming Quality Check', p: 'polymer', c: 'technology', s: 'process_spec',
    a: 'A cheap, fast impedance measurement on arrival catches more bad batches than a capacity check, and takes minutes instead of hours.',
    m: ['1 kHz AC impedance as a screening statistic', 'setting limits from your own batch history, not the datasheet', 'what an impedance outlier usually turns out to be'] },

  { k: 'laminate-film', t: 'The Aluminium Laminate Film a Pouch Is Made Of', p: 'polymer', c: 'technology', s: 'deep_dive',
    a: 'The three-layer film that forms a pouch cell, and which layer fails in each of the common field failures.',
    m: ['nylon / aluminium / polypropylene layer functions', 'deep-draw forming limits and corner thinning', 'puncture and electrolyte-corrosion failure signatures'] },

  { k: 'separator-selection', t: 'Separators and What Shutdown Actually Buys You', p: 'polymer', c: 'technology', s: 'deep_dive',
    a: 'What a shutdown separator does at temperature, what it cannot do, and why it is not a substitute for a protection circuit.',
    m: ['pore closure temperature and melt integrity', 'ceramic-coated separators and thermal margin', 'the abuse cases a separator does not cover'] },

  { k: 'seal-failure', t: 'Seal Failures in Pouch Cells: Causes and Detection', p: 'polymer', c: 'technology', s: 'failure_analysis',
    a: 'A leaking pouch seal looks like several other faults; here is how to tell them apart and what caused it.',
    m: ['tab-area seal as the usual failure site', 'contamination and misalignment during heat sealing', 'detection by weight loss, odour and imaging'] },

  { k: 'ten-year-derating', t: 'Designing a Cell for Ten Years, Not Five Hundred Cycles', p: 'polymer', c: 'technology', s: 'decision_framework',
    a: 'Products that sit idle age on the calendar, not the cycle counter, and the design levers are different.',
    m: ['calendar ageing vs cycle ageing as separate budgets', 'voltage and temperature as the calendar levers', 'oversizing and partial-SoC operation as the practical fix'] },

  { k: 'balancing-passive-active', t: 'Passive or Active Balancing: An Honest Cost Comparison', p: 'polymer', c: 'technology', s: 'comparison',
    a: 'Active balancing sounds strictly better and usually is not, at the pack sizes most products actually build.',
    m: ['where the imbalance comes from in the first place', 'bleed resistor sizing and the heat it makes', 'the pack size above which active starts to pay'] },

  { k: 'charger-ic-selection', t: 'Choosing a Charger IC Around the Cell, Not the Datasheet', p: 'polymer', c: 'technology', s: 'buyer_guide',
    a: 'The charger IC parameters that matter are the ones the cell imposes, and several of them are easy to get wrong in silicon selection.',
    m: ['termination current and its effect on delivered capacity', 'thermal regulation and what it does to charge time', 'NTC handling and the JEITA temperature windows'] },

  { k: 'undervoltage-policy', t: 'What To Do With a Cell That Went Too Flat', p: 'polymer', c: 'technology', s: 'decision_framework',
    a: 'The recovery-charge decision after deep discharge, and the voltage below which the answer must be no.',
    m: ['copper dissolution as the reason for a hard floor', 'pre-charge at low current and its limits', 'writing the policy into firmware rather than a service manual'] },

  { k: 'cell-matching', t: 'Matching Cells for a Multi-Cell Pack', p: 'polymer', c: 'technology', s: 'process_spec',
    a: 'What matching means in practice, which parameters to match on, and how tight is tight enough.',
    m: ['capacity, impedance and OCV as the three matching axes', 'matching within a batch vs across batches', 'what happens over life to a pack matched only at build'] },

  { k: 'vibration-shock-qual', t: 'Vibration and Shock Qualification for Battery Packs', p: 'polymer', c: 'certifications', s: 'spec_walkthrough',
    a: 'The mechanical tests a pack has to survive, what they simulate, and the fixture mistakes that invalidate a result.',
    m: ['random vibration profiles and what environment each represents', 'mechanical shock vs drop as different questions', 'fixture stiffness and why a bad fixture passes bad designs'] },

  { k: 'altitude-vacuum', t: 'Altitude, Vacuum and Why Pouches Bulge on Aircraft', p: 'polymer', c: 'technology', s: 'myth_correction',
    a: 'A pouch that swells at altitude is usually behaving correctly, and the low-pressure test exists to prove exactly that.',
    m: ['pressure differential across the pouch film', 'the low-pressure test in UN 38.3 and what it checks', 'when bulging at altitude is genuinely a defect'] },

  { k: 'humidity-corrosion', t: 'Humidity, Condensation and Terminal Corrosion', p: 'polymer', c: 'technology', s: 'failure_analysis',
    a: 'Corrosion at the tab or the board is a humidity and dew-point problem long before it is a materials problem.',
    m: ['condensation on a cold cell entering a warm room', 'galvanic pairs at the tab-to-wire joint', 'conformal coating and desiccant as mitigations'] },

  { k: 'energy-vs-power-cell', t: 'Energy Cells and Power Cells Are Different Products', p: 'polymer', c: 'technology', s: 'comparison',
    a: 'The internal design choices that make a cell good at storing energy or good at delivering current, and why one cell rarely does both.',
    m: ['electrode thickness as the central trade', 'what that does to impedance and to capacity', 'how to tell which one a datasheet is describing'] },

  { k: 'coating-weight', t: 'Electrode Coating Weight and What It Sets', p: 'polymer', c: 'technology', s: 'deep_dive',
    a: 'One process parameter on the coating line propagates into capacity, rate capability and cycle life.',
    m: ['areal loading and its direct link to capacity', 'the rate penalty of thicker coatings', 'coating uniformity as a yield and safety issue'] },

  { k: 'silicon-anode', t: 'Silicon in the Anode: What It Buys and What It Costs', p: 'polymer', c: 'industry-insights', s: 'myth_correction',
    a: 'Silicon-blended anodes are shipping, but the headline energy numbers come with swelling and cycle-life terms attached.',
    m: ['volumetric expansion during lithiation', 'why blends rather than pure silicon are what ships', 'what a buyer should ask about swelling over life'] },

  { k: 'nail-penetration', t: 'What a Nail Penetration Test Actually Proves', p: 'polymer', c: 'certifications', s: 'myth_correction',
    a: 'Nail penetration is a vivid demonstration and a poor proxy for the field failures it is used to argue about.',
    m: ['what the test induces mechanically', 'why results depend heavily on test parameters', 'what internal short screening does instead'] },

  { k: 'field-soh', t: 'Estimating State of Health in a Shipped Product', p: 'polymer', c: 'technology', s: 'integration_guide',
    a: 'Measuring degradation in the field without a lab, and what a product can honestly tell its user.',
    m: ['full-discharge capacity learning and when it is available', 'impedance trend as a proxy', 'what to show the user and what to keep internal'] },

  { k: 'warranty-engineering', t: 'Writing a Battery Warranty You Can Actually Honour', p: 'polymer', c: 'industry-insights', s: 'buyer_guide',
    a: 'A warranty is an engineering commitment; here is how to derive one from cycle and calendar data instead of from marketing.',
    m: ['choosing the capacity-retention threshold', 'the usage assumptions the number depends on', 'the data to retain so a claim can be adjudicated'] },

  { k: 'incoming-inspection', t: 'An Incoming Inspection Plan for Lithium Cells', p: 'polymer', c: 'technology', s: 'process_spec',
    a: 'What to check on every lot, what to sample, and what to trust the supplier for.',
    m: ['OCV, impedance and dimensional checks as the per-lot core', 'sampling plans and what AQL means here', 'the documents that should arrive with the lot'] },

  { k: 'first-article', t: 'First Article Inspection for a New Cell', p: 'polymer', c: 'technology', s: 'process_spec',
    a: 'The one-time deep check before a cell goes into production, and what it should catch that ongoing inspection will not.',
    m: ['dimensional and construction verification', 'teardown and what to photograph', 'tying the FAI to a frozen drawing revision'] },

  { k: 'capacity-grading', t: 'Capacity Grading: Where the Bins Come From', p: 'polymer', c: 'technology', s: 'deep_dive',
    a: 'Cells are graded and binned at end of line; understanding the bins explains a lot of the variation buyers see.',
    m: ['the grading discharge and its conditions', 'how bin boundaries relate to the rated minimum', 'what buying a lower grade actually changes'] },

  { k: 'enclosure-thermal-model', t: 'A Thermal Model of Your Enclosure, Not Just the Cell', p: 'polymer', c: 'technology', s: 'integration_guide',
    a: 'Cell heat generation is the easy half; where it goes is the half that decides whether the product is comfortable.',
    m: ['I²R generation from the real current profile', 'conduction paths and the role of the enclosure wall', 'the skin-temperature limit as the binding constraint'] },

  { k: 'pulse-load-modem', t: 'Designing for a Cellular Modem’s Current Bursts', p: 'polymer', c: 'technology', s: 'integration_guide',
    a: 'A modem transmit burst is the worst load most IoT products present, and it usually determines the cell, not the average draw.',
    m: ['burst amplitude, width and the resulting voltage dip', 'bulk capacitance as an alternative to a bigger cell', 'brownout margin at end of life and low temperature'] },

  { k: 'end-of-line-test', t: 'End-of-Line Testing: What a Cell Passes Before It Ships', p: 'polymer', c: 'technology', s: 'process_spec',
    a: 'The final electrical and safety checks in cell manufacturing, and which ones a buyer should ask to see data from.',
    m: ['OCV and impedance screening', 'self-discharge screening and the ageing period it needs', 'what a supplier can share as lot data'] },

  // ============================ CUSTOM =============================
  { k: 'npi-timeline', t: 'A Realistic NPI Timeline for a Custom Cell', p: 'custom', c: 'industry-insights', s: 'buyer_guide',
    a: 'The stages between agreeing a shape and receiving production cells, and which ones cannot be compressed.',
    m: ['drawing freeze, tooling, samples, qualification, mass production as distinct gates', 'the gates that depend on calendar time rather than effort', 'what actually causes the common slips'] },

  { k: 'moq-economics', t: 'Why Custom Cells Have a Minimum Order Quantity', p: 'custom', c: 'industry-insights', s: 'buyer_guide',
    a: 'The MOQ on a custom cell is a manufacturing fact, not a negotiating position, and understanding why helps you negotiate the parts that are.',
    m: ['line changeover and coating-run economics', 'tooling amortisation across the first order', 'what is genuinely negotiable and what is not'] },

  { k: 'dfm-checklist', t: 'Design for Manufacture: A Custom Cell Checklist', p: 'custom', c: 'technology', s: 'buyer_guide',
    a: 'The geometry and tolerance decisions that decide whether a custom cell is cheap or merely possible.',
    m: ['corner radii and deep-draw limits', 'tab position relative to the seal', 'thickness tolerance and how it stacks with the enclosure'] },

  { k: 'pack-ip-rating', t: 'IP Ratings for Battery Packs: What Is Actually Being Sealed', p: 'custom', c: 'certifications', s: 'spec_walkthrough',
    a: 'An IP rating on a product does not automatically extend to the pack inside it, and the boundary matters.',
    m: ['the difference between device sealing and pack sealing', 'ingress paths along the harness', 'how the vent requirement interacts with sealing'] },

  { k: 'adhesive-selection', t: 'Adhesives and Tapes in a Battery Pack', p: 'custom', c: 'technology', s: 'integration_guide',
    a: 'The tape holding a cell in place is a reliability component, and the wrong one fails in heat, in time or in service.',
    m: ['double-sided tape vs structural adhesive by application', 'outgassing and electrolyte compatibility', 'serviceability and removal without cell damage'] },

  { k: 'swell-gap', t: 'Leaving Room for Swelling: How Much and Where', p: 'custom', c: 'technology', s: 'decision_framework',
    a: 'Every pouch cell grows; the question is whether your enclosure planned for it or discovered it.',
    m: ['expected growth over life as a design input', 'where the gap should be and where it must not', 'compliant foam vs empty air gap'] },

  { k: 'curved-radius-limits', t: 'How Curved Can a Cell Be?', p: 'custom', c: 'technology', s: 'deep_dive',
    a: 'The bend radius a pouch cell can hold, what sets the limit, and what happens as you approach it.',
    m: ['electrode stack mechanics under bending', 'fixed curvature vs repeated flexing as different problems', 'realistic radius ranges by thickness'] },

  { k: 'l-shaped-cells', t: 'L-Shaped and Notched Cells: What Is Buildable', p: 'custom', c: 'technology', s: 'deep_dive',
    a: 'Non-rectangular cells are routine now, but the internal stack still wants to be rectangular, and that governs what you can ask for.',
    m: ['how a stacked electrode assembly accommodates a notch', 'capacity lost to the cut-out', 'tab placement constraints on an irregular outline'] },

  { k: 'sub-1mm-handling', t: 'Handling Cells Thinner Than a Millimetre', p: 'custom', c: 'technology', s: 'process_spec',
    a: 'Below about a millimetre, the assembly process becomes the reliability risk rather than the cell.',
    m: ['handling damage modes specific to very thin pouches', 'fixture and vacuum-pickup design', 'inspection that catches damage before it is buried in an assembly'] },

  { k: 'cell-drawing-standard', t: 'What Belongs on a Custom Cell Drawing', p: 'custom', c: 'technology', s: 'buyer_guide',
    a: 'A cell drawing that omits any of these items will be built to somebody else’s assumption.',
    m: ['dimensional envelope including the aged condition', 'tab and harness definition with part numbers', 'electrical spec, test conditions and acceptance criteria'] },

  { k: 'sample-to-mp-gates', t: 'From A-Sample to Mass Production: What Each Gate Proves', p: 'custom', c: 'industry-insights', s: 'process_spec',
    a: 'Sample rounds are not just iterations; each one is supposed to close a specific category of risk.',
    m: ['what an early sample legitimately cannot tell you', 'the qualification that must sit before tooling is frozen', 'the common error of qualifying on hand-built samples'] },

  { k: 'dual-sourcing-custom', t: 'Dual-Sourcing a Custom Cell: Harder Than It Sounds', p: 'custom', c: 'industry-insights', s: 'decision_framework',
    a: 'A second source for a bespoke cell duplicates the tooling, the qualification and the certification, and is sometimes still right.',
    m: ['what is genuinely duplicated and what is not', 'certification and audit implications of a second site', 'drop-in alternatives as the cheaper middle path'] },

  { k: 'strap-integrated-battery', t: 'Putting the Battery in the Strap', p: 'custom', c: 'technology', s: 'integration_guide',
    a: 'Moving cells out of the watch body and into the band changes the mechanical problem completely.',
    m: ['repeated flexing vs fixed curvature', 'cell segmentation and interconnect', 'skin contact and the thermal limit'] },

  { k: 'charging-case-design', t: 'Designing the Cell in a Hearables Charging Case', p: 'custom', c: 'technology', s: 'integration_guide',
    a: 'The case cell has a different duty cycle from the bud cell, and copying the bud requirements wastes volume.',
    m: ['charge-discharge cycling profile of a case', 'sizing for a stated number of bud recharges', 'thermal behaviour while charging both'] },

  { k: 'medical-patch', t: 'Battery Design for a Wearable Medical Patch', p: 'custom', c: 'technology', s: 'integration_guide',
    a: 'A single-use or short-life adhesive patch has constraints unlike any other wearable.',
    m: ['fixed-duration energy budget with no recharge', 'skin contact, adhesion and flexibility', 'disposal and the regulatory implications'] },

  { k: 'smart-glasses-temple', t: 'Fitting a Cell Into a Glasses Temple', p: 'custom', c: 'technology', s: 'integration_guide',
    a: 'The temple arm is long, thin, curved and close to the wearer’s head — four constraints that fight each other.',
    m: ['long narrow form factors and their tab routing', 'weight distribution and perceived comfort', 'thermal proximity to the wearer'] },

  { k: 'handheld-swap-pack', t: 'Swappable Packs for Industrial Handhelds', p: 'custom', c: 'technology', s: 'integration_guide',
    a: 'A user-swappable pack turns the connector, the latch and the contacts into the product’s reliability bottleneck.',
    m: ['contact design and mating-cycle life', 'hot-swap behaviour and what the device must tolerate', 'authentication and counterfeit packs'] },

  { k: 'fpv-drone-custom', t: 'Custom Cells for High-Discharge Drone Applications', p: 'custom', c: 'technology', s: 'decision_framework',
    a: 'High continuous discharge changes every part of the specification, and a standard wearable cell is the wrong starting point.',
    m: ['sustained high C-rate and the internal design it needs', 'thermal management during flight', 'the cycle-life cost of operating near the limit'] },

  { k: 'cell-marking', t: 'Labels, Markings and What Has to Be On a Cell', p: 'custom', c: 'certifications', s: 'spec_walkthrough',
    a: 'Cell marking is partly regulatory, partly traceability and partly yours to decide — and the three get confused.',
    m: ['markings required for transport and for market access', 'date coding and lot traceability', 'space constraints on very small cells'] },

  { k: 'change-control', t: 'Change Control on a Qualified Cell', p: 'custom', c: 'certifications', s: 'process_spec',
    a: 'Once a cell is qualified, the question is not whether a change is an improvement but whether you were told about it.',
    m: ['what constitutes a notifiable change', 'PCN expectations written into the supply agreement', 'requalification triggered by a site or material change'] },

  { k: 'cosmetic-spec', t: 'Writing a Cosmetic Specification for Cells', p: 'custom', c: 'technology', s: 'buyer_guide',
    a: 'Wrinkles, marks and discolouration on a pouch are usually harmless and sometimes not; the spec decides which arguments you will have.',
    m: ['normal forming artefacts vs genuine defects', 'defining inspection distance and lighting', 'where cosmetics matter because the cell is visible'] },

  { k: 'potting-encapsulation', t: 'Potting a Battery Pack: When It Helps and When It Traps', p: 'custom', c: 'technology', s: 'decision_framework',
    a: 'Encapsulation solves vibration and ingress and creates thermal and serviceability problems in exchange.',
    m: ['thermal conductivity of the potting compound', 'cure shrinkage and stress on the cell', 'venting and why full encapsulation is risky'] },

  { k: 'thermistor-placement', t: 'Where to Put the Thermistor', p: 'custom', c: 'technology', s: 'integration_guide',
    a: 'A temperature sensor in the wrong place reports a number that is real and useless.',
    m: ['sensing the cell rather than the air or the board', 'thermal coupling and response time', 'what the charger firmware does with the reading'] },

  { k: 'weight-optimisation', t: 'Taking Weight Out of a Pack Without Taking Energy', p: 'custom', c: 'technology', s: 'decision_framework',
    a: 'Most pack weight outside the cell is structure and protection, and that is where the savings are.',
    m: ['cell mass fraction as the figure of merit', 'where structure can be removed safely', 'the trade against drop and vibration performance'] },

  { k: 'proto-vs-tooling-cost', t: 'Prototype Cells vs Tooled Cells: Two Different Costs', p: 'custom', c: 'industry-insights', s: 'myth_correction',
    a: 'A cheap prototype round does not predict production cost, and a expensive one does not mean you are being overcharged.',
    m: ['hand-built vs line-built construction differences', 'why prototype performance can differ from production', 'what the prototype round is legitimately for'] },

  // ============================= COIN ==============================
  { k: 'coin-pulse-load', t: 'Coin Cells Under Radio Pulse Loads', p: 'coin', c: 'technology', s: 'deep_dive',
    a: 'A coin cell’s impedance makes radio transmit bursts the hardest thing it ever does.',
    m: ['voltage dip during a transmit burst', 'capacitor buffering as standard practice', 'how impedance rise over life shrinks the margin'] },

  { k: 'coin-crimp-seal', t: 'The Crimp Seal: How a Coin Cell Stays Closed', p: 'coin', c: 'technology', s: 'deep_dive',
    a: 'Everything that goes wrong with a coin cell in the field arrives through the crimp, one way or another.',
    m: ['gasket material and its compression set over time', 'temperature cycling and seal relaxation', 'what leakage looks like at an early stage'] },

  { k: 'coin-holder-resistance', t: 'Contact Resistance in Coin Cell Holders', p: 'coin', c: 'technology', s: 'failure_analysis',
    a: 'An intermittent device is more often a holder contact problem than a cell problem.',
    m: ['contact force, plating and fretting corrosion', 'vibration-induced intermittency', 'when to abandon the holder for welded tabs'] },

  { k: 'coin-parallel', t: 'Putting Coin Cells in Parallel', p: 'coin', c: 'technology', s: 'decision_framework',
    a: 'Paralleling coin cells to get current or capacity works, with conditions that are easy to violate.',
    m: ['matching requirements and cross-current at connection', 'blocking diodes and what they cost you', 'when a single larger cell is simply better'] },

  { k: 'coin-esr-cold', t: 'Coin Cell ESR in the Cold', p: 'coin', c: 'technology', s: 'deep_dive',
    a: 'Impedance rise at low temperature is the specific reason cold coin-cell devices reset.',
    m: ['ESR as a function of temperature', 'interaction with pulse loads', 'design margin for the cold-plus-aged corner'] },

  { k: 'coin-ingestion-safety', t: 'Ingestion Safety and Coin Cell Product Design', p: 'coin', c: 'certifications', s: 'spec_walkthrough',
    a: 'Coin cell ingestion has driven real regulatory change, and it affects enclosure design, not just packaging.',
    m: ['secured battery compartments as a design requirement', 'warning marking expectations', 'what this means for products not aimed at children'] },

  { k: 'coin-tpms', t: 'Coin Cells in Tyre Pressure Sensors', p: 'coin', c: 'technology', s: 'integration_guide',
    a: 'A TPMS module is a brutal coin cell application: wide temperature, constant vibration, a decade of life, no service.',
    m: ['temperature extremes at the wheel', 'vibration and mechanical mounting', 'duty cycle budgeting for a ten-year target'] },

  { k: 'coin-smart-card', t: 'Powering a Card-Format Device', p: 'coin', c: 'technology', s: 'integration_guide',
    a: 'Card-thickness products need energy in a form factor that rules out almost everything.',
    m: ['thickness constraints and what fits', 'flex tolerance of the assembled card', 'shelf life dominating the energy budget'] },

  { k: 'coin-backup-sizing', t: 'Sizing a Backup Cell for Data Retention', p: 'coin', c: 'technology', s: 'decision_framework',
    a: 'Backup sizing is a leakage calculation, and the load is usually smaller than the self-discharge.',
    m: ['quiescent current of the retained circuit', 'self-discharge as the dominant term', 'the temperature assumption that makes or breaks the number'] },

  { k: 'coin-solderability-shelf', t: 'Solderability After Storage', p: 'coin', c: 'technology', s: 'process_spec',
    a: 'Tabs that soldered fine on arrival may not after months in stock, and the fix is process, not flux.',
    m: ['oxidation and plating degradation over time', 'storage conditions that preserve solderability', 'a solderability check as part of incoming inspection'] },

  { k: 'coin-vs-supercap', t: 'Coin Cell or Supercapacitor?', p: 'coin', c: 'technology', s: 'comparison',
    a: 'They solve overlapping problems with opposite strengths, and the crossover is more predictable than people assume.',
    m: ['energy density vs power density and leakage', 'temperature behaviour of each', 'hybrid arrangements and when they are worth it'] },

  { k: 'coin-leakage-mechanisms', t: 'Why Coin Cells Leak', p: 'coin', c: 'technology', s: 'failure_analysis',
    a: 'Leakage has three distinct causes with three different fixes, and they are routinely confused.',
    m: ['over-discharge driven internal pressure', 'reverse charging in a series stack', 'mechanical seal damage from handling or heat'] },

  { k: 'coin-storage-temp', t: 'Storing Coin Cells Properly', p: 'coin', c: 'technology', s: 'process_spec',
    a: 'Coin cell shelf life is quoted under conditions most warehouses do not meet.',
    m: ['temperature and humidity targets', 'packaging that protects against short circuits in bulk', 'FIFO by manufacture date and why it matters here'] },

  { k: 'coin-date-code', t: 'Date Codes and Traceability on Coin Cells', p: 'coin', c: 'certifications', s: 'buyer_guide',
    a: 'When a field issue appears, the first question is how old the cells were, and most teams cannot answer it.',
    m: ['reading manufacturer date codes', 'carrying lot data into your own records', 'what to require contractually'] },

  { k: 'coin-tab-orientation', t: 'Tab Orientation and PCB Layout for Coin Cells', p: 'coin', c: 'technology', s: 'integration_guide',
    a: 'Tab geometry decides board layout, assembly sequence and rework feasibility, so it is not a late decision.',
    m: ['horizontal vs vertical tab configurations', 'keep-out areas and shorting risks', 'rework access after the cell is fitted'] },

  { k: 'coin-primary-vs-secondary-tco', t: 'Primary or Rechargeable: A Total Cost View', p: 'coin', c: 'industry-insights', s: 'decision_framework',
    a: 'The rechargeable cell is more expensive and frequently cheaper, depending entirely on the service model.',
    m: ['replacement labour as the dominant cost in serviced fleets', 'cycle count actually needed over product life', 'the cases where a primary cell is clearly right'] },

  { k: 'coin-harvesting-hybrid', t: 'Pairing a Coin Cell With Energy Harvesting', p: 'coin', c: 'technology', s: 'integration_guide',
    a: 'Harvesting rarely replaces the cell; it extends it, and the architecture decides by how much.',
    m: ['harvest source intermittency and buffering', 'rechargeable coin cell as the buffer', 'the power-path decisions that matter'] },

  { k: 'coin-automotive-grade', t: 'What Automotive Grade Means for a Coin Cell', p: 'coin', c: 'certifications', s: 'spec_walkthrough',
    a: 'Automotive expectations are about process discipline and traceability as much as about the cell itself.',
    m: ['temperature grade and mission profile', 'change notification and traceability expectations', 'the qualification burden compared with consumer parts'] },

  { k: 'coin-ul-recognition', t: 'UL Recognition for Coin Cells: What It Covers', p: 'coin', c: 'certifications', s: 'spec_walkthrough',
    a: 'A recognised component mark answers a narrower question than most buyers assume.',
    m: ['component recognition vs end-product listing', 'how it interacts with IEC 62133 evidence', 'what to request from a supplier and verify'] },

  { k: 'coin-reverse-charge', t: 'Reverse Charging in Series Coin Cell Stacks', p: 'coin', c: 'technology', s: 'failure_analysis',
    a: 'Two cells in series will eventually drive the weaker one backwards, and that is when the stack leaks.',
    m: ['cell imbalance developing over discharge', 'what reverse charging does chemically', 'design and end-of-life mitigations'] },

  // ============================= CROSS =============================
  { k: 'un383-report-reading', t: 'Reading a UN 38.3 Test Report Properly', p: 'cross', c: 'certifications', s: 'spec_walkthrough',
    a: 'A report arrives, it says pass, and almost nobody checks that it covers the thing they are shipping.',
    m: ['matching the tested model and configuration to yours', 'the eight tests and what each one is for', 'the test summary document and who must hold it'] },

  { k: 'dg-packaging', t: 'Packaging Lithium Batteries for Transport', p: 'cross', c: 'certifications', s: 'spec_walkthrough',
    a: 'Most dangerous-goods rejections are packaging and paperwork, not the cell.',
    m: ['packing instruction selection by contents and mode', 'inner packaging and short-circuit prevention', 'marks, labels and documentation that travel with the box'] },

  { k: 'recall-process', t: 'If You Have to Recall a Battery Product', p: 'cross', c: 'industry-insights', s: 'process_spec',
    a: 'The recall you can execute is the one your traceability made possible, decided long before the incident.',
    m: ['lot traceability from cell to finished unit', 'the decision framework for scope', 'notification obligations and the transport problem of returns'] },

  { k: 'supplier-audit', t: 'Auditing a Cell Manufacturer: What to Look At', p: 'cross', c: 'industry-insights', s: 'buyer_guide',
    a: 'A factory audit that only walks the line misses the systems that actually determine consistency.',
    m: ['process control and where data is recorded', 'incoming material control and traceability', 'change management and how deviations are handled'] },

  { k: 'qms-standards', t: 'ISO 9001, ISO 13485, IATF 16949: Which Applies', p: 'cross', c: 'certifications', s: 'comparison',
    a: 'Quality system certificates are not interchangeable, and asking for the wrong one wastes everyone’s time.',
    m: ['scope differences between the three', 'what each implies about supplier processes', 'how to verify scope covers your product'] },

  { k: 'rohs-reach', t: 'RoHS and REACH for Battery Products', p: 'cross', c: 'certifications', s: 'spec_walkthrough',
    a: 'Two different obligations that get merged into one line item on a purchase order.',
    m: ['substance restriction vs registration and communication', 'what documentation is actually meaningful', 'how batteries sit relative to the wider product'] },

  { k: 'conflict-minerals', t: 'Conflict Minerals Reporting in a Battery Supply Chain', p: 'cross', c: 'industry-insights', s: 'process_spec',
    a: 'The reporting obligation flows downhill, and battery suppliers are asked for data they may have to collect upstream.',
    m: ['which materials trigger the enquiry', 'the reporting template and how it propagates', 'realistic expectations of smelter-level visibility'] },

  { k: 'cell-carbon-footprint', t: 'Where a Cell’s Carbon Footprint Comes From', p: 'cross', c: 'industry-insights', s: 'deep_dive',
    a: 'Most of a cell’s embodied carbon is decided before it reaches the assembly line.',
    m: ['materials and refining as the dominant contributors', 'electricity mix at the manufacturing site', 'what a declared figure does and does not include'] },

  { k: 'recycling-logistics', t: 'The Logistics of Recycling Lithium Batteries', p: 'cross', c: 'industry-insights', s: 'market_note',
    a: 'Recycling is often held up by collection and transport rather than by process technology.',
    m: ['collection and the transport rules on damaged cells', 'sorting by chemistry and why it matters to value', 'what a producer is typically responsible for'] },

  { k: 'counterfeit-detection', t: 'Spotting Counterfeit and Re-Wrapped Cells', p: 'cross', c: 'industry-insights', s: 'field_notes',
    a: 'Counterfeit cells reach real supply chains through shortages, and they are identifiable if you look.',
    m: ['weight, dimension and capacity checks that expose them', 'documentation and traceability gaps', 'purchasing practices that keep them out'] },

  { k: 'serialisation', t: 'Serialising Cells and Packs', p: 'cross', c: 'technology', s: 'process_spec',
    a: 'Unit-level identity is what turns a field failure into an answerable question.',
    m: ['what to serialise and at which level', 'marking methods that survive the product life', 'linking serial to lot, test and shipment records'] },

  { k: 'incoterms-batteries', t: 'Incoterms and Who Owns the Dangerous Goods Problem', p: 'cross', c: 'industry-insights', s: 'buyer_guide',
    a: 'The shipping term quietly assigns the compliance obligations, and buyers routinely accept ones they cannot discharge.',
    m: ['which terms place declaration duties on the buyer', 'insurance and risk transfer for lithium shipments', 'what to agree explicitly rather than by default'] },

  { k: 'hs-codes', t: 'Classification and Customs for Battery Shipments', p: 'cross', c: 'industry-insights', s: 'buyer_guide',
    a: 'Classification drives duty, documentation and sometimes whether the shipment moves at all.',
    m: ['cells vs batteries vs installed-in-equipment', 'documentation that must accompany the classification', 'common misclassification and its consequences'] },

  { k: 'inventory-insurance', t: 'Insuring Lithium Inventory', p: 'cross', c: 'industry-insights', s: 'market_note',
    a: 'Insurers treat stored lithium as a distinct risk class, and the terms shape how you are allowed to store it.',
    m: ['storage conditions that policies typically require', 'quantity thresholds and segregation', 'the documentation that supports a claim'] },

  { k: 'warehouse-fire', t: 'Fire Protection for Lithium Battery Storage', p: 'cross', c: 'certifications', s: 'spec_walkthrough',
    a: 'Lithium storage has its own fire-protection logic because the failure behaves unlike a conventional warehouse fire.',
    m: ['segregation, quantity limits and racking', 'detection and suppression considerations', 'the state of charge of stored stock as a risk lever'] },

  { k: 'sds-for-cells', t: 'Safety Data Sheets for Lithium Cells', p: 'cross', c: 'certifications', s: 'spec_walkthrough',
    a: 'An article is not a chemical, which makes the SDS question for cells more nuanced than a purchase order allows for.',
    m: ['why an SDS is still commonly requested and supplied', 'what the document usefully contains for a cell', 'how it differs from a transport document'] },

  { k: 'regional-labelling', t: 'Regional Labelling and Warning Requirements', p: 'cross', c: 'certifications', s: 'buyer_guide',
    a: 'Labelling obligations vary by market and are usually discovered at the border.',
    m: ['recycling and disposal marking expectations', 'language requirements in several markets', 'planning label artwork for multiple markets at once'] },

  { k: 'directive-vs-regulation', t: 'Why the EU Moved From a Battery Directive to a Regulation', p: 'cross', c: 'industry-insights', s: 'market_note',
    a: 'The legal instrument changed, and that change is itself the substantive news for exporters.',
    m: ['directive requiring national transposition vs directly applicable regulation', 'what that does to divergence between member states', 'practical implications for compliance planning'] },

  { k: 'producer-responsibility', t: 'Extended Producer Responsibility for Batteries', p: 'cross', c: 'industry-insights', s: 'spec_walkthrough',
    a: 'Somebody has to register and pay for end-of-life handling, and importers are often surprised that it is them.',
    m: ['who counts as the producer in common arrangements', 'registration and reporting obligations', 'compliance scheme membership as the usual route'] },

  { k: 'air-vs-sea-decision', t: 'Air or Sea: Deciding How to Move Cells', p: 'cross', c: 'industry-insights', s: 'decision_framework',
    a: 'The mode decision is a cost, time and compliance calculation, and the compliance leg is the one that surprises people.',
    m: ['state-of-charge and quantity constraints by mode', 'transit time against inventory carrying cost', 'the cases where sea is not actually an option'] },

  { k: 'supplier-qualification-timeline', t: 'How Long Qualifying a New Cell Supplier Takes', p: 'cross', c: 'industry-insights', s: 'process_spec',
    a: 'Supplier qualification runs on calendar time you cannot buy your way out of, and it should start before you need it.',
    m: ['sample, audit, test and pilot stages in sequence', 'the steps that run in parallel and those that cannot', 'what a realistic plan looks like end to end'] },

  { k: 'cell-price-drivers', t: 'What Actually Drives Cell Prices', p: 'cross', c: 'industry-insights', s: 'deep_dive',
    a: 'Cell pricing is often explained by raw materials alone, which is the smaller half of the story for small formats.',
    m: ['material cost share vs conversion and yield', 'format and volume effects', 'why small custom formats track the headline indices poorly'] },

  { k: 'price-transmission', t: 'How Raw Material Prices Reach a Purchase Order', p: 'cross', c: 'industry-insights', s: 'market_note',
    a: 'The lag between a commodity index and your quoted price is long, asymmetric, and worth understanding before you negotiate.',
    m: ['contract structures and index linkage', 'the lag and why increases arrive faster than decreases', 'what a buyer can reasonably ask for'] },

  { k: 'capacity-expansion', t: 'Reading Capacity Expansion Announcements', p: 'cross', c: 'industry-insights', s: 'market_note',
    a: 'Announced capacity, built capacity and qualified capacity are three different numbers, and only the third helps you.',
    m: ['nameplate vs effective output', 'the qualification lag before new capacity serves a customer', 'what this means for supply planning'] },

  { k: 'cell-vs-pack-supplier', t: 'Buying Cells or Buying Packs', p: 'cross', c: 'industry-insights', s: 'decision_framework',
    a: 'Where you draw the line decides who owns integration risk, certification and the failure analysis when something goes wrong.',
    m: ['what each model puts on your engineering team', 'certification and liability boundaries', 'the volumes at which each makes sense'] },
];

// Validate the table at load. With a hundred entries a copy-paste slip
// is a matter of time, and every one of these mistakes would otherwise
// surface as a draft saved with a null category or a shape that silently
// fell back to deep_dive.
const VALID_PILLARS = new Set(['polymer', 'custom', 'coin', 'cross']);
// Matches the categories seeded in seed.sql. 'product-updates' is
// deliberately unused: announcing a product is not something a model
// should be inventing.
const VALID_CATEGORIES = new Set([
  'technology', 'industry-insights', 'certifications', 'product-updates',
]);

const seen = new Set();
for (const pb of PLAYBOOKS) {
  if (seen.has(pb.k)) throw new Error(`duplicate playbook key: ${pb.k}`);
  seen.add(pb.k);
  if (!VALID_PILLARS.has(pb.p)) throw new Error(`${pb.k}: bad pillar "${pb.p}"`);
  if (!VALID_CATEGORIES.has(pb.c)) throw new Error(`${pb.k}: bad category "${pb.c}"`);
  if (!require('./ai-shapes').SHAPES[pb.s]) throw new Error(`${pb.k}: bad shape "${pb.s}"`);
  if (!pb.t || !pb.a) throw new Error(`${pb.k}: missing title or angle`);
  if (!Array.isArray(pb.m) || pb.m.length < 2) throw new Error(`${pb.k}: needs 2+ must-cover points`);
}

const BY_KEY = new Map(PLAYBOOKS.map((pb) => [pb.k, pb]));

function get(key) { return BY_KEY.get(key) || null; }
function all() { return PLAYBOOKS.slice(); }
function count() { return PLAYBOOKS.length; }

function byPillar(p) { return PLAYBOOKS.filter((pb) => pb.p === p); }

module.exports = { PLAYBOOKS, BY_KEY, get, all, count, byPillar };
