/**
 * Оферта за Таня Стойчева (tania_028@abv.bg) — Healthy Stop, 20 кв. м магазин за здравословни
 * продукти в Пловдив, и онлайн магазинът Healthy Looks Box (подаръчни кутии, сетове, абонамент),
 * пуснат на 05.10.2026. Среща 22.10.2026 (Fathom 195162450).
 *
 * Казано на срещата: социалните мрежи вървят на проба-грешка, а тя иска ясна система — какво,
 * защо и какъв резултат да очаква. Видеото с отварянето на кутия събра много гледания, постът за
 * именните дни донесе запитвания и поръчка за Етрополе. В началото може да обслужи 6–7 поръчки
 * на ден. Сайтът го прави Ники (Николай Добринков), той връзва и пиксела. Ще добавя по-бюджетни
 * кутии и ще свърже онлайн магазина с Healthy Stop. Каза „не сега“ — трябва ѝ около месец.
 *
 * Цената е казана от Ивайло: 450 € на месец (реклами, пиксел, проследяване, 3–5 видеа, анализ).
 * Бюджетът към Meta не е обсъждан — без число. ДДС не споменаваме. Поръчки не обещаваме.
 * Обръщението е на „Вие“.
 */

const PDF = "/oferta/tanya/ProMarketing-za-Tanya.pdf";

