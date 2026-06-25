"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { CounterRamp } from "@/components/effects/CounterRamp";

/* ------------------------------------------------------------------ */
/*  Типове                                                             */
/* ------------------------------------------------------------------ */

type Accent = "cyan" | "sky" | "amber" | "emerald";

interface AccentTokens {
  readonly color: string;
  /** rgb тройка за rgba() миксове */
  readonly rgb: string;
}

/** Една стъпка от автоматизация-потока (4 свързани възела). */
interface FlowStep {
  readonly id: string;
  /** пореден номер 1..4 */
  readonly n: number;
  /** глиф-икона (unicode / emoji) */
  readonly glyph: string;
  /** заглавие на стъпката */
  readonly title: string;
  /** кратко описание — един ред */
  readonly note: string;
  readonly accent: Accent;
}

/** Ред от суровия имейл (моноспейс, ляво). */
interface RawLine {
  /** етикет на реда (напр. "From", "Subject") или "" за тяло */
  readonly label: string;
  /** съдържание на реда */
  readonly value: string;
  /** подчертава ли се (данни, които AI ще извлече) */
  readonly token: boolean;
}

/** Поле в структурирания CRM запис (дясно). */
interface CrmField {
  readonly id: string;
  /** етикет на полето */
  readonly label: string;
  /** извлечената стойност */
  readonly value: string;
  /** глиф пред полето */
  readonly glyph: string;
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
/*  Данни (фиксирани, илюстративни — без четене на системно време)     */
/* ------------------------------------------------------------------ */

const STEPS: readonly FlowStep[] = [
  {
    id: "email",
    n: 1,
    glyph: "📧",
    title: "Имейл от Amazon",
    note: "Settlement / нова поръчка пристига в пощата",
    accent: "amber",
  },
  {
    id: "extract",
    n: 2,
    glyph: "🤖",
    title: "AI чете и извлича",
    note: "Клиент · продукт · бройка · адрес · срок",
    accent: "cyan",
  },
  {
    id: "crm",
    n: 3,
    glyph: "🗂️",
    title: "Влиза в CRM",
    note: "Структуриран запис се създава автоматично",
    accent: "sky",
  },
  {
    id: "notify",
    n: 4,
    glyph: "🔔",
    title: "Известие + срок",
    note: "Екипът получава задача със срок за изпращане",
    accent: "emerald",
  },
] as const;

/** Суровият имейл вляво — фиксирани редове. */
const RAW_LINES: readonly RawLine[] = [
  { label: "From", value: "auto-confirm@amazon.com", token: false },
  { label: "Subject", value: "Your order #404-7782913 shipped soon", token: false },
  { label: "", value: "", token: false },
  { label: "", value: "Hello Seller, a new order requires", token: false },
  { label: "", value: "fulfilment within the handling time.", token: false },
  { label: "", value: "", token: false },
  { label: "", value: "Buyer: M. Andersson", token: true },
  { label: "", value: "Item: Fireplace Insert STOVE-XL", token: true },
  { label: "", value: "Qty: 2", token: true },
  { label: "", value: "Ship-to: Götgatan 14, Stockholm SE", token: true },
  { label: "", value: "Ship-by: 2050-06-28", token: true },
] as const;

/** Полетата, които се попълват в CRM — в реда на „светване“. */
const CRM_FIELDS: readonly CrmField[] = [
  { id: "client", label: "Клиент", value: "M. Andersson", glyph: "◉", accent: "cyan" },
  {
    id: "product",
    label: "Продукт",
    value: "Камина STOVE-XL",
    glyph: "▦",
    accent: "amber",
  },
  { id: "qty", label: "Бройка", value: "2 бр.", glyph: "✦", accent: "sky" },
  {
    id: "address",
    label: "Адрес",
    value: "Götgatan 14, Стокхолм",
    glyph: "→",
    accent: "cyan",
  },
  { id: "deadline", label: "Срок", value: "28 юни 2050", glyph: "◷", accent: "emerald" },
] as const;

/** Канали-източници, които потокът също поддържа. */
const SOURCES: readonly string[] = [
  "Amazon",
  "Crowdfunding",
  "Маркетплейси",
  "Settlement репорти",
] as const;

/* ------------------------------------------------------------------ */
/*  Малки под-компоненти                                               */
/* ------------------------------------------------------------------ */

/** Пулсиращо ядро + ринг (CSS animate-ping). */
function LiveDot({ accent, reduced }: { accent: AccentTokens; reduced: boolean }) {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      {!reduced && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
          style={{ background: accent.color }}
        />
      )}
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ background: accent.color, boxShadow: `0 0 10px ${accent.color}` }}
      />
    </span>
  );
}

