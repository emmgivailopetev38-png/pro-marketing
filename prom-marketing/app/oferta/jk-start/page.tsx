/**
 * Стартов план за Инж. Йордан Колев (Данчо) — JK Photography, Пловдив (jordankolevjordanov@abv.bg,
 * jkphotography@abv.bg, 0885 655 563). Сватбен фотограф, 10+ години, 250+ проекта; видеото прави заедно с
 * BS Video. Среща на живо 23.10.2026 (Мол Марково тепе) — платена първата кампания за сватбите (400 €).
 *
 * Страницата показва: анализ на каналите му, пазара и конкурентите в Пловдив (проучване 23.10.2026),
 * кои клиенти стигат най-бързо до него, стратегията, двете пробни видеа, как ще изглежда рекламата и
 * как идва запитването (имейл), лийд формата, предложения за име на страницата и какво ни трябва от него.
 * Числата за пазара и цените са от публични източници (НСИ, в. „Марица“, Bellevue, сайтовете на студиата)
 * и са записани в Анализ/pazar-i-konkurenti-2026-10-23.md. Обръщението е на „ти“ — Ивайло му казва „Данчо“.
 */

const PDF = "/oferta/jk-start/ProMarketing-JK-startov-plan.pdf";
const V1 = "/oferta/jk-start/V1-parviyat-tanc-720p.mp4";
const V2 = "/oferta/jk-start/V2-svatba-2027-720p.mp4";
const V1P = "/oferta/jk-start/V1-poster.jpg";
const V2P = "/oferta/jk-start/V2-poster.jpg";
const KADAR = "/oferta/jk-start/reklama-kadar.jpg";
const LOGO = "/oferta/jk-start/logo.jpg";

