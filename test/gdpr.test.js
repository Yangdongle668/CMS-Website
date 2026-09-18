// GDPR: consent logging, DSAR submission and verification, subject export and
// erasure.
//
// This is compliance surface for an EU-facing site, so the tests assert the
// promises the public privacy pages make — that a raw IP is never stored, that
// a subject-access request cannot be acted on until the email is verified, and
// that an export actually contains the subject's data.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers/server');

test('gdpr', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  await t.test('records a cookie-consent decision without storing a raw IP', async () => {
    const res = await srv.request('/api/gdpr/consent', {
      method: 'POST',
      json: {
        categories: { necessary: true, analytics: false, marketing: false },
        policy_version: '1.0',
      },
    });
    assert.equal(res.status, 200);
    assert.equal(res.json.ok, true);

    const row = await srv.sql(
      `SELECT length(visitor_hash) || '|' || policy_version || '|' || (categories::text)
       FROM consent_logs ORDER BY id DESC LIMIT 1`
    );
    const [hashLen, policy, categories] = row.split('|');
    assert.equal(Number(hashLen), 64, 'the visitor is identified by a hash, not an IP');
    assert.equal(policy, '1.0', 'the policy version consented to is recorded');
    assert.match(categories, /"analytics":\s*false/, 'the per-category choice is preserved');

    const columns = await srv.sql(
      `SELECT count(*) FROM information_schema.columns
       WHERE table_name = 'consent_logs' AND column_name IN ('ip', 'ip_address', 'remote_addr')`
    );
    assert.equal(columns, '0', 'there is nowhere to put a raw IP even by accident');
  });

  await t.test('rejects a DSAR with a malformed email or unknown type', async () => {
    const badEmail = await srv.request('/api/gdpr/request', {
      method: 'POST',
      json: { email: 'nope', request_type: 'access' },
    });
    assert.equal(badEmail.status, 400);
    assert.equal(badEmail.json.error, 'invalid_email');

    const badType = await srv.request('/api/gdpr/request', {
      method: 'POST',
      json: { email: 'subject@example.test', request_type: 'sell-my-data' },
    });
    assert.equal(badType.status, 400);
    assert.equal(badType.json.error, 'invalid_type');
  });

  await t.test('accepts an access request and returns a reference', async () => {
    const res = await srv.request('/api/gdpr/request', {
      method: 'POST',
      json: {
        email: 'subject@example.test',
        request_type: 'access',
        details: 'Please send everything you hold.',
      },
    });
    assert.equal(res.status, 200);
    assert.match(res.json.reference, /^DSAR/);
    assert.equal(res.json.verify_token, undefined, 'the token goes by email, never in the response');
  });

  await t.test('a new request starts unverified', async () => {
    const verified = await srv.sql(
      `SELECT (verified_at IS NULL)::text FROM gdpr_requests WHERE email = 'subject@example.test' LIMIT 1`
    );
    assert.equal(verified, 'true', 'nothing is actionable until the subject clicks through');
  });

  await t.test('verification rejects a wrong or missing token', async () => {
    const wrong = await srv.request('/api/gdpr/verify?token=not-a-real-token');
    assert.notEqual(wrong.status, 500);
    const stillUnverified = await srv.sql(
      `SELECT (verified_at IS NULL)::text FROM gdpr_requests WHERE email = 'subject@example.test' LIMIT 1`
    );
    assert.equal(stillUnverified, 'true', 'a bad token must not verify anything');
  });

  await t.test('verification with the emailed token marks the request verified', async () => {
    const token = await srv.sql(
      `SELECT verify_token FROM gdpr_requests WHERE email = 'subject@example.test' LIMIT 1`
    );
    assert.ok(token.length > 10);
    const res = await srv.request('/api/gdpr/verify?token=' + encodeURIComponent(token));
    assert.ok(res.status < 400, `verify returned ${res.status}`);
    const verified = await srv.sql(
      `SELECT (verified_at IS NOT NULL)::text FROM gdpr_requests WHERE email = 'subject@example.test' LIMIT 1`
    );
    assert.equal(verified, 'true');
  });

  await t.test('the admin DSAR queue is not readable anonymously', async () => {
    assert.equal((await srv.request('/api/gdpr')).status, 401);
    assert.equal((await srv.request('/api/gdpr/1/export')).status, 401);
  });

  await t.test('an operator sees the request in the queue', async () => {
    await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'dpo@example.test', password: 'a-strong-password-2026' },
    });
    const res = await srv.request('/api/gdpr');
    assert.equal(res.status, 200);
    assert.ok(res.json.items.some((r) => r.email === 'subject@example.test'));
  });

  await t.test('the export carries the subject’s own data', async () => {
    // Give the subject something to export.
    await srv.request('/api/inquiries', {
      method: 'POST',
      json: {
        company: 'Subject Co',
        full_name: 'Data Subject',
        email: 'subject@example.test',
        country: 'DE',
        message: 'An enquiry that the subject is entitled to receive back.',
        consent_given: true,
      },
    });

    const id = await srv.sql(
      `SELECT id FROM gdpr_requests WHERE email = 'subject@example.test' LIMIT 1`
    );
    const res = await srv.request(`/api/gdpr/${id}/export`);
    assert.equal(res.status, 200);
    assert.match(res.text, /subject@example\.test/, 'the export contains the subject');
    assert.match(res.text, /Subject Co/, 'and the inquiry they submitted');
  });

  await t.test('an export for a different subject does not leak this one', async () => {
    await srv.request('/api/gdpr/request', {
      method: 'POST',
      json: { email: 'other@example.test', request_type: 'access' },
    });
    const otherId = await srv.sql(
      `SELECT id FROM gdpr_requests WHERE email = 'other@example.test' LIMIT 1`
    );
    const res = await srv.request(`/api/gdpr/${otherId}/export`);
    assert.equal(res.status, 200);
    assert.doesNotMatch(res.text, /Subject Co/, 'one subject’s export must not include another’s');
  });

  await t.test('retention job soft-deletes past the configured window', async () => {
    // Age one inquiry beyond the retention window, then run the nightly job the
    // way `npm run retention` does.
    await srv.sql(
      `UPDATE inquiries SET created_at = now() - interval '400 days'
       WHERE email = 'subject@example.test'`
    );
    const before = await srv.sql(
      `SELECT count(*) FROM inquiries WHERE email = 'subject@example.test' AND is_deleted = FALSE`
    );
    assert.equal(before, '1');

    const { execFile } = require('child_process');
    const { promisify } = require('util');
    await promisify(execFile)('node', [require('path').join(__dirname, '..', 'server', 'jobs', 'retention.js')], {
      env: {
        ...process.env,
        PGDATABASE: srv.db,
        GDPR_RETENTION_DAYS: '365',
        GDPR_SOFT_DELETE_DAYS: '30',
      },
    });

    const after = await srv.sql(
      `SELECT count(*) FROM inquiries WHERE email = 'subject@example.test' AND is_deleted = TRUE`
    );
    assert.equal(after, '1', 'an inquiry older than the retention window is soft-deleted');
  });
});
