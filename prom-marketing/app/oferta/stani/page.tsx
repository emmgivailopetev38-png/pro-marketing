/**
 * Оферта за Стани · парти агенция, Русе — външен гласов модул за хуманоидния
 * робот Unitree R1, който говори на български и изпълнява функции (Function AI),
 * без никакъв достъп до самия робот.
 *
 * Стани звънна на Ивайло на 25.09.2026: работят с „Фламинго“, искат да купят
 * Unitree R1, но той не говори български. На 01.10 Ивайло реши пътя: отделно
 * устройство, закачено на робота, което говори с хората и върши задачите;
 * роботът остава фабричен. Пак тогава — да се провери дали Viber се свързва с
 * CRM-а през API (проверено: да, през официален бизнес канал, с месечна такса
 * към доставчика — затова е „по желание“).
 *
 * Цената (1 800 € с ДДС + устройството отделно) е избрана от Ивайло на 01.10.
 * Срокът (около 3 седмици) и вноските 900 + 900 € са предложение — да се
 * потвърдят преди изпращане. Цените на устройството и месечните такси са
 * ориентировъчни, от проучване на 01.10.2026 (български магазини, ElevenLabs,
 * доставчици на Viber).
 *
 * Фамилията на Стани и обръщението не са известни — офертата е на „Вие“.
 */

const PDF = "/oferta/stani/ProMarketing-za-Stani.pdf";

