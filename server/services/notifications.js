// =====================================================================
// Realtime inquiry notifications — multi-channel webhook dispatcher.
//
// Channels supported (each independently enabled in settings):
//   - WeChat Work / 企业微信 group bot (qyapi.weixin.qq.com webhook)
//   - Telegram bot (api.telegram.org/botTOKEN/sendMessage)
//   - Slack-compatible incoming webhook (Slack / Lark / Mattermost work)
//   - Generic webhook (raw POST of the inquiry JSON to any URL)
//
// Each delivery is fire-and-forget with a 5s timeout. Failures get
// logged but never retried — if the WeChat bot is offline for an hour,
// we don't want to flood it with backlogged old inquiries when it
// comes back. Sales will see the inquiry in the admin inbox + email
// regardless.
// =====================================================================

const TIMEOUT_MS = 5000;

let cachedConfig = null;

async function loadConfig() {
  try {
    const { one } = require('../db/client');
    const row = await one(`SELECT value FROM settings WHERE key = 'notifications'`);
    cachedConfig = (row && row.value && typeof row.value === 'object') ? row.value : {};
  } catch (_) {
    cachedConfig = {};
  }
  return cachedConfig;
}

function resetCache() { cachedConfig = null; }

async function getConfig() {
  if (!cachedConfig) await loadConfig();
  return cachedConfig || {};
}

// Returns a redacted view safe to surface in the admin UI (tokens
// truncated). The "configured" booleans tell the UI whether the channel
// has been set up at all.
async function describeConfig() {
  const c = await getConfig();
  function mask(s) {
    if (!s || typeof s !== 'string') return '';
    if (s.length <= 8) return '****';
    return s.slice(0, 4) + '****' + s.slice(-4);
  }
  return {
    wechat: {
      enabled: !!(c.wechat && c.wechat.enabled),
      webhook_url_preview: c.wechat && c.wechat.webhook_url
        ? c.wechat.webhook_url.replace(/key=([^&]+)/, (_, k) => 'key=' + mask(k))
        : '',
      configured: !!(c.wechat && c.wechat.webhook_url),
    },
    telegram: {
      enabled: !!(c.telegram && c.telegram.enabled),
      bot_token_preview: mask(c.telegram && c.telegram.bot_token),
      chat_id: (c.telegram && c.telegram.chat_id) || '',
      configured: !!(c.telegram && c.telegram.bot_token && c.telegram.chat_id),
    },
    slack: {
      enabled: !!(c.slack && c.slack.enabled),
      webhook_url_preview: c.slack && c.slack.webhook_url
        ? c.slack.webhook_url.replace(/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/, 'T****/B****/****')
        : '',
      configured: !!(c.slack && c.slack.webhook_url),
    },
    generic: {
      enabled: !!(c.generic && c.generic.enabled),
      url: (c.generic && c.generic.url) || '',
      configured: !!(c.generic && c.generic.url),
    },
    trigger: c.trigger || {},
  };
}

// fetch with a timeout (Node 22's global fetch supports AbortController)
async function fetchWithTimeout(url, opts, timeoutMs) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs || TIMEOUT_MS);
  try {
    const res = await fetch(url, Object.assign({}, opts, { signal: ac.signal }));
    return res;
  } finally { clearTimeout(t); }
}

// ---------- Channel-specific senders ----------

async function sendWechat(cfg, inq) {
  if (!cfg.webhook_url) throw new Error('wechat: webhook_url missing');
  // Use markdown msgtype — 企业微信 supports basic md. Keep concise:
  // sales reads on a phone, doesn't want a wall of text.
  const hot = (inq.score || 0) >= 60;
  const lines = [
    (hot ? '🔥 ' : '📧 ') + '**新询盘** <font color="info">' + (inq.reference || '') + '</font>',
    '',
    '> **公司**：' + (inq.company || inq.full_name || '-'),
    '> **邮箱**：' + (inq.email || '-'),
    inq.phone ? '> **电话**：' + inq.phone : null,
    inq.country ? '> **国家**：' + inq.country : null,
    inq.application ? '> **应用**：' + inq.application : null,
    inq.annual_volume ? '> **年量**：' + inq.annual_volume : null,
    '> **分数**：<font color="' + (hot ? 'warning' : 'comment') + '">' + (inq.score || 0) + '</font>',
    '> **来源**：' + (inq.source_page || '-'),
    '',
    '**内容**：' + String(inq.message || '').slice(0, 400),
  ].filter(Boolean).join('\n');

  const res = await fetchWithTimeout(cfg.webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msgtype: 'markdown', markdown: { content: lines } }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || (json && json.errcode && json.errcode !== 0)) {
    throw new Error('wechat: ' + (json && json.errmsg || ('HTTP ' + res.status)));
  }
  return json;
}

