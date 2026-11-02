/**
 * Оферта за Соня Кузманова — „Омега Профит Груп“ ЕООД, счетоводна кантора, Пловдив — 02.11.2026.
 *
 * Контекст: 02.11 сутринта Ивайло инсталира Claude в кантората (Claude Team, конектор към NULA — Fathom 885086400).
 * Заданията на Соня дойдоха във Viber (30.10 и 02.11): напомняния за документи на 1/5/10/12-то число, неплатени
 * фактури 5/15/30 дни след падежа, правила за обаждане (BG/TR, до 2 мин, само работни дни 09–18), таблиците „Фирми“
 * и „Дневник напомняния“, тестов режим 2 седмици. На срещата: входящ агент за оферти и обаждания на български и турски.
 * Решено от Ивайло (02.11 вечерта): три кол агента на промоционална цена 600 € без ДДС; по желание еднократно —
 * рекламата на имота в с. Батово за 200 € без ДДС. Абонаментът от втория месец е по ценоразписа на Pro Marketing
 * от 02.11.2026 („Старт“ 300 € с ДДС). Обръщението е на „ти“.
 */

const PDF = "/oferta/sonya/ProMarketing-za-Omega-Profit-Group.pdf";
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
  { b: "2+1", s: "обаждания на фирма на месец — две за документите (10-то и 12-то число) и по едно за всяка просрочена фактура", bad: false },
  { b: "0", s: "забравени клиенти — агентът звъни на всички в един и същи ден и спира, щом документите дойдат", bad: false },
  { b: "BG · TR", s: "два езика, един сценарий — езикът се взима от таблицата „Фирми“, колегата ти проверява турския", bad: false },
  { b: "≤ 2 мин", s: "трае разговорът по твоите правила — причина, дата, записан резултат", bad: false },
];

const VIDYAH = [
  {
    h: "Напомнянето е работа, която никой не обича",
    p: "Колегите звънят между две декларации, половината клиенти не вдигат, а 12-то число идва. Агентът звъни точно в деня, записва какво е обещано и спира сам, щом документите пристигнат.",
  },
  {
    h: "Неплатената фактура не чака",
    p: "5 дни след падежа — съобщение с номер, сума и IBAN; 15 дни — обаждане „кога ще бъде платено“ и записана дата; 30 дни — агентът спира и случаят идва при теб. Точно по схемата, която написа.",
  },
  {
    h: "Турски — без да търсиш кой говори",
    p: "За клиентите на турски звъни същият агент на турски. Текстовете ги проверява веднъж колегата ти, който говори езика — после агентът ги казва всеки месец еднакво учтиво.",
  },
  {
    h: "Телефонът на кантората не остава без отговор",
    p: "Когато всички са на телефона или е след 18:00, третият агент вдига: записва кой се обажда и за какво, приема запитване за оферта и го праща на теб, а по същество казва „ще предам на вашия счетоводител“.",
  },
  {
    h: "Всичко влиза в „Дневник напомняния“",
    p: "Всеки разговор е ред в таблицата — дата, фирма, канал, резултат, резюме. В 17:30 всеки отговорен счетоводител получава какво е станало с неговите фирми, в понеделник в 08:00 — ти.",
  },
  {
    h: "Работи с Claude, който вече е при теб",
    p: "Сутрин Claude подготвя списъка — кой не е пратил документи, коя фактура е просрочена. Агентът звъни. Следобед резултатът е в Дневника и Claude го вижда. Никой не преписва нищо на ръка.",
  },
];

