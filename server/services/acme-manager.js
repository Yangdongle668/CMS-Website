'use strict';
// ACME / Let's Encrypt certificate provisioning.
// Uses HTTP-01 challenges served by the companion ssl-server.js HTTP listener
// on port 80. Both @ and www alt-names are included in every certificate so
// the operator only has to add two A records — no CNAME needed.

const fs = require('fs');
const path = require('path');

const CERTS_DIR = process.env.CERTS_DIR || path.resolve(__dirname, '../../certs');

// Token → keyAuthorization map shared with the HTTP-01 challenge handler in
// ssl-server.js. Entries are added just before Let's Encrypt polls and
// removed once it confirms the challenge.
const challengeTokens = new Map();

function certDir(domain) {
  // Sanitise domain so it's safe as a directory name.
  return path.join(CERTS_DIR, domain.replace(/[^a-zA-Z0-9.-]/g, '_'));
}

function certExists(domain) {
  return fs.existsSync(path.join(certDir(domain), 'cert.pem'));
}

function loadCert(domain) {
  const dir = certDir(domain);
  return {
    key: fs.readFileSync(path.join(dir, 'key.pem')),
    cert: fs.readFileSync(path.join(dir, 'cert.pem')),
  };
}

function getCertExpiry(domain) {
  try {
    const { cert } = loadCert(domain);
    const x509 = new (require('crypto').X509Certificate)(cert);
    return new Date(x509.validTo);
  } catch (_) { return null; }
}

async function loadOrCreateAccountKey() {
  const keyPath = path.join(CERTS_DIR, 'account.key');
  if (fs.existsSync(keyPath)) return fs.readFileSync(keyPath);
  const acme = require('acme-client');
  const accountKey = await acme.crypto.createPrivateKey();
  fs.mkdirSync(CERTS_DIR, { recursive: true });
  fs.writeFileSync(keyPath, accountKey, { mode: 0o600 });
  return accountKey;
}

// Provision (or renew) a certificate for `domain` via Let's Encrypt.
// Certificates include both the apex (`domain`) and `www.{domain}`.
// `email` is used for the ACME account registration (expiry alerts etc.)
// `staging` uses the Let's Encrypt staging CA — useful for testing.
async function provisionCert(domain, { email, staging = false } = {}) {
  const acme = require('acme-client');
  fs.mkdirSync(CERTS_DIR, { recursive: true });

  const accountKey = await loadOrCreateAccountKey();
  const directoryUrl = staging
    ? acme.directory.letsencrypt.staging
    : acme.directory.letsencrypt.production;

  const client = new acme.Client({ directoryUrl, accountKey });

  const altNames = [domain];
  if (!domain.startsWith('www.')) altNames.push(`www.${domain}`);

  const [privateKey, csr] = await acme.crypto.createCsr({ altNames });

  const certificate = await client.auto({
    csr,
    email: email || process.env.ACME_EMAIL || '',
    termsOfServiceAgreed: true,
    challengePriority: ['http-01'],
    challengeCreateFn: async (_authz, challenge, keyAuthorization) => {
      if (challenge.type === 'http-01') {
        challengeTokens.set(challenge.token, keyAuthorization);
      }
    },
    challengeRemoveFn: async (_authz, challenge) => {
      challengeTokens.delete(challenge.token);
    },
  });

  const dir = certDir(domain);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'key.pem'), privateKey, { mode: 0o600 });
  fs.writeFileSync(path.join(dir, 'cert.pem'), certificate);

  return { key: privateKey, cert: certificate };
}

function getChallengeResponse(token) {
  return challengeTokens.get(token);
}

module.exports = { certExists, loadCert, getCertExpiry, provisionCert, getChallengeResponse };
