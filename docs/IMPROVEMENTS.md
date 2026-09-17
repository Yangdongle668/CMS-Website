# 改进事项清单

> 生成日期：2026-09-17
> 范围：全仓库代码审查（安全 / 性能 / 前端 / 工程化）
> 说明：本清单中每一条都经过实际验证（读代码 + 运行命令确认），
> 未经验证的猜测不列入。已排除的误报见文末附录。

---

## P0 — 安全，上线前必须修

### 1. 默认弱密钥导致管理员身份可被伪造

**位置**

| 文件 | 行 | 内容 |
|---|---|---|
| `server/middleware/auth.js` | 9 | `process.env.JWT_SECRET \|\| 'dev-secret'` |
| `server/middleware/auth.js` | 36 | `jwt.verify(token, process.env.JWT_SECRET \|\| 'dev-secret')` |
| `server/index.js` | 105 | `cookieParser(process.env.COOKIE_SECRET \|\| 'dev-cookie-secret')` |
| `docker-compose.yml` | 69 | `JWT_SECRET: ${JWT_SECRET:-please-change-this-very-long-random-string}` |
| `docker-compose.yml` | 71 | `COOKIE_SECRET: ${COOKIE_SECRET:-please-change-this-too-please}` |
| `docker-compose.yml` | 20 | `POSTGRES_PASSWORD: ${PGPASSWORD:-postgres}` |
| `docker-compose.yml` | 73 | `ADMIN_DEFAULT_PASSWORD: ${ADMIN_DEFAULT_PASSWORD:-ChangeMe!2026}` |

**为什么严重**

README 第 2 节主推「一行命令部署」（`git clone && docker compose up -d`，无需 `.env`）。
照此部署出来的站点，JWT 签名密钥就是开源仓库里的公开字符串，任何人都可以自行签发
`role: admin` 的 token 直接进入后台。数据库密码为 `postgres`，默认管理员密码也公开在 README 中。

经 grep 确认：`server/index.js` 中**没有任何** `NODE_ENV === 'production'` 启动校验。

**怎么改**

1. 删除 `auth.js:9`、`auth.js:36`、`index.js:105` 的 `||` 兜底值，不再提供默认值。
2. 在 `server/index.js` 启动最前面加入强制校验：

```js
const REQUIRED = ['JWT_SECRET', 'COOKIE_SECRET', 'PGPASSWORD'];
const WEAK = new Set([
  'dev-secret', 'dev-cookie-secret', 'postgres', 'ChangeMe!2026',
  'please-change-this-very-long-random-string', 'please-change-this-too-please',
]);
for (const k of REQUIRED) {
  const v = process.env[k];
  if (!v || WEAK.has(v) || v.length < 32) {
    throw new Error(`FATAL: ${k} 未设置或仍为默认弱值，拒绝启动`);
  }
}
```

3. `docker-compose.yml` 改用 compose 原生的必填语法：`${JWT_SECRET:?必须在 .env 中设置}`。
4. 为保留「一行部署」体验：在 `docker-entrypoint.sh` 中检测密钥缺失时自动生成随机值并
   持久化到命名卷，首次启动打印到日志。

**验收**：不带 `.env` 执行 `docker compose up`，容器应拒绝启动并打印明确原因。

---

### 2. SVG 上传 + 静态服务 = 存储型 XSS

**位置**

| 文件 | 行 | 内容 |
|---|---|---|
| `server/routes/media.js` | 17-19 | `ALLOWED` 集合包含 `'image/svg+xml'` |
| `server/routes/media.js` | 53-56 | `fileFilter` 校验 `file.mimetype`（**客户端可伪造**） |
| `server/routes/media.js` | 29 | 扩展名取自 `path.extname(file.originalname)`，仅截断长度，未按 mime 校正 |
| `server/services/image-processor.js` | 125-131 | `shouldProcess` 跳过 `SKIP_MIME`，SVG 不经 sharp 重编码 |
| `server/index.js` | 297 | `app.use('/uploads', express.static(...))` 原样对外提供 |

