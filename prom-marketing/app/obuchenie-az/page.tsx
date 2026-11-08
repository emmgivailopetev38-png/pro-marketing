/* ---------------------------------------------------------------------------
   /obuchenie-az — „AI обучение за екипа ти — платено от държавата“ (08.11.2026).

   Лендинг за платения трафик от Meta: проект „Специфични умения за работната
   сила“ на Агенцията по заетостта (ПРЧР 2021–2027), срок 16.11.2026, 16:00.
   Една цел — телефонът. Формата праща към /api/leads/obuchenie-az, картонът
   влиза в CRM-а с source „sait-obuchenie-az“ и Ели звъни до минути
   (профилът е в lib/voice/auto-call-rules.ts → FORM_PROFILES).

   Визуалният език е този на началната страница (app/v2/v2-design.css).
   Сървърен компонент; в браузъра тръгват само броячът и формата.
--------------------------------------------------------------------------- */
import type { Metadata } from "next";
import { Check, ShieldAlert, X } from "lucide-react";
import "../v2/v2-design.css";
import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { Countdown } from "@/components/obuchenie-az/Countdown";
import { ObuchenieAzForm } from "@/components/obuchenie-az/ObuchenieAzForm";

const TITLE = "AI обучение за екипа ти — платено от държавата · ProMarketing";
const DESCRIPTION =
  "Държавата плаща 100 % AI обучението на екипа ти: до 1 278,23 € на човек и до 15 338,76 € на фирма. Ние подготвяме заявлението, ти подписваш с КЕП. Срок: 16.11.2026, 16:00 ч.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/obuchenie-az" },
  openGraph: {
    title: "Държавата плаща 100 % AI обучението на екипа ти",
    description: DESCRIPTION,
    url: "/obuchenie-az",
    locale: "bg_BG",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Държавата плаща 100 % AI обучението на екипа ти", description: DESCRIPTION },
};

const STEPS = [
  "Оставяш телефон — звъним до минути и проверяваме допустимостта на фирмата (2 минути).",
  "Ние пишем цялото заявление и приложенията по длъжностите на твоите хора. Ти подписваш с КЕП и го пращаш през ССЕВ — една стъпка.",
  "След одобрение от Агенцията: обучението на екипа ти (24 учебни часа, 4 на място + 20 онлайн на живо), сертификат за всеки, 100 % от сумата се възстановява на фирмата.",
];

const ELIGIBLE = [
  "Всяка фирма, ЕТ или самоосигуряващо се лице (и управител на ЕООД без служители)",
  "Служители на трудов договор от 4 часа нагоре или на договор за управление",
  "Без обучения с публични средства през 2026 г.",
];
const NOT_ELIGIBLE = "Не: общини, училища и университети, първично земеделие и рибарство; хора на граждански договор";

const MODULES = [
  { n: "01", t: "AI агент, който отговаря на клиентите", d: "по вашите процеси и вашите въпроси" },
  { n: "02", t: "Автоматизации вместо ръчна работа", d: "имейл, календар, формуляри, таблици, телефония" },
  { n: "03", t: "Данни, сигурност и EU AI Act", d: "какво може и какво не" },
  { n: "04", t: "Внедряване на работното място", d: "всеки си пуска своя агент и мери резултата" },
];

const FAQ = [
  {
    q: "Трябва ли фирмата да плаща нещо?",
    a: "Не. При одобрение Агенцията възстановява 100 % от стойността на обучението (до праговете). Фирмата плаща на обучителя след обучението и получава сумата обратно по искане за плащане.",
  },
  { q: "Може ли само аз, без служители?", a: "Да — самоосигуряващите се и управителите на договор за управление са допустими, до 1 278,23 €." },
  {
    q: "Какво ми трябва за заявлението?",
    a: "ЕИК, списък на хората с длъжности, длъжностните характеристики (подписани, с дата), КЕП и профил в ССЕВ. Всичко останало пишем ние.",
  },
  {
    q: "Къде и кога е обучението?",
    a: "Смесена форма: 4 учебни часа при вас (или в Русе), 20 часа онлайн на живо, в удобни за екипа дни — до лятото на 2027 г.",
  },
  {
    q: "Защо е „специфично“ обучение?",
    a: "Защото е по конкретните длъжности и процеси на фирмата, не общ курс по компютри — така го изисква проектът и така го пишем.",
  },
];

function Cta({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <a href="#forma" className="v2-btn v2-btn-primary is-lg w-full justify-center sm:w-auto">
        Провери дали фирмата ти е допустима
        <span aria-hidden className="v2-arrow">
          →
        </span>
      </a>
      <p className="mt-3 text-[13px] text-[var(--v2-faint)]">
        Звъним до минути в делник 10:00–18:00 ·{" "}
        <a href="tel:+359876447159" className="text-[var(--v2-muted)] underline decoration-[var(--v2-line-bright)] underline-offset-4">
          0876 447 159
        </a>
      </p>
    </div>
  );
}

