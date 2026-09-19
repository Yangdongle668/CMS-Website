-- =====================================================================
-- 2026 Q3 — Five articles to close the June-September publishing gap
-- =====================================================================
-- The blog stopped in May. These five fill it, and they were chosen by
-- looking at what the 48 existing posts do NOT cover rather than by
-- picking topics that read well:
--
--   reading-a-lipo-datasheet        specifying — nothing covered how to
--                                   read the document every OEM starts from
--   battery-connector-harness-...   the custom-shape cluster covered
--                                   geometry and tooling but never the
--                                   interface to the host board
--   c-rate-selection-lipo           capacity sizing was covered; current
--                                   sizing was not
--   pse-kc-bis-regional-cert...     the compliance cluster covered IEC and
--                                   UN only. Japan, Korea and India are
--                                   where an exporter actually gets stuck
--   lithium-storage-state-of-charge warehousing and calendar ageing had no
--                                   article at all
--
-- Each one is bound to a pillar (so it joins that topic cluster and is
-- reachable from the pillar page), carries a focus keyword and meta
-- pair, links to its cluster siblings, and cites a primary source.
--
-- Dates are relative to install time, matching the convention in
-- seed.sql: a deployment restored next quarter still shows a sane
-- publishing cadence instead of a wall of stale posts.
--
-- ON CONFLICT DO NOTHING throughout: the migration runs on every boot,
-- and an operator's later edits to these rows must survive it.

INSERT INTO articles (
  pillar_id, author_id, category_id, slug, title, excerpt,
  cover_url, hero_image, content, author, reading_minutes,
  meta_title, meta_description, focus_keyword, citations,
  published_at, status
) VALUES

-- ---------------------------------------------------------------- 1 --
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='chen-li'),
 (SELECT id FROM categories WHERE slug='technology'),
 'reading-a-lipo-datasheet',
 'How to Read a Li-Po Datasheet Without Getting Burned',
 'Every number on a lithium polymer datasheet was measured under conditions the sheet may not print. Here is what each line actually promises, and which ones to ask about before you design around them.',
 '/assets/img/seed/photo-1581092921461-eab62e97a780.jpg',
 '/assets/img/seed/photo-1581092921461-eab62e97a780.jpg',
 $art$<p class="lede">A cell datasheet is a marketing document with engineering units. Nothing on it is false, but almost every number carries a test condition, and the conditions are where the disagreements between your bench results and the supplier's numbers come from. Here is how to read one properly.</p>

<h2>Capacity: typical, minimum, and at what rate</h2>
<p>A sheet that says "1200 mAh" has told you very little. Ask three questions:</p>
<ul>
  <li><strong>Typical or minimum?</strong> Typical is the batch mean. Minimum is what every cell must clear. If you are sizing a product's runtime claim, you size on minimum, because half your production will land below typical by definition.</li>
  <li><strong>At what discharge rate?</strong> Rated capacity is almost always measured at 0.2C — a gentle five-hour discharge. Your device may pull 1C in bursts and see noticeably less delivered capacity.</li>
  <li><strong>To what cut-off voltage?</strong> Capacity measured down to 2.75 V is a larger number than capacity to 3.0 V. If your DC-DC drops out at 3.2 V, the tail below that is capacity you paid for and cannot use.</li>
</ul>
<p>The practical move: specify the capacity you need <em>at your real discharge rate, to your real cut-off</em>, and let the supplier tell you which cell meets it. See <a href="/blog/cell-sizing">sizing a cell from a power profile</a> for how to turn a current trace into that number.</p>

<h2>Nominal and charge voltage</h2>
<p>Nominal voltage (3.7 V for most Li-Po, 3.8 V or higher for high-voltage cathode platforms) is a nameplate figure roughly representing the mid-discharge plateau. It is used for energy arithmetic and little else.</p>
<p>The number that constrains your design is the <strong>charge voltage</strong>: 4.2 V for a standard cell, 4.35 V to 4.48 V for the high-voltage platforms discussed in <a href="/blog/hv-lco-density">our note on HV LCO</a>. Charging a 4.2 V cell to 4.35 V does not give you free capacity; it gives you accelerated degradation and, eventually, gassing.</p>

