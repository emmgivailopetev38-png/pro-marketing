const REASONS = [
  {
    icon: "⚡",
    title: "Без наемане на хора",
    body: "2 AI агента правят работата на 2 маркетинг специалисти — без осигуровки, без болнични, без отпуски.",
  },
  {
    icon: "✅",
    title: "Ти решаваш последната дума",
    body: "Дашбордът ти дава пълен контрол. Одобряваш, отхвърляш, коментираш. Системата се учи от теб.",
  },
  {
    icon: "📈",
    title: "Постоянство = резултати",
    body: "Алгоритмите награждават редовното публикуване. AI осигурява 30+ поста/месец без ти да мислиш за това.",
  },
  {
    icon: "🔗",
    title: "Всичко е свързано",
    body: "Социални → чат бот → CRM → счетоводство. Един поток без ръчно прехвърляне между системи.",
  },
];

export function EduardWhy() {
  return (
    <section
      className="relative border-y border-[var(--color-border-default)] py-28 md:py-40"
      style={{ background: "var(--color-bg-deep)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 50%, rgba(129,140,248,0.06) 0%, transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 md:px-12">
        <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-violet)]">
          03 · Защо автоматизация сега
        </p>

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,7vw,80px)] font-extrabold leading-[1.0]">
          Конкурентите ти<br />
          вече <span style={{ color: "var(--color-accent-cyan)" }}>го правят</span>.
        </h2>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          AI автоматизацията вече не е предимство — скоро ще е необходимост. Тези, които стартират днес, изграждат преднина от 12 месеца.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {REASONS.map((r) => (
            <div
              key={r.title}
              className="rounded-sm border border-[var(--color-border-default)] p-8 transition-colors hover:border-[var(--color-border-bright)]"
              style={{ background: "rgba(13,18,33,0.6)" }}
            >
              <span className="text-3xl" aria-hidden>{r.icon}</span>
              <h3 className="mt-5 font-[family-name:var(--font-editorial)] text-2xl font-bold text-[var(--color-text-primary)]">
                {r.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-[var(--color-text-secondary)]">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
