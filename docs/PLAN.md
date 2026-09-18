# 执行计划

> 生成日期：2026-09-17
> 这是**唯一的执行顺序**。`IMPROVEMENTS.md` 是问题清单，
> `ARCHITECTURE_BLOCKS.md` 是架构方向，本文件决定先做什么、后做什么、以及**不做什么**。

---

## 排序原则

剩余工作按「**是否会被区块化重写掉**」分类，而不是按紧急程度：

| 类别 | 处理方式 |
|---|---|
| 区块系统的**前置条件** | 优先做 |
| 今天和区块化**都要用**的能力 | 做成共享 helper，一次投入两处受益 |
| **正交**（与区块化无关） | 择机插入 |
| Phase 3 会**重写掉**的 | **不做**，或收窄范围只做会被继承的那一层 |

---

## 已完成（P0 + P1，7 个提交）

| # | 项目 | 结果 |
|---|---|---|
| 0 | 全新部署起不来（`analytics_hits` 建表/建索引错配） | 已修 |
| 1 | 默认弱密钥导致管理员身份可伪造 | 已修 |
| 2 | 上传型存储 XSS（含匿名可利用的 RFQ 附件入口） | 已修 |
| 3 | 依赖漏洞 12 个 | → **0** |
| 4 | 错误详情泄露 + 上传错误返 500 | 已修 |
| 5 | 后台列表无分页 | 已修 |
| 6 | 上传同步阻塞 I/O | 已修 |
| 7 | 询盘搜索全表扫 | **81ms → 1.088ms** |

这些全部**不会被区块化冲掉**：#2 的媒体加固、#4 的全局错误处理、
#7 的 inquiries 索引都与内容模型正交；#5 的 articles/products 后台列表
在区块化之后仍是独立实体。

---

## 步骤 1 — 图片回填 — ✅ 已完成

**前提纠正**：`IMPROVEMENTS.md` 原先写「写脚本批量生成 WebP」是错的。
`server/services/image-processor.js` **已经是一套完整管线**——
AVIF + WebP + JPEG × 4 档尺寸（480/768/1280/1920），已在 sharp 0.35 下验证可用。

缺的不是生成能力，是**从来没有对 seed 图片跑过**：

```
public/assets/img/seed/    49 张 jpg，16MB，0 个变体文件
public/assets/img/logo.png 1.1MB，未处理
```

**做什么**：写一个薄脚本调用**现有的** `imageProcessor.process()`，
覆盖 `public/assets/img/` 全目录。不新建管线。

**为什么先做**：零风险、零依赖、立即见效，且图片资产本身不会被区块化冲掉。

**结果**：`scripts/optimize-images.js`（薄驱动，不含编码逻辑）+ `npm run images:optimize`

| | |
|---|---|
| 处理源图 | 50 张 |
| 原图总计 | 16.9 MB |
| 最宽 AVIF 总计 | **4.4 MB（-74%）** |
| `logo.png` | 1054 KB → **9 KB**（AVIF @480） |

**过程中补掉的两个管线缺陷**：

1. `image-processor.js:75` 的变体 URL **硬编码为 `/uploads/`**。变体文件写在源文件同目录，
   所以对 `public/assets/img/` 下的图片返回的 URL 是错的。加了 `opts.urlBase`，默认值不变。
2. 兜底格式**写死 JPEG，而 JPEG 不支持透明**。今天从媒体库上传一个透明 PNG logo，
   生成的兜底变体会带黑底。改为按源图的 alpha 通道自动选择
   （`FORMATS_ALPHA = ['avif','webp','png']`），`cleanup()` 的正则也补上了 `png`。
   实测 logo 正确拿到 `.png` 兜底而非 `.jpg`。

**磁盘代价与决策**：变体全量存盘使 `public/assets/img/` 从 17MB 涨到 58MB。
这 41MB 是**构建产物**，已加入 `.gitignore` 并在 `Dockerfile` 的 builder 阶段生成
（runtime 阶段本就整个 `COPY --from=builder /app/public`）。
gitignore 模式按 `SIZES` 的实际宽度枚举，而非数字通配——
seed 文件名是 `photo-<unsplash-id>.jpg`，`*-[0-9]*.jpg` 会把源图一起忽略掉。

