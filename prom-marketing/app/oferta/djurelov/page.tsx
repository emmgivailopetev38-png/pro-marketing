/**
 * AI гласов асистент 24/7 — оферта след телефонен разговор (клиент от TikTok @djurelov_, 19.10.2026).
 * Договорено по телефона: изработка 700 € без ДДС, срок 1 месец; телефонията — директно към доставчика.
 * Името и бизнесът на клиента не са известни — текстът е общ.
 */

const PDF = "/oferta/djurelov/ProMarketing-AI-asistent-24-7.pdf";

const CSS = `
.dju-doc{
  --ground:#F7F8F5; --panel:#ECF2EE; --surface:#FFFFFF;
  --ink:#17201C; --ink-2:#47544E; --ink-3:#7B8781;
  --rule:#DCE4DF; --rule-soft:#EAF0EC;
  --accent:#1F5C4A; --accent-soft:#E6F1EB; --accent-line:#BCD8CB;
  --warm:#9A6A1C; --warm-soft:#F8F0E0;
  --shadow:0 1px 2px rgba(23,32,28,.05), 0 12px 30px -20px rgba(23,32,28,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--dju-ui),Arial,sans-serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.dju-doc *{box-sizing:border-box}
.dju-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.dju-doc h1,.dju-doc h2{font-family:var(--dju-display),Georgia,serif;font-weight:600;letter-spacing:-.01em;text-wrap:balance}
.dju-doc h3{font-family:var(--dju-ui),Arial,sans-serif;font-weight:600;letter-spacing:-.01em}
.dju-doc .num{font-variant-numeric:tabular-nums}
.dju-doc a{color:var(--accent);text-underline-offset:3px}
.dju-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.dju-doc p{margin:0}

/* ── шапка ── */
.dju-doc .masthead{padding:60px 0 36px;border-bottom:1px solid var(--rule)}
.dju-doc .eyebrow{font-weight:600;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.dju-doc h1{font-size:48px;line-height:1.08;margin:0 0 20px;max-width:20ch}
.dju-doc h1 em{font-style:italic;color:var(--accent)}
.dju-doc .deck{font-size:19px;line-height:1.58;color:var(--ink-2);max-width:62ch;margin:0 0 24px}
.dju-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-size:14px;color:var(--ink-3)}
.dju-doc .byline .pill{font-weight:600;font-size:14px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:999px;padding:6px 14px}
.dju-doc .byline a{font-weight:600}

/* ── секции ── */
.dju-doc section{margin:56px 0 0}
.dju-doc .kick{font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--warm);margin:0 0 10px}
.dju-doc .h2sub{font-size:31px;line-height:1.18;margin:0 0 14px;max-width:26ch}
.dju-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.dju-doc .note{font-size:14px;color:var(--ink-3);margin:12px 0 0;max-width:70ch}

/* ── откъде тръгваме ── */
.dju-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 20px}
.dju-doc .fact{background:var(--panel);border-radius:14px;padding:18px 20px}
.dju-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.dju-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.dju-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 14px 14px 0;padding:18px 22px;box-shadow:var(--shadow)}
.dju-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.dju-doc .pull .src{display:block;margin-top:8px;font-size:13.5px;color:var(--ink-3)}

/* ── какво изграждаме ── */
.dju-doc .hero{background:var(--surface);border:1px solid var(--accent-line);border-radius:18px;padding:26px 26px 24px;box-shadow:var(--shadow);margin:0 0 14px}
.dju-doc .hero .tag{display:inline-block;font-weight:600;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:4px 12px;margin:0 0 12px}
.dju-doc .hero h3{font-family:var(--dju-display),Georgia,serif;font-size:26px;line-height:1.2;margin:0 0 10px}
.dju-doc .hero p{font-size:16px;line-height:1.6;color:var(--ink-2);max-width:68ch}
.dju-doc .chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;padding:0;list-style:none}
.dju-doc .chips li{font-size:14px;font-weight:500;color:var(--ink);background:var(--panel);border-radius:999px;padding:6px 13px}
.dju-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.dju-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:20px 20px 18px}
.dju-doc .card .n{font-weight:600;font-size:12px;color:var(--warm);letter-spacing:.12em;display:block;margin:0 0 8px}
.dju-doc .card h3{font-size:16.5px;margin:0 0 7px}
.dju-doc .card p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.dju-doc .goal{margin:14px 0 0;padding:16px 20px;border-radius:14px;background:var(--warm-soft);font-size:16px;line-height:1.55;color:var(--ink)}
.dju-doc .goal b{color:var(--warm);font-weight:600}

/* ── какво видя ── */
.dju-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.dju-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.dju-doc .box h3{font-size:16.5px;margin:0 0 8px}
.dju-doc .box p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── как работим ── */
.dju-doc .rows{display:grid;grid-template-columns:auto 1fr;gap:0 20px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.dju-doc .rows .t{font-weight:600;font-size:14.5px;color:var(--accent);padding:14px 0;border-top:1px dashed var(--rule);max-width:16ch}
.dju-doc .rows .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule)}
.dju-doc .rows .t:first-child,.dju-doc .rows .t:first-child+.w{border-top:0}
.dju-doc .rows .w b{color:var(--ink);font-weight:600}

/* ── трите месеца ── */
.dju-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.dju-doc .step{background:var(--surface);border:1px solid var(--rule);border-top:3px solid var(--accent);border-radius:12px;padding:20px}
.dju-doc .step .d{font-weight:600;font-size:12px;letter-spacing:.12em;color:var(--warm);text-transform:uppercase;display:block;margin:0 0 7px}
.dju-doc .step h3{font-size:16.5px;margin:0 0 7px}
.dju-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── цената ── */
.dju-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:28px;box-shadow:var(--shadow)}
.dju-doc .price .big{font-family:var(--dju-display),Georgia,serif;font-weight:700;font-size:50px;line-height:1;margin:0 0 8px;color:var(--ink)}
.dju-doc .price .big small{font-family:var(--dju-ui),Arial,sans-serif;font-size:18px;font-weight:500;color:var(--ink-3);margin-left:10px;white-space:nowrap;display:inline-block}
.dju-doc .price .sub{font-size:14px;color:var(--ink-3);margin:0 0 16px}
.dju-doc .price h3{font-size:15px;margin:0 0 8px}
.dju-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.dju-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.dju-doc .price td.v{color:var(--ink);font-weight:500;text-align:right;white-space:nowrap;padding-left:14px}
.dju-doc .price tr:first-child td{border-top:0}
.dju-doc .opt{margin:12px 0 0;padding:12px 14px;border-radius:12px;background:var(--panel);font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.dju-doc .opt b{color:var(--ink);font-weight:600}
.dju-doc .opt.hl{background:var(--accent-soft)}
.dju-doc .opt.hl b{color:var(--accent)}

/* ── следващата стъпка ── */
.dju-doc .closing{background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:18px;padding:32px 32px 28px;margin-top:56px}
.dju-doc .closing h2{font-size:29px;margin:0 0 10px;color:var(--ink)}
.dju-doc .closing p{font-size:16.5px;line-height:1.6;color:var(--ink-2);max-width:62ch}
.dju-doc .closing p + p{margin-top:10px}
.dju-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.dju-doc .closing a.btn{font-weight:600;text-decoration:none;color:var(--accent);background:var(--surface);border:1px solid var(--accent-line);border-radius:12px;padding:12px 18px;font-size:15px}
.dju-doc .sig{break-inside:avoid;margin:26px 0 0;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.dju-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .dju-doc{font-size:16.5px}
  .dju-doc .wrap{padding:0 18px 72px}
  .dju-doc h1{font-size:34px}
  .dju-doc .deck{font-size:17.5px}
  .dju-doc .h2sub{font-size:25px}
  .dju-doc .masthead{padding:38px 0 28px}
  .dju-doc section{margin:44px 0 0}
  .dju-doc .hero{padding:22px 20px 20px}
  .dju-doc .hero h3{font-size:22px}
  .dju-doc .two,.dju-doc .price{grid-template-columns:1fr}
  .dju-doc .price{padding:22px 20px}
  .dju-doc .price .big{font-size:42px}
  .dju-doc .rows{grid-template-columns:1fr;padding:14px 20px}
  .dju-doc .rows .t{padding:14px 0 0;border-top:1px dashed var(--rule);max-width:none}
  .dju-doc .rows .w{padding:4px 0 14px;border-top:0}
  .dju-doc .rows .t:first-child{border-top:0}
  .dju-doc .closing{padding:24px 20px 22px}
}
@media print{
  html,body{background:#fff}
  .dju-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .dju-doc .wrap{max-width:none;padding:0}
  .dju-doc .masthead{padding:0 0 16px}
  .dju-doc h1{font-size:30px;margin-bottom:12px}
  .dju-doc .deck{font-size:14px;margin-bottom:14px}
  .dju-doc .byline .pdf{display:none}
  .dju-doc section{margin:22px 0 0}
  .dju-doc section.sec-build{break-before:page}
  .dju-doc section.sec-price{break-before:page}
  .dju-doc .kick,.dju-doc .h2sub,.dju-doc .lead{break-after:avoid}
  .dju-doc .h2sub{font-size:20px;margin-bottom:10px}
  .dju-doc .lead{font-size:13px;margin-bottom:12px}
  .dju-doc .fact,.dju-doc .card,.dju-doc .step,.dju-doc .box,.dju-doc .price,.dju-doc .pull,.dju-doc .hero,.dju-doc .goal,.dju-doc .rows,.dju-doc .closing{break-inside:avoid}
  .dju-doc .fact p,.dju-doc .step p,.dju-doc .box p{font-size:12px}
  .dju-doc .pull p{font-size:13px}
  .dju-doc .hero{padding:16px 18px;box-shadow:none}
  .dju-doc .hero h3{font-size:18px}
  .dju-doc .hero p{font-size:12.5px}
  .dju-doc .chips li{font-size:11.5px;padding:4px 10px}
  .dju-doc .cards{grid-template-columns:1fr 1fr;gap:9px}
  .dju-doc .card{padding:12px 14px}
  .dju-doc .card h3{font-size:13.5px}
  .dju-doc .card p{font-size:12px}
  .dju-doc .goal{font-size:12.5px;padding:12px 14px}
  .dju-doc .box{box-shadow:none;padding:16px}
  .dju-doc .rows{box-shadow:none;padding:6px 16px}
  .dju-doc .rows .t,.dju-doc .rows .w{padding:8px 0;font-size:12px}
  .dju-doc .step{padding:12px}
  .dju-doc .price{box-shadow:none;padding:18px}
  .dju-doc .price .big{font-size:36px}
  .dju-doc .price td{font-size:12.5px;padding:6px 0}
  .dju-doc .opt{font-size:12px;padding:9px 12px}
  .dju-doc .closing{padding:20px 22px;margin-top:22px}
  .dju-doc .closing h2{font-size:21px}
  .dju-doc .closing p{font-size:13px}
  .dju-doc .closing .ctas{display:none}
  .dju-doc .fact,.dju-doc .byline .pill,.dju-doc .chips li,.dju-doc .goal,.dju-doc .opt,.dju-doc .hero .tag,.dju-doc .closing,.dju-doc .step{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* A4 е под 760px — връщаме колоните, които мобилният изглед сгъва */
  .dju-doc .facts{grid-template-columns:1fr 1fr}
  .dju-doc .steps{grid-template-columns:1fr 1fr}
  .dju-doc .two,.dju-doc .price{grid-template-columns:1fr 1fr}
  .dju-doc .rows{grid-template-columns:auto 1fr}
  .dju-doc .rows .t,.dju-doc .rows .w{border-top:1px dashed var(--rule)}
  .dju-doc .rows .t:first-child,.dju-doc .rows .t:first-child+.w{border-top:0}
  .dju-doc .rows .t{max-width:16ch}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}

/* ── чуйте го на живо ── */
.dju-doc .tryit{background:linear-gradient(180deg,#1F5C4A,#184A3C);color:#F2F8F5;border-radius:18px;padding:30px;margin:0 0 14px}
.dju-doc .tryit h3{font-family:var(--dju-display),Georgia,serif;color:#fff;font-size:25px;line-height:1.2;margin:0 0 10px;max-width:26ch}
.dju-doc .tryit p{font-size:16px;line-height:1.6;color:rgba(255,255,255,.88);max-width:64ch}
.dju-doc .tryit p+p{margin-top:11px}
.dju-doc .tryit .phone{display:inline-block;font-size:26px;font-weight:600;letter-spacing:.02em;color:#fff;text-decoration:none;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);border-radius:12px;padding:12px 20px;margin:16px 0 12px}
.dju-doc .tryit .warn{font-size:14.5px;line-height:1.55;color:#FAF0DC;background:rgba(255,255,255,.1);border-left:3px solid #E0B65A;border-radius:0 10px 10px 0;padding:12px 16px;margin:12px 0 0}
.dju-doc .tryit .warn b{color:#fff;font-weight:600}
.dju-doc .tryit .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 0}
.dju-doc .tryit a.btn{font-weight:600;text-decoration:none;color:var(--accent);background:#fff;border-radius:10px;padding:12px 18px;font-size:15px}
.dju-doc .say{margin:14px 0 0;padding:14px 18px;border-radius:12px;background:var(--panel);font-size:16px;line-height:1.6;color:var(--ink);font-style:italic}
@media (max-width:760px){
  .dju-doc .tryit{padding:22px 20px}
  .dju-doc .tryit h3{font-size:21px}
  .dju-doc .tryit .phone{font-size:22px}
}
@media print{
  .dju-doc .tryit{padding:18px 20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .dju-doc .tryit h3{font-size:17px}
  .dju-doc .tryit p{font-size:12px}
  .dju-doc .tryit .phone{font-size:18px;padding:8px 14px;margin:10px 0 8px}
  .dju-doc .tryit .warn{font-size:11.5px;padding:8px 12px}
  .dju-doc .tryit .ctas{display:none}
  .dju-doc .tryit,.dju-doc .say{break-inside:avoid}
  .dju-doc .say{font-size:12.5px;padding:10px 14px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .dju-doc .cards.k3{grid-template-columns:1fr 1fr}
}
`;

