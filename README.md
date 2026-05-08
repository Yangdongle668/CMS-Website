# Battery CMS

B2B website + CMS for a lithium battery manufacturer. Built around three SEO **pillar pages** (Polymer Li-Po, Custom-Shaped Li-Po, Cylindrical Li-Ion), an **inquiry capture pipeline** (RFQ form → DB + SMTP) and **GDPR-compliant** data handling for the European market.

```
Frontend     :  Static HTML + CSS + vanilla JS  (industrial B2B style, black / white / deep blue)
Backend      :  Node.js + Express
Database     :  PostgreSQL  (raw SQL, no ORM)
Mail         :  Nodemailer over SMTP
Anti-spam    :  Cloudflare Turnstile + honeypot + rate limit
Auth         :  JWT in HttpOnly cookie + bcrypt
```

---

## 1. Highlights

### Pillar / Cluster SEO architecture
Three pillar pages target the head terms; technical blog articles target long-tail terms and link **up** to the pillar via `articles.pillar_id`. Each pillar page automatically renders:

- Hero, overview, variants, full spec table, applications grid, customisation block, manufacturing, certifications wall, FAQ
- "Related Insights" — latest cluster articles for the topic
- Sibling cross-links to the other two pillars
- JSON-LD `Product`, `BreadcrumbList`, `FAQPage` schema
- Inline RFQ form, pre-filled with the current pillar slug

### Inquiry / RFQ pipeline
- Public form (`/quote`, embedded on every page) with Turnstile, honeypot, GDPR consent checkbox
- Server-side validation, rate limit (5 / 5 min / IP), Turnstile re-verification
- Stores inquiry with hashed IP, UTM, source page, policy version
- SMTP fan-out: internal alert to sales + auto-reply to submitter
- Admin inbox with status pills, notes, mailto reply, CSV export

### GDPR (Article 12-22)
- Cookie banner with category opt-in (necessary / analytics / marketing) + DNT honour
- `/privacy`, `/cookies`, `/terms`, `/gdpr` legal pages
- DSAR submission with email-link verification and JSON data export
- Configurable retention / soft-delete days; nightly job purges aged data
- Full audit log of admin actions
- Hashes IPs (does not store raw IP)
- All third-party processors disclosed (Cloudflare Turnstile + SMTP host)

### Admin (minimalist white)
Dashboard · Inquiries · Pillar Pages (9-section editor) · Products · Applications · Articles · Media · GDPR Requests · Audit Log · Site Settings · Users

---

## 2. One-line Docker deployment

The fastest way to run the entire stack — Node app + PostgreSQL — with one command:

```bash
git clone https://github.com/Yangdongle668/CMS-Website.git && \
  cd CMS-Website && \
  docker compose up -d
```

That's it. Open `http://localhost:3000`. Admin at `http://localhost:3000/admin/login.html` with the default credentials below.

### What happens

- A `postgres:16-alpine` container starts and is healthchecked with `pg_isready`.
- The Node app waits for the DB to be healthy, then runs `db:init --seed` (idempotent: safe on every restart) and starts.
- DB data is persisted in the `db-data` named volume.
- Uploaded media is persisted in the `uploads` named volume.

### Default credentials (change before going live)

```
Email     : admin@example.com
Password  : ChangeMe!2026
```

### Customise via environment

Override any value by creating a `.env` file in the project root before `docker compose up`:

```bash
# .env  (compose reads this automatically)
APP_PORT=8080
PUBLIC_URL=https://battery.example.com
SITE_NAME=YourBrand Battery
PGPASSWORD=a-strong-postgres-password

JWT_SECRET=replace-with-64-chars-of-randomness
COOKIE_SECRET=replace-with-another-64-chars
ADMIN_DEFAULT_EMAIL=admin@yourdomain.com
ADMIN_DEFAULT_PASSWORD=A-Strong-Password-Here

SMTP_HOST=smtp.your-host.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=sales@yourdomain.com
SMTP_PASS=your-smtp-password
MAIL_FROM=YourBrand Sales <sales@yourdomain.com>
INQUIRY_RECIPIENTS=sales@yourdomain.com,manager@yourdomain.com

TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
TURNSTILE_SECRET_KEY=your-cloudflare-turnstile-secret-key
```