---

## 步骤 2 — 共享图片渲染器 — ✅ 已完成

**这是本计划里投入产出比最高的一步。**

现状：管线**产出了** `variants` / `srcset` 并写进 `media` 表，
但 `grep srcset server/middleware/ssr-detail.js server/middleware/html-tokens.js` = **0**。
前台 `<img>` 只有 `src`。**管线的产出目前 100% 被浪费。**

**做什么**：新建 `server/services/image-render.js`，导出

```js
renderPicture(media, { sizes, loading, fetchPriority, className })  // → <picture> HTML
pictureSources(media)                                              // → { avif, webp, jpeg }
```

从 media 记录（或 seed 图片的约定路径）解析出变体，输出带 `srcset` 的
`<picture>`。**然后让 SSR 层调用它。**

**为什么做成 helper 而不是逐页改**：
`ARCHITECTURE_BLOCKS.md` 的 Phase 3 会把 30 个静态页转成区块，
每个区块的 `render()` 自己吐 HTML。逐页补 `<picture>` 的活会被全部重写掉；
做成一个服务端 helper，今天 SSR 调它，明天区块的 `render()` 调同一个它。
**一次投入，两处受益。**

**已知结构性阻碍**：`ssr-detail.js:67` 输出的是
`background-image:url('...')`，这种形态**用不了 srcset**（12 处在 `public/index.html`）。
本步骤只处理 `<img>` 路径；`background-image` 留到区块化时用
`<picture>` 区块彻底解决——现在改它属于会被重写的那一类。

**结果**：`server/services/image-render.js`

输出形态（兜底声明在前，`image-set()` 在后——不支持 `image-set()` 的浏览器
会把整条声明判为无效，没有前一条就会**完全没有背景图**）：

```css
background-image:url('/assets/img/seed/photo-x.jpg');
background-image:image-set(
  url('/assets/img/seed/photo-x-1920.avif') type('image/avif'),
  url('/assets/img/seed/photo-x-1920.webp') type('image/webp'),
  url('/assets/img/seed/photo-x.jpg')       type('image/jpeg'));
```

**接入了两条服务端路径**（第二条是端到端测试时才发现的）：

| 路径 | 位置 |
|---|---|
| SSR 详情页背景 | `ssr-detail.js:70` `backgroundStyle()` |
| 页面 hero 覆盖 | `html-tokens.js:597` |

**实测收益**（服务端渲染的图片，浏览器实际下载量）：

| 页面 | 改动前 | 改动后 |
|---|---|---|
| `/blog/ar-thin-battery` | 278 KB | **68 KB（-76%）** |
| `/applications/medical` | 508 KB | **126 KB（-76%）** |
| `/about/factory` | 124 KB | **31 KB（-75%）** |

**仍未升级的部分（按计划推迟，非遗漏）**：手写静态 HTML 里的内联
`background-image`（`public/index.html` 12 处、`applications/smart-home.html:67` 等）。
服务端不重写这些标记，它们随 Phase 3 的区块化一并解决。
判据是 DB 里有没有对应的 `hero_image`：`medical` 有 → 已升级；`smart-home` 没有 → 未升级。

**顺带修掉的注入隐患**：两条路径都把结果放进 `style="..."`，
而原先的转义只处理单引号，双引号可以直接闭合属性。
改为对 URL 百分号编码 `"'()\<>` 与控制字符——CSS 与 HTML 属性两层都安全，
且对 URL 而言本就是语义正确的编码。

**验证**：33 项断言（变体发现、路径穿越防护、`image-set` 顺序、
无变体时优雅退化、4 类注入向量、`renderPicture` 输出）+ 真实 HTTP 页面抓取。

`renderPicture()` 也一并实现了，但**今天没有消费者**——SSR 层不输出 `<img>`。
它是给步骤 6 的区块 `render()` 用的。

