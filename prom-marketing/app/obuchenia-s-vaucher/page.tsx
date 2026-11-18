/* ---------------------------------------------------------------------------
   /obuchenia-s-vaucher — „Обучения с ваучер от Агенцията по заетостта“ (18.11.2026).

   Страницата, която Агенцията по заетостта иска от всеки доставчик на обучение
   (ДОб) по ключови компетентности: работещ сайт с актуална информация за
   обученията с ваучери (Указания за ДОб, РД-01-256/14.08.2025). Линкът влиза в
   регистрацията на training.az.government.bg.

   Честно: докато Агенцията не ни впише, пише „кандидатстваме за вписване“.
   След одобрението — сменя се STATUS (и датата).
   Визуалният език е този на началната страница (app/v2/v2-design.css). Сървърен компонент.
--------------------------------------------------------------------------- */
import type { Metadata } from "next";
import { Check } from "lucide-react";
import "../v2/v2-design.css";
import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

const TITLE = "Обучения с ваучер от Агенцията по заетостта · ProMarketing";
const DESCRIPTION =
  "Безплатни обучения с ваучер по ключови компетентности: „Изкуствен интелект в работата“ (30 учебни часа) и „Цифрова компетентност“ по DigComp — онлайн на живо, с изпит и документ.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/obuchenia-s-vaucher" },
  openGraph: { title: "Обучения с ваучер — изкуствен интелект и цифрови умения", description: DESCRIPTION, url: "/obuchenia-s-vaucher", locale: "bg_BG", type: "website" },
};

/** Сменя се, когато Агенцията ни впише в списъка на доставчиците. */
const STATUS =
  "ПроМаркетинг ЕООД кандидатства за вписване в списъка на доставчиците на обучение по ключови компетентности на Агенцията по заетостта. След вписването ще можете да изберете нас за обучението по вашия ваучер.";

const COURSES = [
  {
    kk: "Ключова компетентност 3",
    title: "Изкуствен интелект в работата — данни, автоматизация и решения, основани на факти",
    hours: "30 учебни часа",
    points: [
      "ИИ асистенти за писма, обобщения, отчети и решаване на проблеми — с проверка на резултата",
      "Анализ на таблици и данни с ИИ: проценти, тенденции, графики",
      "Автоматизация на рутинни задачи и сметка колко време спестява",
      "Лични данни (GDPR) и Регламентът на ЕС за изкуствения интелект",
    ],
    exam: "Писмен изпит (тест и практическа задача) и документ за придобита ключова компетентност.",
  },
  {
    kk: "Ключова компетентност 4",
    title: "Цифрова компетентност по Европейската рамка DigComp — нива базово, средно, напреднало и високоспециализирано",
    hours: "по утвърдените програми за всяко ниво",
    points: [
      "Информация и данни, комуникация и сътрудничество",
      "Създаване на цифрово съдържание, включително основи на програмирането",
      "Безопасност и киберсигурност, решаване на проблеми",
    ],
    exam: "Изпит в Единния сертификационен център за цифрова компетентност и сертификат за придобито ниво.",
  },
];

const STEPS = [
  "Подаваш заявление за ваучер в портала на Агенцията по заетостта — за заети по трудово или служебно правоотношение и за самостоятелно заети лица.",
  "След одобрението избираш доставчик на обучение от списъка на Агенцията и сключваш договор за обучението.",
  "Учиш онлайн на живо с преподавател, полагаш изпита и получаваш документ. Обучението е безплатно за теб — плаща се с ваучера.",
];

const HOW = [
  "Онлайн в реално време (синхронно) с преподавател през лицензирана видеоконферентна платформа",
  "Учебни материали и задачи в електронната учебна платформа на ПроМаркетинг",
  "Групи до 20 души, по 3–4 учебни часа на ден, в удобно за работещите време",
  "Присъствието се отчита по протокола на платформата; документ след успешен изпит",
];

const sectionPad = { paddingBlock: "clamp(44px, 7vw, 88px)" } as const;

