import { SectionReveal } from "@/components/effects/SectionReveal";
import { TiltCard } from "@/components/effects/TiltCard";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";
import { ShoppingBag, Home, UtensilsCrossed, Stethoscope, Scale, Dumbbell, Briefcase } from "lucide-react";

const INDUSTRIES = [
  { icon: ShoppingBag, name: "Е-търговия", use: "Автоматичен ретаргетинг и AI обслужване на клиенти", tag: "RETAIL" },
  { icon: Home, name: "Имоти", use: "Квалификация на купувачи и автоматични огледи", tag: "ESTATE" },
  { icon: UtensilsCrossed, name: "Ресторанти", use: "Резервации, ревюта, лоялност", tag: "HORECA" },
  { icon: Stethoscope, name: "Медицински клиники", use: "Записване на часове и проследяване на пациенти", tag: "MEDICAL" },
  { icon: Scale, name: "Юристи", use: "Първоначална консултация и документи", tag: "LEGAL" },
  { icon: Dumbbell, name: "Фитнес и студия", use: "Резервации, задържане, абонаменти", tag: "FITNESS" },
  { icon: Briefcase, name: "B2B услуги", use: "Развиване на лидове и предложения", tag: "B2B" },
];

export function IndustriesV2() {
  return (
    <section id="industries" className="v2-section">
      <div className="v2-wrap">
        {/* header + signature neural core */}
        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <SectionReveal>
            <div className="v2-head mb-0">
              <span className="v2-eyebrow">{"// за кого"}</span>
              <h2
                className="v2-title"
                style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
                lang="bg"
              >
                Подходящо за всеки бизнес, който иска повече
              </h2>
              <p className="v2-sub">
                Един AI екип. Седем индустрии. Всяка — със собствен сценарий за повече клиенти.
              </p>
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

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind, i) => {
            const Icon = ind.icon;
            // alternate the conic-edge hue: cyan / violet
            const hue = i % 2 === 0 ? "var(--v2-cyan)" : "var(--v2-violet)";
            const iconColor = i % 2 === 0 ? "var(--v2-violet)" : "var(--v2-cyan)";
            return (
              <SectionReveal key={ind.name} delay={i * 60}>
                <TiltCard className="h-full" maxTiltDeg={6} glow={false}>
                  <div
                    className="v2-card v2-glow flex h-full items-start gap-4"
                    style={{ ["--v2-c" as never]: hue }}
                  >
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px]"
                      style={{
                        border: "1px solid var(--v2-line)",
                        background: "var(--v2-glass-2)",
                      }}
                    >
                      <Icon className="h-[22px] w-[22px]" strokeWidth={1.5} style={{ color: iconColor }} />
                    </span>
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2.5">
                        <h3
                          className="font-bold leading-tight"
                          style={{ fontFamily: "var(--v2-font-display)", fontSize: "1.0625rem", color: "var(--v2-ink)" }}
                        >
                          {ind.name}
                        </h3>
                        <span className="v2-tag shrink-0">{ind.tag}</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--v2-muted)" }}>
                        {ind.use}
                      </p>
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