<h2>Cycle life, and the four conditions behind it</h2>
<p>"≥ 500 cycles to 80% capacity" is meaningless without charge rate, discharge rate, temperature and depth of discharge. Change any one and the number moves substantially. A cell rated 500 cycles at 0.5C/0.5C, 23 °C, 100% DoD may deliver far more at 50% DoD and far fewer at 45 °C.</p>
<p>We wrote a whole piece on this — <a href="/blog/cycle-life-curves">reading a cycle-life curve honestly</a> — because it is the single most misread line on any datasheet.</p>

<h2>Internal resistance</h2>
<p>Usually quoted as AC impedance at 1 kHz, which is a convenient production measurement and <em>not</em> the DC resistance that determines your voltage sag under load. DC-IR is typically higher. If your design has a tight low-battery cut-off and pulsed loads, ask for DC-IR at your pulse width and temperature, not the 1 kHz number.</p>
<p>Internal resistance also rises as the cell ages and falls as it warms — so an end-of-life cell on a cold morning is the worst case your power budget has to survive.</p>

<h2>Dimensions and the thickness you will actually get</h2>
<p>Pouch cells are quoted at a nominal thickness with a tolerance, and the tolerance is not symmetric in practice: cells grow slightly over life. A cell specified at 4.0 mm may be built to 4.0 mm +0.2/-0.1 and reach 4.3–4.5 mm late in life under normal cycling.</p>
<p>Design the enclosure cavity for the aged, charged, warm dimension — not the nominal one on the sheet. Our note on <a href="/blog/lipo-battery-swelling-causes">what causes Li-Po swelling</a> covers where that growth comes from and which part of it is normal.</p>

<h2>Operating temperature: two ranges, not one</h2>
<p>Charge and discharge windows differ, and the charge window is the narrower one. A typical cell discharges from −20 °C to 60 °C but charges only from 0 °C to 45 °C. Charging below 0 °C risks lithium plating — permanent capacity loss and a genuine safety concern. If your product can be charged outdoors in winter, your charger needs a thermistor and the firmware to respect it. <a href="/blog/cc-cv-charging-protocol">The CC-CV protocol piece</a> covers how to stage that.</p>

<h2>What is usually missing</h2>
<p>Four things a good supplier will provide on request and a datasheet rarely prints:</p>
<ol>
  <li><strong>Self-discharge rate</strong> at a stated temperature — matters for anything that sits on a shelf.</li>
  <li><strong>DC-IR</strong> at your pulse profile, as above.</li>
  <li><strong>Swelling data</strong> over cycle count, not just a static thickness tolerance.</li>
  <li><strong>The IEC 62133-2 test report</strong> for the exact cell model, not a sister model.</li>
</ol>
<p>If a supplier cannot produce the last one, that is the answer to several other questions at once.</p>

<h2>A short checklist</h2>
<ol>
  <li>Capacity: minimum, at your rate, to your cut-off.</li>
  <li>Charge voltage, and whether your charger matches it exactly.</li>
  <li>Cycle life with all four conditions stated.</li>
  <li>DC-IR, not just 1 kHz AC impedance.</li>
  <li>Aged thickness, not nominal.</li>
  <li>Charge temperature window, and how firmware enforces it.</li>
</ol>
<p>Send that list to two suppliers and the comparison gets much easier.</p>

<nav class="article-nav">
  <a href="/blog/cell-sizing" class="prev">&larr; Previous: Sizing a Cell From a Power Profile</a>
  <a href="/blog/c-rate-selection-lipo" class="next">Next: Picking a C-Rate &rarr;</a>