export default function DjurelovOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">AI гласов асистент · 24/7</p>
        <h1>
          Нито едно изпуснато обаждане — <em>денем и нощем</em>
        </h1>
        <p className="deck">
          Здравей! Каза ми, че искаш AI асистент, който да приема обажданията ти и през нощта, и през
          деня. Ето как го правим: асистентът вдига, говори на чист български, събира нужното от
          клиента и ти праща резюме. Ти спиш. Клиентите ти са обслужени.
        </p>
        <p className="byline">
          <span className="pill">Изработка · 700 € без ДДС</span>
          <span>От Ивайло Петев, Pro Marketing</span>
          <span className="num">Срок · 1 месец</span>
          <a className="pdf" href={PDF}>Свали като PDF</a>
        </p>
      </header>

      <section>
        <p className="kick">Какво получаваш</p>
        <h2 className="h2sub">Всяко обаждане намира човек отсреща</h2>
        <div className="facts">
          <article className="fact"><h3>Нощем и в почивните дни</h3><p>Обаждане в 2 през нощта или в неделя следобед — асистентът вдига и клиентът не затваря с празни ръце.</p></article>
          <article className="fact"><h3>Чист български</h3><p>Говори спокойно и учтиво, разбира въпроса и отговаря по същество. Може да го прекъснеш — не се обърква.</p></article>
          <article className="fact"><h3>Събира всичко нужно</h3><p>Какво иска клиентът, как се казва, на кой телефон да му се обадиш. Нищо не се губи по пътя.</p></article>
          <article className="fact"><h3>Ти си в течение</h3><p>След всеки разговор получаваш кратко резюме. Отваряш го сутринта и знаеш кому да звъннеш.</p></article>
        </div>
      </section>

      <section className="sec-build">
        <p className="kick">Как работи</p>
        <h2 className="h2sub">Четири стъпки от обаждането до теб</h2>
        <div className="cards">
          <article className="card"><span className="n">01</span><h3>Клиентът звъни</h3><p>Асистентът вдига веднага — без чакане и без „моля, оставете съобщение“.</p></article>
          <article className="card"><span className="n">02</span><h3>Разбира какво му трябва</h3><p>Отговаря на въпросите, които ти му зададеш предварително, и записва заявката.</p></article>
          <article className="card"><span className="n">03</span><h3>Записва час или препраща</h3><p>Резервира среща или прехвърля към теб, когато разговорът е за теб — както решиш.</p></article>
          <article className="card"><span className="n">04</span><h3>Получаваш резюме</h3><p>Име, телефон, заявка и какво е казано — подредено и готово за обратно обаждане.</p></article>
        </div>
        <div className="hero" style={{ marginTop: 14 }}>
          <span className="tag">Ти решаваш</span>
          <h3>Асистентът казва само това, което ти искаш</h3>
          <p>
            Ти задаваш какво да отговаря, с какъв тон и кога да прехвърля към теб. Представя се честно
            като AI асистент — това сваля напрежението и клиентите го приемат спокойно.
          </p>
          <ul className="chips">
            <li>Чист български</li>
            <li>Кратко и учтиво</li>
            <li>Твоите думи и правила</li>
            <li>Резюме след всеки разговор</li>
          </ul>
        </div>
        <p className="goal">
          <b>Преди да тръгне на живо</b> го тестваме заедно. Ти звъниш, слушаш, казваш какво да се
          промени — и го пускаме чак когато си доволен.
        </p>
      </section>

      <section>
        <p className="kick">Примери</p>
        <h2 className="h2sub">Чуй го сам</h2>
        <p className="lead">
          Най-добре е да го чуеш на живо. Обади се и го изпитай — прекъсни го, смени темата, питай
          каквото би питал като клиент.
        </p>
        <div className="tryit">
          <h3>Обади се на нашия гласов агент</h3>
          <a className="phone" href="tel:+14754269084">+1 475 426 9084</a>
          <p>
            Това е AI рецепцията на Pro Marketing. Вдига телефона и бутона в сайта ни, говори на
            български, проверява свободните часове и записва срещата в календара и в CRM системата.
          </p>
          <p className="warn">
            <b>Защо номерът е американски.</b> Това е демонстрационната линия. При теб асистентът
            приема обажданията на български номер.
          </p>
          <p className="ctas">
            <a className="btn" href="https://promarketing.pw/glas">Или го пробвай с бутон в сайта</a>
          </p>
        </div>
      </section>

      <section>
        <p className="kick">Срокът</p>
        <h2 className="h2sub">Един месец от старта до работещ асистент</h2>
        <div className="steps">
          <article className="step"><span className="d">Седмица 1</span><h3>Сценарият</h3><p>Описваме какво казва асистентът, какво пита и кога препраща към теб.</p></article>
          <article className="step"><span className="d">Седмици 2–3</span><h3>Изработка и тестове</h3><p>Изграждаме асистента и го тестваме със звънене — оправяме всичко, което не звучи като теб.</p></article>
          <article className="step"><span className="d">Седмица 4</span><h3>На живо</h3><p>Пускаме го на твоя номер и следим първите разговори, за да е всичко гладко.</p></article>
        </div>
      </section>

      <section className="sec-price">
        <p className="kick">Условията</p>
        <h2 className="h2sub">Цената, както я разбрахме по телефона</h2>
        <div className="price">
          <div>
            <p className="big num">700 €<small>без ДДС</small></p>
            <p className="sub">еднократно · изработка на гласовия асистент · срок 1 месец</p>
            <p className="opt"><b>Какво влиза:</b> сценарият, изработката на асистента, записването на заявките, резюмето към теб и тестовете преди пускане на живо.</p>
            <p className="opt hl"><b>Разговорите плащаш директно на доставчика</b> — без надценка от нас. Точната цена на минута виждаш при доставчика и я следиш сам.</p>
          </div>
          <div>
            <h3>Какво и как се плаща</h3>
            <table>
              <tbody>
                <tr><td>Изработка на асистента</td><td className="v">700 € без ДДС</td></tr>
                <tr><td>Срок за изработка</td><td className="v">1 месец</td></tr>
                <tr><td>Разговори (телефония и AI)</td><td className="v">към доставчика</td></tr>
                <tr><td>По-големи доработки</td><td className="v">по отделна оферта</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Правим кратко обаждане: разказваш ми за бизнеса си и какво да казва асистентът на клиентите
          ти. После започваме — и след месец имаш асистент, който вдига вместо теб.
        </p>
        <p className="ctas">
          <a className="btn" href="mailto:emmgivailopetev38@gmail.com?subject=%D0%90%D0%B9%20%D0%B0%D1%81%D0%B8%D1%81%D1%82%D0%B5%D0%BD%D1%82%2024%2F7">Пиши ми</a>
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
