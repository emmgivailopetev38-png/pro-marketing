"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { TiltCard } from "@/components/effects/TiltCard";

/* ------------------------------------------------------------------ */
/*  Типове                                                             */
/* ------------------------------------------------------------------ */

type Accent = "cyan" | "sky" | "amber" | "emerald";

interface AccentTokens {
  readonly color: string;
  /** rgb тройка за rgba() миксове */
  readonly rgb: string;
}

interface Capability {
  readonly id: string;
  /** пореден номер на модула, показва се като 01…09 */
  readonly index: string;
  /** заглавие на модула */
  readonly title: string;
  /** едно изречение — какво прави */
  readonly line: string;
  /** inline svg иконка */
  readonly icon: ReactNode;
  readonly accent: Accent;
}

/* ------------------------------------------------------------------ */
/*  Акцентни токени                                                    */
/* ------------------------------------------------------------------ */

const ACCENTS: Record<Accent, AccentTokens> = {
  cyan: { color: "var(--color-accent-cyan)", rgb: "34,211,238" },
  sky: { color: "var(--color-accent-sky)", rgb: "56,189,248" },
  amber: { color: "var(--color-accent-amber)", rgb: "251,146,60" },
  emerald: { color: "var(--color-accent-emerald)", rgb: "52,211,153" },
} as const;

/* ------------------------------------------------------------------ */
/*  Иконки — inline svg, наследяват currentColor                       */
/* ------------------------------------------------------------------ */

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "h-6 w-6",
};

const IconClient: ReactNode = (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    <path d="M15.5 4.2a3 3 0 0 1 0 5.6" opacity="0.55" />
  </svg>
);

const IconOffer: ReactNode = (
  <svg {...ICON_PROPS}>
    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5Z" />
    <path d="M14 3.5V8h4" />
    <path d="M9 13h6M9 16.2h4" />
  </svg>
);

const IconInbox: ReactNode = (
  <svg {...ICON_PROPS}>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <path d="M3.5 13h4l1.4 2.2h6.2L16.5 13h4" />
    <path d="M8 8.5h8" opacity="0.55" />
  </svg>
);

const IconFactory: ReactNode = (
  <svg {...ICON_PROPS}>
    <path d="M3.5 20.5V10l5 3.2V10l5 3.2V8.5l5.5 3.4v8.6Z" />
    <path d="M3.5 20.5h17" />
    <path d="M7.5 17h1.5M12 17h1.5M16.5 17H18" opacity="0.7" />
  </svg>
);

const IconInvoice: ReactNode = (
  <svg {...ICON_PROPS}>
    <path d="M6 3.5h12V20l-2-1.3L14 20l-2-1.3L10 20l-2-1.3L6 20Z" />
    <path d="M9 8h6M9 11.4h6M9 14.8h3.5" />
  </svg>
);

const IconChart: ReactNode = (
  <svg {...ICON_PROPS}>
    <path d="M4 4v16h16" />
    <path d="M7.5 15.5l3-3.5 2.5 2.4 4-5.4" />
    <circle cx="7.5" cy="15.5" r="0.6" fill="currentColor" />
    <circle cx="17" cy="9" r="0.6" fill="currentColor" />
  </svg>
);

const IconChat: ReactNode = (
  <svg {...ICON_PROPS}>
    <path d="M4 5.5h16v9.5a1.5 1.5 0 0 1-1.5 1.5H10l-4 3.5V16.5H5.5A1.5 1.5 0 0 1 4 15Z" />
    <path d="M8.5 10.7h.01M12 10.7h.01M15.5 10.7h.01" />
  </svg>
);

