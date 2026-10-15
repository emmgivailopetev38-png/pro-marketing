/**
 * Оферта за Йордан Николов (сглобяеми къщи). Основа: консултация ср 30.09.2026, 15:00 (Димитър записа,
 * в Fathom няма запис), думите му: „Искам да обучим ИИ, който да отговаря на въпроси“; от формата —
 * „отговарям на едни и същи въпроси по цял ден“. Цените 1 000 € + 500 € — от бележката на Ивайло.
 */

const PDF = "/oferta/yordan/ProMarketing-za-Yordan.pdf";

const CSS = `
.yrd-doc{
  --ground:#F7F8F5; --panel:#ECF2EE; --surface:#FFFFFF;
  --ink:#17201C; --ink-2:#47544E; --ink-3:#7B8781;
  --rule:#DCE4DF; --rule-soft:#EAF0EC;
  --accent:#1F5C4A; --accent-soft:#E6F1EB; --accent-line:#BCD8CB;
  --warm:#9A6A1C; --warm-soft:#F8F0E0;
  --shadow:0 1px 2px rgba(23,32,28,.05), 0 12px 30px -20px rgba(23,32,28,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--yrd-ui),Arial,sans-serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.yrd-doc *{box-sizing:border-box}
.yrd-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.yrd-doc h1,.yrd-doc h2{font-family:var(--yrd-display),Georgia,serif;font-weight:600;letter-spacing:-.01em;text-wrap:balance}
.yrd-doc h3{font-family:var(--yrd-ui),Arial,sans-serif;font-weight:600;letter-spacing:-.01em}
.yrd-doc .num{font-variant-numeric:tabular-nums}
.yrd-doc a{color:var(--accent);text-underline-offset:3px}
.yrd-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.yrd-doc p{margin:0}

/* ── шапка ── */
.yrd-doc .masthead{padding:60px 0 36px;border-bottom:1px solid var(--rule)}
.yrd-doc .eyebrow{font-weight:600;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.yrd-doc h1{font-size:48px;line-height:1.08;margin:0 0 20px;max-width:20ch}
.yrd-doc h1 em{font-style:italic;color:var(--accent)}
.yrd-doc .deck{font-size:19px;line-height:1.58;color:var(--ink-2);max-width:62ch;margin:0 0 24px}
.yrd-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-size:14px;color:var(--ink-3)}
.yrd-doc .byline .pill{font-weight:600;font-size:14px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:999px;padding:6px 14px}
.yrd-doc .byline a{font-weight:600}

/* ── секции ── */
.yrd-doc section{margin:56px 0 0}
.yrd-doc .kick{font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--warm);margin:0 0 10px}
.yrd-doc .h2sub{font-size:31px;line-height:1.18;margin:0 0 14px;max-width:26ch}
.yrd-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.yrd-doc .note{font-size:14px;color:var(--ink-3);margin:12px 0 0;max-width:70ch}

/* ── откъде тръгваме ── */
.yrd-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 20px}
.yrd-doc .fact{background:var(--panel);border-radius:14px;padding:18px 20px}
.yrd-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.yrd-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.yrd-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 14px 14px 0;padding:18px 22px;box-shadow:var(--shadow)}
.yrd-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.yrd-doc .pull .src{display:block;margin-top:8px;font-size:13.5px;color:var(--ink-3)}

/* ── какво изграждаме ── */
.yrd-doc .hero{background:var(--surface);border:1px solid var(--accent-line);border-radius:18px;padding:26px 26px 24px;box-shadow:var(--shadow);margin:0 0 14px}
.yrd-doc .hero .tag{display:inline-block;font-weight:600;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:4px 12px;margin:0 0 12px}
.yrd-doc .hero h3{font-family:var(--yrd-display),Georgia,serif;font-size:26px;line-height:1.2;margin:0 0 10px}
.yrd-doc .hero p{font-size:16px;line-height:1.6;color:var(--ink-2);max-width:68ch}
.yrd-doc .chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;padding:0;list-style:none}
.yrd-doc .chips li{font-size:14px;font-weight:500;color:var(--ink);background:var(--panel);border-radius:999px;padding:6px 13px}
.yrd-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.yrd-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:20px 20px 18px}
.yrd-doc .card .n{font-weight:600;font-size:12px;color:var(--warm);letter-spacing:.12em;display:block;margin:0 0 8px}
.yrd-doc .card h3{font-size:16.5px;margin:0 0 7px}
.yrd-doc .card p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.yrd-doc .goal{margin:14px 0 0;padding:16px 20px;border-radius:14px;background:var(--warm-soft);font-size:16px;line-height:1.55;color:var(--ink)}
.yrd-doc .goal b{color:var(--warm);font-weight:600}

/* ── какво видя ── */
.yrd-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.yrd-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.yrd-doc .box h3{font-size:16.5px;margin:0 0 8px}
.yrd-doc .box p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── как работим ── */
.yrd-doc .rows{display:grid;grid-template-columns:auto 1fr;gap:0 20px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.yrd-doc .rows .t{font-weight:600;font-size:14.5px;color:var(--accent);padding:14px 0;border-top:1px dashed var(--rule);max-width:16ch}
.yrd-doc .rows .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule)}
.yrd-doc .rows .t:first-child,.yrd-doc .rows .t:first-child+.w{border-top:0}
.yrd-doc .rows .w b{color:var(--ink);font-weight:600}

/* ── трите месеца ── */
.yrd-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.yrd-doc .step{background:var(--surface);border:1px solid var(--rule);border-top:3px solid var(--accent);border-radius:12px;padding:20px}
.yrd-doc .step .d{font-weight:600;font-size:12px;letter-spacing:.12em;color:var(--warm);text-transform:uppercase;display:block;margin:0 0 7px}
.yrd-doc .step h3{font-size:16.5px;margin:0 0 7px}
.yrd-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── цената ── */
.yrd-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:28px;box-shadow:var(--shadow)}
.yrd-doc .price .big{font-family:var(--yrd-display),Georgia,serif;font-weight:700;font-size:50px;line-height:1;margin:0 0 8px;color:var(--ink)}
.yrd-doc .price .big small{font-family:var(--yrd-ui),Arial,sans-serif;font-size:18px;font-weight:500;color:var(--ink-3);margin-left:10px;white-space:nowrap;display:inline-block}
.yrd-doc .price .sub{font-size:14px;color:var(--ink-3);margin:0 0 16px}
.yrd-doc .price h3{font-size:15px;margin:0 0 8px}
.yrd-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.yrd-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.yrd-doc .price td.v{color:var(--ink);font-weight:500;text-align:right;white-space:nowrap;padding-left:14px}
.yrd-doc .price tr:first-child td{border-top:0}
.yrd-doc .opt{margin:12px 0 0;padding:12px 14px;border-radius:12px;background:var(--panel);font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.yrd-doc .opt b{color:var(--ink);font-weight:600}
.yrd-doc .opt.hl{background:var(--accent-soft)}
.yrd-doc .opt.hl b{color:var(--accent)}

/* ── следващата стъпка ── */
.yrd-doc .closing{background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:18px;padding:32px 32px 28px;margin-top:56px}
.yrd-doc .closing h2{font-size:29px;margin:0 0 10px;color:var(--ink)}
.yrd-doc .closing p{font-size:16.5px;line-height:1.6;color:var(--ink-2);max-width:62ch}
.yrd-doc .closing p + p{margin-top:10px}
.yrd-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.yrd-doc .closing a.btn{font-weight:600;text-decoration:none;color:var(--accent);background:var(--surface);border:1px solid var(--accent-line);border-radius:12px;padding:12px 18px;font-size:15px}
.yrd-doc .sig{break-inside:avoid;margin:26px 0 0;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.yrd-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .yrd-doc{font-size:16.5px}
  .yrd-doc .wrap{padding:0 18px 72px}
  .yrd-doc h1{font-size:34px}
  .yrd-doc .deck{font-size:17.5px}
  .yrd-doc .h2sub{font-size:25px}
  .yrd-doc .masthead{padding:38px 0 28px}
  .yrd-doc section{margin:44px 0 0}
  .yrd-doc .hero{padding:22px 20px 20px}
  .yrd-doc .hero h3{font-size:22px}
  .yrd-doc .two,.yrd-doc .price{grid-template-columns:1fr}
  .yrd-doc .price{padding:22px 20px}
  .yrd-doc .price .big{font-size:42px}
  .yrd-doc .rows{grid-template-columns:1fr;padding:14px 20px}
  .yrd-doc .rows .t{padding:14px 0 0;border-top:1px dashed var(--rule);max-width:none}
  .yrd-doc .rows .w{padding:4px 0 14px;border-top:0}
  .yrd-doc .rows .t:first-child{border-top:0}
  .yrd-doc .closing{padding:24px 20px 22px}
}
@media print{
  html,body{background:#fff}
  .yrd-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .yrd-doc .wrap{max-width:none;padding:0}
  .yrd-doc .masthead{padding:0 0 16px}
  .yrd-doc h1{font-size:30px;margin-bottom:12px}
  .yrd-doc .deck{font-size:14px;margin-bottom:14px}
  .yrd-doc .byline .pdf{display:none}
  .yrd-doc section{margin:22px 0 0}
  .yrd-doc section.sec-build{break-before:page}
  .yrd-doc section.sec-price{break-before:page}
  .yrd-doc .kick,.yrd-doc .h2sub,.yrd-doc .lead{break-after:avoid}
  .yrd-doc .h2sub{font-size:20px;margin-bottom:10px}
  .yrd-doc .lead{font-size:13px;margin-bottom:12px}
  .yrd-doc .fact,.yrd-doc .card,.yrd-doc .step,.yrd-doc .box,.yrd-doc .price,.yrd-doc .pull,.yrd-doc .hero,.yrd-doc .goal,.yrd-doc .rows,.yrd-doc .closing{break-inside:avoid}
  .yrd-doc .fact p,.yrd-doc .step p,.yrd-doc .box p{font-size:12px}
  .yrd-doc .pull p{font-size:13px}
  .yrd-doc .hero{padding:16px 18px;box-shadow:none}
  .yrd-doc .hero h3{font-size:18px}
  .yrd-doc .hero p{font-size:12.5px}
  .yrd-doc .chips li{font-size:11.5px;padding:4px 10px}
  .yrd-doc .cards{grid-template-columns:1fr 1fr;gap:9px}
  .yrd-doc .card{padding:12px 14px}
  .yrd-doc .card h3{font-size:13.5px}
  .yrd-doc .card p{font-size:12px}
  .yrd-doc .goal{font-size:12.5px;padding:12px 14px}
  .yrd-doc .box{box-shadow:none;padding:16px}
  .yrd-doc .rows{box-shadow:none;padding:6px 16px}
  .yrd-doc .rows .t,.yrd-doc .rows .w{padding:8px 0;font-size:12px}
  .yrd-doc .step{padding:12px}
  .yrd-doc .price{box-shadow:none;padding:18px}
  .yrd-doc .price .big{font-size:36px}
  .yrd-doc .price td{font-size:12.5px;padding:6px 0}
  .yrd-doc .opt{font-size:12px;padding:9px 12px}
  .yrd-doc .closing{padding:20px 22px;margin-top:22px}
  .yrd-doc .closing h2{font-size:21px}
  .yrd-doc .closing p{font-size:13px}
  .yrd-doc .closing .ctas{display:none}
  .yrd-doc .fact,.yrd-doc .byline .pill,.yrd-doc .chips li,.yrd-doc .goal,.yrd-doc .opt,.yrd-doc .hero .tag,.yrd-doc .closing,.yrd-doc .step{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* A4 е под 760px — връщаме колоните, които мобилният изглед сгъва */
  .yrd-doc .facts{grid-template-columns:1fr 1fr}
  .yrd-doc .steps{grid-template-columns:1fr 1fr}
  .yrd-doc .two,.yrd-doc .price{grid-template-columns:1fr 1fr}
  .yrd-doc .rows{grid-template-columns:auto 1fr}
  .yrd-doc .rows .t,.yrd-doc .rows .w{border-top:1px dashed var(--rule)}
  .yrd-doc .rows .t:first-child,.yrd-doc .rows .t:first-child+.w{border-top:0}
  .yrd-doc .rows .t{max-width:16ch}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}

/* ── чуйте го на живо ── */
.yrd-doc .tryit{background:linear-gradient(180deg,#1F5C4A,#184A3C);color:#F2F8F5;border-radius:18px;padding:30px;margin:0 0 14px}
.yrd-doc .tryit h3{font-family:var(--yrd-display),Georgia,serif;color:#fff;font-size:25px;line-height:1.2;margin:0 0 10px;max-width:26ch}
.yrd-doc .tryit p{font-size:16px;line-height:1.6;color:rgba(255,255,255,.88);max-width:64ch}
.yrd-doc .tryit p+p{margin-top:11px}
.yrd-doc .tryit .phone{display:inline-block;font-size:26px;font-weight:600;letter-spacing:.02em;color:#fff;text-decoration:none;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);border-radius:12px;padding:12px 20px;margin:16px 0 12px}
.yrd-doc .tryit .warn{font-size:14.5px;line-height:1.55;color:#FAF0DC;background:rgba(255,255,255,.1);border-left:3px solid #E0B65A;border-radius:0 10px 10px 0;padding:12px 16px;margin:12px 0 0}
.yrd-doc .tryit .warn b{color:#fff;font-weight:600}
.yrd-doc .tryit .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 0}
.yrd-doc .tryit a.btn{font-weight:600;text-decoration:none;color:var(--accent);background:#fff;border-radius:10px;padding:12px 18px;font-size:15px}
.yrd-doc .say{margin:14px 0 0;padding:14px 18px;border-radius:12px;background:var(--panel);font-size:16px;line-height:1.6;color:var(--ink);font-style:italic}
@media (max-width:760px){
  .yrd-doc .tryit{padding:22px 20px}
  .yrd-doc .tryit h3{font-size:21px}
  .yrd-doc .tryit .phone{font-size:22px}
}
@media print{
  .yrd-doc .tryit{padding:18px 20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .yrd-doc .tryit h3{font-size:17px}
  .yrd-doc .tryit p{font-size:12px}
  .yrd-doc .tryit .phone{font-size:18px;padding:8px 14px;margin:10px 0 8px}
  .yrd-doc .tryit .warn{font-size:11.5px;padding:8px 12px}
  .yrd-doc .tryit .ctas{display:none}
  .yrd-doc .tryit,.yrd-doc .say{break-inside:avoid}
  .yrd-doc .say{font-size:12.5px;padding:10px 14px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .yrd-doc .cards.k3{grid-template-columns:1fr 1fr}
}
`;

