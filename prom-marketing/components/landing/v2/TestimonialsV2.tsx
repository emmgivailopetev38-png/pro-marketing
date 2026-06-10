"use client";
/* =====================================================================
   TestimonialsV2 — отзиви в езика „2050 · Luminescent Depth".
   6 отзива от ИЗМИСЛЕНИ фирми (консистентният набор): име на човек +
   фирма · индустрия · град, автентичен цитат (1–2 изр.), конкретен
   двоен резултат („+34% запитвания · –8ч/седм") и 5 звезди.

   Скин: depth-glass v2-card + ротиращ неонов conic ръб (v2-glow), с
   per-card акцентен hue (cyan / violet / mint), холографски v2-title и
   NeuralCore до хедъра като подпис — кохерентно с останалите v2 секции.

   Влизането се кара от .v2-reveal (от v2-design.css): локален
   IntersectionObserver добавя .is-in и стъпва staggera през inline --d,
   точно както предписва дизайн-системата. Клиентски компонент заради
   наблюдателя. ВСИЧКИ имена/фирми са ИЗМИСЛЕНИ — никога реални клиенти.
   ===================================================================== */
import { useEffect, useRef } from "react";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";

interface Testimonial {
  initials: string;
  name: string;
  role: string;
  company: string;
  industry: string;
  city: string;
  text: string;
  result: string;
  accent: string;
}

/* Консистентният набор от ИЗМИСЛЕНИ фирми (вж. SocialProofV2). */
const TESTIMONIALS: Testimonial[] = [
  {
    initials: "АП",
    name: "Андрей Петков",
    role: "Управител",
    company: "Хотел Аврора",
    industry: "Хотелиерство",
    city: "Бургас",
    text: "AI рецепционистът поема запитванията през нощта и в почивните дни — преди тогава просто губехме резервациите. Сега нито едно обаждане не остава без отговор.",
    result: "+34% уловени запитвания · –8ч/седм",
    accent: "var(--v2-cyan)",
  },
  {
    initials: "МГ",
    name: "Милена Георгиева",
    role: "Собственик",
    company: "Ресторант Веда",
    industry: "Ресторант",
    city: "София",
    text: "В пиковите часове никой нямаше време да вдига телефона. AI агентът записва масите вместо нас и връща клиенти с навременни оферти — залата е пълна и във вторник.",
    result: "+27% резервации · 0 пропуснати обаждания",
    accent: "var(--v2-violet-2)",
  },
  {
    initials: "КИ",
    name: "Калин Илиев",
    role: "Основател",
    company: "Бутик Нова",
    industry: "E-commerce",
    city: "Пловдив",
    text: "Чат-продавачът съветва и затваря поръчки, докато спя, а изоставените колички вече се връщат сами. За три месеца оборотът скочи, без да наемам нов човек.",
    result: "+22% конверсия · –10ч/седм ръчна работа",
    accent: "var(--v2-mint)",
  },
  {
    initials: "ДС",
    name: "Десислава Стоянова",
    role: "Брокер",
    company: "Имоти Хоризонт",
    industry: "Имоти",
    city: "Варна",
    text: "AI квалификацията отсява сериозните купувачи от любопитните и записва огледите директно в календара ми. Спрях да гоня студени контакти — говоря само с горещи лийда.",
    result: "+40% горещи лийда · моментален отговор",
    accent: "var(--v2-cyan)",
  },
  {
    initials: "НД",
    name: "Николай Демирев",
    role: "Управител",
    company: "Авто Сервиз Делта",
    industry: "Сервиз",
    city: "Стара Загора",
    text: "Записването на часове и напомнянията вървят автоматично — клиентите спряха да забравят, а аз спрях да губя време по телефона. Графикът най-сетне е под контрол.",
    result: "–60% неявявания · 0 изпуснати обаждания",
    accent: "var(--v2-violet-2)",
  },
  {
    initials: "ВТ",
    name: "Виктория Тодорова",
    role: "Собственик",
    company: "Клиника Лумина",
    industry: "Красота",
    city: "Пловдив",
    text: "Клиентите си запазват час сами по всяко време, а системата сама връща тези, които не са идвали отдавна. Графикът е запълнен седмици напред, без да вдигам телефона.",
    result: "+30% запълнен график · реактивирани клиенти",
    accent: "var(--v2-mint)",
  },
];

