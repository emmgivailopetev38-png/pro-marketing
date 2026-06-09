"use client";
import { AuroraBackground } from "@/components/effects/AuroraBackground";
import { ParticleField } from "@/components/effects/ParticleField";
import { HolographicText } from "@/components/effects/HolographicText";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { HeroOrb } from "@/components/landing/HeroOrb";
import { openBookingPopup } from "@/lib/cal/embed";
import { track } from "@/lib/analytics/track";
import { AiAudit } from "./AiAudit";
import { Star, Phone } from "lucide-react";

export function HeroV2() {
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden">
      <AuroraBackground intensity="intense" />
      <ParticleField className="z-[1]" />
      <div className="absolute inset-0 z-[1] hidden opacity-40 lg:block">
        <div className="absolute left-[-12%] top-1/2 h-[78vh] w-[78vh] -translate-y-1/2">
          <HeroOrb />
        </div>
      </div>

      <div className="relative z-[3] mx-auto grid min-h-[100svh] max-w-6xl items-center gap-12 px-6 pt-32 pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-28">
        {/* Left — message */}
        <div>
          <span className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-glass)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-accent-cyan)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent-cyan)] shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
            2050 · AI операции
          </span>

          <h1 className="font-display text-[clamp(34px,5.4vw,64px)] font-bold leading-[1.05] tracking-tight" lang="bg">
            Твоят бизнес
            <br />
            на <HolographicText>автопилот</HolographicText>
            <br />
            <span className="font-light text-[var(--color-text-secondary)]">с AI, който</span>{" "}
            <span className="text-[var(--color-accent-cyan)]">не спира.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base text-[var(--color-text-secondary)] md:text-lg">
            AI агенти поемат обажданията, чата и офертите.{" "}
            <span className="font-medium text-[var(--color-text-primary)]">Ти гледаш само резултатите</span>{" "}
            — в личния си AI CRM.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <MagneticButton>
              <button
                type="button"
                onClick={() => { track("cta_clicked", { location: "hero_v2", target: "booking" }); void openBookingPopup(); }}
                className="group inline-flex items-center gap-3 rounded-full bg-[var(--color-accent-cyan)] px-7 py-4 text-base font-semibold text-[var(--color-bg-void)] shadow-[0_0_40px_rgba(34,211,238,0.35)] transition-shadow hover:shadow-[0_0_60px_rgba(34,211,238,0.6)]"
              >
                Запази безплатна консултация
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </MagneticButton>
            <a href="tel:+359877399963" onClick={() => track("cta_clicked", { location: "hero_v2", target: "call" })} className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-accent-cyan)] px-6 py-3.5 text-base font-semibold text-[var(--color-accent-cyan)] transition hover:bg-[var(--color-accent-cyan)]/[0.06]">
              <Phone className="h-4 w-4" /> 0877 399 963
            </a>
          </div>

          <div className="mt-7 flex items-center gap-3 text-sm text-[var(--color-text-tertiary)]">
            <span className="flex text-[var(--color-accent-cyan)]">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </span>
            <span>30+ български бизнеса · отговор за секунди</span>
          </div>
        </div>

        {/* Right — interactive AI audit (the conversion centerpiece) */}
        <div className="flex justify-center lg:justify-end">
          <AiAudit />
        </div>
      </div>

      <div aria-hidden className="absolute inset-x-0 bottom-0 z-[4] h-32" style={{ background: "linear-gradient(to bottom, transparent, var(--color-bg-void))" }} />

      <style>{`
        @keyframes avReveal { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .av-reveal { animation: avReveal .5s cubic-bezier(.22,1,.36,1) both; }
      `}</style>
    </section>
  );
}
