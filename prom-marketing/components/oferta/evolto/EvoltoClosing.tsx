"use client";
import { Phone, Mail } from "lucide-react";
import { openBookingPopup } from "@/lib/cal/embed";
import { format, addDays } from "date-fns";
import { bg } from "date-fns/locale";

const validUntil = format(addDays(new Date(), 21), "d MMMM yyyy", { locale: bg });

export function EvoltoClosing() {
  return (
    <section className="relative overflow-hidden py-32 md:py-48">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,184,0,0.10) 0%, transparent 55%), radial-gradient(ellipse at 70% 30%, rgba(59,130,246,0.08) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12">
        <p
          className="mb-10 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.5em]"
          style={{ color: "var(--color-electric-blue)" }}
        >
          08 · Следваща стъпка
        </p>

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(40px,9vw,120px)] font-extrabold leading-[0.92]">
          Готови сме<br />
          когато <span style={{ color: "var(--color-solar-gold)" }}>сте вие</span>.
        </h2>

        <p className="mx-auto mt-12 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          45 минути demo разговор. Показваме точно как ще работят двата модула за вашия бизнес. Излизате с конкретен план и срок.
        </p>

        <div className="mt-16 flex flex-col items-center gap-6">
          <button
            type="button"
            onClick={() => void openBookingPopup()}
            className="group inline-flex items-center gap-3 rounded-full px-12 py-5 text-base font-bold tracking-wide transition-transform hover:scale-[1.02] md:text-lg"
            style={{
              background:
                "linear-gradient(135deg, #FFB800 0%, #F59E0B 100%)",
              color: "var(--color-bg-void)",
              boxShadow: "0 0 50px rgba(255,184,0,0.30)",
            }}
          >
            Запази demo разговор
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </button>

          <p className="font-[family-name:var(--font-editorial)] text-base italic text-[var(--color-text-tertiary)] md:text-lg">
            или ни намери директно
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:+359877399963"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm text-[var(--color-text-primary)] transition-colors"
              style={{
                borderColor: "var(--color-border-bright)",
                background: "rgba(255,184,0,0.05)",
              }}
            >
              <Phone className="h-4 w-4" style={{ color: "var(--color-solar-gold)" }} />
              <span className="font-[family-name:var(--font-mono)]">+359 877 399 963</span>
            </a>
            <a
              href="mailto:ivailopetev38@gmail.com?subject=Evolto%20×%20ProMarketing%20demo"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm text-[var(--color-text-primary)] transition-colors"
              style={{
                borderColor: "var(--color-border-bright)",
                background: "rgba(255,184,0,0.05)",
              }}
            >
              <Mail className="h-4 w-4" style={{ color: "var(--color-solar-gold)" }} />
              ivailopetev38@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-24 border-t pt-12" style={{ borderColor: "var(--color-border-default)" }}>
          <p
            className="mb-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.4em]"
            style={{ color: "var(--color-electric-blue)" }}
          >
            Информация за тази концепция
          </p>
          <div className="grid grid-cols-1 gap-6 text-sm text-[var(--color-text-secondary)] md:grid-cols-3">
            <div>
              <p
                className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                За
              </p>
              <p
                className="mt-2 font-[family-name:var(--font-editorial)] text-lg font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Evolto
              </p>
              <a
                href="mailto:info@evolto.bg"
                className="text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-solar-gold)]"
              >
                info@evolto.bg
              </a>
              <br />
              <a
                href="tel:+359894255855"
                className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-solar-gold)]"
              >
                +359 894 255 855
              </a>
            </div>
            <div>
              <p
                className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Концепция
              </p>
              <p
                className="mt-2 font-[family-name:var(--font-editorial)] text-lg font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                AI операционна система
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Sales CRM + Content engine
              </p>
            </div>
            <div>
              <p
                className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Валидност
              </p>
              <p
                className="mt-2 font-[family-name:var(--font-editorial)] text-lg font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                До {validUntil}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">21 дни от изпращане</p>
            </div>
          </div>
        </div>

        <p
          className="mt-16 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.4em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          ProMarketing LTD · promarketing.pw
        </p>
      </div>
    </section>
  );
}
