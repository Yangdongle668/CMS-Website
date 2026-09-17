# 改进事项清单

> 生成日期：2026-09-17
> 范围：全仓库代码审查（安全 / 性能 / 前端 / 工程化）
> 说明：本清单中每一条都经过实际验证（读代码 + 运行命令确认），
> 未经验证的猜测不列入。已排除的误报见文末附录。

---

## P0 — 安全，上线前必须修

### 0. 全新部署根本起不来 — ✅ 已完成（做 #5 时意外发现）

**这条不在原始审查范围内**，是搭本地 Postgres 做 #5 验证时撞上的：
在一个全新的空数据库上执行 `npm run db:init`，**直接失败**：

```
[db:init] applying schema...
error: relation "analytics_hits" does not exist
```

**成因**：两个独立提交造成的错配。

| | 位置 | 引入提交 |
|---|---|---|
| `analytics_hits` 的 `CREATE TABLE` | `server/index.js:496`（应用**启动时**才跑的自愈迁移） | `d5e88ea` |
| 该表上的两个索引 | `server/db/schema.sql:417-421` | `0689a24` |

`schema.sql` 先于应用启动执行，此时表还不存在，建索引失败。
node-postgres 的多语句查询是隐式事务，一条失败整体回滚并抛出。

**为什么影响严重**：`Dockerfile:68` 是

```dockerfile
CMD ["sh", "-c", "node server/db/init.js --seed && node server/index.js"]
```

`&&` 意味着 **db:init 失败则应用永远不启动**。也就是说空数据卷跑
`docker compose up -d`（README 主推的「一行部署」）会直接起不来。
既有部署感知不到，是因为它们的卷里早就有这张表了。

**怎么改**：把 `CREATE TABLE IF NOT EXISTS analytics_hits` 补进 `schema.sql`，
放在其索引之前。`server/index.js` 里那份保留不动——两处都是 `IF NOT EXISTS`，
谁先跑谁生效，另一处成为空操作，老部署的升级路径不受影响。

**验证**：在全新数据库上重跑 `npm run db:init --seed`，schema、
2026-q2-seo 迁移、seed、cover-url 回填、applications 迁移、localize-images、
SEO/GEO 默认值全部依次成功。

### 1. 默认弱密钥导致管理员身份可被伪造 — ✅ 已完成

**实际实现与原计划的差异**（两处，均为验证后的调整）：

1. **未采用「缺失即拒绝启动」，改为「首次启动自动生成并持久化」。**
   新增 `server/config/secrets.js`：`JWT_SECRET` / `COOKIE_SECRET` 按
   「显式 env → 数据卷中已持久化的值 → 新生成并落盘」顺序解析。
   已知占位符（含本仓库历史上出现过的全部默认值）一律视为未提供。
   这样既消除了共享密钥，又完整保留了 README 的「一行部署」承诺。
   持久化失败时**抛错拒绝启动**——否则每次重启换密钥会静默登出所有管理员。

2. **`PGPASSWORD` 改为警告而非硬失败。** 原因：`docker-compose.yml` 的 db 服务
   未发布端口，Postgres 仅在 compose 内网可达；且数据卷已用旧密码初始化，
   应用自身无法轮换。硬失败会让所有既有部署在更新后无法启动，代价大于收益。

3. **`ADMIN_DEFAULT_PASSWORD` 默认值直接移除**，交还给
   `server/routes/auth.js:20-41` 已有的「首次登录自举管理员」逻辑——
   该逻辑的注释本就写明是为消除默认密码陷阱，此前被 compose 的默认值抵消了。

**变更文件**：`server/config/secrets.js`（新增）· `server/middleware/auth.js`
· `server/index.js` · `docker-compose.yml` · `.env.example` · `README.md`

**验证**：12 项单元断言全通过（生成/复用/拒绝占位符/拒绝短值/采用合法值/
权限 0600/持久化失败抛错）；真实启动确认走通；JWT 闭环确认
`dev-secret` 与 compose 旧占位符伪造的 token 均被拒绝，且重启后会话不丢失。