const CSS = `
/* сайтът е тъмен (color-scheme: dark в globals.css) — тази страница е светла докрай,
   иначе в PDF-а полетата на листа излизат тъмни */
html:has(.pa-doc),body:has(.pa-doc){background:#F4F6F9;color-scheme:light}
.pa-doc{
  --ground:#F4F6F9; --panel:#E9EEF4; --surface:#FFFFFF;
  --ink:#0E1A2B; --ink-2:#3C4A5E; --ink-3:#71809A;
  --rule:#D7DFE9; --rule-soft:#E6ECF3;
  --navy:#11365C; --navy-soft:#E3EBF5; --amber:#E8A33D; --amber-ink:#8A5A12; --red:#D7261E;
  --shadow:0 1px 2px rgba(14,26,43,.05), 0 10px 28px -18px rgba(17,54,92,.35);
  background:var(--ground); color:var(--ink);
  font-family:var(--pa-ui),Arial,sans-serif; font-size:17px; line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
.pa-doc *{box-sizing:border-box}
.pa-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.pa-doc h1,.pa-doc h2{font-family:var(--pa-display),Arial Black,sans-serif;font-weight:700;letter-spacing:-.02em;text-wrap:balance}
.pa-doc .sechead{break-inside:avoid;break-after:avoid}
.pa-doc h3{font-family:var(--pa-ui),Arial,sans-serif;font-weight:700;letter-spacing:-.01em;text-wrap:balance}
.pa-doc a{color:var(--navy);text-underline-offset:3px}
.pa-doc a:focus-visible{outline:2px solid var(--navy);outline-offset:3px;border-radius:2px}
.pa-doc p{margin:0}

/* ── шапка ── */
.pa-doc .masthead{padding:58px 0 34px;border-bottom:1px solid var(--rule)}
.pa-doc .eyebrow{font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--amber-ink);margin:0 0 18px}
.pa-doc h1{font-size:50px;line-height:1.04;margin:0 0 18px;max-width:22ch}
.pa-doc h1 em{font-style:normal;color:var(--navy)}
.pa-doc .deck{font-size:19px;line-height:1.56;color:var(--ink-2);max-width:60ch;margin:0 0 22px}
.pa-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-size:14px;color:var(--ink-3)}
.pa-doc .byline a{font-weight:600}

/* ── секции ── */
.pa-doc section{margin:54px 0 0}
.pa-doc .kick{font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--amber-ink);margin:0 0 10px}
.pa-doc .h2sub{font-size:32px;line-height:1.14;margin:0 0 14px;max-width:30ch}
.pa-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.pa-doc .note{font-size:13.5px;color:var(--ink-3);margin:12px 0 0;max-width:74ch}

/* числата */
.pa-doc .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:0 0 18px}
.pa-doc .stat{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.pa-doc .stat b{display:block;font-family:var(--pa-display),sans-serif;font-weight:700;font-size:28px;line-height:1.05;color:var(--navy);font-variant-numeric:tabular-nums}
.pa-doc .stat b.bad{color:var(--red)}
.pa-doc .stat span{display:block;font-size:13px;line-height:1.4;color:var(--ink-3);margin-top:6px}

.pa-doc .facts{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:0 0 20px}
.pa-doc .fact{background:var(--panel);border-radius:12px;padding:18px 20px}
.pa-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--navy)}
.pa-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.pa-doc .pull{border-left:4px solid var(--amber);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px}
.pa-doc .pull p{font-family:var(--pa-display),sans-serif;font-weight:600;font-size:20px;line-height:1.4;color:var(--ink)}

/* карти */
.pa-doc .cards{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.pa-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px 22px 20px;box-shadow:var(--shadow)}
.pa-doc .card .num{font-family:var(--pa-mono),monospace;font-size:12px;color:var(--amber-ink);letter-spacing:.12em;display:block;margin:0 0 8px}
.pa-doc .card h3{font-size:17.5px;margin:0 0 8px}
.pa-doc .card p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* видеата */
.pa-doc .formats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.pa-doc .fmt{background:var(--ink);color:#F2F5F9;border-radius:14px;padding:20px 20px 18px}
.pa-doc .fmt .tag{font-family:var(--pa-mono),monospace;font-size:12px;letter-spacing:.1em;color:var(--amber);margin:0 0 10px}
.pa-doc .fmt h3{font-size:16px;margin:0 0 8px;color:#fff}
.pa-doc .fmt .hook{font-family:var(--pa-display),sans-serif;font-weight:700;font-size:19px;line-height:1.3;color:#FFE14D;margin:0 0 8px}
.pa-doc .fmt p{font-size:14px;line-height:1.5;color:#C9D3E0}
.pa-doc .fmt.ready{outline:3px solid var(--amber)}

/* кампанията */
.pa-doc .tbl{width:100%;border-collapse:separate;border-spacing:0;background:var(--surface);border:1px solid var(--rule);border-radius:14px;overflow:hidden;font-size:14.5px}
.pa-doc .tbl th,.pa-doc .tbl td{padding:12px 16px;text-align:left;border-bottom:1px solid var(--rule-soft);vertical-align:top}
.pa-doc .tbl th{width:30%;background:var(--panel);font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);font-weight:600}
.pa-doc .tbl tr:last-child td,.pa-doc .tbl tr:last-child th{border-bottom:none}

/* планът по дни */
.pa-doc .days{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.pa-doc .step{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.pa-doc .step b{display:block;font-family:var(--pa-mono),monospace;font-weight:500;font-size:12.5px;letter-spacing:.08em;color:var(--amber-ink);margin:0 0 6px}
.pa-doc .step p{font-size:14.5px;line-height:1.5;color:var(--ink-2)}
.pa-doc .step.go{border:2px solid var(--navy);background:var(--navy-soft)}

/* ── пакетът ── */
.pa-doc .opts{display:grid;grid-template-columns:1.15fr .85fr;gap:18px}
.pa-doc .opt{position:relative;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:28px 26px 24px;box-shadow:var(--shadow)}
.pa-doc .opt.rec{border:2px solid var(--navy)}
.pa-doc .opt .badge{position:absolute;top:-13px;left:22px;background:var(--navy);color:#fff;font-weight:600;font-size:12px;letter-spacing:.06em;border-radius:999px;padding:4px 12px}
.pa-doc .opt h3{font-size:19px;margin:0 0 8px}
.pa-doc .opt .big{font-family:var(--pa-display),sans-serif;font-weight:700;font-size:40px;line-height:1;color:var(--navy);margin:0 0 4px;font-variant-numeric:tabular-nums}
.pa-doc .opt .big small{font-family:var(--pa-ui),sans-serif;font-size:15px;font-weight:600;color:var(--ink-3);margin-left:8px;white-space:nowrap;display:inline-block}
.pa-doc .opt .sub{font-family:var(--pa-mono),monospace;font-size:13px;color:var(--ink-3);margin:0 0 16px}
.pa-doc .opt .for{font-size:15px;line-height:1.55;color:var(--ink-2);margin:0 0 14px}
.pa-doc .opt.next{background:var(--panel);border-color:transparent;box-shadow:none}
.pa-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px}
.pa-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15px;line-height:1.5;color:var(--ink-2)}
.pa-doc .list li i{font-style:normal;color:var(--navy);font-weight:700}
.pa-doc .budget{margin-top:14px;background:var(--navy);color:#EAF1F9;border-radius:12px;padding:16px 18px}
.pa-doc .budget b{display:block;font-family:var(--pa-display),sans-serif;font-size:22px;color:#FFE14D;margin:0 0 4px}
.pa-doc .budget p{font-size:14px;line-height:1.5;color:#C9D7E6}
.pa-doc .pay{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.pa-doc .pay div{background:var(--panel);border-radius:10px;padding:12px 14px;font-size:14px;color:var(--ink-2)}
.pa-doc .pay div b{display:block;font-size:18px;color:var(--navy);font-variant-numeric:tabular-nums}

/* ── следващата стъпка ── */
.pa-doc .closing{background:var(--navy-soft);border:1px solid #CBD9EA;border-left:4px solid var(--navy);border-radius:16px;padding:30px 32px 28px;margin-top:54px}
.pa-doc .closing h2{color:var(--navy);font-size:30px;margin:0 0 10px}
.pa-doc .closing p{font-size:17px;line-height:1.6;color:var(--ink);max-width:62ch}
.pa-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.pa-doc .closing a.btn{font-weight:600;text-decoration:none;color:#fff;background:var(--navy);border-radius:10px;padding:12px 18px;font-size:15px}
.pa-doc .closing a.ghost{color:var(--navy);background:transparent;border:1px solid var(--navy)}
.pa-doc .sig{break-inside:avoid;margin:26px 0 0;font-size:13.5px;color:var(--ink-3);line-height:1.7;border-top:1px solid #CBD9EA;padding-top:16px;max-width:none}
.pa-doc .sig b{color:var(--ink)}
.pa-doc .sig .ln{display:block}

@media (max-width:860px){
  .pa-doc .stats{grid-template-columns:repeat(2,1fr)}
  .pa-doc .formats{grid-template-columns:1fr}
}
@media (max-width:760px){
  .pa-doc .wrap{padding:0 16px 72px}
  .pa-doc h1{font-size:34px}
  .pa-doc .h2sub{font-size:26px}
  .pa-doc .deck{font-size:17.5px}
  .pa-doc .opts,.pa-doc .cards,.pa-doc .days,.pa-doc .facts,.pa-doc .pay{grid-template-columns:1fr}
  .pa-doc .masthead{padding:36px 0 26px}
  .pa-doc .closing{padding:24px 20px}
  .pa-doc .pull p{font-size:18px}
  .pa-doc .tbl th{width:38%}
}
@media print{
  :root,html,body{color-scheme:light;background:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pa-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .pa-doc .wrap{max-width:none;padding:0}
  .pa-doc .masthead{padding:0 0 12px}
  .pa-doc .sechead{break-inside:avoid;break-after:avoid;page-break-after:avoid}
  .pa-doc h1{font-size:30px;margin-bottom:10px;max-width:none}
  .pa-doc .deck{font-size:14px;max-width:none}
  .pa-doc .byline .pdf{display:none}
  .pa-doc section{margin:13px 0 0}
  .pa-doc .h2sub,.pa-doc .lead{max-width:none}
  .pa-doc .kick,.pa-doc .h2sub,.pa-doc .lead{break-after:avoid}
  .pa-doc .h2sub{font-size:20px;margin-bottom:8px}
  .pa-doc .lead{font-size:12.5px;margin-bottom:10px}
  .pa-doc .stat,.pa-doc .fact,.pa-doc .card,.pa-doc .opt,.pa-doc .pull,.pa-doc .step,.pa-doc .fmt,.pa-doc .tbl tr,.pa-doc .budget{break-inside:avoid}
  .pa-doc .stats{grid-template-columns:repeat(4,1fr);gap:8px}
  .pa-doc .stat{padding:10px 12px}
  .pa-doc .stat b{font-size:20px}
  .pa-doc .stat span{font-size:11px}
  .pa-doc .facts{grid-template-columns:repeat(2,1fr);gap:8px}
  .pa-doc .fact{padding:10px 12px}
  .pa-doc .fact h3{font-size:13px}
  .pa-doc .fact p{font-size:11.5px}
  .pa-doc .pull{padding:10px 16px}
  .pa-doc .pull p{font-size:15px}
  .pa-doc .cards{grid-template-columns:repeat(2,1fr);gap:8px}
  .pa-doc .card{padding:10px 12px;box-shadow:none}
  .pa-doc .card .num{margin-bottom:3px}
  .pa-doc .card h3{font-size:13px;margin-bottom:4px}
  .pa-doc .card p{font-size:11.5px;line-height:1.46}
  .pa-doc .formats{grid-template-columns:repeat(3,1fr);gap:8px}
  .pa-doc .fmt{padding:10px 12px}
  .pa-doc .fmt h3{font-size:12.5px;margin-bottom:3px}
  .pa-doc .fmt .hook{font-size:14px;margin-bottom:3px}
  .pa-doc .fmt p{font-size:11px}
  .pa-doc .tbl{font-size:11.5px}
  .pa-doc .tbl th,.pa-doc .tbl td{padding:6px 10px}
  .pa-doc .days{grid-template-columns:repeat(3,1fr);gap:8px}
  .pa-doc .step{padding:9px 12px}
  .pa-doc .step p{font-size:11.5px}
  .pa-doc .opts{grid-template-columns:1.15fr .85fr;gap:12px}
  .pa-doc .opt{padding:16px 16px 12px;box-shadow:none}
  .pa-doc .opt .big{font-size:28px}
  .pa-doc .opt .for{font-size:12px}
  .pa-doc .opt h3{font-size:15px}
  .pa-doc .list{gap:5px}
  .pa-doc .list li{font-size:12px}
  .pa-doc .budget{padding:10px 12px;margin-top:8px}
  .pa-doc .budget b{font-size:16px}
  .pa-doc .budget p{font-size:11px}
  .pa-doc .pay div{padding:8px 10px;font-size:11.5px}
  .pa-doc .pay div b{font-size:14px}
  .pa-doc .note{font-size:11px}
  .pa-doc .closing{padding:14px 18px;margin-top:16px;break-inside:avoid}
  .pa-doc .sig{margin:8px 0 0;font-size:10.5px;line-height:1.45}
  .pa-doc .sig .ln{display:inline}
  .pa-doc .sig .ln+.ln::before{content:"  ·  "}
  .pa-doc .closing h2{font-size:20px}
  .pa-doc .closing p{font-size:13.5px}
  .pa-doc .closing .ctas{display:none}
  .pa-doc .fact,.pa-doc .closing,.pa-doc .opt .badge,.pa-doc .opt.next,.pa-doc .step.go,.pa-doc .fmt,.pa-doc .budget,.pa-doc .tbl th,.pa-doc .pay div{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  nextjs-portal{display:none}
}

/* ── допълнения за стартовия план на JK ── */
.pa-doc .tbl.wide th{width:22%}
.pa-doc .tbl.cols td,.pa-doc .tbl.cols th{font-size:13.5px;padding:10px 12px}
.pa-doc .tbl.cols thead th{width:auto;background:var(--panel);color:var(--ink-3)}
.pa-doc .tbl.cols td b{color:var(--ink)}
.pa-doc .rank{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.pa-doc .rank article{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:16px 18px;box-shadow:var(--shadow)}
.pa-doc .rank article.top{border-color:var(--amber);background:#FFF8E8}
.pa-doc .rank .n{font-family:var(--pa-mono),monospace;font-size:12px;color:var(--amber-ink);letter-spacing:.08em}
.pa-doc .rank h3{margin:4px 0 6px;font-size:17px}
.pa-doc .rank p{font-size:14px;color:var(--ink-2);margin:0}
.pa-doc .rank .meta{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}
.pa-doc .rank .meta span{font-size:12px;background:var(--panel);border-radius:999px;padding:3px 10px;color:var(--ink-2)}
.pa-doc .videos{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
.pa-doc .video{background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:16px;box-shadow:var(--shadow)}
.pa-doc .video video{width:100%;max-width:300px;aspect-ratio:9/16;border-radius:14px;background:#000;display:block;margin:0 auto 12px}
.pa-doc .video h3{margin:0 0 4px;font-size:18px}
.pa-doc .video .tag{font-family:var(--pa-mono),monospace;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--amber-ink);margin:0 0 6px}
.pa-doc .video p{font-size:14.5px;color:var(--ink-2)}
.pa-doc .video ul{margin:8px 0 0;padding-left:18px;font-size:14px;color:var(--ink-2)}
.pa-doc .flow{display:grid;grid-template-columns:1.05fr 1fr;gap:22px;align-items:start}
.pa-doc .phone{width:360px;max-width:100%;margin:0 auto;background:#111;border-radius:38px;padding:14px 12px;box-shadow:0 20px 50px -20px rgba(0,0,0,.5)}
.pa-doc .screen{background:#fff;border-radius:26px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;color:#050505}
.pa-doc .fb-top{display:flex;align-items:center;gap:10px;padding:12px 12px 8px}
.pa-doc .fb-top img{width:40px;height:40px;border-radius:50%;object-fit:cover}
.pa-doc .fb-top b{display:block;font-size:14px}
.pa-doc .fb-top small{font-size:11.5px;color:#65676b}
.pa-doc .fb-text{font-size:14px;line-height:1.35;padding:0 12px 10px}
.pa-doc .fb-media{position:relative;background:#000}
.pa-doc .fb-media img{display:block;width:100%;aspect-ratio:9/13;object-fit:cover}
.pa-doc .fb-media .play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:58px;height:58px;border-radius:50%;background:rgba(255,255,255,.9);display:grid;place-items:center;font-size:22px;color:#111}
.pa-doc .fb-cta{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f0f2f5;padding:10px 12px}
.pa-doc .fb-cta small{display:block;font-size:11px;color:#65676b;text-transform:uppercase}
.pa-doc .fb-cta b{font-size:13.5px}
.pa-doc .fb-cta span{background:#e4e6eb;border-radius:6px;padding:8px 12px;font-weight:700;font-size:13px;white-space:nowrap}
.pa-doc .fb-bar{display:flex;justify-content:space-around;padding:8px 10px;border-top:1px solid #e4e6eb;font-size:12.5px;color:#65676b}
.pa-doc .steps{counter-reset:s;margin:0;padding:0;list-style:none}
.pa-doc .steps li{counter-increment:s;position:relative;padding:0 0 16px 52px;font-size:15.5px;color:var(--ink-2)}
.pa-doc .steps li b{color:var(--ink)}
.pa-doc .steps li::before{content:counter(s);position:absolute;left:0;top:-2px;width:36px;height:36px;border-radius:50%;background:var(--navy);color:#fff;font-family:var(--pa-display),sans-serif;font-weight:700;display:grid;place-items:center;font-size:15px}
.pa-doc .mail{background:var(--surface);border:1px solid var(--rule);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);font-size:14px}
.pa-doc .mail .hd{background:var(--panel);padding:12px 16px;border-bottom:1px solid var(--rule)}
.pa-doc .mail .hd b{display:block;font-size:15px}
.pa-doc .mail .hd span{color:var(--ink-3);font-size:12.5px}
.pa-doc .mail .bd{padding:14px 16px}
.pa-doc .mail .bd table{width:100%;border-collapse:collapse}
.pa-doc .mail .bd td{padding:5px 0;border-bottom:1px dashed var(--rule-soft);vertical-align:top}
.pa-doc .mail .bd td:first-child{color:var(--ink-3);width:40%}
.pa-doc .form{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:16px 18px;box-shadow:var(--shadow)}
.pa-doc .form h4{margin:0 0 6px;font-size:15px}
.pa-doc .form ol{margin:0;padding-left:20px;font-size:14.5px;color:var(--ink-2)}
.pa-doc .form ol li{margin:0 0 6px}
.pa-doc .form ol li span{color:var(--ink-3);font-size:13px}
.pa-doc .names{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.pa-doc .name{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:16px 18px;box-shadow:var(--shadow)}
.pa-doc .name.rec{border-color:var(--navy);background:var(--navy-soft)}
.pa-doc .name b{display:block;font-family:var(--pa-display),sans-serif;font-size:19px;letter-spacing:-.01em;margin:0 0 6px}
.pa-doc .name p{font-size:14px;color:var(--ink-2)}
.pa-doc .name .why{font-size:12.5px;color:var(--ink-3);margin-top:6px}
.pa-doc .todo{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:6px 18px;box-shadow:var(--shadow)}
.pa-doc .todo li{list-style:none;display:grid;grid-template-columns:28px 1fr;gap:10px;padding:12px 0;border-bottom:1px solid var(--rule-soft);font-size:15px}
.pa-doc .todo li:last-child{border-bottom:none}
.pa-doc .todo li i{font-style:normal;width:24px;height:24px;border:2px solid var(--navy);border-radius:6px;display:block;margin-top:2px}
.pa-doc .todo li b{display:block}
.pa-doc .todo li span{color:var(--ink-2);font-size:14px}
.pa-doc .todo li code{font-family:var(--pa-mono),monospace;font-size:13px;background:var(--panel);padding:1px 6px;border-radius:5px}
@media (max-width:860px){
  .pa-doc .flow,.pa-doc .videos,.pa-doc .rank,.pa-doc .names{grid-template-columns:1fr}
}
@media print{
  .pa-doc .video video{display:none}
  .pa-doc .phone{box-shadow:none}
}
`;

