import { SectionReveal } from "@/components/effects/SectionReveal";
import { HolographicText } from "@/components/effects/HolographicText";

const STACK = [
  { name: "OpenAI GPT-5", category: "Foundation Models" },
  { name: "Anthropic Claude", category: "Foundation Models" },
  { name: "Llama / Mistral", category: "Open-source LLM" },
  { name: "Whisper", category: "Voice Recognition" },
  { name: "ElevenLabs", category: "Voice Synthesis" },
  { name: "Vercel AI SDK", category: "Orchestration" },
  { name: "LangGraph", category: "Agent Framework" },
  { name: "Supabase", category: "Backend / DB" },
  { name: "PostgreSQL", category: "Data" },
  { name: "Vector DBs", category: "Memory" },
  { name: "n8n / Make", category: "Workflows" },
  { name: "Next.js", category: "Web" },
  { name: "Cal.com", category: "Booking" },
  { name: "Twilio", category: "Voice / SMS" },
  { name: "Meta / Google API", category: "Ads" },
  { name: "Custom CRM", category: "Built by us" },
];

export function TechStackSection() {
  return (
    <section className="relative py-32 md:py-44">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mb-16 max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
              {"// технологии"}
            </p>
            <h2 className="font-display text-[clamp(34px,6vw,80px)] font-bold leading-[1.02] tracking-tight">
              Не следваме trend-овете.
              <br />
              <HolographicText>Определяме ги.</HolographicText>
            </h2>
            <p className="mt-8 text-lg text-[var(--color-text-secondary)]">
              Използваме точно правилния инструмент за всеки случай — frontier модели за разсъждение, специализирани за конкретни задачи, open-source там където privacy е приоритет.
            </p>
          </div>
        </SectionReveal>

        <SectionReveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {STACK.map((tech, i) => (
              <div
                key={tech.name}
                className="glass flex flex-col gap-1 rounded-xl p-4 transition-colors hover:border-[var(--color-border-bright)]"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <p className="font-display text-sm font-bold tracking-tight md:text-base">
                  {tech.name}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
                  {tech.category}
                </p>
              </div>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
