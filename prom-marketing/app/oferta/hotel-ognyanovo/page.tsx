/**
 * Оферта за Семеен хотел Огняново · Вили Куртов — 23.09.2026.
 *
 * Разговорът: пълна AI автоматизация на хотела за 5 900 € без ДДС. Тя поиска
 * да се раздели на две инсталации, затова цената е два етапа по 2 950 €,
 * всеки със свой измерим резултат и свое предаване.
 *
 * Всички числа за хотела са проверени на 23.09.2026 и са надписани с източника.
 * Числата в „Какво струва едно пропуснато обаждане“ са сметка по техните
 * публични цени, не обещание — така са и надписани на страницата.
 */

import { Fragment } from "react";

const PDF = "/oferta/hotel-ognyanovo/ProMarketing-za-Hotel-Ognyanovo.pdf";

const CSS = `
.og-doc{
  --ground:#F7F8F6; --panel:#EDF2F1; --surface:#FFFFFF;
  --ink:#12211F; --ink-2:#48605C; --ink-3:#7C908C;
  --rule:#DBE4E1; --rule-soft:#E9EFED;
  --accent:#0E6B70; --accent-soft:#DFEFEF; --accent-ink:#F3FBFB;
  --mint:#1E8558; --mint-soft:#E3F4EB;
  --gold:#96650F; --gold-soft:#FAF0DC;
  --rose:#A33A32; --rose-soft:#FBE8E5;
  --shadow:0 1px 2px rgba(18,33,31,.05), 0 10px 28px -18px rgba(18,33,31,.28);
  background:var(--ground); color:var(--ink);
  font-family:var(--og-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.og-doc *{box-sizing:border-box}
.og-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 96px}
.og-doc h1,.og-doc h2,.og-doc h3,.og-doc h4{font-family:var(--og-ui),Arial,sans-serif;letter-spacing:-.012em;text-wrap:balance}
.og-doc .mono{font-family:var(--og-mono),monospace;font-variant-numeric:tabular-nums}
.og-doc a{color:var(--accent);text-underline-offset:3px}
.og-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.og-doc p{margin:0}

/* ── шапка ── */
.og-doc .masthead{padding:56px 0 34px;border-bottom:1px solid var(--rule)}
.og-doc .eyebrow{font-family:var(--og-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.og-doc h1{font-size:44px;line-height:1.08;font-weight:700;margin:0 0 18px;max-width:21ch}
.og-doc h1 em{font-style:normal;color:var(--accent)}
.og-doc .deck{font-size:19px;line-height:1.55;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.og-doc .byline{display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center;font-family:var(--og-ui),sans-serif;font-size:14px;color:var(--ink-3)}
.og-doc .byline .pricepill{font-family:var(--og-mono),monospace;font-weight:500;font-size:14px;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:6px 14px}
.og-doc .byline .pdf{font-family:var(--og-ui),sans-serif;font-weight:600;text-decoration:none;border:1px solid var(--rule);border-radius:999px;padding:6px 14px;color:var(--ink)}
.og-doc .byline .pdf:hover{border-color:var(--accent)}

/* ── секции ── */
.og-doc section{margin:52px 0 0}
.og-doc .kick{font-family:var(--og-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin:0 0 10px}
.og-doc .h2sub{font-size:28px;line-height:1.2;font-weight:700;margin:0 0 14px;max-width:28ch}
.og-doc .lead{font-size:17px;color:var(--ink-2);max-width:68ch;margin:0 0 22px}
.og-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
.og-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px 22px 20px;box-shadow:var(--shadow)}
.og-doc .card.tint{background:var(--panel);box-shadow:none}
.og-doc .card h3{font-size:17px;font-weight:700;margin:0 0 8px}
.og-doc .card p{font-size:15px;line-height:1.55;color:var(--ink-2)}
.og-doc .card .num{font-family:var(--og-mono),monospace;font-size:12px;color:var(--accent);letter-spacing:.12em;display:block;margin:0 0 8px}
.og-doc .card .sees{margin:12px 0 0;padding:10px 12px;border-radius:9px;background:var(--accent-soft);font-size:13.5px;line-height:1.5;color:var(--ink)}
.og-doc .card .sees b{font-family:var(--og-ui),sans-serif;font-weight:600;color:var(--accent)}

/* ── факти ── */
.og-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:0 0 20px}
.og-doc .fact{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.og-doc .fact .n{font-family:var(--og-ui),sans-serif;font-weight:700;font-size:22px;line-height:1.1;margin:0 0 4px}
.og-doc .fact .l{font-size:13.5px;color:var(--ink-3);line-height:1.45}
.og-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px;margin:18px 0 0}
.og-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.og-doc .pull .src{display:block;margin-top:8px;font-family:var(--og-ui),sans-serif;font-size:13px;color:var(--ink-3)}

/* ── находките ── */
.og-doc .finds{display:flex;flex-direction:column;gap:11px}
.og-doc .find{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:start;background:var(--surface);border:1px solid var(--rule);border-radius:13px;padding:18px 20px;box-shadow:var(--shadow)}
.og-doc .find .badge{font-family:var(--og-mono),monospace;font-size:15px;font-weight:500;white-space:nowrap;padding:5px 11px;border-radius:8px;background:var(--rose-soft);color:var(--rose)}
.og-doc .find.ok .badge{background:var(--mint-soft);color:var(--mint)}
.og-doc .find h3{font-size:16.5px;margin:0 0 5px}
.og-doc .find p{font-size:15px;line-height:1.55;color:var(--ink-2)}
.og-doc .find p b{color:var(--ink);font-weight:600}

/* ── етапите ── */
.og-doc .stage{background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:28px;box-shadow:var(--shadow);margin:0 0 16px}
.og-doc .stage .top{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:baseline;justify-content:space-between;border-bottom:1px solid var(--rule-soft);padding-bottom:16px;margin-bottom:18px}
.og-doc .stage .tag{font-family:var(--og-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);background:var(--gold-soft);border-radius:999px;padding:5px 12px}
.og-doc .stage h3{font-size:25px;line-height:1.2;margin:10px 0 6px;max-width:24ch}
.og-doc .stage .sub{font-size:15.5px;color:var(--ink-2);max-width:60ch}
.og-doc .stage .amount{font-family:var(--og-ui),sans-serif;font-weight:700;font-size:34px;line-height:1;color:var(--accent);white-space:nowrap}
.og-doc .stage .amount small{display:block;font-family:var(--og-mono),monospace;font-size:12px;font-weight:400;color:var(--ink-3);margin-top:6px;letter-spacing:.04em}
.og-doc table.rows{width:100%;border-collapse:collapse;font-size:15.5px}
.og-doc table.rows th{font-family:var(--og-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);text-align:left;padding:0 0 9px}
.og-doc table.rows th.r{text-align:right}
.og-doc table.rows td{padding:12px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.og-doc table.rows td b{display:block;color:var(--ink);font-weight:600;font-size:16px;margin-bottom:3px}
.og-doc table.rows td.v{font-family:var(--og-mono),monospace;color:var(--ink);text-align:right;white-space:nowrap;padding-left:18px}
.og-doc table.rows tr.sum td{border-top:2px solid var(--rule);font-weight:600;color:var(--ink)}
.og-doc table.rows tr.sum td.v{font-size:17px;color:var(--accent)}
.og-doc .result{margin:18px 0 0;padding:14px 16px;border-radius:11px;background:var(--mint-soft);font-size:15px;line-height:1.55;color:var(--ink)}
.og-doc .result b{font-family:var(--og-ui),sans-serif;font-weight:600;color:var(--mint)}

/* ── денят ── */
.og-doc .day{display:grid;grid-template-columns:auto 1fr;gap:0 18px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.og-doc .day .t{font-family:var(--og-mono),monospace;font-size:14px;color:var(--accent);padding:14px 0;border-top:1px dashed var(--rule-soft);white-space:nowrap}
.og-doc .day .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule-soft)}
.og-doc .day .t:first-child,.og-doc .day .t:first-child+.w{border-top:0}
.og-doc .day .w b{color:var(--ink);font-weight:600}
.og-doc .note{font-size:13.5px;color:var(--ink-3);margin:10px 0 0;max-width:70ch}

/* ── въпросите ── */
.og-doc .qa{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:24px;margin:0 0 12px;box-shadow:var(--shadow)}
.og-doc .qa .q{font-family:var(--og-ui),sans-serif;font-weight:700;font-size:18px;color:var(--ink);margin:0 0 10px}
.og-doc .qa p+p{margin-top:11px}
.og-doc .qa p{font-size:15.5px;line-height:1.6;color:var(--ink-2)}
.og-doc .qa p b{color:var(--ink);font-weight:600}
.og-doc .verdict{display:inline-block;font-family:var(--og-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.1em;text-transform:uppercase;padding:5px 11px;border-radius:999px;margin:0 0 12px}
.og-doc .verdict.yes{background:var(--mint-soft);color:var(--mint)}
.og-doc .verdict.cond{background:var(--gold-soft);color:var(--gold)}

/* ── списъци ── */
.og-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.og-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px}
.og-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15px;line-height:1.5;color:var(--ink-2)}
.og-doc .list li i{font-style:normal;color:var(--mint);font-weight:700}
.og-doc .list.no li i{color:var(--ink-3)}
.og-doc .list li b{color:var(--ink);font-weight:600}

/* ── цената ── */
.og-doc .pay{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.og-doc .pay .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.og-doc .pay .box h3{font-size:16px;margin:0 0 12px}
.og-doc .pay .big{font-family:var(--og-ui),sans-serif;font-weight:700;font-size:40px;line-height:1;margin:0 0 6px;color:var(--ink)}
.og-doc .pay .big small{font-size:17px;font-weight:600;color:var(--ink-3);margin-left:6px}
.og-doc .pay .vat{font-family:var(--og-mono),monospace;font-size:13px;color:var(--ink-3);margin:0 0 14px}
.og-doc .opt{margin:14px 0 0;padding:14px 16px;border-radius:11px;background:var(--panel);font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.og-doc .opt b{color:var(--ink);font-weight:600}

/* ── пробвайте го сега ── */
.og-doc .tryit{background:linear-gradient(180deg,#0E6B70,#0B585C);color:#F3FBFB;border-radius:16px;padding:30px}
.og-doc .tryit h3{color:#fff;font-size:24px;margin:0 0 10px;max-width:26ch}
.og-doc .tryit p{font-size:16px;line-height:1.6;color:rgba(255,255,255,.88);max-width:62ch}
.og-doc .tryit p+p{margin-top:11px}
.og-doc .tryit .phone{display:inline-block;font-family:var(--og-mono),monospace;font-size:26px;font-weight:500;color:#fff;text-decoration:none;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);border-radius:12px;padding:12px 20px;margin:18px 0 10px}
.og-doc .tryit .warn{font-size:14.5px;line-height:1.55;color:#FAF0DC;background:rgba(255,255,255,.1);border-left:3px solid #F0C560;border-radius:0 10px 10px 0;padding:13px 16px;margin:12px 0 0;max-width:62ch}
.og-doc .tryit .warn b{color:#fff;font-weight:600}
.og-doc .tryit .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.og-doc .tryit a.btn{font-family:var(--og-ui),sans-serif;font-weight:600;text-decoration:none;color:var(--accent);background:#fff;border-radius:10px;padding:12px 18px;font-size:15px}
.og-doc .tryit a.ghost{color:#fff;background:transparent;border:1px solid rgba(255,255,255,.5)}

/* ── доказателства ── */
.og-doc .proofs{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:13px}
.og-doc .proof{background:var(--surface);border:1px solid var(--rule);border-radius:13px;padding:20px;box-shadow:var(--shadow)}
.og-doc .proof .who{font-family:var(--og-ui),sans-serif;font-weight:700;font-size:16.5px;color:var(--ink);margin:0 0 3px}
.og-doc .proof .what{font-family:var(--og-ui),sans-serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin:0 0 10px}
.og-doc .proof p.d{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.og-doc .proof .chk{margin:12px 0 0;padding-top:11px;border-top:1px solid var(--rule-soft);font-size:13.5px;line-height:1.5;color:var(--ink-3)}
.og-doc .proof .chk b{font-family:var(--og-ui),sans-serif;font-weight:600;color:var(--accent)}

/* ── следваща стъпка ── */
.og-doc .closing{background:var(--accent);color:var(--accent-ink);border-radius:16px;padding:30px 30px 26px;margin-top:52px}
.og-doc .closing h2{color:#fff;font-size:26px;margin:0 0 10px;max-width:24ch}
.og-doc .closing p{font-size:16.5px;line-height:1.6;color:rgba(255,255,255,.9);max-width:64ch}
.og-doc .closing p+p{margin-top:12px}
.og-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.og-doc .closing a.btn{font-family:var(--og-ui),sans-serif;font-weight:600;text-decoration:none;color:var(--accent);background:#fff;border-radius:10px;padding:12px 18px;font-size:15px}
.og-doc .closing a.ghost{color:#fff;background:transparent;border:1px solid rgba(255,255,255,.55)}
.og-doc .sig{margin:26px 0 0;font-family:var(--og-ui),sans-serif;font-size:13.5px;color:var(--ink-3);line-height:1.6}

@media (max-width:820px){
  .og-doc h1{font-size:33px}
  .og-doc .two,.og-doc .pay{grid-template-columns:1fr}
  .og-doc .masthead{padding:36px 0 26px}
  .og-doc .stage{padding:22px}
  .og-doc .stage .amount{font-size:30px}
  .og-doc .find{grid-template-columns:1fr;gap:9px}
  .og-doc .find .badge{justify-self:start}
  .og-doc table.rows td b{font-size:15.5px}
}
@media print{
  .og-doc{background:#fff;font-size:11pt}
  .og-doc .wrap{max-width:none;padding:0 0 12mm}
  .og-doc section{margin-top:9mm;break-inside:avoid}
  .og-doc .stage,.og-doc .qa,.og-doc .find,.og-doc .card,.og-doc .day{break-inside:avoid;box-shadow:none}
  .og-doc .byline .pdf{display:none}
  .og-doc h1{font-size:26pt}
  .og-doc .h2sub{font-size:16pt}
  .og-doc .closing{background:#0E6B70 !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
`;