---

## 步骤 3 — 设计 token 层 — ✅ 已完成

**范围比 `IMPROVEMENTS.md` #8 原先写的窄。** 只做两层里的第一层：

| 层 | 做不做 | 原因 |
|---|---|---|
| `:root` token 定义 + 高频硬编码色替换 | ✅ **做** | 区块系统的前置条件，且会被区块继承 |
| 4498 行里的页面级 CSS 全量重构 | ❌ **不做** | Phase 3 会重写这些页面，属于浪费 |

当前：`public/styles.css` 有 478 个硬编码十六进制色、**0 个 `:root` 变量**；
而 `admin/assets/css/admin.css` 已有完整 token 体系（318 处 `var()`）。
命名直接复用后台的既有约定。

**为什么是前置条件**：区块要能拼出风格一致的页面，前提是存在统一令牌。
在 478 个硬编码色的地基上做区块库，产出的仍是风格不一致的页面。

**结果**

| | 改动前 | 改动后 |
|---|---|---|
| `:root` 令牌 | **0 个** | **19 个** |
| `var()` 使用 | 9 处 | **421 处** |
| 硬编码十六进制色 | 478 处 | **63 处** |

**命名尊重了文件里已有的意图，而不是另起炉灶**：第 2180-2248 行早就写着
`var(--brand, #0b3a82)`、第 4113 行写着 `var(--color-accent, #f5a623)`——
有人开过头但从没定义 `:root`，所以这些调用一直落在 fallback 上。
据此 `--brand` 定为深蓝、琥珀定为 `--accent`。
若按"品牌色=琥珀"的直觉去定义，那 5 行会从深蓝变成琥珀，是真实的视觉回归。

**证明零视觉回归**：把令牌展开回 hex，与原文件跑完整 `diff`——
**全文件只有一个差异块，且完全是下面那处刻意的无障碍修复**。
415 处颜色替换逐字节一致。

**随本步完成的 #11 全局部分**

先更正我早前的一个说法：`:focus-visible` 虽然只出现 1 次，但它是**通用选择器**，
覆盖所有可聚焦元素——"键盘用户看不到焦点框"的说法是错的，我只数了次数没看选择器。

真实问题是**对比度**，已实测：

| 焦点环 | 对比度 | WCAG 2.2 SC 1.4.11（需 ≥3:1） |
|---|---|---|
| 原：琥珀 vs 白底 | **2.03:1** | 不达标 |
| 新：深色外圈 vs 白底 | 17.43:1 | 通过 |
| 新：琥珀内圈 vs 深色区块 | 9.32:1 | 通过 |

改为双色环：浅色背景由深色外圈承担对比度，深色区块由琥珀内圈承担，
两种背景下都有一层远超 3:1。

**过程中自己制造又抓到的一个 bug**：生成 `:root` 的脚本**漏了分号**。
CSS 自定义属性的值几乎可以是任意内容，所以整块会被解析成
"`--text` 的值是后面一长串垃圾"，421 处 `var()` 全部失效、整站样式崩掉。
我最初的验证脚本是**逐行正则解析**，验的是自己的意图而非真实 CSS 语义，放行了。
改用 esbuild 真正解析后才暴露出来。校验脚本现在检查每个令牌的值必须是单一 hex。

