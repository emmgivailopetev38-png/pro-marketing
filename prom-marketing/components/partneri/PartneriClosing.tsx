"use client";
import { Phone, Mail, Download } from "lucide-react";
import { openBookingPopup } from "@/lib/cal/embed";

export function PartneriClosing() {
  return (
    <section className="relative overflow-hidden py-28 md:py-40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,212,255,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12">
        <p className="mb-10 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-violet)]">
          04 · Следваща стъпка
        </p>

        <h2
          className="font-[family-name:var(--font-editorial)] text-[clamp(32px,7vw,92px)] font-extrabold leading-[1.02]"
          style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
        >
          Готов да тестваш<br />
          <span style={{ color: "var(--color-accent-cyan)" }}>партньорството</span>?
        </h2>

        <p className="mx-auto mt-12 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          30-минутен разговор. Носи си конкретен клиент или сценарий — излизаш с
          реален план как изглежда изпълнението и колко струва.
        </p>

        <div className="mt-16 flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => void openBookingPopup()}
              className="group inline-flex items-center gap-3 rounded-full px-10 py-5 text-base font-bold tracking-wide transition-all md:text-lg"
              style={{
                background: "var(--color-accent-cyan)",
                color: "var(--color-bg-void)",
              }}
            >
              Запази discovery call
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>

            <a
              href="/api/partneri/pdf"
              className="inline-flex items-center gap-2 rounded-full border px-7 py-5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent-cyan)]"
              style={{
                borderColor: "var(--color-border-bright)",
                background: "rgba(0,212,255,0.04)",
              }}
            >
              <Download className="h-4 w-4" />
              Изтегли PDF
            </a>
          </div>

          <p className="font-[family-name:var(--font-editorial)] text-base italic text-[var(--color-text-tertiary)]">
            или ни намери директно
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:+359877399963"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-bright)] px-6 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent-cyan)]"
              style={{ background: "rgba(0,212,255,0.05)" }}
            >
              <Phone className="h-4 w-4" style={{ color: "var(--color-accent-cyan)" }} />
              <span className="font-[family-name:var(--font-mono)]">+359 877 399 963</span>
            </a>
            <a
              href="mailto:ivailo@promarketing.pw?subject=Партньорство%20ProMarketing"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-bright)] px-6 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent-cyan)]"
              style={{ background: "rgba(0,212,255,0.05)" }}
            >
              <Mail className="h-4 w-4" style={{ color: "var(--color-accent-cyan)" }} />
              ivailo@promarketing.pw
            </a>
          </div>
        </div>

        <p className="mt-20 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.4em] text-[var(--color-text-tertiary)]">
          ProMarketing LTD · promarketing.pw
        </p>
      </div>
    </section>
  );
}
