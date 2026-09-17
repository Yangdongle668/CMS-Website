// =====================================================================
// SMTP TLS diagnostics.
//
// Why this exists: nodemailer surfaces TLS failures as an opaque
// `{ code: 'ESOCKET', command: 'CONN', message: 'certificate has expired' }`
// which says *that* the handshake failed but not *which* certificate is
// bad, when it expired, or whether the box's own clock is the problem.
// Desktop mail clients hide the same failure behind a "trust anyway?"
// dialog, so "it works in Foxmail/Outlook" does not mean the chain is
// valid — it usually means someone clicked through the warning once.
//
// probeSmtpTls() opens the same socket nodemailer would (implicit TLS on
// 465, STARTTLS on 587/25) with verification DISABLED so the handshake
// always completes, then reports:
//   • the full certificate chain with notBefore / notAfter per cert
//   • which cert in the chain is expired / not yet valid
//   • whether Node would have accepted the chain (authorized + reason)
//   • the remote server's own clock, parsed out of the SMTP greeting,
//     compared with ours — a large skew means the cert is fine and the
//     container's clock is wrong.
//
// This module never sends mail and never authenticates; it only looks.
// =====================================================================
const net = require('net');
const tls = require('tls');
const os = require('os');

const DEFAULT_TIMEOUT = 10000;

// SNI must not be an IP literal (RFC 6066); nodemailer applies the same
// rule, so the probe matches what the real connection does.
function sniFor(host, override) {
  if (override) return override;
  if (!host || net.isIP(host)) return undefined;
  return host;
}

// Read one complete SMTP reply. Multi-line replies use "250-foo" for
// continuations and "250 foo" for the final line.
function readReply(sock, timeoutMs) {
  return new Promise((resolve, reject) => {
    let buf = '';
    const cleanup = () => {
      clearTimeout(timer);
      sock.removeListener('data', onData);
      sock.removeListener('error', onErr);
      sock.removeListener('close', onClose);
    };
    const onData = (chunk) => {
      buf += chunk.toString('utf8');
      const lines = buf.split(/\r?\n/).filter((l) => l !== '');
      const last = lines[lines.length - 1];
      if (last && /^\d{3}(?: |$)/.test(last)) {
        cleanup();
        resolve(buf);
      }
    };
    const onErr = (e) => { cleanup(); reject(e); };
    const onClose = () => { cleanup(); reject(new Error('连接被服务器关闭')); };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('等待服务器响应超时'));
    }, timeoutMs);
    sock.on('data', onData);
    sock.on('error', onErr);
    sock.on('close', onClose);
  });
}

function writeLine(sock, line) {
  sock.write(line + '\r\n');
}

// Postfix / Exim / Exchange all put an RFC 2822 date in the greeting:
//   220 mail.example.com ESMTP Postfix; Thu, 17 Sep 2026 10:22:31 +0800
// Parsing it gives us the server's clock for free, which is the fastest
// way to tell "cert really expired" from "our clock is wrong".
function parseServerDate(greeting) {
  if (!greeting) return null;
  const m = greeting.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\d{1,2}\s+\w{3}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s*(?:[+-]\d{4}|GMT|UTC)?/);
  if (!m) return null;
  const d = new Date(m[0]);
  return Number.isNaN(d.getTime()) ? null : d;
}

function describeName(obj) {
  if (!obj || typeof obj !== 'object') return '';
  return obj.CN || obj.O || obj.OU || Object.values(obj).join(', ');
}

// Flatten cert.issuerCertificate into an array, stopping at the
// self-signed root (Node makes the root point at itself).
function flattenChain(leaf, now) {
  const chain = [];
  const seen = new Set();
  let cert = leaf;
  while (cert && cert.subject && !seen.has(cert.fingerprint256 || cert.fingerprint)) {
    seen.add(cert.fingerprint256 || cert.fingerprint);
    const from = cert.valid_from ? new Date(cert.valid_from) : null;
    const to = cert.valid_to ? new Date(cert.valid_to) : null;
    const msLeft = to ? to.getTime() - now.getTime() : null;
    chain.push({
      subject: describeName(cert.subject),
      issuer: describeName(cert.issuer),
      alt_names: cert.subjectaltname || '',
      valid_from: cert.valid_from || '',
      valid_to: cert.valid_to || '',
      days_left: msLeft == null ? null : Math.floor(msLeft / 86400000),
      expired: !!(to && to.getTime() < now.getTime()),
      not_yet_valid: !!(from && from.getTime() > now.getTime()),
      self_signed: describeName(cert.subject) === describeName(cert.issuer),
      fingerprint: cert.fingerprint256 || cert.fingerprint || '',
    });
    cert = cert.issuerCertificate;
    if (!cert || cert === leaf) break;
  }
  return chain;
}

