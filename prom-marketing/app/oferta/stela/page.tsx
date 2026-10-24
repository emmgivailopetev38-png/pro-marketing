/**
 * Анализ + оферта за Стела Джурелова (stelafilipova92@gmail.com, 0890 551 585) — INTERSTELLAR 18,
 * оригинални дизайнерски и нишови парфюми от официален вносител: онлайн магазин interstellar18.com
 * (GombaShop, програмист прави нов сайт) и магазин на място. Разговор по Viber 22.10.2026, 15:05.
 *
 * Казано в разговора: сравнява цените си с Notino (същите или +3–4 €), а Notino често пуска кодове.
 * Други продават реплики на цената на оригинала. Раздала е 4–5 оригинала в игри — без връщане.
 * Не знае „как да ги котка“. Идея: един хит с голямо намаление и много бройки — Xerjoff Erba Pura
 * от 245 € на 200 € (в някои сайтове до 320 €), 15–20 бр. Иска маркетинг в мрежите.
 *
 * Цената е на Ивайло: 480 € на месец, 3 видеа на ден, органично. ДДС не споменаваме.
 * Бройки поръчки не обещаваме. Обръщението е на „ти“ — тя самата говори на „ти“.
 */

const PDF = "/oferta/stela/ProMarketing-za-Stela.pdf";