const FAKTI = [
  ["9,2 от 10", "Оценка в Booking.com от 116 отзива. Това е над всичко в Огняново — истинският Ви капитал."],
  ["19 стаи · 95 – 240 €", "Публичните Ви цени за нощувка. Една спасена резервация за две нощи е около 220 €."],
  ["116 отзива, всички на български", "За хотел с минерална вода на два часа от Гърция. Чужденецът още не Ви е намерил."],
  ["2015 · 3 звезди", "Десет години работа, СПА център, два басейна, ресторант за 150 души."],
];

const NAHODKI = [
  {
    badge: "41 MB",
    title: "Началната страница тежи 41 мегабайта",
    body: "Осем снимки по 3 – 5 MB всяка. Препоръката на Google е под 2 MB. Сайтът отговаря за 4,9 секунди от компютър и 3,8 от телефон. Човек с обикновен мобилен интернет в асансьора или в колата не дочаква — затваря и отива при съседа.",
  },
  {
    badge: "Няма",
    title: "Няма пиксел на Facebook и няма Google Analytics",
    body: "Днес не можете да разберете колко души влизат в сайта, откъде идват и на коя страница спират. А всяка реклама, която пуснете, е сляпа: няма как да се покаже втори път на човека, който е гледал стаите и не е резервирал. Това е най-евтиният клиент на света и той просто си отива.",
  },
  {
    badge: "bg-BG",
    title: "Сайтът съществува само на български",
    body: "Гърция е на два часа път, Солун — на три. Гръцките и румънските гости пътуват точно за минерална вода. Приставката за превод вече е инсталирана, но не е пусната. Затова и 116-те отзива в Booking са изцяло български.",
  },
  {
    badge: "Форма",
    title: "Резервация се прави само през човек",
    body: "Сайтът има формуляр за контакт. Човекът пише, после чака. Ако пише в събота вечер или в 23:10, чака до сутринта. През това време Booking.com му предлага три други хотела в Огняново — и взима комисионна, когато избере някой от тях.",
  },
  {
    badge: "Добро",
    title: "Всичко останало си е на място",
    ok: true,
    body: "Персонал 9,2. Чистота, храна, басейни — отзивите повтарят едно и също и то е хубаво. Продуктът работи. Липсва само машината, която го показва на повече хора и им отговаря навреме.",
  },
];

