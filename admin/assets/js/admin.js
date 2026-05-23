/* ===========================================================
   Admin shell - shared utilities
   =========================================================== */
(function () {
  'use strict';

  // 16×16 stroke-based SVG icon builder
  function ico(d) {
    return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  }

  const NAV = [
    { group: '询盘', items: [
      { label: '收件箱',   href: '/admin/inquiries.html',
        icon: ico('<rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><polyline points="1.5,6 8,9.5 14.5,6"/>') },
      { label: '仪表盘',   href: '/admin/index.html',
        icon: ico('<rect x="2" y="8" width="2.5" height="6" rx=".5"/><rect x="6.75" y="5" width="2.5" height="9" rx=".5"/><rect x="11.5" y="2" width="2.5" height="12" rx=".5"/>') },
      { label: '漏斗分析', href: '/admin/inquiry-funnel.html',
        icon: ico('<path d="M2 3h12l-4 5.5V13l-4 0V8.5Z"/>') },
      { label: '邮件队列', href: '/admin/mail-queue.html',
        icon: ico('<line x1="3" y1="4" x2="13" y2="4"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="3" y1="12" x2="9" y2="12"/>') },
      { label: '访问统计', href: '/admin/analytics.html',
        icon: ico('<polyline points="2,13 5,8.5 8,10 11.5,5 14,7"/><line x1="2" y1="13" x2="14" y2="13"/>') },
      { label: 'SEO 概览', href: '/admin/seo-overview.html',
        icon: ico('<circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/>') },
    ]},
    { group: '内容', items: [
      { label: '页面',       href: '/admin/pages.html',
        icon: ico('<rect x="2.5" y="1.5" width="11" height="13" rx="1.5"/><line x1="5" y1="5.5" x2="11" y2="5.5"/><line x1="5" y1="8.5" x2="11" y2="8.5"/><line x1="5" y1="11.5" x2="8.5" y2="11.5"/>') },
      { label: '支柱页',     href: '/admin/pillars.html',
        icon: ico('<polygon points="8,2 14,5 8,8 2,5"/><polyline points="2,8 8,11 14,8"/><polyline points="2,11 8,14 14,11"/>') },
      { label: '产品',       href: '/admin/products.html',
        icon: ico('<path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5Z"/><polyline points="2,4.5 8,8 14,4.5"/><line x1="8" y1="8" x2="8" y2="15"/>') },
      { label: '应用行业',   href: '/admin/applications.html',
        icon: ico('<rect x="2" y="2" width="5" height="5" rx="1.5"/><rect x="9" y="2" width="5" height="5" rx="1.5"/><rect x="2" y="9" width="5" height="5" rx="1.5"/><rect x="9" y="9" width="5" height="5" rx="1.5"/>') },
      { label: '博客文章',   href: '/admin/articles.html',
        icon: ico('<path d="M9 1.5H3.5A1 1 0 0 0 2.5 2.5v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V6Z"/><polyline points="9,1.5 9,6 13.5,6"/><line x1="5" y1="9" x2="11" y2="9"/><line x1="5" y1="11.5" x2="9" y2="11.5"/>') },
      { label: 'AI 文章生成', href: '/admin/ai-generate.html',
        icon: ico('<path d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5Z"/>') },
      { label: '作者档案',   href: '/admin/authors.html',
        icon: ico('<circle cx="8" cy="5.5" r="3"/><path d="M1.5 14a6.5 6.5 0 0 1 13 0"/>') },
      { label: '媒体库',     href: '/admin/media.html',
        icon: ico('<rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><circle cx="5.5" cy="6.5" r="1.5"/><polyline points="1.5,10 5,7.5 8,10 11,8 14.5,11.5"/>') },
      { label: '图片替换',   href: '/admin/media-overrides.html',
        icon: ico('<polyline points="2,5 5.5,2 5.5,4 14,4"/><polyline points="14,11 10.5,14 10.5,12 2,12"/>') },
    ]},
    { group: '合规', items: [
      { label: 'GDPR 请求', href: '/admin/gdpr.html',
        icon: ico('<path d="M8 1.5L2 4.5V9c0 3.3 2.5 5.8 6 6.5 3.5-.7 6-3.2 6-6.5V4.5Z"/><polyline points="5.5,8 7.5,10 11,6"/>') },
      { label: '审计日志',  href: '/admin/audit.html',
        icon: ico('<line x1="6" y1="4" x2="13" y2="4"/><line x1="6" y1="8" x2="13" y2="8"/><line x1="6" y1="12" x2="13" y2="12"/><polyline points="3,3.5 3.75,4.5 5,2.5"/><polyline points="3,7.5 3.75,8.5 5,6.5"/><polyline points="3,11.5 3.75,12.5 5,10.5"/>') },
    ]},
    { group: '设置', items: [
      { label: '域名 & SSL',   href: '/admin/domain.html',
        icon: ico('<circle cx="8" cy="8" r="6.5"/><ellipse cx="8" cy="8" rx="3" ry="6.5"/><line x1="1.5" y1="8" x2="14.5" y2="8"/>') },
      { label: '站点设置',     href: '/admin/settings.html',
        icon: ico('<circle cx="8" cy="8" r="2.5"/><path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06"/>') },
      { label: 'SMTP / 邮件', href: '/admin/smtp.html',
        icon: ico('<rect x="1.5" y="4" width="13" height="8.5" rx="1.5"/><polyline points="1.5,6.5 8,10 14.5,6.5"/>') },
      { label: '即时通知推送', href: '/admin/notifications.html',
        icon: ico('<path d="M8 2a5 5 0 0 1 5 5v2.5l1.5 2h-13L3 9.5V7a5 5 0 0 1 5-5z"/><line x1="6.5" y1="13.5" x2="9.5" y2="13.5"/>') },
      { label: '用户',         href: '/admin/users.html',
        icon: ico('<circle cx="6" cy="5" r="2.5"/><path d="M1 14.5a5 5 0 0 1 10 0"/><circle cx="12.5" cy="5" r="2"/><path d="M12.5 10a4 4 0 0 1 2.5 3.5"/>') },
    ]},
  ];

  // Shared SVGs used in topbar controls
  const ICO_BELL     = ico('<path d="M8 2a5 5 0 0 1 5 5v2.5l1.5 2h-13L3 9.5V7a5 5 0 0 1 5-5z"/><line x1="6.5" y1="13.5" x2="9.5" y2="13.5"/>');
  const ICO_LOGOUT   = ico('<path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/><polyline points="10,5 14,8 10,11"/><line x1="14" y1="8" x2="5" y2="8"/>');
  const ICO_EXTERNAL = ico('<path d="M7 3H3.5A1.5 1.5 0 0 0 2 4.5v7A1.5 1.5 0 0 0 3.5 13h7A1.5 1.5 0 0 0 12 11.5V8"/><polyline points="9,2 14,2 14,7"/><line x1="14" y1="2" x2="7" y2="9"/>');
  const ICO_CHEV     = ico('<polyline points="4,6 8,10 12,6"/>');
  const ICO_SEARCH   = ico('<circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/>');

  // ── API helper ──────────────────────────────────────────
  async function api(path, opts) {
    const res = await fetch(path, Object.assign({
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }, opts || {}));
    let json = null;
    try { json = await res.json(); } catch (_) {}
    if (!res.ok) {
      if (res.status === 401 && !location.pathname.endsWith('/login.html')) {
        location.href = '/admin/login.html?next=' + encodeURIComponent(location.pathname);
        return new Promise(() => {});
      }
      const err = new Error((json && json.error) || ('HTTP ' + res.status));
      err.status = res.status;
      throw err;
    }
    return json;
  }

  // ── DOM helper ──────────────────────────────────────────
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
        else if (k === 'data') Object.assign(e.dataset, attrs[k]);
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (children != null) {
      for (const c of [].concat(children)) {
        if (c == null || c === false) continue;
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

  function formatDate(d) {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date)) return '';
    return date.toLocaleString('en-GB', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function formatRelative(d) {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return '刚刚';
    if (m < 60) return m + ' 分钟前';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' 小时前';
    const day = Math.floor(h / 24);
    if (day < 30) return day + ' 天前';
    return formatDate(d);
  }

  // ── Toast ────────────────────────────────────────────────
  function toast(message, type) {
    let tray = document.querySelector('.toast-tray');
    if (!tray) { tray = document.createElement('div'); tray.className = 'toast-tray'; document.body.appendChild(tray); }
    const t = el('div', { class: 'toast' + (type ? ' is-' + type : '') }, message);
    tray.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 220);
    }, 3200);
  }

  // ── Dropdown manager ─────────────────────────────────────
  // Only one dropdown open at a time; clicking outside closes all.
  const _dropdowns = new Set();
  function closeAllDropdowns(except) {
    _dropdowns.forEach((close) => { if (close !== except) close(); });
  }
  document.addEventListener('click', () => closeAllDropdowns(null), true);

  function makeDropdown(triggerEl, buildPanel) {
    let panel = null;
    function close() {
      if (panel) { panel.remove(); panel = null; }
      triggerEl.classList.remove('is-active');
    }
    function open() {
      closeAllDropdowns(close);
      panel = buildPanel(close);
      triggerEl.closest('.topbar__actions').appendChild(panel);
      triggerEl.classList.add('is-active');
    }
    _dropdowns.add(close);
    triggerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      panel ? close() : open();
    });
    return { close };
  }

  // ── Notification bell panel ──────────────────────────────
  function buildNotifPanel(close) {
    const wrap = document.createElement('div');
    wrap.className = 'popmenu popmenu--wide';
    wrap.style.right = '42px'; // align below bell, not user menu
    wrap.innerHTML = `
      <div class="popmenu__head">
        <div class="popmenu__head-row">
          <span class="popmenu__head-title">未读询盘</span>
          <a href="/admin/inquiries.html" style="font-size:12px;font-weight:600;color:var(--brand);" onclick="${''}">全部查看</a>
        </div>
      </div>
      <div class="popmenu__scroll" id="_np_list">
        <div class="popmenu__empty">加载中…</div>
      </div>
      <div class="popmenu__foot"><a href="/admin/inquiries.html">查看所有询盘 →</a></div>`;
    wrap.addEventListener('click', (e) => e.stopPropagation());

    api('/api/inquiries?status=new&limit=7').then((data) => {
      const list = wrap.querySelector('#_np_list');
      const items = (data && data.inquiries) || [];
      if (!items.length) {
        list.innerHTML = '<div class="popmenu__empty">暂无未读询盘 ✓</div>';
        return;
      }
      list.innerHTML = items.map((inq) => `
        <a class="notif-item" href="/admin/inquiries.html#${escapeHtml(String(inq.id))}">
          <div class="notif-item__top">
            <span class="notif-item__name">${escapeHtml(inq.name || '（无名称）')}</span>
            <span class="notif-item__time">${formatRelative(inq.created_at)}</span>
          </div>
          <div class="notif-item__msg">${escapeHtml(inq.message || inq.subject || '（无内容）')}</div>
        </a>`).join('');
    }).catch(() => {
      const list = wrap.querySelector('#_np_list');
      list.innerHTML = '<div class="popmenu__empty">加载失败，请重试</div>';
    });

    return wrap;
  }

  // ── User menu panel ──────────────────────────────────────
  function buildUserPanel(user, close) {
    const wrap = document.createElement('div');
    wrap.className = 'popmenu';
    wrap.innerHTML = `
      <div class="popmenu__head">
        <div class="popmenu__head-title">${escapeHtml(user && user.name || user && user.email || '')}</div>
        <div class="popmenu__head-sub">${escapeHtml(user && user.role || '')} · ${escapeHtml(user && user.email || '')}</div>
      </div>
      <div class="popmenu__list">
        <a class="popmenu__item" href="/" target="_blank">
          <span class="nav-icon">${ICO_EXTERNAL}</span>查看前台
        </a>
        <div class="popmenu__divider"></div>
        <div class="popmenu__item popmenu__item--danger" data-logout>
          <span class="nav-icon">${ICO_LOGOUT}</span>退出登录
        </div>
      </div>`;
    wrap.addEventListener('click', (e) => e.stopPropagation());
    wrap.querySelector('[data-logout]').addEventListener('click', async () => {
      try { await api('/api/auth/logout', { method: 'POST' }); } catch (_) {}
      location.href = '/admin/login.html';
    });
    return wrap;
  }

  // ── Shell renderer ───────────────────────────────────────
  function renderShell(user, opts) {
    opts = opts || {};
    const here = opts.here || location.pathname.split('/').pop() || 'index.html';
    const shell = document.querySelector('[data-admin-shell]');
    if (!shell) return;
    shell.classList.add('admin-shell');

    const userInitial = escapeHtml(
      (user && user.name || user && user.email || '?').charAt(0).toUpperCase()
    );
    const userName = escapeHtml(user && user.name || user && user.email || '');

    shell.innerHTML = `
      <!-- ── Topbar ── -->
      <header class="topbar">
        <div class="topbar__brand">
          <div class="topbar__brand-mark">Z</div>
          <span>Zufek CMS</span>
        </div>

        <div class="topbar__search">
          <span class="topbar__search-icon">${ICO_SEARCH}</span>
          <input type="search" placeholder="搜索询盘、产品、文章…" autocomplete="off" data-global-search/>
          <span class="topbar__search-kbd">⌘K</span>
        </div>

        <div class="topbar__actions">
          <!-- Bell -->
          <button class="topbar__icon-btn" data-bell-btn title="未读询盘">
            ${ICO_BELL}
            <span class="badge-dot" data-notif-dot></span>
          </button>
          <!-- User menu -->
          <div class="topbar__user" data-user-btn>
            <div class="topbar__user-avatar">${userInitial}</div>
            <span class="topbar__user-name">${userName}</span>
            <span class="topbar__user-chev">${ICO_CHEV}</span>
          </div>
        </div>
      </header>

      <!-- ── Sidebar ── -->
      <aside class="sidebar">
        <nav>
          ${NAV.map((g) => `
            <div class="sidebar__group">
              <div class="sidebar__heading">${g.group}</div>
              ${g.items.map((i) => `
                <a class="sidebar__link${('/admin/' + here) === i.href ? ' is-active' : ''}" href="${i.href}">
                  <span class="nav-icon">${i.icon}</span>
                  <span class="nav-label">${i.label}</span>
                  ${i.label === '收件箱' ? '<span class="badge" data-unread-badge style="display:none;"></span>' : ''}
                </a>
              `).join('')}
            </div>
          `).join('')}
        </nav>
        <div class="sidebar__footer">
          <a href="/" target="_blank">
            <span class="nav-icon">${ICO_EXTERNAL}</span>前台
          </a>
          <a href="#" data-logout-link>
            <span class="nav-icon">${ICO_LOGOUT}</span>退出
          </a>
        </div>
      </aside>

      <!-- ── Main ── -->
      <main class="main">
        <div class="page">
          <div class="page-head">
            <div>
              <div class="page-head__crumbs">${escapeHtml(opts.crumbs || '')}</div>
              <h1 class="page-head__title">${escapeHtml(opts.title || '')}</h1>
            </div>
            <div class="page-head__actions" data-topbar-actions></div>
          </div>
          <div data-page-content></div>
        </div>
      </main>`;

    // Logout link in sidebar
    shell.querySelector('[data-logout-link]').addEventListener('click', async (ev) => {
      ev.preventDefault();
      try { await api('/api/auth/logout', { method: 'POST' }); } catch (_) {}
      location.href = '/admin/login.html';
    });

    // Global search: ⌘K focus + Enter to navigate
    const searchInput = shell.querySelector('[data-global-search]');
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput && searchInput.focus();
      }
    });
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = searchInput.value.trim();
          if (q) location.href = '/admin/inquiries.html?q=' + encodeURIComponent(q);
        }
        if (e.key === 'Escape') { searchInput.blur(); searchInput.value = ''; }
      });
    }

    // Notification bell dropdown
    const bellBtn = shell.querySelector('[data-bell-btn]');
    if (bellBtn) {
      makeDropdown(bellBtn, (close) => buildNotifPanel(close));
    }

    // User menu dropdown
    const userBtn = shell.querySelector('[data-user-btn]');
    if (userBtn) {
      makeDropdown(userBtn, (close) => buildUserPanel(user, close));
    }

    return {
      content: shell.querySelector('[data-page-content]'),
      actions: shell.querySelector('[data-topbar-actions]'),
    };
  }

  // ── Unread badge + notification dot ─────────────────────
  async function refreshUnreadBadge() {
    try {
      const data = await api('/api/inquiries?status=new&limit=1');
      const count = (data && data.stats && data.stats.unread) || 0;

      // Sidebar badge
      const badge = document.querySelector('[data-unread-badge]');
      if (badge) {
        if (count > 0) { badge.style.display = ''; badge.textContent = count; }
        else { badge.style.display = 'none'; }
      }

      // Topbar bell dot
      const dot = document.querySelector('[data-notif-dot]');
      if (dot) {
        if (count > 0) {
          dot.style.display = '';
          dot.className = 'badge-dot' + (count > 9 ? ' has-count' : '');
          if (count > 9) dot.textContent = count > 99 ? '99+' : count;
        } else {
          dot.style.display = 'none';
        }
      }
    } catch (_) {}
  }

  // ── Boot ─────────────────────────────────────────────────
  async function bootShell(opts) {
    let user;
    try {
      const me = await api('/api/auth/me');
      user = me.user;
    } catch (_) { return null; }
    const shell = renderShell(user, opts);
    refreshUnreadBadge();
    return Object.assign(shell || {}, { user });
  }

  window.AdminAPI = { api, el, escapeHtml, formatDate, toast, bootShell };
})();