<details>
<summary>原始问题记录</summary>

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

</details>

---

### 2. 上传 + 静态服务 = 存储型 XSS — ✅ 已完成

**审查时漏掉的更严重入口**：修复过程中发现 `server/routes/inquiries.js:87` 的
`POST /api/inquiries/upload` **没有 `requireAuth`**——这是访客提交 RFQ 附件用的
公开接口，同样从客户端文件名取扩展名。也就是说**匿名访问者**即可把
`x.html` 以 `Content-Type: text/plain` 上传到 `/uploads/inquiries/`，
从本站同源提供。这比原记录的「需要管理员权限才能利用的 SVG」严重一个量级。

**实际实现**（新增 `server/services/upload-guard.js`，三层防御）：

1. **响应头是真正的边界**（`server/index.js`）。按文件类型分级：
   `.svg`/`.html`/`.xml` 等可执行类型加 `default-src 'none'; sandbox`
   （落入不透明源、禁用脚本）；图片与 PDF 仅加 `default-src 'none'`，
   以免 PDF 无法内联预览——PDF 自身的脚本触及不到我们的 DOM 与 Cookie。
   扩展名匹配范围**故意宽于**当前允许上传的类型，以覆盖修复前已存在于卷中的文件。
2. **扩展名由声明类型决定，绝不取自客户端文件名**（两个上传入口均已改）。
3. **写盘后用魔术字节校验内容与声明类型是否一致**，不符则删除并返回 400。
   `text/plain` / `text/csv` 无可靠签名，跳过字节校验——但扩展名已被强制，
   加上第 1 层，仍然是惰性的。

SVG 另做保守清洗（剥离 `<script>`、`on*`、`javascript:`、`foreignObject`、
外部 `<use>`、SMIL 事件赋值）。**清洗是纵深防御而非边界**：SVG 是 XML 方言，
正则不可能穷尽。文本匹配挡不住 `j&#97;vascript:`，因此实现上是
**先解码实体、去除可忽略空白，再判断 scheme**，命中则删除整个属性。

**变更文件**：`server/services/upload-guard.js`（新增）· `server/routes/media.js`
· `server/routes/inquiries.js` · `server/index.js`

**顺带完成**：原 #6（`fs.existsSync` 同步阻塞循环）——正好在重写的同一段代码里，
已改为 `fsp.access` 异步探测，不再单列。

**验证**：30 项单元断言（扩展名映射、7 种魔术字节、伪造类型拦截、
8 类 SVG 逃逸向量、正常 logo SVG 不被破坏）；真实 HTTP 端到端：
伪装 PNG 的 HTML → 400；声明 text/plain 的 HTML → 落盘为 `.txt`；
真实 PNG → 正常；并逐一确认四类文件的响应头分级正确。

**遗留运维项**：修复前已上传到卷中的文件仍保留原扩展名。第 1 层已覆盖，
但建议部署后执行一次 `ls uploads/ | grep -iE '\.(html?|svg|xml)$'` 人工复核。

<details>
<summary>原始问题记录</summary>

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

</details>

---

### 3. 依赖漏洞 — ✅ 已完成（12 → **0**）

**最终结果**：`npm audit --omit=dev` 报告 `found 0 vulnerabilities`。

| 包 | 原版本 | 现版本 | 说明 |
|---|---|---|---|
| `bcrypt` | 5.1.1 | **6.0.0** | 连带移除 `@mapbox/node-pre-gyp` 与 `tar`，critical 链整条消失 |
| `multer` | 1.4.5-lts.2 | **2.4.0** | 1.x 线 EOL |
| `sharp` | 0.33.5 | **0.35.4** | libvips CVE |
| `nodemailer` | 6.10.1 | **10.0.10** | SMTP 命令注入（经查我们未使用 `envelope` 参数，路径不可达，仍升级） |
| `geoip-lite` | 1.4.10 | **2.0.3** | `ip-address` SSRF/XSS |
| `axios` / `form-data` / `brace-expansion` / `body-parser` | — | — | `npm audit fix` 无痛升级 |
| `qs` | 6.14.2 | **6.16.0** | 经 express 4 传递依赖，`audit fix` 拿不下来，改用 `package.json` 的 `overrides` 钉住 |

