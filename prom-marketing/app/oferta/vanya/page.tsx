/**
 * Оферта за Ваня Чавдарова (vchavdarova7@gmail.com) — фризьорски салон, добавя услугата
 * удължаване на коса. Среща 15.10.2026 (Fathom 193107422).
 *
 * Казано на срещата: растежът през последните 3 години е от снимки, не от видео; тя е правила
 * само 2–3 видеа, защото не харесва как изглежда и звучи на камера; важното е във видеата да
 * има НЕЙНИ снимки и НЕЙН глас.
 *
 * Две възможности (цените са казани от Ивайло):
 *   1) Месечна видео услуга — 350 € на месец, 3–4 AI видеа на ден от нейни снимки и нейния глас.
 *   2) AI Академия — 4 месеца, 1 800 € без ДДС, 2 срещи седмично по 1 час.
 * При първата не споменаваме ДДС. Гледания НЕ обещаваме. Обръщението е на „Вие“.
 */

const PDF = "/oferta/vanya/ProMarketing-za-Vanya.pdf";

const CSS = `
/* сайтът е тъмен (color-scheme: dark в globals.css) — тази страница е светла докрай,
   иначе в PDF-а полетата на листа излизат тъмни */
html:has(.van-doc),body:has(.van-doc){background:#FAF5F3;color-scheme:light}
.van-doc{
  --ground:#FAF5F3; --panel:#F3E8E6; --surface:#FFFFFF;
  --ink:#2A1E22; --ink-2:#58484E; --ink-3:#85767C;
  --rule:#E8DAD8; --rule-soft:#F1E6E4;
  --accent:#8A3A5A; --accent-soft:#F6E4EA; --rose:#B0587A;
  --shadow:0 1px 2px rgba(42,30,34,.05), 0 10px 28px -18px rgba(90,30,50,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--van-body),Georgia,serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.van-doc *{box-sizing:border-box}
.van-doc .wrap{max-width:1080px;margin:0 auto;padding:0 24px 92px}
.van-doc h1,.van-doc h2{font-family:var(--van-body),Georgia,serif;font-weight:600;letter-spacing:-.012em;text-wrap:balance}
.van-doc h3{font-family:var(--van-ui),Arial,sans-serif;font-weight:700;letter-spacing:-.01em;text-wrap:balance}
.van-doc a{color:var(--accent);text-underline-offset:3px}
.van-doc a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.van-doc p{margin:0}

/* ── шапка ── */
.van-doc .masthead{padding:58px 0 34px;border-bottom:1px solid var(--rule)}
.van-doc .eyebrow{font-family:var(--van-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--rose);margin:0 0 18px}
.van-doc h1{font-size:46px;line-height:1.1;margin:0 0 18px;max-width:22ch}
.van-doc h1 em{font-style:italic;color:var(--accent)}
.van-doc .deck{font-size:19px;line-height:1.56;color:var(--ink-2);max-width:60ch;margin:0 0 22px}
.van-doc .byline{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;font-family:var(--van-ui),sans-serif;font-size:14px;color:var(--ink-3)}
.van-doc .byline a{font-weight:600}

/* ── секции ── */
.van-doc section{margin:52px 0 0}
.van-doc .kick{font-family:var(--van-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--rose);margin:0 0 10px}
.van-doc .h2sub{font-size:30px;line-height:1.2;margin:0 0 14px;max-width:30ch}
.van-doc .lead{font-size:17px;color:var(--ink-2);max-width:64ch;margin:0 0 22px}
.van-doc .note{font-size:13.5px;color:var(--ink-3);margin:10px 0 0}

.van-doc .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:0 0 20px}
.van-doc .fact{background:var(--panel);border-radius:12px;padding:18px 20px}
.van-doc .fact h3{font-size:15.5px;margin:0 0 6px;color:var(--accent)}
.van-doc .fact p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.van-doc .pull{border-left:3px solid var(--accent);background:var(--surface);border-radius:0 12px 12px 0;padding:18px 22px}
.van-doc .pull p{font-size:17px;line-height:1.6;color:var(--ink)}

.van-doc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.van-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:22px 22px 20px;box-shadow:var(--shadow)}
.van-doc .card .num{font-family:var(--van-mono),monospace;font-size:12px;color:var(--rose);letter-spacing:.12em;display:block;margin:0 0 8px}
.van-doc .card h3{font-size:17.5px;margin:0 0 8px}
.van-doc .card p{font-size:15px;line-height:1.56;color:var(--ink-2)}

/* ── двата варианта ── */
.van-doc .opts{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.van-doc .opt{position:relative;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:28px 26px 24px;box-shadow:var(--shadow)}
.van-doc .opt.rec{border:2px solid var(--accent)}
.van-doc .opt .badge{position:absolute;top:-13px;left:22px;background:var(--accent);color:#fff;font-family:var(--van-ui),sans-serif;font-weight:600;font-size:12px;letter-spacing:.06em;border-radius:999px;padding:4px 12px}
.van-doc .opt h3{font-size:19px;margin:0 0 8px}
.van-doc .opt .big{font-family:var(--van-ui),sans-serif;font-weight:700;font-size:42px;line-height:1;color:var(--accent);margin:0 0 4px;font-variant-numeric:tabular-nums}
.van-doc .opt .big small{font-size:16px;font-weight:600;color:var(--ink-3);margin-left:8px;white-space:nowrap;display:inline-block}
.van-doc .opt .sub{font-family:var(--van-mono),monospace;font-size:13px;color:var(--ink-3);margin:0 0 16px}
.van-doc .opt .for{font-size:15px;line-height:1.55;color:var(--ink-2);margin:0 0 14px}
.van-doc .list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px}
.van-doc .list li{display:grid;grid-template-columns:auto 1fr;gap:10px;font-size:15px;line-height:1.5;color:var(--ink-2)}
.van-doc .list li i{font-style:normal;color:var(--accent);font-weight:700}

/* ── следващата стъпка ── */
.van-doc .closing{background:var(--accent-soft);border:1px solid #E8C6D2;border-left:4px solid var(--accent);border-radius:16px;padding:30px 32px 28px;margin-top:52px}
.van-doc .closing h2{color:var(--accent);font-size:28px;margin:0 0 10px}
.van-doc .closing p{font-size:17px;line-height:1.6;color:var(--ink);max-width:62ch}
.van-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.van-doc .closing a.btn{font-family:var(--van-ui),sans-serif;font-weight:600;text-decoration:none;color:#fff;background:var(--accent);border-radius:10px;padding:12px 18px;font-size:15px}
.van-doc .closing a.ghost{color:var(--accent);background:transparent;border:1px solid var(--accent)}
.van-doc .sig{break-inside:avoid;margin:26px 0 0;font-family:var(--van-ui),sans-serif;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.van-doc .sig b{color:var(--ink)}

@media (max-width:760px){
  .van-doc .wrap{padding:0 16px 72px}
  .van-doc h1{font-size:33px}
  .van-doc .h2sub{font-size:24px}
  .van-doc .deck{font-size:17.5px}
  .van-doc .opts{grid-template-columns:1fr}
  .van-doc .cards{grid-template-columns:1fr}
  .van-doc .masthead{padding:36px 0 26px}
  .van-doc .closing{padding:24px 20px}
}
@media print{
  :root,html,body{color-scheme:light;background:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .van-doc{background:#fff;font-size:12.5px;line-height:1.5}
  .van-doc .wrap{max-width:none;padding:0}
  .van-doc .masthead{padding:0 0 16px}
  .van-doc h1{font-size:30px;margin-bottom:12px}
  .van-doc .deck{font-size:14px}
  .van-doc .byline .pdf{display:none}
  .van-doc section{margin:18px 0 0;break-inside:avoid}
  .van-doc h1,.van-doc .deck,.van-doc .h2sub,.van-doc .lead{max-width:none}
  .van-doc .kick,.van-doc .h2sub,.van-doc .lead{break-after:avoid}
  .van-doc .h2sub{font-size:19px;margin-bottom:8px}
  .van-doc .lead{font-size:12.5px;margin-bottom:10px}
  .van-doc .fact,.van-doc .card,.van-doc .opt,.van-doc .pull{break-inside:avoid}
  .van-doc .fact p{font-size:12px}
  .van-doc .pull p{font-size:13px}
  .van-doc .cards{grid-template-columns:repeat(3,1fr);gap:10px}
  .van-doc .card{padding:12px 14px;box-shadow:none}
  .van-doc .card .num{margin-bottom:4px}
  .van-doc .card h3{font-size:13.5px;margin-bottom:5px}
  .van-doc .card p{font-size:11.5px;line-height:1.48}
  .van-doc .opts{grid-template-columns:1fr 1fr;gap:12px}
  .van-doc .opt{padding:16px 16px 12px;box-shadow:none}
  .van-doc .opt .big{font-size:30px}
  .van-doc .opt .for{font-size:12px}
  .van-doc .opt h3{font-size:15px}
  .van-doc .list li{font-size:12px}
  .van-doc .closing{padding:16px 20px;margin-top:18px;break-inside:avoid}
  .van-doc .closing h2{font-size:20px}
  .van-doc .closing p{font-size:13.5px}
  .van-doc .closing .ctas{display:none}
  .van-doc .fact,.van-doc .closing,.van-doc .opt .badge{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .van-doc .facts{grid-template-columns:repeat(3,1fr)}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 13mm}
`;

