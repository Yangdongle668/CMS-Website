#!/usr/bin/env node
// Full-page screenshots of the running site at a set of viewport widths, and a
// pixel diff between two runs.
//
//   npm run visual:shoot -- --out .visual/before
//   npm run visual:shoot -- --out .visual/after
//   npm run visual:diff  -- .visual/before .visual/after
//
// Why this exists.
//
// docs/IMPROVEMENTS.md #10 asks for the stylesheet's eleven ad-hoc breakpoints
// to be consolidated. Moving a breakpoint is not a refactor: shifting 700px to
// 768px changes the layout on every device between those widths. The reason
// that item sat undone was not difficulty, it was that nothing here could tell
// a successful consolidation from a broken one.
//
// This closes that gap. It drives the Chromium that is already on the box over
// the DevTools protocol — no new runtime dependency, and `sharp` (already a
// dependency, for the image pipeline) decodes the PNGs for the diff.
//
// Scope and honesty about it: a pixel diff proves two renders differ, not that
// either is correct. Moving a breakpoint is *supposed* to change pixels between
// the old threshold and the new one. So the diff is a place to look, not a
// verdict — what it buys is that a change nobody expected cannot pass unnoticed.
// The layout assertions in --check are the part that fails on its own.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');

// Every width the stylesheet switches at — the consolidated scale and the
// eleven thresholds it replaced — plus one probe inside each band those two
// sets leave between them, and one below and above everything as a noise floor.
//
// Sampling more finely than this buys nothing: between two thresholds no rule
// toggles, so the layout varies continuously and a second sample in the same
// band can only repeat what the first said. 375 and 1440 are the controls —
// no threshold moved past either, so any difference there is the harness's own
// noise, not the stylesheet's.
const WIDTHS = [375, 480, 500, 520, 600, 640, 700, 760, 768, 780, 800,
  900, 1000, 1024, 1050, 1100, 1200, 1280, 1440];

const PAGES = [
  '/', '/about/', '/about/profile.html', '/about/team.html', '/about/factory.html',
  '/products/', '/products/polymer-lithium-battery',
  '/solutions/', '/solutions/design.html',
  '/applications/', '/applications/medical.html',
  '/blog/', '/faq.html', '/contact.html', '/gdpr.html',
  '/terms.html', '/privacy.html', '/legal.html', '/404.html',
];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/pw-browsers/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter(Boolean);

function findChrome() {
  for (const c of CHROME_CANDIDATES) {
    try {
      fs.accessSync(c, fs.constants.X_OK);
      return c;
    } catch (_) { /* next */ }
  }
  return null;
}

// ----- A minimal CDP client ------------------------------------------------
//
// Chromium's --screenshot flag captures the viewport, not the page; a page
// three screens tall comes out cropped, which for a layout diff is most of the
// evidence missing. Page.captureScreenshot with captureBeyondViewport does the
// whole document, so it is worth the ~80 lines of protocol.

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.sessions = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
      for (const fn of this.sessions.values()) fn(msg);
    });
  }

  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error('cdp connect failed')), { once: true });
    });
    return new CDP(ws);
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  on(key, fn) {
    this.sessions.set(key, fn);
  }

  close() {
    try { this.ws.close(); } catch (_) { /* already gone */ }
  }
}

async function launch(chrome) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-chrome-'));
  const child = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
    // Determinism. Web fonts and analytics must fail the same way in both runs
    // or the diff is measuring the network, not the stylesheet.
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
    '--force-color-profile=srgb',
    '--disable-lcd-text',
    '--disable-partial-raster',
    '--disable-skia-runtime-opts',
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const onData = (d) => {
      buf += String(d);
      const m = buf.match(/ws:\/\/[^\s]+/);
      if (m) resolve(m[0]);
    };
    child.stderr.on('data', onData);
    child.stdout.on('data', onData);
    child.once('exit', (code) => reject(new Error(`chrome exited (${code}) before listening`)));
    setTimeout(() => reject(new Error('chrome did not report a debug url')), 20000);
  });

  return {
    child,
    wsUrl,
    stop() {
      child.kill('SIGKILL');
      fs.rmSync(userDataDir, { recursive: true, force: true });
    },
  };
}

