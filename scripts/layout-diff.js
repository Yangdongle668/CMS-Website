#!/usr/bin/env node
// Compares the computed layout of every page at a set of widths, between two
// versions of public/styles.css.
//
//   npm run visual:layout -- --before <file.css> [--widths 780,1050]
//
// Why this and not the screenshot diff.
//
// visual-snapshot.js answers "did any pixel change", which for a breakpoint
// move is always yes and never says what. This asks the question a breakpoint
// change actually raises: which elements are laid out differently, and how. It
// reads geometry out of the DOM instead of rasterising the page, so a full run
// is a minute rather than half an hour — and it survives a container that does
// not stay up for thirty minutes.
//
// The fingerprint per element is its selector, its box, and its grid column
// count. A breakpoint move shows up as exactly that: a grid that was one column
// is now two, a container that was full width is now half. Text reflow and
// image decoding — the two things that made the pixel diff noisy — do not
// appear in it at all.
//
// It swaps styles.css to take the 'before' reading and always puts the original
// back, including on failure.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const LIVE_CSS = path.join(ROOT, 'public', 'styles.css');

const PAGES = [
  '/', '/about/', '/about/profile.html', '/about/team.html', '/about/factory.html',
  '/products/', '/products/polymer-lithium-battery',
  '/solutions/', '/solutions/design.html',
  '/applications/', '/applications/medical.html',
  '/blog/', '/faq.html', '/contact.html', '/gdpr.html',
  '/terms.html', '/privacy.html', '/legal.html', '/404.html',
];

const CHROME = [
  process.env.CHROME_PATH, '/opt/pw-browsers/chromium',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
].filter(Boolean).find((c) => { try { fs.accessSync(c, fs.constants.X_OK); return true; } catch { return false; } });

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.watch = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(m.error.message)) : resolve(m.result);
      }
      for (const fn of this.watch.values()) fn(m);
    });
  }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', () => rej(new Error('cdp connect failed')), { once: true });
    });
    return new CDP(ws);
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    return new Promise((res, rej) => this.pending.set(id, { resolve: res, reject: rej }));
  }
}

// What a breakpoint can actually change. Deliberately not textContent: copy
// reflowing between two and three lines is not a layout regression, and
// including it drowns the signal.
const FINGERPRINT_JS = `(() => {
  const out = {};
  const seen = Object.create(null);
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    // Fixed overlays are out of flow, so no breakpoint governs them — and the
    // cookie banner toggles a class as it appears, which changed its key
    // between the two captures and showed up as one element vanishing and
    // another arriving at widths where nothing can have changed.
    if (cs.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const cls = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '')
      .toString().trim().split(/\\s+/).filter(Boolean).slice(0, 3).join('.');
    let key = el.tagName.toLowerCase() + (cls ? '.' + cls : '');
    seen[key] = (seen[key] || 0) + 1;
    key += '#' + seen[key];
    out[key] = {
      w: Math.round(r.width),
      h: Math.round(r.height),
      x: Math.round(r.left),
      // The number of grid tracks is the thing a breakpoint usually moves.
      cols: cs.display.includes('grid') ? (cs.gridTemplateColumns || '').split(' ').filter(Boolean).length : 0,
      disp: cs.display,
      dir: cs.flexDirection || '',
    };
  }
  return {
    vw: document.documentElement.clientWidth,
    scrollW: document.documentElement.scrollWidth,
    n: Object.keys(out).length,
    els: out,
  };
})()`;

const SETTLE_JS = `
(async () => {
  const capped = (p, ms) => Promise.race([Promise.resolve(p).catch(() => {}), new Promise((r) => setTimeout(r, ms))]);
  await capped(Promise.all([...document.images].map((i) => i.complete ? null
    : new Promise((r) => { i.onload = i.onerror = r; }))), 5000);
  await new Promise((r) => setTimeout(r, 250));
  return document.documentElement.clientWidth;
})()`;

async function launch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-'));
  const child = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--remote-debugging-port=0', `--user-data-dir=${dir}`,
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const on = (d) => { buf += d; const m = buf.match(/ws:\/\/[^\s]+/); if (m) res(m[0]); };
    child.stderr.on('data', on); child.stdout.on('data', on);
    setTimeout(() => rej(new Error('chrome did not report a debug url')), 20000);
  });
  return { child, wsUrl, stop() { child.kill('SIGKILL'); fs.rmSync(dir, { recursive: true, force: true }); } };
}

