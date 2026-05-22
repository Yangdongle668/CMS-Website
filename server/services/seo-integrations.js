// Webmaster-tool integrations — Google Search Console, GA4, Bing Webmaster.
//
// Auth model:
//   * Google (GSC + GA4): one shared service-account JSON key. The operator
//     creates a service account in Google Cloud, downloads the JSON, then
//     grants the service-account email "User" access in Search Console and
//     "Viewer" access in the GA4 property.
//   * Bing: a single API key copied from Bing Webmaster Tools → Settings →
//     API access.
//
// Each fetch result is cached for 10 minutes so the dashboard load is
// instant and we don't burn through Google's per-minute quotas.

const crypto = require('crypto');
const { one } = require('../db/client');

const MASK_PREFIX = '••••';
const TOKEN_CACHE = new Map();    // saHash → { token, exp }
const RESULT_CACHE = new Map();   // key → { value, exp }
const RESULT_TTL_MS = 10 * 60 * 1000;

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function parseSaJson(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(String(raw)); } catch (_e) { return null; }
}

// Returns the parsed service-account JSON from the seo_integrations
// settings row, or null if not configured.
async function loadSettings() {
  const r = await one(`SELECT value FROM settings WHERE key = 'seo_integrations'`);
  return (r && r.value) || {};
}

// =====================================================================
// Google JWT bearer flow — no external dependency. We sign a JWT with the
// service account's RSA private key, then exchange it for an access token.
// =====================================================================
async function getGoogleAccessToken(sa, scope) {
  if (!sa || !sa.client_email || !sa.private_key) {
    throw new Error('service_account_invalid');
  }
  const cacheKey = sa.client_email + '|' + scope;
  const cached = TOKEN_CACHE.get(cacheKey);
  if (cached && cached.exp > Date.now() + 30_000) return cached.token;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss:   sa.client_email,
    scope: scope,
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  }));
  const signingInput = `${header}.${claims}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = b64url(signer.sign(sa.private_key));
  const assertion = `${signingInput}.${signature}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error('google_token_exchange_failed: ' + t.slice(0, 200));
  }
  const d = await resp.json();
  const token = d.access_token;
  if (!token) throw new Error('google_token_missing');
  TOKEN_CACHE.set(cacheKey, { token, exp: Date.now() + (d.expires_in || 3600) * 1000 });
  return token;
}

function dateRange(days) {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

function cached(key, loader) {
  const hit = RESULT_CACHE.get(key);
  if (hit && hit.exp > Date.now()) return Promise.resolve(hit.value);
  return Promise.resolve()
    .then(loader)
    .then((value) => { RESULT_CACHE.set(key, { value, exp: Date.now() + RESULT_TTL_MS }); return value; });
}

// =====================================================================
// Google Search Console
// =====================================================================
async function fetchGsc(settings, days) {
  const sa = parseSaJson(settings.service_account_json);
  const site = settings.gsc_property || '';
  if (!sa || !site) return { configured: false };

  return cached(`gsc|${sa.client_email}|${site}|${days}`, async () => {
    const token = await getGoogleAccessToken(sa, 'https://www.googleapis.com/auth/webmasters.readonly');
    const range = dateRange(days);
    const url = `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(site)}/searchAnalytics/query`;

    async function query(dimensions, rowLimit) {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          startDate: range.startDate,
          endDate:   range.endDate,
          dimensions,
          rowLimit,
        }),
      });
      if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        throw new Error(`gsc_${resp.status}: ${t.slice(0, 200)}`);
      }
      return resp.json();
    }

    const [totals, queries, pages, countries] = await Promise.all([
      query([], 1),
      query(['query'], 25),
      query(['page'],  25),
      query(['country'], 25),
    ]);
    const t = (totals.rows && totals.rows[0]) || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    return {
      configured: true,
      property:    site,
      range,
      totals: {
        clicks:      t.clicks || 0,
        impressions: t.impressions || 0,
        ctr:         t.ctr || 0,
        position:    t.position || 0,
      },
      top_queries:   queries.rows   || [],
      top_pages:     pages.rows     || [],
      top_countries: countries.rows || [],
    };
  });
}

