import { format } from "date-fns";
import { bg } from "date-fns/locale";

const today = format(new Date(), "d MMMM yyyy", { locale: bg });

const TIERS = [
  { label: "Ателие за Съдържание", price: "2 000 €", tag: "Стартово" },
  { label: "Автоматизация + Чат Ботове", price: "1 700 €", tag: "–15%" },
  { label: "Финансова Автоматизация", price: "1 445 €", tag: "–15%" },
];

export function EduardHero() {
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
      {/* Glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(0, 212, 255, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(129, 140, 248, 0.10) 0%, transparent 45%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col justify-center px-6 py-32 md:px-12">
        <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-violet)]">
          ПРЕДЛОЖЕНИЕ · {today}
        </p>

        <p className="mb-3 font-[family-name:var(--font-editorial)] text-2xl text-[var(--color-text-secondary)]">
          за
        </p>

        <h1 className="font-[family-name:var(--font-editorial)] text-[clamp(48px,10vw,140px)] font-extrabold leading-[0.92] tracking-tight">
          <span style={{ color: "var(--color-text-primary)" }}>Едуард</span>
          <br />
          <span style={{ color: "var(--color-accent-cyan)" }}>Сахакян</span>
        </h1>

        <div className="mt-12 max-w-2xl">
          <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
            Три нива на{" "}
            <span className="font-[family-name:var(--font-editorial)] font-bold text-[var(--color-text-primary)]">
              AI автоматизация
            </span>{" "}
            — съдържание, чат ботове и операции. Всяко следващо ниво е с 15% по-достъпно, за да изграждаш постепенно.
          </p>
        </div>

        {/* Tier pills */}
        <div className="mt-14 flex flex-wrap gap-3">
          {TIERS.map((t, i) => (
            <div
              key={t.label}
              className="flex items-center gap-3 rounded-full border px-5 py-2.5"
              style={{
                borderColor:
                  i === 0 ? "var(--color-accent-cyan)" : "var(--color-border-bright)",
                background:
                  i === 0
                    ? "rgba(0, 212, 255, 0.08)"
                    : "rgba(255,255,255,0.03)",
              }}
            >
              <span
                className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em]"
                style={{
                  color: i === 0 ? "var(--color-accent-cyan)" : "var(--color-accent-violet)",
                }}
              >
                {t.tag}
              </span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {t.label}
              </span>
              <span
                className="font-[family-name:var(--font-mono)] text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {t.price}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-14 flex items-center gap-6">
          <div
            aria-hidden
            className="h-px w-12"
            style={{ background: "var(--color-accent-cyan)" }}
          />
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
            ProMarketing LTD · персонална оферта
          </p>
        </div>

        <a
          href="#packages"
          className="mt-20 inline-flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent-cyan)]"
        >
          Разгледай офертата
          <span aria-hidden>↓</span>
        </a>
      </div>
    </section>
  );
}
