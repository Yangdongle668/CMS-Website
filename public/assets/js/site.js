/* ===========================================================
   Battery CMS - Site Boot
   - Header injection (loads settings)
   - Footer injection
   - Cookie consent
   - RFQ form binding
   - Reveal-on-scroll
   =========================================================== */
(function () {
  'use strict';

  const state = {
    settings: null,
    config: null,
  };

  async function fetchJson(url, opts) {
    const res = await fetch(url, Object.assign({ credentials: 'include' }, opts));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      for (const c of [].concat(children)) {
        if (c == null) continue;
        e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
    }
    return e;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // ---------- Header ----------
  function renderHeader(nav, site) {
    const headerMount = document.querySelector('[data-mount="header"]');
    if (!headerMount) return;
    const items = (nav && nav.header) || [];
    const navHtml = items
      .map((item) => {
        if (item.children && item.children.length) {
          return `
            <div class="nav__group">
              <a class="nav__link" href="${escapeHtml(item.url)}">${escapeHtml(item.label)}
                <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
              </a>
              <div class="nav__menu">
                ${item.children.map((c) => `<a href="${escapeHtml(c.url)}">${escapeHtml(c.label)}${c.summary ? `<small>${escapeHtml(c.summary)}</small>` : ''}</a>`).join('')}
              </div>
            </div>`;
        }
        return `<a class="nav__link" href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a>`;
      })
      .join('');
    headerMount.innerHTML = `
      <header class="site-header">
        <div class="container site-header__inner">
          <a href="/" class="brand">
            <span class="brand__mark">A</span>
            <span>${escapeHtml(site && site.name ? site.name.replace(/ Co\\..*$/, '') : 'Acme Battery')}</span>
          </a>
          <nav class="nav" data-nav>${navHtml}</nav>
          <div class="header-cta">
            <a href="/quote" class="btn btn--primary btn--sm">Get a Quote</a>
            <button class="menu-toggle" aria-label="Toggle menu" data-menu-toggle>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
          </div>
        </div>
      </header>`;
    const toggle = headerMount.querySelector('[data-menu-toggle]');
    const navEl = headerMount.querySelector('[data-nav]');
    toggle && toggle.addEventListener('click', () => navEl.classList.toggle('is-open'));
  }

  // ---------- Footer ----------
  function renderFooter(nav, site, social) {
    const mount = document.querySelector('[data-mount="footer"]');
    if (!mount) return;
    const footerLinks = (nav && nav.footer) || [];
    const productLinks = (nav && nav.header || [])
      .find((i) => i.label === 'Products');
    const products = productLinks && productLinks.children ? productLinks.children : [];
    const year = new Date().getFullYear();
    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <a href="/" class="brand" style="color:#fff;">
                <span class="brand__mark">A</span>
                <span>${escapeHtml(site && site.name || 'Acme Battery')}</span>
              </a>
              <p style="margin-top:14px;">${escapeHtml(site && site.tagline || 'B2B Lithium Battery Manufacturer')}. ${escapeHtml(site && site.address || '')}</p>
              <p>Email: <a href="mailto:${escapeHtml(site && site.email || '')}">${escapeHtml(site && site.email || '')}</a><br/>Phone: ${escapeHtml(site && site.phone || '')}</p>
            </div>
            <div>
              <h4>Products</h4>
              <ul class="footer-list">
                ${products.map((p) => `<li><a href="${escapeHtml(p.url)}">${escapeHtml(p.label)}</a></li>`).join('')}
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul class="footer-list">
                <li><a href="/about">About</a></li>
                <li><a href="/factory">Factory</a></li>
                <li><a href="/quality">Quality &amp; Certifications</a></li>
                <li><a href="/blog">Insights</a></li>
              </ul>
            </div>
            <div>
              <h4>Solutions</h4>
              <ul class="footer-list">
                <li><a href="/applications">Applications</a></li>
                <li><a href="/custom-solutions">Custom Solutions</a></li>
                <li><a href="/quote">Request a Quote</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul class="footer-list">
                ${footerLinks.map((l) => `<li><a href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a></li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${year} ${escapeHtml(site && site.name || 'Acme Battery Co., Ltd.')}. All rights reserved.</span>
            <span>Compliant with EU GDPR. <a href="/gdpr">Submit a data request →</a></span>
          </div>
        </div>
      </footer>`;
  }

  // ---------- Cookie banner ----------
  const COOKIE_KEY = 'cms_consent_v1';
  function readConsent() {
    try { return JSON.parse(localStorage.getItem(COOKIE_KEY)); } catch (_) { return null; }
  }
  function writeConsent(value) {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(value));
    fetch('/api/gdpr/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories: value.categories,
        policy_version: state.config && state.config.privacyPolicyVersion,
      }),
    }).catch(() => {});
  }
  function renderCookieBanner(gdpr) {
    const existing = readConsent();
    if (existing && existing.policy_version === (state.config && state.config.privacyPolicyVersion)) return;
    if (navigator.doNotTrack === '1') {
      writeConsent({ categories: { necessary: true, analytics: false, marketing: false }, policy_version: state.config && state.config.privacyPolicyVersion, dnt: true });
      return;
    }
    const cats = (gdpr && gdpr.cookie_categories) || {
      necessary: { required: true, label: 'Strictly necessary', description: 'Required for the site to function.' },
      analytics: { required: false, label: 'Analytics', description: 'Aggregated usage statistics.' },
      marketing: { required: false, label: 'Marketing', description: 'Campaign performance.' },
    };
    const node = el('aside', { class: 'cookie-banner is-open', role: 'dialog', 'aria-label': 'Cookie preferences' });
    node.innerHTML = `
      <h3>We value your privacy</h3>
      <p>We use cookies strictly necessary to operate this site. Optional analytics and marketing cookies help us improve. You can change your choice anytime in our <a href="/cookies" style="color:#93c5fd;">Cookie Policy</a>.</p>
      <details>
        <summary style="cursor:pointer; color:#93c5fd; font-size:13px; margin-bottom:8px;">Manage categories</summary>
        <div class="cookie-banner__categories">
          ${Object.keys(cats).map((k) => `
            <label class="cookie-banner__category">
              <input type="checkbox" name="cat-${k}" ${cats[k].required ? 'checked disabled' : 'checked'} />
              <span><strong>${escapeHtml(cats[k].label)}</strong><small>${escapeHtml(cats[k].description)}</small></span>
            </label>
          `).join('')}
        </div>
      </details>
      <div class="cookie-banner__actions">
        <button class="btn btn--primary" data-cookie="accept-all">Accept all</button>
        <button class="btn btn--ghost" style="color:#cbd5e1;border-color:#1e293b;" data-cookie="accept-selected">Save preferences</button>
        <button class="btn btn--ghost" style="color:#cbd5e1;border-color:#1e293b;" data-cookie="reject">Reject optional</button>
      </div>`;
    document.body.appendChild(node);
    node.addEventListener('click', (ev) => {
      const action = ev.target.closest('[data-cookie]')?.getAttribute('data-cookie');
      if (!action) return;
      const categories = { necessary: true, analytics: false, marketing: false };
      if (action === 'accept-all') { categories.analytics = true; categories.marketing = true; }
      if (action === 'accept-selected') {
        Object.keys(cats).forEach((k) => {
          const cb = node.querySelector(`input[name="cat-${k}"]`);
          categories[k] = cb ? cb.checked : false;
        });
        categories.necessary = true;
      }
      writeConsent({ categories, policy_version: state.config && state.config.privacyPolicyVersion, decided_at: new Date().toISOString() });
      node.classList.remove('is-open');
      node.remove();
    });
  }

  // ---------- Reveal on scroll ----------
  function observeReveals() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || els.length === 0) {
      els.forEach((e) => e.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
  }

  // ---------- RFQ form ----------
  function bindRfqForm(form) {
    if (!form || form.__bound) return;
    form.__bound = true;
    const status = form.querySelector('[data-status]');
    const submit = form.querySelector('[type="submit"]');

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (status) { status.textContent = ''; status.className = 'form-status'; }
      const data = Object.fromEntries(new FormData(form).entries());
      data.product_categories = data.product_categories
        ? Array.isArray(data.product_categories) ? data.product_categories : [data.product_categories]
        : [];
      data.consent_given = !!form.querySelector('[name="consent_given"]')?.checked;
      data.source_page = location.pathname;
      data['cf-turnstile-response'] = form.querySelector('[name="cf-turnstile-response"]')?.value || data['cf-turnstile-response'];
      try { data.utm = JSON.parse(localStorage.getItem('cms_utm') || '{}'); } catch (_) { data.utm = {}; }

      submit.disabled = true; submit.textContent = 'Sending…';
      try {
        const res = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed');
        if (status) {
          status.className = 'form-status is-success';
          status.textContent = `Thank you. Reference ${json.reference}. We will respond within 1 business day.`;
        }
        form.reset();
        if (window.turnstile && form.dataset.turnstileWidget) {
          try { window.turnstile.reset(form.dataset.turnstileWidget); } catch (_) {}
        }
      } catch (err) {
        if (status) {
          status.className = 'form-status is-error';
          status.textContent = err.message === 'consent_required'
            ? 'Please accept our privacy policy to continue.'
            : err.message === 'turnstile_failed'
              ? 'Anti-bot check failed. Please try again.'
              : 'Submission failed. Please try again or email us directly.';
        }
      } finally {
        submit.disabled = false; submit.textContent = submit.dataset.label || 'Submit Inquiry';
      }
    });
  }

  function injectTurnstile(container, siteKey) {
    if (!siteKey || !container) return;
    if (siteKey.startsWith('0x000')) {
      // Dev placeholder
      const fallback = el('input', { type: 'hidden', name: 'cf-turnstile-response', value: 'dev-bypass' });
      container.appendChild(fallback);
      const note = el('small', { class: 'muted', style: 'display:block; font-size:11.5px; margin-top:6px; opacity:.6;' }, 'Turnstile not configured (dev).');
      container.appendChild(note);
      return;
    }
    if (!window.__turnstileLoaded) {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true; s.defer = true;
      document.head.appendChild(s);
      window.__turnstileLoaded = true;
    }
    const wrap = el('div', { class: 'cf-turnstile', 'data-sitekey': siteKey, 'data-theme': container.closest('.rfq--light') ? 'light' : 'dark' });
    container.appendChild(wrap);
  }

  function captureUtm() {
    const sp = new URLSearchParams(location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((k) => {
      if (sp.has(k)) utm[k] = sp.get(k);
    });
    if (Object.keys(utm).length) localStorage.setItem('cms_utm', JSON.stringify(utm));
  }

  // ---------- Boot ----------
  async function boot() {
    captureUtm();
    try {
      const [config, settings] = await Promise.all([
        fetchJson('/api/public/config'),
        fetchJson('/api/settings/public'),
      ]);
      state.config = config;
      state.settings = settings.settings || {};
    } catch (err) {
      state.config = {};
      state.settings = {};
      console.warn('Could not load site config', err);
    }

    renderHeader(state.settings.navigation || {}, state.settings.site || {});
    renderFooter(state.settings.navigation || {}, state.settings.site || {}, state.settings.social || {});
    renderCookieBanner(state.settings.gdpr || {});

    // Auto-fetch RFQ snippet into any [data-rfq-mount]
    const mounts = Array.from(document.querySelectorAll('[data-rfq-mount]'));
    if (mounts.length) {
      try {
        const html = await fetch('/assets/js/rfq-form.html').then((r) => r.text());
        mounts.forEach((m) => { if (!m.firstElementChild) m.innerHTML = html; });
      } catch (_) {}
    }

    // RFQ forms
    document.querySelectorAll('[data-rfq-form]').forEach((form) => {
      bindRfqForm(form);
      const ts = form.querySelector('[data-turnstile]');
      if (ts) injectTurnstile(ts, state.config.turnstileSiteKey);
    });

    observeReveals();

    // Pillar select dropdown can be pre-filled
    const presetCat = document.body.dataset.rfqCategory;
    if (presetCat) {
      const sel = document.querySelector('[data-rfq-form] [name="product_categories"]');
      if (sel) sel.value = presetCat;
    }

    document.dispatchEvent(new CustomEvent('site:ready', { detail: state }));
  }

  window.SiteAPI = {
    fetchJson,
    el,
    escapeHtml,
    state,
    bindRfqForm,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