// =====================================================================
// Google Analytics 4 — Analytics Data API runReport
// =====================================================================
async function fetchGa4(settings, days) {
  const sa = parseSaJson(settings.service_account_json);
  const propertyId = String(settings.ga4_property_id || '').replace(/^properties\//, '');
  if (!sa || !propertyId) return { configured: false };

  return cached(`ga4|${sa.client_email}|${propertyId}|${days}`, async () => {
    const token = await getGoogleAccessToken(sa, 'https://www.googleapis.com/auth/analytics.readonly');
    const range = dateRange(days);
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

    async function runReport(body) {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        throw new Error(`ga4_${resp.status}: ${t.slice(0, 200)}`);
      }
      return resp.json();
    }

    // Realtime — last 30 minutes active users.
    async function runRealtime() {
      const rt = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`;
      const resp = await fetch(rt, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ metrics: [{ name: 'activeUsers' }] }),
      });
      if (!resp.ok) return { rows: [] };
      return resp.json();
    }

    const dateRanges = [{ startDate: range.startDate, endDate: range.endDate }];
    const [totals, pages, sources, countries, realtime] = await Promise.all([
      runReport({
        dateRanges,
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'engagementRate' },
        ],
      }),
      runReport({
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics:    [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        orderBys:   [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 25,
      }),
      runReport({
        dateRanges,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics:    [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys:   [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      }),
      runReport({
        dateRanges,
        dimensions: [{ name: 'country' }],
        metrics:    [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys:   [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 25,
      }),
      runRealtime(),
    ]);

    const totalRow = (totals.rows && totals.rows[0] && totals.rows[0].metricValues) || [];
    const num = (i) => Number((totalRow[i] && totalRow[i].value) || 0);
    const realtimeUsers = Number(((realtime.rows && realtime.rows[0] && realtime.rows[0].metricValues) || [{ value: 0 }])[0].value || 0);

    return {
      configured: true,
      property:   'properties/' + propertyId,
      range,
      totals: {
        active_users:        num(0),
        new_users:           num(1),
        sessions:            num(2),
        page_views:          num(3),
        avg_session_seconds: num(4),
        engagement_rate:     num(5),
      },
      realtime_users: realtimeUsers,
      top_pages:      (pages.rows     || []).map(toGaRow),
      top_sources:    (sources.rows   || []).map(toGaRow),
      top_countries:  (countries.rows || []).map(toGaRow),
    };
  });
}

function toGaRow(r) {
  return {
    dim:     (r.dimensionValues || []).map((d) => d.value),
    metrics: (r.metricValues    || []).map((m) => Number(m.value || 0)),
  };
}

// =====================================================================
// Bing Webmaster — Get(QueryStats|PageStats|RankAndTrafficStats) endpoints
// =====================================================================
async function fetchBing(settings, days) {
  const apiKey  = settings.bing_api_key  || '';
  const siteUrl = settings.bing_site_url || '';
  if (!apiKey || !siteUrl) return { configured: false };

  return cached(`bing|${siteUrl}|${days}`, async () => {
    const base = 'https://ssl.bing.com/webmaster/api.svc/json';
    async function call(endpoint) {
      const url = `${base}/${endpoint}?siteUrl=${encodeURIComponent(siteUrl)}&apikey=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        throw new Error(`bing_${resp.status}: ${t.slice(0, 200)}`);
      }
      return resp.json();
    }

    const [traffic, queries, pages] = await Promise.all([
      call('GetRankAndTrafficStats'),
      call('GetQueryStats'),
      call('GetPageStats'),
    ]);

    const trafficRows = (traffic.d || []).slice(0, days);
    const sum = (k) => trafficRows.reduce((a, r) => a + Number(r[k] || 0), 0);

    return {
      configured: true,
      property: siteUrl,
      totals: {
        clicks:      sum('Clicks'),
        impressions: sum('Impressions'),
      },
      top_queries: (queries.d || []).slice(0, 25),
      top_pages:   (pages.d   || []).slice(0, 25),
    };
  });
}

// =====================================================================
// Secret masking — service_account_json shows the client_email for ID,
// bing_api_key shows the last 4. preserveMaskedKeys restores DB values
// when the operator re-submits the form without retyping the secret.
// =====================================================================
function maskKey(k) {
  if (!k) return '';
  const s = String(k);
  if (s.length <= 6) return MASK_PREFIX;
  return MASK_PREFIX + s.slice(-4);
}
function isMasked(v) {
  return typeof v === 'string' && v.startsWith(MASK_PREFIX);
}

function applyMask(value) {
  const v = JSON.parse(JSON.stringify(value || {}));
  if (v.service_account_json) {
    const sa = parseSaJson(v.service_account_json);
    v.service_account_json = sa && sa.client_email
      ? MASK_PREFIX + ' ' + sa.client_email
      : MASK_PREFIX + '••••';
  }
  if (v.bing_api_key) v.bing_api_key = maskKey(v.bing_api_key);
  return v;
}

async function preserveMaskedKeys(submitted) {
  const ref = await loadSettings();
  const out = JSON.parse(JSON.stringify(submitted || {}));
  if (isMasked(out.service_account_json)) {
    out.service_account_json = ref.service_account_json || '';
  } else if (typeof out.service_account_json === 'string' && out.service_account_json.trim()) {
    // Validate the JSON now so a bad paste fails immediately with a
    // clear error rather than later inside the JWT signer.
    const sa = parseSaJson(out.service_account_json);
    if (!sa || !sa.client_email || !sa.private_key) {
      throw new Error('service_account_json_invalid');
    }
    out.service_account_json = sa; // store as object for compactness
  }
  if (isMasked(out.bing_api_key)) out.bing_api_key = ref.bing_api_key || '';
  return out;
}

module.exports = {
  fetchGsc,
  fetchGa4,
  fetchBing,
  applyMask,
  preserveMaskedKeys,
  isMasked,
  loadSettings,
};