**为什么严重**

SVG 文件内可包含 `<script>`。浏览器直接访问 `/uploads/x.svg` 时会执行其中的脚本，
且与后台同源，可以管理员身份调用全部 106 个 API。

叠加风险：`fileFilter` 校验的是客户端声明的 `Content-Type`。上传 `payload.html` 并把
`Content-Type` 伪造为 `image/png`，文件会以原名落盘并从 `/uploads/payload.html` 提供。
（helmet 的 `nosniff` 能挡住假扩展名的情形，但挡不住 SVG——`image/svg+xml` 本就是其正确类型。）

**怎么改**（三项建议全做）

```js
// A. 扩展名由 mime 决定，不信任原始文件名
const EXT_BY_MIME = {
  'image/png': '.png', 'image/jpeg': '.jpg',
  'image/webp': '.webp', 'image/gif': '.gif', 'application/pdf': '.pdf',
};
const ext = EXT_BY_MIME[file.mimetype];
if (!ext) return cb(new Error('file_type_not_allowed'));

// B. SVG 二选一：移出 ALLOWED，或入库前用 svgo/DOMPurify 剥离 <script> 与 on* 属性

// C. /uploads 增加防御头（server/index.js:297）
app.use('/uploads', express.static(path.join(ROOT, 'uploads'), {
  maxAge: '30d', immutable: false, index: false,
  setHeaders: (res) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));
```

**附带修正**：`server/index.js:296` 的注释写 "Uploads use UUID-style filenames"，
但 `media.js:26-30` 的实际策略是保留操作员原文件名。注释已过期，且正是这个不一致造成了上述风险。

---

### 3. 依赖漏洞（`npm audit` 实测：1 critical / 8 high / 3 moderate）

| 包 | 锁定版本 | 严重度 | 说明 |
|---|---|---|---|
| `tar`（经 `bcrypt` → `@mapbox/node-pre-gyp`） | ≤7.5.20 | **critical** | 多个路径穿越 / 软链接投毒 |
| `axios`（间接） | 1.0–1.17 | high | 原型污染、`maxBodyLength` 绕过 |
| `form-data` | 4.0.0-4.0.5 | high | CRLF 注入 |
| `brace-expansion` | ≤1.1.17 | high | DoS |
| `ip-address`（经 `geoip-lite`） | ≤10.3.0 | high | SSRF / XSS |
| `body-parser` | ≤1.20.6 | moderate | DoS |
| `multer` | 1.4.5-lts.2 | — | 1.x 线已 EOL，官方要求升 2.x |
| `sharp` | 0.33.5 | — | 建议升 0.35.x |

**怎么改**

1. 先执行 `npm audit fix`（axios / body-parser / form-data / brace-expansion 为无痛升级）。
2. 再单独评估三个 breaking 升级：
   - `multer@2` — API 基本兼容，优先做
   - `bcrypt@6` 或换 `bcryptjs` — 顺带去掉 node-gyp 编译依赖，Docker 镜像可显著减小
   - `sharp@0.35` — 需回归测试 `server/services/image-processor.js`

---

## P1 — 性能与信息泄露

### 4. 错误详情无条件返回给所有客户端

**位置**：`server/index.js:390-393`

```js
detail: isApi && err && err.message ? err.message + detail : undefined,
```

无环境判断。Postgres 报错信息（含列名、约束名，有时含 SQL 片段）会原样返回给**任何**
API 调用方，包括公开的 `/api/inquiries` 提交接口。

**怎么改**：代码注释说明此设计是为了后台 toast 提示友好，因此按登录态区分而非直接关闭：

```js
const showDetail = process.env.NODE_ENV !== 'production' || Boolean(req.user);
detail: isApi && showDetail ? err.message + detail : undefined,
```

### 5. `/admin/list` 无分页

**位置**：`server/routes/articles.js:100-109`

带 3 个 `LEFT JOIN` 且无 `LIMIT`。文章量增长后后台列表页会持续变慢。

