# 后台内容架构：该不该做成 Elementor 那样的积木式建站

> 生成日期：2026-09-17
> 结论先行：**不要做 Elementor。做「类型化区块库」（typed block library）。**
> 这不是折中方案——对这个项目的业务而言，它严格优于 Elementor。

---

## 一、先看清楚现在是什么架构

这一步很重要，因为「能不能演进成积木式」的答案完全取决于现状。

当前系统同时存在 **四层内容机制**，且互相叠加：

```
第 4 层  settings.text_overrides        全局字符串查找替换（服务端 + 客户端各跑一遍）
第 3 层  public/cms-page.js             客户端按 CSS 选择器打补丁
第 2 层  html-tokens.js / ssr-detail.js  服务端 {{TOKEN}} 替换 + <head> 注入（2064 行）
第 1 层  public/**/*.html                30 个手写静态 HTML 文件（开发者才能改）
```

### 关键认识

**整套编辑系统的本质是「对已渲染的 HTML 打补丁」，而不是「从数据渲染 HTML」。**

具体证据：

`server/routes/text-overrides.js:4` —— 存储结构是

```
settings.text_overrides = { [原文]: 替换文 }
```

即一张 **以内容本身为键的全局查找替换表**。

`public/cms-page.js:151-154` —— 前台这样定位要替换的元素：

```js
const h1    = hero.querySelector('h1');
const subEl = hero.querySelector('.subtitle, p');
```

即 **按 CSS 选择器猜测目标元素**。

### 这个模型的固有缺陷

| 缺陷 | 后果 |
|---|---|
| 以文本内容为键，而非以位置为键 | "Learn More" 若出现在 12 个页面，改一处等于改全部 12 处。数据结构里**根本没有页面维度** |
| 开发者改动源码 HTML 即导致键失配 | 运营之前的修改**静默失效**，无任何报错或提示 |
| 无法表达结构 | 增加一个区块、删除、排序、复制——全都做不到 |
| 无垃圾回收 | 源码改动后遗留的孤儿键永久累积 |
| 同一份 override 服务端与客户端各实现一遍 | 两条代码路径需要长期保持同步 |
| 选择器定位脆弱 | 开发者重构 hero 结构或多加一个 `<p>`，编辑即指向错误元素 |

**因此：这套机制无法增量演进成 Elementor。** Elementor 的前提是「页面本身就是一棵序列化的区块树，
由数据渲染而来」；当前是「页面是静态文件，编辑是打在上面的字符串补丁」。两者方向相反。

---

## 二、为什么 Elementor 对这个项目是错误选择

不是「做不起」的问题，是**做出来会摧毁这个项目最有价值的部分**。

### 1. 会直接毁掉 SEO 结构化数据

README 的核心卖点是 pillar/cluster SEO 架构：自动产出 `Product`、`FAQPage`、
`BreadcrumbList` 的 JSON-LD。

它之所以能自动，是因为 `server/db/schema.sql:44` 里：

```sql
faq  JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{q, a}]
```

字段是**类型化**的——服务端知道「这是一组问答」，才能生成 `FAQPage` schema。

自由画布式建站器输出的是匿名嵌套 `<div>`。服务端不再知道「这块是 FAQ」，
结构化数据只能靠运营逐页手填，而运营不会填 —— 富文本搜索结果随之消失。
这正是 Elementor 站点在结构化数据上普遍表现不佳的原因。

**对一个以 SEO 为核心竞争力的 B2B 站，这是自废武功。**

### 2. 会加剧已有的性能问题

Elementor 类建站器为支持任意布局，每页需加载大量 CSS/JS 运行时。
本项目当前已存在 16MB 图片、1.1MB logo 的 Core Web Vitals 问题（见 `IMPROVEMENTS.md` #9），
再叠加建站器运行时会进一步恶化。

### 3. 成本与团队规模不匹配

一个真正好用的拖拽建站器需要：每元素的响应式断点控制、撤销/重做、版本历史、
嵌套容器、样式复制粘贴、模板库、协同锁。这是多年、团队级的产品工程，不是一个功能。

### 4. 自由度对这个场景是负价值

运营不是设计师。B2B 制造业官网需要的是**页面之间高度一致**——
自由画布的直接产物是每个页面长得都不一样。

---

## 三、应该做什么：类型化区块库

**「搭积木」的体验要，「自由画布」的自由度不要。**

区别在于：运营从一个**预先设计好的区块库**中挑选区块、填写字段、拖拽排序；
但**不能**移动、缩放、改样式。他们无法把页面弄坏，也无法做出偏离品牌规范的页面。

这正是 WordPress 自己后来走的方向（Gutenberg + `block.json` 声明式区块），
也是 Sanity / Contentful / Storyblok 所称的 components / blocks / bloks。

### 数据模型

一张表取代全部补丁机制：

```sql
CREATE TABLE page_blocks (
  id         SERIAL PRIMARY KEY,
  page_id    INT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type       VARCHAR(60)  NOT NULL,              -- 'hero' | 'spec_table' | 'faq' | ...
  sort_order INT          NOT NULL DEFAULT 0,
  data       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  status     VARCHAR(20)  NOT NULL DEFAULT 'published',
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_page_blocks_page ON page_blocks (page_id, sort_order);
```

注意：`data` 是 JSONB —— **新增区块类型不需要数据库迁移**。

### 区块注册表：一个区块 = 一个文件

