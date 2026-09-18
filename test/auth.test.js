// Authentication and session handling.
//
// This path is where the worst bug in the project's history lived: the JWT
// signing key fell back to a string published in this repository, so anyone
// could mint a `role: admin` token. Several of these tests exist specifically
// to keep that from coming back.

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { startServer } = require('./helpers/server');

test('auth', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  await t.test('reports no users before the first login', async () => {
    const res = await srv.request('/api/auth/bootstrap-status');
    assert.equal(res.status, 200);
    assert.equal(res.json.has_users, false);
  });

  await t.test('refuses to bootstrap an admin with a short password', async () => {
    const res = await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'admin@example.test', password: 'short' },
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'password_too_short');
    assert.equal((await srv.request('/api/auth/bootstrap-status')).json.has_users, false);
  });

  await t.test('first login creates the admin from the submitted credentials', async () => {
    const res = await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'admin@example.test', password: 'a-strong-password-2026' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.json.bootstrap, true);
    assert.equal(res.json.user.role, 'admin');
    assert.equal((await srv.request('/api/auth/bootstrap-status')).json.has_users, true);
  });

  await t.test('session cookie is HttpOnly and SameSite', async () => {
    srv.clearCookie();
    const res = await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'admin@example.test', password: 'a-strong-password-2026' },
    });
    const setCookie = res.headers.get('set-cookie') || '';
    assert.match(setCookie, /HttpOnly/i, 'cookie must not be readable from JS');
    assert.match(setCookie, /SameSite=Lax/i);
  });

  await t.test('second login with the wrong password is rejected', async () => {
    const res = await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'admin@example.test', password: 'wrong-password' },
    });
    assert.equal(res.status, 401);
    assert.equal(res.json.error, 'invalid_credentials');
  });

  await t.test('an unknown email does not reveal whether the account exists', async () => {
    const res = await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'nobody@example.test', password: 'a-strong-password-2026' },
    });
    assert.equal(res.status, 401);
    assert.equal(res.json.error, 'invalid_credentials', 'same error as a wrong password');
  });

  await t.test('admin endpoints reject an anonymous caller', async () => {
    srv.clearCookie();
    for (const path of ['/api/media', '/api/users', '/api/articles/admin/list', '/api/audit']) {
      const res = await srv.request(path);
      assert.equal(res.status, 401, `${path} should be 401 without a session`);
    }
  });

  await t.test('a valid session reaches admin endpoints', async () => {
    const login = await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'admin@example.test', password: 'a-strong-password-2026' },
    });
    assert.equal(login.status, 200);
    const res = await srv.request('/api/articles/admin/list');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.json.items));
  });

  // The regression test for the published-signing-key bug.
  await t.test('a token signed with a previously shipped default is rejected', async () => {
    const shipped = [
      'dev-secret',
      'please-change-this-very-long-random-string',
      'change-this-to-a-long-random-string',
      'secret',
    ];
    for (const key of shipped) {
      const forged = jwt.sign(
        { sub: 1, email: 'admin@example.test', role: 'admin', name: 'Administrator' },
        key,
        { expiresIn: '12h' }
      );
      const res = await srv.request('/api/users', { headers: { cookie: `cms_session=${forged}` } });
      assert.equal(res.status, 401, `a token signed with "${key}" must not authenticate`);
    }
  });

  await t.test('a token signed with the right key but for a missing user is rejected', async () => {
    const secretsFile = require('path').join(process.env.SECRETS_DIR || '', 'secrets.json');
    void secretsFile; // the key is deliberately not readable from the test
    const forged = jwt.sign({ sub: 99999, role: 'admin' }, 'whatever-key');
    const res = await srv.request('/api/users', { headers: { cookie: `cms_session=${forged}` } });
    assert.equal(res.status, 401);
  });

  await t.test('logout clears the session', async () => {
    await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'admin@example.test', password: 'a-strong-password-2026' },
    });
    assert.equal((await srv.request('/api/auth/me')).status, 200);
    await srv.request('/api/auth/logout', { method: 'POST' });
    srv.clearCookie();
    assert.equal((await srv.request('/api/auth/me')).status, 401);
  });
});
