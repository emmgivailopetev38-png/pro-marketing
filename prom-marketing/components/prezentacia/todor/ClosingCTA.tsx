"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { Transition, Variants } from "motion/react";
import { AuroraBackground } from "@/components/effects/AuroraBackground";
import { ParticleField } from "@/components/effects/ParticleField";
import { HolographicText } from "@/components/effects/HolographicText";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ------------------------------------------------------------------ */
/*  Типове                                                             */
/* ------------------------------------------------------------------ */

interface AccentTokens {
  readonly color: string;
  /** rgb тройка за rgba() миксове */
  readonly rgb: string;
}

/** Вторичен контакт-бутон (телефон / имейл). */
interface ContactLink {
  readonly id: string;
  readonly href: string;
  readonly glyph: string;
  /** малък mono етикет отгоре */
  readonly kicker: string;
  /** видимата стойност */
  readonly value: string;
  readonly accent: AccentTokens;
}

/** Готовност-чек преди изстрелване. */
interface ReadyItem {
  readonly id: string;
  readonly label: string;
  readonly delayMs: number;
}

/* ------------------------------------------------------------------ */
/*  Акцентни токени                                                    */
/* ------------------------------------------------------------------ */

const CYAN: AccentTokens = { color: "var(--color-accent-cyan)", rgb: "34,211,238" };
const SKY: AccentTokens = { color: "var(--color-accent-sky)", rgb: "56,189,248" };
const AMBER: AccentTokens = { color: "var(--color-accent-amber)", rgb: "251,146,60" };

/* ------------------------------------------------------------------ */
/*  Данни (фиксирани, илюстративни)                                    */
/* ------------------------------------------------------------------ */

const CONTACTS: readonly ContactLink[] = [
  {
    id: "phone",
    href: "tel:+359877399963",
    glyph: "☎",
    kicker: "обади се",
    value: "+359 877 399 963",
    accent: SKY,
  },
  {
    id: "email",
    href: "mailto:ivailopetev38@gmail.com?subject=AI%20CRM%20система",
    glyph: "✉",
    kicker: "пиши ни",
    value: "ivailopetev38@gmail.com",
    accent: AMBER,
  },
] as const;

const READY_ITEMS: readonly ReadyItem[] = [
  { id: "agents", label: "агентите · готови", delayMs: 500 },
  { id: "offers", label: "офертите · проследени", delayMs: 1050 },
  { id: "amazon", label: "Amazon канал · засечен", delayMs: 1600 },
] as const;

const FOOTER_PARTS: readonly string[] = [
  "„ПроМаркетинг“ ЕООД",
  "Ивайло Петев — управител",
  "ivailopetev38@gmail.com",
  "promarketing.pw",
] as const;

const EASE: Transition["ease"] = [0.22, 1, 0.36, 1];
const BOOKING_URL = "https://promarketing.pw/booking";

/* ------------------------------------------------------------------ */
/*  Малки под-компоненти                                               */
/* ------------------------------------------------------------------ */

/** Жив индикатор — пулсиращо ядро + ринг (CSS, не JS). */
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

/**
 * Светещият главен бутон с пулсиращи рингове зад него.
 * Ринговете са CSS-only (само 1 keyframe тип) → евтини и спрени при reduced.
 */
