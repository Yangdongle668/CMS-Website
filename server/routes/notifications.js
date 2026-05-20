// =====================================================================
// Notification settings admin routes — configure WeChat / Telegram /
// Slack / generic webhook channels for realtime inquiry pushes.
// =====================================================================
const express = require('express');
const { one, query } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { trimStr, asBool, clamp } = require('../utils/validate');
const notifications = require('../services/notifications');

const router = express.Router();

router.get('/', requireAuth, async (_req, res) => {
  res.json({ config: await notifications.describeConfig() });
});

router.put('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  // Sensitive fields (bot_token, webhook_url) accept empty-string-means-keep.
  // We merge with the previous stored value so a routine save without
  // re-entering the token doesn't blank it.
  const existing = await one(`SELECT value FROM settings WHERE key = 'notifications'`);
  const prev = (existing && existing.value && typeof existing.value === 'object') ? existing.value : {};

  function mergeUrl(prevVal, newVal) {
    const v = (newVal || '').trim();
    if (!v || v.includes('****')) return prevVal || '';
    return v;
  }
  function mergeToken(prevVal, newVal) {
    const v = (newVal || '').trim();
    if (!v || v.includes('****')) return prevVal || '';
    return v;
  }

  const value = {
    wechat: {
      enabled: asBool(b.wechat && b.wechat.enabled),
      webhook_url: mergeUrl(prev.wechat && prev.wechat.webhook_url, b.wechat && b.wechat.webhook_url),
    },
    telegram: {
      enabled: asBool(b.telegram && b.telegram.enabled),
      bot_token: mergeToken(prev.telegram && prev.telegram.bot_token, b.telegram && b.telegram.bot_token),
      chat_id: trimStr((b.telegram && b.telegram.chat_id) || '', 60),
    },
    slack: {
      enabled: asBool(b.slack && b.slack.enabled),
      webhook_url: mergeUrl(prev.slack && prev.slack.webhook_url, b.slack && b.slack.webhook_url),
    },
    generic: {
      enabled: asBool(b.generic && b.generic.enabled),
      url: trimStr((b.generic && b.generic.url) || '', 500),
      headers: (b.generic && typeof b.generic.headers === 'object') ? b.generic.headers : {},
    },
    trigger: {
      score_min: clamp(b.trigger && b.trigger.score_min, 0, 100, 0),
      widgets: Array.isArray(b.trigger && b.trigger.widgets) ? b.trigger.widgets : [],
    },
  };

  await query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('notifications', $1::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(value)]
  );
  notifications.resetCache();
  await notifications.loadConfig();
  await recordAudit({ req, action: 'update', entity: 'settings', detail: { key: 'notifications' } });
  res.json({ ok: true, config: await notifications.describeConfig() });
});

router.post('/test/:channel', requireAuth, async (req, res) => {
  const channel = trimStr(req.params.channel, 20);
  if (!['wechat', 'telegram', 'slack', 'generic'].includes(channel)) {
    return res.status(400).json({ error: 'unknown_channel' });
  }
  try {
    const result = await notifications.sendTest(channel);
    res.json({ ok: true, channel, result });
  } catch (err) {
    res.status(502).json({
      error: 'channel_failed',
      channel,
      detail: (err && err.message) || 'unknown error',
    });
  }
});

module.exports = router;