**留给后续的设计决策（未擅自改）**：剩余 63 处硬编码色里，
`#0f172a` `#e2e8f0` `#94a3b8` `#475569` `#64748b` `#f8fafc` `#cbd5e1`
**全是 admin.css 的令牌值**——后台样式被复制进了前台。
统一它们要真的改颜色，属于设计决策。
另：`--text-mute3` (#a1a1a6) 在浅色背景上是 2.57:1，
低于正文要求的 4.5:1（`styles.css:4490`、`:4505` 的小字），同样需要设计定夺。

---

## 步骤 4 — 冻结 `text_overrides` — ✅ 已完成（并入阶段 4 一次做掉）

原计划是「先冻结写入、再择机删除」。实际执行时合并成了一步，理由是
冻结的前提（有替代路径）在阶段 1–3 完成后已经满足：文案现在归区块所有，
`/admin/blocks.html` 就是替代路径，再留一个只读的旧入口只会让运营困惑。

**当时留下的待确认项**：线上 `settings.text_overrides` 有多少条、最后更新时间。
这个问题不再需要你回答——`scripts/retire-text-overrides.js` 会自己查、
自己迁移、迁不动的逐条报出来并让整个运行失败。详见下方「阶段 4」。

---

## 步骤 5 — 工程安全网 — ✅ 已完成

`ARCHITECTURE_BLOCKS.md` 里**没有提到这一步，这是该文档的缺口**。

区块系统是整个计划中最大的一次重构。当前状态：
**零测试、零 CI、零 lint**，对应 106 个 API 端点、11245 行后端代码。
在这个状态下做大重构，正是 `IMPROVEMENTS.md` P3 标出的结构性风险。

**顺序**：
1. Prettier + ESLint + `.editorconfig`（半天）
2. 三条关键链路的集成测试：`auth`（登录/鉴权自举）、
   `inquiries`（落库 + 邮件 + 附件）、`gdpr`（DSAR 导出/删除）（2 天）
3. GitHub Actions：push 跑 lint + test + `npm audit`（半天）

**为什么排在区块系统之前**：这是大重构的安全网，不是收尾工作。

### 结果

| | |
|---|---|
| 测试 | **41 条断言，3 条链路，全绿**（`node --test`，零新增依赖） |
| Lint | ESLint 10 扁平配置，`npm run lint` 全绿 |
| CI | `.github/workflows/ci.yml`，三个 job：lint / test / audit |

**测试用真服务器 + 真数据库，不是单元测试。** 理由很直接：
这个项目真正出过的事故——schema 初始化不了、上传按客户端文件名决定扩展名、
中间件用了没 require 的模块——**单元测试全都能通过**，只有进程真跑起来、
真处理一个请求才暴露。每次运行创建独立数据库（`battery_cms_test_<pid>_<rand>`），
失败不会污染下一次，也支持并行。

**覆盖的三条链路**

- `auth`（11 条）：首次登录自举、弱密码拒绝、Cookie 的 HttpOnly/SameSite、
  匿名访问后台被拒、**用本仓库历史上出现过的 4 个默认密钥伪造 token 必须全部被拒**
- `inquiries`（16 条）：同意校验、IP 哈希（断言 64 位 sha256 且表里没有存原始 IP 的列）、
  后台搜索（含跨字段匹配）、速率限制、**上传加固的 5 条回归**
  （HTML 伪装图片→400、声明 text/plain 的 HTML→落盘为 .txt、类型不允许→415、
  超限→413、响应头含 `default-src 'none'` + nosniff）
- `gdpr`（11 条）：同意记录、DSAR 提交与邮件验证（未验证前不可执行）、
  主体数据导出、**跨主体不泄露**、retention 任务软删除

**ESLint 的价值是验证过的，不是声称的**：故意把 `html-tokens.js` 的
`require('image-render')` 删掉——ESLint 的 `no-undef` 立刻报错，
而 `node --check` 完全通过。那正是让首页 500 的那个 bug。

**规则取舍**：只开会抓 bug 的规则，不做风格审判（风格交给 Prettier）。
关掉了三条产生噪音的：`no-empty`（`catch (_) {}` 是本代码库约 40 处的刻意惯用法）、
`no-control-regex`（匹配控制字符正是上传/URL 清洗器的目的）、
`no-useless-assignment`（`let x = 默认值` 后接 try 的防御性写法）。
其余 14 个真问题全部修掉了，没有靠抑制凑绿。

**不做全量 Prettier 格式化**：现有代码风格本就一致（单引号+分号+2 空格），
全量重排会毁掉 `git blame` 且收益很小。`npm run format` 可自愿使用，
**CI 只跑 lint 不跑 format:check**——前者抓 bug，后者只是审美。

**写测试时自己踩的三个坑**（都记下来，因为它们说明测试确实在验证真实契约）：
测试夹具的 cookie jar 覆盖了显式传入的伪造 token（导致"伪造 token 被接受"的假警报）；
提交字段是 `consent_given` 不是 `consent`（写错会让每次提交静默 400）；
psql 对裸布尔渲染成 `t`、经 `||` 拼接则是 `true`（断言要显式 `::text`）。

---

## 步骤 6 — 区块系统阶段 1 — ✅ 已完成

见 `ARCHITECTURE_BLOCKS.md` 第三、四节。

### 交付物

| 文件 | 作用 |
|---|---|
| `server/blocks/index.js` | 注册表：加载目录下每个区块文件，提供目录清单与**按 schema 的写入校验** |
| `server/blocks/{hero,rich-text,faq,cta-band}.js` | 四种区块类型 |
| `server/services/block-render.js` | 服务端渲染器 + JSON-LD 汇总 |
| `server/routes/blocks.js` | 增删改排序 + 预览接口 |
| `server/utils/html-sanitize.js` | 富文本白名单清洗 |
| `admin/blocks.html` | 后台编辑器，**表单由 schema 自动生成** |
| `server/middleware/html-tokens.js` | `applyBlocks()` 接入页面渲染路径 |

### 接入方式：逐页迁移，不是一刀切

静态页里放一个挂载点即可opt-in：

```html
<body data-page="about-us">
  <div data-blocks>
    <!-- 该页没有区块时，这里的静态内容原样保留 -->
  </div>
</body>
```

有区块 → 挂载点内容被替换；没有 → **一个字节都不动**。
这正是 Phase 3 能一页一页转、而不必搞 flag day 的原因。

### 验证（16 条断言，全绿）

- **整页端到端**：没有区块时静态兜底保留 → 添加区块后由数据库驱动渲染 →
  顺序正确 → `FAQPage` 结构化数据出现在 `<head>`
- **富文本清洗**：`<script>` / `onclick` / `javascript:` / `<iframe>` 全部剥离，
  正常段落存活，`target="_blank"` 自动补 `rel="noopener noreferrer"`
- **容错**：未注册的类型被跳过而非 500；某个区块 `render()` 抛错只损失它自己那一节
- **权限**：四个接口匿名访问全部 401
- **草稿**：`status='draft'` 的区块不出现在公开渲染中

### 扩展性主张是验证过的，不是声称的

第四种区块 `cta_band` 是**为了验证这条主张**加的：加完之后 `git status` 显示
**没有改动任何已有文件**，重启后注册表、后台表单（含 select 选项）、
必填校验、渲染全部自动生效。

```
注册表: cta_band, faq, rich_text, hero
后台表单字段（自动生成）: heading, body, cta_text, cta_link, tone
必填校验: cta_text: required / cta_link: required
```

### 与前面步骤的衔接

- `hero` 区块的背景图直接调用步骤 2 的 `imageRender.backgroundImageSet()`，
  自动拿到 AVIF/WebP 变体——不是第二条需要同步维护的代码路径
- 区块渲染出的 class 全部使用步骤 3 的设计令牌
- 步骤 5 的 41 条测试保证这次改动没有破坏既有链路（现共 57 条）

### 过程中修掉的一个缺陷

`toPlainText()` 把行内标签换成空格，于是 `<em>x</em>.` 变成 `"x ."`。
这段文本正是 Google 在 FAQ 富媒体结果里展示的内容，标点前的空格会直接可见。
已修正（标点前后的空白归一化）。

---

## 阶段 2 — 支柱页迁移 — ✅ 已完成

### 归属模型：多态，但保住外键

支柱页**不在 `pages` 表里**，它是独立的 `pillar_pages`。三种接法里：

| 方案 | 取舍 |
|---|---|
| 给每个支柱页在 `pages` 里造镜像行 | ❌ 同一个页面两个真相源——正是这条分支一路在修的那类 bug |
| 改成 `owner_type` + `owner_id` 无外键 | ❌ 失去级联删除，孤儿区块会静默堆积 |
| **每种归属一个可空外键 + CHECK** | ✅ 采用 |

```sql
page_id    INT REFERENCES pages(id) ON DELETE CASCADE,
pillar_id  INT REFERENCES pillar_pages(id) ON DELETE CASCADE,
CHECK (num_nonnulls(page_id, pillar_id) = 1)
```

删除页面/支柱页仍会带走它的区块，且数据库层面拒绝"两个归属"或"没有归属"的行。
再加一种归属就是多一列 + CHECK 里多一个名字。

### 7 种新区块

`overview` · `variant_grid` · `spec_table` · `application_grid` ·
`customization` · `manufacturing` · `certification_wall`

标记与模板既有的 `.feat-item` / `.spec-table` / `.cust-item` / `.cert-chip` /
`.app-card` 保持一致，所以迁移后的页面是**看起来一样**，不只是"等价"。

`application_grid` 存的是应用 slug 而不是名称和图片的副本——applications 表仍是
唯一真相源，改一个行业名，所有引用它的支柱页同步更新。为此给区块系统加了
`resolve()` 钩子：需要读其它表的区块在渲染前异步取数，`render()` 保持同步纯函数
（这是预览接口和测试能很轻的原因）。

### 迁移是复制，不是重塑

```
3 个支柱页 → 各 8 个区块，零校验警告
overview, variant_grid, spec_table, application_grid,
customization, manufacturing, certification_wall, faq
```

架构文档说"现有结构已经对得上"——成立。`pillar_pages.faq` 是 `[{q,a}]`，
faq 区块的 schema 也是 `[{q,a}]`，其余七个同理。

**hero 不在这批里**（8 个而不是 9 个）。`products/_template.html` 的 hero 带
面包屑和兄弟页链接，hero 区块不输出这些，两边都渲染会出现两个 hero。
`hero_*` 列原地不动，留到阶段 3 模板被整体替换时迁移。

### 逐页可切换，可回滚

模板里 8 个 section 标了 `data-legacy-section`，并加了 `<div data-blocks>` 挂载点：
支柱页有区块 → 区块渲染、legacy section 移除；没有 → 和以前一模一样。
**`pillar_pages` 的列一个字节没动**，回滚就是删掉那些区块行。

### 迁移前后实测（同一页面）

| | 规格单元格 | 型号卡 | 定制项 | 应用卡 | 认证 | FAQ | 区块 |
|---|---|---|---|---|---|---|---|
| 迁移前 | 25 | 3 | 7 | 4 | 6 | 5 | 0 |
| 迁移后 | **25** | **3** | **7** | **4** | **6** | **5** | **8** |

### 过程中发现并修掉的一个真问题

支柱页自己的 SSR 图谱**本来就从 `pillar_pages.faq` 生成 FAQPage**，区块又生成了
一个——**重复的 FAQPage 是 Search Console 警告**，出现在一个以结构化数据为核心
卖点的站点上。加了通用去重：页面已有某个 `@type` 时，区块不再注入。

### 顺带发现（未修，已记录）

`/products/<slug>.html` 这个带 `.html` 后缀的 URL **不走 `renderPillar`**，
直接吐未填充的模板（hero 显示模板默认值 "Pillar"）。无后缀的 `/products/<slug>`
才是正确路径。需要确认站内是否有链接指向 `.html` 形式——如果有，那些链接指向的
是空页面。这是既有行为，不在本次范围内。

### 验证（10 条新断言，全套 67 条全绿）

迁移前基准 → 迁移 → 内容逐项相同 → legacy section 已移除 →
结构化数据不重复 → 重跑迁移是 no-op → 删除区块行后 legacy 渲染原样回来 →
API 可按 pillar 归属增删 → 数据库拒绝双归属/无归属的行。

---

---

## 阶段 3 — 静态页迁移 — ✅ 已完成（24/27）

### 和阶段 2 的本质区别

支柱页的内容在**结构化 JSONB 列**里，迁移是复制。这 27 个页面的内容在
**手写 HTML** 里，必须从标记中读出来——**这种转换可能丢内容**，
所以唯一负责任的做法是证明它没丢。

**安全属性**：转换后区块渲染出的可见文本，必须覆盖源文件转换区域内的**每一个词**。
不满足就**拒绝写入**，源文件原样不动。

### 结果

| | |
|---|---|
| 转换成功 | **24 页** |
| 安全检查拒绝 | 2 页（`index.html` 首页、`blog/index.html`） |
| 无 body 挂载点 | 1 页（`404.html`） |
| **验证：词级保留** | **24 页 / 16,771 词 / 零丢失** |

两个被拒的是检查在正确工作：首页有 JS 驱动的轮播（96 词），
blog 索引有会被清洗器剥离的标记（17 词）。**都是真实的内容丢失，
拒绝是对的**——宁可不转，也不要悄悄少说话的页面。

### 映射

```
<section class="page-hero">       → hero 区块
<section class="... cta-band">    → cta_band 区块
其它顶层 <section>                → rich_text 区块，内部 HTML 原样保留
```

**`rich_text` 兜底是刻意的。** 这些页面是定制布局，为每种布局发明一个类型化区块
是在猜；架构上真正要的是**内容从源文件搬进数据库**，运营能编辑、override 机制能退休。
类型化区块留给内容本身确实是那个形状的场合。

### 零改动接入

挂载点复用了页面**早就有的** `<div data-page-body>`（原本是 `pages.body_html` 的挂载点），
所以阶段 3 **没有编辑任何一个 HTML 源文件**。有区块 → 区块渲染；
删掉区块行 → 原始标记原样回来（测试里验证过）。

### 过程中修掉的两个截断 bug

两处都是**非贪婪匹配遇到嵌套元素**：

1. 提取器的 `firstTag` 匹配到第一个 `</div>` 就停——`.section-inner` 包着
   `.feat-grid`，于是每个带网格的 section 都被从中间截断。
   最初一轮 17 个页面被拒，根因就是这个。
2. `applyBlocks` 的挂载点替换同样如此——`data-page-body` 里包着整段 section，
   非贪婪替换会把区块插在第一个内层 `</div>` 之后，旧标记留在后面。

两处都改成**按嵌套深度计数**匹配。第 1 个是检查帮我抓到的；
第 2 个如果没修，转换后的页面会同时显示区块和残留的旧内容。

### 顺带补齐

5 个页面（`404` 与 4 个较新的应用页）在 `pages` 表里**根本没有行**——
CMS 从来不知道它们存在。`--create-pages` 用页面自己的 `<h1>` 建了行。

### 剩下的 3 页 — 已处理

| 页面 | 结论 | 做法 |
|---|---|---|
| `index.html` | ✅ 已转换（9 区块） | 新增 `slide_deck` + `article_list` 两个类型化区块 |
| `blog/index.html` | ❌ 明确不转 | 浏览器驱动的列表页：搜索框、筛选、分页，散文承载不了 |
| `contact.html` / `gdpr.html` | ❌ 明确不转 | RFQ 表单与 DSAR 表单 |
| `404.html` | ❌ 明确不转 | 系统页，没有挂载点，也没有运营要编辑的内容 |

`index.html` 的做法就是区块系统设计上该做的事：**一个布局一个类型文件**。
轮播的箭头是 `<button>`，清洗器在运营散文里不放行——这不是 bug，是设计：
区块文件拥有标记，运营拥有内容。

**剩下 4 页不转是判断，不是遗漏。** 三张表单（RFQ、DSAR）是站点最贵的两个
交互面，一个是主要转化路径，一个是合规面；运营不需要通过区块编辑器调表单
字段顺序，而做错的代价是丢询盘。博客索引页的内容本来就已经是服务端渲染的
（`ssr-detail.js:renderBlogIndex`），转成区块只会把一套能工作的行为重写一遍。

---

## 阶段 4 — 退役 override 机制 — ✅ 已完成

阶段 1–3 把文案搬进了区块。阶段 4 是把被取代的那层删掉，**收益在这里兑现**。

### 删了什么

| | 行数 |
|---|---|
| `server/routes/text-overrides.js` | −77 |
| `admin/assets/js/iframe-text-editor.js` | −230 |
| `html-tokens.js` 的 override 通道 | −90 |
| `ssr-detail.js` 的 6 个调用点 | −14 |
| `cms-page.js` 的选择器补丁 | −37 |
| 合计 | **−432 行，净删** |

### 为什么要先写一个迁移脚本

删掉「应用 override 的代码」并不会删掉 override 的**数据**——
只会让它不再生效。运营用那个入口改过的每一条文案，会在下次部署时
**静默变回原样**。静默回退正是这整条分支一直在消除的故障模式，
在退场的时候再制造一次就说不过去了。

所以 `scripts/retire-text-overrides.js` 先把替换**固化**到现在拥有这些文字的
行里（`page_blocks.data`、`pages`、`pillar_pages`），再删代码。两条规则：

1. **放不下的 override 逐条报出来，并让整个运行失败。**
   静默跳过正是要修的东西，退役脚本自己不能犯。
2. **原始 map 复制到 `settings.text_overrides_retired` 后保留。**
   什么都没删掉，判断错了可以手工恢复。

```
npm run overrides:retire            # 报告会改什么
npm run overrides:retire -- --write # 应用
```

线上部署顺序：**先跑脚本（`--write` 成功），再部署这次的代码。**
顺序反了不会丢数据（map 还在），但会有一段时间运营的改动不生效。

### 后台入口怎么变

`/admin/visual-edit.html` 保留——**图片替换还在那里**，删掉的只是文字那一半。
提示卡现在指向 `/admin/blocks.html`，并说明了区别：
改区块只影响那一个区块，不会连带改到别的页面——那正是旧机制最大的毛病
（「Learn More」在一个页面上改不动，除非十二个页面一起改）。

---

## 明确不做（会被 Phase 3 重写）

| 项目 | 原属 | 为什么不做 |
|---|---|---|
| `public/styles.css` 断点全量收敛（#10） | P2 | 只做全局断点变量；页面级媒体查询会随页面重写 |
| 30 个静态页的逐页 a11y 标记修复（#11 的一部分） | P2 | 页面本身会被区块替换；只做全局的 `:focus-visible` 与对比度 |
| 逐页补 `<picture>` 标签 | #9 | 改为步骤 2 的共享 helper |
| `background-image` 逐处改 `<img>` | #9 | 留到区块化时用 `<picture>` 区块解决 |

`#11` 中**全局**的部分（`:focus-visible` 仅出现 1 次、颜色对比度）
随步骤 3 的 token 层一起做，那部分会被继承。

---

## 进度

- [x] P0 + P1（7 个提交，已推送）
- [x] 步骤 1 — 图片回填（16.9 MB → 4.4 MB，-74%）
- [x] 步骤 2 — 共享图片渲染器（服务端渲染的图片 -76%）
- [x] 步骤 3 — 设计 token 层（0 → 19 个令牌，硬编码色 478 → 63）
- [x] 步骤 4 — 冻结 overrides（并入阶段 4，一次删掉而不是先冻结）
- [x] 步骤 5 — 工程安全网（41 条测试 + lint + CI，全绿）
- [x] 步骤 6 — 区块系统阶段 1（4 种区块，57 条测试全绿）
- [x] 阶段 2 — 支柱页迁移（11 种区块，67 条测试全绿）
- [x] 阶段 3 — 静态页迁移（25/29 页，13 种区块，80 条测试全绿）
- [x] 阶段 4 — 退役 override 机制（净删 432 行，88 条测试全绿）

**计划内的事项全部做完。** 剩下的两项都需要你先做决定，不是我能替你定的：

| 待你定夺 | 在哪 |
|---|---|
| 两个对比度不达标的颜色令牌（`--text-mute2` / `--text-mute3`） | 步骤 3 末尾 |
| 4 个明确不转区块的页面（两张表单、博客索引、404） | 阶段 3 「剩下的 3 页」 |
