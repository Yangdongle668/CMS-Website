// Test harness: a real server on a real database.
//
// These are integration tests on purpose. The bugs this project has actually
// shipped — a schema that could not initialise, an upload endpoint that stored
// whatever extension the caller asked for, a middleware referencing a module it
// never required — all pass a unit test of the function in isolation and only
// show up when the process really boots and serves a request.
//
// Each run gets its own database (battery_cms_test_<pid>) so a failed run
// cannot poison the next one, and so several runs can go in parallel.

const { spawn } = require('child_process');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const ROOT = path.join(__dirname, '..', '..');

// Connection settings come from the environment so the same tests run against
// the CI service container and against a local socket.
const PG = {
  PGHOST: process.env.PGHOST || '/tmp',
  PGPORT: process.env.PGPORT || '5432',
  PGUSER: process.env.PGUSER || 'postgres',
  PGPASSWORD: process.env.PGPASSWORD || '',
};

function psqlEnv(db) {
  return { ...process.env, ...PG, PGDATABASE: db || 'postgres' };
}

// -q matters: without it an INSERT ... RETURNING prints the returned value AND
// psql's command tag ("1\nINSERT 0 1"), so callers reading a single id back get
// NaN and every dependent assertion fails somewhere far from the cause.
async function psql(sql, db) {
  const { stdout } = await execFileAsync('psql', ['-tAqc', sql], { env: psqlEnv(db) });
  return stdout.trim();
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitFor(fn, { timeoutMs = 45000, everyMs = 250, label = 'condition' } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      if (await fn()) return true;
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, everyMs));
  }
  throw new Error(`timed out waiting for ${label}${lastErr ? ': ' + lastErr.message : ''}`);
}

// Boots a server against a freshly created, freshly migrated database.
// Returns { url, db, request, stop, logs }.
async function startServer(opts = {}) {
  const db = `battery_cms_test_${process.pid}_${Math.random().toString(36).slice(2, 7)}`;
  await psql(`CREATE DATABASE ${db}`);

  const env = {
    ...process.env,
    ...PG,
    PGDATABASE: db,
    NODE_ENV: opts.nodeEnv || 'test',
    PORT: String(await freePort()),
    // Each server gets its own secrets dir so one run cannot read another's
    // signing key, and so the generate-and-persist path is exercised.
    SECRETS_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'cms-test-secrets-')),
    EMERGENCY_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'cms-test-data-')),
    CACHE_DISABLED: 'true',
    OUTBOX_DISABLED: 'true',
    HEALTH_ALERTS_DISABLED: 'true',
    // No SMTP in tests: mailer falls back to logging.
    SMTP_HOST: '',
    // Turnstile placeholder keys bypass verification outside production.
    TURNSTILE_SECRET_KEY: '0x000000000000000000',
    ...opts.env,
  };

  // Schema first, in-process, so a migration failure fails the test loudly
  // instead of showing up as a confusing 500 later.
  await execFileAsync('node', [path.join(ROOT, 'server', 'db', 'init.js')], { env });

  const child = spawn('node', [path.join(ROOT, 'server', 'index.js')], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const logs = [];
  child.stdout.on('data', (d) => logs.push(String(d)));
  child.stderr.on('data', (d) => logs.push(String(d)));

  const url = `http://127.0.0.1:${env.PORT}`;
  let cookie = '';

  // A tiny fetch wrapper that carries the session cookie between calls, so a
  // test can log in once and then act as that operator.
  async function request(pathname, init = {}) {
    // The jar supplies the cookie, but an explicit header wins — otherwise a
    // test that deliberately sends a forged token would silently be sending
    // the valid session from an earlier login instead.
    const headers = {};
    if (cookie) headers.cookie = cookie;
    Object.assign(headers, init.headers || {});
    let body = init.body;
    if (init.json !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(init.json);
    }
    const res = await fetch(url + pathname, { ...init, headers, body, redirect: 'manual' });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const m = setCookie.match(/(cms_session=[^;]*)/);
      if (m) cookie = m[1];
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (_) {
      /* not JSON — tests that care check `text` */
    }
    return { status: res.status, headers: res.headers, text, json };
  }

  try {
    await waitFor(
      async () => (await fetch(url + '/healthz').then((r) => r.ok, () => false)),
      { label: `server on ${url}` }
    );
  } catch (err) {
    child.kill('SIGKILL');
    throw new Error(err.message + '\n--- server output ---\n' + logs.join(''), { cause: err });
  }

  async function stop() {
    child.kill('SIGKILL');
    await new Promise((r) => child.once('exit', r));
    // Terminate lingering backends before dropping, or DROP DATABASE blocks.
    await psql(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${db}'`
    ).catch(() => {});
    await psql(`DROP DATABASE IF EXISTS ${db}`).catch(() => {});
    fs.rmSync(env.SECRETS_DIR, { recursive: true, force: true });
    fs.rmSync(env.EMERGENCY_DIR, { recursive: true, force: true });
  }

  return {
    url,
    db,
    request,
    stop,
    sql: (text) => psql(text, db),
    logs: () => logs.join(''),
    clearCookie: () => {
      cookie = '';
    },
  };
}

module.exports = { startServer, psql, waitFor };