const STATS = [
  { b: "2 700", s: "последователи на страницата JK Photography", bad: false },
  { b: "28", s: "отзива — 100 % препоръчват. Това е злато, което не се вижда в реклама", bad: false },
  { b: "683", s: "последователи в Instagram при 2 400 следвани — профилът изглежда „нов“", bad: true },
  { b: "0", s: "активни реклами. В Пловдив днес рекламира само 1 сватбен фотограф", bad: true },
];

const VIDYAH = [
  {
    h: "Сайтът е хубав, но мълчи за цените",
    p: "yordankolev.com няма нито цена, нито пакет, нито отзив. Конкурентите публикуват пакети от 880 до 1 950 € и искат капаро 200 €. Когато клиентът не вижда пакет, сравнява само числото — и печели най-евтиният.",
  },
  {
    h: "Името не казва кой стои зад обектива",
    p: "„JK Photography“ може да е всеки. 28-те отзива говорят за Йордан — човека, който успокоява булката и „винаги е на точното място“. Името на страницата трябва да носи това доверие.",
  },
  {
    h: "Запитванията се губят на входа",
    p: "Формата на сайта праща само имейл, телефонът е по желание, няма автоматичен отговор. Знаем го от август. Рекламата ще води към форма, в която телефонът е задължителен и запитването идва при теб до минута.",
  },
  {
    h: "Пазарът за платена сватбена реклама в Пловдив е почти празен",
    p: "На 23.10 в Meta има само една активна сватбена реклама от пловдивски фотограф (Anna Zlateva, от 22.10). Сезонът на резервациите за 2027 тече — конкурентите в София вече пускат „-20 % до 31.12“.",
  },
  {
    h: "Материалите от партитата — емоция, но не твоята фотография",
    p: "52-та видеа са от залите: първи танц с искри и дим, DJ светлини, гобо надписи, част с чужд бранд в края. Силни за усещане, слаби като доказателство за снимките ти. Затова видеата са от твоите снимки + тези моменти.",
  },
  {
    h: "Instagram иска подреждане",
    p: "44 поста, 683 последователи, 2 400 следвани. Съотношението прилича на профил, който „гони“ хора. Спираме следването на непознати, пускаме Reels от видеата и една подчертана история „Сватби“.",
  },
];