**顺带收益**：`npm install` 净移除 **71 个包**（bcrypt 6 改用预编译二进制，
不再需要 node-gyp 编译链）——Docker 镜像体积和构建时间都会明显下降。

**验证**（21 项断言）：

- **bcrypt 向后兼容是本次最大风险点**，用真实的 bcrypt 5.1.1 生成哈希再用
  6.0.0 验证，ASCII / 含符号 / 非拉丁字符三种密码全部通过，错误密码全部被拒。
  **现有管理员密码不受影响。**
- `sharp` 0.35 的 `metadata`/`resize`/`webp`/`avif`/`jpeg` 全部可用；
  跑通 `image-processor.process()` 真实管线，产出 9 个 variants、
  avif/webp/jpeg 三种 srcset。
- `multer` 2 下重跑 #2 的上传端到端测试，三种情形行为完全一致。
- `nodemailer` 10 的 `createTransport`、`geoip-lite` 2 的 `lookup` 均正常。

<details>
<summary>原始问题记录</summary>

### 原始审计结果（1 critical / 8 high / 3 moderate）

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

</details>

---

## P1 — 性能与信息泄露

### 4. 错误详情无条件返回给所有客户端 — ✅ 已完成

**改动**

1. `server/index.js` 错误处理器：`detail` 改为仅在
   `NODE_ENV !== 'production' || Boolean(req.user)` 时返回。
   已登录的管理员仍拿得到诊断信息（保留原设计意图的 toast 体验），
   本地开发不受影响，匿名调用者在生产环境下什么也拿不到。
2. `server/services/upload-guard.js` 新增 `uploadErrorHandler`，挂在两个上传路由上，
   把 multer 的 `LIMIT_*` 错误和 `fileFilter` 的拒绝映射为正确状态码。
3. **附带修正**：`.gitignore` 增加 `data/`。#1 生成的 `data/secrets.json`
   在非 Docker 运行时会落在仓库根目录——此前没有被忽略，存在误提交签名密钥的风险。

**实测对比**

| 请求 | 改动前 | 改动后 |
|---|---|---|
| 9MB 超限上传 | `500 {"error":"internal_error","detail":"File too large (LIMIT_FILE_SIZE)"}` | **`413 {"error":"file_too_large"}`** |
| `application/x-msdownload` | `500 {"error":"internal_error","detail":"file_type_not_allowed: ..."}` | **`415 {"error":"file_type_not_allowed"}`** |
| 生产 + 匿名触发 500 | 含 `detail`（曾泄露服务器绝对路径） | **`{"error":"internal_error"}`** |
| 开发模式触发 500 | 含 `detail` | 含 `detail`（不变） |

<details>
<summary>原始问题记录</summary>

**位置**：`server/index.js:390-393`

```js
detail: isApi && err && err.message ? err.message + detail : undefined,
```

无环境判断。Postgres 报错信息（含列名、约束名，有时含 SQL 片段）会原样返回给**任何**
API 调用方，包括公开的 `/api/inquiries` 提交接口。

**实测样本**（做 #3 时在公开接口上抓到的真实响应，调用者无需任何认证）：

```
POST /api/inquiries/upload
→ {"error":"internal_error",
   "detail":"ENOENT: no such file or directory, open
             '/home/user/CMS-Website/uploads/inquiries/mu5b61m097an2c-big.pdf' (ENOENT)"}
```

服务器的**绝对文件系统路径**直接回给了匿名调用者。

**怎么改**：代码注释说明此设计是为了后台 toast 提示友好，因此按登录态区分而非直接关闭：

```js
const showDetail = process.env.NODE_ENV !== 'production' || Boolean(req.user);
detail: isApi && showDetail ? err.message + detail : undefined,
```

**并入本项的追加问题：上传的用户错误返回 500**

做 #3 的回归测试时确认（既有行为，非升级引入）：

