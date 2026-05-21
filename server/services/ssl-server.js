'use strict';
// Manages the two extra TCP listeners needed for custom-domain SSL:
//
//   Port 80  (HTTP)   — serves ACME HTTP-01 challenge tokens and
//                        redirects all other traffic to HTTPS.
//   Port 443 (HTTPS)  — serves the main Express app with the
//                        provisioned TLS certificate.
//
// Neither server is started until the operator binds a domain in the
// admin panel.  A SNICallback lets us hot-swap the cert without restart.

const http = require('http');
const https = require('https');
const tls = require('tls');

let httpServer = null;
let httpsServer = null;
let secureCtx = null;
let expressApp = null;   // set via setApp() before first use

function setApp(app) {
  expressApp = app;
}

// Minimal HTTP handler: ACME challenge tokens first, then 301 redirect.
function httpHandler(req, res) {
  const acme = require('./acme-manager');
  if (req.url && req.url.startsWith('/.well-known/acme-challenge/')) {
    const token = req.url.slice('/.well-known/acme-challenge/'.length);
    const keyAuth = acme.getChallengeResponse(token);
    if (keyAuth) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end(keyAuth);
    }
    res.writeHead(404);
    return res.end('Not found');
  }
  const host = (req.headers.host || '').replace(/:\d+$/, '');
  res.writeHead(301, { Location: `https://${host}${req.url}` });
  res.end();
}

// Start the HTTP server on port 80 if it is not already running.
// Called before every ACME provisioning attempt so challenges are
// always reachable even if this is the very first domain binding.
function ensureHttpServer() {
  if (httpServer) return;
  httpServer = http.createServer(httpHandler);
  httpServer.on('error', (err) => {
    console.error('[ssl] HTTP :80 error:', err.message);
    if (err.code === 'EADDRINUSE') {
      console.error('[ssl] Port 80 is in use — ACME challenges will not be served. ' +
        'Make sure nothing else is listening on port 80.');
    }
    httpServer = null;
  });
  httpServer.listen(80, () => console.log('[ssl] HTTP server :80 started (ACME + redirect)'));
}

// Load (or refresh) the TLS certificate for `domain` and start the
// HTTPS server if it is not already running.  Subsequent calls just
// update the secure context — no restart required.
function reloadCert(domain) {
  const acme = require('./acme-manager');
  try {
    const { key, cert } = acme.loadCert(domain);
    secureCtx = tls.createSecureContext({ key, cert });
    console.log(`[ssl] TLS context updated for ${domain}`);
  } catch (err) {
    console.error('[ssl] failed to load cert:', err.message);
    return;
  }

  if (!httpsServer) {
    if (!expressApp) {
      console.error('[ssl] HTTPS server cannot start: Express app not set');
      return;
    }
    httpsServer = https.createServer({
      SNICallback: (_servername, cb) => cb(null, secureCtx),
    }, expressApp);
    httpsServer.on('error', (err) => {
      console.error('[ssl] HTTPS :443 error:', err.message);
      if (err.code === 'EADDRINUSE') {
        console.error('[ssl] Port 443 is in use.');
      }
      httpsServer = null;
    });
    httpsServer.listen(443, () => console.log('[ssl] HTTPS server :443 started'));
  }
  // If already running, SNICallback picks up the new context automatically.
}

function close() {
  if (httpServer)  { try { httpServer.close();  } catch (_) {} httpServer  = null; }
  if (httpsServer) { try { httpsServer.close(); } catch (_) {} httpsServer = null; }
}

module.exports = { setApp, ensureHttpServer, reloadCert, close };