// Capture what the TLS socket tells us about the peer, then say QUIT.
async function collectFromTlsSocket(tlsSock, opts, greeting) {
  const now = new Date();
  const peer = tlsSock.getPeerCertificate(true) || {};
  const chain = flattenChain(peer, now);
  // Snapshot the handshake details *before* the socket is torn down —
  // getCipher()/getProtocol() return null on a destroyed socket.
  const authorized = !!tlsSock.authorized;
  const authError = authorized
    ? ''
    : String((tlsSock.authorizationError && tlsSock.authorizationError.message) || tlsSock.authorizationError || '');
  const protocol = (tlsSock.getProtocol && tlsSock.getProtocol()) || '';
  const cipherInfo = (tlsSock.getCipher && tlsSock.getCipher()) || null;

  // On implicit TLS the greeting only arrives after the handshake.
  let banner = greeting;
  if (!banner) {
    try { banner = await readReply(tlsSock, opts.timeoutMs); } catch (_) { banner = ''; }
  }

  try { writeLine(tlsSock, 'QUIT'); } catch (_) {}
  try { tlsSock.destroy(); } catch (_) {}

  const serverDate = parseServerDate(banner);
  const skewSeconds = serverDate ? Math.round((serverDate.getTime() - now.getTime()) / 1000) : null;

  return {
    ok: true,
    handshake: 'completed',
    authorized,
    authorization_error: authError,
    protocol,
    cipher: (cipherInfo && cipherInfo.name) || '',
    greeting: String(banner || '').trim().split(/\r?\n/)[0] || '',
    chain,
    leaf: chain[0] || null,
    local_time: now.toISOString(),
    local_timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    server_time: serverDate ? serverDate.toISOString() : null,
    clock_skew_seconds: skewSeconds,
  };
}

// Implicit TLS (port 465): TLS first, SMTP inside it.
function probeImplicit(opts) {
  return new Promise((resolve, reject) => {
    const sock = tls.connect({
      host: opts.host,
      port: opts.port,
      servername: sniFor(opts.host, opts.servername),
      // Verification is deliberately off: we want the certificate even
      // when it is invalid — that is the whole point of the probe.
      rejectUnauthorized: false,
      ca: opts.ca || undefined,
      minVersion: opts.minVersion || undefined,
      timeout: opts.timeoutMs,
    });
    const fail = (e) => { try { sock.destroy(); } catch (_) {} reject(e); };
    sock.once('error', fail);
    sock.once('timeout', () => fail(new Error('TLS 握手超时（端口不通或被防火墙拦截）')));
    sock.once('secureConnect', () => {
      sock.removeListener('error', fail);
      collectFromTlsSocket(sock, opts, '').then(resolve, reject);
    });
  });
}

// STARTTLS (ports 587 / 25): plaintext SMTP, upgrade mid-session.
function probeStartTls(opts) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host: opts.host, port: opts.port });
    sock.setTimeout(opts.timeoutMs);
    const fail = (e) => { try { sock.destroy(); } catch (_) {} reject(e); };
    sock.once('error', fail);
    sock.once('timeout', () => fail(new Error('连接超时（端口不通或被防火墙拦截）')));

    sock.once('connect', async () => {
      try {
        const greeting = await readReply(sock, opts.timeoutMs);
        writeLine(sock, 'EHLO ' + (os.hostname() || 'localhost'));
        const ehlo = await readReply(sock, opts.timeoutMs);
        if (!/STARTTLS/i.test(ehlo)) {
          try { writeLine(sock, 'QUIT'); sock.destroy(); } catch (_) {}
          const serverDate = parseServerDate(greeting);
          return resolve({
            ok: true,
            handshake: 'not-offered',
            authorized: false,
            authorization_error: '服务器未提供 STARTTLS（EHLO 响应里没有 STARTTLS）',
            protocol: '',
            cipher: '',
            greeting: String(greeting || '').trim().split(/\r?\n/)[0] || '',
            chain: [],
            leaf: null,
            local_time: new Date().toISOString(),
            local_timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
            server_time: serverDate ? serverDate.toISOString() : null,
            clock_skew_seconds: serverDate ? Math.round((serverDate.getTime() - Date.now()) / 1000) : null,
          });
        }
        writeLine(sock, 'STARTTLS');
        const ready = await readReply(sock, opts.timeoutMs);
        if (!/^220/.test(ready.trim())) throw new Error('STARTTLS 被拒绝：' + ready.trim());

        sock.removeListener('error', fail);
        const tlsSock = tls.connect({
          socket: sock,
          servername: sniFor(opts.host, opts.servername),
          rejectUnauthorized: false,
          ca: opts.ca || undefined,
          minVersion: opts.minVersion || undefined,
        });
        tlsSock.once('error', fail);
        tlsSock.once('secureConnect', () => {
          tlsSock.removeListener('error', fail);
          // Greeting was already consumed before the upgrade.
          collectFromTlsSocket(tlsSock, opts, greeting).then(resolve, reject);
        });
      } catch (e) {
        fail(e);
      }
    });
  });
}

