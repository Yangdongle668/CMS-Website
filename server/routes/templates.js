// =====================================================================
// Templates API — one-click site bootstrap
//
// GET    /api/templates                    list available templates
// GET    /api/templates/:id                template details (full structure)
// POST   /api/templates/apply              apply template:
//                                            { template_id, slug_prefix?, replace_existing? }
// =====================================================================
const express = require('express');
const { many, one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { trimStr, asBool } = require('../utils/validate');
const templates = require('../templates');
const cache = require('../services/cache');

const router = express.Router();

router.get('/', requireAuth, (_req, res) => {
  res.json({ templates: templates.listTemplates() });
});

router.get('/:id', requireAuth, (req, res) => {
  const tpl = templates.getTemplate(String(req.params.id));
  if (!tpl) return res.status(404).json({ error: 'not_found' });
  res.json({ template: tpl });
});

// Apply a template — UPSERTs each page in the template, optionally
// wiping that page's existing blocks before inserting the template's
// block list. Idempotent: re-applying the same template (with
// replace_existing=true) returns the page to template state.
router.post('/apply', requireAuth, async (req, res) => {
  const b = req.body || {};
  const tpl = templates.getTemplate(String(b.template_id));
  if (!tpl) return res.status(400).json({ error: 'unknown_template' });

  const slugPrefix = trimStr(b.slug_prefix, 60);     // optional namespace
  const replace = asBool(b.replace_existing);
  const created = [];
  const updated = [];

  for (const tplPage of tpl.pages) {
    const slug = slugPrefix ? `${slugPrefix}/${tplPage.slug}` : tplPage.slug;

    // Upsert page row
    const existing = await one('SELECT id FROM pages WHERE slug = $1', [slug]);
    let pageId;
    if (existing) {
      pageId = existing.id;
      if (replace) {
        await query(
          `UPDATE pages SET
             title = $2,
             meta_title = $3,
             meta_description = $4,
             hero_title = $5,
             status = 'published',
             updated_at = now()
           WHERE id = $1`,
          [
            pageId,
            tplPage.title || '',
            tplPage.meta_title || '',
            tplPage.meta_description || '',
            tplPage.hero_title || '',
          ]
        );
      }
      updated.push({ slug, id: pageId });
    } else {
      const r = await query(
        `INSERT INTO pages (slug, title, meta_title, meta_description, hero_title, status)
         VALUES ($1, $2, $3, $4, $5, 'published') RETURNING id`,
        [
          slug,
          tplPage.title || '',
          tplPage.meta_title || '',
          tplPage.meta_description || '',
          tplPage.hero_title || '',
        ]
      );
      pageId = r.rows[0].id;
      created.push({ slug, id: pageId });
    }

    // Wipe + insert blocks if replace OR if the page is brand-new
    const isNew = !existing;
    if (isNew || replace) {
      await query('DELETE FROM page_blocks WHERE page_id = $1', [pageId]);
      const blocks = Array.isArray(tplPage.blocks) ? tplPage.blocks : [];
      for (let i = 0; i < blocks.length; i++) {
        const blk = blocks[i];
        if (!blk || !blk.block_type) continue;
        await query(
          `INSERT INTO page_blocks (page_id, block_type, sort_order, content, is_visible)
           VALUES ($1, $2, $3, $4, TRUE)`,
          [pageId, blk.block_type, i, JSON.stringify(blk.content || {})]
        );
      }
    }
  }

  await recordAudit({
    req,
    action: 'apply_template',
    entity: 'template',
    detail: { template_id: tpl.id, created: created.length, updated: updated.length, replace },
  });
  await cache.invalidate('page:');
  await cache.invalidate('pillar:');

  res.json({
    ok: true,
    template_id: tpl.id,
    created,
    updated,
    total_pages: created.length + updated.length,
  });
});

module.exports = router;