const PAZAR = [
  ["Сватби в община Пловдив, 2025", "1 333 граждански церемонии; до 06.06.2026 — 453 сключени и 446 записани (в. „Марица“)."],
  ["Бракове в България, 2025", "20 594 (НСИ). Средна възраст при първи брак: мъже 34, жени 31."],
  ["Сезонът", "Май–септември, съботите се пълнят първи. Популярните дати се резервират над година напред — тоест сега."],
  ["Цена „само фотограф“, цял ден", "900–1 300 € най-често (проучване на 156 ценоразписа, Bellevue, октомври 2026). В Пловдив: 880 · 900 · 950 · 999 · 1 190 · 1 300 €."],
  ["Цена „фото + видео“", "2 060–2 800 € най-често. Това е твоят продукт с BS Video — един договор, един екип."],
  ["Капаро", "200 € (Божалов, Skyview); 500 € невъзстановимо (Kazakov, София)."],
  ["Какво продават всички", "Трейлър 2–4 мин, дрон, Love Story сесия (190–360 €), онлайн галерия, албум. Трейлър в същия ден в Пловдив няма никой."],
];

const KONKURENTI = [
  ["Photo Stories (Валерия Масленникова)", "880 € · 12 ч · >800 кадъра", "Първите 10 снимки до 3 дни; „малка сватба“ 380 €"],
  ["Атанас Божалов", "900 / 1 400 / 1 950 €", "Капаро 200 €; пакет с Love Story и албум; „стойност X → цена Y“"],
  ["Weddingbul", "999 € (зачертана 1 200)", "2 фотографа; форма „провери дата“"],
  ["Иван Мандевски", "1 300 € · до 10 ч", "Мобилно приложение с любимите снимки; експрес 300 €"],
  ["Nightchill (Драгомир Драганов)", "1 190 €", "Абитуриенти 400 €"],
  ["Георги Вълков", "280 / 950 €", "Най-ниските цени; кръщене 120 €"],
  ["SH Video · Skyview · Spotlight (видео)", "1 350–3 000 €", "4K трейлър, дрон, FPV; фото+видео екип 2 900 € (Skyview)"],
  ["Anna Zlateva", "цени скрити", "Единствената активна реклама за Пловдив: „Запазете дата 2027/2028“"],
];

