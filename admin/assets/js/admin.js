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
    setTimeout(() => {
      t.style.transition = 'opacity 0.18s ease';
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 200);
    }, 3000);
  }

  const ICON_LOGOUT = ico('<path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/><polyline points="10,5 14,8 10,11"/><line x1="14" y1="8" x2="5" y2="8"/>');
  const ICON_EXTERNAL = ico('<path d="M7 3H3.5A1.5 1.5 0 0 0 2 4.5v7A1.5 1.5 0 0 0 3.5 13h7A1.5 1.5 0 0 0 12 11.5V8"/><polyline points="9,2 14,2 14,7"/><line x1="14" y1="2" x2="7" y2="9"/>');

  function renderShell(user, opts) {
    opts = opts || {};
    const here = opts.here || location.pathname.split('/').pop() || 'index.html';
    const shell = document.querySelector('[data-admin-shell]');
    if (!shell) return;
    shell.classList.add('admin-shell');
    const userName = escapeHtml(user && user.name || user && user.email || '');
    const userRole = escapeHtml(user && user.role || '');
    const userInitial = escapeHtml((user && user.name || user && user.email || '?').charAt(0).toUpperCase());
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
                  <span class="nav-icon">${i.icon}</span>
                  <span class="nav-label">${i.label}</span>
                  ${i.label === '收件箱' ? '<span class="badge" data-unread-badge style="display:none;">0</span>' : ''}
                </a>
              `).join('')}
            </div>
          `).join('')}
        </nav>
        <div class="sidebar__footer">
          <div class="sidebar__user">
            <div class="sidebar__user-avatar">${userInitial}</div>
            <div>
              <div class="sidebar__user-name">${userName}</div>
              <div class="sidebar__user-role">${userRole}</div>
            </div>
          </div>
          <div class="sidebar__footer-links">
            <a href="#" data-logout>${ICON_LOGOUT} 退出</a>
            <a href="/" target="_blank">${ICON_EXTERNAL} 前台</a>
          </div>
        </div>
      </aside>
      <main class="main">
        <div class="topbar">
          <div class="topbar__left">
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
