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

// ===== Nav dropdowns =====
// Uses a document-level bubbling `mouseover` handler instead of per-<li>
// mouseenter/leave. The previous approach lost track when the cursor
// crossed the gap between the parent nav item and the absolute-positioned
// .dropdown — it sometimes mis-fired mouseleave on the third or fourth
// item. With document-level mouseover we get a continuous signal of
// "what element is under the cursor right now", so the menu stays open
// as long as the cursor is anywhere in the .has-dropdown subtree.
let __ddState = { activeLi: null, closeTimer: null };
function bindDropdowns() {
  if (window.__ddBound) return;
  window.__ddBound = true;

  const openLi = (li) => {
    clearTimeout(__ddState.closeTimer);
    if (__ddState.activeLi && __ddState.activeLi !== li) {
      __ddState.activeLi.classList.remove('is-open');
    }
    __ddState.activeLi = li;
    li.classList.add('is-open');
  };
  const scheduleClose = () => {
    clearTimeout(__ddState.closeTimer);
    __ddState.closeTimer = setTimeout(() => {
      if (__ddState.activeLi) {
        __ddState.activeLi.classList.remove('is-open');
        __ddState.activeLi = null;
      }
    }, 240);
  };

  // Mouse: bubbling mouseover continuously tells us where the cursor is.
  document.addEventListener('mouseover', (ev) => {
    const li = ev.target.closest && ev.target.closest('.has-dropdown');
    if (li) openLi(li);
    else if (__ddState.activeLi) scheduleClose();
  });

  // Backup: pointermove (throttled) checks the actual element under the
  // cursor via elementFromPoint. Catches edge cases where mouseover
  // mis-fires (rare but seen on some browser/OS combos when crossing
  // small gaps between elements).
  let __lastPointerCheck = 0;
  document.addEventListener('pointermove', (ev) => {
    const now = Date.now();
    if (now - __lastPointerCheck < 80) return;
    __lastPointerCheck = now;
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    if (!el) return;
    const li = el.closest && el.closest('.has-dropdown');
    if (li) openLi(li);
    else if (__ddState.activeLi) scheduleClose();
  });

  // Keyboard focus
  document.addEventListener('focusin', (ev) => {
    const li = ev.target.closest && ev.target.closest('.has-dropdown');
    if (li) openLi(li);
    else if (__ddState.activeLi) scheduleClose();
  });

  // Escape closes immediately
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && __ddState.activeLi) {
      clearTimeout(__ddState.closeTimer);
      __ddState.activeLi.classList.remove('is-open');
      __ddState.activeLi = null;
    }
  });

  // Touch: first tap opens, second tap navigates. Bound per-trigger so
  // we can preventDefault selectively.
  document.addEventListener('click', (ev) => {
    if (window.matchMedia('(hover: hover)').matches) return;
    const trigger = ev.target.closest && ev.target.closest('.has-dropdown > a');
    if (!trigger) return;
    const li = trigger.parentElement;
    if (li && !li.classList.contains('is-open')) {
      ev.preventDefault();
      openLi(li);
    }
  });
}

// Re-bind after partials.js re-renders header/footer with live settings
document.addEventListener('cms:ready', () => { bindHeader(); bindSideMenu(); bindDropdowns(); });
// Initial bind on the fallback render
bindHeader(); bindSideMenu(); bindDropdowns();

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

  // Attach any files the visitor selected (already uploaded via /api/inquiries/upload).
  // The attachment widget stores its uploaded-file objects on the form's __attachments
  // property — we serialize that array into the submission payload here.
  data.attachments = Array.isArray(form.__attachments) ? form.__attachments : [];

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