const CSS = `
/* сайтът е тъмен (color-scheme: dark в globals.css) — тази страница е светла докрай,
   иначе в PDF-а полетата на листа излизат тъмни */
html:has(.ist-doc),body:has(.ist-doc){background:#FAF6EF;color-scheme:light}
.ist-doc{
  --ground:#FAF6EF; --panel:#F1EADF; --surface:#FFFFFF;
  --ink:#1D1714; --ink-2:#4E4540; --ink-3:#83786F;
  --rule:#E5DACB; --rule-soft:#EFE7DB;
  --accent:#6E2440; --accent-soft:#F4E7EA; --gold:#9A7426;
  --shadow:0 1px 2px rgba(29,23,20,.05), 0 10px 28px -18px rgba(110,36,64,.32);
  background:var(--ground); color:var(--ink);
  font-family:var(--ist-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.ist-doc *{box-sizing:border-box}
.ist-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.ist-doc h1,.ist-doc h2{font-family:var(--ist-display),Georgia,serif;font-weight:600;letter-spacing:-.01em;text-wrap:balance}
/* Cormorant има старинни цифри по подразбиране — „3“ се чете като „з“ */
.ist-doc h1,.ist-doc h2,.ist-doc .pull p,.ist-doc .fmt .hook,.ist-doc .heroprice .nm,.ist-doc .heroprice .verdict{font-variant-numeric:lining-nums}
.ist-doc .sechead{break-inside:avoid;break-after:avoid}
.ist-doc h3{font-family:var(--ist-ui),Arial,sans-serif;font-weight:700;letter-spacing:-.01em;text-wrap:balance}
.ist-doc a{color:var(--accent);text-underline-offset:3px}
.ist-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.ist-doc p{margin:0}

/* ── шапка ── */
.ist-doc .masthead{padding:58px 0 34px;border-bottom:1px solid var(--rule)}
.ist-doc .eyebrow{font-family:var(--ist-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:0 0 18px}
.ist-doc h1{font-size:54px;line-height:1.04;margin:0 0 18px;max-width:20ch}
.ist-doc h1 em{font-style:italic;color:var(--accent)}
.ist-doc .deck{font-size:19px;line-height:1.56;color:var(--ink-2);max-width:60ch;margin:0 0 22px}
.ist-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-family:var(--ist-ui),sans-serif;font-size:14px;color:var(--ink-3)}
.ist-doc .byline a{font-weight:600}

/* ── секции ── */
.ist-doc section{margin:54px 0 0}
.ist-doc .kick{font-family:var(--ist-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin:0 0 10px}
.ist-doc .h2sub{font-size:36px;line-height:1.12;margin:0 0 14px;max-width:28ch}
.ist-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.ist-doc .note{font-size:13.5px;color:var(--ink-3);margin:12px 0 0;max-width:74ch}

/* числата */
.ist-doc .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:0 0 18px}
.ist-doc .stat{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.ist-doc .stat b{display:block;font-family:var(--ist-ui),sans-serif;font-weight:700;font-size:30px;line-height:1.05;color:var(--accent);font-variant-numeric:tabular-nums}
.ist-doc .stat span{display:block;font-family:var(--ist-ui),sans-serif;font-size:13px;line-height:1.4;color:var(--ink-3);margin-top:6px}

.ist-doc .facts{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:0 0 20px}
.ist-doc .fact{background:var(--panel);border-radius:12px;padding:18px 20px}
.ist-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.ist-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.ist-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px}
.ist-doc .pull p{font-family:var(--ist-display),Georgia,serif;font-size:23px;line-height:1.35;color:var(--ink);font-style:italic}

/* сравнение с големите */
.ist-doc .tbl{width:100%;border-collapse:separate;border-spacing:0;background:var(--surface);border:1px solid var(--rule);border-radius:14px;overflow:hidden;font-family:var(--ist-ui),sans-serif;font-size:14.5px}
.ist-doc .tbl th,.ist-doc .tbl td{padding:11px 14px;text-align:left;border-bottom:1px solid var(--rule-soft);vertical-align:top}
.ist-doc .tbl thead th{background:var(--panel);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);font-weight:600}
.ist-doc .tbl tbody tr:last-child td{border-bottom:none}
.ist-doc .tbl td.num{font-variant-numeric:tabular-nums;white-space:nowrap}
.ist-doc .tbl td.win{color:var(--accent);font-weight:700}
.ist-doc .tblwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}

.ist-doc .cards{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.ist-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px 22px 20px;box-shadow:var(--shadow)}
.ist-doc .card .num{font-family:var(--ist-mono),monospace;font-size:12px;color:var(--gold);letter-spacing:.12em;display:block;margin:0 0 8px}
.ist-doc .card h3{font-size:17.5px;margin:0 0 8px}
.ist-doc .card p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* хитът */
.ist-doc .hero{display:grid;grid-template-columns:1fr 1.1fr;gap:22px;align-items:stretch}
.ist-doc .heroprice{background:var(--ink);color:#F7EFE3;border-radius:16px;padding:28px 28px 24px;display:flex;flex-direction:column;justify-content:space-between}
.ist-doc .heroprice .nm{font-family:var(--ist-display),Georgia,serif;font-size:30px;line-height:1.1;margin:0 0 4px}
.ist-doc .heroprice .tp{font-family:var(--ist-ui),sans-serif;font-size:13px;color:#C9B9A4;letter-spacing:.04em;margin:0 0 18px}
.ist-doc .heroprice .row{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-family:var(--ist-ui),sans-serif;font-size:15px;color:#D9CBB8;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.12)}
.ist-doc .heroprice .row s{color:#A8998A}
.ist-doc .heroprice .verdict{font-family:var(--ist-display),Georgia,serif;font-style:italic;font-size:23px;line-height:1.3;color:#E9C77B;padding-top:16px}
.ist-doc .herotext{display:flex;flex-direction:column;gap:12px}
.ist-doc .herotext .card{box-shadow:none}

/* формати */
.ist-doc .formats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.ist-doc .fmt{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.ist-doc .fmt h3{font-size:15.5px;margin:0 0 6px}
.ist-doc .fmt .hook{font-family:var(--ist-display),Georgia,serif;font-style:italic;font-size:19px;line-height:1.3;color:var(--accent);margin:0 0 6px}
.ist-doc .fmt p{font-size:14px;line-height:1.5;color:var(--ink-2)}
.ist-doc .day{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 18px}
.ist-doc .slot{background:var(--accent-soft);border-radius:12px;padding:14px 16px}
.ist-doc .slot b{display:block;font-family:var(--ist-mono),monospace;font-weight:500;font-size:12.5px;letter-spacing:.08em;color:var(--accent);margin:0 0 4px}
.ist-doc .slot p{font-size:14.5px;line-height:1.5;color:var(--ink-2)}

/* ── пакетът ── */
.ist-doc .opts{display:grid;grid-template-columns:1.15fr .85fr;gap:18px}
.ist-doc .opt{position:relative;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:28px 26px 24px;box-shadow:var(--shadow)}
.ist-doc .opt.rec{border:2px solid var(--accent)}
.ist-doc .opt .badge{position:absolute;top:-13px;left:22px;background:var(--accent);color:#fff;font-family:var(--ist-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.06em;border-radius:999px;padding:4px 12px}
.ist-doc .opt h3{font-size:19px;margin:0 0 8px}
.ist-doc .opt .big{font-family:var(--ist-ui),sans-serif;font-weight:700;font-size:42px;line-height:1;color:var(--accent);margin:0 0 4px;font-variant-numeric:tabular-nums}
.ist-doc .opt .big small{font-size:16px;font-weight:600;color:var(--ink-3);margin-left:8px;white-space:nowrap;display:inline-block}
.ist-doc .opt .sub{font-family:var(--ist-mono),monospace;font-size:13px;color:var(--ink-3);margin:0 0 16px}
.ist-doc .opt .for{font-size:15px;line-height:1.55;color:var(--ink-2);margin:0 0 14px}
.ist-doc .opt.next{background:var(--panel);border-color:transparent;box-shadow:none}
.ist-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px}
.ist-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15px;line-height:1.5;color:var(--ink-2)}
.ist-doc .list li i{font-style:normal;color:var(--accent);font-weight:700}

/* ── сезонът ── */
.ist-doc .season{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.ist-doc .step{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.ist-doc .step b{display:block;font-family:var(--ist-mono),monospace;font-weight:500;font-size:12.5px;letter-spacing:.08em;color:var(--gold);margin:0 0 6px}
.ist-doc .step p{font-size:14.5px;line-height:1.5;color:var(--ink-2)}

/* ── следващата стъпка ── */
.ist-doc .closing{background:var(--accent-soft);border:1px solid #E6CBD3;border-left:4px solid var(--accent);border-radius:16px;padding:30px 32px 28px;margin-top:54px}
.ist-doc .closing h2{color:var(--accent);font-size:32px;margin:0 0 10px}
.ist-doc .closing p{font-size:17px;line-height:1.6;color:var(--ink);max-width:62ch}
.ist-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.ist-doc .closing .sig{max-width:none;font-size:13.5px;color:var(--ink-3);border-top:1px solid #E6CBD3;padding-top:16px}
.ist-doc .closing a.btn{font-family:var(--ist-ui),sans-serif;font-weight:600;text-decoration:none;color:#fff;background:var(--accent);border-radius:10px;padding:12px 18px;font-size:15px}
.ist-doc .closing a.ghost{color:var(--accent);background:transparent;border:1px solid var(--accent)}
.ist-doc .sig{break-inside:avoid;margin:26px 0 0;font-family:var(--ist-ui),sans-serif;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.ist-doc .sig b{color:var(--ink)}
.ist-doc .sig .ln{display:block}

@media (max-width:860px){
  .ist-doc .stats{grid-template-columns:repeat(2,1fr)}
  .ist-doc .hero{grid-template-columns:1fr}
}
@media (max-width:760px){
  .ist-doc .wrap{padding:0 16px 72px}
  .ist-doc h1{font-size:38px}
  .ist-doc .h2sub{font-size:28px}
  .ist-doc .deck{font-size:17.5px}
  .ist-doc .opts,.ist-doc .cards,.ist-doc .season,.ist-doc .facts,.ist-doc .formats,.ist-doc .day{grid-template-columns:1fr}
  .ist-doc .masthead{padding:36px 0 26px}
  .ist-doc .closing{padding:24px 20px}
  .ist-doc .pull p{font-size:20px}
}
@media print{
  :root,html,body{color-scheme:light;background:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .ist-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .ist-doc .wrap{max-width:none;padding:0}
  .ist-doc .masthead{padding:0 0 12px}
  .ist-doc .sechead{break-inside:avoid;break-after:avoid;page-break-after:avoid}
  .ist-doc h1{font-size:34px;margin-bottom:10px;max-width:none}
  .ist-doc .deck{font-size:14px;max-width:none}
  .ist-doc .byline .pdf{display:none}
  .ist-doc section{margin:13px 0 0}
  .ist-doc .h2sub,.ist-doc .lead{max-width:none}
  .ist-doc .kick,.ist-doc .h2sub,.ist-doc .lead{break-after:avoid}
  .ist-doc .h2sub{font-size:22px;margin-bottom:8px}
  .ist-doc .lead{font-size:12.5px;margin-bottom:10px}
  .ist-doc .stat,.ist-doc .fact,.ist-doc .card,.ist-doc .opt,.ist-doc .pull,.ist-doc .step,.ist-doc .fmt,.ist-doc .slot,.ist-doc .heroprice,.ist-doc .tbl tr{break-inside:avoid}
  .ist-doc .stats{grid-template-columns:repeat(4,1fr);gap:8px}
  .ist-doc .stat{padding:10px 12px}
  .ist-doc .stat b{font-size:22px}
  .ist-doc .stat span{font-size:11px}
  .ist-doc .facts{grid-template-columns:repeat(2,1fr);gap:8px}
  .ist-doc .fact{padding:10px 12px}
  .ist-doc .fact h3{font-size:13px}
  .ist-doc .fact p{font-size:11.5px}
  .ist-doc .pull{padding:10px 16px}
  .ist-doc .pull p{font-size:16px}
  .ist-doc .tbl{font-size:11.5px}
  .ist-doc .tbl th,.ist-doc .tbl td{padding:6px 9px}
  .ist-doc .cards{grid-template-columns:repeat(2,1fr);gap:8px}
  .ist-doc .card{padding:10px 12px;box-shadow:none}
  .ist-doc .card .num{margin-bottom:3px}
  .ist-doc .card h3{font-size:13px;margin-bottom:4px}
  .ist-doc .card p{font-size:11.5px;line-height:1.46}
  .ist-doc .hero{grid-template-columns:1fr 1.1fr;gap:12px}
  .ist-doc .heroprice{padding:16px 18px}
  .ist-doc .heroprice .nm{font-size:22px}
  .ist-doc .heroprice .row{font-size:12px;padding:5px 0}
  .ist-doc .heroprice .verdict{font-size:16px;padding-top:10px}
  .ist-doc .formats{grid-template-columns:repeat(2,1fr);gap:8px}
  .ist-doc .fmt{padding:9px 12px}
  .ist-doc .fmt h3{font-size:12.5px;margin-bottom:3px}
  .ist-doc .fmt .hook{font-size:14px;margin-bottom:3px}
  .ist-doc .fmt p{font-size:11px}
  .ist-doc .day{grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
  .ist-doc .slot{padding:9px 12px}
  .ist-doc .slot p{font-size:11.5px}
  .ist-doc .opts{grid-template-columns:1.15fr .85fr;gap:12px}
  .ist-doc .opt{padding:16px 16px 12px;box-shadow:none}
  .ist-doc .opt .big{font-size:30px}
  .ist-doc .opt .for{font-size:12px}
  .ist-doc .opt h3{font-size:15px}
  .ist-doc .list{gap:5px}
  .ist-doc .list li{font-size:12px}
  .ist-doc .season{grid-template-columns:repeat(3,1fr);gap:8px}
  .ist-doc .step{padding:9px 12px}
  .ist-doc .step p{font-size:11.5px}
  .ist-doc .note{font-size:11px}
  .ist-doc .closing{padding:14px 18px;margin-top:16px;break-inside:avoid}
  .ist-doc .sig{margin:8px 0 0;font-size:10.5px;line-height:1.45}
  .ist-doc .sig .ln{display:inline}
  .ist-doc .sig .ln+.ln::before{content:"  ·  "}
  .ist-doc .closing h2{font-size:22px}
  .ist-doc .closing p{font-size:13.5px}
  .ist-doc .closing .ctas{display:none}
  .ist-doc .fact,.ist-doc .closing,.ist-doc .opt .badge,.ist-doc .opt.next,.ist-doc .slot,.ist-doc .heroprice,.ist-doc .tbl thead th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const STATS = [
  { b: "62", s: "оригинални парфюма от 32 марки в сайта" },
  { b: "4 978", s: "последователи в Instagram + 3 000 във Facebook" },
  { b: "2–4", s: "харесвания на последните постове" },
  { b: "0", s: "видеа на магазина в TikTok" },
];

const VIDYAH = [
  {
    h: "Сайтът има добра основа",
    p: "62 парфюма от 39 до 249 €, с описания и „Бърза поръчка“ само с телефон — това е силно. Но лентата е празна: няма отзиви, няма FAQ, а две категории в менюто са шаблонни и празни.",
  },
  {
    h: "„Оригинал“ е само дума",
    p: "Пише „от официален вносител“, но няма нито една снимка, кутия, партиден код или отзив, който да го докаже. А точно доверието е това, което продава парфюм онлайн.",
  },
  {
    h: "Доставката плаши",
    p: "Пише само „Speedy, Еконт, наложен платеж“ — без цена, без срок, без праг за безплатна доставка. В Общите условия стои „30 работни дни“. Купувачът спира точно тук.",
  },
  {
    h: "Мрежите са банер, а не човек",
    p: "Магазинът живее в личния ти профил. Последните постове са един и същ банер „Дизайнерски парфюми до 50 %“, а описанието е само линк. Алгоритъмът показва видео — банерът остава невидим.",
  },
  {
    h: "Viber го няма на сайта",
    p: "Телефонът ти е във Viber, а точно там хората искат съвет „какво да му подаря“. На сайта няма бутон — съобщението, което щеше да стане поръчка, не се случва.",
  },
  {
    h: "Рекламата е сляпа",
    p: "Сайтът няма пиксел на Meta. Facebook и Instagram не знаят кой е разгледал Erba Pura и кой е купил — и не могат да му я покажат пак.",
  },
];

const PAZAR = [
  {
    p: "Xerjoff Erba Pura EDP 100 ml",
    ti: "245",
    notino: "205",
    douglas: "—",
    pbg: "170,77",
    min: "139",
  },
  {
    p: "Montblanc Explorer EDP 100 ml",
    ti: "108",
    notino: "86,90",
    douglas: "86,65",
    pbg: "57,90*",
    min: "54",
  },
  {
    p: "Boss Bottled Parfum 50 ml",
    ti: "71",
    notino: "66,50",
    douglas: "66,25",
    pbg: "54,63",
    min: "49,99",
  },
];

const SILNI = [
  {
    h: "Където Notino печели",
    p: "Промоции всяка седмица, доставка за 1,53–2,53 €, 90 дни за връщане, мостри. С тях не се бием по цена на всеки флакон — там губи всеки малък магазин.",
  },
  {
    h: "Където печелиш ти",
    p: "Човек, който отговаря във Viber вечер и в неделя. Магазин, в който можеш да помиришеш. Подаръчна опаковка с картичка. Гаранция „оригинал от вносителя“, която се вижда. И лице, на което хората вярват.",
  },
];

const STRATEGIA = [
  {
    h: "Ти си лицето на магазина",
    p: "Личният ти профил с почти 5 000 души е предимство, не проблем. Хората купуват от Стела, която разбира от парфюми — не от банер. Затова всеки ден има видео с теб.",
  },
  {
    h: "„Оригинал с гаранция“ — показан, не написан",
    p: "Видеа как се познава оригинал: партиден код, целофан, пулверизатор, кутията от вносителя. Така се отделяш от онези, които продават реплики на цената на оригинала.",
  },
  {
    h: "Хит на месеца — твоята идея, с една поправка",
    p: "Един аромат с голямо намаление и ограничени бройки (15–20). Поправката: хитът трябва да е най-изгодният в България в деня на пускането. Хората проверяват с един клик.",
  },
  {
    h: "Ценова карта на всичките 62",
    p: "Минаваме заедно каталога срещу Notino и parfum.bg. Кои сваляш, кои държиш с подарък вместо отстъпка (мостра, опаковка, картичка), кои стават хит.",
  },
  {
    h: "Подарък срещу действие, не на вятъра",
    p: "Вместо игри, в които всички искат без пари: мостра към всяка поръчка, подарък за видео-отзив, подарък за доведен приятел. Подаръкът носи поръчка, не просто харесване.",
  },
  {
    h: "Сайтът довършва продажбата",
    p: "Viber бутон, доставка с цена и срок, отзиви, снимки „оригинал“, пиксел на Meta. Казваме на програмиста ти точно какво да има в новия сайт.",
  },
];

const DEN = [
  {
    b: "Сутрин · продава",
    p: "Хитът или конкретен парфюм с цената — „мирише на скъпо, ето колко е“.",
  },
  {
    b: "Обед · доверие",
    p: "Оригинал срещу реплика, как да избереш, съвет за подарък.",
  },
  { b: "Вечер · ти", p: "Тренд, реакция, опаковам поръчка, въпрос от клиент." },
];

const FORMATI = [
  {
    h: "„Мирише на…“",
    k: "„Този мирише на лято в Италия, което не искаш да свършва.“",
    p: "Ароматът с усещания, не с ноти. Най-силният формат в PerfumeTok.",
  },
  {
    h: "Оригинал или реплика",
    k: "„3 неща, по които познаваш фалшив парфюм за 10 секунди.“",
    p: "Учи, печели доверие и казва без думи: при мен е истински.",
  },
  {
    h: "Комплимент-магнит",
    k: "„Топ 3 аромата, за които жените питат: какъв парфюм е това?“",
    p: "Eros и Boss Bottled са в топ 8 на мъжките по мнението на жените (класацията на parfum.bg) — и ги имаш.",
  },
  {
    h: "Сляп тест",
    k: "„Explorer, Eros Flame или Bottled — кой е най-секси?“",
    p: "Хората коментират и спорят — алгоритъмът го разпространява.",
  },
  {
    h: "Подарък без грешка",
    k: "„Не знаеш какво да му подариш? Кажи ми 3 неща за него.“",
    p: "Води директно във Viber — там съветът става поръчка.",
  },
  {
    h: "Опаковам поръчка",
    k: "„Тази тръгва за Варна 📦“",
    p: "Истински поръчки, истинска кутия — най-простото доказателство, че се купува.",
  },
];

const PAKET = [
  "3 видеа на ден — около 90 на месец — за TikTok, Instagram, Facebook и YouTube Shorts",
  "Идеите и сценариите + седмичен списък какво да снимаш",
  "Монтаж: кука в първата секунда, надписи, музика от библиотеката за бизнес профили, корица",
  "Текстове, хаштагове и публикуване в най-добрите часове",
  "Профилите: бизнес акаунти, TikTok на магазина, биография и акценти (Доставка · Оригинал · Отзиви)",
  "Хитът на месеца и ценовата карта срещу Notino и parfum.bg",
  "Месечен отчет: гледания, нови последователи, съобщения във Viber, поръчки от мрежите",
];

const POSLE = [
  "Реклама за продажби с видеата, които вече продават сами",
  "Пиксел и проследяване на всяка поръчка в новия сайт — заедно с програмиста",
  "Напомняне към купилите във Viber: „парфюмът ти свършва — да ти запазя?“",
];

export default function StelaOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="masthead">
        <p className="eyebrow">
          За Стела Джурелова · INTERSTELLAR 18 · 22.10.2026
        </p>
        <h1>
          Оригинални парфюми, които се продават —{" "}
          <em>с видео всеки ден и един хит на месеца.</em>
        </h1>
        <p className="deck">
          Беше ми приятно да си поговорим, Стела. Разгледах сайта ти, мрежите и
          цените на големите магазини. Ето какво видях и как ще продаваш повече.
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
          <p className="kick">Анализът · магазинът и мрежите</p>
          <h2 className="h2sub">Хубав асортимент, който още не се вижда</h2>
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
            Хората не купуват парфюм от банер. Купуват от човек, на когото
            вярват — че е оригинал и че ще им каже честно как ще миришат.
          </p>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Анализът · големите магазини</p>
          <h2 className="h2sub">Цените днес: тук е най-бързата печалба</h2>
          <p className="lead">
            Каза, че държиш цените до тези на Notino. Проверих днес — Notino е
            свалил част от своите, и разликата при някои парфюми вече е 5–21 €.
            Купувачът я вижда с един клик.
          </p>
        </div>
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Парфюм</th>
                <th>При теб</th>
                <th>Notino</th>
                <th>Douglas</th>
                <th>parfum.bg</th>
                <th>Най-ниско</th>
              </tr>
            </thead>
            <tbody>
              {PAZAR.map((r) => (
                <tr key={r.p}>
                  <td>{r.p}</td>
                  <td className="num win">{r.ti} €</td>
                  <td className="num">{r.notino} €</td>
                  <td className="num">
                    {r.douglas === "—" ? "няма го" : `${r.douglas} €`}
                  </td>
                  <td className="num">{r.pbg} €</td>
                  <td className="num">{r.min} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">
          Цените са от сайтовете на 22.10.2026, без кодове и без вход в профил —
          сменят се всяка седмица. „Най-ниско“ е най-ниската открита цена в
          български онлайн магазин (за Erba Pura — parfimo.bg и makeup.bg). *
          изчерпан при проверката.
        </p>
        <div className="cards" style={{ marginTop: 18 }}>
          {SILNI.map((k) => (
            <article className="card" key={k.h}>
              <h3>{k.h}</h3>
              <p>{k.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Стратегията</p>
          <h2 className="h2sub">Как ще продаваш повече</h2>
          <p className="lead">
            Не гоним най-ниската цена на всичките 62 парфюма. Гоним доверие,
            един силен хит всеки месец и видео всеки ден, което кара хората да
            ти пишат.
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
        <p className="note">
          Едно важно за зачертаните цени: по закон „старата“ цена при намаление
          трябва да е най-ниската от последните 30 дни. Сега и 62-та парфюма са
          „на промоция“. По-малко, но истински намаления продават повече — и
          пазят магазина.
        </p>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Хитът на месеца</p>
          <h2 className="h2sub">
            Erba Pura — ако цената е най-добрата в България
          </h2>
        </div>
        <div className="hero">
          <div className="heroprice">
            <div>
              <p className="nm">Xerjoff Erba Pura</p>
              <p className="tp">EDP 100 ml · унисекс · нишов</p>
            </div>
            <div>
              <p className="row">
                <span>При теб сега</span>
                <span>245 €</span>
              </p>
              <p className="row">
                <span>Notino днес</span>
                <span>205 €</span>
              </p>
              <p className="row">
                <span>parfum.bg</span>
                <span>170,77 €</span>
              </p>
              <p className="verdict">
                Хит става, когато е най-изгодната в България — и с гаранция
                „оригинал“.
              </p>
            </div>
          </div>
          <div className="herotext">
            <article className="card">
              <h3>Защо идеята ти е правилна</h3>
              <p>
                Един аромат, за който всички говорят, на цена, на която никой не
                устоява, и ограничени бройки. Хората идват за хита и разглеждат
                останалото.
              </p>
            </article>
            <article className="card">
              <h3>Поправката</h3>
              <p>
                При 200 € Erba Pura е на нивото на Notino, а другаде се намира и
                по 139–171 €. Ако можеш да я дадеш около 170 € — тя е идеалният
                хит. Ако не, първият хит е друг аромат от каталога, при който
                можеш да си най-добра. Решаваме го с ценовата карта.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">3 видеа на ден</p>
          <h2 className="h2sub">
            Едно продава, едно печели доверие, едно си ти
          </h2>
          <p className="lead">
            Снимаш веднъж седмично 1–2 часа в магазина по готов списък с кадри.
            Ние правим от това 21 видеа и ги пускаме в TikTok, Instagram,
            Facebook и YouTube Shorts — едно видео, четири мрежи.
          </p>
        </div>
        <div className="day">
          {DEN.map((d) => (
            <div className="slot" key={d.b}>
              <b>{d.b}</b>
              <p>{d.p}</p>
            </div>
          ))}
        </div>
        <div className="formats">
          {FORMATI.map((f) => (
            <article className="fmt" key={f.h}>
              <h3>{f.h}</h3>
              <p className="hook">{f.k}</p>
              <p>{f.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Сезонът</p>
          <h2 className="h2sub">
            Започваме точно преди най-силните месеци за парфюми
          </h2>
        </div>
        <div className="season">
          <div className="step">
            <b>първите 2 седмици</b>
            <p>
              Бизнес профили, TikTok на магазина, ценовата карта, първото
              снимане и първите видеа.
            </p>
          </div>
          <div className="step">
            <b>ноември · Black Friday</b>
            <p>Хитът на месеца и подаръчните комплекти — имаш 4 в наличност.</p>
          </div>
          <div className="step">
            <b>декември · Коледа</b>
            <p>
              „Подарък, който няма да сбъркаш“ — видеа за него и за нея, съвет
              във Viber.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Пакетът</p>
          <h2 className="h2sub">Професионален маркетинг в мрежите</h2>
        </div>
        <div className="opts">
          <article className="opt rec">
            <span className="badge">Органичен растеж</span>
            <h3>Видео всеки ден</h3>
            <p className="big">
              480 €<small>на месец</small>
            </p>
            <p className="sub">3 видеа на ден · 4 мрежи</p>
            <ul className="list">
              {PAKET.map((a) => (
                <li key={a}>
                  <i>✓</i>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="opt next">
            <h3>Какво следва</h3>
            <p className="for">Когато видим кои видеа продават сами:</p>
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
          Брой поръчки не обещаваме предварително — обещаваме видео всеки ден и
          ясна картина кое продава и защо. Музиката е само лицензирана, а всяко
          твърдение във видеата е истина: без „гарантирано“, „№ 1“ и
          „преди/след“.
        </p>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Прати ми линк към новия сайт, щом е готов, и избери ден за първото
          снимане в магазина. Първите видеа излизат още същата седмица — точно
          навреме за Black Friday.
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
