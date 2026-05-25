const STAGES = [
  {
    n: "01",
    icon: "📥",
    title: "Lead идва",
    body: "От реклама, сайт, телефон или Lead Center — всички пътища стигат в CRM-а.",
    accent: "#FFB800",
  },
  {
    n: "02",
    icon: "🧠",
    title: "AI преглежда",
    body: "Анализ на покрив, geo, тип бизнес. Авто-определя приоритет: гореща / умерена / студена.",
    accent: "#FFB800",
  },
  {
    n: "03",
    icon: "📄",
    title: "Авто-оферта",
    body: "Генерирана digital оферта с уникален линк, цени според kW и срок. Имейл към клиента + push.",
    accent: "#F59E0B",
  },
  {
    n: "04",
    icon: "✍️",
    title: "Подпис на договор",
    body: "При одобрение на офертата — авто-договор за подпис през DocuSign/SignWell линк.",
    accent: "#3B82F6",
  },
  {
    n: "05",
    icon: "📡",
    title: "Live tracking",
    body: "Доставка, монтаж, активиране — статуси в реално време. Клиент вижда напредъка през login линк.",
    accent: "#3B82F6",
  },
];

export function EvoltoSalesFlow() {
  return (
    <section className="relative py-28 md:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(255,184,0,0.06) 0%, transparent 50%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        <p
          className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.5em]"
          style={{ color: "var(--color-electric-blue)" }}
        >
          03 · Sales AI flow
        </p>

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,7vw,76px)] font-extrabold leading-[1.0]">
          От lead до{" "}
          <span style={{ color: "var(--color-solar-gold)" }}>подписан договор</span>
          <br />
          без ти да докоснеш бутон.
        </h2>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          5 стъпки. AI агентът ги изпълнява автоматично и ти изпраща нотификация при всеки важен момент.
        </p>

        {/* Horizontal flow */}
        <ol className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-5">
          {STAGES.map((s, i) => (
            <li
              key={s.n}
              className="relative rounded-xl border p-6"
              style={{
                borderColor: s.accent + "33",
                background:
                  "linear-gradient(165deg, rgba(255,184,0,0.04) 0%, rgba(7,11,24,0.6) 50%)",
              }}
            >
              {/* Connector arrow (desktop) */}
              {i < STAGES.length - 1 && (
                <div
                  aria-hidden
                  className="absolute -right-3 top-1/2 hidden h-px w-6 md:block"
                  style={{ background: s.accent + "60" }}
                />
              )}

              <div className="flex items-center justify-between">
                <span
                  className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: s.accent }}
                >
                  {s.n}
                </span>
                <span className="text-2xl" aria-hidden>
                  {s.icon}
                </span>
              </div>
              <h3
                className="mt-5 font-[family-name:var(--font-editorial)] text-lg font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {s.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
