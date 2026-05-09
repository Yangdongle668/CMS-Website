// Shared header / footer / side-menu / cookie banner injector.
// Adapted for the CMS: brand, contact info, footer text, and nav are
// loaded from /api/settings/public so the admin panel can edit them
// without touching this file.
//
// Every page has <div id="header-mount"></div>, <div id="footer-mount"></div>, <div id="sidemenu-mount"></div>.
// Set <body data-nav="products-custom"> to auto-highlight the active nav item.

(function () {
'use strict';

// ----- Static fallback (used until CMS settings load, or if API fails) -----
const FALLBACK = {
  site: {
    name: 'Zufek',
    legal_name: 'Dongguan Zufek Technology Co.,Ltd',
    tagline: 'R&D-led lithium-cell maker for AR/VR, medical, wearables and IoT. A 100-person Dongguan team that has shipped 300+ custom programs worldwide since 2018.',
    email: 'info@zufek.com',
    engineering_email: 'engineering@zufek.com',
    phone: '+86 153 7772 0020',
    address: 'Room 432, Building 1, No. 34 Jinniu Road, Guancheng Subdistrict, Dongguan City, Guangdong Province, China',
  },
  social: {
    linkedin: 'https://www.linkedin.com/company/zufek',
    whatsapp: 'https://wa.me/8615377720020',
  },
  navigation: {
    header: [
      { label: 'HOME', url: '/', nav: 'home' },
      { label: 'PRODUCTS', url: '/products/', nav: 'products', children: [
        { label: 'Polymer Lithium Battery', url: '/products/polymer-lithium-battery' },
        { label: 'Custom-Shaped Polymer (Li-Po)', url: '/products/custom-shaped-polymer-lithium-battery' },
        { label: 'Coin Steel-Shell Lithium', url: '/products/coin-steel-shell-lithium-battery' },
      ]},
      { label: 'APPLICATIONS', url: '/applications/', nav: 'applications', children: [
        { label: 'AR / VR Glasses', url: '/applications/ar-vr.html' },
        { label: 'Medical Devices', url: '/applications/medical.html' },
        { label: 'Wearables', url: '/applications/wearables.html' },
        { label: 'IoT Devices', url: '/applications/iot.html' },
        { label: 'Smart Home', url: '/applications/smart-home.html' },
        { label: 'Defence & Aerospace', url: '/applications/defence-aerospace.html' },
      ]},
      { label: 'CUSTOM SOLUTIONS', url: '/solutions/', nav: 'solutions', children: [
        { label: 'Design Support', url: '/solutions/design.html' },
        { label: 'Prototyping', url: '/solutions/prototyping.html' },
        { label: 'Mass Production', url: '/solutions/mass-production.html' },
      ]},
      { label: 'ABOUT US', url: '/about/', nav: 'about', children: [
        { label: 'Company Profile', url: '/about/profile.html' },
        { label: 'Factory Tour', url: '/about/factory.html' },
        { label: 'Team', url: '/about/team.html' },
      ]},
      { label: 'BLOG', url: '/blog/', nav: 'blog' },
      { label: 'FAQ', url: '/faq.html', nav: 'faq' },
      { label: 'CONTACT', url: '/contact.html', nav: 'contact' },
    ],
  },
};

// Synchronous fallback render → block-level partials must be in place
// before script.js binds events on them. We render fallback first, then
// override with live settings if/when they arrive.
const STATE = {
  config: {
    turnstileSiteKey: '',
    privacyPolicyVersion: '1.0',
    siteName: 'Zufek',
    publicUrl: '',
    ga4: '',
    gscVerify: '',
    bingVerify: '',
    twitterHandle: '',
    defaultOgImage: '/assets/img/og-default.png',
  },
  settings: FALLBACK,
};

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function navHtml(nav) {
  const items = (nav && nav.header) || FALLBACK.navigation.header;
  const lis = items.map((item) => {
    const slug = item.nav || (item.label || '').toLowerCase();
    if (item.children && item.children.length) {
      return `
        <li class="has-dropdown" data-nav="${escapeHtml(slug)}">
          <a href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a>
          <div class="dropdown">
            ${item.children.map((c) => `<a href="${escapeHtml(c.url)}">${escapeHtml(c.label)}</a>`).join('')}
          </div>
        </li>`;
    }
    return `<li data-nav="${escapeHtml(slug)}"><a href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a></li>`;
  }).join('');
  return `<header id="site-header">
    <nav class="nav">
      <a href="/" class="brand">${escapeHtml(STATE.config.siteName || 'Zufek')}</a>
      <ul class="nav-main">${lis}</ul>
      <button class="menu-btn" id="menuBtn" aria-label="Menu">Menu</button>
    </nav>
  </header>`;
}

function sidemenuHtml(nav) {
  const items = (nav && nav.header) || FALLBACK.navigation.header;
  const blocks = items.map((item) => {
    if (item.children && item.children.length) {
      return `<li class="side-group">
        <div class="side-title">${escapeHtml(item.label)}</div>
        ${item.children.map((c) => `<a href="${escapeHtml(c.url)}">${escapeHtml(c.label)}</a>`).join('')}
      </li>`;
    }
    return `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a></li>`;
  }).join('');
  return `<aside class="side-menu" id="sideMenu">
    <button class="close-btn" id="closeBtn" aria-label="Close">&times;</button>
    <ul>${blocks}</ul>
  </aside>
  <div class="overlay" id="overlay"></div>`;
}

function footerHtml(settings) {
  const site = settings.site || FALLBACK.site;
  const social = settings.social || FALLBACK.social;
  const nav = (settings.navigation && settings.navigation.header) || FALLBACK.navigation.header;

  const linkedin = social.linkedin
    ? `<a href="${escapeHtml(social.linkedin)}" target="_blank" rel="noopener" class="social-btn" aria-label="LinkedIn">
       <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
         <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.27 2.38 4.27 5.47v6.27zM5.34 7.43a2.06 2.06 0 11.01-4.13 2.06 2.06 0 01-.01 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
       </svg></a>` : '';
  const whatsapp = social.whatsapp
    ? `<a href="${escapeHtml(social.whatsapp)}" target="_blank" rel="noopener" class="social-btn" aria-label="WhatsApp">
       <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
         <path d="M17.5 14.4c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15s-.76.96-.93 1.16c-.17.2-.34.22-.64.08-.3-.15-1.26-.46-2.4-1.48-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.34.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51-.17 0-.37-.02-.57-.02-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.08 1.75-.71 2-1.4.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12 2.05c-5.5 0-9.95 4.45-9.95 9.95 0 1.75.46 3.45 1.32 4.95l-1.4 5.15 5.27-1.38a9.88 9.88 0 004.75 1.21h.01c5.5 0 9.95-4.45 9.95-9.95 0-2.66-1.03-5.15-2.91-7.04A9.9 9.9 0 0012 2.05zm0 18.23h-.01a8.26 8.26 0 01-4.21-1.15l-.3-.18-3.13.82.83-3.04-.2-.31a8.26 8.26 0 01-1.27-4.42c0-4.57 3.72-8.28 8.29-8.28 2.21 0 4.29.86 5.86 2.43a8.23 8.23 0 012.43 5.86c0 4.57-3.72 8.27-8.29 8.27z"/>
       </svg></a>` : '';

  const year = new Date().getFullYear();

  // Pull the three "list" columns directly from nav (Products / Applications / Solutions).
  const findChildren = (slug) => {
    const item = nav.find((i) => (i.nav || '').toLowerCase() === slug);
    return item && item.children ? item.children : [];
  };
  const products    = findChildren('products');
  const applications = findChildren('applications');
  const solutions   = findChildren('solutions');

  // Build the "Company" column — About sub-pages + Blog + FAQ + Contact.
  const aboutChildren = findChildren('about');
  const flatExtras = nav
    .filter((i) => !i.children && !['home', 'contact'].includes((i.nav || '').toLowerCase()))
    .map((i) => ({ label: i.label, url: i.url }));

  // Render helper for a list column.
  const listColumn = (heading, items) => `
      <div class="footer-col">
        <h5>${escapeHtml(heading)}</h5>
        ${items.map((c) => `<a href="${escapeHtml(c.url)}">${escapeHtml(c.label)}</a>`).join('')}
      </div>`;

  return `<footer>
    <div class="footer-cols">
      ${listColumn('Products', products)}
      ${listColumn('Applications', applications)}
      ${listColumn('Solutions', solutions)}
      <div class="footer-col">
        <h5>Company</h5>
        ${aboutChildren.map((c) => `<a href="${escapeHtml(c.url)}">${escapeHtml(c.label)}</a>`).join('')}
        ${flatExtras.map((c) => `<a href="${escapeHtml(c.url)}">${escapeHtml(c.label)}</a>`).join('')}
        <a href="/contact.html">Contact</a>
      </div>
      <div class="footer-col footer-col--brand">
        <h5>${escapeHtml(site.name || 'Zufek')}</h5>
        <p>${escapeHtml(site.tagline || '')}</p>
        ${(site.email || site.engineering_email) ? `<p class="footer-contact">
          ${site.email ? `<a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a><br>` : ''}
          ${site.engineering_email ? `<a href="mailto:${escapeHtml(site.engineering_email)}">${escapeHtml(site.engineering_email)}</a>` : ''}
        </p>` : ''}
        ${site.phone ? `<p>${escapeHtml(site.phone)}</p>` : ''}
        ${site.address ? `<p>${escapeHtml(site.address)}</p>` : ''}
        ${(linkedin || whatsapp) ? `<div class="footer-social">${linkedin}${whatsapp}</div>` : ''}
      </div>
    </div>
    <div class="footer-bottom">
      <ul class="footer-links">
        <li><a href="/privacy.html">Privacy Policy</a></li>
        <li><a href="/terms.html">Terms of Use</a></li>
        <li><a href="/legal.html">Legal</a></li>
        <li><a href="/sitemap.xml">Sitemap</a></li>
        <li><a href="#" id="cookie-settings-link">Cookie Settings</a></li>
      </ul>
      <p class="copyright">&copy; ${year} ${escapeHtml(site.name || 'Zufek')}. All rights reserved.</p>
    </div>
  </footer>`;
}

const COOKIE_BANNER_HTML = `
<div class="cookie-banner" id="cookieBanner" role="dialog" aria-live="polite" aria-label="Cookie consent">
  <p class="cookie-text">We use cookies to keep this site reliable and improve it. See our <a href="/privacy.html">Privacy Policy</a>.</p>
  <div class="cookie-actions">
    <button class="cookie-btn cookie-btn-secondary" data-consent="necessary">Necessary Only</button>
    <button class="cookie-btn cookie-btn-secondary" id="cookieCustomizeBtn">Customize</button>
    <button class="cookie-btn cookie-btn-accept" data-consent="all">Accept All</button>
  </div>
</div>
<div class="cookie-modal-overlay" id="cookieModalOverlay" hidden></div>
<div class="cookie-modal" id="cookieModal" role="dialog" aria-modal="true" aria-labelledby="cookieModalTitle" hidden>
  <div class="cookie-modal-head">
    <h3 id="cookieModalTitle">Cookie Preferences</h3>
    <button class="cookie-modal-close" id="cookieModalClose" aria-label="Close">&times;</button>
  </div>
  <div class="cookie-modal-body">
    <label class="cookie-opt">
      <input type="checkbox" checked disabled>
      <div><span class="cookie-opt-title">Strictly necessary</span><span class="cookie-opt-desc">Required for the site to function (e.g. session, cookie choice). Always on.</span></div>
    </label>
    <label class="cookie-opt"><input type="checkbox" data-cat="preferences"><div><span class="cookie-opt-title">Preferences</span><span class="cookie-opt-desc">Remember language and UI preferences across visits.</span></div></label>
    <label class="cookie-opt"><input type="checkbox" data-cat="analytics"><div><span class="cookie-opt-title">Analytics</span><span class="cookie-opt-desc">Anonymous traffic and page-performance measurement.</span></div></label>
    <label class="cookie-opt"><input type="checkbox" data-cat="marketing"><div><span class="cookie-opt-title">Marketing</span><span class="cookie-opt-desc">Measure the effectiveness of ads and outbound campaigns.</span></div></label>
  </div>
  <div class="cookie-modal-foot">
    <button class="cookie-btn cookie-btn-secondary" id="cookieModalCancel">Cancel</button>
    <button class="cookie-btn cookie-btn-accept" id="cookieSaveBtn">Save Preferences</button>
  </div>
</div>`;

const CONSENT_KEY = 'cms.cookie.consent';
const CONSENT_VERSION = '2';

function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.v !== CONSENT_VERSION) return null;
    return parsed;
  } catch { return null; }
}

