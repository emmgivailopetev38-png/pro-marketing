/**
 * Оферта за Галина Трендафилова — Kosara.bg (детски дрехи и обувки; онлайн магазин + физически магазини) — 03.11.2026.
 *
 * Контекст: безплатна консултация на 03.11 (Fathom 884529710). Болката: Галина сама прави органичното съдържание —
 * 2–3 поста на ден във Facebook, Instagram и TikTok; продуктите се гладят, снимат, обработват с ChatGPT и после ръчно
 * във Photoshop (цветовете не излизат верни, Instagram слага „AI“ етикет на снимки, минали само през ChatGPT).
 * Екипът качва продукти — тя и двама колеги, сега ~20–50 на ден, в сезона целта е ~100.
 * Решение: AI система, инсталирана на 3 работни места, която работи като оператор (мишка и клавиатура) — съдържание
 * от линк към продукт, продуктова обработка, без достъп до кода на сайта (Laravel), с одобрение на всичко от Галина.
 * Цена (Ивайло, на срещата): 800 € без ДДС (960 € с ДДС) еднократно, общо за 3-те компютъра + инсталацията + обучението.
 * Плащане 50 % предварително, 50 % след като системата работи. Абонаментите на AI програмите са на нейно име.
 * Без цифри за резултати и без отзиви. Обръщението е на „ти“. Примерното видео за рокля (AI, 9:16) е на страницата като плейър; в PDF-а — само ред с линка.
 */

const PDF = "/oferta/kosara/ProMarketing-za-Kosara.pdf";
const TEL = "tel:+359877399963";
const VIBER = "viber://chat?number=%2B359877399963";
const PAGE = "https://promarketing.pw/oferta/kosara";
const VIDEO = "/oferta/kosara/kosara-rokla-video.mp4";
const POSTER = "/oferta/kosara/kosara-rokla-poster.jpg";

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