</nav>$art$,
 'Chen Li', 9,
 'How to Read a Li-Po Battery Datasheet: Every Spec Explained',
 'What each line on a Li-Po datasheet really promises: capacity at rate, cycle-life conditions, DC-IR vs AC impedance, aged thickness and charge temperature.',
 'lithium polymer battery datasheet',
 $json$[{"label":"IEC 62133-2 — Safety requirements for portable sealed secondary lithium cells","url":"https://webstore.iec.ch/","publisher":"International Electrotechnical Commission"}]$json$::jsonb,
 now() - interval '99 days', 'published'),

-- ---------------------------------------------------------------- 2 --
((SELECT id FROM pillar_pages WHERE slug='custom-shaped-polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='wei-zhang'),
 (SELECT id FROM categories WHERE slug='technology'),
 'battery-connector-harness-selection',
 'Choosing Connectors and Harnesses for a Custom Li-Po Pack',
 'Pitch, current rating, polarity protection, wire gauge and strain relief — the interface between a custom cell and your board, and the five ways it goes wrong in the field.',
 '/assets/img/seed/photo-1518770660439-4636190af475.jpg',
 '/assets/img/seed/photo-1518770660439-4636190af475.jpg',
 $art$<p class="lede">Custom-shape programs spend months on geometry and capacity, then pick the connector in an afternoon from whatever the last project used. It is the cheapest part of the pack and the one we see fail most often in the field, because it is the only part that gets handled by a human during assembly and service.</p>

<h2>Start from the current, not the catalogue</h2>
<p>Pick the contact rating first, then the pitch that supports it. Common small-format families, by pitch:</p>
<ul>
  <li><strong>1.00 mm</strong> (JST SH and equivalents) — around 1 A per contact. Fine for wearables and sensors; too tight for anything with a motor or a high-inrush DC-DC.</li>
  <li><strong>1.25 mm</strong> (Molex PicoBlade and equivalents) — around 1 A. Slightly more robust mechanically than 1.0 mm.</li>
  <li><strong>1.50 mm</strong> (JST ZH and equivalents) — around 1 A, with a friction lock available.</li>
  <li><strong>2.00 mm</strong> (JST PH and equivalents) — around 2 A. The default for anything above a few hundred milliamps.</li>
</ul>
<p>Treat published per-contact ratings as a ceiling measured on a single mated pair at room temperature. Derate for ambient, for adjacent powered contacts, and for the fact that a pack connector may be mated and unmated during service.</p>

<h2>Peak current is the number that matters</h2>
<p>Size on the peak, not the average. A device drawing 200 mA average with 2 A radio bursts needs a 2 A interface. If you do not know your peak, measure it — the same current trace you built to size the cell (see <a href="/blog/cell-sizing">sizing from a power profile</a>) already contains it.</p>

<h2>Wire gauge and where the heat goes</h2>
<p>Gauge is chosen for two independent reasons: current-carrying capacity and voltage drop. In a small pack, voltage drop usually binds first — a few tens of millivolts lost in the harness comes straight out of your low-battery margin.</p>
<p>Thinner wire also means a more fragile joint at the tab weld. For pouch cells we default to 26 AWG for general use and 24 AWG where peak current or harness length justifies it; below 28 AWG the mechanical reliability of the termination, not the copper, is the limiting factor.</p>

<h2>Polarity: design it out, do not document it out</h2>
<p>A reversed pack connector destroys the host board, and a note in the assembly manual will not prevent it. Three mechanisms, in order of how much we trust them:</p>
<ol>
  <li><strong>Keyed and polarised housings.</strong> Physically impossible to seat backwards. Always the first choice.</li>
  <li><strong>Asymmetric pin count or position</strong> — a three-pin housing with the thermistor off-centre cannot be reversed even if the shell is symmetric.</li>
  <li><strong>Reverse-polarity protection on the board.</strong> A back-to-back FET costs a few cents and covers the case where someone sources a compatible-but-unkeyed housing during a shortage.</li>
</ol>
<p>Use at least two of the three on anything that will be serviced in the field.</p>

<h2>The thermistor line</h2>
<p>If the pack carries an NTC for charge-temperature sensing — and it should, for the reasons in <a href="/blog/wearable-thermal">managing skin-contact temperature</a> — that is a third conductor and a third contact. Decide early: a two-pin pack cannot gain a thermistor later without new tooling on the housing and a new harness part number.</p>

<h2>Strain relief is a mechanical requirement, not a nicety</h2>
<p>The failure mode we see returned most often is not a bad crimp. It is wire fatigue a few millimetres from the tab weld, caused by the harness flexing every time the enclosure is opened or the pack shifts inside it. Kapton anchoring at the cell, a service loop, and a housing that constrains the wire exit direction fix nearly all of it.</p>
<p>For stepped and curved packs the exit geometry interacts with the cell shape — worth resolving during the co-design phase described in <a href="/blog/co-design-battery-workflow">our battery co-design workflow</a> rather than after the tooling is cut. Tooling changes are not cheap; see <a href="/blog/custom-battery-tooling-cost">what custom tooling actually costs</a>.</p>

<h2>What to put on the drawing</h2>
<ol>
  <li>Connector manufacturer part number for <em>both</em> halves, plus the crimp terminal part number.</li>
  <li>Wire gauge, insulation type and finished length, with tolerance.</li>
  <li>Pin-out with polarity called out explicitly, including the thermistor if present.</li>
  <li>Strain-relief detail at the cell end.</li>
  <li>Pull-test acceptance criterion for the terminated harness.</li>
</ol>
<p>A pack drawing missing any of these will be built to somebody's assumption, and it will not be yours.</p>

<nav class="article-nav">
  <a href="/blog/co-design-battery-workflow" class="prev">&larr; Previous: The Battery Co-Design Workflow</a>
  <a href="/blog/stepped-battery-geometry" class="next">Next: Stepped Battery Geometry &rarr;</a>
</nav>$art$,
 'Wei Zhang', 8,
 'Connector and Harness Selection for Custom Li-Po Packs',
 'How to choose the connector, pitch, wire gauge and strain relief for a custom Li-Po pack, plus the polarity and thermistor calls that are costly to change.',
 'battery connector selection',
 $json$[{"label":"IEC 62133-2 — Safety requirements for portable sealed secondary lithium cells","url":"https://webstore.iec.ch/","publisher":"International Electrotechnical Commission"}]$json$::jsonb,
 now() - interval '73 days', 'published'),

-- ---------------------------------------------------------------- 3 --
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='chen-li'),
 (SELECT id FROM categories WHERE slug='technology'),
 'c-rate-selection-lipo',
 'Picking a C-Rate: Why Your Cell Runs Hot at Spec',
 'Capacity sizing tells you how big the cell is. C-rate sizing tells you whether it survives the load. The two are different calculations and only one of them is usually done.',
 '/assets/img/seed/photo-1532456745301-b2c645d8b80d.jpg',
 '/assets/img/seed/photo-1532456745301-b2c645d8b80d.jpg',
 $art$<p class="lede">A cell chosen purely on capacity will meet its runtime target on the bench and run hot, sag under load and age early in the product. Capacity answers "how much energy"; C-rate answers "how fast can I take it out without hurting the cell". Most specifications answer only the first.</p>