function setConsent(categories) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      v: CONSENT_VERSION,
      categories,
      ts: new Date().toISOString(),
      pv: STATE.config.privacyPolicyVersion,
    }));
  } catch {}
  // Push the new state into GA4 immediately via Consent Mode v2. Skips
  // cleanly if gtag.js wasn't server-injected (no GA4 ID configured).
  try { applyGa4Consent(); } catch (_) {}
  // Also send to server so it can audit consent decisions.
  fetch('/api/gdpr/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      categories,
      policy_version: STATE.config.privacyPolicyVersion,
    }),
  }).catch(() => {});
}

function highlightActiveNav() {
  const active = document.body.dataset.nav;
  if (!active) return;
  document.querySelectorAll(`[data-nav="${active}"]`).forEach((el) => el.classList.add('active-nav'));
}

function renderAll() {
  const headerEl = document.getElementById('header-mount');
  const sideEl = document.getElementById('sidemenu-mount');
  const footEl = document.getElementById('footer-mount');
  const nav = STATE.settings.navigation || FALLBACK.navigation;
  if (headerEl) headerEl.outerHTML = navHtml(nav);
  if (sideEl) sideEl.outerHTML = sidemenuHtml(nav);
  if (footEl) footEl.outerHTML = footerHtml(STATE.settings);
  highlightActiveNav();
}

function bindCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  const modal = document.getElementById('cookieModal');
  const overlay = document.getElementById('cookieModalOverlay');
  if (!banner || !modal) return;

  const showBanner = () => banner.classList.add('visible');
  const hideBanner = () => banner.classList.remove('visible');
  const openModal = () => {
    const consent = getConsent();
    if (consent && consent.categories) {
      modal.querySelectorAll('input[data-cat]').forEach((cb) => { cb.checked = !!consent.categories[cb.dataset.cat]; });
    }
    modal.hidden = false; overlay.hidden = false;
    requestAnimationFrame(() => { modal.classList.add('visible'); overlay.classList.add('visible'); });
  };
  const closeModal = () => {
    modal.classList.remove('visible'); overlay.classList.remove('visible');
    setTimeout(() => { modal.hidden = true; overlay.hidden = true; }, 250);
  };

  if (!getConsent() && navigator.doNotTrack !== '1') setTimeout(showBanner, 400);

  document.querySelectorAll('.cookie-btn[data-consent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = btn.dataset.consent;
      setConsent({
        necessary: true,
        preferences: choice === 'all',
        analytics: choice === 'all',
        marketing: choice === 'all',
      });
      hideBanner();
    });
  });
  document.getElementById('cookieCustomizeBtn').addEventListener('click', openModal);
  document.getElementById('cookieSaveBtn').addEventListener('click', () => {
    const cats = { necessary: true };
    modal.querySelectorAll('input[data-cat]').forEach((cb) => { cats[cb.dataset.cat] = cb.checked; });
    setConsent(cats);
    closeModal(); hideBanner();
  });
  document.getElementById('cookieModalClose').addEventListener('click', closeModal);
  document.getElementById('cookieModalCancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  const link = document.getElementById('cookie-settings-link');
  if (link) link.addEventListener('click', (e) => { e.preventDefault(); showBanner(); });
}