```
9MB 文件（超过 8MB 上限）  → HTTP 500 {"error":"internal_error","detail":"File too large (LIMIT_FILE_SIZE)"}
application/x-msdownload   → HTTP 500 {"error":"internal_error","detail":"file_type_not_allowed: ..."}
```

两者都是客户端错误，却走了 500 通道。multer 的 `MulterError` 和 `fileFilter`
抛出的错误直接冒泡到了 `server/index.js` 的通用错误处理器。

应在两个上传路由后各挂一个 multer 错误中间件，把
`LIMIT_FILE_SIZE` → **413**、`LIMIT_FILE_COUNT` → **413**、
类型不允许 → **415**，并返回稳定的错误码而非内部消息。

</details>

### 5. `/admin/list` 无分页 — ✅ 已完成

**范围比原记录大一处**：`server/routes/products.js:62` 有同样的问题，一并修了。
其余无 `LIMIT` 的列表端点（pillars / applications / authors / users / settings）
是天然有界的小集合（支柱 3 个、应用 ~10 个），不做处理。

**关键约束**：两个后台页面都是 `const { items } = await api(...)` 一次性全渲染，
**没有分页 UI**。只加 `LIMIT` 会让超出部分从界面里静默消失——那比现在慢一点更糟。
因此服务端与前端必须一起改。

**改动**

- 服务端：两个 `/admin/list` 加 `limit`/`offset`（复用 `clamp()`，默认 100、上限 500），
  响应返回 `{ items, total, limit, offset }`。
- 前端：`admin/assets/js/admin.js` 新增共用的 `renderPager` / `bindPager`
  （而非两个页面各写一份），`admin/articles.html` 与 `admin/products.html` 接入。
- 样式：`admin/assets/css/admin.css` 追加 `.pager`，全部使用既有设计令牌。
- **数据装得下一页时 `renderPager` 返回空字符串**，界面与改动前完全一致。

**实测数据（诚实结论：查询耗时从来不是瓶颈）**

| 场景 | 无 LIMIT | LIMIT 100 |
|---|---|---|
| 298 行查询耗时 | 0.438 ms | 0.441 ms（**无差异**） |
| 9998 行查询耗时 | 5.685 ms | 4.643 ms（快约 18%，绝对值仍很小） |
| 298 行响应体积 | 556.1 KB | **376.3 KB** |

排序仍需处理全部行才能取出前 100，所以 DB 侧收益有限。真正的价值在于
**响应体积与浏览器渲染量有界**，以及内容增长时不会无限膨胀
（后台页面是用字符串拼接逐行构建 DOM 的）。

**验证**：分页控件 14 项边界断言（装得下不渲染 / 首页末页禁用 / 页码向上取整 /
meta 缺失安全返回空）；真实 Postgres 上端到端验证 `offset=100/200/280` 取数正确、
`limit=999999` 被钳到 500、`limit=-5` 钳到 1、`offset=abc` 回退到 0。

### 6. 上传时同步阻塞 I/O — ✅ 已完成（随 #2 一并修复）

原位置 `server/routes/media.js:38`：multer 的 `filename` 回调中用
`fs.existsSync` 同步循环最多探测 999 次，阻塞事件循环。

该段代码在 #2 中被整体重写，已改为 `fsp.access` 异步探测（`findFreeName`），
行为不变但不再阻塞。

### 7. 询盘搜索无法走索引 — ✅ 已完成

**先纠正本文件原先写错的方案**：原建议是「保持查询形态不变 + 建一个
拼接表达式的 GIN 索引」。**这样索引根本不会被用到**——索引建在
`(email||' '||company||...)` 上，而查询是四个独立的 `ILIKE ... OR ...`，
Postgres 不会把两者对应起来。必须二选一：改查询形态，或建四个独立索引。

**实测两种方案**（5 万条真实规模数据）：

| 方案 | 耗时 | 索引体积 | 是否需改查询 |
|---|---|---|---|
| 四个独立 GIN 索引 | 20.058 ms | 7400 kB | 否 |
| **单个拼接表达式 GIN** | **17.316 ms** | **6352 kB** | 是 |