const SABITIA = [
  { n: "01 · СЕГА", h: "Коледни семейни сесии", p: "Ноември – 20 декември. Купуват се през октомври–ноември, решава майката, 100–150 € за 10–15 кадъра. Най-бързият път до първа продажба и събира аудитория, която после вижда сватбената реклама.", meta: ["сезон: сега", "цикъл: дни", "бюджет 100–150 €"], top: true },
  { n: "02 · ГЛАВНОТО", h: "Сватби 2027", p: "Най-високата стойност: 900–1 300 € фото, 2 060–2 800 € фото + видео. Резервациите за 2027 текат от октомври, платената реклама в Пловдив е почти празна. Цикъл 2–6 седмици: запитване → разговор → капаро.", meta: ["сезон: резервации сега", "цикъл: 2–6 седм.", "бюджет 900–2 800 €"], top: true },
  { n: "03", h: "Кръщенета", p: "Целогодишно, кратко време от решение до покупка, 100–200 € (с видео ~300 €). Решават родителите и кръстникът; търсят в Google и по препоръка.", meta: ["целогодишно", "цикъл: дни–седмици", "бюджет 100–200 €"], top: true },
  { n: "04", h: "Годежни / Love Story сесии", p: "190–360 €. Слаби сами по себе си, силни като вход към сватбата: двойката те опитва, после те взима за големия ден.", meta: ["ъпсел към сватба", "бюджет 190–360 €"], top: false },
  { n: "05", h: "Абитуриентски балове", p: "130–280 € (премиум до 480 €). Реклами вече текат (Daniel Petkov от 08.10 с giveaway); сесиите са април–май. Втора вълна през януари.", meta: ["сезон: януари–май", "цикъл: седмици", "бюджет 130–280 €"], top: false },
  { n: "06", h: "Фирмени коледни партита и бизнес портрети", p: "Ноември–декември за партитата; портретите целогодишно. Решава HR или собственикът, цикълът е по-дълъг (оферта → одобрение). Подходящо за LinkedIn и директни писма, не за Meta.", meta: ["сезон: ноември–декември", "B2B", "150 €/ч ориентир"], top: false },
  { n: "07", h: "Семейни, новородени, рождени дни", p: "75–190 €. Висока студийна конкуренция в Пловдив (Letta, Heaven). Добро допълнение след Коледа, когато вече имаме аудитория от майки.", meta: ["целогодишно", "бюджет 75–190 €"], top: false },
  { n: "08", h: "Рекламна и продуктова фотография", p: "10 €/кадър и нагоре, оферти по обем. Отделен B2B канал — след като сватбеният поток работи.", meta: ["B2B", "по оферта"], top: false },
];

