"use client";
import { Phone, Mail, ExternalLink } from "lucide-react";
import { openBookingPopup } from "@/lib/cal/embed";
import { format, addDays } from "date-fns";
import { bg } from "date-fns/locale";

const validUntil = format(addDays(new Date(), 14), "d MMMM yyyy", { locale: bg });

export function OfertaClosing() {
  return (
    <section className="relative overflow-hidden py-32 md:py-48">
      {/* Soft warm background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(232, 207, 175, 0.4) 0%, transparent 60%), radial-gradient(ellipse at center bottom, rgba(200, 164, 164, 0.3) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12">
        <p className="mb-10 font-mono text-xs uppercase tracking-[0.4em] text-[var(--color-accent-magenta)]">
          06 · Следваща стъпка
        </p>

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(44px,9vw,120px)] font-light leading-[0.95]">
          Готови сме,<br />
          когато <span className="italic">кажеш</span>.
        </h2>

        <p className="mx-auto mt-12 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          30 минути разговор. Запознаваме се, чуваме всичко конкретно за твоя бранд, отговаряме на въпроси. Излизаш с финален план и точна стартова дата.
        </p>

        <div className="mt-16 flex flex-col items-center gap-6">
          <button
            type="button"
            onClick={() => void openBookingPopup()}
            className="group relative inline-flex items-center gap-3 px-12 py-5 text-base font-medium tracking-wide transition-all md:text-lg"
            style={{
              background: "var(--color-text-primary)",
              color: "var(--color-bg-void)",
              borderRadius: "9999px",
            }}
          >
            Запази 30-минутен разговор
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </button>

          <p className="font-[family-name:var(--font-editorial)] text-base italic text-[var(--color-text-tertiary)] md:text-lg">
            или
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:+359877399963"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-bright)] bg-[var(--color-bg-void)] px-6 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent-cyan)]"
            >
              <Phone className="h-4 w-4" style={{ color: "var(--color-accent-cyan)" }} />
              <span className="font-mono">+359 877 399 963</span>
            </a>
            <a
              href="mailto:emmgivailopetev38@gmail.com?subject=Оферта%20Boutique%20Bedding"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-bright)] bg-[var(--color-bg-void)] px-6 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent-cyan)]"
            >
              <Mail className="h-4 w-4" style={{ color: "var(--color-accent-cyan)" }} />
              emmgivailopetev38@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-24 border-t border-[var(--color-border-default)] pt-12">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent-magenta)]">
            Информация за тази оферта
          </p>
          <div className="grid grid-cols-1 gap-6 text-sm text-[var(--color-text-secondary)] md:grid-cols-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
                За
              </p>
              <p className="mt-2 font-[family-name:var(--font-editorial)] text-lg italic text-[var(--color-text-primary)]">
                Красимира Йотова
              </p>
              <a
                href="mailto:office.yotova@gmail.com"
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-cyan)]"
              >
                office.yotova@gmail.com
              </a>
              <br />
              <a
                href="tel:+359876181880"
                className="font-mono text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-cyan)]"
              >
                +359 876 181 880
              </a>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
                Брандa
              </p>
              <p className="mt-2 font-[family-name:var(--font-editorial)] text-lg italic text-[var(--color-text-primary)]">
                Boutique Bedding
              </p>
              <a
                href="https://www.instagram.com/boutique_bedding"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-cyan)]"
              >
                @boutique_bedding
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
                Валидност
              </p>
              <p className="mt-2 font-[family-name:var(--font-editorial)] text-lg italic text-[var(--color-text-primary)]">
                До {validUntil}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                14 дни от изпращане
              </p>
            </div>
          </div>
        </div>

        <p className="mt-16 font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-text-tertiary)]">
          ProMarketing LTD · promarketing.pw
        </p>
      </div>
    </section>
  );
}