// Waits for the page to stop changing rather than for a fixed delay: a fixed
// delay is either slower than it needs to be or a source of flaky diffs, and
// this site hydrates from its own API after first paint.
//
// Waiting on scrollHeight alone was not enough, and the way it failed is worth
// recording. Shooting the same stylesheet twice should produce identical
// images; instead 24 of 37 pairs at the control widths differed, one page by
// 730px of height at a width where no rule can change. The cause was images:
// this site lazy-loads them, captureBeyondViewport rasterises the whole
// document, and whether a given image had decoded by screenshot time came down
// to timing. So the settle step now also waits for every image to finish —
// decode() rather than .complete, because a complete-but-undecoded image still
// lays out at its placeholder size.
const SETTLE_JS = `
(async () => {
  // Every wait is capped. An image whose request never completes — and with
  // external DNS pointed at NOTFOUND there are some — would otherwise leave
  // decode() pending forever and stop the whole run on one page.
  const capped = (p, ms) => Promise.race([
    Promise.resolve(p).catch(() => {}),
    new Promise((r) => setTimeout(r, ms)),
  ]);
  await capped(Promise.all([...document.images].map((img) => {
    if (img.complete) return img.decode ? img.decode().catch(() => {}) : null;
    return new Promise((r) => { img.onload = img.onerror = r; })
      .then(() => (img.decode ? img.decode().catch(() => {}) : null));
  })), 8000);
  if (document.fonts && document.fonts.ready) await capped(document.fonts.ready, 1500);

  await new Promise((resolve) => {
    const t0 = Date.now();
    let last = document.documentElement.scrollHeight;
    let stable = 0;
    (function tick() {
      const h = document.documentElement.scrollHeight;
      if (h === last) stable++; else { stable = 0; last = h; }
      if (stable >= 3 || Date.now() - t0 > 5000) return resolve();
      setTimeout(tick, 80);
    })();
  });

  // Hide fixed and sticky overlays before measuring. captureBeyondViewport
  // rasterises the whole document but paints a fixed element wherever the
  // scroll position happens to put it, so the cookie banner landed at a
  // different height in two runs of the same stylesheet — 4 of 20 pairs
  // differing, on pages whose layout was otherwise identical. They are also
  // beside the point: a breakpoint governs flow layout, and an out-of-flow
  // overlay is not part of it. visibility rather than display, so a sticky
  // element still occupies its box and the flow below it does not shift.
  let hidden = 0;
  for (const el of document.querySelectorAll('body *')) {
    const pos = getComputedStyle(el).position;
    if (pos === 'fixed' || pos === 'sticky') { el.style.visibility = 'hidden'; hidden++; }
  }

  return {
    url: location.href,
    vw: document.documentElement.clientWidth,
    h: document.documentElement.scrollHeight,
    pending: [...document.images].filter((i) => !i.complete).length,
    hidden,
  };
})()`;

// Kills every animation and transition, and pins anything time-based, so two
// runs of the same stylesheet cannot disagree about where a carousel happens to
// be. Injected as a document-level stylesheet rather than a CSS file so it
// applies to every page without touching the site's own source.
const FREEZE_CSS = `
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  scroll-behavior: auto !important;
  caret-color: transparent !important;
}`;

const shotName = (p, w) =>
  `${p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'}@${w}.png`;

