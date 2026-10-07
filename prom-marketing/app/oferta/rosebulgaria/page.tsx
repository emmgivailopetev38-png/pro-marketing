/**
 * Оферта за RoseBulgaria (rosebulgaria.eu) — хранителна добавка с българска роза и
 * пробиотици в капсули. Клиент: Стойко Стойков (счетоводител, решава заедно с брат си).
 *
 * Срещата (07.10.2026, 20 мин): първо искали вода с роза, но маслото и водата не се
 * хомогенизират без химикали → капсула; идеята е бранд (по-нататък и лавандула). Реклама
 * само в Meta от април, ~3–4 пълни месеца с прекъсвания, около 35 € на ден, 20–30 продажби
 * на месец максимум, 1 € реклама връща около 0,70 €. Неговата AI реклама продава повече от
 * UGC рекламата с момиче; иска да одобрява рекламите предварително. Пазарът на добавки в ЕС
 * ~30 млрд. — неговото число. Хостингът (SuperHosting) изтича до ~15 дни.
 *
 * Цената е казана от Ивайло: 450 € без ДДС на месец (540 € с ДДС), месечно по фактура;
 * бюджетът за Meta се плаща директно с неговата карта. Число за продажбите НЕ обещаваме —
 * 70–80 на месец е посока. AI гласовият агент не е в плана. Хостингът и преместването —
 * без цена тук, уточняват се по телефона.
 *
 * Обръщението е на „Вие“.
 */

const PDF = "/oferta/rosebulgaria/ProMarketing-za-RoseBulgaria.pdf";

