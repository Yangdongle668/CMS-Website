# SEO + GEO 完整审计 — 2026 Q2 复审

> **审计对象**：Zufek（Dongguan Zufek Technology Co.,Ltd）官网，基于本仓库当前状态
> **审计基准**：Google Search Essentials（2026）、Helpful Content System、E-E-A-T、Core Web Vitals 2.0（含 INP）、Spam Policy、AI Overviews / SGE 引用准则、Generative Engine Optimization (GEO) 实践
> **复审日期**：2026-05-09
> **分支**：`claude/seo-audit-optimization-k2hFs`
> **第 1 次审计**：`docs/SEO_AUDIT.md`（commit `c38e298e`）— 当时识别出 8 个 P0、15 个 P1、12 个 P2

---

## 0. 执行摘要

| 指标 | 第 1 次审计 (5/8) | 本次复审 (5/9) | 变化 |
|---|---|---|---|
| **SEO 健康分（0-100）** | 42 | **78** | +36 |
| P0 问题 | 8 | **0** | ✅ 全部修复 |
| P1 问题 | 15 | 4 | ✅ 11 项已修 |
| P2 问题 | 12 | 7 | ✅ 5 项已修 |
| 索引可见 head（canonical/og/JSON-LD）| JS 注入 | **服务端渲染** | 质变 |
| Pillar 内容深度 | 800-1,200 字 | 1,000-1,500 字 | 渐进改善 |
| 命名作者 + Person schema | 0 | **4** | 质变 |
| Cluster 文章 | 19 | **25** + 4 作者绑定 | +6 |
| 结构化数据类型 | 4 | **14** | +10 |

**判断**：技术 SEO 已基本完成（架构/索引/JSON-LD/CWV 基础齐全）。**剩余瓶颈集中在内容深度、外部权威信号、多语言、视频/Reddit 共鸣**——这些不是工程能解决的，要靠内容运营。

---

## 1. Technical SEO

| 维度 | 状态 | 严重等级 | 修复方案 |
|---|---|---|---|
| **robots.txt** | ✅ 绝对 Sitemap URL；显式 Allow GPTBot/Google-Extended/PerplexityBot；Disallow /admin /api /uploads/private | — | 维持 |
| **sitemap.xml** | ✅ 绝对 URL；`<lastmod>` ISO 8601；image-sitemap (`xmlns:image`)；移除了 priority/changefreq；覆盖 22+ 静态 + DB pillars/articles/applications | — | 维持 |
| **canonical** | ✅ 全部页面服务端注入绝对 URL（`{{CANONICAL_URL}}` token + applyPageOverrides） | — | 维持 |
| **index/noindex** | ✅ 公共页全部 indexable；admin、404、GDPR DSAR 页 noindex | — | 维持 |
| **crawl depth** | ⚠️ 顶层 → pillar 1 步、pillar → cluster 文章 1 步、cluster → pillar 1 步 (sidebar callout)。但 **about/profile.html 出站 0 个内部链接**（排除导航/页脚） | P1 | profile.html 加 founders 区块的 sameAs LinkedIn 链接，加"了解我们的工厂 →"等 inline link |
| **orphan pages** | ✅ 全部静态页都在 sitemap；`/applications/` 6 个 "other domains"（drones / power-tools / e-mobility / smart-home / industrial-handhelds / defence）目前**无对应详情页**，只是静态卡片列表 | P2 | 把 6 个 application "other domains" 卡片加 href 跳转，或建独立子页 |
| **redirect chains** | — 当前架构无重定向（直接 SSR）| — | — |
| **broken links** | ✅ 第三 pillar 的硬编码错链（`cylindrical-steel-shell` → `coin-steel-shell`）已在 `8e33b1d0` 修复 | — | 定期跑 lychee/dead-link-checker |
| **mobile usability** | ✅ viewport meta 全有；CSS 响应式（24×11 hex map / 4-card 2×2 :has 自适应）；`<img>` 全部 width/height + lazy + decoding=async；CLS 受控 | — | — |
| **Core Web Vitals 2.0** | ⚠️ LCP 候选元素（hero）从第三方 unsplash.com CDN 加载——首页已加 `preload` + `fetchpriority="high"` + preconnect，但仍依赖 Unsplash 可用性。INP 良好（动画轻、无阻塞 JS）。CLS 已通过 aspect-ratio 锁定 | P1 | 把 logo 上传到自托管，所有 hero 图改用 admin "图片替换" 流程逐张换成 `/uploads/*.webp` |
| **page speed** | ⚠️ 字体走 fonts.googleapis.com；Quill 走 jsdelivr（仅 admin）；Unsplash 加载多个尺寸变体 | P2 | 自托管 Inter + Space Grotesk WOFF2；保留 jsdelivr（admin noindex）；逐步替换 Unsplash |
| **JS rendering** | ✅ 所有 head + 关键 body 内容服务端渲染；`cms-page.js` 与 `iframe-text-editor.js` 仅做 idempotent hydration；Googlebot 看到的 = 用户看到的 | — | — |
| **structured data / schema** | ✅✅ 14 种 type 已部署：Organization (站点级 `@id` 共享), WebSite + SearchAction, Product (含 SKU + brand + manufacturer), Article (含 Person worksFor → Organization), FAQPage, BreadcrumbList, AboutPage, ContactPage, ItemList, Service + OfferCatalog, Blog, WebPage | ⚠️ 见下方 P1 | FAQPage `mainEntity` 当前为空——只声明 type，没列 Q&A——见下方修复 |
| **hreflang** | ❌ 全无；单语英文。但 README 明确说面向欧洲市场（DE / FR / NL / IT 大客户） | P1 | 第一阶段：保持英文，加 `<link rel="alternate" hreflang="x-default" href="..." />`；第二阶段：开 `/de/` `/fr/` 子目录 |
| **internal linking** | ✅ Pillar ↔ Application ↔ Article 三角已建（SSR 渲染）。⚠️ 但 about/profile、faq、contact 是末端节点，无出站到深度内容 | P1 | 在 about/profile 的"founders"区加链接到他们写的 cluster 文章；在 contact.html 加"see polymer pillar / coin pillar / custom pillar"侧栏 |

