#!/usr/bin/env node
// Real browser checks against a disposable seeded database; no user account is changed.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { startServer } = require('../test/helpers/server');
const { CDP, launch, findChrome, visit, prepareSession, CHECK_JS } = require('./visual-snapshot');

const ROOT = path.join(__dirname, '..');
const flag = (name, fallback) => {
  const i = process.argv.indexOf('--' + name);
  return i < 0 ? fallback : process.argv[i + 1];
};
const height = Number(flag('height', '900'));
const forceTouch = flag('touch', 'false') === 'true';
const widths = flag('widths', '320,375,480,640,768,820,1024,1280,1440,1920').split(',').map(Number);
const collect = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const file = path.join(dir, e.name);
  return e.isDirectory() ? collect(file) : [file];
});
const publicPages = collect(path.join(ROOT, 'public')).filter((f) => f.endsWith('.html')
  && !f.endsWith('_template.html') && fs.readFileSync(f, 'utf8').includes('name="viewport"'))
  .map((f) => '/' + path.relative(path.join(ROOT, 'public'), f).replaceAll(path.sep, '/').replace(/index\.html$/, ''));
publicPages.push('/products/polymer-lithium-battery', '/products/coin-steel-shell-lithium-battery',
  '/blog/ar-thin-battery', '/blog/cr-vs-lir-vs-ml-coin-cell-comparison');
const adminPages = collect(path.join(ROOT, 'admin')).filter((f) => f.endsWith('.html')
  && fs.readFileSync(f, 'utf8').includes('data-admin-shell'))
  .map((f) => '/admin/' + path.basename(f));
adminPages.unshift('/admin/login.html');
adminPages.push('/admin/visual-edit.html');
adminPages.push('/admin/products.html?id=1', '/admin/articles.html?id=1', '/admin/pages.html?id=1', '/admin/pillars.html?slug=polymer-lithium-battery');