**怎么改**：加 `LIMIT/OFFSET`（复用 `clamp()`），响应中返回 `total`。

### 6. 上传时同步阻塞 I/O

**位置**：`server/routes/media.js:38`

multer 的 `filename` 回调中用 `fs.existsSync` 同步循环最多探测 999 次，阻塞事件循环。

**怎么改**：改用 `fs.promises.access`，或直接以内容哈希作为文件名（同时天然去重）。

### 7. 询盘搜索无法走索引

**位置**：`server/routes/inquiries.js:333-336`

```js
`(email ILIKE $n OR company ILIKE $n OR full_name ILIKE $n OR reference ILIKE $n)`
```

4 个 `ILIKE '%...%'` 前后通配，普通 B-tree 索引无效，数据量上来会全表扫描。
同时该表还按 `created_at DESC` 与 `score DESC` 排序、按 `status` 过滤。

**怎么改**：

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_inquiries_search ON inquiries
  USING GIN ((email || ' ' || company || ' ' || full_name || ' ' || reference) gin_trgm_ops);
CREATE INDEX idx_inquiries_status_created ON inquiries (status, created_at DESC)
  WHERE is_deleted = FALSE;
```

上线前用 `EXPLAIN ANALYZE` 验证实际收益。

---

## P2 — 前端与 UI

### 8. 前台没有设计系统（后台有）

| | `admin/assets/css/admin.css` | `public/styles.css` |
|---|---|---|
| `:root` 令牌定义 | ✅ 有（第 7 行起，分组完整） | ❌ **完全没有** |
| `var()` 使用次数 | 318 | **9** |
| 硬编码十六进制颜色 | 50 | **478** |
| 文件行数 | 1154 | **4498** |

后台已有一套规范的 token 系统（`--brand`、`--brand-hover`、`--surface-2`、`--border-strong` 等），
但前台完全没有使用。改一次品牌色需手动修改数百处。

**注意**：缺少设计系统的恰恰是面向客户、决定 SEO 与转化的那一半。

**怎么改**

1. 在 `public/styles.css` 顶部建立 `:root`，命名直接复用 `admin.css` 的既有约定。
2. 用频次排序确定替换优先级：
   ```bash
   grep -oE "#[0-9a-fA-F]{6}" public/styles.css | sort | uniq -c | sort -rn | head -20
   ```
   前 15 个颜色预计可覆盖 400+ 处。可脚本化一次性完成。
3. 完成后 dark mode 才具备可行性（当前 4498 行硬编码状态下等同重写）。

### 9. 图片是首屏性能的主要拖累

```
public/assets/img/seed/      16MB    全 JPG，无 WebP / AVIF
public/assets/img/logo.png   1.1MB   单个 logo
最大单张 jpg                 1020KB
```

另有 **12 处内联 `background-image`**（`public/index.html:35, 76, 90, 104, 134, 147, 160, 173, 186, 199` 等）。
背景图无法使用 `srcset`、无法进入 `<picture>`、无法 `loading="lazy"`、无法被 `<link rel=preload>` 预取——
手机与 4K 桌面下载同一张大图。

**怎么改**

1. `logo.png` 转 SVG，或压缩至 20KB 以内。
2. 项目已依赖 `sharp`，写脚本批量生成 `.webp` + 三档尺寸（480 / 960 / 1440），`<picture>` 内 fallback 到 jpg。
3. 首屏 hero 背景图改为真实 `<img>` / `<picture>`，配 `fetchpriority="high"`；折叠线以下改 `loading="lazy"`。

预计首屏体积可减少 60–70%。

### 10. 响应式断点碎片化

`public/styles.css` 中有 12 个不同的 `@media`，其中 `480/520`、`600`（两次）、`700`（两次）、
`1000/1100/1200` 明显是不同时期叠加的。

**怎么改**：收敛为 4 个标准断点（480 / 768 / 1024 / 1280），定义为 CSS 变量统一引用。

### 11. 焦点样式覆盖不足（EAA 合规相关）

`:focus-visible` 在 `public/styles.css` 与 `admin/assets/css/admin.css` 中**各仅出现 1 次**。
键盘用户在多数交互元素上看不到焦点指示。

本站主打欧洲市场且 README 专章说明 GDPR 合规——欧洲无障碍法案（EAA）已于 2025 年生效，
B2B 网站在适用范围内。建议按 WCAG 2.2 AA 做一轮完整的焦点与对比度检查。

---

## P3 — 工程化（决定前面所有项改完敢不敢部署）

当前状态：

- **零测试** — 全仓库无 `.test.js` / `.spec.js`
- **零 CI** — 无 `.github/` 目录
- **零 lint/format** — 无 ESLint、Prettier、EditorConfig

对照规模：**106 个 API 端点、11245 行后端代码、8904 行前端 JS/CSS、55 个 HTML 页面**。

这不是某个 bug，而是结构性风险：目前每次改动都无法验证是否破坏了既有功能。

**怎么改（按顺序）**

1. Prettier + ESLint + `.editorconfig`，配 `npm run lint` — 约半天
2. 对三条关键链路补集成测试：`auth`（登录/鉴权）、`inquiries`（询盘落库+邮件）、`gdpr`（DSAR 导出/删除）— 2 天
3. GitHub Actions：push 时跑 lint + test + `npm audit` — 半天

---

## 建议执行顺序

| 阶段 | 事项 | 预估 |
|---|---|---|
| **第 1 周** | #1 密钥强制校验 · #2 SVG/上传加固 · #3 `npm audit fix` | 1.5 天 |
| **第 2 周** | #9 图片压缩+WebP · #4 错误详情分级 · #5 分页 · #6 异步 I/O | 2 天 |
| **第 3 周** | #8 前台 token 系统 · #7 索引优化 · #10 断点收敛 | 3 天 |
| **第 4 周** | #11 无障碍检查 · P3 工程化全套 | 3 天 |

P3 看似最不紧急，但它决定前面所有改动的可部署信心，不宜无限后延。

---

## 附录：审查中出现的误报（已排除）

自动化审查曾报出以下问题，经逐条验证**均不成立**，记录在此避免后续重复排查或误改：

| 报告结论 | 验证结果 |
|---|---|
| `inquiries.js:425` 模板字面量存在 SQL 注入 | **不成立**。`clamp()`（`server/utils/validate.js:17-21`）为 `parseInt` + `Math.max/min`，返回值必为 1–365 的整数，无法拼入任何字符。属反模式，非漏洞 |
| `where.join(' AND ')` 存在注入风险 | **不成立**。`inquiries.js:327-337` 每个条件均使用 `$N` 占位符；`orderBy` 为白名单三元表达式，不接受用户输入 |
| `products.js` 存在 N+1 查询 | **不准确**。实为缓存未命中时的 2–3 次顺序查询。已 grep 全部 `routes/` 与 `services/`，**无任何循环内 await 查询** |
| inquiries 缺少事务，应加 BEGIN/ROLLBACK | **方向相反**。`inquiries.js:302-305` 注释表明这是刻意设计：加事务后一旦 outbox 插入失败会连带回滚已收到的询盘。B2B 场景下丢线索的代价远高于邮件延迟，现行做法正确 |
| 所有 `<img>` 缺 `width`/`height`，导致 CLS | **完全错误**。`public/` 下 26 个 `<img>`，**26 个有 `width`、26 个有 `loading`、26 个有 `alt`，覆盖率 100%** |
| `admin.js:107` 的 `el()` 存在 XSS 风险 | **夸大**。`innerHTML` 仅在显式传入 `html` 键时使用（刻意的逃生舱），children 全部经 `document.createTextNode`；`escapeHtml` 定义于第 122 行且在第 217-332 行的模板插值中一致使用。已扫描全部 admin JS 插值，其余均为数字与静态字符串 |