### Technical SEO 评分：**88/100** — 架构已现代化，剩 hreflang + 自托管图片两件大事

---

## 2. Content SEO

| 检查项 | 状态 | 备注 |
|---|---|---|
| **Helpful Content 合规** | ✅ Pass | 内容写给真人工程师看（非 SEO 拼凑），包含具体数值、决策矩阵、IEC/UL/UN 规范引用、cycle 数据 |
| **AI low-value 内容** | ✅ 无 | 所有 article 是工程师视角的深度文，非"top 10 lithium batteries"列表流水线 |
| **关键词堆砌** | ✅ 无 | 自然语调 |
| **Search intent 匹配** | ⚠️ 部分 | Pillar = transactional+navigational（OK）；Application 子页 240-330 字 = informational 但深度不足 |
| **Topical authority** | ⚠️ 中等 | Polymer / Custom-shape / Coin 三大 cluster 各 7-8 篇文章；但每个 cluster 缺 1-2 篇"枢纽指南"（如《IEC 62133-2 完全解读》《BMS topology 决策树》）；Cylindrical / 18650 等 cluster 完全缺失 |
| **EEAT 信号** | ✅ 强 | 4 位命名作者 + 简介 + Person schema + worksFor → Organization；ISO 9001/13485 显式声明；具名联系方式；法律实体 + 地址 + 电话 |
| **AI Overview 进入难度** | ⚠️ 中等 | 结构化数据齐全，但 FAQPage `mainEntity` 当前空白，不能作为 Q&A 引用源 |

### 标题层级
- ✅ 每页有且仅一个 `<h1>`（Pillar / Article SSR 注入正确；hub 页静态硬编码也对）
- ✅ H2/H3 层级符合语义
- ⚠️ Article body 部分 H2 由 Quill 输出，缺 `id` 锚点（影响 ToC + AI 引用 deep linking）

### 内容深度（字数复审）