/* примерното видео */
.fh-doc .vid{background:var(--ink);color:#EAF1F3;border-radius:16px;padding:24px 26px 22px;margin-top:18px;text-align:center}
.fh-doc .vid h3{color:#fff;font-size:17px;line-height:1.35;margin:0 auto 8px;max-width:52ch}
.fh-doc .vid .vidnote{font-size:14.5px;line-height:1.55;color:#BFD7DD;max-width:62ch;margin:0 auto 18px}
.fh-doc .vid video{display:block;width:100%;max-width:360px;aspect-ratio:9/16;margin:0 auto;border-radius:14px;background:#000;object-fit:cover}
.fh-doc .vid .vidai{font-size:13px;line-height:1.5;color:#BFD7DD;max-width:50ch;margin:12px auto 0}
.fh-doc .vid .vidlink{display:none}
.fh-doc .vid a{color:#9CC9D6}

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
  .fh-doc .vid{padding:20px 16px 18px}
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
  .fh-doc .vid{padding:12px 14px;margin-top:10px;text-align:left;break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .fh-doc .vid h3{font-size:12.5px;margin:0 0 4px;max-width:none}
  .fh-doc .vid .vidnote{font-size:11px;margin:0 0 6px;max-width:none}
  .fh-doc .vid .vidwrap{display:none}
  .fh-doc .vid .vidlink{display:block;font-size:11.5px;font-weight:600;color:#fff;margin:0 0 4px}
  .fh-doc .vid .vidlink a{color:#9CC9D6}
  .fh-doc .vid .vidai{font-size:10.5px;margin:0;max-width:none}
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
  .fh-doc .need{grid-template-columns:repeat(2,1fr);gap:6px 10px;break-inside:avoid}
  .fh-doc .pgbreak{break-before:page;page-break-before:always}
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
  { b: "2–3", s: "поста на ден във Facebook, Instagram и TikTok — правиш ги ти сама" },
  { b: "20–50", s: "продукта на ден качвате сега — ти и двамата ти колеги" },
  { b: "~100", s: "продукта на ден е целта ви в сезона" },
  { b: "3", s: "работни места, на които инсталираме системата и обучаваме екипа" },
];

const VIDYAH = [
  {
    h: "Постовете са втора работа",
    p: "Видео, снимки и текст за три мрежи, по 2–3 поста на ден — и всичко минава през теб.",
  },
  {
    h: "Всеки продукт минава през много стъпки",
    p: "Глади се, снима се, обработва се с ChatGPT, после ръчно във Photoshop. Когато са 20–50 продукта на ден, това е цяла смяна.",
  },
  {
    h: "Цветовете не излизат верни",
    p: "При дрехите цветът трябва да е истинският. След ChatGPT често не е, затова го поправяте ръчно — продукт по продукт.",
  },
  {
    h: "Instagram слага етикет „AI“",
    p: "Снимките, минали само през ChatGPT, получават етикет „AI“ в Instagram. Затова обработката не може да спре на едно място.",
  },
];

const KAJ = [
  {
    tag: "1 · Съдържание за мрежите",
    h: "От линк към продукт до готови постове",
    p: "Даваш линк към продукта — системата прави видео, снимки, банери и текст: със субтитри, музика и емоджи. Кажеш „тази седмица рекламираме детски якета“ — получаваш цял набор креативи. Видеата са с реалистични деца-модели, без глас, само със субтитри. Одобреното се насрочва в мрежите.",
    pr: "Facebook · Instagram · TikTok · насрочване включено",
  },
  {
    tag: "2 · Продуктова обработка",
    h: "Необработена снимка — готова за сайта",
    p: "Системата отваря снимката във Photoshop и я обработва така, както би я обработил човек — с мишката и клавиатурата. Учи се от досегашните ви снимки, за да излизат цветовете верни. Пише и описанията на продуктите.",
    pr: "Photoshop като от човек · вярни цветове · описания",
  },
];

const FLOW = [
  { h: "Линкът", p: "Даваш линк към продукта или казваш „тази седмица — детски якета“." },
  { h: "Работата", p: "Системата влиза в сайта като посетител, взема снимките и данните и подготвя видеата, снимките и текстовете." },
  { h: "Обработката", p: "Снимките минават през Photoshop като от човек, а цветовете се взимат по вашите досегашни снимки." },
  { h: "Твоето „да“", p: "Виждаш готовото и го одобряваш или поправяш. Нищо не излиза без твоето одобрение." },
  { h: "Насрочването", p: "Одобреното се насрочва във Facebook, Instagram и TikTok — по часове, които избереш." },
];

const EXTRAS = [
  {
    tag: "Обучение · включено",
    h: "Екипът го ползва без мен",
    p: "Обучаваме трите работни места — теб и двамата колеги — дистанционно, за по-малко от месец. Поддръжката на договореното е включена.",
  },
  {
    tag: "По желание",
    h: "Връзка със сайта и каналите",
    p: "Ако поискаш, свързваме системата със сайта, рекламите, имейлите и социалните мрежи — така не се прехвърля нищо ръчно между тях.",
  },
];

const TERMS = [
  ["1", "50 % предварително — 400 € без ДДС (480 € с ДДС)"],
  ["2", "50 % след като системата работи и си доволна — 400 € без ДДС (480 € с ДДС)"],
  ["✓", "Инсталация на трите компютъра и обучение на екипа — за по-малко от месец"],
  ["✓", "Поддръжка на договореното — включена"],
  ["→", "Нови автоматизации извън договореното — с отделна оферта"],
  ["→", "Абонаментите на AI програмите (ChatGPT и т.н.) са на твое име и не влизат в цената"],
];

const STEPS = [
  { b: "Стъпка 1", h: "Твоето „да“", p: "Казваш „да“ — по телефона, във Viber или по имейл — и плащаш първата половина." },
  { b: "Стъпка 2", h: "Инсталацията", p: "Инсталираме системата на трите компютъра. Даваш ми досегашни ваши снимки — от тях тя се учи на вярните цветове." },
  { b: "Стъпка 3", h: "Обучението", p: "Обучаваме трите работни места дистанционно — за по-малко от месец от началото." },
  { b: "Стъпка 4", h: "Работи", p: "Системата работи и си доволна — плащаш втората половина. Поддръжката на договореното продължава.", go: true },
];

const RULES = [
  {
    h: "Нищо не излиза без твоето „да“",
    p: "Всеки пост, снимка и описание чака одобрението ти. Системата подготвя — ти решаваш какво се публикува и кога.",
  },
  {
    h: "Без програмисти и без достъп до кода",
    p: "Сайтът ви е на Laravel. Системата не пипа кода му — влиза като посетител и оператор, както би работил човек пред компютъра. Предстоящата миграция на PHP не ѝ пречи.",
  },
  {
    h: "Честно към клиентите и по закон",
    p: "Съдържанието, направено с AI — например деца-моделите във видеата — се маркира като такова, както изискват регламентът на ЕС за AI и правилата на мрежите.",
  },
];

const NEED = [
  "Трите компютъра за инсталацията — и хората на тях: ти и двамата колеги",
  "Досегашни ваши снимки на продукти — от тях системата се учи на вярните цветове",
  "Абонаментите на AI програмите (ChatGPT и т.н.) — на твое име; ако нещо липсва, ти показвам къде и как",
  "Едно „да“ на първите резултати, преди да излязат в мрежите",
];

export default function KosaraOfertaPage() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">За Галина · Kosara.bg · детски дрехи и обувки · 03.11.2026</p>
        <h1>
          Съдържанието на Kosara — <em>от линка на продукта до готовия пост,</em> без да го правиш ти.
        </h1>
        <p className="deck">
          Благодаря за времето днес, Галина. Ето офертата за AI системата, за която говорихме: инсталираме я на
          компютрите ви, тя подготвя видеата, снимките и описанията, а ти одобряваш всичко, преди да излезе.
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
          <p className="kick">Защо · времето ти</p>
          <h2 className="h2sub">Времето ти отива в постове и снимки</h2>
        </div>
        <div className="stats">
          {STATS.map((s) => (
            <div className="stat" key={s.s}>
              <b>{s.b}</b>
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
            Ти даваш линк към продукта. Системата връща готовото — видео, снимки, банери и текст. Остава ти само
            „да“.
          </p>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Какво прави системата</p>
          <h2 className="h2sub">Два конвейера — за съдържанието и за продуктите</h2>
        </div>
        <div className="cat">
          {KAJ.map((a) => (
            <article className="item" key={a.h}>
              <span className="tag">{a.tag}</span>
              <h3>{a.h}</h3>
              <p>{a.p}</p>
              <p className="pr">{a.pr}</p>
            </article>
          ))}
        </div>
        <div className="vid">
          <h3>Пример: видео за роклята от kosara.bg — направено от линка на продукта</h3>
          <p className="vidnote">
            Един линк към продукта — и готово видео за мрежите. Така ще изглеждат видеата за твоите продукти:
            реалистични деца-модели в дрехата, без глас, само със субтитри.
          </p>
          <div className="vidwrap">
            <video
              controls
              playsInline
              preload="metadata"
              poster={POSTER}
              aria-label="Примерно видео за детска рокля от kosara.bg, направено от линка на продукта"
            >
              <source src={VIDEO} type="video/mp4" />
              Браузърът ти не показва видео — свали го от <a href={VIDEO}>тук</a>.
            </video>
          </div>
          <p className="vidlink">
            Видеото: <a href={PAGE}>promarketing.pw/oferta/kosara</a>
          </p>
          <p className="vidai">
            🤖 Видеото е генерирано с AI (хората и сцената са синтетични; роклята е истинският продукт)
          </p>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Как работи</p>
          <h2 className="h2sub">От линка до насрочения пост — с твоето одобрение по средата</h2>
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
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Контролът е твой</p>
          <h2 className="h2sub">Системата работи за теб — не вместо теб</h2>
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
          <p className="kick">Още в пакета</p>
          <h2 className="h2sub">Обучение на екипа и, ако искаш, връзка с каналите</h2>
        </div>
        <div className="cat">
          {EXTRAS.map((a) => (
            <article className="item svc" key={a.h}>
              <span className="tag">{a.tag}</span>
              <h3>{a.h}</h3>
              <p>{a.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Цената</p>
          <h2 className="h2sub">Една цена за трите компютъра — не на компютър</h2>
          <p className="lead">
            Един пакет: системата, инсталацията на трите работни места и обучението на екипа. Плащането е на две
            части — втората, когато системата работи и си доволна.
          </p>
        </div>
        <div className="deal">
          <div className="calc">
            <h3>AI система за Kosara.bg · еднократно</h3>
            <div className="row">
              <span>Инсталация на 3 компютъра + обучение</span>
              <b>800 €</b>
            </div>
            <div className="row">
              <span>ДДС 20 %</span>
              <b>160 €</b>
            </div>
            <div className="row tot">
              <span>Общо с ДДС</span>
              <b>960 €</b>
            </div>
            <p className="d">
              Еднократно, без ДДС 800 € (960 € с ДДС) — общо за трите компютъра, инсталацията и обучението на екипа, не
              на компютър.
            </p>
          </div>
          <div className="terms">
            <h3>Плащане и условия</h3>
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
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Как тръгваме</p>
          <h2 className="h2sub">От „да“ до работеща система за по-малко от месец</h2>
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

      <section className="pgbreak">
        <div className="sechead">
          <p className="kick">От теб, за да тръгнем</p>
          <h2 className="h2sub">Четири неща — и всичко останало правя аз</h2>
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
          Прегледай офертата спокойно. Когато си готова, обади ми се следващата седмица, както се разбрахме — и
          тръгваме. Ако имаш въпрос преди това, звънни ми или ми пиши на 0877 399 963.
        </p>
        <p className="ctas">
          <a className="btn" href={TEL}>
            Обади се на Ивайло
          </a>
          <a className="btn ghost" href={VIBER}>
            Пиши ми във Viber
          </a>
          <a className="btn ghost" href={TEL}>
            0877 399 963
          </a>
        </p>
        <p className="sig">
          <span className="ln">
            <b>Ивайло Петев</b> · Pro Marketing
          </span>
          <span className="ln">0877 399 963 · emmgivailopetev38@gmail.com</span>
          <span className="ln">🌐 petevai.com · promarketing.pw</span>
        </p>
      </section>
    </main>
  );
}
