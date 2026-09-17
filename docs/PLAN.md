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

## 步骤 1 — 图片回填（半天）

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

**验收**：seed 目录产出变体文件；总体积下降可量化；原图保留为兜底。

---

## 步骤 2 — 共享图片渲染器（1 天）⭐ 关键一步

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

**验收**：首屏图片体积下降可量化；SSR 输出含 `<source type="image/avif">`；
无变体时优雅回退到原 `src`。

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
- [ ] 步骤 1 — 图片回填
- [ ] 步骤 2 — 共享图片渲染器
- [ ] 步骤 3 — 设计 token 层
- [ ] 步骤 4 — 冻结 overrides（待拍板）
- [ ] 步骤 5 — 工程安全网
- [ ] 步骤 6 — 区块系统阶段 1
