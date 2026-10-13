/**
 * AI програма за новия бизнес на Петър Зинков — 4 месеца, 1 800 € без ДДС.
 * Среща с Ивайло 13.10.2026 (Fathom 857129316): кафене/закусвалня с доставка в Благоевград,
 * имот 60 кв.м, Петър е в Германия, отварянето е след ремонт. Всичко по-долу е казано на срещата:
 * 4 месеца, сайт + CRM + приложение за поръчки + AI реклами, срещи 1–2 пъти седмично, AI обучение,
 * 50 % при старт, невъзстановим депозит 100 € фиксира цената. Следващо чуване: вторник 20.10.
 */

const PDF = "/oferta/petar/ProMarketing-za-Petar.pdf";

const CSS = `
.pzk-doc{
  --ground:#F7F8F5; --panel:#ECF2EE; --surface:#FFFFFF;
  --ink:#17201C; --ink-2:#47544E; --ink-3:#7B8781;
  --rule:#DCE4DF; --rule-soft:#EAF0EC;
  --accent:#1F5C4A; --accent-soft:#E6F1EB; --accent-line:#BCD8CB;
  --warm:#9A6A1C; --warm-soft:#F8F0E0;
  --shadow:0 1px 2px rgba(23,32,28,.05), 0 12px 30px -20px rgba(23,32,28,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--pzk-ui),Arial,sans-serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.pzk-doc *{box-sizing:border-box}
.pzk-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.pzk-doc h1,.pzk-doc h2{font-family:var(--pzk-display),Georgia,serif;font-weight:600;letter-spacing:-.01em;text-wrap:balance}
.pzk-doc h3{font-family:var(--pzk-ui),Arial,sans-serif;font-weight:600;letter-spacing:-.01em}
.pzk-doc .num{font-variant-numeric:tabular-nums}
.pzk-doc a{color:var(--accent);text-underline-offset:3px}
.pzk-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.pzk-doc p{margin:0}

/* ── шапка ── */
.pzk-doc .masthead{padding:60px 0 36px;border-bottom:1px solid var(--rule)}
.pzk-doc .eyebrow{font-weight:600;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.pzk-doc h1{font-size:48px;line-height:1.08;margin:0 0 20px;max-width:20ch}
.pzk-doc h1 em{font-style:italic;color:var(--accent)}
.pzk-doc .deck{font-size:19px;line-height:1.58;color:var(--ink-2);max-width:62ch;margin:0 0 24px}
.pzk-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-size:14px;color:var(--ink-3)}
.pzk-doc .byline .pill{font-weight:600;font-size:14px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:999px;padding:6px 14px}
.pzk-doc .byline a{font-weight:600}

/* ── секции ── */
.pzk-doc section{margin:56px 0 0}
.pzk-doc .kick{font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--warm);margin:0 0 10px}
.pzk-doc .h2sub{font-size:31px;line-height:1.18;margin:0 0 14px;max-width:26ch}
.pzk-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.pzk-doc .note{font-size:14px;color:var(--ink-3);margin:12px 0 0;max-width:70ch}

/* ── откъде тръгваме ── */
.pzk-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 20px}
.pzk-doc .fact{background:var(--panel);border-radius:14px;padding:18px 20px}
.pzk-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.pzk-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.pzk-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 14px 14px 0;padding:18px 22px;box-shadow:var(--shadow)}
.pzk-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.pzk-doc .pull .src{display:block;margin-top:8px;font-size:13.5px;color:var(--ink-3)}

/* ── какво изграждаме ── */
.pzk-doc .hero{background:var(--surface);border:1px solid var(--accent-line);border-radius:18px;padding:26px 26px 24px;box-shadow:var(--shadow);margin:0 0 14px}
.pzk-doc .hero .tag{display:inline-block;font-weight:600;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:4px 12px;margin:0 0 12px}
.pzk-doc .hero h3{font-family:var(--pzk-display),Georgia,serif;font-size:26px;line-height:1.2;margin:0 0 10px}
.pzk-doc .hero p{font-size:16px;line-height:1.6;color:var(--ink-2);max-width:68ch}
.pzk-doc .chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;padding:0;list-style:none}
.pzk-doc .chips li{font-size:14px;font-weight:500;color:var(--ink);background:var(--panel);border-radius:999px;padding:6px 13px}
.pzk-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.pzk-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:20px 20px 18px}
.pzk-doc .card .n{font-weight:600;font-size:12px;color:var(--warm);letter-spacing:.12em;display:block;margin:0 0 8px}
.pzk-doc .card h3{font-size:16.5px;margin:0 0 7px}
.pzk-doc .card p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.pzk-doc .goal{margin:14px 0 0;padding:16px 20px;border-radius:14px;background:var(--warm-soft);font-size:16px;line-height:1.55;color:var(--ink)}
.pzk-doc .goal b{color:var(--warm);font-weight:600}

/* ── какво видя ── */
.pzk-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.pzk-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.pzk-doc .box h3{font-size:16.5px;margin:0 0 8px}
.pzk-doc .box p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── как работим ── */
.pzk-doc .rows{display:grid;grid-template-columns:auto 1fr;gap:0 20px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.pzk-doc .rows .t{font-weight:600;font-size:14.5px;color:var(--accent);padding:14px 0;border-top:1px dashed var(--rule);max-width:16ch}
.pzk-doc .rows .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule)}
.pzk-doc .rows .t:first-child,.pzk-doc .rows .t:first-child+.w{border-top:0}
.pzk-doc .rows .w b{color:var(--ink);font-weight:600}

/* ── трите месеца ── */
.pzk-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.pzk-doc .step{background:var(--surface);border:1px solid var(--rule);border-top:3px solid var(--accent);border-radius:12px;padding:20px}
.pzk-doc .step .d{font-weight:600;font-size:12px;letter-spacing:.12em;color:var(--warm);text-transform:uppercase;display:block;margin:0 0 7px}
.pzk-doc .step h3{font-size:16.5px;margin:0 0 7px}
.pzk-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── цената ── */
.pzk-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:28px;box-shadow:var(--shadow)}
.pzk-doc .price .big{font-family:var(--pzk-display),Georgia,serif;font-weight:700;font-size:50px;line-height:1;margin:0 0 8px;color:var(--ink)}
.pzk-doc .price .big small{font-family:var(--pzk-ui),Arial,sans-serif;font-size:18px;font-weight:500;color:var(--ink-3);margin-left:10px;white-space:nowrap;display:inline-block}
.pzk-doc .price .sub{font-size:14px;color:var(--ink-3);margin:0 0 16px}
.pzk-doc .price h3{font-size:15px;margin:0 0 8px}
.pzk-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.pzk-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.pzk-doc .price td.v{color:var(--ink);font-weight:500;text-align:right;white-space:nowrap;padding-left:14px}
.pzk-doc .price tr:first-child td{border-top:0}
.pzk-doc .opt{margin:12px 0 0;padding:12px 14px;border-radius:12px;background:var(--panel);font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.pzk-doc .opt b{color:var(--ink);font-weight:600}
.pzk-doc .opt.hl{background:var(--accent-soft)}
.pzk-doc .opt.hl b{color:var(--accent)}

/* ── следващата стъпка ── */
.pzk-doc .closing{background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:18px;padding:32px 32px 28px;margin-top:56px}
.pzk-doc .closing h2{font-size:29px;margin:0 0 10px;color:var(--ink)}
.pzk-doc .closing p{font-size:16.5px;line-height:1.6;color:var(--ink-2);max-width:62ch}
.pzk-doc .closing p + p{margin-top:10px}
.pzk-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.pzk-doc .closing a.btn{font-weight:600;text-decoration:none;color:var(--accent);background:var(--surface);border:1px solid var(--accent-line);border-radius:12px;padding:12px 18px;font-size:15px}
.pzk-doc .sig{break-inside:avoid;margin:26px 0 0;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.pzk-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .pzk-doc{font-size:16.5px}
  .pzk-doc .wrap{padding:0 18px 72px}
  .pzk-doc h1{font-size:34px}
  .pzk-doc .deck{font-size:17.5px}
  .pzk-doc .h2sub{font-size:25px}
  .pzk-doc .masthead{padding:38px 0 28px}
  .pzk-doc section{margin:44px 0 0}
  .pzk-doc .hero{padding:22px 20px 20px}
  .pzk-doc .hero h3{font-size:22px}
  .pzk-doc .two,.pzk-doc .price{grid-template-columns:1fr}
  .pzk-doc .price{padding:22px 20px}
  .pzk-doc .price .big{font-size:42px}
  .pzk-doc .rows{grid-template-columns:1fr;padding:14px 20px}
  .pzk-doc .rows .t{padding:14px 0 0;border-top:1px dashed var(--rule);max-width:none}
  .pzk-doc .rows .w{padding:4px 0 14px;border-top:0}
  .pzk-doc .rows .t:first-child{border-top:0}
  .pzk-doc .closing{padding:24px 20px 22px}
}
@media print{
  html,body{background:#fff}
  .pzk-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .pzk-doc .wrap{max-width:none;padding:0}
  .pzk-doc .masthead{padding:0 0 16px}
  .pzk-doc h1{font-size:30px;margin-bottom:12px}
  .pzk-doc .deck{font-size:14px;margin-bottom:14px}
  .pzk-doc .byline .pdf{display:none}
  .pzk-doc section{margin:22px 0 0}
  .pzk-doc section.sec-build{break-before:page}
  .pzk-doc section.sec-price{break-before:page}
  .pzk-doc .kick,.pzk-doc .h2sub,.pzk-doc .lead{break-after:avoid}
  .pzk-doc .h2sub{font-size:20px;margin-bottom:10px}
  .pzk-doc .lead{font-size:13px;margin-bottom:12px}
  .pzk-doc .fact,.pzk-doc .card,.pzk-doc .step,.pzk-doc .box,.pzk-doc .price,.pzk-doc .pull,.pzk-doc .hero,.pzk-doc .goal,.pzk-doc .rows,.pzk-doc .closing{break-inside:avoid}
  .pzk-doc .fact p,.pzk-doc .step p,.pzk-doc .box p{font-size:12px}
  .pzk-doc .pull p{font-size:13px}
  .pzk-doc .hero{padding:16px 18px;box-shadow:none}
  .pzk-doc .hero h3{font-size:18px}
  .pzk-doc .hero p{font-size:12.5px}
  .pzk-doc .chips li{font-size:11.5px;padding:4px 10px}
  .pzk-doc .cards{grid-template-columns:1fr 1fr;gap:9px}
  .pzk-doc .card{padding:12px 14px}
  .pzk-doc .card h3{font-size:13.5px}
  .pzk-doc .card p{font-size:12px}
  .pzk-doc .goal{font-size:12.5px;padding:12px 14px}
  .pzk-doc .box{box-shadow:none;padding:16px}
  .pzk-doc .rows{box-shadow:none;padding:6px 16px}
  .pzk-doc .rows .t,.pzk-doc .rows .w{padding:8px 0;font-size:12px}
  .pzk-doc .step{padding:12px}
  .pzk-doc .price{box-shadow:none;padding:18px}
  .pzk-doc .price .big{font-size:36px}
  .pzk-doc .price td{font-size:12.5px;padding:6px 0}
  .pzk-doc .opt{font-size:12px;padding:9px 12px}
  .pzk-doc .closing{padding:20px 22px;margin-top:22px}
  .pzk-doc .closing h2{font-size:21px}
  .pzk-doc .closing p{font-size:13px}
  .pzk-doc .closing .ctas{display:none}
  .pzk-doc .fact,.pzk-doc .byline .pill,.pzk-doc .chips li,.pzk-doc .goal,.pzk-doc .opt,.pzk-doc .hero .tag,.pzk-doc .closing,.pzk-doc .step{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* A4 е под 760px — връщаме колоните, които мобилният изглед сгъва */
  .pzk-doc .facts{grid-template-columns:1fr 1fr}
  .pzk-doc .steps{grid-template-columns:1fr 1fr}
  .pzk-doc .two,.pzk-doc .price{grid-template-columns:1fr 1fr}
  .pzk-doc .rows{grid-template-columns:auto 1fr}
  .pzk-doc .rows .t,.pzk-doc .rows .w{border-top:1px dashed var(--rule)}
  .pzk-doc .rows .t:first-child,.pzk-doc .rows .t:first-child+.w{border-top:0}
  .pzk-doc .rows .t{max-width:16ch}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

export default function PetarOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">AI програма за новия бизнес · 4 месеца</p>
        <h1>
          Бизнес, който работи <em>и когато не си там</em>
        </h1>
        <p className="deck">
          Искаш да се върнеш в Благоевград и да отвориш кафене със закуски и доставка — със
          системата, която върти работата вместо теб. Четири месеца, в които я изграждаме заедно,
          а ти се учиш да я управляваш.
        </p>
        <p className="byline">
          <span className="pill">4 месеца · 1 800 € без ДДС</span>
          <span>За Петър Зинков · от Ивайло Петев, Pro Marketing</span>
          <span className="num">13.10.2026</span>
          <a className="pdf" href={PDF}>Свали като PDF</a>
        </p>
      </header>

      <section>
        <p className="kick">Откъде тръгваме</p>
        <h2 className="h2sub">Това, което ми разказа на срещата</h2>
        <div className="facts">
          <article className="fact"><h3>Имотът в Благоевград</h3><p>60 кв.м, който ще стане кафене и закусвалня с доставка на храна.</p></article>
          <article className="fact"><h3>Пазарът има място</h3><p>Местните доставки са с недобро качество и дълго чакане — тук се печели с по-добра услуга.</p></article>
          <article className="fact"><h3>Ти си далеч</h3><p>Следиш ремонта от Германия. Затова системата трябва да върви почти сама.</p></article>
          <article className="fact"><h3>Искаш баланс</h3><p>Повече време за семейството и работа, която ти дава свобода, а не те изтощава.</p></article>
        </div>
        <div className="pull">
          <p>Идеята ти е бизнес, който не те връзва за мястото — а ти оставя време за най-важното.</p>
          <span className="src">Точно това изграждаме: система, която поема рекламата, поръчките и клиентите.</span>
        </div>
      </section>

      <section className="sec-build">
        <p className="kick">Какво изграждаме</p>
        <h2 className="h2sub">Цялата система за бизнеса</h2>
        <div className="cards">
          <article className="card"><span className="n">01</span><h3>Уебсайт</h3><p>Сайтът на заведението — меню, снимки, контакти, готов да приема клиенти.</p></article>
          <article className="card"><span className="n">02</span><h3>CRM система</h3><p>Клиентите, поръчките и разговорите на едно място, с автоматични напомняния.</p></article>
          <article className="card"><span className="n">03</span><h3>Приложение за поръчки</h3><p>Мобилно приложение, през което клиентите поръчват храна за доставка.</p></article>
          <article className="card"><span className="n">04</span><h3>Дигитален маркетинг и AI реклами</h3><p>Реклами, които водят хора към заведението и към поръчките.</p></article>
        </div>
        <p className="goal"><b>Целта:</b> когато отвориш, системата вече да работи — клиенти, поръчки и реклама, без да стоиш над всяко нещо.</p>
      </section>

      <section>
        <p className="kick">Как работим</p>
        <h2 className="h2sub">Заедно, на твоя бизнес</h2>
        <div className="rows">
          <div className="t">Срещи</div><div className="w">Индивидуални срещи <b>1–2 пъти седмично</b>, на които строим и решаваме.</div>
          <div className="t">AI обучение</div><div className="w">Учиш се да използваш AI върху <b>собствения си бизнес</b>, не върху примери.</div>
          <div className="t">Времето</div><div className="w">Бизнесът ще отвори след ремонта — имаме време да подготвим всичко спокойно.</div>
        </div>
      </section>

      <section className="sec-price">
        <p className="kick">Условията</p>
        <h2 className="h2sub">Цената, както ти я казах</h2>
        <div className="price">
          <div>
            <p className="big num">1 800 €<small>без ДДС</small></p>
            <p className="sub">4 месеца · сайт, CRM, приложение, реклами, срещи и обучение</p>
            <p className="opt"><b>Плащането:</b> 50 % при старта на маркетинга и автоматизациите, остатъкът след това.</p>
            <p className="opt hl"><b>Фиксираш цената с 100 €.</b> Невъзстановим депозит, който запазва 1 800 € — по-нататък цената се вдига. Депозитът ти дава и достъп до първите AI материали.</p>
          </div>
          <div>
            <h3>Какво влиза</h3>
            <table>
              <tbody>
                <tr><td>Уебсайт</td><td className="v">включен</td></tr>
                <tr><td>CRM система</td><td className="v">включена</td></tr>
                <tr><td>Мобилно приложение за поръчки</td><td className="v">включено</td></tr>
                <tr><td>Дигитален маркетинг и AI реклами</td><td className="v">включени</td></tr>
                <tr><td>Срещи с мен</td><td className="v">1–2 седмично</td></tr>
                <tr><td>AI обучение</td><td className="v">включено</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>Обсъди го спокойно със семейството. Ако решиш да фиксираш цената, пишеш ми и уреждаме 100 €.</p>
        <p>Чуваме се във вторник, 20 октомври.</p>
        <p className="ctas">
          <a className="btn" href="mailto:emmgivailopetev38@gmail.com?subject=%D0%9F%D1%80%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%B0%D1%82%D0%B0">Пиши ми</a>
          <a className="btn" href="tel:+359877399963">0877 399 963</a>
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
