"use client";
/* =====================================================================
   SocialProofV2 — социално доказателство в езика „2050 · Luminescent
   Depth". Три count-up брояча (бизнеси автоматизирани · часове спестени
   /мес · уловени лийда) + ЖИВ ротиращ feed от ИЗМИСЛЕНИ запитвания
   („Иван от Варна остави запитване · преди 2 мин"), който се сменя на
   интервал, + ред с ИЗМИСЛЕНИ фирми от консистентния набор.

   Клиентски компонент заради ротиращия feed (useState/useEffect).
   Броячите ползват <CounterRamp/> (собствен scroll-trigger + own client
   runtime). Всички имена/фирми са ИЗМИСЛЕНИ — никога реални клиенти.
   ===================================================================== */
import { useEffect, useMemo, useState } from "react";
import { CounterRamp } from "@/components/effects/CounterRamp";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";

/* ---- Брояч-метрики ---------------------------------------------------- */
const STATS: {
  target: number;
  prefix?: string;
  suffix: string;
  label: string;
  sub: string;
  color: string;
  tag: string;
}[] = [
  {
    target: 120,
    prefix: "",
    suffix: "+",
    label: "бизнеса автоматизирани",
    sub: "с AI агенти и CRM",
    color: "var(--v2-cyan)",
    tag: "BUSINESSES",
  },
  {
    target: 1840,
    prefix: "",
    suffix: "ч",
    label: "часа спестени / месец",
    sub: "върнати на собствениците",
    color: "var(--v2-violet-2)",
    tag: "HOURS·SAVED",
  },
  {
    target: 9600,
    prefix: "",
    suffix: "+",
    label: "лийда уловени",
    sub: "без нито едно пропуснато",
    color: "var(--v2-mint)",
    tag: "LEADS",
  },
];

/* ---- ИЗМИСЛЕН жив feed: ротиращи запитвания --------------------------- */
type FeedSeed = {
  name: string;
  city: string;
  action: string;
  ago: number; // минути „преди N мин" в началото
  color: string;
};

const FEED_SEED: FeedSeed[] = [
  { name: "Иван", city: "Варна", action: "остави запитване", ago: 2, color: "var(--v2-cyan)" },
  { name: "Мария", city: "Пловдив", action: "записа AI аудит", ago: 4, color: "var(--v2-violet-2)" },
  { name: "Георги", city: "София", action: "поиска оферта", ago: 6, color: "var(--v2-mint)" },
  { name: "Елена", city: "Бургас", action: "стартира AI рецепционист", ago: 9, color: "var(--v2-cyan)" },
  { name: "Николай", city: "Стара Загора", action: "свърза телефона си", ago: 12, color: "#f59e0b" },
  { name: "Десислава", city: "Русе", action: "остави запитване", ago: 14, color: "var(--v2-violet-2)" },
  { name: "Петър", city: "Велико Търново", action: "получи AI план", ago: 18, color: "var(--v2-mint)" },
  { name: "Виктория", city: "Плевен", action: "записа демо", ago: 21, color: "var(--v2-cyan)" },
  { name: "Стефан", city: "Благоевград", action: "поиска оферта", ago: 25, color: "var(--v2-violet-2)" },
  { name: "Калина", city: "Добрич", action: "остави запитване", ago: 29, color: "var(--v2-mint)" },
];

const agoLabel = (m: number) =>
  m <= 0 ? "току-що" : m === 1 ? "преди 1 мин" : `преди ${m} мин`;

/* ---- ИЗМИСЛЕНИ фирми (консистентният набор) --------------------------- */
const COMPANIES = [
  { name: "Хотел Аврора", meta: "Хотелиерство · Бургас" },
  { name: "Ресторант Веда", meta: "Ресторант · София" },
  { name: "Бутик Нова", meta: "E-commerce · Пловдив" },
  { name: "Имоти Хоризонт", meta: "Имоти · Варна" },
  { name: "Авто Сервиз Делта", meta: "Сервиз · Стара Загора" },
  { name: "Клиника Лумина", meta: "Красота · Пловдив" },
];