const sectionPad = { paddingBlock: "clamp(48px, 8vw, 96px)" } as const;

export default function ObuchenieAzPage() {
  return (
    <div data-v2 className="v2-scope min-h-screen" style={{ background: "var(--v2-void)", color: "var(--v2-ink)", overflowX: "clip" }}>
      {/* overflow-x: clip (не hidden от .v2-scope) — иначе лепкавата лента със срока не лепне. */}
      {/* v2-design.css слага overflow-x: hidden на html/body — това чупи лепкавата лента; clip пази същото без скрол контейнер. */}
      <style>{"html{scroll-behavior:smooth}html,body{overflow-x:clip}"}</style>

      <header className="sticky top-0 z-50" style={{ background: "rgba(4,6,13,0.92)", backdropFilter: "blur(10px)" }}>
        <Countdown />
        <div className="v2-wrap flex items-center justify-between gap-3 py-3">
          <Link href="/" aria-label="ProMarketing — начало">
            <Logo markId="pm-az" />
          </Link>
          <a href="#forma" className="v2-btn shrink-0 !px-4 !py-2.5 !text-[13px] sm:!px-5">
            <span className="sm:hidden">Провери</span>
            <span className="hidden sm:inline">Провери допустимостта</span>
          </a>
        </div>
      </header>

      <main>
        {/* ГЕРОЙ */}
        <section className="v2-section relative overflow-hidden" style={{ paddingBlock: "clamp(36px, 7vw, 88px)" }}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(90vw 60vh at 15% 10%, rgba(124,58,237,0.22), transparent 60%), radial-gradient(80vw 60vh at 90% 80%, rgba(34,211,238,0.14), transparent 60%)",
            }}
          />
          <div className="v2-wrap grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <div>
              <p className="v2-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-[var(--v2-cyan)] sm:text-xs">
                Проект „Специфични умения за работната сила“ · Агенция по заетостта · ПРЧР 2021–2027
              </p>
              <h1
                className="mt-4 font-display text-[clamp(32px,6vw,60px)] font-extrabold leading-[1.05] tracking-tight"
                lang="bg"
                style={{ overflowWrap: "break-word", hyphens: "auto" }}
              >
                Държавата плаща <span className="v2-grad">100 %</span> AI обучението на екипа ти
              </h1>
              <p className="v2-sub mt-5">
                До <strong className="text-[var(--v2-ink)]">1 278,23 € на човек</strong> и до{" "}
                <strong className="text-[var(--v2-ink)]">15 338,76 € на фирма</strong> се възстановяват изцяло. Ние подготвяме
                заявлението, ти само подписваш с КЕП. Срок за заявления:{" "}
                <strong className="text-[var(--v2-ink)]">16.11.2026, 16:00 ч.</strong>
              </p>
              <Cta className="mt-8" />
            </div>

            <div className="v2-card grid grid-cols-2 gap-px overflow-hidden !p-0" style={{ background: "var(--v2-line)" }}>
              {[
                ["100 %", "възстановени на фирмата"],
                ["1 278,23 €", "на човек"],
                ["15 338,76 €", "на фирма"],
                ["16.11 · 16:00", "срок за заявление"],
              ].map(([big, small]) => (
                <div key={big} className="p-4 sm:p-7" style={{ background: "var(--v2-bg-2)" }}>
                  <p className="whitespace-nowrap text-[clamp(21px,5.6vw,32px)] font-extrabold leading-tight tracking-tight text-[var(--v2-ink)]">{big}</p>
                  <p className="mt-1 text-[13px] text-[var(--v2-muted)]">{small}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* КАК СТАВА */}
        <section className="v2-section" style={sectionPad}>
          <div className="v2-wrap">
            <div className="v2-head" style={{ marginBottom: "clamp(24px, 4vw, 40px)" }}>
              <p className="v2-eyebrow">3 стъпки</p>
              <h2 className="v2-title-plain !text-[clamp(26px,4.2vw,44px)]">Как става</h2>
            </div>
            <ol className="grid gap-4 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={i} className="v2-card">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full font-display text-lg font-bold text-[#04121a]"
                    style={{ background: "var(--v2-grad-accent)" }}
                  >
                    {i + 1}
                  </span>
                  <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--v2-ink)]">{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* КОЙ Е ДОПУСТИМ */}
        <section className="v2-section" style={sectionPad}>
          <div className="v2-wrap grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="v2-head !mb-0">
              <p className="v2-eyebrow">Допустимост</p>
              <h2 className="v2-title-plain !text-[clamp(26px,4.2vw,44px)]">Кой е допустим</h2>
              <p className="v2-sub">Не си сигурен? Остави телефон — проверяваме го заедно за 2 минути.</p>
            </div>
            <ul className="v2-card grid gap-4">
              {ELIGIBLE.map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15.5px] leading-relaxed">
                  <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--v2-mint)" }} aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
              <li className="flex items-start gap-3 border-t border-[var(--v2-line)] pt-4 text-[15.5px] leading-relaxed text-[var(--v2-muted)]">
                <X className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#f87171" }} aria-hidden />
                <span>{NOT_ELIGIBLE}</span>
              </li>
            </ul>
          </div>
        </section>

        {/* КАКВО УЧИ ЕКИПЪТ */}
        <section className="v2-section" style={sectionPad}>
          <div className="v2-wrap">
            <div className="v2-head" style={{ marginBottom: "clamp(24px, 4vw, 40px)" }}>
              <p className="v2-eyebrow">24 учебни часа</p>
              <h2 className="v2-title-plain !text-[clamp(26px,4.2vw,44px)]">Какво учи екипът ти</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {MODULES.map((m) => (
                <div key={m.n} className="v2-card">
                  <p className="v2-mono text-xs text-[var(--v2-cyan)]">{m.n}</p>
                  <p className="mt-2 font-display text-lg font-bold leading-snug text-[var(--v2-ink)]">{m.t}</p>
                  <p className="mt-1 text-[15px] text-[var(--v2-muted)]">— {m.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-[var(--v2-muted)]">Обучението е индивидуално за фирмата и длъжностите — така го изисква проектът.</p>
            <Cta className="mt-8" />
          </div>
        </section>

        {/* ЗАЩО PROMARKETING */}
        <section className="v2-section" style={sectionPad}>
          <div className="v2-wrap">
            <div className="v2-card v2-glow is-always max-w-4xl">
              <p className="v2-eyebrow">Защо ProMarketing</p>
              <p className="mt-4 text-[16.5px] leading-relaxed text-[var(--v2-ink)] sm:text-lg">
                Строим AI системи за български фирми всеки ден: Ели звъни на новите клиенти до минути, CRM с автоматични отчети,
                агенти за запитвания и оферти.
              </p>
              <p className="mt-3 text-[16px] leading-relaxed text-[var(--v2-muted)]">
                Обучаваме върху реалните процеси на твоята фирма, не върху теория. Академията на Ивайло Петев — видео уроци и
                групови сесии за хора, които строят AI системи.
              </p>
            </div>
          </div>
        </section>

        {/* ВАЖНО */}
        <section className="v2-section" style={{ paddingBlock: "clamp(8px, 2vw, 24px)" }}>
          <div className="v2-wrap">
            <div
              className="flex max-w-4xl items-start gap-4 rounded-[var(--v2-r)] p-5 sm:p-7"
              style={{ border: "1px solid rgba(251,191,36,0.35)", background: "rgba(251,191,36,0.07)" }}
            >
              <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0" style={{ color: "#fbbf24" }} aria-hidden />
              <div>
                <p className="font-display text-base font-bold text-[var(--v2-ink)]">Важно</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--v2-muted)]">
                  Одобрението е решение на Агенцията по заетостта — не го гарантираме. Парите се възстановяват на фирмата след
                  проведеното обучение и отчета. Срокът 16.11 е твърд — заявления след 16:00 ч. не се разглеждат.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ФОРМАТА */}
        <section id="forma" className="v2-section scroll-mt-28" style={sectionPad}>
          <div className="v2-wrap grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="v2-head !mb-0">
              <p className="v2-eyebrow">2 минути</p>
              <h2 className="v2-title-plain !text-[clamp(26px,4.2vw,44px)]">
                Провери дали фирмата ти е <span className="v2-grad">допустима</span>
              </h2>
              <p className="v2-sub">Оставяш телефон — звъним до минути, проверяваме допустимостта и ти казваме какво трябва за заявлението.</p>
            </div>
            <ObuchenieAzForm />
          </div>
        </section>

        {/* ВЪПРОСИ */}
        <section className="v2-section" style={sectionPad}>
          <div className="v2-wrap max-w-4xl">
            <div className="v2-head" style={{ marginBottom: "clamp(20px, 3vw, 32px)" }}>
              <p className="v2-eyebrow">Въпроси</p>
              <h2 className="v2-title-plain !text-[clamp(26px,4.2vw,44px)]">Често питат</h2>
            </div>
            <div className="grid gap-3">
              {FAQ.map((x) => (
                <details key={x.q} className="v2-card group !p-0">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-[var(--v2-ink)] sm:p-6 [&::-webkit-details-marker]:hidden">
                    {x.q}
                    <span aria-hidden className="text-xl text-[var(--v2-cyan)] transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-[var(--v2-muted)] sm:px-6 sm:pb-6">{x.a}</p>
                </details>
              ))}
            </div>
            <Cta className="mt-10" />
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--v2-line)] py-8">
        <div className="v2-wrap flex flex-col gap-2 text-sm text-[var(--v2-faint)] sm:flex-row sm:items-center sm:justify-between">
          <p>🌐 promarketing.pw · petevai.com · Pro Marketing LTD, Русе</p>
          <p>
            <Link href="/privacy" className="underline underline-offset-4 hover:text-[var(--v2-muted)]">
              Политика за поверителност
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
