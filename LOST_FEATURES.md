# Features lost in the 2026-05-15 rollback to v32

On 2026-05-15 we force-pushed `claude/rebuild-cms-project-ymG1g` (v32) to
`main`, replacing 41 commits worth of post-v32 work. The block-based
content system was the priority; AI editor functionality is deferred to a
future project that can build on top of blocks.

This file is the inventory of what got removed from the code base. The
production **database is untouched** by the rollback — anything that lived
in DB rows (articles, settings, users, inquiries) is still there.

The original feature branches still exist on origin (push-only refs from
the merged PRs):

  - `origin/claude/ai-article-generation-SAThH`
  - `origin/claude/seo-audit-optimization-k2hFs`
  - `origin/claude/cherry-pick-improvements`     (this one is identical to v18-31)

Anything below can be reconstructed by cherry-picking from those branches
or starting from the file inventories captured here.

---

## A. AI article generation pipeline

Largest single feature. Replaces "write the article from scratch" with a
guided LLM flow: pick a provider, pick a prompt template, generate, see
the AI-detection score, run a "de-AI" pass, save.

**Code paths removed**
- `admin/ai-generate.html` — full generator UI (provider/model selector,
  prompt template picker, dedup score, regenerate, save-to-articles)
- `server/routes/ai-generate.js` — REST endpoints driving the UI
- `server/services/ai-generator.js` — multi-provider HTTP clients
- `server/services/ai-prompts.js` — 5 prompt templates
- `server/services/ai-settings.js` — synchronous settings snapshot
  reloaded on every settings save

**Provider support**
Anthropic Claude, OpenAI, DeepSeek, Moonshot Kimi, Zhipu GLM, Alibaba
Qwen, plus an OpenAI-compatible bucket for vLLM / Ollama / OneAPI
gateways. API keys stored in DB `settings.ai_providers`, masked on read.

**Anti-AI detection**
Three providers in priority order: heuristic (built-in, free) → GPTZero
→ Sapling. Score above threshold triggers an automatic "humanise" pass
that asks the LLM to rewrite in less ML-cliché style.

**Why we removed it**
The original implementation was tied to the pre-block content model
(articles live in DB with HTML content). Rebuilding it on the block
system means: each generated section becomes one or more blocks, the
preview iframe shows it live, every regeneration is a single-block
swap rather than a whole-article rewrite. That's a substantially
better UX worth waiting for.

---

## B. Per-page SEO panel + RankMath-style scoring

**Code paths removed**
- `admin/assets/js/seo-panel.js` — front-end scoring UI
- `server/routes/seo-check.js` — score calculator (keyword in title /
  H1 / first paragraph / URL slug; meta length; image alts; internal
  link count; …)
- `server/utils/seo-fields.js` — `SEO_SELECT / extractSeoValues /
  seoValuesPlaceholders / seoSetClause` helpers used by article + page
  + product + application + pillar routes to round-trip
  focus_keyword / secondary_keywords / og_* / twitter_* / schema_type
  / canonical_override / robots
- `server/db/migrate-2026-q2-seo.sql` — adds the SEO columns to every
  content table
- `server/db/migrate-2026-q2-seo-content.sql` — pre-fills focus_keyword
  + meta on existing rows
- `docs/SEO_AUDIT.md` + `docs/SEO_GEO_AUDIT_2026Q2.md` — audit notes

**Block-based replacement plan**
The block model already carries per-page meta_title / meta_description.
Add a "SEO" block-shell-level form (one extra section in the page
builder) that captures focus keyword + og overrides + canonical + robots,
stored in `pages.seo JSONB` instead of the wider column-set. The scoring
function ports across with minor adjustments since blocks have explicit
H1/H2/image-with-alt structure.

---

## C. Visual edit (iframe + Quill)

**Code paths removed**
- `admin/visual-edit.html` — click-to-edit overlay UI
- `admin/assets/js/iframe-text-editor.js` — postMessage protocol with
  the live site iframe
- `admin/assets/js/quill-editor.js` — Quill 2.0 bootstrapper for
  inline rich-text editing
- `server/routes/text-overrides.js` — per-element text override store

**Why this isn't a loss**
The block-based page builder (`/admin/pages.html` on v32) replaces
this entire flow. Operators edit blocks in a side drawer with live
preview — same result, less complex.

---

## D. WordPress-style image picker + image overrides

**Code paths removed**
- `admin/assets/js/image-picker.js` — 9-position picker (fixed-size
  slots, library browser, drag-drop upload, alt-text prompt)
- `admin/media-overrides.html` — admin UI for swapping site-wide
  images by selector
- `server/routes/media-overrides.js` — selector-keyed override store

**Replacement plan**
The block builder's `fieldImage()` helper (in
`admin/assets/js/page-builder.js`) is essentially the image picker
but scoped per-block. The "media overrides" feature was for the
inline-edit flow, which the block model makes redundant. If we ever
need to swap a hero image across multiple pages at once, that's
better done via a "media library favourites" feature than per-selector
overrides.

---

## E. Visitor analytics + world map

**Code paths removed**
- `admin/analytics.html` — dashboard UI
- `admin/assets/js/world-map.js` — D3-based world map
- `server/middleware/analytics.js` — per-request logging middleware
- `server/routes/analytics.js` — aggregation queries