const CSS = `
/* сайтът е тъмен (color-scheme: dark в globals.css) — тази страница е светла докрай,
   иначе в PDF-а полетата на листа излизат тъмни */
html:has(.tan-doc),body:has(.tan-doc){background:#F7F4EC;color-scheme:light}
.tan-doc{
  --ground:#F7F4EC; --panel:#ECEBDD; --surface:#FFFFFF;
  --ink:#1F2A1E; --ink-2:#4B5748; --ink-3:#7A8476;
  --rule:#DFDDCB; --rule-soft:#ECEADC;
  --accent:#3E6A3A; --accent-soft:#E6EEDF; --honey:#A5741F;
  --shadow:0 1px 2px rgba(31,42,30,.05), 0 10px 28px -18px rgba(40,70,35,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--tan-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.tan-doc *{box-sizing:border-box}
.tan-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.tan-doc h1,.tan-doc h2{font-family:var(--tan-body),Georgia,serif;font-weight:600;letter-spacing:-.012em;text-wrap:balance}
.tan-doc h3{font-family:var(--tan-ui),Arial,sans-serif;font-weight:700;letter-spacing:-.01em;text-wrap:balance}
.tan-doc a{color:var(--accent);text-underline-offset:3px}
.tan-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.tan-doc p{margin:0}

/* ── шапка ── */
.tan-doc .masthead{padding:58px 0 34px;border-bottom:1px solid var(--rule)}
.tan-doc .eyebrow{font-family:var(--tan-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--honey);margin:0 0 18px}
.tan-doc h1{font-size:46px;line-height:1.1;margin:0 0 18px;max-width:22ch}
.tan-doc h1 em{font-style:italic;color:var(--accent)}
.tan-doc .deck{font-size:19px;line-height:1.56;color:var(--ink-2);max-width:60ch;margin:0 0 22px}
.tan-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-family:var(--tan-ui),sans-serif;font-size:14px;color:var(--ink-3)}
.tan-doc .byline a{font-weight:600}

/* ── секции ── */
.tan-doc section{margin:52px 0 0}
.tan-doc .kick{font-family:var(--tan-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--honey);margin:0 0 10px}
.tan-doc .h2sub{font-size:30px;line-height:1.2;margin:0 0 14px;max-width:30ch}
.tan-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.tan-doc .note{font-size:13.5px;color:var(--ink-3);margin:12px 0 0;max-width:72ch}

.tan-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:0 0 20px}
.tan-doc .fact{background:var(--panel);border-radius:12px;padding:18px 20px}
.tan-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.tan-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.tan-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px}
.tan-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}

.tan-doc .cards{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.tan-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px 22px 20px;box-shadow:var(--shadow)}
.tan-doc .card .num{font-family:var(--tan-mono),monospace;font-size:12px;color:var(--honey);letter-spacing:.12em;display:block;margin:0 0 8px}
.tan-doc .card h3{font-size:17.5px;margin:0 0 8px}
.tan-doc .card p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── пакетът ── */
.tan-doc .opts{display:grid;grid-template-columns:1.15fr .85fr;gap:18px}
.tan-doc .opt{position:relative;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:28px 26px 24px;box-shadow:var(--shadow)}
.tan-doc .opt.rec{border:2px solid var(--accent)}
.tan-doc .opt .badge{position:absolute;top:-13px;left:22px;background:var(--accent);color:#fff;font-family:var(--tan-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.06em;border-radius:999px;padding:4px 12px}
.tan-doc .opt h3{font-size:19px;margin:0 0 8px}
.tan-doc .opt .big{font-family:var(--tan-ui),sans-serif;font-weight:700;font-size:42px;line-height:1;color:var(--accent);margin:0 0 4px;font-variant-numeric:tabular-nums}
.tan-doc .opt .big small{font-size:16px;font-weight:600;color:var(--ink-3);margin-left:8px;white-space:nowrap;display:inline-block}
.tan-doc .opt .sub{font-family:var(--tan-mono),monospace;font-size:13px;color:var(--ink-3);margin:0 0 16px}
.tan-doc .opt .for{font-size:15px;line-height:1.55;color:var(--ink-2);margin:0 0 14px}
.tan-doc .opt.next{background:var(--panel);border-color:transparent;box-shadow:none}
.tan-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px}
.tan-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15px;line-height:1.5;color:var(--ink-2)}
.tan-doc .list li i{font-style:normal;color:var(--accent);font-weight:700}

/* ── сезонът ── */
.tan-doc .season{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.tan-doc .step{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.tan-doc .step b{display:block;font-family:var(--tan-mono),monospace;font-weight:500;font-size:12.5px;letter-spacing:.08em;color:var(--honey);margin:0 0 6px}
.tan-doc .step p{font-size:14.5px;line-height:1.5;color:var(--ink-2)}

/* ── следващата стъпка ── */
.tan-doc .closing{background:var(--accent-soft);border:1px solid #CADBBF;border-left:4px solid var(--accent);border-radius:16px;padding:30px 32px 28px;margin-top:52px}
.tan-doc .closing h2{color:var(--accent);font-size:28px;margin:0 0 10px}
.tan-doc .closing p{font-size:17px;line-height:1.6;color:var(--ink);max-width:62ch}
.tan-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.tan-doc .closing a.btn{font-family:var(--tan-ui),sans-serif;font-weight:600;text-decoration:none;color:#fff;background:var(--accent);border-radius:10px;padding:12px 18px;font-size:15px}
.tan-doc .closing a.ghost{color:var(--accent);background:transparent;border:1px solid var(--accent)}
.tan-doc .sig{break-inside:avoid;margin:26px 0 0;font-family:var(--tan-ui),sans-serif;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.tan-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .tan-doc .wrap{padding:0 16px 72px}
  .tan-doc h1{font-size:33px}
  .tan-doc .h2sub{font-size:24px}
  .tan-doc .deck{font-size:17.5px}
  .tan-doc .opts,.tan-doc .cards,.tan-doc .season{grid-template-columns:1fr}
  .tan-doc .masthead{padding:36px 0 26px}
  .tan-doc .closing{padding:24px 20px}
}
@media print{
  :root,html,body{color-scheme:light;background:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .tan-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .tan-doc .wrap{max-width:none;padding:0}
  .tan-doc .masthead{padding:0 0 12px}
  .tan-doc h1{font-size:30px;margin-bottom:12px}
  .tan-doc .deck{font-size:14px}
  .tan-doc .byline .pdf{display:none}
  .tan-doc section{margin:14px 0 0}
  .tan-doc h1,.tan-doc .deck,.tan-doc .h2sub,.tan-doc .lead{max-width:none}
  .tan-doc .kick,.tan-doc .h2sub,.tan-doc .lead{break-after:avoid}
  .tan-doc .h2sub{font-size:19px;margin-bottom:8px}
  .tan-doc .lead{font-size:12.5px;margin-bottom:10px}
  .tan-doc .fact,.tan-doc .card,.tan-doc .opt,.tan-doc .pull,.tan-doc .step{break-inside:avoid}
  .tan-doc .facts{grid-template-columns:repeat(2,1fr)}
  .tan-doc .fact{padding:12px 14px}
  .tan-doc .fact p{font-size:12px}
  .tan-doc .pull{padding:12px 18px}
  .tan-doc .pull p{font-size:13px}
  .tan-doc .cards{grid-template-columns:repeat(2,1fr);gap:10px}
  .tan-doc .card{padding:12px 14px;box-shadow:none}
  .tan-doc .card .num{margin-bottom:4px}
  .tan-doc .card h3{font-size:13.5px;margin-bottom:5px}
  .tan-doc .card p{font-size:11.5px;line-height:1.48}
  .tan-doc .opts{grid-template-columns:1.15fr .85fr;gap:12px}
  .tan-doc .opt{padding:16px 16px 12px;box-shadow:none}
  .tan-doc .opt .big{font-size:30px}
  .tan-doc .opt .for{font-size:12px}
  .tan-doc .opt h3{font-size:15px}
  .tan-doc .list li{font-size:12px}
  .tan-doc .season{grid-template-columns:repeat(3,1fr);gap:10px}
  .tan-doc .step{padding:10px 12px}
  .tan-doc .step p{font-size:11.5px}
  .tan-doc .note{font-size:11px}
  .tan-doc .closing{padding:14px 18px;margin-top:14px;break-inside:avoid}
  .tan-doc .sig{margin:10px 0 0;font-size:11px;line-height:1.5}
  .tan-doc .closing h2{font-size:20px}
  .tan-doc .closing p{font-size:13.5px}
  .tan-doc .closing .ctas{display:none}
  .tan-doc .fact,.tan-doc .closing,.tan-doc .opt .badge,.tan-doc .opt.next{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const FAKTI = [
  {
    h: "Два магазина, една посока",
    p: "Healthy Stop в Пловдив и новият Healthy Looks Box — подаръчни кутии, сетове и абонамент. Онлайн магазинът е жив от 5 октомври.",
  },
  {
    h: "Първите сигнали вече ги има",
    p: "Видеото с отварянето на кутия събра много гледания, а постът за именните дни донесе запитвания и поръчка чак от Етрополе.",
  },
  {
    h: "Липсва система",
    p: "Засега нещата стават на проба-грешка. Искате ясна картина: какво правим, защо и какво да очаквате от него.",
  },
  {
    h: "Темпо, което можете да обслужите",
    p: "В началото 6–7 поръчки на ден. Част от продуктите идват от производители в Плевен и Русе, а персонализираните кутии искат 3–4 дни.",
  },
];

const KAK = [
  {
    h: "Пиксел и проследяване",
    p: "Свързваме рекламите със сайта — заедно с Ники, без да дублираме неговата работа. Виждате от коя реклама идва всяка поръчка, колко е купил клиентът и до коя секунда е гледал видеото.",
  },
  {
    h: "3–5 рекламни видеа на месец",
    p: "С тях тестваме продукти и аудитории. С Вас, само с ръцете Ви и кутиите, или само магазина и продуктите — каквото Ви е по-удобно.",
  },
  {
    h: "Намираме продукта, който продава най-добре",
    p: "Кутията или продуктът, който се купува най-много, получава бюджета. Клиентът влиза през него, а после разглежда и останалото.",
  },
  {
    h: "Клиентът купува пак",
    p: "На следващ етап: имейли, напомняния за рождени и именни дни, обаждания от търговци. Първата поръчка е само началото.",
  },
];

const PAKET = [
  "Управление на рекламите във Facebook и Instagram",
  "Инсталиране на пиксела и свързване на рекламите със сайта",
  "Проследяване на всяка поръчка до рекламата, от която е дошла",
  "3–5 рекламни видеа на месец",
  "Пълен анализ: кой продукт продава, кой не, къде да отиде бюджетът",
];

const POSLE = [
  "По-голям бюджет — само за това, което вече продава",
  "Имейл маркетинг и напомняния към купилите",
  "Търговци, които звънят на клиентите",
];

export default function TanyaOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">За Таня Стойчева · Healthy Looks Box · 22.10.2026</p>
        <h1>
          Клиенти за Healthy Looks Box — <em>с ясна система, не на проба-грешка.</em>
        </h1>
        <p className="deck">
          Беше ми приятно да се запознаем, Таня. Ето плана, за който говорихме — да е под ръка,
          когато магазинът е готов за повече поръчки.
        </p>
        <p className="byline">
          <span>От Ивайло Петев, Pro Marketing</span>
          <a className="pdf" href={PDF}>
            Свали като PDF
          </a>
        </p>
      </header>

      <section>
        <p className="kick">Какво чухме от Вас</p>
        <h2 className="h2sub">Хубав продукт и ясна нужда</h2>
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
            Не Ви трябват клиенти на всяка цена. Трябват Ви точно толкова, колкото можете да
            обслужите отлично — и да знаете откъде идва всеки от тях.
          </p>
        </div>
      </section>

      <section>
        <p className="kick">Планът</p>
        <h2 className="h2sub">Директна реклама за продажби</h2>
        <p className="lead">
          Това е най-бързият път от рекламата до поръчката. Работили сме го при онлайн магазини за
          храни — ядки, хайвер и други.
        </p>
        <div className="cards">
          {KAK.map((k, i) => (
            <article className="card" key={k.h}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <h3>{k.h}</h3>
              <p>{k.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Пакетът</p>
        <h2 className="h2sub">Едно начало, после растем заедно</h2>
        <div className="opts">
          <article className="opt rec">
            <span className="badge">Старт</span>
            <h3>Реклама за продажби</h3>
            <p className="big">
              450 €<small>на месец</small>
            </p>
            <p className="sub">всичко за първите поръчки</p>
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
            <p className="for">Когато поръчките тръгнат и Вие сте готова за повече:</p>
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
          Бюджетът за самата реклама се плаща директно на Meta от Вашата карта и го определяме
          заедно. Тръгваме с толкова, колкото поръчки можете да обслужите, и вдигаме чак когато
          кажете. Брой поръчки не обещаваме предварително — обещаваме ясна картина какво продава
          и защо.
        </p>
      </section>

      <section>
        <p className="kick">Сезонът</p>
        <h2 className="h2sub">Подаръчните кутии имат своя най-силен момент</h2>
        <p className="lead">
          Ноември и декември са месеците на подаръците. Казахте, че Ви трябва около месец, за да
          подредите магазина — това пада точно навреме.
        </p>
        <div className="season">
          <div className="step">
            <b>до средата на ноември</b>
            <p>Подреждате асортимента и по-бюджетните кутии. Ние подготвяме пиксела и първите видеа.</p>
          </div>
          <div className="step">
            <b>втората половина на ноември</b>
            <p>Рекламите тръгват и учат кои кутии се купуват най-много.</p>
          </div>
          <div className="step">
            <b>декември</b>
            <p>Бюджетът отива в това, което продава — точно когато хората търсят подаръци.</p>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Подредете спокойно магазина — планът Ви чака. Предлагам да се чуем за 15 минути около
          средата на ноември и да решим заедно кога да тръгнат първите реклами, за да хванат
          коледния сезон.
        </p>
        <p className="ctas">
          <a className="btn" href="mailto:emmgivailopetev38@gmail.com?subject=Healthy%20Looks%20Box">
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
        0877 399 963 · emmgivailopetev38@gmail.com
        <br />
        🌐 petevai.com · promarketing.pw
        <br />
        💬 Viber канал: promarketing.pw/viber
      </p>
    </main>
  );
}
