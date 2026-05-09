// =====================================================================
// AI 生成 / 翻译 / 降AI 服务 — 支持多家 LLM API
// =====================================================================
// Supported providers (configured via env, selectable per-request):
//   - anthropic     Claude API           (https://api.anthropic.com)
//   - openai        OpenAI               (https://api.openai.com)
//   - deepseek      DeepSeek             (https://api.deepseek.com)
//   - moonshot      月之暗面 Kimi         (https://api.moonshot.cn)
//   - zhipu         智谱 GLM              (https://open.bigmodel.cn)
//   - qwen          阿里通义千问          (https://dashscope.aliyuncs.com)
//   - openai_compat Generic OpenAI-compatible endpoint (custom base URL)
//
// All HTTP traffic uses Node 18+ global `fetch`. No SDK dependency added.
//
// Public API:
//   - listProviders()                                   → [{ id, label, configured, defaultModel }]
//   - generateArticle({ promptKey, vars, provider?, model? })  → { html, model, provider, usage }
//   - translateArticle({ html, targetLang, sourceLang?, provider?, model? }) → { html, model, provider, usage }
//   - humanizeArticle({ html, detectionResult?, provider?, model? }) → { html, model, provider, usage }
//   - detectAi({ text })                                → { score, level, signals, suspectSpans, provider }
//   - isConfigured()                                    → true if at least one LLM provider has a key
// =====================================================================

const { SYSTEM_PROMPT } = require('./ai-prompts');
const aiSettings = require('./ai-settings');

class AiError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.code = code;
    this.status = status;
    this.expose = true;
  }
}