**Why we removed it**
Self-hosted lightweight analytics is duplicating what Plausible /
Umami / GA4 do better. The OPERATIONS.md "Known limitations" already
documents that the recommended path is connect a third-party tracker.
If we want first-party analytics later, build it on top of the
existing audit / inquiry tables (the data is mostly there).

---

## F. Authors admin

**Code paths removed**
- `admin/authors.html` — list / create / edit author profiles
- `server/routes/authors.js`
- Schema additions to `articles.author_id` (FK to a new `authors`
  table with bio, avatar, knows_about, sameAs etc.)

**Replacement plan**
The existing `articles.author` text column still works for byline
display. If we want structured author profiles for E-E-A-T schema
markup, add an `authors` table + admin page in a focused PR.

---

## G. SEO sitemap rewrite + AI crawler whitelist

**What main had that v32 doesn't**
- Absolute URLs in `<loc>` (Google requirement; v32 emits absolute
  via PUBLIC_URL but falls back to relative).
- `xmlns:image` extension for image sitemap entries.
- robots.txt entries explicitly allowing `GPTBot`, `Google-Extended`,
  `PerplexityBot` so AI search engines can crawl the site.
- `Disallow: /uploads/private/` reservation for signed datasheets.

**Code path**
`server/routes/seo.js` — was rewritten on main. v32 has the older
"single CTE + 5-min cache" version.

**Rebuild priority: HIGH** — affects search-engine indexing.

---

## H. Six new application landing pages

Static HTML files added on main but not present on v32:

  - `/applications/drones.html`
  - `/applications/power-tools.html`
  - `/applications/e-mobility.html`
  - `/applications/smart-home.html`
  - `/applications/industrial-handhelds.html`
  - `/applications/defence-aerospace.html`

Each is ~210 lines: page-hero with breadcrumbs, "three jobs" intro,
real-platforms spec table, 6-card feat-grid of design rules,
3-card sibling cluster articles, CTA band.

Originally added in commit `fab81271`. The full content can be
recovered with:
```
git show fab81271:public/applications/drones.html
```

**Rebuild priority: HIGH** — these are 6 SEO landing pages targeting
distinct verticals. The right rebuild is block migrations into the
v32 page builder (same shape as the about/ + applications/ migrations
already in `server/db/migrate-pages-to-blocks.js`).

---

## I. Front-end blog search

**Code paths removed**
- Search box at the top of `public/blog/index.html`
- Article dedup checker button in `admin/articles.html`

Originally in commit `638969b2`. Small UX win. Rebuild priority: MEDIUM.

---

## J. Slider bug fix

Disabled `next` arrow on the last tesla-slide was using
`pointer-events: none`, so clicks passed through to the underlying
`<a class="tesla-slide">` and navigated visitors into the last card by
accident. Originally in commit `57a8befb`.

**Rebuild priority: HIGH** — small but visible bug. One-line CSS fix.

---

## K. 21 new cluster blog articles (DB content)

Three batches of seed-content commits:
- 14 new cluster articles for polymer + custom-shaped pillars (`05faef7f`)
- 7 new cluster articles for coin steel-shell pillar (`612c2eed`)
- Tweaks to existing articles for SEO

**These survive the rollback as DB rows** if the production database
was not dropped. If anyone re-runs `npm run db:seed` against a fresh
DB, these are gone — re-extract from `server/db/seed.sql` at
commit `612c2eed`.

---

## L. Smaller items not worth their own section

- `fix(homepage): sync slider photo IDs to landing pages + harden hydration`
  (commit `995cd2d8`) — slider sometimes shrank when DB was partial.
- `fix(pillar): raise cluster article LIMIT from 3 to 24`
  (commit `bd6177ff`) — pillar pages were truncating their cluster.
- `feat(media): WordPress-style 9-position image picker + fixed-size slots`
  (commit `2e277132`) — covered by fieldImage in the block builder.
- `fix(ui): app-card images + asymmetric 4-card grids + bidirectional motion`
  (commit `5b995d82`) — small CSS polish.
- `feat(seo): RankMath-style per-page SEO editor + blog layout fix`
  (commit `c145da35`) — covered under (B).
- `fix(slider): backfill cover_url + harden hydration` (commit `b30d2ab4`) —
  hydration safety check; worth porting if slider becomes flaky.
- `seo: auto-sync application pages site-wide + SEO meta for new content`
  (commit `5527900f`) — nav was updating to include new app pages.

---

## Rebuild plan & priority

1. **HIGH** Slider fix — 1-line CSS, < 5 min
2. **HIGH** SEO sitemap improvements — absolute URLs + image sitemap + AI bot whitelist
3. **HIGH** 6 new application landing pages — block migrations
4. **MEDIUM** Blog frontend search box
5. **DEFERRED** AI article generation — to be redesigned on top of blocks
6. **DEFERRED** SEO panel + scoring — to be redesigned on top of blocks
7. **DEFERRED** Authors admin — only if we need rich author profiles
8. **DROPPED** Visual edit / Quill / image overrides / analytics —
   replaced by block builder, or scoped out per operator decision.

Items 1-4 are tracked starting in the v33+ commit sequence on main.