选后者：更快、更小、只需一个索引，且拼接搜索能跨字段匹配
（"acme berlin" 可以找到 Acme 公司的柏林联系人，原形态做不到）。

**最终收益**

| 场景 | 改动前 | 改动后 | 提升 |
|---|---|---|---|
| 选择性高（按单号找一条） | 80.657 ms | **1.088 ms** | **74×** |
| 宽泛词（匹配 20% 的表） | 78.697 ms | 16.282 ms | 4.8× |

宽泛词只能到 4.8×，是因为它匹配了 5 万行中的 1 万行——任何索引都必须取出
并排序这 1 万行，这是查询本身的性质，不是索引问题。

**另一处纠正：原先提的 `idx_inquiries_status_created` 是多余的。**
实测 `status` 过滤 + `created_at` 排序已经是 **0.051 ms**，现有的
`idx_inquiries_active_score` 已经覆盖，没有添加。

**实现上的关键决定**：`CREATE EXTENSION pg_trgm` 与索引放在
`server/index.js` 的自愈迁移里，**不放 `schema.sql`**。托管型 Postgres 可能
不给建扩展的权限，而 `schema.sql` 是单条多语句隐式事务——放那里一旦被拒
就会整体回滚、`db:init` 失败、应用起不来，正是 #0 那个坑。自愈迁移是逐条
try/catch 的，扩展建不出来时搜索退化为顺序扫描：慢，但仍然正确。

**验证**：确认路由实际构造的那条 SQL 命中索引
（`Bitmap Heap Scan`，`Heap Blocks: exact=1`，而非全表扫）；
真实 HTTP 上 5 万条数据的搜索结果正确（精确单号 1 条、宽泛词 1 万条、
邮箱 1 条、不存在的词 0 条）。

<details>
<summary>原始问题记录</summary>

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

</details>

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

**⚠️ 本条原先的前提是错的，已更正**

原文写「项目已依赖 sharp，写脚本批量生成 WebP」——这低估了现有代码。
`server/services/image-processor.js` **已经是一套完整的图片处理管线**：
AVIF + WebP + JPEG × 4 档尺寸（480 / 768 / 1280 / 1920），
已在 sharp 0.35 下实测可用（做 #3 时跑通，产出 9 个 variants）。

**真实状况**（核实结果）：

| | 实际 |
|---|---|
| 生成能力 | **已存在且可用** |
| 谁在调用 | **只有媒体上传**（`server/routes/media.js:159`、`:225` 重处理） |
| `media` 表的 `variants` / `srcset` 列 | 有数据写入 |
| 谁在读取 | **无人**。`grep srcset` 在 `ssr-detail.js` / `html-tokens.js` 均为 **0**，前台 `<img>` 只有 `src` |
| 16MB seed 图片 | 49 张 jpg，**0 个变体文件**，从未进过管线 |

**所以问题不是「没有压缩功能」，而是「有一套完整管线，产出物 100% 没人消费」。**

**怎么改**（已拆成 `PLAN.md` 的步骤 1 与步骤 2）

1. **回填**：写薄脚本调用**现有的** `imageProcessor.process()` 覆盖
   `public/assets/img/`，不新建管线。`logo.png` 单独转 SVG 或压到 20KB 内。
2. **消费**：新建 `server/services/image-render.js` 作为**共享渲染器**，
   输出带 `srcset` 的 `<picture>`，由 SSR 层调用。
   **做成 helper 而非逐页改标签**——`ARCHITECTURE_BLOCKS.md` 的 Phase 3
   会把 30 个静态页转成区块并重写其 HTML，逐页补的标签会被全部丢弃；
   共享 helper 则同时服务今天的 SSR 与将来区块的 `render()`。
3. **`background-image` 不在本条范围内**：`ssr-detail.js:67` 输出的这种形态
   结构上用不了 srcset，改它属于会被 Phase 3 重写的工作，留到区块化时
   用 `<picture>` 区块彻底解决。

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