// ---------------------------------------------------------------------
// Provider metadata — labels + endpoint URLs. Per-provider api_key /
// model / base_url come from aiSettings.snapshot() so the admin UI can
// edit them at runtime.
// ---------------------------------------------------------------------
const PROVIDER_META = {
  anthropic:     { label: 'Anthropic Claude',  style: 'anthropic', url: 'https://api.anthropic.com/v1/messages' },
  openai:        { label: 'OpenAI',            style: 'openai',    url: 'https://api.openai.com/v1/chat/completions' },
  deepseek:      { label: 'DeepSeek',          style: 'openai',    url: 'https://api.deepseek.com/v1/chat/completions' },
  moonshot:      { label: '月之暗面 Kimi',     style: 'openai',    url: 'https://api.moonshot.cn/v1/chat/completions' },
  zhipu:         { label: '智谱 GLM',          style: 'openai',    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions' },
  qwen:          { label: '阿里通义千问',      style: 'openai',    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' },
  openai_compat: { label: 'OpenAI 兼容 (自定义)', style: 'openai', url: '' /* resolved from settings.providers.openai_compat.base_url */ },
};

function providerKey(id) {
  const s = aiSettings.snapshot();
  return (s.providers && s.providers[id] && s.providers[id].api_key) || '';
}

function providerModel(id, override) {
  if (override) return String(override).slice(0, 80);
  const s = aiSettings.snapshot();
  return (s.providers && s.providers[id] && s.providers[id].model) ||
    aiSettings.PROVIDER_DEFAULT_MODEL[id] || '';
}

function providerUrl(id) {
  if (id === 'openai_compat') {
    const s = aiSettings.snapshot();
    const base = (s.providers && s.providers.openai_compat && s.providers.openai_compat.base_url) || '';
    if (!base) return '';
    return /\/chat\/completions\b/.test(base) ? base : base.replace(/\/$/, '') + '/v1/chat/completions';
  }
  return PROVIDER_META[id] ? PROVIDER_META[id].url : '';
}

function getDefaultProvider() {
  const s = aiSettings.snapshot();
  const explicit = (s.default_provider || '').trim().toLowerCase();
  if (explicit && PROVIDER_META[explicit] && providerKey(explicit)) return explicit;
  for (const id of Object.keys(PROVIDER_META)) {
    if (providerKey(id)) return id;
  }
  return 'anthropic';
}

function isConfigured() {
  return Object.keys(PROVIDER_META).some((id) => !!providerKey(id));
}

function listProviders() {
  return Object.entries(PROVIDER_META).map(([id, meta]) => ({
    id,
    label: meta.label,
    style: meta.style,
    configured: !!providerKey(id),
    defaultModel: providerModel(id),
  }));
}

function getEnv() {
  const s = aiSettings.snapshot();
  const provider = getDefaultProvider();
  return {
    provider,
    model: providerModel(provider),
    maxTokens: s.max_tokens || 4096,
    detectProvider: s.detect_provider || 'heuristic',
    detectThreshold: s.detect_threshold || 45,
  };
}

function getMaxTokens() {
  return aiSettings.snapshot().max_tokens || 4096;
}

// ---------------------------------------------------------------------
// Universal LLM call dispatcher
// ---------------------------------------------------------------------
async function callLLM({ provider, model, system, user, maxTokens, temperature = 0.7 }) {
  const id = provider && PROVIDER_META[provider] ? provider : getDefaultProvider();
  const meta = PROVIDER_META[id];
  if (!meta) throw new AiError('invalid_provider', `未知的 LLM provider: ${provider}`, 400);
  const key = providerKey(id);
  if (!key) {
    throw new AiError('ai_not_configured',
      `${meta.label} 未配置 API Key。请到 后台设置 → AI 接入 中填写后保存（即时生效，无需重启）。`, 503);
  }
  const useModel = providerModel(id, model);
  const url = providerUrl(id);
  if (!url) {
    throw new AiError('ai_not_configured',
      `${meta.label} 缺少接口地址。${id === 'openai_compat' ? '请在 后台设置 → AI 接入 → 自定义端点 base_url 中填写。' : ''}`, 503);
  }
  const tokens = Math.min(maxTokens || getMaxTokens(), getMaxTokens());

  if (meta.style === 'anthropic') {
    return callAnthropic({ url, key, model: useModel, system, user, maxTokens: tokens, temperature });
  }
  return callOpenAICompat({ url, key, model: useModel, system, user, maxTokens: tokens, temperature, providerLabel: meta.label });
}

async function callAnthropic({ url, key, model, system, user, maxTokens, temperature }) {
  const body = {
    model, max_tokens: maxTokens, temperature, system,
    messages: [{ role: 'user', content: user }],
  };
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new AiError('upstream_unreachable', `Anthropic 接口不可达：${err.message}`);
  }
  let json;
  try { json = await res.json(); } catch (_) { json = null; }
  if (!res.ok) {
    const detail = (json && json.error && json.error.message) || `HTTP ${res.status}`;
    throw new AiError('upstream_error', `Anthropic 返回错误：${detail}`, 502);
  }
  const text = (json.content || []).filter((b) => b && b.type === 'text').map((b) => b.text).join('\n').trim();
  if (!text) throw new AiError('empty_response', 'Anthropic 返回了空内容');
  return { text, model: json.model || model, usage: json.usage || null, provider: 'anthropic' };
}

async function callOpenAICompat({ url, key, model, system, user, maxTokens, temperature, providerLabel }) {
  const body = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new AiError('upstream_unreachable', `${providerLabel} 接口不可达：${err.message}`);
  }
  let json;
  try { json = await res.json(); } catch (_) { json = null; }
  if (!res.ok) {
    const detail = (json && (json.error?.message || json.message)) || `HTTP ${res.status}`;
    throw new AiError('upstream_error', `${providerLabel} 返回错误：${detail}`, 502);
  }
  const choice = (json.choices && json.choices[0]) || {};
  const text = (choice.message && choice.message.content || '').trim();
  if (!text) throw new AiError('empty_response', `${providerLabel} 返回了空内容`);
  return { text, model: json.model || model, usage: json.usage || null, provider: providerLabel };
}

