#!/usr/bin/env node
// =====================================================================
// SMTP doctor — diagnose TLS/certificate failures from inside the
// container, without the admin UI:
//
//   docker compose exec app node scripts/smtp-doctor.js
//   node scripts/smtp-doctor.js smtp.example.com:465        # ad-hoc host
//   node scripts/smtp-doctor.js mail.example.com:2525 starttls
//
// Prints the certificate chain with validity dates, whether Node
// accepts it, and the clock difference between this box and the mail
// server — which is what tells "the certificate really expired" apart
// from "this container's clock is wrong".
//
// Reads the saved settings.smtp row when reachable, else the SMTP_*
// env vars. Never sends mail, never authenticates.
// =====================================================================
require('dotenv').config();

const { probeSmtpTls } = require('../server/services/smtp-diagnostics');

// `host[:port] [ssl|starttls]`. Without an explicit mode, 587/25 mean
// STARTTLS and everything else means implicit TLS.
function parseTarget(arg, mode) {
  if (!arg) return null;
  const m = String(arg).match(/^(?:(smtps?):\/\/)?([^:/]+)(?::(\d+))?$/);
  if (!m) return null;
  const port = parseInt(m[3], 10) || (m[1] === 'smtp' ? 587 : 465);
  let secure = port !== 587 && port !== 25;
  if (/^starttls$/i.test(mode || '')) secure = false;
  else if (/^(ssl|tls|smtps)$/i.test(mode || '')) secure = true;
  return { host: m[2], port, secure };
}

// CJK glyphs occupy two terminal columns, so pad by display width
// rather than by String.length or the labels come out ragged.
function pad(label, width) {
  const s = String(label);
  let w = 0;
  for (const ch of s) w += /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1;
  return s + ' '.repeat(Math.max(1, width - w));
}

function line(label, value) {
  console.log('  ' + pad(label, 14) + (value == null ? '' : value));
}

async function main() {
  const override = parseTarget(process.argv[2], process.argv[3]);
  let cfg;
  if (override) {
    cfg = override;
    console.log(`\n=== SMTP doctor — ${cfg.host}:${cfg.port} (命令行指定) ===\n`);
  } else {
    const mailer = require('../server/services/mailer');
    cfg = await mailer.loadConfig();
    console.log(`\n=== SMTP doctor — ${cfg.host || '(未配置)'}:${cfg.port} ===\n`);
    if (!cfg.host) {
      console.error('SMTP 服务器地址未配置：在 /admin/smtp.html 里填写，或设置 SMTP_HOST 环境变量。');
      console.error('也可以直接指定目标：node scripts/smtp-doctor.js smtp.example.com:465\n');
      process.exit(2);
    }
    line('证书校验', cfg.tls_reject_unauthorized === false ? '已关闭 (不安全)' : '开启');
    if (cfg.tls_ca) line('自定义 CA', '已加载 (' + cfg.tls_ca.length + ' 字节)');
    if (cfg.tls_servername) line('SNI', cfg.tls_servername);
    if (cfg.tls_min_version) line('最低 TLS', cfg.tls_min_version);
    console.log('');
  }

  const r = await probeSmtpTls(cfg, { timeoutMs: 10000 });

  if (!r.ok) {
    console.error(`✗ 连接失败 (${r.mode})：${r.error}`);
    console.error('  端口不通通常是防火墙/安全组；连接被重置通常是服务商限制了本机 IP。\n');
    process.exit(1);
  }

  console.log(`连接方式：${r.mode}   ${r.protocol || ''} ${r.cipher || ''}`);
  if (r.greeting) console.log(`服务器问候：${r.greeting}`);
  console.log('');

  console.log(r.authorized
    ? '✓ 证书链校验通过（Node 接受这张证书）'
    : `✗ 证书链校验失败：${r.authorization_error}`);
  console.log('');

  (r.chain || []).forEach((c, i) => {
    const role = i === 0 ? '服务器证书' : (c.self_signed ? '根证书' : `中间证书 ${i}`);
    const state = c.expired
      ? `!! 已过期 ${Math.abs(c.days_left)} 天`
      : (c.not_yet_valid ? '!! 尚未生效' : `剩余 ${c.days_left} 天`);
    console.log(`[${role}] ${c.subject}`);
    line('签发者', c.issuer);
    if (i === 0 && c.alt_names) line('SAN', c.alt_names);
    line('有效期', `${c.valid_from} → ${c.valid_to}   ${state}`);
    console.log('');
  });

  line('本机时间', `${r.local_time}  (TZ=${r.local_timezone || '?'})`);
  line('服务器时间', r.server_time || '未知（问候语里没有时间）');
  if (r.clock_skew_seconds != null) {
    const s = r.clock_skew_seconds;
    line('时钟差', Math.abs(s) > 300
      ? `${Math.round(s / 60)} 分钟  !! 本机时钟不准，会把有效证书误判为过期`
      : `${s} 秒 (正常)`);
  }
  console.log('');

  if ((r.hints || []).length) {
    console.log('诊断结论：');
    r.hints.forEach((h) => console.log('  • ' + h));
    console.log('');
  }

  process.exit(r.authorized ? 0 : 1);
}

main().catch((e) => {
  console.error('smtp-doctor 失败：', (e && e.message) || e);
  process.exit(1);
});