const CSS = `
.sta-doc{
  --ground:#FAF8FC; --panel:#F1ECF6; --surface:#FFFFFF;
  --ink:#1A1420; --ink-2:#4E4558; --ink-3:#827890;
  --rule:#E3DCEA; --rule-soft:#EDE8F2;
  --accent:#6A2C91; --accent-soft:#EFE6F6; --accent-ink:#F8F2FC;
  --gold:#94570A; --gold-soft:#F8EEDD;
  --shadow:0 1px 2px rgba(26,20,32,.05), 0 10px 28px -18px rgba(26,20,32,.26);
  background:var(--ground); color:var(--ink);
  font-family:var(--sta-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.sta-doc *{box-sizing:border-box}
.sta-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.sta-doc h1,.sta-doc h2,.sta-doc h3{font-family:var(--sta-ui),Arial,sans-serif;letter-spacing:-.014em;text-wrap:balance}
.sta-doc h2,.sta-doc h3{font-weight:700}
.sta-doc a{color:var(--accent);text-underline-offset:3px}
.sta-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.sta-doc p{margin:0}

/* ── шапка ── */
.sta-doc .masthead{padding:58px 0 34px;border-bottom:1px solid var(--rule)}
.sta-doc .eyebrow{font-family:var(--sta-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.sta-doc h1{font-size:44px;line-height:1.08;font-weight:700;margin:0 0 18px;max-width:24ch}
.sta-doc h1 em{font-style:normal;color:var(--accent)}
.sta-doc .deck{font-size:19px;line-height:1.56;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.sta-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-family:var(--sta-ui),sans-serif;font-size:14px;color:var(--ink-3)}
.sta-doc .byline .pill{font-family:var(--sta-mono),monospace;font-weight:500;font-size:14px;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:6px 14px}
.sta-doc .byline a{font-weight:600}

/* ── секции ── */
.sta-doc section{margin:52px 0 0}
.sta-doc .kick{font-family:var(--sta-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin:0 0 10px}
.sta-doc .h2sub{font-size:29px;line-height:1.2;font-weight:700;margin:0 0 14px;max-width:28ch}
.sta-doc .lead{font-size:17px;color:var(--ink-2);max-width:66ch;margin:0 0 22px}
.sta-doc .note{font-size:13.5px;color:var(--ink-3);margin:10px 0 0}

/* ── откъде тръгваме ── */
.sta-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 20px}
.sta-doc .fact{background:var(--panel);border-radius:12px;padding:18px 20px}
.sta-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.sta-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.sta-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px}
.sta-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.sta-doc .pull .src{display:block;margin-top:8px;font-family:var(--sta-ui),sans-serif;font-size:13px;color:var(--ink-3)}

/* ── функциите ── */
.sta-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.sta-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px 22px 20px;box-shadow:var(--shadow);display:flex;flex-direction:column}
.sta-doc .card .num{font-family:var(--sta-mono),monospace;font-size:12px;color:var(--accent);letter-spacing:.12em;display:block;margin:0 0 8px}
.sta-doc .card h3{font-size:17.5px;font-weight:700;margin:0 0 8px}
.sta-doc .card p{font-size:15px;line-height:1.56;color:var(--ink-2)}
.sta-doc .card p:not(.you){flex:1 1 auto}
.sta-doc .card .you{margin:14px 0 0;padding:10px 12px;border-radius:9px;background:var(--accent-soft);font-size:13.5px;line-height:1.5;color:var(--ink)}
.sta-doc .card .you b{font-family:var(--sta-ui),sans-serif;font-weight:600;color:var(--accent)}

/* ── как работи и честно за партито ── */
.sta-doc .rows{display:grid;grid-template-columns:auto 1fr;gap:0 18px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.sta-doc .rows .t{font-family:var(--sta-ui),sans-serif;font-weight:600;font-size:14.5px;color:var(--ink);padding:14px 0;border-top:1px dashed var(--rule-soft);max-width:15ch}
.sta-doc .rows .t i{font-style:normal;font-family:var(--sta-mono),monospace;font-weight:500;font-size:12.5px;color:var(--accent);display:block;margin:0 0 2px}
.sta-doc .rows .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule-soft)}
.sta-doc .rows .t:first-child,.sta-doc .rows .t:first-child+.w{border-top:0}
.sta-doc .rows .w b{color:var(--ink);font-weight:600}

/* ── списъци ── */
.sta-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.sta-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.sta-doc .box h3{font-size:16px;margin:0 0 14px}
.sta-doc .box .sum{font-family:var(--sta-mono),monospace;font-size:13px;color:var(--ink-3);margin:-8px 0 14px}
.sta-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px}
.sta-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15.5px;line-height:1.5;color:var(--ink-2)}
.sta-doc .list li i{font-style:normal;color:var(--accent);font-weight:700}
.sta-doc .list li b{color:var(--ink);font-weight:600}
.sta-doc .costs{width:100%;border-collapse:collapse;font-size:15px}
.sta-doc .costs td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.sta-doc .costs td.v{font-family:var(--sta-mono),monospace;color:var(--ink);text-align:right;white-space:nowrap;padding-left:14px}
.sta-doc .costs tr:first-child td{border-top:0}

/* ── внедряването ── */
.sta-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
.sta-doc .step{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:20px}
.sta-doc .step .d{font-family:var(--sta-mono),monospace;font-size:12px;letter-spacing:.1em;color:var(--gold);text-transform:uppercase;display:block;margin:0 0 7px}
.sta-doc .step h3{font-size:16.5px;margin:0 0 7px}
.sta-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── цената ── */
.sta-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:28px;box-shadow:var(--shadow)}
.sta-doc .price .big{font-family:var(--sta-ui),sans-serif;font-weight:700;font-size:46px;line-height:1;margin:0 0 6px;color:var(--ink)}
.sta-doc .price .big small{font-size:18px;font-weight:600;color:var(--ink-3);margin-left:8px}
.sta-doc .price .sub{font-family:var(--sta-mono),monospace;font-size:13px;color:var(--ink-3);margin:0 0 18px}
.sta-doc .price h3{font-size:15px;margin:0 0 8px}
.sta-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.sta-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.sta-doc .price td.v{font-family:var(--sta-mono),monospace;color:var(--ink);text-align:right;white-space:nowrap;padding-left:14px}
.sta-doc .price tr:first-child td{border-top:0}
.sta-doc .extra{margin:14px 0 0}

/* ── следващата стъпка ── */
.sta-doc .closing{background:var(--accent);color:var(--accent-ink);border-radius:16px;padding:32px 32px 28px;margin-top:52px}
.sta-doc .closing h2{color:#fff;font-size:27px;margin:0 0 10px}
.sta-doc .closing p{font-size:16.5px;line-height:1.6;color:rgba(255,255,255,.93);max-width:64ch}
.sta-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.sta-doc .closing a.btn{font-family:var(--sta-ui),sans-serif;font-weight:600;text-decoration:none;color:var(--accent);background:#fff;border-radius:10px;padding:12px 18px;font-size:15px}
.sta-doc .closing a.ghost{color:#fff;background:transparent;border:1px solid rgba(255,255,255,.55)}
.sta-doc .sig{margin:26px 0 0;font-family:var(--sta-ui),sans-serif;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.sta-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .sta-doc h1{font-size:32px}
  .sta-doc .h2sub{font-size:24px}
  .sta-doc .two,.sta-doc .price{grid-template-columns:1fr}
  .sta-doc .masthead{padding:36px 0 26px}
  .sta-doc .rows{grid-template-columns:1fr;padding:14px 20px}
  .sta-doc .rows .t{padding:14px 0 0;border-top:1px dashed var(--rule-soft);max-width:none}
  .sta-doc .rows .w{padding:4px 0 14px;border-top:0}
  .sta-doc .rows .t:first-child{border-top:0}
}
@media print{
  html,body{background:#fff}
  .sta-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .sta-doc .wrap{max-width:none;padding:0}
  .sta-doc .masthead{padding:0 0 16px}
  .sta-doc h1{font-size:29px;margin-bottom:12px}
  .sta-doc .deck{font-size:14px}
  .sta-doc .byline .pdf{display:none}
  .sta-doc section{margin:22px 0 0}
  .sta-doc section{break-inside:avoid}
  .sta-doc section.sec-cards,.sta-doc section.sec-price{break-inside:auto}
  .sta-doc .kick,.sta-doc .h2sub,.sta-doc .lead{break-after:avoid}
  .sta-doc .h2sub{font-size:19px;margin-bottom:10px}
  .sta-doc .lead{font-size:13px;margin-bottom:12px}
  .sta-doc .fact,.sta-doc .card,.sta-doc .step,.sta-doc .box,.sta-doc .price,.sta-doc .pull{break-inside:avoid}
  .sta-doc .fact p,.sta-doc .step p{font-size:12px}
  .sta-doc .cards{grid-template-columns:1fr 1fr;gap:10px}
  .sta-doc .card{padding:14px 16px;box-shadow:none}
  .sta-doc .card h3{font-size:14px}
  .sta-doc .card p{font-size:12px}
  .sta-doc .card .you{font-size:11.5px;padding:7px 9px}
  .sta-doc .rows{box-shadow:none;break-inside:avoid}
  .sta-doc .rows .t,.sta-doc .rows .w{padding:8px 0;font-size:12px}
  .sta-doc .step{padding:12px}
  .sta-doc .box{box-shadow:none;padding:12px 16px}
  .sta-doc .box h3{margin-bottom:8px}
  .sta-doc .list li,.sta-doc .costs td{font-size:12.5px}
  .sta-doc .costs td{padding:4px 0}
  .sta-doc .price{box-shadow:none;padding:16px 18px;gap:20px}
  .sta-doc .price .big{font-size:32px}
  .sta-doc .price .sub{margin-bottom:12px}
  .sta-doc .price td{font-size:12.5px;padding:4px 0}
  .sta-doc .box .note{font-size:11px;margin-top:6px}
  .sta-doc .box .sum{margin:-8px 0 8px}
  .sta-doc .extra{margin:10px 0 0}
  .sta-doc .list{gap:6px}
  .sta-doc .box.extra .list{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px}
  .sta-doc .closing h2{font-size:18px;margin-bottom:6px}
  .sta-doc .closing p{font-size:12.5px}
  .sta-doc .sig{margin-top:6px;font-size:11.5px;line-height:1.5}
  .sta-doc .closing{padding:12px 20px;margin-top:10px;break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .sta-doc .closing .ctas{display:none}
  .sta-doc .fact,.sta-doc .card .you,.sta-doc .byline .pill{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* A4 е под 760px — връщаме двете колони, които мобилният изглед сгъва */
  .sta-doc .facts,.sta-doc .steps,.sta-doc .two,.sta-doc .price{grid-template-columns:1fr 1fr}
  .sta-doc .rows{grid-template-columns:auto 1fr;padding:6px 16px}
  .sta-doc .rows .t,.sta-doc .rows .w{border-top:1px dashed var(--rule-soft)}
  .sta-doc .rows .t{max-width:15ch}
  .sta-doc .rows .t:first-child,.sta-doc .rows .t:first-child+.w{border-top:0}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const FAKTI = [
  {
    h: "Парти агенция в Русе",
    p: "Правите партита и работите с „Фламинго“. Искате на тях да има хуманоиден робот — Unitree R1, който да е звездата на вечерта.",
  },
  {
    h: "Не говори български",
    p: "Вграденият глас на R1 не говори български. А гостите Ви ще искат да си говорят с него — на своя език.",
  },
  {
    h: "Отвътре е скъпо",
    p: "Собствена програма върху самия робот позволява само версията R1 EDU — най-скъпата, с цена при запитване. Това значи и работа по софтуера на робота.",
  },
  {
    h: "Затова — отвън",
    p: "Гласът живее в отделно устройство, закачено на робота. Двете не са свързани: модулът не командва робота, роботът не знае за модула.",
  },
];

const KAK = [
  {
    t: "Гостът говори",
    w: "Натиска бутона — или водещият го натиска вместо него — и казва нещо на робота. На български.",
  },
  {
    t: "Модулът чува",
    w: "Микрофонът е в модула, насочен към госта. Роботът не участва в това.",
  },
  {
    t: "AI решава",
    w: "Отговаря — или изпълнява задача: записва поздрав, пуска игра, приема запитване за парти. Това е Function AI — AI, който не само говори, а и върши неща.",
  },
  {
    t: "Роботът „отговаря“",
    w: "Гласът излиза от колонката на модула, закачена на робота — за гостите говори роботът. Движенията ги пуска водещият от дистанционното или приложението на робота, точно както и без модула.",
  },
];

const FUNKCII = [
  {
    n: "01",
    title: "Говори на български с гостите",
    body: "Поздравява, отговаря на въпроси, шегува се. Има име и характер, които избирате Вие — весел аниматор за детско парти, по-официален домакин за фирмено събитие. Знае какво предлага агенцията Ви.",
    you: "Гостите говорят с робота, а не само го гледат — и точно това разказват после.",
  },
  {
    n: "02",
    title: "Знае всяко парти",
    body: "Преди събитието водещият попълва кратка форма от телефона: за кого е партито, програмата, игрите, важните часове. Роботът знае кой е рожденикът и кога е тортата.",
    you: "Всяко парти е различно, без някой да пипа настройките.",
  },
  {
    n: "03",
    title: "Игри и поздрави",
    body: "Пуска викторина и брои точките. Записва поздравите на гостите за рожденика и след партито ги изпраща на домакините — събрани на едно място.",
    you: "Домакините си тръгват с подарък, който не са получавали от никоя друга агенция.",
  },
  {
    n: "04",
    title: "Водещият командва от телефона",
    body: `Водещият пише от телефона си „обяви тортата“ или „пусни викторината“ — и роботът го казва на глас точно тогава, със своя глас и характер.`,
    you: "Водещият не вика над музиката — роботът го прави вместо него.",
  },
  {
    n: "05",
    title: "Запитвания за нови партита",
    body: `Родител пита „колко струва такова парти?“. Роботът разказва накратко, записва името, телефона и желаната дата — и запитването влиза в CRM системата, където го виждате веднага.`,
    you: "Всяко парти носи следващото — и нито едно запитване не остава на салфетка.",
  },
];

const NEDOKOSNAT = [
  ["Без достъп до робота", "модулът не се свързва с него — нито с кабел, нито по Wi-Fi или Bluetooth."],
  ["Нищо не се инсталира", "софтуерът на робота остава фабричен и се обновява както досега."],
  [
    "Не Ви трябва R1 EDU",
    "щом не пипаме робота, вършат работа и R1 Air, и R1. Разликата в цената остава при Вас.",
  ],
  [
    "Закача се и се сваля за минута",
    "с колан или скоба, без инструменти и без пробиване. Модулът е лек, а на пробата проверяваме, че не пречи на движенията и равновесието.",
  ],
  ["Ако модулът спре", "роботът продължава да работи както от завода — просто замлъква на български."],
];

const CHESTNO = [
  {
    t: "Шумът",
    w: "Партито е шумно, а AI чува всичко наоколо. Затова говоренето е с бутон: натиснеш — роботът слуша теб; пуснеш — отговаря. Пробваме го в истински шум, с музика и деца, преди да Ви го предадем.",
  },
  {
    t: "Интернетът",
    w: "Модулът е със собствена SIM карта и мобилен интернет — не зависи от Wi-Fi-а на залата.",
  },
  {
    t: "Батерията",
    w: "Модулът е на своя батерия, която стига за цяло парти. Батерията на самия робот е отделна — по данни на Unitree е около час, със сменяема батерия.",
  },
  {
    t: "Децата",
    w: "Агентът говори с децата спокойно и безопасно, не ги пита за лични данни, а телефон за запитване записва само от възрастен.",
  },
  {
    t: "Какво казва",
    w: "Само това, което сте одобрили. Всеки разговор се вижда в системата — ако нещо не звучи както трябва, го оправяме.",
  },
];

const VIBER = [
  [
    "Възможно е",
    "през официалния бизнес канал на Viber, който има API. Обикновеният Viber акаунт не позволява автоматични съобщения, затова каналът се открива през лицензиран доставчик.",
  ],
  [
    "Пише и получава",
    "гостът, оставил телефона си на робота, получава съобщение с офертата Ви, а отговорът му влиза обратно в картона му в CRM-а.",
  ],
  [
    "Има месечна такса",
    "към доставчика на Viber — абонамент плюс съобщенията. Затова е по желание и не е в цената.",
  ],
  [
    "Кога",
    "най-смислено е след първите партита, когато се види колко запитвания идват от робота.",
  ],
];

const STAPKI = [
  {
    d: "Седмица 1",
    h: "Персонажът и функциите",
    p: "Разговор с Вас: кой е роботът, как говори, какво казва за агенцията, кои игри пуска. Купуваме устройството по списъка.",
  },
  {
    d: "Седмица 2",
    h: "Гласът и системата",
    p: "Настройваме гласа, знанието и функциите, формата за всяко парти и CRM системата. Изпитвате го от телефона — още преди роботът да е при Вас.",
  },
  {
    d: "Седмица 3",
    h: "Монтаж и проба на живо",
    p: "Закачаме модула на робота и го пробваме в шум — с музика, с бутона, с движения. Проверяваме батерията и равновесието.",
  },
  {
    d: "Първите партита",
    h: "Пускане и предаване",
    p: "Следим разговорите от първите партита и донастройваме. Водещите се обучават за половин час.",
  },
];

const POKRIVA = [
  "Гласът на български и персонажът",
  "Петте функции, настроени за агенцията",
  "Формата за всяко парти",
  "Командите от телефона на водещия",
  "CRM системата за запитванията",
  "Монтажът и пробата на живо",
  "Обучение на водещите",
  "Донастройка до предаването",
];

const USTROISTVO: [string, string][] = [
  ["Таблет с SIM карта и мобилен интернет", "200 – 240 €"],
  ["Микрофон и колонка за шумна зала", "140 – 300 €"],
  ["Бутон за говорене (Bluetooth)", "10 – 35 €"],
  ["Външна батерия", "≈ 30 €"],
  ["Стойка и колан за робота", "20 – 40 €"],
];

const MESECHNO: [string, string][] = [
  ["Гласът и AI — според часовете разговор", "≈ 25 – 110 €"],
  ["Мобилен интернет", "≈ 13 €"],
  ["Viber — по желание", "≈ 100 – 300 €"],
];

const IZVAN = [
  ["Роботът", "купувате го Вие — R1 Air или R1; версията EDU не е нужна."],
  ["Устройството", "по нашия списък, на Ваше име, по фактура на магазина."],
  [
    "Месечните такси",
    "плащат се директно на доставчиците, според реалната употреба. Сметката я правим заедно, когато знаем колко партита правите на месец.",
  ],
  [
    "Движения, синхронизирани с думите",
    "изискват достъп до робота (версия EDU). Ако някога го поискате, е отделна оферта.",
  ],
];

export default function StaniOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">Оферта · за Стани · парти агенция, Русе · 1 октомври 2026</p>
        <h1>
          Роботът ще говори на български. <em>Без да го отваряме.</em>
        </h1>
        <p className="deck">
          Отделен гласов модул, който се закача на Unitree R1, разговаря с гостите на български и
          върши задачи — пуска игри, записва поздрави, приема запитвания за нови партита. Роботът
          остава такъв, какъвто идва от завода: нищо по него не се отваря и нищо не се инсталира.
        </p>
        <p className="byline">
          <span className="pill">1 800 € с ДДС · + устройството</span>
          <span>За Стани · от Ивайло Петев, Pro Marketing</span>
          <a className="pdf" href={PDF}>
            Свали като PDF
          </a>
        </p>
      </header>

      <section>
        <p className="kick">Откъде тръгваме</p>
        <h2 className="h2sub">Това, което ми казахте по телефона</h2>
        <div className="facts">
          {FAKTI.map((f) => (
            <article className="fact" key={f.h}>
              <h3>{f.h}</h3>
              <p>{f.p}</p>
            </article>
          ))}
        </div>
        <div className="pull">
          <p>
            Искате роботът да е звездата на партито — и да си говори с гостите на техния език. Оттам
            започваме.
          </p>
          <span className="src">От разговора ни, 25 септември 2026</span>
        </div>
      </section>

      <section>
        <p className="kick">Как работи</p>
        <h2 className="h2sub">Роботът се движи, модулът говори</h2>
        <div className="rows">
          {KAK.map((r, i) => (
            <div style={{ display: "contents" }} key={r.t}>
              <div className="t">
                <i>{String(i + 1).padStart(2, "0")}</i>
                {r.t}
              </div>
              <div className="w">{r.w}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="sec-cards">
        <p className="kick">Какво прави</p>
        <h2 className="h2sub">Пет функции, разписани по точки</h2>
        <p className="lead">
          Всяка функция е отделна — кажете коя оставяте, коя махате и какво бихте добавили. Роботът
          прави само това, което сте одобрили.
        </p>
        <div className="cards">
          {FUNKCII.map((k) => (
            <article className="card" key={k.n}>
              <span className="num">{k.n}</span>
              <h3>{k.title}</h3>
              <p>{k.body}</p>
              <p className="you">
                <b>На партито:</b> {k.you}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Роботът остава недокоснат</p>
        <h2 className="h2sub">Модулът няма никакъв достъп до робота</h2>
        <div className="box">
          <ul className="list">
            {NEDOKOSNAT.map(([a, b]) => (
              <li key={a}>
                <i>✓</i>
                <span>
                  <b>{a}</b> — {b}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <p className="kick">Честно за партито</p>
        <h2 className="h2sub">Шумът, интернетът, батерията</h2>
        <div className="rows">
          {CHESTNO.map((r) => (
            <div style={{ display: "contents" }} key={r.t}>
              <div className="t">{r.t}</div>
              <div className="w">{r.w}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Viber и CRM</p>
        <h2 className="h2sub">Проверихме: Viber се свързва със системата</h2>
        <p className="lead">
          Запитванията от робота влизат в CRM системата и без Viber. Viber е следващата стъпка —
          човекът получава офертата Ви там, където и без това си пише.
        </p>
        <div className="box">
          <ul className="list">
            {VIBER.map(([a, b]) => (
              <li key={a}>
                <i>→</i>
                <span>
                  <b>{a}</b> — {b}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <p className="kick">Как минава</p>
        <h2 className="h2sub">Около три седмици, в четири стъпки</h2>
        <div className="steps">
          {STAPKI.map((s) => (
            <article className="step" key={s.d}>
              <span className="d">{s.d}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </article>
          ))}
        </div>
        <p className="note">
          Гласът и функциите не чакат робота — започваме веднага. Монтажът е, когато роботът
          пристигне при Вас.
        </p>
      </section>

      <section className="sec-price">
        <p className="kick">Цената</p>
        <h2 className="h2sub">Настройката — еднократно</h2>
        <div className="price">
          <div>
            <p className="big">
              1 800 €<small>с ДДС</small>
            </p>
            <p className="sub">1 500 € + 300 € ДДС · настройка, еднократно</p>
            <h3>Плащане на две вноски</h3>
            <table>
              <tbody>
                <tr>
                  <td>При старт</td>
                  <td className="v">900 €</td>
                </tr>
                <tr>
                  <td>При предаването — след пробата на живо с робота</td>
                  <td className="v">900 €</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3>Какво покрива</h3>
            <table>
              <tbody>
                {POKRIVA.map((r) => (
                  <tr key={r}>
                    <td>{r}</td>
                    <td className="v">✓</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="two extra">
          <div className="box">
            <h3>Устройството — отделно</h3>
            <p className="sum">около 400 – 650 € · еднократно</p>
            <table className="costs">
              <tbody>
                {USTROISTVO.map(([a, b]) => (
                  <tr key={a}>
                    <td>{a}</td>
                    <td className="v">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="note">Купува се на Ваше име, по наш списък. Цените са ориентировъчни, от български магазини.</p>
          </div>
          <div className="box">
            <h3>Месечни такси — към доставчиците</h3>
            <p className="sum">около 40 – 125 € на месец без Viber</p>
            <table className="costs">
              <tbody>
                {MESECHNO.map(([a, b]) => (
                  <tr key={a}>
                    <td>{a}</td>
                    <td className="v">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="note">Ориентировъчно — зависи от това колко партита правите и колко говори роботът.</p>
          </div>
        </div>

        <div className="box extra">
          <h3>Извън цената</h3>
          <ul className="list">
            {IZVAN.map(([a, b]) => (
              <li key={a}>
                <i>—</i>
                <span>
                  <b>{a}</b> — {b}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Прочетете я спокойно. Ако искате да добавите нещо — игра, функция, начин на говорене —
          кажете ми и ще го впишем. Решите ли, започваме с гласа веднага, още преди роботът да
          пристигне.
        </p>
        <p className="ctas">
          <a className="btn" href="viber://chat?number=%2B359876447159">
            Пишете ми във Viber
          </a>
          <a className="btn ghost" href="tel:+359876447159">
            0876 447 159
          </a>
        </p>
      </section>

      <p className="sig">
        <b>Ивайло Петев</b> · Pro Marketing
        <br />
        0876 447 159 · emmgivailopetev38@gmail.com · promarketing.pw
      </p>
    </main>
  );
}
