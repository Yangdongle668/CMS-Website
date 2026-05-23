/* Reusable image-picker component. Used in admin pages that have an
   image URL field (hero_image, cover_url, og:image, avatar_url, …).

   The operator gets:
     1. Thumbnail preview (fixed-size, never overflows the container).
     2. Upload button that uploads to /api/media → fills the URL.
     3. "Choose from library" modal with thumbnails of /uploads/* media.
     4. URL paste fallback for power users.
     5. WordPress-style 9-direction position grid (中上 / 左中 / 右下 …)
        + Cover/Contain fit toggle. The chosen position is encoded as a
        URL fragment "#pos=top-left&fit=cover" so it persists on the
        saved URL string and the renderer can apply
        background-position / object-position consistently.
*/
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // ----- URL fragment encoding -----
  // We treat the # part of an image URL as a config bag for image
  // display. Format: "pos=top-left&fit=cover". Both keys optional.
  // Compact aliases on the wire: c=center, t=top, b=bottom, l=left,
  // r=right, tl=top-left, tr=top-right, bl=bottom-left, br=bottom-right.
  const POSITION_LABEL = {
    'center':       '居中',
    'top':          '中上',
    'bottom':       '中下',
    'left':         '左中',
    'right':        '右中',
    'top-left':     '左上',
    'top-right':    '右上',
    'bottom-left':  '左下',
    'bottom-right': '右下',
  };
  const POSITION_GRID = [
    ['top-left',   'top',    'top-right'],
    ['left',       'center', 'right'],
    ['bottom-left','bottom', 'bottom-right'],
  ];

  function parseImageUrl(rawUrl) {
    if (!rawUrl) return { url: '', position: 'center', fit: 'cover' };
    const hashIdx = rawUrl.indexOf('#');
    if (hashIdx === -1) return { url: rawUrl, position: 'center', fit: 'cover' };
    const url = rawUrl.slice(0, hashIdx);
    const frag = rawUrl.slice(hashIdx + 1);
    const params = {};
    for (const part of frag.split('&')) {
      const [k, v = ''] = part.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v);
    }
    return {
      url,
      position: params.pos && POSITION_LABEL[params.pos] ? params.pos : 'center',
      fit: params.fit === 'contain' ? 'contain' : 'cover',
    };
  }

  function encodeImageUrl(url, position, fit) {
    if (!url) return '';
    const cleanUrl = url.split('#')[0];
    const params = [];
    if (position && position !== 'center') params.push('pos=' + encodeURIComponent(position));
    if (fit && fit !== 'cover') params.push('fit=' + encodeURIComponent(fit));
    return params.length ? cleanUrl + '#' + params.join('&') : cleanUrl;
  }

  // ----- Mount -----
  function mount(containerId, opts) {
    opts = opts || {};
    const host = document.getElementById(containerId);
    if (!host) throw new Error('container_not_found:' + containerId);

    let { url, position, fit } = parseImageUrl(opts.initialUrl || '');

    function commitChange() {
      if (opts.onChange) opts.onChange(getCombined());
    }
    function getCombined() { return encodeImageUrl(url, position, fit); }

    function render() {
      const has = !!url;
      const cssPosition = position.replace(/-/g, ' ');  // top-left → "top left"
      host.classList.add('image-picker');
      const previewBg = has
        ? `background-image:url('${escapeHtml(url).replace(/'/g, "\\'")}');background-position:${cssPosition};background-size:${fit};background-repeat:no-repeat;`
        : 'background:#eef1f5;';
      // Inline styles everywhere so the picker renders correctly regardless of
      // whether admin.css is loaded / cached / supports a given selector.
      host.setAttribute('style', 'display:block;');
      host.innerHTML = `
        <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;">
          <div style="width:200px;height:120px;flex:0 0 auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;${previewBg}">
            ${has ? '' : '<span style="font-size:12px;color:#94a3b8;">暂无图片</span>'}
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button type="button" class="btn btn--primary btn--sm" data-action="upload">📤 上传新图</button>
            <button type="button" class="btn btn--ghost btn--sm" data-action="library">📁 从媒体库选</button>
            ${has ? '<button type="button" class="btn btn--ghost btn--sm" data-action="clear">清除</button>' : ''}
          </div>
        </div>
        ${has ? renderPositionPicker() : ''}
        <div style="margin-top:10px;">
          <input type="text" data-url placeholder="或直接粘贴 URL（http://, /uploads/, /assets/…）" value="${escapeHtml(getCombined())}" style="width:100%;font-size:12px;padding:7px 10px;border:1px solid #d1d5db;border-radius:8px;box-sizing:border-box;"/>
        </div>
      `;
      host.querySelector('[data-action="upload"]').addEventListener('click', upload);
      host.querySelector('[data-action="library"]').addEventListener('click', openLibrary);
      const clearBtn = host.querySelector('[data-action="clear"]');
      if (clearBtn) clearBtn.addEventListener('click', () => setValue(''));
      host.querySelector('[data-url]').addEventListener('input', (e) => {
        const parsed = parseImageUrl(e.target.value.trim());
        url = parsed.url; position = parsed.position; fit = parsed.fit;
        commitChange();
      });
      // Position grid
      host.querySelectorAll('[data-pos]').forEach((cell) => {
        cell.addEventListener('click', () => {
          position = cell.dataset.pos;
          render();
          commitChange();
        });
      });
      host.querySelectorAll('[data-fit]').forEach((b) => {
        b.addEventListener('click', () => {
          fit = b.dataset.fit;
          render();
          commitChange();
        });
      });
    }

    function renderPositionPicker() {
      const cell = (p) => {
        const a = p === position;
        return `<button type="button" data-pos="${p}" title="${POSITION_LABEL[p]}"
                  style="width:26px;height:26px;border:1px solid ${a ? '#2563eb' : '#cbd5e1'};border-radius:4px;cursor:pointer;background:${a ? '#2563eb' : '#fff'};padding:0;"></button>`;
      };
      const grid = POSITION_GRID.map((row) => row.map(cell).join('')).join('');
      const fitBtn = (val, label, title) => {
        const a = fit === val;
        return `<button type="button" data-fit="${val}" title="${title}"
                  style="border:1px solid ${a ? '#2563eb' : '#cbd5e1'};background:${a ? '#2563eb' : '#fff'};color:${a ? '#fff' : '#64748b'};border-radius:5px;padding:3px 10px;font-size:11px;cursor:pointer;">${label}</button>`;
      };
      return `
        <div style="margin-top:12px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
            <span style="font-size:12px;color:#64748b;">图像位置 <code>${POSITION_LABEL[position] || position}</code></span>
            <div style="display:flex;gap:4px;">
              ${fitBtn('cover', '填满', '填满（可能裁剪）')}
              ${fitBtn('contain', '适应', '适应（可能留白）')}
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,26px);gap:3px;">${grid}</div>
          <p style="font-size:11px;color:#94a3b8;margin:8px 0 0;line-height:1.5;">点 9 宫格选择图片在固定尺寸格子里的对齐方向。设置会跟着图片 URL 一起保存（<code>#pos=top-left</code>）。</p>
        </div>
      `;
    }

    function setValue(v) {
      const parsed = parseImageUrl(v || '');
      url = parsed.url; position = parsed.position; fit = parsed.fit;
      render();
      commitChange();
    }

    function upload() {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.style.display = 'none';
      document.body.appendChild(inp);
      inp.addEventListener('change', async () => {
        const file = inp.files && inp.files[0];
        inp.remove();
        if (!file) return;
        const btn = host.querySelector('[data-action="upload"]');
        if (btn) { btn.disabled = true; btn.textContent = '上传中…'; }
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('alt_text', file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '));
          const res = await fetch('/api/media', { method: 'POST', credentials: 'include', body: fd });
          const json = await res.json().catch(() => null);
          if (!res.ok || !json || !json.url) throw new Error((json && json.error) || ('HTTP ' + res.status));
          // New uploads start with the previously-selected position so the
          // operator's choice persists across replacements.
          setValue(encodeImageUrl(json.url, position, fit));
          if (window.AdminAPI && window.AdminAPI.toast) window.AdminAPI.toast('上传成功', 'success');
        } catch (err) {
          if (window.AdminAPI && window.AdminAPI.toast) window.AdminAPI.toast('上传失败：' + err.message, 'error');
          else alert('上传失败：' + err.message);
          if (btn) { btn.disabled = false; btn.textContent = '📤 上传新图'; }
        }
      });
      inp.click();
    }

    async function openLibrary() {
      let items = [];
      try {
        const res = await fetch('/api/media?limit=60', { credentials: 'include' });
        const json = await res.json();
        items = json.items || [];
      } catch (err) {
        if (window.AdminAPI && window.AdminAPI.toast) window.AdminAPI.toast('加载媒体库失败：' + err.message, 'error');
        return;
      }
      items = items.filter((m) => /^image\//i.test(m.mime || ''));

      // Fully inline-styled modal — does not depend on admin.css at all, so it
      // can't be broken by stylesheet caching, missing rules, or unsupported
      // CSS functions. Avoids min()/aspect-ratio for old-renderer safety.
      const overlay = document.createElement('div');
      overlay.className = 'image-picker-modal';
      overlay.style.cssText =
        'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;' +
        'background:rgba(15,23,42,0.55);display:flex;align-items:center;' +
        'justify-content:center;padding:24px;box-sizing:border-box;';

      const panelStyle =
        'background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.3);' +
        'width:100%;max-width:920px;max-height:85vh;display:flex;flex-direction:column;' +
        'overflow:hidden;box-sizing:border-box;';
      const headStyle =
        'display:flex;align-items:center;justify-content:space-between;' +
        'padding:16px 20px;border-bottom:1px solid #e5e7eb;flex:0 0 auto;';
      const bodyStyle =
        'padding:16px;overflow-y:auto;display:grid;align-content:start;' +
        'grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;';
      const itemStyle =
        'display:block;width:100%;padding:0;margin:0;border:2px solid transparent;' +
        'border-radius:10px;background:#f1f5f9;overflow:hidden;cursor:pointer;' +
        'text-align:left;-webkit-appearance:none;appearance:none;font:inherit;';
      // Use background-image divs instead of <img> to avoid replaced-element
      // rendering quirks where explicit height may be ignored by some browsers.
      const thumbStyle =
        'width:100%;height:120px;background-color:#e2e8f0;' +
        'background-size:cover;background-position:center;background-repeat:no-repeat;';
      const capStyle =
        'display:block;padding:6px 8px;font-size:11px;color:#64748b;background:#fff;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';

      overlay.innerHTML = `
        <div style="${panelStyle}">
          <div style="${headStyle}">
            <h3 style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">选择媒体库中的图片</h3>
            <button type="button" class="image-picker-modal__close" aria-label="关闭"
                    style="background:none;border:0;font-size:24px;line-height:1;cursor:pointer;color:#64748b;padding:2px 8px;">&times;</button>
          </div>
          <div style="${bodyStyle}">
            ${items.length ? items.map((m) => {
              const safeUrl = escapeHtml(m.url).replace(/'/g, '%27');
              return `<button type="button" class="image-picker-modal__item" data-url="${escapeHtml(m.url)}" title="${escapeHtml(m.original)}" style="${itemStyle}">
                <div style="${thumbStyle}background-image:url('${safeUrl}');"></div>
                <span style="${capStyle}">${escapeHtml((m.original || '').slice(0, 24))}</span>
              </button>`;
            }).join('') : '<div style="grid-column:1/-1;padding:48px;text-align:center;color:#64748b;">媒体库还没有图片，请先上传。</div>'}
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
      const onKey = (e) => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', onKey);
      overlay.querySelector('.image-picker-modal__close').addEventListener('click', close);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      overlay.querySelectorAll('.image-picker-modal__item').forEach((b) => {
        b.addEventListener('mouseenter', () => { b.style.borderColor = '#2563eb'; });
        b.addEventListener('mouseleave', () => { b.style.borderColor = 'transparent'; });
        b.addEventListener('click', () => {
          setValue(encodeImageUrl(b.dataset.url, position, fit));
          close();
        });
      });
    }

    render();
    return {
      getValue: () => getCombined(),
      setValue,
      destroy: () => { host.innerHTML = ''; host.classList.remove('image-picker'); },
    };
  }

  // Expose the parser/encoder so other admin scripts (iframe-text-editor,
  // media-overrides, …) can keep the fragment intact when manipulating URLs.
  window.ImagePicker = { mount, parseImageUrl, encodeImageUrl };
})();