async function loadSettings() {
  try {
    const [c, s] = await Promise.all([
      fetch('/api/public/config').then((r) => r.json()),
      fetch('/api/settings/public').then((r) => r.json()),
    ]);
    if (c) STATE.config = Object.assign(STATE.config, c);
    if (s && s.settings) STATE.settings = Object.assign({}, FALLBACK, s.settings);
  } catch (_) { /* keep fallback */ }
}

// ===== Organization + WebSite JSON-LD =====
// One shared @id keyed off the canonical home URL so every page references
// the same Organization node (Schema.org graph best practice).
function injectOrganizationSchema() {
  if (document.querySelector('script[data-jsonld="organization"]')) return;
  const base = (STATE.config.publicUrl || (location.protocol + '//' + location.host)).replace(/\/$/, '');
  const site = STATE.settings.site || {};
  const org = STATE.settings.organization || {};
  const social = STATE.settings.social || {};
  const sameAs = []
    .concat(Array.isArray(org.sameAs) ? org.sameAs : [])
    .concat(social.linkedin ? [social.linkedin] : [])
    .concat(social.youtube ? [social.youtube] : [])
    .concat(social.x ? [social.x] : [])
    .filter(Boolean);
  const logo = (() => {
    const v = org.logo || '/logo.png';
    return /^https?:\/\//.test(v) ? v : base + v;
  })();
  const address = org.address ? {
    '@type': 'PostalAddress',
    streetAddress: org.address.streetAddress || '',
    addressLocality: org.address.addressLocality || '',
    addressRegion: org.address.addressRegion || '',
    postalCode: org.address.postalCode || '',
    addressCountry: org.address.addressCountry || '',
  } : undefined;
  const contactPoint = Array.isArray(org.contactPoints) && org.contactPoints.length
    ? org.contactPoints.map((cp) => Object.assign({ '@type': 'ContactPoint', contactType: cp.type || 'sales' }, {
        email: cp.email,
        telephone: cp.telephone,
        areaServed: cp.areaServed || 'Worldwide',
        availableLanguage: cp.availableLanguage || ['en'],
      }))
    : undefined;
  const orgNode = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': base + '/#organization',
    name: org.brand_name || site.name || 'Zufek',
    legalName: org.legal_name || site.legal_name || '',
    url: base + '/',
    logo: logo,
    foundingDate: org.founding_date || (site.founded_year ? String(site.founded_year) : undefined),
    sameAs: sameAs.length ? sameAs : undefined,
    address: address,
    contactPoint: contactPoint,
    vatID: org.vat_id || undefined,
    duns: org.duns || undefined,
  };
  // WebSite node (enables sitelinks searchbox + AI graph anchoring)
  const websiteNode = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': base + '/#website',
    url: base + '/',
    name: org.brand_name || site.name || 'Zufek',
    publisher: { '@id': base + '/#organization' },
    inLanguage: 'en',
  };
  const s1 = document.createElement('script');
  s1.type = 'application/ld+json';
  s1.dataset.jsonld = 'organization';
  s1.textContent = JSON.stringify(orgNode);
  document.head.appendChild(s1);
  const s2 = document.createElement('script');
  s2.type = 'application/ld+json';
  s2.dataset.jsonld = 'website';
  s2.textContent = JSON.stringify(websiteNode);
  document.head.appendChild(s2);
}

