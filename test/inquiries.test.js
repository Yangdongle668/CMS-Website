// The inquiry / RFQ pipeline — the site's reason to exist.
//
// Covers submission and storage, the GDPR promises made on the public form
// (hashed IP, recorded consent), the admin inbox and its search, and the
// attachment endpoint, which takes no authentication and therefore has to
// refuse anything that could later be served as code from our own origin.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers/server');

function validInquiry(over = {}) {
  return {
    company: 'Acme Batteries GmbH',
    full_name: 'Sofia Andersson',
    email: 'sofia@acme.example',
    country: 'DE',
    message: 'We need 5000 curved cells for a wearable, 300mAh, IEC 62133.',
    // The field is consent_given, not consent — getting this wrong makes every
    // submission a silent 400, which is exactly how these tests earn their keep.
    consent_given: true,
    ...over,
  };
}

// multipart/form-data without pulling in a dependency.
function multipart(filename, contentType, bytes) {
  const boundary = '----cmstest' + Math.random().toString(36).slice(2);
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return {
    body: Buffer.concat([head, Buffer.from(bytes), tail]),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

test('inquiries', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  await t.test('rejects a submission with consent explicitly withheld', async () => {
    const res = await srv.request('/api/inquiries', {
      method: 'POST',
      json: validInquiry({ consent_given: false }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'consent_required');
  });

  await t.test('rejects a submission with the consent field missing entirely', async () => {
    const body = validInquiry();
    delete body.consent_given;
    const res = await srv.request('/api/inquiries', { method: 'POST', json: body });
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'consent_required');
  });

  await t.test('rejects a malformed email', async () => {
    const res = await srv.request('/api/inquiries', {
      method: 'POST',
      json: validInquiry({ email: 'not-an-email' }),
    });
    assert.equal(res.status, 400);
  });

  await t.test('accepts a valid submission and returns a reference', async () => {
    const res = await srv.request('/api/inquiries', { method: 'POST', json: validInquiry() });
    assert.equal(res.status, 200);
    assert.equal(res.json.ok, true);
    assert.match(res.json.reference, /\w/, 'a reference is returned to the visitor');
  });

  await t.test('stores the inquiry with consent recorded and no raw IP', async () => {
    const row = await srv.sql(
      `SELECT email || '|' || consent_given || '|' || policy_version ||
              '|' || (ip_hash <> '') || '|' || length(ip_hash)
       FROM inquiries WHERE email = 'sofia@acme.example' LIMIT 1`
    );
    const [email, consent, policy, hashed, hashLen] = row.split('|');
    assert.equal(email, 'sofia@acme.example');
    assert.equal(consent, 'true', 'consent must be recorded');
    assert.ok(policy.length > 0, 'the policy version in force must be stored');
    assert.equal(hashed, 'true', 'an IP hash must be present');
    assert.equal(Number(hashLen), 64, 'sha256 hex — the raw IP is never stored');
  });

  await t.test('the public form is rate limited', async () => {
    // 5 per 5 minutes per IP. Post until it trips rather than assuming how much
    // budget earlier cases left, then assert the shape of the refusal.
    let limited = null;
    for (let i = 0; i < 12 && !limited; i++) {
      const res = await srv.request('/api/inquiries', {
        method: 'POST',
        json: validInquiry({ email: `flood${i}@acme.example` }),
      });
      if (res.status === 429) limited = res;
    }
    assert.ok(limited, 'the limiter must eventually refuse');
    assert.equal(limited.json.error, 'too_many_inquiries');
  });

  await t.test('the public endpoint never returns the stored row', async () => {
    const res = await srv.request('/api/inquiries', { method: 'POST', json: validInquiry() });
    assert.equal(res.json.id, undefined, 'no internal id leaks to the visitor');
    assert.equal(res.json.ip_hash, undefined);
  });

  await t.test('the admin inbox is not readable anonymously', async () => {
    assert.equal((await srv.request('/api/inquiries')).status, 401);
  });

  await t.test('an operator can list and search the inbox', async () => {
    await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'ops@example.test', password: 'a-strong-password-2026' },
    });

    const list = await srv.request('/api/inquiries?limit=10');
    assert.equal(list.status, 200);
    // Not a fixed count: submissions above share one IP and the public form is
    // limited to 5 per 5 minutes, so how many got through depends on how many
    // earlier cases posted. The rate limit itself is covered separately below.
    assert.ok(list.json.total >= 1, 'submitted inquiries are visible to the operator');
    assert.ok(Array.isArray(list.json.items));
    assert.ok(list.json.stats, 'the inbox carries the counts the dashboard shows');

    // Search runs against the concatenated-column trigram index; a term in any
    // one of the four searchable fields has to match.
    for (const term of ['Andersson', 'acme', 'sofia@acme.example']) {
      const hit = await srv.request('/api/inquiries?q=' + encodeURIComponent(term));
      assert.equal(hit.status, 200);
      assert.ok(hit.json.total >= 1, `search for "${term}" should find the inquiry`);
    }

    const miss = await srv.request('/api/inquiries?q=' + encodeURIComponent('zzz-no-such-term'));
    assert.equal(miss.json.total, 0);
  });

  await t.test('search matches across field boundaries', async () => {
    // "acme sofia" spans company and full_name, which the previous per-column
    // OR of ILIKEs could not match.
    const res = await srv.request('/api/inquiries?q=' + encodeURIComponent('GmbH Sofia'));
    assert.equal(res.status, 200);
    assert.ok(res.json.total >= 1);
  });

  await t.test('attachment upload accepts a real image', async () => {
    const { body, headers } = multipart('drawing.png', 'image/png', PNG_BYTES);
    const res = await srv.request('/api/inquiries/upload', { method: 'POST', body, headers });
    assert.equal(res.status, 200);
    assert.match(res.json.url, /^\/uploads\/inquiries\/.*\.png$/);
  });

  // The anonymous stored-XSS regression. This endpoint has no requireAuth.
  await t.test('attachment upload rejects HTML disguised as an image', async () => {
    const { body, headers } = multipart(
      'payload.html',
      'image/png',
      Buffer.from('<html><script>alert(1)</script></html>')
    );
    const res = await srv.request('/api/inquiries/upload', { method: 'POST', body, headers });
    assert.equal(res.status, 400);
    assert.equal(res.json.error, 'content_type_mismatch');
  });

  await t.test('attachment extension comes from the declared type, not the filename', async () => {
    // text/plain has no signature to check, so the extension is the defence:
    // the file must not land as .html and be served as HTML from our origin.
    const { body, headers } = multipart(
      'payload.html',
      'text/plain',
      Buffer.from('<html><script>alert(1)</script></html>')
    );
    const res = await srv.request('/api/inquiries/upload', { method: 'POST', body, headers });
    assert.equal(res.status, 200);
    assert.match(res.json.url, /\.txt$/, 'stored as .txt, never .html');
    assert.doesNotMatch(res.json.url, /\.html/);
  });

  await t.test('attachment upload refuses a disallowed type with 415', async () => {
    const { body, headers } = multipart('x.exe', 'application/x-msdownload', Buffer.from('MZ'));
    const res = await srv.request('/api/inquiries/upload', { method: 'POST', body, headers });
    assert.equal(res.status, 415, 'a rejected type is a client error, not a 500');
    assert.equal(res.json.error, 'file_type_not_allowed');
  });

  await t.test('an oversized attachment returns 413, not 500', async () => {
    const { body, headers } = multipart(
      'big.pdf',
      'application/pdf',
      Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(9 * 1024 * 1024)])
    );
    const res = await srv.request('/api/inquiries/upload', { method: 'POST', body, headers });
    assert.equal(res.status, 413);
    assert.equal(res.json.error, 'file_too_large');
  });

  await t.test('uploaded files are served with a policy that neutralises script', async () => {
    const { body, headers } = multipart('ok.png', 'image/png', PNG_BYTES);
    const up = await srv.request('/api/inquiries/upload', { method: 'POST', body, headers });
    const res = await srv.request(up.json.url);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-security-policy') || '', /default-src 'none'/);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  });
});
