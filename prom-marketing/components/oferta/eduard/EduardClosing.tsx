"use client";
import { Phone, Mail } from "lucide-react";
import { openBookingPopup } from "@/lib/cal/embed";
import { format, addDays } from "date-fns";
import { bg } from "date-fns/locale";

const validUntil = format(addDays(new Date(), 14), "d MMMM yyyy", { locale: bg });

export function EduardClosing() {
  return (
    <section className="relative overflow-hidden py-32 md:py-48">
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

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(44px,9vw,120px)] font-extrabold leading-[0.92]">
          Стартираме,<br />
          когато <span style={{ color: "var(--color-accent-cyan)" }}>кажеш</span>.
        </h2>

        <p className="mx-auto mt-12 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          30 минути разговор. Уточняваме кой пакет e правилното начало, свързваме акаунтите и задаваме старт дата. Излизаш с конкретен план в ръка.
        </p>

        <div className="mt-16 flex flex-col items-center gap-6">
          <button
            type="button"
            onClick={() => void openBookingPopup()}
            className="group inline-flex items-center gap-3 rounded-full px-12 py-5 text-base font-bold tracking-wide transition-all md:text-lg"
            style={{
              background: "var(--color-accent-cyan)",
              color: "var(--color-bg-void)",
            }}
          >
            Запази безплатна консултация
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </button>

          <p className="font-[family-name:var(--font-editorial)] text-base italic text-[var(--color-text-tertiary)] md:text-lg">
            или се свържи директно
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
              href="mailto:ivailopetev38@gmail.com?subject=Оферта%20AI%20Автоматизация%20ProMarketing"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-bright)] px-6 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent-cyan)]"
              style={{ background: "rgba(0,212,255,0.05)" }}
            >
              <Mail className="h-4 w-4" style={{ color: "var(--color-accent-cyan)" }} />
              ivailopetev38@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-24 border-t border-[var(--color-border-default)] pt-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">
            Информация за тази оферта
          </p>
          <div className="grid grid-cols-1 gap-6 text-sm text-[var(--color-text-secondary)] md:grid-cols-3">
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
                За
              </p>
              <p className="mt-2 font-[family-name:var(--font-editorial)] text-lg font-bold text-[var(--color-text-primary)]">
                Едуард Сахакян
              </p>
              <a
                href="mailto:esahakyan7171@gmail.com"
                className="text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent-cyan)]"
              >
                esahakyan7171@gmail.com
              </a>
              <br />
              <a
                href="tel:+359879209747"
                className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent-cyan)]"
              >
                +359 879 209 747
              </a>
            </div>
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
                Услуга
              </p>
              <p className="mt-2 font-[family-name:var(--font-editorial)] text-lg font-bold text-[var(--color-text-primary)]">
                AI Автоматизация
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Социални · Чат Ботове · Операции
              </p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
                Валидност
              </p>
              <p className="mt-2 font-[family-name:var(--font-editorial)] text-lg font-bold text-[var(--color-text-primary)]">
                До {validUntil}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">14 дни от изпращане</p>
            </div>
          </div>
        </div>

        <p className="mt-16 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.4em] text-[var(--color-text-tertiary)]">
          ProMarketing LTD · promarketing.pw
        </p>
      </div>
    </section>
  );
}
