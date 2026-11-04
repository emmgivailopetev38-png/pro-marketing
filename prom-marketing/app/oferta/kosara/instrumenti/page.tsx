/**
 * Оферта №2 за Галина Трендафилова — Kosara.bg, 04.11.2026: по-лекият вариант „само инструментите“.
 *
 * Контекст: първата оферта (/oferta/kosara — AI система на 3 работни места, 800 € без ДДС) ѝ хареса като видео, но
 * на 04.11 във Viber написа: „Няма да бързам с инсталации… по-скоро срещу заплащане да настроим Claude на три
 * компютъра, без да интегрираме засега“ и „Към момента не ми е нужна такава система, но може да настроим отделните
 * инструменти за работата, която ми е нужна“. Затова: не по-ниска цена за същото, а по-малък обхват — Claude на трите
 * компютъра + само избраните от трите инструмента (снимки за сайта, постове, видео с дете), без връзка със сайта.
 * Цените са в TIERS (без ДДС, общо за трите компютъра); плащане 50/50. Абонаментите са на нейно име — сумите са същите
 * като в имейла от 03.11 (Claude Pro ≈ 22 €/мес на компютър, Google AI Pro ≈ 22 €/мес само за видеата).
 * Обръщението е на „ти“. Без цифри за резултати и без отзиви.
 */

import type { Metadata } from "next";
import { CSS } from "../kosara-css";

export const metadata: Metadata = {
  title: "Инструментите за Kosara — по избор · за Галина · Pro Marketing",
  description:
    "Claude на трите компютъра на Kosara.bg и само инструментите, които избереш: снимките за сайта, постовете за мрежите и видеата с дете в дрехата — без система и без връзка със сайта.",
  robots: { index: false, follow: false },
};

const PDF = "/oferta/kosara/ProMarketing-Kosara-instrumenti.pdf";
const TEL = "tel:+359877399963";
const VIBER = "viber://chat?number=%2B359877399963";
const VIDEO_PAGE = "https://promarketing.pw/oferta/kosara";

const EXTRA_CSS = `
.fh-doc .cty.go{border:2px solid var(--teal);background:var(--teal-soft)}
.fh-doc .cty .flag{font-family:var(--fh-mono),monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--amber-ink)}
.fh-doc .item .pr a{font-weight:600}
@media print{
  .fh-doc .cty .flag{font-size:9.5px}
  .fh-doc .cty.go{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
`;

const TOOLS = [
  {
    tag: "Инструмент 1 · снимките",
    h: "Снимките за сайта — с верните цветове",
    p: "Колегите пускат необработените снимки, а те минават през Photoshop с настройки за Kosara: изрязване, фон, размер за сайта и цвят като на истинската дреха — по ваши образци. Обработката е класическа, без генериране, затова Instagram няма повод да слага етикет „AI“. Claude пише и описанието на продукта.",
    pr: "За колегите, които качват продуктите · 20–100 на ден",
  },
  {
    tag: "Инструмент 2 · постовете",
    h: "Постовете за мрежите — от линка на продукта",
    p: "Даваш линк към продукта и получаваш текст за Facebook, Instagram и TikTok в стила на Kosara — с хаштагове и идея за снимката или видеото. Кажеш „тази седмица — якета“ и получаваш постовете за цялата седмица. Публикуваш ти, когато решиш.",
    pr: "2–3 поста на ден — за минути",
  },
  {
    tag: "Инструмент 3 · видеата",
    h: "Видео с дете в дрехата — като това с роклята",
    p: "Линк към продукта — и реалистично видео с дете-модел в дрехата: без глас, само със субтитри, с логото, сайта и телефона на Kosara накрая. Маркирано като AI, както изискват законът и мрежите.",
    pr: "video",
  },
];

const TIERS = [
  { flag: "Пакет 1", h: "Един инструмент", eur: 350, d: "Избираш един — например снимките за сайта или видеата." },
  { flag: "Пакет 2", h: "Два инструмента", eur: 550, d: "Например снимките и постовете — ежедневната работа на екипа.", go: true },
  { flag: "Пакет 3", h: "И трите", eur: 700, d: "Снимките, постовете и видеата — всичко, за което говорихме." },
];