export default function YordanOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">AI гласов агент · агент на сайта</p>
        <h1>
          Да не отговаряте на едни и същи въпроси <em>по цял ден</em>
        </h1>
        <p className="deck">
          Обучаваме AI върху Вашите къщи — модели, срокове, начин на строеж, как протича поръчката. Той
          вдига телефона и отговаря на посетителите на сайта на чист български. Вие се включвате там,
          където е нужен човек: при разговор за конкретен проект.
        </p>
        <p className="byline">
          <span className="pill">1 000 € + 500 €</span>
          <span>За Йордан Николов · сглобяеми къщи · от Ивайло Петев, Pro Marketing</span>
          <span className="num">15.10.2026</span>
          <a className="pdf" href={PDF}>Свали като PDF</a>
        </p>
      </header>

      <section>
        <p className="kick">Откъде тръгваме</p>
        <h2 className="h2sub">Това, което ми казахте</h2>
        <div className="facts">
          <article className="fact"><h3>Сглобяеми къщи</h3><p>Хората питат за цени, срокове, видове къщи и как се стига до поръчка.</p></article>
          <article className="fact"><h3>Едни и същи въпроси</h3><p>Отговаряте на подобни въпроси през целия ден — по телефона и в съобщения.</p></article>
        </div>
        <div className="pull">
          <p>„Искам да обучим ИИ, който да отговаря на въпроси.“</p>
          <span className="src">Йордан, при записването на консултацията.</span>
        </div>
      </section>

      <section>
        <p className="kick">Какво изграждаме</p>
        <h2 className="h2sub">Две части, които работят заедно</h2>
        <div className="cards">
          <article className="card"><span className="n">01 · 1 000 €</span><h3>Гласов агент</h3><p>Вдига телефона, отговаря на най-честите въпроси за къщите Ви и записва контакта и какво търси човекът. Каквото е за Вас — Ви стига с готово резюме.</p></article>
          <article className="card"><span className="n">02 · 500 €</span><h3>Агент на сайта</h3><p>Чат в сайта Ви, обучен със същите знания. Посетителят получава отговор веднага, а Вие — оставен контакт.</p></article>
        </div>
        <p className="goal"><b>Смисълът:</b> нито едно запитване да не остава без отговор, а Вие да говорите само с хора, които наистина искат къща.</p>
      </section>

      <section>
        <p className="kick">Условията</p>
        <h2 className="h2sub">Цената</h2>
        <div className="rows">
          <span className="t">Гласов агент</span><span className="w"><b>1 000 €</b> с ДДС · еднократно</span>
          <span className="t">Агент на сайта</span><span className="w"><b>500 €</b> с ДДС · еднократно</span>
          <span className="t">Телефония</span><span className="w">Разговорите се плащат директно на доставчика, без надценка от нас.</span>
        </div>
        <p className="note">Обхватът и сроковете ги уточняваме заедно на кратък разговор — преди да започнем.</p>
      </section>

      <section>
        <p className="kick">Следваща стъпка</p>
        <h2 className="h2sub">Един кратък разговор</h2>
        <p className="lead">Ще Ви звънна, за да уточним въпросите, на които агентът трябва да отговаря, и кога да започнем.</p>
        <p className="note">Ивайло Петев · ProMarketing · 0877 399 963 · petevai.com · promarketing.pw</p>
      </section>
    </main>
  );
}