function LaunchButton({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Пулсиращи рингове зад бутона */}
      {!reduced && (
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute h-full w-full rounded-full border"
              style={{
                borderColor: `rgba(${CYAN.rgb},0.45)`,
                animation: "cta-ring 3s cubic-bezier(0.22,1,0.36,1) infinite",
                animationDelay: `${i * 1}s`,
              }}
            />
          ))}
          {/* меко свечение под бутона */}
          <span
            className="absolute h-44 w-44 rounded-full blur-3xl"
            style={{
              background: `radial-gradient(circle, rgba(${CYAN.rgb},0.55) 0%, transparent 70%)`,
              animation: "cta-glow 4s ease-in-out infinite",
            }}
          />
        </div>
      )}
      {/* статично свечение при reduced, за дълбочина без движение */}
      {reduced && (
        <span
          aria-hidden
          className="pointer-events-none absolute h-40 w-40 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(${CYAN.rgb},0.4) 0%, transparent 70%)` }}
        />
      )}

      <MagneticButton strength={0.4} radius={84}>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-9 py-4 font-[family-name:var(--font-editorial)] text-base font-extrabold uppercase tracking-[0.1em] text-[var(--color-bg-void)] transition-shadow duration-300 md:text-lg"
          style={{
            background:
              "linear-gradient(120deg, var(--color-accent-cyan), var(--color-accent-sky))",
            boxShadow: "0 0 50px rgba(34,211,238,0.5), inset 0 0 0 1px rgba(255,255,255,0.18)",
          }}
        >
          {/* плъзгащ се блясък при hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
            }}
          />
          <span aria-hidden className="relative text-lg leading-none">
            ◈
          </span>
          <span className="relative">Запази разговор</span>
          <span
            aria-hidden
            className="relative text-xl leading-none transition-transform duration-300 group-hover:translate-x-1.5"
          >
            →
          </span>
        </a>
      </MagneticButton>
    </div>
  );
}

/** Вторичен контакт-бутон. */
function ContactButton({ contact, index, reduced }: { contact: ContactLink; index: number; reduced: boolean }) {
  return (
    <motion.a
      href={contact.href}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: 0.1 + index * 0.1, ease: EASE }}
      className="group flex items-center gap-3 rounded-2xl border px-5 py-3.5 backdrop-blur-md transition-colors"
      style={{
        borderColor: "var(--color-border-default)",
        background: "var(--color-bg-glass)",
      }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base transition-transform duration-300 group-hover:scale-110"
        style={{
          color: contact.accent.color,
          borderColor: `rgba(${contact.accent.rgb},0.32)`,
          background: `rgba(${contact.accent.rgb},0.09)`,
        }}
        aria-hidden
      >
        {contact.glyph}
      </span>
      <span className="flex flex-col text-left">
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-tertiary)]">
          {contact.kicker}
        </span>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          {contact.value}
        </span>
      </span>
      <span
        aria-hidden
        className="ml-auto text-[var(--color-text-tertiary)] transition-transform duration-300 group-hover:translate-x-1"
      >
        →
      </span>
    </motion.a>
  );
}

/**
 * „Pre-launch checklist" — изписва се ред по ред след mount.
 * Таймерите живеят в useEffect → няма SSR четене на време.
 */