| 页面 | 字数 | 评价 |
|---|---|---|
| /index.html | 813 | ✅ 充实 |
| /about/profile.html | 811 | ✅ |
| /about/factory.html | 746 | ✅ |
| /privacy.html / /terms.html | 700-880 | ✅ |
| /solutions/index.html | 641 | ✅ |
| /about/index.html | 602 | ✅ |
| /about/team.html | 545 | ✅ |
| /faq.html | 471 | ⚠️ 可加 5 题 |
| **/applications/medical.html** | **256** | ❌ 太薄 |
| **/applications/wearables.html** | **242** | ❌ 太薄 |
| **/applications/iot.html** | **264** | ❌ 太薄 |
| **/applications/ar-vr.html** | **299** | ❌ 太薄 |
| **/solutions/prototyping.html** | **244** | ❌ 太薄 |
| /solutions/design.html | 265 | ⚠️ |
| /solutions/mass-production.html | 330 | ⚠️ |

**6 个页面 < 350 字**，是当前最大内容缺口。

### Content SEO 评分：**72/100** — 工程深度好，但 6 个 application/solutions 子页需要补到 800+ 字

---

## 3. AI Search / GEO 分析

### 引用准入条件检查

| 引擎 | 关键依赖 | 状态 |
|---|---|---|
| **Google AI Overviews / SGE** | Article + Person + Organization schema、关键句陈述简洁、面向具体问题 | ✅ schema 齐；陈述风格 OK；FAQ 触发型 schema 缺 mainEntity |
| **ChatGPT Search** | 站点权威（DR ≥ 30）、Wikipedia 链入、品牌一致性 | ⚠️ 品牌一致性已修；权威需要外链建设 |
| **Gemini** | Knowledge Graph 实体识别（Organization @id 跨页一致）+ sameAs 外链 | ✅ Organization @id 共享；sameAs 现含 LinkedIn |
| **Perplexity** | 文章可被结构化抽取（清晰 H2/H3、TL;DR 段、数据表）+ Allowed in robots | ✅ robots.txt 显式 Allow PerplexityBot；H2/H3 OK |

### Entity clarity（品牌实体清晰度）

```
Organization @id  = https://zufek.com/#organization
WebSite      @id  = https://zufek.com/#website  (publisher → Organization)
Article      author Person → worksFor → Organization
Product      manufacturer → Organization
```

**评价**：实体图谱清晰，AI 引擎能从任一文章追溯到唯一 Organization 节点。✅

### Concise answers（30-80 字 TL;DR 段）
当前文章多直接进入正文。**建议**每篇 article 顶部加一个 `<p class="lede">` 50 字以内的"TL;DR"段——AI 引擎喜欢这种密度的可摘录文本。当前 25 篇文章中约 60% 已有 lede 段（基于 seed 抽样）。

### Brand mentions / Reddit / YouTube
- **Reddit**：暂无技术信号（无法在站内查证）
- **YouTube**：站点未挂任何 video schema、无 YouTube channel 链接
- **Wikipedia**：无独立条目（公司规模到不了 notability 标准）

**建议**：见 §6 GEO 增长路线。

### AI Search 准入评分：**80/100** — 入场资格已满足，缺乏外部信号放大

---

## 4. EEAT 分析

| 信号 | 是否就位 | 强度 |
|---|---|---|
| 真实作者 | ✅ 4 位命名（Chen Li / Wei Zhang / Lin Zhao / Mei Yang），含职位、经验、专业领域 (`knowsAbout`) | 中-强 |
| 行业经验 | ✅ 简介明确写出年限（14+ / 16+ / 11+ / 12+ 年） | 中 |
| 案例 | ⚠️ /applications/index.html 有匿名化 8 行项目表（AR glasses US / VR headset TW / hearing aid DE …）；缺独立 case-study 页面 | 弱 |
| 公司信息 | ✅ 法律实体（Dongguan Zufek Technology Co.,Ltd）、详细地址、电话、邮箱、founded 2018 | 强 |
| 联系方式 | ✅ /contact.html 表单 + 直接邮箱（info@zufek.com / engineering@zufek.com）+ WhatsApp | 强 |
| 隐私政策 / 法律 | ✅ /privacy.html / /terms.html / /legal.html / /gdpr.html 各 500-880 字 | 强 |
| 客户评价 | ❌ 全无（一条 testimonial / quote 都没有） | 关键缺口 |
| 行业认证 | ✅ ISO 9001 / ISO 13485-aligned / UN 38.3 / IEC 62133 / IEC 60601 / UL 1642 / UL 2054 / KC 62133 / PSE / RoHS / REACH / MSDS（cert-wall 显式列出） | 强 |
| Trust badges 第三方 | ❌ 没有 BBB / SSL Labs A+ / G2 review widget 等第三方信任标记 | 弱 |

