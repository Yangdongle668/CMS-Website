/* Reusable image-picker component. Used in admin pages that have an
   image URL field (hero_image, cover_url, og:image, avatar_url, …). The
   operator never has to know the URL — they upload, get a thumbnail
   preview, and the field auto-fills.

   Usage:
     window.ImagePicker.mount('hero-image-mount', {
       initialUrl: '/uploads/foo.png',
       label: 'Hero 大图',
       onChange: (url) => { ... },
     });
*/
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function mount(containerId, opts) {
    opts = opts || {};
    const host = document.getElementById(containerId);
    if (!host) throw new Error('container_not_found:' + containerId);
    let value = opts.initialUrl || '';

    function render() {
      const has = !!value;
      host.classList.add('image-picker');
      host.innerHTML = `
        <div class="image-picker__row">
          <div class="image-picker__preview${has ? '' : ' is-empty'}">
            ${has ? `<img src="${escapeHtml(value)}" alt="" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('is-broken')"/>` : '<span class="image-picker__placeholder">暂无图片</span>'}
          </div>
          <div class="image-picker__actions">
            <button type="button" class="btn btn--primary btn--sm" data-action="upload">📤 上传新图</button>
            <button type="button" class="btn btn--ghost btn--sm" data-action="library">📁 从媒体库选</button>
            ${has ? '<button type="button" class="btn btn--ghost btn--sm" data-action="clear">清除</button>' : ''}
          </div>
        </div>
        <div class="image-picker__url">
          <input type="text" data-url placeholder="或直接粘贴 URL（http://, /uploads/, /assets/…）" value="${escapeHtml(value)}"/>
        </div>
      `;
      host.querySelector('[data-action="upload"]').addEventListener('click', upload);
      host.querySelector('[data-action="library"]').addEventListener('click', openLibrary);
      const clearBtn = host.querySelector('[data-action="clear"]');
      if (clearBtn) clearBtn.addEventListener('click', () => setValue(''));
      host.querySelector('[data-url]').addEventListener('input', (e) => {
        value = e.target.value.trim();
        if (opts.onChange) opts.onChange(value);
      });
    }

    function setValue(v) {
      value = v || '';
      render();
      if (opts.onChange) opts.onChange(value);
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
          setValue(json.url);
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
      // Lazy-fetch the media list and present a modal grid.
      let items = [];
      try {
        const res = await fetch('/api/media?limit=60', { credentials: 'include' });
        const json = await res.json();
        items = json.items || [];
      } catch (err) {
        if (window.AdminAPI && window.AdminAPI.toast) window.AdminAPI.toast('加载媒体库失败：' + err.message, 'error');
        return;
      }
      // Filter to images only.
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
        b.addEventListener('click', () => { setValue(b.dataset.url); close(); });
      });
    }

    render();
    return {
      getValue: () => value,
      setValue,
      destroy: () => { host.innerHTML = ''; host.classList.remove('image-picker'); },
    };
  }

  window.ImagePicker = { mount };
})();
