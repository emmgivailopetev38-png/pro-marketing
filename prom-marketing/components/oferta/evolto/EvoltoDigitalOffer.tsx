export function EvoltoDigitalOffer() {
  return (
    <section className="relative py-28 md:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 70%, rgba(255,184,0,0.07) 0%, transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        <p
          className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.5em]"
          style={{ color: "var(--color-electric-blue)" }}
        >
          07 · Digital offer generator
        </p>

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,7vw,72px)] font-extrabold leading-[1.0]">
          Всеки клиент получава{" "}
          <span style={{ color: "var(--color-solar-gold)" }}>своя оферта</span>
          <br />
          като линк, PDF или и двете.
        </h2>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          Изпращате на клиента по имейл или Viber. Той избира как да я разгледа: интерактивен линк (с live ROI калкулатор и tracking) или класически PDF (за разпечатване / архив). Системата праща и двете.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Left: feature list */}
          <div>
            <ul className="space-y-5 text-sm text-[var(--color-text-secondary)] md:text-base">
              <Feature title="🎯 Персонализирана" body="Изчисления според покрив, kW, годишно потребление и финансиране. Имена и снимки на клиента." />
              <Feature title="📊 Live ROI калкулатор" body="Клиентът вижда колко спестява, кога инвестицията се изплаща, прогноза за 25 години." />
              <Feature title="📲 Уникален линк + PDF" body="evolto.app/o/abc123 — интерактивен линк с live данни и tracking. Плюс автоматичен PDF за разпечатване / архив. Изпращат се заедно през email/Viber." />
              <Feature title="👁 Read receipts" body="Виждаш кога клиентът е отворил офертата, колко време е стоял, на коя секция." />
              <Feature title="✅ One-click accept" body={`Бутон „Приемам офертата" → автоматично пуска договор за подпис.`} />
            </ul>
          </div>

          {/* Right: offer card mockup */}
          <div
            className="relative overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              borderColor: "var(--color-border-bright)",
              background: "rgba(7,11,24,0.92)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
            }}
          >
            {/* Browser bar */}
            <div
              className="flex items-center gap-3 border-b px-4 py-3"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FFB800" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22C55E" }} />
              </div>
              <span
                className="font-[family-name:var(--font-mono)] text-[10px]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                evolto.app/o/k7m9p2
              </span>
            </div>

            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <p
                  className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.4em]"
                  style={{ color: "var(--color-solar-gold)" }}
                >
                  Оферта · валидна до 15.06.2026
                </p>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: "rgba(34,197,94,0.18)", color: "#22C55E" }}
                >
                  ● Отворена 3 пъти
                </span>
              </div>

              <p className="text-xs text-[var(--color-text-tertiary)]">За</p>
              <h3
                className="mt-1 font-[family-name:var(--font-editorial)] text-2xl font-extrabold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Михаил Петров
              </h3>
              <p className="text-xs text-[var(--color-text-tertiary)]">София · покрив 280 m² · 42 kW система</p>

              {/* Price card */}
              <div
                className="mt-6 rounded-xl border p-5"
                style={{
                  borderColor: "rgba(255,184,0,0.4)",
                  background:
                    "linear-gradient(135deg, rgba(255,184,0,0.10) 0%, rgba(59,130,246,0.06) 100%)",
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
                  Инвестиция
                </p>
                <p
                  className="mt-2 font-[family-name:var(--font-editorial)] text-4xl font-extrabold"
                  style={{ color: "var(--color-solar-gold)" }}
                >
                  68 400 лв
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4" style={{ borderColor: "rgba(255,184,0,0.2)" }}>
                  <Mini label="Годишно спестено" value="14 200 лв" />
                  <Mini label="Срок на изплащане" value="4.8 г" />
                  <Mini label="Производство" value="58 MWh/год" />
                  <Mini label="CO₂ намалено" value="28 т/год" />
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="rounded-full px-5 py-3 text-sm font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, #FFB800 0%, #F59E0B 100%)",
                    color: "var(--color-bg-void)",
                  }}
                >
                  ✓ Приемам офертата
                </button>
                <button
                  type="button"
                  className="rounded-full border px-5 py-3 text-sm font-medium text-[var(--color-text-primary)]"
                  style={{
                    borderColor: "var(--color-border-bright)",
                    background: "rgba(255,184,0,0.05)",
                  }}
                >
                  Покажи детайли
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <li
      className="rounded-lg border p-4"
      style={{
        borderColor: "var(--color-border-default)",
        background: "rgba(10,20,41,0.4)",
      }}
    >
      <p className="font-bold text-[var(--color-text-primary)]">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)] md:text-sm">
        {body}
      </p>
    </li>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.2em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}
