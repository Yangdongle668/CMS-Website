// =====================================================================
// AI 配置 — 持久化到 settings 表，env 仅作为初始 fallback
// =====================================================================
// Why a separate module?
//
// 1. ai-generator.js does its provider/model/url lookups synchronously in
//    a bunch of places (listProviders, getDefaultProvider, callLLM). To
//    keep those sync we keep an in-memory snapshot of the merged config.
//
// 2. The admin /settings page can update the snapshot at runtime by
//    PUT-ing /api/settings/ai_providers. The settings route then calls
//    `reload()` here so the next /api/ai-generate/* request sees the
//    new keys without restarting the server.
//
// 3. API keys are sensitive — masked before being sent to the browser
//    (last 4 chars only). The mask logic lives here so other routes
//    (settings.js) can re-use it consistently.
//
// Storage shape (settings.value where settings.key = 'ai_providers'):
//
// {
//   default_provider: 'anthropic',
//   max_tokens: 4096,
//   detect_provider: 'heuristic',  // heuristic | gptzero | sapling
//   detect_threshold: 45,
//   gptzero_key: '...',
//   sapling_key: '...',
//   providers: {
//     anthropic:     { api_key: '...', model: 'claude-sonnet-4-6' },
//     openai:        { api_key: '...', model: 'gpt-4o-mini' },
//     deepseek:      { api_key: '...', model: 'deepseek-chat' },
//     moonshot:      { api_key: '...', model: 'moonshot-v1-32k' },
//     zhipu:         { api_key: '...', model: 'glm-4-plus' },
//     qwen:          { api_key: '...', model: 'qwen-plus' },
//     openai_compat: { api_key: '...', model: '...', base_url: 'https://...' },
//   }
// }
// =====================================================================

const { one } = require('../db/client');

const PROVIDER_DEFAULT_MODEL = {
  anthropic:     'claude-sonnet-4-6',
  openai:        'gpt-4o-mini',
  deepseek:      'deepseek-chat',
  moonshot:      'moonshot-v1-32k',
  zhipu:         'glm-4-plus',
  qwen:          'qwen-plus',
  openai_compat: 'custom',
};

// env-variable fallback table — keeps existing .env-based deployments working.
const ENV_MAP = {
  anthropic:     { key: 'ANTHROPIC_API_KEY',     model: 'ANTHROPIC_MODEL' },
  openai:        { key: 'OPENAI_API_KEY',        model: 'OPENAI_MODEL' },
  deepseek:      { key: 'DEEPSEEK_API_KEY',      model: 'DEEPSEEK_MODEL' },
  moonshot:      { key: 'MOONSHOT_API_KEY',      model: 'MOONSHOT_MODEL' },
  zhipu:         { key: 'ZHIPU_API_KEY',         model: 'ZHIPU_MODEL' },
  qwen:          { key: 'QWEN_API_KEY',          model: 'QWEN_MODEL' },
  openai_compat: { key: 'OPENAI_COMPAT_API_KEY', model: 'OPENAI_COMPAT_MODEL', url: 'OPENAI_COMPAT_URL' },
};

// In-memory snapshot. Populated at boot via reload(); refreshed when the
// admin PUTs /api/settings/ai_providers. Reading callers (ai-generator.js)
// touch this object synchronously, so we never await DB inside an LLM call.
let SNAPSHOT = null;

function emptySnapshot() {
  const providers = {};
  for (const id of Object.keys(PROVIDER_DEFAULT_MODEL)) {
    providers[id] = { api_key: '', model: PROVIDER_DEFAULT_MODEL[id] };
    if (id === 'openai_compat') providers[id].base_url = '';
  }
  return {
    default_provider: '',
    max_tokens: 4096,
    detect_provider: 'heuristic',
    detect_threshold: 45,
    gptzero_key: '',
    sapling_key: '',
    providers,
  };
}

