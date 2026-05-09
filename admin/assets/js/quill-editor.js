/* ===========================================================
   Shared visual-editor helper used by /admin/articles.html and
   /admin/pages.html. Wraps Quill 2.0 with:
     - Heading 1/2/3, paragraph, list, bold/italic/underline/link
     - Inline blockquote + code-block
     - Image button that uploads to /api/media (no base64 bloat)
     - "查看 HTML" toggle that shows the underlying HTML for power users
   Quill is loaded from jsdelivr CDN at the page level (loadQuill below).
   =========================================================== */
(function () {
  'use strict';

  const QUILL_VERSION = '2.0.3';
  const QUILL_CSS = `https://cdn.jsdelivr.net/npm/quill@${QUILL_VERSION}/dist/quill.snow.css`;
  const QUILL_JS  = `https://cdn.jsdelivr.net/npm/quill@${QUILL_VERSION}/dist/quill.js`;

  let loaderPromise = null;
  function loadQuill() {
    if (window.Quill) return Promise.resolve(window.Quill);
    if (loaderPromise) return loaderPromise;
    loaderPromise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = QUILL_CSS;
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = QUILL_JS;
      script.onload = () => resolve(window.Quill);
      script.onerror = () => reject(new Error('quill-load-failed'));
      document.head.appendChild(script);
    });
    return loaderPromise;
  }

  /* Initialise Quill on a container element. Returns an object with
     getHtml() / setHtml() / destroy() methods so the caller doesn't need
     to know about Quill internals. */
  async function mount(containerId, initialHtml, opts) {
    opts = opts || {};
    const Quill = await loadQuill();
    const host = document.getElementById(containerId);
    if (!host) throw new Error('container_not_found:' + containerId);
    // Build the DOM scaffold:
    //  <div class="quill-shell">
    //    <div class="quill-target">         ← Quill's editable surface
    //    <div class="quill-html-view" hidden> ← raw HTML textarea
    //    <button class="quill-toggle">           ← rich ↔ HTML
    host.classList.add('quill-shell');
    host.innerHTML = `
      <div class="quill-target"></div>
      <textarea class="quill-html-view" hidden rows="18" spellcheck="false"></textarea>
      <div class="quill-foot">
        <button type="button" class="quill-toggle" data-mode="rich">查看 HTML 源代码</button>
        <span class="quill-hint">支持标题 / 列表 / 加粗 / 斜体 / 链接 / 引用 / 代码 / 图片上传</span>
      </div>
    `;
    const editorEl = host.querySelector('.quill-target');
    const sourceEl = host.querySelector('.quill-html-view');
    const toggleBtn = host.querySelector('.quill-toggle');

    const quill = new Quill(editorEl, {
      theme: 'snow',
      placeholder: opts.placeholder || '在此撰写内容…',
      modules: {
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            [{ align: [] }],
            ['clean'],
          ],
          handlers: {
            image: () => uploadImageToMedia(quill),
          },
        },
      },
    });
    if (initialHtml) quill.clipboard.dangerouslyPasteHTML(initialHtml);

    /* Toggle between rich-view and raw-HTML-view. We sync content in
       both directions on toggle so power users can edit raw HTML and
       see the result rendered when they switch back. */
    toggleBtn.addEventListener('click', () => {
      if (toggleBtn.dataset.mode === 'rich') {
        sourceEl.value = quill.root.innerHTML;
        editorEl.parentElement.querySelector('.ql-toolbar').style.display = 'none';
        editorEl.style.display = 'none';
        sourceEl.hidden = false;
        toggleBtn.dataset.mode = 'html';
        toggleBtn.textContent = '返回可视化编辑';
      } else {
        quill.clipboard.dangerouslyPasteHTML(sourceEl.value || '');
        editorEl.parentElement.querySelector('.ql-toolbar').style.display = '';
        editorEl.style.display = '';
        sourceEl.hidden = true;
        toggleBtn.dataset.mode = 'rich';
        toggleBtn.textContent = '查看 HTML 源代码';
      }
    });

    return {
      getHtml() {
        // If the user is currently in HTML mode, take that as source of
        // truth; otherwise read from Quill.
        if (toggleBtn.dataset.mode === 'html') return sourceEl.value || '';
        const html = quill.root.innerHTML.trim();
        // Quill emits "<p><br></p>" for an empty editor; treat as empty.
        if (html === '<p><br></p>') return '';
        return html;
      },
      setHtml(h) { quill.clipboard.dangerouslyPasteHTML(h || ''); },
      focus() { quill.focus(); },
      destroy() { host.innerHTML = ''; host.classList.remove('quill-shell'); },
    };
  }

  /* Custom image handler — opens a file picker, uploads the file to the
     existing /api/media endpoint (which already saves to /uploads/ and
     returns a stable URL), and embeds the returned URL in the editor.
     Without this, Quill would base64-inline every pasted image into the
     article body, which inflates page weight by 100-500 KB per picture. */
  function uploadImageToMedia(quill) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      input.remove();
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('alt_text', file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '));
      // Reuse the admin auth cookie via credentials:include.
      let json = null;
      try {
        const res = await fetch('/api/media', { method: 'POST', credentials: 'include', body: fd });
        json = await res.json().catch(() => null);
        if (!res.ok || !json || !json.url) throw new Error((json && json.error) || ('HTTP ' + res.status));
      } catch (err) {
        if (window.AdminAPI && window.AdminAPI.toast) window.AdminAPI.toast('图片上传失败：' + err.message, 'error');
        else alert('图片上传失败：' + err.message);
        return;
      }
      // Insert at the current selection; if no selection, append at the end.
      const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
      quill.insertEmbed(range.index, 'image', json.url, 'user');
      quill.setSelection(range.index + 1, 0);
    });
    input.click();
  }

  // Expose minimal API.
  window.QuillEditor = { mount, loadQuill };
})();
