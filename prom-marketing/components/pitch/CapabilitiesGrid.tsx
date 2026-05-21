import { SectionReveal } from "@/components/effects/SectionReveal";
import { TiltCard } from "@/components/effects/TiltCard";
import { HolographicText } from "@/components/effects/HolographicText";
import {
  Bot,
  Mic,
  Database,
  Filter,
  Workflow,
  Sparkles,
  BrainCircuit,
  Mail,
  GitBranch,
  Headphones,
  ScanSearch,
  Bell,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

interface Capability {
  icon: LucideIcon;
  badge: string;
  title: string;
  body: string;
  bullets: string[];
  accent: "cyan" | "violet" | "magenta";
}

const CAPABILITIES: Capability[] = [
  {
    icon: Bot,
    badge: "AI Агенти",
    title: "AI чат агенти",
    body: "24/7 поддръжка, продажби и квалификация. Звучи като най-добрия ти служител — но не спи.",
    bullets: ["Messenger, Viber, Instagram, сайт", "Български + 40 езика", "Помни всичко от разговора"],
    accent: "cyan",
  },
  {
    icon: Mic,
    badge: "Voice AI",
    title: "Гласови AI агенти",
    body: "Реални обаждания на естествен български. Изходящи и входящи. Не отличаваш ги от човек.",
    bullets: ["Потвърждения на поръчки", "Follow-up на лийдове", "Reception 24/7"],
    accent: "violet",
  },
  {
    icon: Database,
    badge: "Custom CRM",
    title: "CRM системи на мярка",
    body: "Не Salesforce. Не HubSpot. Точно това което ти трябва — нищо повече, нищо по-малко.",
    bullets: ["Изградена за твоя workflow", "Свързана с всички твои канали", "Без скрити такси"],
    accent: "magenta",
  },
  {
    icon: Filter,
    badge: "Lead Intel",
    title: "Lead qualification AI",
    body: "Скоринг и приоритизация в реално време. Продажбите виждат само горещите. Останалите се nurture-ват автоматично.",
    bullets: ["Анализ на поведение", "Качество, не количество", "ROI per lead tracking"],
    accent: "cyan",
  },
  {
    icon: Workflow,
    badge: "Automation",
    title: "Task automation",
    body: "Всеки повтарящ се процес — изчезва. Excel-и, имейли, ръчни прехвърляния — автоматизирани.",
    bullets: ["Cross-system orchestration", "Без техническа намеса", "Часове станали минути"],
    accent: "violet",
  },
  {
    icon: BrainCircuit,
    badge: "AI Sales",
    title: "AI Sales агенти",
    body: "Преговаря, отговаря на въпроси, преодолява възражения. Подава готови сделки на хората ти.",
    bullets: ["Custom training на твоя продукт", "Multi-touch sequences", "Транскрипти + insights"],
    accent: "magenta",
  },
  {
    icon: Mail,
    badge: "Sequences",
    title: "Email / SMS / WhatsApp",
    body: "Персонализирани последователности. Сегментация на база поведение. Винаги навреме.",
    bullets: ["Triggered кампании", "A/B testing автоматично", "Open + click + reply tracking"],
    accent: "cyan",
  },
  {
    icon: Sparkles,
    badge: "Content",
    title: "Content генерация",
    body: "Блог постове, продуктови описания, социални публикации, реклами — на твоя глас, в твоето темпо.",
    bullets: ["SEO-оптимизирано", "Brand voice tuning", "1000+ артикула / месец"],
    accent: "violet",
  },
  {
    icon: ScanSearch,
    badge: "Data Intel",
    title: "Data Intelligence",
    body: "Извлича insights от твоите данни. Предсказва. Препоръчва. Открива модели, които ти липсват.",
    bullets: ["Churn prediction", "Customer segmentation", "Revenue forecasting"],
    accent: "magenta",
  },
  {
    icon: GitBranch,
    badge: "Integration",
    title: "Workflow orchestration",
    body: "Свързва всички твои системи в един source of truth. CRM, email, реклами, склад — едно цяло.",
    bullets: ["API-first", "Real-time sync", "Без vendor lock-in"],
    accent: "cyan",
  },
  {
    icon: Headphones,
    badge: "Support",
    title: "AI Customer Support",
    body: "Решава 80% от запитванията без човек. Останалите ескалира с пълен контекст.",
    bullets: ["Knowledge base auto-build", "Ticket priority AI", "Customer sentiment tracking"],
    accent: "violet",
  },
  {
    icon: Bell,
    badge: "Triggers",
    title: "Smart Triggers",
    body: "Реагира на всяко важно събитие — нов лийд, тих клиент, абонамент пред изтичане. Никога не пропускаш.",
    bullets: ["Real-time alerts", "Conditional logic", "Multi-channel actions"],
    accent: "magenta",
  },
];

export function CapabilitiesGrid() {
  return (
    <section id="capabilities" className="relative py-32 md:py-44">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mb-20 max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
              {"// какво строим за теб"}
            </p>
            <h2 className="font-display text-[clamp(34px,6vw,80px)] font-bold leading-[1.02] tracking-tight">
              <HolographicText>12 направления.</HolographicText>
              <br />
              <span className="text-[var(--color-text-secondary)]">Едно решение —</span> твоето.
            </h2>
            <p className="mt-8 text-lg text-[var(--color-text-secondary)]">
              Не се продаваме на пакети. Комбинираме това, което ти трябва. Започваме от един процес, разрастваме се до пълна AI инфраструктура.
            </p>
          </div>
        </SectionReveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon;
            const accentVar =
              cap.accent === "cyan"
                ? "var(--color-accent-cyan)"
                : cap.accent === "violet"
                ? "var(--color-accent-violet)"
                : "var(--color-accent-magenta)";
            return (
              <SectionReveal key={cap.title} delay={i * 60}>
                <TiltCard className="h-full rounded-2xl" maxTiltDeg={6}>
                  <div className="glass relative flex h-full flex-col overflow-hidden rounded-2xl p-6">
                    <div
                      aria-hidden
                      className="absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-25 blur-2xl"
                      style={{ background: `radial-gradient(circle, ${accentVar}, transparent)` }}
                    />
                    <div className="relative flex items-start justify-between">
                      <Icon className="h-7 w-7" strokeWidth={1.4} style={{ color: accentVar }} />
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em]"
                        style={{
                          background: `${accentVar}1a`,
                          color: accentVar,
                        }}
                      >
                        {cap.badge}
                      </span>
                    </div>
                    <h3 className="relative mt-6 font-display text-xl font-bold leading-tight">
                      {cap.title}
                    </h3>
                    <p className="relative mt-3 text-sm text-[var(--color-text-secondary)]">{cap.body}</p>
                    <ul className="relative mt-5 space-y-1.5 text-xs text-[var(--color-text-tertiary)]">
                      {cap.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2">
                          <span
                            aria-hidden
                            className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                            style={{ background: accentVar }}
                          />
                          {b}
                        </li>
                      ))}
                    </ul>
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