/** Eyebrow — mono етикет с пулсиращо точе (amber). */
function Eyebrow({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-2.5"
    >
      <LiveDot accent={ACCENTS.amber} reduced={reduced} />
      <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-amber)]">
        Автоматизация · Amazon &amp; имейл
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Хоризонтален поток от 4 стъпки                                     */
/* ------------------------------------------------------------------ */

/** Свързваща линия между две стъпки с течащ pulse. */
function FlowConnector({
  accent,
  active,
  reduced,
  vertical,
}: {
  accent: AccentTokens;
  active: boolean;
  reduced: boolean;
  /** вертикален вариант (мобилен) */
  vertical: boolean;
}) {
  if (vertical) {
    return (
      <div
        className="relative mx-auto my-1 h-6 w-px overflow-hidden md:hidden"
        style={{
          background: active
            ? `linear-gradient(180deg, rgba(${accent.rgb},0.6), rgba(${accent.rgb},0.15))`
            : "var(--color-border-default)",
        }}
        aria-hidden
      >
        {!reduced && active && (
          <motion.span
            className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
            style={{ background: accent.color, boxShadow: `0 0 12px ${accent.color}` }}
            initial={{ top: "-20%", opacity: 0 }}
            animate={{ top: ["-20%", "120%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="relative hidden h-px flex-1 self-center overflow-hidden md:block"
      style={{
        background: active
          ? `linear-gradient(90deg, rgba(${accent.rgb},0.6), rgba(${accent.rgb},0.15))`
          : "var(--color-border-default)",
      }}
      aria-hidden
    >
      {!reduced && active && (
        <motion.span
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
          style={{ background: accent.color, boxShadow: `0 0 12px ${accent.color}` }}
          initial={{ left: "-14%", opacity: 0 }}
          animate={{ left: ["-14%", "114%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

/** Един възел от потока. */
function StepNode({
  step,
  index,
  active,
  reduced,
}: {
  step: FlowStep;
  index: number;
  active: boolean;
  reduced: boolean;
}) {
  const accent = ACCENTS[step.accent];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.6,
        delay: Math.min(index * 0.1, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative flex flex-col rounded-2xl border p-4 transition-all duration-500"
      style={{
        borderColor: active ? `rgba(${accent.rgb},0.5)` : "var(--color-border-default)",
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(14px)",
        boxShadow: active ? `0 0 32px rgba(${accent.rgb},0.22)` : "none",
      }}
    >
      {/* Светеща горна линия */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px transition-opacity duration-500"
        style={{
          opacity: active ? 1 : 0.3,
          background: `linear-gradient(90deg, transparent, ${accent.color}, transparent)`,
        }}
      />
      {/* Ъглов halo при активност */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity duration-500"
        style={{
          opacity: active ? 0.5 : 0,
          background: `radial-gradient(circle, ${accent.color} 0%, transparent 70%)`,
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg transition-all duration-500"
            style={{
              borderColor: active
                ? `rgba(${accent.rgb},0.6)`
                : `rgba(${accent.rgb},0.28)`,
              background: active ? `rgba(${accent.rgb},0.14)` : `rgba(${accent.rgb},0.06)`,
              boxShadow: active ? `0 0 16px rgba(${accent.rgb},0.35)` : "none",
            }}
            aria-hidden
          >
            {step.glyph}
          </span>
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em]"
            style={{ color: accent.color }}
            aria-hidden
          >
            {String(step.n).padStart(2, "0")} / 04
          </span>
          {active && (
            <span className="ml-auto">
              <LiveDot accent={accent} reduced={reduced} />
            </span>
          )}
        </div>

        <h3 className="mt-3 font-[family-name:var(--font-editorial)] text-[15px] font-extrabold leading-tight text-[var(--color-text-primary)]">
          {step.title}
        </h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
          {step.note}
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ляво: суров имейл                                                  */
/* ------------------------------------------------------------------ */

function RawEmailCard({ reduced }: { reduced: boolean }) {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border"
      style={{
        borderColor: `rgba(${ACCENTS.amber.rgb},0.26)`,
        background: "rgba(5,8,14,0.55)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Amber ляв ръб */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{
          background: ACCENTS.amber.color,
          boxShadow: `0 0 14px rgba(${ACCENTS.amber.rgb},0.5)`,
        }}
      />
      {/* Терминален header */}
      <div
        className="flex items-center justify-between border-b px-4 py-3 pl-5"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
            style={{
              color: ACCENTS.amber.color,
              background: `rgba(${ACCENTS.amber.rgb},0.12)`,
            }}
            aria-hidden
          >
            ✉
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
            Суров имейл
          </span>
        </div>
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
          необработен
        </span>
      </div>

      {/* Тяло на имейла */}
      <div className="relative flex-1 px-4 py-4 pl-5">
        <pre className="overflow-x-auto font-[family-name:var(--font-mono)] text-[11.5px] leading-[1.7] text-[var(--color-text-tertiary)]">
          {RAW_LINES.map((line, i) => {
            const empty = line.label === "" && line.value === "";
            if (empty) {
              return <div key={i} className="h-3" aria-hidden />;
            }
            return (
              <div key={i} className="whitespace-pre-wrap">
                {line.label !== "" && (
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {line.label}:{" "}
                  </span>
                )}
                <span
                  style={
                    line.token
                      ? {
                          color: ACCENTS.amber.color,
                          background: `rgba(${ACCENTS.amber.rgb},0.1)`,
                          boxShadow: `inset 0 0 0 1px rgba(${ACCENTS.amber.rgb},0.22)`,
                          borderRadius: "4px",
                          padding: "1px 4px",
                        }
                      : undefined
                  }
                >
                  {line.value}
                </span>
              </div>
            );
          })}
        </pre>

        {/* Подсказка „маркираните се извличат“ */}
        <div className="mt-4 flex items-center gap-2">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-sm"
            style={{
              background: `rgba(${ACCENTS.amber.rgb},0.18)`,
              boxShadow: `inset 0 0 0 1px rgba(${ACCENTS.amber.rgb},0.4)`,
            }}
          />
          <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
            маркираното се извлича
          </span>
          {!reduced && (
            <motion.span
              aria-hidden
              className="ml-auto h-2 w-2 rounded-full"
              style={{ background: ACCENTS.amber.color }}
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Среда: летящи tokens (overlay само на десктоп)                     */
/* ------------------------------------------------------------------ */

/**
 * Тънък вертикален „мост“ между имейла и CRM-а с летящи частици.
 * Рендерира се само на md+; gate-нат при reduced motion.
 */
function TokenBridge({ active }: { active: boolean }) {
  /** Детерминистични отмествания (без random / без системно време). */
  const tokens: readonly { y: number; delay: number; accent: Accent }[] = [
    { y: 14, delay: 0, accent: "cyan" },
    { y: 38, delay: 0.45, accent: "amber" },
    { y: 60, delay: 0.9, accent: "sky" },
    { y: 82, delay: 1.35, accent: "emerald" },
  ];

  return (
    <div
      className="pointer-events-none absolute -inset-x-4 inset-y-0 hidden md:block"
      aria-hidden
    >
      {tokens.map((t, i) => {
        const accent = ACCENTS[t.accent];
        return (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{
              top: `${t.y}%`,
              left: 0,
              background: accent.color,
              boxShadow: `0 0 10px ${accent.color}`,
            }}
            initial={{ left: "0%", opacity: 0 }}
            animate={
              active
                ? { left: ["0%", "100%"], opacity: [0, 1, 1, 0] }
                : { left: "0%", opacity: 0 }
            }
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: t.delay,
            }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Дясно: структуриран CRM запис                                      */
/* ------------------------------------------------------------------ */

/** Едно поле, което „светва“, когато AI го извлече. */
function CrmFieldRow({
  field,
  filled,
}: {
  field: CrmField;
  /** попълнено ли е вече (анимирано последователно) */
  filled: boolean;
}) {
  const accent = ACCENTS[field.accent];

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-500"
      style={{
        borderColor: filled
          ? `rgba(${accent.rgb},0.42)`
          : "var(--color-border-default)",
        background: filled ? `rgba(${accent.rgb},0.08)` : "rgba(255,255,255,0.015)",
        boxShadow: filled ? `0 0 18px rgba(${accent.rgb},0.16)` : "none",
      }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm transition-all duration-500"
        style={{
          color: filled ? accent.color : "var(--color-text-tertiary)",
          borderColor: filled
            ? `rgba(${accent.rgb},0.4)`
            : "var(--color-border-default)",
          background: filled ? `rgba(${accent.rgb},0.12)` : "transparent",
        }}
        aria-hidden
      >
        {field.glyph}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
          {field.label}
        </p>
        <p
          className="truncate text-[13px] font-medium transition-colors duration-500"
          style={{
            color: filled ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
          }}
        >
          {filled ? (
            field.value
          ) : (
            <span className="font-[family-name:var(--font-mono)] tracking-[0.1em]">
              ░░░░░░░
            </span>
          )}
        </p>
      </div>

      {/* Статус-глиф вдясно */}
      <span
        className="shrink-0 font-[family-name:var(--font-mono)] text-[11px] transition-all duration-500"
        style={{
          color: filled ? accent.color : "var(--color-text-tertiary)",
          opacity: filled ? 1 : 0.5,
        }}
        aria-hidden
      >
        {filled ? "✓" : "…"}
      </span>
    </div>
  );
}

function CrmRecordCard({
  filledCount,
  reduced,
}: {
  /** колко полета са вече попълнени (0..N) */
  filledCount: number;
  reduced: boolean;
}) {
  const total = CRM_FIELDS.length;
  const done = filledCount >= total;

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border"
      style={{
        borderColor: "var(--color-border-bright)",
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Ambient градиент вътре */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 100% 0%, rgba(56,189,248,0.12) 0%, transparent 55%), radial-gradient(ellipse at 0% 110%, rgba(34,211,238,0.1) 0%, transparent 55%)",
        }}
      />
      {/* Скенираща линия (1 от ограничените безкрайни анимации на секцията) */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-1/3"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(56,189,248,0.07), transparent)",
          }}
          initial={{ y: "-120%" }}
          animate={{ y: "320%" }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Header */}
      <div
        className="relative flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
            style={{
              color: ACCENTS.sky.color,
              background: `rgba(${ACCENTS.sky.rgb},0.12)`,
            }}
            aria-hidden
          >
            🗂️
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
            CRM запис
          </span>
        </div>
        <span
          className="rounded-md px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] transition-colors duration-500"
          style={{
            color: done ? ACCENTS.emerald.color : ACCENTS.sky.color,
            background: done
              ? `rgba(${ACCENTS.emerald.rgb},0.1)`
              : `rgba(${ACCENTS.sky.rgb},0.1)`,
            border: done
              ? `1px solid rgba(${ACCENTS.emerald.rgb},0.3)`
              : `1px solid rgba(${ACCENTS.sky.rgb},0.3)`,
          }}
        >
          {done ? "✓ готово" : "попълва се…"}
        </span>
      </div>

      {/* Поле след поле */}
      <div className="relative flex-1 space-y-2 px-4 py-4">
        {CRM_FIELDS.map((field, i) => (
          <CrmFieldRow key={field.id} field={field} filled={i < filledCount} />
        ))}
      </div>

      {/* Footer: известие + срок за изпращане */}
      <div
        className="relative flex items-center gap-3 border-t px-4 py-3"
        style={{
          borderColor: "var(--color-border-default)",
          background: done ? `rgba(${ACCENTS.emerald.rgb},0.06)` : "transparent",
        }}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm transition-all duration-500"
          style={{
            color: done ? ACCENTS.emerald.color : "var(--color-text-tertiary)",
            background: done ? `rgba(${ACCENTS.emerald.rgb},0.12)` : "transparent",
            boxShadow: done ? `0 0 14px rgba(${ACCENTS.emerald.rgb},0.3)` : "none",
          }}
          aria-hidden
        >
          🔔
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
            Известие → екип
          </p>
          <p
            className="truncate text-[12px] font-medium transition-colors duration-500"
            style={{
              color: done
                ? "var(--color-text-primary)"
                : "var(--color-text-tertiary)",
            }}
          >
            Срок за изпращане: 28 юни · приоритет висок
          </p>
        </div>
        {done && <LiveDot accent={ACCENTS.emerald} reduced={reduced} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Главна секция                                                      */
/* ------------------------------------------------------------------ */

export function AmazonAutomation() {
  const reduced = useReducedMotion();

  /**
   * Активна стъпка от потока (0..3) — детерминистичен старт на 0 за SSR,
   * анимира се само след mount вътре в useEffect → без hydration mismatch.
   */
  const [activeStep, setActiveStep] = useState<number>(0);

  /** Колко CRM полета са „попълнени“ в момента (за светването). */
  const [filledCount, setFilledCount] = useState<number>(0);

  useEffect(() => {
    if (reduced) {
      // При reduced motion → показваме завършено състояние, статично.
      setActiveStep(STEPS.length - 1);
      setFilledCount(CRM_FIELDS.length);
      return;
    }

    // Цикъл на потока: стъпка по стъпка, после полетата се попълват.
    const stepTimer = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 1900);

    const fieldTimer = window.setInterval(() => {
      setFilledCount((prev) => (prev >= CRM_FIELDS.length ? 0 : prev + 1));
    }, 900);

    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(fieldTimer);
    };
  }, [reduced]);

  // „Извличането“ (стъпка 2) и „CRM“ (стъпка 3) държат моста активен.
  const bridgeActive = !reduced && (activeStep === 1 || activeStep === 2);

  const headStyle: CSSProperties = {
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <section
      id="amazon"
      className="relative overflow-hidden border-t border-[var(--color-border-default)] py-24 md:py-32"
    >
      {/* Фонов ambient градиент — топъл (Amazon) + cyan */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 8% 0%, rgba(251,146,60,0.07) 0%, transparent 55%), radial-gradient(ellipse at 95% 100%, rgba(34,211,238,0.05) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        <Eyebrow reduced={reduced} />

        {/* Heading */}
        <motion.h2
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          style={headStyle}
          className="mt-5 font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.05] text-[var(--color-text-primary)]"
        >
          Имейлите се{" "}
          <span className="text-[var(--color-accent-amber)]">четат сами</span>
        </motion.h2>

        {/* Подзаглавие */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg"
        >
          Репорт от Amazon пристига по имейл — и вместо да се копира на ръка,{" "}
          <span className="text-[var(--color-text-primary)]">
            AI го прочита, извлича данните и създава поръчка в CRM
          </span>{" "}
          сам. Същият поток поема и crowdfunding, и другите маркетплейси.
        </motion.p>

        {/* Поток от 4 стъпки: хоризонтален на md, вертикален на мобилен */}
        <div className="mt-12 flex flex-col md:flex-row md:items-stretch">
          {STEPS.map((step, i) => {
            const isActive = activeStep === i;
            const connectorAccent = ACCENTS[step.accent];
            return (
              <div
                key={step.id}
                className="flex flex-col md:flex-1 md:flex-row md:items-stretch"
              >
                {i > 0 && (
                  <>
                    <FlowConnector
                      accent={connectorAccent}
                      active={isActive}
                      reduced={reduced}
                      vertical
                    />
                    <FlowConnector
                      accent={connectorAccent}
                      active={isActive}
                      reduced={reduced}
                      vertical={false}
                    />
                  </>
                )}
                <div className="md:flex-1">
                  <StepNode
                    step={step}
                    index={i}
                    active={isActive}
                    reduced={reduced}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Прогрес-индикатор на потока */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          whileInView={reduced ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 flex items-center justify-center gap-2"
          aria-hidden
        >
          {STEPS.map((step, i) => (
            <span
              key={step.id}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: activeStep === i ? "28px" : "8px",
                background:
                  activeStep === i
                    ? ACCENTS[step.accent].color
                    : "var(--color-border-bright)",
                boxShadow:
                  activeStep === i ? `0 0 12px ${ACCENTS[step.accent].color}` : "none",
              }}
            />
          ))}
        </motion.div>

        {/* Превръщане: суров имейл → CRM запис */}
        <div className="mt-10 grid items-stretch gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-4">
          {/* ЛЯВО — суров имейл */}
          <motion.div
            initial={reduced ? false : { opacity: 0, x: -22 }}
            whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <RawEmailCard reduced={reduced} />
          </motion.div>

          {/* СРЕДА — стрелка/мост с летящи tokens */}
          <div className="relative flex items-center justify-center">
            <TokenBridge active={bridgeActive} />
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.8 }}
              whileInView={reduced ? undefined : { opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border"
              style={{
                borderColor: "var(--color-border-bright)",
                background: "var(--color-bg-glass)",
                backdropFilter: "blur(10px)",
                boxShadow: `0 0 24px rgba(${ACCENTS.cyan.rgb},0.22)`,
              }}
            >
              {/* Хоризонтална стрелка на десктоп, надолу на мобилен */}
              <span
                className="font-[family-name:var(--font-mono)] text-lg text-[var(--color-accent-cyan)] md:hidden"
                aria-hidden
              >
                ↓
              </span>
              <span
                className="hidden font-[family-name:var(--font-mono)] text-lg text-[var(--color-accent-cyan)] md:inline"
                aria-hidden
              >
                →
              </span>
            </motion.div>
          </div>

          {/* ДЯСНО — структуриран CRM запис */}
          <motion.div
            initial={reduced ? false : { opacity: 0, x: 22 }}
            whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <CrmRecordCard filledCount={filledCount} reduced={reduced} />
          </motion.div>
        </div>

        {/* Долна лента: метрика + поддържани канали */}
        <div className="mt-10 grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
          {/* Метрика */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border p-5 md:p-6"
            style={{
              borderColor: "var(--color-border-bright)",
              background: "var(--color-bg-glass)",
              backdropFilter: "blur(14px)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full opacity-50 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, var(--color-accent-amber) 0%, transparent 70%)",
              }}
            />
            <div className="relative flex items-baseline gap-2">
              <span aria-hidden className="text-lg">
                📦
              </span>
              <CounterRamp
                target={140}
                prefix="над "
                durationMs={2000}
                className="font-[family-name:var(--font-mono)] text-4xl font-bold leading-none text-[var(--color-accent-amber)]"
              />
            </div>
            <p className="relative mt-3 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              поръчки на месец, внасяни в CRM{" "}
              <span className="font-semibold text-[var(--color-text-primary)]">
                без нито едно ръчно копиране
              </span>
              .
            </p>
          </motion.div>

          {/* Поддържани канали */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border p-5 md:p-6"
            style={{
              borderColor: "var(--color-border-default)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.24em]"
                style={{ color: ACCENTS.cyan.color }}
              >
                Един поток · много източници
              </span>
              <LiveDot accent={ACCENTS.cyan} reduced={reduced} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {SOURCES.map((src) => (
                <span
                  key={src}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.04em] text-[var(--color-text-secondary)]"
                  style={{
                    borderColor: "var(--color-border-default)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: ACCENTS.amber.color,
                      boxShadow: `0 0 6px ${ACCENTS.amber.color}`,
                    }}
                  />
                  {src}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              Каквото и да пристигне по имейл — settlement от Amazon, поръчка от
              crowdfunding или маркетплейс — минава през{" "}
              <span className="text-[var(--color-text-primary)]">същата автоматизация</span>.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
