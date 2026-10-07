/**
 * Менторска програма за Петя Симова — 3 месеца, 1 900 € за цялата програма.
 *
 * Срещата с Ивайло (07.10.2026, 29 мин): проект за нумерология от 4 години, продава
 * лично, на живо. Преди това — дълго в дигиталния маркетинг и в управлението на IT
 * проекти; има клиенти, които искат да автоматизират бизнеса си, и търси партньор
 * за това. Фунията е на WordPress и я движи сама; процесът е хаотичен и я дразни
 * („обущарят ходи бос“). Тествала е AI видео — дало е тласък на продажбите, но
 * вижда, че хората реагират зле на лошо AI видео. Най-интересна ѝ е собствената
 * CRM система (клиенти, статуси на поръчки, автоматични допълнителни предложения,
 * договори, оферти). Каза, че менторството ще ѝ е по-полезно, отколкото ние да ѝ
 * направим CRM-а. Пита дали може да влезе с приятелка.
 *
 * Всичко по-долу е казано от Ивайло на срещата: 1 900 € (наведнъж или 2 × 950 €),
 * по-нататък 2 800 €; 1–2 срещи седмично; с приятелка може — срещите са общи, всяка
 * си изгражда своята система; ако ние изградим CRM-а — от 4 000 € нагоре.
 * Следваща стъпка: тя пише до няколко дни, иначе се чуваме в понеделник, 12.10.
 *
 * Обръщението е на „ти“ — така си говориха на срещата.
 */

const PDF = "/oferta/petya/ProMarketing-Mentorska-programa-Petya.pdf";