const IconBell: ReactNode = (
  <svg {...ICON_PROPS}>
    <path d="M6.5 17V10.5a5.5 5.5 0 0 1 11 0V17l1.5 2H5Z" />
    <path d="M10 19.5a2 2 0 0 0 4 0" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Данни — 9-те модула (скроени за Тодор)                             */
/* ------------------------------------------------------------------ */

const CAPABILITIES: readonly Capability[] = [
  {
    id: "crm",
    index: "01",
    title: "CRM с клиентски досиета",
    line: "Единна карта за всеки клиент — история, поръчки и контакти на едно място.",
    icon: IconClient,
    accent: "sky",
  },
  {
    id: "oferti",
    index: "02",
    title: "Оферти & 6-стъпков pipeline",
    line: "Офертите минават по ясни етапи — нито една не се губи по пътя.",
    icon: IconOffer,
    accent: "emerald",
  },
  {
    id: "amazon",
    index: "03",
    title: "Amazon / имейл ingestion",
    line: "Settlement имейлите се четат сами и поръчките влизат без копиране на ръка.",
    icon: IconInbox,
    accent: "amber",
  },
  {
    id: "ceh",
    index: "04",
    title: "Цех & склад + AI срок",
    line: "Производството се следи на живо, а AI прогнозира кога ще е готово.",
    icon: IconFactory,
    accent: "cyan",
  },
  {
    id: "fakturi",
    index: "05",
    title: "Фактури & документи",
    line: "Фактури и документи се издават и изпращат автоматично, без забавяне.",
    icon: IconInvoice,
    accent: "sky",
  },
  {
    id: "otcheti",
    index: "06",
    title: "Отчети & KPI",
    line: "Дневни и седмични репорти с ключовите числа — готови всяка сутрин.",
    icon: IconChart,
    accent: "emerald",
  },
  {
    id: "hermes",
    index: "07",
    title: "AI чат на български (Hermes)",
    line: "Питаш на чист български и получаваш отговор от данните в реално време.",
    icon: IconChat,
    accent: "cyan",
  },
  {
    id: "izvestia",
    index: "08",
    title: "Известия (Viber/SMS/Telegram)",
    line: "Клиентът и екипът получават навреме известие по предпочитания канал.",
    icon: IconBell,
    accent: "amber",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Карта на модул                                                     */
/* ------------------------------------------------------------------ */

function CapabilityCard({ cap, index }: { cap: Capability; index: number }) {
  const reduced = useReducedMotion();
  const accent = ACCENTS[cap.accent];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.6,
        delay: Math.min(index * 0.05, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      <TiltCard className="h-full rounded-3xl" maxTiltDeg={6}>
        <article
          className="group/card relative flex h-full flex-col overflow-hidden rounded-3xl border p-6 transition-transform duration-300 will-change-transform hover:-translate-y-1"
          style={{
            borderColor: "var(--color-border-default)",
            background: "var(--color-bg-glass)",
            backdropFilter: "blur(14px)",
          }}
        >
          {/* Светещ ъглов halo при hover */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover/card:opacity-70"
            style={{
              background: `radial-gradient(circle, ${accent.color} 0%, transparent 70%)`,
            }}
          />
          {/* Тънка светеща горна линия */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px opacity-40 transition-opacity duration-500 group-hover/card:opacity-100"
            style={{
              background: `linear-gradient(90deg, transparent, ${accent.color}, transparent)`,
            }}
          />

          <div className="relative flex flex-1 flex-col">
            {/* Header: иконка + пореден номер */}
            <div className="flex items-start justify-between gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-shadow duration-500 group-hover/card:[box-shadow:0_0_22px_var(--cap-glow)]"
                style={
                  {
                    borderColor: `rgba(${accent.rgb},0.34)`,
                    color: accent.color,
                    background: `rgba(${accent.rgb},0.08)`,
                    ["--cap-glow" as string]: `rgba(${accent.rgb},0.30)`,
                  } as React.CSSProperties
                }
                aria-hidden
              >
                {cap.icon}
              </span>

              <span
                className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] text-[var(--color-text-tertiary)] transition-colors duration-500 group-hover/card:text-[var(--color-text-secondary)]"
                aria-hidden
              >
                {cap.index}
              </span>
            </div>

            {/* Заглавие */}
            <h3 className="mt-5 font-[family-name:var(--font-editorial)] text-lg font-extrabold leading-snug text-[var(--color-text-primary)]">
              {cap.title}
            </h3>

            {/* Един ред описание */}
            <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              {cap.line}
            </p>

            {/* Долен ред — модул + жив статус */}
            <div className="mt-auto flex items-center justify-between pt-5">
              <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                Модул
              </span>
              <span
                className="inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em]"
                style={{ color: accent.color }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: accent.color,
                    boxShadow: `0 0 8px ${accent.color}`,
                  }}
                  aria-hidden
                />
                включен
              </span>
            </div>
          </div>
        </article>
      </TiltCard>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Главна секция                                                      */
/* ------------------------------------------------------------------ */

export function CapabilitiesGrid() {
  const reduced = useReducedMotion();

  return (
    <section
      id="modules"
      className="relative overflow-hidden border-t border-[var(--color-border-default)] py-24 md:py-32"
    >
      {/* Фонов ambient градиент */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 10% 0%, rgba(34,211,238,0.07) 0%, transparent 55%), radial-gradient(ellipse at 95% 90%, rgba(56,189,248,0.05) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        {/* Eyebrow */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5"
        >
          <span className="relative flex h-2 w-2" aria-hidden>
            {!reduced && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-cyan)] opacity-70" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent-cyan)]" />
          </span>
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
            Обхват
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.05] text-[var(--color-text-primary)]"
        >
          Какво ще ти{" "}
          <span className="text-[var(--color-accent-cyan)]">построим</span>
        </motion.h2>

        {/* Подзаглавие */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg"
        >
          Осем свързани модула — от запитването до готовата поръчка. Всеки
          замества една ръчна стъпка и говори с останалите.
        </motion.p>

        {/* Грид с модули */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {CAPABILITIES.map((cap, i) => (
            <CapabilityCard key={cap.id} cap={cap} index={i} />
          ))}
        </div>

        {/* Долен ред: обобщение със скенираща линия */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-6 flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border px-6 py-5 text-center sm:flex-row sm:gap-3"
          style={{
            borderColor: "var(--color-border-default)",
            background: "var(--color-bg-glass)",
            backdropFilter: "blur(14px)",
          }}
        >
          {/* Скенираща линия — единствената безкрайна анимация в секцията */}
          {!reduced && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-1/3"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(34,211,238,0.10), transparent)",
              }}
              initial={{ x: "-120%" }}
              animate={{ x: "320%" }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
          )}

          <span className="relative font-[family-name:var(--font-mono)] text-sm tracking-[0.06em] text-[var(--color-text-secondary)]">
            <span className="font-bold text-[var(--color-accent-cyan)]">9</span>{" "}
            модула ·{" "}
            <span className="font-bold text-[var(--color-accent-sky)]">1</span>{" "}
            обща система ·{" "}
            <span className="font-bold text-[var(--color-accent-emerald)]">
              0
            </span>{" "}
            ръчни стъпки между тях
          </span>
        </motion.div>
      </div>
    </section>
  );
}