```js
// server/blocks/faq.js
module.exports = {
  type:  'faq',
  label: 'FAQ 手风琴',
  icon:  'help-circle',

  // ① 驱动后台表单自动生成——不需要为每个区块手写后台页面
  schema: {
    title: { type: 'text', label: '标题', max: 120 },
    items: {
      type: 'repeater', label: '问答', min: 1, max: 20,
      fields: {
        q: { type: 'text',     label: '问题', max: 200 },
        a: { type: 'richtext', label: '回答', max: 2000 },
      },
    },
  },

  // ② 服务端渲染——SSR 免费获得，无水合闪烁，无选择器补丁
  render(data, ctx) {
    return `<section class="faq">
      <h2>${ctx.esc(data.title)}</h2>
      ${data.items.map((it) => `
        <details class="faq__item">
          <summary>${ctx.esc(it.q)}</summary>
          <div class="faq__a">${ctx.sanitize(it.a)}</div>
        </details>`).join('')}
    </section>`;
  },

  // ③ 这是 Elementor 给不了的东西
  jsonLd(data) {
    return {
      '@type': 'FAQPage',
      mainEntity: data.items.map((it) => ({
        '@type': 'Question',
        name: it.q,
        acceptedAnswer: { '@type': 'Answer', text: it.a },
      })),
    };
  },
};
```

**一个文件带来三项收益：**

| 字段 | 收益 |
|---|---|
| `schema` | 后台表单自动生成，无需为每个区块新建 admin HTML 页面 |
| `render` | 服务端渲染，SSR 与 SEO 天然正确，彻底摆脱选择器补丁 |
| `jsonLd` | 结构化数据保持自动且准确 —— **相对 Elementor 的决定性优势** |

### 扩展性故事

> 开发者新增一种区块 = 在 `server/blocks/` 放一个文件。
> 无数据库迁移、无新后台页面、无 CSS 手术。

这是可以写进文档、也能对外讲的扩展模型。

### 建议的初始区块库（约 15 个）

现有页面已经把需要的区块类型暴露出来了，直接沿用：

`hero` · `overview` · `variant_grid` · `spec_table` · `application_grid` ·
`customization` · `manufacturing` · `certification_wall` · `faq` ·
`cta_band` · `logo_strip` · `comparison_table` · `rich_text` ·
`related_articles` · `inquiry_form`

---

## 四、迁移路径：增量，不是重写

关键点：**`pillar_pages` 现有的 9 个区块与 9 种区块类型一一对应。**
这不是推翻重来，而是把已有设计一般化。

对照 `server/db/schema.sql:37-44`：

| 现有列 | 对应区块类型 |
|---|---|
| `overview` JSONB | `overview` |
| `variants` JSONB | `variant_grid` |
| `spec_table` JSONB | `spec_table` |
| `applications` JSONB | `application_grid` |
| `customization` JSONB | `customization` |
| `manufacturing` JSONB | `manufacturing` |
| `certifications` JSONB | `certification_wall` |
| `faq` JSONB | `faq` |
| `hero_*` 列组 | `hero` |

### 分阶段

**阶段 0 — 立即冻结 `text_overrides`（半天）**

停止新增写入，后台入口改为只读并提示迁移中。

> 理由：这套机制每多运行一天，就多积累一批以源码字符串为键的内容，
> 后续解开的成本就多一分。**这是本提案中唯一有时间压力的一步。**

**阶段 1 — 打地基，只做 3 个区块类型（1-2 周）**

区块注册表 + 服务端渲染器 + 后台区块编辑器（增删改排序）。
只实现 `hero`、`rich_text`、`faq`，在**一个**页面上跑通。

目的是先验证模型，不是先铺量。

**阶段 2 — 迁移 `pillar_pages`（1 周）**

9 个区块类型补齐，数据迁移是直接的 JSONB 搬运（现有结构已经对得上）。
此阶段结束后，pillar 页面完全由区块驱动。

**阶段 3 — 迁移 30 个静态页（2-3 周，可分批）**

逐页转换。每转完一页，该页从 `cms-page.js` 的补丁逻辑中摘除。

**阶段 4 — 删代码（收益兑现）**

- 删除 `settings.text_overrides` 及 `server/routes/text-overrides.js`（77 行）
- 删除 `public/cms-page.js` 中的选择器补丁逻辑
- 大幅精简 `html-tokens.js`（810 行）与 `ssr-detail.js`（1254 行）中的 override 机制
  （二者合计 63 处 override 相关引用）

**净效果：代码量预计减少而非增加，同时能力大幅增强。**

---

## 五、明确不做的事

| 不做 | 原因 |
|---|---|
| 自由拖拽画布（绝对定位、任意缩放） | 运营会做出破碎页面；且会毁掉结构化数据 |
| 每元素的 CSS 样式编辑器 | 品牌一致性归设计系统管（见 `IMPROVEMENTS.md` #8），不归运营管 |
| 嵌套区块 / 列容器 | 初版不做。真出现需求时，用组合式区块类型解决，不要引入通用嵌套 |
| 前端框架重写（React/Vue） | 当前原生 HTML/CSS/JS 对 SEO 有利，且团队已熟悉。区块系统不需要框架 |

---

## 六、这件事和改进清单的关系

两份文档存在一个依赖：

**`IMPROVEMENTS.md` #8（前台设计系统 token 化）是区块系统的前置条件。**

区块要能拼出风格一致的页面，前提是存在一套统一的设计令牌。
当前 `public/styles.css` 有 478 个硬编码颜色、0 个 `:root` 变量——
在这个基础上做区块库，产出的仍然是风格不一致的页面。

**建议顺序：先 P0 安全 → 再 #8 设计系统 → 再阶段 0 冻结 overrides → 然后阶段 1。**