async function main() {
  const browserPath = findChrome();
  if (!browserPath) throw new Error('Chromium required; set CHROME_PATH.');
  let srv, browser, cdp;
  const rows = [], failures = [];
  let interactions = 0;
  const out = path.resolve(flag('out', '.visual/responsive'));
  fs.mkdirSync(out, { recursive: true });
  try {
    srv = await startServer({ seed: true });
    const login = await srv.request('/api/auth/login', { method: 'POST',
      json: { email: 'responsive@test.local', password: crypto.randomBytes(24).toString('hex') } });
    if (login.status !== 200) throw new Error('Test login failed.');
    browser = await launch(browserPath);
    cdp = await CDP.connect(browser.wsUrl);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    await cdp.send('Network.setCookie', { name: cookie.split('=')[0], value: cookie.slice(cookie.indexOf('=') + 1), url: srv.url }, sessionId);
    await prepareSession(cdp, sessionId);
    const evaluate = async (expression) => {
      const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
      return r.result.value;
    };
    let seq = 0;
    let tabStates = 0;
    const only = flag('page', '');
    const pages = only ? only.split(',') : [...publicPages, ...adminPages];
    for (const page of pages) {
      const seen = await visit(cdp, sessionId, srv.url + page, widths[0], seq++);
      if (!seen) { failures.push({ page, reason: 'Page did not settle' }); continue; }
      for (const width of widths) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: forceTouch || width <= 1024 }, sessionId);
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: forceTouch || width <= 1024 }, sessionId);
      await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 100))))');
      const state = await evaluate(`({path:location.pathname,title:document.title,viewport:innerWidth,hasShell:!!document.querySelector('.admin-shell')})`);
      if (page.startsWith('/admin/') && page !== '/admin/login.html' && state.path === '/admin/login.html') {
        failures.push({ page, width, reason: 'Admin authentication lost' }); continue;
      }
      const layout = await evaluate(CHECK_JS);
      rows.push({ page, width, ...layout });
      if (!layout || layout.vw !== width || layout.scrollW > width + 1 || layout.count) {
        failures.push({ page, width, reason: 'Overflow or clipped content', ...layout });
      }
      // Restore overlays hidden by the snapshot settle step before interaction checks.
      await evaluate(`document.querySelectorAll('[style]').forEach(e=>{if(['fixed','sticky'].includes(getComputedStyle(e).position))e.style.removeProperty('visibility')})`);
      if (page === '/' && height >= 700) {
        const actionsVisible = await evaluate(`(()=>{const b=document.querySelector('.cookie-banner.visible');const a=document.querySelector('.hero-bottom');return !b||!a||a.getBoundingClientRect().bottom <= b.getBoundingClientRect().top - 8})()`);
        if (!actionsVisible) failures.push({ page, width, reason: 'Consent bar covers hero actions' });
      }
      const menuSelector = page.startsWith('/admin/') ? '[data-admin-menu]' : '#menuBtn';
      const visible = await evaluate(`(()=>{const b=document.querySelector(${JSON.stringify(menuSelector)});return !!b&&b.getBoundingClientRect().width>0})()`);
      if (visible) {
        const open = await evaluate(`(()=>{const b=document.querySelector(${JSON.stringify(menuSelector)});b.click();const id=b.getAttribute('aria-controls');const panel=document.getElementById(id);return b.getAttribute('aria-expanded')==='true'&&!!panel&&!panel.inert&&panel.scrollWidth<=panel.clientWidth+1&&getComputedStyle(panel).visibility==='visible'&&document.body.style.overflow==='hidden'})()`);
        if (!open) failures.push({ page, width, reason: 'Navigation does not open' });
        if (open && ['/', '/admin/inquiries.html'].includes(page) && [375, 820].includes(width)) {
          const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
          fs.writeFileSync(path.join(out, `navigation-${page.replace(/[^a-z0-9]/gi,'_')}-${width}.png`), Buffer.from(data, 'base64'));
        }
        const closed = await evaluate(`(()=>{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return document.querySelector(${JSON.stringify(menuSelector)}).getAttribute('aria-expanded')==='false'&&document.body.style.overflow!=='hidden'})()`);
        if (!closed) failures.push({ page, width, reason: 'Navigation does not close' });
        interactions += 2;
      }
      // Exercise editor/settings tabs as well as their initially visible pane.
      if (page.startsWith('/admin/')) {
        const tabs = await evaluate(`Array.from(document.querySelectorAll('.tabs__btn[data-tab]')).map(b=>b.dataset.tab)`);
        for (const tab of tabs) {
          await evaluate(`(()=>{document.querySelector('.tabs__btn[data-tab="'+${JSON.stringify(tab)}+'"]').click();return new Promise(r=>setTimeout(r,80))})()`);
          const tabLayout = await evaluate(CHECK_JS);
          if (tabLayout.scrollW > width + 1 || tabLayout.count) failures.push({ page, width, tab, reason: 'Tab content overflow', ...tabLayout });
          tabStates++;
        }
        if (tabs.length) await evaluate(`document.querySelector('.tabs__btn[data-tab]').click()`);
      }
      if (page.startsWith('/admin/visual-edit.html')) {
        for (const device of ['desktop', 'tablet', 'mobile']) {
          await evaluate(`document.querySelector('.ve-tab[data-device="'+${JSON.stringify(device)}+'"]').click()`);
          const deviceLayout = await evaluate(CHECK_JS);
          if (deviceLayout.scrollW > width + 1 || deviceLayout.count) failures.push({ page, width, device, reason: 'Visual editor preview overflow', ...deviceLayout });
          tabStates++;
        }
      }
      // Capture representative phone, tablet and desktop views with real overlays.
      if (['/', '/blog/ar-thin-battery', '/admin/inquiries.html'].includes(page) && [375, 820, 1440].includes(width)) {
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
        fs.writeFileSync(path.join(out, `${page.replace(/[^a-z0-9]/gi,'_') || 'home'}-${width}.png`), Buffer.from(data,'base64'));
      }
      if (rows.length % 50 === 0) console.log(`[responsive] ${rows.length} layouts checked`);
    }
    }
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ widths, height, forceTouch, publicPages, adminPages, layouts: rows.length, interactions, tabStates, failures, rows }, null, 2));
    console.log(JSON.stringify({ layouts: rows.length, interactions, tabStates, failures: failures.length, report: out }));
    if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exitCode = 1; }
  } finally {
    if (cdp) cdp.close();
    if (browser) browser.stop();
    if (srv) await srv.stop();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
