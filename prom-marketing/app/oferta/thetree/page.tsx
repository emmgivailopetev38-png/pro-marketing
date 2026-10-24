/**
 * Оферта за The Tree (@thetreebg) — чайна в Мол Марково тепе, Пловдив (бул. Руски 54):
 * матча, кафе, брънч, мед, чай и сладко; кетъринг и рождени дни в мола.
 *
 * 16.10.2026: Ивайло си взе кафе от чайната и говори на място със собственичката; страницата
 * го последва в Instagram. Профилът към 16.10: 221 публикации, 176 последователи.
 *
 * Цената е казана от Ивайло: 300 € без ДДС на месец (360 € с ДДС), месечно по фактура —
 * за 3 видеа на ден за нейната страница. Число за гледания НЕ обещаваме.
 *
 * Числата за нашите профили са проверени на 16.10.2026:
 *   Facebook страницата — Graph API (fb-pregled.mjs 30): 54 314 гледания на 43 видеа за 30 дни,
 *     най-силното 8 106 (15.10), видео от 10.10 — 770;
 *   Instagram @ivailopetev28 — сборът под 108-те рийла: 54 516 гледания, 729 последователи;
 *   YouTube @promarketingbg — 20 302 гледания, 163 видеа;
 *   TikTok @petevv — 2 084 последователи.
 *
 * Обръщението е на „ти“ — така се говорихме на място.
 */

const PDF = "/oferta/thetree/ProMarketing-za-The-Tree.pdf";

