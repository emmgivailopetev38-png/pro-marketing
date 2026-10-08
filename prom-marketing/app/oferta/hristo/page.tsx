/**
 * AI програма за агенцията на Христо Стойнев — 4 месеца, 1 900 € за цялата програма.
 *
 * Срещата с Ивайло (08.10.2026, 45 мин, Fathom 853921964): агенция за недвижими имоти,
 * 5 брокера (+1 идва), франчайз към холдинг. Всичко около обявата е ръчно — снимки,
 * обработка, качване по порталите, описания (с ChatGPT), рендери. CRM-ът е на холдинга,
 * задължителен и затворен след хакерска атака; от него се пълни и сайтът — не се пипа.
 * Нов CRM след 1–2 месеца. Христо иска да мери резултатите и решава заедно с екипа.
 *
 * Всичко по-долу е казано от Ивайло на срещата: 4 месеца, 1 900 € (наведнъж или на два
 * пъти), обучение + изграждане на системата, курс, срещи всяка седмица, поне 90 % от
 * ръчната работа още в първия месец, връщане на парите, ако до 4 седмици няма работеща
 * автоматизация. Започва се с видеата и социалните мрежи — извън CRM-а.
 * Следваща стъпка: обсъжда с екипа; чуваме се в края на следващата седмица (15.10).
 *
 * Обръщението е на „ти“ — така си говориха към края на срещата.
 */

const PDF = "/oferta/hristo/ProMarketing-AI-programa-za-agenciyata.pdf";

