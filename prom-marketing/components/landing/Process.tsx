"use client";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const STEPS = [
  {
    num: "01",
    title: "Разговор",
    body: "Чуваме твоя бизнес и идентифицираме процесите, които изяждат най-много време.",
  },
  {
    num: "02",
    title: "Анализ",
    body: "Картираме workflow-овете, измерваме разходите и определяме приоритетите.",
  },
  {
    num: "03",
    title: "Изграждане",
    body: "Изграждаме и обучаваме AI агентите във вашата среда — без техническа намеса от вас.",
  },
  {
    num: "04",
    title: "Стартиране",
    body: "Тестваме, пускаме на живо, измерваме резултатите и оптимизираме всеки месец.",
  },
];

export function Process() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  return (
    <section id="process" className="relative py-32">
      <div className="mx-auto max-w-5xl px-6">
        <SectionReveal>
          <div className="mb-20 max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
              {"// процес"}
            </p>
            <h2 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              Четири стъпки от идея до резултат
            </h2>
          </div>
        </SectionReveal>

        <div ref={ref} className="relative">
          <svg
            aria-hidden
            className="absolute left-[27px] top-0 hidden h-full w-[2px] md:block"
            viewBox="0 0 2 1000"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="processLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <line
              x1="1" y1="0" x2="1" y2="1000"
              stroke="url(#processLine)"
              strokeWidth="2"
              strokeDasharray="1000"
              strokeDashoffset={visible ? 0 : 1000}
              style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.22,1,0.36,1)" }}
            />
          </svg>

          <ol className="space-y-14 md:space-y-20">
            {STEPS.map((step, i) => (
              <SectionReveal
                key={step.num}
                delay={i * 120}
                as="li"
                className="grid grid-cols-[56px_1fr] items-start gap-6 md:gap-10"
              >
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full glass">
                  <span className="font-mono text-sm text-[var(--color-accent-cyan)]">{step.num}</span>
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold md:text-3xl">{step.title}</h3>
                  <p className="mt-3 max-w-lg text-[var(--color-text-secondary)]">{step.body}</p>
                </div>
              </SectionReveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
