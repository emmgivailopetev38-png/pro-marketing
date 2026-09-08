/**
 * Планът за магазин „Арт Сувенири“, Бургас — Ирина.
 *
 * Как се стигна дотук: Ивайло е бил в магазина по време на почивката, видял е
 * стоката и е звъннал. Тя каза „да стартираме, защото не ни е останало време“ и
 * „зависи от вас дали ще ни улесните“. Затова страницата не пита нищо — казва
 * какво се прави, в какъв ред и какво излиза от всяка стъпка.
 *
 * Всичко в диагнозата е измерено от публичните им страници и от Google на
 * 08.09.2026, не предположено. Демото на самия магазин е отделна статична
 * страница: /oferta/art-suveniri/demo.
 *
 * Обръщението е на „Вие“ — така тръгна разговорът и писмото.
 */

const DEMO = "/oferta/art-suveniri/demo";

const CSS = `
.ars-doc{
  --limewash:#F1EBE0; --paper:#FDFBF7; --card:#FFFFFF; --ink:#1E1B16; --ink-2:#4A443A;
  --ivy:#2B4732; --ivy-deep:#16241A; --sea:#1A6474; --copper:#A05C33; --ochre:#BE862B;
  --red:#9B3327; --muted:#7C7466; --line:#E0D6C5; --line-2:#CDC0A9;
  --shadow:0 1px 2px rgba(30,27,22,.05), 0 10px 26px -16px rgba(30,27,22,.34);
  background:var(--limewash); color:var(--ink);
  font-family:var(--ars-body),"Segoe UI",system-ui,sans-serif; font-size:17px; line-height:1.68;
  -webkit-font-smoothing:antialiased;
}
.ars-doc *{box-sizing:border-box}
.ars-doc .wrap{max-width:940px;margin:0 auto;padding:0 26px}
.ars-doc h1,.ars-doc h2,.ars-doc h3,.ars-doc h4{font-family:var(--ars-display),Georgia,serif;font-weight:600;margin:0;text-wrap:balance}
.ars-doc .caps{font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;font-weight:700;color:var(--muted)}
.ars-doc .tab{font-variant-numeric:tabular-nums}
.ars-doc a{color:var(--sea)}
.ars-doc :focus-visible{outline:2px solid var(--sea);outline-offset:3px}

.ars-doc .head{background:var(--ivy);color:var(--limewash);border-bottom:5px solid var(--copper)}
.ars-doc .head-in{padding:44px 0 40px}
.ars-doc .who{font-size:11px;letter-spacing:.24em;text-transform:uppercase;opacity:.72;margin:0 0 16px}
.ars-doc .head h1{font-size:clamp(34px,5.6vw,56px);line-height:1.04;max-width:19ch}
.ars-doc .head .deck{margin:18px 0 0;max-width:56ch;font-size:18.5px;opacity:.9}
.ars-doc .head-meta{display:flex;flex-wrap:wrap;gap:14px 24px;margin-top:28px;padding-top:20px;border-top:1px solid rgba(255,255,255,.2);font-size:14px;opacity:.9;align-items:center}
.ars-doc .head-meta .demo{margin-left:auto;display:inline-flex;align-items:center;gap:8px;background:var(--copper);color:#fff;
  padding:10px 18px;border-radius:2px;text-decoration:none;font-weight:700;font-size:15px;opacity:1}
.ars-doc .head-meta .demo:hover{background:#B96E42}

.ars-doc section{padding:52px 0}
.ars-doc .sh{display:flex;gap:16px;align-items:baseline;margin-bottom:10px}
.ars-doc .sn{font-family:var(--ars-display),serif;font-size:15px;color:var(--copper);letter-spacing:.16em;flex:none;padding-top:5px}
.ars-doc h2{font-size:clamp(26px,3.8vw,38px);line-height:1.12}
.ars-doc .lede{max-width:64ch;margin:14px 0 0;font-size:18px;color:var(--ink-2)}

.ars-doc .diag{margin-top:28px;border:1px solid var(--line);background:var(--card);overflow-x:auto;box-shadow:var(--shadow)}
.ars-doc table{width:100%;border-collapse:collapse;min-width:560px}
.ars-doc th,.ars-doc td{text-align:left;padding:14px 18px;border-bottom:1px solid var(--line);vertical-align:top}
.ars-doc th{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);background:#FAF4EC;font-weight:700}
.ars-doc tr:last-child td{border-bottom:none}
.ars-doc td:first-child{font-family:var(--ars-display),serif;font-size:19px;width:30%}
.ars-doc .bad{color:var(--red);font-weight:700}
.ars-doc .good{color:var(--ivy);font-weight:700}

.ars-doc .now{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--red);padding:28px 30px;margin-top:26px;box-shadow:var(--shadow)}
.ars-doc .now h3{font-size:22px;margin-bottom:6px}
.ars-doc .now .sub{color:var(--muted);font-size:15px;margin:0 0 20px}
.ars-doc .wins{display:flex;flex-direction:column;gap:18px}
.ars-doc .win{display:grid;grid-template-columns:34px 1fr;gap:16px;align-items:start}
.ars-doc .win .k{font-family:var(--ars-display),serif;font-size:26px;color:var(--red);line-height:1}
.ars-doc .win b{display:block;font-family:var(--ars-display),serif;font-size:19px;font-weight:600;margin-bottom:3px}
.ars-doc .win p{margin:0;color:var(--ink-2);font-size:16px;max-width:62ch}

.ars-doc .phase{background:var(--card);border:1px solid var(--line);margin-top:20px;box-shadow:var(--shadow)}
.ars-doc .ph-top{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:baseline;padding:20px 26px;border-bottom:1px solid var(--line);background:#F4F6F1}
.ars-doc .ph-top h3{font-size:24px;margin-right:auto}
.ars-doc .ph-top .wk{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--copper);font-weight:700}
.ars-doc .ph-body{padding:24px 26px}
.ars-doc .ph-body ul{margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:12px}
.ars-doc .ph-body li{position:relative;padding-left:22px;color:var(--ink-2)}
.ars-doc .ph-body li::before{content:"";position:absolute;left:0;top:.68em;width:9px;height:2px;background:var(--copper)}
.ars-doc .ph-body li b{color:var(--ink)}
.ars-doc .out{margin-top:20px;padding-top:16px;border-top:1px dashed var(--line-2);font-size:15.5px}
.ars-doc .out span{color:var(--muted);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;display:block;margin-bottom:4px}

.ars-doc .pillars{display:grid;grid-template-columns:repeat(auto-fit,minmax(238px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);margin-top:26px}
.ars-doc .pl{background:var(--card);padding:24px 22px;display:flex;flex-direction:column;gap:9px}
.ars-doc .pl .n{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--copper);font-weight:700}
.ars-doc .pl h4{font-size:21px}
.ars-doc .pl p{margin:0;font-size:15.5px;color:var(--ink-2)}
.ars-doc .pl .ex{font-size:14.5px;color:var(--muted);font-style:italic;border-left:2px solid var(--line-2);padding-left:12px;margin-top:4px}
.ars-doc .week{margin-top:26px;border:1px solid var(--line);background:var(--card);overflow-x:auto;box-shadow:var(--shadow)}
.ars-doc .week table{min-width:620px}
.ars-doc .week td:first-child{width:18%;font-size:17px}

.ars-doc .chans{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-top:26px}
.ars-doc .ch{background:var(--card);border:1px solid var(--line);padding:24px;display:flex;flex-direction:column;gap:10px}
.ars-doc .ch h4{font-size:21px}
.ars-doc .ch .st{font-size:14px;color:var(--muted);margin:0}
.ars-doc .ch p{margin:0;font-size:15.5px;color:var(--ink-2)}
.ars-doc .ch .role{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;color:var(--sea)}

.ars-doc .honest{background:#EAF2F3;border:1px solid #B9D5D8;padding:28px 30px;margin-top:26px}
.ars-doc .honest h3{font-size:21px;margin-bottom:14px;color:var(--sea)}
.ars-doc .honest ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:11px}
.ars-doc .honest li{max-width:70ch;color:var(--ink-2)}

.ars-doc .foot{background:var(--ivy-deep);color:#B0C4B6;padding:44px 0;margin-top:20px;border-top:5px solid var(--copper);font-size:14.5px}
.ars-doc .foot h3{color:#fff;font-size:26px;margin-bottom:12px}
.ars-doc .foot p{margin:0 0 10px;max-width:58ch}
.ars-doc .foot .cta{display:inline-flex;align-items:center;gap:8px;margin:14px 0 4px;background:var(--copper);color:#fff;padding:12px 22px;border-radius:2px;text-decoration:none;font-weight:700;font-size:16px}
.ars-doc .foot .cta:hover{background:#B96E42}
.ars-doc .sig{margin-top:26px;padding-top:18px;border-top:1px solid rgba(255,255,255,.16);display:flex;flex-wrap:wrap;gap:22px;align-items:baseline}
.ars-doc .sig b{color:#fff}
.ars-doc .sig a{color:#DCC9B0}
@media (prefers-reduced-motion: reduce){.ars-doc *{animation:none!important;transition:none!important}}
`;

