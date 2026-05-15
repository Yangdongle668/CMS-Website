# Operations Guide

Practical "how do I do X" reference for running the Battery CMS in
production. For architecture and feature overview see `README.md`; for the
full feature changelog see `git log` (versions are tagged v18 through v31
in commit messages).

---

## 1. First-time deploy

```bash
git clone <repo> && cd CMS-Website
cp .env.example .env                 # if present; otherwise see docker-compose.yml
# edit .env: set JWT_SECRET, COOKIE_SECRET, SMTP_*, TURNSTILE_*, PUBLIC_URL, SITE_NAME
docker compose up -d                 # brings up db + app + backup containers
docker compose logs -f app           # watch boot + autoMigrate + retention sweep + mail-worker
```

Open `https://<your-host>/admin/login.html`. **The first POST to /login with
an unknown email creates the admin** — there's no default password. Use a
real email and a >=8-char password; the account is bootstrapped automatically.

After login, go to `/admin/settings.html` and set: site name, sales email,
default OG image, Cookie categories, mail subject prefix, GDPR retention
days.

---

## 2. Daily content operations

### Add a new content page (e.g. `/solutions/storage`)

1. `/admin/pages.html` → `+ 新建页面`
2. Pick a starter template (Blank / Product / Application / Company / RFQ)
3. Enter the URL path: `solutions/storage` (no leading `/`, no `.html`)
4. Edit blocks in the left panel; preview updates live on the right
5. Top right: status to **Published**, then **保存** (or `Ctrl/⌘+S`)

### Edit an existing page

`/admin/pages.html` → click the page → drag blocks to reorder, click ✎ to
edit content, click ✕ to delete. `Ctrl/⌘+S` saves. Browser warns before
navigation if there are unsaved changes.

### Undo a bad edit

In the page builder topbar: **⏱ 历史** → list of every save snapshot →
**预览** any version in the right pane → **回滚到此** writes it back to
the live row. The current state is snapshotted first, so the rollback
itself is reversible.

Articles have the same button in `/admin/articles.html`.

### Add a blog article

`/admin/articles.html` → `+ 新建文章` → fill slug + title + content.
Bind to a pillar via the dropdown to get the SEO crosslink. Set status to
**published** + Save. The article appears on `/blog/` and on its pillar
page's "Related Insights" within ~60s (block-shell slug cache TTL).

### Upload an image

Anywhere a block has an image field: click 📁 → drag a file into the
drop-zone OR click "select" → fill the alt-text prompt (required) →
sharp generates 400/800/1200/1600 widths + WebP twins automatically.
Future references to this image use `<picture>` with `srcset`.

### Edit site-wide settings

`/admin/settings.html` covers: site name, logo, header/footer nav (JSON),
sales contact info, social links, GDPR config, SMTP behaviour. Use
`Ctrl/⌘+S` to save. The mail tab also has a **send test email** button
to verify SMTP works before relying on it for inquiries.

---

## 3. Inquiry management

### Daily workflow

`/admin/inquiries.html` lists every RFQ. Click a row to expand:

- **Status pills**: new / read / replied / archived / spam. Updates audit
  log.
- **Mail delivery pill**: shows whether the internal notification + the
  customer auto-reply actually went out (sent / pending / sending / dead).
- **Outbox sub-table** in detail view shows each individual email, retry
  count, last SMTP error. Per-row **重发** button re-queues.

### "Mail delivery failed" banner appears

Top of `/admin/inquiries.html` shows ⚠️ when there are dead or retrying
mails. Click the link to **设置 → 邮件**:

