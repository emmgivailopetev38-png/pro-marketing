"use client";
/* =====================================================================
   TestimonialsV2 — the original Testimonials, redrawn in the "2050"
   "Luminescent Depth" language. ALL content is preserved 1:1: the three
   testimonials (initials, names, roles, industries, full quotes, metric
   values + labels, per-card accent colors), the 5-star rows, the metric
   chips, the avatar footers, and the bottom trust strip with every
   industry tag. Only the skin changes — depth-glass cards, neon conic
   edges, holographic title, Sora/JetBrains type via the v2 tokens — plus
   a NeuralCore breathing beside the header. No "лв/лева" present, so no
   currency conversion was needed.

   Stays a client component: the cards keep their motion `whileHover`
   lift, exactly like the original.
   ===================================================================== */
import { motion } from "motion/react";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";

interface Testimonial {
  initials: string;
  name: string;
  role: string;
  industry: string;
  text: string;
  metric: { value: string; label: string };
  accent: string;
}

// Fictional testimonials, mirrored to the same demo personas used in
// CRMShowcase so the public-facing story stays consistent.
const TESTIMONIALS: Testimonial[] = [
  {
    initials: "МС",
    name: "Мария Стоянова",
    role: "Основател",
    industry: "Био магазин · онлайн",
    text: "AI агентите поеха разговорите в Messenger и Instagram. За 3 месеца — сделките се удвоиха. Не работя след 18:00, а продажбите растат.",
    metric: { value: "+108%", label: "месечни продажби" },
    accent: "var(--v2-mint)",
  },
  {
    initials: "НД",
    name: "Николай Димитров",
    role: "Управител",
    industry: "Туристическа агенция",
    text: "Преди прекарвах 20 часа в седмицата с резервации и follow-ups. Сега AI ги пише и потвърждава, а аз се занимавам с клиентите, които всъщност купуват.",
    metric: { value: "18ч", label: "спестени седмично" },
    accent: "var(--v2-cyan)",
  },
  {
    initials: "ЕТ",
    name: "Елена Тодорова",
    role: "Собственик",
    industry: "Бутик за бижута",
    text: "Instagram ботът качи лидове, които ръчно никога нямаше да хвана. CRM системата ми показва кои са горещи и автоматично им пише.",
    metric: { value: "+120%", label: "Instagram продажби" },
    accent: "var(--v2-violet-2)",
  },
];

export function TestimonialsV2() {
  return (
    <section className="v2-section overflow-hidden">
      {/* Signature depth glow backdrop (mirrors the original radial wash) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 70% 30%, var(--v2-glow-cyan) 0%, transparent 50%), radial-gradient(ellipse at 30% 80%, var(--v2-glow-violet) 0%, transparent 50%)",
          opacity: 0.16,
        }}
      />

      <div className="v2-wrap">
        {/* ---- Header + signature neural core --------------------------- */}
        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <SectionReveal>
            <div className="v2-head mb-0">
              <span className="v2-eyebrow">{"// какво казват клиентите"}</span>
              <h2 className="v2-title" lang="bg">
                Реални резултати, реални хора.
              </h2>
              <p className="v2-sub">
                Не показваме счупени метрики или дълги PR разкази. Само какво се промени в бизнеса им.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={120}>
            <div
              className="relative mx-auto hidden h-[300px] w-[300px] shrink-0 lg:block"
              aria-hidden
            >
              <NeuralCore nodeCount={170} radius={1.25} spin={0.8} />
            </div>
          </SectionReveal>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <SectionReveal key={t.name} delay={i * 100}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="v2-card v2-glow group flex h-full flex-col"
                style={{ ["--v2-c" as never]: t.accent }}
              >
                {/* Accent bar — sits above the card's own top sheen */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 z-[1] h-0.5 opacity-70"
                  style={{ background: `linear-gradient(90deg, ${t.accent} 0%, transparent 80%)` }}
                />

                {/* 5 stars */}
                <div className="mb-4 flex gap-0.5" style={{ color: t.accent }}>
                  {[0, 1, 2, 3, 4].map((s) => (
                    <span key={s} className="text-sm">
                      ★
                    </span>
                  ))}
                </div>

                {/* Quote */}
                <p className="mb-5 text-sm leading-relaxed text-[var(--v2-muted)] md:text-[15px]">
                  „{t.text}"
                </p>

                {/* Metric chip */}
                <div
                  className="mb-5 inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5"
                  style={{
                    borderColor: `color-mix(in srgb, ${t.accent} 40%, transparent)`,
                    background: `color-mix(in srgb, ${t.accent} 13%, transparent)`,
                  }}
                >
                  <span className="v2-mono text-sm font-bold" style={{ color: t.accent }}>
                    {t.metric.value}
                  </span>
                  <span className="text-[11px] text-[var(--v2-faint)]">
                    {t.metric.label}
                  </span>
                </div>

                {/* Footer: avatar + name — pinned to the bottom */}
                <div className="mt-auto flex items-center gap-3 border-t border-[var(--v2-line)] pt-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: `color-mix(in srgb, ${t.accent} 22%, transparent)`,
                      color: t.accent,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--v2-ink)]">
                      {t.name}
                    </p>
                    <p className="truncate text-[11px] text-[var(--v2-faint)]">
                      {t.role} · {t.industry}
                    </p>
                  </div>
                </div>
              </motion.article>
            </SectionReveal>
          ))}
        </div>

        {/* Bottom trust strip — small touch */}
        <SectionReveal delay={400}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-[var(--v2-line)] pt-10 text-center">
            <p className="v2-mono text-[10px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">
              Доверие от собственици на бизнеси в:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[var(--v2-muted)]">
              <span>Е-търговия</span>
              <span className="text-[var(--v2-faint)]">·</span>
              <span>Туризъм</span>
              <span className="text-[var(--v2-faint)]">·</span>
              <span>Ресторанти</span>
              <span className="text-[var(--v2-faint)]">·</span>
              <span>Имоти</span>
              <span className="text-[var(--v2-faint)]">·</span>
              <span>Здраве</span>
              <span className="text-[var(--v2-faint)]">·</span>
              <span>B2B услуги</span>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
