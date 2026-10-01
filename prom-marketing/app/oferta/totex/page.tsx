/**
 * Оферта за ТОТЕХ · София — гласов AI агент, система за поръчките и фактури
 * от поръчката, 3 000 € с ДДС на две вноски по 1 500 €.
 *
 * Срещата с Павлина Тодорова (28.09.2026, Fathom): 30-годишна фирма за тревни
 * смески, тревен чим и озеленяване; два пика в годината (март–май, септ–окт) с до
 * 50–60 обаждания на ден и един човек в офиса. Тя поиска офертата „в писмен вид,
 * по точки“, за да я обсъди с управителя и колегите и да реши кое остава и кое
 * не — затова петте неща са разписани поотделно. Цената, вноските и срокът
 * (30–45 дни) са казани от Ивайло на срещата; че 3 000 € е С ДДС, потвърди на 29.09. Сигурността и контролът над агента
 * са нейните два въпроса от разговора. Фактите за фирмата са от totex.net.
 *
 * Обръщението е на „Вие“. Примерният ден е надписан като примерен.
 */

const PDF = "/oferta/totex/ProMarketing-za-TOTEX.pdf";

const CSS = `
.tot-doc{
  --ground:#F8F9F4; --panel:#EEF1E7; --surface:#FFFFFF;
  --ink:#15190F; --ink-2:#4B5245; --ink-3:#7F8778;
  --rule:#DFE3D5; --rule-soft:#EAEDE2;
  --accent:#2C6A2E; --accent-soft:#E3EFDC; --accent-ink:#F3FAEF;
  --gold:#8C650F; --gold-soft:#F8EFD9;
  --shadow:0 1px 2px rgba(21,25,15,.05), 0 10px 28px -18px rgba(21,25,15,.26);
  background:var(--ground); color:var(--ink);
  font-family:var(--tot-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.tot-doc *{box-sizing:border-box}
.tot-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.tot-doc h1,.tot-doc h2,.tot-doc h3{font-family:var(--tot-ui),Arial,sans-serif;letter-spacing:-.014em;text-wrap:balance}
.tot-doc h2,.tot-doc h3{font-weight:700}
.tot-doc .mono{font-family:var(--tot-mono),monospace;font-variant-numeric:tabular-nums}
.tot-doc a{color:var(--accent);text-underline-offset:3px}
.tot-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.tot-doc p{margin:0}

/* ── шапка ── */
.tot-doc .masthead{padding:58px 0 34px;border-bottom:1px solid var(--rule)}
.tot-doc .eyebrow{font-family:var(--tot-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.tot-doc h1{font-size:44px;line-height:1.08;font-weight:700;margin:0 0 18px;max-width:24ch}
.tot-doc h1 em{font-style:normal;color:var(--accent)}
.tot-doc .deck{font-size:19px;line-height:1.56;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.tot-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-family:var(--tot-ui),sans-serif;font-size:14px;color:var(--ink-3)}
.tot-doc .byline .pill{font-family:var(--tot-mono),monospace;font-weight:500;font-size:14px;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:6px 14px}
.tot-doc .byline a{font-weight:600}

/* ── секции ── */
.tot-doc section{margin:52px 0 0}
.tot-doc .kick{font-family:var(--tot-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin:0 0 10px}
.tot-doc .h2sub{font-size:29px;line-height:1.2;font-weight:700;margin:0 0 14px;max-width:28ch}
.tot-doc .lead{font-size:17px;color:var(--ink-2);max-width:66ch;margin:0 0 22px}
.tot-doc .note{font-size:13.5px;color:var(--ink-3);margin:10px 0 0}

/* ── откъде тръгваме ── */
.tot-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 20px}
.tot-doc .fact{background:var(--panel);border-radius:12px;padding:18px 20px}
.tot-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.tot-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.tot-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px}
.tot-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.tot-doc .pull .src{display:block;margin-top:8px;font-family:var(--tot-ui),sans-serif;font-size:13px;color:var(--ink-3)}

/* ── петте неща ── */
.tot-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.tot-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px 22px 20px;box-shadow:var(--shadow);display:flex;flex-direction:column}
.tot-doc .card .num{font-family:var(--tot-mono),monospace;font-size:12px;color:var(--accent);letter-spacing:.12em;display:block;margin:0 0 8px}
.tot-doc .card h3{font-size:17.5px;font-weight:700;margin:0 0 8px}
.tot-doc .card p{font-size:15px;line-height:1.56;color:var(--ink-2)}
.tot-doc .card p:not(.you){flex:1 1 auto}
.tot-doc .card .you{margin:14px 0 0;padding:10px 12px;border-radius:9px;background:var(--accent-soft);font-size:13.5px;line-height:1.5;color:var(--ink)}
.tot-doc .card .you b{font-family:var(--tot-ui),sans-serif;font-weight:600;color:var(--accent)}

/* ── примерният ден и контролът ── */
.tot-doc .rows{display:grid;grid-template-columns:auto 1fr;gap:0 18px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.tot-doc .rows .t{font-family:var(--tot-mono),monospace;font-size:13.5px;color:var(--accent);padding:14px 0;border-top:1px dashed var(--rule-soft);white-space:nowrap}
.tot-doc .rows .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule-soft)}
.tot-doc .rows .t:first-child,.tot-doc .rows .t:first-child+.w{border-top:0}
.tot-doc .rows .w b{color:var(--ink);font-weight:600}
.tot-doc .rows.ctl .t{font-family:var(--tot-ui),sans-serif;font-weight:600;font-size:14.5px;color:var(--ink);white-space:normal;max-width:15ch}

/* ── списъци ── */
.tot-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.tot-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.tot-doc .box h3{font-size:16px;margin:0 0 14px}
.tot-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px}
.tot-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15.5px;line-height:1.5;color:var(--ink-2)}
.tot-doc .list li i{font-style:normal;color:var(--accent);font-weight:700}
.tot-doc .list li b{color:var(--ink);font-weight:600}

/* ── внедряването ── */
.tot-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
.tot-doc .step{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:20px}
.tot-doc .step .d{font-family:var(--tot-mono),monospace;font-size:12px;letter-spacing:.1em;color:var(--gold);text-transform:uppercase;display:block;margin:0 0 7px}
.tot-doc .step h3{font-size:16.5px;margin:0 0 7px}
.tot-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── цената ── */
.tot-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:28px;box-shadow:var(--shadow)}
.tot-doc .price .big{font-family:var(--tot-ui),sans-serif;font-weight:700;font-size:46px;line-height:1;margin:0 0 6px;color:var(--ink)}
.tot-doc .price .big small{font-size:18px;font-weight:600;color:var(--ink-3);margin-left:8px}
.tot-doc .price .sub{font-family:var(--tot-mono),monospace;font-size:13px;color:var(--ink-3);margin:0 0 18px}
.tot-doc .price h3{font-size:15px;margin:0 0 8px}
.tot-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.tot-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.tot-doc .price td.v{font-family:var(--tot-mono),monospace;color:var(--ink);text-align:right;white-space:nowrap;padding-left:14px}
.tot-doc .price tr:first-child td{border-top:0}
.tot-doc .extra{margin:14px 0 0}

/* ── следващата стъпка ── */
.tot-doc .closing{background:var(--accent);color:var(--accent-ink);border-radius:16px;padding:32px 32px 28px;margin-top:52px}
.tot-doc .closing h2{color:#fff;font-size:27px;margin:0 0 10px}
.tot-doc .closing p{font-size:16.5px;line-height:1.6;color:rgba(255,255,255,.93);max-width:64ch}
.tot-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.tot-doc .closing a.btn{font-family:var(--tot-ui),sans-serif;font-weight:600;text-decoration:none;color:var(--accent);background:#fff;border-radius:10px;padding:12px 18px;font-size:15px}
.tot-doc .closing a.ghost{color:#fff;background:transparent;border:1px solid rgba(255,255,255,.55)}
.tot-doc .sig{margin:26px 0 0;font-family:var(--tot-ui),sans-serif;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.tot-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .tot-doc h1{font-size:32px}
  .tot-doc .h2sub{font-size:24px}
  .tot-doc .two,.tot-doc .price{grid-template-columns:1fr}
  .tot-doc .masthead{padding:36px 0 26px}
  .tot-doc .rows{grid-template-columns:1fr;padding:14px 20px}
  .tot-doc .rows .t{padding:14px 0 0;border-top:1px dashed var(--rule-soft)}
  .tot-doc .rows .w{padding:4px 0 14px;border-top:0}
  .tot-doc .rows .t:first-child{border-top:0}
  .tot-doc .rows.ctl .t{max-width:none}
}
@media print{
  html,body{background:#fff}
  .tot-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .tot-doc .wrap{max-width:none;padding:0}
  .tot-doc .masthead{padding:0 0 16px}
  .tot-doc h1{font-size:29px;margin-bottom:12px}
  .tot-doc .deck{font-size:14px}
  .tot-doc .byline .pdf{display:none}
  .tot-doc section{margin:22px 0 0}
  .tot-doc section{break-inside:avoid}
  .tot-doc section.sec-cards{break-inside:auto;break-before:page}
  .tot-doc .kick,.tot-doc .h2sub,.tot-doc .lead{break-after:avoid}
  .tot-doc .h2sub{font-size:19px;margin-bottom:10px}
  .tot-doc .lead{font-size:13px;margin-bottom:12px}
  .tot-doc .fact,.tot-doc .card,.tot-doc .step,.tot-doc .box,.tot-doc .price,.tot-doc .pull{break-inside:avoid}
  .tot-doc .fact p,.tot-doc .step p{font-size:12px}
  .tot-doc .cards{grid-template-columns:1fr 1fr;gap:10px}
  .tot-doc .card{padding:14px 16px;box-shadow:none}
  .tot-doc .card h3{font-size:14px}
  .tot-doc .card p{font-size:12px}
  .tot-doc .card .you{font-size:11.5px;padding:7px 9px}
  .tot-doc .rows{box-shadow:none;break-inside:avoid}
  .tot-doc .rows .t,.tot-doc .rows .w{padding:8px 0;font-size:12px}
  .tot-doc .step{padding:12px}
  .tot-doc .box{box-shadow:none;padding:16px}
  .tot-doc .list li{font-size:12.5px}
  .tot-doc .price{box-shadow:none;padding:18px}
  .tot-doc .price .big{font-size:34px}
  .tot-doc .price td{font-size:12.5px;padding:6px 0}
  .tot-doc .closing{padding:20px 22px;margin-top:26px;break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .tot-doc .closing .ctas{display:none}
  .tot-doc .fact,.tot-doc .card .you,.tot-doc .byline .pill{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* A4 е под 760px — връщаме двете колони, които мобилният изглед сгъва */
  .tot-doc .facts,.tot-doc .steps,.tot-doc .two,.tot-doc .price{grid-template-columns:1fr 1fr}
  .tot-doc .rows{grid-template-columns:auto 1fr;padding:6px 16px}
  .tot-doc .rows .t,.tot-doc .rows .w{border-top:1px dashed var(--rule-soft)}
  .tot-doc .rows .t:first-child,.tot-doc .rows .t:first-child+.w{border-top:0}
  .tot-doc .rows.ctl .t{max-width:15ch}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const FAKTI = [
  {
    h: "Март – май · септември – октомври",
    p: "Два пика в годината. Тогава обажданията стават до 50–60 на ден, а офисът е един човек — и Вие, когато той не смогва.",
  },
  {
    h: "Едни и същи въпроси",
    p: "Коя смеска, колко семе, кога се полага чимът, колко струва доставката. Отговорите ги знаете наизуст — и точно затова е жалко да ги повтаряте по петдесет пъти на ден.",
  },
  {
    h: "Поръчки и фактури на ръка",
    p: "Поръчките идват от онлайн магазина и по телефона, фактурите се пишат ръчно. Предстои и модулът на Speedy за товарителниците.",
  },
  {
    h: "Чимът иска човек",
    p: "Реже се сутрин точно по поръчките, после товарене, палети и часове, които клиентите не винаги спазват. Това остава при координатора — системата му освобождава времето точно за него.",
  },
];

const NESHTATA = [
  {
    n: "01",
    title: "Гласов агент на Вашия телефон",
    body: "Вдига на всяко обаждане — и в пиковия ден, и извън работното време. Отговаря за тревните смески, тревния чим, торовете, доставката и цените — точно толкова, колкото му разрешите. Приема поръчки и заявки за чим и ги записва. Говори на български, спокойно и учтиво.",
    you: `Еднотипните обаждания спират да стигат до Вас, а клиентът получава отговор веднага, не „обадете се по-късно“.`,
  },
  {
    n: "02",
    title: "Прехвърляне към човек, когато трябва",
    body: "Когато въпросът е за обект за озеленяване, за нестандартен терен или за нещо, което агентът не знае, той го казва направо и прехвърля разговора към Вас или към координатора. Преди това записва кой се обажда и какво иска — разговорът не почва от нулата.",
    you: "До Вас стигат само разговорите, в които наистина трябва специалист.",
  },
  {
    n: "03",
    title: "Една система за поръчките и клиентите",
    body: "Всяка поръчка — от онлайн магазина, от телефона, от имейла — влиза на едно място. Всеки клиент има картон: какво е питал, какво е поръчал, какво му е обещано. Вижда се какъв чим е заявен за утре и за кого, кое чака товарене и кое — плащане.",
    you: "Няма листчета и таблици, които знае само един човек. Отчет за месец или за година назад излиза с едно натискане.",
  },
  {
    n: "04",
    title: "Фактурите от самата поръчка",
    body: "От записаната поръчка AI подготвя фактурата и придружаващите документи във Вашия вид. Вие или координаторът ги преглеждате и одобрявате, после тръгват към клиента по имейл заедно с потвърждението.",
    you: "Фактурата не чака вечерта, а грешка от преписване няма откъде да дойде.",
  },
  {
    n: "05",
    title: "Управление с глас от телефона",
    body: `Като в клипа, който сте гледали: пращате гласово съобщение в Telegram — „Колко чим се реже утре?“ или „Пиши на клиента, че доставката е в четвъртък“ — и системата го прави. Работи и от обекта, и от колата.`,
    you: "Офисът е в телефона Ви и когато сте на терен — а на терен сте често.",
  },
];

const DENYAT = [
  {
    t: "07:40",
    w: "Клиент пита каква смеска да сложи на сенчест двор от 200 кв. м. Агентът препоръчва от Вашия асортимент, казва колко семе трябва и праща линк към продукта на имейла му.",
  },
  {
    t: "08:15",
    w: "Заявка за 150 кв. м чим за четвъртък. Агентът я записва в графика за четвъртък и клиентът получава потвърждение по имейл. Часа за товарене го уточнява координаторът.",
  },
  {
    t: "09:30",
    w: "Обаждане за озеленяване на двор край София. Агентът разбира, че е обект, и прехвърля към Вас с бележка: кой е, къде е, какво иска.",
  },
  {
    t: "11:00",
    w: "Поръчка от онлайн магазина. Влиза в системата, фактурата е готова и чака одобрение от координатора — едно натискане и тръгва.",
  },
  {
    t: "16:30",
    w: `От обекта пращате гласово: „Колко чим се реже утре?“ След секунди имате списъка — количества и клиенти.`,
  },
  {
    t: "17:05",
    w: "Обаждане след работно време. Агентът отговаря, записва поръчката и я оставя за сутринта.",
  },
];

const KONTROL = [
  {
    t: "Учим го от Вас",
    w: "Минаваме заедно асортимента, цените, условията за доставка и как точно става поръчката на чим. От това се пише неговото знание.",
  },
  {
    t: "Сценариите — на хартия",
    w: "Преди първото истинско обаждане получавате сценариите написани: тук казва цена, тук не; тук приема поръчка, тук прехвърля към Вас. Каквото не одобрите, не го казва.",
  },
  {
    t: "Всеки разговор се вижда",
    w: "В системата стои кой се е обадил, какво е питал и какво му е отговорено. Ако нещо не звучи както трябва, го виждате веднага.",
  },
  {
    t: "Донастройка",
    w: "Изникне ли нов въпрос или клиент каже, че не е разбрал — добавяме го. Агентът става по-точен с всяка седмица.",
  },
];

const SIGURNOST = [
  ["Сървъри в Европейския съюз", "базата данни е в Германия, във Франкфурт."],
  ["Достъп с лични акаунти", "всеки от екипа вижда своето, а Вие — всичко."],
  ["Всичко е на ТОТЕХ", "акаунти, данни, достъпи. Ако един ден решите да продължите без нас, системата остава при Вас."],
  [
    "По желание — изцяло на Ваш компютър",
    "тогава нищо не излиза извън офиса, но управлението от телефона става само с текстови съобщения, без гласови.",
  ],
];

const STAPKI = [
  {
    d: "Седмица 1",
    h: "Разговорът за настройката",
    p: "Час и половина с Вас и координатора: асортиментът, цените, доставката и пътят на една поръчка за чим — от обаждането до товаренето.",
  },
  {
    d: "Седмици 2 – 3",
    h: "Системата и фактурите",
    p: "Поръчките от онлайн магазина влизат в системата, картоните на клиентите се пълнят, първите фактури излизат от поръчка. Проверявате ги и казвате какво да се промени.",
  },
  {
    d: "Седмици 3 – 4",
    h: "Гласовият агент",
    p: "Получавате сценариите за одобрение. После Вие и колегите му звъните като клиенти и го изпитвате, докато не отговаря така, както бихте отговорили Вие.",
  },
  {
    d: "Седмици 5 – 6",
    h: "Пускане и предаване",
    p: "Агентът вдига истинския телефон, ние следим разговорите и донастройваме. Обучение на екипа с реални поръчки и предаване на системата.",
  },
];

const POKRIVA = [
  "Гласовият агент, настроен за ТОТЕХ",
  "Прехвърлянето към Вас и координатора",
  "Системата за поръчките, свързана със сайта и имейла",
  "Фактурите от самата поръчка",
  "Управлението с глас през Telegram",
  "Обучение на екипа",
  "Донастройка до предаването",
];

const IZVAN = [
  [
    "Таксите на външните услуги",
    "телефонната линия, минутите на гласовия агент и AI моделите се плащат директно на доставчиците, според реалните обаждания. Сметката я правим заедно по Вашите числа, преди да започнем.",
  ],
  ["Изчисляването на себестойността", "може да се добави като отделен модул, когато системата тръгне."],
  ["Промени по сайта и онлайн магазина", "свързваме се с него такъв, какъвто е."],
  ["Поддръжката след предаването", "по желание — условията ги уточняваме, когато системата работи."],
];

export default function TotexOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">Оферта · за ТОТЕХ · 29 септември 2026</p>
        <h1>
          Телефонът се вдига сам. Поръчката се записва сама.{" "}
          <em>Координаторът остава за трудното.</em>
        </h1>
        <p className="deck">
          Гласов AI агент, който поема еднотипните обаждания, една система, в която се вижда всяка
          поръчка, и фактури, които се подготвят от самата поръчка. Настроени за ТОТЕХ — фирма с 30
          години опит, два пика в годината и един офис, който в пика не смогва.
        </p>
        <p className="byline">
          <span className="pill">3 000 € с ДДС · на две вноски</span>
          <span>За Павлина Тодорова · от Ивайло Петев, Pro Marketing</span>
          <a className="pdf" href={PDF}>
            Свали като PDF
          </a>
        </p>
      </header>

      <section>
        <p className="kick">Откъде тръгваме</p>
        <h2 className="h2sub">Това, което ми разказахте на срещата</h2>
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
            Казахте, че искате да се ограничат безкрайните еднотипни обяснения по телефона, а когато
            въпросът е за специалист — разговорът да стига до Вас. Оттам започваме.
          </p>
          <span className="src">От срещата ни, 28 септември 2026</span>
        </div>
      </section>

      <section className="sec-cards">
        <p className="kick">Какво влиза в цената</p>
        <h2 className="h2sub">Пет неща, разписани по точки</h2>
        <p className="lead">
          Разписани са поотделно нарочно — за да ги обсъдите с управителя и колегите: кое оставяте,
          кое махате, какво бихте добавили.
        </p>
        <div className="cards">
          {NESHTATA.map((k) => (
            <article className="card" key={k.n}>
              <span className="num">{k.n}</span>
              <h3>{k.title}</h3>
              <p>{k.body}</p>
              <p className="you">
                <b>За офиса:</b> {k.you}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Един ден със системата</p>
        <h2 className="h2sub">Примерен вторник през април</h2>
        <div className="rows">
          {DENYAT.map((r) => (
            <div style={{ display: "contents" }} key={r.t}>
              <div className="t">{r.t}</div>
              <div className="w">{r.w}</div>
            </div>
          ))}
        </div>
        <p className="note">
          Часовете и поръчките са примерни. Вашият ден ще си е Ваш — но без телефона в ръка през цялото
          време.
        </p>
      </section>

      <section>
        <p className="kick">Кой контролира агента</p>
        <h2 className="h2sub">Агентът казва само това, което сте одобрили</h2>
        <div className="rows ctl">
          {KONTROL.map((r) => (
            <div style={{ display: "contents" }} key={r.t}>
              <div className="t">{r.t}</div>
              <div className="w">{r.w}</div>
            </div>
          ))}
        </div>
        <p className="note">
          Агентът няма достъп до всичките Ви файлове и документи. Знае за фирмата толкова, колкото му
          трябва, за да отговори на клиента.
        </p>
      </section>

      <section>
        <p className="kick">Сигурността</p>
        <h2 className="h2sub">Данните остават Ваши и в Европейския съюз</h2>
        <div className="box">
          <ul className="list">
            {SIGURNOST.map(([a, b]) => (
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
        <p className="kick">Как минава внедряването</p>
        <h2 className="h2sub">От 30 до 45 дни, в четири стъпки</h2>
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
          Започнем ли до средата на ноември, системата работи преди Коледа — изпитана и настроена много
          преди пролетния пик.
        </p>
      </section>

      <section>
        <p className="kick">Цената</p>
        <h2 className="h2sub">Както Ви я казах на срещата</h2>
        <div className="price">
          <div>
            <p className="big">
              3 000 €<small>с ДДС</small>
            </p>
            <p className="sub">2 500 € + 500 € ДДС · внедряване, еднократно</p>
            <h3>Плащане на две вноски</h3>
            <table>
              <tbody>
                <tr>
                  <td>При старт</td>
                  <td className="v">1 500 €</td>
                </tr>
                <tr>
                  <td>При предаването — когато агентът и системата работят с Вашите реални поръчки</td>
                  <td className="v">1 500 €</td>
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
          Прочетете я спокойно, заедно с управителя и колегите — затова е разписана по точки.
          Отбележете какво бихте добавили или махнали. Около 20 октомври, когато сезонът поутихне, ще
          Ви се обадя и ще я минем заедно. Решите ли по-рано — просто отговорете на имейла.
        </p>
        <p className="ctas">
          <a
            className="btn"
            href="mailto:emmgivailopetev38@gmail.com?subject=%D0%A2%D0%9E%D0%A2%D0%95%D0%A5%20%E2%80%94%20%D0%BE%D1%84%D0%B5%D1%80%D1%82%D0%B0%D1%82%D0%B0"
          >
            Пишете ми
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
