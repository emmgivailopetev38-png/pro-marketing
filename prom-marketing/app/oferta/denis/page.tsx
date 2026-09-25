/**
 * Менторска програма за инж. Денис Коев — 3 месеца, 2 000 €.
 *
 * Разговорът с Ивайло: предложена е менторска програма за три месеца, по един
 * час седмично на живо, в която Денис се учи да прави AI системи, маркетинг,
 * сайтове, онлайн продажби и търговия, продажбени разговори и психологията зад
 * тях. Страницата подрежда точно това, което е казано на глас, върху неговия
 * бизнес — кредитно консултантство, счетоводство и обучения.
 *
 * Обръщението е на „Вие“ — първи писмен документ към фирмен човек.
 * Примерите за неговия бранш са надписани като примерни: той избира върху кое
 * работим.
 */

const CSS = `
.den-doc{
  --ground:#FAF9F5; --panel:#F1EFE7; --surface:#FFFFFF;
  --ink:#16181C; --ink-2:#4E545C; --ink-3:#848A92;
  --rule:#E3E0D6; --rule-soft:#EDEBE2;
  --accent:#12594A; --accent-soft:#E2F0EB; --accent-ink:#F3FBF8;
  --gold:#96650C; --gold-soft:#FAF0DC;
  --sky:#28518F; --sky-soft:#E8EEF9;
  --shadow:0 1px 2px rgba(22,24,28,.05), 0 10px 28px -18px rgba(22,24,28,.26);
  background:var(--ground); color:var(--ink);
  font-family:var(--den-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.den-doc *{box-sizing:border-box}
.den-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.den-doc h1,.den-doc h2,.den-doc h3,.den-doc h4{font-family:var(--den-ui),Arial,sans-serif;letter-spacing:-.014em;text-wrap:balance}
.den-doc .mono{font-family:var(--den-mono),monospace;font-variant-numeric:tabular-nums}
.den-doc a{color:var(--accent);text-underline-offset:3px}
.den-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.den-doc p{margin:0}

/* ── шапка ── */
.den-doc .masthead{padding:58px 0 34px;border-bottom:1px solid var(--rule)}
.den-doc .eyebrow{font-family:var(--den-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.den-doc h1{font-size:46px;line-height:1.07;font-weight:700;margin:0 0 18px;max-width:19ch}
.den-doc h1 em{font-style:normal;color:var(--accent)}
.den-doc .deck{font-size:19px;line-height:1.56;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.den-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-family:var(--den-ui),sans-serif;font-size:14px;color:var(--ink-3)}
.den-doc .byline .pill{font-family:var(--den-mono),monospace;font-weight:500;font-size:14px;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:6px 14px}

/* ── секции ── */
.den-doc section{margin:52px 0 0}
.den-doc .kick{font-family:var(--den-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin:0 0 10px}
.den-doc .h2sub{font-size:29px;line-height:1.2;font-weight:700;margin:0 0 14px;max-width:26ch}
.den-doc .lead{font-size:17px;color:var(--ink-2);max-width:66ch;margin:0 0 22px}
.den-doc .lead + .lead{margin-top:-8px}

/* ── шестте посоки ── */
.den-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px}
.den-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px 22px 20px;box-shadow:var(--shadow);display:flex;flex-direction:column}
.den-doc .card .num{font-family:var(--den-mono),monospace;font-size:12px;color:var(--accent);letter-spacing:.12em;display:block;margin:0 0 8px}
.den-doc .card h3{font-size:17.5px;font-weight:700;margin:0 0 8px}
.den-doc .card p{font-size:15px;line-height:1.56;color:var(--ink-2)}
.den-doc .card .you{margin:14px 0 0;padding:10px 12px;border-radius:9px;background:var(--accent-soft);font-size:13.5px;line-height:1.5;color:var(--ink)}
.den-doc .card .you b{font-family:var(--den-ui),sans-serif;font-weight:600;color:var(--accent)}
.den-doc .card p:not(.you){flex:1 1 auto}

/* ── как минава часът ── */
.den-doc .hour{display:grid;grid-template-columns:auto 1fr;gap:0 18px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.den-doc .hour .t{font-family:var(--den-mono),monospace;font-size:13.5px;color:var(--accent);padding:14px 0;border-top:1px dashed var(--rule-soft);white-space:nowrap}
.den-doc .hour .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule-soft)}
.den-doc .hour .t:first-child,.den-doc .hour .t:first-child+.w{border-top:0}
.den-doc .hour .w b{color:var(--ink);font-weight:600}
.den-doc .note{font-size:13.5px;color:var(--ink-3);margin:10px 0 0}

/* ── трите месеца ── */
.den-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
.den-doc .step{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:20px}
.den-doc .step .d{font-family:var(--den-mono),monospace;font-size:12px;letter-spacing:.1em;color:var(--gold);text-transform:uppercase;display:block;margin:0 0 7px}
.den-doc .step h3{font-size:16.5px;margin:0 0 7px}
.den-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── за Вашия бранш ── */
.den-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 20px}
.den-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.den-doc .pull .src{display:block;margin-top:8px;font-family:var(--den-ui),sans-serif;font-size:13px;color:var(--ink-3)}
.den-doc .branch{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.den-doc .bx{background:var(--panel);border-radius:12px;padding:18px 20px}
.den-doc .bx h3{font-size:16px;margin:0 0 6px}
.den-doc .bx p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── списъци ── */
.den-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.den-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px}
.den-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15.5px;line-height:1.5;color:var(--ink-2)}
.den-doc .list li i{font-style:normal;color:var(--accent);font-weight:700}
.den-doc .list li b{color:var(--ink);font-weight:600}
.den-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.den-doc .box h3{font-size:16px;margin:0 0 14px}

/* ── цената ── */
.den-doc .price{display:grid;grid-template-columns:1.05fr 1fr;gap:20px;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:28px;box-shadow:var(--shadow)}
.den-doc .price .big{font-family:var(--den-ui),sans-serif;font-weight:700;font-size:46px;line-height:1;margin:0 0 6px;color:var(--ink)}
.den-doc .price .big small{font-size:18px;font-weight:600;color:var(--ink-3);margin-left:8px}
.den-doc .price .sub{font-family:var(--den-mono),monospace;font-size:13px;color:var(--ink-3);margin:0 0 16px}
.den-doc .price h3{font-size:15px;margin:0 0 8px}
.den-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.den-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.den-doc .price td.v{font-family:var(--den-mono),monospace;color:var(--ink);text-align:right;white-space:nowrap}
.den-doc .price tr:first-child td{border-top:0}
.den-doc .opt{margin:14px 0 0;padding:12px 14px;border-radius:10px;background:var(--panel);font-size:14px;line-height:1.55;color:var(--ink-2)}
.den-doc .opt b{color:var(--ink);font-weight:600}

/* ── следваща стъпка ── */
.den-doc .closing{background:var(--accent);color:var(--accent-ink);border-radius:16px;padding:32px 32px 28px;margin-top:52px}
.den-doc .closing h2{color:#fff;font-size:27px;margin:0 0 10px}
.den-doc .closing p{font-size:16.5px;line-height:1.6;color:rgba(255,255,255,.92);max-width:62ch}
.den-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.den-doc .closing a.btn{font-family:var(--den-ui),sans-serif;font-weight:600;text-decoration:none;color:var(--accent);background:#fff;border-radius:10px;padding:12px 18px;font-size:15px}
.den-doc .closing a.ghost{color:#fff;background:transparent;border:1px solid rgba(255,255,255,.55)}
.den-doc .sig{margin:26px 0 0;font-family:var(--den-ui),sans-serif;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.den-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .den-doc h1{font-size:33px}
  .den-doc .two,.den-doc .price{grid-template-columns:1fr}
  .den-doc .price .big small{display:block;margin:6px 0 0}
  .den-doc .masthead{padding:36px 0 26px}
  .den-doc .hour{grid-template-columns:1fr;padding:14px 20px}
  .den-doc .hour .t{padding:14px 0 0;border-top:1px dashed var(--rule-soft)}
  .den-doc .hour .w{padding:4px 0 14px;border-top:0}
  .den-doc .hour .t:first-child{border-top:0}
}
@media print{
  html,body{background:#fff}
  .den-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .den-doc .wrap{max-width:none;padding:0}
  .den-doc .masthead{padding:0 0 16px}
  .den-doc h1{font-size:30px;margin-bottom:12px}
  .den-doc .deck{font-size:14px}
  .den-doc section{margin:24px 0 0;break-inside:avoid}
  .den-doc .h2sub{font-size:20px;margin-bottom:10px}
  .den-doc .lead{font-size:13px;margin-bottom:14px}
  .den-doc .cards{grid-template-columns:1fr 1fr;gap:10px}
  .den-doc .card{padding:14px 16px;box-shadow:none;break-inside:avoid}
  .den-doc .card h3{font-size:14px}
  .den-doc .card p{font-size:12px}
  .den-doc .card .you{font-size:11.5px;padding:7px 9px}
  .den-doc .hour{box-shadow:none}
  .den-doc .hour .t,.den-doc .hour .w{padding:8px 0;font-size:12px}
  .den-doc .step{padding:12px}
  .den-doc .step p{font-size:12px}
  .den-doc .price{box-shadow:none;padding:18px}
  .den-doc .price .big{font-size:34px}
  .den-doc .closing{padding:20px 22px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .den-doc .card .you,.den-doc .opt,.den-doc .byline .pill,.den-doc .pull,.den-doc .bx{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const POSOKI = [
  {
    n: "01",
    title: "AI системи",
    body: "Как се строи агент, който говори с хората вместо Вас — по телефона, в чата, по имейл. Как се връзва с календара, с базата и с документите. Как се пише промпт, който върши работа, и как се поправя, когато сбърка.",
    you: "Накрая сам си пускате агент за нов процес, без да чакате никого.",
  },
  {
    n: "02",
    title: "Маркетинг, който води хора",
    body: "Реклами във Facebook и Instagram от нулата: публика, бюджет, форма за заявки, какво се мери и кога се спира. Видеата и текстовете, които карат човек да остави телефона си. Защо едно и също предложение с две различни думи дава двойно различна цена на заявка.",
    you: "Знаете колко Ви струва един клиент и кое точно да пипнете, за да поевтинее.",
  },
  {
    n: "03",
    title: "Сайтове — сами",
    body: "От празна страница до жив сайт с домейн, форма и проследяване. С AI пишете кода и текстовете, качвате го, променяте го в същия ден. Целева страница за една услуга, за една реклама, за един клиент.",
    you: "Нова страница за нова услуга Ви отнема вечер, не месец и оферта от агенция.",
  },
  {
    n: "04",
    title: "Онлайн продажби и търговия",
    body: "Как се подрежда пътят от първия клик до платената фактура: какво вижда човекът, кога му пишете, с какво го връщате. Онлайн магазин, дигитален продукт, платена консултация, абонамент — кое за кой бизнес работи и защо.",
    you: "Имате система, която продава и когато Вие не сте на телефона.",
  },
  {
    n: "05",
    title: "Продажбеният разговор",
    body: "Структурата на разговора дума по дума: отварянето, въпросите, които карат човека сам да си каже болката, кога се казва цената и защо след нея се мълчи. Тренираме на живо — Вие говорите, аз съм клиентът.",
    you: "Влизате в разговор със скрипт в главата, не с надежда.",
  },
  {
    n: "06",
    title: "Психологията зад него",
    body: "Защо човек казва „ще помисля“ и какво стои отдолу. Как се работи с възражение, без да се спори. Кога намалената цена убива сделката. Как се държи рамката, когато отсреща натискат.",
    you: "Спирате да губите готови клиенти в последните две минути.",
  },
];

const CHASAT = [
  { t: "0–10 мин.", w: "Какво се случи от миналия път: какво работи, къде заби. Тръгваме от Вашата седмица, не от учебник." },
  { t: "10–40 мин.", w: "Строим на живо — екранът е споделен. Пишем промпта, пускаме рекламата, вдигаме страницата, разиграваме разговора. Вие гледате как се прави и после го правите Вие." },
  { t: "40–55 мин.", w: "Въпросите Ви, точно върху това, което правим. Тук излизат нещата, които никой не пише в курсовете." },
  { t: "55–60 мин.", w: "Едно нещо за следващата седмица — конкретно, изпълнимо, Ваше." },
];

const MESECI = [
  {
    d: "Месец 1",
    h: "Основата и първата жива система",
    p: "Подреждаме къде текат парите и времето Ви днес. Избираме един процес и го автоматизираме докрай — заедно, пред Вас. Паралелно тръгва първата реклама и сайтът за нея.",
  },
  {
    d: "Месец 2",
    h: "Продажбите",
    p: "Сега вече има кой да Ви звъни. Стягаме разговора, възраженията и затварянето. Пускаме второто нещо — агент, магазин или страница, според това, което носи повече.",
  },
  {
    d: "Месец 3",
    h: "Вие водите",
    p: "Аз гледам отстрани. Вие строите, аз поправям и подавам новото, което е излязло междувременно. Накрая имате работещи системи и умението да правите следващите сам.",
  },
];

const BRANSH = [
  {
    h: "Запитването за кредит се поема само",
    p: "Човекът пише или звъни по всяко време и получава отговор веднага: какво търси, каква сума, какъв доход. Идва при Вас вече подреден, с документите, които така или иначе бихте поискали.",
  },
  {
    h: "Документите се събират без гонене",
    p: "Системата помни кой какво още не е пратил и сама напомня. Вие виждате списък с това, което чака Вас — не с това, което чака клиента.",
  },
  {
    h: "Консултацията се продава онлайн",
    p: "Страница, която обяснява услугата, час от календара Ви и плащане преди срещата. Без размяна на десет съобщения, за да се уговори час.",
  },
  {
    h: "Обучението става продукт",
    p: "Това, което знаете, се превръща в нещо, което се продава и когато спите: модули, достъп, плащане. AI върши тежката част от подготовката.",
  },
];

export default function DenisOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">Менторска програма · за инж. Денис Коев</p>
        <h1>
          Три месеца, след които <em>сам строите</em> това, за което другите плащат на агенции
        </h1>
        <p className="deck">
          По един час седмично на живо с мен. Не лекции — сядаме и правим нещата върху Вашия
          бизнес: AI системите, рекламите, сайтовете, онлайн продажбите и самия продажбен
          разговор. Каквото построим, остава Ваше и продължава да работи и след третия месец.
        </p>
        <p className="byline">
          <span className="pill">3 месеца · 2 000 €</span>
          <span>Pro Marketing · Ивайло Петев</span>
          <span className="mono">23.09.2026</span>
        </p>
      </header>

      <section>
        <p className="kick">Защо точно това</p>
        <h2 className="h2sub">Знанието, което не се обезценява</h2>
        <p className="lead">
          Можете да си купите готова система. След година тя ще е остаряла и ще трябва да си
          купите нова. Или можете да научите как се строи — и тогава всяко следващо нещо, което
          излезе, е просто още един инструмент в ръцете Ви.
        </p>
        <p className="lead">
          Затова програмата е менторска, а не абонамент за услуга. Аз не Ви правя нещата, за да
          зависите от мен. Правим ги заедно, на споделен екран, докато не Ви станат лесни. В
          края нямате папка с материали — имате работещи системи и умението да правите следващите
          сами.
        </p>
      </section>

      <section>
        <p className="kick">Какво влиза</p>
        <h2 className="h2sub">Шестте посоки, които покриваме</h2>
        <p className="lead">
          Всяка от тях влиза с ръцете, не с теория. Редът се подрежда по това, което носи най-бързо
          резултат при Вас.
        </p>
        <div className="cards">
          {POSOKI.map((k) => (
            <article className="card" key={k.n}>
              <span className="num">{k.n}</span>
              <h3>{k.title}</h3>
              <p>{k.body}</p>
              <p className="you">
                <b>За Вас:</b> {k.you}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Как минава седмицата</p>
        <h2 className="h2sub">Един час, в който се свършва работа</h2>
        <div className="hour">
          {CHASAT.map((r) => (
            <div style={{ display: "contents" }} key={r.t}>
              <div className="t">{r.t}</div>
              <div className="w">{r.w}</div>
            </div>
          ))}
        </div>
        <p className="note">
          Часът се уговаря за ден и време, които са Ваши — и остават същите през трите месеца, за
          да има ритъм. Ако седмица пропадне, се измества, не изгаря.
        </p>
      </section>

      <section>
        <p className="kick">Пътят</p>
        <h2 className="h2sub">Трите месеца</h2>
        <div className="steps">
          {MESECI.map((m) => (
            <article className="step" key={m.d}>
              <span className="d">{m.d}</span>
              <h3>{m.h}</h3>
              <p>{m.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Върху Вашия бизнес</p>
        <h2 className="h2sub">Кредитно консултантство, счетоводство, обучения</h2>
        <div className="pull">
          <p>
            Програмата не се води върху измислен пример. Води се върху Вашите клиенти, Вашите
            запитвания и Вашите документи — затова след всеки час имате нещо работещо, а не записки.
          </p>
          <span className="src">Четирите неща отдолу са примерни посоки. Кое влиза първо, избирате Вие.</span>
        </div>
        <div className="branch">
          {BRANSH.map((b) => (
            <article className="bx" key={b.h}>
              <h3>{b.h}</h3>
              <p>{b.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Честно</p>
        <h2 className="h2sub">Какво получавате и какво се иска от Вас</h2>
        <div className="two">
          <div className="box">
            <h3>Получавате</h3>
            <ul className="list">
              <li>
                <i>✓</i>
                <span>
                  <b>12 срещи на живо</b> по един час, споделен екран, всичко върху Вашия бизнес.
                </span>
              </li>
              <li>
                <i>✓</i>
                <span>
                  <b>Записите от срещите</b> — гледате ги, когато правите нещото сам.
                </span>
              </li>
              <li>
                <i>✓</i>
                <span>
                  <b>Готовите неща остават Ваши</b> — акаунти, код, промптове, страници. Всичко на
                  Ваше име.
                </span>
              </li>
              <li>
                <i>✓</i>
                <span>
                  <b>Връзка между срещите</b> — заседна ли нещо, пишете ми и не чакате седмица.
                </span>
              </li>
              <li>
                <i>✓</i>
                <span>
                  <b>Моите работещи схеми</b> — рекламите, скриптовете и автоматизациите, които вече
                  въртят пари при нас и при клиентите ни.
                </span>
              </li>
            </ul>
          </div>
          <div className="box">
            <h3>Иска се от Вас</h3>
            <ul className="list">
              <li>
                <i>→</i>
                <span>
                  <b>Часът седмично е свещен</b> — в него не се вдига телефон.
                </span>
              </li>
              <li>
                <i>→</i>
                <span>
                  <b>По няколко часа между срещите</b>, за да упражните наученото. Без това остава
                  теория.
                </span>
              </li>
              <li>
                <i>→</i>
                <span>
                  <b>Достъп до Вашите неща</b> — страница, рекламен акаунт, календар. Работим върху
                  живото.
                </span>
              </li>
              <li>
                <i>→</i>
                <span>
                  <b>Да казвате, когато нещо не е ясно.</b> Тук няма глупав въпрос, има само
                  премълчан.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <p className="kick">Условията</p>
        <h2 className="h2sub">Цената, както Ви я казах</h2>
        <div className="price">
          <div>
            <p className="big">
              2 000 €<small>за цялата програма</small>
            </p>
            <p className="sub">3 месеца · 12 срещи · всичко построено е Ваше</p>
            <p className="opt">
              <b>Плащането</b> може наведнъж или на две вноски по 1 000 € — в началото на първия и на втория
              месец, както Ви е удобно.
            </p>
            <p className="opt">
              <b>Ако решите да спрете</b> след първия месец, не дължите останалите вноски.
              Започнатото дотогава се довършва.
            </p>
          </div>
          <div>
            <h3>Какво влиза в сумата</h3>
            <table>
              <tbody>
                <tr>
                  <td>Срещи на живо, по 1 час</td>
                  <td className="v">12</td>
                </tr>
                <tr>
                  <td>Записи от всяка среща</td>
                  <td className="v">включено</td>
                </tr>
                <tr>
                  <td>Връзка между срещите</td>
                  <td className="v">включено</td>
                </tr>
                <tr>
                  <td>Системите, които построим</td>
                  <td className="v">Ваши</td>
                </tr>
                <tr>
                  <td>Скриптове, промптове, схеми</td>
                  <td className="v">Ваши</td>
                </tr>
              </tbody>
            </table>
            <p className="opt">
              За сравнение: самостоятелното фирмено обучение при нас е 3 900 €, а внедряването на
              една готова система — от 1 900 € нагоре, без да Ви остава умението.
            </p>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Да започваме</h2>
        <p>
          Първата среща може да е още тази седмица. Кажете ми кой ден и час Ви е удобен и я
          запазвам — или си изберете директно свободен час от календара ми.
        </p>
        <p className="ctas">
          <a className="btn" href="https://promarketing.pw/booking">
            Избирам час
          </a>
          <a className="btn ghost" href="mailto:office@promarketing.pw">
            Пишете ми
          </a>
        </p>
      </section>

      <p className="sig">
        <b>Ивайло Петев</b> · Pro Marketing
        <br />
        0877 399 963 · office@promarketing.pw · promarketing.pw
      </p>
    </main>
  );
}