const CSS = `
/* сайтът е тъмен (color-scheme: dark в globals.css) — тази страница е светла докрай,
   иначе в PDF-а полетата на листа излизат тъмни */
html:has(.rbg-doc),body:has(.rbg-doc){background:#FBF7F5;color-scheme:light}
.rbg-doc{
  --ground:#FBF7F5; --panel:#F4EAEA; --surface:#FFFFFF;
  --ink:#24171B; --ink-2:#55454B; --ink-3:#86767C;
  --rule:#E7DBDD; --rule-soft:#F0E7E8;
  --accent:#7A1F3D; --accent-soft:#F6E5EA; --rose:#A9445F;
  --gold:#8A5A22;
  --shadow:0 1px 2px rgba(36,23,27,.05), 0 10px 28px -18px rgba(70,20,38,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--rbg-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.rbg-doc *{box-sizing:border-box}
.rbg-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.rbg-doc h1,.rbg-doc h2{font-family:var(--rbg-body),Georgia,serif;font-weight:600;letter-spacing:-.012em;text-wrap:balance}
.rbg-doc h3{font-family:var(--rbg-ui),Arial,sans-serif;font-weight:700;letter-spacing:-.01em;text-wrap:balance}
.rbg-doc .mono{font-family:var(--rbg-mono),monospace;font-variant-numeric:tabular-nums}
.rbg-doc a{color:var(--accent);text-underline-offset:3px}
.rbg-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.rbg-doc p{margin:0}

/* ── шапка ── */
.rbg-doc .masthead{padding:58px 0 34px;border-bottom:1px solid var(--rule)}
.rbg-doc .eyebrow{font-family:var(--rbg-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--rose);margin:0 0 18px}
.rbg-doc h1{font-size:46px;line-height:1.1;margin:0 0 18px;max-width:22ch}
.rbg-doc h1 em{font-style:italic;color:var(--accent)}
.rbg-doc .deck{font-size:19px;line-height:1.56;color:var(--ink-2);max-width:62ch;margin:0 0 22px}
.rbg-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-family:var(--rbg-ui),sans-serif;font-size:14px;color:var(--ink-3)}
.rbg-doc .byline .pill{font-family:var(--rbg-mono),monospace;font-weight:500;font-size:14px;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:6px 14px}
.rbg-doc .byline a{font-weight:600}

/* ── секции ── */
.rbg-doc section{margin:52px 0 0}
.rbg-doc .kick{font-family:var(--rbg-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--rose);margin:0 0 10px}
.rbg-doc .h2sub{font-size:30px;line-height:1.2;margin:0 0 14px;max-width:30ch}
.rbg-doc .lead{font-size:17px;color:var(--ink-2);max-width:66ch;margin:0 0 22px}
.rbg-doc .note{font-size:13.5px;color:var(--ink-3);margin:10px 0 0}

/* ── къде сте сега ── */
.rbg-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 20px}
.rbg-doc .fact{background:var(--panel);border-radius:12px;padding:18px 20px}
.rbg-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.rbg-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.rbg-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px}
.rbg-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.rbg-doc .pull .src{display:block;margin-top:8px;font-family:var(--rbg-ui),sans-serif;font-size:13px;color:var(--ink-3)}

/* ── двете страни ── */
.rbg-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.rbg-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.rbg-doc .box .tag{font-family:var(--rbg-mono),monospace;font-size:12.5px;letter-spacing:.06em;color:var(--gold);margin:0 0 8px}
.rbg-doc .box h3{font-size:18px;margin:0 0 10px}
.rbg-doc .box > p{font-size:15px;line-height:1.56;color:var(--ink-2)}
.rbg-doc .box .note{margin-top:14px}
.rbg-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px}
.rbg-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15px;line-height:1.5;color:var(--ink-2)}
.rbg-doc .list li i{font-style:normal;color:var(--accent);font-weight:700}
.rbg-doc .list li b{color:var(--ink);font-weight:600}
.rbg-doc .aside{margin:14px 0 0;background:var(--accent-soft);border-radius:12px;padding:18px 22px}
.rbg-doc .aside h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.rbg-doc .aside p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── какво включва месецът ── */
.rbg-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.rbg-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px 22px 20px;box-shadow:var(--shadow)}
.rbg-doc .card .num{font-family:var(--rbg-mono),monospace;font-size:12px;color:var(--rose);letter-spacing:.12em;display:block;margin:0 0 8px}
.rbg-doc .card h3{font-size:17.5px;margin:0 0 8px}
.rbg-doc .card p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── редове: не е включено, сайтът ── */
.rbg-doc .rows{display:grid;grid-template-columns:auto 1fr;gap:0 18px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.rbg-doc .rows .t{font-family:var(--rbg-ui),sans-serif;font-weight:600;font-size:14.5px;color:var(--ink);padding:14px 0;border-top:1px dashed var(--rule);max-width:19ch}
.rbg-doc .rows .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule)}
.rbg-doc .rows .t:first-child,.rbg-doc .rows .t:first-child+.w{border-top:0}
.rbg-doc .rows .w b{color:var(--ink);font-weight:600}

/* ── първите 90 дни ── */
.rbg-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 16px}
.rbg-doc .step{background:var(--surface);border:1px solid var(--rule);border-top:3px solid var(--rose);border-radius:12px;padding:20px}
.rbg-doc .step .d{font-family:var(--rbg-mono),monospace;font-size:12px;letter-spacing:.1em;color:var(--gold);text-transform:uppercase;display:block;margin:0 0 7px}
.rbg-doc .step h3{font-size:16.5px;margin:0 0 7px}
.rbg-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── цената ── */
.rbg-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:28px;box-shadow:var(--shadow)}
.rbg-doc .price .big{font-family:var(--rbg-ui),sans-serif;font-weight:700;font-size:48px;line-height:1;margin:0 0 6px;color:var(--accent)}
.rbg-doc .price .big small{font-size:18px;font-weight:600;color:var(--ink-3);margin-left:8px;white-space:nowrap;display:inline-block}
.rbg-doc .price .sub{font-family:var(--rbg-mono),monospace;font-size:13px;color:var(--ink-3);margin:0 0 18px}
.rbg-doc .price h3{font-size:15px;margin:0 0 8px}
.rbg-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.rbg-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.rbg-doc .price td.v{font-family:var(--rbg-mono),monospace;color:var(--ink);text-align:right;white-space:nowrap;padding-left:14px}
.rbg-doc .price tr:first-child td{border-top:0}
.rbg-doc .price tr.sum td{border-top:1px solid var(--rule);color:var(--ink);font-weight:600}
.rbg-doc .price .list{margin:0 0 16px}
.rbg-doc .budget{background:var(--panel);border-radius:12px;padding:14px 16px}
.rbg-doc .budget h3{color:var(--accent);margin:0 0 4px}
.rbg-doc .budget p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── следващата стъпка ── */
.rbg-doc .closing{background:var(--accent-soft);border:1px solid #E9CBD4;border-left:4px solid var(--accent);border-radius:16px;padding:30px 32px 28px;margin-top:52px}
.rbg-doc .closing h2{color:var(--accent);font-size:28px;margin:0 0 10px}
.rbg-doc .closing p{font-size:17px;line-height:1.6;color:var(--ink);max-width:64ch}
.rbg-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.rbg-doc .closing a.btn{font-family:var(--rbg-ui),sans-serif;font-weight:600;text-decoration:none;color:#fff;background:var(--accent);border-radius:10px;padding:12px 18px;font-size:15px}
.rbg-doc .closing a.ghost{color:var(--accent);background:transparent;border:1px solid var(--accent)}
.rbg-doc .sig{break-inside:avoid;margin:26px 0 0;font-family:var(--rbg-ui),sans-serif;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.rbg-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .rbg-doc .wrap{padding:0 16px 72px}
  .rbg-doc h1{font-size:33px}
  .rbg-doc .h2sub{font-size:24px}
  .rbg-doc .deck{font-size:17.5px}
  .rbg-doc .two,.rbg-doc .price{grid-template-columns:1fr}
  .rbg-doc .cards{grid-template-columns:1fr}
  .rbg-doc .masthead{padding:36px 0 26px}
  .rbg-doc .price{padding:22px 18px}
  .rbg-doc .closing{padding:24px 20px}
  .rbg-doc .rows{grid-template-columns:1fr;padding:14px 18px}
  .rbg-doc .rows .t{padding:14px 0 0;border-top:1px dashed var(--rule);max-width:none}
  .rbg-doc .rows .w{padding:4px 0 14px;border-top:0}
  .rbg-doc .rows .t:first-child{border-top:0}
}
@media print{
  :root,html,body{color-scheme:light;background:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .rbg-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .rbg-doc .wrap{max-width:none;padding:0}
  .rbg-doc .masthead{padding:0 0 16px}
  .rbg-doc h1{font-size:30px;margin-bottom:12px}
  .rbg-doc .deck{font-size:14px}
  .rbg-doc .byline .pdf{display:none}
  .rbg-doc section{margin:18px 0 0;break-inside:avoid}
  .rbg-doc h1,.rbg-doc .deck,.rbg-doc .h2sub,.rbg-doc .lead{max-width:none}
  .rbg-doc .kick,.rbg-doc .h2sub,.rbg-doc .lead{break-after:avoid}
  .rbg-doc .h2sub{font-size:19px;margin-bottom:8px}
  .rbg-doc .lead{font-size:12.5px;margin-bottom:10px}
  .rbg-doc .fact,.rbg-doc .card,.rbg-doc .step,.rbg-doc .box,.rbg-doc .price,.rbg-doc .pull,.rbg-doc .aside,.rbg-doc .rows,.rbg-doc .budget{break-inside:avoid}
  .rbg-doc .fact p,.rbg-doc .step p{font-size:12px}
  .rbg-doc .pull p{font-size:13px}
  .rbg-doc .cards{grid-template-columns:repeat(3,1fr);gap:10px}
  .rbg-doc .card{padding:12px 14px;box-shadow:none}
  .rbg-doc .card .num{margin-bottom:4px}
  .rbg-doc .card h3{font-size:13.5px;margin-bottom:5px}
  .rbg-doc .card p{font-size:11.5px;line-height:1.48}
  .rbg-doc .rows{box-shadow:none}
  .rbg-doc .rows .t,.rbg-doc .rows .w{padding:6px 0;font-size:11.5px}
  .rbg-doc .step{padding:12px}
  .rbg-doc .box{box-shadow:none;padding:14px 16px}
  .rbg-doc .aside{padding:12px 16px;margin-top:10px}
  .rbg-doc .pull{padding:12px 18px}
  .rbg-doc .box h3{font-size:15px}
  .rbg-doc .box > p,.rbg-doc .aside p,.rbg-doc .budget p{font-size:12.5px}
  .rbg-doc .list li{font-size:12.5px}
  .rbg-doc .price{box-shadow:none;padding:16px 18px}
  .rbg-doc .price .big{font-size:36px}
  .rbg-doc .price td{font-size:12px;padding:5px 0}
  .rbg-doc .closing{padding:16px 20px;margin-top:18px;break-inside:avoid}
  .rbg-doc .closing h2{font-size:20px}
  .rbg-doc .closing p{font-size:13.5px}
  .rbg-doc .closing .ctas{display:none}
  .rbg-doc .fact,.rbg-doc .aside,.rbg-doc .budget,.rbg-doc .closing,.rbg-doc .byline .pill,.rbg-doc .step{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* A4 е под 760px — връщаме двете колони, които мобилният изглед сгъва */
  .rbg-doc .facts,.rbg-doc .two,.rbg-doc .price{grid-template-columns:1fr 1fr}
  .rbg-doc .steps{grid-template-columns:repeat(3,1fr)}
  .rbg-doc .rows{grid-template-columns:auto 1fr;padding:6px 16px}
  .rbg-doc .rows .t,.rbg-doc .rows .w{border-top:1px dashed var(--rule)}
  .rbg-doc .rows .t:first-child,.rbg-doc .rows .t:first-child+.w{border-top:0}
  .rbg-doc .rows .t{max-width:19ch}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const FAKTI = [
  {
    h: "От вода с роза до капсула",
    p: "Първата идея беше вода с роза, но маслото и водата не се хомогенизират без химикали. Така се роди капсулата — българска роза с пробиотици — и бранд, който може да расте, по-нататък и с лавандула.",
  },
  {
    h: "Meta от април, около 35 € на ден",
    p: "Реклама само във Facebook и Instagram — 3–4 пълни месеца, с прекъсвания, докато се правят настройки.",
  },
  {
    h: "20–30 продажби на месец",
    p: "Това е горната граница досега. По последната статистика всяко 1 € реклама връща около 0,70 € — рекламата засега е на минус.",
  },
  {
    h: "Историята продава повече от лицето",
    p: "Вашата AI реклама продава много повече от UGC рекламата с момиче. Прав сте: при такъв продукт историята на бранда тежи повече от лицето.",
  },
];

const TELEFON = [
  ["Потвърждение", "търговец звъни на всеки нов клиент и потвърждава поръчката."],
  ["Още една опаковка", "предлага втора — за него или за приятел."],
  ["Абонамент", "после звъни всеки месец и клиентът остава с бранда."],
];

const MESEC = [
  {
    n: "01",
    title: "Рекламите в Meta, управлявани всеки ден",
    body: "Facebook и Instagram: настройки, тестове и ежедневно следене. Спираме губещото, вдигаме работещото.",
  },
  {
    // 5 видеа — числото е от Стойко, Ивайло да потвърди
    n: "02",
    title: "5 рекламни видеа на месец",
    body: "Видеа с изкуствен интелект — днес не се различават от снимани — и видеа, сглобени от наличните Ви кадри и от стокови кадри.",
  },
  {
    n: "03",
    title: "Сценариите — от нас. Одобрението — от Вас.",
    body: "Пишем сценариите и Ви показваме всяка реклама, преди да тръгне. Нищо не излиза без Вашето „да“.",
  },
  {
    n: "04",
    title: "Органично съдържание",
    body: "Същите видеа излизат и като публикации във Facebook и Instagram. Така доверието в бранда се трупа във времето, а не само докато тече реклама.",
  },
  {
    n: "05",
    title: "Месечен отчет",
    body: "Колко е похарчено, колко продажби, колко струва една продажба, колко връща всяко 1 € реклама, какво спираме и какво пускаме. Следите работата ни черно на бяло — както поискахте.",
  },
  {
    n: "06",
    title: "Подход за повторните обаждания",
    body: "Скрипт и как да се звъни на новите клиенти, за да превръща Вашият екип първата покупка във втора и в абонамент.",
  },
];

const NE_E = [
  {
    t: "Рекламният бюджет",
    w: "Плаща се <b>директно на Meta</b>, с Вашата карта. Не минава през нас.",
  },
  {
    t: "Снимане на място",
    w: "Не идваме на живо да снимаме. Ако имате хора или модел, които да снимат — още по-добре: <b>сглобяваме и тези кадри</b>.",
  },
  {
    t: "Търговците на телефона",
    w: "Те са <b>Вашият екип</b>. Ние помагаме с подхода — хората не са в цената.",
  },
  {
    t: "AI гласов агент",
    w: "Не е част от плана. Може да се тества по-нататък.",
  },
  {
    t: "Хостинг и преместване на сайта",
    w: "Уточняваме отделно, по телефона — вижте „Сайтът и хостингът“ по-долу.",
  },
];

const DNI = [
  {
    d: "Седмици 1–2",
    h: "Преглед и първи тестове",
    p: "Преглеждаме рекламния акаунт, пиксела и сайта. Правим първите нови видеа и пускаме първите тестове.",
  },
  {
    d: "Месец 1",
    h: "Рекламата спира да губи",
    p: "Целта: от 0,70 € към поне 1 € върнат на всяко 1 € реклама.",
  },
  {
    d: "Месеци 2–3",
    h: "Растем върху работещото",
    p: "Вдигаме бюджета на рекламите, които работят, и включваме телефона за повторни покупки.",
  },
];

const SAIT = [
  {
    t: "Как е направен",
    w: "WordPress + WooCommerce + Elementor, тема Astra и LiteSpeed Cache, на <b>споделен хостинг</b> в SuperHosting.",
  },
  {
    t: "Първото отваряне",
    w: "На началната страница сървърът отговори за <b>3,7 сек</b> — само до първия байт.",
  },
  {
    t: "Повторните отваряния",
    w: "Около <b>0,8–1,0 сек</b>. Google смята за добро под 0,8 сек.",
  },
  {
    t: "Бърза SEO поправка",
    w: "Заглавието (title) на началната страница се повтаря два пъти.",
  },
  {
    t: "Препоръката",
    w: "При изтичането не подновявайте същия споделен план — минете на <b>по-силен WordPress хостинг с отделени ресурси</b>. Преместването можем да го поемем ние. Конкретния вариант и цената уточняваме по телефона, преди хостингът да изтече.",
  },
];

const V_CENATA = [
  "Управление на рекламите в Meta",
  "5 рекламни видеа на месец",
  "Органични публикации със същите видеа",
  "Месечен отчет",
  "Подход за повторните обаждания",
];

export default function RoseBulgariaOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">RoseBulgaria · план за растеж · 07.10.2026</p>
        <h1>
          Историята на розата вече продава. <em>Време е да носи печалба.</em>
        </h1>
        <p className="deck">
          План в две посоки: реклама във Facebook и Instagram, която първо спира да губи и после
          расте — и телефон, който превръща първата покупка във втора, трета и абонамент.
        </p>
        <p className="byline">
          <span className="pill">450 € без ДДС на месец</span>
          <span>За Стойко Стойков · от Ивайло Петев, Pro Marketing</span>
          <a className="pdf" href={PDF}>
            Свали като PDF
          </a>
        </p>
      </header>

      <section>
        <p className="kick">Къде сте сега</p>
        <h2 className="h2sub">Това, което ни разказахте на срещата</h2>
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
            Целта Ви е силен бранд на пазар, който по Вашата оценка е около 30{"\u00a0"}млрд. в ЕС.
            Попитахте какво поемаме, колко струва, за колко време стигаме 70–80 продажби на месец и
            каква е визията ни. Отговорите са по-долу — честно и с числа, които ще виждате сами
            всеки месец.
          </p>
          <span className="src">От срещата ни, 7 октомври 2026</span>
        </div>
      </section>

      <section className="sec-path">
        <p className="kick">Пътят</p>
        <h2 className="h2sub">Две страни на един бранд</h2>
        <p className="lead">
          Бизнесът с добавки се крепи на повторната покупка. Само с реклама и поръчки от сайта
          трудно излиза на плюс — затова планът има две страни.
        </p>
        <div className="two">
          <div className="box">
            <p className="tag">СТРАНА 1 · НАШАТА РАБОТА</p>
            <h3>Рекламата носи първата покупка</h3>
            <p>
              Видеа, които разказват историята на розата, тестове във Facebook и Instagram и
              ежедневно следене. Губещото спира, работещото получава повече бюджет.
            </p>
          </div>
          <div className="box">
            <p className="tag">СТРАНА 2 · ВАШИЯТ ЕКИП</p>
            <h3>Телефонът носи повторната</h3>
            <ul className="list">
              {TELEFON.map(([a, b]) => (
                <li key={a}>
                  <i>✓</i>
                  <span>
                    <b>{a}</b> — {b}
                  </span>
                </li>
              ))}
            </ul>
            <p className="note">
              Целта при добре работещ телефон: около 3 от 10 обадени да вземат поне още една
              опаковка. Помагаме с подхода — скрипт и как да се звъни.
            </p>
          </div>
        </div>
        <div className="aside">
          <h3>А може ли AI да звъни вместо човек на договор?</h3>
          <p>
            Технически е възможно. В онлайн магазин обаче още не сме го доказали, затова не го
            слагаме като обещание в плана — може да го тестваме по-нататък.
          </p>
        </div>
      </section>

      <section className="sec-month">
        <p className="kick">Какво включва месецът</p>
        <h2 className="h2sub">Ясно какво получавате — и как да го проследите</h2>
        <div className="cards">
          {MESEC.map((k) => (
            <article className="card" key={k.n}>
              <span className="num">{k.n}</span>
              <h3>{k.title}</h3>
              <p>{k.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Какво не е включено</p>
        <h2 className="h2sub">За да е ясно отсега</h2>
        <div className="rows">
          {NE_E.map((r) => (
            <div style={{ display: "contents" }} key={r.t}>
              <div className="t">{r.t}</div>
              <div className="w" dangerouslySetInnerHTML={{ __html: r.w }} />
            </div>
          ))}
        </div>
      </section>

      <section className="sec-plan">
        <p className="kick">Първите 90 дни</p>
        <h2 className="h2sub">Първо рекламата спира да губи. После расте.</h2>
        <div className="steps">
          {DNI.map((s) => (
            <article className="step" key={s.d}>
              <span className="d">{s.d}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </article>
          ))}
        </div>
        <div className="pull">
          <p>
            70–80 продажби на месец е посоката, към която вървим. Число не обещаваме
            предварително — то зависи от теста, бюджета и телефона и ще се види в отчетите от
            първите 30 дни. Изграждането на такъв бранд иска време.
          </p>
        </div>
      </section>

      <section>
        <p className="kick">Сайтът и хостингът</p>
        <h2 className="h2sub">Хостингът изтича до около 15{"\u00a0"}дни — точният момент за смяна</h2>
        <p className="lead">
          Рекламата докарва човека до сайта, а сайтът трябва да се отвори бързо. Ето какво
          измерихме на 7{"\u00a0"}октомври{"\u00a0"}2026.
        </p>
        <div className="rows">
          {SAIT.map((r) => (
            <div style={{ display: "contents" }} key={r.t}>
              <div className="t">{r.t}</div>
              <div className="w" dangerouslySetInnerHTML={{ __html: r.w }} />
            </div>
          ))}
        </div>
      </section>

      <section className="sec-price">
        <p className="kick">Цената</p>
        <h2 className="h2sub">Една месечна сума, ясна от първия ден</h2>
        <div className="price">
          <div>
            <p className="big">
              450 €<small>без ДДС на месец</small>
            </p>
            <p className="sub">плаща се месечно, по фактура</p>
            <table>
              <tbody>
                <tr>
                  <td>Месечно, без ДДС</td>
                  <td className="v">450 €</td>
                </tr>
                <tr>
                  <td>ДДС 20%</td>
                  <td className="v">90 €</td>
                </tr>
                <tr className="sum">
                  <td>Месечно, с ДДС</td>
                  <td className="v">540 €</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3>Какво влиза в сумата</h3>
            <ul className="list">
              {V_CENATA.map((a) => (
                <li key={a}>
                  <i>✓</i>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            <div className="budget">
              <h3>Рекламният бюджет — отделно</h3>
              <p>
                Плаща се директно на Meta, с Вашата карта. Вдигаме го на рекламите, които
                работят.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Прегледайте офертата спокойно с брат си. Чуваме се в понеделник, 12{"\u00a0"}октомври — и
          уговаряме старта.
        </p>
        <p className="ctas">
          <a
            className="btn"
            href="mailto:emmgivailopetev38@gmail.com?subject=RoseBulgaria%20%E2%80%94%20%D0%BF%D0%BB%D0%B0%D0%BD%20%D0%B7%D0%B0%20%D1%80%D0%B0%D1%81%D1%82%D0%B5%D0%B6"
          >
            Пишете ми
          </a>
          <a className="btn ghost" href="tel:+359877399963">
            0877 399 963
          </a>
        </p>
      </section>

      <p className="sig">
        <b>Ивайло Петев</b> · Pro Marketing
        <br />
        0877 399 963 · emmgivailopetev38@gmail.com · promarketing.pw
      </p>
    </main>
  );
}
