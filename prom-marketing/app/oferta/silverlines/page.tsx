/**
 * Оферта за Silverlines · София, кв. Горубляне — управлявана Google Ads кампания,
 * 150 € + ДДС на месец, бюджет за реклама 100–200 € на месец в началото.
 *
 * Срещата с Огнян Коцев (06.10.2026, Fathom 848849620, 26 мин): сервиз от 15 години,
 * техника за диагностика на всички европейски марки, двама души плюс електротехник,
 * 2–3 коли на ден и 3–4 тежки ремонта на месец — потокът не стига. Сам върти една
 * Google кампания с около 100 € на месец. Четири години с агенция без резултат —
 * затова иска да расте на етапи и да види числа, преди да вложи повече.
 *
 * Всички цени са казани от Ивайло на срещата: 150 € без ДДС за управлението,
 * 100–200 € бюджет в началото (после 200–300–500), първият месец 50% аванс и
 * доплащане, ако е доволен. Сайтът (1 000–1 500 €, поддръжка около 90 € без ДДС)
 * и Facebook + Instagram (700 € без ДДС, 10–15 € на ден) — за по-нататък.
 * Пощата му трябва да остане непокътната — Ивайло потвърди на срещата.
 *
 * Обръщението е на „ти“ — така си говориха на срещата.
 */

const PDF = "/oferta/silverlines/ProMarketing-za-Silverlines.pdf";

