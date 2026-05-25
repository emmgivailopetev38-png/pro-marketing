const LEADS = [
  { name: "Стефан Бакалов", city: "Пловдив", kw: "42 kW", stage: "Договор", color: "#3B82F6" },
  { name: "Иво Цанков", city: "Бургас", kw: "28 kW", stage: "Оферта", color: "#FFB800" },
  { name: "Хотел Алба", city: "Варна", kw: "120 kW", stage: "AI преглед", color: "#F59E0B" },
  { name: "Михаил Петров", city: "София", kw: "15 kW", stage: "Lead", color: "#94a3b8" },
  { name: "Винарска Изба КМ", city: "Стара Загора", kw: "85 kW", stage: "Монтаж", color: "#22C55E" },
];

export function EvoltoDashboard() {
  return (
    <section
      className="relative border-y py-28 md:py-36"
      style={{
        background: "var(--color-bg-deep)",
        borderColor: "var(--color-border-default)",
      }}
    >
      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        <p
          className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.5em]"
          style={{ color: "var(--color-electric-blue)" }}
        >
          04 · Dashboard preview
        </p>
        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,7vw,76px)] font-extrabold leading-[1.0]">
          Един екран —<br />
          <span style={{ color: "var(--color-solar-gold)" }}>цялата картина</span>.
        </h2>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
          Така ще изглежда твоят dashboard. Live данни, sortable филтри, click-to-detail.
        </p>

        {/* Mock dashboard */}
        <div
          className="mt-16 overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            borderColor: "var(--color-border-bright)",
            background: "rgba(7,11,24,0.92)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,184,0,0.1)",
          }}
        >
          {/* Top bar mock */}
          <div
            className="flex items-center justify-between border-b px-6 py-4"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FFB800" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22C55E" }} />
              </div>
              <span
                className="ml-3 font-[family-name:var(--font-mono)] text-xs"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                evolto.app/dashboard
              </span>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <span
                className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: "rgba(34,197,94,0.15)",
                  color: "#22C55E",
                }}
              >
                ● LIVE
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">Иво Петков</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px md:grid-cols-4" style={{ background: "var(--color-border-default)" }}>
            <Tile label="Нови leads днес" value="12" trend="+34%" trendColor="#22C55E" />
            <Tile label="Активни оферти" value="8" trend="3 чакат отговор" trendColor="#FFB800" />
            <Tile label="Договори в подпис" value="5" trend="+2 от вчера" trendColor="#22C55E" />
            <Tile label="kW в процес" value="412" trend="cel: 800 kW/мес" trendColor="#94a3b8" />
          </div>

          {/* Leads table */}
          <div className="px-6 py-6">
            <div className="mb-4 flex items-center justify-between">
              <p
                className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em]"
                style={{ color: "var(--color-electric-blue)" }}
              >
                Активни leads
              </p>
              <span className="text-xs text-[var(--color-text-tertiary)]">обновено: преди 12 сек</span>
            </div>
            <div className="space-y-2">
              {LEADS.map((l) => (
                <div
                  key={l.name}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-white/[0.02]"
                  style={{ borderColor: "var(--color-border-default)" }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: l.color + "22",
                        color: l.color,
                      }}
                    >
                      {l.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                        {l.name}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)]">
                        {l.city} · {l.kw}
                      </p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: l.color + "20",
                      color: l.color,
                    }}
                  >
                    {l.stage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 text-center font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
          Mockup · реалните данни ще дойдат от Evolto CRM-а
        </p>
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  trend,
  trendColor,
}: {
  label: string;
  value: string;
  trend: string;
  trendColor: string;
}) {
  return (
    <div className="p-6" style={{ background: "rgba(7,11,24,0.85)" }}>
      <p
        className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.25em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </p>
      <p
        className="mt-3 font-[family-name:var(--font-editorial)] text-3xl font-extrabold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </p>
      <p className="mt-2 text-[11px]" style={{ color: trendColor }}>
        {trend}
      </p>
    </div>
  );
}