const FAKTI = [
  {
    h: "Три години растеж със снимки",
    p: "Салонът Ви е израснал от добрите Ви снимки — това е силна основа, върху която градим.",
  },
  {
    h: "Новата услуга: удължаване на коса",
    p: "Заслужава да се вижда. Преди и след, работата, детайлите — точно това се харесва в мрежите.",
  },
  {
    h: "Камерата не е Ваше любимо място",
    p: "Не харесвате как изглеждате и звучите на видео — и това е напълно ок. Затова има начин да не снимате себе си.",
  },
  {
    h: "Важна е личната връзка",
    p: "Клиентките избират човек. Затова във всяко видео са Вашите снимки и Вашият глас.",
  },
];

const MESEC = [
  "3–4 видеа на ден, готови за Вашите социални мрежи",
  "Правим ги от снимките, които ни пращате — Ваши и на Вашата работа",
  "С Вашия глас, така че да звучи като Вас",
  "Идеите за съдържание са наши — Вие не мислите какво да публикувате",
  "Ако желаете, към AI видеата добавяме и няколко с Вас, за баланс",
];

const AKADEMIA = [
  "4 месеца менторство, 2 срещи седмично по 1 час",
  "Автоматизация на салона — имейли, телефон, напомняния",
  "AI реклами и уебсайт",
  "Система за клиентите (CRM) — резервации и имейл маркетинг",
  "Научавате се да я управлявате сами и тя остава Ваша",
];

