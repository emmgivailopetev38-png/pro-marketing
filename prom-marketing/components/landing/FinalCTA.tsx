"use client";
import { AuroraBackground } from "@/components/effects/AuroraBackground";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { openBookingPopup, CAL_LINK } from "@/lib/cal/embed";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-40">
      <AuroraBackground intensity="intense" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <SectionReveal>
          <h2
            className="font-display text-[clamp(32px,8vw,72px)] font-bold leading-[1.05] tracking-tight"
            style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
            lang="bg"
          >
            Готов ли си да автоматизираш?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--color-text-secondary)]">
            30 минути разговор. Без презентации. Излизаш с конкретен план.
          </p>
        </SectionReveal>

        <SectionReveal delay={180}>
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="relative">
              <span
                aria-hidden
                className="absolute inset-0 -m-2 rounded-full"
                style={{
                  boxShadow: "0 0 0 0 rgba(6,182,212,0.5)",
                  animation: "pulse-ring 2.4s cubic-bezier(0.22,1,0.36,1) infinite",
                }}
              />
              <span
                aria-hidden
                className="absolute inset-0 -m-2 rounded-full"
                style={{
                  boxShadow: "0 0 0 0 rgba(124,58,237,0.4)",
                  animation: "pulse-ring 2.4s cubic-bezier(0.22,1,0.36,1) infinite 0.8s",
                }}
              />
              <MagneticButton strength={0.45} radius={80}>
                <button
                  type="button"
                  onClick={() => void openBookingPopup()}
                  className="relative inline-flex items-center gap-3 rounded-full bg-[var(--color-accent-cyan)] px-8 py-5 text-lg font-semibold text-[var(--color-bg-void)] shadow-[0_0_60px_rgba(6,182,212,0.45)]"
                >
                  Запази среща сега
                  <span aria-hidden>→</span>
                </button>
              </MagneticButton>
            </div>
            <a
              href={`https://cal.com/${CAL_LINK}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            >
              или отвори календара на cal.com →
            </a>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