const ETAP1 = [
  [
    "Гласов агент на рецепцията",
    "Вдига от първото позвъняване, 24 часа, включително когато рецепцията е заета с гост на място. Говори български, английски и гръцки. Казва цени, какво включва престоят, какво има в СПА-то, колко е до Банско. Проверява свободни ли са датите, записва резервацията или заявката за обратно обаждане. Прехвърля на жив човек, когато разговорът го иска.",
    "1 100 €",
  ],
  [
    "Агент в сайта",
    "Същият агент, но в прозорче в сайта. Отговаря на въпросите, показва стаите, води до резервация и взима имейла и телефона, преди човекът да си тръгне. Работи и на английски.",
    "500 €",
  ],
  [
    "Имейлите — без чакане",
    "Всяко запитване получава отговор за минути, със свободните дати и цената. После: потвърждение, писмо три дни преди пристигане с упътване и какво да очакват, писмо след напускане с молба за отзив. Агентът чете и входящите и подготвя отговора — Вие само одобрявате.",
    "450 €",
  ],
  [
    "Едно табло за рецепцията",
    "Телефон, сайт, имейл, Facebook, Instagram и съобщенията от Booking се събират на един екран. Кой се е обадил, какво е питал, какво му е обещано, кой още чака отговор. Нищо не се губи в нечий телефон.",
    "350 €",
  ],
  [
    "Спешната поправка на сайта",
    "Свиваме 41-те мегабайта под два, без да се развали нито една снимка. Слагаме пиксела на Facebook и Google Analytics. Пускаме английската версия през приставката, която вече е платена. Добавяме истински бутон за резервация.",
    "300 €",
  ],
  [
    "Обучение на екипа · четири часа в хотела",
    "На живо, при Вас, с Вашите реални обаждания и запитвания. Рецепцията се учи да чете таблото, да поема разговор от агента и да го поправя, когато сбърка. Накрая всеки има кратък наръчник на една страница.",
    "250 €",
  ],
];

