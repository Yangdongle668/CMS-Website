# SEO 完整审计报告 — Battery CMS

> 审计对象：本仓库 `public/` 目录下的全部静态站点 + `server/routes/seo.js` 自动生成的 `robots.txt` / `sitemap.xml`，以及通过 `_template.html` 客户端渲染的 pillar / blog 详情页。
> 参考标准：Google Search Central 官方文档（SEO Starter Guide、JavaScript SEO、Structured Data、Core Web Vitals、International SEO、Image SEO、Sitemaps、E-E-A-T 指南）以及 2026 年 Google AI Overviews / Helpful Content 指引。
> 审计日期：2026-05-08。
> 审计分支：`claude/seo-audit-optimization-k2hFs`。

---

## 修复进度（截至 2026-05-09）

| Sprint | 内容 | 状态 |
|---|---|---|
| Step 1 | 品牌统一为 Zufek（含法律实体 Dongguan Zufek Technology Co.,Ltd）；10 个公共页面 lang 改回 en；首页第 3 个 pillar 链接修正 (`coin-steel-shell-lithium-battery`)；seed 设置默认值用 Zufek | ✅ 完成 (`8e33b1d0`) |
| Step 2 | HTML token 中间件 (`server/middleware/html-tokens.js`)；新增 `seo` / `organization` settings keys；后台新增 SEO + Organization tab；partials.js 注入 Organization + WebSite JSON-LD；GA4 (consent-gated) + GSC/Bing 验证 meta 自动注入 | ✅ 完成 (`1454543e`) |
| Step 3 | 22 个静态页面统一注入 canonical + OG + Twitter card + theme-color；homepage `<h1>` 加入 head term；OG 默认图改为 `/logo.png` | ✅ 完成 (`b3cb693d`) |
| Step 4 | `/public/404.html` 真实页面（品牌 head + 6 个入口 + 最近 6 篇文章）；server 404 handler 走 token 中间件返回正确 404 状态码 | ✅ 完成 (`07026c97`) |
| Step 5 | sitemap.xml：绝对 URL、移除 priority/changefreq、加 ISO 8601 lastmod、加 image-sitemap、补全 22 条静态 baseline；robots.txt 加绝对 Sitemap、显式 Allow GPTBot/Google-Extended/PerplexityBot | ✅ 完成 (`07026c97`) |
| Step 6 | `server/middleware/ssr-detail.js` 新模块：pillar/blog/applications 详情页服务端从 DB 读取后注入 title / description / canonical / OG / Twitter / JSON-LD（Product/Article/WebPage + BreadcrumbList + FAQPage）。客户端 JS 不再覆盖 head；只 hydrate body | ✅ 完成 (`07026c97`) |
| Step 7 | 全部 `<img>` 加 `loading=lazy` `decoding=async` `width=1000` `height=667` `alt`；hero CDN preconnect；首页 hero `<link rel=preload>` + `fetchpriority=high` | ✅ 完成 (`008656f9`) |
| Step 8 | 新增 `authors` 表 + `articles.author_id` 外键；`/api/authors` CRUD；admin 作者档案页 (`/admin/authors.html`) 完整 UI（slug/avatar/bio/knowsAbout/sameAs/active）；admin 文章编辑页加 author 下拉；SSR Article schema 用 Person (`worksFor` 指向 Organization)；hub 页全部加 BreadcrumbList + ItemList/Service/AboutPage/ContactPage/FAQPage/Blog schema；OG 默认 SVG brand 文字改为 Zufek + Coin Steel-Shell；admin sidebar brand "Zufek CMS" | ✅ 完成 (`72acae77`) |
| Step 10 | seed 4 个具名作者（Chen Li 化学 / Wei Zhang 机械-异形 / Lin Zhao 钮扣电池 / Mei Yang 质量合规）；UPDATE 把 19 篇现有文章绑定到对应 pillar + author；为 Coin Steel-Shell pillar 新增 6 篇深度技术文章（reflow profile、tab welding、hearing aid、RTC backup、low-temp behaviour、IEC 62133-2 cost reality） | ✅ 完成 (`1af54083`) |
| Step 11 | `media_overrides` settings + `/api/media/overrides` 路由（GET 扫描所有公共 HTML 里的外部图片 URL，PUT 保存映射）；HTML token 中间件应用映射做透明替换；admin "图片替换" 页面（`/admin/media-overrides.html`）：自动列出 38 个外部图片 URL、引用次数、引用页面，提供对每张图的 `/uploads/` 替换输入；保存即时生效无需重启 | ✅ 完成（本次） |

### 通过 grep / curl 验证