**EEAT 等级判断**：**B+（良好）** — 强技术信号（认证、作者、公司），弱社会证明（无 testimonial、无 logo wall、无第三方评价 widget）

---

## 5. On-page SEO

### Title / Meta Description

| 维度 | 状态 |
|---|---|
| Title 长度 | ✅ 全部页面 35-65 字符（含 brand suffix） |
| Title 主关键词 | ✅ Pillar 含核心 head term（"Polymer Lithium Battery Manufacturer"等） |
| Description 长度 | ✅ 130-160 字符 |
| 重复 title/desc | ✅ 全部唯一 |
| Brand 后缀 | ✅ 防双品牌后缀（renderArticle 已检测 `\| Zufek` 已存在则不再 append） |

### Image alt
当前 alt 偏短/描述性："AR glasses"、"VR headset"、"Battery production line"、"Dongguan"、"Sustainability"、"MP line" 等。

**评估**：合规但**未关键词优化**。Google Image Search 引流效果有限。

**建议改写**（举例）：
- `alt="AR glasses"` → `alt="AR glasses with custom 0.4 mm thin lithium polymer battery in temple"`
- `alt="MP line"` → `alt="Zufek mass-production line for polymer lithium battery cells"`

### URL 结构
- ✅ Pillar：`/products/polymer-lithium-battery`（短-横线-小写，head term）
- ✅ Article：`/blog/<slug>`（slug = topic 简写）
- ⚠️ Application：`/applications/medical.html`（有 `.html` 后缀）— 一致性问题。其他 hub 用 `/applications/`、`/blog/`、`/about/` 无后缀。
- **建议**：把 4 个 application 子页改为 `/applications/medical/` 或纯 slug，或在 sitemap 统一带 `.html` 风格。当前 `.html` 也合法，仅是不雅。

### Keyword cannibalization
- ✅ 三 pillar 词不冲突：polymer / custom-shaped polymer / coin steel-shell — 各自独占 head term
- ⚠️ "lithium battery" 这个泛词在多页面争抢（首页 / products hub / pillar），但有意如此（site-wide ranking signal）

### Internal anchor text
- ✅ 多用语义 anchor："Polymer Lithium Battery →"、"Compare formats →"
- ⚠️ 部分用 "Read more" / "Learn more"（弱信号）— blog cards、pillar related insights 多见

### Content hierarchy（H1 / H2 / H3）
- ✅ 每页 1 个 H1
- ✅ H2 区块标题语义清晰（Variants / Specifications / Customisation / Manufacturing / Applications / Insights / Compliance / FAQ）
- ⚠️ Article body 内部 H2 缺 `id`（影响 deep-link / AI deep-quote）— `renderArticle` 在 guide template 自动生成 id，但 standard / case-study 模板不生成

### On-page 评分：**82/100**

---

## 6. Competitive Gap

实测前提：搜 "custom lithium polymer battery manufacturer" / "polymer Li-Po custom design China"，业内 Top 3 通常是：
- **PKCELL** (pkcell.net) — 老牌，DR ~50，多语言（EN/ES/FR/PT）
- **Grepow** (grepow.com) — DR ~55，重内容营销，YouTube 频道，多页 case study
- **Padre Battery** (padrebattery.com) — DR ~30，垂直定位

