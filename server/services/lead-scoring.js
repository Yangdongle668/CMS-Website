// =====================================================================
// Lead scoring — assigns a 0–100 score to an inquiry based on signals
// that correlate with deal value in B2B manufacturing. Computed at
// insertion time and stored in inquiries.score so the admin inbox can
// sort by it and the internal alert email can flag [HOT] leads.
// =====================================================================

const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.co.jp', 'ymail.com',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'protonmail.com', 'pm.me',
  'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com', 'foxmail.com',
  'naver.com', 'daum.net',
  'mail.ru', 'yandex.com', 'yandex.ru',
]);

function parseAnnualVolume(s) {
  if (!s) return 0;
  const txt = String(s).toLowerCase().replace(/,/g, '');
  // Match leading number; supports "5000", "5k", "10000+", "10-50k", etc.
  const m = txt.match(/(\d+(?:\.\d+)?)\s*(k|m)?/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (!isFinite(n)) return 0;
  const mult = m[2] === 'm' ? 1_000_000 : m[2] === 'k' ? 1_000 : 1;
  return Math.round(n * mult);
}

function scoreInquiry(inq) {
  let score = 0;
  const reasons = [];

  if (inq.company && inq.company.trim().length >= 2) {
    score += 10;
    reasons.push('company_present');
  }
  if (inq.phone && inq.phone.trim().length >= 5) {
    score += 20;
    reasons.push('phone_present');
  }

  const volume = parseAnnualVolume(inq.annual_volume);
  if (volume >= 50_000) { score += 35; reasons.push('volume_50k+'); }
  else if (volume >= 5_000) { score += 25; reasons.push('volume_5k+'); }
  else if (volume >= 1_000) { score += 15; reasons.push('volume_1k+'); }

  const email = String(inq.email || '').toLowerCase();
  const at = email.lastIndexOf('@');
  if (at > 0) {
    const domain = email.slice(at + 1);
    if (domain && !PUBLIC_EMAIL_DOMAINS.has(domain)) {
      score += 25;
      reasons.push('business_email');
    }
  }

  const source = String(inq.source_page || '').toLowerCase();
  if (source.includes('/products/') || source.includes('/applications/')) {
    score += 15;
    reasons.push('high_intent_page');
  } else if (source.includes('/blog/')) {
    score += 5;
    reasons.push('blog_page');
  }

  const msgLen = String(inq.message || '').trim().length;
  if (msgLen >= 200) { score += 10; reasons.push('detailed_message'); }
  else if (msgLen >= 100) { score += 5; reasons.push('medium_message'); }

  if (inq.country && inq.country.trim().length >= 2) {
    score += 5;
    reasons.push('country_present');
  }

  if (score > 100) score = 100;
  return { score, reasons };
}

module.exports = { scoreInquiry, parseAnnualVolume };
