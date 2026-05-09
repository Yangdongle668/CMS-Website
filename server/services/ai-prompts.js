// =====================================================================
// 5 个预设 Prompt 模板 — 锂电池 B2B (Zufek) 博客
// =====================================================================
// Each prompt produces a publication-ready HTML article body. The model
// is told to return *only* HTML (no markdown fences, no preamble) so the
// output drops straight into the Quill editor.
//
// Variables in templates use {{var}} syntax. The admin UI renders an
// input for each variable defined in `vars`; defaults make the workflow
// "click → generate" friendly when the operator just wants a sample.
// =====================================================================

const SYSTEM_PROMPT = `You are an expert technical writer for Zufek, a B2B
lithium-battery manufacturer (LiFePO4, NMC, coin cells, 18650, prismatic
modules, BMS). Write for procurement engineers, OEM design leads and
plant managers — readers who want concrete numbers, datasheet-grade
specifications and zero marketing fluff.

Style guide:
- Vary sentence length aggressively. Mix 6-word sentences with 30-word
  ones. Avoid uniform paragraph rhythm.
- Don't open with "In today's world…" / "In the rapidly evolving…" or any
  similar AI cliché. Start with a concrete fact, number, or scenario.
- Avoid em-dash overuse. Use commas, periods, parentheses instead.
- Drop transition crutches: "moreover", "furthermore", "in conclusion",
  "it is important to note". Just make the next point.
- Cite real-world numbers (cycle counts, energy density Wh/kg, charge
  C-rates, IEC standards). It's fine to use representative ranges.
- Use British / international engineering English. Keep "colour", "metre",
  "behaviour".

Output format (strict):
- Pure HTML body fragment. No <html>, <head>, <body>, no markdown fences.
- Use <h2>, <h3>, <p>, <ul><li>, <ol><li>, <table>, <blockquote>, <strong>.
- Add an <h2>FAQ</h2> at the end with 3-5 <details><summary>…</summary><p>…</p></details>
  blocks for People-Also-Ask SEO.
- Do not invent product SKU numbers. Use "Zufek LFP-280" / "Zufek NMC-21700"
  style placeholders only when the user supplies them.
`;

