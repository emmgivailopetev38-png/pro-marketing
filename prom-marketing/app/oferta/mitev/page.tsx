/**
 * AI гласов агент за потвърждаване на поръчки — Митев Трейдинг ООД (mitevbg.com, CloudCart).
 * Среща с Росица Митева 14.10.2026 (Fathom 192552164, „Impromptu Google Meet“). Казано на срещата:
 * 12 000+ артикула, 40–50 поръчки на ден (~1 000 на месец), всяка се потвърждава по телефона след
 * проверка на наличността от служител; агентът — само за маркираните поръчки, корекции в CloudCart
 * през API ключ, 10 % за лоялни клиенти по историята; изработка 600 € (ДДС не е ясно казан — 19:27),
 * разговорите директно към доставчика, ориентир 0,15 €/мин; поддръжката — след теста.
 * Решават трима съдружници. Следващо чуване: понеделник 19.10.
 */

const PDF = "/oferta/mitev/ProMarketing-za-Mitev.pdf";

const CSS = `
.mtv-doc{
  --ground:#F7F8F5; --panel:#ECF2EE; --surface:#FFFFFF;
  --ink:#17201C; --ink-2:#47544E; --ink-3:#7B8781;
  --rule:#DCE4DF; --rule-soft:#EAF0EC;
  --accent:#1F5C4A; --accent-soft:#E6F1EB; --accent-line:#BCD8CB;
  --warm:#9A6A1C; --warm-soft:#F8F0E0;
  --shadow:0 1px 2px rgba(23,32,28,.05), 0 12px 30px -20px rgba(23,32,28,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--mtv-ui),Arial,sans-serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.mtv-doc *{box-sizing:border-box}
.mtv-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.mtv-doc h1,.mtv-doc h2{font-family:var(--mtv-display),Georgia,serif;font-weight:600;letter-spacing:-.01em;text-wrap:balance}
.mtv-doc h3{font-family:var(--mtv-ui),Arial,sans-serif;font-weight:600;letter-spacing:-.01em}
.mtv-doc .num{font-variant-numeric:tabular-nums}
.mtv-doc a{color:var(--accent);text-underline-offset:3px}
.mtv-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.mtv-doc p{margin:0}

/* ── шапка ── */
.mtv-doc .masthead{padding:60px 0 36px;border-bottom:1px solid var(--rule)}
.mtv-doc .eyebrow{font-weight:600;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.mtv-doc h1{font-size:48px;line-height:1.08;margin:0 0 20px;max-width:20ch}
.mtv-doc h1 em{font-style:italic;color:var(--accent)}
.mtv-doc .deck{font-size:19px;line-height:1.58;color:var(--ink-2);max-width:62ch;margin:0 0 24px}
.mtv-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-size:14px;color:var(--ink-3)}
.mtv-doc .byline .pill{font-weight:600;font-size:14px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:999px;padding:6px 14px}
.mtv-doc .byline a{font-weight:600}

/* ── секции ── */
.mtv-doc section{margin:56px 0 0}
.mtv-doc .kick{font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--warm);margin:0 0 10px}
.mtv-doc .h2sub{font-size:31px;line-height:1.18;margin:0 0 14px;max-width:26ch}
.mtv-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.mtv-doc .note{font-size:14px;color:var(--ink-3);margin:12px 0 0;max-width:70ch}

/* ── откъде тръгваме ── */
.mtv-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 20px}
.mtv-doc .fact{background:var(--panel);border-radius:14px;padding:18px 20px}
.mtv-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.mtv-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.mtv-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 14px 14px 0;padding:18px 22px;box-shadow:var(--shadow)}
.mtv-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.mtv-doc .pull .src{display:block;margin-top:8px;font-size:13.5px;color:var(--ink-3)}

/* ── какво изграждаме ── */
.mtv-doc .hero{background:var(--surface);border:1px solid var(--accent-line);border-radius:18px;padding:26px 26px 24px;box-shadow:var(--shadow);margin:0 0 14px}
.mtv-doc .hero .tag{display:inline-block;font-weight:600;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:4px 12px;margin:0 0 12px}
.mtv-doc .hero h3{font-family:var(--mtv-display),Georgia,serif;font-size:26px;line-height:1.2;margin:0 0 10px}
.mtv-doc .hero p{font-size:16px;line-height:1.6;color:var(--ink-2);max-width:68ch}
.mtv-doc .chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;padding:0;list-style:none}
.mtv-doc .chips li{font-size:14px;font-weight:500;color:var(--ink);background:var(--panel);border-radius:999px;padding:6px 13px}
.mtv-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.mtv-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:20px 20px 18px}
.mtv-doc .card .n{font-weight:600;font-size:12px;color:var(--warm);letter-spacing:.12em;display:block;margin:0 0 8px}
.mtv-doc .card h3{font-size:16.5px;margin:0 0 7px}
.mtv-doc .card p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.mtv-doc .goal{margin:14px 0 0;padding:16px 20px;border-radius:14px;background:var(--warm-soft);font-size:16px;line-height:1.55;color:var(--ink)}
.mtv-doc .goal b{color:var(--warm);font-weight:600}

/* ── какво видя ── */
.mtv-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mtv-doc .box{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px;box-shadow:var(--shadow)}
.mtv-doc .box h3{font-size:16.5px;margin:0 0 8px}
.mtv-doc .box p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── как работим ── */
.mtv-doc .rows{display:grid;grid-template-columns:auto 1fr;gap:0 20px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.mtv-doc .rows .t{font-weight:600;font-size:14.5px;color:var(--accent);padding:14px 0;border-top:1px dashed var(--rule);max-width:16ch}
.mtv-doc .rows .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule)}
.mtv-doc .rows .t:first-child,.mtv-doc .rows .t:first-child+.w{border-top:0}
.mtv-doc .rows .w b{color:var(--ink);font-weight:600}

/* ── трите месеца ── */
.mtv-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.mtv-doc .step{background:var(--surface);border:1px solid var(--rule);border-top:3px solid var(--accent);border-radius:12px;padding:20px}
.mtv-doc .step .d{font-weight:600;font-size:12px;letter-spacing:.12em;color:var(--warm);text-transform:uppercase;display:block;margin:0 0 7px}
.mtv-doc .step h3{font-size:16.5px;margin:0 0 7px}
.mtv-doc .step p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── цената ── */
.mtv-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:28px;box-shadow:var(--shadow)}
.mtv-doc .price .big{font-family:var(--mtv-display),Georgia,serif;font-weight:700;font-size:50px;line-height:1;margin:0 0 8px;color:var(--ink)}
.mtv-doc .price .big small{font-family:var(--mtv-ui),Arial,sans-serif;font-size:18px;font-weight:500;color:var(--ink-3);margin-left:10px;white-space:nowrap;display:inline-block}
.mtv-doc .price .sub{font-size:14px;color:var(--ink-3);margin:0 0 16px}
.mtv-doc .price h3{font-size:15px;margin:0 0 8px}
.mtv-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.mtv-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.mtv-doc .price td.v{color:var(--ink);font-weight:500;text-align:right;white-space:nowrap;padding-left:14px}
.mtv-doc .price tr:first-child td{border-top:0}
.mtv-doc .opt{margin:12px 0 0;padding:12px 14px;border-radius:12px;background:var(--panel);font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.mtv-doc .opt b{color:var(--ink);font-weight:600}
.mtv-doc .opt.hl{background:var(--accent-soft)}
.mtv-doc .opt.hl b{color:var(--accent)}

/* ── следващата стъпка ── */
.mtv-doc .closing{background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:18px;padding:32px 32px 28px;margin-top:56px}
.mtv-doc .closing h2{font-size:29px;margin:0 0 10px;color:var(--ink)}
.mtv-doc .closing p{font-size:16.5px;line-height:1.6;color:var(--ink-2);max-width:62ch}
.mtv-doc .closing p + p{margin-top:10px}
.mtv-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.mtv-doc .closing a.btn{font-weight:600;text-decoration:none;color:var(--accent);background:var(--surface);border:1px solid var(--accent-line);border-radius:12px;padding:12px 18px;font-size:15px}
.mtv-doc .sig{break-inside:avoid;margin:26px 0 0;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.mtv-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .mtv-doc{font-size:16.5px}
  .mtv-doc .wrap{padding:0 18px 72px}
  .mtv-doc h1{font-size:34px}
  .mtv-doc .deck{font-size:17.5px}
  .mtv-doc .h2sub{font-size:25px}
  .mtv-doc .masthead{padding:38px 0 28px}
  .mtv-doc section{margin:44px 0 0}
  .mtv-doc .hero{padding:22px 20px 20px}
  .mtv-doc .hero h3{font-size:22px}
  .mtv-doc .two,.mtv-doc .price{grid-template-columns:1fr}
  .mtv-doc .price{padding:22px 20px}
  .mtv-doc .price .big{font-size:42px}
  .mtv-doc .rows{grid-template-columns:1fr;padding:14px 20px}
  .mtv-doc .rows .t{padding:14px 0 0;border-top:1px dashed var(--rule);max-width:none}
  .mtv-doc .rows .w{padding:4px 0 14px;border-top:0}
  .mtv-doc .rows .t:first-child{border-top:0}
  .mtv-doc .closing{padding:24px 20px 22px}
}
@media print{
  html,body{background:#fff}
  .mtv-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .mtv-doc .wrap{max-width:none;padding:0}
  .mtv-doc .masthead{padding:0 0 16px}
  .mtv-doc h1{font-size:30px;margin-bottom:12px}
  .mtv-doc .deck{font-size:14px;margin-bottom:14px}
  .mtv-doc .byline .pdf{display:none}
  .mtv-doc section{margin:22px 0 0}
  .mtv-doc section.sec-build{break-before:page}
  .mtv-doc section.sec-price{break-before:page}
  .mtv-doc .kick,.mtv-doc .h2sub,.mtv-doc .lead{break-after:avoid}
  .mtv-doc .h2sub{font-size:20px;margin-bottom:10px}
  .mtv-doc .lead{font-size:13px;margin-bottom:12px}
  .mtv-doc .fact,.mtv-doc .card,.mtv-doc .step,.mtv-doc .box,.mtv-doc .price,.mtv-doc .pull,.mtv-doc .hero,.mtv-doc .goal,.mtv-doc .rows,.mtv-doc .closing{break-inside:avoid}
  .mtv-doc .fact p,.mtv-doc .step p,.mtv-doc .box p{font-size:12px}
  .mtv-doc .pull p{font-size:13px}
  .mtv-doc .hero{padding:16px 18px;box-shadow:none}
  .mtv-doc .hero h3{font-size:18px}
  .mtv-doc .hero p{font-size:12.5px}
  .mtv-doc .chips li{font-size:11.5px;padding:4px 10px}
  .mtv-doc .cards{grid-template-columns:1fr 1fr;gap:9px}
  .mtv-doc .card{padding:12px 14px}
  .mtv-doc .card h3{font-size:13.5px}
  .mtv-doc .card p{font-size:12px}
  .mtv-doc .goal{font-size:12.5px;padding:12px 14px}
  .mtv-doc .box{box-shadow:none;padding:16px}
  .mtv-doc .rows{box-shadow:none;padding:6px 16px}
  .mtv-doc .rows .t,.mtv-doc .rows .w{padding:8px 0;font-size:12px}
  .mtv-doc .step{padding:12px}
  .mtv-doc .price{box-shadow:none;padding:18px}
  .mtv-doc .price .big{font-size:36px}
  .mtv-doc .price td{font-size:12.5px;padding:6px 0}
  .mtv-doc .opt{font-size:12px;padding:9px 12px}
  .mtv-doc .closing{padding:20px 22px;margin-top:22px}
  .mtv-doc .closing h2{font-size:21px}
  .mtv-doc .closing p{font-size:13px}
  .mtv-doc .closing .ctas{display:none}
  .mtv-doc .fact,.mtv-doc .byline .pill,.mtv-doc .chips li,.mtv-doc .goal,.mtv-doc .opt,.mtv-doc .hero .tag,.mtv-doc .closing,.mtv-doc .step{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* A4 е под 760px — връщаме колоните, които мобилният изглед сгъва */
  .mtv-doc .facts{grid-template-columns:1fr 1fr}
  .mtv-doc .steps{grid-template-columns:1fr 1fr}
  .mtv-doc .two,.mtv-doc .price{grid-template-columns:1fr 1fr}
  .mtv-doc .rows{grid-template-columns:auto 1fr}
  .mtv-doc .rows .t,.mtv-doc .rows .w{border-top:1px dashed var(--rule)}
  .mtv-doc .rows .t:first-child,.mtv-doc .rows .t:first-child+.w{border-top:0}
  .mtv-doc .rows .t{max-width:16ch}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}

/* ── чуйте го на живо ── */
.mtv-doc .tryit{background:linear-gradient(180deg,#1F5C4A,#184A3C);color:#F2F8F5;border-radius:18px;padding:30px;margin:0 0 14px}
.mtv-doc .tryit h3{font-family:var(--mtv-display),Georgia,serif;color:#fff;font-size:25px;line-height:1.2;margin:0 0 10px;max-width:26ch}
.mtv-doc .tryit p{font-size:16px;line-height:1.6;color:rgba(255,255,255,.88);max-width:64ch}
.mtv-doc .tryit p+p{margin-top:11px}
.mtv-doc .tryit .phone{display:inline-block;font-size:26px;font-weight:600;letter-spacing:.02em;color:#fff;text-decoration:none;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);border-radius:12px;padding:12px 20px;margin:16px 0 12px}
.mtv-doc .tryit .warn{font-size:14.5px;line-height:1.55;color:#FAF0DC;background:rgba(255,255,255,.1);border-left:3px solid #E0B65A;border-radius:0 10px 10px 0;padding:12px 16px;margin:12px 0 0}
.mtv-doc .tryit .warn b{color:#fff;font-weight:600}
.mtv-doc .tryit .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 0}
.mtv-doc .tryit a.btn{font-weight:600;text-decoration:none;color:var(--accent);background:#fff;border-radius:10px;padding:12px 18px;font-size:15px}
.mtv-doc .say{margin:14px 0 0;padding:14px 18px;border-radius:12px;background:var(--panel);font-size:16px;line-height:1.6;color:var(--ink);font-style:italic}
@media (max-width:760px){
  .mtv-doc .tryit{padding:22px 20px}
  .mtv-doc .tryit h3{font-size:21px}
  .mtv-doc .tryit .phone{font-size:22px}
}
@media print{
  .mtv-doc .tryit{padding:18px 20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .mtv-doc .tryit h3{font-size:17px}
  .mtv-doc .tryit p{font-size:12px}
  .mtv-doc .tryit .phone{font-size:18px;padding:8px 14px;margin:10px 0 8px}
  .mtv-doc .tryit .warn{font-size:11.5px;padding:8px 12px}
  .mtv-doc .tryit .ctas{display:none}
  .mtv-doc .tryit,.mtv-doc .say{break-inside:avoid}
  .mtv-doc .say{font-size:12.5px;padding:10px 14px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .mtv-doc .cards.k3{grid-template-columns:1fr 1fr}
}
`;