const AGENTS = [
  {
    tag: "Агент 1 · изходящ",
    h: "Документите",
    p: "1-во и 5-то число — съобщение по предпочитания канал и имейл „Очакваме документите за октомври“. 10-то — обаждане. 12-то — обаждане и имейл до отговорния счетоводител. Почивен ден — предходният работен. Пристигнат ли документите, напомнянията спират същия ден.",
    pr: "Език: BG / TR от таблицата „Фирми“ · фирмите с „Без автоматични напомняния“ не се закачат",
  },
  {
    tag: "Агент 2 · изходящ",
    h: "Фактурите",
    p: "Преди всяко напомняне проверява в NULA и банката дали фактурата не е платена. 5 дни след падежа — съобщение и имейл с номер, сума, IBAN и основание. 15 дни — обаждане: кога ще бъде платено, записва датата. 30 дни — спира и предава на теб. „Платих“ → благодари и спира до проверка.",
    pr: "Не обещава отстъпки, разсрочване или нови срокове · най-много един контакт на ден с клиент",
  },
  {
    tag: "Агент 3 · входящ · BG / TR",
    h: "Телефонът на кантората",
    p: "Вдига, когато екипът е зает или е извън работно време. Представя се като автоматичен асистент, пита кой се обажда и по какъв въпрос, записва спешното и обещаната обратна връзка. Запитване за оферта — събира фирмата, дейността и контакта, казва ориентировъчната цена по твоята ценова табличка (ако решиш да му я дадеш) и ти го праща веднага. Нищо по същество — „ще предам на вашия счетоводител“.",
    pr: "Турският — проверен от колегата ти · записът и резюмето идват по имейл и в Дневника",
  },
];

const FLOW = [
  { h: "Списъкът", p: "Claude чете „Фирми“ и NULA: кой не е пратил документи, коя фактура е просрочена, на кой език говори клиентът." },
  { h: "Обаждането", p: "Агентът звъни от номера на кантората — само в работни дни, 09:00–18:00, по едно обаждане на клиент на ден." },
  { h: "Разговорът", p: "По твоя сценарий, до 2 минути: причина, въпрос за дата, записан отговор. Чужд човек на телефона — без суми и подробности." },
  { h: "Резултатът", p: "Ред в „Дневник напомняния“ + кратко резюме и запис. Обещана дата, платено, отказ, без отговор, въпрос — всичко е видимо." },
  { h: "Хората", p: "17:30 — резюме на отговорния счетоводител. Понеделник 08:00 — обобщение при теб. Недоволен клиент — агентът спира и ти казва същия ден." },
];

const TALK = [
  { who: "Агент", t: "Добър ден, обаждам се от счетоводна кантора „Омега Профит Груп“. Аз съм автоматичен асистент. С господин Йорданов ли говоря?" },
  { who: "Клиент", t: "Да, аз съм.", k: true },
  { who: "Агент", t: "Обаждам се, защото още не сме получили документите за октомври. Кога ще можете да ги изпратите?" },
  { who: "Клиент", t: "До сряда ще ги пратя по имейл.", k: true },
  { who: "Агент", t: "Записвам — до сряда, по имейл. Благодаря Ви и приятен ден!" },
];

const TERMS = [
  ["✓", "Трите агента по твоите задания — документи, фактури, входящ на български и турски"],
  ["✓", "Връзка с номера на кантората, таблиците „Фирми“ и „Дневник напомняния“ и с Claude"],
  ["✓", "Тестов режим 2 седмици само с фирмите „Тест“ — чернова при теб преди всяко обаждане"],
  ["✓", "Тест с реални обаждания, две настройки след пускането, 1 час обучение на екипа"],
  ["✓", "Първият месец разговори е включен"],
  ["→", "От втория месец — абонамент „Старт“: 250 € без ДДС на месец (300 € с ДДС) за трите агента заедно — до 300 минути разговори, поддръжка, промени в сценариите, месечен отчет; над 300 минути — 0,40 €/мин"],
];

const PLUS = [
  { h: "2–3 кратки видеа", p: "От твоите снимки и страницата, която направи с Claude — терен, сгради, пътят Добрич–Албена, числата. С надпис за AI изображения, както изисква закона." },
  { h: "Реклама във Facebook и Instagram", p: "Цел — обаждания и запитвания, не харесвания. Кой вижда рекламата: Добрич, Варна и купувачи на производствени и складови имоти в цялата страна." },
  { h: "Обажданията идват при теб", p: "Бутон „Обади се“ към твоя телефон и формуляр за запитване. След две седмици — отчет: колко души са я видели, колко са звъннали, какво да сменим." },
];

const STEPS = [
  { b: "Седмица 1", h: "Сценариите и таблиците", p: "Пишем трите сценария на български, колегата ти проверява турския. Ти даваш IBAN, телефона на офиса и списъка „Тест“." },
  { b: "Седмица 2", h: "Тестов режим", p: "Агентите звънят само на фирмите с „Тест“. Преди всяко обаждане виждаш черновата и казваш „да“." },
  { b: "Седмица 3–4", h: "Първите истински обаждания", p: "10-то и 12-то число — документите; просрочените фактури — по схемата. Резюметата тръгват в 17:30." },
  { b: "После", h: "Работи само", p: "Абонаментът „Старт“ покрива разговорите и промените. Веднъж месечно минаваме Дневника заедно — какво да подобрим.", go: true },
];

