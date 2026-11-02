/**
 * Оферта за Анди (Андрея, Full House — фулфилмънт център · +359 888 166 368) — v2, 02.11.2026.
 *
 * v1 (сутринта) беше с цени на едро на обаждане (0,45/0,25/0,30 €) + каталог — Андрея я намери за много скъпа.
 * Решение на Ивайло (02.11 следобед): САМО агентът за потвърждение на пратки; **500 € инсталация** еднократно +
 * **100 €/мес поддръжка за всички агенти**; платформите (ElevenLabs за гласа, Zadarma/Twilio за телефонията)
 * са на името на Full House и той ги плаща директно по себестойност; ние поддържаме — проблем или бъг го оправяме.
 * Ориентирът за разхода по платформи е от проучването от 02.11.2026 (reports/AI агент за потвърждение на пратки.md):
 * ElevenLabs 0,08 $/мин + LLM ≈ 0,01 $ · Zadarma BG 0,06 €/мин, GR 0,034 €/мин (на секунда, с български номер) ·
 * Twilio RO 0,027 €/мин → ≈ 0,10 / 0,09 / 0,08 € на 45-секундно обаждане. Всичко без ДДС. Обръщение „ти“, „Анди“.
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

/* цената — три карти */
.fh-doc .price3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.fh-doc .pc{background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:24px 22px 20px;box-shadow:var(--shadow);display:flex;flex-direction:column}
.fh-doc .pc.hi{border:2px solid var(--teal)}
.fh-doc .pc .tag{font-family:var(--fh-mono),monospace;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--amber-ink);margin:0 0 10px}
.fh-doc .pc .big{font-family:var(--fh-display),sans-serif;font-weight:700;font-size:40px;line-height:1;color:var(--teal);margin:0 0 4px;font-variant-numeric:tabular-nums}
.fh-doc .pc .big small{font-family:var(--fh-ui),sans-serif;font-size:14px;font-weight:600;color:var(--ink-3);margin-left:6px;white-space:nowrap}
.fh-doc .pc h3{font-size:16.5px;margin:6px 0 10px}
.fh-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
.fh-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:14.5px;line-height:1.5;color:var(--ink-2)}
.fh-doc .list li i{font-style:normal;color:var(--teal);font-weight:700}

/* разходът по платформи */
.fh-doc .tbl{width:100%;border-collapse:separate;border-spacing:0;background:var(--surface);border:1px solid var(--rule);border-radius:14px;overflow:hidden;font-size:14.5px}
.fh-doc .tbl th,.fh-doc .tbl td{padding:12px 16px;text-align:left;border-bottom:1px solid var(--rule-soft);vertical-align:top}
.fh-doc .tbl thead th{background:var(--panel);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);font-weight:600}
.fh-doc .tbl tbody th{font-weight:700;color:var(--ink);width:26%}
.fh-doc .tbl tbody tr:last-child td,.fh-doc .tbl tbody tr:last-child th{border-bottom:none}
.fh-doc .tbl td.num{font-family:var(--fh-mono),monospace;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--teal);font-weight:600}
.fh-doc .tblwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}

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