<h2>What C actually means</h2>
<p>1C is the current that would discharge the rated capacity in one hour. For a 1000 mAh cell, 1C is 1000 mA; 0.5C is 500 mA; 2C is 2000 mA. It is a normalised unit, which is what makes it useful — a 2C load means the same thing to a 200 mAh wearable cell and a 5000 Ah pack.</p>
<p>The reason engineers get caught is that <em>rated capacity is measured at a low rate</em>, typically 0.2C. If you then run the cell at 2C, you will not get the rated capacity out of it, because more of the energy leaves as heat in the cell's own resistance.</p>

<h2>Continuous versus pulse: two different ratings</h2>
<p>A datasheet may quote a maximum continuous discharge of 1C and a maximum pulse of 3C. These are not interchangeable, and "pulse" is meaningless without a duration and a duty cycle. A 3C pulse rating usually means something like a few seconds at low duty — not a 3C burst every 100 ms forever.</p>
<p>If your load is bursty — a cellular modem, a motor, a radio — characterise it properly: peak amplitude, pulse width, duty cycle, and the worst-case sequence (a modem registering on a cold network is not the same as one idling).</p>

<h2>Where the heat comes from</h2>
<p>Resistive heating in the cell goes as I²R. Doubling the current quadruples the heat. This is why a design that is comfortable at 1C can be thermally impossible at 2C even though the cell is "rated" for it — the rating is about the cell surviving, not about your enclosure staying below a skin-contact limit.</p>
<p>Two compounding effects make the worst case worse than the arithmetic suggests:</p>
<ul>
  <li><strong>Resistance rises as the cell ages.</strong> The end-of-life cell generates more heat at the same current than the new one you prototyped with.</li>
  <li><strong>Resistance rises as the cell gets cold.</strong> Cold plus aged plus peak load is the corner your thermal and voltage budgets both have to survive.</li>