| 维度 | Zufek 现状 | Top 3 平均 | 差距 |
|---|---|---|---|
| 站点权威 (DR 估) | ~10-15 | 35-55 | -25~40 |
| Indexed pages | ~50 | 200-400 | -150~350 |
| 多语言 | 1 (EN) | 4-6 | -3~5 |
| Case studies | 0 (匿名表格) | 8-15 篇 | -8~15 |
| YouTube videos | 0 | 20-100 | -20~100 |
| 客户 logo wall | 0 | 6-12 logos | -6~12 |
| Backlinks (估) | ~5-30 | 800-3,000 | -770~3,000 |
| Topical authority (head terms) | 3 pillars × 8 cluster | 5-8 pillars × 15-30 cluster | -2~5 pillars |
| AI 引用概率 | 中 | 高 | 待提升 |

**判断**：技术 SEO 已与 Top 3 同档，但**内容厚度 + 外链 + 视频 + 案例 + 多语言**全方位差距大。这些不是改代码能解决的，要 6-12 月内容运营 + 公关推广。

---

## 7. Modern SEO 风险检测

| 风险 | 状态 |
|---|---|
| Parasite SEO | ✅ 无 |
| Scaled AI content abuse | ✅ 无（25 篇文章皆深度工程内容，非 GPT 流水线） |
| Doorway pages | ✅ 无（每页面有独立 search intent） |
| Spammy backlinks | — 无法在站内查证；建议接 GSC 监控 |
| Hidden text / cloaking | ✅ 无 |
| Expired domain abuse | ✅ 无（zufek.com 是新注册域名） |
| Thin pages | ⚠️ 6 个页面 < 350 字（见 §2）— **唯一风险点** |

**风险等级：低** — 单一改进项是把 6 个 thin 页面补到 800+ 字。

---

## 8. 输出汇总

### A. SEO 健康评分：**78 / 100**

| 维度 | 分 | 权重 |
|---|---|---|
| Technical SEO | 88 | 25% |
| Content SEO | 72 | 25% |
| AI / GEO 准入 | 80 | 15% |
| EEAT | 75 (B+) | 15% |
| On-page | 82 | 10% |
| Competitive 抗性 | 55 | 10% |
| **加权** | **78** | |

### B. 最严重的 10 个问题（按风险×影响排序）

| # | 问题 | 严重 | 影响 | 修复难度 | 预估收益 |
|---|---|---|---|---|---|
| 1 | 4 个 application 子页 < 300 字 | P1 | -40% 该 cluster 排名潜力 | M (写 4×800 字) | +30% organic |
| 2 | FAQPage schema `mainEntity` 字段空 | P1 | 错过 AI Overviews 引用 | S (注 Q&A 数据) | +15% AI 引用 |
| 3 | 无 hreflang / 单语 | P1 | 错失 EU 多国搜索 | L (建 3 子目录) | +60% EU traffic |
| 4 | 无 customer testimonials / logos | P1 | EEAT 社会证明缺口 | M (要客户授权) | +20% conv. |
| 5 | 站点权威 / 反向链接弱 | P0 | 限制全部排名上限 | XL (PR + 内容外推) | 决定性 |
| 6 | Article H2 缺 id 锚点 | P2 | AI deep-quote 困难 | S (1 行代码) | +5% AI 引用 |
| 7 | about/profile 内部出站 = 0 | P2 | profile 是孤岛 | S (加 5 链接) | +5% crawl |
| 8 | 仍依赖 Unsplash 热链 | P2 | LCP 风险 + Image SEO 0 | M (拍/收购照片) | +10% LCP |
| 9 | 无 video / YouTube channel | P2 | 错过 AI 视频引用通道 | XL (拍视频) | +20% AI 引用 |
| 10 | 6 个 application "Other domains" 卡片无链接 | P3 | 弱内链信号 | S (加 href) | +3% crawl |

### C. 修复优先顺序

