import Link from "next/link";
import { STAGE_COLOR, STAGE_LABEL, type ContactStage } from "@/lib/contacts/types";
import { moodOf } from "@/lib/contacts/dnevnik";
import type { EfektivnostData } from "@/lib/crm/efektivnost-data";

/** Минути → „34 мин“ / „5 ч 20 мин“ / „2 дни“ — колкото да се чете с един поглед. */
function human(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} мин`;
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
  }
  const d = Math.round(minutes / 1440);
  return d === 1 ? "1 ден" : `${d} дни`;
}

function pct(n: number, of: number): string {
  if (of === 0) return "—";
  return `${Math.round((n / of) * 100)}%`;
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[var(--color-text-tertiary)]">ново</span>;
  if (value === 0) return <span className="text-[var(--color-text-tertiary)]">без промяна</span>;
  const up = value > 0;
  return (
    <span style={{ color: up ? "#22c55e" : "#ef4444" }}>
      {up ? "▲" : "▼"} {Math.abs(value)}% спрямо предходния период
    </span>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--color-border-default)] p-5" style={{ background: "rgba(13,18,33,0.4)" }}>
      <h2 className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">
        {title}
      </h2>
      {hint && <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Big({ value, label, color, sub }: { value: string; label: string; color?: string; sub?: React.ReactNode }) {
  return (
    <div>
      <p className="text-3xl font-bold" style={{ color: color ?? "var(--color-text-primary)" }}>
        {value}
      </p>
      <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</p>
      {sub && <p className="mt-0.5 text-[11px]">{sub}</p>}
    </div>
  );
}

/** Стълбчета по ден — виждам кои дни съм звънял и кои съм пропуснал. */
function DayBars({ days }: { days: Array<{ day: string; n: number }> }) {
  const max = Math.max(1, ...days.map((d) => d.n));
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 56 }}>
      {days.map((d) => {
        const h = Math.round((d.n / max) * 100);
        const weekend = [0, 6].includes(new Date(`${d.day}T12:00:00Z`).getUTCDay());
        return (
          <div
            key={d.day}
            title={`${d.day} · ${d.n}`}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${Math.max(d.n > 0 ? 8 : 2, h)}%`,
              background: d.n === 0 ? "rgba(255,255,255,0.07)" : weekend ? "rgba(167,139,250,0.5)" : "var(--color-accent-cyan)",
            }}
          />
        );
      })}
    </div>
  );
}