</ul>
<p>Our piece on <a href="/blog/wearable-thermal">skin-contact temperature</a> covers the enclosure side of this; <a href="/blog/thermal-runaway">thermal runaway</a> covers what happens when the margin is gone entirely.</p>

<h2>C-rate and cycle life trade against each other</h2>
<p>Higher sustained rates shorten cycle life, and they do it in a way that does not show up in a short bench test. If you are quoting a cycle-life number from a datasheet measured at 0.5C and running the product at 1.5C, the field number will be lower — see <a href="/blog/cycle-life-curves">reading a cycle-life curve honestly</a> for why the conditions matter more than the headline.</p>

<h2>Three ways to lower the C-rate a cell sees</h2>
<ol>
  <li><strong>Use a bigger cell.</strong> The same absolute current is a lower C-rate on a larger cell. Often the cheapest fix if the enclosure allows it.</li>
  <li><strong>Put cells in parallel.</strong> Two matched cells share the current, halving the rate each sees. Bring the matching and protection questions in <a href="/blog/parallel-series-cell-configuration">series and parallel configuration</a> with you.</li>
  <li><strong>Flatten the load.</strong> A bulk capacitor across a short high-amplitude burst can cut the peak the cell sees substantially, and it is far cheaper than a bigger battery.</li>
</ol>

<h2>A working method</h2>
<ol>
  <li>Capture the real current trace, including worst-case bursts.</li>
  <li>Compute peak and continuous C-rate against the candidate cell's rated capacity.</li>
  <li>Check both against the datasheet's continuous and pulse ratings, with the pulse conditions stated.</li>
  <li>Re-check at end-of-life resistance and at your minimum operating temperature.</li>
  <li>If either check fails, apply one of the three fixes above rather than hoping the rating is conservative.</li>
</ol>
<p>Steps 4 and 5 are the ones usually skipped, and they are where field failures come from.</p>

<nav class="article-nav">
  <a href="/blog/reading-a-lipo-datasheet" class="prev">&larr; Previous: How to Read a Li-Po Datasheet</a>
  <a href="/blog/parallel-series-cell-configuration" class="next">Next: Series and Parallel Configuration &rarr;</a>
</nav>$art$,
 'Chen Li', 8,
 'Lithium Battery C-Rate Selection: Continuous vs Pulse Limits',
 'Sizing a lithium cell for current, not just capacity: what C-rate means, how continuous and pulse ratings differ, and three ways to lower the rate it sees.',
 'lithium battery C-rate',
 $json$[{"label":"IEC 62133-2 — Safety requirements for portable sealed secondary lithium cells","url":"https://webstore.iec.ch/","publisher":"International Electrotechnical Commission"}]$json$::jsonb,
 now() - interval '52 days', 'published'),