1. Check SMTP host/user/pass in `.env` (they're not in DB).
2. Hit **发测试邮件** to validate.
3. If credentials are correct, **重试所有失败邮件** to flush the queue.

### Export inquiries

Top-right of the inquiries page: **导出 CSV** — includes reference,
status, name, email, company, country, capacity_need, annual_volume,
application, message. UTF-8 BOM so Excel doesn't garble accents.

---

## 4. Recovery & backups

### Where backups live

`docker compose ps` shows a `backup` container running. It runs
`scripts/backup.sh` in a loop:

- **Every 24h** (configurable via `BACKUP_INTERVAL_SECONDS` env)
- pg_dump → `/backups/<db>-<timestamp>.sql.gz` inside the `backups`
  Docker volume
- Prunes anything older than 14 days (`BACKUP_RETAIN_DAYS`)

Inspect available backups:

```bash
docker compose exec backup ls -lh /backups
```

### Restore the database

```bash
./scripts/restore.sh                       # newest backup
./scripts/restore.sh 20260515-030001       # specific timestamp prefix
```

The script stops the `app` container while psql streams the dump back, so
no half-written rows can sneak in. It restarts the app on exit. The
restore takes ~20s on the seed dataset.

### Restore a single page (not the whole DB)

Use the in-app version history (`⏱ 历史` button) — that's faster than a
full DB restore and only touches the one page.

---

## 5. Health / monitoring

| Endpoint | Returns | Use |
|---|---|---|
| `GET /api/health` | `200 {ok:true, uptime_s}` | Docker / k8s liveness probe |
| `GET /api/ready`  | `200 {ok:true, db_latency_ms}` or `503` if DB down | Load balancer readiness |
| `GET /api/mail-queue/stats` (auth) | pending / sending / sent_24h / retrying / dead | Mail queue dashboard |

Logs:

```bash
docker compose logs -f app       # express, autoMigrate, retention sweep
docker compose logs -f backup    # nightly dump output
docker compose logs db           # postgres
```

---

## 6. Security operations

### Account got locked out

The auth ladder is **3 failures → 5 min, 5 → 60 min, 8 → 24 h**. To
manually clear a lock:

```sql
UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = 'foo@bar.com';
```

### Rotate the JWT secret

Set `JWT_SECRET` in `.env` to a fresh long random string, then
`docker compose restart app`. Everyone is logged out and forced to log in
again. Use this if you suspect a session was leaked.

### Compromised admin password

`/admin/users.html` → click user → set new password. Or via SQL with a
fresh bcrypt hash (`node -e "console.log(require('bcrypt').hashSync('newpw', 10))"`).

### View audit log

`/admin/audit.html` shows every admin write: who, what entity, when, IP
hash, detail JSON. Retained 2 years (auto-purged by the retention sweep).

---

## 7. Common dev tasks

### Add a new block type

1. **Renderer**: `public/render.js` — add the new entry inside
   `BLOCK_RENDERERS`. Use the `h()` and `safeUrl()` / `safeImg()`
   helpers — never interpolate operator-supplied text without escaping.
2. **Allowlist**: `server/routes/pages.js` — append to
   `ALLOWED_BLOCK_TYPES`.
3. **Admin**: `admin/assets/js/page-builder.js`:
   - Add to `BLOCK_TYPES` (name, icon, desc, `enabled: true`)
   - Add a `DEFAULTS.<type>()` returning seed data
   - Add a `blockSummary` case (one-line listing label)
   - Add a `FORMS.<type>` rendering the edit drawer using
     `fieldText` / `fieldImage` / `fieldLink` / `fieldSelect` /
     `fieldStringList` / `fieldObjectList` / `fieldBg` helpers.

Bump cache query string `?v=N → v=N+1` across `public/` + `admin/` so the
new code is fetched on first reload.

### Add a new content page slug

If it's editable through the builder: just create it in
`/admin/pages.html`. The block-shell catch-all handler will serve it.

If it needs a custom static layout: drop a new HTML file into `public/`
under the desired path. `express.static` runs before the block-shell, so
the static file wins.

### Migrate an existing static page to blocks

1. Open `server/db/migrate-pages-to-blocks.js`.
2. Add a `function fooBlocks() { ... }` returning the block array.
3. Register it in `MIGRATIONS` under the page's slug.
4. Delete the static `public/foo.html`.
5. Restart server — autoMigrate runs the migration once if the row's
   `blocks` is still empty.

### Build a feature behind a fork

```bash
git checkout -b feature/<your-thing>
# work
git push -u origin feature/<your-thing>
# PR against main
```

`docker compose up --build` rebuilds the image; you usually don't need to
because the app code is mounted from the host.

---

## 8. Troubleshooting cheatsheet

| Symptom | Likely cause | Fix |
|---|---|---|
| **Login button does nothing** | Cookie marked Secure but site is plain-HTTP | Set `FORCE_HTTPS=false` in `.env` or actually serve over HTTPS |
| **Inquiry submitted but no email** | SMTP creds wrong, queue stuck | `/admin/settings.html` → 邮件 → 发测试邮件; check `/admin/inquiries.html` mail status pill |
| **Page edit not visible on site** | Slug cache hasn't busted | Wait 60s or restart app; or re-save the page (saves bust the cache) |
| **/about/profile shows "Loading…"** | block-shell can't reach the API | Check `/api/pages/by-slug/about/profile` directly; check DB connectivity via `/api/ready` |
| **Operator deleted a page section** | Version history exists | `⏱ 历史` → preview previous version → restore |
| **Slow homepage** | Image variants not generated | New uploads run sharp automatically; old Unsplash URLs don't have variants (that's fine — they have their own CDN) |
| **5xx on /api/pages save** | Block schema violation | Check `docker compose logs app` — sanitiseBlocks() drops unknown types silently, but bad JSON causes a 5xx |
| **Visitor inquiry returns "persist_failed"** | DB is down or out of disk | Check `/api/ready`; check disk on the host |

---

## 9. Where to look

| What | Path |
|---|---|
| Public site shell + render | `public/_block-shell.html`, `public/render.js` |
| Public static assets | `public/styles.css`, `public/script.js`, `public/partials.js` |
| Admin shell + helpers | `admin/assets/js/admin.js`, `admin/assets/css/admin.css` |
| Page builder | `admin/pages.html` + `admin/assets/js/page-builder.js` |
| Preview iframe (admin) | `admin/preview-shell.html` |
| Block renderers | `public/render.js` (one entry per block type) |
| Block migrations | `server/db/migrate-pages-to-blocks.js` |
| Server entry | `server/index.js` (Express bootstrap + middleware + routes) |
| Schema + auto-migrations | `server/db/schema.sql` + autoMigrate() in `server/index.js` |
| Mail outbox worker | `server/jobs/mail-worker.js` |
| Backup / restore scripts | `scripts/backup.sh`, `scripts/restore.sh` |

---

## 10. Known limitations

- **No multi-tenancy** — single site per deployment. Spin up another
  `docker compose` stack with a different domain for a second site.
- **No localisation** — content is single-language. Adding i18n means
  schema changes (per-locale block JSON) plus rendering changes.
- **No image cropping in admin** — the upload pipeline generates widths,
  not aspect-ratio variants. Operators upload the final crop.
- **No scheduled publishing** — `status='draft'` or `published`, no
  `published_at = future`. Easy to add but not built.
- **No CRM integration** — inquiries stay in the CMS only. Export CSV
  → import to Salesforce / HubSpot as needed.
