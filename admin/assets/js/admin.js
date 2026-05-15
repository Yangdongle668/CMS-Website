/* ===========================================================
   Admin shell - shared utilities
   =========================================================== */
(function () {
  'use strict';

  const NAV = [
    { group: '询盘', items: [
      { label: '收件箱', href: '/admin/inquiries.html', icon: '✉' },
      { label: '仪表盘', href: '/admin/index.html', icon: '⌂' },
      { label: '访问统计', href: '/admin/analytics.html', icon: '◔' },
    ]},
    { group: '内容', items: [
      { label: '页面', href: '/admin/pages.html', icon: '☰' },
      { label: '支柱页', href: '/admin/pillars.html', icon: '◇' },
      { label: '产品', href: '/admin/products.html', icon: '▣' },
      { label: '应用行业', href: '/admin/applications.html', icon: '◷' },
      { label: '博客文章', href: '/admin/articles.html', icon: '✎' },
      { label: 'AI 文章生成', href: '/admin/ai-generate.html', icon: '✦' },
      { label: '作者档案', href: '/admin/authors.html', icon: '☺' },
      { label: '媒体库', href: '/admin/media.html', icon: '◫' },
      { label: '图片替换', href: '/admin/media-overrides.html', icon: '⇄' },
    ]},
    { group: '合规', items: [
      { label: 'GDPR 请求', href: '/admin/gdpr.html', icon: '⚖' },
      { label: '审计日志', href: '/admin/audit.html', icon: '⊟' },
    ]},
    { group: '设置', items: [
      { label: '站点设置', href: '/admin/settings.html', icon: '⚙' },
      { label: '用户', href: '/admin/users.html', icon: '◉' },
    ]},
  ];

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
      err.detail = json || null;        // expose full body so callers can show "locked for N min" etc.
      throw err;
    }
    return json;
  }

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

  function toast(message, type) {
    let tray = document.querySelector('.toast-tray');
    if (!tray) { tray = document.createElement('div'); tray.className = 'toast-tray'; document.body.appendChild(tray); }
    const t = el('div', { class: 'toast' + (type ? ' is-' + type : '') }, message);
    tray.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 200); }, 3000);
  }

  function renderShell(user, opts) {
    opts = opts || {};
    const here = opts.here || location.pathname.split('/').pop() || 'index.html';
    const shell = document.querySelector('[data-admin-shell]');
    if (!shell) return;
    shell.classList.add('admin-shell');
    shell.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar__brand">
          <div class="sidebar__brand-mark">Z</div>
          <div>Zufek CMS</div>
        </div>
        <nav class="sidebar__nav">
          ${NAV.map((g) => `
            <div class="sidebar__group">
              <div class="sidebar__heading">${g.group}</div>
              ${g.items.map((i) => `
                <a class="sidebar__link${('/admin/' + here) === i.href ? ' is-active' : ''}" href="${i.href}">
                  <span style="opacity:.6;">${i.icon}</span>
                  <span>${i.label}</span>
                  ${i.label === 'Inbox' ? '<span class="badge" data-unread-badge style="display:none;">0</span>' : ''}
                </a>
              `).join('')}
            </div>
          `).join('')}
        </nav>
        <div class="sidebar__footer">
          <div class="sidebar__user">
            <div class="sidebar__user-avatar">${escapeHtml((user && user.name || user && user.email || '?').charAt(0).toUpperCase())}</div>
            <div style="flex:1;">
              <div style="font-weight:600;">${escapeHtml(user && user.name || user && user.email || '')}</div>
              <div style="font-size:11.5px; color:var(--a-mute2);">${escapeHtml(user && user.role || '')}</div>
            </div>
          </div>
          <a href="#" data-logout style="font-size:12px; color:var(--a-muted); display:block; padding:6px 8px;">退出登录 →</a>
          <a href="/" target="_blank" style="font-size:12px; color:var(--a-muted); display:block; padding:6px 8px;">查看前台 ↗</a>
        </div>
      </aside>
      <main class="main">
        <div class="topbar">
          <div>
            <div class="topbar__crumbs">${escapeHtml(opts.crumbs || '')}</div>
            <h1>${escapeHtml(opts.title || '')}</h1>
          </div>
          <div data-topbar-actions></div>
        </div>
        <div class="page" data-page-content></div>
      </main>`;
    shell.querySelector('[data-logout]').addEventListener('click', async (ev) => {
      ev.preventDefault();
      try { await api('/api/auth/logout', { method: 'POST' }); } catch (_) {}
      location.href = '/admin/login.html';
    });
    return {
      content: shell.querySelector('[data-page-content]'),
      actions: shell.querySelector('[data-topbar-actions]'),
    };
  }

  async function refreshUnreadBadge() {
    const badge = document.querySelector('[data-unread-badge]');
    if (!badge) return;
    try {
      const { stats } = await api('/api/inquiries?limit=1');
      if (stats && stats.unread > 0) {
        badge.style.display = '';
        badge.textContent = stats.unread;
      }
    } catch (_) {}
  }

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