const CSS = `
.slv-doc{
  --ground:#F5F6F8; --panel:#EBEEF2; --surface:#FFFFFF;
  --ink:#12161C; --ink-2:#464D57; --ink-3:#7A818C;
  --rule:#DCE0E6; --rule-soft:#E8EBEF;
  --accent:#1F56A8; --accent-soft:#E2EBF7; --accent-ink:#F1F6FD;
  --gold:#9A5B0B; --gold-soft:#F7EEDD;
  --shadow:0 1px 2px rgba(18,22,28,.05), 0 10px 28px -18px rgba(18,22,28,.28);
  background:var(--ground); color:var(--ink);
  font-family:var(--slv-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.slv-doc *{box-sizing:border-box}
.slv-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.slv-doc h1,.slv-doc h2,.slv-doc h3{font-family:var(--slv-ui),Arial,sans-serif;letter-spacing:-.014em;text-wrap:balance}
.slv-doc h2,.slv-doc h3{font-weight:700}
.slv-doc .mono{font-family:var(--slv-mono),monospace;font-variant-numeric:tabular-nums}
.slv-doc a{color:var(--accent);text-underline-offset:3px}
.slv-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.slv-doc p{margin:0}

/* ── шапка ── */
.slv-doc .masthead{padding:58px 0 34px;border-bottom:1px solid var(--rule)}
.slv-doc .eyebrow{font-family:var(--slv-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.slv-doc h1{font-size:44px;line-height:1.08;font-weight:700;margin:0 0 18px;max-width:22ch}
.slv-doc h1 em{font-style:normal;color:var(--accent)}
.slv-doc .deck{font-size:19px;line-height:1.56;color:var(--ink-2);max-width:62ch;margin:0 0 22px}
.slv-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-family:var(--slv-ui),sans-serif;font-size:14px;color:var(--ink-3)}
.slv-doc .byline .pill{font-family:var(--slv-mono),monospace;font-weight:500;font-size:14px;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:6px 14px}
.slv-doc .byline a{font-weight:600}

/* ── секции ── */
.slv-doc section{margin:52px 0 0}
.slv-doc .kick{font-family:var(--slv-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin:0 0 10px}
.slv-doc .h2sub{font-size:29px;line-height:1.2;font-weight:700;margin:0 0 14px;max-width:28ch}
.slv-doc .lead{font-size:17px;color:var(--ink-2);max-width:66ch;margin:0 0 22px}
.slv-doc .note{font-size:13.5px;color:var(--ink-3);margin:10px 0 0}

/* ── откъде тръгваме ── */
.slv-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 20px}
.slv-doc .fact{background:var(--panel);border-radius:12px;padding:18px 20px}
.slv-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.slv-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.slv-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px}
.slv-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.slv-doc .pull .src{display:block;margin-top:8px;font-family:var(--slv-ui),sans-serif;font-size:13px;color:var(--ink-3)}

/* ── какво правим ── */
.slv-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.slv-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px 22px 20px;box-shadow:var(--shadow)}
.slv-doc .card .num{font-family:var(--slv-mono),monospace;font-size:12px;color:var(--accent);letter-spacing:.12em;display:block;margin:0 0 8px}
.slv-doc .card h3{font-size:17.5px;font-weight:700;margin:0 0 8px}
.slv-doc .card p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── бюджетът и стъпките ── */
.slv-doc .rows{display:grid;grid-template-columns:auto 1fr;gap:0 18px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.slv-doc .rows .t{font-family:var(--slv-ui),sans-serif;font-weight:600;font-size:14.5px;color:var(--ink);padding:14px 0;border-top:1px dashed var(--rule-soft);max-width:17ch}
.slv-doc .rows .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule-soft)}
.slv-doc .rows .t:first-child,.slv-doc .rows .t:first-child+.w{border-top:0}
.slv-doc .rows .w b{color:var(--ink);font-weight:600}

.slv-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
.slv-doc .step{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:20px}
.slv-doc .step .d{font-family:var(--slv-mono),monospace;font-size:12px;letter-spacing:.1em;color:var(--gold);text-transform:uppercase;display:block;margin:0 0 7px}
.slv-doc .step h3{font-size:16.5px;margin:0 0 7px}
.slv-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── цената ── */
.slv-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:28px;box-shadow:var(--shadow)}
.slv-doc .price .big{font-family:var(--slv-ui),sans-serif;font-weight:700;font-size:46px;line-height:1;margin:0 0 6px;color:var(--ink)}
.slv-doc .price .big small{font-size:18px;font-weight:600;color:var(--ink-3);margin-left:8px;white-space:nowrap;display:inline-block}
.slv-doc .price .sub{font-family:var(--slv-mono),monospace;font-size:13px;color:var(--ink-3);margin:0 0 18px}
.slv-doc .price h3{font-size:15px;margin:0 0 8px}
.slv-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.slv-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.slv-doc .price td.v{font-family:var(--slv-mono),monospace;color:var(--ink);text-align:right;white-space:nowrap;padding-left:14px}
.slv-doc .price tr:first-child td{border-top:0}
.slv-doc .price tr.sum td{border-top:1px solid var(--rule);color:var(--ink);font-weight:600}

/* ── по-нататък ── */
.slv-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.slv-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.slv-doc .box h3{font-size:17px;margin:0 0 4px}
.slv-doc .box .tag{font-family:var(--slv-mono),monospace;font-size:13.5px;color:var(--gold);margin:0 0 14px}
.slv-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px}
.slv-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15px;line-height:1.5;color:var(--ink-2)}
.slv-doc .list li i{font-style:normal;color:var(--accent);font-weight:700}
.slv-doc .list li b{color:var(--ink);font-weight:600}

/* ── следващата стъпка ── */
.slv-doc .closing{background:var(--accent);color:var(--accent-ink);border-radius:16px;padding:32px 32px 28px;margin-top:52px}
.slv-doc .closing h2{color:#fff;font-size:27px;margin:0 0 10px}
.slv-doc .closing p{font-size:16.5px;line-height:1.6;color:rgba(255,255,255,.93);max-width:64ch}
.slv-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.slv-doc .closing a.btn{font-family:var(--slv-ui),sans-serif;font-weight:600;text-decoration:none;color:var(--accent);background:#fff;border-radius:10px;padding:12px 18px;font-size:15px}
.slv-doc .closing a.ghost{color:#fff;background:transparent;border:1px solid rgba(255,255,255,.55)}
.slv-doc .sig{break-inside:avoid;margin:26px 0 0;font-family:var(--slv-ui),sans-serif;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.slv-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .slv-doc h1{font-size:32px}
  .slv-doc .h2sub{font-size:24px}
  .slv-doc .two,.slv-doc .price{grid-template-columns:1fr}
  .slv-doc .masthead{padding:36px 0 26px}
  .slv-doc .rows{grid-template-columns:1fr;padding:14px 20px}
  .slv-doc .rows .t{padding:14px 0 0;border-top:1px dashed var(--rule-soft);max-width:none}
  .slv-doc .rows .w{padding:4px 0 14px;border-top:0}
  .slv-doc .rows .t:first-child{border-top:0}
}
@media print{
  html,body{background:#fff}
  .slv-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .slv-doc .wrap{max-width:none;padding:0}
  .slv-doc .masthead{padding:0 0 16px}
  .slv-doc h1{font-size:29px;margin-bottom:12px}
  .slv-doc .deck{font-size:14px}
  .slv-doc .byline .pdf{display:none}
  .slv-doc section{margin:22px 0 0;break-inside:avoid}
  .slv-doc section.sec-cards{break-before:page}
  .slv-doc .kick,.slv-doc .h2sub,.slv-doc .lead{break-after:avoid}
  .slv-doc .h2sub{font-size:19px;margin-bottom:10px}
  .slv-doc .lead{font-size:13px;margin-bottom:12px}
  .slv-doc .fact,.slv-doc .card,.slv-doc .step,.slv-doc .box,.slv-doc .price,.slv-doc .pull{break-inside:avoid}
  .slv-doc .fact p,.slv-doc .step p{font-size:12px}
  .slv-doc .cards{grid-template-columns:1fr 1fr;gap:10px}
  .slv-doc .card{padding:14px 16px;box-shadow:none}
  .slv-doc .card h3{font-size:14px}
  .slv-doc .card p{font-size:12px}
  .slv-doc .rows{box-shadow:none;break-inside:avoid}
  .slv-doc .rows .t,.slv-doc .rows .w{padding:8px 0;font-size:12px}
  .slv-doc .step{padding:12px}
  .slv-doc .box{box-shadow:none;padding:16px}
  .slv-doc .list li{font-size:12.5px}
  .slv-doc .price{box-shadow:none;padding:18px}
  .slv-doc .price .big{font-size:34px}
  .slv-doc .price td{font-size:12.5px;padding:6px 0}
  .slv-doc .closing{padding:20px 22px;margin-top:26px;break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .slv-doc .closing .ctas{display:none}
  .slv-doc .fact,.slv-doc .byline .pill{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* A4 е под 760px — връщаме двете колони, които мобилният изглед сгъва */
  .slv-doc .facts,.slv-doc .steps,.slv-doc .two,.slv-doc .price{grid-template-columns:1fr 1fr}
  .slv-doc .rows{grid-template-columns:auto 1fr;padding:6px 16px}
  .slv-doc .rows .t,.slv-doc .rows .w{border-top:1px dashed var(--rule-soft)}
  .slv-doc .rows .t:first-child,.slv-doc .rows .t:first-child+.w{border-top:0}
  .slv-doc .rows .t{max-width:17ch}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const FAKTI = [
  {
    h: "15 години и техника за всичко",
    p: "Диагностика на всички европейски марки, част от мрежата на Stellantis, двама души плюс електротехник. Сервизът може много повече, отколкото му идва в момента.",
  },
  {
    h: "2–3 коли на ден",
    p: "И 3–4 тежки ремонта на месец. Потокът не стига — а еврото и големите сервизи натискат цените отгоре.",
  },
  {
    h: "Google вече носи клиенти",
    p: "С около 100 € на месец и без време да я поддържаш, кампанията пак докарва хора — като онзи, на когото му се скъса ремъкът и потърси най-близкия сервиз. Значи търсенето го има.",
  },
  {
    h: "4 години с агенция",
    p: "Пари всеки месец, статистики, които не значат нищо, и нула нови клиенти. Затова тук тръгваме на етапи и с числа, които ти сам виждаш.",
  },
];

const RABOTA = [
  {
    n: "01",
    title: "Думите, по които търсят",
    body: "Проучваме какво пишат хората в София, когато им трябва сервиз точно сега: диагностика, ремонт на двигател, ангренаж, ходова част, сервиз по марка. Плащаш само за търсения, от които може да дойде кола.",
  },
  {
    n: "02",
    title: "Кампания, настроена за Горубляне",
    body: "Районът около сервиза, часовете, в които вдигаш телефона, обаждане директно от рекламата. Изрязваме търсенията, които водят грешни обаждания — като хората, които търсят официален сервиз на марката.",
  },
  {
    n: "03",
    title: "Броим обажданията, не показванията",
    body: "93 000 показвания звучат много, но не казват колко коли са дошли. Настройваме проследяването така, че да виждаш колко хора са се обадили или пратили запитване от рекламата и колко струва едно обаждане.",
  },
  {
    n: "04",
    title: "Всяка седмица — по-добре",
    body: "Гледаме кое носи обаждания и кое само харчи. Спираме празното, наливаме в работещото. Бюджетът ти отива там, където докарва коли.",
  },
  {
    n: "05",
    title: "Отчет всеки месец, на прост език",
    body: "Колко обаждания, колко струва едно, кои услуги търсят най-много и какво променяме следващия месец. Чете се за две минути вечер на телефона.",
  },
];

const BYUDZHET = [
  {
    t: "Колко",
    w: "<b>100–200 € на месец</b> в началото. Вдигаме го само когато числата покажат, че си струва — после 200, 300, 500 €.",
  },
  {
    t: "Как се плаща",
    w: "<b>Директно на Google</b>, с картата на фирмата, която е в акаунта. Google издава фактурите на фирмата. Нито евро от бюджета не минава през нас.",
  },
  {
    t: "Достъпът",
    w: "Рекламният акаунт е в личния ти Google профил. Даваш ни достъп <b>само до рекламите</b> — до пощата и до нищо друго в профила нямаме достъп.",
  },
];

const STAPKI = [
  {
    d: "Стъпка 1",
    h: "Казваш „да“ във Viber",
    p: "Пращам ти кратко упътване как се дава достъп до Google Ads — две минути работа.",
  },
  {
    d: "Стъпка 2",
    h: "Кратка онлайн среща",
    p: "Даваш достъпа, минаваме кои услуги искаш да пълним с клиенти — и кои ремонти ти носят най-много.",
  },
  {
    d: "Стъпка 3",
    h: "Пускаме кампанията",
    p: "Думи, район, часове, проследяване на обажданията. От този момент всяко обаждане от рекламата се брои.",
  },
  {
    d: "След първия месец",
    h: "Гледаме числата заедно",
    p: "Отчетът и кратък разговор. Доволен си — доплащаш другата половина и продължаваме.",
  },
];

const PLAN = [
  ["Месец 1 · управление", "150 € + ДДС"],
  ["Месец 2 · управление", "150 € + ДДС"],
  ["Месец 3 · управление", "150 € + ДДС"],
  ["Бюджет за реклама · 3 месеца, директно на Google", "300 – 600 €"],
];

const SAIT = [
  ["Нов сайт с код, не WordPress", "бърз, модерен, с вградено SEO и записване на час."],
  ["Ти не качваш нищо", "снимки, текстове, услуги — правим всичко ние."],
  ["Пощата ти остава", "info@silverlines-bg.com и регистрациите ти с нея не се пипат."],
];

const META = [
  ["Facebook и Instagram заедно", "съдържание и реклами на двете места."],
  ["Не е нужно да се снимаш", "видеата ги правим и сглобяваме ние."],
  ["Бюджет 10–15 € на ден", "за София 10 € на ден е напълно достатъчно за старт."],
];

export default function SilverlinesOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">Оферта · за Silverlines · 6 октомври 2026</p>
        <h1>
          Техниката и хората ги имаш. <em>Сега да дойдат колите.</em>
        </h1>
        <p className="deck">
          Започваме от Google — там хората вече търсят сервиз, когато колата им спре. Управлявана
          кампания за Silverlines в Горубляне: повече обаждания, всяко от тях преброено, и бюджет,
          който расте само когато числата го оправдаят.
        </p>
        <p className="byline">
          <span className="pill">150 € + ДДС на месец · първият месец 50% аванс</span>
          <span>За Огнян Коцев · от Ивайло Петев, Pro Marketing</span>
          <a className="pdf" href={PDF}>
            Свали като PDF
          </a>
        </p>
      </header>

      <section>
        <p className="kick">Откъде тръгваме</p>
        <h2 className="h2sub">Това, което ми разказа на срещата</h2>
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
            Каза, че доверието не се гради лесно — и си прав. Затова не те караме да вярваш на
            думи: първият месец плащаш половината, виждаш колко обаждания е докарала рекламата и
            тогава решаваш.
          </p>
          <span className="src">От срещата ни, 6 октомври 2026</span>
        </div>
      </section>

      <section className="sec-cards">
        <p className="kick">Какво получаваш за 150 € на месец</p>
        <h2 className="h2sub">Google рекламата, управлявана от нас</h2>
        <p className="lead">
          Ти се занимаваш с колите. Ние — с това да звъни телефонът.
        </p>
        <div className="cards">
          {RABOTA.map((k) => (
            <article className="card" key={k.n}>
              <span className="num">{k.n}</span>
              <h3>{k.title}</h3>
              <p>{k.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Бюджетът за реклама</p>
        <h2 className="h2sub">Растем на етапи, както каза</h2>
        <div className="rows">
          {BYUDZHET.map((r) => (
            <div style={{ display: "contents" }} key={r.t}>
              <div className="t">{r.t}</div>
              <div className="w" dangerouslySetInnerHTML={{ __html: r.w }} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Как започваме</p>
        <h2 className="h2sub">Четири стъпки до първите обаждания</h2>
        <div className="steps">
          {STAPKI.map((s) => (
            <article className="step" key={s.d}>
              <span className="d">{s.d}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sec-price">
        <p className="kick">Цената</p>
        <h2 className="h2sub">Както я казах на срещата</h2>
        <div className="price">
          <div>
            <p className="big">
              150 €<small>+ ДДС на месец</small>
            </p>
            <p className="sub">управление на Google рекламата</p>
            <h3>Първият месец — на две половини</h3>
            <table>
              <tbody>
                <tr>
                  <td>При старт, аванс</td>
                  <td className="v">75 € + ДДС</td>
                </tr>
                <tr>
                  <td>След първия месец — ако си доволен от резултата</td>
                  <td className="v">75 € + ДДС</td>
                </tr>
                <tr>
                  <td>От втория месец нататък</td>
                  <td className="v">150 € + ДДС</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3>Планът за първите три месеца</h3>
            <table>
              <tbody>
                {PLAN.map(([a, b]) => (
                  <tr key={a}>
                    <td>{a}</td>
                    <td className="v">{b}</td>
                  </tr>
                ))}
                <tr className="sum">
                  <td>Общо за три месеца</td>
                  <td className="v">750 – 1 050 €</td>
                </tr>
              </tbody>
            </table>
            <p className="note">
              В сбора управлението е без ДДС, а бюджетът е при 100–200 € на месец. Вдигнем ли го, то е
              защото рекламата вече докарва коли.
            </p>
          </div>
        </div>
      </section>

      <section>
        <p className="kick">По-нататък — когато Google потръгне</p>
        <h2 className="h2sub">Сайтът и социалните мрежи</h2>
        <p className="lead">
          Не са за сега. Записвам ги, защото ме пита за тях — да ги имаш пред себе си, когато
          правиш плана.
        </p>
        <div className="two">
          <div className="box">
            <h3>Нов сайт</h3>
            <p className="tag">1 000 – 1 500 € · поддръжка с хостинг около 90 € + ДДС на месец</p>
            <ul className="list">
              {SAIT.map(([a, b]) => (
                <li key={a}>
                  <i>✓</i>
                  <span>
                    <b>{a}</b> — {b}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="box">
            <h3>Facebook и Instagram</h3>
            <p className="tag">700 € + ДДС на месец · бюджет 10–15 € на ден</p>
            <ul className="list">
              {META.map(([a, b]) => (
                <li key={a}>
                  <i>✓</i>
                  <span>
                    <b>{a}</b> — {b}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Обсъди я спокойно с колегата. Ще си пишем във Viber — кажеш ли „да“, пращам ти
          упътването за достъпа до Google Ads, виждаме се за кратко онлайн и пускаме кампанията.
        </p>
        <p className="ctas">
          <a
            className="btn"
            href="mailto:emmgivailopetev38@gmail.com?subject=Silverlines%20%E2%80%94%20Google%20%D1%80%D0%B5%D0%BA%D0%BB%D0%B0%D0%BC%D0%B0%D1%82%D0%B0"
          >
            Пиши ми
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