// Strip markdown code fences and any leading prose the model sometimes
// emits before the HTML, even when told not to. Safety net only.
function cleanHtmlOutput(text) {
  let out = String(text || '').trim();
  out = out.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
  const firstTag = out.search(/<\s*(h1|h2|h3|p|article|section|div|table)\b/i);
  if (firstTag > 0 && firstTag < 200) out = out.slice(firstTag);
  return out.trim();
}

// ---------------------------------------------------------------------
// Generate from one of the 5 prompt templates
// ---------------------------------------------------------------------
async function generateArticle({ promptKey, vars, provider, model }) {
  const { renderTemplate } = require('./ai-prompts');
  const userMessage = renderTemplate(promptKey, vars || {});
  const result = await callLLM({
    provider, model,
    system: SYSTEM_PROMPT,
    user: userMessage,
    maxTokens: 6000,
    temperature: 0.85,
  });
  return {
    html: cleanHtmlOutput(result.text),
    model: result.model,
    provider: result.provider,
    usage: result.usage,
  };
}

// ---------------------------------------------------------------------
// Translate an existing article (HTML in, HTML out)
// ---------------------------------------------------------------------
async function translateArticle({ html, targetLang, sourceLang, provider, model }) {
  if (!html || !String(html).trim()) {
    throw new AiError('empty_input', '请提供需要翻译的文章内容。', 400);
  }
  const target = String(targetLang || 'English').trim();
  const source = sourceLang ? `Source language: ${sourceLang}.` : 'Auto-detect the source language.';
  const system = `You are a senior technical translator specialising in
lithium-battery, electrochemistry and power-electronics literature.
Translate the supplied HTML article into ${target}. ${source}

Rules:
- Preserve the HTML tag structure exactly. Do not add, remove or rename tags.
- Translate only the human-readable text inside tags and attributes that
  are user-visible (alt, title). Leave URLs, class names, ids untouched.
- Convert units where the target language community expects different ones
  (e.g. always keep SI; mAh stays mAh).
- Match the prose style: vary sentence length, avoid AI-cliché openers.
- Output the translated HTML body fragment only. No fences, no commentary.`;
  const result = await callLLM({
    provider, model,
    system,
    user: html,
    maxTokens: 6000,
    temperature: 0.4,
  });
  return {
    html: cleanHtmlOutput(result.text),
    model: result.model,
    provider: result.provider,
    usage: result.usage,
  };
}

// ---------------------------------------------------------------------
// Humanize an article — re-write to lower AI-detection score
// ---------------------------------------------------------------------
async function humanizeArticle({ html, detectionResult, provider, model }) {
  if (!html || !String(html).trim()) {
    throw new AiError('empty_input', '请提供需要降AI率的文章内容。', 400);
  }
  const tips = (detectionResult && detectionResult.signals)
    ? `\n\nThe upstream detector flagged these specific issues. Address each:\n` +
      detectionResult.signals.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '';
  const score = detectionResult && Number.isFinite(detectionResult.score)
    ? `\nCurrent AI-likelihood score: ${detectionResult.score}/100. Target: under 25.`
    : '';
  const system = `You are a senior editor whose job is to rewrite text so it
reads as if a human subject-matter expert wrote it, not an LLM. You are
NOT changing the technical claims, numbers, or HTML structure — you are
changing prose rhythm and vocabulary patterns.

Rules:
1. Preserve every <table>, <ul>, <ol>, <details> structure. Same headings.
2. Keep all numeric values, units, citations, product names verbatim.
3. Vary sentence length aggressively. Throw in occasional 5-word sentences
   and the odd long, qualifying one. No paragraph should match the rhythm
   of the next.
4. Strip AI tics: "moreover", "furthermore", "in conclusion", "delve",
   "leverage" (unless financial), "robust" (overused), "unparalleled",
   "in today's fast-paced world", "navigate the complexities", "it is
   important to note", "in essence".
5. Reduce em-dash density. Rewrite many of them as full stops or commas.
6. Replace some passive voice with active. Add specific human-flavour
   asides only where appropriate ("we've seen this in field returns",
   "the data sheet rarely mentions…"). Don't fabricate first-person
   anecdotes.
7. Don't add disclaimers / "as an AI" / "let me know if".
8. Output the rewritten HTML body fragment only. No fences, no preamble.${tips}${score}`;
  const result = await callLLM({
    provider, model,
    system,
    user: html,
    maxTokens: 6000,
    temperature: 0.9,
  });
  return {
    html: cleanHtmlOutput(result.text),
    model: result.model,
    provider: result.provider,
    usage: result.usage,
  };
}