const CSS = `
.hri-doc{
  --ground:#F7F8F5; --panel:#ECF2EE; --surface:#FFFFFF;
  --ink:#17201C; --ink-2:#47544E; --ink-3:#7B8781;
  --rule:#DCE4DF; --rule-soft:#EAF0EC;
  --accent:#1F5C4A; --accent-soft:#E6F1EB; --accent-line:#BCD8CB;
  --warm:#9A6A1C; --warm-soft:#F8F0E0;
  --shadow:0 1px 2px rgba(23,32,28,.05), 0 12px 30px -20px rgba(23,32,28,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--hri-ui),Arial,sans-serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.hri-doc *{box-sizing:border-box}
.hri-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.hri-doc h1,.hri-doc h2{font-family:var(--hri-display),Georgia,serif;font-weight:600;letter-spacing:-.01em;text-wrap:balance}
.hri-doc h3{font-family:var(--hri-ui),Arial,sans-serif;font-weight:600;letter-spacing:-.01em}
.hri-doc .num{font-variant-numeric:tabular-nums}
.hri-doc a{color:var(--accent);text-underline-offset:3px}
.hri-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.hri-doc p{margin:0}

/* ── шапка ── */
.hri-doc .masthead{padding:60px 0 36px;border-bottom:1px solid var(--rule)}
.hri-doc .eyebrow{font-weight:600;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.hri-doc h1{font-size:48px;line-height:1.08;margin:0 0 20px;max-width:20ch}
.hri-doc h1 em{font-style:italic;color:var(--accent)}
.hri-doc .deck{font-size:19px;line-height:1.58;color:var(--ink-2);max-width:62ch;margin:0 0 24px}
.hri-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-size:14px;color:var(--ink-3)}
.hri-doc .byline .pill{font-weight:600;font-size:14px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:999px;padding:6px 14px}
.hri-doc .byline a{font-weight:600}

/* ── секции ── */
.hri-doc section{margin:56px 0 0}
.hri-doc .kick{font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--warm);margin:0 0 10px}
.hri-doc .h2sub{font-size:31px;line-height:1.18;margin:0 0 14px;max-width:26ch}
.hri-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.hri-doc .note{font-size:14px;color:var(--ink-3);margin:12px 0 0;max-width:70ch}

/* ── откъде тръгваме ── */
.hri-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 20px}
.hri-doc .fact{background:var(--panel);border-radius:14px;padding:18px 20px}
.hri-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.hri-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.hri-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 14px 14px 0;padding:18px 22px;box-shadow:var(--shadow)}
.hri-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.hri-doc .pull .src{display:block;margin-top:8px;font-size:13.5px;color:var(--ink-3)}

/* ── какво изграждаме ── */
.hri-doc .hero{background:var(--surface);border:1px solid var(--accent-line);border-radius:18px;padding:26px 26px 24px;box-shadow:var(--shadow);margin:0 0 14px}
.hri-doc .hero .tag{display:inline-block;font-weight:600;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:4px 12px;margin:0 0 12px}
.hri-doc .hero h3{font-family:var(--hri-display),Georgia,serif;font-size:26px;line-height:1.2;margin:0 0 10px}
.hri-doc .hero p{font-size:16px;line-height:1.6;color:var(--ink-2);max-width:68ch}
.hri-doc .chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;padding:0;list-style:none}
.hri-doc .chips li{font-size:14px;font-weight:500;color:var(--ink);background:var(--panel);border-radius:999px;padding:6px 13px}
.hri-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.hri-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:20px 20px 18px}
.hri-doc .card .n{font-weight:600;font-size:12px;color:var(--warm);letter-spacing:.12em;display:block;margin:0 0 8px}
.hri-doc .card h3{font-size:16.5px;margin:0 0 7px}
.hri-doc .card p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.hri-doc .goal{margin:14px 0 0;padding:16px 20px;border-radius:14px;background:var(--warm-soft);font-size:16px;line-height:1.55;color:var(--ink)}
.hri-doc .goal b{color:var(--warm);font-weight:600}

/* ── какво видя ── */
.hri-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.hri-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.hri-doc .box h3{font-size:16.5px;margin:0 0 8px}
.hri-doc .box p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── как работим ── */
.hri-doc .rows{display:grid;grid-template-columns:auto 1fr;gap:0 20px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.hri-doc .rows .t{font-weight:600;font-size:14.5px;color:var(--accent);padding:14px 0;border-top:1px dashed var(--rule);max-width:16ch}
.hri-doc .rows .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule)}
.hri-doc .rows .t:first-child,.hri-doc .rows .t:first-child+.w{border-top:0}
.hri-doc .rows .w b{color:var(--ink);font-weight:600}

/* ── трите месеца ── */
.hri-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.hri-doc .step{background:var(--surface);border:1px solid var(--rule);border-top:3px solid var(--accent);border-radius:12px;padding:20px}
.hri-doc .step .d{font-weight:600;font-size:12px;letter-spacing:.12em;color:var(--warm);text-transform:uppercase;display:block;margin:0 0 7px}
.hri-doc .step h3{font-size:16.5px;margin:0 0 7px}
.hri-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── цената ── */
.hri-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:28px;box-shadow:var(--shadow)}
.hri-doc .price .big{font-family:var(--hri-display),Georgia,serif;font-weight:700;font-size:50px;line-height:1;margin:0 0 8px;color:var(--ink)}
.hri-doc .price .big small{font-family:var(--hri-ui),Arial,sans-serif;font-size:18px;font-weight:500;color:var(--ink-3);margin-left:10px;white-space:nowrap;display:inline-block}
.hri-doc .price .sub{font-size:14px;color:var(--ink-3);margin:0 0 16px}
.hri-doc .price h3{font-size:15px;margin:0 0 8px}
.hri-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.hri-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.hri-doc .price td.v{color:var(--ink);font-weight:500;text-align:right;white-space:nowrap;padding-left:14px}
.hri-doc .price tr:first-child td{border-top:0}
.hri-doc .opt{margin:12px 0 0;padding:12px 14px;border-radius:12px;background:var(--panel);font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.hri-doc .opt b{color:var(--ink);font-weight:600}
.hri-doc .opt.hl{background:var(--accent-soft)}
.hri-doc .opt.hl b{color:var(--accent)}

/* ── следващата стъпка ── */
.hri-doc .closing{background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:18px;padding:32px 32px 28px;margin-top:56px}
.hri-doc .closing h2{font-size:29px;margin:0 0 10px;color:var(--ink)}
.hri-doc .closing p{font-size:16.5px;line-height:1.6;color:var(--ink-2);max-width:62ch}
.hri-doc .closing p + p{margin-top:10px}
.hri-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.hri-doc .closing a.btn{font-weight:600;text-decoration:none;color:var(--accent);background:var(--surface);border:1px solid var(--accent-line);border-radius:12px;padding:12px 18px;font-size:15px}
.hri-doc .sig{break-inside:avoid;margin:26px 0 0;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.hri-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .hri-doc{font-size:16.5px}
  .hri-doc .wrap{padding:0 18px 72px}
  .hri-doc h1{font-size:34px}
  .hri-doc .deck{font-size:17.5px}
  .hri-doc .h2sub{font-size:25px}
  .hri-doc .masthead{padding:38px 0 28px}
  .hri-doc section{margin:44px 0 0}
  .hri-doc .hero{padding:22px 20px 20px}
  .hri-doc .hero h3{font-size:22px}
  .hri-doc .two,.hri-doc .price{grid-template-columns:1fr}
  .hri-doc .price{padding:22px 20px}
  .hri-doc .price .big{font-size:42px}
  .hri-doc .rows{grid-template-columns:1fr;padding:14px 20px}
  .hri-doc .rows .t{padding:14px 0 0;border-top:1px dashed var(--rule);max-width:none}
  .hri-doc .rows .w{padding:4px 0 14px;border-top:0}
  .hri-doc .rows .t:first-child{border-top:0}
  .hri-doc .closing{padding:24px 20px 22px}
}
@media print{
  html,body{background:#fff}
  .hri-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .hri-doc .wrap{max-width:none;padding:0}
  .hri-doc .masthead{padding:0 0 16px}
  .hri-doc h1{font-size:30px;margin-bottom:12px}
  .hri-doc .deck{font-size:14px;margin-bottom:14px}
  .hri-doc .byline .pdf{display:none}
  .hri-doc section{margin:22px 0 0}
  .hri-doc section.sec-build{break-before:page}
  .hri-doc section.sec-price{break-before:page}
  .hri-doc .kick,.hri-doc .h2sub,.hri-doc .lead{break-after:avoid}
  .hri-doc .h2sub{font-size:20px;margin-bottom:10px}
  .hri-doc .lead{font-size:13px;margin-bottom:12px}
  .hri-doc .fact,.hri-doc .card,.hri-doc .step,.hri-doc .box,.hri-doc .price,.hri-doc .pull,.hri-doc .hero,.hri-doc .goal,.hri-doc .rows,.hri-doc .closing{break-inside:avoid}
  .hri-doc .fact p,.hri-doc .step p,.hri-doc .box p{font-size:12px}
  .hri-doc .pull p{font-size:13px}
  .hri-doc .hero{padding:16px 18px;box-shadow:none}
  .hri-doc .hero h3{font-size:18px}
  .hri-doc .hero p{font-size:12.5px}
  .hri-doc .chips li{font-size:11.5px;padding:4px 10px}
  .hri-doc .cards{grid-template-columns:1fr 1fr;gap:9px}
  .hri-doc .card{padding:12px 14px}
  .hri-doc .card h3{font-size:13.5px}
  .hri-doc .card p{font-size:12px}
  .hri-doc .goal{font-size:12.5px;padding:12px 14px}
  .hri-doc .box{box-shadow:none;padding:16px}
  .hri-doc .rows{box-shadow:none;padding:6px 16px}
  .hri-doc .rows .t,.hri-doc .rows .w{padding:8px 0;font-size:12px}
  .hri-doc .step{padding:12px}
  .hri-doc .price{box-shadow:none;padding:18px}
  .hri-doc .price .big{font-size:36px}
  .hri-doc .price td{font-size:12.5px;padding:6px 0}
  .hri-doc .opt{font-size:12px;padding:9px 12px}
  .hri-doc .closing{padding:20px 22px;margin-top:22px}
  .hri-doc .closing h2{font-size:21px}
  .hri-doc .closing p{font-size:13px}
  .hri-doc .closing .ctas{display:none}
  .hri-doc .fact,.hri-doc .byline .pill,.hri-doc .chips li,.hri-doc .goal,.hri-doc .opt,.hri-doc .hero .tag,.hri-doc .closing,.hri-doc .step{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* A4 е под 760px — връщаме колоните, които мобилният изглед сгъва */
  .hri-doc .facts{grid-template-columns:1fr 1fr}
  .hri-doc .steps{grid-template-columns:1fr 1fr}
  .hri-doc .two,.hri-doc .price{grid-template-columns:1fr 1fr}
  .hri-doc .rows{grid-template-columns:auto 1fr}
  .hri-doc .rows .t,.hri-doc .rows .w{border-top:1px dashed var(--rule)}
  .hri-doc .rows .t:first-child,.hri-doc .rows .t:first-child+.w{border-top:0}
  .hri-doc .rows .t{max-width:16ch}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const FAKTI = [
  {
    h: "Пет брокера, скоро шести",
    p: "Агенция с години зад гърба си. Работата е човек с човек — и така трябва да остане.",
  },
  {
    h: "Всичко около обявата е ръчно",
    p: "Снимки, обработка, качване по порталите, описания (вече с ChatGPT), рендери за обекти в лошо състояние. Всичко това яде времето за клиентите.",
  },
  {
    h: "CRM-ът е на холдинга",
    p: "Задължителен, затворен след хакерската атака, и от него се пълни сайтът. Не го пипаме. Нов CRM идва след месец-два.",
  },
  {
    h: "Искаш да мериш",
    p: "Където не се мерят резултатите, е хаос. А решенията ги взимаш заедно с екипа — не насила.",
  },
];

const PURVO = [
  "видео от имота",
  "социални мрежи",
  "снимки",
  "рендери",
  "описания",
  "имейли",
  "оферти и документи",
];

const IZGRAZHDAME = [
  {
    n: "02",
    h: "Снимки и рендери",
    p: "Обработката на снимките минава през AI. Рендерът „как ще изглежда“ за обект в лошо състояние става инструмент на целия екип, не само на една колежка.",
  },
  {
    n: "03",
    h: "Описанията на обявите",
    p: "Текстът излиза готов от снимките и бележките на брокера — остава само да се постави в CRM-а.",
  },
  {
    n: "04",
    h: "Социалните мрежи",
    p: "Всеки ден публикации във Facebook, Instagram и TikTok, насрочени сами. Брокерът одобрява, не сглобява.",
  },
  {
    n: "05",
    h: "Имейли, оферти, документи",
    p: "Отговори, оферти и документи се подготвят от AI и чакат само поглед и „изпрати“.",
  },
  {
    n: "06",
    h: "Реклами",
    p: "Видеото на имота влиза в реклама във Facebook. AI следи резултата по граници, които задаваш ти.",
  },
  {
    n: "07",
    h: "Мерим",
    p: "Колко видеа излязоха, колко запитвания дойдоха от мрежите и рекламите, кой брокер колко време спести. Виждаш къде куца.",
  },
];

const KAK = [
  {
    t: "Формат",
    w: "Обучение на екипа и изграждане на системата едновременно. Колегите се учат върху своите обяви, не върху примери.",
  },
  { t: "Курс", w: "Видео курс по AI — влиза в програмата." },
  { t: "Всяка седмица", w: "Среща с екипа: въпроси, отговори и следващата автоматизация." },
  {
    t: "Първият месец",
    w: "Автоматизираме <b>поне 90 %</b> от ръчната работа около обявите и мрежите, която е извън CRM-а.",
  },
  { t: "Какво остава", w: "Всичко, което построим, остава ваше." },
];

const MESECI = [
  {
    d: "Месец 1",
    h: "Видео, мрежи, снимки",
    p: "От суровия клип до готово видео и публикации всеки ден. Снимките и рендерите минават през AI. Екипът го ползва от първата седмица.",
  },
  {
    d: "Месец 2",
    h: "Текстове и документи",
    p: "Описанията на обявите, имейлите, офертите и документите. Първите реклами с видеата на имотите.",
  },
  {
    d: "Месец 3",
    h: "Новият CRM",
    p: "Гледаме новия CRM заедно. Има ли AI или връзка — свързваме се. Няма ли — AI работи в браузъра вместо брокера, без двойна работа.",
  },
  {
    d: "Месец 4",
    h: "Мерим и екипът води",
    p: "Таблото с резултатите: къде се спести време, откъде идват запитванията. Екипът продължава сам.",
  },
];

export default function HristoOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">AI програма за агенцията · 4 месеца</p>
        <h1>
          По-малко техника, <em>повече време за хората</em>
        </h1>
        <p className="deck">
          Твоите думи от срещата: да изчистим всичко технологично, за да има повече време за
          работата с клиентите. Четири месеца, в които екипът се учи на AI, а системата поема
          снимките, видеата, социалните мрежи и текстовете — без да пипаме CRM-а на холдинга.
        </p>
        <p className="byline">
          <span className="pill">4 месеца · 1 900 €</span>
          <span>За Христо Стойнев · от Ивайло Петев, Pro Marketing</span>
          <span className="num">08.10.2026</span>
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
            Колежката ви направи рендер на къща в лошо състояние за две минути. Купувачът го видя
            на телефона пред сградата — и интересът дойде веднага.
          </p>
          <span className="src">
            Това е доказателството, че работи. Програмата прави същото системно — за целия екип и
            за всяка обява.
          </span>
        </div>
      </section>

      <section className="sec-build">
        <p className="kick">Откъде започваме</p>
        <h2 className="h2sub">Там, където няма двойна работа</h2>
        <p className="lead">
          CRM-ът остава както е. Започваме с всичко около него — то и без това се прави отделно, на
          ръка.
        </p>

        <article className="hero">
          <span className="tag">01 · На първо място</span>
          <h3>Видео от имота с един клип от телефона</h3>
          <p>
            Брокерът снима суров клип. AI прави готово видео — музика, глас, субтитри — и го качва
            в YouTube, Facebook, Instagram и TikTok. Никой не седи да монтира.
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
          <b>Целта:</b> брокерите да прекарват времето си с клиентите, а не с обработка на снимки и
          качване на обяви.
        </p>
      </section>

      <section>
        <p className="kick">CRM-ът на холдинга</p>
        <h2 className="h2sub">Не го пипаме — и не ви трябва</h2>
        <div className="two">
          <div className="box">
            <h3>Сега</h3>
            <p>
              Данните остават там, където са, и се въвеждат както досега. AI подготвя текста и
              снимките, брокерът само ги поставя. Никаква двойна работа.
            </p>
          </div>
          <div className="box">
            <h3>Щом излезе новият CRM</h3>
            <p>
              Ако има AI или връзка навън — свързваме се. Ако няма — AI може да работи в браузъра
              вместо брокера. Тогава седим пак и решаваме заедно.
            </p>
          </div>
        </div>
      </section>

      <section>
        <p className="kick">Какво видя на срещата</p>
        <h2 className="h2sub">Системи, които вече работят всеки ден</h2>
        <div className="two">
          <div className="box">
            <h3>Видео от суров материал</h3>
            <p>
              AI сглобява цял филм — сценарий, музика, глас, субтитри — и го публикува. За един бранд
              пуска видеа всеки ден в TikTok, Instagram и Facebook.
            </p>
          </div>
          <div className="box">
            <h3>Лични съобщения и CRM с асистент</h3>
            <p>
              Пише персонално на всеки клиент във Viber и води отчет. В CRM-а на клиент AI отговаря
              на въпроси и попълва данните вместо човека.
            </p>
          </div>
        </div>
      </section>

      <section>
        <p className="kick">Как работим</p>
        <h2 className="h2sub">С целия екип, върху вашите обяви</h2>
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
        <p className="kick">Пътят</p>
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
          Редът е ориентир — подреждаме го по това, което носи най-много на екипа.
        </p>
      </section>

      <section className="sec-price">
        <p className="kick">Условията</p>
        <h2 className="h2sub">Цената, както ти я казах</h2>
        <div className="price">
          <div>
            {/* ДДС не е уточнен на срещата — Ивайло да потвърди */}
            <p className="big num">
              1 900 €<small>за цялата програма</small>
            </p>
            <p className="sub">4 месеца · целият екип · всичко построено е ваше</p>
            <p className="opt">
              <b>Плащането</b> може наведнъж или на две вноски по 950 €.
            </p>
            <p className="opt hl">
              <b>Гаранция:</b> ако до 4 седмици нямате работеща автоматизация, връщаме парите.
            </p>
          </div>
          <div>
            <h3>Какво влиза</h3>
            <table>
              <tbody>
                <tr>
                  <td>Обучение на екипа + изграждане на системата</td>
                  <td className="v">4 месеца</td>
                </tr>
                <tr>
                  <td>Срещи с екипа</td>
                  <td className="v">всяка седмица</td>
                </tr>
                <tr>
                  <td>Видео курс по AI</td>
                  <td className="v">включен</td>
                </tr>
                <tr>
                  <td>Ръчната работа извън CRM-а</td>
                  <td className="v">90 % още в месец 1</td>
                </tr>
                <tr>
                  <td>Всичко построено</td>
                  <td className="v">ваше</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Покажи я спокойно на колегите — точно както го искаш, решението да е общо. С удоволствие
          ще вляза на среща и с тях, за да видят на живо как работи.
        </p>
        <p>Чуваме се в края на следващата седмица — в четвъртък, 15 октомври.</p>
        <p className="ctas">
          <a className="btn" href="/booking">
            Среща с екипа
          </a>
          <a
            className="btn"
            href="mailto:emmgivailopetev38@gmail.com?subject=%D0%9F%D1%80%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%B0%D1%82%D0%B0%20%D0%B7%D0%B0%20%D0%B0%D0%B3%D0%B5%D0%BD%D1%86%D0%B8%D1%8F%D1%82%D0%B0"
          >
            Пиши ми
          </a>
          <a className="btn" href="tel:+359877399963">
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