// ===== GA4 consent gate =====
// google-site-verification + msvalidate.01 (Bing) + twitter:site are all
// rendered by the server-side html-tokens middleware now — Google's site-
// verification fetcher does not execute JavaScript, so JS-injected meta
// tags fail verification.
//
// GA4 is loaded by the server (gtag.js + Consent Mode v2 with default
// "denied" for all categories). This client-side hook only flips the
// consent state on/off based on the cookie banner choice, so analytics
// starts firing the instant the visitor accepts — no page reload needed.
function applyGa4Consent() {
  if (typeof window.gtag !== 'function') return;
  const consent = (function () {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); }
    catch (_) { return null; }
  })();
  const granted = !!(consent && consent.categories && consent.categories.analytics);
  const marketing = !!(consent && consent.categories && consent.categories.marketing);
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
  });
}

// Floating "Quick Quote" button (sitewide) — appears after the user has
// scrolled past the hero. Hidden on /contact.html and on the admin shell.
function injectFloatingQuote() {
  if (location.pathname.startsWith('/admin/')) return;
  if (location.pathname === '/contact.html') return;
  if (document.querySelector('.floating-quote')) return;
  const a = document.createElement('a');
  a.className = 'floating-quote';
  a.href = '/contact.html';
  a.setAttribute('aria-label', 'Get a quote');
  a.innerHTML = 'Get a Quote';
  document.body.appendChild(a);
  const sync = () => {
    const y = window.scrollY;
    const docH = document.documentElement.scrollHeight;
    const vpH  = window.innerHeight;
    // 1. Wait until the user has scrolled past the hero
    const pastHero = y > Math.max(vpH * 0.6, 320);
    // 2. Hide once the footer is in view (within 240px of the page bottom)
    //    so the floating pill never sits on top of the footer links.
    const distanceFromBottom = docH - (y + vpH);
    const nearFooter = distanceFromBottom < 240;
    a.classList.toggle('is-visible', pastHero && !nearFooter);
  };
  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync, { passive: true });
  // Re-check after images / partials finish loading and shift layout
  setTimeout(sync, 600);
  sync();
}

// Boot: render fallback synchronously so other scripts (script.js) find
// the DOM elements they need; then override with live data.
(async function () {
  // 1. Synchronous render with fallback so #site-header, #sideMenu, etc. exist
  renderAll();
  // 2. Inject cookie banner once
  document.body.insertAdjacentHTML('beforeend', COOKIE_BANNER_HTML);
  bindCookieBanner();
  injectFloatingQuote();
  // 3. Inject Organization + WebSite JSON-LD with FALLBACK values now so
  //    even a JS-rendering scraper that snapshots immediately sees them.
  //    They get re-injected (idempotent) after live settings arrive.
  injectOrganizationSchema();
  // 4. Live load and re-render
  await loadSettings();
  renderAll();
  // Refresh schema with live data (no-op if already present, since the
  // data-jsonld guard short-circuits — but we explicitly remove the fallback
  // first so the live values overwrite cleanly).
  document.querySelectorAll('script[data-jsonld="organization"], script[data-jsonld="website"]').forEach((n) => n.remove());
  injectOrganizationSchema();
  // Apply current consent state to GA4 (gtag is already loaded server-side
  // when seo.ga4_measurement_id is set; we only flip the consent flags).
  applyGa4Consent();
  // Re-fire any consumers that wanted live data
  document.dispatchEvent(new CustomEvent('cms:ready', { detail: STATE }));
})();

window.CMS = { state: STATE, escapeHtml };
})();