// =====================================================================
// AI 检测
// =====================================================================
const AI_PHRASES = [
  // English AI tics
  'in today\'s fast-paced world', 'in the rapidly evolving',
  'in today\'s digital age', 'navigating the complexities',
  'it is important to note', 'it should be noted',
  'in conclusion,', 'in summary,', 'as we delve',
  'delve into', 'delving into', 'a multitude of',
  'a plethora of', 'paradigm shift', 'leverage',
  'moreover,', 'furthermore,', 'additionally,',
  'unparalleled', 'cutting-edge', 'state-of-the-art',
  'robust solution', 'seamless integration',
  'embark on a journey', 'harness the power',
  'unlock the potential', 'pave the way',
  'meticulously crafted', 'in essence',
  'tapestry of', 'realm of', 'foster',
  // Chinese AI tics
  '在当今快节奏的', '随着技术的不断发展', '值得注意的是',
  '综上所述', '总而言之', '不仅...而且',
  '众所周知', '与此同时', '在此背景下',
  '不可否认', '毋庸置疑', '一方面...另一方面',
];

function htmlToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function splitSentences(text) {
  return String(text)
    .split(/(?<=[.!?。！？])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);
}

function detectHeuristic(text) {
  const signals = [];
  const suspectSpans = [];
  const sentences = splitSentences(text);
  if (sentences.length < 3) {
    return { score: 0, level: 'low', signals: ['文本过短，无法可靠评估'], suspectSpans: [], provider: 'heuristic' };
  }
  // 1) Burstiness — std dev of sentence word counts.
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / lengths.length;
  const stdev = Math.sqrt(variance);
  let burstinessScore = 0;
  if (stdev < 3) {
    burstinessScore = 35;
    signals.push(`句长方差极低 (σ=${stdev.toFixed(1)})，缺乏人类写作的节奏波动`);
  } else if (stdev < 5) {
    burstinessScore = 20;
    signals.push(`句长方差偏低 (σ=${stdev.toFixed(1)})，建议加入更多短句`);
  } else if (stdev < 7) {
    burstinessScore = 8;
  }
  // 2) AI-phrase density
  const lower = text.toLowerCase();
  const hits = AI_PHRASES.filter((p) => lower.includes(p.toLowerCase()));
  let phraseScore = 0;
  if (hits.length > 0) {
    phraseScore = Math.min(35, hits.length * 9);
    signals.push(`检出 ${hits.length} 个常见 AI 套话：${hits.slice(0, 4).join('、')}${hits.length > 4 ? '…' : ''}`);
    suspectSpans.push(...hits);
  }
  // 3) Em-dash density
  const emDashes = (text.match(/—/g) || []).length;
  const words = text.split(/\s+/).length;
  const emDashRate = emDashes / Math.max(1, words / 100);
  let dashScore = 0;
  if (emDashRate > 1.2) {
    dashScore = 18;
    signals.push(`em-dash (—) 密度过高 (${emDashRate.toFixed(1)} per 100 words)，AI 模型常见特征`);
  } else if (emDashRate > 0.6) {
    dashScore = 8;
  }
  // 4) Type-token ratio
  const tokens = (lower.match(/[a-zà-ÿ一-鿿]+/g) || []).filter((t) => t.length > 2);
  const types = new Set(tokens);
  const ttr = types.size / Math.max(1, tokens.length);
  let ttrScore = 0;
  if (tokens.length > 100 && ttr < 0.35) {
    ttrScore = 12;
    signals.push(`词汇多样性偏低 (TTR=${ttr.toFixed(2)})，建议替换重复用词`);
  }
  // 5) Paragraph-length uniformity
  const paragraphs = String(text).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  let paraScore = 0;
  if (paragraphs.length >= 4) {
    const pLens = paragraphs.map((p) => p.split(/\s+/).length);
    const pMean = pLens.reduce((a, b) => a + b, 0) / pLens.length;
    const pVar = pLens.reduce((a, b) => a + (b - pMean) ** 2, 0) / pLens.length;
    const pStd = Math.sqrt(pVar);
    if (pStd / Math.max(1, pMean) < 0.25) {
      paraScore = 10;
      signals.push('段落长度高度均匀，建议穿插一两个明显短的段落');
    }
  }
  const raw = burstinessScore + phraseScore + dashScore + ttrScore + paraScore;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  if (signals.length === 0) signals.push('未检出明显 AI 特征，文本风格自然');
  return { score, level, signals, suspectSpans, provider: 'heuristic' };
}