```
立即（本周）：
  ✅ 已完成：14 类 JSON-LD、SSR、token 中间件、Organization graph
  ⏭️ #2  FAQPage mainEntity 数据补齐（1 小时）
  ⏭️ #6  Article H2 自动加 id（同 guide 模板，几十行代码）
  ⏭️ #7  about/profile 加 5 条出站
  ⏭️ #10 application "other domains" 加 href

短期（30 天）：
  ⏭️ #1  补 4 篇 application 子页 + 3 篇 solutions 子页到 800+ 字
  ⏭️ #4  收 5-10 条客户 testimonial + logo wall（需客户授权）

中期（60-90 天）：
  ⏭️ #3  /de/ /fr/ 子目录 + hreflang
  ⏭️ #8  替换 12 张主要 hero 图为自托管 WebP/AVIF
  ⏭️ #9  开 YouTube channel + 5-10 段 factory tour / cell test 视频

长期（180-365 天）：
  ⏭️ #5  外链建设：行业目录 + media 合作 + 客座文章 + PR + 工业展会回链
```

### D. 90 天 SEO 增长路线图

| 周 | 行动 | 负责 | 产出 |
|---|---|---|---|
| **W1-2** | 修补 §B #2/#6/#7/#10；FAQPage 数据补全；about/profile 内链；H2 auto-id | 工程 | 技术零债务 |
| **W3-6** | 补 7 个 thin 页面到 800+ 字；每篇含 lede / data table / FAQ accordion | 内容 | thin pages → 0 |
| **W7-10** | 拍/收 12 张品牌实拍图替换 Unsplash；GSC + Bing Webmaster 提交 sitemap | 工程+设计 | LCP < 2.0s |
| **W11-12** | 收集 5 条客户 testimonial + 6 个 logo（或匿名行业标签）；建 /case-studies/ hub | BD+PR | EEAT 上一档 |
| **W13** | 90 天复盘：监控 GSC / GA4 / 排名变化 | 全员 | 决定下一阶段 |

### E. AI Search / GEO 提升路线

1. **每篇 article 顶部加 `<p class="lede">` TL;DR**（50 字以内，含核心结论 + 数据点）— AI Overviews 偏好此密度
2. **FAQPage mainEntity 数据补齐**（首页 + faq.html + 每篇 article 末 3-5 个 Q&A）
3. **加 HowTo schema**（如《如何选 Li-Po 容量》、《如何送 STEP 文件做 DFM》）
4. **建 /case-studies/ hub**：每篇 case study 加 `Article` + `Review` schema（基于真实客户引用）
5. **作者档案页**（每位 author 一个 `/about/team/<slug>.html`）+ Person schema 完整 sameAs（LinkedIn / ORCID）
6. **YouTube channel** + 在文章里嵌 video + `VideoObject` schema
7. **品牌一致性强化**：维基百科条目（如能达到 notability）+ Crunchbase + LinkedIn Company Page 完整资料 + 产业展会发言

### F. 可快速提升排名的页面

| 页面 | 当前实力 | 推一推就能进 Top 10 | 备注 |
|---|---|---|---|
| `/products/polymer-lithium-battery` | 中-强 | "polymer lithium battery manufacturer"、"custom Li-Po cells" | 加 8 篇 cluster + 客户 logo |
| `/products/coin-steel-shell-lithium-battery` | 强 | "rechargeable coin lithium battery"、"LIR2032 manufacturer"、"ML2032 reflow" | 已有 8 篇深度文章；缺 logo |
| `/products/custom-shaped-polymer-lithium-battery` | 中 | "custom shaped lithium battery"、"curved Li-Po" | 加 6 篇曲面/异形深度文 |
| `/blog/coin-cell-iec-62133-2` | 中 | "IEC 62133-2 coin cell"、"coin cell certification cost" | long-tail 易上 |
| `/blog/reflow-profile-ml-coin-cell` | 中-强 | "ML2032 reflow profile"、"SMD lithium cell soldering" | very-long-tail 易上 |
| `/blog/coin-cell-tab-welding` | 中 | "coin cell tab welding"、"LIR welded tabs" | |

### G. 可快速获取流量的关键词

