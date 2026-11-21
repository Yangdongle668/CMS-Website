// =====================================================================
// Health alert job — polls a handful of "the lights are on" invariants
// every few minutes and emails the sales team if any have tripped.
//
// Alerts go through the mail outbox like any other email, but we
// de-bounce per reason for 30 minutes so a sustained outage doesn't
// flood the inbox. Each reason has its own debounce window kept in
// memory; the process restart resets it (acceptable — fresh boot is
// itself a signal a human should see the current state).
// =====================================================================
const { one } = require('../db/client');
const { enqueue } = require('../services/mail-outbox');
const { buildHealthAlertMail } = require('../services/mail-templates');
const emergency = require('../services/emergency-store');

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
const DEBOUNCE_MS = 30 * 60 * 1000;
const lastFired = new Map();   // reason → ms timestamp

function debounce(reason) {
  const now = Date.now();
  const last = lastFired.get(reason) || 0;
  if (now - last < DEBOUNCE_MS) return false;
  lastFired.set(reason, now);
  return true;
}

async function checks() {
  const out = [];

  // 1. Dead letters in the last 6 hours
  try {
    const r = await one(
      `SELECT count(*)::int AS n FROM mail_outbox
       WHERE status='dead' AND created_at > now() - interval '6 hours'`
    );
    if (r && r.n > 0) out.push(`Mail outbox has ${r.n} dead-letter message(s) in the last 6 hours`);
  } catch (_) {}

  // 2. Internal inquiry alert email overdue by 10+ minutes
  try {
    const r = await one(
      `SELECT count(*)::int AS n FROM mail_outbox
       WHERE kind = 'inquiry_internal'
         AND status IN ('pending','failed')
         AND created_at < now() - interval '10 minutes'`
    );
    if (r && r.n > 0) out.push(`${r.n} inquiry alert email(s) overdue by >10 minutes — check SMTP`);
  } catch (_) {}

  // 3. Emergency NDJSON file has un-replayed inquiries
  try {
    const c = await emergency.count();
    if (c > 0) out.push(`${c} inquiry record(s) sitting in the emergency store waiting for DB replay`);
  } catch (_) {}

  return out;
}

async function tick() {
  let reasons = [];
  try {
    reasons = await checks();
  } catch (err) {
    console.error('[health-alert] checks failed:', err && err.message);
    return;
  }
  if (!reasons.length) return;

  // Dedup per-reason: only enqueue reasons whose debounce window has elapsed
  const fresh = reasons.filter(debounce);
  if (!fresh.length) return;

  try {
    const msg = buildHealthAlertMail(fresh);
    await enqueue({ kind: 'health_alert', relatedType: 'system', ...msg });
    console.warn('[health-alert] dispatched:', fresh.join(' | '));
  } catch (err) {
    console.error('[health-alert] enqueue failed:', err && err.message);
  }
}

let timer = null;
function start(intervalMs) {
  if (timer) return;
  const interval = intervalMs || parseInt(process.env.HEALTH_ALERT_INTERVAL_MS || String(DEFAULT_INTERVAL_MS), 10);
  // Stagger first run by 60s so boot-time noise doesn't trigger immediately.
  setTimeout(() => {
    tick().catch(() => {});
    timer = setInterval(tick, interval);
  }, 60_000).unref();
  console.log(`[health-alert] scheduler started (interval ${interval}ms)`);
}

function stop() {
  if (timer) { clearInterval(timer); timer = null; }
}

module.exports = { start, stop, tick, checks };
