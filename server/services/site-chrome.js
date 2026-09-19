// Server-rendered header, side menu and footer.
//
// Why this exists: every page shipped `<div id="header-mount"></div>`
// and `<div id="footer-mount"></div>` empty, and partials.js filled
// them in the browser. That is fine for a reader and bad for a crawler.
// The rendered HTML of the homepage contained no <nav>, no <footer>,
// and therefore no link to /solutions/, /terms.html or /legal.html —
// those pages sat in the sitemap with nothing pointing at them. Google
// does run JS, but it does so in a second, slower pass, and links found
// only in that pass compete for a much smaller budget. On a site this
// size that is the difference between "indexed" and "discovered —
// currently not indexed".
//
// The markup mirrors public/partials.js. partials.js still runs and
// still replaces these nodes on hydration, so the two must agree
// visually or the page will shift as it loads; both now read the same
// navigation tree from services/public-settings, so the only thing
// that can drift is the markup itself. Keep them in step.

const { loadPublicSettings } = require('./public-settings');

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

// Mirrors the FALLBACK block in public/partials.js. Used when the
// settings table has no navigation row yet, so a fresh install still
// renders a crawlable nav instead of nothing.
const FALLBACK_NAV = [
  { label: 'HOME', url: '/', nav: 'home' },
  { label: 'PRODUCTS', url: '/products/', nav: 'products', children: [
    { label: 'Polymer Lithium Battery', url: '/products/polymer-lithium-battery' },
    { label: 'Custom-Shaped Polymer (Li-Po)', url: '/products/custom-shaped-polymer-lithium-battery' },
    { label: 'Coin Steel-Shell Lithium', url: '/products/coin-steel-shell-lithium-battery' },
  ] },
  { label: 'APPLICATIONS', url: '/applications/', nav: 'applications' },
  { label: 'CUSTOM SOLUTIONS', url: '/solutions/', nav: 'solutions', children: [
    { label: 'Design Support', url: '/solutions/design.html' },
    { label: 'Prototyping', url: '/solutions/prototyping.html' },
    { label: 'Mass Production', url: '/solutions/mass-production.html' },
  ] },
  { label: 'ABOUT US', url: '/about/', nav: 'about', children: [
    { label: 'Company Profile', url: '/about/profile.html' },
    { label: 'Factory Tour', url: '/about/factory.html' },
    { label: 'Team', url: '/about/team.html' },
  ] },
  { label: 'BLOG', url: '/blog/', nav: 'blog' },
  { label: 'FAQ', url: '/faq.html', nav: 'faq' },
  { label: 'CONTACT', url: '/contact.html', nav: 'contact' },
];

const FALLBACK_SITE = { name: 'Zufek' };

function headerHtml(nav, siteName) {
  const lis = nav.map((item) => {
    const slug = item.nav || '';
    if (item.children && item.children.length) {
      return `<li class="has-dropdown" data-nav="${escapeHtml(slug)}">
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
      <a href="/" class="brand">${escapeHtml(siteName)}</a>
      <ul class="nav-main">${lis}</ul>
      <button class="menu-btn" id="menuBtn" aria-label="Menu">Menu</button>
    </nav>
  </header>`;
}

function sidemenuHtml(nav) {
  const blocks = nav.map((item) => {
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

function footerHtml(nav, site) {
  const findChildren = (slug) => {
    const item = nav.find((i) => (i.nav || '').toLowerCase() === slug);
    return item && item.children ? item.children : [];
  };
  const aboutChildren = findChildren('about');
  const flatExtras = nav
    .filter((i) => !i.children && !['home', 'contact'].includes((i.nav || '').toLowerCase()))
    .map((i) => ({ label: i.label, url: i.url }));

  const listColumn = (heading, items) => `
      <div class="footer-col">
        <h5>${escapeHtml(heading)}</h5>
        ${items.map((c) => `<a href="${escapeHtml(c.url)}">${escapeHtml(c.label)}</a>`).join('')}
      </div>`;

  const year = new Date().getFullYear();
  const name = site.name || 'Zufek';

  return `<footer>
    <div class="footer-cols">
      ${listColumn('Products', findChildren('products'))}
      ${listColumn('Applications', findChildren('applications'))}
      ${listColumn('Solutions', findChildren('solutions'))}
      <div class="footer-col">
        <h5>Company</h5>
        ${aboutChildren.map((c) => `<a href="${escapeHtml(c.url)}">${escapeHtml(c.label)}</a>`).join('')}
        ${flatExtras.map((c) => `<a href="${escapeHtml(c.url)}">${escapeHtml(c.label)}</a>`).join('')}
        <a href="/contact.html">Contact</a>
      </div>
      <div class="footer-col footer-col--brand">
        <h5>${escapeHtml(name)}</h5>
        ${site.email ? `<p class="footer-contact"><a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a></p>` : ''}
        ${site.phone ? `<p>Phone: <a href="tel:${escapeHtml(String(site.phone).replace(/[^+\d]/g, ''))}">${escapeHtml(site.phone)}</a></p>` : ''}
        ${site.address ? `<p>Address: ${escapeHtml(site.address)}</p>` : ''}
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
      <p class="copyright">&copy; ${year} ${escapeHtml(name)}. All rights reserved.</p>
    </div>
  </footer>`;
}

// Fills a mount div in place. Only an EMPTY mount is filled: if a
// renderer already put chrome there we leave it alone, and we never
// produce two navs on one page.
function fillMount(html, id, markup) {
  const re = new RegExp(`(<div\\s+id=["']${id}["']\\s*>)\\s*(</div>)`, 'i');
  return re.test(html) ? html.replace(re, `$1${markup}$2`) : html;
}

/**
 * Inject header / side menu / footer into a page's mount points.
 * Returns the html unchanged when the page has no mounts (the admin UI,
 * partial fragments) or when the settings lookup fails — a page without
 * a server-rendered nav is worse than one with, but a 500 is worse than
 * both.
 */
async function injectChrome(html) {
  if (typeof html !== 'string') return html;
  if (!html.includes('header-mount') && !html.includes('footer-mount')) return html;

  let settings = {};
  try { settings = await loadPublicSettings(); } catch (_) { /* fall back below */ }

  const nav = (settings.navigation && Array.isArray(settings.navigation.header)
    && settings.navigation.header.length)
    ? settings.navigation.header
    : FALLBACK_NAV;
  const site = settings.site || FALLBACK_SITE;

  let out = html;
  out = fillMount(out, 'header-mount', headerHtml(nav, site.name || 'Zufek'));
  out = fillMount(out, 'sidemenu-mount', sidemenuHtml(nav));
  out = fillMount(out, 'footer-mount', footerHtml(nav, site));
  return out;
}

module.exports = { injectChrome, headerHtml, footerHtml, sidemenuHtml, FALLBACK_NAV };
