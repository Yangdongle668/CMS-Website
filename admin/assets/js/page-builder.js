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
    'hero':         { name: 'Hero 大图标题',   icon: '🖼',  desc: '满屏背景图 + 主标题 + 副标题 + 两个按钮',     enabled: true },
    'trust-strip':  { name: '信任徽章带',       icon: '✓',  desc: '一排认证 / 客户标识',                       enabled: true },
    'pillar-grid':  { name: '三大产品线卡片',   icon: '◉◉◉', desc: '3 张产品线卡片，带图、标签、规格',          enabled: true },
    'tesla-slider': { name: '横向应用滑动卡',   icon: '⇄',  desc: 'Tesla 风格横向滑动应用展示',               enabled: true },
    'content-split':{ name: '图文左右分栏',     icon: '◐',  desc: '左侧文字 + 右侧图，或反转',                 enabled: true },
    'feat-grid':    { name: '图标/数字网格',    icon: '◰',  desc: '2/3/4 列特性卡片',                         enabled: true },
    'steps-grid':   { name: '步骤卡',           icon: '①',  desc: '编号步骤，每步带要点列表',                   enabled: true },
    'stat-strip':   { name: '统计数字带',       icon: '#',  desc: '大数字 + 单位 + 标签的统计带',              enabled: true },
    'spec-table':   { name: '规格表',           icon: '▦',  desc: '可配置的参数对比表（表头 + 多行）',         enabled: true },
    'cert-wall':    { name: '认证标签墙',       icon: '◇',  desc: '一排认证胶囊',                             enabled: true },
    'faq':          { name: 'FAQ 折叠',         icon: '?',  desc: '问答对列表（点击展开）',                    enabled: true },
    'blog-grid':    { name: '博客文章卡',       icon: '✎',  desc: '自动拉取最新文章',                         enabled: true },
    'cta-band':     { name: '行动召唤条',       icon: '➤',  desc: '深色或浅色背景的转化条，带一个按钮',         enabled: true },
    'quote-form':   { name: '询盘表单',         icon: '✉',  desc: '内嵌迷你 RFQ 表单',                        enabled: true },
    'rich-text':    { name: '富文本段落',       icon: 'T',  desc: '长篇文字 + 标题 + 列表（Markdown 风格）',    enabled: true },
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
    'trust-strip': () => ({
      label: 'Compliant with',
      items: ['ISO 9001', 'UN 38.3', 'IEC 62133', 'CE', 'UL 1642', 'RoHS', 'REACH'],
    }),
    'pillar-grid': () => ({
      background: 'light',
      eyebrow: 'Product Lines',
      title: '产品线总览',
      lead: '介绍这三个产品线分别面向什么场景。',
      cards: [
        { image: 'https://images.unsplash.com/photo-1620455243023-2c80b3a02ee3?w=1200&q=80',
          pill: '产品线 1', title: '产品线 1 标题', desc: '一句话描述。',
          specs: [{ value: '示例', unit: '' }], link: '#', linkText: '了解更多 →' },
      ],
    }),
    'tesla-slider': () => ({
      background: 'grey',
      eyebrow: 'Applications',
      title: 'Powering the next generation of devices.',
      lead: '横滑查看我们覆盖的行业。',
      slides: [
        { image: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1600&q=80',
          label: 'Application 01 · AR / VR Glasses', title: 'AR / VR',
          subtitle: 'Ultra-thin cells for slim temples and headsets · 320 mAh @ 0.4 mm',
          primaryCta: 'Explore Application', secondaryCta: 'Request a Quote',
          link: '/applications/ar-vr.html' },
      ],
    }),
    'content-split': () => ({
      background: 'light',
      eyebrow: '',
      title: '左右图文区块',
      subtitle: '左侧标题',
      paragraphs: ['第一段文字。可以加多个段落。', '第二段文字。'],
      image: 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=1000&q=80',
      imageAlt: '',
      imagePosition: 'right',
      link: { label: '了解更多', url: '#' },
    }),
    'feat-grid': () => ({
      background: 'light',
      eyebrow: '',
      title: '我们的特点',
      lead: '用 3 - 6 个要点说明你的优势。',
      columns: 3,
      items: [
        { icon: '①', title: '要点 1', desc: '简短描述。' },
        { icon: '②', title: '要点 2', desc: '简短描述。' },
        { icon: '③', title: '要点 3', desc: '简短描述。' },
      ],
    }),
    'steps-grid': () => ({
      background: 'grey',
      eyebrow: 'Process',
      title: '我们怎么做',
      lead: '4 个清晰的步骤。',
      steps: [
        { num: '01', title: '需求沟通', body: '了解你的具体需求和应用场景。', points: ['尺寸限制', '容量目标', '认证要求'] },
        { num: '02', title: '方案设计', body: '工程师给出可行性分析。', points: ['BOM 评估', '初步报价', '样品计划'] },
      ],
    }),
    'stat-strip': () => ({
      dark: true,
      eyebrow: 'By the numbers',
      title: '一组关键数据。',
      stats: [
        { value: '8',   unit: 'yrs', label: 'since 2018' },
        { value: '100', unit: '+',   label: 'team members' },
        { value: '3',   unit: '',    label: 'tier-1 OEM programs' },
        { value: 'ISO 9001', unit: '', label: 'certified' },
      ],
    }),
    'spec-table': () => ({
      background: 'light',
      eyebrow: 'Specs',
      title: '规格对比',
      lead: '',
      headers: ['参数', '规格', '备注'],
      rows: [
        ['容量', '100 mAh', '可定制'],
        ['电压', '3.7 V', '标称'],
      ],
    }),
    'cert-wall': () => ({
      background: 'light',
      eyebrow: 'Recognition',
      title: '认证与合规。',
      lead: 'Reports available under NDA on request.',
      chips: ['ISO 9001', 'ISO 13485', 'UN 38.3', 'IEC 62133', 'CE', 'UL 1642', 'RoHS', 'REACH'],
    }),
    'faq': () => ({
      background: 'grey',
      eyebrow: 'FAQ',
      title: '常见问题',
      lead: '',
      items: [
        { q: '最小起订量是多少？', a: '标准型号 1000 pcs 起；定制型号样品 100 pcs 起。' },
        { q: '从打样到量产要多久？', a: '一般 4-6 周，复杂定制 8-10 周。' },
      ],
    }),
    'blog-grid': () => ({
      background: 'grey',
      eyebrow: 'Latest Insights',
      title: 'Engineering deep-dives from our cell team.',
      lead: '',
      source: 'latest',
      limit: 3,
      allLink: '/blog/',
      allLinkText: 'Browse all insights →',
    }),
    'cta-band': () => ({
      background: 'dark',
      title: '准备好开始你的项目了吗？',
      subtitle: '把规格丢过来，48 小时内我们给出可行性分析。',
      button: { label: 'Request a Quote', url: '/contact.html' },
    }),
    'quote-form': () => ({
      background: 'light',
      eyebrow: '',
      title: '快速发起询盘',
      lead: '留下基本信息，工程师 1 个工作日内回复。',
      buttonLabel: 'Request a Quote',
      consentText: '我同意按隐私政策处理我的数据。',
    }),
    'rich-text': () => ({
      background: 'light',
      title: '',
      body: '## 副标题\n\n这里是段落文字。支持 **加粗** 和 [链接](https://example.com)。\n\n- 列表项 1\n- 列表项 2\n\n### 子标题\n\n再写一段。',
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

  /* ---------- Starter templates -------------------------------------------
     Each template is a function returning an array of pre-filled blocks. The
     operator picks one in the new-page modal, then only has to tweak text and
     swap images — no block-from-scratch friction.
  ------------------------------------------------------------------------- */
  function pre(type) { return { id: blockId(), type, data: DEFAULTS[type]() }; }
  const TEMPLATES = {
    blank: {
      label: '空白页面',
      desc: '从零开始，自己加积木块。',
      icon: '◻',
      build: () => [],
    },
    product: {
      label: '产品着陆页',
      desc: 'Hero + 信任带 + 介绍 + 特性 + 规格表 + FAQ + CTA。',
      icon: '◆',
      build: () => [
        pre('hero'),
        pre('trust-strip'),
        pre('content-split'),
        pre('feat-grid'),
        pre('spec-table'),
        pre('faq'),
        pre('cta-band'),
      ],
    },
    application: {
      label: '应用场景页',
      desc: 'Hero + 痛点说明 + 推荐产品 + 流程 + 认证 + CTA。',
      icon: '◉',
      build: () => [
        pre('hero'),
        pre('content-split'),
        pre('pillar-grid'),
        pre('steps-grid'),
        pre('cert-wall'),
        pre('cta-band'),
      ],
    },
    company: {
      label: '公司介绍页',
      desc: 'Hero + 故事 + 数字 + 价值观 + 认证 + CTA。',
      icon: '★',
      build: () => [
        pre('hero'),
        pre('content-split'),
        pre('stat-strip'),
        pre('feat-grid'),
        pre('cert-wall'),
        pre('cta-band'),
      ],
    },
    landing: {
      label: '询盘转化页',
      desc: 'Hero + 信任带 + 价值卖点 + 客户证言 + 询盘表单。',
      icon: '✉',
      build: () => [
        pre('hero'),
        pre('trust-strip'),
        pre('feat-grid'),
        pre('cert-wall'),
        pre('quote-form'),
      ],
    },
  };

  /* ---------- New-page modal ----------------------------------------------
     Two-stage UI in a single screen: a row of template cards + the slug
     input + create button. Selecting a template highlights it; clicking
     create posts the chosen template's blocks to /api/pages.
  ------------------------------------------------------------------------- */
  function openNewPageDialog() {
    let chosen = 'product';
    const mask = document.createElement('div');
    mask.className = 'picker-mask is-open';
    mask.innerHTML = `
      <div class="picker" onclick="event.stopPropagation()" style="max-width: 720px;">
        <h3>新建页面</h3>
        <p>选个起手模板，新页面会自动带上一套常用的积木块。之后照常拖动 / 编辑 / 删除。</p>
        <div class="picker__grid" id="tpl-grid" style="grid-template-columns: repeat(5, 1fr); margin-bottom: 18px;">
          ${Object.keys(TEMPLATES).map((k) => {
            const t = TEMPLATES[k];
            return `
              <div class="picker__item" data-tpl="${k}">
                <div class="ico">${t.icon}</div>
                <div class="ttl">${escapeHtml(t.label)}</div>
                <div class="sub">${escapeHtml(t.desc)}</div>
              </div>`;
          }).join('')}
        </div>
        <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center;">
          <input id="tpl-slug" placeholder="URL 路径，例如  solutions/storage  或  about/our-process" style="padding: 9px 12px; border: 1px solid var(--a-line); border-radius: 8px; font-size: 13.5px;"/>
          <button class="btn btn--ghost btn--sm" id="tpl-cancel">取消</button>
          <button class="btn btn--sm" id="tpl-create">创建并开始编辑</button>
        </div>
        <div style="font-size: 12px; color: var(--a-mute2); margin-top: 8px;">
          路径用 <code>/</code> 分层，例如 <code>solutions/storage</code> 会变成 <code>/solutions/storage</code>。不要带 <code>.html</code>。
        </div>
      </div>`;
    document.body.appendChild(mask);
    const grid = mask.querySelector('#tpl-grid');
    function highlight() {
      grid.querySelectorAll('.picker__item').forEach((it) => {
        it.style.borderColor = it.dataset.tpl === chosen ? 'var(--a-brand)' : '';
        it.style.background  = it.dataset.tpl === chosen ? 'var(--a-brand-soft)' : '#fff';
      });
    }
    grid.querySelectorAll('.picker__item').forEach((it) => {
      it.addEventListener('click', () => { chosen = it.dataset.tpl; highlight(); });
    });
    highlight();

    function close() { mask.remove(); }
    mask.addEventListener('click', close);
    mask.querySelector('#tpl-cancel').addEventListener('click', close);

    const slugInput = mask.querySelector('#tpl-slug');
    slugInput.focus();
    slugInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') mask.querySelector('#tpl-create').click();
    });

    mask.querySelector('#tpl-create').addEventListener('click', async () => {
      const raw = slugInput.value.trim().toLowerCase().replace(/^\/+|\/+$/g, '').replace(/\.html?$/i, '');
      if (!raw) {
        slugInput.style.borderColor = '#cf1322';
        slugInput.focus();
        return;
      }
      if (!/^[a-z0-9][a-z0-9\-_/]*$/.test(raw)) {
        toast('路径只能用字母、数字、横线、下划线和斜杠', 'error');
        return;
      }
      const blocks = TEMPLATES[chosen].build();
      try {
        const r = await api('/api/pages', {
          method: 'POST',
          body: JSON.stringify({
            slug: raw,
            title: '',
            status: 'draft',
            blocks,
          }),
        });
        location.href = '?id=' + r.id;
      } catch (err) {
        toast('创建失败：' + err.message, 'error');
      }
    });
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
    const n = (arr) => Array.isArray(arr) ? arr.length : 0;
    switch (b.type) {
      case 'hero':          return d.title || d.subtitle || '(空)';
      case 'trust-strip':   return `${n(d.items)} 个标识 · ${d.label || ''}`;
      case 'pillar-grid':   return `${n(d.cards)} 张卡片 · ${d.title || ''}`;
      case 'tesla-slider':  return `${n(d.slides)} 张幻灯片 · ${d.title || ''}`;
      case 'content-split': return d.title || d.subtitle || '(空)';
      case 'feat-grid':     return `${n(d.items)} 项 / ${d.columns || 3} 列 · ${d.title || ''}`;
      case 'steps-grid':    return `${n(d.steps)} 步 · ${d.title || ''}`;
      case 'stat-strip':    return `${n(d.stats)} 个数字 · ${d.title || ''}`;
      case 'spec-table':    return `${n(d.headers)} 列 × ${n(d.rows)} 行`;
      case 'cert-wall':     return `${n(d.chips)} 个认证 · ${d.title || ''}`;
      case 'faq':           return `${n(d.items)} 条问答 · ${d.title || ''}`;
      case 'blog-grid':     return `最多 ${d.limit || 3} 篇 · ${d.title || ''}`;
      case 'cta-band':      return d.title || '(空)';
      case 'quote-form':    return d.title || '(空)';
      case 'rich-text':     return (d.body || '').slice(0, 60) || '(空)';
    }
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

  // Background selector shared by content blocks.
  function fieldBg(container, d) {
    fieldSelect(container, '区块背景',
      [{ value: 'light', label: '白色（默认）' }, { value: 'grey', label: '浅灰' }, { value: 'dark', label: '深色' }],
      () => d.background || 'light',
      (v) => d.background = v,
    );
  }

  /* ------------------------------------------------------------------------
     Link picker — replaces freely-typed URL fields. The operator clicks "选
     目标" on any link field and sees a modal grouped by entity (built-in /
     pages / products / applications / blog / pillars), each row a clickable
     link target. Picks one → URL is written back to the form field.
  ------------------------------------------------------------------------ */
  const linkCache = { fetched: false, groups: [] };
  async function loadLinkTargets() {
    if (linkCache.fetched) return linkCache.groups;
    const [pages, products, apps, articles, pillars] = await Promise.all([
      api('/api/pages').catch(() => ({ items: [] })),
      api('/api/products').catch(() => ({ items: [] })),
      api('/api/applications').catch(() => ({ items: [] })),
      api('/api/articles?status=published&limit=100').catch(() => ({ items: [] })),
      api('/api/pillars').catch(() => ({ items: [] })),
    ]);
    linkCache.groups = [
      {
        name: '内置',
        items: [
          { label: '首页',     url: '/' },
          { label: '联系我们', url: '/contact.html' },
          { label: '所有产品', url: '/products/' },
          { label: '所有应用', url: '/applications/' },
          { label: '所有方案', url: '/solutions/' },
          { label: '博客首页', url: '/blog/' },
          { label: 'FAQ',     url: '/faq.html' },
          { label: '隐私政策', url: '/privacy.html' },
        ],
      },
      {
        name: '静态页面',
        items: (pages.items || []).map((p) => ({
          label: (p.title || p.hero_title || p.slug) + (p.status === 'draft' ? '（草稿）' : ''),
          url: p.slug === 'home' ? '/' : '/' + p.slug + (p.slug.includes('/') ? '' : '.html'),
        })),
      },
      {
        name: '产品',
        items: (products.items || products.products || []).map((p) => ({
          label: p.name || p.slug,
          url: '/products/' + p.slug,
        })),
      },
      {
        name: '应用',
        items: (apps.items || apps.applications || []).map((a) => ({
          label: a.name || a.slug,
          url: '/applications/' + a.slug + (a.slug.includes('.') ? '' : '.html'),
        })),
      },
      {
        name: '支柱页',
        items: (pillars.items || pillars.pillars || []).map((p) => ({
          label: p.name || p.slug,
          url: '/products/' + p.slug,
        })),
      },
      {
        name: '博客文章',
        items: (articles.items || articles.articles || []).map((a) => ({
          label: a.title || a.slug,
          url: '/blog/' + a.slug,
        })),
      },
    ];
    linkCache.fetched = true;
    return linkCache.groups;
  }

  function openLinkPicker(currentValue, onPick) {
    const mask = document.createElement('div');
    mask.className = 'picker-mask is-open';
    mask.innerHTML = `
      <div class="picker" onclick="event.stopPropagation()" style="max-width: 640px;">
        <h3>选择链接目标</h3>
        <p>搜索站内页面，或在最下面手填一个完整的外部 URL（必须以 https:// 开头）。</p>
        <input id="link-search" placeholder="搜索…" style="width: 100%; padding: 9px 12px; border: 1px solid var(--a-line); border-radius: 8px; font-size: 13px; margin-bottom: 12px;"/>
        <div id="link-list" style="max-height: 46vh; overflow-y: auto; margin: 0 -8px;">
          <div class="empty" style="padding: 20px;">加载中…</div>
        </div>
        <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--a-line);">
          <label style="font-size: 11px; font-weight: 700; color: var(--a-mute2); letter-spacing: 0.08em; text-transform: uppercase; display: block; margin-bottom: 6px;">或填外部 URL / 锚点</label>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px;">
            <input id="link-external" placeholder="https://example.com 或 #anchor 或 mailto:..." value="${escapeHtml(currentValue || '')}" style="padding: 8px 11px; border: 1px solid var(--a-line); border-radius: 6px; font-size: 13px;"/>
            <button class="btn btn--sm" id="link-confirm">使用</button>
          </div>
        </div>
        <div style="text-align: right; margin-top: 14px;">
          <button class="btn btn--ghost btn--sm" id="link-cancel">取消</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
    function close() { mask.remove(); }
    mask.addEventListener('click', close);
    mask.querySelector('#link-cancel').addEventListener('click', close);

    const listEl = mask.querySelector('#link-list');
    const searchEl = mask.querySelector('#link-search');
    let allGroups = [];

    function paint(query) {
      const q = (query || '').toLowerCase().trim();
      const filtered = allGroups
        .map((g) => ({
          ...g,
          items: !q ? g.items
                    : g.items.filter((it) => it.label.toLowerCase().includes(q) || it.url.toLowerCase().includes(q)),
        }))
        .filter((g) => g.items.length);
      if (!filtered.length) {
        listEl.innerHTML = '<div class="empty" style="padding: 20px;">没有匹配的目标。</div>';
        return;
      }
      listEl.innerHTML = filtered.map((g) => `
        <div style="font-size: 11px; font-weight: 700; color: var(--a-mute2); letter-spacing: 0.08em; text-transform: uppercase; padding: 10px 12px 6px;">${escapeHtml(g.name)}</div>
        ${g.items.map((it) => `
          <button type="button" data-url="${escapeHtml(it.url)}" style="display: block; width: 100%; text-align: left; border: 0; background: transparent; padding: 8px 14px; cursor: pointer; font-size: 13px; border-radius: 6px;" onmouseover="this.style.background='var(--a-surface)'" onmouseout="this.style.background='transparent'">
            <div style="font-weight: 500; color: #1f2127;">${escapeHtml(it.label)}</div>
            <div class="mono" style="font-size: 11.5px; color: var(--a-mute2); margin-top: 2px;">${escapeHtml(it.url)}</div>
          </button>`).join('')}
      `).join('');
      listEl.querySelectorAll('button[data-url]').forEach((b) => {
        b.addEventListener('click', () => {
          onPick(b.dataset.url);
          close();
        });
      });
    }

    searchEl.addEventListener('input', () => paint(searchEl.value));

    mask.querySelector('#link-confirm').addEventListener('click', () => {
      const v = mask.querySelector('#link-external').value.trim();
      if (!v) return close();
      if (!/^(https?:\/\/|\/|#|mailto:)/i.test(v)) {
        toast('外部 URL 必须以 https:// 或 / 开头', 'error');
        return;
      }
      onPick(v); close();
    });

    loadLinkTargets().then((groups) => { allGroups = groups; paint(''); });
    setTimeout(() => searchEl.focus(), 50);
  }

  /* ------------------------------------------------------------------------
     Media picker — operators stop pasting URLs. Click "选图" → see the media
     library; click a thumbnail to fill the URL; or drop a file to upload
     (alt text required so SEO / accessibility never gets skipped).
  ------------------------------------------------------------------------ */
  async function openMediaPicker(currentValue, onPick) {
    const mask = document.createElement('div');
    mask.className = 'picker-mask is-open';
    mask.innerHTML = `
      <div class="picker" onclick="event.stopPropagation()" style="max-width: 820px;">
        <h3>媒体库</h3>
        <p>点缩略图直接使用，或把文件拖到下面的虚线区域上传。上传时必须填 alt 文本。</p>

        <div id="media-dropzone" style="border: 2px dashed var(--a-line); border-radius: 10px; padding: 18px; text-align: center; font-size: 13px; color: var(--a-mute2); margin-bottom: 14px; cursor: pointer;">
          📤 拖文件到这里，或 <a href="#" id="media-pick-file" style="color: var(--a-brand);">点这里选择</a>
          <input type="file" id="media-file-input" accept="image/*,application/pdf" style="display: none;"/>
          <div id="media-upload-status" style="margin-top: 8px; font-size: 12px;"></div>
        </div>

        <input id="media-search" placeholder="按文件名搜索…" style="width: 100%; padding: 9px 12px; border: 1px solid var(--a-line); border-radius: 8px; font-size: 13px; margin-bottom: 10px;"/>

        <div id="media-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; max-height: 44vh; overflow-y: auto; padding: 4px;">
          <div class="empty" style="grid-column: 1/-1; padding: 30px;">加载中…</div>
        </div>

        <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--a-line); display: grid; grid-template-columns: 1fr auto auto; gap: 8px;">
          <input id="media-external" placeholder="或粘贴外部图片 URL（必须 https://）" value="${escapeHtml(currentValue || '')}" style="padding: 8px 11px; border: 1px solid var(--a-line); border-radius: 6px; font-size: 13px;"/>
          <button class="btn btn--ghost btn--sm" id="media-cancel">取消</button>
          <button class="btn btn--sm" id="media-confirm">使用此 URL</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
    function close() { mask.remove(); }
    mask.addEventListener('click', close);
    mask.querySelector('#media-cancel').addEventListener('click', close);

    const grid = mask.querySelector('#media-grid');
    const search = mask.querySelector('#media-search');
    let items = [];

    function paint() {
      const q = search.value.toLowerCase().trim();
      const filtered = !q ? items : items.filter((it) =>
        (it.original || '').toLowerCase().includes(q) || (it.filename || '').toLowerCase().includes(q)
      );
      if (!filtered.length) {
        grid.innerHTML = '<div class="empty" style="grid-column: 1/-1; padding: 30px;">媒体库还是空的。上传第一张图吧。</div>';
        return;
      }
      grid.innerHTML = filtered.map((it) => {
        const isImg = (it.mime || '').startsWith('image/');
        const thumb = isImg
          ? `<img src="${escapeHtml(it.url)}" alt="${escapeHtml(it.alt_text || '')}" style="width: 100%; height: 100%; object-fit: cover; display: block;">`
          : `<div style="display:flex; align-items:center; justify-content:center; height:100%; font-size: 28px; color: var(--a-mute2);">📄</div>`;
        return `
          <button type="button" data-url="${escapeHtml(it.url)}" style="border: 1px solid var(--a-line); border-radius: 8px; padding: 0; background: #fff; cursor: pointer; overflow: hidden; aspect-ratio: 1; display: flex; flex-direction: column;">
            <div style="flex: 1; min-height: 0; background: var(--a-surface);">${thumb}</div>
            <div style="padding: 6px 8px; font-size: 11px; color: var(--a-mute2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(it.original || it.filename)}</div>
          </button>`;
      }).join('');
      grid.querySelectorAll('button[data-url]').forEach((b) => {
        b.addEventListener('click', () => { onPick(b.dataset.url); close(); });
      });
    }
    search.addEventListener('input', paint);

    async function load() {
      try {
        const r = await api('/api/media?limit=80');
        items = r.items || [];
        paint();
      } catch (err) {
        grid.innerHTML = `<div class="empty" style="grid-column: 1/-1; padding: 30px; color: #cf1322;">加载失败：${escapeHtml(err.message)}</div>`;
      }
    }
    load();

    // Upload flow
    const dropzone = mask.querySelector('#media-dropzone');
    const fileInput = mask.querySelector('#media-file-input');
    const statusEl = mask.querySelector('#media-upload-status');
    mask.querySelector('#media-pick-file').addEventListener('click', (ev) => { ev.preventDefault(); fileInput.click(); });
    dropzone.addEventListener('click', () => fileInput.click());
    ['dragenter', 'dragover'].forEach((ev) => dropzone.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      dropzone.style.borderColor = 'var(--a-brand)';
      dropzone.style.background = 'var(--a-brand-soft)';
    }));
    ['dragleave', 'drop'].forEach((ev) => dropzone.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      dropzone.style.borderColor = '';
      dropzone.style.background = '';
    }));
    dropzone.addEventListener('drop', (e) => { if (e.dataTransfer.files[0]) doUpload(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) doUpload(fileInput.files[0]); });

    async function doUpload(file) {
      const alt = prompt(`给这张图填一段 alt 文本（一句话描述图里是什么，SEO + 无障碍都需要）：\n\n文件名：${file.name}`);
      if (alt === null) return; // user cancelled
      const altText = alt.trim();
      if (!altText) { toast('alt 文本不能为空。重新上传吧。', 'error'); return; }
      statusEl.textContent = '上传中…';
      statusEl.style.color = 'var(--a-mute2)';
      const fd = new FormData();
      fd.append('file', file);
      fd.append('alt_text', altText);
      try {
        const res = await fetch('/api/media', { method: 'POST', credentials: 'include', body: fd });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || ('HTTP ' + res.status));
        statusEl.textContent = '✓ 上传成功';
        statusEl.style.color = '#137333';
        items.unshift({ id: j.id, url: j.url, original: file.name, filename: j.filename, mime: file.type, alt_text: altText });
        paint();
      } catch (err) {
        statusEl.textContent = '上传失败：' + err.message;
        statusEl.style.color = '#cf1322';
      }
    }

    mask.querySelector('#media-confirm').addEventListener('click', () => {
      const v = mask.querySelector('#media-external').value.trim();
      if (!v) return close();
      if (!/^(https?:\/\/|\/)/i.test(v)) {
        toast('URL 必须以 https:// 或 / 开头', 'error');
        return;
      }
      onPick(v); close();
    });
  }

  // Field component that pairs an image URL with a thumbnail preview + "选图" button.
  function fieldImage(container, label, getValue, setValue, opts) {
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'field-card';
    const id = 'fld_' + Math.random().toString(36).slice(2, 8);
    wrap.innerHTML = `
      <div class="field">
        <label for="${id}">${escapeHtml(label)}</label>
        <div style="display: grid; grid-template-columns: 60px 1fr auto; gap: 6px; align-items: center;">
          <div id="${id}_thumb" style="width: 60px; height: 60px; border: 1px solid var(--a-line); border-radius: 6px; background: var(--a-surface) center/cover no-repeat;"></div>
          <input id="${id}"/>
          <button type="button" class="btn btn--ghost btn--sm" data-pick>选图</button>
        </div>
        ${opts.hint ? `<div style="font-size:11px; color:var(--a-mute2); margin-top:4px;">${escapeHtml(opts.hint)}</div>` : ''}
      </div>`;
    container.appendChild(wrap);
    const el = wrap.querySelector('#' + id);
    const thumb = wrap.querySelector('#' + id + '_thumb');
    function updateThumb(url) {
      thumb.style.backgroundImage = url ? `url('${url.replace(/'/g, "\\'")}')` : '';
    }
    el.value = getValue() ?? '';
    updateThumb(el.value);
    el.addEventListener('input', () => {
      setValue(el.value); updateThumb(el.value);
      markDirty(); schedulePreview(); refreshBlockRowSummary();
    });
    wrap.querySelector('[data-pick]').addEventListener('click', () => {
      openMediaPicker(el.value, (chosen) => {
        el.value = chosen;
        setValue(chosen);
        updateThumb(chosen);
        markDirty(); schedulePreview(); refreshBlockRowSummary();
      });
    });
  }

  // Field component that pairs a URL input with a "选目标" button.
  function fieldLink(container, label, getValue, setValue, opts) {
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'field-card';
    const id = 'fld_' + Math.random().toString(36).slice(2, 8);
    wrap.innerHTML = `
      <div class="field">
        <label for="${id}">${escapeHtml(label)}</label>
        <div style="display: grid; grid-template-columns: 1fr auto; gap: 6px;">
          <input id="${id}"/>
          <button type="button" class="btn btn--ghost btn--sm" data-pick>选目标</button>
        </div>
        ${opts.hint ? `<div style="font-size:11px; color:var(--a-mute2); margin-top:4px;">${escapeHtml(opts.hint)}</div>` : ''}
      </div>`;
    container.appendChild(wrap);
    const el = wrap.querySelector('#' + id);
    el.value = getValue() ?? '';
    el.addEventListener('input', () => { setValue(el.value); markDirty(); schedulePreview(); refreshBlockRowSummary(); });
    wrap.querySelector('[data-pick]').addEventListener('click', () => {
      openLinkPicker(el.value, (chosen) => {
        el.value = chosen;
        setValue(chosen);
        markDirty(); schedulePreview(); refreshBlockRowSummary();
      });
    });
  }

  // Generic string-list repeater (e.g. trust-strip items, cert chips,
  // content-split paragraphs, step-card points).
  function fieldStringList(container, label, getList, setList, opts) {
    opts = opts || {};
    fieldGroup(container, label);
    const wrap = document.createElement('div');
    container.appendChild(wrap);
    function rerender() {
      wrap.innerHTML = '';
      const list = getList();
      list.forEach((val, idx) => {
        const r = document.createElement('div');
        r.style.display = 'grid';
        r.style.gridTemplateColumns = '1fr 28px';
        r.style.gap = '6px';
        r.style.marginBottom = '6px';
        const inputTag = opts.textarea ? `<textarea rows="2"`: `<input`;
        r.innerHTML = `
          ${inputTag} placeholder="${escapeHtml(opts.placeholder || '')}" style="padding:7px 9px; border:1px solid var(--a-line); border-radius:6px; font-size:12.5px; font-family:inherit;">${opts.textarea ? `${escapeHtml(val)}</textarea>` : ''}
          <button class="block-row__btn danger" title="删除">✕</button>`;
        const inp = r.children[0];
        const del = r.children[1];
        if (!opts.textarea) inp.value = val;
        inp.addEventListener('input', () => {
          const arr = getList(); arr[idx] = inp.value; setList(arr);
          markDirty(); schedulePreview();
        });
        del.addEventListener('click', () => {
          const arr = getList(); arr.splice(idx, 1); setList(arr);
          rerender(); markDirty(); schedulePreview(); refreshBlockRowSummary();
        });
        wrap.appendChild(r);
      });
      const add = document.createElement('button');
      add.className = 'add-block-btn';
      add.style.padding = '6px 10px';
      add.style.fontSize = '12px';
      add.style.marginTop = '4px';
      add.textContent = opts.addLabel || '+ 加一项';
      add.addEventListener('click', () => {
        const arr = getList(); arr.push(''); setList(arr);
        rerender(); markDirty(); schedulePreview(); refreshBlockRowSummary();
      });
      wrap.appendChild(add);
    }
    rerender();
    return rerender;
  }

  // Generic object-list repeater. `renderItem(body, item, idx)` populates
  // the per-item collapsible drawer with whatever inputs the block needs.
  function fieldObjectList(container, label, getList, setList, opts) {
    opts = opts || {};
    fieldGroup(container, label);
    const wrap = document.createElement('div');
    container.appendChild(wrap);
    function rerender() {
      wrap.innerHTML = '';
      const list = getList();
      list.forEach((item, idx) => {
        const ttl = (opts.itemTitle ? opts.itemTitle(item, idx) : null) || `${opts.singular || '项'} ${idx + 1}`;
        const it = document.createElement('div');
        it.className = 'repeater__item';
        it.innerHTML = `
          <div class="repeater__head" data-toggle>
            <span class="repeater__handle">⠿</span>
            <span class="ttl">${escapeHtml(ttl)}</span>
            <button class="block-row__btn danger" data-del-it title="删除">✕</button>
            <span class="caret">▸</span>
          </div>
          <div class="repeater__body"></div>`;
        wrap.appendChild(it);
        opts.renderItem(it.querySelector('.repeater__body'), item, idx);
        it.querySelector('[data-toggle]').addEventListener('click', (ev) => {
          if (ev.target.closest('[data-del-it]')) return;
          it.classList.toggle('is-open');
        });
        it.querySelector('[data-del-it]').addEventListener('click', () => {
          if (!confirm('确认删除？')) return;
          const arr = getList(); arr.splice(idx, 1); setList(arr);
          rerender(); markDirty(); schedulePreview(); refreshBlockRowSummary();
        });
      });
      const add = document.createElement('button');
      add.className = 'add-block-btn';
      add.style.marginTop = '6px';
      add.textContent = opts.addLabel || `+ 加一个${opts.singular || '项'}`;
      add.addEventListener('click', () => {
        const arr = getList();
        arr.push(opts.newItem ? opts.newItem() : {});
        setList(arr);
        rerender(); markDirty(); schedulePreview(); refreshBlockRowSummary();
      });
      wrap.appendChild(add);
    }
    rerender();
    return rerender;
  }

  /* ---------- Block form implementations --------------------------------- */
  const FORMS = {

    'hero': (body, block) => {
      const d = block.data;
      fieldImage(body, '背景图', () => d.image, (v) => d.image = v, { hint: '满屏背景。点"选图"打开媒体库，或粘贴外部 URL。' });
      fieldText(body, 'Eyebrow（标题上方小字）', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, 'H1 主标题',  () => d.title,    (v) => d.title = v, { hint: '支持简单 <br> 换行。' });
      fieldText(body, '副标题',     () => d.subtitle, (v) => d.subtitle = v, { textarea: true });
      fieldGroup(body, '按钮 1（主按钮）');
      fieldText(body, '按钮 1 文字', () => d.primary?.label, (v) => { d.primary = d.primary || {}; d.primary.label = v; });
      fieldLink(body, '按钮 1 链接', () => d.primary?.url,   (v) => { d.primary = d.primary || {}; d.primary.url = v; });
      fieldGroup(body, '按钮 2（副按钮，可留空）');
      fieldText(body, '按钮 2 文字', () => d.secondary?.label, (v) => { d.secondary = d.secondary || {}; d.secondary.label = v; });
      fieldLink(body, '按钮 2 链接', () => d.secondary?.url,   (v) => { d.secondary = d.secondary || {}; d.secondary.url = v; });
    },

    'trust-strip': (body, block) => {
      const d = block.data;
      d.items = Array.isArray(d.items) ? d.items : [];
      fieldText(body, '左侧小标签', () => d.label, (v) => d.label = v, { hint: '例如 "Compliant with"。留空就只显示标识。' });
      fieldStringList(body, '标识列表', () => d.items, (arr) => d.items = arr, { placeholder: '例如 ISO 9001', addLabel: '+ 加一个标识' });
    },

    'pillar-grid': (body, block) => {
      const d = block.data;
      d.cards = Array.isArray(d.cards) ? d.cards : [];
      fieldBg(body, d);
      fieldText(body, 'Eyebrow', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, '标题',    () => d.title,   (v) => d.title = v);
      fieldText(body, '引言',    () => d.lead,    (v) => d.lead = v, { textarea: true });
      fieldObjectList(body, '卡片', () => d.cards, (arr) => d.cards = arr, {
        singular: '卡片',
        itemTitle: (c, i) => c.title || c.pill || '卡片 ' + (i + 1),
        newItem: () => ({ image: '', pill: '', title: '新卡片', desc: '', specs: [], link: '#', linkText: '了解更多 →' }),
        renderItem: (mount, c) => {
          fieldImage(mount, '图片',     () => c.image,    (v) => c.image = v);
          fieldText(mount, '小标签 Pill', () => c.pill,   (v) => c.pill = v);
          fieldText(mount, '卡片标题',   () => c.title,   (v) => c.title = v);
          fieldText(mount, '描述',       () => c.desc,    (v) => c.desc = v, { textarea: true });
          fieldLink(mount, '链接 URL',   () => c.link,    (v) => c.link = v);
          fieldText(mount, '链接文字',   () => c.linkText, (v) => c.linkText = v);
          fieldGroup(mount, '规格（数字 / 单位）');
          const specsWrap = document.createElement('div');
          mount.appendChild(specsWrap);
          function renderSpecs() {
            c.specs = Array.isArray(c.specs) ? c.specs : [];
            specsWrap.innerHTML = '';
            c.specs.forEach((sp, idx) => {
              const r = document.createElement('div');
              r.style.cssText = 'display:grid; grid-template-columns:1fr 1fr 28px; gap:6px; margin-bottom:6px;';
              r.innerHTML = `
                <input placeholder="数字" value="${escapeHtml(sp.value || '')}" style="padding:7px 9px; border:1px solid var(--a-line); border-radius:6px; font-size:12.5px;"/>
                <input placeholder="单位" value="${escapeHtml(sp.unit  || '')}" style="padding:7px 9px; border:1px solid var(--a-line); border-radius:6px; font-size:12.5px;"/>
                <button class="block-row__btn danger" title="删除">✕</button>`;
              const [v, u, del] = r.children;
              v.addEventListener('input', () => { sp.value = v.value; markDirty(); schedulePreview(); });
              u.addEventListener('input', () => { sp.unit  = u.value; markDirty(); schedulePreview(); });
              del.addEventListener('click', () => { c.specs.splice(idx, 1); renderSpecs(); markDirty(); schedulePreview(); });
              specsWrap.appendChild(r);
            });
            const add = document.createElement('button');
            add.className = 'add-block-btn';
            add.style.cssText = 'padding:6px 10px; font-size:12px; margin-top:4px;';
            add.textContent = '+ 加一条规格';
            add.addEventListener('click', () => { c.specs.push({ value: '', unit: '' }); renderSpecs(); markDirty(); schedulePreview(); });
            specsWrap.appendChild(add);
          }
          renderSpecs();
        },
      });
    },

    'tesla-slider': (body, block) => {
      const d = block.data;
      d.slides = Array.isArray(d.slides) ? d.slides : [];
      fieldBg(body, d);
      fieldText(body, 'Eyebrow', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, '标题',    () => d.title,   (v) => d.title = v);
      fieldText(body, '引言',    () => d.lead,    (v) => d.lead = v, { textarea: true });
      fieldObjectList(body, '幻灯片', () => d.slides, (arr) => d.slides = arr, {
        singular: '幻灯片',
        itemTitle: (s, i) => s.title || `幻灯片 ${i + 1}`,
        newItem: () => ({ image: '', label: '', title: '新幻灯片', subtitle: '', primaryCta: 'Explore', secondaryCta: '', link: '#' }),
        renderItem: (mount, s) => {
          fieldImage(mount, '背景图',    () => s.image,        (v) => s.image = v);
          fieldText(mount, '顶部小字',   () => s.label,        (v) => s.label = v, { hint: '例如 "Application 01 · AR / VR"' });
          fieldText(mount, '标题',       () => s.title,        (v) => s.title = v);
          fieldText(mount, '副标题',     () => s.subtitle,     (v) => s.subtitle = v, { textarea: true });
          fieldText(mount, '主按钮文字', () => s.primaryCta,   (v) => s.primaryCta = v);
          fieldText(mount, '副按钮文字', () => s.secondaryCta, (v) => s.secondaryCta = v);
          fieldLink(mount, '链接 URL',   () => s.link,         (v) => s.link = v);
        },
      });
    },

    'content-split': (body, block) => {
      const d = block.data;
      d.paragraphs = Array.isArray(d.paragraphs) ? d.paragraphs : [];
      fieldBg(body, d);
      fieldText(body, 'Eyebrow', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, '上方主标题 (H2)', () => d.title, (v) => d.title = v);
      fieldText(body, '左栏标题 (H3)',   () => d.subtitle, (v) => d.subtitle = v);
      fieldStringList(body, '左栏段落', () => d.paragraphs, (arr) => d.paragraphs = arr, { textarea: true, placeholder: '一段文字', addLabel: '+ 加一段' });
      fieldGroup(body, '可选链接');
      fieldText(body, '链接文字', () => d.link?.label, (v) => { d.link = d.link || {}; d.link.label = v; });
      fieldLink(body, '链接 URL', () => d.link?.url,   (v) => { d.link = d.link || {}; d.link.url   = v; });
      fieldGroup(body, '右栏图片');
      fieldImage(body, '图片',   () => d.image,    (v) => d.image = v);
      fieldText(body, '图片 alt', () => d.imageAlt, (v) => d.imageAlt = v, { hint: 'SEO + 无障碍。一句话描述图里是什么。' });
      fieldSelect(body, '图片位置',
        [{ value: 'right', label: '右侧（默认）' }, { value: 'left', label: '左侧（反转）' }],
        () => d.imagePosition || 'right',
        (v) => d.imagePosition = v,
      );
    },

    'feat-grid': (body, block) => {
      const d = block.data;
      d.items = Array.isArray(d.items) ? d.items : [];
      fieldBg(body, d);
      fieldText(body, 'Eyebrow', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, '标题',    () => d.title,   (v) => d.title = v);
      fieldText(body, '引言',    () => d.lead,    (v) => d.lead = v, { textarea: true });
      fieldSelect(body, '列数',
        [{ value: '2', label: '2 列' }, { value: '3', label: '3 列（默认）' }, { value: '4', label: '4 列' }],
        () => String(d.columns || 3),
        (v) => d.columns = parseInt(v, 10),
      );
      fieldObjectList(body, '特性卡', () => d.items, (arr) => d.items = arr, {
        singular: '特性',
        itemTitle: (it, i) => it.title || '特性 ' + (i + 1),
        newItem: () => ({ icon: '◆', title: '新特性', desc: '简短描述。' }),
        renderItem: (mount, it) => {
          fieldText(mount, '图标（一个字符或数字）', () => it.icon, (v) => it.icon = v, { hint: '例如 ① / ✓ / 01 / 任何一个字符。' });
          fieldText(mount, '标题', () => it.title, (v) => it.title = v);
          fieldText(mount, '描述', () => it.desc,  (v) => it.desc  = v, { textarea: true });
        },
      });
    },

    'steps-grid': (body, block) => {
      const d = block.data;
      d.steps = Array.isArray(d.steps) ? d.steps : [];
      fieldBg(body, d);
      fieldText(body, 'Eyebrow', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, '标题',    () => d.title,   (v) => d.title = v);
      fieldText(body, '引言',    () => d.lead,    (v) => d.lead = v, { textarea: true });
      fieldObjectList(body, '步骤', () => d.steps, (arr) => d.steps = arr, {
        singular: '步骤',
        itemTitle: (st, i) => st.title || `步骤 ${i + 1}`,
        newItem: () => ({ num: '', title: '新步骤', body: '', points: [] }),
        renderItem: (mount, st) => {
          fieldText(mount, '编号', () => st.num,   (v) => st.num   = v, { hint: '留空就用序号 01/02/03。可以写文字如 "Day 1"。' });
          fieldText(mount, '标题', () => st.title, (v) => st.title = v);
          fieldText(mount, '说明', () => st.body,  (v) => st.body  = v, { textarea: true });
          st.points = Array.isArray(st.points) ? st.points : [];
          fieldStringList(mount, '要点列表（可选）', () => st.points, (arr) => st.points = arr, { placeholder: '一条要点', addLabel: '+ 加一条要点' });
        },
      });
    },

    'stat-strip': (body, block) => {
      const d = block.data;
      d.stats = Array.isArray(d.stats) ? d.stats : [];
      fieldSelect(body, '背景',
        [{ value: 'dark', label: '深色（默认）' }, { value: 'light', label: '浅色' }],
        () => d.dark === false ? 'light' : 'dark',
        (v) => d.dark = (v === 'dark'),
      );
      fieldText(body, 'Eyebrow', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, '标题',    () => d.title,   (v) => d.title = v);
      fieldText(body, '引言',    () => d.lead,    (v) => d.lead = v, { textarea: true });
      fieldObjectList(body, '数字', () => d.stats, (arr) => d.stats = arr, {
        singular: '数字',
        itemTitle: (s, i) => (s.value || '') + (s.unit ? ' ' + s.unit : '') || `数字 ${i + 1}`,
        newItem: () => ({ value: '0', unit: '', label: '' }),
        renderItem: (mount, s) => {
          fieldText(mount, '数字 / 文字', () => s.value, (v) => s.value = v, { hint: '纯数字会自动滚动动画；写文字如 "ISO 9001" 直接显示。' });
          fieldText(mount, '单位（可选）', () => s.unit,  (v) => s.unit  = v, { hint: '例如 yrs / + / m²。' });
          fieldText(mount, '下方标签',     () => s.label, (v) => s.label = v);
        },
      });
    },

    'spec-table': (body, block) => {
      const d = block.data;
      d.headers = Array.isArray(d.headers) ? d.headers : [];
      d.rows = Array.isArray(d.rows) ? d.rows : [];
      fieldBg(body, d);
      fieldText(body, 'Eyebrow', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, '标题',    () => d.title,   (v) => d.title = v);
      fieldText(body, '引言',    () => d.lead,    (v) => d.lead = v, { textarea: true });
      fieldStringList(body, '表头（每一列）', () => d.headers, (arr) => {
        d.headers = arr;
        // adjust rows to match column count
        d.rows = d.rows.map((r) => {
          const out = Array.isArray(r) ? r.slice() : [];
          while (out.length < arr.length) out.push('');
          return out.slice(0, arr.length);
        });
      }, { placeholder: '列名', addLabel: '+ 加一列' });

      fieldGroup(body, `数据行（${d.rows.length}）`);
      const rowsWrap = document.createElement('div');
      body.appendChild(rowsWrap);
      function renderRows() {
        rowsWrap.innerHTML = '';
        const cols = d.headers.length || 1;
        d.rows.forEach((row, idx) => {
          row = Array.isArray(row) ? row : [];
          while (row.length < cols) row.push('');
          d.rows[idx] = row;
          const r = document.createElement('div');
          r.style.cssText = `display:grid; grid-template-columns:repeat(${cols}, 1fr) 28px; gap:4px; margin-bottom:4px;`;
          r.innerHTML = row.map((cell) => `<input value="${escapeHtml(cell)}" style="padding:6px 8px; border:1px solid var(--a-line); border-radius:5px; font-size:12px;">`).join('')
            + `<button class="block-row__btn danger" title="删除整行">✕</button>`;
          [...r.children].slice(0, cols).forEach((inp, ci) => {
            inp.addEventListener('input', () => { d.rows[idx][ci] = inp.value; markDirty(); schedulePreview(); });
          });
          r.lastElementChild.addEventListener('click', () => {
            d.rows.splice(idx, 1); renderRows(); markDirty(); schedulePreview(); refreshBlockRowSummary();
          });
          rowsWrap.appendChild(r);
        });
        const add = document.createElement('button');
        add.className = 'add-block-btn';
        add.style.cssText = 'padding:6px 10px; font-size:12px; margin-top:4px;';
        add.textContent = '+ 加一行';
        add.addEventListener('click', () => {
          d.rows.push(new Array(d.headers.length || 1).fill(''));
          renderRows(); markDirty(); schedulePreview(); refreshBlockRowSummary();
        });
        rowsWrap.appendChild(add);
      }
      renderRows();
    },

    'cert-wall': (body, block) => {
      const d = block.data;
      d.chips = Array.isArray(d.chips) ? d.chips : [];
      fieldBg(body, d);
      fieldText(body, 'Eyebrow', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, '标题',    () => d.title,   (v) => d.title = v);
      fieldText(body, '引言',    () => d.lead,    (v) => d.lead = v, { textarea: true });
      fieldStringList(body, '认证标签', () => d.chips, (arr) => d.chips = arr, { placeholder: '例如 ISO 9001', addLabel: '+ 加一个认证' });
    },

    'faq': (body, block) => {
      const d = block.data;
      d.items = Array.isArray(d.items) ? d.items : [];
      fieldBg(body, d);
      fieldText(body, 'Eyebrow', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, '标题',    () => d.title,   (v) => d.title = v);
      fieldText(body, '引言',    () => d.lead,    (v) => d.lead = v, { textarea: true });
      fieldObjectList(body, '问答', () => d.items, (arr) => d.items = arr, {
        singular: '问答',
        itemTitle: (f, i) => f.q || '问题 ' + (i + 1),
        newItem: () => ({ q: '', a: '' }),
        renderItem: (mount, f) => {
          fieldText(mount, '问题', () => f.q, (v) => f.q = v);
          fieldText(mount, '回答', () => f.a, (v) => f.a = v, { textarea: true, rows: 4 });
        },
      });
    },

    'blog-grid': (body, block) => {
      const d = block.data;
      fieldBg(body, d);
      fieldText(body, 'Eyebrow', () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, '标题',    () => d.title,   (v) => d.title = v);
      fieldText(body, '引言',    () => d.lead,    (v) => d.lead = v, { textarea: true });
      fieldSelect(body, '来源',
        [{ value: 'latest', label: '所有最新文章' }, { value: 'pillar', label: '当前页对应的支柱页' }],
        () => d.source || 'latest',
        (v) => d.source = v,
      );
      fieldText(body, '显示数量', () => d.limit, (v) => d.limit = parseInt(v, 10) || 3, { type: 'number' });
      fieldGroup(body, '底部"查看全部"链接（可选）');
      fieldText(body, '链接文字', () => d.allLinkText, (v) => d.allLinkText = v);
      fieldLink(body, '链接 URL', () => d.allLink,     (v) => d.allLink = v);
    },

    'cta-band': (body, block) => {
      const d = block.data;
      fieldText(body, '主标题', () => d.title,    (v) => d.title = v);
      fieldText(body, '副标题', () => d.subtitle, (v) => d.subtitle = v, { textarea: true });
      fieldText(body, '按钮文字', () => d.button?.label, (v) => { d.button = d.button || {}; d.button.label = v; });
      fieldLink(body, '按钮链接', () => d.button?.url,   (v) => { d.button = d.button || {}; d.button.url = v; });
      fieldSelect(body, '背景',
        [{ value: 'dark', label: '深色（默认）' }, { value: 'light', label: '浅色' }, { value: 'grey', label: '灰色' }],
        () => d.background || 'dark',
        (v) => d.background = v,
      );
    },

    'quote-form': (body, block) => {
      const d = block.data;
      fieldBg(body, d);
      fieldText(body, 'Eyebrow',  () => d.eyebrow, (v) => d.eyebrow = v);
      fieldText(body, '标题',     () => d.title,   (v) => d.title = v);
      fieldText(body, '引言',     () => d.lead,    (v) => d.lead = v, { textarea: true });
      fieldText(body, '提交按钮文字', () => d.buttonLabel, (v) => d.buttonLabel = v);
      fieldText(body, '同意条款文字', () => d.consentText, (v) => d.consentText = v, { textarea: true, hint: 'GDPR 同意框旁的说明。' });
    },

    'rich-text': (body, block) => {
      const d = block.data;
      fieldBg(body, d);
      fieldText(body, '小标题（可选）', () => d.title, (v) => d.title = v);
      fieldText(body, '正文', () => d.body, (v) => d.body = v, { textarea: true, rows: 14,
        hint: 'Markdown 风格：## 标题；### 子标题；- 列表项；空行分段；**加粗**；[文字](链接)。' });
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
