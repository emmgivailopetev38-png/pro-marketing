/**
 * Оферта за Андрея (Full House, фулфилмънт център · +359 888 166 368) — 02.11.2026.
 *
 * Разговор с Ивайло 01.11.2026: иска AI call агенти за потвърждение на пратки за 2–3 държави и цени на едро,
 * които да препродава на своите клиенти (онлайн магазини). Решено от Ивайло: инсталация 500 € без ДДС на агент.
 * Останалите цени са по сметката „razhod-i-ceni-na-edro-2026-11-01.md“ (Продажби/Full House): 190 €/мес платформа
 * на държава · на потвърдено обаждане BG 0,45 € / RO 0,25 € / GR 0,30 € · −15 % над 5 000 · −25 % над 15 000 на месец ·
 * минимум 500 обаждания или 190 €. Всичко без ДДС. Обръщението е на „ти“.
 *
 * Втората половина е каталогът „какво още можем да добавим“ — допълнителни агенти и услуги за фулфилмънт и
 * неговите магазини, по същия модел на едро. Процент потвърдени не обещаваме — обещаваме пилот с числа.
 */

const PDF = "/oferta/andreya/ProMarketing-za-Full-House.pdf";
const SRESHTA = "https://promarketing.pw/sreshta";

const CSS = `
/* сайтът е тъмен (color-scheme: dark в globals.css) — тази страница е светла докрай,
   иначе в PDF-а полетата на листа излизат тъмни */
html:has(.fh-doc),body:has(.fh-doc){background:#F3F6F7;color-scheme:light}
.fh-doc{
  --ground:#F3F6F7; --panel:#E6EDEF; --surface:#FFFFFF;
  --ink:#0E1F26; --ink-2:#3B4F58; --ink-3:#6E838C;
  --rule:#D3DEE2; --rule-soft:#E3EBEE;
  --teal:#0F4C5C; --teal-soft:#E0EEF1; --amber:#F2A541; --amber-ink:#8A5A12; --red:#C8321F; --green:#1F7A4D;
  --shadow:0 1px 2px rgba(14,31,38,.05), 0 10px 28px -18px rgba(15,76,92,.35);
  background:var(--ground); color:var(--ink);
  font-family:var(--fh-ui),Arial,sans-serif; font-size:17px; line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
.fh-doc *{box-sizing:border-box}
.fh-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.fh-doc h1,.fh-doc h2{font-family:var(--fh-display),Arial Black,sans-serif;font-weight:700;letter-spacing:-.02em;text-wrap:balance}
.fh-doc .sechead{break-inside:avoid;break-after:avoid}
.fh-doc h3{font-family:var(--fh-ui),Arial,sans-serif;font-weight:700;letter-spacing:-.01em;text-wrap:balance}
.fh-doc a{color:var(--teal);text-underline-offset:3px}
.fh-doc a:focus-visible{outline:2px solid var(--teal);outline-offset:3px;border-radius:2px}
.fh-doc p{margin:0}
.fh-doc .num,.fh-doc .mono{font-family:var(--fh-mono),monospace;font-variant-numeric:tabular-nums}

/* ── шапка ── */
.fh-doc .masthead{padding:58px 0 34px;border-bottom:1px solid var(--rule)}
.fh-doc .eyebrow{font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--amber-ink);margin:0 0 18px}
.fh-doc h1{font-size:46px;line-height:1.06;margin:0 0 18px;max-width:24ch}
.fh-doc h1 em{font-style:normal;color:var(--teal)}
.fh-doc .deck{font-size:19px;line-height:1.56;color:var(--ink-2);max-width:62ch;margin:0 0 22px}
.fh-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-size:14px;color:var(--ink-3)}
.fh-doc .byline a{font-weight:600}

/* ── секции ── */
.fh-doc section{margin:54px 0 0}
.fh-doc .kick{font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--amber-ink);margin:0 0 10px}
.fh-doc .h2sub{font-size:32px;line-height:1.14;margin:0 0 14px;max-width:30ch}
.fh-doc .lead{font-size:17px;color:var(--ink-2);max-width:66ch;margin:0 0 22px}
.fh-doc .note{font-size:13.5px;color:var(--ink-3);margin:12px 0 0;max-width:78ch}

/* числата */
.fh-doc .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:0 0 18px}
.fh-doc .stat{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.fh-doc .stat b{display:block;font-family:var(--fh-display),sans-serif;font-weight:700;font-size:28px;line-height:1.05;color:var(--teal);font-variant-numeric:tabular-nums}
.fh-doc .stat b.bad{color:var(--red)}
.fh-doc .stat span{display:block;font-size:13px;line-height:1.4;color:var(--ink-3);margin-top:6px}

.fh-doc .facts{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:0 0 20px}
.fh-doc .fact{background:var(--panel);border-radius:12px;padding:18px 20px}
.fh-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--teal)}
.fh-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.fh-doc .pull{border-left:4px solid var(--amber);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px}
.fh-doc .pull p{font-family:var(--fh-display),sans-serif;font-weight:600;font-size:20px;line-height:1.4;color:var(--ink)}

/* как работи */
.fh-doc .flow{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.fh-doc .fstep{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:18px 16px 16px;box-shadow:var(--shadow)}
.fh-doc .fstep .n{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:999px;background:var(--teal);color:#fff;font-family:var(--fh-mono),monospace;font-size:13px;margin:0 0 10px}
.fh-doc .fstep h3{font-size:15px;margin:0 0 6px}
.fh-doc .fstep p{font-size:13.5px;line-height:1.5;color:var(--ink-2)}

/* разговорът */
.fh-doc .talk{background:var(--ink);color:#EAF1F3;border-radius:16px;padding:24px 26px;display:grid;grid-template-columns:1fr 1fr;gap:18px 28px;margin-top:18px}
.fh-doc .talk h3{color:#fff;font-size:15px;margin:0 0 10px}
.fh-doc .talk .line{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:14.5px;line-height:1.5;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.1)}
.fh-doc .talk .line:last-child{border-bottom:none}
.fh-doc .talk .who{font-family:var(--fh-mono),monospace;font-size:12px;letter-spacing:.06em;color:var(--amber);padding-top:3px;white-space:nowrap}
.fh-doc .talk .who.k{color:#9CC9D6}
.fh-doc .talk .res{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.fh-doc .talk .res span{font-family:var(--fh-mono),monospace;font-size:12.5px;border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:5px 11px;color:#DCE7EA}

/* цени */
.fh-doc .tbl{width:100%;border-collapse:separate;border-spacing:0;background:var(--surface);border:1px solid var(--rule);border-radius:14px;overflow:hidden;font-size:14.5px}
.fh-doc .tbl th,.fh-doc .tbl td{padding:13px 16px;text-align:left;border-bottom:1px solid var(--rule-soft);vertical-align:top}
.fh-doc .tbl thead th{background:var(--panel);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);font-weight:600}
.fh-doc .tbl tbody th{font-weight:700;color:var(--ink);width:28%}
.fh-doc .tbl tbody tr:last-child td,.fh-doc .tbl tbody tr:last-child th{border-bottom:none}
.fh-doc .tbl td.price{font-family:var(--fh-mono),monospace;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--teal);font-weight:600;font-size:15.5px;width:22%}
.fh-doc .tbl td.price small{display:block;font-family:var(--fh-ui),sans-serif;font-weight:500;font-size:12px;color:var(--ink-3);white-space:normal;margin-top:2px}
.fh-doc .tblwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}

.fh-doc .countries{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0 0}
.fh-doc .cty{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:18px 20px;box-shadow:var(--shadow)}
.fh-doc .cty .flag{font-size:26px;line-height:1;margin:0 0 8px;display:block}
.fh-doc .cty h3{font-size:15px;margin:0 0 6px}
.fh-doc .cty .p{font-family:var(--fh-display),sans-serif;font-weight:700;font-size:34px;line-height:1;color:var(--teal);font-variant-numeric:tabular-nums}
.fh-doc .cty .p small{font-family:var(--fh-ui),sans-serif;font-size:13px;font-weight:600;color:var(--ink-3);margin-left:6px}
.fh-doc .cty p.d{font-size:13.5px;color:var(--ink-2);margin-top:8px;line-height:1.5}

.fh-doc .deal{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin-top:18px}
.fh-doc .calc{background:var(--teal);color:#EAF4F6;border-radius:16px;padding:24px 26px}
.fh-doc .calc h3{color:#fff;font-size:17px;margin:0 0 12px}
.fh-doc .calc .row{display:flex;justify-content:space-between;gap:12px;align-items:baseline;font-size:15px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.16)}
.fh-doc .calc .row b{font-family:var(--fh-mono),monospace;font-weight:500;font-variant-numeric:tabular-nums;white-space:nowrap}
.fh-doc .calc .row.tot{border-bottom:none;padding-top:12px;font-size:17px}
.fh-doc .calc .row.tot b{color:#FFE14D;font-size:24px;font-family:var(--fh-display),sans-serif;font-weight:700}
.fh-doc .calc p.d{font-size:13px;color:#BFD7DD;margin-top:12px;line-height:1.5}
.fh-doc .terms{background:var(--panel);border-radius:16px;padding:24px 26px}
.fh-doc .terms h3{font-size:17px;margin:0 0 12px}
.fh-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px}
.fh-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15px;line-height:1.5;color:var(--ink-2)}
.fh-doc .list li i{font-style:normal;color:var(--teal);font-weight:700}

/* пилотът */
.fh-doc .days{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.fh-doc .step{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.fh-doc .step b{display:block;font-family:var(--fh-mono),monospace;font-weight:500;font-size:12.5px;letter-spacing:.08em;color:var(--amber-ink);margin:0 0 6px}
.fh-doc .step h3{font-size:15px;margin:0 0 6px}
.fh-doc .step p{font-size:14px;line-height:1.5;color:var(--ink-2)}
.fh-doc .step.go{border:2px solid var(--teal);background:var(--teal-soft)}

/* каталогът */
.fh-doc .cat{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.fh-doc .cat.three{grid-template-columns:repeat(3,1fr)}
.fh-doc .item{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:20px 20px 18px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:8px}
.fh-doc .item .tag{font-family:var(--fh-mono),monospace;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--amber-ink)}
.fh-doc .item h3{font-size:16.5px;margin:0}
.fh-doc .item p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.fh-doc .item .pr{margin-top:auto;padding-top:10px;border-top:1px dashed var(--rule);font-size:13.5px;color:var(--ink-3)}
.fh-doc .item .pr b{font-family:var(--fh-mono),monospace;font-weight:500;color:var(--teal)}
.fh-doc .item.svc{background:var(--panel);border-color:transparent;box-shadow:none}

/* правилата */
.fh-doc .rules{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.fh-doc .rule{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.fh-doc .rule h3{font-size:15px;margin:0 0 6px;color:var(--green)}
.fh-doc .rule p{font-size:14px;line-height:1.5;color:var(--ink-2)}

/* от теб */
.fh-doc .need{counter-reset:n;display:grid;grid-template-columns:repeat(2,1fr);gap:10px 18px;margin:0;padding:0;list-style:none}
.fh-doc .need li{counter-increment:n;display:grid;grid-template-columns:auto 1fr;gap:12px;font-size:15px;line-height:1.5;color:var(--ink-2);background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:12px 14px}
.fh-doc .need li::before{content:counter(n);font-family:var(--fh-mono),monospace;font-size:13px;color:var(--amber-ink);padding-top:2px}

/* ── следващата стъпка ── */
.fh-doc .closing{background:var(--teal-soft);border:1px solid #C3DAE0;border-left:4px solid var(--teal);border-radius:16px;padding:30px 32px 28px;margin-top:54px}
.fh-doc .closing h2{color:var(--teal);font-size:30px;margin:0 0 10px}
.fh-doc .closing p{font-size:17px;line-height:1.6;color:var(--ink);max-width:64ch}
.fh-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.fh-doc .closing a.btn{font-weight:600;text-decoration:none;color:#fff;background:var(--teal);border-radius:10px;padding:12px 18px;font-size:15px}
.fh-doc .closing a.ghost{color:var(--teal);background:transparent;border:1px solid var(--teal)}
.fh-doc .sig{break-inside:avoid;margin:26px 0 0;font-size:13.5px;color:var(--ink-3);line-height:1.7;border-top:1px solid #C3DAE0;padding-top:16px;max-width:none}
.fh-doc .sig b{color:var(--ink)}
.fh-doc .sig .ln{display:block}

@media (max-width:960px){
  .fh-doc .flow{grid-template-columns:repeat(3,1fr)}
  .fh-doc .cat.three,.fh-doc .rules{grid-template-columns:repeat(2,1fr)}
  .fh-doc .days{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:860px){
  .fh-doc .stats{grid-template-columns:repeat(2,1fr)}
  .fh-doc .deal,.fh-doc .talk{grid-template-columns:1fr}
}
@media (max-width:760px){
  .fh-doc .wrap{padding:0 16px 72px}
  .fh-doc h1{font-size:32px}
  .fh-doc .h2sub{font-size:26px}
  .fh-doc .deck{font-size:17.5px}
  .fh-doc .flow,.fh-doc .cat,.fh-doc .cat.three,.fh-doc .rules,.fh-doc .days,.fh-doc .facts,.fh-doc .countries,.fh-doc .need{grid-template-columns:1fr}
  .fh-doc .masthead{padding:36px 0 26px}
  .fh-doc .closing{padding:24px 20px}
  .fh-doc .pull p{font-size:18px}
  .fh-doc .tbl tbody th{width:34%}
}
@media print{
  :root,html,body{color-scheme:light;background:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .fh-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .fh-doc .wrap{max-width:none;padding:0}
  .fh-doc .masthead{padding:0 0 12px}
  .fh-doc .sechead{break-inside:avoid;break-after:avoid;page-break-after:avoid}
  .fh-doc h1{font-size:28px;margin-bottom:10px;max-width:none}
  .fh-doc .deck{font-size:14px;max-width:none}
  .fh-doc .byline .pdf{display:none}
  .fh-doc section{margin:13px 0 0}
  .fh-doc .h2sub,.fh-doc .lead{max-width:none}
  .fh-doc .kick,.fh-doc .h2sub,.fh-doc .lead{break-after:avoid}
  .fh-doc .h2sub{font-size:20px;margin-bottom:8px}
  .fh-doc .lead{font-size:12.5px;margin-bottom:10px}
  .fh-doc .stat,.fh-doc .fact,.fh-doc .fstep,.fh-doc .item,.fh-doc .pull,.fh-doc .step,.fh-doc .cty,.fh-doc .calc,.fh-doc .terms,.fh-doc .rule,.fh-doc .need li,.fh-doc .tbl tr,.fh-doc .talk{break-inside:avoid}
  .fh-doc .stats{grid-template-columns:repeat(4,1fr);gap:8px}
  .fh-doc .stat{padding:10px 12px}
  .fh-doc .stat b{font-size:20px}
  .fh-doc .stat span{font-size:11px}
  .fh-doc .facts{grid-template-columns:repeat(2,1fr);gap:8px}
  .fh-doc .fact{padding:10px 12px}
  .fh-doc .fact h3{font-size:13px}
  .fh-doc .fact p{font-size:11.5px}
  .fh-doc .pull{padding:10px 16px}
  .fh-doc .pull p{font-size:15px}
  .fh-doc .flow{grid-template-columns:repeat(5,1fr);gap:7px}
  .fh-doc .fstep{padding:10px 10px 9px;box-shadow:none}
  .fh-doc .fstep .n{width:22px;height:22px;font-size:11px;margin-bottom:6px}
  .fh-doc .fstep h3{font-size:12px}
  .fh-doc .fstep p{font-size:10.5px}
  .fh-doc .talk{grid-template-columns:1fr 1fr;padding:12px 14px;gap:8px 16px;margin-top:10px}
  .fh-doc .talk h3{font-size:12.5px;margin-bottom:4px}
  .fh-doc .talk .line{font-size:11.5px;padding:3px 0}
  .fh-doc .talk .who{font-size:10px}
  .fh-doc .talk .res span{font-size:10.5px;padding:3px 8px}
  .fh-doc .tbl{font-size:11.5px}
  .fh-doc .tbl th,.fh-doc .tbl td{padding:6px 10px}
  .fh-doc .tbl td.price{font-size:12.5px}
  .fh-doc .tbl td.price small{font-size:10px}
  .fh-doc .countries{grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
  .fh-doc .cty{padding:10px 12px;box-shadow:none}
  .fh-doc .cty .flag{font-size:18px;margin-bottom:4px}
  .fh-doc .cty h3{font-size:12.5px}
  .fh-doc .cty .p{font-size:24px}
  .fh-doc .cty p.d{font-size:11px;margin-top:4px}
  .fh-doc .deal{grid-template-columns:1.1fr .9fr;gap:10px;margin-top:10px}
  .fh-doc .calc,.fh-doc .terms{padding:12px 14px}
  .fh-doc .calc h3,.fh-doc .terms h3{font-size:14px;margin-bottom:6px}
  .fh-doc .calc .row{font-size:12px;padding:4px 0}
  .fh-doc .calc .row.tot{font-size:13.5px;padding-top:7px}
  .fh-doc .calc .row.tot b{font-size:18px}
  .fh-doc .calc p.d{font-size:10.5px;margin-top:7px}
  .fh-doc .list{gap:5px}
  .fh-doc .list li{font-size:12px}
  .fh-doc .days{grid-template-columns:repeat(2,1fr);gap:8px}
  .fh-doc .step{padding:9px 12px}
  .fh-doc .step h3{font-size:12.5px}
  .fh-doc .step p{font-size:11px}
  .fh-doc .cat,.fh-doc .cat.three{gap:8px}
  .fh-doc .cat{grid-template-columns:repeat(2,1fr)}
  .fh-doc .cat.three{grid-template-columns:repeat(3,1fr)}
  .fh-doc .item{padding:10px 12px 9px;box-shadow:none;gap:4px}
  .fh-doc .item .tag{font-size:9.5px}
  .fh-doc .item h3{font-size:12.5px}
  .fh-doc .item p{font-size:11px;line-height:1.46}
  .fh-doc .item .pr{font-size:10.5px;padding-top:6px}
  .fh-doc .rules{grid-template-columns:repeat(3,1fr);gap:8px}
  .fh-doc .rule{padding:9px 12px}
  .fh-doc .rule h3{font-size:12.5px}
  .fh-doc .rule p{font-size:11px}
  .fh-doc .need{grid-template-columns:repeat(2,1fr);gap:6px 10px}
  .fh-doc .need li{font-size:11.5px;padding:7px 10px}
  .fh-doc .note{font-size:11px}
  .fh-doc .closing{padding:14px 18px;margin-top:16px;break-inside:avoid}
  .fh-doc .sig{margin:8px 0 0;font-size:10.5px;line-height:1.45}
  .fh-doc .sig .ln{display:inline}
  .fh-doc .sig .ln+.ln::before{content:"  ·  "}
  .fh-doc .closing h2{font-size:20px}
  .fh-doc .closing p{font-size:13.5px}
  .fh-doc .closing .ctas{display:none}
  .fh-doc .fact,.fh-doc .closing,.fh-doc .step.go,.fh-doc .talk,.fh-doc .calc,.fh-doc .terms,.fh-doc .item.svc,.fh-doc .tbl th,.fh-doc .fstep .n{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const STATS = [
  { b: "1–2 €", s: "струва на фулфилмънта едно потвърждение от човек — заплата, осигуровки, празни часове", bad: true },
  { b: "~1 мин", s: "трае разговорът на агента: адрес, час, наложен платеж, записан отговор", bad: false },
  { b: "3", s: "държави от първия ден — България, Румъния, Гърция, с местен номер и език", bad: false },
  { b: "0 €", s: "за невдигнати опити — плащаш само свързан разговор", bad: false },
];

const VIDYAH = [
  {
    h: "Непотвърдената пратка е най-скъпата пратка",
    p: "Куриерът отива, клиентът го няма или се е отказал, наложеният платеж не влиза, стоката се връща и се блокира за седмица. Едно обаждане преди изпращане спестява точно този кръг — и твоите клиенти го знаят.",
  },
  {
    h: "Хората не стигат точно когато трябва",
    p: "В пика — Черен петък, Коледа, кампания на магазина — пратките се удвояват, операторите не. Агентът води десетки разговори едновременно и свършва за час това, за което екип върши цял ден.",
  },
  {
    h: "Три държави, един агент",
    p: "Български, румънски и гръцки — един и същ процес, един и същ скрипт, местен номер за всяка държава. Клиентът в Букурещ чува глас на румънски от румънски номер.",
  },
  {
    h: "Под твоята марка, на твоя цена",
    p: "Агентът се представя от името на магазина или на Full House — не от наше. Ти определяш какво плащат твоите клиенти; ние сме доставчикът зад кулисите.",
  },
  {
    h: "Отговорът влиза в твоята система",
    p: "Потвърдена, нов адрес, друга дата, отказ, не вдига — всяко обаждане връща статус към твоя софтуер за пратки по webhook или API, плюс запис и кратко резюме. Нищо не се преписва на ръка.",
  },
  {
    h: "Честно и по правилата",
    p: "Агентът казва, че е AI асистент — както изисква европейският регламент. Обажданията са само за обслужване на вече направена поръчка, данните остават при теб, договор за обработка на данни от ден един.",
  },
];

const FLOW = [
  { h: "Пратката влиза", p: "Твоята система ни праща име, телефон, адрес, сума и куриер — по webhook, API или Excel. Ти избираш кога: при заявка, преди куриера или при неуспешна доставка." },
  { h: "Агентът звъни", p: "В прозорец, който ти задаваш (например 10:00–19:00 местно време), от местен номер на държавата, на езика на клиента." },
  { h: "Разговорът", p: "Представя се, потвърждава адреса, деня и наложения платеж. Сменя адрес или дата, ако трябва. Отговаря на 2–3 обичайни въпроса — кога идва, колко е доставката." },
  { h: "Резултатът се връща", p: "Потвърдена · промяна · отказ · не вдига. Статусът е в системата ти секунди след затварянето, със запис и резюме. Невдигнал → нов опит след 2 часа, до 3 опита." },
  { h: "Отчетът", p: "Табло: обаждания, % потвърдени, % промени, % откази — по магазин и по държава. За теб и за всеки твой клиент поотделно." },
];

const TALK = [
  { who: "Агент", k: false, t: "Добър ден, Мария Иванова? Обажда се Елена от името на магазин „Х“ — аз съм AI асистент. Звъня за поръчката ви от вчера, за да потвърдим доставката. Имате ли половин минута?" },
  { who: "Клиент", k: true, t: "Да, кажете." },
  { who: "Агент", k: false, t: "Пратката е до офис на Еконт в Русе, ул. „Борисова“ 12, наложен платеж 64,90 лв. Вярно ли е и ще я вземете ли утре или в сряда?" },
  { who: "Клиент", k: true, t: "В сряда, и по-добре до адрес — ул. „Александровска“ 5." },
  { who: "Агент", k: false, t: "Записах: до адрес, ул. „Александровска“ 5, Русе, в сряда. Куриерът ще ви звънне преди да дойде. Хубав ден!" },
];

const PRICES: [string, string, string, string][] = [
  ["Инсталация на агент", "500 €", "еднократно · една държава = един агент", "Език и глас, местен номер, скрипт по твоя процес, интеграция със системата за пратки (webhook / API / Excel), тестове с реални пратки, кратко обучение на екипа ти."],
  ["Платформа и поддръжка", "190 €", "на месец · на държава", "Хостинг, наблюдение 24/7, корекции по скрипта, месечен отчет, техническа поддръжка. Твоите клиенти не плащат нищо на нас."],
  ["Потвърдено обаждане", "0,25–0,45 €", "на свързан разговор · по държава", "Виж цените по държави отдолу. Невдигнатите опити са безплатни. Разговор над 3 минути се брои като второ обаждане."],
  ["Отстъпка за обем", "−15 % / −25 %", "над 5 000 / над 15 000 обаждания на месец", "Сумарно за всички държави и всички твои клиенти. Прилага се автоматично в месечната фактура."],
  ["Минимум", "500 обаждания", "на месец на държава · или 190 € платформа", "Ако месецът е по-слаб, плащаш само платформата — няма скрити такси."],
];

const COUNTRIES = [
  { f: "🇧🇬", h: "България", p: "0,45 €", d: "на потвърдено обаждане · български номер, глас Елена или Коста" },
  { f: "🇷🇴", h: "Румъния", p: "0,25 €", d: "на потвърдено обаждане · румънски номер, румънски глас" },
  { f: "🇬🇷", h: "Гърция", p: "0,30 €", d: "на потвърдено обаждане · гръцки номер, гръцки глас" },
];

const TERMS = [
  "Всички цени са без ДДС и са за препродажба — ти определяш крайната цена към магазините",
  "Фактура в началото на месеца: платформа + обажданията от предходния месец, по държава и по клиент",
  "Без обвързване за година: договор месец за месец след пилота, 30 дни предизвестие",
  "Още една държава = още една инсталация 500 € + 190 €/мес; цената на обаждане зависи от телефонията там",
  "Ако предпочиташ на минута вместо на обаждане: BG 0,40 €/мин · RO и GR 0,25 €/мин",
  "Цените са валидни до 30.11.2026",
];

const PILOT = [
  { b: "ден 1–2", h: "Срещата", p: "45 минути онлайн: процесът ти, системата за пратки, какво точно потвърждаваме, кой е първият магазин. Даваш ни формата на данните — и тръгваме.", go: false },
  { b: "ден 3–7", h: "Агентът е готов", p: "Глас, номер, скрипт на български, връзка със системата ти. Тест с 20–30 реални пратки; слушаме записите заедно и поправяме същия ден.", go: false },
  { b: "ден 8–21", h: "Пилотът", p: "Една държава, 500 обаждания, две седмици. Всеки понеделник — числата: % потвърдени, % промени, % откази, колко върнати пратки са спестени.", go: true },
  { b: "след пилота", h: "Трите държави", p: "Договор за BG · RO · GR. Агент № 2 и № 3 са готови за по 3–5 работни дни всеки — процесът вече го знаем.", go: false },
];

const CAT_AGENTS = [
  { tag: "входящ · 24/7", h: "„Къде е пратката ми?“", p: "Вдига на номера на магазина или на Full House, казва статуса по номер на пратка и очаквана дата, при проблем прехвърля към човек с резюме. Най-честият въпрос към всеки магазин — без да чака оператор.", pr: "Същата платформа · на минута разговор: BG 0,40 € · RO/GR 0,25 €" },
  { tag: "изходящ", h: "Неуспешна доставка", p: "Куриерът не е намерил клиента → агентът звъни същия ден, уговаря нов час или адрес, или насочва към офис на куриера. Връща резултата към системата. Най-прекият път към по-малко върнати пратки.", pr: "500 € инсталация · 190 €/мес · цената на обаждане по държава" },
  { tag: "изходящ", h: "Пратката чака в офис", p: "Напомняне, че пратката стои в офис или автомат и до кога — първо със съобщение, обаждане само на тези, които не реагират. По-малко изтекли срокове, по-малко връщания.", pr: "Съобщение по тарифата на канала · обаждане по държава" },
  { tag: "изходящ · със съгласие", h: "Недовършена поръчка", p: "Клиентът е оставил кошницата или не е довършил плащането → до час агентът звъни, довършва поръчката по телефона и я подава към системата. Само за клиенти, дали съгласие за контакт.", pr: "500 € инсталация · 190 €/мес · цената на обаждане по държава" },
  { tag: "изходящ", h: "Повторна поръчка", p: "За магазини с консумативи и добавки: 30 или 60 дни след доставката агентът пита дали да изпратим пак — и приема поръчката. Продажба без реклама.", pr: "500 € инсталация · 190 €/мес · цената на обаждане по държава" },
  { tag: "изходящ", h: "Обратна връзка след доставка", p: "Един въпрос: „Как мина?“ Доволен → покана за отзив. Проблем → рекламацията се записва веднага, магазинът научава преди лошия коментар.", pr: "500 € инсталация · 190 €/мес · цената на обаждане по държава" },
  { tag: "входящ", h: "Рекламации и връщания", p: "Приема заявка за връщане или замяна, казва условията на магазина, създава заявката в системата и праща инструкции с SMS или Viber. Човекът се занимава само със спорните случаи.", pr: "Същата платформа · на минута разговор: BG 0,40 € · RO/GR 0,25 €" },
  { tag: "входящ · B2B", h: "Рецепция за Full House", p: "Вдига на твоите клиенти-магазини: наличност в склада, приемане на заявка за пратки, въпроси за фактури и срокове. Прехвърля към човек с готово резюме. Твоят телефон спира да е тесното място.", pr: "Същата платформа · на минута разговор: BG 0,40 €" },
];

const CAT_SERVICES = [
  { h: "Viber · WhatsApp · SMS потвърждение", p: "Първо съобщение с бутони „Потвърждавам / Смени адреса“; обаждането е само за тези, които не отговорят до 2 часа. Общата цена на потвърждение пада чувствително при висок обем.", pr: "На съобщение по тарифата на канала + платформа · точна цена след обема" },
  { h: "Имейл и чат агент за поръчки", p: "Отговаря на „къде е поръчката ми“ по имейл, в чата на сайта, Messenger и Instagram на магазина — от живия статус на пратката. Същият мозък като на телефона.", pr: "190 €/мес на магазин · настройка 300 €" },
  { h: "Табло за препродажба", p: "Твой панел с всички магазини: обаждания, резултати, записи, фактуриране по клиент. Агентът говори от името на всеки магазин поотделно. Готов отчет за твоите клиенти всеки месец.", pr: "Включено в платформата" },
  { h: "Интеграции", p: "Еконт, Спиди, DHL, DPD, Sameday, ACS и останалите куриери по API; Shopify, WooCommerce, OpenCart, CloudCart и твоя WMS. Статуси и номера на пратки влизат сами.", pr: "Включено в инсталацията за стандартните · по мярка за твоя софтуер" },
  { h: "Още държави и езици", p: "Унгария, Полша, Чехия, Германия, Италия, Испания — същият агент, друг език и местен номер. За повечето европейски държави цената на обаждане е на нивото на Румъния и Гърция.", pr: "500 € инсталация · 190 €/мес · обаждане по държава" },
  { h: "Материали за твоите продажби", p: "Презентация и калкулатор „колко спестяваш на 1 000 пратки“ за твоите клиенти, под твоята марка, плюс демо номер, на който могат да звъннат и да чуят агента.", pr: "Включено при договор за трите държави" },
];

const RULES = [
  { h: "AI се обявява", p: "Агентът казва в първото изречение, че е AI асистент — по чл. 50 от европейския AI Act. Разговорът е по-кратък, а доверието — по-голямо." },
  { h: "Данните са твои и остават в ЕС", p: "Телефон, адрес и сума се ползват само за обаждането и се изтриват по срок, който ти задаваш. Договор за обработка на данни (GDPR) между нас и Full House; ти имаш същия с магазините." },
  { h: "Записите — по избор", p: "Записваме разговорите само ако ти искаш и само с уведомяване в началото. Без запис остава кратко текстово резюме на всяко обаждане." },
];

const NEED = [
  "Откъде идват пратките: система / API / Excel — и кога се пуска обаждането (при заявка, преди куриер, при неуспешна доставка)",
  "Какво потвърждава агентът: адрес, ден, наложен платеж, пренасочване — и къде записва отговора в твоята система",
  "Първият магазин за пилота и обемът му на месец",
  "Обемите по държава на месец — от тях зависи с какъв телефонен канал тръгваме в България",
  "Езиците и номерата: български имаме; за Румъния и Гърция вземаме местни номера или ползваме твои",
  "Едно „да“ за пилота — и срещата за процеса е в календара още тази седмица",
];

export default function AndreyaOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">
          За Андрея · Full House · фулфилмънт център · 02.11.2026
        </p>
        <h1>
          Всяка пратка потвърдена —{" "}
          <em>
            от AI агент, който звъни в три държави под твоята марка, на цени на
            едро.
          </em>
        </h1>
        <p className="deck">
          Благодаря за разговора, Андрея. Ето офертата за call агентите, за
          които говорихме — потвърждение на пратки за България, Румъния и Гърция
          с цени, които ти препродаваш на магазините. Отдолу е и каталогът: какво
          още можем да добавим за твоите клиенти, когато първият агент тръгне.
        </p>
        <p className="byline">
          <span>От Ивайло Петев, Pro Marketing</span>
          <a className="pdf" href={PDF}>
            Свали като PDF
          </a>
        </p>
      </header>

      <section>
        <div className="sechead">
          <p className="kick">Защо · пратките и числата</p>
          <h2 className="h2sub">
            Най-евтиното обаждане е това преди куриера да тръгне
          </h2>
        </div>
        <div className="stats">
          {STATS.map((s) => (
            <div className="stat" key={s.s}>
              <b className={s.bad ? "bad" : ""}>{s.b}</b>
              <span>{s.s}</span>
            </div>
          ))}
        </div>
        <div className="facts">
          {VIDYAH.map((f) => (
            <article className="fact" key={f.h}>
              <h3>{f.h}</h3>
              <p>{f.p}</p>
            </article>
          ))}
        </div>
        <div className="pull">
          <p>
            Човек потвърждава пратка за минута и половина и струва на
            фулфилмънта 1–2 € на обаждане. Агентът го прави за минута, за
            стотинки, в три държави едновременно — и не си взима почивка в пика.
          </p>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Как работи</p>
          <h2 className="h2sub">От пратка до потвърден статус — за минути</h2>
          <p className="lead">
            Нищо не се пуска на ръка. Системата ти подава пратките, агентът
            звъни, резултатът се връща при теб. Ти виждаш числата, твоите
            клиенти виждат по-малко върнати пратки.
          </p>
        </div>
        <div className="flow">
          {FLOW.map((f, i) => (
            <article className="fstep" key={f.h}>
              <span className="n">{i + 1}</span>
              <h3>{f.h}</h3>
              <p>{f.p}</p>
            </article>
          ))}
        </div>
        <div className="talk">
          <div>
            <h3>Така звучи обаждането</h3>
            {TALK.map((l, i) => (
              <div className="line" key={i}>
                <span className={`who${l.k ? " k" : ""}`}>{l.who}</span>
                <span>{l.t}</span>
              </div>
            ))}
          </div>
          <div>
            <h3>Какво се връща в системата ти</h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "#C9D9DE" }}>
              Статус + промените + запис и резюме, секунди след затварянето.
              Невдигнал — нов опит след 2 часа, до 3 опита, после статус „не
              вдига“ за твоя оператор.
            </p>
            <div className="res">
              <span>✓ потвърдена</span>
              <span>✎ нов адрес</span>
              <span>📅 друга дата</span>
              <span>✕ отказ</span>
              <span>☎ не вдига</span>
              <span>→ към човек</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: "#9FBAC2", marginTop: 14 }}>
              Гласът и името на агента са по твой избор — може да е „Елена от
              Full House“ или името, което магазинът ползва. Скриптът е твой;
              ние го правим да звучи като човек, който знае пратката.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Цените на едро</p>
          <h2 className="h2sub">Прост модел: инсталация, платформа, обаждане</h2>
          <p className="lead">
            Три числа, които лесно обясняваш на магазините и върху които лесно
            слагаш своята цена. Без скрити такси, без обвързване за година.
          </p>
        </div>
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Позиция</th>
                <th>Цена на едро</th>
                <th>Какво включва</th>
              </tr>
            </thead>
            <tbody>
              {PRICES.map(([k, p, u, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td className="price">
                    {p}
                    <small>{u}</small>
                  </td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="countries">
          {COUNTRIES.map((c) => (
            <article className="cty" key={c.h}>
              <span className="flag" aria-hidden="true">{c.f}</span>
              <h3>{c.h}</h3>
              <p className="p">
                {c.p}
                <small>без ДДС</small>
              </p>
              <p className="d">{c.d}</p>
            </article>
          ))}
        </div>
        <div className="deal">
          <article className="calc">
            <h3>Твоята сметка · пример: един магазин, 3 000 пратки на месец в България</h3>
            <div className="row">
              <span>3 000 потвърдени обаждания × 0,45 €</span>
              <b>1 350 €</b>
            </div>
            <div className="row">
              <span>Платформа за България</span>
              <b>190 €</b>
            </div>
            <div className="row">
              <span>Плащаш на нас</span>
              <b>1 540 €</b>
            </div>
            <div className="row">
              <span>Продаваш на магазина по 0,75 € на пратка</span>
              <b>2 250 €</b>
            </div>
            <div className="row tot">
              <span>Остава при теб всеки месец</span>
              <b>≈ 710 €</b>
            </div>
            <p className="d">
              Без нито един човек на телефона. Магазинът плаща 0,75 € вместо
              1–2 € за човек — печели и той. В Румъния и Гърция нашата цена е
              по-ниска, така че маржът ти там е още по-голям.
            </p>
          </article>
          <article className="terms">
            <h3>Условията</h3>
            <ul className="list">
              {TERMS.map((t) => (
                <li key={t}>
                  <i>✓</i>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
        <p className="note">
          Цената на едро в България е по-висока от Румъния и Гърция заради
          телефонията към българските мобилни мрежи. Над ~3 000 обаждания на
          месец минаваме на директен български телефонен канал — и
          преразглеждаме цената надолу заедно.
        </p>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Пилотът</p>
          <h2 className="h2sub">Една държава, 500 обаждания, две седмици</h2>
          <p className="lead">
            Не те караме да купуваш трите държави на доверие. Тръгваме с един
            магазин в България, виждаме числата заедно и чак тогава
            разширяваме. Пилотът струва 500 € инсталация + обажданията по
            ценоразписа (500 × 0,45 € = 225 €); платформената такса тръгва след
            него.
          </p>
        </div>
        <div className="days">
          {PILOT.map((d) => (
            <div className={`step${d.go ? " go" : ""}`} key={d.b}>
              <b>{d.b}</b>
              <h3>{d.h}</h3>
              <p>{d.p}</p>
            </div>
          ))}
        </div>
        <p className="note">
          Процент потвърдени пратки не обещаваме предварително — зависи от
          магазина и клиентите му. Обещаваме числата всеки понеделник и
          корекции същия ден. Ако след пилота не искаш да продължиш, спираме и
          не дължиш нищо повече.
        </p>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Какво още можем да добавим · агенти</p>
          <h2 className="h2sub">Същият агент, други разговори</h2>
          <p className="lead">
            Потвърждението е първото обаждане. Всеки от агентите отдолу ползва
            същата платформа и същата връзка със системата ти — тръгва за дни,
            не за месеци. Продаваш го на магазините като отделна услуга, по
            същия модел на едро.
          </p>
        </div>
        <div className="cat">
          {CAT_AGENTS.map((a) => (
            <article className="item" key={a.h}>
              <span className="tag">{a.tag}</span>
              <h3>{a.h}</h3>
              <p>{a.p}</p>
              <p className="pr">
                <b>{a.pr}</b>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Какво още можем да добавим · услуги</p>
          <h2 className="h2sub">Около агента: канали, табло, интеграции</h2>
        </div>
        <div className="cat three">
          {CAT_SERVICES.map((s) => (
            <article className="item svc" key={s.h}>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
              <p className="pr">
                <b>{s.pr}</b>
              </p>
            </article>
          ))}
        </div>
        <p className="note">
          Цените в каталога са ориентир на едро за същия модел. Точната цена на
          всяка допълнителна услуга фиксираме при обема, който ти кажеш — и
          винаги така, че да има място за твоята надбавка.
        </p>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Правилата</p>
          <h2 className="h2sub">Така, че магазините да спят спокойно</h2>
        </div>
        <div className="rules">
          {RULES.map((r) => (
            <article className="rule" key={r.h}>
              <h3>{r.h}</h3>
              <p>{r.p}</p>
            </article>
          ))}
        </div>
        <p className="note">
          Обаждания с рекламна цел (повторна поръчка, недовършена поръчка)
          правим само към клиенти, дали съгласие за контакт при поръчката.
          Останалото — потвърждение, доставка, връщане — е обслужване на вече
          направена поръчка и не иска отделно съгласие.
        </p>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">От теб, за да тръгнем</p>
          <h2 className="h2sub">Шест неща за срещата</h2>
        </div>
        <ol className="need">
          {NEED.map((n) => (
            <li key={n}>
              <span>{n}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Днес следобед ти звъня да минем офертата заедно и да уточним първия
          магазин за пилота. Ако ти е по-удобен друг час — запиши си 45 минути
          тук: <a href={SRESHTA}>promarketing.pw/sreshta</a>. След разговора
          всичко останало правя аз, и до две седмици агентът звъни на първите
          пратки.
        </p>
        <p className="ctas">
          <a className="btn" href={SRESHTA}>
            Запиши си час за разговор
          </a>
          <a className="btn ghost" href="viber://chat?number=%2B359877399963">
            Пиши ми във Viber
          </a>
          <a className="btn ghost" href="tel:+359877399963">
            0877 399 963
          </a>
        </p>
        <p className="sig">
          <span className="ln">
            <b>Ивайло Петев</b> · Pro Marketing
          </span>
          <span className="ln">0877 399 963 · emmgivailopetev38@gmail.com</span>
          <span className="ln">🌐 petevai.com · promarketing.pw</span>
          <span className="ln">💬 Viber канал: promarketing.pw/viber</span>
        </p>
      </section>
    </main>
  );
}
