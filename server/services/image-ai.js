// =====================================================================
// AI alt-text generator for images.
//
// Sends the image to a vision-capable LLM (Anthropic Claude or OpenAI
// gpt-4o family) and asks for a short, SEO-friendly alt description.
//
// Why a separate module from ai-generator.js: vision payloads have a
// different message shape than text-only ones, and we only want to
// load images for two specific providers. The rest of the AI plumbing
// (provider config, API keys, default models) is reused.
// =====================================================================

const path = require('path');
const fs = require('fs/promises');
const aiSettings = require('./ai-settings');

class AltAiError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const ROOT = path.join(__dirname, '..', '..');

const ALT_SYSTEM_PROMPT = `You are an accessibility and SEO expert generating concise <img alt> attributes
for a B2B manufacturing website. Output ONE plain sentence, 10-16 words, NO leading "Image of" /
"A photo of" / "Picture showing", NO quotes, NO trailing period required.
The description should be useful to a screen-reader user AND to search engines — concrete,
specific, mentioning visible products or context.`;

function pickVisionProvider() {
  const snap = aiSettings.snapshot();
  const providers = snap.providers || {};
  // Prefer providers known to support vision in their default model
  if (providers.openai && providers.openai.api_key) {
    return {
      provider: 'openai',
      model: providers.openai.model || 'gpt-4o-mini',
      apiKey: providers.openai.api_key,
      url: 'https://api.openai.com/v1/chat/completions',
      style: 'openai',
    };
  }
  if (providers.anthropic && providers.anthropic.api_key) {
    return {
      provider: 'anthropic',
      model: providers.anthropic.model || 'claude-sonnet-4-6',
      apiKey: providers.anthropic.api_key,
      url: 'https://api.anthropic.com/v1/messages',
      style: 'anthropic',
    };
  }
  // env var fallback
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY,
      url: 'https://api.openai.com/v1/chat/completions',
      style: 'openai',
    };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      apiKey: process.env.ANTHROPIC_API_KEY,
      url: 'https://api.anthropic.com/v1/messages',
      style: 'anthropic',
    };
  }
  return null;
}

// Convert a local /uploads/... path into a data URL the vision API
// can consume directly. We deliberately avoid passing public URLs even
// when PUBLIC_URL is set, because some upload buckets are behind a CDN
// the vision provider can't reach (and base64 is universally portable).
async function urlToBase64DataUrl(url) {
  // Absolute external URL — pass through to the LLM, it will fetch.
  if (/^https?:\/\//i.test(url)) {
    return { kind: 'url', value: url };
  }
  // Local /uploads/ path — read file, base64.
  const relPath = url.replace(/^\/+/, '');
  const absPath = path.join(ROOT, relPath);
  const buf = await fs.readFile(absPath);
  if (buf.length > 5 * 1024 * 1024) {
    throw new AltAiError('image_too_large', '图片大于 5MB，无法发送给视觉模型');
  }
  const ext = path.extname(absPath).slice(1).toLowerCase();
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
            : ext === 'png' ? 'image/png'
            : ext === 'webp' ? 'image/webp'
            : ext === 'avif' ? 'image/avif'
            : ext === 'gif' ? 'image/gif'
            : 'image/jpeg';
  return { kind: 'base64', value: buf.toString('base64'), mime };
}

async function callOpenAIVision(provider, imageRef, hint) {
  const userContent = [
    { type: 'text', text: hint ? `Context: ${hint}\n\nDescribe this image for the alt attribute.` : 'Describe this image for the alt attribute.' },
  ];
  if (imageRef.kind === 'url') {
    userContent.push({ type: 'image_url', image_url: { url: imageRef.value } });
  } else {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:${imageRef.mime};base64,${imageRef.value}` },
    });
  }
  const body = {
    model: provider.model,
    max_tokens: 200,
    temperature: 0.3,
    messages: [
      { role: 'system', content: ALT_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  };
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new AltAiError('upstream_error',
      `OpenAI 视觉接口错误：${(json && json.error && json.error.message) || ('HTTP ' + res.status)}`);
  }
  const text = json && json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
  if (!text) throw new AltAiError('empty_response', 'OpenAI 未返回内容');
  return String(text).trim().replace(/^["']|["']$/g, '');
}

async function callAnthropicVision(provider, imageRef, hint) {
  const content = [];
  if (imageRef.kind === 'url') {
    content.push({ type: 'image', source: { type: 'url', url: imageRef.value } });
  } else {
    content.push({ type: 'image', source: { type: 'base64', media_type: imageRef.mime, data: imageRef.value } });
  }
  content.push({ type: 'text', text: hint ? `Context: ${hint}\n\nDescribe this image for the alt attribute.` : 'Describe this image for the alt attribute.' });

  const body = {
    model: provider.model,
    max_tokens: 200,
    temperature: 0.3,
    system: ALT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  };
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new AltAiError('upstream_error',
      `Anthropic 视觉接口错误：${(json && json.error && json.error.message) || ('HTTP ' + res.status)}`);
  }
  const text = (json.content || []).filter((b) => b && b.type === 'text').map((b) => b.text).join(' ').trim();
  if (!text) throw new AltAiError('empty_response', 'Anthropic 未返回内容');
  return text.replace(/^["']|["']$/g, '');
}

async function generateAlt(imageUrl, hint) {
  const provider = pickVisionProvider();
  if (!provider) {
    throw new AltAiError('ai_not_configured',
      '未配置支持视觉的 AI（需要 OpenAI gpt-4o 或 Claude）。到后台 → 设置 → AI 接入填写 API Key。');
  }
  let imageRef;
  try {
    imageRef = await urlToBase64DataUrl(imageUrl);
  } catch (err) {
    if (err instanceof AltAiError) throw err;
    throw new AltAiError('image_read_failed', `读取图片失败：${err.message}`);
  }
  let alt;
  if (provider.style === 'openai') {
    alt = await callOpenAIVision(provider, imageRef, hint);
  } else {
    alt = await callAnthropicVision(provider, imageRef, hint);
  }
  // Light cleanup: collapse whitespace, strip trailing period, cap 255 chars
  alt = alt.replace(/\s+/g, ' ').trim().replace(/\.$/, '').slice(0, 255);
  return { alt, provider: provider.provider, model: provider.model };
}

module.exports = { generateAlt };
