import { SectionReveal } from "@/components/effects/SectionReveal";
import { TiltCard } from "@/components/effects/TiltCard";
import { ShoppingBag, Home, UtensilsCrossed, Stethoscope, Scale, Dumbbell, Briefcase } from "lucide-react";

const INDUSTRIES = [
  { icon: ShoppingBag, name: "Е-търговия", use: "Автоматичен ретаргетинг и AI обслужване на клиенти" },
  { icon: Home, name: "Имоти", use: "Квалификация на купувачи и автоматични огледи" },
  { icon: UtensilsCrossed, name: "Ресторанти", use: "Резервации, ревюта, лоялност" },
  { icon: Stethoscope, name: "Медицински клиники", use: "Записване на часове и проследяване на пациенти" },
  { icon: Scale, name: "Юристи", use: "Първоначална консултация и документи" },
  { icon: Dumbbell, name: "Фитнес и студия", use: "Резервации, задържане, абонаменти" },
  { icon: Briefcase, name: "B2B услуги", use: "Развиване на лидове и предложения" },
];

export function Industries() {
  return (
    <section id="industries" className="relative py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
              {"// за кого"}
            </p>
            <h2
              className="font-display text-[clamp(32px,7vw,64px)] font-bold leading-[1.08] tracking-tight"
              style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
              lang="bg"
            >
              Подходящо за всеки бизнес, който иска повече
            </h2>
          </div>
        </SectionReveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind, i) => {
            const Icon = ind.icon;
            return (
              <SectionReveal key={ind.name} delay={i * 60}>
                <TiltCard className="h-full rounded-xl" maxTiltDeg={6}>
                  <div className="glass flex h-full items-start gap-4 rounded-xl p-6">
                    <Icon className="h-6 w-6 shrink-0 text-[var(--color-accent-violet)]" strokeWidth={1.5} />
                    <div>
                      <h3 className="font-display text-lg font-bold">{ind.name}</h3>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{ind.use}</p>
                    </div>
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
