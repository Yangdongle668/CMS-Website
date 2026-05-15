// =====================================================================
// Mail outbox — at-least-once delivery for transactional emails.
//
// Design:
//   1. Producers call enqueue({ kind, to, subject, html, ... }) which
//      INSERTs into mail_outbox in a single statement. Returns instantly.
//   2. A polling worker (startWorker) atomically claims a batch with
//      UPDATE ... FOR UPDATE SKIP LOCKED, calls SMTP, and marks rows
//      sent / failed / dead.
//   3. Failed rows are retried with exponential backoff up to
//      max_attempts (default 8 → ~24h). Past that they go to 'dead'
//      and are surfaced in the admin queue panel for manual review.
//
// Why same-process: worker shares the pg pool with the web app; one
// container, zero ops overhead. To shard later, run a second container
// with WORKER_ONLY=true (HTTP server skipped) and the existing claim
// query keeps things race-free.
// =====================================================================
const os = require('os');
const { query, many, queryNoRetry } = require('../db/client');
const { getTransporter, defaultFrom } = require('./mailer');

const WORKER_ID = `${os.hostname()}-${process.pid}`;

// Exponential-ish backoff in seconds for attempts 1..N.
// 30s, 2m, 8m, 30m, 2h, 8h, 24h, 24h — total horizon ~33h.
const BACKOFF_SECONDS = [30, 120, 480, 1800, 7200, 28800, 86400, 86400];

async function enqueue(item) {
  if (!item || !item.kind || !item.to || !item.subject) {
    throw new Error('mail-outbox.enqueue: kind/to/subject required');
  }
  const attachments = Array.isArray(item.attachments) ? item.attachments : [];
  const r = await query(
    `INSERT INTO mail_outbox
       (kind, related_type, related_id, to_addr, reply_to, subject, html, text_body, attachments)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [
      item.kind,
      item.relatedType || '',
      item.relatedId || null,
      item.to,
      item.replyTo || '',
      item.subject,
      item.html || '',
      item.text || '',
      JSON.stringify(attachments),
    ]
  );
  return r.rows[0].id;
}

// Atomically claim up to `limit` due rows. FOR UPDATE SKIP LOCKED lets
// multiple workers run safely without race conditions or contention.
async function claimBatch(limit = 5) {
  return many(
    `UPDATE mail_outbox SET status='sending', locked_by=$1, locked_at=now()
     WHERE id IN (
       SELECT id FROM mail_outbox
       WHERE status IN ('pending','failed')
         AND next_attempt_at <= now()
         AND attempts < max_attempts
       ORDER BY next_attempt_at
       LIMIT $2
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [WORKER_ID, limit]
  );
}

async function processOne(job) {
  const t = getTransporter();
  const fromAddr = defaultFrom();
  try {
    await t.sendMail({
      from: fromAddr,
      to: job.to_addr,
      replyTo: job.reply_to || undefined,
      subject: job.subject,
      html: job.html,
      text: job.text_body || undefined,
      attachments: Array.isArray(job.attachments) ? job.attachments : [],
    });
    await query(
      `UPDATE mail_outbox
       SET status='sent', sent_at=now(), attempts=attempts+1,
           last_error='', locked_by='', locked_at=NULL
       WHERE id=$1`,
      [job.id]
    );
  } catch (err) {
    const nextAttempts = job.attempts + 1;
    const isDead = nextAttempts >= (job.max_attempts || 8);
    const backoff = BACKOFF_SECONDS[Math.min(job.attempts, BACKOFF_SECONDS.length - 1)];
    await query(
      `UPDATE mail_outbox
       SET status = $1,
           attempts = $2,
           last_error = $3,
           next_attempt_at = now() + ($4 || ' seconds')::interval,
           locked_by = '', locked_at = NULL
       WHERE id = $5`,
      [
        isDead ? 'dead' : 'failed',
        nextAttempts,
        String((err && err.message) || err).slice(0, 1000),
        String(backoff),
        job.id,
      ]
    );
    if (isDead) {
      console.error(`[outbox] DEAD LETTER mail#${job.id} (${job.kind}): ${err && err.message}`);
    } else {
      console.warn(`[outbox] mail#${job.id} failed (attempt ${nextAttempts}, retry in ${backoff}s): ${err && err.message}`);
    }
  }
}

// In-process polling worker. Safe to call twice — the second call is a
// no-op. Stops cleanly via stopWorker() (used by graceful shutdown).
let timer = null;
let running = false;

function startWorker(intervalMs) {
  if (timer || running) return;
  const interval = Math.max(1000, parseInt(intervalMs || process.env.OUTBOX_POLL_MS || '5000', 10));
  const batchSize = Math.max(1, parseInt(process.env.OUTBOX_BATCH || '5', 10));
  running = true;

  const tick = async () => {
    if (!running) return;
    try {
      const batch = await claimBatch(batchSize);
      for (const job of batch) {
        if (!running) break;
        await processOne(job);
      }
    } catch (e) {
      console.error('[outbox] worker tick error', e && e.message);
    } finally {
      if (running) timer = setTimeout(tick, interval);
    }
  };
  timer = setTimeout(tick, 1000);
  console.log(`[outbox] worker started (poll ${interval}ms, batch ${batchSize})`);
}

function stopWorker() {
  running = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

// Release any rows our worker had claimed before crashing. Called once
// at boot in case a prior process died mid-send. Uses queryNoRetry so
// a boot with PG temporarily down fails fast instead of stalling the
// listener for several seconds.
async function releaseStaleLocks(maxAgeMinutes) {
  const minutes = Math.max(1, maxAgeMinutes || 10);
  const r = await queryNoRetry(
    `UPDATE mail_outbox
     SET status='pending', locked_by='', locked_at=NULL
     WHERE status='sending'
       AND locked_at < now() - ($1 || ' minutes')::interval`,
    [String(minutes)]
  );
  if (r.rowCount) console.log(`[outbox] released ${r.rowCount} stale sending lock(s)`);
  return r.rowCount;
}

module.exports = {
  enqueue,
  claimBatch,
  processOne,
  startWorker,
  stopWorker,
  releaseStaleLocks,
  WORKER_ID,
  BACKOFF_SECONDS,
};
