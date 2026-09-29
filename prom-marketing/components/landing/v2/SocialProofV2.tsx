"use client";
/* =====================================================================
   SocialProofV2 — социално доказателство в езика „2050 · Luminescent
   Depth". Три count-up брояча с ИСТИНСКИ числа от CRM-а + покана към
   формата и записването на среща + истинските браншове на клиентите.

   ⚠️ 29.09.2026: тук стоеше ЖИВ ротиращ feed от ИЗМИСЛЕНИ запитвания
   („Иван от Варна остави запитване · преди 2 мин“), ред с ИЗМИСЛЕНИ фирми
   и броячи 120+ / 1840 ч / 9600+ без покритие. Измисленото социално
   доказателство е нелоялна търговска практика по ЗЗП (Директива „Омнибус“
   (ЕС) 2019/2161) — махнато по нареждане на Ивайло. Числата по-долу са от
   Supabase (contacts / bookings) към 29.09.2026 и са с „+“, защото растат;
   сменят се само с проверено число. Браншовете са на истински клиенти, без
   имена. Истинските отзиви са в RealReviewsV2.
   ===================================================================== */
import { CounterRamp } from "@/components/effects/CounterRamp";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { NeuralCoreLazy } from "@/components/landing/v2/NeuralCoreLazy";

/* ---- Брояч-метрики (истински, CRM към 29.09.2026) --------------------- */
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
    target: 470,
    suffix: "+",
    label: "запитвания обработени",
    sub: "от май 2026 — всяко влиза в CRM-а",
    color: "var(--v2-cyan)",
    tag: "LEADS",
  },
  {
    target: 100,
    suffix: "+",
    label: "записани срещи",
    sub: "със собственици на бизнеси",
    color: "var(--v2-violet-2)",
    tag: "MEETINGS",
  },
  {
    target: 17,
    suffix: "+",
    label: "фирми работят с нас",
    sub: "магазини, хотели, агро, транспорт",
    color: "var(--v2-mint)",
    tag: "CLIENTS",
  },
];

/* ---- Браншовете на истинските ни клиенти (без имена) ------------------ */
const BRANCHES = [
  { name: "Онлайн книжарница", meta: "E-commerce" },
  { name: "Онлайн парфюмерия", meta: "E-commerce" },
  { name: "Управление на отпадъци", meta: "Екология" },
  { name: "Хотел", meta: "Хотелиерство" },
  { name: "Прецизно земеделие", meta: "Агро" },
  { name: "Транспорт с GPS", meta: "Автопарк" },
  { name: "Сладкарство", meta: "Храни" },
];

export function SocialProofV2() {
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

        {/* ---- Покана: формата + срещата (вместо измисления feed) --------- */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
          <SectionReveal delay={120}>
            <div className="v2-card v2-glow group flex h-full flex-col justify-center">
              <h3
                className="text-xl font-bold md:text-2xl"
                style={{ fontFamily: "var(--v2-font-display)" }}
                lang="bg"
              >
                Твоето запитване е следващото.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--v2-muted)] md:text-[15px]">
                Остави телефон — два кратки въпроса — и ще ти се обадим. Или си
                запази безплатна среща направо в календара.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#kontakti"
                  className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-[#06121a]"
                  style={{ background: "linear-gradient(90deg, var(--v2-cyan), var(--v2-violet-2))" }}
                >
                  Остави телефон →
                </a>
                <a
                  href="/booking"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--v2-line)] px-5 py-3 text-sm font-semibold text-[var(--v2-ink)]"
                >
                  Запази безплатна среща
                </a>
              </div>
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
                <NeuralCoreLazy radius={1.2} nodeCount={150} spin={0.7} />
              </div>
              <p className="mt-4 text-sm font-semibold text-[var(--v2-ink)]">
                Един AI екип. Работи 24/7.
              </p>
              <p className="mt-1 text-[12px] text-[var(--v2-faint)]">
                Учи се от всеки разговор · работи 24/7
              </p>
            </div>
          </SectionReveal>
        </div>

        {/* ---- Истинските браншове на клиентите (без имена) --------------- */}
        <SectionReveal delay={120}>
          <div className="mt-12 border-t border-[var(--v2-line)] pt-9">
            <p className="v2-mono mb-6 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">
              Браншовете на клиентите ни
            </p>
            <div className="flex flex-wrap items-stretch justify-center gap-3">
              {BRANCHES.map((c) => (
                <div key={c.name} className="v2-glass flex items-center gap-3 px-4 py-2.5">
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
                    {c.name.charAt(0)}
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold text-[var(--v2-ink)]">{c.name}</span>
                    <span className="block text-[11px] text-[var(--v2-faint)]">{c.meta}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </div>

    </section>
  );
}
