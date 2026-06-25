"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { Transition } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ================================================================== */
/*  Типове (строг TypeScript)                                          */
/* ================================================================== */

type AccentVar =
  | "var(--color-accent-cyan)"
  | "var(--color-accent-sky)"
  | "var(--color-accent-amber)"
  | "var(--color-accent-emerald)";

interface NavItem {
  readonly label: string;
  readonly glyph: string;
  readonly active?: boolean;
  readonly badge?: string;
}

interface Kpi {
  readonly label: string;
  readonly value: number;
  readonly sub: string;
  readonly accent: AccentVar;
  /** Нормализирани точки 0..1 за спарклайн (фиксирани — без random при render). */
  readonly spark: readonly number[];
}

type OfferStatus = "new" | "sent" | "won";

interface OfferRow {
  readonly name: string;
  readonly amount: string;
  readonly status: OfferStatus;
  readonly note: string;
}

interface Insight {
  readonly glyph: string;
  readonly text: string;
  readonly accent: AccentVar;
  readonly tag: string;
}

interface StatChip {
  readonly glyph: string;
  readonly label: string;
  readonly accent: AccentVar;
}

/* ================================================================== */
/*  Данни (фиксирани, илюстративни — реалистични за Тодор)             */
/* ================================================================== */

const NAV: readonly NavItem[] = [
  { label: "Табло", glyph: "▦", active: true },
  { label: "Оферти", glyph: "◈", badge: "9" },
  { label: "Amazon", glyph: "✦" },
  { label: "Цех", glyph: "⚙" },
  { label: "Отчети", glyph: "▤" },
] as const;

const KPIS: readonly Kpi[] = [
  {
    label: "Активни клиенти",
    value: 64,
    sub: "следени · топло",
    accent: "var(--color-accent-cyan)",
    spark: [0.3, 0.5, 0.35, 0.65, 0.55, 0.8, 0.6, 0.9, 0.75, 1],
  },
  {
    label: "Оферти чакащи",
    value: 9,
    sub: "процес от 6 стъпки",
    accent: "var(--color-accent-sky)",
    spark: [0.6, 0.45, 0.7, 0.5, 0.65, 0.4, 0.55, 0.45, 0.6, 0.5],
  },
  {
    label: "Amazon поръчки",
    value: 146,
    sub: "авто · по имейл",
    accent: "var(--color-accent-amber)",
    spark: [0.2, 0.35, 0.3, 0.5, 0.55, 0.6, 0.7, 0.8, 0.85, 1],
  },
  {
    label: "В производство",
    value: 12,
    sub: "цех + склад",
    accent: "var(--color-accent-emerald)",
    spark: [0.5, 0.55, 0.6, 0.5, 0.7, 0.65, 0.6, 0.75, 0.7, 0.8],
  },
] as const;

const OFFERS: readonly OfferRow[] = [
  { name: "Климатроник ООД", amount: "4 280 лв", status: "won", note: "№2198" },
  { name: "Георги Илиев", amount: "1 150 лв", status: "sent", note: "изпратена вчера" },
  { name: "ВентАир ЕООД", amount: "7 640 лв", status: "sent", note: "№2204" },
  { name: "Стелмаш Build", amount: "12 900 лв", status: "won", note: "№2191" },
  { name: "Мария Петкова", amount: "980 лв", status: "new", note: "Hermes подготвя" },
] as const;

const INSIGHTS: readonly Insight[] = [
  {
    glyph: "◈",
    text: "2 оферти чакат отговор — напомням днес.",
    accent: "var(--color-accent-cyan)",
    tag: "оферти",
  },
  {
    glyph: "✦",
    text: "Amazon: 2 поръчки за изпращане днес.",
    accent: "var(--color-accent-amber)",
    tag: "amazon",
  },
  {
    glyph: "◈",
    text: "Оферта „ВентАир“ отворена 4× — горещо.",
    accent: "var(--color-accent-emerald)",
    tag: "оферти",
  },
] as const;

