import {
  Bot,
  Mail,
  Database,
  Mic,
  Filter,
  Sparkles,
  LayoutDashboard,
  Code2,
} from "lucide-react";
import { LiveChatFeed } from "@/components/landing/LiveChatFeed";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";

/* =====================================================================
   ServicesV2 — the original Services section, redrawn in the "2050"
   language ("Luminescent Depth"). Content is 1:1 with the original:
   the same 8 services (texts, icons, feature/highlight flags), the same
   live typing chat embed, and the same "Ново" badges. Only the skin
   changes — depth-glass cards, neon conic edges, holographic title — plus
   a NeuralCore living behind the flagship "AI чат агенти" card.

   No client boundary here: LiveChatFeed and NeuralCore each own their own
   "use client" runtime, so this stays a server component (matches
   TrustStripV2's pattern).
   ===================================================================== */

type Service = {
  icon: typeof Bot;
  title: string;
  body: string;
  feature?: boolean;
  highlight?: boolean;
};

const SERVICES: Service[] = [
  {
    icon: Bot,
    title: "AI чат агенти",
    body: "24/7 поддръжка, продажби и квалификация на лийдове по Messenger, Viber, Instagram и сайт.",
    feature: true,
  },
  {
    icon: LayoutDashboard,
    title: "AI CRM",
    body: "Личен CRM с AI агент — автоматично преглежда лидове, праща оферти, следи договори. Не плащаш Salesforce. Табло на твоя домейн.",
    highlight: true,
  },
  {
    icon: Code2,
    title: "AI Софтуер по поръчка",
    body: "Персонализирани AI инструменти за конкретни процеси в бизнеса ти — от сметки и оферти до планиране и анализи.",
    highlight: true,
  },
  {
    icon: Mail,
    title: "Имейл и SMS автоматизация",
    body: "Персонализирани имейл последователности, сегментация по поведение, винаги навреме.",
  },
  {
    icon: Database,
    title: "CRM интеграции",
    body: "Свързваме Salesforce, HubSpot, Pipedrive, Bitrix със системите ти и автоматизираме записите.",
  },
  {
    icon: Mic,
    title: "Гласови AI агенти",
    body: "Изходящи и входящи обаждания на естествен български — потвърждения, заявки, проследяване.",
  },
  {
    icon: Filter,
    title: "Квалификация на лидове",
    body: "AI оценка и приоритизация — продажбите получават само горещите контакти.",
  },
  {
    icon: Sparkles,
    title: "Генериране на съдържание",
    body: "Блог постове, продуктови описания, социални публикации — на твоя глас, в твоето темпо.",
  },
];

export function ServicesV2() {
  return (
    <section id="services" className="v2-section">
      <div aria-hidden className="v2-grid pointer-events-none absolute inset-0 -z-[1]" />

      <div className="v2-wrap">
        {/* Section header — holographic title + sub, 1:1 copy */}
        <div className="v2-head">
          <div className="v2-reveal">
            <span className="v2-eyebrow">УСЛУГИ</span>
          </div>
          <h2
            className="v2-title v2-reveal"
            style={{
              ["--d" as string]: "0.06s",
              overflowWrap: "break-word",
              hyphens: "auto",
              wordBreak: "break-word",
            }}
            lang="bg"
          >
            Осем начина да автоматизираш бизнеса си
          </h2>
          <p className="v2-sub v2-reveal" style={{ ["--d" as string]: "0.12s" }}>
            От готови чат агенти до{" "}
            <span className="font-semibold text-[var(--v2-ink)]">собствен AI CRM</span>{" "}
            и{" "}
            <span className="font-semibold text-[var(--v2-ink)]">
              AI софтуер по поръчка
            </span>{" "}
            — изграждаме точно това, което бизнесът ти иска.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            const accent = s.highlight ? "var(--v2-violet)" : "var(--v2-cyan)";
            return (
              <div
                key={s.title}
                className={`v2-reveal ${s.feature ? "md:col-span-2" : ""}`}
                style={{ ["--d" as string]: `${0.14 + i * 0.06}s` }}
              >
                <div
                  className={`v2-card v2-glow group relative flex h-full flex-col${
                    s.highlight || s.feature ? " is-always" : ""
                  }`}
                  style={{ ["--v2-c" as string]: accent }}
                >
                  {/* Living neural core behind the flagship chat-agents card */}
                  {s.feature && (
                    <div aria-hidden className="pointer-events-none absolute inset-0">
                      <div className="absolute right-[-6%] top-[-10%] h-[80%] w-[55%] opacity-60">
                        <NeuralCore radius={1.15} nodeCount={170} spin={0.7} />
                      </div>
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(105deg, var(--v2-bg-2) 38%, transparent 100%)",
                        }}
                      />
                    </div>
                  )}

                  {s.highlight && (
                    <span
                      className="v2-status absolute right-4 top-4 z-[2]"
                      style={{
                        color: "var(--v2-cyan)",
                        borderColor: "var(--v2-line-bright)",
                      }}
                    >
                      Ново
                    </span>
                  )}

                  <div className="relative z-[1] flex h-full flex-col">
                    <span
                      aria-hidden
                      className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-[var(--v2-r-sm)]"
                      style={{
                        background: "var(--v2-glass-2)",
                        border: "1px solid var(--v2-line)",
                        boxShadow: "var(--v2-shadow-glow)",
                      }}
                    >
                      <Icon
                        className="h-6 w-6"
                        style={{ color: accent }}
                        strokeWidth={1.5}
                      />
                    </span>

                    <h3
                      className="text-xl font-bold tracking-tight text-[var(--v2-ink)]"
                      style={{ fontFamily: "var(--v2-font-display)" }}
                    >
                      {s.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--v2-muted)]">
                      {s.body}
                    </p>

                    {s.feature && (
                      <div
                        className="mt-6 rounded-[var(--v2-r-sm)] p-5"
                        style={{
                          background: "rgba(4, 6, 13, 0.72)",
                          border: "1px solid var(--v2-line)",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        <div className="mb-3 flex items-center gap-2.5">
                          <span className="v2-status">AI Агент · онлайн</span>
                          <span className="v2-mono text-[10px] text-[var(--v2-faint)]">
                            live demo
                          </span>
                        </div>
                        <LiveChatFeed />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
