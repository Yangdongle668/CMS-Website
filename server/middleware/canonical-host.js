// Send every request to the one hostname the site is published under.
//
// https://www.zufek.com answered 200 rather than redirecting, so the
// site was reachable on two hostnames. The usual framing for this is
// "link equity splits between www and apex", and that framing is mostly
// out of date: Google consolidates ranking signals onto the canonical,
// and the canonical tag here already points at the apex on both hosts,
// because it is built from PUBLIC_URL rather than from the request.
//
// The reason to redirect anyway is narrower and better: correctness
// currently depends on that setting existing. resolveCanonicalBase falls
// back to the request's own Host when PUBLIC_URL and settings.seo are
// both empty, and at that moment every page on www starts
// self-canonicalising to www — two independent mirror sites, silently,
// with nothing logged. A 301 at the edge means www never reaches the
// renderer and the question stops depending on configuration.
//
// Second order, but real on a site that has been fighting to get
// crawled: Googlebot spends budget on both hostnames, and analytics
// splits across two GSC properties.
//
// Deliberately narrow. It fires only when the operator has DECLARED a
// canonical host, and does nothing at all otherwise — guessing one from
// the request is how you build a redirect loop.

const { configuredCanonicalBase } = require('./html-tokens');

// Never redirect these, whatever the hostname.
function isExempt(pathname) {
  // ACME HTTP-01. The :80 listener in services/ssl-server answers these
  // before Express sees them, so this is belt-and-braces — but a cert
  // renewal that starts 301ing mid-validation is a bad way to find out
  // the layering changed.
  if (pathname.startsWith('/.well-known/')) return true;
  // Load balancers and uptime checks connect by IP or an internal name
  // and must get an answer, not a redirect to the public hostname.
  if (pathname === '/healthz') return true;
  return false;
}

// An IP literal or a local name is someone reaching the box directly:
// a health check, a tunnel, a developer. Leave it alone.
function isDirectAccess(hostname) {
  if (!hostname) return true;
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;   // IPv4
  if (hostname.startsWith('[') || hostname.includes(':')) return true;  // IPv6 literal
  if (!hostname.includes('.')) return true;                    // bare container name
  return false;
}

function canonicalHostRedirect(req, res, next) {
  // Only safe methods. A 301 on a POST invites clients to replay it as
  // a GET and lose the body; form posts and API writes stay put.
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const base = configuredCanonicalBase();
  if (!base) return next();          // no declared host — nothing to normalise to

  let want;
  try { want = new URL(base); } catch (_) { return next(); }

  const rawHost = String(req.headers.host || '');
  const hostname = rawHost.replace(/:\d+$/, '').toLowerCase();
  if (isDirectAccess(hostname)) return next();
  if (hostname === want.hostname.toLowerCase()) return next();   // already right
  if (isExempt(req.path)) return next();

  // originalUrl keeps the query string; the path is already encoded.
  //
  // no-store because the target is a runtime setting an operator can
  // change from the admin panel. Browsers cache a bare 301 more or less
  // forever, so a hostname typo saved here would follow returning
  // visitors around long after it was corrected. Search engines treat
  // the 301 as permanent for canonicalisation either way — this only
  // stops it being pinned in caches we cannot reach.
  res.set('Cache-Control', 'no-store');
  return res.redirect(301, `${want.protocol}//${want.host}${req.originalUrl}`);
}

module.exports = { canonicalHostRedirect, isExempt, isDirectAccess };
