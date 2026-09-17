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

## 步骤 3 — 设计 token 层（半天 ~ 1 天）

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

**验收**：改一次品牌色只需改一处；`var()` 使用数显著上升；视觉无回归。

---

## 步骤 4 — 冻结 `text_overrides`（半天）⚠️ 需要你拍板

`ARCHITECTURE_BLOCKS.md:225-230` 标注这是**唯一有时间压力**的一步：
这套机制每多运行一天，就多积累一批以源码字符串为键的内容。

`server/routes/text-overrides.js` 的 `PUT`（26 行）/ `PATCH`（54 行）目前仍开放。

**为什么需要拍板**：冻结会让后台的「可视化文字编辑」降级为只读。
如果运营正在用它改文案，必须先有替代路径（即 Phase 1 的区块编辑器）再切换。

**待确认**：线上 `settings.text_overrides` 实际积累了多少条、最后更新时间。

---

## 步骤 5 — 工程安全网（2 ~ 3 天）

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

---

## 步骤 6 — 区块系统阶段 1（1 ~ 2 周）

见 `ARCHITECTURE_BLOCKS.md` 第三、四节。

区块注册表 + 服务端渲染器 + 后台区块编辑器，**只实现 3 种区块类型**
（`hero` / `rich_text` / `faq`），在**一个**页面上跑通。目的是验证模型，不是铺量。

此时步骤 2 的 `image-render.js` 直接成为区块 `render()` 的图片输出层。

后续阶段 2 / 3 / 4 见架构文档。

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
- [ ] 步骤 3 — 设计 token 层
- [ ] 步骤 4 — 冻结 overrides（待拍板）
- [ ] 步骤 5 — 工程安全网
- [ ] 步骤 6 — 区块系统阶段 1