const INCL: [string, string][] = [
  ["✓", "Claude на трите компютъра — на твое име, с правилата на Kosara: тон, марка, продукти"],
  ["✓", "Избраните инструменти — настроени и пробвани с ваши продукти"],
  ["✓", "Обучение онлайн за тримата — около час, плюс кратка инструкция за всеки инструмент"],
  ["✓", "Проверка след седмица — какво да донастроим"],
  ["✓", "Без връзка със сайта и без достъп до системите ви"],
];

const TERMS: [string, string][] = [
  ["1", "50 % при твоето „да“"],
  ["2", "50 % когато инструментите работят и си доволна"],
  ["→", "Абонаментите са на твое име: Claude Pro ≈ 22 € с ДДС на месец на компютър; за видеата и Google AI Pro ≈ 22 € на месец"],
  ["→", "Добавяш инструмент по-късно — доплащаш само разликата до следващия пакет"],
  ["→", "Пълната система от първата оферта остава възможност за по-нататък"],
];

const STEPS = [
  { b: "Стъпка 1", h: "Номерата", p: "Пишеш ми кои инструменти искаш — например „1 и 3“. По имейл или във Viber." },
  { b: "Стъпка 2", h: "Настройката", p: "Настройваме ги на трите компютъра — на място или онлайн, за един ден." },
  { b: "Стъпка 3", h: "Обучението", p: "Около час онлайн за теб и двамата колеги — всеки пробва сам." },
  { b: "Стъпка 4", h: "Работи", p: "Инструментите работят и си доволна — плащаш втората половина.", go: true },
];

const eur = (n: number) => `${n.toLocaleString("bg-BG")} €`;

export default function KosaraInstrumentiPage() {
  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS + EXTRA_CSS }} />

      <header className="masthead">
        <p className="eyebrow">За Галина · Kosara.bg · по-лекият вариант · 04.11.2026</p>
        <h1>
          Само инструментите, <em>които ви трябват всеки ден</em> — без система и без интеграция.
        </h1>
        <p className="deck">
          Както си писахме във Viber: настройваме Claude на трите компютъра и само инструментите, които избереш. Нищо не
          се свързва със сайта и нищо не излиза без теб — контролът остава изцяло при теб.
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
          <p className="kick">Избери</p>
          <h2 className="h2sub">Три инструмента — вземаш само нужните</h2>
        </div>
        <div className="cat three">
          {TOOLS.map((t) => (
            <article className="item" key={t.h}>
              <span className="tag">{t.tag}</span>
              <h3>{t.h}</h3>
              <p>{t.p}</p>
              <p className="pr">
                {t.pr === "video" ? (
                  <>
                    Виж видеото с роклята: <a href={VIDEO_PAGE}>promarketing.pw/oferta/kosara</a>
                  </>
                ) : (
                  t.pr
                )}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sechead">
          <p className="kick">Цената</p>
          <h2 className="h2sub">Плащаш само за избраните — за трите компютъра заедно</h2>
          <p className="lead">
            Цената е еднократна и е обща за трите работни места, не на компютър. Във всеки пакет влизат настройката на
            Claude, обучението и проверката след седмица.
          </p>
        </div>
        <div className="countries">
          {TIERS.map((t) => (
            <article className={`cty${t.go ? " go" : ""}`} key={t.h}>
              <span className="flag">{t.flag}</span>
              <h3>{t.h}</h3>
              <p className="p">
                {eur(t.eur)}
                <small>без ДДС</small>
              </p>
              <p className="d">
                {eur(Math.round(t.eur * 1.2))} с ДДС · {t.d}
              </p>
            </article>
          ))}
        </div>
        <div className="deal">
          <div className="terms">
            <h3>Във всеки пакет</h3>
            <ul className="list">
              {INCL.map(([i, t]) => (
                <li key={t}>
                  <i>{i}</i>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="terms">
            <h3>Плащане и абонаменти</h3>
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

      <section>
        <div className="sechead">
          <p className="kick">Как тръгваме</p>
          <h2 className="h2sub">От номерата до работещи инструменти — за няколко дни</h2>
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

      <section className="closing">
        <h2>Следващата стъпка</h2>
        <p>
          Пиши ми само номерата на инструментите — например „1 и 3“ — и уговаряме деня за настройката. Ако искаш първо да
          ги видиш на живо, звънни ми на 0877 399 963 и ти ги показвам за 20 минути.
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
