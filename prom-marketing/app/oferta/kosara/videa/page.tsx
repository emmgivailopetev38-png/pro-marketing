/**
 * Оферта №3 за Галина Трендафилова — Kosara.bg, 06.11.2026: видеата като услуга за сезона.
 *
 * Контекст: на 06.11 във Viber Галина отложи инструментите (оферта №2) за след Нова година — ноември е натоварен и
 * „не мога да стресирам системата с новости“. Първото видео (роклята) обаче ѝ донесе 3 395 гледания без реклама.
 * Затова тук няма инсталация и нищо при тях не се пипа: тя праща линк към продукт, ние правим видеото.
 * Цената е дадена от Ивайло на 06.11: 320 € без ДДС на месец за 4 видеа (80 € на видео). Обръщението е на „ти“.
 */

import type { Metadata } from "next";
import { CSS } from "../kosara-css";

export const metadata: Metadata = {
  title: "Видеата за сезона · 4 на месец до Коледа · за Галина · Pro Marketing",
  description:
    "Видеа с дете в дрехата за Kosara.bg — всеки месец до Коледа, без инсталации и без да се пипа нищо при вас: ти пращаш линк към продукта, ние правим видеото.",
  robots: { index: false, follow: false },
};

const PDF = "/oferta/kosara/ProMarketing-Kosara-videa.pdf";
const TEL = "tel:+359877399963";
const VIBER = "viber://chat?number=%2B359877399963";
const PAGE = "https://promarketing.pw/oferta/kosara/videa";
const VIDEO = "/oferta/kosara/kosara-rokla-video.mp4";
const POSTER = "/oferta/kosara/kosara-rokla-poster.jpg";

const PRICE = 320; // € без ДДС на месец, 4 видеа — дадена от Ивайло 06.11.2026
const PER_VIDEO = PRICE / 4;

const EXTRA_CSS = `
.fh-doc .cty.go{border:2px solid var(--teal);background:var(--teal-soft)}
.fh-doc .cty .flag{font-family:var(--fh-mono),monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--amber-ink)}
.fh-doc .countries.one{grid-template-columns:1fr;max-width:520px}
.fh-doc .stats{grid-template-columns:repeat(3,1fr)}
@media print{
  .fh-doc .cty .flag{font-size:9.5px}
  .fh-doc .cty.go{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
`;

const STATS: [string, string][] = [
  ["3 395", "гледания на първото видео — без лев реклама"],
  ["1 260", "души са го видели във Facebook и Instagram"],
  ["0", "промени по сайта, компютрите и работата на екипа"],
];

const WHAT: [string, string][] = [
  ["✓", "4 видеа на месец — ноември и декември, за продуктите, които избереш"],
  ["✓", "Реалистично дете-модел в дрехата, без глас, само със субтитри — като с роклята"],
  ["✓", "Вертикално 9:16 за Facebook, Instagram и TikTok + корица за поста"],
  ["✓", "Логото, kosara.bg и телефонът ви накрая — нищо наше"],
  ["✓", "Маркирано като AI, както изискват законът и мрежите"],
  ["✓", "Една поправка на видео е включена — цвят, кадър, надпис"],
];

const TERMS: [string, string][] = [
  ["1", "Пишеш „да“ и първия линк — първото видео е при теб до 2 работни дни"],
  ["2", "Фактура за месеца, след като одобриш първото видео"],
  ["→", `Още видеа в същия месец — ${PER_VIDEO} € без ДДС на видео`],
  ["→", "Без обвързване: след декември спираме или продължаваме — както решиш"],
  ["→", "Инструментите и системата остават за януари, както каза"],
];

const STEPS = [
  { b: "Стъпка 1", h: "Линкът", p: "Пращаш ми линк към продукта — по имейл или във Viber. Ако искаш, едно изречение: какво да покаже видеото." },
  { b: "Стъпка 2", h: "Видеото", p: "До 2 работни дни получаваш готовото видео и корицата. Нищо не се инсталира, никой от екипа не се занимава." },
  { b: "Стъпка 3", h: "Поправката", p: "Казваш какво да сменим — цвят, кадър, надпис — и го получаваш същия ден." },
  { b: "Стъпка 4", h: "Пускаш го", p: "Качваш го ти, когато решиш — както с роклята. Контролът остава при теб.", go: true },
];

