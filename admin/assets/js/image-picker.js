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
      host.innerHTML = `
        <div class="image-picker__row">
          <div class="image-picker__preview${has ? '' : ' is-empty'}"
               style="${has ? `background-image:url('${escapeHtml(url).replace(/'/g, "\\'")}'); background-position:${cssPosition}; background-size:${fit};` : ''}">
            ${has ? '' : '<span class="image-picker__placeholder">暂无图片</span>'}
          </div>
          <div class="image-picker__actions">
            <button type="button" class="btn btn--primary btn--sm" data-action="upload">📤 上传新图</button>
            <button type="button" class="btn btn--ghost btn--sm" data-action="library">📁 从媒体库选</button>
            ${has ? '<button type="button" class="btn btn--ghost btn--sm" data-action="clear">清除</button>' : ''}
          </div>
        </div>
        ${has ? renderPositionPicker() : ''}
        <div class="image-picker__url">
          <input type="text" data-url placeholder="或直接粘贴 URL（http://, /uploads/, /assets/…）" value="${escapeHtml(getCombined())}"/>
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
      const grid = POSITION_GRID.map((row) =>
        row.map((p) => {
          const isActive = p === position;
          return `<button type="button" class="img-pos__cell${isActive ? ' is-active' : ''}"
                          data-pos="${p}" title="${POSITION_LABEL[p]}"></button>`;
        }).join('')
      ).join('');
      return `
        <div class="img-pos">
          <div class="img-pos__head">
            <span class="img-pos__title">图像位置 <code>${POSITION_LABEL[position] || position}</code></span>
            <div class="img-pos__fit">
              <button type="button" class="img-pos__fit-btn${fit === 'cover' ? ' is-active' : ''}"   data-fit="cover"   title="填满（可能裁剪）">填满</button>
              <button type="button" class="img-pos__fit-btn${fit === 'contain' ? ' is-active' : ''}" data-fit="contain" title="适应（可能留白）">适应</button>
            </div>
          </div>
          <div class="img-pos__grid">${grid}</div>
          <p class="img-pos__hint">点 9 宫格选择图片在固定尺寸格子里的对齐方向。设置会跟着图片 URL 一起保存（<code>#pos=top-left</code>）。</p>
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
      const overlay = document.createElement('div');
      overlay.className = 'image-picker-modal';
      overlay.innerHTML = `
        <div class="image-picker-modal__panel">
          <div class="image-picker-modal__head">
            <h3>选择媒体库中的图片</h3>
            <button type="button" class="image-picker-modal__close" aria-label="关闭">&times;</button>
          </div>
          <div class="image-picker-modal__body">
            ${items.length ? items.map((m) => `
              <button type="button" class="image-picker-modal__item" data-url="${escapeHtml(m.url)}" title="${escapeHtml(m.original)}">
                <img src="${escapeHtml(m.url)}" alt="" loading="lazy"/>
                <span>${escapeHtml((m.original || '').slice(0, 24))}</span>
              </button>
            `).join('') : '<div style="padding:40px; text-align:center; color:#5c5e62;">媒体库还没有图片，请先上传。</div>'}
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const close = () => overlay.remove();
      overlay.querySelector('.image-picker-modal__close').addEventListener('click', close);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      overlay.querySelectorAll('.image-picker-modal__item').forEach((b) => {
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