const STRATEGIA = [
  { h: "Реклама за запитвания, не за харесвания", p: "Целта на всяка реклама е човекът да остави телефон и дата. Форма в самия Facebook (не напуска приложението), телефонът е задължителен. Meta оптимизира точно за попълнена форма." },
  { h: "Две кампании от първия ден", p: "„Сватба 2027“ — за двойки 24–38 г. в Пловдив, Пазарджик, Асеновград и 60 км около тях, сгодени или с интерес към сватби. „Коледни сесии“ — за майки 25–45 г. в Пловдив. Всяка със свой бюджет; виждаме коя носи и ѝ даваме повече." },
  { h: "Видеата: твоите снимки + моментите с искри", p: "20–30 секунди, вертикални, едри надписи, които се четат и без звук. Първите две са готови по-долу. Третото — „Хората зад кадъра“ — го снимаме на продуцентския ден в Пловдив." },
  { h: "Името на страницата носи твоето име", p: "Хората питат за „Йордан“, не за „JK“. Предложенията са по-долу. Смяната е на две стъпки, за да не я спре Meta." },
  { h: "Запитването при теб до минута", p: "Всяко попълване идва на имейла ти (jkphotography@abv.bg) и в CRM-а ни, с всички отговори. Ти звъниш същия ден. Ако искаш — и във Viber." },
  { h: "Измерване и отчет всеки понеделник", p: "Показвания, запитвания, цена на запитване, кое видео работи. След 1–3 седмици спираме слабото и усилваме силното." },
];

const VIDEA = [
  { tag: "Пробно видео 1 · 28 s", h: "„Първият танц“", src: V1, poster: V1P, p: "Булката с воала → ангелските криле → целувката → първият танц в дим и искри → църквата → искрите в залата → край с логото и „Запази дата за 2027“.", kakvo: ["Надписи: „Вашата сватба.“ · „Един ден. Хиляди мигове.“ · „Снимаме я така, че да я преживявате отново.“", "Музика: кино пиано и струнни (инструментал, без глас)", "Поправяме всеки кадър, надпис или музика по твоя забележка"] },
  { tag: "Пробно видео 2 · 21 s", h: "„Сватба 2027?“", src: V2, poster: V2P, p: "Куката е въпросът: „Сватба 2027? Съботите май–септември се пълнят първи.“ Снимките ти една след друга, доказателството „10+ години · 250+ истории · 100 % препоръчват“, после „Провери дали датата ти е свободна“.", kakvo: ["По-бързо рязане, за хора, които скролват", "Същата музика — за да се познава стилът", "Версия за Коледните сесии правим от твоите семейни снимки"] },
];

const FORMA_SVATBA = [
  ["Кога е сватбата?", "избор: месец 2027 / „още не е ясно“"],
  ["Къде?", "Пловдив · област Пловдив · друг град"],
  ["Какво ви трябва?", "само фотография · фото + видео · още не знаем"],
  ["Колко гости (приблизително)?", "до 50 · 50–100 · 100–150 · над 150"],
  ["Ориентировъчен бюджет за фото (+видео)?", "до 1 000 € · 1 000–1 500 € · 1 500–2 500 € · над 2 500 € · „да обсъдим“"],
  ["Имате ли вече фотограф?", "не · сравняваме · да, търсим видео"],
  ["Име · телефон · имейл", "попълнени автоматично от профила; телефонът е задължителен"],
  ["Кога да ви звъннем?", "сутрин · следобед · вечер"],
];

const FORMA_KOLEDA = [
  ["Колко сте и на колко години са децата?", "свободен текст"],
  ["Кога предпочитате?", "ноември · 1–15 декември · 16–20 декември"],
  ["Къде?", "студио/декор · на открито"],
  ["Име · телефон", "задължителни"],
];

const IMENA = [
  { n: "Йордан Колев · Сватбен фотограф", p: "Име + занаят + град в описанието. Така те намират в търсачката на Facebook и в Google, а отзивите „Йордан беше до нас“ съвпадат с името.", why: "Препоръката ни. Най-много доверие на един поглед.", rec: true },
  { n: "JK Photography · Йордан Колев", p: "Запазва логото и познатото „JK“, добавя човека. Безопасна първа стъпка — Meta одобрява такава промяна почти винаги.", why: "Стъпка 1, ако не искаш рязка смяна. След 2–3 месеца → „Йордан Колев · Сватбен фотограф“.", rec: false },
  { n: "Yordan Kolev Photography", p: "Международно звучене, съвпада с yordankolev.com. По-слабо на български — хората пишат „Йордан“ на кирилица.", why: "Ако мислиш за клиенти от чужбина и дестинационни сватби.", rec: false },
  { n: "Фотограф Йордан Колев · Пловдив", p: "Най-близо до начина, по който хората търсят: „фотограф Пловдив“. Градът в името работи за локалното търсене.", why: "Добра алтернатива, ако искаш градът да е в заглавието.", rec: false },
];

