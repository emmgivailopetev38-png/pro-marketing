import type { KonversiiData } from "@/lib/crm/konversii-data";
import type { FunnelCounts } from "@/lib/crm/konversii";
import { pct } from "@/lib/crm/konversii";

const STEPS: Array<{ key: keyof FunnelCounts; label: string; color: string }> = [
  { key: "leads", label: "Лийдове", color: "#7da8cc" },
  { key: "touched", label: "Докоснати (човек звънна)", color: "#a78bfa" },
  { key: "talked", label: "Говорихме", color: "#00d4ff" },
  { key: "meetings", label: "Записана среща", color: "#facc15" },
  { key: "held", label: "Проведена среща", color: "#fb923c" },
  { key: "offers", label: "Оферта", color: "#ec4899" },
  { key: "won", label: "Клиенти", color: "#22c55e" },
];

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--color-border-default)] p-5" style={{ background: "rgba(13,18,33,0.4)" }}>
      <h2 className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">{title}</h2>
      {hint && <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Funnel({ f, prev }: { f: FunnelCounts; prev?: FunnelCounts }) {
  return (
    <div className="space-y-2">
      {STEPS.map((s, i) => {
        const v = f[s.key];
        const width = f.leads === 0 ? 0 : Math.round((v / f.leads) * 100);
        const fromPrev = i === 0 ? null : pct(v, f[STEPS[i - 1].key]);
        const p = prev ? prev[s.key] : null;
        return (
          <div key={s.key} className="flex items-center gap-3">
            <span className="w-44 shrink-0 text-xs text-[var(--color-text-secondary)]">{s.label}</span>
            <div className="h-6 flex-1 overflow-hidden rounded-md bg-white/5">
              <div className="flex h-full items-center justify-end rounded-md px-2" style={{ width: `${Math.max(width, 3)}%`, background: `${s.color}55` }}>
                <span className="text-[11px] font-bold" style={{ color: s.color }}>
                  {v}
                </span>
              </div>
            </div>
            <span className="w-32 shrink-0 text-right text-[11px] text-[var(--color-text-tertiary)]">
              {fromPrev === null ? `${width}%` : `${fromPrev}% от предната`}
              {p !== null && p !== undefined ? <span className="block text-[10px]">преди: {p}</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MiniRow({ label, f }: { label: string; f: FunnelCounts }) {
  return (
    <tr className="border-t border-white/5">
      <td className="py-2 pr-2">{label}</td>
      <td className="py-2 text-right font-mono">{f.leads}</td>
      <td className="py-2 text-right font-mono">{f.touched}</td>
      <td className="py-2 text-right font-mono">{f.talked}</td>
      <td className="py-2 text-right font-mono">{f.meetings}</td>
      <td className="py-2 text-right font-mono">{f.held}</td>
      <td className="py-2 text-right font-mono">{f.offers}</td>
      <td className="py-2 text-right font-mono text-emerald-300">{f.won}</td>
      <td className="py-2 text-right font-mono text-[var(--color-text-tertiary)]">{f.lost}</td>
      <td className="py-2 text-right font-mono">{pct(f.meetings, f.leads) ?? "—"}%</td>
      <td className="py-2 text-right font-mono">{pct(f.won, f.meetings) ?? "—"}%</td>
    </tr>
  );
}

function Head() {
  return (
    <thead>
      <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
        <th className="pb-2 font-normal">Група</th>
        <th className="pb-2 text-right font-normal">Лийдове</th>
        <th className="pb-2 text-right font-normal">Докоснати</th>
        <th className="pb-2 text-right font-normal">Говорихме</th>
        <th className="pb-2 text-right font-normal">Срещи</th>
        <th className="pb-2 text-right font-normal">Проведени</th>
        <th className="pb-2 text-right font-normal">Оферти</th>
        <th className="pb-2 text-right font-normal">Клиенти</th>
        <th className="pb-2 text-right font-normal">Загубени</th>
        <th className="pb-2 text-right font-normal">лийд→среща</th>
        <th className="pb-2 text-right font-normal">среща→клиент</th>
      </tr>
    </thead>
  );
}

const SOURCE: Record<string, string> = {
  meta_lead: "Meta реклама",
  website_form: "Формата на сайта",
  voice_web: "Гласов агент · сайт",
  voice_phone: "Гласов агент · телефон",
  hermes: "Хермес / ръчно",
  manual: "Ръчно",
  cal_booking: "Cal.com",
};

export function KonversiiBoard({ d }: { d: KonversiiData }) {
  const f = d.funnel;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {STEPS.map((s) => (
          <div key={s.key} className="rounded-xl border border-white/10 p-3">
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {f[s.key]}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Фунията за периода" hint="докъде е стигнал всеки лийд, по следи в картона — не по етап">
          <Funnel f={f} prev={d.prev} />
        </Panel>
        <Panel title="Колко струва" hint={`рекламен разход за периода: ${d.adSpend.toLocaleString("bg-BG")} € (от разходите с категория „Реклами“)`}>
          <div className="grid grid-cols-2 gap-4">
            <Big value={d.cost.lead} label="за лийд" />
            <Big value={d.cost.talked} label="за разговор" />
            <Big value={d.cost.meeting} label="за среща" />
            <Big value={d.cost.won} label="за клиент" />
          </div>
          <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
            Ако разходът е 0 — фактурите на Meta за периода още не са в „Разходи“. Вкарай ги и числата се появяват сами.
          </p>
        </Panel>
      </div>

      <Panel title="По източник">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <Head />
            <tbody>
              {d.bySource.map((g) => (
                <MiniRow key={g.key} label={SOURCE[g.key] ?? g.key} f={g.funnel} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="По седмица (лийдове от тази седмица и какво е станало с тях до днес)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <Head />
            <tbody>
              {d.byWeek.map((g) => (
                <MiniRow key={g.key} label={`от ${new Date(`${g.key}T12:00:00Z`).toLocaleDateString("bg-BG", { day: "2-digit", month: "short" })}`} f={g.funnel} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Кой колко е чул" hint="само хора — Димитър, Ивайло, продавачите">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                <th className="pb-2 font-normal">Кой</th>
                <th className="pb-2 text-right font-normal">Обаждания</th>
                <th className="pb-2 text-right font-normal">Говорил</th>
                <th className="pb-2 text-right font-normal">Срещи</th>
                <th className="pb-2 text-right font-normal">Първи докоснал</th>
                <th className="pb-2 text-right font-normal">Типично време</th>
              </tr>
            </thead>
            <tbody>
              {d.people.map((p) => (
                <tr key={p.name} className="border-t border-white/5">
                  <td className="py-2">{p.name}</td>
                  <td className="py-2 text-right font-mono">{p.calls}</td>
                  <td className="py-2 text-right font-mono">{p.talked}</td>
                  <td className="py-2 text-right font-mono">{p.meetingsBooked}</td>
                  <td className="py-2 text-right font-mono">{p.firstTouches}</td>
                  <td className="py-2 text-right font-mono">{human(p.medianMinutesToTouch)}</td>
                </tr>
              ))}
              {d.people.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[var(--color-text-tertiary)]">
                    Няма човешки обаждания за периода.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>

        <Panel title="Екипът за периода" hint="готови задачи, съобщения в CRM-а, обновления по проекти, дължими комисионни">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                <th className="pb-2 font-normal">Кой</th>
                <th className="pb-2 text-right font-normal">Задачи</th>
                <th className="pb-2 text-right font-normal">Съобщения</th>
                <th className="pb-2 text-right font-normal">По проекти</th>
                <th className="pb-2 text-right font-normal">Комисионни</th>
              </tr>
            </thead>
            <tbody>
              {d.team.map((t) => (
                <tr key={t.name} className="border-t border-white/5">
                  <td className="py-2">{t.name}</td>
                  <td className="py-2 text-right font-mono">{t.tasksDone}</td>
                  <td className="py-2 text-right font-mono">{t.messages}</td>
                  <td className="py-2 text-right font-mono">{t.projectUpdates}</td>
                  <td className="py-2 text-right font-mono">{t.commissionsDue ? `${t.commissionsDue.toLocaleString("bg-BG")} €` : "—"}</td>
                </tr>
              ))}
              {d.team.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-[var(--color-text-tertiary)]">
                    Още нищо за периода.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>

      {d.byOwner.length > 1 && (
        <Panel title="По отговорник на картона">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <Head />
              <tbody>
                {d.byOwner.map((g) => (
                  <MiniRow key={g.key} label={g.key} f={g.funnel} />
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Big({ value, label }: { value: number | null; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold" style={{ color: value === null ? "var(--color-text-tertiary)" : "#facc15" }}>
        {value === null ? "—" : `${value.toLocaleString("bg-BG")} €`}
      </p>
      <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</p>
    </div>
  );
}

function human(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} мин`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} ч`;
  return `${Math.round(minutes / 1440)} дни`;
}