const ETAP2 = [
  [
    "Социалните мрежи вървят сами",
    "Двадесет публикации на месец за Facebook и Instagram — от Вашите снимки и видеа, по график, за целия месец напред. Сезонът, минералната вода, ресторантът, СПА-то, гостите. Вие виждате месеца предварително и махате каквото не Ви харесва.",
    "850 €",
  ],
  [
    "Агентът отговаря на коментари и съобщения",
    "Всеки въпрос под публикация и всяко съобщение в Messenger и Instagram получава отговор — с цена, със свободни дати, с покана да резервира. Днес част от тези хора не получават нищо.",
    "350 €",
  ],
  [
    "Рекламите, вече с очи",
    "Изграждаме кампаниите върху пиксела от Етап 1: хората, които са разглеждали стаите и не са резервирали, виждат хотела отново. Плюс кампании към София, Пловдив и Солун за минералната вода през зимата.",
    "650 €",
  ],
  [
    "Отзивите работят за Вас",
    "След всяко напускане тръгва молба за отзив — в Google и в Booking. На всеки нов отзив агентът предлага готов отговор. При 9,2 това е най-бързият начин да минете от 116 отзива на 300.",
    "300 €",
  ],
  [
    "Директните резервации",
    "Страница, която приема резервацията и капарото направо при Вас. Booking.com взима между 15 и 18 на сто — всяка резервация, минала оттук, ги оставя в хотела.",
    "450 €",
  ],
  [
    "Инфлуенсърите",
    "Подбран списък с български инфлуенсъри за пътувания и СПА, писмата до тях и договорките — най-често бартер срещу нощувки, не пари. Плюс правилата, за да не платите за празни числа.",
    "200 €",
  ],
  [
    "Обучение на екипа · втори курс",
    "Два часа върху мрежите, рекламите и отчета: кой одобрява месеца, как се чете какво работи, кога се пипа бюджетът и кога не. Наръчникът се допълва и остава при Вас.",
    "150 €",
  ],
];

