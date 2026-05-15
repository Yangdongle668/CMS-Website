// =====================================================================
// Emergency NDJSON store — last-resort sink for inquiries when PostgreSQL
// is unreachable. Each line is a JSON record. On boot, replay() reads
// the file back and re-attempts insertion; successful rows are dropped,
// failures stay in the file for the next try.
//
// The directory is configurable (EMERGENCY_DIR, default ./data) so
// operators can mount it as a named volume in docker-compose, ensuring
// the file survives container restarts.
// =====================================================================
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

const DEFAULT_DIR = path.join(__dirname, '..', '..', 'data');
const FILE_NAME = 'inquiries-emergency.ndjson';

function fileDir() {
  return process.env.EMERGENCY_DIR || DEFAULT_DIR;
}

function filePath() {
  return path.join(fileDir(), FILE_NAME);
}

async function ensureDir() {
  await fs.mkdir(fileDir(), { recursive: true });
}

// Synchronous variant — used inside the inquiries route's DB-failure
// branch where we want the bytes hitting disk BEFORE returning the
// HTTP response. fsync-on-close is implicit in appendFileSync since
// the file is opened/closed for each call. Acceptable cost: this only
// runs when PG is already broken.
function appendSync(record) {
  try {
    fsSync.mkdirSync(fileDir(), { recursive: true });
    fsSync.appendFileSync(filePath(), JSON.stringify(record) + '\n', 'utf8');
    return true;
  } catch (err) {
    console.error('[emergency] appendSync failed:', err && err.message);
    return false;
  }
}

async function append(record) {
  await ensureDir();
  await fs.appendFile(filePath(), JSON.stringify(record) + '\n', 'utf8');
}

async function readAll() {
  let raw;
  try {
    raw = await fs.readFile(filePath(), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return raw.split('\n').filter(Boolean).map((line) => {
    try { return JSON.parse(line); }
    catch (_) { return null; }
  }).filter(Boolean);
}

async function rewrite(records) {
  await ensureDir();
  const body = records.map((r) => JSON.stringify(r)).join('\n');
  await fs.writeFile(filePath(), body + (body ? '\n' : ''), 'utf8');
}

// replay(insertFn) — calls insertFn for each record. If insertFn
// resolves the record is dropped from the file; if it throws, the
// record is kept for the next replay attempt.
async function replay(insertFn) {
  const records = await readAll();
  if (!records.length) return { recovered: 0, remaining: 0 };
  const remain = [];
  let recovered = 0;
  for (const rec of records) {
    try {
      await insertFn(rec);
      recovered++;
    } catch (err) {
      console.error('[emergency] replay failed for record:', err && err.message);
      remain.push(rec);
    }
  }
  await rewrite(remain);
  if (recovered) console.log(`[emergency] replayed ${recovered} inquiries (${remain.length} remain)`);
  return { recovered, remaining: remain.length };
}

async function count() {
  const records = await readAll();
  return records.length;
}

module.exports = { append, appendSync, replay, count, readAll, rewrite, filePath };
