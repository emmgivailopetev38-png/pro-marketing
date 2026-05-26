const ASSETS = [
  {
    type: "Reels видео",
    duration: "0:30",
    title: "Соларен покрив 28 kW · Пловдив",
    tag: "Готово",
    color: "#22C55E",
  },
  {
    type: "Banner FB/IG",
    duration: "1080×1080",
    title: "Спести 60% от тока — безплатна оферта",
    tag: "В одобрение",
    color: "#FFB800",
  },
  {
    type: "Пост LinkedIn",
    duration: "180 думи",
    title: "Защо хотелите минават на соларна енергия",
    tag: "Планира",
    color: "#3B82F6",
  },
  {
    type: "Reels видео",
    duration: "0:45",
    title: "Винарска изба КМ · 85 kW монтаж time-lapse",
    tag: "Генерира се",
    color: "#94a3b8",
  },
];

export function EvoltoContentEngine() {
  return (
    <section className="relative py-28 md:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.08) 0%, transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        <p
          className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.5em]"
          style={{ color: "var(--color-electric-blue)" }}
        >
          05 · Content AI engine
        </p>
        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,7vw,76px)] font-extrabold leading-[1.0]">
          Видеа, банери, постове —<br />
          <span style={{ color: "var(--color-electric-blue)" }}>всеки ден</span>.
        </h2>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          AI engine следи кои проекти приключват и автоматично прави маркетинг съдържание около тях. Ти одобряваш с един клик.
        </p>

        {/* Asset gallery */}
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ASSETS.map((a) => (
            <div
              key={a.title}
              className="overflow-hidden rounded-xl border transition-transform hover:scale-[1.02]"
              style={{
                borderColor: "var(--color-border-default)",
                background: "rgba(10,20,41,0.7)",
              }}
            >
              {/* Visual placeholder */}
              <div
                aria-hidden
                className="relative aspect-[4/5] w-full overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,184,0,0.18) 0%, rgba(59,130,246,0.18) 100%)",
                }}
              >
                {/* Sun + grid texture */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,184,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,184,0,0.5) 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />
                <div
                  className="absolute right-4 top-4 h-16 w-16 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,184,0,0.8) 0%, rgba(255,184,0,0) 70%)",
                    filter: "blur(8px)",
                  }}
                />
                <div className="absolute bottom-4 left-4 right-4">
                  <p
                    className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.3em]"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    {a.type} · {a.duration}
                  </p>
                </div>
              </div>

              {/* Meta */}
              <div className="p-4">
                <p className="line-clamp-2 text-sm font-medium text-[var(--color-text-primary)]">
                  {a.title}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      background: a.color + "22",
                      color: a.color,
                    }}
                  >
                    {a.tag}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">преди 2ч</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 grid grid-cols-1 gap-4 text-sm text-[var(--color-text-secondary)] md:grid-cols-3">
          <Capability icon="🎬" text="Time-lapse от монтажи → 30-сек Reels" />
          <Capability icon="📐" text="Banner варианти за FB/IG/LinkedIn ads" />
          <Capability icon="✍️" text="Постове в твоя експертен глас" />
        </div>
      </div>
    </section>
  );
}

function Capability({ icon, text }: { icon: string; text: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border px-4 py-3"
      style={{
        borderColor: "var(--color-border-default)",
        background: "rgba(10,20,41,0.4)",
      }}
    >
      <span className="text-2xl" aria-hidden>{icon}</span>
      <span className="text-xs leading-tight md:text-sm">{text}</span>
    </div>
  );
}
