// =====================================================================
// /api/ai-generate — AI 文章生成、翻译、查重、降AI 一体化路由
// =====================================================================
// All endpoints require admin auth (requireAuth middleware) — these calls
// cost real money against the Anthropic API key, so we don't expose them
// to public traffic.
//
// Endpoints:
//   GET  /prompts       List the 5 prebuilt prompt templates
//   GET  /status        Whether ANTHROPIC_API_KEY is configured + provider info
//   POST /generate      Generate from a prompt template
//   POST /translate     Translate an existing HTML article
//   POST /humanize      Re-write to lower AI-detection score
//   POST /detect        Run AI detection on supplied text
//   POST /save-draft    Save the resulting HTML as a new article (status=draft)
// =====================================================================

const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { trimStr, isSlug, clamp } = require('../utils/validate');
const { query } = require('../db/client');
const aiGen = require('../services/ai-generator');
const aiPrompts = require('../services/ai-prompts');

const router = express.Router();

// Tighter limiter than the global API one — each call is an LLM round-trip.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user && req.user.id ? `u:${req.user.id}` : req.ip),
});

router.use(requireAuth);
router.use(aiLimiter);

// ---------------------------------------------------------------------
// GET /api/ai-generate/status
// ---------------------------------------------------------------------
router.get('/status', (_req, res) => {
  const env = aiGen.getEnv();
  res.json({
    configured: aiGen.isConfigured(),
    defaultProvider: env.provider,
    defaultModel: env.model,
    detectProvider: env.detectProvider,
    detectThreshold: env.detectThreshold,
    providers: aiGen.listProviders(),
  });
});

// ---------------------------------------------------------------------
// GET /api/ai-generate/providers
//   Returns the registry of supported LLM providers and which ones have
//   an API key configured. Used by the admin UI to populate the provider
//   selector.
// ---------------------------------------------------------------------
router.get('/providers', (_req, res) => {
  res.json({ items: aiGen.listProviders() });
});

// ---------------------------------------------------------------------
// GET /api/ai-generate/prompts
// ---------------------------------------------------------------------
router.get('/prompts', (_req, res) => {
  res.json({ items: aiPrompts.listPrompts() });
});

function pickProviderModel(req) {
  const provider = trimStr(req.body && req.body.provider, 40) || undefined;
  const model = trimStr(req.body && req.body.model, 80) || undefined;
  return { provider, model };
}

// ---------------------------------------------------------------------
// POST /api/ai-generate/generate
//   body: { promptKey, vars: {…}, provider?, model? }
// ---------------------------------------------------------------------
router.post('/generate', async (req, res) => {
  const promptKey = trimStr(req.body && req.body.promptKey, 60);
  if (!aiPrompts.PROMPTS[promptKey]) {
    return res.status(400).json({ error: 'invalid_prompt' });
  }
  const vars = (req.body && typeof req.body.vars === 'object') ? req.body.vars : {};
  const cleanVars = {};
  for (const v of aiPrompts.PROMPTS[promptKey].vars) {
    cleanVars[v.key] = trimStr(vars[v.key], 500);
  }
  const { provider, model } = pickProviderModel(req);
  try {
    const out = await aiGen.generateArticle({ promptKey, vars: cleanVars, provider, model });
    await recordAudit({
      req, action: 'ai_generate', entity: 'article',
      detail: { promptKey, provider: out.provider, model: out.model },
    });
    res.json({ ok: true, html: out.html, model: out.model, provider: out.provider, usage: out.usage, promptKey });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.code || 'ai_failed', detail: err.message });
  }
});

// ---------------------------------------------------------------------
// POST /api/ai-generate/translate
//   body: { html, targetLang, sourceLang?, provider?, model? }
// ---------------------------------------------------------------------
router.post('/translate', async (req, res) => {
  const html = String((req.body && req.body.html) || '').slice(0, 100000);
  const targetLang = trimStr(req.body && req.body.targetLang, 80) || 'English';
  const sourceLang = trimStr(req.body && req.body.sourceLang, 80);
  if (!html.trim()) return res.status(400).json({ error: 'empty_input' });
  const { provider, model } = pickProviderModel(req);
  try {
    const out = await aiGen.translateArticle({ html, targetLang, sourceLang, provider, model });
    await recordAudit({
      req, action: 'ai_translate', entity: 'article',
      detail: { targetLang, provider: out.provider, model: out.model },
    });
    res.json({ ok: true, html: out.html, model: out.model, provider: out.provider, usage: out.usage });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.code || 'ai_failed', detail: err.message });
  }
});