/* инсталацията + планът */
.fh-doc .cat{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.fh-doc .item{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:18px 18px 16px;box-shadow:var(--shadow)}
.fh-doc .item h3{font-size:15.5px;margin:0 0 6px}
.fh-doc .item p{font-size:14px;line-height:1.5;color:var(--ink-2)}
.fh-doc .days{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.fh-doc .step{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.fh-doc .step b{display:block;font-family:var(--fh-mono),monospace;font-weight:500;font-size:12.5px;letter-spacing:.08em;color:var(--amber-ink);margin:0 0 6px}
.fh-doc .step h3{font-size:15px;margin:0 0 6px}
.fh-doc .step p{font-size:14px;line-height:1.5;color:var(--ink-2)}
.fh-doc .step.go{border:2px solid var(--teal);background:var(--teal-soft)}

/* правилата + от теб */
.fh-doc .rules{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.fh-doc .rule{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.fh-doc .rule h3{font-size:15px;margin:0 0 6px;color:var(--green)}
.fh-doc .rule p{font-size:14px;line-height:1.5;color:var(--ink-2)}
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
  .fh-doc .cat,.fh-doc .rules,.fh-doc .price3{grid-template-columns:repeat(2,1fr)}
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
  .fh-doc .flow,.fh-doc .cat,.fh-doc .rules,.fh-doc .days,.fh-doc .facts,.fh-doc .price3,.fh-doc .need,.fh-doc .stats{grid-template-columns:1fr}
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
  .fh-doc .stat,.fh-doc .fact,.fh-doc .fstep,.fh-doc .item,.fh-doc .pull,.fh-doc .step,.fh-doc .pc,.fh-doc .calc,.fh-doc .terms,.fh-doc .rule,.fh-doc .need li,.fh-doc .tbl tr,.fh-doc .talk{break-inside:avoid}
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
  .fh-doc .price3{grid-template-columns:repeat(3,1fr);gap:8px}
  .fh-doc .pc{padding:12px 12px 10px;box-shadow:none}
  .fh-doc .pc .big{font-size:21px}
  .fh-doc .pc .big small{font-size:10.5px;margin-left:4px}
  .fh-doc .pc h3{font-size:13px;margin:4px 0 6px}
  .fh-doc .list{gap:4px}
  .fh-doc .list li{font-size:11.5px}
  .fh-doc .tbl{font-size:11.5px}
  .fh-doc .tbl th,.fh-doc .tbl td{padding:6px 10px}
  .fh-doc .deal{grid-template-columns:1.1fr .9fr;gap:10px;margin-top:10px}
  .fh-doc .calc,.fh-doc .terms{padding:12px 14px}
  .fh-doc .calc h3,.fh-doc .terms h3{font-size:14px;margin-bottom:6px}
  .fh-doc .calc .row{font-size:12px;padding:4px 0}
  .fh-doc .calc .row.tot{font-size:13.5px;padding-top:7px}
  .fh-doc .calc .row.tot b{font-size:18px}
  .fh-doc .calc p.d{font-size:10.5px;margin-top:7px}
  .fh-doc .cat{grid-template-columns:repeat(3,1fr);gap:8px}
  .fh-doc .item{padding:10px 12px 9px;box-shadow:none}
  .fh-doc .item h3{font-size:12.5px}
  .fh-doc .item p{font-size:11px;line-height:1.46}
  .fh-doc .days{grid-template-columns:repeat(2,1fr);gap:8px}
  .fh-doc .step{padding:9px 12px}
  .fh-doc .step h3{font-size:12.5px}
  .fh-doc .step p{font-size:11px}
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
  .fh-doc .fact,.fh-doc .closing,.fh-doc .step.go,.fh-doc .talk,.fh-doc .calc,.fh-doc .terms,.fh-doc .tbl th,.fh-doc .fstep .n{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const STATS = [
  { b: "~0,10 €", s: "струва едно потвърдено обаждане в България на платформите — плащаш директно на тях", bad: false },
  { b: "~1 мин", s: "трае разговорът: адрес, ден, наложен платеж, записан отговор", bad: false },
  { b: "3", s: "държави — България, Румъния, Гърция, с местен език и номер", bad: false },
  { b: "0 €", s: "за невдигнати опити — платформите таксуват само свързан разговор, на секунда", bad: false },
];

const VIDYAH = [
  {
    h: "Непотвърдената пратка е най-скъпата пратка",
    p: "Куриерът отива, клиентът го няма или се е отказал, наложеният платеж не влиза, стоката се връща и се блокира за седмица. Едно обаждане преди изпращане спестява точно този кръг.",
  },
  {
    h: "Хората не стигат точно когато трябва",
    p: "В пика — Черен петък, Коледа, кампания — пратките се удвояват, операторите не. Агентът води десетки разговори едновременно и свършва за час това, за което екип върши цял ден.",
  },
  {
    h: "Всичко е на твое име",
    p: "Акаунтите в платформите за гласа и телефонията са на Full House. Виждаш всяка сметка, няма посредник и надценка на минута — ние вземаме само за инсталацията и поддръжката.",
  },
  {
    h: "Отговорът влиза в твоята система",
    p: "Потвърдена, нов адрес, друга дата, отказ, не вдига — всяко обаждане връща статус към твоя софтуер за пратки по webhook или API, плюс запис и кратко резюме.",
  },
];

const FLOW = [
  { h: "Пратката влиза", p: "Твоята система ни праща име, телефон, адрес, сума и куриер — по webhook, API или Excel. Ти избираш кога: при заявка, преди куриера или при неуспешна доставка." },
  { h: "Агентът звъни", p: "В прозорец, който ти задаваш (например 10:00–19:00 местно време), от европейски номер на твое име, на езика на клиента." },
  { h: "Разговорът", p: "Представя се, потвърждава адреса, деня и наложения платеж. Сменя адрес или дата, ако трябва. Отговаря на 2–3 обичайни въпроса." },
  { h: "Резултатът се връща", p: "Потвърдена · промяна · отказ · не вдига. Статусът е в системата ти секунди след затварянето. Невдигнал → нов опит след 2 часа, до 3 опита." },
  { h: "Отчетът", p: "Табло: обаждания, % потвърдени, % промени, % откази — по магазин и по държава. За теб и за всеки твой клиент." },
];

const TALK = [
  { who: "Агент", k: false, t: "Добър ден, Мария Иванова? Обажда се Елена от името на магазин „Х“ — аз съм AI асистент. Звъня за поръчката ви от вчера, за да потвърдим доставката. Имате ли половин минута?" },
  { who: "Клиент", k: true, t: "Да, кажете." },
  { who: "Агент", k: false, t: "Пратката е до офис на Еконт в Русе, ул. „Борисова“ 12, наложен платеж 64,90 лв. Вярно ли е и ще я вземете ли утре или в сряда?" },
  { who: "Клиент", k: true, t: "В сряда, и по-добре до адрес — ул. „Александровска“ 5." },
  { who: "Агент", k: false, t: "Записах: до адрес, ул. „Александровска“ 5, Русе, в сряда. Куриерът ще ви звънне преди да дойде. Хубав ден!" },
];

const INSTALL = [
  "Акаунти на името на Full House: гласовата платформа и телефонията — ти си собственик",
  "Европейски номера за трите държави, настроени така, че обажданията да минават на регулираната цена",
  "Агентът на български, румънски и гръцки: глас, скрипт по твоя процес, тестове с реални пратки",
  "Връзка с твоята система за пратки (webhook / API / Excel) — статусът се връща сам",
  "Кратко обучение на екипа ти и демо номер, на който клиентите ти чуват агента",
];

const SUPPORT = [
  "Наблюдение: ако нещо спре или греши — виждаме го и го оправяме",
  "Технически проблем или бъг — наш, без допълнителна сметка",
  "Дребни промени по скрипта и обновяване на агентите с новите версии на платформите",
  "Отчет и консултация всеки месец: какво показват числата, какво да се подобри",
  "Важи за всички агенти, които сме инсталирали — една такса, не на агент",
];

const PLATFORMS: [string, string, string][] = [
  ["Глас (ElevenLabs Agents)", "0,08 $/мин + модел ≈ 0,01 $", "една цена за трите езика; план според обема (напр. Pro 99 $/мес с 1 238 мин и 20 едновременни линии)"],
  ["Телефония · България", "≈ 0,06 €/мин", "Zadarma, на секунда, с български номер (≈ 4 €/мес) — това е ключът: Twilio взима 0,18 €/мин"],
  ["Телефония · Румъния", "≈ 0,03 €/мин", "Twilio с румънски номер (≈ 3 €/мес)"],
  ["Телефония · Гърция", "≈ 0,03 €/мин", "Zadarma, на секунда, с европейски номер"],
];

const PER_CALL = [
  ["🇧🇬 България", "≈ 0,10 €"],
  ["🇷🇴 Румъния", "≈ 0,09 €"],
  ["🇬🇷 Гърция", "≈ 0,08 €"],
];

const PILOT = [
  { b: "ден 1–2", h: "Срещата", p: "45 минути онлайн: процесът ти, системата за пратки, какво точно потвърждаваме, първият магазин. Откриваме акаунтите на твое име.", go: false },
  { b: "ден 3–7", h: "Агентът е готов", p: "Номер, глас, скрипт на български, връзка със системата ти. Тест с 20–30 реални пратки; слушаме записите заедно и поправяме същия ден.", go: false },
  { b: "ден 8–21", h: "Пилотът", p: "Един магазин, 500 обаждания, две седмици. Всеки понеделник — числата: % потвърдени, % промени, % откази, реалният разход на обаждане от сметките ти.", go: true },
  { b: "след пилота", h: "Румъния и Гърция", p: "Същият агент на румънски и гръцки, с местни номера — за по 3–5 работни дни всеки. После продаваш услугата на магазините си на твоя цена.", go: false },
];

const RULES = [
  { h: "AI се обявява", p: "Агентът казва в първото изречение, че е AI асистент — по чл. 50 от европейския AI Act, в сила от август 2026. Разговорът е по-кратък, а доверието — по-голямо." },
  { h: "Данните са твои", p: "Акаунтите и записите са в твоите платформи; телефон, адрес и сума се ползват само за обаждането и се изтриват по срок, който ти задаваш. Договор за обработка на данни между нас и Full House." },
  { h: "Записите — по избор", p: "Записваме разговорите само ако ти искаш и само с уведомяване в началото. Без запис остава кратко текстово резюме на всяко обаждане." },
];

const NEED = [
  "Откъде идват пратките: система / API / Excel — и кога се пуска обаждането",
  "Какво потвърждава агентът: адрес, ден, наложен платеж, пренасочване — и къде записва отговора",
  "Първият магазин за пилота и обемът му на месец",
  "Карта за акаунтите в платформите (на името на Full House) — сметките идват при теб",
  "Едно „да“ — и срещата за процеса е в календара още тази седмица",
];

export default function AndreyaOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">
          За Анди · Full House · фулфилмънт център · 02.11.2026 · v2
        </p>
        <h1>
          Агентът за потвърждение на пратки —{" "}
          <em>
            на твое име, на цената на платформите, с нашата инсталация и
            поддръжка.
          </em>
        </h1>
        <p className="deck">
          Благодаря за разговора, Анди. Ето офертата, сведена до това, което
          ти трябва: един AI агент, който потвърждава пратките по телефона в
          България, Румъния и Гърция. Платформите са на твое име и ги плащаш
          директно, по себестойност — без надценка на минута. Ние правим
          инсталацията и го поддържаме да работи.
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
            Човек потвърждава пратка за минута и половина и струва над
            половин евро на обаждане. Агентът го прави за минута, за около
            десет цента, в три държави едновременно — и не си взима почивка в
            пика.
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
              Гласът и името на агента са по твой избор — „Елена от Full House“
              или името, което магазинът ползва. Скриптът е твой; ние го правим
              да звучи като човек, който знае пратката.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Цената</p>
          <h2 className="h2sub">Две числа от нас. Платформите — директно на тях.</h2>
          <p className="lead">
            Без цена на обаждане към нас и без надценка на минута. Плащаш ни
            веднъж за инсталацията и месечно за поддръжката; разходът за глас
            и телефония върви по твоите акаунти, по актуалните тарифи на
            платформите.
          </p>
        </div>
        <div className="price3">
          <article className="pc">
            <p className="tag">еднократно</p>
            <p className="big">
              500 €<small>без ДДС</small>
            </p>
            <h3>Инсталация</h3>
            <ul className="list">
              {INSTALL.map((a) => (
                <li key={a}>
                  <i>✓</i>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="pc hi">
            <p className="tag">всеки месец</p>
            <p className="big">
              100 €<small>без ДДС · на месец</small>
            </p>
            <h3>Поддръжка на всички агенти</h3>
            <ul className="list">
              {SUPPORT.map((a) => (
                <li key={a}>
                  <i>✓</i>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="pc">
            <p className="tag">на твое име · по себестойност</p>
            <p className="big">
              ≈ 0,10 €<small>на обаждане</small>
            </p>
            <h3>Платформите — плащаш директно на тях</h3>
            <ul className="list">
              {PER_CALL.map(([k, v]) => (
                <li key={k}>
                  <i>→</i>
                  <span>
                    {k}: <b>{v}</b> за 45-секундно потвърдено обаждане
                  </span>
                </li>
              ))}
              <li>
                <i>→</i>
                <span>
                  Невдигнатите опити са безплатни; таксува се на секунда, само
                  свързан разговор
                </span>
              </li>
            </ul>
          </article>
        </div>

        <div className="tblwrap" style={{ marginTop: 18 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Платформа</th>
                <th>Тарифа (ориентир, 02.11.2026)</th>
                <th>Бележка</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORMS.map(([k, p, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td className="num">{p}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">
          Тарифите са публичните цени на платформите към 02.11.2026 и се
          плащат директно на тях от твоите акаунти — ние не ги препродаваме и
          не печелим от тях. Промени ли платформа цената, промяната е 1:1 при
          теб.
        </p>

        <div className="deal">
          <article className="calc">
            <h3>Твоята сметка · пример: един магазин, 3 000 пратки на месец в България</h3>
            <div className="row">
              <span>3 000 потвърдени обаждания × ≈ 0,10 €</span>
              <b>≈ 300 €</b>
            </div>
            <div className="row">
              <span>План и номера в платформите</span>
              <b>≈ 90 €</b>
            </div>
            <div className="row">
              <span>Поддръжка от нас</span>
              <b>100 €</b>
            </div>
            <div className="row">
              <span>Общо на месец ≈ 490 € → на потвърждение</span>
              <b>≈ 0,16 €</b>
            </div>
            <div className="row tot">
              <span>Продаваш на магазина по 0,30 € на пратка</span>
              <b>900 €</b>
            </div>
            <p className="d">
              Около 410 € остават при теб всеки месец от един магазин — без
              нито един човек на телефона. Магазинът плаща 0,30 € вместо
              над половин евро за човек. Всеки следващ магазин ползва същия
              агент и същата поддръжка — добавя само собствените си обаждания.
            </p>
          </article>
          <article className="terms">
            <h3>Условията</h3>
            <ul className="list">
              <li><i>✓</i><span>Всички наши цени са без ДДС</span></li>
              <li><i>✓</i><span>Инсталацията — 50 % при старт, 50 % когато агентът звъни на първите пратки</span></li>
              <li><i>✓</i><span>Поддръжката — месец за месец, без обвързване за година, 30 дни предизвестие</span></li>
              <li><i>✓</i><span>Нов агент за друга задача (например „къде е пратката ми“) = нова инсталация; поддръжката остава същите 100 €</span></li>
              <li><i>✓</i><span>Платформите са на твое име — спираш, сменяш или местиш, когато поискаш</span></li>
              <li><i>✓</i><span>Офертата е валидна до 30.11.2026</span></li>
            </ul>
          </article>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Планът</p>
          <h2 className="h2sub">От „да“ до първите потвърдени пратки — три седмици</h2>
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
          корекции същия ден. Ако след пилота не искаш да продължиш, спираш
          поддръжката и акаунтите остават твои.
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
          Потвърждение, доставка и връщане са обслужване на вече направена
          поръчка и не искат отделно съгласие. Обаждания с рекламна цел не
          правим без съгласие на клиента при поръчката.
        </p>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">От теб, за да тръгнем</p>
          <h2 className="h2sub">Пет неща за срещата</h2>
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
          Запиши си 45 минути тук: <a href={SRESHTA}>promarketing.pw/sreshta</a>{" "}
          — минаваме процеса, откриваме акаунтите на твое име и до три
          седмици агентът звъни на първите пратки. Всичко останало правя аз.
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
