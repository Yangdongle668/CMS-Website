// Background mail worker for the transactional outbox.
//
// Every 15s it claims a small batch of pending mails (FOR UPDATE SKIP LOCKED
// so multiple instances don't fight over the same row), tries to deliver via
// SMTP, and updates the row. Failures are retried with exponential backoff.
// After max_attempts (default 6) the row is parked as 'dead' for manual
// resend from the admin UI.

const { query, pool } = require('../db/client');
const { deliver } = require('../services/mailer');

const BATCH_SIZE = parseInt(process.env.MAIL_WORKER_BATCH || '10', 10);
const INTERVAL_MS = parseInt(process.env.MAIL_WORKER_INTERVAL_MS || '15000', 10);

// Backoff schedule. Index = current attempt count (after increment).
// 30s, 2min, 10min, 30min, 2h, 6h. After 6 attempts the row is dead.
const BACKOFF_SECONDS = [30, 120, 600, 1800, 7200, 21600];

let timer = null;
let ticking = false;

async function claimBatch() {
  // SKIP LOCKED so workers can scale horizontally without stepping on each other.
  // Pending rows whose next_attempt_at is due are claimed and moved to 'sending'
  // in a single statement to avoid the read-update race.
  const { rows } = await pool.query(
    `UPDATE mail_outbox
        SET status = 'sending', updated_at = now()
      WHERE id IN (
        SELECT id FROM mail_outbox
         WHERE status = 'pending' AND next_attempt_at <= now()
         ORDER BY next_attempt_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
      )
      RETURNING *`,
    [BATCH_SIZE]
  );
  return rows;
}

async function markSent(id) {
  await query(
    `UPDATE mail_outbox
        SET status = 'sent', sent_at = now(), updated_at = now(),
            attempts = attempts + 1, last_error = ''
      WHERE id = $1`,
    [id]
  );
}

async function markFailure(row, err) {
  const attempts = (row.attempts || 0) + 1;
  const dead = attempts >= (row.max_attempts || 6);
  const backoff = BACKOFF_SECONDS[Math.min(attempts - 1, BACKOFF_SECONDS.length - 1)];
  const msg = String((err && err.message) || err || 'unknown error').slice(0, 1500);

  await query(
    `UPDATE mail_outbox
        SET status          = $1,
            attempts        = $2,
            last_error      = $3,
            next_attempt_at = now() + ($4 || ' seconds')::interval,
            updated_at      = now()
      WHERE id = $5`,
    [dead ? 'dead' : 'pending', attempts, msg, String(backoff), row.id]
  );
}

async function processRow(row) {
  try {
    await deliver(row);
    await markSent(row.id);
    console.log(`[mail-worker] sent ${row.id} (${row.kind} -> ${row.to_addr})`);
  } catch (err) {
    await markFailure(row, err);
    console.warn(
      `[mail-worker] fail ${row.id} attempt=${(row.attempts || 0) + 1}/${row.max_attempts || 6}: ${err.message}`
    );
  }
}

async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    const batch = await claimBatch();
    if (!batch.length) return;
    // Process in parallel — SMTP is the bottleneck; each row uses its own connection from the pool.
    await Promise.all(batch.map(processRow));
  } catch (err) {
    console.error('[mail-worker] tick error', err);
  } finally {
    ticking = false;
  }
}

function start() {
  if (timer) return;
  // Recover from a previous unclean shutdown: anything stuck in 'sending'
  // should go back to 'pending' so it's retried this generation.
  query(
    `UPDATE mail_outbox
        SET status = 'pending', updated_at = now()
      WHERE status = 'sending'`
  ).catch((err) => console.error('[mail-worker] recovery failed', err));

  timer = setInterval(() => {
    tick().catch((err) => console.error('[mail-worker] unhandled tick error', err));
  }, INTERVAL_MS);
  // First run shortly after boot so seeded mails go out fast in dev.
  setTimeout(() => tick().catch(() => {}), 2000);
  console.log(`[mail-worker] started, interval=${INTERVAL_MS}ms batch=${BATCH_SIZE}`);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { start, stop, tick };
