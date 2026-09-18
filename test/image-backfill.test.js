// The image backfill: what it does, and where it is allowed to run.
//
// It used to run in the Dockerfile's builder stage, so every `./update.sh`
// re-encoded fifty photographs to deploy a one-line code change. A build has no
// way to know the images did not change, and re-encoding shipped content is an
// operator action, not a compile step. It is now a button in the media library
// and a CLI command, and these tests hold that line — the wiring test is the
// one that matters, because the cost of the old arrangement was invisible in
// any functional check.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { startServer } = require('./helpers/server');

const ROOT = path.join(__dirname, '..');

test('image backfill wiring', async (t) => {
  await t.test('the Docker build does not run it', () => {
    const dockerfile = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf8');
    const active = dockerfile
      .split('\n')
      .filter((l) => !l.trim().startsWith('#'))
      .join('\n');
    assert.doesNotMatch(active, /images:optimize/,
      'image optimisation must not be part of the image build — it re-encodes every shipped photo on every deploy');
  });

  await t.test('shipped image variants survive a rebuild', () => {
    // Variants are gitignored build output. With them generated on demand
    // rather than during the build, anything written inside a container layer
    // is discarded by the next rebuild — so the directory has to be mounted
    // from the host. seed/ alone is not enough: logo.png lives one level up,
    // and its variants would evaporate on the next ./update.sh while the site
    // quietly went back to serving the 1 MB original.
    const compose = fs.readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf8');
    assert.match(compose, /\.\/public\/assets\/img:\/app\/public\/assets\/img/,
      'public/assets/img must be bind-mounted so generated variants persist');
  });

  await t.test('the CLI and the admin route share one implementation', () => {
    const cli = fs.readFileSync(path.join(ROOT, 'scripts', 'optimize-images.js'), 'utf8');
    const route = fs.readFileSync(path.join(ROOT, 'server', 'routes', 'media.js'), 'utf8');
    assert.match(cli, /require\(.*image-backfill.*\)/, 'the CLI drives the service');
    assert.match(route, /require\(.*image-backfill.*\)/, 'so does the route');
    // Nothing should encode images in either file: that belongs to
    // image-processor.js, which the service calls.
    assert.doesNotMatch(cli, /require\(.*sharp.*\)/, 'no encoding logic in the CLI');
  });
});

test('image backfill behaviour', async (t) => {
  const backfill = require('../server/services/image-backfill');
  const probeDir = path.join(ROOT, 'public', 'assets', 'img');
  const probe = path.join(probeDir, `zz-test-${process.pid}a.png`);

  t.after(() => {
    for (const f of fs.readdirSync(probeDir)) {
      if (f.startsWith(`zz-test-${process.pid}`)) fs.rmSync(path.join(probeDir, f), { force: true });
    }
  });

  await t.test('a new image is reported as pending, then processed', async () => {
    const sharp = require('sharp');
    await sharp({ create: { width: 640, height: 400, channels: 3, background: { r: 10, g: 60, b: 120 } } })
      .png().toFile(probe);

    const before = await backfill.survey();
    assert.ok(before.pending >= 1, 'the new image counts as pending');

    const result = await backfill.run({});
    assert.ok(result.processed >= 1, 'it was processed');
    assert.equal(result.failed, 0, JSON.stringify(result.failures));

    const variants = fs.readdirSync(probeDir)
      .filter((f) => f.startsWith(path.basename(probe, '.png') + '-'));
    assert.ok(variants.length > 0, 'variants were written next to the source');
    assert.ok(variants.some((f) => f.endsWith('.avif')), 'including a modern format');
  });

  await t.test('re-running skips what already has variants', async () => {
    // This is what makes it safe as a button: an operator who clicks twice
    // pays nothing the second time.
    const result = await backfill.run({});
    const mine = path.basename(probe, '.png');
    assert.equal(result.failed, 0);
    assert.ok(result.skipped > 0, 'sources with variants are skipped');
    const survey = await backfill.survey();
    assert.equal(survey.pending, 0, `nothing left pending (${mine})`);
  });

  await t.test('a dry run writes nothing', async () => {
    for (const f of fs.readdirSync(probeDir)) {
      if (f.startsWith(path.basename(probe, '.png') + '-')) fs.rmSync(path.join(probeDir, f));
    }
    const result = await backfill.run({ dryRun: true });
    assert.ok(result.processed >= 1, 'it reports what it would do');
    const variants = fs.readdirSync(probeDir)
      .filter((f) => f.startsWith(path.basename(probe, '.png') + '-'));
    assert.equal(variants.length, 0, 'but wrote no files');
  });
});

test('image backfill endpoint', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  await t.test('it requires an operator session', async () => {
    const res = await srv.request('/api/media/optimize');
    assert.equal(res.status, 401);
    const post = await srv.request('/api/media/optimize', { method: 'POST', json: {} });
    assert.equal(post.status, 401, 'starting a minutes-long CPU job must not be anonymous');
  });

  await t.test('an operator sees how much work is pending', async () => {
    // On an empty database the first login creates the admin from the
    // credentials submitted — see test/auth.test.js.
    const login = await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: `img-${process.pid}@test.local`, password: 'a-strong-password-2026' },
    });
    assert.equal(login.status, 200, login.text);

    const res = await srv.request('/api/media/optimize');
    assert.equal(res.status, 200);
    assert.ok(res.json.survey, 'a survey is returned');
    assert.equal(typeof res.json.survey.total, 'number');
    assert.equal(typeof res.json.survey.pending, 'number');
  });

  await t.test('a second start while one is running is refused', async () => {
    const first = await srv.request('/api/media/optimize', { method: 'POST', json: { force: true } });
    assert.equal(first.status, 202, 'the request returns immediately rather than blocking');

    const second = await srv.request('/api/media/optimize', { method: 'POST', json: { force: true } });
    // Two passes would write the same variant files at the same time. If the
    // first finished before this ran, 202 is also correct — the assertion is
    // that it is never an unguarded overlap.
    assert.ok(second.status === 409 || second.status === 202, `got ${second.status}`);
    if (second.status === 409) assert.equal(second.json.error, 'already_running');
  });
});

test('an image named like a variant is still processed', async (t) => {
  // `-\d+\.` treats banner-2024.png as a variant of a "banner" that does not
  // exist, so it silently never gets variants of its own and drops out of
  // every responsive srcset with nothing to show for it. Matching only the
  // widths the pipeline emits fixes that.
  const backfill = require('../server/services/image-backfill');
  const sharp = require('sharp');
  const dir = path.join(ROOT, 'public', 'assets', 'img');
  const name = `zz-named-2024-${process.pid}`;
  const file = path.join(dir, `${name}.png`);

  t.after(() => {
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith(name)) fs.rmSync(path.join(dir, f), { force: true });
    }
  });

  await sharp({ create: { width: 500, height: 300, channels: 3, background: { r: 200, g: 40, b: 40 } } })
    .png().toFile(file);

  const sources = backfill.listSources().map((f) => path.basename(f));
  assert.ok(sources.includes(`${name}.png`), 'a digits-in-the-name image counts as a source');
});