-- ---------------------------------------------------------------- 4 --
(NULL,
 (SELECT id FROM authors WHERE slug='mei-yang'),
 (SELECT id FROM categories WHERE slug='certifications'),
 'pse-kc-bis-regional-certification',
 'PSE, KC and BIS: The Certifications IEC 62133 Does Not Cover',
 'IEC 62133-2 gets you a test report. Japan, Korea and India each want something more before your product clears customs — and each has a lead time your launch plan needs to know about.',
 '/assets/img/seed/photo-1618477388954-7852f32655ec.jpg',
 '/assets/img/seed/photo-1618477388954-7852f32655ec.jpg',
 $art$<p class="lede">Teams often treat battery compliance as solved once they hold an IEC 62133-2 report and a UN 38.3 summary. Those two clear the cell technically and clear the shipment legally. They do not, by themselves, let you sell in Japan, Korea or India. Each of those markets layers a national scheme on top, and each one takes longer than people plan for.</p>

<h2>What IEC 62133-2 actually gives you</h2>
<p>A test report against an international standard, issued by a testing laboratory. It is the technical foundation nearly every national scheme builds on — which is why doing it first, properly, and for the exact cell model you will ship, saves time downstream. Our <a href="/blog/iec-62133-2-full-walkthrough">walkthrough of IEC 62133-2</a> covers the test sequence; <a href="/blog/un-iec-compliance">UN 38.3 and IEC 62133 together</a> covers how the two relate.</p>
<p>What it is not: a licence, a mark you may print, or a registration in any country's database.</p>

<h2>Japan — PSE</h2>
<p>Lithium-ion secondary batteries fall under Japan's Electrical Appliance and Material Safety Act, generally known by its Japanese abbreviation DENAN. Batteries in this category carry the round PSE mark, which means conformity is declared by the importer or domestic seller on the basis of testing against the Japanese technical requirements — rather than the diamond mark used for the more tightly controlled "specified" product categories.</p>
<p>Practical consequences:</p>
<ul>
  <li>There must be a responsible party established in Japan who files the business notification and holds the conformity records. If you sell through a distributor, agree in writing who that is — this is a common and expensive ambiguity.</li>
  <li>Testing is against the Japanese requirements, which are aligned with but not identical to IEC 62133. An IEC report shortens the work; it does not replace it.</li>
  <li>Records must be retained and produced on request.</li>
</ul>

<h2>Korea — KC</h2>
<p>Korea operates a certification scheme under its electrical appliance and consumer product safety legislation, with lithium cells and batteries assessed against KC 62133, a national adoption of IEC 62133.</p>
<p>The part that surprises people is not the testing — it is that the scheme involves <strong>factory assessment and ongoing surveillance</strong>, not just a one-time report. That means:</p>
<ul>
  <li>Your cell manufacturer's plant may need to be audited, and must be willing to be.</li>
  <li>Certification is tied to that manufacturing site. Moving production lines is a certification event, not just a supply-chain event.</li>
  <li>There is periodic follow-up, so the cost is recurring rather than one-off.</li>
</ul>
<p>If you are dual-sourcing cells, assume each source needs its own path through this.</p>

<h2>India — BIS</h2>
<p>India regulates lithium batteries through the Bureau of Indian Standards under its Compulsory Registration Scheme, against IS 16046, which is the Indian adoption of IEC 62133.</p>
<p>Two structural features drive the timeline:</p>
<ul>
  <li><strong>Testing must be done in a BIS-recognised laboratory in India.</strong> A report from a European or Chinese lab, however reputable, does not substitute. Samples have to physically get there — and they are lithium batteries, so they ship under the dangerous-goods rules described in <a href="/blog/lithium-shipping">DGR basics for product managers</a>.</li>
  <li><strong>Foreign manufacturers register through a scheme requiring an Indian representative</strong>, and registration is granted to a specific manufacturer and model.</li>
</ul>
<p>Sample shipping plus in-country testing plus registration processing is the long pole. Start it before you need it.</p>

<h2>Planning implications</h2>
<ol>
  <li><strong>Freeze the cell model early.</strong> Every scheme above certifies a specific model from a specific plant. A late cell change restarts all of them in parallel.</li>
  <li><strong>Budget the calendar, not just the fee.</strong> The testing is rarely the expensive part; the schedule slip is.</li>
  <li><strong>Get the IEC 62133-2 report for the exact model first.</strong> It is the input to everything downstream.</li>
  <li><strong>Settle who the in-country responsible party is</strong> for each market, in the distribution agreement, before launch.</li>
  <li><strong>Treat a second source as a second certification programme.</strong></li>
</ol>

<h2>What this does not cover</h2>
<p>Market access is not the only regulatory axis. The EU's battery regulation adds lifecycle and data-disclosure obligations that are about the product's whole life rather than its market entry — see <a href="/blog/eu-battery-passport">the EU Battery Passport</a>. And transport rules apply independently of all of the above, everywhere, every time you ship.</p>
<p class="lede">This is an engineering orientation, not legal advice. Confirm current requirements with the relevant authority or a qualified consultant for your market and product category before committing a launch date.</p>

<nav class="article-nav">
  <a href="/blog/un-iec-compliance" class="prev">&larr; Previous: UN 38.3 &amp; IEC 62133</a>
  <a href="/blog/eu-battery-passport" class="next">Next: The EU Battery Passport &rarr;</a>
</nav>$art$,
 'Mei Yang', 9,
 'PSE, KC and BIS: Regional Lithium Battery Certification',
 'What Japan (PSE), Korea (KC 62133) and India (BIS / IS 16046) require on top of IEC 62133-2: factory audits, in-country testing and realistic lead times.',
 'lithium battery regional certification',
 $json$[
   {"label":"IEC 62133-2 — Safety requirements for portable sealed secondary lithium cells","url":"https://webstore.iec.ch/","publisher":"International Electrotechnical Commission"},
   {"label":"UN Manual of Tests and Criteria, Part III, sub-section 38.3","url":"https://unece.org/transport/dangerous-goods","publisher":"UNECE"}
 ]$json$::jsonb,
 now() - interval '31 days', 'published'),

