// Injects the server-rendered nav and footer into every HTML response.
//
// It hooks res.send rather than being called from each renderer because
// there are five of them (pillar, product, article, application, blog
// index) plus tryServeHtml plus the 404 handler, and a nav that only
// some pages carry is the bug this is fixing. One hook covers every
// path, including ones added later.
//
// Ordering: this must be registered before the routes, so that its
// wrapper is installed on res.send by the time a route calls it.

const { injectChrome } = require('../services/site-chrome');

function siteChromeMiddleware(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api/')) return next();
  if (req.path.startsWith('/admin')) return next();

  const originalSend = res.send.bind(res);
  let sending = false;

  res.send = function patchedSend(body) {
    // Guard against re-entry: injectChrome resolves asynchronously and
    // then calls send again, which would otherwise re-enter this path.
    if (sending) return originalSend(body);

    const type = String(res.getHeader('Content-Type') || '');
    const looksHtml = typeof body === 'string'
      && (type.includes('text/html') || /^\s*<(?:!doctype|html)/i.test(body));
    if (!looksHtml) return originalSend(body);
    if (!body.includes('header-mount') && !body.includes('footer-mount')) {
      return originalSend(body);
    }

    sending = true;
    injectChrome(body)
      .then((out) => originalSend(out))
      // A failure here means no server-side nav on this response, which
      // is the status quo ante — far better than failing the page.
      .catch(() => originalSend(body));
    return res;
  };

  next();
}

module.exports = { siteChromeMiddleware };
