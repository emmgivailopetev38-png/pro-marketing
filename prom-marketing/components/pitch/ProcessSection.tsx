"use client";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { HolographicText } from "@/components/effects/HolographicText";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const STAGES = [
  {
    code: "01",
    title: "Discovery",
    duration: "~3 дни",
    body: "Чуваме бизнеса. Идентифицираме процесите, които изяждат най-много време. Картираме workflow-овете.",
    deliverables: ["Process audit", "Pain map", "Quick wins списък"],
  },
  {
    code: "02",
    title: "Design",
    duration: "~1 седмица",
    body: "Проектираме AI решението на мярка. Избираме модели. Дефинираме интеграции. Изграждаме prototyp.",
    deliverables: ["Architecture diagram", "Tech stack", "ROI прогноза"],
  },
  {
    code: "03",
    title: "Deploy",
    duration: "2-4 седмици",
    body: "Изграждаме. Обучаваме AI на твоите данни. Свързваме всички системи. Тестваме всеки сценарий.",
    deliverables: ["Production пускане", "Документация", "Обучение на екипа"],
  },
  {
    code: "04",
    title: "Optimize",
    duration: "ongoing",
    body: "Месечни отчети. Постоянна оптимизация. Нови процеси. AI-ът се подобрява всеки месец.",
    deliverables: ["Performance dashboard", "A/B testing", "Continuous learning"],
  },
];

export function ProcessSection() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative border-y border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/30 py-32 md:py-44">
      <div className="mx-auto max-w-5xl px-6">
        <SectionReveal>
          <div className="mb-20 max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
              {"// процесът"}
            </p>
            <h2 className="font-display text-[clamp(34px,6vw,80px)] font-bold leading-[1.02] tracking-tight">
              От идея до{" "}
              <HolographicText>production</HolographicText>
              <br />
              <span className="text-[var(--color-text-secondary)]">за 4 седмици.</span>
            </h2>
          </div>
        </SectionReveal>

        <div ref={ref} className="relative">
          <svg
            aria-hidden
            className="absolute left-[39px] top-0 hidden h-full w-[2px] md:block"
            viewBox="0 0 2 1200"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="pitchLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <line
              x1="1"
              y1="0"
              x2="1"
              y2="1200"
              stroke="url(#pitchLine)"
              strokeWidth="2"
              strokeDasharray="1200"
              strokeDashoffset={visible ? 0 : 1200}
              style={{ transition: "stroke-dashoffset 2.2s cubic-bezier(0.22,1,0.36,1)" }}
            />
          </svg>

          <ol className="space-y-12 md:space-y-20">
            {STAGES.map((stage, i) => (
              <SectionReveal key={stage.code} delay={i * 140} as="li">
                <div className="grid grid-cols-[80px_1fr] gap-6 md:gap-10">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl glass">
                    <span className="font-mono text-base text-[var(--color-accent-cyan)]">
                      {stage.code}
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-4">
                      <h3 className="font-display text-3xl font-bold md:text-4xl">{stage.title}</h3>
                      <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                        {stage.duration}
                      </span>
                    </div>
                    <p className="mt-3 max-w-2xl text-base text-[var(--color-text-secondary)] md:text-lg">
                      {stage.body}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {stage.deliverables.map((d) => (
                        <span
                          key={d}
                          className="rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-glass)] px-3 py-1 text-xs text-[var(--color-text-secondary)]"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