async function detectGPTZero(text) {
  const key = aiSettings.snapshot().gptzero_key || '';
  if (!key) throw new AiError('detect_not_configured', 'GPTZero API Key 未配置（在 后台设置 → AI 接入 中填写）');
  const res = await fetch('https://api.gptzero.me/v2/predict/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    body: JSON.stringify({ document: text }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) throw new AiError('detect_upstream', `GPTZero 返回 ${res.status}`);
  const doc = (json.documents && json.documents[0]) || {};
  const aiProb = Number(doc.completely_generated_prob || doc.average_generated_prob || 0);
  const score = Math.round(aiProb * 100);
  const flagged = (doc.sentences || [])
    .filter((s) => s.generated_prob > 0.7)
    .slice(0, 5)
    .map((s) => s.sentence);
  return {
    score,
    level: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low',
    signals: flagged.length
      ? [`GPTZero 标记 ${flagged.length} 个高 AI 概率句子`]
      : [`GPTZero 总体 AI 概率: ${score}%`],
    suspectSpans: flagged,
    provider: 'gptzero',
  };
}

async function detectSapling(text) {
  const key = aiSettings.snapshot().sapling_key || '';
  if (!key) throw new AiError('detect_not_configured', 'Sapling API Key 未配置（在 后台设置 → AI 接入 中填写）');
  const res = await fetch('https://api.sapling.ai/api/v1/aidetect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, text }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) throw new AiError('detect_upstream', `Sapling 返回 ${res.status}`);
  const score = Math.round(Number(json.score || 0) * 100);
  const flagged = (json.sentence_scores || [])
    .filter((s) => s.score > 0.7)
    .slice(0, 5)
    .map((s) => s.sentence);
  return {
    score,
    level: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low',
    signals: [`Sapling AI 概率: ${score}%${flagged.length ? '，标记 ' + flagged.length + ' 个高风险句子' : ''}`],
    suspectSpans: flagged,
    provider: 'sapling',
  };
}

async function detectAi({ text }) {
  const plain = htmlToText(text);
  if (!plain || plain.length < 30) {
    return { score: 0, level: 'low', signals: ['文本过短'], suspectSpans: [], provider: 'heuristic' };
  }
  const env = getEnv();
  const heuristic = detectHeuristic(plain);
  if (env.detectProvider === 'gptzero') {
    try { return await detectGPTZero(plain); }
    catch (err) {
      heuristic.signals.unshift(`GPTZero 调用失败 (${err.message})，回退到内置启发式检测`);
      return heuristic;
    }
  }
  if (env.detectProvider === 'sapling') {
    try { return await detectSapling(plain); }
    catch (err) {
      heuristic.signals.unshift(`Sapling 调用失败 (${err.message})，回退到内置启发式检测`);
      return heuristic;
    }
  }
  return heuristic;
}

module.exports = {
  AiError,
  PROVIDER_META,
  isConfigured,
  listProviders,
  getEnv,
  generateArticle,
  translateArticle,
  humanizeArticle,
  detectAi,
  htmlToText,
};