const DIAG = [
  { k: "Уебсайт", v: "Няма", bad: true, m: "Който ви търси в Google, стига до чужд магазин" },
  { k: "Facebook", v: "485 последователи", m: "Единственият жив канал — но последната публикация има едно харесване" },
  { k: "Instagram", v: "34 последователи", bad: true, m: "26 публикации за пет години. Практически изоставен" },
  { k: "Ритъм на публикуване", v: "На пристъпи", bad: true, m: "Септември 2026, преди това април 2025, ноември 2024, март 2022" },
  { k: "Google профил", v: "4,2 ★ от 31", good: true, m: "Силна основа. Ключовата дума, която Google сам е извадил, е „картини“" },
  { k: "Отговори на отзиви", v: "„Благодарим ви!“", bad: true, m: "И на трите, всички наведнъж преди 4 месеца" },
  { k: "Работно време", v: "Разминава се", bad: true, m: "Вашето био казва 19:00, Google казва 20:00" },
  { k: "Текстът ви", v: "Литературен, безличен", m: "„Носи своя история“, „внимание към детайла“ — без цена, без продукт, без покана" },
  { k: "Снимките ви", v: "Има добри", good: true, m: "Кадрите с картина, държана в ръка, са наистина добри. Останалите са от интериора, на жълта светлина" },
];