const TRYABVA = [
  { b: "Рекламният акаунт в портфолиото", s: "В Business settings → Ad accounts → Add → „Add an ad account“ → ID 485581085632968. Ние сме в портфолиото JK Photography с пълен достъп, но акаунтът още не е вътре. Бюджетът остава от твоята карта." },
  { b: "Достъп до страницата JK Photography", s: "Заявено е от нас („Assign people“ → ProMarketing EOOD → Everything). Ако видиш известие — потвърди." },
  { b: "Име на страницата", s: "Избери едно от четирите по-долу. Сменяме го ние." },
  { b: "„Да“ или поправки за двете видеа", s: "Кадър, надпис, музика — казваш, поправяме същия ден." },
  { b: "Цена „от … €“ за 2027 (по желание)", s: "Пазарът в Пловдив е 900–1 300 € фото и 2 060–2 800 € фото + видео. Видима цена отсява любопитните и вдига качеството на запитванията. Цената е изцяло твое решение." },
  { b: "10–15 снимки за Коледните сесии", s: "Семейни или детски, ако пускаме втората кампания още през ноември." },
  { b: "Верификация на рекламодател", s: "От 14.11.2026 Meta иска верифициран рекламодател за всички нови реклами в България. Проверяваме акаунта ти и ти казваме какво да качиш (документ на фирмата)." },
];

const DNI = [
  { b: "ден 1–2", p: "Достъпи (рекламен акаунт в портфолиото, страницата), избор на име, политика за поверителност на yordankolev.com за формата. Ти казваш „да“ или „поправи“ за видеата.", go: false },
  { b: "ден 3", p: "Финалните видеа, двете форми, пикселът на сайта, текстовете на рекламите. Всичко минава през теб.", go: false },
  { b: "ден 4 · старт", p: "Рекламите са на живо. Първите запитвания идват през седмицата — на имейла ти. Всеки понеделник — отчет с числата.", go: true },
];