const DENYAT = [
  ["07:40", "Гост звъни за свободна стая за уикенда. Рецепцията още подрежда закуската. <b>Агентът вдига</b>, казва цените, проверява датите и записва резервацията."],
  ["09:15", "Жена от Солун пише в сайта на английски. Агентът ѝ отговаря на английски, изпраща цените и я пита за колко души е."],
  ["11:00", "Публикацията за деня излиза във Facebook и Instagram — снимка на външния басейн. Никой не я е качвал на ръка."],
  ["13:30", "Мъж коментира под публикацията: „Цени?“. Агентът отговаря с цената и линк за резервация."],
  ["16:20", "Трима гости, които си заминаха вчера, получават писмо с благодарност и молба за отзив. Двама го пишат."],
  ["19:50", "Обаждане, докато рецепцията вечеря. Агентът вдига, отговаря, записва обратно обаждане за сутринта."],
  ["22:40", "Човек разглежда стаите в сайта и излиза. Утре ще види хотела в лентата си във Facebook."],
  ["08:00 · понеделник", "На телефона Ви влиза отчетът: колко обаждания, колко запитвания, колко резервации, колко пари."],
];

const VKLYUCHENO = [
  ["Всички акаунти са Ваши", "агентът, страниците, рекламният акаунт, данните — на Ваше име от първия ден"],
  ["Обучение на рецепцията", "два часа на живо, с Вашите реални обаждания"],
  ["Гласът и тонът", "агентът говори както говори хотелът, с Вашите думи и Вашите правила"],
  ["Записите на разговорите", "всеки разговор се пази и се чете, за да се поправя агентът"],
  ["Месечен отчет", "какво е влязло, откъде, и колко е струвало"],
];

const NE_VKLYUCHENO = [
  ["Рекламният бюджет", "парите към Facebook се плащат директно от Вас, отделно от услугата"],
  ["Разговорното време", "телефонията и минутите на агента се плащат на доставчика — при хотел с Вашия обем обикновено 40 – 90 € на месец"],
  ["Нов сайт", "сегашният остава и се поправя; пълна преработка е отделен разговор"],
];

