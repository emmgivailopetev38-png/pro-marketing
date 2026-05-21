"use client";
import { Download } from "lucide-react";
import { openBookingPopup } from "@/lib/cal/embed";

export function PartneriHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 212, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 25%, rgba(0, 212, 255, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 85% 75%, rgba(129, 140, 248, 0.10) 0%, transparent 45%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[90vh] max-w-5xl flex-col justify-center px-6 py-28 md:px-12">
        <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-violet)]">
          01 · Партньорска програма
        </p>

        <h1
          className="font-[family-name:var(--font-editorial)] text-[clamp(32px,7vw,96px)] font-extrabold leading-[1.02] tracking-tight"
          style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
        >
          Ние сме твоят{" "}
          <span style={{ color: "var(--color-accent-cyan)" }}>execution екип</span>
          <br />
          за AI автоматизация.
        </h1>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          За маркетинг агенции, които обслужват{" "}
          <span className="font-bold text-[var(--color-text-primary)]">хотели</span> и{" "}
          <span className="font-bold text-[var(--color-text-primary)]">имотни агенции</span>.
          Ти продаваш AI автоматизацията на твоите клиенти — ние я изграждаме под твоя бранд
          или явно като ProMarketing. Срок: 30–60 дни.
        </p>

        <div className="mt-14 flex flex-wrap items-center gap-4">
          <a
            href="/api/partneri/pdf"
            className="group inline-flex items-center gap-3 rounded-full px-8 py-4 text-base font-bold tracking-wide transition-all"
            style={{
              background: "var(--color-accent-cyan)",
              color: "var(--color-bg-void)",
            }}
          >
            <Download className="h-4 w-4" />
            Изтегли 1-pager (PDF)
          </a>

          <button
            type="button"
            onClick={() => void openBookingPopup()}
            className="inline-flex items-center gap-2 rounded-full border px-7 py-4 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent-cyan)]"
            style={{
              borderColor: "var(--color-border-bright)",
              background: "rgba(0,212,255,0.04)",
            }}
          >
            Запази discovery call
            <span aria-hidden>→</span>
          </button>
        </div>

        <div className="mt-16 flex items-center gap-6">
          <div
            aria-hidden
            className="h-px w-12"
            style={{ background: "var(--color-accent-cyan)" }}
          />
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
            ProMarketing LTD · white-label партньор
          </p>
        </div>
      </div>
    </section>
  );
}