export function TestimonialsV2() {
  /* Локален наблюдател: добавя .is-in на всеки .v2-reveal в секцията,
     щом влезе във вюпорта — staggera се кара от inline --d. */
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>(".v2-reveal")
    );

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="v2-section overflow-hidden">
      {/* Подписов depth-glow фон (огледало на радиалния wash в сестринските секции) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 70% 25%, var(--v2-glow-cyan) 0%, transparent 52%), radial-gradient(ellipse at 25% 85%, var(--v2-glow-violet) 0%, transparent 52%)",
          opacity: 0.15,
        }}
      />

      <div className="v2-wrap">
        {/* ---- Хедър + подписово неврално ядро -------------------------- */}
        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="v2-reveal v2-head mb-0">
            <span className="v2-eyebrow">{"// какво казват клиентите"}</span>
            <h2 className="v2-title" lang="bg">
              Реални резултати, реални хора.
            </h2>
            <p className="v2-sub">
              Без счупени метрики и дълги PR разкази. Само какво се промени в
              бизнеса им, откакто AI екипът поe рутината.
            </p>
          </div>

          <div
            className="v2-reveal relative mx-auto hidden h-[300px] w-[300px] shrink-0 lg:block"
            style={{ ["--d" as never]: "0.12s" }}
            aria-hidden
          >
            <NeuralCore nodeCount={170} radius={1.25} spin={0.8} />
          </div>
        </div>

        {/* ---- Решетка с отзиви ----------------------------------------- */}
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <article
              key={t.name}
              className="v2-reveal v2-card v2-glow group flex h-full flex-col"
              style={{
                ["--v2-c" as never]: t.accent,
                ["--d" as never]: `${(i % 3) * 0.09 + (i >= 3 ? 0.06 : 0)}s`,
              }}
            >
              {/* Акцентна лента — над собствения top sheen на картата */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 z-[1] h-0.5 opacity-70"
                style={{
                  background: `linear-gradient(90deg, ${t.accent} 0%, transparent 80%)`,
                }}
              />

              {/* 5 звезди */}
              <div
                className="mb-4 flex gap-0.5 text-sm"
                style={{ color: t.accent }}
                aria-label="5 от 5 звезди"
              >
                {[0, 1, 2, 3, 4].map((s) => (
                  <span key={s} aria-hidden>
                    ★
                  </span>
                ))}
              </div>

              {/* Цитат */}
              <p className="mb-5 text-sm leading-relaxed text-[var(--v2-muted)] md:text-[15px]">
                „{t.text}"
              </p>

              {/* Резултат — двоен метричен чип */}
              <div
                className="mb-5 inline-flex max-w-full items-center gap-2 self-start rounded-full border px-3 py-1.5"
                style={{
                  borderColor: `color-mix(in srgb, ${t.accent} 40%, transparent)`,
                  background: `color-mix(in srgb, ${t.accent} 12%, transparent)`,
                }}
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: t.accent, boxShadow: `0 0 8px ${t.accent}` }}
                />
                <span
                  className="v2-mono text-[12px] font-bold leading-tight"
                  style={{ color: t.accent }}
                >
                  {t.result}
                </span>
              </div>

              {/* Футър: аватар + име — закотвен долу */}
              <div className="mt-auto flex items-center gap-3 border-t border-[var(--v2-line)] pt-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: `color-mix(in srgb, ${t.accent} 22%, transparent)`,
                    color: t.accent,
                    fontFamily: "var(--v2-font-display)",
                  }}
                >
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--v2-ink)]">
                    {t.name}
                  </p>
                  <p className="truncate text-[11px] text-[var(--v2-faint)]">
                    {t.company} · {t.industry} · {t.city}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* ---- Долна лента на доверие ----------------------------------- */}
        <div
          className="v2-reveal mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-[var(--v2-line)] pt-10 text-center"
          style={{ ["--d" as never]: "0.1s" }}
        >
          <p className="v2-mono text-[10px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">
            Доверие от собственици на бизнеси в:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[var(--v2-muted)]">
            <span>Хотелиерство</span>
            <span className="text-[var(--v2-faint)]">·</span>
            <span>Ресторанти</span>
            <span className="text-[var(--v2-faint)]">·</span>
            <span>E-commerce</span>
            <span className="text-[var(--v2-faint)]">·</span>
            <span>Имоти</span>
            <span className="text-[var(--v2-faint)]">·</span>
            <span>Сервизи</span>
            <span className="text-[var(--v2-faint)]">·</span>
            <span>Красота</span>
          </div>
        </div>
      </div>
    </section>
  );
}