// Bind the contact form via addEventListener — the previous `onsubmit="…"`
// attribute is blocked by the page CSP (`script-src-attr 'none'`).
function bindContactForm() {
  document.querySelectorAll('form[data-contact-form], form.contact-form').forEach((form) => {
    if (form.__contactBound) return;
    form.__contactBound = true;
    form.addEventListener('submit', handleContactSubmit);
  });
}
if (document.readyState !== 'loading') bindContactForm();
else document.addEventListener('DOMContentLoaded', bindContactForm);
document.addEventListener('cms:ready', bindContactForm);

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
// Re-queries on every cms:ready and on cms:turnstile-rescan events so
// widgets injected after this script loaded (mini RFQ, exit-intent
// modal) get their data-turnstile elements bound too.
(function () {
  function mountAll() {
    const key = (window.CMS && window.CMS.state.config && window.CMS.state.config.turnstileSiteKey) || '';
    document.querySelectorAll('[data-turnstile]').forEach((mount) => {
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
  }
  document.addEventListener('cms:ready', mountAll);
  document.addEventListener('cms:turnstile-rescan', mountAll);
})();

// ===== Tesla-style horizontal slider =====
// Wires the prev/next arrows to scroll the track by ~one card width and
// disables them at the edges. Idempotent: skips already-bound sliders.
function bindSliders() {
  document.querySelectorAll('[data-slider]').forEach((slider) => {
    if (slider.__bound) return;
    slider.__bound = true;
    const track = slider.querySelector('[data-slider-track]');
    const prev  = slider.querySelector('.tesla-slider__arrow--prev');
    const next  = slider.querySelector('.tesla-slider__arrow--next');
    if (!track || !prev || !next) return;

    const cardWidth = () => {
      const first = track.firstElementChild;
      if (!first) return track.clientWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
      return first.getBoundingClientRect().width + gap;
    };
    const updateArrows = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.toggleAttribute('disabled', track.scrollLeft <= 2);
      next.toggleAttribute('disabled', track.scrollLeft >= max);
    };
    prev.addEventListener('click', () => {
      track.scrollBy({ left: -cardWidth(), behavior: 'smooth' });
    });
    next.addEventListener('click', () => {
      track.scrollBy({ left: cardWidth(), behavior: 'smooth' });
    });
    track.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows, { passive: true });
    // Initial state
    requestAnimationFrame(updateArrows);
  });
}
document.addEventListener('cms:ready', bindSliders);
if (document.readyState !== 'loading') bindSliders();
else document.addEventListener('DOMContentLoaded', bindSliders);

// ===== Reveal-on-scroll (bidirectional + staggered) =====
// Enter direction: from-below → fade up + scale ease-in (default)
// Bidirectional: now we toggle the class instead of unobserving, so
// scrolling back UP and re-entering an element re-plays the animation
// (gives the site a more responsive, alive feel).
// Stagger: items inside the same parent grid get a 60ms-per-child delay
// applied via CSS variable, so a 3-card row "ripples" rather than
// snapping in unison.
const fadeTargets = document.querySelectorAll(
  '.product-card, .app-card, .step-card, .news-card, .about-tab, .about-stats > div, .contact-card, .faq-list details, .feat-item, .blog-card, .pillar-card, .cust-item, .tesla-slide, .feat-grid > *, .pillar-grid > a, .product-grid > a, .blog-grid > *, .news-grid > *, .cert-chip, .about-stats > div, .mfg-stats > div, [data-reveal]'
);
fadeTargets.forEach((el, i) => {
  el.classList.add('reveal');
  // Per-element stagger inside its parent. We inspect the position of
  // the element among its siblings (capped at 8 so very long lists
  // don't get an excessive delay) and translate that into a CSS
  // variable consumed by the .reveal animation.
  const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.matches('.reveal')) : null;
  const idx = siblings ? Math.min(siblings.indexOf(el), 8) : 0;
  el.style.setProperty('--reveal-delay', (Math.max(0, idx) * 60) + 'ms');
});

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    // Toggle (not one-shot) so scrolling up replays the animation.
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      entry.target.classList.add('visible');
    } else {
      // Only "exit" the reveal when the element is fully off-screen,
      // not when partially scrolled out — otherwise the animation
      // re-fires too aggressively as the user reads.
      const r = entry.boundingClientRect;
      const off = r.top > window.innerHeight + 80 || r.bottom < -80;
      if (off) {
        entry.target.classList.remove('is-visible');
        entry.target.classList.remove('visible');
      }
    }
  });
}, { threshold: [0, 0.12, 0.5], rootMargin: '0px 0px -8% 0px' });

fadeTargets.forEach((el) => io.observe(el));

// ===== Hero parallax =====
const heroEl = document.querySelector('.hero');
if (heroEl && !window.matchMedia('(max-width: 900px)').matches) {
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(window.scrollY, window.innerHeight);
      heroEl.style.backgroundPosition = `center calc(50% + ${y * 0.18}px)`;
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ===== Smooth section scroll for in-page anchors =====
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (ev) => {
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    ev.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ===== Header hide-on-scroll-down + scroll direction tracking =====
// In addition to hiding the header on downscroll, we expose the current
// scroll direction as body[data-scroll-dir="up"|"down"]. The reveal
// animation uses this to come from above when you scroll UP into a
// previously-seen element, so the page feels like a continuous space
// instead of a one-shot reveal.
let lastScroll = 0;
const headerEl = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y > lastScroll + 4) document.body.dataset.scrollDir = 'down';
  else if (y < lastScroll - 4) document.body.dataset.scrollDir = 'up';
  if (headerEl) {
    if (y > lastScroll + 8 && y > 200) headerEl.classList.add('is-hidden');
    else if (y < lastScroll - 4) headerEl.classList.remove('is-hidden');
  }
  lastScroll = y;
}, { passive: true });

