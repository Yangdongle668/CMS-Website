-- =====================================================================
-- Battery CMS - PostgreSQL Schema
-- B2B Lithium Battery Manufacturer Site
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----- users (admins) -----
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(190) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(120) NOT NULL DEFAULT '',
  role          VARCHAR(40)  NOT NULL DEFAULT 'admin',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ----- pillar pages (3 core SEO pages) -----
CREATE TABLE IF NOT EXISTS pillar_pages (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(190) UNIQUE NOT NULL,
  name            VARCHAR(190) NOT NULL,
  short_name      VARCHAR(80)  NOT NULL,
  meta_title      VARCHAR(255) NOT NULL DEFAULT '',
  meta_description TEXT        NOT NULL DEFAULT '',
  hero_eyebrow    VARCHAR(120) NOT NULL DEFAULT '',
  hero_title      VARCHAR(255) NOT NULL DEFAULT '',
  hero_subtitle   TEXT         NOT NULL DEFAULT '',
  hero_image      VARCHAR(500) NOT NULL DEFAULT '',
  primary_cta_text VARCHAR(80) NOT NULL DEFAULT 'Get a Quote',
  primary_cta_link VARCHAR(255) NOT NULL DEFAULT '/quote',
  secondary_cta_text VARCHAR(80) NOT NULL DEFAULT 'Download Datasheet',
  secondary_cta_link VARCHAR(500) NOT NULL DEFAULT '',
  overview        JSONB NOT NULL DEFAULT '{}'::jsonb,        -- {title, body}
  variants        JSONB NOT NULL DEFAULT '[]'::jsonb,        -- [{name, summary, image}]
  spec_table      JSONB NOT NULL DEFAULT '{}'::jsonb,        -- {headers:[], rows:[]}
  applications    JSONB NOT NULL DEFAULT '[]'::jsonb,        -- application slugs
  customization   JSONB NOT NULL DEFAULT '{}'::jsonb,        -- {enabled, items:[]}
  manufacturing   JSONB NOT NULL DEFAULT '{}'::jsonb,        -- {title, body, image}
  certifications  JSONB NOT NULL DEFAULT '[]'::jsonb,        -- [{name, image}]
  faq             JSONB NOT NULL DEFAULT '[]'::jsonb,        -- [{q, a}]
  anchor_variants JSONB NOT NULL DEFAULT '[]'::jsonb,        -- anchor text rotations
  sort_order      INT   NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'published',  -- draft|published
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pillar_status ON pillar_pages(status);

-- ----- products (specific SKUs under pillars) -----
CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  pillar_id     INT REFERENCES pillar_pages(id) ON DELETE SET NULL,
  slug          VARCHAR(190) UNIQUE NOT NULL,
  name          VARCHAR(190) NOT NULL,
  model_no      VARCHAR(120) NOT NULL DEFAULT '',
  tagline       VARCHAR(255) NOT NULL DEFAULT '',
  cover_url     VARCHAR(500) NOT NULL DEFAULT '',
  gallery       JSONB NOT NULL DEFAULT '[]'::jsonb,
  specs         JSONB NOT NULL DEFAULT '{}'::jsonb,
  features      JSONB NOT NULL DEFAULT '[]'::jsonb,
  description   TEXT  NOT NULL DEFAULT '',
  datasheet_url VARCHAR(500) NOT NULL DEFAULT '',
  is_custom     BOOLEAN NOT NULL DEFAULT FALSE,
  meta_title    VARCHAR(255) NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  sort_order    INT   NOT NULL DEFAULT 0,
  status        VARCHAR(20) NOT NULL DEFAULT 'published',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_pillar ON products(pillar_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- ----- applications / industries -----
CREATE TABLE IF NOT EXISTS applications (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(190) UNIQUE NOT NULL,
  name          VARCHAR(190) NOT NULL,
  icon          VARCHAR(120) NOT NULL DEFAULT '',
  cover_url     VARCHAR(500) NOT NULL DEFAULT '',
  summary       TEXT  NOT NULL DEFAULT '',
  body          TEXT  NOT NULL DEFAULT '',
  meta_title    VARCHAR(255) NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  sort_order    INT   NOT NULL DEFAULT 0,
  status        VARCHAR(20) NOT NULL DEFAULT 'published',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----- categories (for blog) -----
CREATE TABLE IF NOT EXISTS categories (
  id   SERIAL PRIMARY KEY,
  slug VARCHAR(190) UNIQUE NOT NULL,
  name VARCHAR(190) NOT NULL
);

-- ----- articles (technical blog, the cluster content) -----
CREATE TABLE IF NOT EXISTS articles (
  id            SERIAL PRIMARY KEY,
  pillar_id     INT REFERENCES pillar_pages(id) ON DELETE SET NULL,
  category_id   INT REFERENCES categories(id) ON DELETE SET NULL,
  slug          VARCHAR(190) UNIQUE NOT NULL,
  title         VARCHAR(255) NOT NULL,
  excerpt       TEXT  NOT NULL DEFAULT '',
  cover_url     VARCHAR(500) NOT NULL DEFAULT '',
  content       TEXT  NOT NULL DEFAULT '',
  author        VARCHAR(120) NOT NULL DEFAULT '',
  meta_title    VARCHAR(255) NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  reading_minutes INT NOT NULL DEFAULT 5,
  published_at  TIMESTAMPTZ,
  status        VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_pillar ON articles(pillar_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status, published_at DESC);

-- ----- media library -----
CREATE TABLE IF NOT EXISTS media (
  id          SERIAL PRIMARY KEY,
  filename    VARCHAR(255) NOT NULL,
  original    VARCHAR(255) NOT NULL,
  url         VARCHAR(500) NOT NULL,
  mime        VARCHAR(120) NOT NULL,
  size        BIGINT       NOT NULL DEFAULT 0,
  alt_text    VARCHAR(255) NOT NULL DEFAULT '',
  uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----- settings (key/value JSON) -----
CREATE TABLE IF NOT EXISTS settings (
  key        VARCHAR(120) PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----- inquiries (RFQs from contact / quote forms) -----
CREATE TABLE IF NOT EXISTS inquiries (
  id              SERIAL PRIMARY KEY,
  reference       VARCHAR(40) UNIQUE NOT NULL,
  company         VARCHAR(190) NOT NULL DEFAULT '',
  full_name       VARCHAR(190) NOT NULL,
  email           VARCHAR(190) NOT NULL,
  phone           VARCHAR(60)  NOT NULL DEFAULT '',
  country         VARCHAR(80)  NOT NULL DEFAULT '',
  product_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  capacity_need   VARCHAR(120) NOT NULL DEFAULT '',
  annual_volume   VARCHAR(120) NOT NULL DEFAULT '',
  application     VARCHAR(190) NOT NULL DEFAULT '',
  message         TEXT NOT NULL DEFAULT '',
  attachments     JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_page     VARCHAR(500) NOT NULL DEFAULT '',
  utm             JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hash         VARCHAR(80)  NOT NULL DEFAULT '',
  user_agent      VARCHAR(500) NOT NULL DEFAULT '',
  consent_given   BOOLEAN NOT NULL DEFAULT FALSE,
  consent_at      TIMESTAMPTZ,
  policy_version  VARCHAR(20) NOT NULL DEFAULT '',
  status          VARCHAR(20) NOT NULL DEFAULT 'new',  -- new|read|replied|spam|archived
  notes           TEXT NOT NULL DEFAULT '',
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);

-- ----- GDPR data subject access requests -----
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id           SERIAL PRIMARY KEY,
  reference    VARCHAR(40) UNIQUE NOT NULL,
  request_type VARCHAR(20) NOT NULL,                  -- access|delete|rectify
  email        VARCHAR(190) NOT NULL,
  details      TEXT NOT NULL DEFAULT '',
  verify_token VARCHAR(120) NOT NULL DEFAULT '',
  verified_at  TIMESTAMPTZ,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|verified|completed|rejected
  handled_by   INT REFERENCES users(id) ON DELETE SET NULL,
  handled_at   TIMESTAMPTZ,
  ip_hash      VARCHAR(80) NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----- consent logs (for cookie + form consent) -----
CREATE TABLE IF NOT EXISTS consent_logs (
  id             SERIAL PRIMARY KEY,
  visitor_hash   VARCHAR(80) NOT NULL,
  consent_type   VARCHAR(40) NOT NULL,         -- cookie|form
  categories     JSONB NOT NULL DEFAULT '{}'::jsonb,
  policy_version VARCHAR(20) NOT NULL DEFAULT '',
  user_agent     VARCHAR(500) NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_visitor ON consent_logs(visitor_hash);

-- ----- audit logs (admin actions) -----
CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  user_email  VARCHAR(190) NOT NULL DEFAULT '',
  action      VARCHAR(60)  NOT NULL,
  entity      VARCHAR(60)  NOT NULL,
  entity_id   VARCHAR(60)  NOT NULL DEFAULT '',
  detail      JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hash     VARCHAR(80)  NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

-- ----- navigation -----
CREATE TABLE IF NOT EXISTS navigation (
  id         SERIAL PRIMARY KEY,
  label      VARCHAR(120) NOT NULL,
  url        VARCHAR(500) NOT NULL,
  parent_id  INT REFERENCES navigation(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  location   VARCHAR(40) NOT NULL DEFAULT 'header'  -- header|footer
);