export default function MitevOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">AI гласов агент · потвърждаване на поръчки</p>
        <h1>
          Всяка поръчка потвърдена — <em>без часове на телефона</em>
        </h1>
        <p className="deck">
          Днес всяка от 40–50-те поръчки на ден минава през проверка на наличността и обаждане до
          клиента. Агентът поема обажданията: потвърждава, записва корекциите направо в поръчката в
          CloudCart и дава 10 % на лоялните клиенти. Вие решавате коя поръчка е готова — той води
          разговорите.
        </p>
        <p className="byline">
          <span className="pill">Изработка · 600 € с ДДС</span>
          <span>За Росица Митева и съдружниците · Митев Трейдинг · от Ивайло Петев, Pro Marketing</span>
          <span className="num">14.10.2026</span>
          <a className="pdf" href={PDF}>Свали като PDF</a>
        </p>
      </header>

      <section>
        <p className="kick">Откъде тръгваме</p>
        <h2 className="h2sub">Това, което ми разказахте на срещата</h2>
        <div className="facts">
          <article className="fact"><h3>Над 12 000 артикула</h3><p>Магазин на CloudCart от 2019 г. Рекламата вече върви автоматично и носи добра възвръщаемост.</p></article>
          <article className="fact"><h3>40–50 поръчки на ден</h3><p>Около 1 000 на месец — а силният сезон тепърва започва.</p></article>
          <article className="fact"><h3>Всяка се потвърждава</h3><p>По телефона, задължително. Често с корекция в адреса, датата или самата поръчка — обикновено до 3 минути, понякога до 10.</p></article>
          <article className="fact"><h3>Наличността — първо от човек</h3><p>Не всичко е качено като наличност в сайта, затова поръчката първо се проверява на склад.</p></article>
        </div>
        <div className="pull">
          <p>„Най-много време губим в потвърждаването на поръчките.“</p>
          <span className="src">Росица, на срещата на 14.10 — затова започваме точно оттам.</span>
        </div>
      </section>

      <section className="sec-build">
        <p className="kick">Как работи агентът</p>
        <h2 className="h2sub">Четири стъпки — и първата остава при Вас</h2>
        <div className="cards">
          <article className="card"><span className="n">01</span><h3>Вие отбелязвате</h3><p>Вашият човек проверява наличността и маркира поръчките, готови за потвърждение. Агентът звъни само на тях.</p></article>
          <article className="card"><span className="n">02</span><h3>Агентът се обажда</h3><p>На чист български, спокойно и учтиво. Потвърждава поръчката, адреса и датата на доставка.</p></article>
          <article className="card"><span className="n">03</span><h3>Корекциите влизат сами</h3><p>Сменен адрес, дата или артикул се записват директно в поръчката в CloudCart — през API ключ от магазина.</p></article>
          <article className="card"><span className="n">04</span><h3>Лоялните получават 10 %</h3><p>Агентът вижда историята на клиента. При повторна поръчка без въведен код сам добавя отстъпката.</p></article>
        </div>
        <div className="hero" style={{ marginTop: 14 }}>
          <span className="tag">Как звучи</span>
          <h3>Като търговец, който уважава клиента си</h3>
          <p>
            Без натиск и без заучени фрази. Агентът се представя честно като AI асистент на магазина —
            това сваля напрежението, вместо да стресне човека.
          </p>
          <p className="say">
            „Здравейте, обаждам се от Митев Трейдинг. Аз съм AI асистентът на магазина — звъня да
            потвърдим поръчката Ви. Удобно ли Ви е за минутка?“
          </p>
          <ul className="chips">
            <li>Чист български</li>
            <li>Кратко и учтиво</li>
            <li>Само маркираните поръчки</li>
            <li>Всяка промяна — в CloudCart</li>
          </ul>
        </div>
        <p className="goal">
          <b>По желание:</b> едно деликатно предложение към поръчката — веднъж, учтиво, без изреждане.
          Пускаме го като тест с и без него и Вие виждате дали носи продажби, преди да остане.
        </p>
      </section>

      <section>
        <p className="kick">Примери</p>
        <h2 className="h2sub">Вижте и чуйте как работи</h2>
        <p className="lead">
          Поискахте примери, които да покажете на съдружниците. Най-силният е този, който може да
          чуете сами.
        </p>
        <div className="tryit">
          <h3>Обадете се на нашия гласов агент</h3>
          <a className="phone" href="tel:+14754269084">+1 475 426 9084</a>
          <p>
            Това е AI рецепцията на Pro Marketing. Вдига телефона и бутона в сайта ни, говори на
            български, проверява свободните часове и записва срещата в календара и в CRM системата.
            Прекъснете го, сменете темата — точно както би направил клиент.
          </p>
          <p className="warn">
            <b>Защо номерът е американски.</b> Това е демонстрационната линия. При Вас агентът звъни
            от български номер.
          </p>
          <p className="ctas">
            <a className="btn" href="https://promarketing.pw/glas">Или го пробвайте с бутон в сайта</a>
          </p>
        </div>
        <div className="cards k3">
          <article className="card"><span className="n">Онлайн магазин</span><h3>Парфюми</h3><p>Ежедневни видеа в социалните мрежи и рекламна система, която всяка сутрин сама вдига работещите реклами и спира слабите — в рамките на зададен бюджет.</p></article>
          <article className="card"><span className="n">Рециклиране на техника</span><h3>Система върху собствените им бланки</h3><p>Заявки, протоколи и автопарк на едно място, плюс AI агент, който отговаря на въпроси по реалните данни на фирмата.</p></article>
        </div>
        <p className="note">
          Имената на клиентите не ги публикуваме без тяхното съгласие — на среща с удоволствие ще Ви
          покажем системите на живо.
        </p>
      </section>

      <section className="sec-price">
        <p className="kick">Условията</p>
        <h2 className="h2sub">Цената, както я разбрахме на срещата</h2>
        <div className="price">
          <div>
            <p className="big num">600 €<small>с ДДС</small></p>
            <p className="sub">еднократно · изработка на гласовия агент</p>
            <p className="opt"><b>Какво влиза:</b> връзката с CloudCart, сценариите за потвърждение и корекции, отстъпката за лоялни клиенти и тестовете с реални поръчки.</p>
            <p className="opt hl"><b>Разговорите плащате директно на доставчика</b> — без надценка от нас. Ориентир от срещата: около 0,15 € на минута. При ~1 000 поръчки по ~2 минути това са около 300 € на месец; с по-лек модел излиза по-малко. Точната цена я замерваме в теста.</p>
          </div>
          <div>
            <h3>Какво и как се плаща</h3>
            <table>
              <tbody>
                <tr><td>Изработка на агента</td><td className="v">600 € с ДДС</td></tr>
                <tr><td>Разговори (телефония и AI)</td><td className="v">към доставчика</td></tr>
                <tr><td>Ориентир за минута</td><td className="v">~0,15 €</td></tr>
                <tr><td>Поддръжка</td><td className="v">след теста</td></tr>
                <tr><td>По-големи доработки</td><td className="v">по отделна оферта</td></tr>
              </tbody>
            </table>
            <p className="opt"><b>Поддръжката:</b> или я поемаме ние, или обучаваме Ваш човек. Цената ѝ договаряме, след като видите агента в работа.</p>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Покажете офертата на съдружниците. Ако искат да чуят всичко от първо лице, правим кратка
          онлайн среща с тримата — пускаме агента пред Вас и отговарям на всеки въпрос.
        </p>
        <p>В понеделник, 19 октомври, ще Ви се обадя да чуя какво решихте.</p>
        <p className="ctas">
          <a className="btn" href="mailto:emmgivailopetev38@gmail.com?subject=%D0%93%D0%BB%D0%B0%D1%81%D0%BE%D0%B2%D0%B8%D1%8F%D1%82%20%D0%B0%D0%B3%D0%B5%D0%BD%D1%82">Пишете ми</a>
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
