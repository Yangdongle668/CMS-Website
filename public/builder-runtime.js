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
    // Click on an [data-edit-image] inline image: open media picker via parent
    const imgEdit = ev.target.closest('[data-edit-image]');
    if (imgEdit) {
      ev.preventDefault();
      ev.stopPropagation();
      const block = imgEdit.closest('[data-block-id]');
      if (block) {
        const id = parseInt(block.dataset.blockId, 10);
        const field = imgEdit.dataset.editImage;
        selectBlock(block);
        post('image-edit-request', { id, field });
      }
      return;
    }
    // Click on the "Change background" floating button (injected on selection)
    if (ev.target.closest('.cmsb-edit-bg-btn')) {
      ev.preventDefault();
      ev.stopPropagation();
      const block = ev.target.closest('[data-block-id]');
      const field = block && block.dataset.editBg;
      if (block && field) {
        post('image-edit-request', {
          id: parseInt(block.dataset.blockId, 10),
          field,
        });
      }
      return;
    }
    const a = ev.target.closest('a');
    if (a && a.getAttribute('href')) {
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
      const field = ev.target.closest('[data-edit-field]');
      if (field) {
        enableEdit(field);
      }
    } else if (!block && !ev.target.closest('.cmsb-insert')) {
      deselect();
    }
  }

  // ----- Drag-and-drop state -----
  let draggedBlockId = null;
  // When the parent's sidebar library tile is being dragged, this holds
  // the block_type so drop zones know to insert (not reorder).
  let pendingLibraryType = null;

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
    if (!el.querySelector(':scope > .cmsb-toolbar')) {
      const tb = document.createElement('div');
      tb.className = 'cmsb-toolbar';
      tb.innerHTML = `
        <span class="cmsb-toolbar__label" draggable="true" title="拖拽换位">⠿ ${escapeHtml(el.dataset.blockType || '')}</span>
        <button data-act="up" title="上移">↑</button>
        <button data-act="down" title="下移">↓</button>
        <button data-act="hide" title="隐藏">⊘</button>
        <button data-act="duplicate" title="复制">⎘</button>
        <button data-act="delete" title="删除">✕</button>
      `;
      el.appendChild(tb);
      tb.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        ev.stopPropagation();
        const id = parseInt(el.dataset.blockId, 10);
        post('block-action', { id, action: btn.dataset.act });
      });

      // ----- Drag-to-reorder wiring on the handle -----
      const handle = tb.querySelector('.cmsb-toolbar__label');
      handle.addEventListener('dragstart', (ev) => {
        draggedBlockId = parseInt(el.dataset.blockId, 10);
        ev.dataTransfer.effectAllowed = 'move';
        try { ev.dataTransfer.setData('text/plain', String(draggedBlockId)); } catch (_) {}
        document.documentElement.classList.add('cmsb-is-dragging');
        el.classList.add('cmsb-being-dragged');
      });
      handle.addEventListener('dragend', () => {
        document.documentElement.classList.remove('cmsb-is-dragging');
        document.querySelectorAll('.cmsb-being-dragged').forEach((e) => e.classList.remove('cmsb-being-dragged'));
        draggedBlockId = null;
      });
    }

    // Floating "Change image" button for blocks with a [data-edit-bg]
    // field. We inject ONLY on selection (not on every render) so the
    // affordance doesn't compete with normal hover/click on visitors.
    if (el.dataset.editBg && !el.querySelector(':scope > .cmsb-edit-bg-btn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cmsb-edit-bg-btn';
      btn.innerHTML = '📷 <span>换背景图</span>';
      el.appendChild(btn);
    }
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
    // Rich fields preserve formatting tags (b/i/a/strong/em); plain
    // fields take just innerText. We normalise <b>/<i> to <strong>/<em>
    // for cleaner output markup.
    if (fieldEl.dataset.editRich === '1') {
      let html = fieldEl.innerHTML;
      html = html.replace(/&nbsp;/g, ' ');
      html = html.replace(/<b(\s|>)/g, '<strong$1').replace(/<\/b>/g, '</strong>');
      html = html.replace(/<i(\s|>)/g, '<em$1').replace(/<\/i>/g, '</em>');
      return html.trim();
    }
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
    slot.className = 'cmsb-insert cmsb-dropzone';
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

    // ----- Drop target — for both block-reorder AND library-drop -----
    slot.addEventListener('dragover', (ev) => {
      if (draggedBlockId == null && pendingLibraryType == null) return;
      ev.preventDefault();
      ev.dataTransfer.dropEffect = pendingLibraryType ? 'copy' : 'move';
      slot.classList.add('is-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('is-over'));
    slot.addEventListener('drop', (ev) => {
      const refId = parseInt(refBlockId, 10) || null;
      if (pendingLibraryType) {
        // Sidebar tile drop → insert new block
        ev.preventDefault();
        slot.classList.remove('is-over');
        post('block-insert-drop', {
          block_type: pendingLibraryType,
          ref_id: refId,
          position,
        });
        pendingLibraryType = null;
        document.documentElement.classList.remove('cmsb-is-dragging');
        return;
      }
      if (draggedBlockId != null) {
        // Existing block drag → reorder
        ev.preventDefault();
        slot.classList.remove('is-over');
        const fromId = draggedBlockId;
        if (fromId && refId && fromId !== refId) {
          post('block-reorder', { from_id: fromId, ref_id: refId, position });
        }
        draggedBlockId = null;
      }
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

  // ----- Floating rich-text toolbar -----
  // Shows above the active selection while typing/selecting inside a
  // [data-edit-rich] contenteditable. Bold / Italic / Link only — a
  // deliberately tiny set; complex formatting belongs in the rich-text
  // block (which uses a full editor). Uses document.execCommand for
  // simplicity — deprecated by spec but still universally supported by
  // browsers and the cleanest path for selection-based formatting.
  let rtBar = null;
  let rtLinkInput = null;

  function ensureRtBar() {
    if (rtBar) return rtBar;
    rtBar = document.createElement('div');
    rtBar.className = 'cmsb-rt-bar';
    rtBar.innerHTML = `
      <button type="button" data-rt="bold" title="加粗 (Ctrl+B)"><strong>B</strong></button>
      <button type="button" data-rt="italic" title="斜体 (Ctrl+I)"><em>I</em></button>
      <span class="cmsb-rt-bar__sep"></span>
      <button type="button" data-rt="link" title="加链接">🔗</button>
      <button type="button" data-rt="unlink" title="去掉链接">⊘🔗</button>
    `;
    document.body.appendChild(rtBar);
    rtBar.addEventListener('mousedown', (ev) => {
      // Buttons must not steal focus from the contenteditable
      ev.preventDefault();
    });
    rtBar.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button');
      if (!btn) return;
      ev.preventDefault();
      const cmd = btn.dataset.rt;
      if (cmd === 'bold' || cmd === 'italic') {
        document.execCommand(cmd, false, null);
        syncRtBarState();
        // Trigger save on the active field
        const active = document.activeElement;
        if (active && active.closest && active.closest('[data-edit-rich]')) {
          scheduleSave(active.closest('[data-edit-rich]'));
        }
      } else if (cmd === 'link') {
        promptForLink();
      } else if (cmd === 'unlink') {
        document.execCommand('unlink', false, null);
        const active = document.activeElement;
        if (active && active.closest && active.closest('[data-edit-rich]')) {
          scheduleSave(active.closest('[data-edit-rich]'));
        }
      }
    });
    return rtBar;
  }

  function promptForLink() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      toast('先选中要变成链接的文字');
      return;
    }
    // Save the range — focusing the input will lose it otherwise
    const range = sel.getRangeAt(0).cloneRange();
    rtBar.innerHTML = `<input type="url" placeholder="https://…" autocomplete="off"><button data-rt="link-ok">✓</button><button data-rt="link-cancel">×</button>`;
    const input = rtBar.querySelector('input');
    rtLinkInput = input;
    // Pre-fill if the selection is already inside an anchor
    const a = range.startContainer.parentElement && range.startContainer.parentElement.closest('a');
    if (a) input.value = a.getAttribute('href') || '';
    setTimeout(() => input.focus(), 0);

    function commit(cancel) {
      const url = cancel ? null : input.value.trim();
      // Restore selection
      sel.removeAllRanges();
      sel.addRange(range);
      if (url) {
        document.execCommand('createLink', false, url);
        // Ensure target=_blank for external
        const newA = sel.anchorNode && sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest('a');
        if (newA && /^https?:\/\//i.test(url)) {
          newA.setAttribute('target', '_blank');
          newA.setAttribute('rel', 'noopener');
        }
        const editField = sel.anchorNode && sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest('[data-edit-rich]');
        if (editField) scheduleSave(editField);
      }
      // Rebuild toolbar with original buttons
      rtBar.innerHTML = '';
      rtBar.remove();
      rtBar = null;
      ensureRtBar();
      syncRtBarState();
    }
    rtBar.addEventListener('click', (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      ev.preventDefault();
      commit(b.dataset.rt === 'link-cancel');
    }, { once: false });
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); commit(false); }
      if (ev.key === 'Escape') { ev.preventDefault(); commit(true); }
    });
  }

  function positionRtBar() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { hideRtBar(); return; }
    const anchor = sel.anchorNode && sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
    if (!anchor) { hideRtBar(); return; }
    const field = anchor.closest && anchor.closest('[data-edit-rich]');
    if (!field) { hideRtBar(); return; }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || rect.width + rect.height === 0) { hideRtBar(); return; }
    ensureRtBar();
    const x = rect.left + rect.width / 2 + window.scrollX;
    const y = rect.top + window.scrollY;
    rtBar.style.left = x + 'px';
    rtBar.style.top = y + 'px';
    rtBar.classList.add('is-on');
    syncRtBarState();
  }

  function hideRtBar() {
    if (rtBar) rtBar.classList.remove('is-on');
  }

  function syncRtBarState() {
    if (!rtBar) return;
    const sel = window.getSelection();
    if (!sel) return;
    const isBold = document.queryCommandState && document.queryCommandState('bold');
    const isItalic = document.queryCommandState && document.queryCommandState('italic');
    const bBtn = rtBar.querySelector('[data-rt="bold"]');
    const iBtn = rtBar.querySelector('[data-rt="italic"]');
    if (bBtn) bBtn.classList.toggle('is-active', !!isBold);
    if (iBtn) iBtn.classList.toggle('is-active', !!isItalic);
  }

  document.addEventListener('selectionchange', () => {
    // Debounce a hair so the rt bar doesn't flicker during arrow-key
    // selection extension.
    clearTimeout(window.__cmsbRtT);
    window.__cmsbRtT = setTimeout(positionRtBar, 50);
  });

  // ----- Sidebar-library drag-to-canvas -----
  // Parent posts 'library-drag-start' with the block_type when an admin
  // begins dragging a tile out of the right-side library. We add the
  // same .cmsb-is-dragging class the in-iframe handle uses, so drop
  // zones light up. On drop, we post 'block-insert' (vs reorder).
  window.addEventListener('message', (ev) => {
    const m = ev.data;
    if (!m || m.source !== 'cms-builder-parent') return;
    if (m.type === 'library-drag-start') {
      pendingLibraryType = m.block_type || null;
      document.documentElement.classList.add('cmsb-is-dragging');
    } else if (m.type === 'library-drag-end') {
      pendingLibraryType = null;
      document.documentElement.classList.remove('cmsb-is-dragging');
    }
  });

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
    }[c]));
  }

  // ----- Initial paint -----
  injectInsertSlots();

  post('ready', { url: location.pathname });
})();