- 0 个 `Acme` 引用残留（`grep -rE "\\bAcme\\b" public admin server` → 空）
- 0 个 `lang="zh-CN"` 在 public 页面
- 0 个 public 页面缺 canonical
- 26 个 HTML 包含 `{{CANONICAL` 占位符（中间件解析）
- 9 个 hub/static 页面带原生 JSON-LD（中间件渲染时 token 替换）
- robots.txt 输出绝对 Sitemap URL，含 GPTBot/Google-Extended/PerplexityBot 段
- sitemap.xml `xmlns:image` 已加，`<priority>` `<changefreq>` 全部移除
- 烟囱测试 `curl /` → canonical=`https://zufek.com/`、og:image=`https://zufek.com/logo.png`、og:site_name=Zufek（皆从 PUBLIC_URL/SITE_NAME env 解析）
- 烟囱测试 `curl /this-does-not-exist` → 真正的 404 状态 + 品牌 404 页（含 canonical/title/JSON-LD）
- 烟囱测试 `curl /about/` → 输出 AboutPage + BreadcrumbList JSON-LD

### 后台同步对应（"前后端字段都对得上"）

| 前端可见 | 后台编辑入口 | 数据流 |
|---|---|---|
| header / footer 品牌名、地址、电话、社媒 | 设置 → 站点 / 社交 | `settings.site` / `settings.social` 走 `/api/settings/public` → `partials.js` 注入 |
| Organization JSON-LD（每页头部） | 设置 → Organization 结构化数据 | `settings.organization` (legal_name/sameAs/address/contactPoints) → `partials.js.injectOrganizationSchema` |
| canonical / OG image / Twitter handle / GA4 / GSC / Bing | 设置 → SEO | `settings.seo` (`public_url` / `default_meta_image` 等) → `html-tokens` 中间件 + `/api/public/config` |
| 文章作者 + Person schema | 内容 → 作者档案 / 内容 → 博客文章（作者下拉） | `authors` 表 ↔ `articles.author_id` ↔ `ssr-detail.renderArticle` 渲染的 Person node |
| Pillar 全字段（title/desc/variants/spec/FAQ） | 内容 → 支柱页 | `pillar_pages` ↔ `ssr-detail.renderPillar` |
| Application 内容 + 关联 pillar | 内容 → 应用行业 | `applications` ↔ `ssr-detail.renderApplication` |
| Blog 文章模板（standard/guide/case-study）+ pillar 关联 | 内容 → 博客文章 | `articles` ↔ SSR + Article schema |
| Pages（首页 sections、自定义页面） | 内容 → 页面 | `pages` 表 ↔ sitemap 自动包含 |
| 询盘 / 邮件 / GDPR | 设置 → 邮件 / GDPR; 收件箱 / GDPR 请求 | 已有功能不变，brand 引用统一为 Zufek |
| 把任意 Unsplash 占位图替换为自托管照片（无需改代码） | 内容 → 图片替换 (`/admin/media-overrides.html`) | `settings.media_overrides` JSON 映射 ↔ `html-tokens` 中间件 string-replace ↔ scanExternalImages 自动列出 38 个待替换 URL |
| 文章作者头像（avatar_url） | 内容 → 作者档案 → 编辑某作者 | 上传到媒体库，复制 `/uploads/...` 粘贴到 author.avatar_url；SSR Person schema 自动取用 |

---

## 0. 摘要（TL;DR）

整体架构合理（pillar + cluster 模型已在 DB 模式中表达），但**实现层有 8 个 P0 级缺陷直接导致索引失败或品牌混乱**：

1. 全部 25 个 HTML 页面用 `<html lang="zh-CN">` 但内容是英文；
2. 品牌名分裂为 "Acme Battery" 与 "Zufek" 两套，连法律实体名都不一致；
3. 首页第 3 个 pillar 卡片硬编码链接到 `/products/cylindrical-steel-shell-lithium-battery`，但 DB 里的 pillar 实际是 `coin-steel-shell-lithium-battery` —— **首页存在硬编码 404**；
4. Pillar 详情页与 Blog 文章详情页 100% 客户端渲染（`<title>`、`<meta description>`、`<link rel="canonical">`、`og:*`、JSON-LD 全部空白发送，等待 JS 注入）；
5. 所有 canonical 与 JSON-LD 内的 URL 都是相对路径，违反 Google 2025-12 更新后的 JS-SEO 规范；
6. 整站缺失 `404.html`，404 路由实际返回纯文本 "Not found"，pillar 与 blog 模板在拿不到数据时 JS 跳转到不存在的 `/404.html` → 软 404；
7. 首页缺 `Organization` schema、`Product` schema、`FAQPage` schema —— 2026 B2B 站点最高杠杆的三种结构化数据全部缺席；
8. 全部 hero、application 卡片、文章封面用 `background-image` 加载 Unsplash 热链图片，而非 `<img>` —— Google Image 不索引 CSS 背景图；同时 LCP / CLS / 第三方 DNS 风险三连击。

> 修复 P0 后预计 1-3 个月内可见自然流量增量；P1 项支撑长期话题权威与 AI Overviews 引用率。

---

## 1. 网站现状速览