function ReadyChecklist({ reduced }: { reduced: boolean }) {
  const [revealed, setRevealed] = useState<number>(0);

  useEffect(() => {
    // При reduced → нулев delay (моментално, но през timer, без синхронен setState).
    const timers = READY_ITEMS.map((item, i) =>
      window.setTimeout(
        () => setRevealed((n) => Math.max(n, i + 1)),
        reduced ? 0 : item.delayMs
      )
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reduced]);

  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5">
      {READY_ITEMS.map((item, i) => {
        const isOpen = i < revealed;
        return (
          <li
            key={item.id}
            className="flex items-center gap-2 transition-all duration-500"
            style={{
              opacity: isOpen ? 1 : 0.25,
              transform: isOpen ? "translateY(0)" : "translateY(4px)",
            }}
          >
            <span
              className="text-[var(--color-accent-emerald)] transition-opacity duration-500"
              style={{ opacity: isOpen ? 1 : 0 }}
              aria-hidden
            >
              ✓
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
              {item.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Главна секция                                                      */
/* ------------------------------------------------------------------ */

export function ClosingCTA() {
  const reduced = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduced ? 0 : 0.12, delayChildren: reduced ? 0 : 0.08 },
    },
  };
  const rise: Variants = {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 26 },
    show: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.75, ease: EASE } },
  };

  return (
    <section
      id="cta"
      className="relative overflow-hidden border-t border-[var(--color-border-default)] py-28 font-[family-name:var(--font-body)] md:py-40"
    >
      {/* ── Фонови слоеве ── */}
      <div aria-hidden className="absolute inset-0 z-0">
        <AuroraBackground intensity="intense" />
        <ParticleField density={42} />
        {/* централно ядро-свечение зад заглавието */}
        <div
          className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle, rgba(34,211,238,0.12) 0%, rgba(34,211,238,0.05) 35%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        {/* фин grid с radial маска */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-accent-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent-cyan) 1px, transparent 1px)",
            backgroundSize: "76px 76px",
            maskImage: "radial-gradient(ellipse at 50% 45%, black 0%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 0%, transparent 78%)",
          }}
        />
        {/* издигащ се „launch" лъч от дъното (единствена безкрайна motion-анимация) */}
        {!reduced && (
          <motion.div
            className="absolute bottom-0 left-1/2 h-[60vh] w-px -translate-x-1/2"
            style={{
              background:
                "linear-gradient(to top, rgba(34,211,238,0.5), transparent)",
            }}
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: [0, 0.8, 0], scaleY: [0.4, 1, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {/* долен fade към void */}
        <div
          className="absolute inset-x-0 bottom-0 h-44"
          style={{ background: "linear-gradient(to bottom, transparent, var(--color-bg-void))" }}
        />
      </div>

      {/* ── Съдържание ── */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center md:px-12"
      >
        {/* Eyebrow */}
        <motion.div variants={rise} className="mb-7">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-glass)] px-4 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent-cyan)] backdrop-blur-md">
            <LiveDot accent={CYAN} reduced={reduced} />
            Следваща стъпка
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          variants={rise}
          lang="bg"
          className="font-[family-name:var(--font-editorial)] text-[clamp(34px,6vw,72px)] font-extrabold leading-[1.04] text-[var(--color-text-primary)]"
          style={{ textShadow: "0 0 60px rgba(34,211,238,0.25)" }}
        >
          Готов ли си да{" "}
          <span
            className="text-[var(--color-accent-cyan)]"
            style={{ textShadow: "0 0 40px rgba(34,211,238,0.55)" }}
          >
            пуснем агентите
          </span>
          ?
        </motion.h2>

        {/* Холографски под-ред */}
        <motion.div variants={rise} className="mt-4">
          <HolographicText
            as="h3"
            className="font-[family-name:var(--font-editorial)] text-[clamp(15px,2.4vw,22px)] font-bold"
          >
            системата е сглобена · чака само твоето „да“
          </HolographicText>
        </motion.div>

        {/* Копи */}
        <motion.p
          variants={rise}
          className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg"
        >
          Един разговор е достатъчен. Показваме ти центъра на живо, минаваме през твоите
          процеси и включваме автоматизациите една по една — без риск, без излишни думи.
        </motion.p>

        {/* Главен бутон с рингове */}
        <motion.div variants={rise} className="mt-12">
          <LaunchButton reduced={reduced} />
        </motion.div>

        {/* Pre-launch checklist */}
        <motion.div variants={rise} className="mt-8">
          <ReadyChecklist reduced={reduced} />
        </motion.div>

        {/* Вторични контакти */}
        <motion.div
          variants={rise}
          className="mt-9 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
        >
          {CONTACTS.map((contact, i) => (
            <ContactButton key={contact.id} contact={contact} index={i} reduced={reduced} />
          ))}
        </motion.div>

        {/* Разделител */}
        <motion.div
          variants={rise}
          aria-hidden
          className="mt-14 h-px w-full max-w-md"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-border-bright), transparent)",
          }}
        />

        {/* Footer ред */}
        <motion.div
          variants={rise}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)] sm:text-[11px]"
        >
          {FOOTER_PARTS.map((part, i) => (
            <span key={part} className="flex items-center gap-x-3">
              {i > 0 && (
                <span aria-hidden className="text-[var(--color-accent-cyan)] opacity-50">
                  ·
                </span>
              )}
              <span>{part}</span>
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Локални keyframes за ринговете/свечението ── */}
      <style>{`
        @keyframes cta-ring {
          0% { transform: scale(0.55); opacity: 0; }
          18% { opacity: 0.7; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes cta-glow {
          0%, 100% { opacity: 0.55; transform: scale(0.92); }
          50% { opacity: 0.9; transform: scale(1.06); }
        }
      `}</style>
    </section>
  );
}