const eur = (n: number) => `${n.toLocaleString("bg-BG")} €`;

export default function KosaraVideaPage() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS + EXTRA_CSS }} />

      <header className="masthead">
        <p className="eyebrow">За Галина · Kosara.bg · видеата за сезона · 06.11.2026</p>
        <h1>
          Видеа с дете в дрехата — <em>всеки месец до Коледа</em>, без да пипаме нищо при вас.
        </h1>
        <p className="deck">
          Както каза: в сезона системата не се пипа. Затова това не е инсталация — ти пращаш линк към продукта, ние
          правим видеото. Точно както стана с роклята, само че редовно, за продуктите, които искаш да продадеш сега.
        </p>
        <p className="byline">
          <span>От Ивайло Петев, Pro Marketing</span>
          <a className="pdf" href={PDF}>
            Свали като PDF
          </a>
        </p>
      </header>

      <section>
        <div className="sechead">
          <p className="kick">Какво стана с роклята</p>
          <h2 className="h2sub">Едно видео, нула реклама — твоите числа от 06.11</h2>
        </div>
        <div className="stats">
          {STATS.map(([b, s]) => (
            <div className="stat" key={s}>
              <b>{b}</b>
              <span>{s}</span>
            </div>
          ))}
        </div>
        <div className="vid">
          <h3>Така ще изглежда всяко видео — дете в дрехата, без глас, с вашите лого, сайт и телефон</h3>
          <div className="vidwrap">
            <video
              controls
              playsInline
              preload="metadata"
              poster={POSTER}
              aria-label="Видеото за детска рокля от kosara.bg, направено от линка на продукта"
            >
              <source src={VIDEO} type="video/mp4" />
              Браузърът ти не показва видео — свали го от <a href={VIDEO}>тук</a>.
            </video>
          </div>
          <p className="vidlink">
            Видеото: <a href={PAGE}>promarketing.pw/oferta/kosara/videa</a>
          </p>
          <p className="vidai">
            🤖 Видеото е генерирано с AI (хората и сцената са синтетични; роклята е истинският продукт)
          </p>
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Как става</p>
          <h2 className="h2sub">От линка до готовото видео — без теб по средата</h2>
        </div>
        <div className="days">
          {STEPS.map((s) => (
            <article className={`step${s.go ? " go" : ""}`} key={s.h}>
              <b>{s.b}</b>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Цената</p>
          <h2 className="h2sub">Един пакет, една цена на месец</h2>
          <p className="lead">
            Без инсталация, без абонаменти на твое име, без обучение — просто готови видеа. Пакетът е за ноември и
            декември, когато продават най-много.
          </p>
        </div>
        <div className="countries one">
          <article className="cty go">
            <span className="flag">Пакетът за сезона</span>
            <h3>4 видеа на месец</h3>
            <p className="p">
              {eur(PRICE)}
              <small>без ДДС на месец</small>
            </p>
            <p className="d">
              {eur(Math.round(PRICE * 1.2))} с ДДС · по {eur(PER_VIDEO)} без ДДС на видео · ноември и декември
            </p>
          </article>
        </div>
        <div className="deal">
          <div className="terms">
            <h3>В пакета</h3>
            <ul className="list">
              {WHAT.map(([i, t]) => (
                <li key={t}>
                  <i>{i}</i>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="terms">
            <h3>Плащане и условия</h3>
            <ul className="list">
              {TERMS.map(([i, t]) => (
                <li key={t}>
                  <i>{i}</i>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Пиши ми „да“ и линка към първия продукт — до 2 работни дни видеото е при теб. Ако искаш първо да поговорим,
          звънни ми на 0877 399 963.
        </p>
        <p className="ctas">
          <a className="btn" href={TEL}>
            Обади се на Ивайло
          </a>
          <a className="btn ghost" href={VIBER}>
            Пиши ми във Viber
          </a>
          <a className="btn ghost" href={TEL}>
            0877 399 963
          </a>
        </p>
        <p className="sig">
          <span className="ln">
            <b>Ивайло Петев</b> · Pro Marketing
          </span>
          <span className="ln">0877 399 963 · emmgivailopetev38@gmail.com</span>
          <span className="ln">🌐 petevai.com · promarketing.pw</span>
        </p>
      </section>
    </main>
  );
}