const PROMPTS = {
  // -----------------------------------------------------------------
  // 1. 深度技术解析 — 1800–2500 词，pillar/cluster 内容核心
  // -----------------------------------------------------------------
  technical_deepdive: {
    label: '深度技术解析',
    description: '1800–2500 词的技术长文，适合作为 pillar 集群的支柱内容。包含原理、参数对比、失效模式、选型建议、FAQ。',
    icon: '◇',
    vars: [
      { key: 'topic',         label: '主题',           placeholder: 'LiFePO4 vs NMC 在户外储能场景的循环寿命对比' },
      { key: 'audience',      label: '目标读者',        placeholder: '储能 EPC 工程师、采购总监' , default: '采购工程师与 OEM 设计负责人' },
      { key: 'focus_keyword', label: 'SEO 主关键词',   placeholder: 'LiFePO4 cycle life'  },
      { key: 'word_count',    label: '目标字数',        placeholder: '2000', default: '2000' },
    ],
    template: `Write a deep technical analysis article on this topic:

TOPIC: {{topic}}
TARGET READER: {{audience}}
FOCUS KEYWORD (must appear in <h1>, first paragraph, and at least two <h2>): {{focus_keyword}}
TARGET LENGTH: ~{{word_count}} words

Structure:
1. <h1> with the focus keyword.
2. Opening paragraph: a specific, concrete hook (a number, a real-world failure, a procurement decision). NOT "In recent years…".
3. <h2> "How it works" — the underlying chemistry / electrical model in plain engineering terms.
4. <h2> "Specifications that matter" — a <table> comparing 3-4 alternatives on the metrics a buyer actually checks (cycle count at 80% DoD, calendar life, energy density, cost per kWh, etc.).
5. <h2> "Failure modes & mitigation" — list how each option fails and what the BMS / pack design does about it.
6. <h2> "Selection checklist" — 6–8 bullet decision criteria a buyer can run through.
7. <h2> "FAQ" — 4 People-Also-Ask questions in <details>/<summary>.

Return only the HTML body fragment.`,
  },

  // -----------------------------------------------------------------
  // 2. 客户案例 — 问题 / 解决方案 / 结果，含可量化指标
  // -----------------------------------------------------------------
  case_study: {
    label: '客户案例 (Case Study)',
    description: '客户案例文章，问题 — 方案 — 结果三段式，自带量化数据表。适合 case-study 模板。',
    icon: '☆',
    vars: [
      { key: 'customer_industry', label: '客户行业',       placeholder: '欧洲医疗设备厂商', default: '欧洲医疗设备 OEM' },
      { key: 'product_used',      label: '采用的电池产品', placeholder: 'Zufek LFP-50 + 自研 BMS' },
      { key: 'pain_point',        label: '客户痛点',       placeholder: '原供应商交付期 14 周，温度漂移导致 BMS 误报警' },
      { key: 'metric_before',     label: '改造前关键指标', placeholder: '良率 92%, MTBF 9000h' },
      { key: 'metric_after',      label: '改造后关键指标', placeholder: '良率 99.1%, MTBF 22000h, 交付期 5 周' },
    ],
    template: `Write a B2B customer case study following the classic Problem–Solution–Result structure.

CLIENT INDUSTRY: {{customer_industry}}
PRODUCT DEPLOYED: {{product_used}}
CUSTOMER PAIN POINT: {{pain_point}}
KEY METRICS BEFORE: {{metric_before}}
KEY METRICS AFTER: {{metric_after}}

Structure:
1. <h1> headline that names the industry and the headline number from the "after" metrics.
2. <p class="lede"> 2-sentence opening that summarises the engagement.
3. <h2> "Background" — what the customer was building, who the stakeholders were, why they reached out.
4. <h2> "The challenge" — the pain point in technical detail. Include a <ul> of the specific failure modes / process gaps.
5. <h2> "Engagement" — the diagnostic + design steps Zufek's engineering team ran. Mention prototype quantities, qualification cycles, IEC/UN test standards as appropriate to the industry.
6. <h2> "Results" — a <table> with at least 4 rows comparing the before/after metrics. Add a closing paragraph quantifying customer impact (cost saved, time-to-market, field returns avoided).
7. <h2> "What this means for similar projects" — 4-5 transferable lessons in a <ul>.
8. <h2> "FAQ" — 3 procurement-style questions a similar buyer would ask.

Anonymise the client (use "the customer" / "the OEM"). Do not invent named individuals or quotes.
Return only the HTML body fragment.`,
  },

  // -----------------------------------------------------------------
  // 3. 对比评测 — A vs B 决策内容
  // -----------------------------------------------------------------
  comparison: {
    label: '对比评测 (A vs B)',
    description: '两种化学体系 / 两种产品 / 两种封装的对比评测，自带评分表和"该选谁"决策树。',
    icon: '⇄',
    vars: [
      { key: 'option_a',     label: '选项 A',         placeholder: 'LiFePO4 prismatic 280Ah' },
      { key: 'option_b',     label: '选项 B',         placeholder: 'NMC 21700 圆柱并联' },
      { key: 'use_case',     label: '使用场景',       placeholder: '光伏 + 户用储能 (10kWh)' },
      { key: 'focus_keyword',label: 'SEO 主关键词',  placeholder: 'LFP vs NMC home storage' },
    ],
    template: `Write a head-to-head comparison article.

OPTION A: {{option_a}}
OPTION B: {{option_b}}
USE CASE: {{use_case}}
FOCUS KEYWORD: {{focus_keyword}}

Structure:
1. <h1> using a "X vs Y for {use case}: …" pattern. Include the focus keyword.
2. <p> Opening that names the trade-off honestly in one sentence (e.g. "If you optimise for cycle life you lose energy density — here's how the numbers actually shake out.").
3. <h2> "Quick verdict" — 3-bullet TL;DR with the answer for the most common buyer profile.
4. <h2> "How they're built" — short side-by-side description of both options' construction.
5. <h2> "Spec-sheet face-off" — a <table> with at least 8 rows: nominal voltage, gravimetric energy density, volumetric energy density, cycle life @ 80% DoD, calendar life, charge C-rate, discharge C-rate, operating temperature window, thermal runaway onset, $/kWh.
6. <h2> "Where {{option_a}} wins" — 3-4 paragraphs.
7. <h2> "Where {{option_b}} wins" — 3-4 paragraphs.
8. <h2> "Decision tree" — an <ol> or <ul> of "if X, choose A; if Y, choose B" rules.
9. <h2> "FAQ" — 4 questions in <details>/<summary>.

Use realistic spec numbers, not made-up ones. Do not lie about cycle life — LFP at 80% DoD is typically 4000-6000 cycles, NMC 21700 is typically 1500-3000.
Return only the HTML body fragment.`,
  },

  // -----------------------------------------------------------------
  // 4. 行业应用指南 — 给特定垂直行业的选型 + 合规指南
  // -----------------------------------------------------------------
  application_guide: {
    label: '行业应用指南',
    description: '面向特定行业（医疗 / EV / AGV / 储能 / 国防）的选型与合规指南，含认证清单。',
    icon: '☸',
    vars: [
      { key: 'industry',    label: '行业 / 应用',  placeholder: '医疗便携式超声设备', default: '医疗设备' },
      { key: 'capacity',    label: '典型容量需求', placeholder: '20–80 Wh',       default: '20–100 Wh' },
      { key: 'cert_list',   label: '关键认证',     placeholder: 'IEC 62133-2, UN 38.3, IEC 60601-1', default: 'IEC 62133-2, UN 38.3' },
      { key: 'lifecycle',   label: '产品寿命',     placeholder: '5 年 / 800 次循环' },
    ],
    template: `Write a battery selection + compliance guide for engineers building products in this industry.

INDUSTRY: {{industry}}
TYPICAL ENERGY: {{capacity}}
KEY CERTIFICATIONS: {{cert_list}}
EXPECTED LIFECYCLE: {{lifecycle}}

Structure:
1. <h1> titled "{{industry}} battery selection guide: chemistry, certification & lifecycle" or similar.
2. <p> Opening with the 2-3 constraints that dominate this industry (e.g. medical = thermal safety + sterilisation cycles; EV = energy density + fast charge).
3. <h2> "Operating envelope" — a <table> of the application's likely temperature, vibration, humidity, ingress and shock requirements (cite IEC/MIL standards where relevant).
4. <h2> "Chemistry choice" — paragraphs covering LFP / NMC / coin / pouch and which fits this industry. Be opinionated.
5. <h2> "Certification roadmap" — an <ol> walking through {{cert_list}} in chronological order with rough lead time per stage.
6. <h2> "Pack architecture" — discuss BMS topology, fusing, balancing, communication bus (CAN / RS-485 / Modbus), enclosure.
7. <h2> "Lifecycle & SoH planning" — how to design for {{lifecycle}}, including DoD limits, calendar-aging compensation, end-of-life.
8. <h2> "Procurement red flags" — <ul> of warning signs when evaluating a supplier.
9. <h2> "FAQ" — 4 industry-specific questions.

Return only the HTML body fragment.`,
  },

  // -----------------------------------------------------------------
  // 5. 行业新闻解读 — 时事热点 + 公司视角
  // -----------------------------------------------------------------
  news_explainer: {
    label: '行业新闻解读',
    description: '针对一条行业新闻 / 政策 / 标准更新的解读文章，含"对中国出口商意味着什么"的视角。',
    icon: '◔',
    vars: [
      { key: 'news_headline', label: '新闻标题',      placeholder: '欧盟 2027 新电池法规要求 EV 电池碳足迹声明' },
      { key: 'news_date',     label: '新闻日期',      placeholder: '2026-04-22' },
      { key: 'angle',         label: '解读视角',     placeholder: '对中国出口型 LFP 厂商意味着什么', default: '对 OEM 采购方与 EV / ESS 供应商意味着什么' },
    ],
    template: `Write a news-explainer article for engineers and procurement leads.

NEWS HEADLINE: {{news_headline}}
DATE: {{news_date}}
ANALYSIS ANGLE: {{angle}}

Structure:
1. <h1> rewriting the news as a clear, plain-English statement.
2. <p> One-sentence "why you should care" lede.
3. <h2> "What changed" — the factual summary in 2-3 paragraphs. State what existed before, what's new, when it takes effect.
4. <h2> "Behind the policy" — the underlying technical / market driver.
5. <h2> "What this means for {{angle}}" — bulleted impacts on cost, lead time, qualification work, BOM, documentation.
6. <h2> "Action checklist" — an <ol> of 5-7 items a procurement / engineering team should execute in the next 90 days.
7. <h2> "Open questions" — what's still unclear, what guidance is pending.
8. <h2> "FAQ" — 3 questions.

Be neutral and analytical, not promotional. Do not pretend Zufek has already implemented something not announced.
Return only the HTML body fragment.`,
  },
};

function renderTemplate(promptKey, vars) {
  const def = PROMPTS[promptKey];
  if (!def) throw new Error(`unknown prompt: ${promptKey}`);
  let body = def.template;
  for (const v of def.vars) {
    const supplied = (vars && vars[v.key]) || v.default || '';
    body = body.split(`{{${v.key}}}`).join(String(supplied));
  }
  return body;
}

function listPrompts() {
  return Object.entries(PROMPTS).map(([key, def]) => ({
    key,
    label: def.label,
    description: def.description,
    icon: def.icon,
    vars: def.vars,
  }));
}

module.exports = { SYSTEM_PROMPT, PROMPTS, renderTemplate, listPrompts };