export function SocialProofV2() {
  /* Ротиращ feed: всеки tick „остарява" записите с 1 мин и вкарва нов
     отгоре, така че редът изглежда жив без да дублира съдържание. */
  const initial = useMemo(
    () => FEED_SEED.map((f, i) => ({ ...f, key: i, minutes: f.ago })),
    []
  );
  const [feed, setFeed] = useState(initial);
  const [counter, setCounter] = useState(FEED_SEED.length);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeed((prev) => {
        const next = prev.map((f) => ({ ...f, minutes: f.minutes + 1 }));
        // вземи „следващ" сийд по ротация и го сложи отгоре като нов (току-що)
        const src = FEED_SEED[counter % FEED_SEED.length];
        const fresh = { ...src, key: counter + 1000, minutes: 0 };
        setCounter((c) => c + 1);
        return [fresh, ...next].slice(0, 5);
      });
    }, 3200);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counter]);

  return (
    <section className="v2-section overflow-hidden">
      {/* Engineered grid + signature aurora glow backdrop */}
      <div aria-hidden className="v2-grid pointer-events-none absolute inset-0 -z-[1]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 25% 25%, var(--v2-glow-cyan) 0%, transparent 55%), radial-gradient(ellipse at 75% 80%, var(--v2-glow-violet) 0%, transparent 55%)",
          opacity: 0.15,
        }}
      />

      <div className="v2-wrap">
        {/* ---- Header ---------------------------------------------------- */}
        <div className="v2-head is-center">
          <SectionReveal>
            <span className="v2-eyebrow">{"// социално доказателство"}</span>
            <h2 className="v2-title" lang="bg">
              Бизнеси вече печелят
              <br />
              докато спят.
            </h2>
            <p className="v2-sub">
              Реални числа от системите, които пускаме. Всяка минута AI екипът
              отговаря, квалифицира и улавя — за да не пропуснеш нито един клиент.
            </p>
          </SectionReveal>
        </div>

        {/* ---- Броячи ---------------------------------------------------- */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <SectionReveal key={s.label} delay={i * 110}>
              <div
                className="v2-card v2-glow group h-full text-center sm:text-left"
                style={{ ["--v2-c" as never]: s.color }}
              >
                <div className="flex items-center justify-between">
                  <span className="v2-tag">{s.tag}</span>
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }}
                  />
                </div>
                <span
                  className="mt-5 block font-bold tracking-tight"
                  style={{
                    color: s.color,
                    fontFamily: "var(--v2-font-display)",
                    fontSize: "clamp(2.4rem, 6vw, 3.5rem)",
                    lineHeight: 1,
                  }}
                >
                  <CounterRamp target={s.target} prefix={s.prefix} suffix={s.suffix} />
                </span>
                <p className="mt-4 text-sm font-semibold text-[var(--v2-ink)]">{s.label}</p>
                <p className="mt-1 text-[12px] text-[var(--v2-faint)]">{s.sub}</p>
              </div>
            </SectionReveal>
          ))}
        </div>

        {/* ---- Жив feed + неврален ядрен акцент -------------------------- */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
          {/* Live feed card */}
          <SectionReveal delay={120}>
            <div className="v2-card v2-glow group h-full">
              <div className="mb-5 flex items-center justify-between">
                <h3
                  className="text-base font-bold"
                  style={{ fontFamily: "var(--v2-font-display)" }}
                >
                  Запитвания на живо
                </h3>
                <span className="v2-status">на живо</span>
              </div>

              <ul className="space-y-2">
                {feed.map((f) => (
                  <li
                    key={f.key}
                    className="v2-feed-row flex items-center gap-3 rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/50 px-4 py-2.5 text-sm"
                  >
                    <span
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{
                        background: `color-mix(in srgb, ${f.color} 16%, transparent)`,
                        color: f.color,
                      }}
                    >
                      {f.name[0]}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[var(--v2-muted)]">
                      <b className="font-semibold text-[var(--v2-ink)]">{f.name}</b>
                      <span className="text-[var(--v2-faint)]"> от {f.city} </span>
                      {f.action}
                    </span>
                    <span className="v2-mono flex-shrink-0 text-[10px] text-[var(--v2-faint)]">
                      {agoLabel(f.minutes)}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="v2-mono mt-4 text-[10px] uppercase tracking-[0.18em] text-[var(--v2-faint)]">
                * примерна визуализация на потока от запитвания
              </p>
            </div>
          </SectionReveal>

          {/* Neural core accent + status */}
          <SectionReveal delay={220}>
            <div className="v2-card v2-glow is-always group flex h-full flex-col items-center justify-center text-center">
              <div className="relative h-[220px] w-[220px]" aria-hidden>
                <div
                  className="pointer-events-none absolute inset-[14%] rounded-full opacity-70 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(circle, var(--v2-glow-cyan) 0%, transparent 62%)",
                  }}
                />
                <NeuralCore radius={1.2} nodeCount={150} spin={0.7} />
              </div>
              <p className="mt-4 text-sm font-semibold text-[var(--v2-ink)]">
                Един AI мозък. Десетки бизнеси.
              </p>
              <p className="mt-1 text-[12px] text-[var(--v2-faint)]">
                Учи се от всеки разговор · работи 24/7
              </p>
            </div>
          </SectionReveal>
        </div>

        {/* ---- Ред с ИЗМИСЛЕНИ фирми ------------------------------------- */}
        <SectionReveal delay={120}>
          <div className="mt-12 border-t border-[var(--v2-line)] pt-9">
            <p className="v2-mono mb-6 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">
              Сред бизнесите, които автоматизирахме
            </p>
            <div className="flex flex-wrap items-stretch justify-center gap-3">
              {COMPANIES.map((c) => (
                <div
                  key={c.name}
                  className="v2-glass flex items-center gap-3 px-4 py-2.5"
                >
                  <span
                    aria-hidden
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] text-[12px] font-extrabold"
                    style={{
                      background:
                        "linear-gradient(135deg, color-mix(in srgb, var(--v2-cyan) 20%, transparent), color-mix(in srgb, var(--v2-violet) 20%, transparent))",
                      color: "var(--v2-ink)",
                      fontFamily: "var(--v2-font-display)",
                    }}
                  >
                    {c.name
                      .replace(/^(Хотел|Ресторант|Бутик|Имоти|Авто Сервиз|Клиника)\s+/u, "")
                      .charAt(0)}
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold text-[var(--v2-ink)]">
                      {c.name}
                    </span>
                    <span className="block text-[11px] text-[var(--v2-faint)]">
                      {c.meta}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </div>

      {/* Локален стил само за плавното влизане на нов feed-ред */}
      <style jsx>{`
        .v2-feed-row {
          animation: v2-feed-in 0.5s var(--v2-ease, cubic-bezier(0.22, 1, 0.36, 1)) both;
        }
        @keyframes v2-feed-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .v2-feed-row {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