async function capture(base, pages, widths) {
  const browser = await launch();
  const cdp = await CDP.connect(browser.wsUrl);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);

  const shots = {};
  for (const p of pages) {
    for (const w of widths) {
      await cdp.send('Emulation.setDeviceMetricsOverride',
        { width: w, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
      try {
        await cdp.send('Page.navigate', { url: 'about:blank' }, sessionId);
        await cdp.send('Page.navigate', { url: base + p }, sessionId);
        await new Promise((r) => setTimeout(r, 400));
        await cdp.send('Runtime.evaluate',
          { expression: SETTLE_JS, awaitPromise: true, returnByValue: true }, sessionId);
        const { result } = await cdp.send('Runtime.evaluate',
          { expression: FINGERPRINT_JS, returnByValue: true }, sessionId);
        shots[`${p}@${w}`] = result.value;
      } catch (err) {
        console.warn('[layout] %s @ %d: %s', p, w, err && err.message);
      }
    }
  }
  cdp.close && cdp.close();
  browser.stop();
  return shots;
}

function compare(before, after) {
  const rows = [];
  for (const key of Object.keys(after)) {
    const a = after[key];
    const b = before[key];
    if (!b) continue;
    const changes = [];
    for (const sel of Object.keys(a.els)) {
      const x = a.els[sel];
      const y = b.els[sel];
      if (!y) continue;
      // Sub-pixel rounding is not a change; a column count is.
      const wDelta = Math.abs(x.w - y.w);
      if (x.cols !== y.cols || x.disp !== y.disp || x.dir !== y.dir || wDelta > 2) {
        changes.push({
          sel,
          from: `${y.w}px${y.cols ? ' / ' + y.cols + 'col' : ''}`,
          to: `${x.w}px${x.cols ? ' / ' + x.cols + 'col' : ''}`,
          cols: x.cols !== y.cols,
        });
      }
    }
    const onlyAfter = Object.keys(a.els).filter((s) => !b.els[s]).length;
    const onlyBefore = Object.keys(b.els).filter((s) => !a.els[s]).length;
    rows.push({
      key, changes, onlyAfter, onlyBefore,
      overflowBefore: b.scrollW > b.vw + 8,
      overflowAfter: a.scrollW > a.vw + 8,
    });
  }
  return rows;
}

async function main() {
  const argv = process.argv.slice(2);
  const flag = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
  const beforeCss = flag('before', null);
  const base = flag('base', 'http://127.0.0.1:3960');
  const widths = flag('widths', '375,640,780,900,1050,1440').split(',').map(Number);
  const only = flag('page', null);
  const pages = only ? only.split(',') : PAGES;

  if (!CHROME) { console.error('[layout] no Chromium found'); return 1; }
  if (!beforeCss || !fs.existsSync(beforeCss)) {
    console.error('[layout] --before <file.css> is required (the stylesheet to compare against)');
    return 1;
  }

  console.log('[layout] %d page(s) x %d width(s)', pages.length, widths.length);

  const original = fs.readFileSync(LIVE_CSS);
  let after, before;
  try {
    after = await capture(base, pages, widths);
    console.log('[layout] current stylesheet captured');
    fs.writeFileSync(LIVE_CSS, fs.readFileSync(beforeCss));
    before = await capture(base, pages, widths);
    console.log('[layout] comparison stylesheet captured');
  } finally {
    // Always put the real stylesheet back, including if the capture threw.
    fs.writeFileSync(LIVE_CSS, original);
  }

  const rows = compare(before, after);
  const moved = rows.filter((r) => r.changes.length || r.onlyAfter || r.onlyBefore);
  const byWidth = {};
  for (const r of rows) {
    const w = r.key.split('@')[1];
    byWidth[w] = byWidth[w] || { total: 0, moved: 0 };
    byWidth[w].total++;
    if (r.changes.length || r.onlyAfter || r.onlyBefore) byWidth[w].moved++;
  }

  // console.log does not implement printf width specifiers — '%-8s' prints
  // literally. Pad by hand.
  console.log('\n' + 'width'.padEnd(8) + 'changed'.padEnd(10) + 'of');
  for (const w of Object.keys(byWidth).sort((a, b) => a - b)) {
    console.log(String(w).padEnd(8) + String(byWidth[w].moved).padEnd(10) + byWidth[w].total);
  }

  console.log('\n%d of %d page/width combinations differ\n', moved.length, rows.length);
  for (const r of moved.slice(0, 40)) {
    const colChanges = r.changes.filter((c) => c.cols);
    const appeared = r.onlyAfter || r.onlyBefore
      ? `, ${r.onlyAfter} only-after / ${r.onlyBefore} only-before` : '';
    console.log('%s  (%d element(s) moved%s%s)', r.key, r.changes.length,
      colChanges.length ? ', ' + colChanges.length + ' changed column count' : '', appeared);
    for (const c of (colChanges.length ? colChanges : r.changes).slice(0, 5)) {
      console.log('    ' + c.sel.slice(0, 46).padEnd(48) + c.from + ' -> ' + c.to);
    }
    if (r.overflowAfter && !r.overflowBefore) console.log('    !! now overflows horizontally');
  }

  const regressions = rows.filter((r) => r.overflowAfter && !r.overflowBefore);
  console.log('\nnew horizontal overflow: %s', regressions.length
    ? regressions.map((r) => r.key).join(', ') : 'none');
  return regressions.length ? 1 : 0;
}

main().then((c) => process.exit(c)).catch((e) => {
  console.error('[layout] failed:', (e && e.stack) || e);
  process.exit(1);
});
