/* Click-to-edit text overlay for the live preview iframe in /admin/pages.html.
 *
 * The iframe is same-origin (admin and public pages live on the same
 * host), so we can reach into iframe.contentDocument and:
 *   1. Inject a small stylesheet that outlines text elements on hover.
 *   2. Mark text-bearing elements with data-cms-editable + the original
 *      text content so we can match them later in the override map.
 *   3. Bind a click listener that opens an edit modal in the PARENT
 *      window (so the modal styles don't fight the iframe's CSS).
 *
 * On save, we PATCH /api/text-overrides with { from, to }. The server's
 * html-tokens middleware applies the override on every subsequent HTML
 * response — public visitors see the new text immediately, even though
 * none of the source files were edited. Click "清除" on the modal to
 * remove the override (restores the original).
 */
(function () {
  'use strict';

  // Tags whose text content is allowed to be inline-edited. Other tags
  // (containers, layout wrappers, scripts) are ignored. Inline-formatting
  // children (<em>, <strong>, <code>, <br>) are tolerated within these.
  const EDITABLE_TAGS = new Set([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'li', 'em', 'strong', 'blockquote',
    'button', 'a', 'td', 'th', 'span', 'figcaption',
    'summary', 'dt', 'dd', 'label',
  ]);
  const ALLOWED_INLINE_CHILDREN = new Set(['br', 'em', 'strong', 'i', 'b', 'code', 'u', 'small']);

  // Plain-text snapshot of an element. Multi-space → single space so the
  // override key matches what the operator clicks on screen.
  function plainText(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  // Decide whether an element is a leaf text node we should make editable.
  function isEditable(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (!EDITABLE_TAGS.has(tag)) return false;
    // Skip empty / whitespace-only nodes.
    const txt = plainText(el);
    if (!txt || txt.length < 2 || txt.length > 5000) return false;
    // Skip if inside <script>, <style>, or admin chrome.
    if (el.closest('script,style,[data-cms-skip]')) return false;
    // Skip <a> tags whose text is just a URL or icon glyph.
    if (tag === 'a' && /^(https?:\/\/|www\.)/i.test(txt)) return false;
    // Reject nodes with non-inline children (so we don't accidentally
    // try to overwrite a <div> wrapper that contains H1+P).
    for (const child of el.children) {
      if (!ALLOWED_INLINE_CHILDREN.has(child.tagName.toLowerCase())) return false;
    }
    return true;
  }

  function injectStyles(doc) {
    if (doc.getElementById('__cms_editor_style')) return;
    const s = doc.createElement('style');
    s.id = '__cms_editor_style';
    s.textContent = `
      [data-cms-editable] {
        position: relative;
        outline: 2px dashed transparent;
        outline-offset: 2px;
        cursor: pointer !important;
        transition: outline-color 0.12s ease, background-color 0.12s ease;
      }
      [data-cms-editable]:hover {
        outline-color: #f5a623;
        background: rgba(245, 166, 35, 0.08);
      }
      [data-cms-edited] {
        outline-color: #22c55e !important;
        background: rgba(34, 197, 94, 0.06);
      }
      [data-cms-editable]::after {
        content: "✎";
        position: absolute;
        right: -22px;
        top: -2px;
        font-size: 14px;
        color: #f5a623;
        opacity: 0;
        transition: opacity 0.12s ease;
        pointer-events: none;
      }
      [data-cms-editable]:hover::after { opacity: 1; }
    `;
    doc.head.appendChild(s);
  }

  function markEditableElements(doc, currentOverrides) {
    // Walk every element in body. Cheaper than a TreeWalker because we
    // need element nodes, not text nodes.
    const all = doc.body ? doc.body.querySelectorAll('*') : [];
    for (const el of all) {
      if (!isEditable(el)) continue;
      const original = plainText(el);
      el.setAttribute('data-cms-editable', '');
      el.setAttribute('data-cms-original', original);
      // Mark elements whose currently-displayed text is the target side
      // of an existing override (so the operator sees what's been edited).
      for (const [from, to] of Object.entries(currentOverrides || {})) {
        if (to === original) {
          el.setAttribute('data-cms-edited', '');
          el.setAttribute('data-cms-override-source', from);
          break;
        }
      }
    }
  }

  function enable(iframe, opts) {
    opts = opts || {};
    const doc = iframe.contentDocument;
    if (!doc || !doc.body) return;
    injectStyles(doc);
    markEditableElements(doc, opts.overrides || {});

    // Click listener at body level; one handler covers every editable.
    doc.body.addEventListener('click', (ev) => {
      const target = ev.target.closest('[data-cms-editable]');
      if (!target) return;
      // Block link navigation while editing.
      ev.preventDefault();
      ev.stopPropagation();
      const original = target.getAttribute('data-cms-override-source')
        || target.getAttribute('data-cms-original') || plainText(target);
      const current = plainText(target);
      openEditModal({
        from: original,
        to: current,
        tag: target.tagName.toLowerCase(),
        onSave: opts.onSave,
        iframe,
      });
    }, true);

    // Click anywhere else inside the iframe still works (forms, etc.)
    // because we only swallow events from data-cms-editable nodes.
  }

  /* Modal lives in the PARENT document so the iframe's CSS can't break
     its layout. */
  function openEditModal({ from, to, tag, onSave, iframe }) {
    const overlay = document.createElement('div');
    overlay.className = 'image-picker-modal'; // reuse the modal CSS
    overlay.innerHTML = `
      <div class="image-picker-modal__panel" style="max-width: 600px;">
        <div class="image-picker-modal__head">
          <h3>编辑 &lt;${tag}&gt; 文字</h3>
          <button type="button" class="image-picker-modal__close" aria-label="关闭">&times;</button>
        </div>
        <div style="padding: 18px 20px;">
          <div style="font-size:12px; color:#5c5e62; margin-bottom:6px; letter-spacing:1px; text-transform:uppercase;">原文</div>
          <pre data-text-from style="background:#f5f5f7; padding:10px 12px; border-radius:4px; font-size:13px; color:#171a20; white-space:pre-wrap; word-break:break-word; max-height:140px; overflow:auto; margin:0 0 18px; font-family:inherit;"></pre>
          <div style="font-size:12px; color:#5c5e62; margin-bottom:6px; letter-spacing:1px; text-transform:uppercase;">替换为</div>
          <textarea data-text-to rows="4" style="width:100%; padding:10px 12px; border:1px solid #e4e4e4; border-radius:4px; font-size:14px; line-height:1.55; font-family:inherit; resize:vertical;"></textarea>
          <p style="font-size:12px; color:#5c5e62; margin-top:10px;">
            ⚠️ 同一段文字在多个页面出现时会全部一起改。希望仅在某一页改动？请用左侧的 hero 字段（首页/特定页）。
          </p>
        </div>
        <div style="padding:12px 20px; border-top:1px solid #e4e4e4; display:flex; gap:8px; justify-content:flex-end; align-items:center;">
          <button type="button" data-edit-clear style="margin-right:auto; background:none; border:1px solid #e4e4e4; padding:8px 14px; border-radius:4px; cursor:pointer; font-size:13px; color:#dc2626;">清除此项替换</button>
          <button type="button" data-edit-cancel style="background:none; border:1px solid #e4e4e4; padding:8px 14px; border-radius:4px; cursor:pointer; font-size:13px;">取消</button>
          <button type="button" data-edit-save style="background:#0b3a82; color:#fff; border:none; padding:8px 18px; border-radius:4px; cursor:pointer; font-size:13px; font-weight:500;">保存</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-text-from]').textContent = from;
    const ta = overlay.querySelector('[data-text-to]');
    ta.value = to;
    setTimeout(() => ta.focus(), 50);

    function close() { overlay.remove(); }
    overlay.querySelector('.image-picker-modal__close').addEventListener('click', close);
    overlay.querySelector('[data-edit-cancel]').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('[data-edit-save]').addEventListener('click', async () => {
      const newVal = ta.value;
      try {
        await fetch('/api/text-overrides', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ from, to: newVal }),
        }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
        if (onSave) onSave({ from, to: newVal, removed: !newVal || newVal === from });
        close();
        if (iframe) iframe.contentWindow.location.reload();
      } catch (err) {
        if (window.AdminAPI && window.AdminAPI.toast) window.AdminAPI.toast('保存失败：' + err.message, 'error');
        else alert('保存失败：' + err.message);
      }
    });
    overlay.querySelector('[data-edit-clear]').addEventListener('click', async () => {
      try {
        await fetch('/api/text-overrides', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ from, to: '' }),
        }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
        if (onSave) onSave({ from, to: '', removed: true });
        close();
        if (iframe) iframe.contentWindow.location.reload();
      } catch (err) {
        if (window.AdminAPI && window.AdminAPI.toast) window.AdminAPI.toast('清除失败：' + err.message, 'error');
        else alert('清除失败：' + err.message);
      }
    });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
    });
  }

  window.IframeTextEditor = { enable };
})();
