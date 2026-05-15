// =====================================================================
// Page-builder runtime — runs INSIDE the admin page-builder iframe.
//
// Responsibilities:
//   - Mark every [data-block-id] block as hoverable/selectable
//   - When selected, show a toolbar (drag handle, up/down, delete)
//   - Make [data-edit-field] text inline-editable via contenteditable
//   - Debounce text changes and postMessage(parent, 'block-edit')
//   - Show + Add buttons between blocks; clicking posts 'insert-block'
//   - Intercept all clicks on links / forms so the editor stays in place
//   - Receive parent commands: select-block, refresh-block, scroll-to
//
// Parent (admin/page-builder.html) talks back via postMessage too.
// =====================================================================

(function () {
  'use strict';

  const PARENT = window.parent;
  function post(type, payload) {
    if (PARENT && PARENT !== window) {
      PARENT.postMessage(Object.assign({ source: 'cms-builder', type }, payload || {}), '*');
    }
  }

  // ----- Bootstrap -----
  document.documentElement.classList.add('cmsb-on');
  document.documentElement.dataset.cmsbReady = 'true';

  // Strip the existing visitor-flow JS that would interfere (mini-RFQ
  // panels are already CSS-hidden; we additionally prevent any other
  // page handlers from disturbing the editing experience).
  document.addEventListener('click', interceptClicks, true);
  document.addEventListener('submit', (ev) => ev.preventDefault(), true);

  function interceptClicks(ev) {
    const a = ev.target.closest('a');
    if (a && a.getAttribute('href')) {
      // Allow clicks INSIDE a contenteditable so the cursor lands properly
      const editable = ev.target.closest('[contenteditable="true"]');
      if (!editable) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    }
    // If clicking inside a block but not on the toolbar, select it
    const block = ev.target.closest('[data-block-id]');
    if (block && !ev.target.closest('.cmsb-toolbar') && !ev.target.closest('.cmsb-insert')) {
      selectBlock(block);
      // Also focus the field if it's a data-edit-field click
      const field = ev.target.closest('[data-edit-field]');
      if (field) {
        enableEdit(field);
      }
    } else if (!block && !ev.target.closest('.cmsb-insert')) {
      deselect();
    }
  }

  // ----- Block selection -----
  let selectedEl = null;
  function selectBlock(el) {
    if (selectedEl === el) return;
    deselect();
    selectedEl = el;
    el.classList.add('cmsb-selected');
    ensureToolbar(el);
    post('block-selected', { id: parseInt(el.dataset.blockId, 10), type: el.dataset.blockType });
  }
  function deselect() {
    if (selectedEl) {
      selectedEl.classList.remove('cmsb-selected');
      // Disable contenteditable on all fields of this block
      selectedEl.querySelectorAll('[contenteditable]').forEach((n) => {
        n.removeAttribute('contenteditable');
      });
      selectedEl = null;
      post('block-deselected');
    }
  }

  function ensureToolbar(el) {
    if (el.querySelector(':scope > .cmsb-toolbar')) return;
    const tb = document.createElement('div');
    tb.className = 'cmsb-toolbar';
    tb.innerHTML = `
      <span class="cmsb-toolbar__label" title="拖拽换位">⠿ ${escapeHtml(el.dataset.blockType || '')}</span>
      <button data-act="up" title="上移">↑</button>
      <button data-act="down" title="下移">↓</button>
      <button data-act="hide" title="隐藏">⊘</button>
      <button data-act="duplicate" title="复制">⎘</button>
      <button data-act="delete" title="删除">✕</button>
    `;
    // Toolbar lives inside the section so position:absolute against the section works
    el.appendChild(tb);
    tb.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button');
      if (!btn) return;
      ev.stopPropagation();
      const id = parseInt(el.dataset.blockId, 10);
      post('block-action', { id, action: btn.dataset.act });
    });
  }

  // ----- Inline edit (contenteditable + debounced post) -----
  const DEBOUNCE_MS = 600;
  const pendingEdits = new Map();   // blockId → { fieldKey: value }
  const editTimers = new Map();     // blockId → timer

  function enableEdit(fieldEl) {
    if (fieldEl.getAttribute('contenteditable') === 'true') {
      fieldEl.focus();
      return;
    }
    fieldEl.setAttribute('contenteditable', 'true');
    fieldEl.removeAttribute('data-empty');
    fieldEl.focus();
    // Move cursor to end
    try {
      const range = document.createRange();
      range.selectNodeContents(fieldEl);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (_) {}

    // Plain-text paste only
    fieldEl.addEventListener('paste', (ev) => {
      ev.preventDefault();
      const text = (ev.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });

    // Enter key should not insert <br> in plain heading fields
    const isMultiline = fieldEl.tagName === 'P' || fieldEl.tagName === 'BLOCKQUOTE';
    fieldEl.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && !ev.shiftKey && !isMultiline) {
        ev.preventDefault();
        fieldEl.blur();
      }
    });

    fieldEl.addEventListener('input', () => scheduleSave(fieldEl));
    fieldEl.addEventListener('blur', () => flushSave(fieldEl));
  }

  function readValue(fieldEl) {
    // For multiline fields keep paragraph breaks; for single-line strip
    return fieldEl.innerText.replace(/ /g, ' ').trim();
  }

  function scheduleSave(fieldEl) {
    const block = fieldEl.closest('[data-block-id]');
    if (!block) return;
    const id = parseInt(block.dataset.blockId, 10);
    const field = fieldEl.dataset.editField;
    if (!id || !field) return;
    if (!pendingEdits.has(id)) pendingEdits.set(id, {});
    pendingEdits.get(id)[field] = readValue(fieldEl);
    if (editTimers.has(id)) clearTimeout(editTimers.get(id));
    editTimers.set(id, setTimeout(() => flushSave(fieldEl), DEBOUNCE_MS));
  }

  function flushSave(fieldEl) {
    const block = fieldEl.closest('[data-block-id]');
    if (!block) return;
    const id = parseInt(block.dataset.blockId, 10);
    if (editTimers.has(id)) { clearTimeout(editTimers.get(id)); editTimers.delete(id); }
    const fields = pendingEdits.get(id);
    if (!fields) return;
    pendingEdits.delete(id);
    post('block-edit-partial', { id, fields });
  }

  // ----- Insert-between affordances -----
  function injectInsertSlots() {
    const root = document.querySelector('[data-blocks]');
    if (!root) return;
    // Remove any existing insert slots first (idempotent)
    root.querySelectorAll('.cmsb-insert').forEach((n) => n.remove());

    const blocks = [...root.querySelectorAll('[data-block-id]')];
    // Insert one slot BEFORE every block + one AFTER the last
    blocks.forEach((b) => {
      root.insertBefore(makeInsertSlot(b.dataset.blockId, 'before'), b);
    });
    if (blocks.length) {
      const last = blocks[blocks.length - 1];
      root.insertBefore(makeInsertSlot(last.dataset.blockId, 'after'), last.nextSibling);
    } else {
      // Empty page
      const placeholder = document.createElement('div');
      placeholder.className = 'cmsb-empty-page';
      placeholder.innerHTML = `
        <p>👋 这个页面还没有区块。</p>
        <p><strong>从右侧的"区块库"</strong>选一个开始 — 或点下面这个 + 按钮。</p>
        <p style="margin-top:14px;"><button class="cmsb-insert__btn" style="position:static; opacity:1; transform:none; padding:10px 20px; font-size:14px;" onclick="window.cmsb.requestInsert(null)">+ 添加第一个区块</button></p>
      `;
      root.appendChild(placeholder);
    }
  }

  function makeInsertSlot(refBlockId, position) {
    const slot = document.createElement('div');
    slot.className = 'cmsb-insert';
    slot.dataset.refId = refBlockId;
    slot.dataset.position = position;
    slot.innerHTML = `<button class="cmsb-insert__btn" type="button">+ 添加区块</button>`;
    slot.querySelector('button').addEventListener('click', (ev) => {
      ev.stopPropagation();
      slot.classList.add('is-active');
      post('insert-request', {
        ref_id: parseInt(refBlockId, 10) || null,
        position,
      });
      setTimeout(() => slot.classList.remove('is-active'), 800);
    });
    return slot;
  }

  // ----- Toast -----
  let toastEl = null;
  function toast(msg, kind) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'cmsb-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.className = 'cmsb-toast is-on ' + (kind ? 'is-' + kind : '');
    toastEl.textContent = msg;
    clearTimeout(toastEl.__t);
    toastEl.__t = setTimeout(() => { toastEl.classList.remove('is-on'); }, 1800);
  }

  // ----- Listen for parent messages -----
  window.addEventListener('message', (ev) => {
    const m = ev.data;
    if (!m || m.source !== 'cms-builder-parent') return;
    switch (m.type) {
      case 'select-block': {
        const el = document.querySelector(`[data-block-id="${m.id}"]`);
        if (el) {
          selectBlock(el);
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
      }
      case 'deselect':
        deselect();
        break;
      case 'toast':
        toast(m.text, m.kind);
        break;
      case 'block-saved':
        toast('✓ 已保存', 'ok');
        break;
      case 'reload':
        location.reload();
        break;
    }
  });

  // ----- Public surface for inline event handlers -----
  window.cmsb = {
    requestInsert(refId) {
      post('insert-request', { ref_id: refId, position: 'end' });
    },
  };

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
    }[c]));
  }

  // ----- Initial paint -----
  injectInsertSlots();

  // Re-inject slots whenever blocks are added/removed/reordered (the
  // parent triggers a reload for now; later we can hot-swap individual
  // blocks for smoother UX).
  post('ready', { url: location.pathname });
})();
