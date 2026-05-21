const STEPS = [
  {
    n: "01",
    title: "Discovery call",
    body: "30-минутен разговор. Обсъждаме клиента, целите, обхвата. Ти решаваш дали white-label или ProMarketing-branded.",
    tag: "Безплатно",
  },
  {
    n: "02",
    title: "Оферта по scope",
    body: "В рамките на 2 работни дни получаваш фиксирана цена за конкретния проект. Без скрити такси, без месечни абонаменти за теб.",
    tag: "2 раб. дни",
  },
  {
    n: "03",
    title: "Изпълнение + handover",
    body: "Изграждаме, тестваме, пускаме на живо. Ти получаваш playbook, видео обучение и достъп до дашборда. Поддръжката е по договаряне.",
    tag: "30–60 дни",
  },
];

export function PartneriProcess() {
  return (
    <section className="relative py-28 md:py-36">
      <div className="mx-auto max-w-5xl px-6 md:px-12">
        <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-violet)]">
          03 · Как работим заедно
        </p>

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,7vw,72px)] font-extrabold leading-[1.0]">
          Три стъпки до{" "}
          <span style={{ color: "var(--color-accent-cyan)" }}>handover</span>.
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="relative rounded-sm border border-[var(--color-border-default)] p-7"
              style={{ background: "rgba(13,18,33,0.4)" }}
            >
              <div className="flex items-baseline justify-between">
                <span
                  className="font-[family-name:var(--font-editorial)] text-5xl font-extrabold"
                  style={{ color: i === 0 ? "var(--color-accent-cyan)" : "var(--color-text-tertiary)" }}
                >
                  {s.n}
                </span>
                <span
                  className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: "var(--color-accent-violet)" }}
                >
                  {s.tag}
                </span>
              </div>
              <h3 className="mt-6 font-[family-name:var(--font-editorial)] text-xl font-bold text-[var(--color-text-primary)]">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
