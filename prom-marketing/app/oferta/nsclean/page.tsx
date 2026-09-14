/**
 * Оферта за NS Clean · София — пълна автоматизация, 2 000 € без ДДС.
 *
 * Човекът се обади от рекламата и каза, че иска целият бизнес да мине на AI,
 * и че звучи „твърде хубаво, за да е истина“. Затова страницата не обяснява,
 * а показва: кое влиза, в какъв ред, какво вижда той, какво вижда екипът и
 * какво вижда клиентът. Числата за фирмата са от сайта nsclean.bg (14.09.2026);
 * примерите с часове и суми са надписани като примерни.
 *
 * Обръщението е на „Вие“ — писмена оферта към фирмен адрес.
 */

import { Fragment } from "react";

const PDF = "/oferta/nsclean/ProMarketing-za-NS-Clean.pdf";

const CSS = `
.nsc-doc{
  --ground:#F6F9FA; --panel:#ECF3F6; --surface:#FFFFFF;
  --ink:#0F1E26; --ink-2:#465863; --ink-3:#7B8A94;
  --rule:#D6E1E7; --rule-soft:#E6EDF1;
  --accent:#0B6E8F; --accent-soft:#E0F0F6; --accent-ink:#F4FBFD;
  --mint:#1E8558; --mint-soft:#E3F4EB;
  --sun:#B4640A; --sun-soft:#FBEFDD;
  --shadow:0 1px 2px rgba(15,30,38,.05), 0 10px 28px -18px rgba(15,30,38,.25);
  background:var(--ground); color:var(--ink);
  font-family:var(--nsc-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.nsc-doc *{box-sizing:border-box}
.nsc-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 96px}
.nsc-doc h1,.nsc-doc h2,.nsc-doc h3,.nsc-doc h4{font-family:var(--nsc-ui),Arial,sans-serif;letter-spacing:-.012em;text-wrap:balance}
.nsc-doc .mono{font-family:var(--nsc-mono),monospace;font-variant-numeric:tabular-nums}
.nsc-doc a{color:var(--accent);text-underline-offset:3px}
.nsc-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.nsc-doc p{margin:0}

/* ── шапка ── */
.nsc-doc .masthead{padding:56px 0 34px;border-bottom:1px solid var(--rule)}
.nsc-doc .eyebrow{font-family:var(--nsc-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.nsc-doc h1{font-size:44px;line-height:1.08;font-weight:700;margin:0 0 18px;max-width:20ch}
.nsc-doc h1 em{font-style:normal;color:var(--accent)}
.nsc-doc .deck{font-size:19px;line-height:1.55;color:var(--ink-2);max-width:62ch;margin:0 0 22px}
.nsc-doc .byline{display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center;font-family:var(--nsc-ui),sans-serif;font-size:14px;color:var(--ink-3)}
.nsc-doc .byline .pricepill{font-family:var(--nsc-mono),monospace;font-weight:500;font-size:14px;color:var(--accent);background:var(--accent-soft);border-radius:999px;padding:6px 14px}
.nsc-doc .byline .pdf{font-family:var(--nsc-ui),sans-serif;font-weight:600;text-decoration:none;border:1px solid var(--rule);border-radius:999px;padding:6px 14px;color:var(--ink)}
.nsc-doc .byline .pdf:hover{border-color:var(--accent)}

/* ── секции ── */
.nsc-doc section{margin:52px 0 0}
.nsc-doc .kick{font-family:var(--nsc-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin:0 0 10px}
.nsc-doc .h2sub{font-size:28px;line-height:1.2;font-weight:700;margin:0 0 14px;max-width:26ch}
.nsc-doc .lead{font-size:17px;color:var(--ink-2);max-width:66ch;margin:0 0 22px}
.nsc-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
.nsc-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px 22px 20px;box-shadow:var(--shadow)}
.nsc-doc .card.tint{background:var(--panel);box-shadow:none}
.nsc-doc .card h3{font-size:17px;font-weight:700;margin:0 0 8px}
.nsc-doc .card p{font-size:15px;line-height:1.55;color:var(--ink-2)}
.nsc-doc .card .num{font-family:var(--nsc-mono),monospace;font-size:12px;color:var(--accent);letter-spacing:.12em;display:block;margin:0 0 8px}
.nsc-doc .card .sees{margin:12px 0 0;padding:10px 12px;border-radius:9px;background:var(--accent-soft);font-size:13.5px;line-height:1.5;color:var(--ink)}
.nsc-doc .card .sees b{font-family:var(--nsc-ui),sans-serif;font-weight:600;color:var(--accent)}

/* ── откъде тръгваме ── */
.nsc-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:0 0 20px}
.nsc-doc .fact{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:16px 18px}
.nsc-doc .fact .n{font-family:var(--nsc-ui),sans-serif;font-weight:700;font-size:22px;line-height:1.1;margin:0 0 4px}
.nsc-doc .fact .l{font-size:13.5px;color:var(--ink-3);line-height:1.4}
.nsc-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px;margin:18px 0 0}
.nsc-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}
.nsc-doc .pull .src{display:block;margin-top:8px;font-family:var(--nsc-ui),sans-serif;font-size:13px;color:var(--ink-3)}

/* ── денят ── */
.nsc-doc .day{display:grid;grid-template-columns:auto 1fr;gap:0 18px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:8px 22px;box-shadow:var(--shadow)}
.nsc-doc .day .t{font-family:var(--nsc-mono),monospace;font-size:14px;color:var(--accent);padding:14px 0;border-top:1px dashed var(--rule-soft);white-space:nowrap}
.nsc-doc .day .w{font-size:15.5px;line-height:1.55;color:var(--ink-2);padding:14px 0;border-top:1px dashed var(--rule-soft)}
.nsc-doc .day .t:first-child,.nsc-doc .day .t:first-child+.w{border-top:0}
.nsc-doc .day .w b{color:var(--ink);font-weight:600}
.nsc-doc .note{font-size:13.5px;color:var(--ink-3);margin:10px 0 0}

/* ── получавате ── */
.nsc-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.nsc-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px}
.nsc-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15px;line-height:1.5;color:var(--ink-2)}
.nsc-doc .list li i{font-style:normal;color:var(--mint);font-weight:700}
.nsc-doc .list.no li i{color:var(--ink-3)}
.nsc-doc .list li b{color:var(--ink);font-weight:600}

/* ── две седмици ── */
.nsc-doc .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.nsc-doc .step{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:18px}
.nsc-doc .step .d{font-family:var(--nsc-mono),monospace;font-size:12px;letter-spacing:.1em;color:var(--sun);text-transform:uppercase;display:block;margin:0 0 6px}
.nsc-doc .step h3{font-size:16px;margin:0 0 6px}
.nsc-doc .step p{font-size:14.5px;line-height:1.5;color:var(--ink-2)}

/* ── цената ── */
.nsc-doc .price{display:grid;grid-template-columns:1.1fr 1fr;gap:18px;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:28px;box-shadow:var(--shadow)}
.nsc-doc .price .big{font-family:var(--nsc-ui),sans-serif;font-weight:700;font-size:44px;line-height:1;margin:0 0 6px;color:var(--ink)}
.nsc-doc .price .big small{font-size:18px;font-weight:600;color:var(--ink-3);margin-left:6px}
.nsc-doc .price .vat{font-family:var(--nsc-mono),monospace;font-size:13px;color:var(--ink-3);margin:0 0 16px}
.nsc-doc .price h3{font-size:15px;margin:0 0 8px}
.nsc-doc .price table{width:100%;border-collapse:collapse;font-size:15px}
.nsc-doc .price td{padding:9px 0;border-top:1px solid var(--rule-soft);color:var(--ink-2);vertical-align:top}
.nsc-doc .price td.v{font-family:var(--nsc-mono),monospace;color:var(--ink);text-align:right;white-space:nowrap}
.nsc-doc .price tr:first-child td{border-top:0}
.nsc-doc .opt{margin:14px 0 0;padding:12px 14px;border-radius:10px;background:var(--panel);font-size:14px;line-height:1.5;color:var(--ink-2)}
.nsc-doc .opt b{color:var(--ink);font-weight:600}

/* ── следваща стъпка ── */
.nsc-doc .closing{background:var(--accent);color:var(--accent-ink);border-radius:16px;padding:30px 30px 26px;margin-top:52px}
.nsc-doc .closing h2{color:#fff;font-size:26px;margin:0 0 10px}
.nsc-doc .closing p{font-size:16.5px;line-height:1.6;color:rgba(255,255,255,.9);max-width:62ch}
.nsc-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 0}
.nsc-doc .closing a.btn{font-family:var(--nsc-ui),sans-serif;font-weight:600;text-decoration:none;color:var(--accent);background:#fff;border-radius:10px;padding:12px 18px;font-size:15px}
.nsc-doc .closing a.ghost{color:#fff;background:transparent;border:1px solid rgba(255,255,255,.55)}
.nsc-doc .sig{margin:26px 0 0;font-family:var(--nsc-ui),sans-serif;font-size:13.5px;color:var(--ink-3)}

@media (max-width:760px){
  .nsc-doc h1{font-size:33px}
  .nsc-doc .two,.nsc-doc .price{grid-template-columns:1fr}
  .nsc-doc .masthead{padding:36px 0 26px}
}
@media print{
  html,body{background:#fff}
  .nsc-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .nsc-doc .wrap{max-width:none;padding:0}
  .nsc-doc .masthead{padding:0 0 16px}
  .nsc-doc h1{font-size:30px;margin-bottom:12px}
  .nsc-doc .deck{font-size:14px}
  .nsc-doc .byline .pdf{display:none}
  .nsc-doc section{margin:24px 0 0;break-inside:avoid}
  .nsc-doc .h2sub{font-size:20px;margin-bottom:10px}
  .nsc-doc .lead{font-size:13px;margin-bottom:14px}
  .nsc-doc .cards{grid-template-columns:1fr 1fr;gap:10px}
  .nsc-doc .card{padding:14px 16px;box-shadow:none;break-inside:avoid}
  .nsc-doc .card h3{font-size:14px}
  .nsc-doc .card p{font-size:12px}
  .nsc-doc .card .sees{font-size:11.5px;padding:7px 9px}
  .nsc-doc .fact .n{font-size:18px}
  .nsc-doc .day{box-shadow:none}
  .nsc-doc .day .t,.nsc-doc .day .w{padding:8px 0;font-size:12px}
  .nsc-doc .step{padding:12px}
  .nsc-doc .step p{font-size:12px}
  .nsc-doc .price{box-shadow:none;padding:18px}
  .nsc-doc .price .big{font-size:34px}
  .nsc-doc .closing{padding:20px 22px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .nsc-doc .card.tint,.nsc-doc .card .sees,.nsc-doc .opt,.nsc-doc .byline .pricepill,.nsc-doc .pull{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const BLOKOVE = [
  {
    n: "01",
    title: "Запитването влиза само, на едно място",
    body: "Телефон, имейл, формата на сайта, Viber и Messenger стигат до един картон на клиента. До 60 секунди човекът получава отговор с трите въпроса, които така или иначе задавате: адрес, площ, вид почистване, по желание снимки.",
    sees: "Клиентът получава отговор веднага, дори в неделя. Вие виждате всички запитвания в един списък, с това, което вече е казано.",
  },
  {
    n: "02",
    title: "Огледът се записва сам",
    body: "Клиентът избира час от свободните Ви прозорци, без размяна на съобщения. Вечерта преди огледа получава напомняне, а човекът, който отива, има адреса, снимките и бележките в телефона си.",
    sees: "Няма забравени огледи и няма „кога казахте, че ще дойдете“.",
  },
  {
    n: "03",
    title: "Офертата излиза за минути, не вечерта",
    body: "След огледа попълвате кратък списък на телефона: квадратура, услуги, степен на замърсяване, етаж, паркиране. Системата сглобява офертата с Вашите цени и я праща на клиента като PDF. Ако два дни няма отговор, тръгва едно приятелско напомняне.",
    sees: "Клиентът има цената, докато още помни огледа. Вие не сядате вечер да пишете оферти.",
  },
  {
    n: "04",
    title: "Графикът на екипа се подрежда сам",
    body: "Потвърдената поръчка влиза в календара на екипа: адрес, час, какво се носи, какво е обещано. Всеки от екипа вижда своя ден в телефона. Клиентът получава „утре в 9:00 сме при Вас“.",
    sees: "Екипът не Ви пита сутрин къде отива. Клиентът не Ви пита кога идвате.",
  },
  {
    n: "05",
    title: "Апартаментите под наем: почистване между гостите, без обаждане",
    body: "Календарите на апартаментите (Airbnb, Booking) се четат автоматично. След всяко напускане системата отваря задача за почистване в прозореца до следващото настаняване и я дава на екипа. Готово е с две снимки към собственика.",
    sees: "Собственикът на апартамента вижда „почистено в 13:40“ и снимките. Вие не координирате по телефона всяко напускане.",
  },
  {
    n: "06",
    title: "След работата: фактура, отзив, следващо почистване",
    body: "След приключване тръгват фактурата и линк за плащане. Ден по-късно клиентът получава молба за отзив в Google. Килимите и меката мебел се напомнят след шест месеца, офисите по график. Всеки понеделник в 8:00 получавате отчет: запитвания, огледи, оферти, спечелени, приход по услуги.",
    sees: "Отзивите растат без да молите на ръка. Старите клиенти се връщат сами.",
  },
];

const DENYAT = [
  { t: "07:52", w: "Запитване от формата на сайта: тристаен след ремонт, кв. Дружба. Системата отговаря веднага и пита за площ и снимки. Клиентът праща четири снимки." },
  { t: "08:05", w: "Екипът получава деня си: два офиса на абонамент, един апартамент между гости в 13:00, един оглед в 16:30." },
  { t: "11:20", w: "Гост напуска апартамент на Хан Аспарух. Отваря се задача „почистване до 15:00“, отива при свободния човек от екипа." },
  { t: "13:40", w: "Апартаментът е готов. Две снимки към собственика, отметка в неговия календар." },
  { t: "16:30", w: "Оглед на тристайния. Попълвате списъка на телефона за три минути. В 16:41 клиентът има офертата." },
  { t: "18:10", w: "Клиентът приема. Поръчката е в графика за петък, потвърждението вече е при него." },
  { t: "ПОНЕДЕЛНИК 08:00", w: "Отчетът за седмицата: 14 запитвания, 9 огледа, 8 оферти, 5 спечелени, приход по услуги. Примерни числа, Вашите ще са Вашите." },
];

const VKLYUCHENO = [
  ["Общ вход за запитванията", "телефон, имейл, сайт, Viber, Messenger, с автоматичен първи отговор"],
  ["Картон на всеки клиент", "какво е искал, какво е обещано, какво е платено"],
  ["Записване на огледи", "със свободните Ви часове и напомняния"],
  ["Оферти от списък на телефона", "с Вашите цени, PDF към клиента, напомняне при мълчание"],
  ["График на екипа", "в телефона на всеки, с потвърждение към клиента"],
  ["Почистване между гости", "по календарите на апартаментите, със снимки към собственика"],
  ["Фактура, плащане, отзив, повторно почистване", "автоматично след всяка работа"],
  ["Седмичен отчет", "всеки понеделник в 8:00"],
  ["Обучение на екипа", "два часа, на живо, с Вашите реални поръчки"],
];

const NE_VKLYUCHENO = [
  ["Платена реклама", "бюджетът и управлението на реклами са отделна услуга"],
  ["Нов сайт", "сегашният остава; формата му се свързва със системата"],
  ["Таксите на външните услуги", "телефония и съобщения се плащат директно на доставчика, обикновено до 20 € на месец"],
];

const SEDMICI = [
  { d: "Ден 1", h: "Настройваме на живо", p: "Час и половина с Вас: услугите, цените, кой ходи на огледи, как звучи NS Clean в първия отговор. Още същия ден запитванията влизат в системата." },
  { d: "Дни 2 – 5", h: "Оферти и график", p: "Списъкът за оглед, шаблонът на офертата с Вашите цени, календарът на екипа. Първите реални оферти излизат през системата." },
  { d: "Дни 6 – 9", h: "Апартаментите и парите", p: "Свързваме календарите на апартаментите, фактурите, плащането и молбата за отзив. Вие гледате как минават първите поръчки и казвате какво да се промени." },
  { d: "Дни 10 – 14", h: "Екипът и предаването", p: "Два часа обучение на екипа с реалните поръчки. Предаваме Ви системата с всичко Ваше: акаунти, данни, достъпи. Оттук нататък работи без нас." },
];

export default function NscleanPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <header className="masthead">
          <p className="eyebrow">Оферта · за NS Clean, София · 14 септември 2026</p>
          <h1>
            Запитването влиза само. Огледът се записва сам. <em>Офертата излиза за минути.</em>
          </h1>
          <p className="deck">
            Пълна автоматизация на пътя от първото обаждане до платената фактура, настроена за
            почистваща фирма в София, която обслужва домове, офиси и апартаменти под наем. Не
            каталог на възможности, а конкретните стъпки, в реда, в който ще ги видите работещи.
          </p>
          <div className="byline">
            <span className="pricepill">2 000 € без ДДС · еднократно</span>
            <span>Ивайло Петев · Pro Marketing</span>
            <a className="pdf" href={PDF}>
              Свали като PDF
            </a>
          </div>
        </header>

        <section>
          <p className="kick">Откъде тръгваме</p>
          <h2 className="h2sub">Това, което вече работи при Вас, остава. Добавяме системата под него.</h2>
          <div className="facts">
            <div className="fact">
              <p className="n">4,6 в Google</p>
              <p className="l">Отзивите вече казват, че работата е добра. Системата ще ги умножи.</p>
            </div>
            <div className="fact">
              <p className="n">Оглед на място</p>
              <p className="l">„Всички цени се определят след безплатен оглед на място.“ Точно този оглед става за минути по-бърз.</p>
            </div>
            <div className="fact">
              <p className="n">Телефон и имейл</p>
              <p className="l">Днес всяко запитване минава през човек. Утре минава през системата и стига до човек само когато трябва.</p>
            </div>
            <div className="fact">
              <p className="n">Домове · офиси · след ремонт</p>
              <p className="l">Три вида работа с три различни ритъма. Системата ги различава, вместо да ги смесва.</p>
            </div>
          </div>
          <div className="pull">
            <p>
              По телефона казахте, че искате целият бизнес да мине на изкуствен интелект, и че звучи
              твърде хубаво, за да е истина. Съгласен съм с второто, докато не го видите. Затова
              условието по-долу е просто: остатъкът се плаща, когато системата работи с Вашите
              реални поръчки, не преди това.
            </p>
            <span className="src">От разговора ни, 14 септември 2026</span>
          </div>
        </section>

        <section>
          <p className="kick">Какво поема системата</p>
          <h2 className="h2sub">Шест неща, които днес правите на ръка, и кой какво вижда след това</h2>
          <p className="lead">
            Всяко от тях е отделна автоматизация, но заедно затварят кръга: запитване, оглед, оферта,
            изпълнение, пари, следващо запитване от същия клиент.
          </p>
          <div className="cards">
            {BLOKOVE.map((b) => (
              <article className="card" key={b.n}>
                <span className="num">{b.n}</span>
                <h3>{b.title}</h3>
                <p>{b.body}</p>
                <p className="sees">
                  <b>Кой какво вижда · </b>
                  {b.sees}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <p className="kick">Един ден от NS Clean със системата</p>
          <h2 className="h2sub">Примерен вторник, от първото запитване до отчета</h2>
          <div className="day">
            {DENYAT.map((d) => (
              <Fragment key={d.t}>
                <span className="t mono">{d.t}</span>
                <span className="w">{d.w}</span>
              </Fragment>
            ))}
          </div>
          <p className="note">Часовете и адресите са примерни. Реалният ден ще е Вашият, но без телефона в ръка през цялото време.</p>
        </section>

        <section>
          <p className="kick">Какво получавате</p>
          <h2 className="h2sub">Всичко в цената, и трите неща, които нарочно не са вътре</h2>
          <div className="two">
            <div className="card">
              <h3>Включено</h3>
              <ul className="list">
                {VKLYUCHENO.map(([a, b]) => (
                  <li key={a}>
                    <i>✓</i>
                    <span>
                      <b>{a}</b> · {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card tint">
              <h3>Не е включено</h3>
              <ul className="list no">
                {NE_VKLYUCHENO.map(([a, b]) => (
                  <li key={a}>
                    <i>—</i>
                    <span>
                      <b>{a}</b> · {b}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="opt">
                <b>Всичко е Ваше.</b> Акаунтите, данните и достъпите се водят на NS Clean, не на нас. Ако
                утре решите да продължите без нас, системата продължава да работи.
              </p>
            </div>
          </div>
        </section>

        <section>
          <p className="kick">Как минават първите две седмици</p>
          <h2 className="h2sub">От разговора за настройката до предаването</h2>
          <div className="steps">
            {SEDMICI.map((s) => (
              <div className="step" key={s.d}>
                <span className="d">{s.d}</span>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kick">Цената</p>
          <h2 className="h2sub">Едно число, без месечни такси към нас</h2>
          <div className="price">
            <div>
              <p className="big">
                2 000 €<small>без ДДС</small>
              </p>
              <p className="vat mono">2 400 € с ДДС · еднократно · валидна до 28 септември 2026</p>
              <h3>Плащане</h3>
              <table>
                <tbody>
                  <tr>
                    <td>При старт, ден 1</td>
                    <td className="v">1 400 € без ДДС</td>
                  </tr>
                  <tr>
                    <td>При предаването, когато системата работи с Вашите реални поръчки</td>
                    <td className="v">600 € без ДДС</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3>Какво покрива</h3>
              <table>
                <tbody>
                  <tr>
                    <td>Шестте автоматизации от тази страница, настроени за NS Clean</td>
                    <td className="v">✓</td>
                  </tr>
                  <tr>
                    <td>Обучение на екипа на живо, два часа</td>
                    <td className="v">✓</td>
                  </tr>
                  <tr>
                    <td>Първите 30 дни след предаването: наблюдаваме и донастройваме</td>
                    <td className="v">✓</td>
                  </tr>
                </tbody>
              </table>
              <p className="opt">
                <b>По желание, след първия месец:</b> поддръжка „Спокойствие“ за 150 € на месец. Следим системата, правим дребните промени и Ви пращаме месечния отчет. Не е условие за офертата.
              </p>
            </div>
          </div>
        </section>

        <div className="closing">
          <h2>Следващата стъпка</h2>
          <p>
            Отговорете с „да“ на този имейл или във Viber и си избираме ден за разговора за настройката.
            От него до работеща система с Вашите реални поръчки са две седмици. Ако искате първо да
            видите нещо работещо, показвам Ви го на екрана за двайсет минути, преди да решите.
          </p>
          <div className="ctas">
            <a className="btn" href="mailto:office@promarketing.pw?subject=NS%20Clean%20%E2%80%94%20%D0%B4%D0%B0">
              Отговорете с „да“
            </a>
            <a className="btn ghost" href="tel:+359877399963">
              +359 877 399 963
            </a>
          </div>
        </div>

        <p className="sig">Ивайло Петев · Pro Marketing · promarketing.pw · office@promarketing.pw · +359 877 399 963</p>
      </div>
    </>
  );
}
