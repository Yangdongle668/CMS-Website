/* Inline editing inside the preview iframe.
 *
 * Click a heading or a paragraph on the page and change it there, which is the
 * one thing the old text-override layer genuinely got right. What is different
 * is where the edit goes: the override layer stored { "原文": "新文" } and
 * replaced that string everywhere it appeared, so changing "Learn More" on one
 * page changed it on twelve, and an edit silently vanished the moment a
 * developer touched the markup. Here the click resolves to one field of one
 * block row, and nothing outside that row can be affected.
 *
 * Loaded only into a preview served with ?__edit=1 to a signed-in operator.
 * It never ships to a visitor.
 *
 * How an element is matched to a field: the server stamps each block with its
 * own copy fields in data-block-fields, and this walks the block's elements
 * looking for one whose text is exactly that field's value. Matching inside a
 * single block is what keeps it honest — two blocks may both say "Learn more"
 * and they stay independent.
 */
(function () {
  'use strict';

  if (window.__cmsInlineEdit) return;
  window.__cmsInlineEdit = true;

  var RICH = { richtext: true };
  var active = null;      // the element currently being edited
  var activeMeta = null;  // { blockId, field, type, original }

  // ---------- marking ----------

  function parseFields(el) {
    try {
      return JSON.parse(el.getAttribute('data-block-fields') || '{}');
    } catch (_) {
      return {};
    }
  }

  var norm = function (s) {
    return String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  };

  // Strips tags so a richtext field's stored value can be compared with what
  // the browser actually rendered.
  function textOf(html) {
    var d = document.createElement('div');
    d.innerHTML = String(html == null ? '' : html);
    return norm(d.textContent);
  }

  function markBlock(block) {
    var fields = parseFields(block);
    var keys = Object.keys(fields);
    if (!keys.length) return;

    // Deepest match wins. A field's text also appears in every ancestor's
    // textContent, so matching the outermost element would put the whole
    // section into an editor when the operator clicked one heading.
    var candidates = block.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,li,div,td,th,figcaption,blockquote,a,time,strong,em');

    keys.forEach(function (key) {
      var spec = fields[key];
      var want = RICH[spec.type] ? textOf(spec.value) : norm(spec.value);
      if (!want) return;
      var best = null;
      for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        if (el.hasAttribute('data-cms-field')) continue;
        if (norm(el.textContent) !== want) continue;
        // Prefer the smallest element that still holds the whole value.
        if (!best || best.contains(el)) best = el;
      }
      if (!best) return;
      best.setAttribute('data-cms-field', key);
      best.setAttribute('data-cms-field-type', spec.type || 'text');
      best.setAttribute('data-cms-field-label', spec.label || key);
      best.setAttribute('title', '点击编辑：' + (spec.label || key));
    });
  }

  function markAll() {
    var blocks = document.querySelectorAll('[data-block-id]');
    for (var i = 0; i < blocks.length; i++) markBlock(blocks[i]);
    report();
  }

  function report() {
    parent.postMessage({
      source: 'cms-inline-edit',
      type: 'ready',
      editable: document.querySelectorAll('[data-cms-field]').length,
      blocks: document.querySelectorAll('[data-block-id]').length,
    }, location.origin);
  }

  // ---------- editing ----------

  function blockOf(el) {
    for (var p = el; p && p !== document.body; p = p.parentElement) {
      if (p.hasAttribute && p.hasAttribute('data-block-id')) return p;
    }
    return null;
  }

  function begin(el) {
    if (active) return;
    var block = blockOf(el);
    if (!block) return;

    active = el;
    activeMeta = {
      blockId: Number(block.getAttribute('data-block-id')),
      field: el.getAttribute('data-cms-field'),
      type: el.getAttribute('data-cms-field-type') || 'text',
      // Compared on save so an untouched element is not written back — a
      // no-op write would still bump updated_at and show up in the audit log
      // as an edit that never happened.
      original: el.innerHTML,
    };

    // "true" rather than "plaintext-only" even for plain fields: plaintext-only
    // is not supported everywhere (Firefox only got it recently) and where it
    // is unsupported the attribute is invalid and the element does not become
    // editable at all — the operator clicks and nothing happens. Pasted markup
    // is handled on the way out instead, where finish() stores textContent for
    // anything that is not a richtext field.
    el.setAttribute('contenteditable', 'true');
    el.classList.add('cms-editing');
    el.focus();

    // Put the caret where the operator clicked rather than at the start.
    try {
      var sel = window.getSelection();
      if (sel && sel.rangeCount === 0) {
        var r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(false);
        sel.addRange(r);
      }
    } catch (_) { /* caret placement is a nicety */ }

    parent.postMessage({
      source: 'cms-inline-edit',
      type: 'begin',
      blockId: activeMeta.blockId,
      field: activeMeta.field,
      label: el.getAttribute('data-cms-field-label') || activeMeta.field,
    }, location.origin);
  }

  function finish(commit) {
    if (!active) return;
    var el = active;
    var meta = activeMeta;
    active = null;
    activeMeta = null;

    el.removeAttribute('contenteditable');
    el.classList.remove('cms-editing');

    if (!commit) {
      el.innerHTML = meta.original;
      parent.postMessage({ source: 'cms-inline-edit', type: 'cancel' }, location.origin);
      return;
    }
    if (el.innerHTML === meta.original) {
      parent.postMessage({ source: 'cms-inline-edit', type: 'cancel' }, location.origin);
      return;
    }

    // A plain field stores text; a richtext field stores markup. Sending the
    // wrong one either escapes the operator's HTML into visible angle brackets
    // or hands the sanitiser a blob of nothing.
    var value = RICH[meta.type] ? el.innerHTML : el.textContent;

    parent.postMessage({
      source: 'cms-inline-edit',
      type: 'save',
      blockId: meta.blockId,
      field: meta.field,
      value: value,
    }, location.origin);
  }

  // ---------- wiring ----------

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest ? ev.target.closest('[data-cms-field]') : null;
    if (el) {
      // A link inside editable copy must not navigate the preview away.
      ev.preventDefault();
      ev.stopPropagation();
      if (el !== active) {
        if (active) finish(true);
        begin(el);
      }
      return;
    }
    // Clicking off the field commits it, which is what "click away" means
    // everywhere else.
    if (active && !active.contains(ev.target)) finish(true);
  }, true);

  document.addEventListener('keydown', function (ev) {
    if (!active) return;
    if (ev.key === 'Escape') {
      ev.preventDefault();
      finish(false);
      return;
    }
    // Enter commits a single-line field; rich text keeps it for paragraphs.
    if (ev.key === 'Enter' && !ev.shiftKey && !RICH[activeMeta.type]) {
      ev.preventDefault();
      finish(true);
    }
  }, true);

  window.addEventListener('message', function (ev) {
    if (ev.origin !== location.origin) return;
    var m = ev.data;
    if (!m || m.source !== 'cms-inline-host') return;
    if (m.type === 'commit') finish(true);
    if (m.type === 'cancel') finish(false);
    if (m.type === 'rescan') markAll();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markAll, { once: true });
  } else {
    markAll();
  }
  // Blocks that render from an API call after first paint (article_list) mark
  // late, so re-sweep when the DOM settles rather than only once.
  var settle = null;
  new MutationObserver(function () {
    clearTimeout(settle);
    settle = setTimeout(markAll, 200);
  }).observe(document.body, { childList: true, subtree: true });
})();