const RULES = [
  { h: "Казва, че е AI", p: "В началото на всеки разговор агентът се представя като автоматичен асистент — така изисква европейският регламент за AI от 02.08.2026." },
  { h: "Данните остават при теб", p: "Не споменава данни на един клиент пред друг, навън излиза само IBAN на кантората. Записите на разговорите — по твой избор, с договор за обработка на данни." },
  { h: "Човекът решава", p: "Оспорена фактура, недоволен клиент, молба да не се звъни — агентът се извинява, спира и ти пише същия ден. Никакви обещания за отстъпки или срокове." },
];

const NEED = [
  "IBAN и банката на кантората — за съобщенията по фактурите",
  "Телефонът на офиса, който агентите казват, и номерът, от който ще звънят (твоят, от твоя оператор — ние го свързваме)",
  "Кой колега проверява турските текстове",
  "Таблицата „Фирми“ с колоните език, предпочитан канал, „Тест“ и „Без автоматични напомняния“",
  "Едно „да“ на текстовете на съобщенията и на сценариите, преди да тръгнат",
  "За имота: 10–15 снимки или кратко видео от място и телефонът за обаждания",
];

export default function SonyaOfertaPage() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">За Соня · Омега Профит Груп · счетоводна кантора · Пловдив · 02.11.2026</p>
        <h1>
          Телефонът на кантората — <em>на трима AI агенти,</em> които напомнят, събират и вдигат.
        </h1>
        <p className="deck">
          Благодаря за днес, Соня. Claude вече е в кантората и върши писмената работа. Ето офертата за частта, която остана
          отворена — обажданията: три кол агента по заданията, които ми прати, на промоционална цена за Омега. И по
          желание — рекламата на имота в Батово, за да звъни телефонът и там.
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
          <p className="kick">Защо · обажданията на кантората</p>
          <h2 className="h2sub">Най-скъпото обаждане е това, което никой не е направил</h2>
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
            Три агента, една таблица: сутрин Claude казва на кого да се звъни, следобед Дневникът казва какво е
            станало. Колегите ти пишат отчети, не гонят документи.
          </p>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Тримата агенти</p>
          <h2 className="h2sub">Точно по заданията ти — нито едно обаждане извън правилата</h2>
          <p className="lead">
            Сценариите са твоите текстове от Viber, дума по дума: кога, на кого, какво казва и кога спира. Промяна в
            правилата = промяна в сценария, без да се пипа нищо друго.
          </p>
        </div>
        <div className="cat three">
          {AGENTS.map((a) => (
            <article className="item" key={a.h}>
              <span className="tag">{a.tag}</span>
              <h3>{a.h}</h3>
              <p>{a.p}</p>
              <p className="pr">{a.pr}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Как работи</p>
          <h2 className="h2sub">От таблицата до записания отговор — без човек по средата</h2>
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
            <h3>Така звучи обаждането за документи</h3>
            {TALK.map((l, i) => (
              <div className="line" key={i}>
                <span className={`who${l.k ? " k" : ""}`}>{l.who}</span>
                <span>{l.t}</span>
              </div>
            ))}
          </div>
          <div>
            <h3>Какво остава след него</h3>
            <div className="res">
              <span>обещана дата: сряда</span>
              <span>канал: имейл</span>
              <span>ред в Дневника</span>
              <span>без второ обаждане до сряда</span>
              <span>резюме в 17:30</span>
            </div>
            <p className="note" style={{ color: "#BFD7DD" }}>
              На турски разговорът е същият — със същите правила: кратко, учтиво, официално, до 2 минути. Чужд
              човек на телефона — без суми и подробности, само молба лицето за контакт да се обади в офиса.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Цената</p>
          <h2 className="h2sub">Три агента на цената на един — промоционално за Омега</h2>
          <p className="lead">
            Стандартно внедряването на един гласов агент е 500 €. За кантората, която вече работи с нас, трите са
            заедно на една цена — защото сценариите са готови, а Claude вече подава данните.
          </p>
        </div>
        <div className="deal">
          <div className="calc">
            <h3>Три кол агента · еднократно</h3>
            <div className="row">
              <span>Стандартно внедряване · 3 × 500 €</span>
              <b>1 500 €</b>
            </div>
            <div className="row">
              <span>Промоционална цена за Омега Профит Груп</span>
              <b>600 €</b>
            </div>
            <div className="row">
              <span>ДДС 20 %</span>
              <b>120 €</b>
            </div>
            <div className="row tot">
              <span>Общо с ДДС</span>
              <b>720 €</b>
            </div>
            <p className="d">
              Еднократно, без ДДС 600 €. Включва изграждането на трите сценария на български и турски, свързването с
              номера на кантората, таблиците и Claude, теста с реални обаждания, две настройки след пускането и първия
              месец разговори. Цената важи до 30.11.2026.
            </p>
          </div>
          <div className="terms">
            <h3>Какво включва и какво следва</h3>
            <ul className="list">
              {TERMS.map(([i, t]) => (
                <li key={t}>
                  <i>{i}</i>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="note">
          Номерът, от който звънят агентите, е на кантората — купуваш го от своя оператор (или ползваш сегашния), ние
          го свързваме. Себестойността на минутите е в абонамента; над 300 минути месечно се доплаща на минута, агентът
          не спира.
        </p>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Плюс · по желание · еднократно</p>
          <h2 className="h2sub">Имотът в Батово — да звъни телефонът, не само да стои обявата</h2>
          <p className="lead">
            Обявата в платформите стои, а телефонът мълчи. Една реклама в Meta с 2–3 хубави видеа стига до хората,
            които търсят производствена и складова база край Албена — и те се обаждат на теб, не на брокер.
          </p>
        </div>
        <div className="countries">
          {PLUS.map((p) => (
            <article className="cty" key={p.h}>
              <h3>{p.h}</h3>
              <p className="d">{p.p}</p>
            </article>
          ))}
        </div>
        <div className="deal" style={{ marginTop: 18 }}>
          <div className="calc">
            <h3>Рекламата на имота · еднократно</h3>
            <div className="row">
              <span>Видеата, текстовете, настройката и отчетът</span>
              <b>200 €</b>
            </div>
            <div className="row">
              <span>ДДС 20 %</span>
              <b>40 €</b>
            </div>
            <div className="row tot">
              <span>Общо с ДДС</span>
              <b>240 €</b>
            </div>
            <p className="d">
              Еднократно, без ДДС 200 €. Рекламният бюджет е отделно и го плащаш директно на Meta — препоръчвам 10–15 €
              на ден за две седмици; ти решаваш колко.
            </p>
          </div>
          <div className="terms">
            <h3>Как минава</h3>
            <ul className="list">
              <li>
                <i>1</i>
                <span>Пращаш ми 10–15 снимки или кратко видео от място и телефона за обаждания.</span>
              </li>
              <li>
                <i>2</i>
                <span>До 3 работни дни виждаш видеата и текстовете и казваш „да“.</span>
              </li>
              <li>
                <i>3</i>
                <span>Рекламата тръгва за две седмици; обажданията и запитванията идват при теб.</span>
              </li>
              <li>
                <i>4</i>
                <span>Отчет: гледания, обаждания, цена на запитване — и дали да продължим.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Как тръгваме</p>
          <h2 className="h2sub">Четири седмици от „да“ до първото обаждане на 10-то число</h2>
        </div>
        <div className="days">
          {STEPS.map((s) => (
            <article className={`step${s.go ? " go" : ""}`} key={s.h}>
              <b>{s.b}</b>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Правилата</p>
          <h2 className="h2sub">Честно към клиентите ти и по закон</h2>
        </div>
        <div className="rules">
          {RULES.map((r) => (
            <article className="rule" key={r.h}>
              <h3>{r.h}</h3>
              <p>{r.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">От теб, за да тръгнем</p>
          <h2 className="h2sub">Шест неща — и всичко останало правя аз</h2>
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
          Едно „да“ във Viber или по имейл — и още тази седмица пишем сценариите, а на 10-то число агентът прави първото
          си обаждане. Ако искаш да минем офертата заедно, запиши си 45 минути тук:{" "}
          <a href={SRESHTA}>promarketing.pw/sreshta</a>. Промоционалната цена важи до 30.11.2026.
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