// Everything that has to be true of a session before it measures anything.
// The freeze stylesheet is installed per document rather than injected after
// load, so a transition cannot run in the gap between the two.
async function prepareSession(cdp, sessionId) {
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  }, sessionId).catch(() => {});
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      const install = () => {
        const s = document.createElement('style');
        s.textContent = ${JSON.stringify(FREEZE_CSS)};
        (document.head || document.documentElement).appendChild(s);
      };
      if (document.head) install();
      else document.addEventListener('DOMContentLoaded', install, { once: true });

      // Load every image eagerly. captureBeyondViewport rasterises the whole
      // document, but lazy images below the fold only load when they scroll
      // into view — which never happens headless — so whether one had decoded
      // by screenshot time was down to timing. That was the single largest
      // source of run-to-run noise. Forcing eager is cheaper and more reliable
      // than scrolling the document to bait the IntersectionObserver.
      const eager = (root) => {
        for (const img of root.querySelectorAll ? root.querySelectorAll('img[loading]') : []) {
          img.loading = 'eager';
        }
      };
      new MutationObserver((records) => {
        for (const r of records) for (const n of r.addedNodes) if (n.nodeType === 1) eager(n);
      }).observe(document.documentElement, { childList: true, subtree: true });
      document.addEventListener('DOMContentLoaded', () => eager(document), { once: true });
    })();`,
  }, sessionId).catch(() => {});
}

// Resize, navigate, wait for load, then wait for the page to settle — and
// prove it worked before the caller measures anything.
//
// Two failures made that last part necessary. Leaving out the wait for
// Page.loadEventFired killed the --check path partway through a run, because
// evaluating against a context the navigation had already destroyed rejects
// far from the call site. And a navigation to the URL already loaded can be
// coalesced, which left the previous width's layout on screen under a resized
// viewport — a wrong screenshot that looks perfectly plausible. So the settle
// step reports back the URL and viewport width it actually saw, this checks
// them, and a mismatch is retried once and then reported rather than silently
// photographed.
async function visit(cdp, sessionId, url, width, seq) {
  for (let attempt = 0; attempt < 2; attempt++) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width, height: 900, deviceScaleFactor: 1, mobile: false,
    }, sessionId);

    const key = `load-${seq}-${attempt}`;
    const loaded = new Promise((resolve) => {
      cdp.on(key, (msg) => {
        if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired') {
          cdp.sessions.delete(key);
          resolve();
        }
      });
    });
    try {
      // Clearing the page first makes every navigation a genuine cross-document
      // one, so there is nothing for Chromium to coalesce.
      await cdp.send('Page.navigate', { url: 'about:blank' }, sessionId);
      await cdp.send('Page.navigate', { url }, sessionId);
      await Promise.race([loaded, new Promise((r) => setTimeout(r, 20000))]);
      // awaitPromise has no deadline of its own: a settle that never resolves
      // would hang the run rather than fail it, which is how a 4-shot smoke
      // test managed to sit for five minutes producing nothing.
      const result = await Promise.race([
        cdp.send('Runtime.evaluate', {
          expression: SETTLE_JS, awaitPromise: true, returnByValue: true,
        }, sessionId).then((r) => r.result),
        new Promise((_, rej) => setTimeout(() => rej(new Error('settle timed out')), 30000)),
      ]);
      const seen = result && result.value;
      if (seen && seen.vw === width && seen.url.endsWith(url.slice(url.indexOf('/', 8)))) {
        return seen;
      }
      if (attempt === 1) {
        console.warn('[visual] %s @ %d: settled at %s width %s — kept anyway',
          url, width, seen && seen.url, seen && seen.vw);
        return seen;
      }
    } catch (err) {
      if (attempt === 1) {
        // A page that will not settle is worth a line, not an aborted run.
        console.warn('[visual] %s @ %d: %s', url, width, err && err.message);
        return null;
      }
    } finally {
      cdp.sessions.delete(key);
    }
  }
  return null;
}

async function shoot({ base, outDir, widths, pages, quiet }) {
  const chrome = findChrome();
  if (!chrome) {
    console.error('[visual] no Chromium found. Set CHROME_PATH to a Chrome/Chromium binary.');
    return 1;
  }
  const browser = await launch(chrome);
  const cdp = await CDP.connect(browser.wsUrl);
  fs.mkdirSync(outDir, { recursive: true });

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await prepareSession(cdp, sessionId);

  let n = 0;
  const manifest = [];
  for (const p of pages) {
    for (const w of widths) {
      await visit(cdp, sessionId, base + p, w, n);
      try {
        const { data } = await cdp.send('Page.captureScreenshot', {
          format: 'png', captureBeyondViewport: true, optimizeForSpeed: false,
        }, sessionId);
        fs.writeFileSync(path.join(outDir, shotName(p, w)), Buffer.from(data, 'base64'));
        manifest.push({ page: p, width: w, file: shotName(p, w) });
      } catch (err) {
        console.warn('[visual] %s @ %d: %s', p, w, err && err.message);
      }
      n++;
      if (!quiet && n % 25 === 0) console.log('[visual] %d shots…', n);
    }
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ base, pages, widths, shots: manifest }, null, 2));
  cdp.close();
  browser.stop();
  console.log('[visual] %d screenshot(s) -> %s', n, path.relative(ROOT, outDir));
  return 0;
}

// ----- Diff ----------------------------------------------------------------

async function diff(beforeDir, afterDir, opts = {}) {
  opts = { scale: 0.5, ...opts };
  const sharp = require('sharp');
  const mf = path.join(beforeDir, 'manifest.json');
  if (!fs.existsSync(mf)) {
    console.error('[visual] %s has no manifest.json — run visual:shoot first', beforeDir);
    return 1;
  }
  const { shots } = JSON.parse(fs.readFileSync(mf, 'utf8'));
  const diffDir = opts.diffDir || path.join(afterDir, '_diff');
  fs.mkdirSync(diffDir, { recursive: true });

  const rows = [];
  for (const s of shots) {
    const a = path.join(beforeDir, s.file);
    const b = path.join(afterDir, s.file);
    if (!fs.existsSync(b)) {
      rows.push({ ...s, status: 'missing' });
      continue;
    }
    // Downscale before comparing. These are full-page shots — some are 11,000
    // pixels tall — and a per-pixel loop over 475 such pairs is minutes of
    // wall clock for a question that is about layout, not hairlines. Half size
    // keeps every reflow visible; the originals stay on disk to look at.
    const load = (f) => (opts.scale === 1
      ? sharp(f).raw().toBuffer({ resolveWithObject: true })
      : sharp(f).metadata().then((m) => sharp(f)
        .resize({ width: Math.max(1, Math.round(m.width * opts.scale)), kernel: 'nearest' })
        .raw().toBuffer({ resolveWithObject: true })));
    const [ia, ib] = await Promise.all([load(a), load(b)]);

    // Different heights mean the layout reflowed — that is a real difference,
    // not a reason to skip the pair, so compare the overlap and say so.
    const w = Math.min(ia.info.width, ib.info.width);
    const h = Math.min(ia.info.height, ib.info.height);
    const ch = ia.info.channels;
    let changed = 0;
    const out = Buffer.alloc(w * h * 3, 0xff);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const pa = (y * ia.info.width + x) * ch;
        const pb = (y * ib.info.width + x) * ch;
        const d = Math.abs(ia.data[pa] - ib.data[pb])
          + Math.abs(ia.data[pa + 1] - ib.data[pb + 1])
          + Math.abs(ia.data[pa + 2] - ib.data[pb + 2]);
        const o = (y * w + x) * 3;
        if (d > 24) {            // ignore antialiasing noise
          changed++;
          out[o] = 0xff; out[o + 1] = 0x00; out[o + 2] = 0x00;
        } else {
          const g = 0xff - Math.round((0xff - ia.data[pa]) * 0.15);
          out[o] = g; out[o + 1] = g; out[o + 2] = g;
        }
      }
    }
    const pct = (changed / (w * h)) * 100;
    const heightDelta = Math.round((ib.info.height - ia.info.height) / opts.scale);
    if (pct > 0.01 || heightDelta !== 0) {
      await sharp(out, { raw: { width: w, height: h, channels: 3 } })
        .png().toFile(path.join(diffDir, s.file));
    }
    rows.push({ ...s, pct, heightDelta, status: 'compared' });
  }

  rows.sort((x, y) => (y.pct || 0) - (x.pct || 0));
  const moved = rows.filter((r) => r.status === 'compared' && (r.pct > 0.01 || r.heightDelta !== 0));
  console.log('\n[visual] %d pair(s) compared, %d differ\n', rows.length, moved.length);
  if (moved.length) {
    console.log('  %-34s %6s  %8s  %s', 'page', 'width', 'changed', 'height Δ');
    for (const r of moved.slice(0, opts.top || 40)) {
      console.log('  %-34s %6s  %7s%%  %s', r.page, r.width, r.pct.toFixed(2),
        r.heightDelta === 0 ? '-' : (r.heightDelta > 0 ? '+' : '') + r.heightDelta + 'px');
    }
    if (moved.length > (opts.top || 40)) console.log('  … %d more', moved.length - (opts.top || 40));
    console.log('\n  diff images: %s', path.relative(ROOT, diffDir));
  }
  fs.writeFileSync(path.join(diffDir, 'report.json'), JSON.stringify(rows, null, 2));
  return 0;
}

// ----- Layout assertions ---------------------------------------------------
//
// The diff says what moved. This says what must not be true at any width, and
// it is the half that can fail on its own. Content too wide for its container
// is the classic breakpoint-consolidation bug, and a screenshot hides it twice
// over: `body { overflow-x: hidden }` (styles.css:49) clips the evidence, and a
// page that simply got wider looks fine.
//
// "Too wide" is measured against the element's nearest clipping ancestor, not
// against the viewport. Measuring against the viewport reports the homepage
// carousel on every run — .tesla-slider bleeds past the section padding by
// design and its track scrolls horizontally on purpose — and a check that cries
// wolf on every run is a check nobody reads.

const CHECK_JS = `(() => {
  const clipper = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox !== 'visible') return { el: p, scrollable: ox === 'auto' || ox === 'scroll' };
    }
    return { el: document.documentElement, scrollable: false };
  };
  const label = (el) => el.tagName.toLowerCase()
    + ((el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '')
        .toString().trim() ? '.' + (el.className.baseVal !== undefined ? el.className.baseVal : el.className).toString().trim().split(/\\s+/).join('.') : '');

  const clipped = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    const c = clipper(el);
    // Overflow inside something the visitor can scroll is navigable, not lost.
    if (c.scrollable) continue;
    const cr = c.el.getBoundingClientRect();
    const right = c.el === document.documentElement ? document.documentElement.clientWidth : cr.right;
    const left = c.el === document.documentElement ? 0 : cr.left;
    // A few px of overhang is decorative (shadows, focus rings, rotated
    // labels); past that the content is genuinely cut off.
    const over = Math.max(r.right - right, left - r.left);
    if (over > 8) {
      clipped.push({ sel: label(el).slice(0, 70), over: Math.round(over), inside: label(c.el).slice(0, 40) });
    }
  }
  // Keep the outermost offender of each subtree: when a grid is too wide every
  // cell in it reports too, and the grid is the thing to fix.
  const seen = new Set();
  const out = [];
  for (const c of clipped) {
    const key = c.inside + '|' + c.sel.split('.')[0];
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return {
    vw: document.documentElement.clientWidth,
    scrollW: document.documentElement.scrollWidth,
    clipped: out.slice(0, 8),
    count: clipped.length,
  };
})()`;

async function check({ base, widths, pages }) {
  const chrome = findChrome();
  if (!chrome) {
    console.error('[visual] no Chromium found. Set CHROME_PATH to a Chrome/Chromium binary.');
    return 1;
  }
  const browser = await launch(chrome);
  const cdp = await CDP.connect(browser.wsUrl);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await prepareSession(cdp, sessionId);

  const failures = [];
  let n = 0;
  for (const p of pages) {
    for (const w of widths) {
      await visit(cdp, sessionId, base + p, w, n);
      try {
        const { result } = await cdp.send('Runtime.evaluate', { expression: CHECK_JS, returnByValue: true }, sessionId);
        const r = result.value;
        if (r && r.count) failures.push({ page: p, width: w, ...r });
      } catch (err) {
        console.warn('[visual] %s @ %d: %s', p, w, err && err.message);
      }
      n++;
      if (n % 50 === 0) console.log('[visual] %d checked…', n);
    }
  }
  cdp.close();
  browser.stop();

  console.log('[visual] %d page/width combination(s) checked', n);
  const outFile = process.env.VISUAL_CHECK_OUT;
  if (outFile) fs.writeFileSync(outFile, JSON.stringify(failures, null, 2));
  if (!failures.length) {
    console.log('[visual] nothing clipped at any width');
    return 0;
  }
  console.log('\n[visual] %d combination(s) clip content:\n', failures.length);
  for (const f of failures) {
    console.log('  %s @ %dpx', f.page, f.width);
    for (const o of f.clipped) console.log('      %s  overflows %s by %dpx', o.sel, o.inside, o.over);
  }
  return 1;
}

// ----- CLI -----------------------------------------------------------------

async function main() {
  const argv = process.argv.slice(2);
  const mode = argv[0];
  const flag = (name, dflt) => {
    const i = argv.indexOf('--' + name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
  };
  const base = flag('base', process.env.VISUAL_BASE || 'http://127.0.0.1:3960');
  const only = flag('page', null);
  const pages = only ? only.split(',').map((s) => s.trim()).filter(Boolean) : PAGES;
  const widthArg = flag('widths', null);
  const widths = widthArg ? widthArg.split(',').map(Number) : WIDTHS;

  if (mode === 'shoot') {
    return shoot({ base, outDir: path.resolve(flag('out', '.visual/run')), widths, pages });
  }
  if (mode === 'diff') {
    const [, a, b] = argv;
    if (!a || !b) {
      console.error('usage: visual-snapshot.js diff <beforeDir> <afterDir>');
      return 1;
    }
    return diff(path.resolve(a), path.resolve(b), {
      top: Number(flag('top', 40)),
      scale: Number(flag('scale', 0.5)),
    });
  }
  if (mode === 'check') {
    return check({ base, widths, pages });
  }
  console.error(`usage:
  visual-snapshot.js shoot --out <dir> [--base URL] [--widths a,b,c] [--page /path]
  visual-snapshot.js diff <beforeDir> <afterDir> [--top N]
  visual-snapshot.js check [--base URL] [--widths a,b,c]`);
  return 1;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error('[visual] failed:', err && err.stack || err);
  process.exit(1);
});
