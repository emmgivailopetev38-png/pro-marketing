import { Bot, Mail, Database, Mic, Filter, Sparkles } from "lucide-react";
import { TiltCard } from "@/components/effects/TiltCard";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { LiveChatFeed } from "./LiveChatFeed";

const SERVICES = [
  {
    icon: Bot,
    title: "AI чат агенти",
    body: "24/7 поддръжка, продажби и квалификация на лийдове по Messenger, Viber, Instagram и сайт.",
    feature: true,
  },
  {
    icon: Mail,
    title: "Email и SMS автоматизация",
    body: "Персонализирани имейл секвенции, сегментация на база поведение, винаги навреме.",
  },
  {
    icon: Database,
    title: "CRM интеграции",
    body: "Свързваме Salesforce, HubSpot, Pipedrive, Bitrix със системите ти и автоматизираме записите.",
  },
  {
    icon: Mic,
    title: "Гласови AI агенти",
    body: "Изходящи и входящи обаждания на естествен български — потвърждения, заявки, follow-ups.",
  },
  {
    icon: Filter,
    title: "Lead qualification",
    body: "AI скоринг и приоритизация — продажбите получават само горещите контакти.",
  },
  {
    icon: Sparkles,
    title: "Content генерация",
    body: "Блог постове, продуктови описания, социални публикации — на твоя глас, в твоето темпо.",
  },
];

export function Services() {
  return (
    <section id="services" className="relative py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
              {"// услуги"}
            </p>
            <h2
              className="font-display text-[clamp(32px,7vw,64px)] font-bold leading-[1.08] tracking-tight"
              style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
              lang="bg"
            >
              Шест начина да автоматизираш бизнеса си
            </h2>
          </div>
        </SectionReveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:grid-rows-2">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <SectionReveal key={s.title} delay={i * 80} className={s.feature ? "md:col-span-2" : ""}>
                <TiltCard className="h-full rounded-2xl">
                  <div className="glass relative h-full rounded-2xl p-7">
                    <Icon className="mb-5 h-7 w-7 text-[var(--color-accent-cyan)]" strokeWidth={1.5} />
                    <h3 className="font-display text-xl font-bold">{s.title}</h3>
                    <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{s.body}</p>
                    {s.feature && (
                      <div className="mt-6 rounded-xl bg-[var(--color-bg-void)]/70 p-5">
                        <LiveChatFeed />
                      </div>
                    )}
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