const CSS = `
/* сайтът е тъмен (color-scheme: dark в globals.css) — тази страница е светла докрай,
   иначе в PDF-а полетата на листа излизат тъмни */
html:has(.tt-doc),body:has(.tt-doc){background:#F7F5EE;color-scheme:light}
.tt-doc{
  --ground:#F7F5EE; --panel:#EBEFE0; --surface:#FFFFFF;
  --ink:#1E2419; --ink-2:#4A5243; --ink-3:#7C8475;
  --rule:#DCE1D0; --rule-soft:#E9ECDF;
  --accent:#2F5A35; --accent-soft:#E3ECD9; --matcha:#5F8131;
  --honey:#9A620F;
  --shadow:0 1px 2px rgba(30,36,25,.05), 0 10px 28px -18px rgba(30,60,30,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--tt-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.tt-doc *{box-sizing:border-box}
.tt-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.tt-doc h1,.tt-doc h2{font-family:var(--tt-body),Georgia,serif;font-weight:600;letter-spacing:-.012em;text-wrap:balance}
.tt-doc h3{font-family:var(--tt-ui),Arial,sans-serif;font-weight:700;letter-spacing:-.01em;text-wrap:balance}
.tt-doc .mono{font-family:var(--tt-mono),monospace;font-variant-numeric:tabular-nums}
.tt-doc a{color:var(--accent);text-underline-offset:3px}
.tt-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.tt-doc p{margin:0}

/* ── шапка ── */
.tt-doc .masthead{padding:58px 0 34px;border-bottom:1px solid var(--rule)}
.tt-doc .eyebrow{font-family:var(--tt-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--matcha);margin:0 0 18px}
.tt-doc h1{font-size:46px;line-height:1.1;margin:0 0 18px;max-width:22ch}
.tt-doc h1 em{font-style:italic;color:var(--accent)}
.tt-doc .deck{font-size:19px;line-height:1.56;color:var(--ink-2);max-width:60ch;margin:0 0 22px}
.tt-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-family:var(--tt-ui),sans-serif;font-size:14px;color:var(--ink-3)}
.tt-doc .byline .pill{font-family:var(--tt-mono),monospace;font-weight:500;font-size:14px;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:6px 14px}
.tt-doc .byline a{font-weight:600}

/* ── секции ── */
.tt-doc section{margin:52px 0 0}
.tt-doc .kick{font-family:var(--tt-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--matcha);margin:0 0 10px}
.tt-doc .h2sub{font-size:30px;line-height:1.2;margin:0 0 14px;max-width:30ch}
.tt-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.tt-doc .note{font-size:13.5px;color:var(--ink-3);margin:10px 0 0}

/* ── къде си сега ── */
.tt-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:0 0 20px}
.tt-doc .fact{background:var(--panel);border-radius:12px;padding:18px 20px}
.tt-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.tt-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.tt-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px}
.tt-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}

/* ── какво включва месецът ── */
.tt-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.tt-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px 22px 20px;box-shadow:var(--shadow)}
.tt-doc .card .num{font-family:var(--tt-mono),monospace;font-size:12px;color:var(--matcha);letter-spacing:.12em;display:block;margin:0 0 8px}
.tt-doc .card h3{font-size:17.5px;margin:0 0 8px}
.tt-doc .card p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── нашите профили ── */
.tt-doc .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 16px}
.tt-doc .stat{background:var(--surface);border:1px solid var(--rule);border-top:3px solid var(--matcha);border-radius:12px;padding:18px 20px;box-shadow:var(--shadow)}
.tt-doc .stat .net{font-family:var(--tt-ui),sans-serif;font-weight:600;font-size:13px;color:var(--ink-3);margin:0 0 6px}
.tt-doc .stat .n{font-family:var(--tt-ui),sans-serif;font-weight:700;font-size:32px;line-height:1.05;color:var(--accent);margin:0 0 4px;font-variant-numeric:tabular-nums}
.tt-doc .stat .what{font-size:14px;line-height:1.5;color:var(--ink-2);margin:0 0 10px}
.tt-doc .stat a{font-family:var(--tt-ui),sans-serif;font-weight:600;font-size:14px}
.tt-doc .total{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px;background:var(--accent-soft);border-radius:12px;padding:16px 22px;margin:0 0 14px}
.tt-doc .total b{font-family:var(--tt-ui),sans-serif;font-size:28px;color:var(--accent);font-variant-numeric:tabular-nums}
.tt-doc .total span{font-size:15.5px;color:var(--ink-2)}

/* ── редове: не е включено ── */
.tt-doc .rows{display:grid;grid-template-columns:auto 1fr;gap:0 18px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.tt-doc .rows .t{font-family:var(--tt-ui),sans-serif;font-weight:600;font-size:14.5px;color:var(--ink);padding:14px 0;border-top:1px dashed var(--rule);max-width:19ch}
.tt-doc .rows .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule)}
.tt-doc .rows .t:first-child,.tt-doc .rows .t:first-child+.w{border-top:0}
.tt-doc .rows .w b{color:var(--ink);font-weight:600}

/* ── цената ── */
.tt-doc .price{display:grid;grid-template-columns:1fr 1.05fr;gap:24px;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:28px;box-shadow:var(--shadow)}
.tt-doc .price .big{font-family:var(--tt-ui),sans-serif;font-weight:700;font-size:48px;line-height:1;margin:0 0 6px;color:var(--accent)}
.tt-doc .price .big small{font-size:18px;font-weight:600;color:var(--ink-3);margin-left:8px;white-space:nowrap;display:inline-block}
.tt-doc .price .sub{font-family:var(--tt-mono),monospace;font-size:13px;color:var(--ink-3);margin:0 0 18px}
.tt-doc .price h3{font-size:15px;margin:0 0 8px}
.tt-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.tt-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.tt-doc .price td.v{font-family:var(--tt-mono),monospace;color:var(--ink);text-align:right;white-space:nowrap;padding-left:14px}
.tt-doc .price tr:first-child td{border-top:0}
.tt-doc .price tr.sum td{border-top:1px solid var(--rule);color:var(--ink);font-weight:600}
.tt-doc .list{margin:0 0 16px;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px}
.tt-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15px;line-height:1.5;color:var(--ink-2)}
.tt-doc .list li i{font-style:normal;color:var(--accent);font-weight:700}
.tt-doc .budget{background:var(--panel);border-radius:12px;padding:14px 16px}
.tt-doc .budget h3{color:var(--accent);margin:0 0 4px}
.tt-doc .budget p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── следващата стъпка ── */
.tt-doc .closing{background:var(--accent-soft);border:1px solid #CFDDC1;border-left:4px solid var(--accent);border-radius:16px;padding:30px 32px 28px;margin-top:52px}
.tt-doc .closing h2{color:var(--accent);font-size:28px;margin:0 0 10px}
.tt-doc .closing p{font-size:17px;line-height:1.6;color:var(--ink);max-width:62ch}
.tt-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.tt-doc .closing a.btn{font-family:var(--tt-ui),sans-serif;font-weight:600;text-decoration:none;color:#fff;background:var(--accent);border-radius:10px;padding:12px 18px;font-size:15px}
.tt-doc .closing a.ghost{color:var(--accent);background:transparent;border:1px solid var(--accent)}
.tt-doc .sig{break-inside:avoid;margin:26px 0 0;font-family:var(--tt-ui),sans-serif;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.tt-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .tt-doc .wrap{padding:0 16px 72px}
  .tt-doc h1{font-size:33px}
  .tt-doc .h2sub{font-size:24px}
  .tt-doc .deck{font-size:17.5px}
  .tt-doc .price{grid-template-columns:1fr}
  .tt-doc .cards{grid-template-columns:1fr}
  .tt-doc .masthead{padding:36px 0 26px}
  .tt-doc .price{padding:22px 18px}
  .tt-doc .closing{padding:24px 20px}
  .tt-doc .rows{grid-template-columns:1fr;padding:14px 18px}
  .tt-doc .rows .t{padding:14px 0 0;border-top:1px dashed var(--rule);max-width:none}
  .tt-doc .rows .w{padding:4px 0 14px;border-top:0}
  .tt-doc .rows .t:first-child{border-top:0}
}
@media print{
  :root,html,body{color-scheme:light;background:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .tt-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .tt-doc .wrap{max-width:none;padding:0}
  .tt-doc .masthead{padding:0 0 16px}
  .tt-doc h1{font-size:30px;margin-bottom:12px}
  .tt-doc .deck{font-size:14px}
  .tt-doc .byline .pdf{display:none}
  .tt-doc section{margin:18px 0 0;break-inside:avoid}
  .tt-doc h1,.tt-doc .deck,.tt-doc .h2sub,.tt-doc .lead{max-width:none}
  .tt-doc .kick,.tt-doc .h2sub,.tt-doc .lead{break-after:avoid}
  .tt-doc .h2sub{font-size:19px;margin-bottom:8px}
  .tt-doc .lead{font-size:12.5px;margin-bottom:10px}
  .tt-doc .fact,.tt-doc .card,.tt-doc .stat,.tt-doc .price,.tt-doc .pull,.tt-doc .rows,.tt-doc .budget,.tt-doc .total{break-inside:avoid}
  .tt-doc .fact p{font-size:12px}
  .tt-doc .pull p{font-size:13px}
  .tt-doc .cards{grid-template-columns:repeat(3,1fr);gap:10px}
  .tt-doc .card{padding:12px 14px;box-shadow:none}
  .tt-doc .card .num{margin-bottom:4px}
  .tt-doc .card h3{font-size:13.5px;margin-bottom:5px}
  .tt-doc .card p{font-size:11.5px;line-height:1.48}
  .tt-doc .stats{grid-template-columns:repeat(4,1fr);gap:10px}
  .tt-doc .stat{padding:12px 14px;box-shadow:none}
  .tt-doc .stat .n{font-size:22px}
  .tt-doc .stat .what{font-size:11.5px}
  .tt-doc .stat a{font-size:11px}
  .tt-doc .total{padding:10px 16px}
  .tt-doc .total b{font-size:20px}
  .tt-doc .total span{font-size:12.5px}
  .tt-doc .rows{box-shadow:none}
  .tt-doc .rows .t,.tt-doc .rows .w{padding:6px 0;font-size:11.5px}
  .tt-doc .list li{font-size:12.5px}
  .tt-doc .price{box-shadow:none;padding:16px 18px}
  .tt-doc .price .big{font-size:36px}
  .tt-doc .price td{font-size:12px;padding:5px 0}
  .tt-doc .budget p{font-size:12.5px}
  .tt-doc .closing{padding:16px 20px;margin-top:18px;break-inside:avoid}
  .tt-doc .closing h2{font-size:20px}
  .tt-doc .closing p{font-size:13.5px}
  .tt-doc .closing .ctas{display:none}
  .tt-doc .fact,.tt-doc .budget,.tt-doc .closing,.tt-doc .byline .pill,.tt-doc .stat,.tt-doc .total{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* A4 е под 760px — връщаме двете колони, които мобилният изглед сгъва */
  .tt-doc .facts{grid-template-columns:repeat(4,1fr)}
  .tt-doc .price{grid-template-columns:1fr 1fr}
  .tt-doc .rows{grid-template-columns:auto 1fr;padding:6px 16px}
  .tt-doc .rows .t,.tt-doc .rows .w{border-top:1px dashed var(--rule)}
  .tt-doc .rows .t:first-child,.tt-doc .rows .t:first-child+.w{border-top:0}
  .tt-doc .rows .t{max-width:19ch}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const FAKTI = [
  {
    h: "Чайна в Мол Марково тепе",
    p: "Матча, кафе, брънч, мед, чай и сладко — на бул. Руски 54 в Пловдив.",
  },
  {
    h: "221 публикации",
    p: "Хубави снимки вече има. Мрежите обаче днес показват най-много кратките видеа.",
  },
  {
    h: "176 последователи",
    p: "Хората, които минават през мола всеки ден, са много повече. Видеото ги довежда до профила.",
  },
  {
    h: "Поводи всеки ден",
    p: "Кетъринг, рождени дни в мола, Halloween, игри с награди — готови теми за видео.",
  },
];

const MESEC = [
  {
    n: "01",
    title: "3 видеа на ден",
    body: "Кратки вертикални видеа за Instagram и Facebook — около 90 на месец. Матчата, кафето, брънчът, атмосферата.",
  },
  {
    n: "02",
    title: "От твоите кадри",
    body: "Пращаш ни снимки и кратки клипове от телефона, когато ти е удобно. Монтажът, надписите и музиката са наши.",
  },
  {
    n: "03",
    title: "Текст, обложка, хаштагове",
    body: "Всяко видео излиза с описание, хаштагове и обложка, която се чете и на малък екран.",
  },
  {
    n: "04",
    title: "Публикуваме ние",
    body: "По график, в часовете, в които хората гледат. Ти не мислиш кога и какво да качиш.",
  },
  {
    n: "05",
    title: "Първите видеа — с твоето „да“",
    body: "В началото ти показваме видеата, преди да излязат. После караме в стила, който ти харесва.",
  },
  {
    n: "06",
    title: "Отчет всеки месец",
    body: "Гледания, нови последователи и кои видеа вървят най-добре. Виждаш растежа с числа.",
  },
];

const PROFILI = [
  {
    net: "Facebook · Pro Marketing LTD",
    n: "54 314",
    what: "гледания за последните 30 дни. Най-силното видео — 8 106 гледания.",
    href: "https://www.facebook.com/profile.php?id=106080979260944",
    link: "Виж страницата",
  },
  {
    net: "Instagram · @ivailopetev28",
    n: "54 516",
    what: "гледания на 108 видеа · 729 последователи.",
    href: "https://www.instagram.com/ivailopetev28/",
    link: "Виж профила",
  },
  {
    net: "YouTube · @promarketingbg",
    n: "20 302",
    what: "гледания на 163 видеа.",
    href: "https://www.youtube.com/@promarketingbg",
    link: "Виж канала",
  },
  {
    net: "TikTok · @petevv",
    n: "2 084",
    what: "последователи.",
    href: "https://www.tiktok.com/@petevv",
    link: "Виж профила",
  },
];

const NE_E = [
  {
    t: "Платена реклама",
    w: "Не е в цената. Ако поискаш реклама за кетъринг или рождени дни, <b>говорим отделно</b>.",
  },
  {
    t: "Снимане на място",
    w: "Не идваме да снимаме всеки ден. Работим с <b>твоите кадри</b> от телефона.",
  },
];

const V_CENATA = [
  "3 видеа на ден за Instagram и Facebook",
  "Монтаж, надписи и музика",
  "Описание, хаштагове и обложка",
  "Публикуване по график",
  "Месечен отчет",
];

export default function TheTreeOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">The Tree · Мол Марково тепе · 16.10.2026</p>
        <h1>
          3 видеа на ден за The Tree. <em>Чайната, която се вижда всеки ден.</em>
        </h1>
        <p className="deck">
          Ти правиш матчата и кафето. Ние правим видеата — всеки ден по три, в Instagram и
          Facebook.
        </p>
        <p className="byline">
          <span className="pill">300 € без ДДС на месец</span>
          <span>За The Tree · от Ивайло Петев, Pro Marketing</span>
          <a className="pdf" href={PDF}>
            Свали като PDF
          </a>
        </p>
      </header>

      <section>
        <p className="kick">Къде си сега</p>
        <h2 className="h2sub">Хубаво място, което заслужава повече очи</h2>
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
            Липсва само ритъмът: кратко видео всеки ден, по няколко пъти. Така хората от мола
            виждат The Tree и в телефона — и идват пак.
          </p>
        </div>
      </section>

      <section>
        <p className="kick">Какво включва месецът</p>
        <h2 className="h2sub">Ти пращаш кадрите. Ние правим останалото.</h2>
        <div className="cards">
          {MESEC.map((k) => (
            <article className="card" key={k.n}>
              <span className="num">{k.n}</span>
              <h3>{k.title}</h3>
              <p>{k.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Как се справяме</p>
        <h2 className="h2sub">Правим същото за себе си всеки ден</h2>
        <p className="lead">
          Разгледай нашите страници — там се вижда какво носи постоянството. Числата са от 16
          октомври 2026.
        </p>
        <div className="total">
          <b>близо 130 000</b>
          <span>гледания във Facebook (за 30 дни), Instagram и YouTube</span>
        </div>
        <div className="stats">
          {PROFILI.map((p) => (
            <article className="stat" key={p.net}>
              <p className="net">{p.net}</p>
              <p className="n">{p.n}</p>
              <p className="what">{p.what}</p>
              <a href={p.href} target="_blank" rel="noopener noreferrer">
                {p.link}
              </a>
            </article>
          ))}
        </div>
        <div className="pull">
          <p>
            Видео от 10 октомври — 770 гледания. Видео от 15 октомври — 8 106. Страницата расте,
            откакто пускаме видео всеки ден, без пропуск.
          </p>
        </div>
        <p className="note">
          Брой гледания не обещаваме предварително — зависи от кадрите и от мрежата. Обещаваме
          ритъма: 3 видеа всеки ден и отчет с числата.
        </p>
      </section>

      <section>
        <p className="kick">Какво не е включено</p>
        <h2 className="h2sub">За да е ясно отсега</h2>
        <div className="rows">
          {NE_E.map((r) => (
            <div style={{ display: "contents" }} key={r.t}>
              <div className="t">{r.t}</div>
              <div className="w" dangerouslySetInnerHTML={{ __html: r.w }} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="kick">Цената</p>
        <h2 className="h2sub">Една месечна сума, ясна от първия ден</h2>
        <div className="price">
          <div>
            <p className="big">
              300 €<small>без ДДС на месец</small>
            </p>
            <p className="sub">плаща се месечно, по фактура</p>
            <table>
              <tbody>
                <tr>
                  <td>Месечно, без ДДС</td>
                  <td className="v">300 €</td>
                </tr>
                <tr>
                  <td>ДДС 20%</td>
                  <td className="v">60 €</td>
                </tr>
                <tr className="sum">
                  <td>Месечно, с ДДС</td>
                  <td className="v">360 €</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3>Какво влиза в сумата</h3>
            <ul className="list">
              {V_CENATA.map((a) => (
                <li key={a}>
                  <i>✓</i>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            <div className="budget">
              <h3>Около 4 € на видео</h3>
              <p>360 € с ДДС за около 90 видеа на месец — по три всеки ден.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Кажи „да“ и ни дай достъп до страницата — с покана през Meta Business Suite, без
          пароли. Първите видеа тръгват още първата седмица.
        </p>
        <p className="ctas">
          <a className="btn" href="https://ig.me/m/ivailopetev28">
            Пиши ми в Instagram
          </a>
          <a className="btn ghost" href="tel:+359877399963">
            0877 399 963
          </a>
        </p>
      </section>

      <p className="sig">
        <b>Ивайло Петев</b> · Pro Marketing
        <br />
        0877 399 963 · emmgivailopetev38@gmail.com · promarketing.pw · petevai.com
      </p>
    </main>
  );
}