function mergeWithEnv(db) {
  const out = emptySnapshot();
  out.default_provider = (db && db.default_provider) || process.env.AI_PROVIDER || '';
  out.max_tokens       = (db && Number(db.max_tokens))       || parseInt(process.env.AI_MAX_TOKENS || '4096', 10);
  out.detect_provider  = (db && db.detect_provider)  || (process.env.AI_DETECT_PROVIDER || 'heuristic').toLowerCase();
  out.detect_threshold = (db && Number(db.detect_threshold)) || parseInt(process.env.AI_DETECT_THRESHOLD || '45', 10);
  out.gptzero_key      = (db && db.gptzero_key) || process.env.GPTZERO_API_KEY || '';
  out.sapling_key      = (db && db.sapling_key) || process.env.SAPLING_API_KEY || '';

  const dbProviders = (db && db.providers) || {};
  for (const [id, env] of Object.entries(ENV_MAP)) {
    const dbp = dbProviders[id] || {};
    out.providers[id].api_key = dbp.api_key || process.env[env.key] || '';
    out.providers[id].model   = dbp.model   || process.env[env.model] || PROVIDER_DEFAULT_MODEL[id];
    if (env.url) {
      out.providers[id].base_url = dbp.base_url || process.env[env.url] || '';
    }
  }
  return out;
}

async function loadFromDB() {
  try {
    const row = await one("SELECT value FROM settings WHERE key = 'ai_providers'");
    return (row && row.value) || {};
  } catch (err) {
    // Settings table missing / DB not yet up — treat as empty so env still wins.
    return {};
  }
}

// Hydrate the snapshot from DB. Called at boot and after every admin save.
async function reload() {
  const db = await loadFromDB();
  SNAPSHOT = mergeWithEnv(db);
  return SNAPSHOT;
}

// Sync read of the current snapshot. If the cache was never populated
// (e.g. DB was down at boot), synthesise one from env so the LLM calls
// can still work for env-only deployments.
function snapshot() {
  if (SNAPSHOT) return SNAPSHOT;
  SNAPSHOT = mergeWithEnv({});
  return SNAPSHOT;
}

// =====================================================================
// Masking — only show the last 4 chars in the admin UI so a screen
// recording / shoulder-surfer can't lift the key.
// =====================================================================
const MASK_PREFIX = '••••';

function maskKey(k) {
  if (!k) return '';
  const s = String(k);
  if (s.length <= 6) return MASK_PREFIX;
  return MASK_PREFIX + s.slice(-4);
}

function isMasked(v) {
  return typeof v === 'string' && v.startsWith(MASK_PREFIX);
}

// Returns a mask-safe copy of the snapshot (or any AI settings object) for
// sending to the admin browser. Only api_keys / detect keys are masked —
// model names, base_url, thresholds remain in the clear.
function applyMask(value) {
  const v = JSON.parse(JSON.stringify(value || emptySnapshot()));
  if (v.gptzero_key) v.gptzero_key = maskKey(v.gptzero_key);
  if (v.sapling_key) v.sapling_key = maskKey(v.sapling_key);
  v.providers = v.providers || {};
  for (const id of Object.keys(PROVIDER_DEFAULT_MODEL)) {
    if (!v.providers[id]) v.providers[id] = {};
    if (v.providers[id].api_key) v.providers[id].api_key = maskKey(v.providers[id].api_key);
  }
  return v;
}

// When the admin UI re-submits a settings object, any field that still
// holds the mask string means "user didn't change it". Replace those
// fields with the *current effective* value (DB first, env fallback) so
// save-all doesn't wipe a key just because the user toggled an unrelated
// checkbox. Using the merged snapshot also handles the first-save case
// where the DB row doesn't yet exist but env has populated the key.
async function preserveMaskedKeys(submitted) {
  const ref = snapshot();
  const out = JSON.parse(JSON.stringify(submitted || {}));
  out.providers = out.providers || {};
  for (const id of Object.keys(PROVIDER_DEFAULT_MODEL)) {
    const sub = out.providers[id] || {};
    const refProv = (ref.providers && ref.providers[id]) || {};
    if (isMasked(sub.api_key)) sub.api_key = refProv.api_key || '';
    out.providers[id] = sub;
  }
  if (isMasked(out.gptzero_key)) out.gptzero_key = ref.gptzero_key || '';
  if (isMasked(out.sapling_key)) out.sapling_key = ref.sapling_key || '';
  return out;
}

module.exports = {
  PROVIDER_DEFAULT_MODEL,
  reload,
  snapshot,
  applyMask,
  preserveMaskedKeys,
  isMasked,
  maskKey,
  MASK_PREFIX,
};
