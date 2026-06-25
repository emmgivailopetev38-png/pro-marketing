"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ------------------------------------------------------------------ */
/*  Типове                                                             */
/* ------------------------------------------------------------------ */

type Accent = "cyan" | "amber";

interface ChannelChip {
  readonly label: string;
}

interface Channel {
  readonly tag: string;
  readonly title: string;
  readonly subtitle: string;
  readonly glyph: string;
  readonly accent: Accent;
  readonly accentVar: string;
  readonly lines: readonly string[];
  readonly chips: readonly ChannelChip[];
}

interface FlowNode {
  readonly label: string;
  readonly glyph: string;
}

/* ------------------------------------------------------------------ */
/*  Данни (фиксирани, илюстративни)                                    */
/* ------------------------------------------------------------------ */

const CHANNELS: readonly Channel[] = [
  {
    tag: "Канал 01",
    title: "България",
    subtitle: "по телефон",
    glyph: "☎",
    accent: "cyan",
    accentVar: "var(--color-accent-cyan)",
    lines: [
      "Един търговец поема запитванията и поръчките.",
      "Оферти се изготвят и изпращат по телефона.",
      "Всяка стъпка минава на ръка — без следа в система.",
    ],
    chips: [{ label: "1 търговец" }, { label: "по телефон" }, { label: "ръчно" }],
  },
  {
    tag: "Канал 02",
    title: "Международно",
    subtitle: "Amazon",
    glyph: "✦",
    accent: "amber",
    accentVar: "var(--color-accent-amber)",
    lines: [
      "Amazon, crowdfunding кампании и външни маркетплейси.",
      "Репортите за продажби пристигат по имейл.",
      "Автоматизирано е — но напълно извън CRM.",
    ],
    chips: [{ label: "Amazon" }, { label: "crowdfunding" }, { label: "имейл репорти" }],
  },
] as const;

const PRODUCTS: readonly string[] = [
  "Стойки за климатици",
  "Елементи за вентилация",
  "Климатизация",
  "Камини (Amazon)",
];

const FLOW: readonly FlowNode[] = [
  { label: "Поръчка", glyph: "▦" },
  { label: "Цех", glyph: "◈" },
  { label: "Склад", glyph: "▣" },
  { label: "Готово", glyph: "✓" },
];

/* ------------------------------------------------------------------ */
/*  Малки под-компоненти                                               */
/* ------------------------------------------------------------------ */

function Pill({
  children,
  accentVar,
}: {
  children: ReactNode;
  accentVar: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] text-[var(--color-text-secondary)]"
      style={{
        borderColor: "var(--color-border-default)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <span aria-hidden style={{ color: accentVar }}>
        ◦
      </span>
      {children}
    </span>
  );
}

function ChannelCard({ channel, index }: { channel: Channel; index: number }) {
  const reduced = useReducedMotion();

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border p-7 md:p-9"
      style={{
        borderColor: "var(--color-border-default)",
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(14px)",
      }}
    >
      {/* Светещ ъглов halo при hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
        style={{
          background: `radial-gradient(circle, ${channel.accentVar} 0%, transparent 70%)`,
        }}
      />
      {/* Тънка светеща горна линия */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px opacity-50 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${channel.accentVar}, transparent)`,
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p
              className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em]"
              style={{ color: channel.accentVar }}
            >
              {channel.tag}
            </p>
            <h3 className="mt-3 font-[family-name:var(--font-editorial)] text-2xl font-extrabold leading-tight text-[var(--color-text-primary)] md:text-3xl">
              {channel.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
              {channel.subtitle}
            </p>
          </div>

          {/* Глиф-бадж */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg"
            style={{
              borderColor: "var(--color-border-bright)",
              color: channel.accentVar,
              background: "rgba(255,255,255,0.03)",
            }}
            aria-hidden
          >
            {channel.glyph}
          </div>
        </div>

        {/* Редове описание */}
        <ul className="space-y-3">
          {channel.lines.map((line) => (
            <li
              key={line}
              className="flex gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)]"
            >
              <span
                aria-hidden
                className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: channel.accentVar }}
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {/* Stat chips */}
        <div className="mt-7 flex flex-wrap gap-2">
          {channel.chips.map((chip) => (
            <Pill key={chip.label} accentVar={channel.accentVar}>
              {chip.label}
            </Pill>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function FlowStrip() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-8 overflow-hidden rounded-3xl border p-6 md:p-8"
      style={{
        borderColor: "var(--color-border-default)",
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(14px)",
      }}
    >
      {/* Скенираща линия (единствената безкрайна анимация в секцията) */}
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

      <p className="relative mb-5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
        Поток на производството
      </p>

      <div className="relative flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {FLOW.map((node, i) => (
          <div key={node.label} className="flex flex-1 items-center gap-3">
            {/* Възел */}
            <div className="flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3"
              style={{
                borderColor: "var(--color-border-default)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm"
                style={{
                  color: "var(--color-accent-cyan)",
                  background: "rgba(34,211,238,0.10)",
                  boxShadow: "0 0 18px rgba(34,211,238,0.18)",
                }}
                aria-hidden
              >
                {node.glyph}
              </span>
              <span className="font-[family-name:var(--font-mono)] text-xs tracking-[0.1em] text-[var(--color-text-primary)]">
                {node.label}
              </span>
            </div>

            {/* Стрелка между възлите */}
            {i < FLOW.length - 1 && (
              <span
                aria-hidden
                className="shrink-0 rotate-90 text-base text-[var(--color-text-tertiary)] sm:rotate-0"
                style={{ color: "var(--color-accent-sky)" }}
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Главна секция                                                      */
/* ------------------------------------------------------------------ */

export function BusinessSnapshot() {
  const reduced = useReducedMotion();

  return (
    <section
      id="biznes"
      className="relative overflow-hidden border-t border-[var(--color-border-default)] py-24 md:py-32"
    >
      {/* Фонов ambient градиент */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 0%, rgba(34,211,238,0.06) 0%, transparent 55%), radial-gradient(ellipse at 90% 20%, rgba(251,146,60,0.05) 0%, transparent 50%)",
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
            Твоят бизнес днес
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
          Какво <span className="text-[var(--color-accent-cyan)]">имаш</span>
        </motion.h2>

        {/* Подзаглавие */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg"
        >
          Два канала, два различни свята — и нито един от тях не се вижда на едно
          място.
        </motion.p>

        {/* Канал-карти */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {CHANNELS.map((channel, i) => (
            <ChannelCard key={channel.title} channel={channel} index={i} />
          ))}
        </div>

        {/* Продуктови chips */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-wrap items-center gap-2.5"
        >
          <span className="mr-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
            Продукти
          </span>
          {PRODUCTS.map((product) => (
            <span
              key={product}
              className="rounded-full border px-4 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors duration-300 hover:text-[var(--color-text-primary)]"
              style={{
                borderColor: "var(--color-border-default)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              {product}
            </span>
          ))}
        </motion.div>

        {/* Flow лента */}
        <FlowStrip />
      </div>
    </section>
  );
}
