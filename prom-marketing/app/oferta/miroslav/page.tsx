/**
 * AI система за магазина за храни и фирмата за почистване — Мирослав Миланов (globalmbm@abv.bg).
 * Среща 19.10.2026 (Fathom 193857684). Казано на срещата: нов, по-голям магазин (приоритет) и
 * фирма за почистване (рестарт по-късно). Основна болка: грешки при вкарването на стока.
 * Цена, казана от Ивайло: 3 000 € за пълна автоматизация + обучение на персонала; старт с 1 000 € аванс.
 * ДДС не се споменува (не е уточнено). Касовите апарати остават — фискалните устройства
 * изискват лиценз от НАП, който нямаме. С MicroInvest работим, ако дадат API достъп.
 * Следваща стъпка: Мирослав описва точните изисквания за магазина; среща следващата седмица.
 * Обръщение: „Вие“.
 */

const PDF = "/oferta/miroslav/ProMarketing-za-Miroslav.pdf";

const CSS = `
.mir-doc{
  --ground:#F7F8F5; --panel:#ECF2EE; --surface:#FFFFFF;
  --ink:#17201C; --ink-2:#47544E; --ink-3:#7B8781;
  --rule:#DCE4DF; --rule-soft:#EAF0EC;
  --accent:#1F5C4A; --accent-soft:#E6F1EB; --accent-line:#BCD8CB;
  --warm:#9A6A1C; --warm-soft:#F8F0E0;
  --shadow:0 1px 2px rgba(23,32,28,.05), 0 12px 30px -20px rgba(23,32,28,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--mir-ui),Arial,sans-serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.mir-doc *{box-sizing:border-box}
.mir-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.mir-doc h1,.mir-doc h2{font-family:var(--mir-display),Georgia,serif;font-weight:600;letter-spacing:-.01em;text-wrap:balance}
.mir-doc h3{font-family:var(--mir-ui),Arial,sans-serif;font-weight:600;letter-spacing:-.01em}
.mir-doc .num{font-variant-numeric:tabular-nums}
.mir-doc a{color:var(--accent);text-underline-offset:3px}
.mir-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.mir-doc p{margin:0}

.mir-doc .masthead{padding:60px 0 36px;border-bottom:1px solid var(--rule)}
.mir-doc .eyebrow{font-weight:600;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.mir-doc h1{font-size:48px;line-height:1.08;margin:0 0 20px;max-width:20ch}
.mir-doc h1 em{font-style:italic;color:var(--accent)}
.mir-doc .deck{font-size:19px;line-height:1.58;color:var(--ink-2);max-width:62ch;margin:0 0 24px}
.mir-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-size:14px;color:var(--ink-3)}
.mir-doc .byline .pill{font-weight:600;font-size:14px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:999px;padding:6px 14px}
.mir-doc .byline a{font-weight:600}

.mir-doc section{margin:56px 0 0}
.mir-doc .kick{font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--warm);margin:0 0 10px}
.mir-doc .h2sub{font-size:31px;line-height:1.18;margin:0 0 14px;max-width:26ch}
.mir-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.mir-doc .note{font-size:14px;color:var(--ink-3);margin:12px 0 0;max-width:70ch}

.mir-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 20px}
.mir-doc .fact{background:var(--panel);border-radius:14px;padding:18px 20px}
.mir-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.mir-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.mir-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 14px 14px 0;padding:18px 22px;box-shadow:var(--shadow)}
.mir-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.mir-doc .pull .src{display:block;margin-top:8px;font-size:13.5px;color:var(--ink-3)}

.mir-doc .hero{background:var(--surface);border:1px solid var(--accent-line);border-radius:18px;padding:26px 26px 24px;box-shadow:var(--shadow);margin:0 0 14px}
.mir-doc .hero .tag{display:inline-block;font-weight:600;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:4px 12px;margin:0 0 12px}
.mir-doc .hero h3{font-family:var(--mir-display),Georgia,serif;font-size:26px;line-height:1.2;margin:0 0 10px}
.mir-doc .hero p{font-size:16px;line-height:1.6;color:var(--ink-2);max-width:68ch}
.mir-doc .chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;padding:0;list-style:none}
.mir-doc .chips li{font-size:14px;font-weight:500;color:var(--ink);background:var(--panel);border-radius:999px;padding:6px 13px}
.mir-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.mir-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:20px 20px 18px}
.mir-doc .card .n{font-weight:600;font-size:12px;color:var(--warm);letter-spacing:.12em;display:block;margin:0 0 8px}
.mir-doc .card h3{font-size:16.5px;margin:0 0 7px}
.mir-doc .card p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.mir-doc .goal{margin:14px 0 0;padding:16px 20px;border-radius:14px;background:var(--warm-soft);font-size:16px;line-height:1.55;color:var(--ink)}
.mir-doc .goal b{color:var(--warm);font-weight:600}

.mir-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mir-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.mir-doc .box h3{font-size:16.5px;margin:0 0 8px}
.mir-doc .box p{font-size:15px;line-height:1.56;color:var(--ink-2)}

.mir-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.mir-doc .step{background:var(--surface);border:1px solid var(--rule);border-top:3px solid var(--accent);border-radius:12px;padding:20px}
.mir-doc .step .d{font-weight:600;font-size:12px;letter-spacing:.12em;color:var(--warm);text-transform:uppercase;display:block;margin:0 0 7px}
.mir-doc .step h3{font-size:16.5px;margin:0 0 7px}
.mir-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

.mir-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:28px;box-shadow:var(--shadow)}
.mir-doc .price .big{font-family:var(--mir-display),Georgia,serif;font-weight:700;font-size:50px;line-height:1;margin:0 0 8px;color:var(--ink)}
.mir-doc .price .big small{font-family:var(--mir-ui),Arial,sans-serif;font-size:18px;font-weight:500;color:var(--ink-3);margin-left:10px;white-space:nowrap;display:inline-block}
.mir-doc .price .sub{font-size:14px;color:var(--ink-3);margin:0 0 16px}
.mir-doc .price h3{font-size:15px;margin:0 0 8px}
.mir-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.mir-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.mir-doc .price td.v{color:var(--ink);font-weight:500;text-align:right;white-space:nowrap;padding-left:14px}
.mir-doc .price tr:first-child td{border-top:0}
.mir-doc .opt{margin:12px 0 0;padding:12px 14px;border-radius:12px;background:var(--panel);font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.mir-doc .opt b{color:var(--ink);font-weight:600}
.mir-doc .opt.hl{background:var(--accent-soft)}
.mir-doc .opt.hl b{color:var(--accent)}

.mir-doc .closing{background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:18px;padding:32px 32px 28px;margin-top:56px}
.mir-doc .closing h2{font-size:29px;margin:0 0 10px;color:var(--ink)}
.mir-doc .closing p{font-size:16.5px;line-height:1.6;color:var(--ink-2);max-width:62ch}
.mir-doc .closing p + p{margin-top:10px}
.mir-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.mir-doc .closing a.btn{font-weight:600;text-decoration:none;color:var(--accent);background:var(--surface);border:1px solid var(--accent-line);border-radius:12px;padding:12px 18px;font-size:15px}
.mir-doc .sig{break-inside:avoid;margin:26px 0 0;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.mir-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .mir-doc{font-size:16.5px}
  .mir-doc .wrap{padding:0 18px 72px}
  .mir-doc h1{font-size:34px}
  .mir-doc .deck{font-size:17.5px}
  .mir-doc .h2sub{font-size:25px}
  .mir-doc .masthead{padding:38px 0 28px}
  .mir-doc section{margin:44px 0 0}
  .mir-doc .hero{padding:22px 20px 20px}
  .mir-doc .hero h3{font-size:22px}
  .mir-doc .two,.mir-doc .price{grid-template-columns:1fr}
  .mir-doc .price{padding:22px 20px}
  .mir-doc .price .big{font-size:42px}
  .mir-doc .closing{padding:24px 20px 22px}
}
@media print{
  html,body{background:#fff}
  .mir-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .mir-doc .wrap{max-width:none;padding:0}
  .mir-doc .masthead{padding:0 0 16px}
  .mir-doc h1{font-size:30px;margin-bottom:12px}
  .mir-doc .deck{font-size:14px;margin-bottom:14px}
  .mir-doc .byline .pdf{display:none}
  .mir-doc section{margin:22px 0 0}
  .mir-doc section.sec-build{break-before:page}
  .mir-doc section.sec-price{break-before:page}
  .mir-doc .kick,.mir-doc .h2sub,.mir-doc .lead{break-after:avoid}
  .mir-doc .h2sub{font-size:20px;margin-bottom:10px}
  .mir-doc .lead{font-size:13px;margin-bottom:12px}
  .mir-doc .fact,.mir-doc .card,.mir-doc .step,.mir-doc .box,.mir-doc .price,.mir-doc .pull,.mir-doc .hero,.mir-doc .goal,.mir-doc .closing{break-inside:avoid}
  .mir-doc .fact p,.mir-doc .step p,.mir-doc .box p{font-size:12px}
  .mir-doc .pull p{font-size:13px}
  .mir-doc .hero{padding:16px 18px;box-shadow:none}
  .mir-doc .hero h3{font-size:18px}
  .mir-doc .hero p{font-size:12.5px}
  .mir-doc .chips li{font-size:11.5px;padding:4px 10px}
  .mir-doc .cards{grid-template-columns:1fr 1fr;gap:9px}
  .mir-doc .card{padding:12px 14px}
  .mir-doc .card h3{font-size:13.5px}
  .mir-doc .card p{font-size:12px}
  .mir-doc .goal{font-size:12.5px;padding:12px 14px}
  .mir-doc .box{box-shadow:none;padding:16px}
  .mir-doc .step{padding:12px}
  .mir-doc .price{box-shadow:none;padding:18px}
  .mir-doc .price .big{font-size:36px}
  .mir-doc .price td{font-size:12.5px;padding:6px 0}
  .mir-doc .opt{font-size:12px;padding:9px 12px}
  .mir-doc .closing{padding:20px 22px;margin-top:22px}
  .mir-doc .closing h2{font-size:21px}
  .mir-doc .closing p{font-size:13px}
  .mir-doc .closing .ctas{display:none}
  .mir-doc .fact,.mir-doc .byline .pill,.mir-doc .chips li,.mir-doc .goal,.mir-doc .opt,.mir-doc .hero .tag,.mir-doc .closing,.mir-doc .step{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .mir-doc .facts{grid-template-columns:1fr 1fr}
  .mir-doc .steps{grid-template-columns:1fr 1fr}
  .mir-doc .two,.mir-doc .price{grid-template-columns:1fr 1fr}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const FAKTI = [
  { h: "Нов, по-голям магазин", p: "Храни и хранителни стоки. Тук започваме — магазинът е на първо място." },
  { h: "Грешките при вкарването на стока", p: "Понякога човекът сгреши при въвеждането. Това е най-честата болка — и първото, което оправяме." },
  { h: "Млад екип", p: "Хората имат нужда от ясно ръководство какво да свършат през деня, а не от бележки и устни напътствия." },
  { h: "Фирма за почистване", p: "Рестартира по-късно. Подреждаме я във втора фаза, когато магазинът върви гладко." },
];

const MAGAZIN = [
  { n: "01", h: "Автоматични поръчки към доставчиците", p: "Задавате минимално и максимално количество. Когато стоката падне под минимума, системата подготвя поръчката към доставчика — например Вазаро." },
  { n: "02", h: "Дигитално приемане на доставките", p: "Стоката се приема на таблет, а не се вкарва на ръка. По-малко грешки при въвеждането и по-малко време на гишето." },
  { n: "03", h: "Таблет с дневни задачи", p: "Всеки ден екипът вижда на екрана какво да свърши. Младите колеги знаят следващата стъпка, а Вие не обяснявате всичко отново." },
  { n: "04", h: "Дневник на търсените стоки", p: "Клиент пита за щипки за пране, а ги няма. Записва се с един бутон. Така виждате какво искат хората и какво да заредите." },
  { n: "05", h: "Партиди вместо тетрадки", p: "Всяка доставка е записана с партида. Знаете откъде е стоката и кога е влязла — без да ровите в тетрадки." },
  { n: "06", h: "Срокове на годност", p: "Системата Ви показва какво наближава срока си, за да го пуснете навреме на промоция или да го свалите от рафта." },
];

const POSLE = [
  { h: "Карти за лоялни клиенти", p: "Клиентите се връщат по-често, когато получават нещо за вярността си." },
  { h: "Лични оферти във Viber", p: "Предложение, което отговаря на това, което човекът купува." },
  { h: "Известия за прясна доставка", p: "Когато пристигне стока от местните фермери, клиентите научават първи." },
];

const ZA_POCHISTVANE = [
  { n: "А", h: "Оферта по снимки и глас", p: "Правите оглед, снимате и казвате няколко думи. AI подготвя офертата за клиента." },
  { n: "Б", h: "Дигитални работни листове", p: "Екипът попълва на таблет, а клиентът се подписва на екрана." },
  { n: "В", h: "Чеклист за техниката", p: "Преди и след всяка работа — отметка за машини и препарати. Нищо не се забравя." },
];

export default function MiroslavOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">AI система за магазина · и за почистването</p>
        <h1>
          Стоката влиза без грешки, <em>а екипът е при клиентите</em>
        </h1>
        <p className="deck">
          Мирослав, благодаря за срещата. Подготвихме система по Вашите процеси: поръчки към
          доставчиците, приемане на стока, задачи за екипа и срокове на годност. Първо новият
          магазин, после фирмата за почистване.
        </p>
        <p className="byline">
          <span className="pill">Пълна автоматизация · 3 000 €</span>
          <span>За Мирослав Миланов · от Ивайло Петев, Pro Marketing</span>
          <span className="num">19.10.2026</span>
          <a className="pdf" href={PDF}>Свали като PDF</a>
        </p>
      </header>

      <section>
        <p className="kick">Откъде тръгваме</p>
        <h2 className="h2sub">Това, което ми разказахте</h2>
        <div className="facts">
          {FAKTI.map((f) => (
            <article className="fact" key={f.h}>
              <h3>{f.h}</h3>
              <p>{f.p}</p>
            </article>
          ))}
        </div>
        <div className="pull">
          <p>„Понякога човекът прави грешка при вкарването на стоки.“</p>
          <span className="src">Затова започваме оттам: стоката се приема дигитално и всичко е записано от първия момент.</span>
        </div>
      </section>

      <section className="sec-build">
        <p className="kick">Фаза 1 · Магазинът</p>
        <h2 className="h2sub">Шест неща, които работят вместо Вас</h2>
        <p className="lead">
          Всичко е по Ваша мярка. Описвате ни как работите, ние го превръщаме в система, която
          екипът ползва от първия ден.
        </p>
        <div className="cards">
          {MAGAZIN.map((k) => (
            <article className="card" key={k.n}>
              <span className="n">{k.n}</span>
              <h3>{k.h}</h3>
              <p>{k.p}</p>
            </article>
          ))}
        </div>
        <p className="goal">
          <b>Резултатът:</b> по-малко време за въвеждане и проверки, нито една забравена поръчка,
          а хората Ви са свободни за клиентите.
        </p>
      </section>

      <section>
        <p className="kick">Касите и MicroInvest</p>
        <h2 className="h2sub">Какво сменяме и какво остава</h2>
        <div className="two">
          <div className="box">
            <h3>Системата може да замени MicroInvest</h3>
            <p>
              За всичко освен касите: наличности, поръчки, приемане, партиди, срокове. Ако MicroInvest
              ни даде API достъп, AI работи директно с него и не променяте нищо отведнъж.
            </p>
          </div>
          <div className="box">
            <h3>Касовите апарати остават</h3>
            <p>
              Фискалните устройства изискват лиценз от НАП, а ние такъв нямаме. Затова касите си
              остават каквито са, а системата работи около тях.
            </p>
          </div>
        </div>
      </section>

      <section>
        <p className="kick">По-нататък</p>
        <h2 className="h2sub">Когато магазинът върви гладко</h2>
        <div className="cards">
          {POSLE.map((k) => (
            <article className="card" key={k.h}>
              <h3>{k.h}</h3>
              <p>{k.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Фаза 2 · Фирмата за почистване</p>
        <h2 className="h2sub">Когато рестартирате</h2>
        <div className="steps">
          {ZA_POCHISTVANE.map((s) => (
            <article className="step" key={s.n}>
              <span className="d">{s.n}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sec-price">
        <p className="kick">Условията</p>
        <h2 className="h2sub">Цената, както я разбрахме на срещата</h2>
        <div className="price">
          <div>
            <p className="big num">3 000 €<small>общо</small></p>
            <p className="sub">пълна автоматизация и обучение на персонала</p>
            <p className="opt hl"><b>Започваме с аванс от 1 000 €.</b> Така пускаме магазина първи, без да чакате.</p>
            <p className="opt"><b>Обучението е включено:</b> екипът Ви се учи върху собствените си процеси.</p>
          </div>
          <div>
            <h3>Какво влиза</h3>
            <table>
              <tbody>
                <tr><td>Магазинът (фаза 1)</td><td className="v">първо</td></tr>
                <tr><td>Фирмата за почистване (фаза 2)</td><td className="v">след това</td></tr>
                <tr><td>Обучение на персонала</td><td className="v">включено</td></tr>
                <tr><td>Връзка с MicroInvest</td><td className="v">при API достъп</td></tr>
                <tr><td>Касови апарати</td><td className="v">остават</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Опишете ни точно какво искате в магазина: кои доставчици, кои стоки, какви минимуми.
          Колкото по-ясно, толкова по-бързо тръгваме.
        </p>
        <p>Следващата седмица правим кратка среща и фиксираме обхвата. Радваме се да започнем.</p>
        <p className="ctas">
          <a className="btn" href="/booking">Избери час за среща</a>
          <a className="btn" href="mailto:emmgivailopetev38@gmail.com?subject=%D0%9E%D0%B1%D1%85%D0%B2%D0%B0%D1%82%20%D0%B7%D0%B0%20%D0%BC%D0%B0%D0%B3%D0%B0%D0%B7%D0%B8%D0%BD%D0%B0">Пишете ми</a>
          <a className="btn" href="tel:+359877399963">0877 399 963</a>
        </p>
      </section>

      <p className="sig">
        <b>Ивайло Петев</b> · Pro Marketing
        <br />
        0877 399 963 · emmgivailopetev38@gmail.com
        <br />
        🌐 petevai.com · promarketing.pw
      </p>
    </main>
  );
}