// ---------------------------------------------------------------------
// POST /api/ai-generate/detect
//   body: { text }
// ---------------------------------------------------------------------
router.post('/detect', async (req, res) => {
  const text = String((req.body && req.body.text) || '').slice(0, 100000);
  if (!text.trim()) return res.status(400).json({ error: 'empty_input' });
  try {
    const out = await aiGen.detectAi({ text });
    res.json({ ok: true, ...out });
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.code || 'detect_failed',
      detail: err.message,
    });
  }
});

// ---------------------------------------------------------------------
// POST /api/ai-generate/humanize
//   body: { html, detection?, provider?, model? }
// ---------------------------------------------------------------------
router.post('/humanize', async (req, res) => {
  const html = String((req.body && req.body.html) || '').slice(0, 100000);
  const detectionResult = (req.body && req.body.detection) || null;
  if (!html.trim()) return res.status(400).json({ error: 'empty_input' });
  const { provider, model } = pickProviderModel(req);
  try {
    const out = await aiGen.humanizeArticle({ html, detectionResult, provider, model });
    await recordAudit({
      req, action: 'ai_humanize', entity: 'article',
      detail: { provider: out.provider, model: out.model },
    });
    res.json({ ok: true, html: out.html, model: out.model, provider: out.provider, usage: out.usage });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.code || 'ai_failed', detail: err.message });
  }
});

// ---------------------------------------------------------------------
// POST /api/ai-generate/save-draft
//   body: { slug, title, excerpt, content, meta_title, meta_description,
//           focus_keyword, pillar_id?, category_id?, author_id? }
// Saves the AI-produced article as a draft and returns its id so the
// admin UI can redirect to the standard articles editor for final review.
// ---------------------------------------------------------------------
router.post('/save-draft', async (req, res) => {
  const b = req.body || {};
  const slug = trimStr(b.slug, 190).toLowerCase();
  if (!isSlug(slug)) return res.status(400).json({ error: 'invalid_slug' });
  const title = trimStr(b.title, 255);
  if (!title) return res.status(400).json({ error: 'title_required' });
  // Ensure slug is unique — append -2, -3 … if collision.
  let finalSlug = slug;
  for (let i = 2; i < 50; i++) {
    const r = await query('SELECT 1 FROM articles WHERE slug = $1', [finalSlug]);
    if (r.rowCount === 0) break;
    finalSlug = `${slug}-${i}`;
  }
  const r = await query(
    `INSERT INTO articles (
       pillar_id, category_id, author_id, slug, title, excerpt, cover_url, content, author,
       meta_title, meta_description, reading_minutes, template, hero_image,
       published_at, status, focus_keyword
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'draft',$16) RETURNING id`,
    [
      b.pillar_id || null,
      b.category_id || null,
      b.author_id || null,
      finalSlug,
      title,
      trimStr(b.excerpt, 500),
      trimStr(b.cover_url, 500),
      String(b.content || '').slice(0, 100000),
      trimStr(b.author, 120) || 'Zufek Engineering',
      trimStr(b.meta_title, 255),
      trimStr(b.meta_description, 500),
      clamp(b.reading_minutes, 1, 60, 6),
      'standard',
      trimStr(b.hero_image, 500),
      null,
      trimStr(b.focus_keyword, 190),
    ]
  );
  const id = r.rows[0].id;
  await recordAudit({
    req, action: 'ai_save_draft', entity: 'article', entityId: id,
    detail: { slug: finalSlug, source: b.source || 'ai' },
  });
  res.json({ ok: true, id, slug: finalSlug });
});

module.exports = router;