| 维度 | 现状 |
|---|---|
| 渲染模式 | 静态 HTML（多数页面） + 客户端渲染（`/products/<slug>`、`/blog/<slug>`、`/applications/<slug>` 模板） |
| 框架 | 原生 HTML/CSS/JS，Express 静态托管 |
| 路由 | 美化 URL（`/products/<slug>`、`/blog/<slug>`），fallback 到 `_template.html` |
| 站点地图 | `/sitemap.xml`（DB-driven）+ `/robots.txt`（自动生成） |
| 国际化 | 无 hreflang，单语英文，但 `lang="zh-CN"` 错配 |
| 分析 | 未集成 GA4 / GSC（README/HTML 都未发现脚本） |
| HTTPS | 通过 `FORCE_HTTPS=true` 控制 HSTS（默认关闭） |
| CSP | `'unsafe-inline'` 脚本 / 样式（不影响 SEO，但与 EE-A-T 安全信号相关） |

---

## 2. 不足的点（缺陷清单）

### 2.1 P0 —— 立即影响索引或品牌信任

| # | 问题 | 文件 / 位置 | 影响 |
|---|---|---|---|
| P0-1 | `<html lang="zh-CN">` 用在英文内容上 | 共 10 个文件：`index.html`、`blog/index.html`、`blog/_template.html`、`products/index.html`、`products/_template.html`、`applications/index.html`、`solutions/index.html`、`about/index.html`、`about/profile.html`、`about/factory.html` | 误导辅助技术、Google 翻译、社交分享与 AI 解析；与 Google [国际化文档](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)对齐失败 |
| P0-2 | 品牌名 / 法律实体不一致（Acme vs Zufek） | `partials.js:14`、`about/profile.html:56`（"Acme Battery Co., Ltd."） vs `privacy.html`、`terms.html`、`legal.html`、`contact.html`、`faq.html`、`about/team.html`（全部 "Dongguan Zufek Technology Co., Ltd."） | E-E-A-T "Trustworthiness" 直接受损；Knowledge Panel / Organization schema 无法消歧 |
| P0-3 | 首页第 3 个 pillar 卡片是硬编码 404 | `index.html:87` `href="/products/cylindrical-steel-shell-lithium-battery"`，但 `seed.sql` 仅有 `coin-steel-shell-lithium-battery` | 首页向第三大 pillar 的内链流向 0；爬虫看到 200 模板但内容由 JS 跳走 → 软 404 |
| P0-4 | Pillar 与 Blog 详情页 100% CSR | `products/_template.html`（行 6-13、194-214）；`blog/_template.html`（行 6-13、203-233）。`<title data-meta-title>` 占位符为字面量 "Pillar Lithium Battery"，`<meta description content="">` 空，`<link rel="canonical" href="">` 空 | Google 2025-12 [JS SEO 更新](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)明确："The best way to set the canonical URL is to use HTML"。当前实现遇到 JS 失败/网络抖动会被永久索引为空白；社媒/AI 抓取器看到的全是占位符 |
| P0-5 | Canonical 与 JSON-LD 全部相对路径 | `products/_template.html:191`、`blog/_template.html:211`，以及两个模板内的 BreadcrumbList `item` 字段 | Schema.org 与 Google 都要求绝对 URL；相对路径在 RSS / AMP / AI 解析器中常被丢弃 |
| P0-6 | 整站没有 `/public/404.html` | `server/index.js:140` 引用了它但文件不存在 | 用户与爬虫遇到 404 都拿到纯文本 "Not found"，触发软 404；pillar/blog JS `location.href = '/404.html'` 雪崩成跳到 404 文本响应 |
| P0-7 | 首页 0 条结构化数据（`<script type="application/ld+json">`） | `index.html`（整页），全站仅 `_template.html` 两个文件有 JSON-LD | 缺 `Organization`（B2B 最高杠杆 schema）、`WebSite` + `SearchAction`、`Product` 列表、`FAQPage`、`BreadcrumbList`，AI Overviews / Knowledge Panel 命中率几乎为 0 |
| P0-8 | hero / 卡片图片全部用 CSS `background-image` 加载 Unsplash 热链 | `index.html:19, 60, 74, 88, 117..`、`applications/*.html`、`about/*.html`、`solutions/index.html` | (a) Google [Image SEO 文档](https://developers.google.com/search/docs/appearance/google-images) 显式要求 `<img>` 元素索引图片；CSS 背景图不参与 Image Search；(b) Unsplash 可能随时禁热链；(c) 第三方 DNS+TLS 增加 LCP；(d) 无 `width/height` 导致 CLS 风险 |

### 2.2 P1 —— 显著影响排名 / CTR / E-E-A-T

| # | 问题 | 位置 | 说明 |
|---|---|---|---|
| P1-1 | 首页 `<h1>` 缺主关键词 | `index.html:21` "Custom Batteries, Engineered Precisely." | 应嵌入 head term，例如 "Custom Lithium Batteries — Polymer Li-Po, Custom-Shape & Coin Cell Manufacturer"。当前 `<title>` 已包含关键词但 `<h1>` 偏品牌口号 |
| P1-2 | 首页缺 canonical + OG + Twitter card | `index.html:1-11` | 社交分享无卡片预览；Bing/Yandex 无显式 canonical |
| P1-3 | Blog `_template` 标题双拼 | `blog/_template.html:203` `(a.meta_title || a.title) + ' | Acme Battery'`；同时 `seed.sql` 里 pillar 的 `meta_title` 已包含 `Acme Battery`，导致最终 `... | Acme Battery | Acme Battery` | 标题被 Google 截断；CTR 受损 |
| P1-4 | OG type 错误 | `products/_template.html:8` `og:type="product.group"` | OG 协议只承认 `product` / `product.item`；Facebook/LinkedIn 抓取后会回退到 `website` 默认 |
| P1-5 | Pillar 模板默认 `<h2>` 占位文字 "What is this product line" | `products/_template.html:47` | 在 JS 失败时被索引；FAQ 默认 placeholder "FAQ not configured." 同理 |
| P1-6 | 两套并行模板系统 | 多数页用 `/styles.css?v=16 + partials.js`，但 `applications/_template.html` 用 `/assets/css/theme.css + /assets/js/site.js` | 用户可见样式跳变，Lighthouse 重复 CSS，导航 / footer 在不同模板渲染不一致 |
| P1-7 | Application 子页（ar-vr / medical / wearables / iot）**无内链回 pillar、无内链到相关 blog 文章** | `applications/medical.html`、`ar-vr.html`、`wearables.html`、`iot.html` 全部仅 CTA 到 `/contact.html` | Cluster 模型断裂；这些页面的话题权威无法回流到 pillar |
| P1-8 | `/applications/` Hub 中"Other domains" 6 项无链接 | `applications/index.html:99-104` 的 `<div class="feat-item">` 全是死内容 | Drones、Power Tools、E-Mobility 等是潜在 cluster 入口，应建立独立子页或至少内链 |
| P1-9 | 缺少 author / Person schema | 全部 blog 文章默认 author = "Acme Engineering"（团队署名），无 `Person` schema、无作者档案页 | 2026 E-E-A-T 强调"experience by named expert"；当前文章没有可验证的作者身份信号 |
| P1-10 | 仅 _template.html 出现 `BreadcrumbList` JSON-LD | 静态页（`/products/`、`/applications/`、`/blog/`、`/about/`、`/solutions/`）的可视面包屑没有对应结构化数据 | 错过 SERP 面包屑富片段 |
| P1-11 | FAQ 页面 (`faq.html`) 无 FAQPage schema 并不致命，但**首页 FAQ 折叠区也没有任何 schema** | `index.html:288-309` | FAQ rich result 自 2023 起仅对 health/gov 网站可见，但 [Google 仍解析 FAQPage 用于 AI Overviews 引用](https://developers.google.com/search/blog/2023/08/howto-faq-changes)。建议保留 schema |
| P1-12 | Hero 图全部第三方域名，无 `<link rel="preload">` | 各页 page-hero | LCP 候选元素是远程 Unsplash 图，无优先级提示；INP 也受动画 counter 影响 |
| P1-13 | 缺 `loading="lazy"` / `decoding="async"` / `width` / `height` | 全部 `<img>` 与 `background-image` | CLS 不可预测；非折叠图浪费首屏带宽 |
| P1-14 | Pillar 实际深度内容偏单薄 | `seed.sql` 里 pillar 总字数约 800-1,200，远低于 [2026 pillar 标准 2,000-4,000 词](https://www.digitalapplied.com/blog/seo-content-clusters-2026-topic-authority-guide) | 话题覆盖不全，难以与同类 B2B 页面竞争 |
| P1-15 | Cluster 文章数量稀疏 | DB 默认每个 pillar 1-2 篇 | 推荐每 pillar 8-12 篇 cluster |

### 2.3 P2 —— 技术债 / 中长期优化

| # | 问题 | 位置 |
|---|---|---|
| P2-1 | `sitemap.xml` 输出 `<priority>` 与 `<changefreq>` —— Google 早已忽略 | `server/routes/seo.js:79` |
| P2-2 | `sitemap.xml` 漏掉静态 sub-page：`/applications/{ar-vr,medical,wearables,iot}.html`、`/solutions/{design,prototyping,mass-production}.html`、`/about/{profile,factory,team}.html`、`/products/`、`/applications/`、`/about/`、`/solutions/`、`/faq.html`、`/privacy.html`、`/terms.html`、`/legal.html`、`/gdpr.html` | `server/routes/seo.js:27-31`（仅静态 baseline 三条） |
| P2-3 | `PUBLIC_URL` 未设时，sitemap 用相对 `<loc>` —— [无效](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)（必须绝对） | `server/routes/seo.js:7-8` |
| P2-4 | `robots.txt` 无 `Disallow: /uploads/private/` 等敏感路径预防；`Sitemap:` 同样依赖 `PUBLIC_URL` | `server/routes/seo.js:10-22` |
| P2-5 | 无 image sitemap（Google 推荐独立的 `<image:image>` 节点） | — |
| P2-6 | 无 GSC / Bing Webmaster 验证 meta（运行时 env 注入即可） | — |
| P2-7 | 无 `og:image` 默认回退（`/assets/img/og-default.svg` 存在，但 SVG OG 图被 LinkedIn / X 拒绝） | `public/assets/img/og-default.svg` |
| P2-8 | 字体走 Google Fonts CDN，多 1 次 DNS+TLS（影响 LCP） | 各 HTML `<link href="fonts.googleapis.com">` |
| P2-9 | `?v=16` 缓存 buster 写死在 HTML 内联，每次升级要改 25 个文件 | — |
| P2-10 | `<title>` 部分页面包含特殊字符 `★`（CONTACT、CUSTOM SOLUTIONS 面包屑 `Contact ★`）—— 不会破坏抓取，但可能降低 CTR | `contact.html:17`、`solutions/index.html:17` |
| P2-11 | `Cache-Control: no-cache` 强制强校验 HTML —— 增加 CDN 回源 | `server/index.js:111` |
| P2-12 | 9 个静态页（contact / faq / privacy / terms / legal / about/* / applications/*）**无 canonical**，多语言版本扩展时会冲突 | grep "canonical" 命中数据 |

---

## 3. Pillar 页面 与 Hub（聚合）页面 清单

### 3.1 Pillar 页面（话题中心）

> Pillar = 长篇、覆盖整条 head term、双向连接 cluster 的核心页。

| # | URL | 关键词目标 | 现状 | 期望深度 |
|---|---|---|---|---|
| 1 | `/products/polymer-lithium-battery` | "polymer lithium battery manufacturer", "custom Li-Po" | DB 已建，CSR 渲染。Hero/overview/variants/spec/customisation/manufacturing/cert/FAQ + sibling links + cluster articles + applications grid 模板齐 | 扩到 2,500+ 词，加 5 个对比表，挂 8-12 篇 cluster |
| 2 | `/products/custom-shaped-polymer-lithium-battery` | "custom shaped lithium polymer", "bespoke Li-Po" | 同上 | 同上 |
| 3 | `/products/coin-steel-shell-lithium-battery` | "rechargeable coin lithium battery", "LIR2032 manufacturer", "ML2032 reflow" | 同上 + **首页第 3 个卡片链接到错误 slug** `cylindrical-steel-shell-lithium-battery` | 立即修复链接；URL 与 H1 与导航必须三处一致 |

> **第 4 个潜在 pillar 待评估**：cylindrical Li-Ion（18650/21700）—— README 与首页都暗示这是 pillar 之一，但 seed/路由层从未实现。要么真正落库（推荐，市场体量大），要么从导航/首页文案中删除"cylindrical"字样以消除歧义。

### 3.2 Hub / 聚合页面（导航交叉点）

| URL | 角色 | 当前优劣 |
|---|---|---|
| `/` | 全站门面 | 内容丰富但 0 schema、品牌混乱、第 3 pillar 链接坏 |
| `/products/` | Pillar 索引 | 决策矩阵表是亮点，缺 schema、缺到 applications 与 blog 的内链 |
| `/applications/` | 应用行业聚合 | 4 个核心 + 6 个相邻无链；缺 ItemList schema |
| `/blog/` | 文章列表 + 分类筛选 | OK；缺 ItemList schema、无翻页规范 |
| `/about/` | 公司聚合 | 团队/工厂/profile 三入口齐；缺 Organization schema |
| `/solutions/` | 服务流程聚合 | Design / Prototyping / Mass Production 三步骤；缺 Service schema、无与 pillar 的交叉链 |
| `/faq.html` | 全站 FAQ | 内容好；无 FAQPage schema |
| `/contact.html` | 询价转化 | 是关键 conversion 页面；可加 ContactPage schema 与营业时间 |

### 3.3 Cluster 页面（专项 / 子页）

| 簇 | 当前页面 | 建议补齐 |
|---|---|---|
| Polymer Li-Po | DB 中 1-2 篇文章 + 4 个 application 子页 | 加 8 篇技术深度文：cell sizing、BMS 拓扑、PCM 设计、cycle life 测试、IEC 62133 解读、能量密度对比、FPC 接口、UN 38.3 流程 |
| Custom-Shape Li-Po | 同上 | 加 8 篇：STEP 文件交付指南、最小弯曲半径、stepped pouch 良率、曲面医疗贴片案例、AR 镜腿厚度极限 |
| Coin Steel-Shell | 同上 | LIR vs ML 对比、reflow profile 实测、hearing-aid OEM 流程、SMD 焊点失效模式 |
| Applications | ar-vr / medical / wearables / iot（4 篇 < 1,500 词） | 至少补：drones / power-tools / e-mobility / smart-home / industrial-handheld 5 个独立子页（已在 `/applications/` 的 "Other domains" 卡片中提及但无链） |
| Solutions | design / prototyping / mass-production | 加 NRE 报价、NDA 流程、quality agreement、CAPA、BOM 透明度等 |

### 3.4 推荐的 Pillar-Cluster 内链拓扑

```
                ┌────────────────────────────────────────────┐
                │            Home  /                         │
                └────┬───────────┬────────┬────────┬─────────┘
                     │           │        │        │
                ┌────▼────┐ ┌────▼────┐ ┌─▼───────┐ ┌▼────────┐
                │ /products│ │/applications│ /blog │ │/solutions│
                └─┬─┬──┬──┘ └─┬─┬─┬─┬───┘ └───┬───┘ └──┬──────┘
                  │ │  │      │ │ │ │         │        │
        ┌─────────┘ │  └────┐ │ │ │ │   ┌─────┴─────┐ │
        │           │       │ │ │ │ │   │ 30+ articles│
        ▼           ▼       ▼ │ │ │ │   └─────┬─────┘ │
   pillar 1   pillar 2  pillar3│ │ │ │         │       │
   (Polymer)  (Custom)  (Coin) │ │ │ │         │       │
        ▲           ▲       ▲  │ │ │ │         │       │
        │           │       │  │ │ │ │         │       │
        └───────────┴───────┴──┴─┴─┴─┴─────────┴───────┘
                bidirectional cluster links
```

每个 pillar 应至少 outbound：3 个 sibling pillar、4-6 个 application、8-12 个 cluster article、3 个 solution；每个 cluster page 必须 inbound 至少回 1 个 pillar + 2 个 sibling cluster。

---

## 4. SEO 增长点（按 ROI 排序）

### 4.1 短期（1-4 周，工作量小、收益直接）

1. **修复 P0-1 ~ P0-8** —— 见第 5 节修复路线图；这一组改完之后，索引覆盖率与抓取效率立即可见提升。
2. **把 pillar / blog 详情页改造为 SSR**：在 `server/routes/products.js` 与 `articles.js` 增加 `text/html` 路径，注入 `<title>` / `<meta>` / `<link rel="canonical">` / JSON-LD，再让 JS 接管 hydration。Google 自 2025 年 12 月起公开偏好 server-rendered canonical / meta。
3. **加 `Organization` JSON-LD 到 `partials.js`**：所有页面都注入；包含 `@id`（绝对 URL，等于站点首页 `#organization`）、`name`、`url`、`logo`、`sameAs`（LinkedIn/WhatsApp/...）、`address` PostalAddress、`contactPoint`（sales / engineering / press 三组 telephone+email）。这是 2026 B2B 最高杠杆动作。
4. **修补 sitemap.xml**：移除 `<priority>` `<changefreq>`、补全静态 sub-page、强制绝对 URL（`PUBLIC_URL` 缺省时 fallback 到请求 host）、加 `<image:image>` image-sitemap 命名空间。
5. **锁定品牌名**：选定 Acme 或 Zufek（建议保留法律实体 Zufek，市场名也用 Zufek），全站 grep 替换；`partials.js:14` 的 `FALLBACK.site.name` 同步。
6. **建一个真实 `/public/404.html`**：包含品牌头部、"页面不存在 / Page not found"、最近 6 篇 blog、回首页 CTA。
7. **将 hero 与卡片图改用 `<picture> + <img>`**：保留 Unsplash 期间至少在原服务器加 `srcset` + `loading=lazy` + `decoding=async` + 显式 `width`/`height`；最终目标是把品牌相关图（工厂、团队、产品）替换为自托管 WebP/AVIF。
8. **修首页 `<h1>` 与第 3 pillar 链接**。

### 4.2 中期（1-3 个月，写作 / 内容工作量）

9. **每个 pillar 写 8-12 篇 cluster 文章**（共 ~30 篇），每篇 1,500-2,500 字，作者署真名 + 含 `Person` schema。题材建议（针对德国 / 欧盟 B2B 工程师）：
   - Polymer Li-Po: "Choosing between 0.4 mm and 0.5 mm thickness for AR glasses"、"IEC 62133-2 vs UL 1642 for medical wearables"、"Calculating cycle life from your duty cycle"。
   - Custom-Shape: "STEP file checklist before sending to a Chinese cell vendor"、"Why a 25 mm radius is the limit on curved Li-Po"、"Stepped pouch yield vs cost trade-off"。
   - Coin Steel-Shell: "ML2032 vs CR2032 in industrial RTC backup"、"Reflow profile for SMD-mountable lithium cells (J-STD-020)"、"Hearing-aid pin cell qualification roadmap"。
10. **建作者档案页 `/about/team/<slug>.html`**，含 `Person` schema（`worksFor` → Organization、`jobTitle`、`knowsAbout`、`sameAs` LinkedIn）。每位 author 写 5+ 篇关联文章建立"experience"信号。
11. **为每个 application 子页加深 1,500 字 + 至少 3 篇相关 article 的 sidebar / 底部互链**：让 application page 既承接 pillar 流量又向 cluster 文章导流。
12. **加内部站内搜索 `<SearchAction>`**：JSON-LD `WebSite` + `potentialAction` `SearchAction`，target `/?q={search_term_string}`。即使没有真实搜索，placeholder URL 也能拿到 sitelinks search box。
13. **给 `/products/` 与 `/applications/` 加 `ItemList` JSON-LD**：明确告诉 Google "这是一个分类列表"。
14. **建 `/case-studies/`** 新 hub，挂 5-10 篇匿名化案例（CGM patch / AR 眼镜 / 工业手持机），每篇 `Article` + `Review` schema，强力 E-E-A-T 信号。
15. **`/resources/` 资源中心**：白皮书、Datasheet PDF（PDF 也单独索引）、UN 38.3 测试摘要样张、IEC 62133 报告范本。这些是 B2B 工程师常见 long-tail 搜索（如 "UN 38.3 test summary template"）的强引流入口。

### 4.3 长期（3-9 个月）

16. **多语言扩展**：法语、德语、西班牙语 sub-folder（`/de/...`、`/fr/...`），加 `<link rel="alternate" hreflang>`。README 明确说面向欧洲 B2B 市场，本地化是必走之路。
17. **图片自托管 + AVIF/WebP 双格式**：所有产品 / 工厂图片去掉 Unsplash，改用品牌实拍；命名 `polymer-lipo-cell-0.4mm-thick.webp` 等可读 slug。
18. **结构化数据扩展**：在每个 product detail 加 `Product` + `Offer`（即使 B2B 不公开价格，可以用 `priceSpecification` 写 "Quote on request"）+ `AggregateRating`（依据真实客户反馈，非伪造）。
19. **接入 GA4 + GSC**：通过 `partials.js` 受 cookie consent 控制注入，符合 GDPR。
20. **接入 Bing IndexNow / Google Indexing API**：CMS 后台发文章后立即推送。
21. **开始建外链**：ISO 9001 / ISO 13485 认证机构页面、行业目录（IPC、PCIM Europe、Battery Show Europe）、技术媒体（EE Times、Power Electronics News）撰稿。

---

## 5. 改进路线图（建议执行顺序）

| 阶段 | 时间 | 任务 | 成功指标 |
|---|---|---|---|
| Sprint 1 | 第 1 周 | P0-1 ~ P0-8 全部修复（lang 属性、品牌统一、修第 3 pillar 链接、加 404.html、pillar/blog 详情页 SSR 注入 head/JSON-LD 用绝对 URL、加 Organization schema、img 替代 background-image） | GSC "已索引页面" 翻倍；Lighthouse SEO 分数 ≥ 95 |
| Sprint 2 | 第 2-3 周 | sitemap.xml + robots.txt 重写，补全所有静态 sub-page；接入 GA4 + GSC + Bing webmaster；建 404 + 5xx 自定义页 | 站点地图 URL 数从 4 跃升到 30+；GSC 抓取错误归零 |
| Sprint 3 | 第 4-6 周 | 首页 H1 / FAQ schema / OG / Twitter card / canonical；所有静态 hub 页（products / applications / blog / about / solutions）补 BreadcrumbList + ItemList schema；内链补全（application → pillar / blog → application） | 富片段曝光提升；社交分享卡片 100% 渲染 |
| Sprint 4 | 第 7-12 周 | 写 30 篇 cluster 文章（每 pillar 10）；建 4 个 author 档案页；application 页扩到 1,500+ 字 | 自然流量 +30~60% / cluster 文章首页 GSC 展示 |
| Sprint 5 | 第 13-16 周 | 案例研究 hub `/case-studies/`；资源中心 `/resources/`；图片自托管 AVIF/WebP；preload LCP | LCP < 2.5s（CrUX p75）；Image Search 引流出现 |
| Sprint 6 | 第 17-24 周 | 多语言 (de/fr/es) 子目录 + hreflang；外链建设；产品 datasheet PDF SEO | 多语言流量 + 高质外链 +20 |

---

## 6. 关键 SEO 检查清单（验证用）

- [ ] 全部页面 `<html lang="en">`（或具体地区如 `en-US`）
- [ ] 全部 `<head>`：title 50-60 字符、description 130-160 字符、canonical 绝对 URL、og:* 全套、twitter:card
- [ ] 全部 hub 页面 `BreadcrumbList` + `ItemList` JSON-LD
- [ ] 全部 pillar 页面 `Product` + `BreadcrumbList` + `FAQPage` JSON-LD（绝对 URL）
- [ ] 全部 article 页面 `Article` + `BreadcrumbList` + `Person`（作者）JSON-LD
- [ ] 全站统一 `Organization` JSON-LD（注入 partials.js，所有页面共享 `@id`）
- [ ] 首页 `WebSite` + `SearchAction`
- [ ] sitemap.xml: 绝对 URL、`<lastmod>`（不要 priority/changefreq）、image-sitemap、覆盖 100% 公开页面
- [ ] robots.txt: 绝对 Sitemap URL、Disallow `/admin/` `/api/` `/uploads/private/`（如有）
- [ ] 所有 `<img>` 有 `alt`、`width`、`height`、`loading`（折叠下方加 `lazy`）、`decoding="async"`
- [ ] LCP 候选元素（hero 图）：`<link rel="preload" as="image">` + 自托管 AVIF
- [ ] 自定义 `404.html`（200 状态码下也可 / 但路由保持 404 status）
- [ ] HTTPS + HSTS 强制
- [ ] CSP 不阻止合法的 ld+json 与 GA4

---

## 7. 参考来源（Google 官方文档与 2026 行业指引）

- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) — Google Search Central
- [SEO Guide for Web Developers](https://developers.google.com/search/docs/fundamentals/get-started-developers)
- [JavaScript SEO Basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) — 2025-12 更新强调 canonical 优先 HTML
- [Product Structured Data](https://developers.google.com/search/docs/appearance/structured-data/product)
- [Organization Schema](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [FAQPage Structured Data](https://developers.google.com/search/docs/appearance/structured-data/faqpage) — 富片段限制说明 [2023 公告](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals) — INP/LCP/CLS 阈值
- [Image SEO](https://developers.google.com/search/docs/appearance/google-images)
- [Build and Submit a Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) — Google 忽略 priority/changefreq、重视 lastmod
- [International SEO](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [Localized Versions](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [SEO Starter Guide makeover blog post](https://developers.google.com/search/blog/2024/02/ssg-gets-a-makeover)
- [Google Search Central](https://developers.google.com/search/docs)

行业 2026 趋势补充：

- 2026 SEO 概览：[Adrian Cruce 2026 Beginner Guide](https://adriancruce.com/2026/02/14/the-complete-2026-seo-guide-for-beginners/)
- JS SEO 现状：[JavaScript SEO in 2026](https://www.rewatikhare.com/post/javascript-seo-in-2026-what-google-actually-handles-vs-what-still-bites-you)
- 结构化数据 2026 变化：[Structured Data Strategy 2026](https://www.digitalapplied.com/blog/schema-markup-after-march-2026-structured-data-strategies)
- E-E-A-T 2026：[Build E-E-A-T Authority](https://redot.global/blog/eeat-authority-google-ai-trust-signals/)
- B2B 制造业 E-E-A-T：[The myth of manufacturing author E-E-A-T](https://searchengineland.com/myth-manufacturing-author-e-e-a-t-440675)
- Topic Cluster 2026：[SEO Content Clusters 2026 Guide](https://www.digitalapplied.com/blog/seo-content-clusters-2026-topic-authority-guide)
- Image SEO 2026：[Image SEO in the Age of AI](https://ignitevisibility.com/image-seo/)
- Core Web Vitals 2026：[Core Web Vitals 2026 Guide](https://www.w3era.com/blog/seo/core-web-vitals-guide/)
- AI Overviews 引用：[Google's AI Search 8 Rules](https://www.savictech.com/insights/google-ai-search-8-rules-enterprise-content-2026/)
- Sitemap 2026：[XML Sitemap Setup 2026](https://rightblogger.com/blog/xml-sitemap-setup)

---

## 8. 优先修复样例（可立即落地的代码改动）

> 下面是几个可单独立 PR 的、影响面最大的改动；本审计仅给出修改方向，未直接修改代码（避免与 P1 / P2 项耦合）。

### 8.1 全站 `lang` 属性

```diff
- <html lang="zh-CN">
+ <html lang="en">
```
影响 10 个文件。

### 8.2 修复首页第 3 pillar 链接

```diff
- <a class="pillar-card" href="/products/cylindrical-steel-shell-lithium-battery">
+ <a class="pillar-card" href="/products/coin-steel-shell-lithium-battery">
    ...
-   <span class="pillar-card__pill">Cylindrical</span>
-   <h3>Cylindrical Steel-Shell</h3>
+   <span class="pillar-card__pill">Coin Cell</span>
+   <h3>Coin Steel-Shell Lithium</h3>
```
（或反向：把 DB 改成 cylindrical，并新增 cylindrical 的内容；二选一，但必须三处对齐）

### 8.3 Pillar 详情页 SSR 注入（伪代码）

```js
// server/routes/products.js — 增加 HTML 路径
router.get('/page/:slug', async (req, res) => {
  const slug = req.params.slug;
  const pillar = await one(`SELECT ... FROM pillar_pages WHERE slug=$1`, [slug]);
  if (!pillar) return res.status(404).sendFile(path.join(ROOT, 'public', '404.html'));
  const html = await renderPillarHtml(pillar); // 把 _template.html 转成模板字符串
  res.type('html').send(html);
});

// server/index.js 路由
app.get('/products/:slug', (req, res, next) => {
  // 先尝试 DB-backed pillar
  return res.redirect(307, `/api/render/pillar/${req.params.slug}`);
});
```

或直接在现有 `/products/:slug` 处理器里同步从 DB 读取并把 head 字段插入 _template.html 字符串后返回。两种方式都能让 Googlebot 在初始 HTML 中看到完整 head。

### 8.4 注入 Organization schema

在 `partials.js` 的 `renderAll()` 中追加：

```js
function injectOrganizationSchema() {
  const base = STATE.config.publicUrl || `${location.protocol}//${location.host}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    "name": STATE.config.siteName,
    "url": base,
    "logo": `${base}/logo.png`,
    "sameAs": [
      STATE.settings.social?.linkedin,
      STATE.settings.social?.whatsapp,
    ].filter(Boolean),
    "address": { /* PostalAddress from settings */ },
    "contactPoint": [ /* ContactPoint per role */ ],
  };
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);
}
```

更彻底的方案是把它直接渲染到 `server/routes/seo.js` 暴露的 `/api/public/config` 输出 HTML 之外，或在每个静态页面的 `<head>` 里硬编码（推荐）。

---

*本审计文档持续维护；如内容/架构变化，请重新走第 6 节检查清单。*