export default function VanyaOferta() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="masthead">
        <p className="eyebrow">За Ваня Чавдарова · 15.10.2026</p>
        <h1>
          Видеа за новата Ви услуга — <em>с Вашите снимки и Вашия глас.</em>
        </h1>
        <p className="deck">
          Радваме се, че се запознахме, Ваня. Ето как новата Ви услуга — удължаване на коса — да
          се вижда всеки ден, без да се налага да се снимате.
        </p>
        <p className="byline">
          <span>От Ивайло Петев, Pro Marketing</span>
          <a className="pdf" href={PDF}>
            Свали като PDF
          </a>
        </p>
      </header>

      <section>
        <p className="kick">Какво чухме от Вас</p>
        <h2 className="h2sub">Силна основа и една ясна нужда</h2>
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
            Снимките Ви вече работят. Остава видеото да ги подкрепи — със същото лице и същия
            глас, на които клиентките Ви вярват, но без да заставате пред камерата.
          </p>
        </div>
      </section>

      <section>
        <p className="kick">Две възможности</p>
        <h2 className="h2sub">Изберете какво Ви е по-удобно</h2>
        <div className="opts">
          <article className="opt rec">
            <span className="badge">Препоръчваме</span>
            <h3>Месечна видео услуга</h3>
            <p className="big">
              350 €<small>на месец</small>
            </p>
            <p className="sub">най-бързото облекчение</p>
            <p className="for">
              Ние правим видеата, Вие продължавате да работите със своите клиентки.
            </p>
            <ul className="list">
              {MESEC.map((a) => (
                <li key={a}>
                  <i>✓</i>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="opt">
            <h3>AI Академия</h3>
            <p className="big">
              1 800 €<small>без ДДС</small>
            </p>
            <p className="sub">4 месеца менторство</p>
            <p className="for">
              За Вас, ако искате да притежавате цялата система на салона и да я управлявате сами.
            </p>
            <ul className="list">
              {AKADEMIA.map((a) => (
                <li key={a}>
                  <i>✓</i>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
        <p className="note">
          Брой гледания не обещаваме предварително — зависи от снимките и от мрежата. Обещаваме
          ритъма: нови видеа всеки ден.
        </p>
      </section>

      <section>
        <p className="kick">Как стартираме</p>
        <h2 className="h2sub">Три прости стъпки</h2>
        <div className="cards">
          <article className="card">
            <span className="num">01</span>
            <h3>Пращате снимки</h3>
            <p>10–20 снимки на Вашата работа и на Вас — каквото имате в телефона.</p>
          </article>
          <article className="card">
            <span className="num">02</span>
            <h3>Показваме първите видеа</h3>
            <p>Преди да излязат, ги гледате и ни казвате какво да променим. После караме в стила, който Ви харесва.</p>
          </article>
          <article className="card">
            <span className="num">03</span>
            <h3>Видеата тръгват</h3>
            <p>Всеки ден нови видеа за Вашите мрежи — а Вие се занимавате с косите.</p>
          </article>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Най-лесно е да започнете с месечната услуга: изпратете ни 10–20 снимки и първите
          видеа са на път. Ако предпочитате първо да поговорим, един кратък разговор е достатъчен.
        </p>
        <p className="ctas">
          <a className="btn" href="mailto:emmgivailopetev38@gmail.com?subject=%D0%92%D0%B8%D0%B4%D0%B5%D0%B0%20%D0%B7%D0%B0%20%D0%92%D0%B0%D0%BD%D1%8F">
            Изпратете снимките
          </a>
          <a className="btn ghost" href="tel:+359877399963">
            0877 399 963
          </a>
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