// Turn the raw probe into plain-language findings for the admin UI.
// Ordered most-actionable first.
function buildHints(r) {
  const hints = [];
  if (!r || !r.ok) return hints;

  const skew = r.clock_skew_seconds;
  if (skew != null && Math.abs(skew) > 300) {
    const dir = skew > 0 ? '慢' : '快';
    hints.push(
      `本机时钟比邮件服务器${dir}约 ${Math.abs(Math.round(skew / 60))} 分钟。` +
      '时钟漂移会让有效的证书被判定为“已过期/尚未生效”——先校准容器时间（宿主机 NTP + 重启容器）再试。'
    );
  }

  const expired = (r.chain || []).filter((c) => c.expired);
  const notYet = (r.chain || []).filter((c) => c.not_yet_valid);

  if (expired.length) {
    for (const c of expired) {
      const which = c === r.chain[0] ? '服务器证书' : (c.self_signed ? '根证书' : '中间证书');
      hints.push(`${which}「${c.subject}」已于 ${c.valid_to} 过期（${Math.abs(c.days_left)} 天前）。`);
    }
    if (expired.length && expired[0] !== r.chain[0]) {
      hints.push('过期的是链上的中间/根证书而不是服务器证书本身：邮件服务器发来的证书链是旧的，让服务商更新证书链；临时可用下面的“自定义 CA 证书”或关闭证书校验。');
    }
  }
  if (notYet.length) {
    hints.push(`证书「${notYet[0].subject}」尚未生效（${notYet[0].valid_from} 起）——通常也是本机时钟不对。`);
  }

  if (!r.authorized && !expired.length && !notYet.length && r.authorization_error) {
    if (/self.signed/i.test(r.authorization_error)) {
      hints.push('证书是自签名 / 私有 CA 签发的。把该 CA 的 PEM 贴到“自定义 CA 证书”里即可正常校验。');
    } else if (/altname|Hostname/i.test(r.authorization_error)) {
      hints.push('证书里的域名和你填的 SMTP 服务器地址对不上。用证书上的域名（见下面的 SAN）作为服务器地址，或填写“TLS SNI 服务器名”。');
    } else {
      hints.push('证书链校验失败：' + r.authorization_error);
    }
  }

  if (r.authorized) {
    hints.push('本机校验这台服务器的证书链没有问题 —— 如果发信仍然报证书错误，检查是否有别的出口（代理 / 中间盒）替换了证书。');
  }
  return hints;
}

// Public entry point. Never throws: a failed probe is itself a finding.
async function probeSmtpTls(cfg, options) {
  const opts = {
    host: cfg.host,
    port: parseInt(cfg.port, 10) || (cfg.secure ? 465 : 587),
    secure: !!cfg.secure,
    servername: cfg.tls_servername || '',
    ca: cfg.tls_ca || '',
    minVersion: cfg.tls_min_version || '',
    timeoutMs: (options && options.timeoutMs) || DEFAULT_TIMEOUT,
  };
  if (!opts.host) {
    return { ok: false, error: 'SMTP 服务器地址未配置', hints: [], target: opts.host + ':' + opts.port };
  }
  try {
    const raw = opts.secure ? await probeImplicit(opts) : await probeStartTls(opts);
    raw.target = opts.host + ':' + opts.port;
    raw.mode = opts.secure ? 'implicit TLS (SSL)' : 'STARTTLS';
    raw.hints = buildHints(raw);
    return raw;
  } catch (err) {
    return {
      ok: false,
      target: opts.host + ':' + opts.port,
      mode: opts.secure ? 'implicit TLS (SSL)' : 'STARTTLS',
      error: (err && err.message) || String(err),
      code: err && err.code,
      local_time: new Date().toISOString(),
      hints: [],
    };
  }
}

module.exports = { probeSmtpTls, parseServerDate, flattenChain, buildHints };
