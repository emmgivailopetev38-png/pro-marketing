/* =====================================================================
   WhyUsV2 — "2050" redesign of components/landing/WhyUs.tsx.
   Same copy, same three POINTS, same lucide icons — preserved 1:1.
   Reskinned to the "Luminescent Depth" language via v2-* classes:
   depth-glass cards with a rotating conic neon edge (alternating cyan /
   violet), a holographic section title, and a NeuralCore anchoring the
   header as the signature centerpiece.
   No client interactivity in the original → stays a server component
   (entrance handled by SectionReveal, exactly like IndustriesV2).
   ===================================================================== */
import { SectionReveal } from "@/components/effects/SectionReveal";
import { TiltCard } from "@/components/effects/TiltCard";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";
import { Zap, Wand2, ShieldCheck } from "lucide-react";

const POINTS = [
  {
    icon: Zap,
    title: "Резултати за седмици, не месеци",
    body: "Типичен проект стартира за 2-4 седмици. Без дълги дискавъри и презентации — фокус върху impact.",
  },
  {
    icon: Wand2,
    title: "Без техническа сложност за теб",
    body: "Ние се занимаваме с интеграциите. Ти виждаш само рапортите и резултатите.",
  },
  {
    icon: ShieldCheck,
    title: "Прозрачно ценообразуване",
    body: "Никакви скрити такси. Фиксирана цена, ясни срокове, ясни KPI-та.",
  },
];

export function WhyUsV2() {
  return (
    <section className="v2-section">
      <div className="v2-wrap">
        {/* header + signature neural core */}
        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <SectionReveal>
            <div className="v2-head mb-0 max-w-2xl">
              <span className="v2-eyebrow">{"// защо нас"}</span>
              <h2
                className="v2-title"
                style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
                lang="bg"
              >
                Не само агенция. Технологичен партньор.
              </h2>
            </div>
          </SectionReveal>

          <SectionReveal delay={120}>
            <div
              className="relative mx-auto hidden h-[300px] w-[300px] shrink-0 lg:block"
              aria-hidden
            >
              <NeuralCore nodeCount={180} radius={1.25} spin={0.85} />
            </div>
          </SectionReveal>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {POINTS.map((p, i) => {
            const Icon = p.icon;
            // alternate the conic-edge + icon hue: cyan / violet
            const hue = i % 2 === 0 ? "var(--v2-cyan)" : "var(--v2-violet)";
            const iconColor = i % 2 === 0 ? "var(--v2-cyan)" : "var(--v2-violet)";
            return (
              <SectionReveal key={p.title} delay={i * 100}>
                <TiltCard className="h-full" maxTiltDeg={6} glow={false}>
                  <div
                    className="v2-card v2-glow flex h-full flex-col"
                    style={{ ["--v2-c" as never]: hue }}
                  >
                    <span
                      className="mb-5 grid h-12 w-12 shrink-0 place-items-center rounded-[12px]"
                      style={{
                        border: "1px solid var(--v2-line)",
                        background: "var(--v2-glass-2)",
                      }}
                    >
                      <Icon className="h-6 w-6" strokeWidth={1.4} style={{ color: iconColor }} />
                    </span>
                    <h3
                      className="font-bold leading-tight"
                      style={{ fontFamily: "var(--v2-font-display)", fontSize: "1.375rem", color: "var(--v2-ink)" }}
                    >
                      {p.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--v2-muted)" }}>
                      {p.body}
                    </p>
                  </div>
                </TiltCard>
              </SectionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