export default function ObucheniaSVaucherPage() {
  return (
    <div data-v2 className="v2-scope min-h-screen" style={{ background: "var(--v2-void)", color: "var(--v2-ink)", overflowX: "clip" }}>
      <header className="sticky top-0 z-50" style={{ background: "rgba(4,6,13,0.92)", backdropFilter: "blur(10px)" }}>
        <div className="v2-wrap flex items-center justify-between gap-3 py-3">
          <Link href="/" aria-label="ProMarketing — начало">
            <Logo markId="pm-vaucher" />
          </Link>
          <a href="#kontakti" className="v2-btn shrink-0 !px-4 !py-2.5 !text-[13px] sm:!px-5">Контакти</a>
        </div>
      </header>

      <main>
        <section className="v2-section relative overflow-hidden" style={{ paddingBlock: "clamp(36px, 7vw, 88px)" }}>
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0"
            style={{ background: "radial-gradient(90vw 60vh at 15% 10%, rgba(124,58,237,0.22), transparent 60%), radial-gradient(80vw 60vh at 90% 80%, rgba(34,211,238,0.14), transparent 60%)" }} />
          <div className="v2-wrap relative z-10">
            <p className="v2-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-[var(--v2-cyan)] sm:text-xs">
              Ваучери за обучение · Агенция по заетостта · Програма „Развитие на човешките ресурси“ 2021–2027
            </p>
            <h1 className="mt-4 font-display text-[clamp(30px,5.6vw,56px)] font-extrabold leading-[1.06] tracking-tight" lang="bg" style={{ overflowWrap: "break-word", hyphens: "auto" }}>
              Обучения по <span className="v2-grad">изкуствен интелект</span> и цифрови умения с ваучер
            </h1>
            <p className="v2-sub mt-5 max-w-3xl">
              Безплатно за обучаемия — плаща се с ваучер от Агенцията по заетостта. Онлайн на живо, с изпит и документ.
            </p>
            <p className="mt-6 max-w-3xl rounded-2xl border border-[var(--v2-line-bright)] px-5 py-4 text-[15px] leading-relaxed text-[var(--v2-muted)]" style={{ background: "var(--v2-bg-2)" }}>
              <strong className="text-[var(--v2-ink)]">Статус · ноември 2026:</strong> {STATUS}
            </p>
          </div>
        </section>

        <section className="v2-section" style={sectionPad}>
          <div className="v2-wrap">
            <div className="v2-head" style={{ marginBottom: "clamp(24px, 4vw, 40px)" }}>
              <p className="v2-eyebrow">Обученията</p>
              <h2 className="v2-title-plain !text-[clamp(26px,4.2vw,44px)]">Какво предлагаме</h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {COURSES.map((c) => (
                <article key={c.kk} className="v2-card">
                  <p className="v2-mono text-[11px] uppercase tracking-[0.14em] text-[var(--v2-cyan)]">{c.kk} · {c.hours}</p>
                  <h3 className="mt-3 font-display text-[clamp(19px,2.4vw,24px)] font-bold leading-snug">{c.title}</h3>
                  <ul className="mt-4 grid gap-2.5">
                    {c.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-[15px] leading-relaxed">
                        <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--v2-mint)" }} aria-hidden />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 border-t border-[var(--v2-line)] pt-4 text-[14px] leading-relaxed text-[var(--v2-muted)]">{c.exam}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="v2-section" style={sectionPad}>
          <div className="v2-wrap">
            <div className="v2-head" style={{ marginBottom: "clamp(24px, 4vw, 40px)" }}>
              <p className="v2-eyebrow">3 стъпки</p>
              <h2 className="v2-title-plain !text-[clamp(26px,4.2vw,44px)]">Как става с ваучер</h2>
            </div>
            <ol className="grid gap-4 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={i} className="v2-card">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full font-display text-lg font-bold text-[#04121a]" style={{ background: "var(--v2-grad-accent)" }}>{i + 1}</span>
                  <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--v2-ink)]">{s}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[14px] text-[var(--v2-muted)]">
              Повече за ваучерите:{" "}
              <a href="https://az.government.bg/pages/kvalifikacija-umenija-i-karierno-razvitie-na-zaeti-lica/" target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--v2-line-bright)] underline-offset-4">
                страницата на Агенцията по заетостта
              </a>
              .
            </p>
          </div>
        </section>

        <section className="v2-section" style={sectionPad}>
          <div className="v2-wrap grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="v2-head !mb-0">
              <p className="v2-eyebrow">Организация</p>
              <h2 className="v2-title-plain !text-[clamp(26px,4.2vw,44px)]">Как се провежда</h2>
              <p className="v2-sub">Преподавател: Ивайло Петев — практик по внедряване на изкуствен интелект, автоматизации и CRM системи за малки и средни фирми.</p>
            </div>
            <ul className="v2-card grid gap-4">
              {HOW.map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15.5px] leading-relaxed">
                  <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--v2-mint)" }} aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="kontakti" className="v2-section" style={sectionPad}>
          <div className="v2-wrap">
            <div className="v2-card grid gap-2 text-[15.5px] leading-relaxed">
              <p className="v2-eyebrow">Контакти</p>
              <p className="font-display text-xl font-bold">ПроМаркетинг ЕООД</p>
              <p className="text-[var(--v2-muted)]">ЕИК 207223552 · гр. Русе 7000, ул. „Цар Асен I“ № 31</p>
              <p>
                <a href="tel:+359877399963" className="underline decoration-[var(--v2-line-bright)] underline-offset-4">0877 399 963</a>
                {" · "}
                <a href="mailto:emmgivailopetev38@gmail.com" className="underline decoration-[var(--v2-line-bright)] underline-offset-4">emmgivailopetev38@gmail.com</a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