const STAT_CHIPS: readonly StatChip[] = [
  { glyph: "📨", label: "Имейлите — автоматично", accent: "var(--color-accent-cyan)" },
  { glyph: "🤖", label: "AI върши 90%", accent: "var(--color-accent-sky)" },
  { glyph: "🔌", label: "Всички канали на едно място", accent: "var(--color-accent-amber)" },
  { glyph: "📊", label: "Live данни & прогнози", accent: "var(--color-accent-emerald)" },
] as const;

const STATUS_META: Readonly<
  Record<OfferStatus, { readonly label: string; readonly accent: AccentVar }>
> = {
  new: { label: "нова", accent: "var(--color-accent-sky)" },
  sent: { label: "изпратена", accent: "var(--color-accent-amber)" },
  won: { label: "спечелена", accent: "var(--color-accent-emerald)" },
};

const EASE: Transition["ease"] = [0.22, 1, 0.36, 1];

/* ================================================================== */
/*  Малки под-компоненти                                               */
/* ================================================================== */

/** Декоративен спарклайн — детерминиран SVG path от нормализирани точки. */
function Sparkline({ points, accent }: { points: readonly number[]; accent: AccentVar }) {
  const w = 100;
  const h = 30;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = h - p * (h - 4) - 2;
    return { x, y };
  });
  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spark-${accent.replace(/[^a-z]/gi, "")}`;
  const last = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-8 w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={accent}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last.x} cy={last.y} r={2.4} fill={accent} />
    </svg>
  );
}

/** Пулсиращо точе (статичен fallback при reduced). */
function LiveDot({ accent, reduced }: { accent: AccentVar; reduced: boolean }) {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      {!reduced && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
          style={{ background: accent }}
        />
      )}
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
      />
    </span>
  );
}

/** Три анимирани точки за „пише…“. */
function TypingDots({ reduced }: { reduced: boolean }) {
  if (reduced) {
    return (
      <span className="font-[family-name:var(--font-mono)] text-[var(--color-accent-cyan)]">
        …
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1 w-1 rounded-full bg-[var(--color-accent-cyan)]"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/** KPI карта със спарклайн + анимирано броещо число (CSS counter чрез state). */
function KpiCard({ kpi, index, reduced }: { kpi: Kpi; index: number; reduced: boolean }) {
  const [count, setCount] = useState<number>(reduced ? kpi.value : 0);

  useEffect(() => {
    let raf = 0;
    // Reduced → мигновено „рампа“ през rAF (без синхронен setState в ефекта).
    if (reduced) {
      raf = window.requestAnimationFrame(() => setCount(kpi.value));
      return () => window.cancelAnimationFrame(raf);
    }
    let start: number | null = null;
    const duration = 1300;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * kpi.value));
      if (p < 1) raf = window.requestAnimationFrame(tick);
    };
    const delay = window.setTimeout(() => {
      raf = window.requestAnimationFrame(tick);
    }, 250 + index * 120);
    return () => {
      window.clearTimeout(delay);
      window.cancelAnimationFrame(raf);
    };
  }, [kpi.value, index, reduced]);

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border p-4"
      style={{
        borderColor: "var(--color-border-default)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: `radial-gradient(circle, ${kpi.accent} 0%, transparent 70%)` }}
      />
      <span className="relative font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
        {kpi.label}
      </span>
      <span
        className="relative mt-1.5 font-[family-name:var(--font-editorial)] text-3xl font-extrabold leading-none"
        style={{ color: kpi.accent, textShadow: `0 0 22px ${kpi.accent}40` }}
      >
        {count.toLocaleString("bg-BG")}
      </span>
      <span className="relative mt-1 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.06em] text-[var(--color-text-secondary)]">
        {kpi.sub}
      </span>
      <div className="relative mt-2.5">
        <Sparkline points={kpi.spark} accent={kpi.accent} />
      </div>
    </div>
  );
}

/** Един ред в offer-log таблицата. */
function OfferLogRow({ row, index, reduced }: { row: OfferRow; index: number; reduced: boolean }) {
  const meta = STATUS_META[row.status];
  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, x: -10 }}
      whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.08, ease: EASE }}
      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-[rgba(34,211,238,0.04)]"
    >
      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-text-primary)]">
        {row.name}
      </span>
      <span className="shrink-0 font-[family-name:var(--font-mono)] text-[11px] tabular-nums text-[var(--color-text-secondary)]">
        {row.amount}
      </span>
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.04em]"
        style={{
          color: meta.accent,
          background: `${meta.accent}14`,
          border: `1px solid ${meta.accent}33`,
        }}
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: meta.accent }}
        />
        {meta.label}
      </span>
      <span className="hidden w-28 shrink-0 text-right font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)] sm:block">
        {row.note}
      </span>
    </motion.li>
  );
}

/** Streaming инсайт ред в Co-pilot панела. */
function InsightRow({
  insight,
  index,
  reduced,
}: {
  insight: Insight;
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, y: 8 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: 0.3 + index * 0.22, ease: EASE }}
      className="flex items-start gap-3 rounded-xl border px-3.5 py-3"
      style={{
        borderColor: `${insight.accent}26`,
        background: `${insight.accent}0d`,
      }}
    >
      <span
        className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[12px]"
        style={{
          color: insight.accent,
          background: `${insight.accent}1a`,
          boxShadow: `0 0 14px ${insight.accent}26`,
        }}
        aria-hidden
      >
        {insight.glyph}
      </span>
      <div className="min-w-0">
        <p className="text-[12.5px] leading-snug text-[var(--color-text-primary)]">
          {insight.text}
        </p>
        <span className="mt-1 inline-block font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
          {insight.tag}
        </span>
      </div>
    </motion.li>
  );
}

/* ================================================================== */
/*  Главна секция                                                      */
/* ================================================================== */

export function LiveCommandCenter() {
  const reduced = useReducedMotion();

  return (
    <section
      id="system"
      className="relative overflow-hidden border-t border-[var(--color-border-default)] py-24 font-[family-name:var(--font-body)] md:py-32"
    >
      {/* Фонов ambient градиент */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 18% 0%, rgba(34,211,238,0.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 95%, rgba(56,189,248,0.06) 0%, transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        {/* ── Eyebrow ── */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex items-center gap-2.5"
        >
          <LiveDot accent="var(--color-accent-cyan)" reduced={reduced} />
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
            {"// твоят команден център"}
          </span>
        </motion.div>

        {/* ── Heading ── */}
        <motion.h2
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
          className="mt-5 font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.05] text-[var(--color-text-primary)]"
        >
          Един екран. <span className="text-[var(--color-accent-cyan)]">Целият бизнес.</span>
        </motion.h2>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
          className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg"
        >
          Офертите, поръчките, Amazon и производството — на живо, в реално време. Това не е
          мокъп: така изглежда твоето табло.
        </motion.p>

        {/* ── Браузър прозорец (product shot) ── */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 36 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.85, delay: 0.1, ease: EASE }}
          className="relative mt-12"
        >
          {/* ambient glow зад рамката */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10 opacity-70"
            style={{
              background:
                "radial-gradient(ellipse at 50% 40%, rgba(34,211,238,0.16) 0%, transparent 60%)",
              filter: "blur(20px)",
            }}
          />

          <div
            className="relative overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              borderColor: "var(--color-border-bright)",
              background: "var(--color-bg-deep)",
              boxShadow:
                "0 40px 120px -30px rgba(0,0,0,0.8), 0 0 60px -20px rgba(34,211,238,0.25), inset 0 1px 0 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* горна highlight линия */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--color-accent-cyan), transparent)",
              }}
            />

            {/* ── Browser chrome bar ── */}
            <div
              className="flex items-center gap-3 border-b px-4 py-3"
              style={{
                borderColor: "var(--color-border-default)",
                background: "rgba(5,8,14,0.6)",
              }}
            >
              <div className="flex items-center gap-2" aria-hidden>
                <span className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
                <span className="h-3 w-3 rounded-full" style={{ background: "#febc2e" }} />
                <span className="h-3 w-3 rounded-full" style={{ background: "#28c840" }} />
              </div>

              {/* URL ред */}
              <div
                className="ml-2 flex min-w-0 flex-1 items-center gap-2 rounded-md border px-3 py-1.5"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <span aria-hidden className="text-[10px] text-[var(--color-accent-emerald)]">
                  ⌬
                </span>
                <span className="truncate font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                  promarketing.pw/admin
                  <span className="text-[var(--color-text-tertiary)]"> · демо</span>
                </span>
              </div>

              {/* „на живо“ индикатор */}
              <span
                className="hidden shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 sm:inline-flex"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(52,211,153,0.08)",
                }}
              >
                <LiveDot accent="var(--color-accent-emerald)" reduced={reduced} />
                <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-emerald)]">
                  на живо
                </span>
              </span>
            </div>

            {/* ── Тяло: sidebar + основна зона ── */}
            <div className="flex">
              {/* ── Sidebar ── */}
              <aside
                className="hidden w-44 shrink-0 flex-col border-r p-3 md:flex"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(5,8,14,0.4)",
                }}
              >
                {/* PM лого */}
                <div className="mb-4 flex items-center gap-2.5 px-2 py-1.5">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg font-[family-name:var(--font-editorial)] text-xs font-extrabold"
                    style={{
                      color: "var(--color-bg-void)",
                      background: "var(--color-accent-cyan)",
                      boxShadow: "0 0 16px rgba(34,211,238,0.5)",
                    }}
                    aria-hidden
                  >
                    PM
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                    OS
                  </span>
                </div>

                <nav className="flex flex-col gap-0.5">
                  {NAV.map((item) => (
                    <span
                      key={item.label}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors"
                      style={
                        item.active
                          ? {
                              color: "var(--color-accent-cyan)",
                              background: "rgba(34,211,238,0.10)",
                              boxShadow: "inset 0 0 0 1px rgba(34,211,238,0.2)",
                            }
                          : { color: "var(--color-text-secondary)" }
                      }
                    >
                      <span aria-hidden className="w-4 text-center text-[13px]">
                        {item.glyph}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className="rounded-full px-1.5 py-px font-[family-name:var(--font-mono)] text-[9px]"
                          style={{
                            color: "var(--color-accent-amber)",
                            background: "rgba(251,146,60,0.14)",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </span>
                  ))}
                </nav>

                <div className="mt-auto pt-4">
                  <div
                    className="rounded-lg border px-3 py-2.5"
                    style={{
                      borderColor: "var(--color-border-default)",
                      background: "rgba(34,211,238,0.04)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <LiveDot accent="var(--color-accent-emerald)" reduced={reduced} />
                      <span className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
                        AI агенти · онлайн
                      </span>
                    </div>
                  </div>
                </div>
              </aside>

              {/* ── Основна зона ── */}
              <div className="min-w-0 flex-1 p-4 md:p-5">
                {/* Заглавен ред на таблото */}
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-[family-name:var(--font-editorial)] text-lg font-extrabold text-[var(--color-text-primary)]">
                      Табло
                    </h3>
                    <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
                      понеделник · 12:04 · обновено сега
                    </p>
                  </div>
                  <span
                    className="hidden items-center gap-1.5 rounded-full border px-3 py-1.5 sm:inline-flex"
                    style={{
                      borderColor: "var(--color-border-default)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <span aria-hidden className="text-[var(--color-accent-emerald)]">
                      ▲
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]">
                      +18% седмица
                    </span>
                  </span>
                </div>

                {/* KPI ред */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {KPIS.map((kpi, i) => (
                    <KpiCard key={kpi.label} kpi={kpi} index={i} reduced={reduced} />
                  ))}
                </div>

                {/* 2-колонен грид: call-log + Co-pilot */}
                <div className="mt-4 grid gap-3 lg:grid-cols-5">
                  {/* ЛЯВО: жива call-log таблица */}
                  <div
                    className="relative overflow-hidden rounded-xl border lg:col-span-3"
                    style={{
                      borderColor: "var(--color-border-default)",
                      background: "rgba(255,255,255,0.015)",
                    }}
                  >
                    {/* скенираща линия (1 от макс 2 безкрайни анимации) */}
                    {!reduced && (
                      <motion.div
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 w-1/3"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent, rgba(34,211,238,0.07), transparent)",
                        }}
                        initial={{ x: "-120%" }}
                        animate={{ x: "360%" }}
                        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                      />
                    )}

                    <div
                      className="flex items-center justify-between gap-2 border-b px-3 py-2.5"
                      style={{ borderColor: "var(--color-border-default)" }}
                    >
                      <div className="flex items-center gap-2">
                        <LiveDot accent="var(--color-accent-cyan)" reduced={reduced} />
                        <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-primary)]">
                          Оферти в момента
                        </span>
                      </div>
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]">
                        9 активни · 2 спечелени
                      </span>
                    </div>

                    <ul
                      className="relative divide-y"
                      style={{ ["--tw-divide-opacity" as never]: "1" }}
                    >
                      {OFFERS.map((row, i) => (
                        <OfferLogRow key={row.name} row={row} index={i} reduced={reduced} />
                      ))}
                    </ul>

                    <div
                      className="flex items-center gap-2 border-t px-3 py-2"
                      style={{ borderColor: "var(--color-border-default)" }}
                    >
                      <span aria-hidden className="text-[var(--color-accent-cyan)]">
                        ↻
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]">
                        всичко проследено · нищо не се губи
                      </span>
                    </div>
                  </div>

                  {/* ДЯСНО: AI Co-pilot · Hermes */}
                  <div
                    className="relative flex flex-col overflow-hidden rounded-xl border lg:col-span-2"
                    style={{
                      borderColor: "var(--color-border-bright)",
                      background:
                        "linear-gradient(160deg, rgba(34,211,238,0.06), rgba(13,20,32,0.4))",
                    }}
                  >
                    <div
                      className="flex items-center gap-2.5 border-b px-3.5 py-3"
                      style={{ borderColor: "var(--color-border-default)" }}
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px]"
                        style={{
                          color: "var(--color-accent-cyan)",
                          background: "rgba(34,211,238,0.14)",
                          boxShadow: "0 0 16px rgba(34,211,238,0.3)",
                        }}
                        aria-hidden
                      >
                        ◈
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-primary)]">
                          AI Co-pilot
                        </p>
                        <p className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.12em] text-[var(--color-text-tertiary)]">
                          Hermes · асистент
                        </p>
                      </div>
                      <LiveDot accent="var(--color-accent-emerald)" reduced={reduced} />
                    </div>

                    <ul className="flex flex-col gap-2 p-3">
                      {INSIGHTS.map((insight, i) => (
                        <InsightRow
                          key={insight.text}
                          insight={insight}
                          index={i}
                          reduced={reduced}
                        />
                      ))}
                    </ul>

                    {/* „Hermes пише…“ ред */}
                    <div
                      className="mt-auto flex items-center gap-2.5 border-t px-3.5 py-3"
                      style={{
                        borderColor: "var(--color-border-default)",
                        background: "rgba(34,211,238,0.04)",
                      }}
                    >
                      <span aria-hidden className="text-[13px]">
                        ✍️
                      </span>
                      <span className="flex-1 font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                        Hermes пише 3 оферти
                      </span>
                      <TypingDots reduced={reduced} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stat chips под рамката ── */}
        <motion.ul
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STAT_CHIPS.map((chip) => (
            <li
              key={chip.label}
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{
                borderColor: "var(--color-border-default)",
                background: "var(--color-bg-glass)",
                backdropFilter: "blur(10px)",
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                style={{
                  background: `${chip.accent}14`,
                  boxShadow: `0 0 16px ${chip.accent}22`,
                }}
                aria-hidden
              >
                {chip.glyph}
              </span>
              <span className="text-[13px] font-medium leading-snug text-[var(--color-text-primary)]">
                {chip.label}
              </span>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