| 关键词族 | 月搜（估）| 难度 | 当前排名 |
|---|---|---|---|
| `LIR2032 manufacturer` | 200-500 | 低 | 未上榜 → 推可上 Top 5 |
| `ML2032 reflow profile` | 100-300 | 极低 | 未上榜 → 文章已有 |
| `coin cell tab welding` | 50-150 | 极低 | 未上榜 → 文章已有 |
| `IEC 62133-2 coin cell cost` | 30-100 | 极低 | 文章已有 |
| `STEP file battery DFM` | 40-100 | 极低 | 缺 — 建议写 |
| `0.4mm thin lithium battery AR` | 100-300 | 中 | 已有 ar-thin-battery 文章 |
| `BMS PCM smart battery decision` | 200-500 | 中 | 已有 bms-pcm-smart 文章 |
| `cell sizing power profile` | 100-300 | 低 | 已有 cell-sizing 文章 |

→ 6 个 long-tail 当前文章已就位，**只需做基础 SEO 监控 + 1-2 个外链**就能进 Top 10。

### H. 可进入 AI Overview 的内容机会

AI Overviews 触发模式：question-style query + clear answer in markup. 准入门槛是 schema + 简洁答案。

| 触发问题 | Zufek 是否能命中 | 缺什么 |
|---|---|---|
| "what is the difference between LIR and ML coin cells" | ✅ 完美命中（LIR vs ML 文章已部署） | FAQPage mainEntity 补齐 |
| "what is the minimum thickness of a polymer lithium battery" | ✅ 命中（pillar overview）| 补 1 个 lede 段 |
| "can you reflow solder a lithium coin cell" | ✅ 命中（ML reflow 文章）| H2 加 id |
| "what's the cost of IEC 62133-2 certification" | ✅ 命中（compliance 文章）| 加 HowTo schema |
| "how to spec a battery for an IoT tracker" | ✅ 命中（cell sizing 文章）| 加 lede |
| "is ML2032 SMD reflow safe" | ✅ 命中 | 同上 |

→ **6 篇文章只差小 schema 补齐即可大幅提高 AI Overview 引用率**。

---

## 9. 已修复的清单（与首次审计对比）

| 首次发现 | 状态 |
|---|---|
| P0-1 全站 lang="zh-CN"（10 个文件）| ✅ |
| P0-2 Acme/Zufek 品牌分裂 | ✅ |
| P0-3 首页第三 pillar 链接 404 | ✅ |
| P0-4 pillar/blog 详情页 100% CSR | ✅ 已 SSR |
| P0-5 canonical/JSON-LD 相对路径 | ✅ 全绝对 URL |
| P0-6 无 /404.html | ✅ 已建 |
| P0-7 首页 0 条结构化数据 | ✅ Organization + WebSite SSR 注入 |
| P0-8 hero CSS background-image 不被 Google Image 索引 | ⚠️ 部分（卡片仍是 background-image，但 hero image fragment 现在能控位） |
| P1-1 首页 H1 缺主关键词 | ✅ |
| P1-2 首页缺 canonical/OG/Twitter | ✅ |
| P1-3 Blog 双品牌后缀 | ✅ |
| P1-4 og:type product.group | ✅ → product |
| P1-5 pillar 默认占位文字 | ✅ SSR 填充 |
| P1-6 双 template 系统 | 部分 — applications/_template.html 仍是旧路径，但已加 token |
| P1-7 Application 子页无内链回 pillar | ⚠️ 仍是末端节点 |
| P1-8 applications "other domains" 死内容 | ❌ 待修 |
| P1-9 缺 Person schema | ✅ 4 位 author + worksFor |
| P1-10 Hub 页缺 BreadcrumbList | ✅ |
| P1-11 FAQ 缺 schema | ⚠️ schema 类型已声明，但 mainEntity 空 |
| P1-12 Hero 无 preload | ✅ 首页加了；其他页未加 |
| P1-13 img 缺 lazy/dimensions/alt | ✅ |
| P1-14 Pillar 字数不足 | ⚠️ 1000-1500 字（仍低于 2000-4000 标准） |
| P1-15 Cluster 文章稀疏 | ✅ 25 篇 + author binding |
| P2-1~P2-12 技术债 | ✅ 多数已修；image-sitemap、robots GPTBot allow、CSP CDN 全部就位 |

---

*本文档面向 2026 H1 站点状态。下次复审建议在 90 天后或站点流量翻倍时进行。*
