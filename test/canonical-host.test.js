// One hostname.
//
// https://www.zufek.com answered 200 rather than redirecting, so the
// site was live on two hostnames. The canonical tag already pointed at
// the apex from both, because it is built from PUBLIC_URL rather than
// from the request — which is why this was never the "link equity
// splits in half" emergency it is usually called.
//
// The reason to fix it is that the mitigation depended on a setting.
// resolveCanonicalBase falls back to the request's own Host when
// PUBLIC_URL and settings.seo are both empty, and at that moment every
// page on www self-canonicalises to www: two mirror sites, silently.
// A 301 means www never reaches the renderer at all.
//
// Which makes the awkward case the important one to pin: with no
// canonical host configured the middleware must do NOTHING. A redirect
// invented from the request it is judging is a loop.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { startServer } = require('./helpers/server');

// fetch/undici silently drops a Host header — it is on the forbidden
// list — so every request here goes through node:http, or the test
// would measure the harness's own hostname and always pass.
function raw(base, path, { host, method = 'GET' } = {}) {
  const u = new URL(base);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: u.hostname, port: u.port, path, method,
      headers: host ? { host } : {},
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('canonical host redirect', async (t) => {
  const srv = await startServer({ seed: true, env: { PUBLIC_URL: 'https://zufek.com' } });
  t.after(() => srv.stop());

  await t.test('the wrong hostname gets a 301 to the right one', async () => {
    const res = await raw(srv.url, '/blog/', { host: 'www.zufek.com' });
    assert.equal(res.status, 301);
    assert.equal(res.headers.location, 'https://zufek.com/blog/');
  });

  await t.test('path and query survive the redirect', async () => {
    const res = await raw(srv.url, '/blog/?category=technology&page=2', { host: 'www.zufek.com' });
    assert.equal(res.status, 301);
    assert.equal(res.headers.location, 'https://zufek.com/blog/?category=technology&page=2');
  });

  await t.test('the canonical hostname is served, not redirected', async () => {
    // The loop check: whatever else happens, a request already on the
    // right host must never be sent somewhere else.
    for (const path of ['/', '/blog/', '/products/polymer-lithium-battery', '/sitemap.xml']) {
      const res = await raw(srv.url, path, { host: 'zufek.com' });
      assert.equal(res.status, 200, `${path} on the canonical host returned ${res.status}`);
    }
  });

  await t.test('the redirect is not cached by browsers', async () => {
    // The target comes from a setting an operator can change; a bare
    // 301 would be pinned in browser caches long after a correction.
    const res = await raw(srv.url, '/', { host: 'www.zufek.com' });
    assert.match(res.headers['cache-control'] || '', /no-store/);
  });

  await t.test('health probes answer on any hostname', async () => {
    // Load balancers connect by IP or an internal name. A probe that
    // gets a 301 is a probe that fails.
    for (const host of ['www.zufek.com', '10.0.0.5', 'localhost', 'app-container']) {
      const res = await raw(srv.url, '/healthz', { host });
      assert.equal(res.status, 200, `/healthz returned ${res.status} for Host: ${host}`);
    }
  });

  await t.test('ACME challenges are never redirected', async () => {
    // A certificate renewal that starts 301ing mid-validation is a bad
    // way to discover the layering moved.
    const res = await raw(srv.url, '/.well-known/acme-challenge/test-token',
      { host: 'www.zufek.com' });
    assert.notEqual(res.status, 301, 'an ACME challenge was redirected');
  });

  await t.test('direct access by IP or local name is left alone', async () => {
    for (const host of ['127.0.0.1', '10.0.0.5', 'localhost', 'app-container']) {
      const res = await raw(srv.url, '/', { host });
      assert.notEqual(res.status, 301, `Host: ${host} was redirected`);
    }
  });

  await t.test('writes are not redirected', async () => {
    // A 301 on a POST invites clients to replay it as a GET and drop
    // the body. Form posts and API writes stay where they are.
    const res = await raw(srv.url, '/api/inquiries', { host: 'www.zufek.com', method: 'POST' });
    assert.notEqual(res.status, 301, 'a POST was redirected');
  });
});

test('canonical host redirect stays off when no host is declared', async (t) => {
  // No PUBLIC_URL and no seed, so no settings.seo.public_url row either.
  // Both config sources are empty, the only hostname available is the
  // one on the request being judged, and guessing from that builds a
  // loop — so the middleware must stand down.
  //
  // Not seeding is the point: seed.sql declares
  // settings.seo.public_url = https://zufek.com, which is a perfectly
  // good declaration and makes the redirect fire. An earlier version of
  // this test passed `seed: true` and then asserted the redirect was
  // off, which was the test being wrong rather than the code.
  const srv = await startServer({ env: { PUBLIC_URL: '' } });
  t.after(() => srv.stop());

  await t.test('every hostname is served as-is', async () => {
    for (const host of ['zufek.com', 'www.zufek.com', 'anything.example']) {
      const res = await raw(srv.url, '/blog/', { host });
      assert.equal(res.status, 200, `Host: ${host} returned ${res.status}`);
    }
  });

  await t.test('and this is the state that makes the redirect worth having', async () => {
    // Without it, www self-canonicalises — the two-mirror-sites failure
    // the redirect exists to make impossible.
    const res = await raw(srv.url, '/blog/', { host: 'www.zufek.com' });
    const canonical = (res.body.match(
      /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1];
    assert.match(canonical, /^https?:\/\/www\.zufek\.com\//,
      'expected the host-derived fallback that the 301 protects against');
  });
});
