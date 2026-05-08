// ===== Header scroll state =====
function bindHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const update = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ===== Side menu =====
function bindSideMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('closeBtn');
  const sideMenu = document.getElementById('sideMenu');
  const overlay = document.getElementById('overlay');
  if (!menuBtn || !sideMenu || !overlay) return;
  if (menuBtn.__bound) return;
  menuBtn.__bound = true;
  const open = () => { sideMenu.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { sideMenu.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; };
  menuBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  sideMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

// Re-bind after partials.js re-renders header/footer with live settings
document.addEventListener('cms:ready', () => { bindHeader(); bindSideMenu(); });
// Initial bind on the fallback render
bindHeader(); bindSideMenu();

// ===== Blog tabs =====
const blogTabs = document.querySelectorAll('.blog-tab');
const blogPanels = document.querySelectorAll('.blog-panel');
blogTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.target;
    blogTabs.forEach((t) => t.classList.toggle('active', t === tab));
    blogPanels.forEach((p) => p.classList.toggle('active', p.id === target));
  });
});

// ===== Contact form → POST to /api/inquiries =====
async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.textContent = 'Sending…';
  btn.disabled = true;

  let status = form.querySelector('.form-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'form-status';
    form.appendChild(status);
  }
  status.textContent = '';
  status.className = 'form-status';

  // Build payload from form fields
  const fd = new FormData(form);
  const data = {
    full_name: fd.get('name') || fd.get('full_name') || '',
    company: fd.get('company') || '',
    email: fd.get('email') || '',
    phone: fd.get('phone') || '',
    country: fd.get('country') || '',
    application: fd.get('application') || fd.get('industry') || '',
    capacity_need: fd.get('capacity') || fd.get('capacity_need') || '',
    annual_volume: fd.get('volume') || fd.get('annual_volume') || '',
    product_categories: fd.getAll('product_categories'),
    message: fd.get('message') || fd.get('details') || '',
    consent_given: !!form.querySelector('[name="consent"]')?.checked || !!form.querySelector('[name="consent_given"]')?.checked,
    'cf-turnstile-response': fd.get('cf-turnstile-response') || 'dev-bypass',
    website: fd.get('website') || '',  // honeypot
    source_page: location.pathname,
  };
  try { data.utm = JSON.parse(localStorage.getItem('cms_utm') || '{}'); } catch (_) { data.utm = {}; }

  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({ ok: false, error: 'Unexpected server response.' }));

    if (res.ok && json.ok) {
      btn.textContent = '✓ Inquiry Received';
      status.textContent = `Thanks — reference ${json.reference}. We'll reply within one business day.`;
      status.classList.add('form-status-ok');
      form.reset();
      if (window.turnstile) {
        try { window.turnstile.reset(); } catch (_) {}
      }
    } else {
      btn.textContent = original;
      btn.disabled = false;
      const map = {
        consent_required: 'Please accept our privacy policy to continue.',
        invalid_email: 'Please enter a valid email address.',
        message_too_short: 'Please share a few more details.',
        turnstile_failed: 'Anti-bot check failed. Please try again.',
        too_many_inquiries: 'Too many submissions from this network. Please email us instead.',
      };
      status.textContent = map[json.error] || json.error || 'Something went wrong. Please email us directly.';
      status.classList.add('form-status-error');
    }
  } catch (err) {
    btn.textContent = original;
    btn.disabled = false;
    status.textContent = 'Network error. Please email us directly.';
    status.classList.add('form-status-error');
  }

  if (btn.textContent.startsWith('✓')) {
    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 4000);
  }
  return false;
}
window.handleContactSubmit = handleContactSubmit;

// ===== UTM capture =====
(function () {
  const sp = new URLSearchParams(location.search);
  const utm = {};
  ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach((k) => {
    if (sp.has(k)) utm[k] = sp.get(k);
  });
  if (Object.keys(utm).length) localStorage.setItem('cms_utm', JSON.stringify(utm));
})();

// ===== Turnstile auto-mount =====
(function () {
  const targets = document.querySelectorAll('[data-turnstile]');
  if (!targets.length) return;
  document.addEventListener('cms:ready', () => {
    const key = (window.CMS && window.CMS.state.config && window.CMS.state.config.turnstileSiteKey) || '';
    targets.forEach((mount) => {
      if (mount.__mounted) return;
      mount.__mounted = true;
      if (!key || key.startsWith('0x000')) {
        mount.innerHTML = '<input type="hidden" name="cf-turnstile-response" value="dev-bypass">';
        return;
      }
      if (!window.__turnstileLoaded) {
        const s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        s.async = true; s.defer = true;
        document.head.appendChild(s);
        window.__turnstileLoaded = true;
      }
      const w = document.createElement('div');
      w.className = 'cf-turnstile';
      w.dataset.sitekey = key;
      w.dataset.theme = mount.dataset.turnstileTheme || 'auto';
      mount.innerHTML = '';
      mount.appendChild(w);
    });
  });
})();

// ===== Fade-in on scroll =====
const fadeTargets = document.querySelectorAll(
  '.product-card, .app-card, .step-card, .news-card, .about-tab, .about-stats > div, .contact-card, .faq-list details, .feat-item'
);
fadeTargets.forEach((el) => el.classList.add('fade-in'));

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

fadeTargets.forEach((el) => io.observe(el));