-- ---------------------------------------------------------------- 5 --
((SELECT id FROM pillar_pages WHERE slug='polymer-lithium-battery'),
 (SELECT id FROM authors WHERE slug='chen-li'),
 (SELECT id FROM categories WHERE slug='technology'),
 'lithium-storage-state-of-charge',
 'Storage State of Charge: What Happens to Cells in Your Warehouse',
 'A cell sitting in a box is still ageing. How fast depends almost entirely on two numbers you control: its state of charge and the temperature of the room.',
 '/assets/img/seed/photo-1568057373560-8d71ccf43b26.jpg',
 '/assets/img/seed/photo-1568057373560-8d71ccf43b26.jpg',
 $art$<p class="lede">Cycle life gets all the attention because it is the number on the datasheet. For a product that ships in volume, calendar ageing during storage often costs more capacity than the cycling does — and unlike cycling, it is almost free to control. Two variables dominate: how charged the cells are, and how warm the room is.</p>

<h2>Why a stored cell degrades at all</h2>
<p>Degradation continues without any current flowing. The dominant mechanism is slow, self-consuming chemistry at the electrode interfaces, and its rate depends strongly on temperature and on the cell's voltage. A cell held at high state of charge sits at high voltage, which accelerates that chemistry. A warm cell accelerates it further.</p>
<p>This is the same family of mechanisms that drives the capacity loss discussed in <a href="/blog/lithium-battery-capacity-fade">lithium battery capacity fade</a>; storage is the case where it operates with no cycling to mask it.</p>

<h2>The two rules</h2>
<ul>
  <li><strong>Store at partial charge, not full.</strong> Common manufacturer guidance is in the region of 30–50% state of charge. This is the single biggest lever, and it costs nothing.</li>
  <li><strong>Store cool, not cold.</strong> A stable, moderate room temperature is the goal. Freezing is not required and introduces condensation risk on removal; what matters is avoiding sustained heat.</li>
</ul>
<p>The failure case to avoid is the combination: fully charged cells in an un-airconditioned warehouse through a hot summer. That is where a batch arrives at the assembly line measurably down on capacity, and nobody can explain why the bench prototypes were fine.</p>

<h2>Self-discharge and the over-discharge cliff</h2>
<p>Every cell loses charge slowly on the shelf. That is normally harmless — but a cell stored for a long time at a <em>low</em> starting state of charge can self-discharge into deep over-discharge, where copper dissolution can occur and the cell may be unsafe to recharge.</p>
<p>This is why the guidance is 30–50% and not "as low as possible". It is also why long-term storage needs a periodic check rather than a one-time decision. Our note on <a href="/blog/coin-cell-self-discharge-shelf-life">coin-cell self-discharge and shelf life</a> covers the equivalent problem in primary and small secondary cells.</p>

<h2>The shipping rule is not the storage rule</h2>
<p>Lithium-ion cells and batteries shipped on their own by air must be at a low state of charge — not more than 30% — under the dangerous-goods rules. That requirement exists to reduce the energy available in a transport incident, and it is a transport rule, not a storage recommendation.</p>
<p>The two happen to be compatible: shipping at ≤30% and storing at 30–50% are close enough that a sensible inbound process satisfies both. But do not reason from one to the other — the obligations come from different places. See <a href="/blog/lithium-shipping">DGR basics</a> and <a href="/blog/lithium-air-freight">lithium air freight</a> for the transport side.</p>

<h2>A practical warehouse process</h2>
<ol>
  <li><strong>Specify incoming state of charge</strong> in the purchase agreement, and measure it on receipt as a sampled check.</li>
  <li><strong>Control the room.</strong> Moderate, stable temperature matters more than a precise set point. Log it, so you can correlate later if a batch underperforms.</li>
  <li><strong>Rotate stock first-in-first-out</strong> by manufacture date, not receipt date.</li>
  <li><strong>Set a maximum shelf age</strong> before the cells are either used or checked, and define what the check is.</li>
  <li><strong>Re-check long-held stock:</strong> sample open-circuit voltage and reject anything that has drifted below the supplier's stated floor rather than attempting to recover it.</li>
  <li><strong>Keep manufacture-date traceability</strong> through to the finished product. When a field issue appears, the first useful question is how old the cells were.</li>
</ol>

<h2>What to ask your supplier</h2>
<ol>
  <li>Shipping state of charge, and the tolerance around it.</li>
  <li>Recommended storage state of charge and temperature for your intended duration.</li>
  <li>Self-discharge rate at a stated temperature.</li>
  <li>The open-circuit voltage floor below which a cell must be scrapped rather than recharged.</li>
  <li>Manufacture-date coding on the cell, so FIFO is actually enforceable.</li>
</ol>
<p>The fifth one sounds trivial and is the one most often missing.</p>

<nav class="article-nav">
  <a href="/blog/lithium-battery-capacity-fade" class="prev">&larr; Previous: Lithium Battery Capacity Fade</a>
  <a href="/blog/lithium-shipping" class="next">Next: Shipping Lithium — DGR Basics &rarr;</a>
</nav>$art$,
 'Chen Li', 8,
 'Lithium Battery Storage: State of Charge and Warehousing',
 'How state of charge and temperature drive calendar ageing in stored cells, why 30-50% SoC is the guidance, and a warehouse process that protects capacity.',
 'lithium battery storage state of charge',
 $json$[
   {"label":"IATA Dangerous Goods Regulations — Lithium Batteries","url":"https://www.iata.org/en/programs/cargo/dgr/","publisher":"IATA"},
   {"label":"UN Manual of Tests and Criteria, Part III, sub-section 38.3","url":"https://unece.org/transport/dangerous-goods","publisher":"UNECE"}
 ]$json$::jsonb,
 now() - interval '10 days', 'published')

ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE n BIGINT; newest DATE;
BEGIN
  SELECT count(*) INTO n FROM articles
   WHERE slug IN ('reading-a-lipo-datasheet','battery-connector-harness-selection',
                  'c-rate-selection-lipo','pse-kc-bis-regional-certification',
                  'lithium-storage-state-of-charge');
  SELECT max(published_at)::date INTO newest FROM articles WHERE status='published';
  RAISE NOTICE '[new-articles] % of 5 present; newest published_at is now %', n, newest;
END$$;
