/* ===========================================================================
   Visual page builder.

   State model:
     state.page = {
       id, slug, title, nav, status,
       meta_title, meta_description,
       hero_image, hero_title, hero_subtitle, hero_eyebrow, hero_breadcrumbs,
       blocks: [ { id, type, data } ]
     }
     state.dirty   = boolean — true after any edit, cleared on successful save
     state.editing = blockId | null — which block's edit drawer is open

   Anything that mutates state.page should call:
     - markDirty()  — sets dirty flag, updates topbar
     - renderBlockList() if block list shape changed
     - schedulePreview()  — debounces postMessage to the iframe
   =========================================================================== */
(async function () {
  'use strict';
  const { api, escapeHtml, formatDate, toast, bootShell } = window.AdminAPI;
  const shell = await bootShell({ title: '页面构建器', crumbs: '内容 / 页面' });
  if (!shell) return;

  /* ---------- Block type catalogue ----------------------------------------
     Every entry describes how to display this block in lists, in the picker,
     and inside the edit drawer. Forms are pure data → DOM. ENABLED=true
     ones are the ones whose renderer is implemented; the rest are still
     placeholders.
  -------------------------------------------------------------------------- */
  const BLOCK_TYPES = {
    'hero':         { name: 'Hero 大图标题',   icon: '🖼',  desc: '满屏背景图 + 主标题 + 副标题 + 两个按钮', enabled: true },
    'pillar-grid':  { name: '三大产品线卡片',   icon: '◉◉◉', desc: '3 张产品线卡片，带图、标签、规格', enabled: true },
    'cta-band':     { name: '行动召唤条',       icon: '➤',  desc: '深色或浅色背景的转化条，带一个按钮', enabled: true },

    'trust-strip':  { name: '信任徽章带',       icon: '✓',  desc: '一排认证 / 客户标识', enabled: false },
    'tesla-slider': { name: '横向应用滑动卡',   icon: '⇄',  desc: 'Tesla 风格横向滑动应用展示', enabled: false },
    'content-split':{ name: '图文左右分栏',     icon: '◐',  desc: '左侧文字 + 右侧图，或反转', enabled: false },
    'feat-grid':    { name: '图标/数字网格',    icon: '◰',  desc: '2/3/4 列特性卡片', enabled: false },
    'steps-grid':   { name: '步骤卡',           icon: '①',  desc: '编号步骤，每步带要点列表', enabled: false },
    'stat-strip':   { name: '统计数字带',       icon: '#',  desc: '4 个大数字 + 标签', enabled: false },
    'spec-table':   { name: '规格表',           icon: '▦',  desc: '可配置的参数对比表', enabled: false },
    'cert-wall':    { name: '认证标签墙',       icon: '◇',  desc: '一排认证胶囊', enabled: false },
    'faq':          { name: 'FAQ 折叠',         icon: '?',  desc: '问答对列表', enabled: false },
    'blog-grid':    { name: '博客文章卡',       icon: '✎',  desc: '自动拉取最新文章', enabled: false },
    'quote-form':   { name: '询盘表单',         icon: '✉',  desc: '内嵌迷你 RFQ 表单', enabled: false },
    'rich-text':    { name: '富文本段落',       icon: 'T',  desc: '长篇文字 + 标题 + 列表', enabled: false },
  };

  /* ---------- Default data for new blocks --------------------------------- */
  const DEFAULTS = {
    'hero': () => ({
      image: 'https://images.unsplash.com/photo-1593642634443-44adaa06623a?w=1920&q=80',
      eyebrow: '',
      title: '在这里写主标题',
      subtitle: '副标题：用一句话告诉访客你能解决什么问题。',
      primary: { label: 'Request a Quote', url: '/contact.html' },
      secondary: { label: '了解更多', url: '#' },
    }),
    'pillar-grid': () => ({
      eyebrow: 'Product Lines',
      title: '产品线总览',
      lead: '介绍这三个产品线分别面向什么场景。',
      cards: [
        { image: 'https://images.unsplash.com/photo-1620455243023-2c80b3a02ee3?w=1200&q=80',
          pill: '产品线 1', title: '产品线 1 标题', desc: '一句话描述。',
          specs: [{ value: '示例', unit: '' }], link: '#', linkText: '了解更多 →' },
      ],
    }),
    'cta-band': () => ({
      background: 'dark',
      title: '准备好开始你的项目了吗？',
      subtitle: '把规格丢过来，48 小时内我们给出可行性分析。',
      button: { label: 'Request a Quote', url: '/contact.html' },
    }),
  };

  /* ---------- State -------------------------------------------------------- */
  const state = {
    page: null,
    dirty: false,
    editing: null,
    previewReady: false,
    previewQueued: null,
  };

  const params = new URLSearchParams(location.search);
  const wantId = params.get('id');

  /* ---------- Top-level: list view OR editor view ------------------------- */
  if (!wantId) return renderListView();
  return renderEditorView(parseInt(wantId, 10));

  /* ====================================================================== */
  /*                              LIST VIEW                                 */
  /* ====================================================================== */
  async function renderListView() {
    shell.actions.innerHTML = `<button class="btn btn--sm" id="new-page">+ 新建页面</button>`;
    shell.content.innerHTML = '';
    shell.content.style.padding = '20px';
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.style.margin = '0';
    shell.content.appendChild(panel);

    const { items } = await api('/api/pages/admin');
    panel.innerHTML = `
      <p style="margin:0 0 16px; color:var(--a-mute2); font-size:13px;">
        点页面进入构建器。新页面也支持从模板起手，或者直接搭空白。
      </p>
      <table class="table">
        <thead><tr><th>Slug</th><th>标题</th><th>积木块</th><th>状态</th><th>更新于</th><th></th></tr></thead>
        <tbody>
          ${items.length ? items.map((p) => `
            <tr>
              <td><span class="mono" style="font-weight:600;">${escapeHtml(p.slug)}</span></td>
              <td>${escapeHtml(p.title || p.hero_title || '')}</td>
              <td>${Array.isArray(p.blocks) ? p.blocks.length : 0} 块</td>
              <td><span class="status-pill ${escapeHtml(p.status)}">${p.status === 'published' ? '已发布' : '草稿'}</span></td>
              <td>${formatDate(p.updated_at)}</td>
              <td>
                <a class="btn btn--ghost btn--sm" href="?id=${p.id}">编辑</a>
                <a class="btn btn--ghost btn--sm" target="_blank" href="${slugToUrl(p.slug)}">前台 ↗</a>
              </td>
            </tr>
          `).join('') : '<tr><td colspan="6"><div class="empty">还没有页面。新建一个开始搭吧。</div></td></tr>'}
        </tbody>
      </table>`;
    document.getElementById('new-page').addEventListener('click', openNewPageDialog);
  }

  async function openNewPageDialog() {
    const slug = prompt('新页面的 URL slug（例如 about/profile 或 solutions/storage）：');
    if (!slug) return;
    try {
      const r = await api('/api/pages', {
        method: 'POST',
        body: JSON.stringify({
          slug: slug.trim().toLowerCase(),
          title: '',
          status: 'draft',
          blocks: [{ id: blockId(), type: 'hero', data: DEFAULTS.hero() }],
        }),
      });
      location.href = '?id=' + r.id;
    } catch (err) { toast('创建失败：' + err.message, 'error'); }
  }

  function slugToUrl(slug) {
    if (slug === 'home') return '/';
    if (['faq', 'contact', 'privacy', 'terms', 'legal', 'gdpr'].includes(slug)) return '/' + slug + '.html';
    return '/' + slug + '.html';
  }

  /* ====================================================================== */
  /*                            EDITOR VIEW                                 */
  /* ====================================================================== */
  async function renderEditorView(id) {
    // Topbar action: discard, save buttons
    shell.actions.innerHTML = `
      <button class="btn btn--ghost btn--sm" id="back-to-list">← 返回列表</button>
      <button class="btn btn--ghost btn--sm" id="open-preview">前台预览 ↗</button>
      <button class="btn btn--sm" id="save-btn">保存</button>
    `;
    document.getElementById('back-to-list').addEventListener('click', () => { location.href = '/admin/pages.html'; });

    // Load page
    const { page } = await api('/api/pages/admin/' + id);
    state.page = normalisePage(page);

    // Build the two-pane shell
    shell.content.innerHTML = `
      <div class="builder">
        <div class="builder__left" id="left-pane">
          <div class="builder__bar">
            <div>
              <h2 id="page-title-label">${escapeHtml(state.page.title || state.page.slug)}</h2>
              <div class="url">${escapeHtml(slugToUrl(state.page.slug))}</div>
            </div>
            <span class="status-pill ${state.page.status}">${state.page.status === 'published' ? '已发布' : '草稿'}</span>
          </div>
          <div class="builder__scroll" id="left-scroll">
            <div class="builder__sect-title"><span>页面设置</span></div>
            <div id="page-meta-card"></div>

            <div class="builder__sect-title">
              <span>积木块（<span id="block-count">0</span>）</span>
              <span style="font-size:11px; color:var(--a-mute2); text-transform:none; letter-spacing:0;">拖动 ⠿ 重排</span>
            </div>
            <div class="block-list" id="block-list"></div>
            <button class="add-block-btn" id="add-block">＋ 加一块</button>
          </div>
          <!-- Edit drawer slides over the block list -->
          <div class="drawer-mask" id="drawer-mask"></div>
          <div class="drawer" id="drawer"></div>
        </div>
        <div class="builder__right">
          <div class="viewport-toggle">
            <button id="vp-desktop" class="is-active">桌面</button>
            <button id="vp-mobile">手机</button>
          </div>
          <div class="iframe-wrap" id="iframe-wrap">
            <iframe id="preview-frame" src="/admin/preview-shell.html"></iframe>
          </div>
        </div>
      </div>
    `;

    // Wire everything
    renderMetaCard();
    renderBlockList();
    document.getElementById('add-block').addEventListener('click', openPicker);
    document.getElementById('drawer-mask').addEventListener('click', closeDrawer);
    document.getElementById('save-btn').addEventListener('click', save);
    document.getElementById('open-preview').addEventListener('click', () => {
      window.open(slugToUrl(state.page.slug), '_blank');
    });

    // Viewport toggle
    const vpD = document.getElementById('vp-desktop');
    const vpM = document.getElementById('vp-mobile');
    const wrap = document.getElementById('iframe-wrap');
    vpD.addEventListener('click', () => { wrap.classList.remove('mobile'); vpD.classList.add('is-active'); vpM.classList.remove('is-active'); });
    vpM.addEventListener('click', () => { wrap.classList.add('mobile'); vpM.classList.add('is-active'); vpD.classList.remove('is-active'); });

    // Iframe handshake — wait for ready signal before first render
    window.addEventListener('message', (ev) => {
      if (ev.data && ev.data.type === 'preview-ready') {
        state.previewReady = true;
        pushPreview();
      }
    });

    // Block picker
    buildPicker();

    // Ctrl+S to save
    window.addEventListener('keydown', (ev) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key === 's') { ev.preventDefault(); save(); }
    });

    // Beforeunload guard
    window.addEventListener('beforeunload', (ev) => {
      if (state.dirty) { ev.preventDefault(); ev.returnValue = ''; }
    });
  }

  function normalisePage(p) {
    return {
      id: p.id,
      slug: p.slug || '',
      title: p.title || '',
      nav: p.nav || '',
      status: p.status === 'draft' ? 'draft' : 'published',
      meta_title: p.meta_title || '',
      meta_description: p.meta_description || '',
      hero_eyebrow: p.hero_eyebrow || '',
      hero_title: p.hero_title || '',
      hero_subtitle: p.hero_subtitle || '',
      hero_image: p.hero_image || '',
      hero_breadcrumbs: Array.isArray(p.hero_breadcrumbs) ? p.hero_breadcrumbs : [],
      body_html: p.body_html || '',
      sections: p.sections || {},
      blocks: Array.isArray(p.blocks) ? p.blocks : [],
    };
  }

  /* ---------- Page meta card ---------------------------------------------- */
  function renderMetaCard() {
    const card = document.getElementById('page-meta-card');
    card.innerHTML = `
      <div class="field-card">
        <div class="field">
          <label>页面标题（浏览器标签 + Google 标题）</label>
          <input id="meta-title" value="${escapeHtml(state.page.meta_title || state.page.title)}"/>
        </div>
        <div class="field">
          <label>Meta 描述（Google 摘要 + 分享卡）</label>
          <textarea id="meta-description" rows="2">${escapeHtml(state.page.meta_description)}</textarea>
        </div>
        <div class="field">
          <label>状态</label>
          <select id="page-status" style="width:100%; padding:7px 10px; border:1px solid var(--a-line); border-radius:6px; font-size:13px;">
            <option value="published" ${state.page.status === 'published' ? 'selected' : ''}>已发布（线上可见）</option>
            <option value="draft" ${state.page.status === 'draft' ? 'selected' : ''}>草稿（不发布）</option>
          </select>
        </div>
      </div>
    `;
    bindInput('#meta-title',       'meta_title');
    bindInput('#meta-description', 'meta_description');
    document.getElementById('page-status').addEventListener('change', (ev) => {
      state.page.status = ev.target.value;
      markDirty();
      updateStatusPill();
    });
  }

  function bindInput(sel, key) {
    const el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener('input', () => {
      state.page[key] = el.value;
      markDirty();
    });
  }

  function updateStatusPill() {
    const pill = document.querySelector('.builder__bar .status-pill');
    if (!pill) return;
    pill.className = 'status-pill ' + state.page.status;
    pill.textContent = state.page.status === 'published' ? '已发布' : '草稿';
  }

  /* ---------- Block list -------------------------------------------------- */
  function renderBlockList() {
    const list = document.getElementById('block-list');
    document.getElementById('block-count').textContent = state.page.blocks.length;
    if (!state.page.blocks.length) {
      list.innerHTML = `<div class="empty" style="background:#fff; border:1px dashed var(--a-line); border-radius:10px; padding:24px 12px; text-align:center; color:var(--a-mute2); font-size:13px;">还没有积木。<br>点下面的 <strong>+ 加一块</strong> 开始。</div>`;
      schedulePreview();
      return;
    }
    list.innerHTML = state.page.blocks.map((b) => {
      const cfg = BLOCK_TYPES[b.type] || { name: b.type, icon: '◻' };
      const summary = blockSummary(b);
      return `
        <div class="block-row" draggable="true" data-id="${b.id}">
          <span class="block-row__handle" title="拖动重排">⠿</span>
          <span class="block-row__icon">${cfg.icon}</span>
          <div class="block-row__body">
            <div class="ttl">${escapeHtml(cfg.name)}</div>
            <div class="sub">${escapeHtml(summary)}</div>
          </div>
          <div class="block-row__actions">
            <button class="block-row__btn" data-edit="${b.id}" title="编辑">✎</button>
            <button class="block-row__btn danger" data-del="${b.id}" title="删除">✕</button>
          </div>
        </div>`;
    }).join('');

    // Click row → edit; click drag handle → drag; click trash → delete
    list.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      openDrawer(b.dataset.edit);
    }));
    list.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      deleteBlock(b.dataset.del);
    }));
    list.querySelectorAll('.block-row').forEach((row) => {
      row.addEventListener('click', () => openDrawer(row.dataset.id));
    });

    bindDragReorder(list);
    schedulePreview();
  }

  function blockSummary(b) {
    const d = b.data || {};
    if (b.type === 'hero')         return d.title || d.subtitle || '(空)';
    if (b.type === 'pillar-grid')  return `${(d.cards || []).length} 张卡片 · ${d.title || ''}`;
    if (b.type === 'cta-band')     return d.title || '(空)';
    return '';
  }

  function deleteBlock(id) {
    if (!confirm('确认删除这一块？')) return;
    state.page.blocks = state.page.blocks.filter((b) => b.id !== id);
    markDirty();
    renderBlockList();
  }

  function bindDragReorder(list) {
    let dragId = null;
    list.querySelectorAll('.block-row').forEach((row) => {
      row.addEventListener('dragstart', (ev) => {
        dragId = row.dataset.id;
        row.classList.add('is-dragging');
        ev.dataTransfer.effectAllowed = 'move';
        // Required for Firefox
        ev.dataTransfer.setData('text/plain', dragId);
      });
      row.addEventListener('dragend', () => {
        row.classList.remove('is-dragging');
        list.querySelectorAll('.block-row').forEach((r) => r.classList.remove('is-drop-target'));
      });
      row.addEventListener('dragover', (ev) => {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
        list.querySelectorAll('.block-row').forEach((r) => r.classList.remove('is-drop-target'));
        if (row.dataset.id !== dragId) row.classList.add('is-drop-target');
      });
      row.addEventListener('drop', (ev) => {
        ev.preventDefault();
        if (!dragId || row.dataset.id === dragId) return;
        const arr = state.page.blocks;
        const fromIdx = arr.findIndex((b) => b.id === dragId);
        const toIdx   = arr.findIndex((b) => b.id === row.dataset.id);
        if (fromIdx < 0 || toIdx < 0) return;
        const [moved] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, moved);
        markDirty();
        renderBlockList();
      });
    });
  }

  /* ---------- Block picker ------------------------------------------------ */
  function buildPicker() {
    const mask = document.createElement('div');
    mask.className = 'picker-mask';
    mask.id = 'picker-mask';
    mask.innerHTML = `
      <div class="picker" onclick="event.stopPropagation()">
        <h3>选择要加什么积木</h3>
        <p>点一下加到页面底部，然后拖动 ⠿ 把它移到你想要的位置。</p>
        <div class="picker__grid" id="picker-grid"></div>
      </div>`;
    document.body.appendChild(mask);
    mask.addEventListener('click', closePicker);
    const grid = mask.querySelector('#picker-grid');
    grid.innerHTML = Object.keys(BLOCK_TYPES).map((type) => {
      const cfg = BLOCK_TYPES[type];
      return `
        <div class="picker__item ${cfg.enabled ? '' : 'is-soon'}" data-type="${type}">
          <div class="ico">${cfg.icon}</div>
          <div class="ttl">${escapeHtml(cfg.name)}${cfg.enabled ? '' : ' · 即将上线'}</div>
          <div class="sub">${escapeHtml(cfg.desc)}</div>
        </div>`;
    }).join('');
    grid.querySelectorAll('.picker__item').forEach((it) => {
      it.addEventListener('click', () => {
        const type = it.dataset.type;
        if (!BLOCK_TYPES[type].enabled) return;
        addBlock(type);
        closePicker();
      });
    });
  }
  function openPicker()  { document.getElementById('picker-mask').classList.add('is-open'); }
  function closePicker() { document.getElementById('picker-mask').classList.remove('is-open'); }

  function addBlock(type) {
    const data = (DEFAULTS[type] || (() => ({})))();
    const block = { id: blockId(), type, data };
    state.page.blocks.push(block);
    markDirty();
    renderBlockList();
    // Open edit drawer immediately so the user can customise it
    setTimeout(() => openDrawer(block.id), 50);
    // Scroll left panel to bottom so new block is visible
    const scroll = document.getElementById('left-scroll');
    setTimeout(() => { scroll.scrollTop = scroll.scrollHeight; }, 60);
  }

  function blockId() {
    return 'blk_' + Math.random().toString(36).slice(2, 10);
  }

  /* ---------- Edit drawer ------------------------------------------------- */
  function openDrawer(id) {
    const block = state.page.blocks.find((b) => b.id === id);
    if (!block) return;
    state.editing = id;
    const cfg = BLOCK_TYPES[block.type];
    const drawer = document.getElementById('drawer');
    drawer.innerHTML = `
      <div class="drawer__bar">
        <h3>${escapeHtml(cfg.name)}</h3>
        <button class="btn btn--ghost btn--sm" id="drawer-close">完成 ✓</button>
      </div>
      <div class="drawer__body" id="drawer-body"></div>
    `;
    drawer.classList.add('is-open');
    document.getElementById('drawer-mask').classList.add('is-open');
    document.getElementById('drawer-close').addEventListener('click', closeDrawer);
    renderBlockForm(block);

    // Ask iframe to scroll the corresponding block into view
    const frame = document.getElementById('preview-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'scrollTo', blockId: id }, '*');
    }
  }
  function closeDrawer() {
    state.editing = null;
    document.getElementById('drawer').classList.remove('is-open');
    document.getElementById('drawer-mask').classList.remove('is-open');
  }

  /* ---------- Per-block forms -------------------------------------------- */
  function renderBlockForm(block) {
    const body = document.getElementById('drawer-body');
    const fn = FORMS[block.type];
    if (!fn) { body.innerHTML = '<p>这种积木的编辑界面还没做。</p>'; return; }
    body.innerHTML = '';
    fn(body, block);
  }

  // Helpers for building form rows that auto-bind to block.data
  function fieldText(container, label, getValue, setValue, opts) {
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'field-card';
    const id = 'fld_' + Math.random().toString(36).slice(2, 8);
    wrap.innerHTML = `
      <div class="field">
        <label for="${id}">${escapeHtml(label)}</label>
        ${opts.textarea
          ? `<textarea id="${id}" rows="${opts.rows || 3}"></textarea>`
          : `<input id="${id}" type="${opts.type || 'text'}"/>`}
        ${opts.hint ? `<div style="font-size:11px; color:var(--a-mute2); margin-top:4px;">${escapeHtml(opts.hint)}</div>` : ''}
      </div>`;
    container.appendChild(wrap);
    const el = wrap.querySelector('#' + id);
    el.value = getValue() ?? '';
    el.addEventListener('input', () => { setValue(el.value); markDirty(); schedulePreview(); refreshBlockRowSummary(); });
    return el;
  }

  function fieldSelect(container, label, options, getValue, setValue) {
    const wrap = document.createElement('div');
    wrap.className = 'field-card';
    const id = 'fld_' + Math.random().toString(36).slice(2, 8);
    wrap.innerHTML = `
      <div class="field">
        <label for="${id}">${escapeHtml(label)}</label>
        <select id="${id}" style="width:100%; padding:7px 10px; border:1px solid var(--a-line); border-radius:6px; font-size:13px;">
          ${options.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}
        </select>
      </div>`;
    container.appendChild(wrap);
    const el = wrap.querySelector('#' + id);
    el.value = getValue() ?? options[0].value;
    el.addEventListener('change', () => { setValue(el.value); markDirty(); schedulePreview(); refreshBlockRowSummary(); });
  }

  function fieldGroup(container, title) {
    const wrap = document.createElement('div');
    wrap.style.marginTop = '14px';
    wrap.style.marginBottom = '6px';
    wrap.style.fontSize = '11px';
    wrap.style.fontWeight = '700';
    wrap.style.letterSpacing = '0.08em';
    wrap.style.textTransform = 'uppercase';
    wrap.style.color = 'var(--a-mute2)';
    wrap.textContent = title;
    container.appendChild(wrap);
  }

  function refreshBlockRowSummary() {
    // Only re-render the list once user closes the drawer — refreshing on
    // every keystroke would steal focus. Just update the visible summary text.
    if (!state.editing) return;
    const row = document.querySelector(`.block-row[data-id="${state.editing}"] .sub`);
    if (!row) return;
    const b = state.page.blocks.find((b) => b.id === state.editing);
    if (b) row.textContent = blockSummary(b);
  }

  /* ---------- Block form implementations --------------------------------- */
  const FORMS = {
    'hero': (body, block) => {
      const d = block.data;
      fieldText(body, '背景图 URL',  () => d.image,    (v) => d.image = v, { hint: '满屏背景，使用 Unsplash 链接或自己上传的图片 URL。' });
      fieldText(body, 'Eyebrow（标题上方小字）', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, 'H1 主标题',   () => d.title,    (v) => d.title = v,    { hint: '支持简单 <br> 换行。' });
      fieldText(body, '副标题',      () => d.subtitle, (v) => d.subtitle = v, { textarea: true });
      fieldGroup(body, '按钮 1（主按钮）');
      fieldText(body, '按钮 1 文字', () => d.primary?.label, (v) => { d.primary = d.primary || {}; d.primary.label = v; });
      fieldText(body, '按钮 1 链接', () => d.primary?.url,   (v) => { d.primary = d.primary || {}; d.primary.url = v; }, { hint: '例如 /contact.html 或完整 URL。' });
      fieldGroup(body, '按钮 2（副按钮，可留空）');
      fieldText(body, '按钮 2 文字', () => d.secondary?.label, (v) => { d.secondary = d.secondary || {}; d.secondary.label = v; });
      fieldText(body, '按钮 2 链接', () => d.secondary?.url,   (v) => { d.secondary = d.secondary || {}; d.secondary.url = v; });
    },

    'cta-band': (body, block) => {
      const d = block.data;
      fieldText(body, '主标题',  () => d.title,    (v) => d.title = v);
      fieldText(body, '副标题',  () => d.subtitle, (v) => d.subtitle = v, { textarea: true });
      fieldText(body, '按钮文字', () => d.button?.label, (v) => { d.button = d.button || {}; d.button.label = v; });
      fieldText(body, '按钮链接', () => d.button?.url,   (v) => { d.button = d.button || {}; d.button.url = v; });
      fieldSelect(body, '背景',
        [{ value: 'dark', label: '深色（默认）' }, { value: 'light', label: '浅色' }, { value: 'grey', label: '灰色' }],
        () => d.background || 'dark',
        (v) => d.background = v,
      );
    },

    'pillar-grid': (body, block) => {
      const d = block.data;
      d.cards = Array.isArray(d.cards) ? d.cards : [];
      fieldText(body, '区块 Eyebrow', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, '区块标题', () => d.title, (v) => d.title = v);
      fieldText(body, '区块引言', () => d.lead, (v) => d.lead = v, { textarea: true });

      fieldGroup(body, `卡片（${d.cards.length}）`);
      const cardsWrap = document.createElement('div');
      cardsWrap.id = 'cards-wrap';
      body.appendChild(cardsWrap);

      function rerenderCards() {
        cardsWrap.innerHTML = '';
        d.cards.forEach((c, i) => {
          const item = document.createElement('div');
          item.className = 'repeater__item';
          item.innerHTML = `
            <div class="repeater__head" data-toggle>
              <span class="repeater__handle">⠿</span>
              <span class="ttl">${escapeHtml(c.title || c.pill || '卡片 ' + (i + 1))}</span>
              <button class="block-row__btn danger" data-del-card="${i}" title="删除卡片">✕</button>
              <span class="caret">▸</span>
            </div>
            <div class="repeater__body"></div>`;
          cardsWrap.appendChild(item);
          const cardBody = item.querySelector('.repeater__body');
          fieldText(cardBody, '图片 URL',  () => c.image,    (v) => c.image = v);
          fieldText(cardBody, '小标签 Pill', () => c.pill,    (v) => c.pill = v);
          fieldText(cardBody, '卡片标题',   () => c.title,    (v) => c.title = v);
          fieldText(cardBody, '描述',       () => c.desc,     (v) => c.desc = v, { textarea: true });
          fieldText(cardBody, '链接 URL',   () => c.link,     (v) => c.link = v);
          fieldText(cardBody, '链接文字',   () => c.linkText, (v) => c.linkText = v);
          // Specs
          fieldGroup(cardBody, '规格（每行一个：数字 / 单位）');
          const specsWrap = document.createElement('div');
          cardBody.appendChild(specsWrap);
          renderSpecs(c, specsWrap);

          item.querySelector('[data-toggle]').addEventListener('click', (ev) => {
            if (ev.target.closest('[data-del-card]')) return;
            item.classList.toggle('is-open');
          });
          item.querySelector('[data-del-card]').addEventListener('click', () => {
            if (!confirm('删除这张卡片？')) return;
            d.cards.splice(i, 1);
            markDirty();
            rerenderCards();
            schedulePreview();
            refreshBlockRowSummary();
          });
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'add-block-btn';
        addBtn.style.marginTop = '6px';
        addBtn.textContent = '＋ 加一张卡片';
        addBtn.addEventListener('click', () => {
          d.cards.push({ image: '', pill: '', title: '新卡片', desc: '', specs: [], link: '#', linkText: '了解更多 →' });
          markDirty();
          rerenderCards();
          schedulePreview();
          refreshBlockRowSummary();
        });
        cardsWrap.appendChild(addBtn);
      }

      function renderSpecs(card, mount) {
        card.specs = Array.isArray(card.specs) ? card.specs : [];
        mount.innerHTML = '';
        card.specs.forEach((sp, idx) => {
          const r = document.createElement('div');
          r.style.display = 'grid';
          r.style.gridTemplateColumns = '1fr 1fr 28px';
          r.style.gap = '6px';
          r.style.marginBottom = '6px';
          r.innerHTML = `
            <input placeholder="数字 (e.g. 30 - 20,000)" value="${escapeHtml(sp.value || '')}" style="padding:6px 8px; border:1px solid var(--a-line); border-radius:6px; font-size:12.5px;"/>
            <input placeholder="单位 (e.g. mAh)" value="${escapeHtml(sp.unit || '')}" style="padding:6px 8px; border:1px solid var(--a-line); border-radius:6px; font-size:12.5px;"/>
            <button class="block-row__btn danger" title="删除">✕</button>`;
          const [valInp, unitInp, delBtn] = r.children;
          valInp.addEventListener('input',  () => { sp.value = valInp.value; markDirty(); schedulePreview(); });
          unitInp.addEventListener('input', () => { sp.unit  = unitInp.value; markDirty(); schedulePreview(); });
          delBtn.addEventListener('click', () => { card.specs.splice(idx, 1); renderSpecs(card, mount); markDirty(); schedulePreview(); });
          mount.appendChild(r);
        });
        const add = document.createElement('button');
        add.className = 'add-block-btn';
        add.style.padding = '6px 10px';
        add.style.fontSize = '12px';
        add.textContent = '+ 加一条规格';
        add.addEventListener('click', () => { card.specs.push({ value: '', unit: '' }); renderSpecs(card, mount); markDirty(); schedulePreview(); });
        mount.appendChild(add);
      }

      rerenderCards();
    },
  };

  /* ---------- Save -------------------------------------------------------- */
  async function save() {
    if (!state.page) return;
    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    const orig = btn.textContent;
    btn.textContent = '保存中…';
    try {
      await api('/api/pages/' + state.page.id, {
        method: 'PUT',
        body: JSON.stringify({
          nav: state.page.nav,
          title: state.page.title || state.page.meta_title,
          meta_title: state.page.meta_title,
          meta_description: state.page.meta_description,
          hero_eyebrow: state.page.hero_eyebrow,
          hero_title: state.page.hero_title,
          hero_subtitle: state.page.hero_subtitle,
          hero_image: state.page.hero_image,
          hero_breadcrumbs: state.page.hero_breadcrumbs,
          body_html: state.page.body_html,
          sections: state.page.sections,
          blocks: state.page.blocks,
          status: state.page.status,
        }),
      });
      state.dirty = false;
      toast('已保存', 'success');
      const dbadge = document.querySelector('.dirty-badge'); if (dbadge) dbadge.remove();
    } catch (err) {
      toast('保存失败：' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  }

  function markDirty() {
    if (state.dirty) return;
    state.dirty = true;
    const bar = document.querySelector('.builder__bar > div');
    if (bar && !bar.querySelector('.dirty-badge')) {
      const b = document.createElement('span');
      b.className = 'dirty-badge';
      b.textContent = '未保存的更改';
      bar.appendChild(b);
    }
  }

  /* ---------- Preview push ----------------------------------------------- */
  let previewTimer = null;
  function schedulePreview() {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(pushPreview, 150);
  }
  function pushPreview() {
    const frame = document.getElementById('preview-frame');
    if (!frame || !frame.contentWindow) return;
    if (!state.previewReady) { state.previewQueued = true; return; }
    frame.contentWindow.postMessage({ type: 'render', blocks: state.page.blocks }, '*');
    state.previewQueued = null;
  }
})();
