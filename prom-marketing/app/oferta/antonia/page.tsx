/**
 * Оферта за Антония Сакарова (asakarova@abv.bg) — две дейности: текстилен бизнес + нов бизнес
 * за личностно развитие / NLP консултации. Среща с Ивайло 19.10.2026 (Fathom 193840771).
 *
 * Казано на срещата: болката е визуалното съдържание (корици, профилни, постове) — отнема много
 * време и не изглежда професионално; ползва платен ChatGPT само за текст. Показана е AI система
 * с гласови команди: 3–5 кратки видеа на ден за мрежите, имейли, реклами, следене на контакти,
 * AI обучен да пише в нейния стил; работи локално или онлайн, управлява се от телефона.
 * Две възможности: 1) 4 месеца 1:1 — 1 800 € без ДДС, 50 % предварително и 50 % във втория месец;
 * 2) онлайн курс със собствено темпо — 500 € без ДДС, без лично менторство.
 * Обръщение: „Вие“. Без измислени числа, отзиви и „гарантирано“.
 */

const PDF = "/oferta/antonia/ProMarketing-za-Antonia.pdf";

const CSS = `
.ant-doc{
  --ground:#F7F8F5; --panel:#ECF2EE; --surface:#FFFFFF;
  --ink:#17201C; --ink-2:#47544E; --ink-3:#7B8781;
  --rule:#DCE4DF; --rule-soft:#EAF0EC;
  --accent:#1F5C4A; --accent-soft:#E6F1EB; --accent-line:#BCD8CB;
  --warm:#9A6A1C; --warm-soft:#F8F0E0;
  --shadow:0 1px 2px rgba(23,32,28,.05), 0 12px 30px -20px rgba(23,32,28,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--ant-ui),Arial,sans-serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.ant-doc *{box-sizing:border-box}
.ant-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.ant-doc h1,.ant-doc h2{font-family:var(--ant-display),Georgia,serif;font-weight:600;letter-spacing:-.01em;text-wrap:balance}
.ant-doc h3{font-family:var(--ant-ui),Arial,sans-serif;font-weight:600;letter-spacing:-.01em}
.ant-doc .num{font-variant-numeric:tabular-nums}
.ant-doc a{color:var(--accent);text-underline-offset:3px}
.ant-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.ant-doc p{margin:0}

/* ── шапка ── */
.ant-doc .masthead{padding:60px 0 36px;border-bottom:1px solid var(--rule)}
.ant-doc .eyebrow{font-weight:600;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.ant-doc h1{font-size:48px;line-height:1.08;margin:0 0 20px;max-width:20ch}
.ant-doc h1 em{font-style:italic;color:var(--accent)}
.ant-doc .deck{font-size:19px;line-height:1.58;color:var(--ink-2);max-width:62ch;margin:0 0 24px}
.ant-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-size:14px;color:var(--ink-3)}
.ant-doc .byline .pill{font-weight:600;font-size:14px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:999px;padding:6px 14px}
.ant-doc .byline a{font-weight:600}

/* ── секции ── */
.ant-doc section{margin:56px 0 0}
.ant-doc .kick{font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--warm);margin:0 0 10px}
.ant-doc .h2sub{font-size:31px;line-height:1.18;margin:0 0 14px;max-width:26ch}
.ant-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.ant-doc .note{font-size:14px;color:var(--ink-3);margin:12px 0 0;max-width:70ch}

/* ── откъде тръгваме ── */
.ant-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 20px}
.ant-doc .fact{background:var(--panel);border-radius:14px;padding:18px 20px}
.ant-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.ant-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.ant-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 14px 14px 0;padding:18px 22px;box-shadow:var(--shadow)}
.ant-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.ant-doc .pull .src{display:block;margin-top:8px;font-size:13.5px;color:var(--ink-3)}

/* ── какво изграждаме ── */
.ant-doc .hero{background:var(--surface);border:1px solid var(--accent-line);border-radius:18px;padding:26px 26px 24px;box-shadow:var(--shadow);margin:0 0 14px}
.ant-doc .hero .tag{display:inline-block;font-weight:600;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:4px 12px;margin:0 0 12px}
.ant-doc .hero h3{font-family:var(--ant-display),Georgia,serif;font-size:26px;line-height:1.2;margin:0 0 10px}
.ant-doc .hero p{font-size:16px;line-height:1.6;color:var(--ink-2);max-width:68ch}
.ant-doc .chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;padding:0;list-style:none}
.ant-doc .chips li{font-size:14px;font-weight:500;color:var(--ink);background:var(--panel);border-radius:999px;padding:6px 13px}
.ant-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.ant-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:20px 20px 18px}
.ant-doc .card .n{font-weight:600;font-size:12px;color:var(--warm);letter-spacing:.12em;display:block;margin:0 0 8px}
.ant-doc .card h3{font-size:16.5px;margin:0 0 7px}
.ant-doc .card p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.ant-doc .goal{margin:14px 0 0;padding:16px 20px;border-radius:14px;background:var(--warm-soft);font-size:16px;line-height:1.55;color:var(--ink)}
.ant-doc .goal b{color:var(--warm);font-weight:600}

/* ── две колони ── */
.ant-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.ant-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.ant-doc .box h3{font-size:16.5px;margin:0 0 8px}
.ant-doc .box p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── как работим ── */
.ant-doc .rows{display:grid;grid-template-columns:auto 1fr;gap:0 20px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.ant-doc .rows .t{font-weight:600;font-size:14.5px;color:var(--accent);padding:14px 0;border-top:1px dashed var(--rule);max-width:16ch}
.ant-doc .rows .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule)}
.ant-doc .rows .t:first-child,.ant-doc .rows .t:first-child+.w{border-top:0}
.ant-doc .rows .w b{color:var(--ink);font-weight:600}

/* ── месеците ── */
.ant-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.ant-doc .step{background:var(--surface);border:1px solid var(--rule);border-top:3px solid var(--accent);border-radius:12px;padding:20px}
.ant-doc .step .d{font-weight:600;font-size:12px;letter-spacing:.12em;color:var(--warm);text-transform:uppercase;display:block;margin:0 0 7px}
.ant-doc .step h3{font-size:16.5px;margin:0 0 7px}
.ant-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── цената ── */
.ant-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:28px;box-shadow:var(--shadow)}
.ant-doc .price.light{margin-top:14px;background:var(--surface);border-color:var(--rule)}
.ant-doc .price .big{font-family:var(--ant-display),Georgia,serif;font-weight:700;font-size:50px;line-height:1;margin:0 0 8px;color:var(--ink)}
.ant-doc .price .big small{font-family:var(--ant-ui),Arial,sans-serif;font-size:18px;font-weight:500;color:var(--ink-3);margin-left:10px;white-space:nowrap;display:inline-block}
.ant-doc .price .sub{font-size:14px;color:var(--ink-3);margin:0 0 16px}
.ant-doc .price .label{display:inline-block;font-weight:600;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:4px 12px;margin:0 0 12px}
.ant-doc .price .label.alt{color:var(--warm);background:var(--warm-soft)}
.ant-doc .price h3{font-size:15px;margin:0 0 8px}
.ant-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.ant-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.ant-doc .price td.v{color:var(--ink);font-weight:500;text-align:right;white-space:nowrap;padding-left:14px}
.ant-doc .price tr:first-child td{border-top:0}
.ant-doc .opt{margin:12px 0 0;padding:12px 14px;border-radius:12px;background:var(--panel);font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.ant-doc .opt b{color:var(--ink);font-weight:600}
.ant-doc .opt.hl{background:var(--accent-soft)}
.ant-doc .opt.hl b{color:var(--accent)}

/* ── следващата стъпка ── */
.ant-doc .closing{background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:18px;padding:32px 32px 28px;margin-top:56px}
.ant-doc .closing h2{font-size:29px;margin:0 0 10px;color:var(--ink)}
.ant-doc .closing p{font-size:16.5px;line-height:1.6;color:var(--ink-2);max-width:62ch}
.ant-doc .closing p + p{margin-top:10px}
.ant-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.ant-doc .closing a.btn{font-weight:600;text-decoration:none;color:var(--accent);background:var(--surface);border:1px solid var(--accent-line);border-radius:12px;padding:12px 18px;font-size:15px}
.ant-doc .sig{break-inside:avoid;margin:26px 0 0;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.ant-doc .sig b{color:var(--ink)}
.ant-doc .sig .site{display:block;margin-top:6px;font-size:12.5px}

@media (max-width:760px){
  .ant-doc{font-size:16.5px}
  .ant-doc .wrap{padding:0 18px 72px}
  .ant-doc h1{font-size:34px}
  .ant-doc .deck{font-size:17.5px}
  .ant-doc .h2sub{font-size:25px}
  .ant-doc .masthead{padding:38px 0 28px}
  .ant-doc section{margin:44px 0 0}
  .ant-doc .hero{padding:22px 20px 20px}
  .ant-doc .hero h3{font-size:22px}
  .ant-doc .two,.ant-doc .price{grid-template-columns:1fr}
  .ant-doc .price{padding:22px 20px}
  .ant-doc .price .big{font-size:42px}
  .ant-doc .rows{grid-template-columns:1fr;padding:14px 20px}
  .ant-doc .rows .t{padding:14px 0 0;border-top:1px dashed var(--rule);max-width:none}
  .ant-doc .rows .w{padding:4px 0 14px;border-top:0}
  .ant-doc .rows .t:first-child{border-top:0}
  .ant-doc .closing{padding:24px 20px 22px}
}
@media print{
  html,body{background:#fff}
  .ant-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .ant-doc .wrap{max-width:none;padding:0}
  .ant-doc .masthead{padding:0 0 16px}
  .ant-doc h1{font-size:30px;margin-bottom:12px}
  .ant-doc .deck{font-size:14px;margin-bottom:14px}
  .ant-doc .byline .pdf{display:none}
  .ant-doc section{margin:22px 0 0}
  .ant-doc section.sec-build{break-before:page}
  .ant-doc section.sec-price{break-before:page}
  .ant-doc .kick,.ant-doc .h2sub,.ant-doc .lead{break-after:avoid}
  .ant-doc .h2sub{font-size:20px;margin-bottom:10px}
  .ant-doc .lead{font-size:13px;margin-bottom:12px}
  .ant-doc .fact,.ant-doc .card,.ant-doc .step,.ant-doc .box,.ant-doc .price,.ant-doc .pull,.ant-doc .hero,.ant-doc .goal,.ant-doc .rows,.ant-doc .closing{break-inside:avoid}
  .ant-doc .fact p,.ant-doc .step p,.ant-doc .box p{font-size:12px}
  .ant-doc .pull p{font-size:13px}
  .ant-doc .hero{padding:16px 18px;box-shadow:none}
  .ant-doc .hero h3{font-size:18px}
  .ant-doc .hero p{font-size:12.5px}
  .ant-doc .chips li{font-size:11.5px;padding:4px 10px}
  .ant-doc .cards{grid-template-columns:1fr 1fr;gap:9px}
  .ant-doc .card{padding:12px 14px}
  .ant-doc .card h3{font-size:13.5px}
  .ant-doc .card p{font-size:12px}
  .ant-doc .goal{font-size:12.5px;padding:12px 14px}
  .ant-doc .box{box-shadow:none;padding:16px}
  .ant-doc .rows{box-shadow:none;padding:6px 16px}
  .ant-doc .rows .t,.ant-doc .rows .w{padding:8px 0;font-size:12px}
  .ant-doc .step{padding:12px}
  .ant-doc .price{box-shadow:none;padding:18px}
  .ant-doc .price .big{font-size:36px}
  .ant-doc .price td{font-size:12.5px;padding:6px 0}
  .ant-doc .opt{font-size:12px;padding:9px 12px}
  .ant-doc .closing{padding:20px 22px;margin-top:22px}
  .ant-doc .closing h2{font-size:21px}
  .ant-doc .closing p{font-size:13px}
  .ant-doc .closing .ctas{display:none}
  .ant-doc .fact,.ant-doc .byline .pill,.ant-doc .chips li,.ant-doc .goal,.ant-doc .opt,.ant-doc .hero .tag,.ant-doc .price .label,.ant-doc .closing,.ant-doc .step{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* A4 е под 760px — връщаме колоните, които мобилният изглед сгъва */
  .ant-doc .facts{grid-template-columns:1fr 1fr}
  .ant-doc .steps{grid-template-columns:1fr 1fr}
  .ant-doc .two,.ant-doc .price{grid-template-columns:1fr 1fr}
  .ant-doc .rows{grid-template-columns:auto 1fr}
  .ant-doc .rows .t,.ant-doc .rows .w{border-top:1px dashed var(--rule)}
  .ant-doc .rows .t:first-child,.ant-doc .rows .t:first-child+.w{border-top:0}
  .ant-doc .rows .t{max-width:16ch}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const FAKTI = [
  {
    h: "Две дейности, един човек",
    p: "Текстилният Ви бизнес върви, а до него се ражда нов — за личностно развитие и NLP консултации. И двата искат да се виждат.",
  },
  {
    h: "Визуалното отнема твърде много",
    p: "Корици на страници, профилни снимки, публикации — правят се бавно и не излизат толкова професионални, колкото искате.",
  },
  {
    h: "AI Ви е позната, но за текст",
    p: "Ползвате платен ChatGPT за писане. Как AI да прави и картинките, и видеата — и да помага в текстилната работа — още не е ясно.",
  },
  {
    h: "Не бяхте планирали тази инвестиция",
    p: "Затова искате да се види точно какво получавате и дали си заслужава. Оставили сме го ясно по-долу.",
  },
];

const PURVO = [
  "корици на страници",
  "профилни снимки",
  "публикации",
  "кратки видеа",
  "имейли",
  "реклами",
];

const IZGRAZHDAME = [
  {
    n: "02",
    h: "Едно и също лице на двата бизнеса",
    p: "Подредена визия за текстила и отделна за новата дейност — всяка с характера си, и двете изглеждат професионално.",
  },
  {
    n: "03",
    h: "Текстове във Вашия стил",
    p: "AI се обучава да пише с Вашия тон и думи. Остава Вие да прочетете, да кажете „да“ и да публикувате.",
  },
  {
    n: "04",
    h: "3–5 кратки видеа на ден",
    p: "Кратки видеа за социалните мрежи, правени с гласови команди — без монтаж, без часове пред екрана.",
  },
  {
    n: "05",
    h: "Имейли и реклами",
    p: "Писма до клиенти и реклами, подготвени от AI и чакащи само Вашия поглед.",
  },
  {
    n: "06",
    h: "Следене на контактите",
    p: "Кой Ви е писал, на кого сте обещали отговор, кога да се чуете пак — на едно място, без да се губи хора.",
  },
  {
    n: "07",
    h: "AI и за текстилната работа",
    p: "Намираме къде AI реално помага в самата Ви работа с текстил — не само в мрежите — и го вкарваме в ежедневието.",
  },
];

const KAK = [
  {
    t: "Управление",
    w: "С <b>гласови команди</b> — казвате какво искате и системата го прави. Можете да я водите и от телефона.",
  },
  {
    t: "Къде работи",
    w: "<b>Локално или онлайн</b> — както Ви е по-удобно.",
  },
  {
    t: "Върху Вашето",
    w: "Работим върху Вашите реални бизнеси и процеси, не върху примери.",
  },
  {
    t: "Какво остава",
    w: "Всичко, което построим за Вас, остава Ваше.",
  },
];

const MESECI = [
  {
    d: "Месец 1",
    h: "Визията и първите видеа",
    p: "Подреждаме образа на двата бизнеса — корици, профилни, постове — и пускаме първите кратки видеа.",
  },
  {
    d: "Месец 2",
    h: "Текстове в Ваш стил",
    p: "AI се научава да пише като Вас: публикации, имейли, описания. Започваме ежедневния ритъм.",
  },
  {
    d: "Месец 3",
    h: "Контакти и реклами",
    p: "Следим контактите на едно място и подготвяме първите реклами за двете дейности.",
  },
  {
    d: "Месец 4",
    h: "Текстил + самостоятелност",
    p: "Вкарваме AI и в текстилната работа, и Вие водите системата сами, с гласа си.",
  },
];

export default function AntoniaOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">AI за двата Ви бизнеса</p>
        <h1>
          Професионален вид, <em>без часове пред екрана</em>
        </h1>
        <p className="deck">
          Радваме се, че се запознахме, Антония. Ето как AI може да поеме корици, профилни,
          публикации и видеа — за текстилния Ви бизнес и за новия, за личностно развитие — така че
          да изглеждате професионално всеки ден, а времето да остава за хората.
        </p>
        <p className="byline">
          <span className="pill">Две възможности · от 500 € без ДДС</span>
          <span>За Антония Сакарова · от Ивайло Петев, Pro Marketing</span>
          <span className="num">19.10.2026</span>
          <a className="pdf" href={PDF}>
            Свали като PDF
          </a>
        </p>
      </header>

      <section>
        <p className="kick">Откъде тръгваме</p>
        <h2 className="h2sub">Това, което разказахте на срещата</h2>
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
            Искате и двата бизнеса да изглеждат професионално и постоянно — без визуалното да Ви
            отнема дните.
          </p>
          <span className="src">
            Точно това изграждаме: система, която прави образа, видеата и текстовете, а Вие
            казвате „да“.
          </span>
        </div>
      </section>

      <section className="sec-build">
        <p className="kick">Какво получавате</p>
        <h2 className="h2sub">Визуалното — готово, и в Ваш стил</h2>
        <p className="lead">
          Системата, която видяхте на срещата, се управлява с гласови команди и пази Вашия тон във
          всичко, което прави.
        </p>

        <article className="hero">
          <span className="tag">01 · На първо място</span>
          <h3>Корици, профилни и публикации — за минути, не за часове</h3>
          <p>
            Казвате какво Ви трябва, а AI подготвя визията за двата бизнеса — в един и същ
            професионален вид, всеки път. Вместо да се мъчите с всяка картинка поотделно, имате
            готов образ, който просто поддържате.
          </p>
          <ul className="chips">
            {PURVO.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </article>

        <div className="cards">
          {IZGRAZHDAME.map((k) => (
            <article className="card" key={k.n}>
              <span className="n">{k.n}</span>
              <h3>{k.h}</h3>
              <p>{k.p}</p>
            </article>
          ))}
        </div>

        <p className="goal">
          <b>Целта:</b> и двата бизнеса да се виждат постоянно и професионално, а времето, което
          досега отиваше по картинки, да се върне при клиентите, консултациите и текстила.
        </p>
      </section>

      <section>
        <p className="kick">Какво видяхте на срещата</p>
        <h2 className="h2sub">Система, която вече работи всеки ден</h2>
        <div className="two">
          <div className="box">
            <h3>Видеа с гласова команда</h3>
            <p>
              От 3 до 5 кратки видеа на ден за социалните мрежи — казвате идеята, системата
              сглобява и подготвя за публикуване.
            </p>
          </div>
          <div className="box">
            <h3>Имейли, реклами и контакти</h3>
            <p>
              Писма, реклами и следене на контактите — на едно място, с AI, обучен да пише точно
              като Вас. Работи локално или онлайн и се управлява от телефона.
            </p>
          </div>
        </div>
      </section>

      <section>
        <p className="kick">Как работим</p>
        <h2 className="h2sub">С гласа Ви, върху Вашите бизнеси</h2>
        <div className="rows">
          {KAK.map((r) => (
            <div style={{ display: "contents" }} key={r.t}>
              <div className="t">{r.t}</div>
              <div className="w" dangerouslySetInnerHTML={{ __html: r.w }} />
            </div>
          ))}
        </div>
      </section>

      <section className="sec-months">
        <p className="kick">Пътят при менторството</p>
        <h2 className="h2sub">Четирите месеца</h2>
        <div className="steps">
          {MESECI.map((m) => (
            <article className="step" key={m.d}>
              <span className="d">{m.d}</span>
              <h3>{m.h}</h3>
              <p>{m.p}</p>
            </article>
          ))}
        </div>
        <p className="note">
          Редът е ориентир — подреждаме го по това, което носи най-много на двата Ви бизнеса.
        </p>
      </section>

      <section className="sec-price">
        <p className="kick">Условията</p>
        <h2 className="h2sub">Две възможности — изберете според момента</h2>

        <div className="price">
          <div>
            <span className="label">Препоръчвам · 4 месеца 1:1</span>
            <p className="big num">
              1 800 €<small>без ДДС</small>
            </p>
            <p className="sub">Лично менторство и персонална автоматизация на Вашите процеси</p>
            <p className="opt">
              <b>Плащането:</b> 50 % предварително и 50 % във втория месец.
            </p>
            <p className="opt hl">
              <b>Защо това:</b> системата се строи върху Вашите бизнеси, а не върху общи примери —
              и двете дейности са покрити, с един и същ професионален вид и с Вашия глас в
              текстовете. Имате до себе си човек, който решава с Вас и затруднението, докато го
              срещнете.
            </p>
          </div>
          <div>
            <h3>Какво влиза</h3>
            <table>
              <tbody>
                <tr>
                  <td>Лично менторство 1:1</td>
                  <td className="v">4 месеца</td>
                </tr>
                <tr>
                  <td>Автоматизация на Вашите конкретни процеси</td>
                  <td className="v">включена</td>
                </tr>
                <tr>
                  <td>Визия и видеа за двата бизнеса</td>
                  <td className="v">включени</td>
                </tr>
                <tr>
                  <td>AI, обучен във Вашия стил</td>
                  <td className="v">включен</td>
                </tr>
                <tr>
                  <td>AI в текстилната работа</td>
                  <td className="v">включен</td>
                </tr>
                <tr>
                  <td>Всичко построено</td>
                  <td className="v">Ваше</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="price light">
          <div>
            <span className="label alt">По-лек старт · със свое темпо</span>
            <p className="big num">
              500 €<small>без ДДС</small>
            </p>
            <p className="sub">Онлайн курс — учите се сама, когато Ви е удобно</p>
            <p className="opt">
              <b>За кого е:</b> ако предпочитате да започнете по-леко и да вървите със собствено
              темпо. Курсът е без лично менторство — системата за Вашите процеси я настройвате сама.
            </p>
          </div>
          <div>
            <h3>Какво влиза</h3>
            <table>
              <tbody>
                <tr>
                  <td>Онлайн курс</td>
                  <td className="v">със свое темпо</td>
                </tr>
                <tr>
                  <td>Лично менторство</td>
                  <td className="v">не е включено</td>
                </tr>
              </tbody>
            </table>
            <p className="note">
              Ако по-късно решите, че Ви трябва човек до Вас, преминаването към менторството е
              лесна следваща стъпка.
            </p>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Обмислете спокойно коя възможност пасва на момента. Отговорете ми с един ред коя
          харесвате — или ми кажете, когато Ви е удобно да се чуем за 10 минути, и ще подредим
          старта заедно.
        </p>
        <p className="ctas">
          <a
            className="btn"
            href="mailto:emmgivailopetev38@gmail.com?subject=%D0%9E%D1%84%D0%B5%D1%80%D1%82%D0%B0%20%D0%B7%D0%B0%20%D0%90%D0%BD%D1%82%D0%BE%D0%BD%D0%B8%D1%8F"
          >
            Пишете ми
          </a>
          <a className="btn" href="tel:+359877399963">
            0877 399 963
          </a>
          <a className="btn" href="/booking">
            Кратък разговор
          </a>
        </p>
      </section>

      <p className="sig">
        <b>Ивайло Петев</b> · Pro Marketing
        <br />
        0877 399 963 · emmgivailopetev38@gmail.com · promarketing.pw
        <span className="site">🌐 petevai.com · promarketing.pw</span>
      </p>
    </main>
  );
}