export default function JkStart() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">За Данчо · JK Photography · стартов план · 23.10.2026</p>
        <h1>
          Повече сватби през 2027 —{" "}
          <em>и клиенти, които сами ти пишат.</em>
        </h1>
        <p className="deck">
          Благодаря за срещата днес и за материалите, Данчо. Ето целия анализ —
          твоите канали, пазарът и конкурентите в Пловдив — планът за първия
          месец, двете пробни видеа и как точно ще изглежда рекламата и
          запитването, което идва при теб. Нищо не тръгва без твоето „да“.
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
          <p className="kick">Анализът · твоите канали</p>
          <h2 className="h2sub">Снимките са на високо ниво. Пътят до теб — не.</h2>
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
            Булката не търси „фотограф“. Търси човек, на когото да повери
            единствения ден, който не може да се повтори. Задачата на рекламата
            е този човек да си ти — с име, лице и доказателства.
          </p>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Пазарът · Пловдив и България</p>
          <h2 className="h2sub">Числата, върху които стъпва планът</h2>
          <p className="lead">
            Всичко е от публични източници — НСИ, в. „Марица“, проучването на
            156 ценоразписа (Bellevue, октомври 2026) и сайтовете на студиата.
            Пълният файл с линковете е при нас.
          </p>
        </div>
        <table className="tbl wide">
          <tbody>
            {PAZAR.map(([k, v]) => (
              <tr key={k}>
                <th>{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Конкурентите · кой какво продава</p>
          <h2 className="h2sub">Всички показват пакети. Почти никой не рекламира.</h2>
        </div>
        <table className="tbl cols">
          <thead>
            <tr>
              <th>Студио</th>
              <th>Цена за сватба</th>
              <th>Куката им</th>
            </tr>
          </thead>
          <tbody>
            {KONKURENTI.map(([a, b, c]) => (
              <tr key={a}>
                <td>
                  <b>{a}</b>
                </td>
                <td>{b}</td>
                <td>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">
          19 студия са в пълния анализ. Изводът: твоето предимство е фото + кино
          видео от един екип (с BS Video: дрон, FPV, кран) и 28 отзива със 100 %
          — а това в Пловдив никой не го рекламира.
        </p>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Клиентите · кои стигат най-бързо до теб</p>
          <h2 className="h2sub">Подредени по скорост до първа продажба и по стойност</h2>
        </div>
        <div className="rank">
          {SABITIA.map((s) => (
            <article className={s.top ? "top" : ""} key={s.h}>
              <p className="n">{s.n}</p>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
              <div className="meta">
                {s.meta.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <p className="note">
          Първият месец: 01 + 02 едновременно (Коледните носят бърз кеш и
          аудитория, сватбите — стойността). 03 влиза през януари, когато
          виждаме числата.
        </p>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Стратегията</p>
          <h2 className="h2sub">Как ще идват запитванията</h2>
        </div>
        <div className="cards">
          {STRATEGIA.map((k, i) => (
            <article className="card" key={k.h}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <h3>{k.h}</h3>
              <p>{k.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Двете пробни видеа</p>
          <h2 className="h2sub">Твоите снимки + моментите с искри. Виж ги и кажи.</h2>
          <p className="lead">
            Вертикални, за Reels, Stories и лентата. Музиката е инструментална
            и без глас — няма нужда от AI етикет. Кадрите са от партитата, които
            ни прати, и от галерията на сайта ти.
          </p>
        </div>
        <div className="videos">
          {VIDEA.map((v) => (
            <article className="video" key={v.h}>
              <video controls playsInline preload="metadata" poster={v.poster} src={v.src} />
              <p className="tag">{v.tag}</p>
              <h3>{v.h}</h3>
              <p>{v.p}</p>
              <ul>
                {v.kakvo.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="note">
          Третото видео — „Хората зад кадъра“ (ти и колегата с камерите през
          Стария град) — е най-силното и го снимаме на продуцентския ден.
          Планът за деня от 01.09 остава в сила.
        </p>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Как ще изглежда рекламата</p>
          <h2 className="h2sub">От скрола до твоя имейл — за под минута</h2>
          <p className="lead">
            Вляво е рекламата така, както ще я види една булка на телефона си.
            Вдясно — какво става, когато натисне бутона, и как запитването
            пристига при теб.
          </p>
        </div>
        <div className="flow">
          <div className="phone">
            <div className="screen">
              <div className="fb-top">
                <img src={LOGO} alt="" />
                <div>
                  <b>Йордан Колев · Сватбен фотограф</b>
                  <small>Спонсорирано · Пловдив</small>
                </div>
              </div>
              <p className="fb-text">
                Сватба през 2027? Съботите май–септември се пълнят първи. 💍
                Фото + видео от един екип, 10+ години, 100 % препоръчват. Провери
                дали датата ти е свободна — отговор до 24 часа.
              </p>
              <div className="fb-media">
                <img src={KADAR} alt="" />
                <span className="play">▶</span>
              </div>
              <div className="fb-cta">
                <div>
                  <small>yordankolev.com</small>
                  <b>Провери свободна дата за 2027</b>
                </div>
                <span>Запази дата</span>
              </div>
              <div className="fb-bar">
                <span>👍 Харесвам</span>
                <span>💬 Коментар</span>
                <span>↗ Сподели</span>
              </div>
            </div>
          </div>
          <div>
            <ol className="steps">
              <li>
                <b>Булката вижда видеото</b> в лентата или в Reels — между
                приятелите си, не на чужд сайт.
              </li>
              <li>
                <b>Натиска „Запази дата“.</b> Отваря се форма вътре във
                Facebook, с вече попълнени име, телефон и имейл от профила ѝ.
              </li>
              <li>
                <b>Отговаря на 5–6 кратки въпроса</b> (дата, град, фото или
                фото + видео, гости, бюджет) и натиска „Изпрати“. Вижда
                „Благодаря! Йордан ще ти звънне до 24 часа“.
              </li>
              <li>
                <b>До минута запитването е на имейла ти</b> (jkphotography@abv.bg)
                и в нашия CRM. Ако искаш — и във Viber.
              </li>
              <li>
                <b>Ти звъниш същия ден.</b> Това е целият път. Никакви „ще ти
                пиша“ в коментари, никакви изгубени съобщения.
              </li>
            </ol>
            <div className="mail">
              <div className="hd">
                <b>🔔 Ново запитване за сватба — Мария П. · 12 юни 2027</b>
                <span>до: jkphotography@abv.bg · от рекламата „Сватба 2027 · Първият танц“</span>
              </div>
              <div className="bd">
                <table>
                  <tbody>
                    <tr><td>Име</td><td>Мария Петрова</td></tr>
                    <tr><td>Телефон</td><td>0888 123 456</td></tr>
                    <tr><td>Имейл</td><td>maria.p@gmail.com</td></tr>
                    <tr><td>Кога е сватбата</td><td>юни 2027</td></tr>
                    <tr><td>Къде</td><td>Пловдив</td></tr>
                    <tr><td>Какво ѝ трябва</td><td>фото + видео</td></tr>
                    <tr><td>Гости</td><td>100–150</td></tr>
                    <tr><td>Бюджет</td><td>1 500–2 500 €</td></tr>
                    <tr><td>Кога да ѝ звъннеш</td><td>вечер</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="note">
              Примерът е измислен, за да видиш формата. Истинските запитвания
              изглеждат точно така.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Формата за запитване</p>
          <h2 className="h2sub">Въпросите, които отсяват сериозните</h2>
          <p className="lead">
            Кратка форма носи много и слаби запитвания; дълга — малко и силни.
            Това е средата: 6–8 въпроса, повечето с избор от списък, телефонът
            задължителен.
          </p>
        </div>
        <div className="cards">
          <article className="form">
            <h4>Сватби 2027</h4>
            <ol>
              {FORMA_SVATBA.map(([q, a]) => (
                <li key={q}>
                  {q} <span>— {a}</span>
                </li>
              ))}
            </ol>
          </article>
          <article className="form">
            <h4>Коледни сесии</h4>
            <ol>
              {FORMA_KOLEDA.map(([q, a]) => (
                <li key={q}>
                  {q} <span>— {a}</span>
                </li>
              ))}
            </ol>
            <p className="note">
              И за двете: съгласие и линк към политика за поверителност (Meta го
              изисква) — добавяме я на yordankolev.com. Благодарствен екран с
              бутон към портфолиото.
            </p>
          </article>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Името на страницата</p>
          <h2 className="h2sub">Име, което вдъхва доверие</h2>
          <p className="lead">
            Четири варианта. Избери един — ние сменяме името, описанието и
            корицата. Meta проверява смяната 1–3 дни.
          </p>
        </div>
        <div className="names">
          {IMENA.map((n) => (
            <article className={`name${n.rec ? " rec" : ""}`} key={n.n}>
              <b>{n.n}</b>
              <p>{n.p}</p>
              <p className="why">{n.why}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Какво ни трябва от теб</p>
          <h2 className="h2sub">Седем неща — повечето са по един клик</h2>
        </div>
        <ul className="todo">
          {TRYABVA.map((t) => (
            <li key={t.b}>
              <i />
              <div>
                <b>{t.b}</b>
                <span>{t.s}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Планът по дни</p>
          <h2 className="h2sub">От „да“ до първото запитване — четири дни</h2>
        </div>
        <div className="days">
          {DNI.map((d) => (
            <div className={`step${d.go ? " go" : ""}`} key={d.b}>
              <b>{d.b}</b>
              <p>{d.p}</p>
            </div>
          ))}
        </div>
        <p className="note">
          Първата кампания е платена (400 €). Рекламният бюджет към Meta е от
          твоята карта — препоръката ни е 10–15 € на ден общо за двете кампании
          през първия месец.
        </p>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Виж двете видеа и четирите имена. Отговори ми на имейла или във Viber
          с „да“ или с поправките — и добави рекламния акаунт в портфолиото.
          Останалото правим ние, и до четири дни рекламата е на живо.
        </p>
        <p className="ctas">
          <a className="btn" href="viber://chat?number=%2B359877399963">
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
