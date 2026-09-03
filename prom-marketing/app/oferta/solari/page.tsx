/**
 * Презентация за Жоро Димитров (Жоро Солари) след разговора на 03.09.2026.
 *
 * Той поиска три неща: да види видеата и рекламите, които правим; да види как
 * се правят обявите и документите; и всичко, за което говорихме — черно на
 * бяло, с линк и в PDF. Затова страницата е подредена така: двете посоки
 * (програмата и колите) → отговорът на въпроса „човек или система“ → потокът по
 * програмата с примерни екрани → видеата → колите с примерна обява → живите
 * доказателства (клипове, агентът, демота) → условията, както са казани по
 * телефона.
 *
 * Числата в първата секция са НЕГОВИТЕ, от разговора. Екраните са примерни и
 * са надписани така — нищо в тях не претендира за реални данни.
 *
 * Обръщението е на „ти“ — Ивайло му пише така и в имейлите.
 */

const PDF = "/oferta/solari/ProMarketing-za-Zhoro-Solari.pdf";
const VOICE_PHONE = "+1 475 426 9084";

const CSS = `
.sol-doc{
  --ground:#FAF9F5; --panel:#F1EFE7; --surface:#FFFFFF;
  --ink:#1B1A17; --ink-2:#5C5A52; --ink-3:#8C897E;
  --rule:#E2DFD3; --rule-soft:#ECE9DE;
  --accent:#0E6B57; --accent-soft:#E3F1EC;
  --sun:#B4640A; --sun-soft:#FBEFDD;
  --sky:#2456A8; --sky-soft:#E7EEFA;
  --crit:#9B1D1D; --crit-soft:#F9E7E5;
  --shadow:0 1px 2px rgba(27,26,23,.05), 0 8px 24px -16px rgba(27,26,23,.22);
  background:var(--ground); color:var(--ink);
  font-family:var(--sol-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.sol-doc *{box-sizing:border-box}
.sol-doc .wrap{max-width:1180px;margin:0 auto;padding:0 24px 96px}
.sol-doc h1,.sol-doc h2,.sol-doc h3,.sol-doc h4{font-family:var(--sol-ui),Arial,sans-serif}
.sol-doc .mono{font-family:var(--sol-mono),monospace;font-variant-numeric:tabular-nums}
.sol-doc a{color:var(--accent);text-underline-offset:3px}
.sol-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.sol-doc p{margin:0 0 17px;max-width:66ch}
.sol-doc .lead{font-size:18.5px}

.sol-doc .masthead{padding:72px 0 40px;border-bottom:2px solid var(--ink)}
.sol-doc .eyebrow{font-family:var(--sol-mono),monospace;font-size:12px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--ink-2);margin:0 0 22px}
.sol-doc h1{font-size:clamp(36px,6vw,64px);line-height:1.04;font-weight:700;
  letter-spacing:-.025em;margin:0 0 20px;text-wrap:balance;max-width:20ch}
.sol-doc .deck{font-size:clamp(18px,2.1vw,21px);line-height:1.55;color:var(--ink-2);
  max-width:62ch;margin:0 0 34px}
.sol-doc .byline{display:flex;flex-wrap:wrap;gap:8px 30px;align-items:center;
  font-family:var(--sol-ui),sans-serif;font-size:13.5px;color:var(--ink-2)}
.sol-doc .byline b{color:var(--ink);font-weight:600}
.sol-doc .byline .pdf{font-weight:600;color:var(--accent);text-decoration:none;
  border:1px solid var(--accent);padding:5px 12px;border-radius:4px;transition:background .15s ease}
.sol-doc .byline .pdf:hover{background:var(--accent-soft)}

.sol-doc .cols{display:grid;grid-template-columns:minmax(0,1fr) 352px;gap:60px;
  align-items:start;padding-top:52px}
@media (max-width:1000px){.sol-doc .cols{grid-template-columns:1fr;gap:44px}}

.sol-doc section{margin:0 0 62px}
.sol-doc h2{font-size:13px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;
  color:var(--ink-2);margin:0 0 6px;font-family:var(--sol-mono),monospace}
.sol-doc .h2sub{font-family:var(--sol-ui),sans-serif;font-size:clamp(25px,3.3vw,32px);
  font-weight:600;letter-spacing:-.02em;line-height:1.2;margin:0 0 24px;color:var(--ink);
  text-wrap:balance;max-width:24ch}

/* трите посоки */
.sol-doc .dirs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:0 0 26px}
@media (max-width:760px){.sol-doc .dirs{grid-template-columns:1fr}}
.sol-doc .dir{background:var(--surface);border:1px solid var(--rule);border-radius:10px;
  padding:20px 20px 18px;box-shadow:var(--shadow);break-inside:avoid}
.sol-doc .dir .k{font-family:var(--sol-mono),monospace;font-size:11px;letter-spacing:.12em;
  text-transform:uppercase;margin:0 0 10px;padding:3px 8px;border-radius:3px;display:inline-block}
.sol-doc .dir .k.sun{color:var(--sun);background:var(--sun-soft)}
.sol-doc .dir .k.sky{color:var(--sky);background:var(--sky-soft)}
.sol-doc .dir .k.acc{color:var(--accent);background:var(--accent-soft)}
.sol-doc .dir h3{font-size:19px;line-height:1.3;margin:0 0 8px;letter-spacing:-.012em}
.sol-doc .dir p{font-size:15.5px;line-height:1.55;color:var(--ink-2);margin:0}

/* числата от разговора */
.sol-doc .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 10px}
@media (max-width:760px){.sol-doc .stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
.sol-doc .stat{background:var(--panel);border-radius:10px;padding:16px 16px 14px}
.sol-doc .stat .n{font-family:var(--sol-ui),sans-serif;font-size:30px;font-weight:700;
  letter-spacing:-.03em;line-height:1;color:var(--ink);margin:0 0 6px;font-variant-numeric:tabular-nums}
.sol-doc .stat .l{font-family:var(--sol-ui),sans-serif;font-size:13px;line-height:1.35;color:var(--ink-2);margin:0}
.sol-doc figcaption,.sol-doc .cap{font-family:var(--sol-ui),sans-serif;font-size:13px;
  color:var(--ink-3);margin:8px 0 0;line-height:1.5}
.sol-doc figure{margin:0 0 26px}

/* стъпки */
.sol-doc .steps{margin:0;padding:0;list-style:none;counter-reset:st}
.sol-doc .step{display:grid;grid-template-columns:44px minmax(0,1fr);gap:0 16px;
  padding:18px 0;border-top:1px solid var(--rule-soft);break-inside:avoid}
.sol-doc .step:first-child{border-top:1px solid var(--rule)}
.sol-doc .step .n{font-family:var(--sol-mono),monospace;font-size:13px;color:var(--accent);
  padding-top:5px;font-weight:500}
.sol-doc .step h3{font-size:19px;font-weight:600;line-height:1.32;margin:0 0 7px;letter-spacing:-.012em}
.sol-doc .step p{margin:0;font-size:16px;line-height:1.58;color:var(--ink-2);max-width:62ch}
.sol-doc .step p + p{margin-top:9px}

/* примерни екрани */
.sol-doc .screen{background:var(--surface);border:1px solid var(--rule);border-radius:12px;
  box-shadow:var(--shadow);overflow:hidden;font-family:var(--sol-ui),sans-serif;
  margin:22px 0 0;break-inside:avoid}
.sol-doc .screen .bar{display:flex;align-items:center;gap:10px;padding:10px 14px;
  border-bottom:1px solid var(--rule-soft);background:#FCFBF8}
.sol-doc .screen .dots{display:flex;gap:5px}
.sol-doc .screen .dots i{width:9px;height:9px;border-radius:50%;background:var(--rule);display:block}
.sol-doc .screen .ttl{font-size:12.5px;color:var(--ink-2);font-weight:500}
.sol-doc .screen .ttl b{color:var(--ink);font-weight:600}
.sol-doc .screen .body{padding:14px 16px 16px}
.sol-doc .kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 14px}
@media (max-width:640px){.sol-doc .kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
.sol-doc .kpi{background:var(--panel);border-radius:8px;padding:10px 12px}
.sol-doc .kpi .v{font-size:20px;font-weight:700;letter-spacing:-.02em;line-height:1.1;font-variant-numeric:tabular-nums}
.sol-doc .kpi .t{font-size:11.5px;color:var(--ink-2);margin-top:3px}
.sol-doc .rows{display:grid;gap:0}
.sol-doc .row{display:grid;grid-template-columns:minmax(0,1.5fr) 128px minmax(0,1fr);gap:10px;
  align-items:center;padding:9px 0;border-top:1px solid var(--rule-soft);font-size:13.5px}
.sol-doc .row.head{border-top:0;color:var(--ink-3);font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding-bottom:4px}
.sol-doc .row .who b{display:block;font-weight:600;color:var(--ink)}
.sol-doc .row .who span{color:var(--ink-3);font-size:12.5px}
.sol-doc .row .next{color:var(--ink-2);font-size:13px}
@media (max-width:560px){.sol-doc .row{grid-template-columns:minmax(0,1fr) 110px}.sol-doc .row .next,.sol-doc .row.head .next{display:none}}
.sol-doc .chip{display:inline-block;font-family:var(--sol-mono),monospace;font-size:10.5px;
  letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:3px;border:1px solid;font-weight:500;white-space:nowrap}
.sol-doc .chip.ok{color:var(--accent);background:var(--accent-soft);border-color:var(--accent)}
.sol-doc .chip.sky{color:var(--sky);background:var(--sky-soft);border-color:var(--sky)}
.sol-doc .chip.warn{color:var(--sun);background:var(--sun-soft);border-color:var(--sun)}
.sol-doc .chip.no{color:var(--crit);background:var(--crit-soft);border-color:var(--crit)}

/* документ по образец */
.sol-doc .docwrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;margin:22px 0 0}
@media (max-width:760px){.sol-doc .docwrap{grid-template-columns:1fr}}
.sol-doc .paper{background:#fff;border:1px solid var(--rule);border-radius:6px;padding:22px 22px 18px;
  font-family:var(--sol-ui),sans-serif;box-shadow:var(--shadow);position:relative;break-inside:avoid}
.sol-doc .paper .ph{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);margin:0 0 4px}
.sol-doc .paper h4{font-size:15px;margin:0 0 14px;line-height:1.3;font-weight:600}
.sol-doc .paper .f{display:grid;grid-template-columns:118px minmax(0,1fr);gap:8px;font-size:12.5px;
  padding:6px 0;border-top:1px dashed var(--rule)}
.sol-doc .paper .f span:first-child{color:var(--ink-3)}
.sol-doc .paper .f .fill{background:var(--sun-soft);color:var(--ink);padding:0 4px;border-radius:2px}
.sol-doc .paper .stamp{position:absolute;right:16px;top:16px;font-family:var(--sol-mono),monospace;
  font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);
  border:1px solid var(--accent);padding:3px 7px;border-radius:3px;transform:rotate(-4deg);background:#fff}
.sol-doc .check{list-style:none;margin:10px 0 0;padding:0;font-size:13px}
.sol-doc .check li{display:flex;gap:8px;padding:5px 0;border-top:1px dashed var(--rule)}
.sol-doc .check li i{font-style:normal;width:18px;text-align:center;font-family:var(--sol-mono),monospace}
.sol-doc .check li.yes i{color:var(--accent)}
.sol-doc .check li.no i{color:var(--sun)}

/* обява */
.sol-doc .listing{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:16px}
@media (max-width:640px){.sol-doc .listing{grid-template-columns:1fr}}
.sol-doc .photos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.sol-doc .photo{aspect-ratio:4/3;border-radius:6px;position:relative;overflow:hidden;
  background:linear-gradient(135deg,#C9D3DA,#8D9AA6)}
.sol-doc .photo.a{background:linear-gradient(135deg,#D8DEE4,#7E8B98)}
.sol-doc .photo.b{background:linear-gradient(160deg,#C2CBD3,#5F6C79)}
.sol-doc .photo.c{background:linear-gradient(120deg,#DDE2E7,#9AA6B2)}
.sol-doc .photo.d{background:linear-gradient(140deg,#B8C3CD,#6B7987)}
.sol-doc .photo em{position:absolute;left:8px;bottom:6px;font-style:normal;font-size:10.5px;
  color:#fff;background:rgba(0,0,0,.45);padding:2px 6px;border-radius:3px}
.sol-doc .photos .note{grid-column:1/-1;font-size:12px;color:var(--ink-3)}
.sol-doc .adtext h4{font-size:16px;margin:0 0 4px;font-weight:600;line-height:1.3}
.sol-doc .adtext .price{font-size:20px;font-weight:700;letter-spacing:-.02em;margin:0 0 10px}
.sol-doc .adtext p{font-size:13px;line-height:1.55;color:var(--ink-2);margin:0 0 10px;max-width:none}
.sol-doc .specs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px;padding:0;list-style:none}
.sol-doc .specs li{font-size:12px;background:var(--panel);padding:3px 8px;border-radius:4px}
.sol-doc .targets{display:flex;flex-wrap:wrap;gap:6px;padding:0;margin:0;list-style:none}
.sol-doc .targets li{font-family:var(--sol-mono),monospace;font-size:11px;padding:4px 8px;border-radius:3px;
  color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent)}
.sol-doc .targets li.wait{color:var(--ink-3);background:var(--panel);border-color:var(--rule)}

/* верига за колите */
.sol-doc .pipe{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:16px 0 0}
@media (max-width:640px){.sol-doc .pipe{grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}}
.sol-doc .pipe div{background:var(--panel);border-radius:6px;padding:10px 8px;text-align:center}
.sol-doc .pipe .v{font-size:18px;font-weight:700;letter-spacing:-.02em;line-height:1.1;font-variant-numeric:tabular-nums}
.sol-doc .pipe .t{font-size:11px;color:var(--ink-2);margin-top:3px}
@media (max-width:640px){.sol-doc .pipe .t{font-size:10px}}

/* видеа */
.sol-doc .videos{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:0 0 18px}
@media (max-width:900px){.sol-doc .videos{grid-template-columns:repeat(2,minmax(0,1fr))}}
.sol-doc .video{break-inside:avoid}
.sol-doc .video .frame{aspect-ratio:9/16;border-radius:10px;overflow:hidden;background:#111;
  border:1px solid var(--rule);position:relative}
.sol-doc .video iframe{width:100%;height:100%;border:0;display:block}
.sol-doc .video .poster{display:none;width:100%;height:100%;object-fit:cover}
.sol-doc .video .vc{font-family:var(--sol-ui),sans-serif;font-size:13px;line-height:1.45;color:var(--ink-2);margin:8px 0 0}
.sol-doc .video .vl{display:none;font-family:var(--sol-mono),monospace;font-size:11px;color:var(--ink-3);margin:4px 0 0;word-break:break-all}
.sol-doc .links{display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:0 0 6px;list-style:none}
.sol-doc .links a{font-family:var(--sol-ui),sans-serif;font-size:13.5px;font-weight:500;text-decoration:none;
  color:var(--ink);background:var(--surface);border:1px solid var(--rule);padding:7px 12px;border-radius:999px}
.sol-doc .links a:hover{border-color:var(--accent);color:var(--accent)}

/* агентът */
.sol-doc .phone{background:var(--ink);color:#fff;border-radius:12px;padding:24px 26px;margin:24px 0 0;
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;break-inside:avoid}
@media (max-width:640px){.sol-doc .phone{grid-template-columns:1fr}}
.sol-doc .phone p{color:rgba(255,255,255,.82);font-size:15.5px;margin:0;max-width:52ch}
.sol-doc .phone p b{color:#fff}
.sol-doc .phone .num{font-family:var(--sol-ui),sans-serif;font-size:clamp(22px,3vw,30px);font-weight:700;
  letter-spacing:-.01em;white-space:nowrap;font-variant-numeric:tabular-nums}
.sol-doc .phone .num small{display:block;font-size:12px;font-weight:500;color:rgba(255,255,255,.65);
  letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;font-family:var(--sol-mono),monospace}
.sol-doc .phone a{color:#fff}
.sol-doc .demos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0 0}
@media (max-width:640px){.sol-doc .demos{grid-template-columns:1fr}}
.sol-doc .demo{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:16px 18px;
  font-family:var(--sol-ui),sans-serif;break-inside:avoid}
.sol-doc .demo b{display:block;font-size:15px;margin:0 0 4px}
.sol-doc .demo p{font-size:14px;color:var(--ink-2);margin:0 0 8px;line-height:1.5}
.sol-doc .demo a{font-size:13.5px;font-weight:500}

/* условията */
.sol-doc .price-t{width:100%;border-collapse:collapse;font-family:var(--sol-ui),sans-serif;margin:0 0 12px}
.sol-doc .price-t th,.sol-doc .price-t td{text-align:left;vertical-align:top;padding:13px 10px 13px 0;border-top:1px solid var(--rule-soft);font-size:15px}
.sol-doc .price-t th{font-weight:600;width:34%;color:var(--ink)}
.sol-doc .price-t td.sum{font-family:var(--sol-mono),monospace;font-size:16px;white-space:nowrap;width:18%;color:var(--ink);font-weight:500}
.sol-doc .price-t td.what{color:var(--ink-2);font-size:14.5px;line-height:1.5}
.sol-doc .price-t tr.total th,.sol-doc .price-t tr.total td{border-top:2px solid var(--ink);font-weight:600;color:var(--ink)}
.sol-doc .price-t tr.total td.sum{font-size:19px;font-weight:700}
@media (max-width:640px){.sol-doc .price-t th{width:40%}.sol-doc .price-t td.sum{width:auto}}
.sol-doc .fine{font-family:var(--sol-ui),sans-serif;font-size:13px;color:var(--ink-3);margin:0}

.sol-doc .pull{border-left:3px solid var(--sun);padding:6px 0 6px 22px;margin:0 0 40px}
.sol-doc .pull p{font-size:18px;line-height:1.5;margin:0 0 10px}
.sol-doc .pull p:last-child{margin:0}
.sol-doc .closing{padding-top:26px;border-top:2px solid var(--ink)}
.sol-doc .closing p{font-size:17px}
.sol-doc .sig{font-family:var(--sol-ui),sans-serif;font-size:14.5px;line-height:1.6;color:var(--ink-2);margin-top:22px}
.sol-doc .sig b{color:var(--ink);font-weight:600}

/* лентата отдясно */
.sol-doc .rail{position:sticky;top:24px}
@media (max-width:1000px){.sol-doc .rail{position:static}}
.sol-doc .rail-inner{background:var(--surface);border:1px solid var(--rule);border-radius:12px;
  padding:24px 22px 20px;box-shadow:var(--shadow);font-family:var(--sol-ui),sans-serif}
.sol-doc .rail-head .k{font-family:var(--sol-mono),monospace;font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--accent);margin:0 0 6px}
.sol-doc .rail-head h2{font-family:var(--sol-ui),sans-serif;font-size:22px;letter-spacing:-.02em;
  text-transform:none;color:var(--ink);margin:0 0 8px;line-height:1.2}
.sol-doc .rail-head p{font-size:14px;color:var(--ink-2);margin:0 0 18px;line-height:1.5}
.sol-doc .plan{list-style:none;margin:0;padding:0}
.sol-doc .plan li{padding:14px 0;border-top:1px solid var(--rule-soft);break-inside:avoid}
.sol-doc .plan .wk{display:flex;align-items:baseline;gap:10px;margin:0 0 5px}
.sol-doc .plan .num{font-family:var(--sol-mono),monospace;font-size:12px;color:var(--accent);font-weight:500}
.sol-doc .plan .wkl{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}
.sol-doc .plan h3{font-size:15.5px;margin:0 0 6px;font-weight:600}
.sol-doc .plan ul{margin:0 0 8px;padding:0 0 0 16px;font-size:13.5px;color:var(--ink-2);line-height:1.5}
.sol-doc .plan ul li{padding:1px 0;border:0}
.sol-doc .plan .out{display:flex;gap:8px;font-size:13px;color:var(--ink);margin:0;font-weight:500}
.sol-doc .plan .out span:first-child{color:var(--accent)}
.sol-doc .rail-foot{margin-top:6px;padding-top:16px;border-top:2px solid var(--ink)}
.sol-doc .rail-foot h3{font-size:14.5px;margin:0 0 8px;font-weight:600}
.sol-doc .rail-foot ul{margin:0 0 14px;padding:0 0 0 16px;font-size:13.5px;color:var(--ink-2);line-height:1.55}
.sol-doc .rail-foot .next{background:var(--accent-soft);border-radius:8px;padding:12px 14px;font-size:14px;line-height:1.5;color:var(--ink);margin:0}
.sol-doc .rail-foot .next b{color:var(--accent)}

/* печат — PDF-ът излиза от същата страница */
@media print{
  html,body{background:#fff}
  .sol-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .sol-doc .wrap{max-width:none;padding:0}
  .sol-doc .masthead{padding:0 0 18px}
  .sol-doc h1{font-size:34px}
  .sol-doc .deck{font-size:15px}
  .sol-doc .byline .pdf{display:none}
  .sol-doc .cols{grid-template-columns:1fr;gap:20px;padding-top:22px}
  .sol-doc section{margin:0 0 26px}
  .sol-doc .h2sub{font-size:21px;margin:0 0 12px}
  .sol-doc .lead{font-size:13.5px}
  .sol-doc .step h3,.sol-doc .dir h3{font-size:14.5px}
  .sol-doc .step p,.sol-doc .dir p{font-size:12.5px}
  .sol-doc .stat .n{font-size:22px}
  .sol-doc .video .frame{aspect-ratio:auto;background:#fff;border:0;border-radius:0}
  .sol-doc .video iframe{display:none}
  .sol-doc .video .poster{display:block;height:auto;aspect-ratio:4/3;border-radius:8px;border:1px solid var(--rule)}
  .sol-doc .video .vl{display:block}
  .sol-doc .videos{grid-template-columns:repeat(4,minmax(0,1fr))}
  .sol-doc .phone{background:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .sol-doc .screen,.sol-doc .paper,.sol-doc .dir,.sol-doc .rail-inner,.sol-doc .demo{box-shadow:none}
  .sol-doc .rail{position:static;margin-top:8px}
  .sol-doc .rail-inner{padding:14px 16px 12px}
  .sol-doc .rail-head p{margin:0 0 10px}
  .sol-doc .plan li{padding:8px 0}
  .sol-doc .plan h3{font-size:14px;margin:0 0 3px}
  .sol-doc .plan ul{margin:0 0 5px;font-size:12.5px;line-height:1.4}
  .sol-doc .rail-foot{padding-top:10px}
  .sol-doc .rail-foot ul{margin:0 0 8px;font-size:12.5px;line-height:1.4}
  .sol-doc .rail-foot .next{padding:9px 12px;font-size:12.5px}
  .sol-doc .pull p{font-size:14px}
  .sol-doc .closing p{font-size:13px}
  .sol-doc .price-t th,.sol-doc .price-t td{font-size:12.5px;padding:8px 8px 8px 0}
  .sol-doc .price-t td.what{font-size:12px}
  .sol-doc .stat,.sol-doc .kpi,.sol-doc .pipe div,.sol-doc .chip,.sol-doc .dir .k,.sol-doc .paper .f .fill,
  .sol-doc .targets li,.sol-doc .specs li,.sol-doc .rail-foot .next{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

/* ───────────────────────── данни ───────────────────────── */

const PROGRAMA = [
  {
    title: "Запитването влиза на едно място",
    body: (
      <>
        <p>
          Формата на сайта, Google формата, Facebook, Viber, телефонът — всичко стига до една
          база. Асистентът задава същите 5–6 въпроса, които ти би задал: каква е сградата, от коя
          година е, чия собственост, коя мярка ги интересува, има ли вече обследване.
        </p>
        <p>По всяко време на денонощието, без някой да чака обаждане.</p>
      </>
    ),
  },
  {
    title: "Условията се проверяват сами",
    body: (
      <>
        <p>
          Още при попълването системата сверява отговорите с условията на програмата и слага
          етикет: <b>отговаря</b> · <b>не отговаря</b> · <b>да се уточни</b>. Тези, които не
          отговарят, получават учтив отговор и обяснение защо — без да са ти взели и минута.
        </p>
        <p>Тук е отговорът на твоя въпрос за деветдесетте процента: системата ги отсява, а ти говориш с останалите десет.</p>
      </>
    ),
  },
  {
    title: "Документите излизат готови",
    body: (
      <>
        <p>
          От данните в запитването се попълват заявлението, декларациите и списъкът с
          приложения — по твоите образци, същите 5–6 документа, които подавате днес. Човекът
          получава точен списък какво да донесе: скица, документ за собственост, лична карта,
          фактура за ток.
        </p>
        <p>Ти проверяваш и подписваш. Не преписваш.</p>
      </>
    ),
  },
  {
    title: "Подаването в ИСУН",
    body: (
      <>
        <p>
          Асистентът попълва профила и полетата в системата и подрежда прикачените файлове в
          реда, в който ИСУН ги иска. Подписът с електронния подпис остава последният клик на
          човек.
        </p>
        <p>
          За хората без подпис — бабите по селата, както ти каза — го правите вие, както и
          досега. Само че за две минути, не за час.
        </p>
      </>
    ),
  },
  {
    title: "Всеки кандидат има картон",
    body: (
      <>
        <p>
          Статус, липсващи документи, следваща стъпка, срок. Напомнянията вървят сами по SMS,
          Viber или имейл. Ти виждаш всичко на едно табло — и в Telegram, ако предпочиташ да не
          отваряш нищо.
        </p>
        <p>Компетентният контакт, който хората искат, остава при вас. Просто вече не се харчи за сортиране, а за консултация.</p>
      </>
    ),
  },
];

const KOLI = [
  {
    title: "Обявата — от снимките до публикуването",
    body: (
      <>
        <p>
          Качваш снимките от телефона. Системата ги подрежда, изчиства фона, слага логото, пише
          текста на обявата на български с всички характеристики и я публикува в сайтовете за
          автомобили и във Facebook.
        </p>
        <p>Когато обявата остарее, я подновява сама. Когато колата се продаде, я сваля отвсякъде.</p>
      </>
    ),
  },
  {
    title: "Клиентът има картон от първото запитване",
    body: (
      <>
        <p>
          Обаждане, съобщение или запитване от сайт — всяко влиза в CRM-а с колата, датата и
          какво е питал човекът. Системата подсеща кога да му се обадиш, а може и сама да
          звънне, за да потвърди интерес или час.
        </p>
        <p>
          Документите за лизинга и регистрацията се попълват от данните му. Той получава
          съобщение на всяка стъпка: избрана · поръчана · на път · доставена.
        </p>
      </>
    ),
  },
  {
    title: "Рекламите работят и се сменят сами",
    body: (
      <>
        <p>
          Всяка обява може да стане реклама с две натискания. Бюджетът отива към колите, които
          събират запитвания; слабите спират. Всяка седмица получаваш кратък отчет: какво е
          похарчено, колко запитвания, кои коли се търсят.
        </p>
      </>
    ),
  },
];

const VIDEOS = [
  {
    id: "Ya0pwroIQ38",
    cap: "Рекламата, от която дойде: „Как се движи бизнесът?“ — един въпрос, целият отчет.",
  },
  {
    id: "GvmjSWFuPJQ",
    cap: "„Направи оферта и договор за този клиент и му ги прати.“ — документите, за които говорихме.",
  },
  {
    id: "cFvugyQt4pM",
    cap: "Нов лийд влиза в CRM-а. Минута по-късно има презентация в пощата си.",
  },
  {
    id: "J2JPHRuqxrI",
    cap: "„Банери и постове за месец напред. По 3 на ден.“ — така се правят и обяснителните видеа.",
  },
];

const PLAN = [
  {
    n: "01",
    week: "седмица 1",
    title: "Основата",
    items: [
      "Достъпи: сайт, Facebook, сайтовете за обяви, пощата",
      "Картата на процесите — какво откъде идва и къде спира",
      "Първо обучение: как се възлага работа на системата",
    ],
    out: "Имаш работещ асистент и знаеш как да му говориш.",
  },
  {
    n: "02",
    week: "седмица 2",
    title: "Колите",
    items: [
      "CRM-ът с картоните на клиентите и напомнянията",
      "Обявата от снимки — с първата истинска кола",
      "Съобщенията към клиента на всяка стъпка",
    ],
    out: "Първата обява е публикувана от системата.",
  },
  {
    n: "03",
    week: "седмица 3",
    title: "Програмата",
    items: [
      "Формата и въпросите за квалификация",
      "Документите по твоите 5–6 образеца",
      "Таблото с кандидатите",
    ],
    out: "Едно запитване минава от формата до готов комплект.",
  },
  {
    n: "04",
    week: "седмица 4",
    title: "Видеата и ИСУН",
    items: [
      "Първите три обяснителни видеа за Facebook",
      "Стъпката за ИСУН — готова да се включи в деня, в който излязат условията",
      "Второ обучение: ти променяш настройките сам",
    ],
    out: "Всичко е в твоите ръце.",
  },
];

/* ───────────────────────── страницата ───────────────────────── */

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="step">
      <span className="n">{String(n).padStart(2, "0")}</span>
      <div>
        <h3>{title}</h3>
        {children}
      </div>
    </li>
  );
}

function Screen({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="screen" aria-label={`${title} — примерен екран`}>
      <div className="bar">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="ttl">
          <b>{title}</b> · {sub}
        </span>
      </div>
      <div className="body">{children}</div>
    </div>
  );
}

export default function SolariPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap" lang="bg">
        <header className="masthead">
          <p className="eyebrow">Черно на бяло · 3 септември 2026</p>
          <h1>Програмата, документите и колите — как ги поема системата</h1>
          <p className="deck">
            Говорихме за две неща, които ти ядат време по различен начин: наплива по програмата за
            енергийна ефективност и ежедневието с автомобилите. Тук е всичко, което обсъдихме —
            стъпка по стъпка, с примери как изглежда, с видеата, които поиска, и с условията,
            както ти ги казах по телефона.
          </p>
          <div className="byline">
            <span>
              За <b>Жоро Димитров</b> · Жоро Солари
            </span>
            <span>
              От <b>Ивайло Петев</b> · Pro Marketing
            </span>
            <a className="pdf" href={PDF} download>
              Свали като PDF
            </a>
          </div>
        </header>

        <div className="cols">
          <main>
            <section>
              <h2>За какво говорихме</h2>
              <p className="h2sub">Едното е вълна, другото е всеки ден</p>

              <div className="dirs">
                <div className="dir">
                  <p className="k sun">Програмата</p>
                  <h3>Енергийната ефективност с финансиране</h3>
                  <p>
                    Саниране, соларни системи, климатици — с очаквано финансиране около половината.
                    Когато я обявиха през януари–февруари, при вас влязоха над 2 000 запитвания.
                    Тесното място не е монтажът, а сортирането на хората, документите и подаването
                    в ИСУН.
                  </p>
                </div>
                <div className="dir">
                  <p className="k sky">Автомобилите</p>
                  <h3>От избора до доставката</h3>
                  <p>
                    Обяви, снимки, запитвания, лизинг, регистрация. Всяка кола е една и съща верига
                    от стъпки — а всеки клиент чака да му се обадят навреме и да знае докъде е
                    стигнала неговата.
                  </p>
                </div>
                <div className="dir">
                  <p className="k acc">Видеата</p>
                  <h3>Едно видео вместо сто обаждания</h3>
                  <p>
                    Вместо да обясняваш на всеки по телефона кои документи трябват, едно кратко видео
                    го казва на всички наведнъж — и ги праща към формата, откъдето системата ги поема.
                  </p>
                </div>
              </div>

              <figure>
                <div className="stats">
                  <div className="stat">
                    <p className="n">2 000+</p>
                    <p className="l">запитвания за няколко седмици при обявяването</p>
                  </div>
                  <div className="stat">
                    <p className="n">4</p>
                    <p className="l">обекта, по които можете да работите наведнъж</p>
                  </div>
                  <div className="stat">
                    <p className="n">5–6</p>
                    <p className="l">документа на кандидат към ИСУН</p>
                  </div>
                  <div className="stat">
                    <p className="n">≈50%</p>
                    <p className="l">очаквано финансиране по програмата</p>
                  </div>
                </div>
                <figcaption>Числата са твоите — от разговора ни на 3 септември.</figcaption>
              </figure>
            </section>

            <section>
              <h2>Въпросът, който ти сам зададе</h2>
              <p className="h2sub">„Ако 90% не отговарят на условията, по-добре да взема една жена“</p>
              <p className="lead">
                Точно затова е системата. Ако от 2 000 души само 200 отговарят, някой трябва да
                мине през всичките 2 000, за да намери тези 200.
              </p>
              <p>
                Един човек прави това седмици наред — по телефона, с едни и същи въпроси, докато
                в същото време трябва да води и четирите обекта. Системата го прави за минути, защото
                хората сами попълват отговорите, а на човека остават само онези, с които има смисъл да
                говори.
              </p>
              <p>
                Човекът не отпада. Той става по-ценен: компетентният контакт, който клиентите искат,
                остава при вас, но вече не се харчи за сортиране.
              </p>
              <p>
                И ако програмата се забави или условията се окажат тесни — частта за автомобилите
                работи от първия ден и няма нищо общо с програмата. А частта за програмата се строи
                така, че да се включи в деня, в който излязат условията, не месец след това.
              </p>
            </section>

            <section>
              <h2>Програмата</h2>
              <p className="h2sub">От запитването до ИСУН, без да звъниш на всеки</p>
              <ol className="steps">
                {PROGRAMA.map((s, i) => (
                  <Step key={s.title} n={i + 1} title={s.title}>
                    {s.body}
                  </Step>
                ))}
              </ol>

              <Screen title="Програма ЕЕ" sub="кандидати · примерни данни">
                <div className="kpis">
                  <div className="kpi">
                    <div className="v">2 140</div>
                    <div className="t">запитвания общо</div>
                  </div>
                  <div className="kpi">
                    <div className="v">412</div>
                    <div className="t">отговарят на условията</div>
                  </div>
                  <div className="kpi">
                    <div className="v">96</div>
                    <div className="t">подадени в ИСУН</div>
                  </div>
                  <div className="kpi">
                    <div className="v">4</div>
                    <div className="t">обекта в изпълнение</div>
                  </div>
                </div>
                <div className="rows">
                  <div className="row head">
                    <span>кандидат</span>
                    <span>статус</span>
                    <span className="next">следваща стъпка</span>
                  </div>
                  <div className="row">
                    <div className="who">
                      <b>Мария П.</b>
                      <span>еднофамилна къща · соларна система + батерия</span>
                    </div>
                    <span className="chip ok">отговаря</span>
                    <span className="next">чака скица и документ за собственост · напомнено по Viber</span>
                  </div>
                  <div className="row">
                    <div className="who">
                      <b>Иван Г.</b>
                      <span>къща от 1988 г. · топлоизолация + дограма</span>
                    </div>
                    <span className="chip sky">подадено в ИСУН</span>
                    <span className="next">проверка от ведомството · срок 12.09</span>
                  </div>
                  <div className="row">
                    <div className="who">
                      <b>Стоян И.</b>
                      <span>къща · климатик + соларна система</span>
                    </div>
                    <span className="chip warn">да се уточни</span>
                    <span className="next">двама собственици — трябва съгласие на втория</span>
                  </div>
                  <div className="row">
                    <div className="who">
                      <b>Елена Д.</b>
                      <span>апартамент · саниране</span>
                    </div>
                    <span className="chip no">не отговаря</span>
                    <span className="next">отговорено автоматично с обяснение · без обаждане</span>
                  </div>
                </div>
              </Screen>
              <p className="cap">
                Така изглежда таблото, когато системата е сортирала запитванията. Ти отваряш само
                редовете, които те чакат.
              </p>

              <div className="docwrap">
                <div className="paper">
                  <span className="stamp">попълнено от системата</span>
                  <p className="ph">образец · заявление за участие</p>
                  <h4>Заявление за финансиране на мерки за енергийна ефективност</h4>
                  <div className="f">
                    <span>Кандидат</span>
                    <span>
                      <span className="fill">Мария П.</span>
                    </span>
                  </div>
                  <div className="f">
                    <span>Обект</span>
                    <span>
                      <span className="fill">еднофамилна къща, 142 м², 1996 г.</span>
                    </span>
                  </div>
                  <div className="f">
                    <span>Мярка</span>
                    <span>
                      <span className="fill">фотоволтаична система 5 kW + батерия</span>
                    </span>
                  </div>
                  <div className="f">
                    <span>Собственост</span>
                    <span>
                      <span className="fill">нотариален акт № …/2004</span>
                    </span>
                  </div>
                  <div className="f">
                    <span>Обследване</span>
                    <span>
                      <span className="fill">няма — насрочено</span>
                    </span>
                  </div>
                  <div className="f">
                    <span>Подпис</span>
                    <span>електронен подпис · последният клик е на човек</span>
                  </div>
                </div>
                <div className="paper">
                  <p className="ph">списъкът, който получава кандидатът</p>
                  <h4>Какво да донесете — Мария П.</h4>
                  <ul className="check">
                    <li className="yes">
                      <i>✓</i>
                      <span>Лична карта — получена</span>
                    </li>
                    <li className="yes">
                      <i>✓</i>
                      <span>Фактура за ток за последните 12 месеца — получена</span>
                    </li>
                    <li className="no">
                      <i>○</i>
                      <span>Скица на имота — чака се · напомняне в петък</span>
                    </li>
                    <li className="no">
                      <i>○</i>
                      <span>Документ за собственост — чака се</span>
                    </li>
                    <li className="yes">
                      <i>✓</i>
                      <span>Декларации — попълнени от данните, за подпис</span>
                    </li>
                    <li className="yes">
                      <i>✓</i>
                      <span>Енергийно обследване — насрочено, вторник</span>
                    </li>
                  </ul>
                </div>
              </div>
              <p className="cap">
                Данните влизат веднъж — от запитването — и излизат във всеки документ, в който трябват.
                Образците са вашите.
              </p>
            </section>

            <section>
              <h2>Видеата</h2>
              <p className="h2sub">Едно видео обяснява на всички, вместо ти на всеки</p>
              <p className="lead">
                Кои документи трябват. Отговаряте ли на условията. Как се подава. Колко се изплаща
                една соларна система. Всяко видео завършва с една и съща покана: попълнете формата.
              </p>
              <p>
                Сценарият, гласът на български, субтитрите и публикуването по график ги прави
                системата — ти само одобряваш. Клиповете, които си виждал, в които човек всеки ден
                пуска видео на различен език, се правят точно така: инструмент, закачен към
                асистента. Допълнителните видеа са отделен разход към инструмента, от порядъка на
                50 € за десет клипа.
              </p>
              <p>
                Как изглеждат при мен — виж по-долу, в раздела „На живо“. Същото се прави за твоята
                страница, с твоето лого и твоите теми.
              </p>
            </section>

            <section>
              <h2>Автомобилите</h2>
              <p className="h2sub">Обявата се пише сама, клиентът не се губи</p>
              <ol className="steps">
                {KOLI.map((s, i) => (
                  <Step key={s.title} n={i + 1} title={s.title}>
                    {s.body}
                  </Step>
                ))}
              </ol>

              <Screen title="Нова обява" sub="от снимките до публикуването · примерна обява">
                <div className="listing">
                  <div className="photos">
                    <div className="photo a">
                      <em>отпред · фон изчистен</em>
                    </div>
                    <div className="photo b">
                      <em>отстрани</em>
                    </div>
                    <div className="photo c">
                      <em>салон</em>
                    </div>
                    <div className="photo d">
                      <em>табло · 87 400 км</em>
                    </div>
                    <p className="note">12 снимки от телефона · подредени, изчистени, с лого · 40 секунди</p>
                  </div>
                  <div className="adtext">
                    <h4>VW Passat 2.0 TDI · 2021 · 87 400 км · автоматик</h4>
                    <p className="price">24 900 € · лизинг от 389 €/мес.</p>
                    <ul className="specs">
                      <li>150 к.с.</li>
                      <li>DSG</li>
                      <li>сервизна история</li>
                      <li>от Германия</li>
                      <li>регистрация включена</li>
                    </ul>
                    <p>
                      Един собственик, пълна сервизна история при официален дилър, зимен пакет,
                      адаптивен круиз. Доставка до 14 дни с регистрация и лизинг, уредени от нас.
                      Обадете се или пишете — отговаряме и вечер.
                    </p>
                    <ul className="targets">
                      <li>mobile.bg ✓</li>
                      <li>cars.bg ✓</li>
                      <li>Facebook ✓</li>
                      <li>OLX ✓</li>
                      <li className="wait">подновяване след 7 дни</li>
                    </ul>
                  </div>
                </div>
                <div className="pipe">
                  <div>
                    <div className="v">18</div>
                    <div className="t">избор</div>
                  </div>
                  <div>
                    <div className="v">7</div>
                    <div className="t">оферта</div>
                  </div>
                  <div>
                    <div className="v">4</div>
                    <div className="t">лизинг</div>
                  </div>
                  <div>
                    <div className="v">3</div>
                    <div className="t">регистрация</div>
                  </div>
                  <div>
                    <div className="v">2</div>
                    <div className="t">доставка</div>
                  </div>
                </div>
              </Screen>
              <p className="cap">
                Долният ред е веригата на клиентите — всеки е на някоя стъпка и системата знае кой
                чака какво. Числата са примерни.
              </p>
            </section>

            <section>
              <h2>Останалото</h2>
              <p className="h2sub">Строителството и търговията влизат в същата система</p>
              <p>
                Оферти по образец, договори, проследяване на обекти, фактури, застраховките с дата
                на изтичане — всичко това е същият механизъм с други документи. Не се прави нова
                система, добавя се модул. Затова започваме с онова, което ти боли най-много, и
                надграждаме върху него.
              </p>
            </section>

            <section>
              <h2>На живо</h2>
              <p className="h2sub">Видеата, рекламите и агентът — виж ги, преди да решиш</p>
              <p className="lead">
                Това са клипове от моите мрежи — правени по същия начин, по който ще се правят и
                твоите. Рекламите в Meta са от същата серия.
              </p>

              <div className="videos">
                {VIDEOS.map((v) => (
                  <div className="video" key={v.id}>
                    <div className="frame">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1`}
                        title={v.cap}
                        loading="lazy"
                        allow="accelerometer; encrypted-media; picture-in-picture; web-share"
                        allowFullScreen
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="poster"
                        src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                      />
                    </div>
                    <p className="vc">{v.cap}</p>
                    <p className="vl">youtube.com/watch?v={v.id}</p>
                  </div>
                ))}
              </div>

              <ul className="links">
                <li>
                  <a href="https://www.youtube.com/@promarketingbg" target="_blank" rel="noopener noreferrer">
                    ▶ Всички видеа в YouTube
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/ivailopetev28/" target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="https://www.tiktok.com/@petevv" target="_blank" rel="noopener noreferrer">
                    TikTok
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/profile.php?id=106080979260944"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facebook · Pro Marketing LTD
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BG&view_all_page_id=106080979260944&search_type=page"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Рекламите ни в Meta · библиотеката с реклами
                  </a>
                </li>
              </ul>
              <p className="cap">
                В Instagram и TikTok са същите клипове, качени по график от системата — по един на ден.
              </p>

              <div className="phone">
                <p>
                  <b>Звънни на агента.</b> Това е гласовият асистент, за който ти казах — попитай го
                  каквото искаш, той записва час за разговор. Същият може да отговаря на хората по
                  програмата или да потвърждава срещи за колите. Ако не искаш да звъниш в чужбина,
                  пробвай го от бутона на{" "}
                  <a href="https://promarketing.pw/glas" target="_blank" rel="noopener noreferrer">
                    promarketing.pw/glas
                  </a>{" "}
                  — оттам е безплатно.
                </p>
                <div className="num">
                  <small>телефонът на агента</small>
                  {VOICE_PHONE}
                </div>
              </div>

              <div className="demos">
                <div className="demo">
                  <b>Цялата система на живо</b>
                  <p>Табло, агенти, задачи — така изглежда, когато всичко е на едно място.</p>
                  <a href="https://promarketing.pw/demo" target="_blank" rel="noopener noreferrer">
                    promarketing.pw/demo
                  </a>
                </div>
                <div className="demo">
                  <b>Документооборотът</b>
                  <p>Сканираш веднъж, системата разпознава, подрежда и напомня. Най-близкото до програмата.</p>
                  <a href="https://promarketing.pw/demo/dokumenti" target="_blank" rel="noopener noreferrer">
                    promarketing.pw/demo/dokumenti
                  </a>
                </div>
              </div>
            </section>

            <section>
              <h2>Условията</h2>
              <p className="h2sub">Както ти ги казах по телефона</p>
              <table className="price-t">
                <tbody>
                  <tr>
                    <th>При старт</th>
                    <td className="sum">1 500 €</td>
                    <td className="what">
                      Изграждането на системата и обучението за работа с изкуствен интелект. Правим
                      всичко заедно — потокът по програмата, документите, видеата, обявите и CRM-ът
                      за колите.
                    </td>
                  </tr>
                  <tr>
                    <th>След завършване на обучението и проектите</th>
                    <td className="sum">1 500 €</td>
                    <td className="what">
                      Когато всичко работи и ти можеш сам да го управляваш и да променяш настройките.
                    </td>
                  </tr>
                  <tr className="total">
                    <th>Общо</th>
                    <td className="sum">3 000 €</td>
                    <td className="what">Еднократно. Системата остава при теб.</td>
                  </tr>
                  <tr>
                    <th>Ползването на изкуствения интелект</th>
                    <td className="sum">25 / 100 / 250 € на месец</td>
                    <td className="what">
                      Плаща се директно, според колко работа върши — като абонамента за ChatGPT, но
                      с най-високите модели. Излезе ли ново поколение, ти казвам същия ден и минаваш
                      на него, когато е по-точно и по-евтино.
                    </td>
                  </tr>
                  <tr>
                    <th>Допълнителни инструменти</th>
                    <td className="sum">по нужда</td>
                    <td className="what">
                      Например видеата — около 50 € за десет допълнителни клипа. Добавят се само ако
                      ги искаш.
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="fine">
                Цените са без ДДС. След това всяко ново нещо — банкиране, следене на обекти, нов
                модул — се добавя върху същата основа, без да се строи наново.
              </p>
            </section>

            <div className="pull">
              <p>
                <b>Едно изречение за всичко:</b> системата не е вместо теб и не е вместо човека,
                който ще говори с хората. Тя е за да поемете десет пъти повече запитвания със същия
                екип — и никой да не бъде забравен.
              </p>
            </div>

            <div className="closing">
              <p>
                Ти го каза най-точно: ако програмата тръгне, напливът няма как да се поеме на ръка.
                Затова строим така, че колите да работят от първата седмица, а програмата да е
                готова за деня, в който излязат условията.
              </p>
              <p>
                Чуваме се другата седмица. Дотогава разгледай видеата и звънни на агента — за две
                минути ще разбереш повече, отколкото от всяка презентация.
              </p>
              <p className="sig">
                <b>Ивайло Петев</b>
                <br />
                Pro Marketing LTD · 0877 399 963
                <br />
                promarketing.pw
              </p>
            </div>
          </main>

          <aside className="rail">
            <div className="rail-inner">
              <div className="rail-head">
                <p className="k">Откъде се тръгва</p>
                <h2>Първите четири седмици</h2>
                <p>
                  Колите вървят първи, защото не зависят от никого. Програмата се строи успоредно и
                  чака само условията.
                </p>
              </div>

              <ol className="plan">
                {PLAN.map((s) => (
                  <li key={s.n}>
                    <div className="wk">
                      <span className="num">{s.n}</span>
                      <span className="wkl">{s.week}</span>
                    </div>
                    <h3>{s.title}</h3>
                    <ul>
                      {s.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                    <p className="out">
                      <span>→</span>
                      <span>{s.out}</span>
                    </p>
                  </li>
                ))}
              </ol>

              <div className="rail-foot">
                <h3>Какво трябва от теб</h3>
                <ul>
                  <li>По един примерен екземпляр от 5–6-те документа за програмата</li>
                  <li>Достъп до профилите и сайтовете, в които публикуваш</li>
                  <li>Около два часа седмично през първия месец — за обученията</li>
                </ul>
                <p className="next">
                  <b>Следваща стъпка:</b> чуваме се във вторник. Ако дотогава излезе нещо за
                  програмата — прати ми го, за да го включим още в първата седмица.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
