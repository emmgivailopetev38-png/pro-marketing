"use client";
import dynamic from "next/dynamic";
import { AuroraBackground } from "@/components/effects/AuroraBackground";
import { ParticleField } from "@/components/effects/ParticleField";
import { TextScramble } from "@/components/effects/TextScramble";
import { HolographicText } from "@/components/effects/HolographicText";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { openBookingPopup } from "@/lib/cal/embed";

const ShaderOrb = dynamic(
  () => import("@/components/effects/ShaderOrb").then((m) => m.ShaderOrb),
  { ssr: false, loading: () => null }
);

export function PitchHero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <AuroraBackground intensity="intense" />
      <ParticleField className="z-[1]" density={60} maxLinkDist={180} />

      <div className="absolute inset-0 z-[2] hidden lg:block">
        <div className="absolute right-[-15%] top-1/2 h-[90vh] w-[90vh] -translate-y-1/2 opacity-90">
          <ShaderOrb />
        </div>
      </div>

      <div className="relative z-[3] mx-auto flex max-w-6xl flex-col items-start justify-center px-6 pt-32 pb-24 lg:min-h-[100svh] lg:pt-20">
        <span className="mb-8 inline-flex items-center gap-3 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-glass)] px-4 py-2 text-xs font-mono uppercase tracking-[0.22em] text-[var(--color-accent-cyan)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent-cyan)] shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
          {"// AI · CRM · Automation · 2026"}
        </span>

        <h1 className="max-w-4xl font-display text-[clamp(38px,8vw,108px)] font-bold leading-[0.95] tracking-tight [overflow-wrap:break-word] [hyphens:auto]" lang="bg">
          <TextScramble text="Бъдещето" durationMs={1100} />{" "}
          <span className="text-[var(--color-text-secondary)]">на твоя</span>{" "}
          <HolographicText>бизнес</HolographicText>
          <br />
          <span className="text-[var(--color-text-secondary)]">не чака.</span>
        </h1>

        <p className="mt-10 max-w-2xl text-lg text-[var(--color-text-secondary)] md:text-2xl">
          Изграждаме AI агенти, custom CRM системи и автоматизации, които работят
          <span className="text-[var(--color-text-primary)]"> 24/7</span> и превръщат
          <span className="text-[var(--color-text-primary)]"> рутината </span>
          в растеж. Виж пълния спектър.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-5">
          <MagneticButton strength={0.4} radius={70}>
            <button
              type="button"
              onClick={() => void openBookingPopup()}
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[var(--color-accent-cyan)] px-8 py-4 text-base font-semibold text-[var(--color-bg-void)] shadow-[0_0_50px_rgba(6,182,212,0.45)] transition-shadow hover:shadow-[0_0_70px_rgba(6,182,212,0.65)]"
            >
              <span>Запази демо</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </MagneticButton>
          <a
            href="#capabilities"
            className="inline-flex items-center gap-2 px-2 text-sm uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          >
            Скрол ↓
          </a>
        </div>

        <div className="absolute bottom-8 left-6 right-6 z-[5] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--color-text-tertiary)] md:left-12 md:right-12">
          <div className="font-mono uppercase tracking-[0.18em]">ProMarketing LTD</div>
          <div className="font-mono uppercase tracking-[0.18em]">
            {new Date().toLocaleDateString("bg-BG", { year: "numeric", month: "long" })}
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-[4] h-32"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--color-bg-void))",
        }}
      />
    </section>
  );
}