export function EfektivnostBoard({ data }: { data: EfektivnostData }) {
  const d = data;
  const perWorkday = d.workdays > 0 ? ((d.mine.calls + d.mine.meetings) / d.workdays).toFixed(1) : "—";
  const speedColor = d.speed.medianMinutes === null ? undefined : d.speed.medianMinutes <= 60 ? "#22c55e" : d.speed.medianMinutes <= 1440 ? "#facc15" : "#ef4444";
  const promiseColor = d.promises.onTimePct === null ? undefined : d.promises.onTimePct >= 80 ? "#22c55e" : d.promises.onTimePct >= 50 ? "#facc15" : "#ef4444";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Моята работа" hint={`${d.days} дни · ${d.workdays} работни`}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Big value={String(d.mine.calls)} label="разговора" color="var(--color-accent-cyan)" sub={<Delta value={d.deltas.calls} />} />
            <Big value={String(d.mine.meetings)} label="срещи" color="#22c55e" sub={<Delta value={d.deltas.meetings} />} />
            <Big value={String(d.mine.people)} label="различни хора" color="#a78bfa" sub={<Delta value={d.deltas.people} />} />
            <Big value={perWorkday} label="чувания на работен ден" color="#facc15" sub={<span className="text-[var(--color-text-tertiary)]">разговори + срещи</span>} />
          </div>
          <div className="mt-4">
            <DayBars days={d.perDay} />
            <p className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">
              ден по ден · лилавото е събота и неделя · празните колони са дни без нито едно чуване
            </p>
          </div>
          {d.mine.diary > 0 && (
            <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
              От тях {d.mine.diary} са записани в дневника с настроение и обещания.
            </p>
          )}
        </Panel>

        <Panel title="Колко бързо стигам до новия човек" hint={`по ${d.speed.leads} нови лийда за периода`}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Big value={human(d.speed.medianMinutes)} label="типично време до първо чуване" color={speedColor} />
            <Big value={pct(d.speed.within1h, d.speed.leads)} label="до един час" color="#22c55e" sub={<span className="text-[var(--color-text-tertiary)]">{d.speed.within1h} души</span>} />
            <Big value={pct(d.speed.within24h, d.speed.leads)} label="до денонощие" color="#facc15" sub={<span className="text-[var(--color-text-tertiary)]">{d.speed.within24h} души</span>} />
            <Big
              value={String(d.speed.untouched)}
              label="още недокоснати"
              color={d.speed.untouched > 0 ? "#ef4444" : "#22c55e"}
              sub={<Link href="/ekip" className="underline-offset-2 hover:underline">опашката за звънене</Link>}
            />
          </div>
          {d.untouchedNames.length > 0 && (
            <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
              Чакат: {d.untouchedNames.join(" · ")}
              {d.speed.untouched > d.untouchedNames.length ? ` и още ${d.speed.untouched - d.untouchedNames.length}` : ""}
            </p>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Държа ли на думата си" hint="обещанията, които АЗ съм дал на клиенти, от дневника">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Big value={d.promises.onTimePct === null ? "—" : `${d.promises.onTimePct}%`} label="изпълнени навреме" color={promiseColor} />
            <Big value={String(d.promises.open)} label="отворени" color="#facc15" />
            <Big value={String(d.promises.overdue)} label="просрочени обещания" color={d.promises.overdue > 0 ? "#ef4444" : "#22c55e"} />
            <Big value={String(d.promises.late)} label="изпълнени със закъснение" color="#fb923c" />
          </div>
          {d.promises.total === 0 && (
            <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
              Още няма записани обещания. Пълни се само от „Записах разговор“ в картона — полето „аз обещах“.
            </p>
          )}
          <div className="mt-4 border-t border-white/5 pt-3">
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Напомняния в момента</p>
            <p className="mt-1 text-sm">
              <Link href="/admin/follow-up" className="underline-offset-2 hover:underline">
                <span style={{ color: d.followups.overdue > 0 ? "#ef4444" : "#22c55e" }}>{d.followups.overdue} просрочени</span>
                {" · "}
                <span style={{ color: "#facc15" }}>{d.followups.dueToday} за днес</span>
                {" · "}
                <span className="text-[var(--color-text-tertiary)]">{d.followups.future} напред</span>
              </Link>
            </p>
          </div>
        </Panel>

        <Panel title="Какво излиза от това" hint={`спечелени за последните ${d.days} дни`}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Big value={String(d.won.count)} label="спечелени" color="#22c55e" />
            <Big value={`${d.won.sumEur.toLocaleString("bg-BG")} €`} label="стойност" color="#facc15" />
            <Big value={d.won.avgEur === null ? "—" : `${d.won.avgEur.toLocaleString("bg-BG")} €`} label="средна сделка" color="#a78bfa" />
            <Big value={d.won.medianDays === null ? "—" : `${d.won.medianDays} дни`} label="от лийд до клиент" color="var(--color-accent-cyan)" />
          </div>
          {d.won.estimated > 0 && (
            <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
              ⚠️ {d.won.estimated} от тях нямат записано кога са спечелени — датирани са по последна редакция на картона, затова
              „от лийд до клиент“ ги пропуска. Оправя се с активност „Подписан“ или „Плащане“ в картона.
            </p>
          )}
          {d.moods.length > 0 && (
            <div className="mt-4 border-t border-white/5 pt-3">
              <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Температура на живите разговори</p>
              <p className="mt-1 flex flex-wrap gap-3 text-sm">
                {d.moods.map((m) => {
                  const mood = moodOf(m.mood);
                  if (!mood) return null;
                  return (
                    <span key={m.mood} style={{ color: mood.color }}>
                      {mood.emoji} {mood.label} · {m.count}
                    </span>
                  );
                })}
              </p>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Фунията" hint="докъде е стигнал всеки човек, а не къде седи сега — затова загубените се броят до стъпката, на която са паднали">
        <div className="space-y-2">
          {d.funnel.map((s) => {
            const width = d.funnel[0].reached === 0 ? 0 : Math.round((s.reached / d.funnel[0].reached) * 100);
            const color = STAGE_COLOR[s.stage as ContactStage] ?? "#7da8cc";
            return (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-xs text-[var(--color-text-secondary)]">
                  {STAGE_LABEL[s.stage as ContactStage] ?? s.stage}
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-md bg-white/5">
                  <div className="flex h-full items-center justify-end rounded-md px-2" style={{ width: `${Math.max(width, 2)}%`, background: `${color}55` }}>
                    <span className="text-[11px] font-bold" style={{ color }}>
                      {s.reached}
                    </span>
                  </div>
                </div>
                <span className="w-28 shrink-0 text-right text-[11px] text-[var(--color-text-tertiary)]">
                  {s.fromPrev === null ? "" : `${s.fromPrev}% от предната`}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Кой колко е чул" hint={`човешки разговори и срещи за ${d.days} дни`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              <th className="pb-2 font-normal">Кой</th>
              <th className="pb-2 text-right font-normal">Разговори</th>
              <th className="pb-2 text-right font-normal">Срещи</th>
              <th className="pb-2 text-right font-normal">Хора</th>
              <th className="pb-2 text-right font-normal">Записани в дневника</th>
            </tr>
          </thead>
          <tbody>
            {d.people.map((p) => (
              <tr key={p.name} className="border-t border-white/5">
                <td className="py-2">
                  {p.kind === "owner" ? "🧭 " : p.kind === "team" ? "👤 " : "🤖 "}
                  {p.name}
                </td>
                <td className="py-2 text-right font-mono">{p.volume.calls}</td>
                <td className="py-2 text-right font-mono">{p.volume.meetings}</td>
                <td className="py-2 text-right font-mono">{p.volume.people}</td>
                <td className="py-2 text-right font-mono">{p.volume.diary}</td>
              </tr>
            ))}
            {d.people.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-[var(--color-text-tertiary)]">
                  Няма записани разговори за периода.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