### Operations cheatsheet

```bash
docker compose up -d                # start in background
docker compose logs -f app          # follow app logs
docker compose ps                   # status
docker compose restart app          # restart only the app
docker compose down                 # stop (data preserved)
docker compose down -v              # stop + WIPE database & uploads
docker compose exec app npm run retention   # GDPR purge job
docker compose exec db psql -U postgres battery_cms   # open a psql shell
```

### Behind a reverse proxy

In production put Nginx / Caddy / Cloudflare in front for HTTPS and set:

```
PUBLIC_URL=https://your-domain.com
NODE_ENV=production
```

Then forward to `127.0.0.1:${APP_PORT:-3000}`.

---

## 3. Manual (non-Docker) setup

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 13 (a local instance is fine)
- An SMTP-capable mailbox (corporate or e.g. a Gmail App Password, optional during development)
- A Cloudflare Turnstile site & secret key (optional during development — see **Dev mode** below)

### Install

```bash
git clone https://github.com/yangdongle668/cms-website.git
cd cms-website
cp .env.example .env       # then edit .env with your values
npm install
```

### Configure `.env`

Required:

```
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=battery_cms

JWT_SECRET=<generate a long random string>
COOKIE_SECRET=<generate another>

ADMIN_DEFAULT_EMAIL=admin@example.com
ADMIN_DEFAULT_PASSWORD=ChangeMe!2026
```

For real email + bot protection in production:

```
SMTP_HOST=smtp.your-host.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=sales@example.com
SMTP_PASS=<smtp-password>
MAIL_FROM="Acme Battery <sales@example.com>"
INQUIRY_RECIPIENTS=sales@example.com,manager@example.com

TURNSTILE_SITE_KEY=<site key>
TURNSTILE_SECRET_KEY=<secret key>
```

### Initialise the database

```bash
createdb battery_cms                      # if it doesn't exist
npm run db:seed                           # creates schema + seed data + default admin
# or, no seed data:
npm run db:init
```

The script:
1. Applies `server/db/schema.sql`
2. (with `--seed`) Loads three pillar pages, applications, products, articles and default settings from `server/db/seed.sql`
3. Creates a default admin user from `ADMIN_DEFAULT_EMAIL` / `ADMIN_DEFAULT_PASSWORD`

### Run

```bash
npm run dev          # development with --watch
# or
npm start
```

Visit:

| URL | Purpose |
|---|---|
| `http://localhost:3000/` | Public website |
| `http://localhost:3000/products/polymer-lithium-battery` | Pillar page 1 |
| `http://localhost:3000/products/custom-shaped-polymer-lithium-battery` | Pillar page 2 |
| `http://localhost:3000/products/cylindrical-steel-shell-lithium-battery` | Pillar page 3 |
| `http://localhost:3000/quote` | RFQ form |
| `http://localhost:3000/gdpr` | GDPR data subject request |
| `http://localhost:3000/admin/login.html` | Admin sign-in (use `ADMIN_DEFAULT_EMAIL` / `ADMIN_DEFAULT_PASSWORD`) |
| `http://localhost:3000/sitemap.xml` | Auto-generated |
| `http://localhost:3000/robots.txt` | Auto-generated |

### Dev mode niceties

- If `TURNSTILE_SECRET_KEY` is left as the placeholder (`0x000…`), the server **skips** verification and the form accepts a `dev-bypass` token. Real Turnstile is required in production.
- If SMTP credentials are missing, mails are logged to stdout instead of sent.
- `NODE_ENV=production` enables Secure cookies and strict Turnstile / SMTP enforcement.

---

## 4. Daily operations

| Task | Where |
|---|---|
| Read & reply to inquiries | `/admin/inquiries.html` |
| Edit pillar copy / specs / FAQ | `/admin/pillars.html` |
| Add a new product (SKU) | `/admin/products.html` |
| Publish a blog article and link to a pillar | `/admin/articles.html` |
| Upload an image or PDF datasheet | `/admin/media.html` |
| Process a GDPR request | `/admin/gdpr.html` |
| Configure SMTP behaviour, retention, cookie categories | `/admin/settings.html` |
| Inspect admin actions | `/admin/audit.html` |

### Run the GDPR retention job

