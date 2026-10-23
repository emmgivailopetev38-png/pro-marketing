/**
 * Анализ + оферта за Краси Кръстев (hotel.corner.place@gmail.com, 0899 846 615) — семеен хотел с 6 стаи
 * в Стамболийски (обл. Пловдив), от 2006 г. Работят той и жена му. Не е в Booking (не е по ДДС).
 * Безплатна консултация 20.10.2026 (Fathom 866907039). Краси поиска офертата по имейл — решава с жена си.
 *
 * Казано в разговора: сеп–окт средно 4 стаи на ден при 36 €; целта е ~7 000 € на месец. Уикенд — туристи
 * (екопаркът, ловната хижа на цар Борис III); делници — работници и фирми. Пускал обяви в безплатни сайтове
 * без ефект. Прави нов сайт с приятел. Притеснения: парите, двамата да смогнат, сайтът не е готов.
 *
 * Цената е на Ивайло: 450 € за месеца + 10–15 € на ден рекламен бюджет към Meta от неговата карта.
 * 50 % при старт, 50 % в края на месеца. Заетост не обещаваме. Обръщението е на „ти“.
 */

const PDF = "/oferta/krasi/ProMarketing-za-Krasi.pdf";

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
@page{size:A4;margin:14mm 13mm}
`;

const STATS = [
  { b: "6", s: "стаи, посрещат гости от 2006 г. — двайсет години опит", bad: false },
  { b: "4", s: "продадени стаи на ден през септември и октомври", bad: false },
  { b: "~7 000 €", s: "на месец — целта, за която говорихме", bad: false },
  { b: "0", s: "активна реклама към човека, който търси нощувка точно сега", bad: true },
];

const VIDYAH = [
  {
    h: "Хотелът е добър. Хората просто не го намират",
    p: "Двайсет години работа, чисти стаи, домакини, които са там всеки ден. Но човекът, който тази вечер търси къде да спи край Пловдив, не те вижда — защото никой не му показва хотела в момента, в който решава.",
  },
  {
    h: "Booking не е твоят канал — и това е предимство",
    p: "Там печелят големите вериги, а ти не си по ДДС. Директната резервация е по-изгодна: без комисиона, гостът е твой, а не на платформата, и се връща при теб, не при Booking.",
  },
  {
    h: "Два различни госта — две различни реклами",
    p: "В събота и неделя идват двойки и семейства от Пловдив и София — екопаркът, ловната хижа на цар Борис III, тишината. В делник — фирми и работници, които искат чисто, удобно и на добра цена. Една реклама за двамата не работи. Две — работят.",
  },
  {
    h: "Безплатните сайтове не носят гости",
    p: "Пускал си обяви там и ефектът е бил слаб. Нормално е: те чакат човекът сам да ги потърси. Рекламата в Meta прави обратното — показва хотела на точния човек, преди той да е решил къде.",
  },
  {
    h: "Сайтът може да почака",
    p: "Новият сайт е добра идея, но резервацията не зависи от него. В самата реклама има бутон „Обади се“, Viber и форма за запитване. Когато сайтът е готов — добавяме го и пиксела към него.",
  },
  {
    h: "Двамата ще смогнете — нищо ново не ви се стоварва",
    p: "Всичко по рекламата правим ние: видеата, настройката, отчетите, корекциите. При теб остава същото, което правиш и сега — вдигаш телефона и отговаряш във Viber.",
  },
];

const STRATEGIA = [
  {
    h: "Реклама за резервации, не за харесвания",
    p: "Целта на всяка реклама е едно: човекът да натисне „Обади се“, да пише във Viber или да остави телефон. Не гледания, не кликове. Meta оптимизира точно за това действие.",
  },
  {
    h: "Районът: Пловдив, София и пътят към Родопите",
    p: "За уикенда — хора от Пловдив, София, Пазарджик и до около 150 км, които търсят почивка сред природа. За делника — фирми и хора, които работят или пътуват около Стамболийски и Пловдив.",
  },
  {
    h: "Две кампании: „Уикенд“ и „Делник“",
    p: "Уикенд: гората, екопаркът, хижата, закуската, тишината. Делник: чисто, удобно, паркинг, фактура, близо до работата. Всяка със свое видео и свой бюджет — виждаме коя носи повече и ѝ даваме повече.",
  },
  {
    h: "Видеа и снимки от истинския хотел",
    p: "Без актьори и без снимки от фотобанка. Стаите, дворът, околността, пътят до гората. Три кратки видеа и серия снимки — такива, каквито гостът ще види и на живо.",
  },
  {
    h: "Резервацията идва при теб до минути",
    p: "Бутонът „Обади се“ звъни на твоя телефон. Който не може да звънне — пише във Viber или оставя телефона си във форма и ти го получаваш веднага. Нищо не минава през нас.",
  },
  {
    h: "Измерване: всяко запитване се брои",
    p: "Виждаме кое видео носи обаждания и кое не. След 1–3 седмици местим бюджета към печелившото и сменяме слабото. Всеки понеделник — отчет с числата.",
  },
];

const VIDEA = [
  {
    tag: "ВИДЕО 1 · УИКЕНД",
    h: "Двайсет минути от Пловдив, пет от гората",
    k: "„Шест стаи, тишина и закуска. Екопаркът и хижата са на една разходка.“",
    p: "За двойки и семейства, които искат да излязат от града за два дни. Природата, дворът, стаята, сутринта.",
    ready: false,
  },
  {
    tag: "ВИДЕО 2 · ДЕЛНИК",
    h: "Работиш в района? Спи спокойно",
    k: "„Чиста стая, паркинг, фактура — и домакини, които са тук всеки ден.“",
    p: "За фирми, бригади и командировани. Кратко и практично: къде, какво, на кой телефон.",
    ready: false,
  },
  {
    tag: "ВИДЕО 3 · ХОТЕЛЪТ",
    h: "Двайсет години посрещаме гости",
    k: "„Семеен хотел от 2006 г. Ела да видиш защо хората се връщат.“",
    p: "Доверието: ти и жена ти, домът, грижата. Това е, което Booking не може да покаже.",
    ready: false,
  },
];

const KAMPANIA = [
  ["Цел", "Резервации — обаждания, Viber и форма за запитване. Никога трафик, кликове или гледания."],
  ["Къде", "Facebook и Instagram — лента, Stories и Reels. Автоматично разпределение към най-евтините запитвания."],
  ["Район", "„Уикенд“: Пловдив, София, Пазарджик и до ~150 км. „Делник“: хора, които работят или пътуват около Стамболийски и Пловдив."],
  ["Кой", "„Уикенд“: 25–60 г., двойки и семейства, интерес към природа и кратки почивки. „Делник“: 25–65 г., фирми, строителство, командировки."],
  ["Бюджет", "10–15 € на ден към Meta — от твоята карта в рекламния акаунт. Ние не го пипаме, всяко евро се вижда."],
  ["Креативи", "3 видеа по ~30 секунди + снимки и корици от истинския хотел. Ако гласът е AI, е означен според правилата на Meta."],
  ["Проследяване", "Обажданията и запитванията — при теб по телефон, Viber или имейл. Пиксел на сайта, щом е готов. Седмичен отчет с числата."],
  ["Оптимизация", "1–3 седмици: спираме слабото видео, усилваме силното, сменяме посланието със сезона."],
];

const DNI = [
  {
    b: "ден 1",
    p: "Кратка онлайн среща от 20 минути: достъп до Facebook страницата и рекламния акаунт. Снимки на стаите и двора ми пращаш по Viber.",
    go: false,
  },
  {
    b: "ден 2–4",
    p: "Трите видеа и текстовете идват при теб и жена ти за одобрение. „Това ни харесва, това поправи“ — и го оправяме същия ден.",
    go: false,
  },
  {
    b: "ден 5 · старт",
    p: "Рекламата е на живо. Първите запитвания идват през седмицата. Всеки понеделник — отчет с числата.",
    go: true,
  },
];

const PAKET = [
  "3 рекламни видеа и снимки от хотела — без актьори, с глас и едри надписи",
  "Две кампании за резервации във Facebook и Instagram: „Уикенд“ и „Делник“",
  "Настройка на рекламния акаунт, форма за запитване, пиксел на сайта, когато е готов",
  "Поддръжка на Facebook страницата: корица, описание, бутон „Обади се“, отговори на запитвания",
  "Запитванията при теб по телефон, Viber или имейл до минути",
  "Седмичен отчет: показвания, запитвания, цена на запитване, какво сменяме",
  "Оптимизация през целия месец: спираме слабото, усилваме силното",
];

const POSLE = [
  "Google реклама за „хотел Стамболийски“ и „нощувка край Пловдив“ — когато видим, че телефонът звъни от Meta",
  "Онлайн резервация на новия сайт с напомняне по SMS/Viber — когато сайтът е готов",
  "AI асистент за запитванията 24/7 и кратко обучение за теб и жена ти — за което питаше, когато обемът го поиска",
];

export default function KrasiOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">
          За Краси Кръстев · семеен хотел в Стамболийски · 20.10.2026
        </p>
        <h1>
          Шестте стаи пълни —{" "}
          <em>с реклама за човека, който търси нощувка край Пловдив точно сега.</em>
        </h1>
        <p className="deck">
          Благодаря за разговора, Краси. Прегледах числата, които ми прати, и
          района. Ето какво видях и как ще докараме резервации още в първия
          месец.
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
          <p className="kick">Анализът · хотелът и числата</p>
          <h2 className="h2sub">
            Хотелът има потенциал. Градът просто не го вижда.
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
            Човекът, който търси нощувка, не чете. Гледа шест секунди и пише
            на първия, който изглежда истински и е наблизо. Задачата ни е този
            първи да си ти.
          </p>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Стратегията</p>
          <h2 className="h2sub">Как ще звъни телефонът</h2>
          <p className="lead">
            Не гоним харесвания и последователи. Гоним едно: човекът от
            Пловдив или София да види хотела точно когато планира уикенда или
            командировката, и да натисне „Обади се“.
          </p>
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
          <p className="kick">Трите видеа</p>
          <h2 className="h2sub">30 секунди: за кого, защо тук, телефон</h2>
          <p className="lead">
            Без актьори и без чужди снимки. Истинският хотел, дворът и гората,
            глас и едри надписи, които се четат и без звук. Всяко видео минава
            през теб и жена ти, преди да тръгне.
          </p>
        </div>
        <div className="formats">
          {VIDEA.map((f) => (
            <article className={`fmt${f.ready ? " ready" : ""}`} key={f.h}>
              <p className="tag">{f.tag}</p>
              <h3>{f.h}</h3>
              <p className="hook">{f.k}</p>
              <p>{f.p}</p>
            </article>
          ))}
        </div>
        <p className="note">
          Казвате „това ни харесва, това поправи“ — и го оправяме същия ден.
          Нищо не излиза без вашето „да“.
        </p>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Стартовата кампания</p>
          <h2 className="h2sub">Точно какво пускаме</h2>
        </div>
        <table className="tbl">
          <tbody>
            {KAMPANIA.map(([k, v]) => (
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
          <p className="kick">Планът по дни</p>
          <h2 className="h2sub">От „да“ до първото запитване — пет дни</h2>
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
          Всичко е онлайн — не идваш никъде. Една среща от 20 минути за
          достъпите, останалото правим ние.
        </p>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Пакетът</p>
          <h2 className="h2sub">Един месец реклама за резервации</h2>
        </div>
        <div className="opts">
          <article className="opt rec">
            <span className="badge">Стартов месец</span>
            <h3>Две кампании + 3 видеа</h3>
            <p className="big">
              450 €<small>за месеца</small>
            </p>
            <p className="sub">месец за месец · без обвързване за година</p>
            <ul className="list">
              {PAKET.map((a) => (
                <li key={a}>
                  <i>✓</i>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            <div className="budget">
              <b>+ 10–15 € на ден рекламен бюджет</b>
              <p>
                Плаща се директно на Meta от твоята карта в рекламния акаунт.
                Ние не го докосваме — виждаш всяко евро и всяко запитване,
                което е купило. Спираш го, когато поискаш.
              </p>
            </div>
            <div className="pay">
              <div>
                <b>50 %</b>
                при старт — 225 €
              </div>
              <div>
                <b>50 %</b>
                в края на месеца, когато видиш резултата
              </div>
            </div>
          </article>
          <article className="opt next">
            <h3>Какво следва</h3>
            <p className="for">Когато телефонът звъни и видим кое работи:</p>
            <ul className="list">
              {POSLE.map((a) => (
                <li key={a}>
                  <i>→</i>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
        <p className="note">
          Заетост в проценти не обещаваме предварително — обещаваме реклама
          към точните хора, прозрачни числа всяка седмица и бързи корекции.
          Във видеата няма „гарантирано“, „№ 1“ и обещания, които хотелът не
          може да изпълни — само истината за него и телефонът.
        </p>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Поговорете спокойно с жена ти. Когато решите, един отговор „да“ на
          имейла или във Viber стига — всичко останало правя аз, и до седмица
          рекламата е на живо.
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
