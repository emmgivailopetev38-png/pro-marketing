const MODULES = [
  {
    icon: "🎯",
    accent: "#FFB800",
    accentSoft: "rgba(255,184,0,0.10)",
    label: "Module A",
    title: "Sales AI · CRM",
    tagline: "От lead до подписан договор — без ти да докоснеш бутон",
    bullets: [
      "Авто-преглед на нови leads — AI оценява размер на покрив, geo, бизнес",
      "Авто-генерирана оферта с уникален digital линк за всеки клиент",
      "Авто-изпратен договор за подпис при одобрение",
      "Track на процеса в реално време — кой етап, какво следва",
      "Smart напомняния — кои клиенти забавят, кои са горещи",
    ],
  },
  {
    icon: "🎨",
    accent: "#3B82F6",
    accentSoft: "rgba(59,130,246,0.10)",
    label: "Module B",
    title: "Content AI · Engine",
    tagline: "Видеа, банери, постове — всеки ден, в твоя бранд",
    bullets: [
      "AI генерира видеа за реклами и социални мрежи (формат 16:9, 9:16, 1:1)",
      "Авто-банери за Facebook/Instagram/LinkedIn кампании",
      "30+ публикации/месец със соларни case studies и tips",
      `Свой чат бот за управление: „Напиши пост за нов проект в Пловдив"`,
      "Календарно планиране + auto-publish при одобрение",
    ],
  },
];

export function EvoltoModules() {
  return (
    <section
      id="modules"
      className="relative border-y py-28 md:py-36"
      style={{
        background: "var(--color-bg-deep)",
        borderColor: "var(--color-border-default)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(255,184,0,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        <p
          className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.5em]"
          style={{ color: "var(--color-electric-blue)" }}
        >
          02 · Двата AI модула
        </p>

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,7vw,84px)] font-extrabold leading-[0.98]">
          Един екип за{" "}
          <span style={{ color: "var(--color-solar-gold)" }}>продажби</span>,
          <br />
          друг за{" "}
          <span style={{ color: "var(--color-electric-blue)" }}>съдържание</span>.
        </h2>

        <p className="mt-10 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          И двата работят 24/7. Споделят един dashboard. Управляват се с чат бот на български.
        </p>

        <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {MODULES.map((m) => (
            <article
              key={m.title}
              className="relative overflow-hidden rounded-xl border p-8 transition-transform hover:scale-[1.01] md:p-10"
              style={{
                borderColor: m.accent + "40",
                background: `linear-gradient(165deg, ${m.accentSoft} 0%, rgba(0,0,0,0) 60%), rgba(7,11,24,0.6)`,
                boxShadow: `0 0 40px ${m.accentSoft}`,
              }}
            >
              {/* Corner glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30"
                style={{ background: m.accent, filter: "blur(40px)" }}
              />

              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <span
                    className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em]"
                    style={{ color: m.accent }}
                  >
                    {m.label}
                  </span>
                  <span className="text-3xl" aria-hidden>
                    {m.icon}
                  </span>
                </div>

                <h3
                  className="font-[family-name:var(--font-editorial)] text-3xl font-extrabold md:text-4xl"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {m.title}
                </h3>
                <p className="mt-3 text-base italic text-[var(--color-text-secondary)]">
                  {m.tagline}
                </p>

                <ul className="mt-8 space-y-3">
                  {m.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base">
                      <span
                        aria-hidden
                        className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ background: m.accent }}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        {/* Connector hint */}
        <div className="mt-16 flex items-center justify-center gap-4">
          <span className="h-px w-16" style={{ background: "var(--color-border-bright)" }} />
          <p
            className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Свързани в общ Dashboard + чат бот контрол
          </p>
          <span className="h-px w-16" style={{ background: "var(--color-border-bright)" }} />
        </div>
      </div>
    </section>
  );
}