const PILLARS = [
  { n: "Тема 1", t: "Картината на седмицата", p: "Една картина, художникът, размерът, цената. Най-подценената ви стока.", ex: "Лодки в залива, 40 × 30, масло. Рисувана е от натура — светлината е тукашна." },
  { n: "Тема 2", t: "Занаятът отблизо", p: "Макро кадър и едно изречение откъде идва. Хората обичат да знаят защо нещо струва повече.", ex: "Тези вдлъбнатини не са дефект. Джезвето е изчукано на ръка." },
  { n: "Тема 3", t: "Хората", p: "Продавачките. Всички отзиви говорят за тях, а лицата им не се виждат никъде.", ex: "Питайте за кого е подаръкът — оттам нататък е наша работа." },
  { n: "Тема 4", t: "Подарък за повод", p: "Българският календар е пълен с поводи. Всеки е причина за публикация.", ex: "Никулден иде. Ето какво имаме за имениците." },
  { n: "Тема 5", t: "Замина при…", p: "Купено при вас, отишло в чужбина. Доказателство и гордост едновременно.", ex: "Тази китеница вече е в Хамбург." },
];

export default function ArtSuveniriPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div lang="bg">
        <header className="head">
          <div className="wrap head-in">
            <p className="who">План за магазин „Арт Сувенири“ · Бургас</p>
            <h1>Магазинът е добър. Никой не го вижда.</h1>
            <p className="deck">
              Три месеца работа, разписани по седмици — какво се прави, в какъв ред и какво излиза
              от всяка стъпка.
            </p>
            <div className="head-meta">
              <span>Изготвил: Ивайло Петев · ProMarketing</span>
              <span className="tab">8 септември 2026</span>
              <span>По публични данни, без нищо питано от вас</span>
              <a className="demo" href={DEMO}>
                Вижте демото на магазина →
              </a>
            </div>
          </div>
        </header>

        <div className="wrap">
          <section>
            <div className="sh">
              <span className="sn">01</span>
              <h2>Къде сте днес</h2>
            </div>
            <p className="lede">
              Всичко по-долу е измерено, не предположено. Взето е от вашите страници, от Google и от
              отзивите ви.
            </p>
            <div className="diag">
              <table>
                <thead>
                  <tr>
                    <th>Какво</th>
                    <th>Състояние</th>
                    <th>Какво означава</th>
                  </tr>
                </thead>
                <tbody>
                  {DIAG.map((r) => (
                    <tr key={r.k}>
                      <td>{r.k}</td>
                      <td className={r.bad ? "bad" : r.good ? "good" : undefined}>{r.v}</td>
                      <td>{r.m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="sh">
              <span className="sn">02</span>
              <h2>Трите неща, които губят пари днес</h2>
            </div>
            <div className="now">
              <h3>Оправят се тази седмица</h3>
              <p className="sub">Не искат нито дизайн, нито бюджет. Само някой да седне и да ги свърши.</p>
              <div className="wins">
                <div className="win">
                  <span className="k">1</span>
                  <div>
                    <b>Работното време в Google</b>
                    <p>
                      Google показва, че затваряте в 20:00. Вие пишете 19:00. Турист, който тръгне
                      към вас в 19:30, намира спуснат кепенк — и това вече му е първото впечатление.
                      Оправя се за две минути и спира реален загубен клиент всеки ден.
                    </p>
                  </div>
                </div>
                <div className="win">
                  <span className="k">2</span>
                  <div>
                    <b>Отзивите остават без истински отговор</b>
                    <p>
                      Човек ви е написал три реда за продавачките и за „положителната енергия“, а
                      получава „Благодарим ви!“. Отговор, който споменава какво точно е купил и го
                      кани пак, се чете от всички следващи. Отзивите са витрина, не пощенска кутия.
                    </p>
                  </div>
                </div>
                <div className="win">
                  <span className="k">3</span>
                  <div>
                    <b>Картините стоят без нито един ред</b>
                    <p>
                      Последните ви публикации са картини — без художник, без размер, без цена.
                      Google сам е извадил „картини“ като дума от отзивите ви, тоест хората ги
                      помнят. Един ред под всяка снимка ги превръща от украса в стока.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="sh">
              <span className="sn">03</span>
              <h2>Планът, по седмици</h2>
            </div>
            <p className="lede">Три фази. Всяка стъпва на предишната — затова редът не се разбърква.</p>

            <div className="phase">
              <div className="ph-top">
                <h3>Основата</h3>
                <span className="wk">Седмица 1 – 2</span>
              </div>
              <div className="ph-body">
                <ul>
                  <li>
                    <b>Сайтът излиза жив</b> — с картините на първо място, защото те са най-силното,
                    което имате. <a href={DEMO}>Ето как ще изглежда.</a>
                  </li>
                  <li>
                    <b>Продуктите влизат.</b> Казахте, че информацията ви е налична — вкарването е наша
                    работа.
                  </li>
                  <li>
                    <b>Google профилът се оправя</b> — работно време, снимки, категории, отговори на
                    всички 31 отзива.
                  </li>
                  <li>
                    <b>Instagram-ът се изчиства и подрежда</b> — био, акценти, връзка към сайта.
                  </li>
                  <li>
                    <b>Един и същ правопис навсякъде.</b> Facebook е artsouvenirsburgas, Instagram е
                    artsuveniriburgas — човек, който ви търси, не бива да гадае.
                  </li>
                </ul>
                <div className="out">
                  <span>Какво излиза</span>Магазинът съществува онлайн. Който ви търси, ви намира — и
                  вижда цени.
                </div>
              </div>
            </div>

            <div className="phase">
              <div className="ph-top">
                <h3>Материалът</h3>
                <span className="wk">Седмица 3 – 6</span>
              </div>
              <div className="ph-body">
                <ul>
                  <li>
                    <b>Едно снимане на място</b> — половин ден в магазина, при дневна светлина от
                    витрината, не при жълтата лампа.
                  </li>
                  <li>
                    <b>Формулата, която вече ви работи:</b> предмет, държан в ръка, магазинът размит
                    отзад. Вашите най-добри кадри са точно такива — правим ги за всичко.
                  </li>
                  <li>
                    <b>Занаятът отблизо</b> — следите от чука по медта, потеклата „капка“ по
                    керамиката, бодът на шевицата. Това не се вижда в магазин, а продава.
                  </li>
                  <li>
                    <b>Хората</b> — продавачките, за които всички пишат в отзивите. С тяхно съгласие,
                    разбира се.
                  </li>
                  <li>
                    <b>Фасадата с бръшляна</b> — това ви е запазената марка и трябва да е първото,
                    което човек вижда.
                  </li>
                </ul>
                <div className="out">
                  <span>Какво излиза</span>Запас от материал за два-три месеца напред. Снима се
                  веднъж, използва се навсякъде.
                </div>
              </div>
            </div>

            <div className="phase">
              <div className="ph-top">
                <h3>Ритъмът</h3>
                <span className="wk">Седмица 7 – 12</span>
              </div>
              <div className="ph-body">
                <ul>
                  <li>
                    <b>Три публикации седмично</b>, на едни и същи дни. Ритъмът е по-важен от
                    количеството.
                  </li>
                  <li>
                    <b>Един и същ материал на три места</b> — сайт, Facebook, Instagram. Не се прави
                    три пъти.
                  </li>
                  <li>
                    <b>Поръчка отдалеч</b> — туристът, който си е тръгнал от Бургас, вече може да
                    купи пак.
                  </li>
                  <li>
                    <b>Празничният календар</b> — Никулден за иконите, Коледа за подаръците, 1 март
                    за мартениците, сватбеният сезон за бъклиците.
                  </li>
                  <li>
                    <b>Първата реклама</b> — чак тук. Пуска се към хора, които вече са били в Бургас,
                    и към търсещи подаръци. Не по-рано.
                  </li>
                </ul>
                <div className="out">
                  <span>Какво излиза</span>Зимата спира да е мъртва. Магазинът работи и когато
                  булевардът е празен.
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="sh">
              <span className="sn">04</span>
              <h2>За какво се публикува</h2>
            </div>
            <p className="lede">
              Пет теми. Въртят се и не свършват — това е разликата между ритъм и вдъхновение.
            </p>
            <div className="pillars">
              {PILLARS.map((x) => (
                <div className="pl" key={x.n}>
                  <span className="n">{x.n}</span>
                  <h4>{x.t}</h4>
                  <p>{x.p}</p>
                  <p className="ex">„{x.ex}“</p>
                </div>
              ))}
            </div>
            <div className="week">
              <table>
                <thead>
                  <tr>
                    <th>Ден</th>
                    <th>Какво излиза</th>
                    <th>Къде</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Вторник</td>
                    <td>Картината на седмицата</td>
                    <td>Instagram + Facebook + сайт</td>
                  </tr>
                  <tr>
                    <td>Четвъртък</td>
                    <td>Занаятът отблизо или Хората</td>
                    <td>Instagram + Facebook</td>
                  </tr>
                  <tr>
                    <td>Събота</td>
                    <td>Подарък за повод — най-силният ден за пазаруване</td>
                    <td>Facebook + Instagram</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="sh">
              <span className="sn">05</span>
              <h2>Каналите и ролите им</h2>
            </div>
            <div className="chans">
              <div className="ch">
                <span className="role">Основен днес</span>
                <h4>Facebook</h4>
                <p className="st">485 последователи</p>
                <p>
                  Тук е публиката ви и тя е по-възрастна — хора, които купуват подаръци и знаят какво
                  е китеник. Тук вървят поводите и хората.
                </p>
              </div>
              <div className="ch">
                <span className="role">За възстановяване</span>
                <h4>Instagram</h4>
                <p className="st">34 последователи · 26 публикации</p>
                <p>
                  Тук е мястото на картините и занаята — визуалното. Расте бавно, но точно оттам
                  идват хората отвън.
                </p>
              </div>
              <div className="ch">
                <span className="role">Най-подценен</span>
                <h4>Google профилът</h4>
                <p className="st">4,2 ★ от 31 отзива</p>
                <p>
                  Той решава дали туристът на улицата ще влезе. Работно време, снимки и отговори на
                  отзивите — това е най-евтината печалба, която имате.
                </p>
              </div>
              <div className="ch">
                <span className="role">Новият</span>
                <h4>Сайтът</h4>
                <p className="st">
                  <a href={DEMO}>Демото е готово</a>
                </p>
                <p>
                  Мястото, където всичко се събира и където туристът може да купи пак, след като си е
                  тръгнал.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="sh">
              <span className="sn">06</span>
              <h2>И честно — какво няма да стане</h2>
            </div>
            <div className="honest">
              <h3>За да няма разочарования</h3>
              <ul>
                <li>
                  <strong>Instagram няма да стане на хиляди за месец.</strong> При 34 последователи
                  първите резултати са в порядъка на стотици, и то към третия месец. Който ви обещае
                  друго, ви лъже.
                </li>
                <li>
                  <strong>Сайт без снимки не продава.</strong> Затова снимането е фаза, а не
                  подробност — и затова е преди рекламата, а не след нея.
                </li>
                <li>
                  <strong>Реклама преди сайта са изхвърлени пари.</strong> Няма къде да заведе човека
                  и няма как да се измери какво е станало.
                </li>
                <li>
                  <strong>Три месеца е реалният срок</strong> за първата фаза. Не защото работата е
                  много, а защото публиката се трупа бавно и няма как да се ускори с пари.
                </li>
                <li>
                  <strong>Магазинът остава основният.</strong> Онлайн частта не заменя булеварда — тя
                  го удължава през зимата и към хората, които вече са си тръгнали.
                </li>
              </ul>
            </div>
          </section>
        </div>

        <footer className="foot">
          <div className="wrap">
            <h3>Следващата стъпка</h3>
            <p>Погледнете демото и ми кажете кое ви харесва и кое бихте променили. Оттам нататък е бързо.</p>
            <a className="cta" href={DEMO}>
              Демото на магазина →
            </a>
            <p>
              Ако решите да тръгнем, започваме с трите неща от точка 02 — те не чакат нищо и печелят
              още тази седмица.
            </p>
            <div className="sig">
              <b>Ивайло Петев</b>
              <span>Pro Marketing LTD</span>
              <a href="https://promarketing.pw">promarketing.pw</a>
              <span className="tab">0877 399 963</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