This script soft-deletes records past their retention window and hard-deletes records past their soft-delete grace period:

```bash
npm run retention
```

Run it nightly via cron / systemd timer:

```cron
17 3 * * *  cd /opt/cms-website && /usr/bin/npm run retention >> /var/log/cms-retention.log 2>&1
```

---

## 5. Project layout

```
server/
  index.js              Express app, security headers, route mounting
  db/
    schema.sql          PostgreSQL schema
    seed.sql            Demo content (3 pillars, applications, products, articles)
    client.js           pg connection pool
    init.js             Apply schema + seed + create default admin
  routes/
    auth.js             Login / logout / me / change-password
    pillars.js          Pillar pages (public read + admin update)
    products.js         Products under pillars
    applications.js     Applications / industries
    articles.js         Blog (cluster content)
    inquiries.js        RFQ submission, list, status, CSV export
    media.js            File uploads (multer, allow-list types)
    settings.js         Site settings (key/value JSON)
    gdpr.js             DSAR submission, verification, completion, export
    audit.js            Audit log read
    users.js            Admin users
    seo.js              robots.txt, sitemap.xml
  middleware/
    auth.js             JWT cookie auth
    audit.js            Audit recording helper
  services/
    mailer.js           Nodemailer wrapper, inquiry & DSAR templates
    turnstile.js        Cloudflare Turnstile verification
  utils/
    hash.js             SHA-256, reference IDs, random tokens
    validate.js         Type-safe request value coercion
  jobs/
    retention.js        Nightly GDPR purge

public/                 Public website (served as static + SPA-style fallback)
  index.html            Home
  products/_template.html      Pillar / product detail (slug-aware)
  applications/_template.html  Application detail
  blog/_template.html          Article detail
  blog/index.html              Blog list
  applications/index.html      Application list
  about, factory, quality, custom-solutions, contact, quote, 404, privacy, cookies, terms, gdpr  HTML pages
  assets/css/theme.css         Industrial B2B theme
  assets/js/site.js            Header/footer/cookie banner/RFQ binding
  assets/js/rfq-form.html      Reusable RFQ form snippet
  assets/img/                  Hero illustration & OG image (SVG)

admin/                  Minimalist white admin panel
  login.html, index.html, inquiries.html,
  pillars.html, products.html, applications.html, articles.html, media.html,
  settings.html, gdpr.html, audit.html, users.html
  assets/css/admin.css
  assets/js/admin.js

uploads/                User-uploaded media (gitignored)
.env.example
package.json
```

---

## 6. Pillar / Cluster authoring workflow

To extend the SEO weight of a pillar:

1. Pick a pillar (e.g. `polymer-lithium-battery`).
2. In `/admin/articles.html` → **+ New article**, write a long-tail article.
3. Set the **Topic Cluster (Pillar)** field to the pillar.
4. Inside the article body, link the relevant terms back to `/products/<pillar-slug>`.
5. Publish.

The article will:
- Show on `/blog`
- Show on the pillar page's "Related Insights" section
- Be auto-listed in `sitemap.xml`
- Render `Article` JSON-LD on its own page

---

## 7. Production checklist

- [ ] Set `NODE_ENV=production`
- [ ] Replace `JWT_SECRET` and `COOKIE_SECRET` with long random strings
- [ ] Replace `ADMIN_DEFAULT_PASSWORD` immediately after first login (admin → Users)
- [ ] Configure SMTP and verify with a test inquiry
- [ ] Configure Cloudflare Turnstile site key + secret
- [ ] Set `PUBLIC_URL` to your real domain (`https://example.com`) so sitemap & emails use it
- [ ] Set up HTTPS (terminator/reverse proxy, e.g. Nginx, Caddy or Cloudflare)
- [ ] Schedule `npm run retention` nightly
- [ ] Optionally rotate `PRIVACY_POLICY_VERSION` after material policy changes (forces re-consent)

---

## 8. Default admin

```
Email     : <ADMIN_DEFAULT_EMAIL>     (admin@example.com unless overridden)
Password  : <ADMIN_DEFAULT_PASSWORD>  (ChangeMe!2026 unless overridden)
```

Change immediately on first login via **Users → Edit → New password**.

---

## 9. License

Proprietary. All rights reserved.
