/** Стиловете на /oferta/<код> — светла страница, чете се на телефон и се печата чисто. */
export const OFFER_CSS = `
html:has(.of-doc),body:has(.of-doc){background:#f4f6f8;color-scheme:light}
.of-doc{--ink:#0b1220;--soft:#475569;--faint:#94a3b8;--cyan:#0e7490;--cyan-bg:#ecfeff;--amber:#b45309;--amber-bg:#fffbeb;--violet:#6d28d9;--line:#e2e8f0;--panel:#f8fafc;
  background:#f4f6f8;color:var(--ink);font-family:var(--of-ui),Arial,sans-serif;font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh}
.of-doc *{box-sizing:border-box}
.of-doc .wrap{max-width:860px;margin:0 auto;padding:0 20px 80px}
.of-doc .band{height:6px;background:var(--cyan)}
.of-doc .head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding:26px 0 18px;border-bottom:1px solid var(--line)}
.of-doc .brand{font-family:var(--of-display),Arial Black,sans-serif;font-size:22px;font-weight:700;letter-spacing:.01em}
.of-doc .brand b{color:var(--cyan);font-weight:700}
.of-doc .brand small{display:block;font-family:var(--of-ui),Arial,sans-serif;font-size:11px;letter-spacing:.12em;color:var(--faint);font-weight:600;margin-top:2px}
.of-doc .meta{font-size:13px;color:var(--soft);text-align:right;line-height:1.5}
.of-doc .eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--amber);font-weight:700;margin:34px 0 10px}
.of-doc h1{font-family:var(--of-display),Arial Black,sans-serif;font-size:clamp(28px,5vw,42px);line-height:1.1;margin:0 0 18px;letter-spacing:-.01em;text-wrap:balance}
.of-doc .greet{font-weight:700;font-size:19px;margin:0 0 8px}
.of-doc .lead{color:var(--soft);margin:0 0 16px;font-size:18px}
.of-doc .pain{background:var(--amber-bg);border-left:4px solid var(--amber);padding:14px 16px;border-radius:0 10px 10px 0;margin:0 0 16px}
.of-doc .pain small{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--amber);font-weight:700;margin-bottom:4px}
.of-doc .outcome{background:var(--cyan-bg);border-left:4px solid var(--cyan);padding:14px 16px;border-radius:0 10px 10px 0;font-weight:700;margin:0 0 8px}
.of-doc h2{font-family:var(--of-display),Arial Black,sans-serif;font-size:22px;margin:40px 0 16px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.of-doc .card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin:0 0 14px;box-shadow:0 1px 2px rgba(11,18,32,.04),0 10px 30px -22px rgba(14,116,144,.35)}
.of-doc .card .top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
.of-doc .card h3{margin:0;font-size:21px;line-height:1.25;font-weight:700}
.of-doc .card .sub{color:var(--soft);margin:6px 0 10px;font-size:16px}
.of-doc .price{text-align:right;white-space:nowrap}
.of-doc .price b{display:block;font-size:24px;color:var(--amber);font-weight:700;line-height:1.1}
.of-doc .price span{display:block;font-size:12.5px;color:var(--soft)}
.of-doc ul.pts{margin:0;padding:0;list-style:none}
.of-doc ul.pts li{position:relative;padding-left:22px;margin:6px 0;font-size:16.5px}
.of-doc ul.pts li::before{content:"";position:absolute;left:4px;top:11px;width:8px;height:8px;border-radius:50%;background:var(--cyan)}
.of-doc .res{margin:12px 0 0;color:var(--cyan);font-weight:700;font-size:16px}
.of-doc .not{margin:8px 0 0;color:var(--faint);font-size:14px}
.of-doc .note{margin:8px 0 0;color:var(--soft);font-style:italic;font-size:15px}
.of-doc table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden}
.of-doc td{padding:12px 16px;border-bottom:1px solid var(--line);font-size:16px;vertical-align:top}
.of-doc tr:last-child td{border-bottom:0}
.of-doc td.r{text-align:right;white-space:nowrap}
.of-doc td small{display:block;color:var(--faint);font-size:13px}
.of-doc tr.tot td{background:var(--panel);font-weight:700}
.of-doc tr.tot td.r{color:var(--amber);font-size:20px}
.of-doc .vat{color:var(--soft);font-size:14px;margin:10px 0 0}
.of-doc .inst{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:14px 0 0}
.of-doc .inst small{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--violet);font-weight:700;margin-bottom:4px}
.of-doc .inst em{display:block;color:var(--faint);font-style:normal;font-size:13px;margin-top:6px}
.of-doc ol.steps{margin:0;padding:0;list-style:none;counter-reset:s}
.of-doc ol.steps li{counter-increment:s;position:relative;padding-left:44px;margin:0 0 12px;font-size:16.5px}
.of-doc ol.steps li::before{content:counter(s);position:absolute;left:0;top:1px;width:30px;height:30px;border-radius:50%;background:var(--cyan);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px}
.of-doc ul.terms{margin:0;padding-left:20px;color:var(--soft);font-size:15.5px}
.of-doc ul.terms li{margin:4px 0}
.of-doc .ps{color:var(--soft);font-style:italic;margin:16px 0 0}
.of-doc .cta{display:flex;flex-wrap:wrap;gap:10px;margin:28px 0 0}
.of-doc .btn{display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:999px;font-weight:700;text-decoration:none;font-size:15.5px;border:1px solid transparent}
.of-doc .btn.p{background:var(--cyan);color:#fff}
.of-doc .btn.s{background:#fff;color:var(--ink);border-color:var(--line)}
.of-doc .sign{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;margin:36px 0 0;padding-top:18px;border-top:1px solid var(--line)}
.of-doc .sign b{display:block;font-size:18px}
.of-doc .sign .role{color:var(--soft);font-size:14px}
.of-doc .sign a{color:var(--cyan);text-decoration:none}
.of-doc .sign .right{text-align:right;color:var(--soft);font-size:14px}
.of-doc .foot{margin:40px 0 0;color:var(--faint);font-size:12.5px;text-align:center}
@media (max-width:640px){.of-doc .head{flex-direction:column;align-items:flex-start}.of-doc .meta{text-align:left}.of-doc .card .top{flex-direction:column}.of-doc .price{text-align:left}.of-doc .sign .right{text-align:left}}
@media print{.of-doc{background:#fff}.of-doc .cta{display:none}.of-doc .card{break-inside:avoid;box-shadow:none}}
`;
