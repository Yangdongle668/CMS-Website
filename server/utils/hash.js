const crypto = require('crypto');

function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function shortRef(prefix = 'INQ') {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { sha256, shortRef, randomToken };
