const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { startServer } = require('./helpers/server');

const originalImage = '/assets/img/seed/photo-1593642634443-44adaa06623a.jpg';

test('external reverse proxy and original homepage', async (t) => {
  const srv = await startServer({ seed: true, env: { PUBLIC_URL: 'https://battery.example.test' } });
  t.after(() => srv.stop());

  await t.test('HTTP stays ready behind the external HTTPS URL', async () => {
    const ready = await srv.request('/readyz', { headers: { 'x-forwarded-proto': 'https' } });
    assert.equal(ready.status, 200);
    assert.equal(ready.json.db, 'ok');
    const page = await srv.request('/');
    assert.equal(page.status, 200);
    assert.match(page.text, /rel="canonical" href="https:\/\/battery\.example\.test\//);
  });

  await t.test('the old certificate provisioning API is unavailable', async () => {
    const login = await srv.request('/api/auth/login', { method: 'POST', json: { email: 'proxy@test.local', password: 'proxy-test-password-2026' } });
    assert.equal(login.status, 200);
    for (const [url, method] of [['/api/domain', 'GET'], ['/api/domain/provision', 'POST']]) {
      assert.equal((await srv.request(url, { method, json: method === 'POST' ? { domain: 'example.test' } : undefined })).status, 404);
    }
  });

  await t.test('the original homepage image is actually served', async () => {
    assert.equal(await srv.sql("SELECT hero_image FROM pages WHERE slug='home'"), originalImage);
    const page = await srv.request('/');
    assert.ok(page.text.includes(originalImage));
    const image = await fetch(srv.url + originalImage);
    assert.equal(image.status, 200);
    assert.match(image.headers.get('content-type'), /image\/jpeg/);
  });

  await t.test('restoring defaults preserves a custom homepage upload', async () => {
    await srv.sql("UPDATE pages SET hero_image='/uploads/custom-home.webp' WHERE slug='home'");
    const sql = fs.readFileSync(path.join(__dirname, '..', 'server', 'db', 'migrate-restore-original-home.sql'), 'utf8');
    await srv.sql(sql);
    await srv.sql(sql);
    assert.equal(await srv.sql("SELECT hero_image FROM pages WHERE slug='home'"), '/uploads/custom-home.webp');
  });
});