export default function HotelOgnyanovoPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <header className="masthead">
          <p className="eyebrow">Оферта · за Семеен хотел Огняново · 23 септември 2026</p>
          <h1>
            Хотелът вдига телефона винаги. Отговаря на всеки. <em>И се показва сам.</em>
          </h1>
          <p className="deck">
            Пълна AI автоматизация за Семеен хотел Огняново — телефон, сайт, имейли, рецепция и
            социални мрежи. Разделена на два етапа, както говорихме — цялата инсталация е 60 дни, всеки етап
            със свой резултат, свое обучение на екипа и свое предаване. Вторият тръгва само ако
            първият Ви е харесал.
          </p>
          <div className="byline">
            <span className="pricepill">2 × 2 950 € = 5 900 € без ДДС</span>
            <span>Ивайло Петев · Pro Marketing</span>
            <a className="pdf" href={PDF}>
              Свали като PDF
            </a>
          </div>
        </header>

        <section>
          <p className="kick">Откъде тръгваме</p>
          <h2 className="h2sub">Хотелът Ви е добър. Точно това прави пропуснатото толкова скъпо.</h2>
          <div className="facts">
            {FAKTI.map(([n, l]) => (
              <div className="fact" key={n}>
                <p className="n">{n}</p>
                <p className="l">{l}</p>
              </div>
            ))}
          </div>
          <div className="pull">
            <p>
              Когато продуктът е слаб, маркетингът е харчене. Когато продуктът е на 9,2 и персоналът
              е на 9,2, всяко обаждане, което никой не вдига, е пари, оставени на съседния хотел.
              Затова офертата започва от телефона, не от рекламата.
            </p>
            <span className="src">Booking.com, проверено на 23 септември 2026</span>
          </div>
        </section>

        <section>
          <p className="kick">Какво намерих, преди да Ви пиша</p>
          <h2 className="h2sub">Пет неща в сайта и в мрежите, измерени тази сутрин</h2>
          <p className="lead">
            Погледнах сайта, Booking и социалните Ви мрежи, за да не Ви предлагам наизуст. Четирите
            неща отдолу струват пари всеки ден. Петото е причината да си заслужава да се поправят.
          </p>
          <div className="finds">
            {NAHODKI.map((f) => (
              <article className={f.ok ? "find ok" : "find"} key={f.title}>
                <span className="badge">{f.badge}</span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <p className="kick">Преди да четете нататък</p>
          <h2 className="h2sub">Обадете се на агента сега. Не чакайте подпис.</h2>
          <p className="lead">
            Най-краткият път до решението не е през описание, а през слушалката. Този номер е живото
            демо на гласовия агент — свободен е в момента и отговаря на всеки.
          </p>
          <div className="tryit">
            <h3>Наберете и говорете с него както бихте говорили с рецепционист</h3>
            <a className="phone" href="tel:+14754269084">
              +1 475 426 9084
            </a>
            <p>
              Питайте го каквото Ви хрумне. Прекъснете го по средата. Сменете темата. Точно така ще
              го прави и гостът, който Ви търси в събота вечер.
            </p>
            <p className="warn">
              <b>Защо номерът е американски.</b> Това е демонстрационната линия — тя стои на
              американски номер, защото там се тества. При Вас агентът застава на{" "}
              <b>български номер</b>: или нов национален, или Вашият сегашен, така че гостът да
              вижда позната цифра и да няма разлика в цената на разговора. Американският номер е
              само за да го чуете днес.
            </p>
            <div className="ctas">
              <a className="btn" href="https://promarketing.pw/glas">
                Или го пробвайте с бутон в сайта
              </a>
              <a className="btn ghost" href="https://promarketing.pw/demo/hotel">
                Вижте хотелското демо на таблото
              </a>
            </div>
          </div>
          <p className="note">
            Хотелското демо на promarketing.pw/demo/hotel показва същото табло, което ще имате:
            обажданията, запитванията, резервациите и отзивите, които се движат в реално време.
            Числата в него са примерни — движението е истинското.
          </p>
        </section>

        <section>
          <p className="kick">Етап 1 · дни 1 – 30</p>
          <div className="stage">
            <div className="top">
              <div>
                <span className="tag">Инсталация 1</span>
                <h3>Хотелът отговаря сам — на телефона, в сайта и по имейла</h3>
                <p className="sub">
                  Всичко, което хваща търсенето, което вече идва към Вас и днес се разлива. Това е
                  етапът, който се изплаща най-бързо, затова е първи.
                </p>
              </div>
              <div className="amount">
                2 950 €<small>без ДДС</small>
              </div>
            </div>
            <table className="rows">
              <thead>
                <tr>
                  <th>Дейност</th>
                  <th className="r">Стойност</th>
                </tr>
              </thead>
              <tbody>
                {ETAP1.map(([t, d, v]) => (
                  <tr key={t}>
                    <td>
                      <b>{t}</b>
                      {d}
                    </td>
                    <td className="v">{v}</td>
                  </tr>
                ))}
                <tr className="sum">
                  <td>Етап 1 общо</td>
                  <td className="v">2 950 €</td>
                </tr>
              </tbody>
            </table>
            <p className="result">
              <b>Резултатът, който ще видите · </b>
              Нито едно обаждане на земята. Всяко запитване — отговорено за минути, по всяко време
              на денонощието. И за първи път ще знаете колко души влизат в сайта Ви и колко от тях
              питат за стая.
            </p>
          </div>

          <div className="stage">
            <div className="top">
              <div>
                <span className="tag">Инсталация 2</span>
                <h3>Хотелът се показва сам — мрежи, реклама, отзиви, директни резервации</h3>
                <p className="sub">
                  Вторият етап стои върху първия: рекламите ползват пиксела, отзивите ползват
                  писмата, резервациите влизат в таблото. Тръгва, когато кажете.
                </p>
              </div>
              <div className="amount">
                2 950 €<small>без ДДС</small>
              </div>
            </div>
            <table className="rows">
              <thead>
                <tr>
                  <th>Дейност</th>
                  <th className="r">Стойност</th>
                </tr>
              </thead>
              <tbody>
                {ETAP2.map(([t, d, v]) => (
                  <tr key={t}>
                    <td>
                      <b>{t}</b>
                      {d}
                    </td>
                    <td className="v">{v}</td>
                  </tr>
                ))}
                <tr className="sum">
                  <td>Етап 2 общо</td>
                  <td className="v">2 950 €</td>
                </tr>
              </tbody>
            </table>
            <p className="result">
              <b>Резултатът, който ще видите · </b>
              Хотелът публикува без Вас, отговаря без Вас и събира отзиви без Вас. Рекламата се
              връща при хората, които вече са Ви гледали. А резервациите започват да влизат и
              директно, без комисионна.
            </p>
          </div>
        </section>

        <section>
          <p className="kick">Един ден в хотела със системата</p>
          <h2 className="h2sub">Примерен петък през септември</h2>
          <div className="day">
            {DENYAT.map(([t, w]) => (
              <Fragment key={t}>
                <span className="t mono">{t}</span>
                <span className="w" dangerouslySetInnerHTML={{ __html: w }} />
              </Fragment>
            ))}
          </div>
          <p className="note">
            Часовете са примерни. Сметката не е: при Вашите публични цени една спасена резервация за
            две нощи в двойна стая е около 220 €. Двадесет и седем такива за година покриват целите
            5 900 €.
          </p>
        </section>

        <section>
          <p className="kick">Трите неща, за които ме попитахте</p>
          <h2 className="h2sub">Честните отговори, включително къде е границата</h2>

          <div className="qa">
            <span className="verdict cond">Да, но първо оглед</span>
            <p className="q">Може ли изкуствен интелект да гледа камерите вместо пазача?</p>
            <p>
              Технологията съществува и работи: системата гледа потоците, разпознава движение и
              известява на телефон за секунди, без да заспива и без да ѝ доскучава. За хотел с двор,
              паркинг и басейни това е реална полза.
            </p>
            <p>
              <b>Къде е границата.</b> Няма да Ви дам цена по телефона, защото всяка такава цена е
              измислена. Колко пъти на нощ ще се задейства зависи от Вашите камери, от котките и
              кучетата в двора, от насекомите около инфрачервените прожектори. Разликата между добро
              и лошо предположение е петорна. Затова редът е: <b>две седмици измерване на живо, и
              чак тогава цена</b>, която ще устои.
            </p>
            <p>
              <b>И още нещо, което трябва да знаете.</b> По българския закон видеонаблюдението и
              мониторният контрол са част от лицензираната охранителна дейност. Това, което ще Ви
              направя, е допълнително око, което вижда и известява — то не е охрана и не замества
              човека, който реагира. Работи заедно с него и му спестява безсънното гледане в екран.
            </p>
          </div>

          <div className="qa">
            <span className="verdict cond">Да, ако системата има достъп</span>
            <p className="q">Може ли хотелът и вратите да се управляват с AI?</p>
            <p>
              Да — и точно това Ви казах по телефона. Условието е едно: системата за ключовете и
              програмата на рецепцията трябва да позволяват външна връзка. Модерните хотелски
              брави и програми я имат; въпросът е само коя е Вашата и дали доставчикът ще даде
              достъп.
            </p>
            <p>
              Когато го има, работи така: гостът резервира, получава кода си сам, кодът се отваря в
              часа на настаняване и умира в часа на напускане. Без чакане на рецепцията в един през
              нощта, без изгубени карти. <b>Първата стъпка е половин час с човека, който Ви
              поддържа системата</b> — за да видя какво дава. Ако дава, следва отделна оферта;
              ако не дава, ще Ви го кажа направо.
            </p>
          </div>

          <div className="qa">
            <span className="verdict yes">Да, добавя се по-късно</span>
            <p className="q">А пълна AI рецепция?</p>
            <p>
              Етап 1 вече поема най-тежката част от рецепцията — обажданията, запитванията и
              имейлите. Пълната AI рецепция е стъпката след това: настаняване, регистър на гостите,
              сметки, връзка с програмата, с която работите.
            </p>
            <p>
              Нарочно не я слагам в тези 5 900 €. Тя иска същия оглед като вратите и се добавя
              спокойно после, върху вече работещата система — без нищо от направеното да се
              преправя.
            </p>
          </div>
        </section>

        <section>
          <p className="kick">С кого работим</p>
          <h2 className="h2sub">Пет неща, които не са разказ — може да ги отворите и проверите</h2>
          <p className="lead">
            Поискахте доказателства и сте права да ги поискате. Отдолу са истински системи за
            истински фирми. Двете най-важни — гласовият агент и таблото — вече ги пробвахте
            по-горе, без да питате никого.
          </p>
          <div className="proofs">
            <article className="proof">
              <p className="who">Екологика България</p>
              <p className="what">CRM система · от нулата</p>
              <p className="d">
                Фирма за третиране на отпадъци с национално покритие. Построихме ѝ цялата система за
                управление: три модула, единадесет фирмени бланки, които излизат готови за подпис, и
                над 24 000 записа, пренесени от старата ѝ програма, без да се загуби ред.
              </p>
              <p className="chk">
                <b>Защо Ви засяга · </b>Това е същият вид система, в която ще влизат Вашите гости,
                резервации и разговори.
              </p>
            </article>

            <article className="proof">
              <p className="who">ProMarketing CRM</p>
              <p className="what">Нашата собствена система</p>
              <p className="d">
                Не Ви продаваме нещо, което сами не ползваме. Целият ни бизнес върви в системата,
                която ще получите: контактите, обажданията, офертите, фактурите, срещите и
                напомнянията. Този документ, който четете, е издаден от нея.
              </p>
              <p className="chk">
                <b>Защо Ви засяга · </b>Всяка грешка в нея боли първо нас, затова е изгладена.
              </p>
            </article>

            <article className="proof">
              <p className="who">Спи, мило дете</p>
              <p className="what">Реклама в Meta</p>
              <p className="d">
                Марка за детски стоки. От рекламните кампании влязоха 246 запитвания при средна цена
                от 0,23 € на запитване. Числото е от рекламния акаунт, не от преразказ — и ще Ви го
                покажа на екран, ако поискате.
              </p>
              <p className="chk">
                <b>Защо Ви засяга · </b>Същият подход стои зад кампаниите в Етап 2.
              </p>
            </article>

            <article className="proof">
              <p className="who">Alineé Fragrances</p>
              <p className="what">Реклами и видео · месечно</p>
              <p className="d">
                Онлайн магазин за парфюми. Водим рекламите и произвеждаме видеата всеки месец.
                Работата е постоянна, не еднократна — точно както ще бъде и при хотел, където
                сезоните се сменят.
              </p>
              <p className="chk">
                <b>Защо Ви засяга · </b>Показва, че оставаме след инсталацията.
              </p>
            </article>

            <article className="proof">
              <p className="who">1 Метър Шоколад</p>
              <p className="what">Съдържание за мрежите</p>
              <p className="d">
                Български производител. Шест рекламни клипа и месечно съдържание за социалните
                мрежи. Клиповете са живи и можете да ги видите в страниците на марката.
              </p>
              <p className="chk">
                <b>Защо Ви засяга · </b>Това е видът съдържание, който ще излиза за хотела всеки
                месец.
              </p>
            </article>

            <article className="proof">
              <p className="who">Телефон на клиент</p>
              <p className="what">Най-честната препоръка</p>
              <p className="d">
                Ако след всичко това искате да чуете човек, който ни е плащал — кажете в кой бранш и
                ще Ви свържа. Ще питате каквото решите, без мен на линията.
              </p>
              <p className="chk">
                <b>Защо Ви засяга · </b>Никое описание не тежи колкото чужд глас.
              </p>
            </article>
          </div>
        </section>

        <section>
          <p className="kick">Какво влиза и какво не</p>
          <h2 className="h2sub">В цената, и трите неща, които нарочно са отвън</h2>
          <div className="two">
            <div className="card">
              <h3>Включено и в двата етапа</h3>
              <ul className="list">
                {VKLYUCHENO.map(([a, b]) => (
                  <li key={a}>
                    <i>✓</i>
                    <span>
                      <b>{a}</b> · {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card tint">
              <h3>Не е включено</h3>
              <ul className="list no">
                {NE_VKLYUCHENO.map(([a, b]) => (
                  <li key={a}>
                    <i>—</i>
                    <span>
                      <b>{a}</b> · {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section>
          <p className="kick">Цената и плащането</p>
          <h2 className="h2sub">Същите 50 на 50, за които говорихме — само че всяка половина носи резултат</h2>
          <div className="pay">
            <div className="box">
              <p className="big">
                5 900 €<small>общо</small>
              </p>
              <p className="vat mono">без ДДС · два етапа по 2 950 €</p>
              <h3>Как се плаща</h3>
              <table className="rows">
                <tbody>
                  <tr>
                    <td>
                      <b>При старта на Етап 1</b>
                      подписваме и започваме същата седмица
                    </td>
                    <td className="v">1 475 €</td>
                  </tr>
                  <tr>
                    <td>
                      <b>При предаването на Етап 1</b>
                      когато телефонът, сайтът и имейлите работят пред очите Ви
                    </td>
                    <td className="v">1 475 €</td>
                  </tr>
                  <tr>
                    <td>
                      <b>При старта на Етап 2</b>
                      само ако решите да продължите
                    </td>
                    <td className="v">1 475 €</td>
                  </tr>
                  <tr>
                    <td>
                      <b>При предаването на Етап 2</b>
                      с първия месечен отчет в ръка
                    </td>
                    <td className="v">1 475 €</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="box">
              <h3>Срокове · цялата инсталация за 60 дни</h3>
              <table className="rows">
                <tbody>
                  <tr>
                    <td>
                      <b>Етап 1 · дни 1 – 30</b>
                      Телефонът, сайтът, имейлите и таблото. Агентът вдига още от петия ден —
                      останалото време е донастройване по това, което чуваме в реалните разговори.
                    </td>
                    <td className="v">30 дни</td>
                  </tr>
                  <tr>
                    <td>
                      <b>Етап 2 · дни 31 – 60</b>
                      Мрежите, рекламите, отзивите и директните резервации. Първите публикации
                      излизат до десет дни след старта на етапа.
                    </td>
                    <td className="v">30 дни</td>
                  </tr>
                  <tr className="sum">
                    <td>От подписа до напълно работещ хотел</td>
                    <td className="v">60 дни</td>
                  </tr>
                </tbody>
              </table>
              <p className="opt" style={{ marginTop: 12 }}>
                <b>Паузата между двата етапа е Ваше право.</b> Ако Ви трябва време да прецените,
                Етап 1 продължава да работи сам и не Ви чака. Шейсетте дни важат, когато вървим
                един след друг.
              </p>
              <p className="opt">
                <b>Тази оферта важи до 23 октомври 2026.</b> Не заради натиск, а защото зимният
                сезон за минерална вода започва през ноември и всичко от Етап 1 трябва да работи
                преди него, за да Ви свърши работа тази година.
              </p>
            </div>
          </div>
        </section>

        <div className="closing">
          <h2>Следващата стъпка е половин час, и той е безплатен</h2>
          <p>
            Ако кажете „да“, започваме с половин час на живо или по телефона: как да звучи агентът,
            кои са Вашите цени и правила, кой от екипа поема таблото. Още същата седмица тръгва
            Етап 1 — и още преди да е готов, ще чувате агента да вдига.
          </p>
          <p>
            Ако искате първо да го чуете как звучи, кажете ми и ще Ви се обадя с него преди всякакъв
            подпис. Така ще решавате по нещо, което сте чули, а не по описание.
          </p>
          <div className="ctas">
            <a className="btn" href="tel:+359877399963">
              Обадете ми се · 0877 399 963
            </a>
            <a className="btn ghost" href="mailto:ivailo@promarketing.pw?subject=Хотел%20Огняново%20—%20започваме">
              Пишете ми на имейл
            </a>
            <a className="btn ghost" href={PDF}>
              Свалете офертата като PDF
            </a>
          </div>
        </div>

        <p className="sig">
          Ивайло Петев · Pro Marketing LTD · promarketing.pw
          <br />
          Офертата е изготвена за Вили Куртов и Семеен хотел Огняново на 23 септември 2026. Данните
          за хотела са от hotelognyanovo.com и Booking.com, проверени същия ден. Всички цени са без
          ДДС.
        </p>
      </div>
    </>
  );
}