const CSS = `
.pet-doc{
  --ground:#FBF7F4; --panel:#F5ECEA; --surface:#FFFFFF;
  --ink:#211A20; --ink-2:#584B55; --ink-3:#8A7D87;
  --rule:#EADDDB; --rule-soft:#F2E8E6;
  --accent:#8C2F5C; --accent-soft:#F8E8EF; --accent-line:#E6C3D3;
  --warm:#A3542A; --warm-soft:#FBEEE4;
  --shadow:0 1px 2px rgba(33,26,32,.05), 0 12px 30px -20px rgba(33,26,32,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--pet-ui),Arial,sans-serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.pet-doc *{box-sizing:border-box}
.pet-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.pet-doc h1,.pet-doc h2{font-family:var(--pet-display),Georgia,serif;font-weight:600;letter-spacing:-.01em;text-wrap:balance}
.pet-doc h3{font-family:var(--pet-ui),Arial,sans-serif;font-weight:600;letter-spacing:-.01em}
.pet-doc .num{font-variant-numeric:tabular-nums}
.pet-doc a{color:var(--accent);text-underline-offset:3px}
.pet-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.pet-doc p{margin:0}

/* ── шапка ── */
.pet-doc .masthead{padding:60px 0 36px;border-bottom:1px solid var(--rule)}
.pet-doc .eyebrow{font-weight:600;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.pet-doc h1{font-size:48px;line-height:1.08;margin:0 0 20px;max-width:20ch}
.pet-doc h1 em{font-style:italic;color:var(--accent)}
.pet-doc .deck{font-size:19px;line-height:1.58;color:var(--ink-2);max-width:62ch;margin:0 0 24px}
.pet-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-size:14px;color:var(--ink-3)}
.pet-doc .byline .pill{font-weight:600;font-size:14px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:999px;padding:6px 14px}
.pet-doc .byline a{font-weight:600}

/* ── секции ── */
.pet-doc section{margin:56px 0 0}
.pet-doc .kick{font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--warm);margin:0 0 10px}
.pet-doc .h2sub{font-size:31px;line-height:1.18;margin:0 0 14px;max-width:26ch}
.pet-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.pet-doc .note{font-size:14px;color:var(--ink-3);margin:12px 0 0;max-width:70ch}

/* ── откъде тръгваме ── */
.pet-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 20px}
.pet-doc .fact{background:var(--panel);border-radius:14px;padding:18px 20px}
.pet-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.pet-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.pet-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 14px 14px 0;padding:18px 22px;box-shadow:var(--shadow)}
.pet-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.pet-doc .pull .src{display:block;margin-top:8px;font-size:13.5px;color:var(--ink-3)}

/* ── какво изграждаме ── */
.pet-doc .hero{background:var(--surface);border:1px solid var(--accent-line);border-radius:18px;padding:26px 26px 24px;box-shadow:var(--shadow);margin:0 0 14px}
.pet-doc .hero .tag{display:inline-block;font-weight:600;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:4px 12px;margin:0 0 12px}
.pet-doc .hero h3{font-family:var(--pet-display),Georgia,serif;font-size:26px;line-height:1.2;margin:0 0 10px}
.pet-doc .hero p{font-size:16px;line-height:1.6;color:var(--ink-2);max-width:68ch}
.pet-doc .chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;padding:0;list-style:none}
.pet-doc .chips li{font-size:14px;font-weight:500;color:var(--ink);background:var(--panel);border-radius:999px;padding:6px 13px}
.pet-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.pet-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:20px 20px 18px}
.pet-doc .card .n{font-weight:600;font-size:12px;color:var(--warm);letter-spacing:.12em;display:block;margin:0 0 8px}
.pet-doc .card h3{font-size:16.5px;margin:0 0 7px}
.pet-doc .card p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.pet-doc .goal{margin:14px 0 0;padding:16px 20px;border-radius:14px;background:var(--warm-soft);font-size:16px;line-height:1.55;color:var(--ink)}
.pet-doc .goal b{color:var(--warm);font-weight:600}

/* ── какво видя ── */
.pet-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.pet-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.pet-doc .box h3{font-size:16.5px;margin:0 0 8px}
.pet-doc .box p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── как работим ── */
.pet-doc .rows{display:grid;grid-template-columns:auto 1fr;gap:0 20px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.pet-doc .rows .t{font-weight:600;font-size:14.5px;color:var(--accent);padding:14px 0;border-top:1px dashed var(--rule);max-width:16ch}
.pet-doc .rows .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule)}
.pet-doc .rows .t:first-child,.pet-doc .rows .t:first-child+.w{border-top:0}
.pet-doc .rows .w b{color:var(--ink);font-weight:600}

/* ── трите месеца ── */
.pet-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.pet-doc .step{background:var(--surface);border:1px solid var(--rule);border-top:3px solid var(--accent);border-radius:12px;padding:20px}
.pet-doc .step .d{font-weight:600;font-size:12px;letter-spacing:.12em;color:var(--warm);text-transform:uppercase;display:block;margin:0 0 7px}
.pet-doc .step h3{font-size:16.5px;margin:0 0 7px}
.pet-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── цената ── */
.pet-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:28px;box-shadow:var(--shadow)}
.pet-doc .price .big{font-family:var(--pet-display),Georgia,serif;font-weight:700;font-size:50px;line-height:1;margin:0 0 8px;color:var(--ink)}
.pet-doc .price .big small{font-family:var(--pet-ui),Arial,sans-serif;font-size:18px;font-weight:500;color:var(--ink-3);margin-left:10px;white-space:nowrap;display:inline-block}
.pet-doc .price .sub{font-size:14px;color:var(--ink-3);margin:0 0 16px}
.pet-doc .price h3{font-size:15px;margin:0 0 8px}
.pet-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.pet-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.pet-doc .price td.v{color:var(--ink);font-weight:500;text-align:right;white-space:nowrap;padding-left:14px}
.pet-doc .price tr:first-child td{border-top:0}
.pet-doc .opt{margin:12px 0 0;padding:12px 14px;border-radius:12px;background:var(--panel);font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.pet-doc .opt b{color:var(--ink);font-weight:600}
.pet-doc .opt.hl{background:var(--accent-soft)}
.pet-doc .opt.hl b{color:var(--accent)}

/* ── следващата стъпка ── */
.pet-doc .closing{background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:18px;padding:32px 32px 28px;margin-top:56px}
.pet-doc .closing h2{font-size:29px;margin:0 0 10px;color:var(--ink)}
.pet-doc .closing p{font-size:16.5px;line-height:1.6;color:var(--ink-2);max-width:62ch}
.pet-doc .closing p + p{margin-top:10px}
.pet-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.pet-doc .closing a.btn{font-weight:600;text-decoration:none;color:var(--accent);background:var(--surface);border:1px solid var(--accent-line);border-radius:12px;padding:12px 18px;font-size:15px}
.pet-doc .sig{break-inside:avoid;margin:26px 0 0;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.pet-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .pet-doc{font-size:16.5px}
  .pet-doc .wrap{padding:0 18px 72px}
  .pet-doc h1{font-size:34px}
  .pet-doc .deck{font-size:17.5px}
  .pet-doc .h2sub{font-size:25px}
  .pet-doc .masthead{padding:38px 0 28px}
  .pet-doc section{margin:44px 0 0}
  .pet-doc .hero{padding:22px 20px 20px}
  .pet-doc .hero h3{font-size:22px}
  .pet-doc .two,.pet-doc .price{grid-template-columns:1fr}
  .pet-doc .price{padding:22px 20px}
  .pet-doc .price .big{font-size:42px}
  .pet-doc .rows{grid-template-columns:1fr;padding:14px 20px}
  .pet-doc .rows .t{padding:14px 0 0;border-top:1px dashed var(--rule);max-width:none}
  .pet-doc .rows .w{padding:4px 0 14px;border-top:0}
  .pet-doc .rows .t:first-child{border-top:0}
  .pet-doc .closing{padding:24px 20px 22px}
}
@media print{
  html,body{background:#fff}
  .pet-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .pet-doc .wrap{max-width:none;padding:0}
  .pet-doc .masthead{padding:0 0 16px}
  .pet-doc h1{font-size:30px;margin-bottom:12px}
  .pet-doc .deck{font-size:14px;margin-bottom:14px}
  .pet-doc .byline .pdf{display:none}
  .pet-doc section{margin:22px 0 0}
  .pet-doc section.sec-build{break-before:page}
  .pet-doc section.sec-price{break-before:page}
  .pet-doc .kick,.pet-doc .h2sub,.pet-doc .lead{break-after:avoid}
  .pet-doc .h2sub{font-size:20px;margin-bottom:10px}
  .pet-doc .lead{font-size:13px;margin-bottom:12px}
  .pet-doc .fact,.pet-doc .card,.pet-doc .step,.pet-doc .box,.pet-doc .price,.pet-doc .pull,.pet-doc .hero,.pet-doc .goal,.pet-doc .rows,.pet-doc .closing{break-inside:avoid}
  .pet-doc .fact p,.pet-doc .step p,.pet-doc .box p{font-size:12px}
  .pet-doc .pull p{font-size:13px}
  .pet-doc .hero{padding:16px 18px;box-shadow:none}
  .pet-doc .hero h3{font-size:18px}
  .pet-doc .hero p{font-size:12.5px}
  .pet-doc .chips li{font-size:11.5px;padding:4px 10px}
  .pet-doc .cards{grid-template-columns:1fr 1fr;gap:9px}
  .pet-doc .card{padding:12px 14px}
  .pet-doc .card h3{font-size:13.5px}
  .pet-doc .card p{font-size:12px}
  .pet-doc .goal{font-size:12.5px;padding:12px 14px}
  .pet-doc .box{box-shadow:none;padding:16px}
  .pet-doc .rows{box-shadow:none;padding:6px 16px}
  .pet-doc .rows .t,.pet-doc .rows .w{padding:8px 0;font-size:12px}
  .pet-doc .step{padding:12px}
  .pet-doc .price{box-shadow:none;padding:18px}
  .pet-doc .price .big{font-size:36px}
  .pet-doc .price td{font-size:12.5px;padding:6px 0}
  .pet-doc .opt{font-size:12px;padding:9px 12px}
  .pet-doc .closing{padding:20px 22px;margin-top:22px}
  .pet-doc .closing h2{font-size:21px}
  .pet-doc .closing p{font-size:13px}
  .pet-doc .closing .ctas{display:none}
  .pet-doc .fact,.pet-doc .byline .pill,.pet-doc .chips li,.pet-doc .goal,.pet-doc .opt,.pet-doc .hero .tag,.pet-doc .closing,.pet-doc .step{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* A4 е под 760px — връщаме колоните, които мобилният изглед сгъва */
  .pet-doc .facts{grid-template-columns:1fr 1fr}
  .pet-doc .steps{grid-template-columns:1fr 1fr 1fr}
  .pet-doc .two,.pet-doc .price{grid-template-columns:1fr 1fr}
  .pet-doc .rows{grid-template-columns:auto 1fr}
  .pet-doc .rows .t,.pet-doc .rows .w{border-top:1px dashed var(--rule)}
  .pet-doc .rows .t:first-child,.pet-doc .rows .t:first-child+.w{border-top:0}
  .pet-doc .rows .t{max-width:16ch}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const FAKTI = [
  {
    h: "Четири години в нумерологията",
    p: "Продаваш лично, на живо. Преди това — дълго в дигиталния маркетинг и в управлението на IT проекти.",
  },
  {
    h: "Фунията е на WordPress",
    p: "Движиш я сама. Времето си вече си го оптимизирала — това, което те дразни, е процесът. Искаш да се пренареди целият.",
  },
  {
    h: "AI видеото вече работи за теб",
    p: "Тества го и то даде тласък на продажбите. Видя и другото: хората реагират зле на лошо AI видео.",
  },
  {
    h: "Клиентите ти искат същото",
    p: "Имаш клиенти, които искат да автоматизират бизнеса си. Търсиш партньор за това — и умението да го правиш.",
  },
];

const CRM = [
  "клиенти",
  "поръчки и статуси",
  "автоматични допълнителни предложения",
  "договори",
  "оферти",
  "документи",
  "задачи",
  "напомняния",
];

const IZGRAZHDAME = [
  {
    n: "02",
    h: "CRM-ът, който те слуша",
    p: "Управляваш системата с гласово съобщение през Telegram — казваш какво е станало и то се отразява.",
  },
  {
    n: "03",
    h: "AI агенти",
    p: "Как ги пускаш и как ги настройваш. AI ги настройва сам — ти казваш какво трябва да свършат. Вече си започнала с тях, продължаваме оттам.",
  },
  {
    n: "04",
    h: "Видео",
    p: "AI видеа плюс рязане и подреждане на твоите реални видеа.",
  },
  {
    n: "05",
    h: "Реклами под око",
    p: "Реклами, които AI следи и пуска по граници, зададени от теб.",
  },
  {
    n: "06",
    h: "Социалните мрежи",
    p: "Водиш ги в същия подреден процес, а не отделно от него.",
  },
  {
    n: "07",
    h: "Сайт",
    p: "На WordPress или с код — както ти е по-удобно.",
  },
  {
    n: "08",
    h: "Гласов агент",
    p: "Вдига телефона, когато ти не можеш, и записва среща.",
  },
  {
    n: "09",
    h: "Курс за ChatGPT",
    p: "Влиза в програмата.",
  },
];

const KAK = [
  { t: "Формат", w: "Персонално менторство с мен. Заедно минаваме всяка стъпка — ти строиш, аз съм до теб." },
  { t: "Срещи", w: "1–2 срещи седмично, върху твоя процес и твоя бизнес." },
  { t: "Какво остава", w: "Всичко, което построим, остава твое." },
  {
    t: "С приятелка",
    w: "Може. Срещите са общи, а всяка от вас изгражда своята система.",
  },
];

const MESECI = [
  {
    d: "Месец 1",
    h: "Твоята CRM система",
    p: "Пренареждаме процеса ти от край до край и строим основата: клиенти, поръчки и статуси, оферти, договори, документи. Включваме и управлението с гласово съобщение през Telegram.",
  },
  {
    d: "Месец 2",
    h: "Агентите и автоматизациите",
    p: "Автоматичните допълнителни предложения, задачите и напомнянията. AI агентите — как ги пускаш и настройваш. Гласовият агент, който вдига, когато ти не можеш, и записва среща.",
  },
  {
    d: "Месец 3",
    h: "Съдържание, реклами — и ти водиш",
    p: "AI видеата и твоите реални видеа, рекламите, които AI следи по зададени граници, социалните мрежи и сайтът. Ти строиш, аз съм до теб — за да можеш после да правиш същото и за своите клиенти.",
  },
];

export default function PetyaOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">Менторска програма · AI за твоя бизнес</p>
        <h1>
          Твоята собствена CRM система — <em>и умението да правиш същото</em> за клиентите си
        </h1>
        <p className="deck">
          Три месеца персонално менторство с мен. Заедно пренареждаме целия ти процес — клиенти,
          поръчки, оферти, договори — в една система, която изграждаш сама, с код и AI. Всичко,
          което построим, остава твое. А после можеш да правиш същото и за своите клиенти.
        </p>
        <p className="byline">
          <span className="pill">3 месеца · 1 900 €</span>
          <span>За Петя Симова · от Ивайло Петев, Pro Marketing</span>
          <span className="num">07.10.2026</span>
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
            Най-много те грабна идеята за собствена CRM система — цяла система, а не автоматизации
            на парчета. Изградена от човек, който не е програмист. С нея започваме.
          </p>
          <span className="src">
            И го каза ясно: менторството ще ти е по-полезно, отколкото ние да ти направим CRM-а.
            Затова програмата е менторска — строиш го ти, аз съм до теб на всяка стъпка.
          </span>
        </div>
      </section>

      <section className="sec-build">
        <p className="kick">Какво изграждаме заедно</p>
        <h2 className="h2sub">Една система вместо парчета</h2>
        <p className="lead">
          На първо място е твоята CRM система. Около нея подреждаме всичко останало — така, че да
          работи заедно.
        </p>

        <article className="hero">
          <span className="tag">01 · На първо място</span>
          <h3>Твоята CRM система</h3>
          <p>
            Всичко за бизнеса ти на едно място. Правиш я с код и AI, персонално за теб и без
            ограничения — точно както ти работиш, а не както някой готов софтуер е решил.
          </p>
          <ul className="chips">
            {CRM.map((c) => (
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
          <b>Целта:</b> да автоматизираш собствения си процес — и после да можеш да правиш същото
          за своите клиенти.
        </p>
      </section>

      <section>
        <p className="kick">Какво видя на срещата</p>
        <h2 className="h2sub">Истински системи, които вече работят</h2>
        <div className="two">
          <div className="box">
            <h3>AI агент, който следи рекламите</h3>
            <p>
              Сам следи рекламите на един бранд — разхода, покупките и цената на всяка покупка.
            </p>
          </div>
          <div className="box">
            <h3>Моят CRM</h3>
            <p>
              Срещи, обаждания, напредъкът на екипа, чатботове за WhatsApp и Messenger — всичко на
              едно място.
            </p>
          </div>
        </div>
      </section>

      <section>
        <p className="kick">Как работим</p>
        <h2 className="h2sub">Персонално и с ръцете</h2>
        <div className="rows">
          {KAK.map((r) => (
            <div style={{ display: "contents" }} key={r.t}>
              <div className="t">{r.t}</div>
              <div className="w">{r.w}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="sec-months">
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
        <p className="note">
          Курсът за ChatGPT влиза в програмата. Редът по месеци е ориентир — подреждаме го по това,
          което ти носи най-много.
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
            <p className="sub">3 месеца · 1–2 срещи седмично · всичко построено е твое</p>
            <p className="opt">
              <b>Плащането</b> може наведнъж или на две вноски по 950 €.
            </p>
            <p className="opt hl">
              <b>По-нататък програмата ще струва 2 800 €.</b> Сегашната цена е 1 900 €.
            </p>
          </div>
          <div>
            <h3>Какво влиза</h3>
            <table>
              <tbody>
                <tr>
                  <td>Персонално менторство</td>
                  <td className="v">3 месеца</td>
                </tr>
                <tr>
                  <td>Срещи</td>
                  <td className="v">1–2 седмично</td>
                </tr>
                <tr>
                  <td>Курс за ChatGPT</td>
                  <td className="v">включен</td>
                </tr>
                <tr>
                  <td>CRM системата и всичко построено</td>
                  <td className="v">твое</td>
                </tr>
              </tbody>
            </table>
            <p className="opt">
              <b>С приятелка</b> — може. Срещите са общи, всяка от вас изгражда своята система.
            </p>
            <p className="opt">
              <b>За сравнение:</b> ако ние изградим CRM-а вместо теб, това е от 4 000 € нагоре —
              много персонална работа плюс поддръжка. Ти предпочете да се научиш, и така системата
              остава изцяло в твоите ръце.
            </p>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Поговори спокойно с приятелките си и ми пиши до няколко дни. Ако не стане — чуваме се в
          понеделник, 12 октомври.
        </p>
        <p>Щом си готова, започваме веднага.</p>
        <p className="ctas">
          <a
            className="btn"
            href="mailto:emmgivailopetev38@gmail.com?subject=%D0%9C%D0%B5%D0%BD%D1%82%D0%BE%D1%80%D1%81%D0%BA%D0%B0%D1%82%D0%B0%20%D0%BF%D1%80%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%B0"
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
