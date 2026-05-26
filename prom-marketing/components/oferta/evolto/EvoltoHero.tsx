"use client";
import { openBookingPopup } from "@/lib/cal/embed";

export function EvoltoHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Solar grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 184, 0, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 184, 0, 1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      {/* Sun-glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 85% 15%, rgba(255, 184, 0, 0.18) 0%, transparent 40%), radial-gradient(ellipse at 15% 75%, rgba(59, 130, 246, 0.14) 0%, transparent 45%)",
        }}
      />

      {/* Top accent bar */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #FFB800 30%, #3B82F6 70%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-6 py-32 md:px-12">
        {/* Brand row */}
        <div className="mb-12 flex items-center gap-4">
          <span
            className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.4em]"
            style={{ color: "var(--color-solar-gold)" }}
          >
            Pro<span style={{ color: "var(--color-text-primary)" }}>Marketing</span> × Evolto
          </span>
          <span className="h-px flex-1" style={{ background: "var(--color-border-default)" }} />
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.4em] text-[var(--color-text-tertiary)]">
            Concept · 2026
          </span>
        </div>

        <p
          className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.5em]"
          style={{ color: "var(--color-electric-blue)" }}
        >
          01 · Концепция за Evolto
        </p>

        <h1
          className="font-[family-name:var(--font-editorial)] text-[clamp(40px,9vw,128px)] font-extrabold leading-[0.92] tracking-tight"
          style={{ overflowWrap: "break-word", hyphens: "auto" }}
        >
          <span style={{ color: "var(--color-text-primary)" }}>AI операционна</span>
          <br />
          <span
            style={{
              background:
                "linear-gradient(135deg, #FFB800 0%, #F59E0B 50%, #3B82F6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            система
          </span>{" "}
          <span style={{ color: "var(--color-text-primary)" }}>за вашия бизнес.</span>
        </h1>

        <div className="mt-12 max-w-2xl">
          <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
            Два AI модула, специално настроени за{" "}
            <span className="font-[family-name:var(--font-editorial)] font-bold text-[var(--color-text-primary)]">
              соларния бизнес
            </span>{" "}
            на Evolto. Един{" "}
            <span style={{ color: "var(--color-solar-gold)" }}>продава</span>, друг{" "}
            <span style={{ color: "var(--color-electric-blue)" }}>генерира съдържание</span> —
            свързани в общ dashboard, който управляваш с чат бот.
          </p>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-10">
          <Stat label="Часа спестени седмично" value="40+" />
          <Stat label="По-бързи оферти" value="10×" />
          <Stat label="Постове/месец" value="60+" />
          <Stat label="Срок до live" value="60 дни" />
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => void openBookingPopup()}
            className="group inline-flex items-center gap-3 rounded-full px-10 py-5 text-base font-bold tracking-wide transition-transform hover:scale-[1.02]"
            style={{
              background:
                "linear-gradient(135deg, #FFB800 0%, #F59E0B 100%)",
              color: "var(--color-bg-void)",
              boxShadow: "0 0 40px rgba(255,184,0,0.25)",
            }}
          >
            Запази demo разговор
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </button>
          <a
            href="#modules"
            className="inline-flex items-center gap-2 rounded-full border px-7 py-4 text-sm font-medium text-[var(--color-text-primary)] transition-colors"
            style={{
              borderColor: "var(--color-border-bright)",
              background: "rgba(255,184,0,0.05)",
            }}
          >
            Разгледай модулите ↓
          </a>
        </div>

        <div className="mt-20 flex items-center gap-6">
          <div
            aria-hidden
            className="h-px w-12"
            style={{ background: "var(--color-solar-gold)" }}
          />
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
            ProMarketing LTD · персонализирана концепция за Evolto
          </p>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="font-[family-name:var(--font-editorial)] text-3xl font-extrabold md:text-4xl"
        style={{ color: "var(--color-solar-gold)" }}
      >
        {value}
      </p>
      <p className="mt-1 text-xs leading-tight text-[var(--color-text-tertiary)]">{label}</p>
    </div>
  );
}
