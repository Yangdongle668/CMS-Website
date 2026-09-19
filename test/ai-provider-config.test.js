// Configuring an LLM provider from the admin UI, with no shell access
// and no restart.
//
// The AI page used to tell an operator to set ANTHROPIC_API_KEY in the
// server's .env and restart. That advice was stale — keys have lived in
// the settings table for a while, the save path re-hydrates the
// in-memory snapshot, and the next request picks them up — and on a
// hosted deployment it is advice the operator cannot act on at all.
//
// So this pins the behaviour the UI now promises: paste a key, save,
// and the provider is usable immediately. If that ever stops being
// true, the banner is lying again.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers/server');

test('ai provider configuration', async (t) => {
  // No provider keys in the environment: this must be reachable purely
  // through the admin API.
  const srv = await startServer({
    env: {
      ANTHROPIC_API_KEY: '', OPENAI_API_KEY: '', DEEPSEEK_API_KEY: '',
      MOONSHOT_API_KEY: '', ZHIPU_API_KEY: '', QWEN_API_KEY: '',
      OPENAI_COMPAT_API_KEY: '', AI_PROVIDER: '',
    },
  });
  t.after(() => srv.stop());

  await srv.request('/api/auth/login', {
    method: 'POST',
    json: { email: 'admin@example.test', password: 'a-strong-password-2026' },
  });

  await t.test('starts unconfigured', async () => {
    const st = (await srv.request('/api/ai-generate/status')).json;
    assert.equal(st.configured, false);
    assert.ok(st.providers.every((p) => !p.configured), 'a provider is configured already');
    // The heuristic detector needs no key, which is why the banner can
    // say so rather than implying查重 is unavailable too.
    assert.equal(st.detectProvider, 'heuristic');
  });

  await t.test('a key saved through the API takes effect without a restart', async () => {
    const put = await srv.request('/api/settings/ai_providers', {
      method: 'PUT',
      json: {
        value: {
          default_provider: 'deepseek',
          providers: { deepseek: { api_key: 'sk-test-key-abcd1234', model: 'deepseek-chat' } },
        },
      },
    });
    assert.equal(put.status, 200);

    // Same process, no restart in between.
    const st = (await srv.request('/api/ai-generate/status')).json;
    assert.equal(st.configured, true, 'the key did not reach the running process');
    assert.equal(st.defaultProvider, 'deepseek');
    const ds = st.providers.find((p) => p.id === 'deepseek');
    assert.equal(ds.configured, true);
    assert.equal(ds.defaultModel, 'deepseek-chat');
  });

  await t.test('the key is masked on the way back to the browser', async () => {
    const { settings } = (await srv.request('/api/settings')).json;
    const shown = settings.ai_providers.providers.deepseek.api_key;
    assert.ok(shown.startsWith('••••'), `key was not masked: ${shown}`);
    assert.doesNotMatch(shown, /abcd1234$|sk-test/, 'the masked value leaks the key');
    assert.ok(shown.endsWith('1234'), 'the mask should keep the last 4 for recognition');
  });

  await t.test('saving an unrelated field does not wipe the stored key', async () => {
    // The admin page posts the whole object back with the mask still in
    // the key field. That must mean "unchanged", not "set to ••••1234".
    const put = await srv.request('/api/settings/ai_providers', {
      method: 'PUT',
      json: {
        value: {
          default_provider: 'deepseek',
          max_tokens: 8192,
          providers: { deepseek: { api_key: '••••1234', model: 'deepseek-chat' } },
        },
      },
    });
    assert.equal(put.status, 200);

    const st = (await srv.request('/api/ai-generate/status')).json;
    assert.equal(st.configured, true, 'the stored key was overwritten by the mask');
    assert.equal(st.providers.find((p) => p.id === 'deepseek').configured, true);
  });

  await t.test('the settings page deep-links to the AI tab', async () => {
    const page = await srv.request('/admin/settings.html?tab=ai');
    assert.equal(page.status, 200);
    // The pane and the handler that opens it from ?tab= must both exist,
    // or the banner's link lands the operator on the wrong tab.
    assert.match(page.text, /data-pane="ai"/);
    assert.match(page.text, /data-tab="ai"/);
    assert.match(page.text, /URLSearchParams\(location\.search\)\.get\('tab'\)/);
  });

  await t.test('the AI page points at the settings tab, not at .env', async () => {
    const page = await srv.request('/admin/ai-generate.html');
    assert.equal(page.status, 200);
    assert.match(page.text, /\/admin\/settings\.html\?tab=ai/,
      'the banner does not link to where a key can actually be entered');
    assert.match(page.text, /无需重启服务器/);
    // The old instruction must not come back.
    assert.doesNotMatch(page.text, /请在服务器 \.env 中设置.*并重启/,
      'the banner still tells the operator to edit .env and restart');
  });
});