async function sendTelegram(cfg, inq) {
  if (!cfg.bot_token || !cfg.chat_id) throw new Error('telegram: bot_token + chat_id required');
  const hot = (inq.score || 0) >= 60;
  const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const text = [
    (hot ? '🔥 ' : '📧 ') + '<b>New inquiry</b> <code>' + esc(inq.reference) + '</code>',
    '',
    '<b>Company:</b> ' + esc(inq.company || inq.full_name || '-'),
    '<b>Email:</b> ' + esc(inq.email),
    inq.phone ? '<b>Phone:</b> ' + esc(inq.phone) : null,
    inq.country ? '<b>Country:</b> ' + esc(inq.country) : null,
    inq.application ? '<b>Application:</b> ' + esc(inq.application) : null,
    inq.annual_volume ? '<b>Annual volume:</b> ' + esc(inq.annual_volume) : null,
    '<b>Score:</b> ' + (inq.score || 0) + (hot ? ' 🔥' : ''),
    '<b>Source:</b> <code>' + esc(inq.source_page || '-') + '</code>',
    '',
    '<i>' + esc(String(inq.message || '').slice(0, 600)) + '</i>',
  ].filter(Boolean).join('\n');

  const url = 'https://api.telegram.org/bot' + cfg.bot_token + '/sendMessage';
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: cfg.chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || (json && !json.ok)) {
    throw new Error('telegram: ' + (json && json.description || ('HTTP ' + res.status)));
  }
  return json;
}

async function sendSlack(cfg, inq) {
  if (!cfg.webhook_url) throw new Error('slack: webhook_url missing');
  const hot = (inq.score || 0) >= 60;
  const text = (hot ? '🔥 ' : '📧 ') + 'New inquiry: ' + (inq.reference || '');
  const fields = [
    { title: 'Company', value: inq.company || inq.full_name || '-', short: true },
    { title: 'Email', value: inq.email || '-', short: true },
    inq.phone ? { title: 'Phone', value: inq.phone, short: true } : null,
    inq.country ? { title: 'Country', value: inq.country, short: true } : null,
    inq.application ? { title: 'Application', value: inq.application, short: true } : null,
    { title: 'Score', value: String(inq.score || 0) + (hot ? ' 🔥' : ''), short: true },
    inq.source_page ? { title: 'Source', value: inq.source_page, short: false } : null,
    { title: 'Message', value: String(inq.message || '').slice(0, 500), short: false },
  ].filter(Boolean);

  const res = await fetchWithTimeout(cfg.webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      attachments: [{ color: hot ? 'danger' : 'good', fields, ts: Math.floor(Date.now() / 1000) }],
    }),
  });
  if (!res.ok) throw new Error('slack: HTTP ' + res.status);
  return { ok: true };
}

async function sendGeneric(cfg, inq) {
  if (!cfg.url) throw new Error('generic: url missing');
  const headers = Object.assign({ 'Content-Type': 'application/json' }, cfg.headers || {});
  const res = await fetchWithTimeout(cfg.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ event: 'inquiry_created', inquiry: inq }),
  });
  if (!res.ok) throw new Error('generic: HTTP ' + res.status);
  return { ok: true };
}

// Decides whether this inquiry meets the configured trigger threshold.
function shouldNotify(cfg, inq) {
  const t = cfg.trigger || {};
  if (t.score_min != null && (inq.score || 0) < t.score_min) return false;
  if (Array.isArray(t.widgets) && t.widgets.length && inq.source_widget && !t.widgets.includes(inq.source_widget)) return false;
  return true;
}

// Fire-and-forget — called from the inquiry POST handler. Never throws,
// never blocks for more than ~5s per channel.
async function notifyInquiry(inquiry) {
  let cfg;
  try { cfg = await getConfig(); }
  catch (_) { return; }
  if (!cfg || !shouldNotify(cfg, inquiry)) return;

  const channels = [
    ['wechat',   cfg.wechat,   sendWechat],
    ['telegram', cfg.telegram, sendTelegram],
    ['slack',    cfg.slack,    sendSlack],
    ['generic',  cfg.generic,  sendGeneric],
  ];
  // Fan out in parallel; log per-channel failures
  await Promise.allSettled(channels.map(async ([name, chCfg, sender]) => {
    if (!chCfg || !chCfg.enabled) return;
    try {
      await sender(chCfg, inquiry);
    } catch (err) {
      console.warn(`[notify:${name}] failed:`, err && err.message);
    }
  }));
}

// Called by the admin "test" button. Returns the channel's raw response
// so the admin sees if there was a server-side error from the provider.
async function sendTest(channel, inquiryLike) {
  const cfg = await getConfig();
  const sample = Object.assign({
    reference: 'TEST-' + Date.now().toString(36).toUpperCase(),
    company: 'Test Company Ltd.',
    full_name: 'Test User',
    email: 'test@example.com',
    phone: '+1 555 0100',
    country: 'CN',
    application: 'Wearable medical device',
    annual_volume: '10000+ pcs/year',
    score: 75,
    source_page: '/contact.html',
    source_widget: 'main_form',
    message: '[Test message from CMS notification settings page]\nThis is a test inquiry to verify webhook delivery works.',
  }, inquiryLike || {});
  if (channel === 'wechat')   return sendWechat(cfg.wechat || {}, sample);
  if (channel === 'telegram') return sendTelegram(cfg.telegram || {}, sample);
  if (channel === 'slack')    return sendSlack(cfg.slack || {}, sample);
  if (channel === 'generic')  return sendGeneric(cfg.generic || {}, sample);
  throw new Error('unknown channel: ' + channel);
}

module.exports = {
  loadConfig,
  resetCache,
  describeConfig,
  notifyInquiry,
  sendTest,
};
