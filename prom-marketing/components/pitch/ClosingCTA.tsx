"use client";
import { AuroraBackground } from "@/components/effects/AuroraBackground";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { HolographicText } from "@/components/effects/HolographicText";
import { openBookingPopup } from "@/lib/cal/embed";
import { Phone, Mail } from "lucide-react";

export function ClosingCTA() {
  return (
    <section className="relative overflow-hidden py-40 md:py-56">
      <AuroraBackground intensity="intense" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <SectionReveal>
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
            {"// твоят следващ ход"}
          </p>
          <h2 className="font-display text-[clamp(40px,8vw,120px)] font-bold leading-[0.95] tracking-tight">
            Готов ли си да{" "}
            <HolographicText>стартираш</HolographicText>?
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--color-text-secondary)] md:text-xl">
            30 минути разговор. Без презентации. Излизаш с конкретен план и числа за ROI.
          </p>
        </SectionReveal>

        <SectionReveal delay={200}>
          <div className="mt-14 flex flex-col items-center gap-5">
            <div className="relative">
              <span
                aria-hidden
                className="absolute inset-0 -m-3 rounded-full"
                style={{
                  boxShadow: "0 0 0 0 rgba(6,182,212,0.5)",
                  animation: "pulse-ring 2.4s cubic-bezier(0.22,1,0.36,1) infinite",
                }}
              />
              <span
                aria-hidden
                className="absolute inset-0 -m-3 rounded-full"
                style={{
                  boxShadow: "0 0 0 0 rgba(124,58,237,0.4)",
                  animation: "pulse-ring 2.4s cubic-bezier(0.22,1,0.36,1) infinite 0.8s",
                }}
              />
              <MagneticButton strength={0.5} radius={90}>
                <button
                  type="button"
                  onClick={() => void openBookingPopup()}
                  className="relative inline-flex items-center gap-3 rounded-full bg-[var(--color-accent-cyan)] px-10 py-6 text-lg font-bold text-[var(--color-bg-void)] shadow-[0_0_70px_rgba(6,182,212,0.5)] md:text-xl"
                >
                  Запази демо сега
                  <span aria-hidden>→</span>
                </button>
              </MagneticButton>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
              <a
                href="tel:+359877399963"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-default)] px-5 py-3 text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent-cyan)] hover:text-[var(--color-accent-cyan)]"
              >
                <Phone className="h-4 w-4" />
                <span className="font-mono">0877 399 963</span>
              </a>
              <a
                href="mailto:emmgivailopetev38@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-default)] px-5 py-3 text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent-cyan)] hover:text-[var(--color-accent-cyan)]"
              >
                <Mail className="h-4 w-4" />
                emmgivailopetev38@gmail.com
              </a>
            </div>

            <p className="mt-8 font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-text-tertiary)]">
              promarketing.pw
            </p>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
