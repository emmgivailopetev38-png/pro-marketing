import { SectionReveal } from "@/components/effects/SectionReveal";
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

export function WhyUs() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
              {"// защо нас"}
            </p>
            <h2 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              Не само агенция. Технологичен партньор.
            </h2>
          </div>
        </SectionReveal>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {POINTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <SectionReveal key={p.title} delay={i * 100}>
                <div className="flex flex-col">
                  <Icon className="mb-5 h-10 w-10 text-[var(--color-accent-cyan)]" strokeWidth={1.2} />
                  <h3 className="font-display text-2xl font-bold">{p.title}</h3>
                  <p className="mt-3 text-[var(--color-text-secondary)]">{p.body}</p>
                </div>
              </SectionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