// ===== Magnetic hover for primary CTAs (subtle tech-feel touch) =====
// Buttons follow the cursor by a few px when hovered. Disabled on
// touch devices and when prefers-reduced-motion is set.
(function () {
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const btns = document.querySelectorAll('.btn-primary, .btn-accent, .news-link');
  btns.forEach((btn) => {
    btn.addEventListener('pointermove', (ev) => {
      const r = btn.getBoundingClientRect();
      const x = ev.clientX - r.left - r.width / 2;
      const y = ev.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${(x * 0.08).toFixed(1)}px, ${(y * 0.12).toFixed(1)}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
})();

// ===== Card 3D tilt on hover (tech-feel; subtle, < 6deg) =====
(function () {
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const tiltSelector = '.pillar-card, .product-card, .feat-item, .step-card, .blog-card, .news-card';
  document.querySelectorAll(tiltSelector).forEach((card) => {
    card.addEventListener('pointermove', (ev) => {
      const r = card.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width;
      const y = (ev.clientY - r.top) / r.height;
      const rx = ((y - 0.5) * -5).toFixed(2);
      const ry = ((x - 0.5) *  5).toFixed(2);
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
})();

// ===== Inquiry attachment uploader =====
// Picks up <label class="rfq-attach"> on any form (typically /contact.html).
// On file select / drop, POST each file to /api/inquiries/upload and
// stash the returned URL on form.__attachments. handleContactSubmit
// reads form.__attachments when submitting the inquiry.
(function () {
  document.querySelectorAll('[data-rfq-attach]').forEach((wrap) => {
    const form = wrap.closest('form');
    if (!form) return;
    if (!form.__attachments) form.__attachments = [];

    const zone = wrap.querySelector('[data-rfq-attach-zone]');
    const input = wrap.querySelector('[data-rfq-file-input]');
    const list = wrap.querySelector('[data-rfq-attach-list]');

    function renderList() {
      list.innerHTML = form.__attachments.map((a, i) => `
        <li class="rfq-attach__row" data-i="${i}">
          <span class="rfq-attach__name">${a.original_name || a.filename || 'file'}</span>
          <span class="rfq-attach__size">${a.size ? Math.round(a.size / 1024) + ' KB' : ''}</span>
          <button type="button" class="rfq-attach__remove" data-i="${i}" aria-label="Remove">×</button>
        </li>
      `).join('');
      list.querySelectorAll('.rfq-attach__remove').forEach((b) => {
        b.addEventListener('click', () => {
          form.__attachments.splice(parseInt(b.dataset.i, 10), 1);
          renderList();
        });
      });
    }

    async function uploadFiles(files) {
      const remaining = 5 - form.__attachments.length;
      const picked = Array.from(files).slice(0, Math.max(0, remaining));
      for (const file of picked) {
        if (file.size > 8 * 1024 * 1024) {
          showError(file.name + ' 超过 8MB 上限，已跳过');
          continue;
        }
        const placeholder = { original_name: file.name, size: file.size, url: '', _uploading: true };
        form.__attachments.push(placeholder);
        renderList();
        try {
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch('/api/inquiries/upload', {
            method: 'POST', credentials: 'include', body: fd,
          });
          const json = await res.json().catch(() => ({}));
          const idx = form.__attachments.indexOf(placeholder);
          if (!res.ok || !json.url) {
            if (idx >= 0) form.__attachments.splice(idx, 1);
            showError(file.name + ' 上传失败：' + (json.error || res.status));
          } else if (idx >= 0) {
            form.__attachments[idx] = json;
          }
        } catch (err) {
          const idx = form.__attachments.indexOf(placeholder);
          if (idx >= 0) form.__attachments.splice(idx, 1);
          showError(file.name + ' 上传失败：' + err.message);
        }
        renderList();
      }
    }

    function showError(msg) {
      let bar = wrap.querySelector('.rfq-attach__error');
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'rfq-attach__error';
        wrap.appendChild(bar);
      }
      bar.textContent = msg;
      clearTimeout(bar.__t);
      bar.__t = setTimeout(() => { bar.remove(); }, 4000);
    }

    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      if (input.files && input.files.length) uploadFiles(input.files);
      input.value = '';
    });
    ['dragenter', 'dragover'].forEach((evt) => zone.addEventListener(evt, (e) => {
      e.preventDefault(); zone.classList.add('is-dragover');
    }));
    ['dragleave', 'drop'].forEach((evt) => zone.addEventListener(evt, (e) => {
      e.preventDefault(); zone.classList.remove('is-dragover');
    }));
    zone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
    });
  });
})();
