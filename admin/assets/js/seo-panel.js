/* RankMath-style SEO panel for the CMS admin.
 *
 * Mounts a self-contained SEO editor inside any host element and gives
 * the host page a single getValues() function that returns the payload
 * to merge into the form save body.
 *
 * What the operator sees, in order:
 *   1. Focus keyword input (single primary keyword) + secondary list.
 *   2. Live SERP preview — Google's serif title + green URL line + grey
 *      snippet. Updates as the operator types in the meta_title /
 *      meta_description fields.
 *   3. Tabs: General | Social (Open Graph + Twitter) | Advanced
 *      (canonical, robots, schema type) | Score (10 checks, weighted).
 *   4. Score panel — runs in-browser, updates after every input change.
 *      Each check is one line with a green/yellow/red dot + plain-
 *      language explanation + "what to fix" tooltip when failing.
 *
 * Usage from a host page (pages.html, articles.html, …):
 *   const seo = window.SEOPanel.mount('seo-panel-mount', {
 *     entity: 'page',                 // 'page'|'pillar'|'product'|'application'|'article'
 *     getContext() {                  // called whenever score recomputes
 *       return {
 *         title: form.meta_title.value || form.title.value,
 *         description: form.meta_description.value,
 *         slug: form.slug.value,
 *         body: bodyEditor ? bodyEditor.getHtml() : '',
 *         coverUrl: form.cover_url.value,
 *       };
 *     },
 *     initial: row,                   // current DB row (uses the seo_* fields)
 *     siteHost: location.host,        // for SERP preview
 *   });
 *   ...
 *   payload.focus_keyword       = seo.getValues().focus_keyword;
 *   payload.secondary_keywords  = seo.getValues().secondary_keywords;
 *   ...all other seo_* fields...
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // ---------- character/word counters ----------
  function chars(s) { return (s || '').length; }
  function words(s) {
    return String(s || '')
      .replace(/<[^>]+>/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }
  function plainText(html) {
    return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function lower(s) { return String(s || '').toLowerCase(); }

  // ---------- SEO checks ----------
  // Each check returns { id, label, passed, weight, fix?, severity? }
  // where severity is 'good' (passed), 'warn' (close to passing), or
  // 'fail' (red). weight contributes to the 0-100 score.
  function runChecks(input) {
    const fk = lower(input.focus_keyword || '').trim();
    const title = input.title || '';
    const desc = input.description || '';
    const slug = lower(input.slug || '');
    const body = plainText(input.body || '');
    const bodyLower = lower(body);
    const cover = input.coverUrl || '';

    const checks = [];

    // 1. Focus keyword present
    checks.push({
      id: 'fk-set',
      label: '焦点关键词已设置',
      weight: 5,
      passed: !!fk,
      severity: fk ? 'good' : 'fail',
      fix: '在最上方填一个本页的核心关键词（例如 "lithium polymer battery"）。',
    });

    // 2. Focus keyword in title
    const fkInTitle = fk && lower(title).includes(fk);
    checks.push({
      id: 'fk-in-title',
      label: '焦点关键词出现在 Meta 标题中',
      weight: 12,
      passed: !!fkInTitle,
      severity: fk ? (fkInTitle ? 'good' : 'fail') : 'warn',
      fix: '把焦点关键词加到 meta 标题里，最好放在前 60 字符内。',
    });

    // 3. Focus keyword at start of title
    const fkAtTitleStart = fk && lower(title).startsWith(fk);
    checks.push({
      id: 'fk-title-start',
      label: '焦点关键词出现在 Meta 标题开头',
      weight: 5,
      passed: !!fkAtTitleStart,
      severity: fk ? (fkAtTitleStart ? 'good' : 'warn') : 'warn',
      fix: '把焦点关键词放到 meta 标题最开头，CTR 会高 5-10%。',
    });

    // 4. Title length 30-60 chars
    const tLen = chars(title);
    const tLenOk = tLen >= 30 && tLen <= 60;
    checks.push({
      id: 'title-length',
      label: `Meta 标题长度合适（${tLen} 字符 / 30-60 区间）`,
      weight: 8,
      passed: tLenOk,
      severity: tLenOk ? 'good' : (tLen > 0 ? 'warn' : 'fail'),
      fix: tLen < 30 ? '太短，加到 30 字符以上' : (tLen > 60 ? 'Google 会截断，缩短到 60 字符以内' : '填写一个 30-60 字符的 meta 标题'),
    });

    // 5. Description length 120-160 chars
    const dLen = chars(desc);
    const dLenOk = dLen >= 120 && dLen <= 160;
    checks.push({
      id: 'desc-length',
      label: `Meta 描述长度合适（${dLen} 字符 / 120-160 区间）`,
      weight: 8,
      passed: dLenOk,
      severity: dLenOk ? 'good' : (dLen > 0 ? 'warn' : 'fail'),
      fix: dLen < 120 ? '太短，加到 120 字符以上' : (dLen > 160 ? 'Google 会截断，缩短到 160 字符以内' : '填写一个 120-160 字符的 meta 描述'),
    });

    // 6. Focus keyword in description
    const fkInDesc = fk && lower(desc).includes(fk);
    checks.push({
      id: 'fk-in-desc',
      label: '焦点关键词出现在 Meta 描述中',
      weight: 8,
      passed: !!fkInDesc,
      severity: fk ? (fkInDesc ? 'good' : 'fail') : 'warn',
      fix: 'Google 在搜索结果中加粗匹配关键词，把焦点关键词加到描述里能提升 CTR。',
    });

    // 7. Focus keyword in URL slug
    const slugWords = slug.replace(/[^a-z0-9]+/g, ' ').trim();
    const fkInSlug = fk && slugWords.includes(fk.replace(/\s+/g, ''));
    checks.push({
      id: 'fk-in-slug',
      label: '焦点关键词出现在 URL 中',
      weight: 6,
      passed: !!fkInSlug || !fk,
      severity: fk ? (fkInSlug ? 'good' : 'warn') : 'good',
      fix: 'URL 里带上焦点关键词（用连字符），例如 /products/lithium-polymer-battery。',
    });

    // 8. Focus keyword in body
    const bodyWordCount = words(body);
    const fkInBody = fk && bodyLower.includes(fk);
    const fkBodyCount = fk ? (bodyLower.match(new RegExp(fk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length : 0;
    const fkDensity = bodyWordCount > 0 ? (fkBodyCount * fk.split(/\s+/).length) / bodyWordCount : 0;
    const fkInBodyOk = fkInBody && fkDensity >= 0.005 && fkDensity <= 0.025;
    checks.push({
      id: 'fk-in-body',
      label: bodyWordCount > 0
        ? `焦点关键词在正文中出现 ${fkBodyCount} 次（密度 ${(fkDensity*100).toFixed(2)}% / 0.5-2.5% 区间）`
        : '正文中包含焦点关键词',
      weight: 10,
      passed: !!fkInBodyOk,
      severity: !fk ? 'warn' : (fkInBody ? (fkInBodyOk ? 'good' : 'warn') : 'fail'),
      fix: !fkInBody
        ? '在正文里至少出现 1 次焦点关键词。'
        : (fkDensity < 0.005 ? '出现频率太低，可适当多用焦点关键词或近义短语。' : '关键词密度过高，疑似堆砌，删除几次。'),
    });

    // 9. Body word count >= 350 (thin-content guard)
    const bodyOk = bodyWordCount >= 350;
    checks.push({
      id: 'body-length',
      label: `正文字数（${bodyWordCount} / 至少 350 字）`,
      weight: 12,
      passed: bodyOk,
      severity: bodyWordCount === 0 ? 'warn' : (bodyOk ? 'good' : 'fail'),
      fix: '少于 350 字会被 Google 视为薄内容（thin content）。建议每页 600+ 字、支柱页 2000+ 字。',
    });

    // 10. Cover / OG image
    const hasCover = !!cover;
    checks.push({
      id: 'has-cover',
      label: '已设置封面图（用于 OG 分享卡片）',
      weight: 6,
      passed: hasCover,
      severity: hasCover ? 'good' : 'warn',
      fix: '没有封面图时社交分享会用站点默认图（不利于 CTR）。建议上传一张 1200×630 的图。',
    });

    // 11. Slug short and clean
    const slugLen = slug.length;
    const slugOk = slugLen > 0 && slugLen <= 75 && /^[a-z0-9/-]+$/.test(slug);
    checks.push({
      id: 'slug-clean',
      label: 'URL 简洁、无大写或下划线',
      weight: 4,
      passed: slugOk,
      severity: slugOk ? 'good' : 'warn',
      fix: 'URL 应只包含小写字母、数字、连字符。例如 lithium-polymer-battery，长度建议 75 字符以内。',
    });

    // 12. Headings present in body (H2 / H3)
    const hCount = (input.body || '').match(/<h[23]\b/gi) || [];
    const hOk = hCount.length >= 2;
    checks.push({
      id: 'has-headings',
      label: `正文含足够的小标题（${hCount.length} 个 H2/H3，建议 ≥2）`,
      weight: 6,
      passed: hOk,
      severity: hOk ? 'good' : (hCount.length === 1 ? 'warn' : 'fail'),
      fix: '加 2 个以上 H2 / H3 帮助 Google 理解页面结构。短长尾搜索结果常引用 H2 文本。',
    });

    // 13. External or internal links in body
    const linkCount = (input.body || '').match(/<a\s+[^>]*href=/gi) || [];
    const linksOk = linkCount.length >= 2;
    checks.push({
      id: 'has-links',
      label: `正文含至少 2 个出站/内部链接（${linkCount.length} 个）`,
      weight: 6,
      passed: linksOk,
      severity: linksOk ? 'good' : (linkCount.length === 1 ? 'warn' : 'fail'),
      fix: '加 2 个内部链接（指向支柱页）+ 1-2 个权威外链（IEEE / 厂商官网），E-E-A-T 加分。',
    });

    // Sum weighted score (0-100). Each check contributes its weight only
    // when passed, plus half-credit for "warn" severity (close to passing).
    let earned = 0;
    let total = 0;
    for (const c of checks) {
      total += c.weight;
      if (c.passed) earned += c.weight;
      else if (c.severity === 'warn') earned += c.weight * 0.5;
    }
    const score = total > 0 ? Math.round((earned / total) * 100) : 0;
    return { checks, score };
  }

  // ---------- main mount ----------
  function mount(hostId, opts) {
    opts = opts || {};
    const host = typeof hostId === 'string' ? document.getElementById(hostId) : hostId;
    if (!host) throw new Error('SEOPanel: host not found: ' + hostId);

    const initial = opts.initial || {};
    const siteHost = opts.siteHost || (typeof location !== 'undefined' ? location.host : 'example.com');
    const entity = opts.entity || 'page';

    // Render shell
    host.innerHTML = `
      <div class="seo-panel">
        <div class="seo-panel__head">
          <div>
            <strong>SEO &amp; 社交</strong>
            <div class="seo-panel__hint">RankMath 风格的页面级 SEO 编辑：焦点关键词 + SERP 预览 + 14 项检查</div>
          </div>
          <div class="seo-panel__score" data-score>
            <div class="seo-panel__score-num">--</div>
            <div class="seo-panel__score-label">SEO 分</div>
          </div>
        </div>

        <div class="field">
          <label>焦点关键词 <span class="hint">— 本页希望排到 Google 第一页的那个核心词。一页一个。</span></label>
          <input type="text" data-field="focus_keyword" placeholder="例：lithium polymer battery" value="${esc(initial.focus_keyword || '')}"/>
        </div>
        <div class="field">
          <label>次要关键词（用逗号分隔） <span class="hint">— 同义词或长尾扩展，最多 4 个。</span></label>
          <input type="text" data-field="secondary_keywords" placeholder="li-po cell, polymer li-ion, lipo battery" value="${esc(Array.isArray(initial.secondary_keywords) ? initial.secondary_keywords.join(', ') : '')}"/>
        </div>

        <div class="seo-panel__serp" data-serp aria-label="Google 搜索结果预览">
          <div class="seo-serp__site">
            <div class="seo-serp__favicon" aria-hidden="true">${esc(siteHost.charAt(0).toUpperCase())}</div>
            <div>
              <div class="seo-serp__sitename">${esc(siteHost)}</div>
              <div class="seo-serp__url" data-serp-url>https://${esc(siteHost)}/...</div>
            </div>
          </div>
          <div class="seo-serp__title" data-serp-title>填写 Meta 标题查看预览</div>
          <div class="seo-serp__desc" data-serp-desc>填写 Meta 描述查看预览。Google 在搜索结果中只展示前 ~155 个字符。</div>
        </div>

        <div class="seo-panel__tabs">
          <button type="button" class="seo-tab is-active" data-tab="checks">检查清单</button>
          <button type="button" class="seo-tab" data-tab="social">社交分享</button>
          <button type="button" class="seo-tab" data-tab="advanced">高级</button>
        </div>

        <div data-pane="checks" class="seo-pane">
          <ul class="seo-checks" data-checks></ul>
        </div>

        <div data-pane="social" class="seo-pane" style="display:none;">
          <p class="seo-panel__hint" style="margin-top:0;">空白时回退到 Meta 标题 / 描述 / 站点默认图。</p>
          <h4 style="margin:18px 0 8px; font-size:13px;">Open Graph (Facebook / LinkedIn)</h4>
          <div class="field"><label>OG 标题</label><input type="text" data-field="og_title" value="${esc(initial.og_title || '')}" placeholder="（默认 = Meta 标题）"/></div>
          <div class="field"><label>OG 描述</label><textarea rows="2" data-field="og_description" placeholder="（默认 = Meta 描述）">${esc(initial.og_description || '')}</textarea></div>
          <div class="field"><label>OG 图片 URL <span class="hint">— 推荐 1200×630</span></label><input type="text" data-field="og_image_url" value="${esc(initial.og_image_url || '')}" placeholder="/uploads/og-cover.jpg"/></div>
          <h4 style="margin:24px 0 8px; font-size:13px;">Twitter / X 卡片</h4>
          <div class="field"><label>Twitter 标题</label><input type="text" data-field="twitter_title" value="${esc(initial.twitter_title || '')}" placeholder="（默认 = OG 标题）"/></div>
          <div class="field"><label>Twitter 描述</label><textarea rows="2" data-field="twitter_description" placeholder="（默认 = OG 描述）">${esc(initial.twitter_description || '')}</textarea></div>
          <div class="field"><label>Twitter 图片 URL</label><input type="text" data-field="twitter_image_url" value="${esc(initial.twitter_image_url || '')}" placeholder="（默认 = OG 图片）"/></div>
        </div>

        <div data-pane="advanced" class="seo-pane" style="display:none;">
          <div class="field">
            <label>Canonical URL 覆盖 <span class="hint">— 仅在该页内容是其他 URL 的副本时使用。空白则用默认（站点 + 当前路径）。</span></label>
            <input type="text" data-field="canonical_override" value="${esc(initial.canonical_override || '')}" placeholder="https://www.zufek.com/canonical-source-url"/>
          </div>
          <div class="field">
            <label>Robots 指令</label>
            <select data-field="robots">
              <option value="" ${!initial.robots ? 'selected' : ''}>默认（index, follow）</option>
              <option value="index,follow" ${initial.robots === 'index,follow' ? 'selected' : ''}>index, follow（强制可被索引）</option>
              <option value="noindex,follow" ${initial.robots === 'noindex,follow' ? 'selected' : ''}>noindex, follow（不索引但传递权重）</option>
              <option value="noindex,nofollow" ${initial.robots === 'noindex,nofollow' ? 'selected' : ''}>noindex, nofollow（完全屏蔽）</option>
              <option value="index,nofollow" ${initial.robots === 'index,nofollow' ? 'selected' : ''}>index, nofollow（索引但不传权重）</option>
            </select>
          </div>
          <div class="field">
            <label>Schema.org 主类型覆盖 <span class="hint">— 默认根据 entity 类型自动判断。仅在你确实需要更窄的类型时填写（例如 Article → TechArticle，WebPage → AboutPage）。</span></label>
            <input type="text" data-field="schema_type" value="${esc(initial.schema_type || '')}" placeholder="例：TechArticle / AboutPage / FAQPage"/>
          </div>
        </div>
      </div>
    `;

    // Tab toggle
    host.querySelectorAll('.seo-tab').forEach((b) => {
      b.addEventListener('click', () => {
        host.querySelectorAll('.seo-tab').forEach((x) => x.classList.toggle('is-active', x === b));
        host.querySelectorAll('[data-pane]').forEach((p) => {
          p.style.display = p.dataset.pane === b.dataset.tab ? '' : 'none';
        });
      });
    });

    function getValues() {
      const v = {};
      host.querySelectorAll('[data-field]').forEach((el) => {
        v[el.dataset.field] = el.value;
      });
      const sec = (v.secondary_keywords || '').split(',').map((s) => s.trim()).filter(Boolean);
      v.secondary_keywords = sec;
      return v;
    }

    function readContext() {
      const ctx = (typeof opts.getContext === 'function') ? (opts.getContext() || {}) : {};
      const v = getValues();
      return {
        focus_keyword: v.focus_keyword,
        title: ctx.title || '',
        description: ctx.description || '',
        slug: ctx.slug || '',
        body: ctx.body || '',
        coverUrl: ctx.coverUrl || '',
      };
    }

    function repaint() {
      const ctx = readContext();
      // SERP preview
      const titleEl = host.querySelector('[data-serp-title]');
      const descEl = host.querySelector('[data-serp-desc]');
      const urlEl = host.querySelector('[data-serp-url]');
      const slug = (ctx.slug || '').replace(/^\/?/, '');
      urlEl.textContent = 'https://' + siteHost + (slug ? '/' + slug : '/');
      titleEl.textContent = (ctx.title || '— 填写 Meta 标题 —').slice(0, 70);
      descEl.textContent = (ctx.description || '— 填写 Meta 描述 —').slice(0, 175);

      // Re-run checks + render
      const result = runChecks(ctx);
      const list = host.querySelector('[data-checks]');
      list.innerHTML = result.checks.map((c) => `
        <li class="seo-check seo-check--${c.severity}">
          <span class="seo-check__dot" aria-hidden="true"></span>
          <span class="seo-check__label">${esc(c.label)}</span>
          ${c.passed ? '' : `<span class="seo-check__fix" title="${esc(c.fix || '')}">— ${esc(c.fix || '')}</span>`}
        </li>
      `).join('');
      const scoreBox = host.querySelector('[data-score]');
      scoreBox.querySelector('.seo-panel__score-num').textContent = result.score;
      scoreBox.classList.remove('is-good','is-mid','is-bad');
      scoreBox.classList.add(result.score >= 80 ? 'is-good' : result.score >= 50 ? 'is-mid' : 'is-bad');
      // Stash latest score on the host for the parent to grab on save.
      host.dataset.score = result.score;
      host.dataset.checks = JSON.stringify(result.checks.map((c) => ({ id: c.id, p: c.passed ? 1 : 0 })));
    }

    // Re-paint on any input change inside the panel.
    host.addEventListener('input', repaint);
    host.addEventListener('change', repaint);

    // Allow the parent form to ask us to recompute when external fields
    // (meta_title, body editor, slug, …) change.
    repaint();

    return {
      repaint,
      getValues() {
        const v = getValues();
        return {
          focus_keyword: v.focus_keyword || '',
          secondary_keywords: v.secondary_keywords || [],
          canonical_override: v.canonical_override || '',
          robots: v.robots || '',
          og_title: v.og_title || '',
          og_description: v.og_description || '',
          og_image_url: v.og_image_url || '',
          twitter_title: v.twitter_title || '',
          twitter_description: v.twitter_description || '',
          twitter_image_url: v.twitter_image_url || '',
          schema_type: v.schema_type || '',
          schema_extra: {},
          seo_score: parseInt(host.dataset.score || '0', 10) || 0,
          seo_checks: JSON.parse(host.dataset.checks || '[]'),
        };
      },
    };
  }

  window.SEOPanel = { mount, runChecks };
})();
