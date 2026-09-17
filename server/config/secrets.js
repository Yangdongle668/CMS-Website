// Secret resolution — JWT signing key and cookie signing key.
//
// Resolution order per secret:
//   1. An explicit environment variable (JWT_SECRET / COOKIE_SECRET)
//   2. A value generated on an earlier boot and persisted on the data volume
//   3. A freshly generated value, persisted for next time
//
// Why generate rather than refuse to boot:
//   The README's headline is a one-command deploy with no .env file.
//   Refusing to start without secrets would break that promise; shipping
//   a default (the previous behaviour) meant every deployment signed its
//   admin sessions with a key published in this repository — anyone could
//   mint their own `role: admin` token. Generating on first boot keeps
//   both properties: the stack still comes up with zero configuration,
//   and no two deployments share a key.
//
// Persistence matters: without it every restart would produce a new
// signing key and silently log every admin out.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SECRET_NAMES = ['JWT_SECRET', 'COOKIE_SECRET'];
const MIN_LENGTH = 32;
const FILE_NAME = 'secrets.json';

// Placeholder values that have shipped in this repo's docker-compose.yml,
// .env.example or source. Treated as absent rather than as a usable
// secret, so an old .env copied forward cannot silently weaken a new
// deployment. Compared case-insensitively.
const KNOWN_WEAK = new Set([
  'dev-secret',
  'dev-cookie-secret',
  'please-change-this-very-long-random-string',
  'please-change-this-too-please',
  'replace-with-64-chars-of-randomness',
  'replace-with-another-64-chars',
  'changeme',
  'change-me',
  'secret',
  'password',
  'postgres',
]);

function isUsable(value) {
  if (!value) return false;
  const s = String(value).trim();
  if (!s) return false;
  if (KNOWN_WEAK.has(s.toLowerCase())) return false;
  // A placeholder can be long enough to pass a length check, which is why
  // the explicit list above exists; the length check catches everything else.
  if (s.length < MIN_LENGTH) return false;
  return true;
}

function generate() {
  // 48 bytes → 64 base64url characters, no padding or shell-hostile chars.
  return crypto.randomBytes(48).toString('base64url');
}

// The directory that survives container restarts. In the Docker stack this
// is the `cms-data` named volume mounted at /app/data (already exported as
// EMERGENCY_DIR for the offline inquiry store). Outside Docker it falls
// back to ./data next to the repo root.
function resolveDataDir() {
  return (
    process.env.SECRETS_DIR ||
    process.env.EMERGENCY_DIR ||
    path.join(__dirname, '..', '..', 'data')
  );
}

function readPersisted(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    // ENOENT on first boot is the normal path. Anything else (corrupt JSON,
    // permissions) is worth a line in the log before we regenerate.
    if (err && err.code !== 'ENOENT') {
      console.warn('[secrets] could not read %s (%s) — regenerating', file, err.message);
    }
    return {};
  }
}

function writePersisted(file, payload) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n', { mode: 0o600 });
  // writeFileSync only applies `mode` when creating the file, so an existing
  // file keeps whatever permissions it had. Set them explicitly.
  try {
    fs.chmodSync(file, 0o600);
  } catch (err) {
    console.warn('[secrets] could not tighten permissions on %s: %s', file, err.message);
  }
}

function resolveAll() {
  const file = path.join(resolveDataDir(), FILE_NAME);
  const persisted = readPersisted(file);
  const resolved = {};
  const generated = [];

  for (const name of SECRET_NAMES) {
    const fromEnv = process.env[name];
    if (isUsable(fromEnv)) {
      resolved[name] = String(fromEnv).trim();
      continue;
    }
    if (fromEnv && String(fromEnv).trim()) {
      console.warn(
        '[secrets] %s is a known placeholder or shorter than %d characters — ignoring it',
        name,
        MIN_LENGTH
      );
    }
    if (isUsable(persisted[name])) {
      resolved[name] = String(persisted[name]).trim();
      continue;
    }
    resolved[name] = generate();
    persisted[name] = resolved[name];
    generated.push(name);
  }

  if (generated.length) {
    try {
      writePersisted(file, persisted);
    } catch (err) {
      // Failing loudly here is deliberate. If the generated secret cannot be
      // persisted, the next restart generates a different one and every admin
      // session dies without explanation — a far more confusing failure than
      // refusing to boot with a message that says exactly what to do.
      throw new Error(
        `FATAL: generated ${generated.join(' and ')} but could not persist to ${file} ` +
          `(${err.message}). Set ${generated.join(' and ')} explicitly in the environment, ` +
          `or make that directory writable (override the location with SECRETS_DIR).`
      );
    }
    console.log(
      '[secrets] generated and stored %s in %s — override by setting the matching env var(s)',
      generated.join(', '),
      file
    );
  }

  return resolved;
}

let cache = null;
function all() {
  if (!cache) cache = resolveAll();
  return cache;
}

// Deployment checks for secrets this process cannot fix on its own.
//
// PGPASSWORD is deliberately a warning rather than a hard failure: the
// database volume was initialised with whatever password was in effect at
// the time, so the app cannot rotate it, and `docker-compose.yml` does not
// publish the db port — Postgres is reachable only on the compose network.
// Refusing to boot would break existing deployments over a risk the
// operator has to resolve with `ALTER USER` plus an env change anyway.
function assertDeploymentSanity() {
  const problems = [];

  if (!isUsable(process.env.PGPASSWORD)) {
    problems.push(
      'PGPASSWORD is unset or a well-known value. The database port is not published ' +
        'outside the compose network, so this is not immediately exploitable, but rotate it ' +
        'before exposing Postgres: ALTER USER <user> WITH PASSWORD \'<new>\'; then update .env.'
    );
  }

  const adminPassword = String(process.env.ADMIN_DEFAULT_PASSWORD || '').trim();
  if (adminPassword && !isUsable(adminPassword)) {
    problems.push(
      'ADMIN_DEFAULT_PASSWORD is set to a weak or well-known value. Unset it and let the ' +
        'first login bootstrap the admin account with credentials you choose ' +
        '(see server/routes/auth.js).'
    );
  }

  for (const line of problems) console.warn('[secrets] WARNING: %s', line);
  return problems;
}

module.exports = {
  get jwtSecret() {
    return all().JWT_SECRET;
  },
  get cookieSecret() {
    return all().COOKIE_SECRET;
  },
  assertDeploymentSanity,
  // Exported for tests.
  _internal: { isUsable, generate, KNOWN_WEAK, MIN_LENGTH },
};
