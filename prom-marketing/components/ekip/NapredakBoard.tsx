import Link from "next/link";
import { TEAM_ROLE_SHORT } from "@/lib/team/types";
import {
  PERIODS,
  fmtNum,
  humanMinutes,
  isWeekend,
  type NapredakData,
  type PersonNapredak,
  type TeamAverage,
  type TeamRow,
} from "@/lib/team/napredak-rules";

/**
 * Таблото „Напредък“ — едно и също за човека на /ekip и за Ивайло на /admin;
 * `tone` сменя само кожата (тъмните карти на телефона срещу панелите на
 * командния център). Всичко тук са истински числа: собствените за периода,
 * същите за предходния и същите за другите хора. Без цели и без оценки.
 */

type Tone = "ekip" | "admin";

const SKIN: Record<Tone, { panel: string; panelStyle?: React.CSSProperties; title: string; big: string }> = {
  ekip: {
    panel: "rounded-2xl border border-white/10 bg-white/[0.03] p-4",
    title: "text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]",
    big: "text-2xl",
  },
  admin: {
    panel: "rounded-xl border border-[var(--color-border-default)] p-5",
    panelStyle: { background: "rgba(13,18,33,0.4)" },
    title: "font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-violet)]",
    big: "text-3xl",
  },
};

const C = {
  cyan: "var(--color-accent-cyan)",
  green: "#22c55e",
  amber: "#facc15",
  rose: "#f87171",
  violet: "#a78bfa",
  orange: "#fb923c",
  muted: "rgba(255,255,255,0.28)",
} as const;

export interface NapredakBoardProps {
  data: NapredakData;
  tone: Tone;
  /** къде водят връзките за период и за човек: „/ekip/napredak“ или „/admin/napredak“ */
  basePath: string;
  /** slug-ът в адреса, когато собственикът гледа друг; null = собствените числа */
  who?: string | null;
  /** превключвател между хората (само за собственика) */
  switcher?: boolean;
  /** къде са задачите на този човек */
  tasksHref?: string;
}

function hrefFor(basePath: string, days: number, who: string | null | undefined): string {
  return `${basePath}?d=${days}${who ? `&who=${encodeURIComponent(who)}` : ""}`;
}

function pct(n: number, of: number): string {
  return of === 0 ? "—" : `${Math.round((n / of) * 100)}%`;
}

type Skin = (typeof SKIN)[Tone];

function Panel({ skin, title, hint, children }: { skin: Skin; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className={skin.panel} style={skin.panelStyle}>
      <h2 className={skin.title}>{title}</h2>
      {hint && <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Big({ skin, value, label, color, sub }: { skin: Skin; value: string; label: string; color?: string; sub?: React.ReactNode }) {
  return (
    <div>
      <p className={`${skin.big} font-bold`} style={{ color: color ?? "var(--color-text-primary)" }}>
        {value}
      </p>
      <p className="text-[10px] uppercase leading-tight tracking-[0.12em] text-[var(--color-text-tertiary)]">{label}</p>
      {sub && <p className="mt-0.5 text-[11px]">{sub}</p>}
    </div>
  );
}

function Delta({ value, prev, unit = "" }: { value: number | null; prev: number; unit?: string }) {
  if (value === null) return <span className="text-[var(--color-text-tertiary)]">преди: {prev}{unit}</span>;
  if (value === 0) return <span className="text-[var(--color-text-tertiary)]">без промяна</span>;
  const up = value > 0;
  return (
    <span title="спрямо предходния равен период" style={{ color: up ? C.green : C.rose }}>
      {up ? "▲" : "▼"} {Math.abs(value)}% <span className="text-[var(--color-text-tertiary)]">(преди {prev}{unit})</span>
    </span>
  );
}

export function NapredakBoard({ data, tone, basePath, who = null, switcher = false, tasksHref }: NapredakBoardProps) {
  const skin = SKIN[tone];
  const me = data.me;
  const v = me.cur.volume;
  const role = me.person.role;
  const callsFirst = role === "owner" || role === "setter" || role === "sales";
  const showCalls = callsFirst || v.calls + me.prev.volume.calls > 0;
  const showMeetings = callsFirst || me.cur.meetings.booked + me.prev.meetings.booked > 0;
  const showSpeed = callsFirst && me.cur.speed.leads > 0;
  const perWorkday = data.workdays > 0 ? fmtNum(me.perDay.reduce((s, d) => s + d.n, 0) / data.workdays) : "—";

  return (
    <div className="space-y-4">
      {/* Кой и за колко време */}
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">Напредък · {TEAM_ROLE_SHORT[role]}</p>
          <h1 className="text-xl font-bold">{me.person.name}</h1>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            последните {data.days} дни · {data.workdays} работни · сравнено с предходните {data.days}
          </p>
        </div>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => {
            const active = data.days === p;
            return (
              <Link
                key={p}
                href={hrefFor(basePath, p, who)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-[var(--color-accent-cyan)]/60 bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)]"
                    : "border-white/10 text-[var(--color-text-secondary)]"
                }`}
              >
                {p} дни
              </Link>
            );
          })}
        </div>
      </section>

      {switcher && data.people.length > 1 && (
        <nav className="flex flex-wrap gap-1.5" aria-label="Хора">
          {data.people.map((p) => {
            const active = p.key === me.person.key;
            return (
              <Link
                key={p.key}
                href={hrefFor(basePath, data.days, p.kind === "owner" ? null : p.key)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  active ? "border-[var(--color-accent-cyan)]/60 text-[var(--color-accent-cyan)]" : "border-white/10 text-[var(--color-text-secondary)]"
                }`}
              >
                {p.name}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Изводите */}
      <Panel skin={skin} title="Какво казват числата">
        <ul className="space-y-1.5 text-sm">
          {me.insights.map((s) => (
            <li key={s} className="flex gap-2">
              <span className="text-[var(--color-accent-cyan)]">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Обажданията */}
      {showCalls && (
        <Panel skin={skin} title="Обаждания" hint="всяко натискане на бутон в опашката е обаждане; „Записах среща“ също">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Big skin={skin} value={String(v.calls)} label="обаждания" color={C.cyan} sub={<Delta value={me.deltas.calls} prev={me.prev.volume.calls} />} />
            <Big
              skin={skin}
              value={String(v.talked)}
              label="говорихме"
              color={C.green}
              sub={me.cur.talkedPct === null ? <Delta value={me.deltas.talked} prev={me.prev.volume.talked} /> : <span>{me.cur.talkedPct}% от обажданията с изход</span>}
            />
            <Big
              skin={skin}
              value={String(me.cur.meetings.booked)}
              label="записани срещи"
              color={C.violet}
              sub={<Delta value={me.deltas.meetings} prev={me.prev.meetings.booked} />}
            />
            <Big skin={skin} value={String(v.people)} label="различни хора" color={C.amber} sub={<Delta value={me.deltas.people} prev={me.prev.volume.people} />} />
          </div>

          {v.calls > 0 && (
            <div className="mt-4">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
                {(
                  [
                    ["говорихме", v.talked, C.green],
                    ["не се интересува", v.notInterested, C.amber],
                    ["не вдигна", v.noAnswer, C.muted],
                    ["грешен номер", v.wrongNumber, C.rose],
                    ["без изход", v.unknown, "rgba(255,255,255,0.12)"],
                  ] as Array<[string, number, string]>
                ).map(([label, n, color]) =>
                  n > 0 ? <div key={label} title={`${label} · ${n}`} style={{ width: `${(n / v.calls) * 100}%`, background: color }} /> : null
                )}
              </div>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-secondary)]">
                <span style={{ color: C.green }}>● говорихме {v.talked}</span>
                <span style={{ color: C.amber }}>● не се интересува {v.notInterested}</span>
                <span className="text-[var(--color-text-tertiary)]">● не вдигна {v.noAnswer}</span>
                <span style={{ color: C.rose }}>● грешен номер {v.wrongNumber}</span>
                {v.unknown > 0 && <span className="text-[var(--color-text-tertiary)]">● без изход {v.unknown}</span>}
              </p>
            </div>
          )}

          <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
            {me.cur.perMeeting !== null && me.cur.perMeeting >= 1 ? `за 1 среща — ${fmtNum(me.cur.perMeeting)} разговора · ` : ""}
            вдигнали {v.reached}
            {v.calls - v.unknown > 0 ? ` (${pct(v.reached, v.calls - v.unknown)})` : ""}
            {v.handoffs > 0 ? ` · предадени на Ивайло ${v.handoffs}` : ""}
            {v.escalated > 0 ? ` · върнати на Ивайло след 7 дни ${v.escalated}` : ""}
            {v.messages > 0 ? ` · Viber съобщения за срещи ${v.messages}` : ""}
            {v.viber > 0 ? ` · други Viber ${v.viber}` : ""}
            {v.diary > 0 ? ` · в дневника ${v.diary}` : ""}
          </p>
        </Panel>
      )}

      {/* Срещите */}
      {showMeetings && (
        <Panel skin={skin} title="Срещи" hint="записаните в периода и какво е станало с тях; явяемост = проведени спрямо проведени + неявили се">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <Big skin={skin} value={String(me.cur.meetings.booked)} label="записани" color={C.violet} />
            <Big skin={skin} value={String(me.cur.meetings.completed)} label="проведени" color={C.green} />
            <Big skin={skin} value={String(me.cur.meetings.noShow)} label="не се явиха" color={me.cur.meetings.noShow > 0 ? C.rose : undefined} />
            <Big skin={skin} value={String(me.cur.meetings.upcoming)} label="предстоящи" color={C.cyan} />
            <Big skin={skin} value={String(me.cur.meetings.cancelled)} label="отказани" color={me.cur.meetings.cancelled > 0 ? C.orange : undefined} />
            <Big
              skin={skin}
              value={me.cur.meetings.showRate === null ? "—" : `${me.cur.meetings.showRate}%`}
              label="явяемост"
              color={me.cur.meetings.showRate === null ? undefined : me.cur.meetings.showRate >= 70 ? C.green : C.amber}
              sub={
                me.prev.meetings.showRate !== null ? (
                  <span className="text-[var(--color-text-tertiary)]">преди {me.prev.meetings.showRate}%</span>
                ) : undefined
              }
            />
          </div>
          {me.cur.meetings.pastUnmarked > 0 && (
            <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
              {me.cur.meetings.pastUnmarked} минали без отбелязан изход — не влизат в явяемостта, докато някой не отбележи „проведена“ или „не се яви“.
            </p>
          )}
        </Panel>
      )}

      {/* Скоростта */}
      {showSpeed && (
        <Panel skin={skin} title="Колко бързо стигаш до новия лийд" hint={`по ${me.cur.speed.leads} нови лийда за периода, от тях ${me.cur.speed.touched} чути от теб`}>
          <div className="grid grid-cols-3 gap-3">
            <Big
              skin={skin}
              value={humanMinutes(me.cur.speed.medianMinutes)}
              label="типично време до първо чуване"
              color={
                me.cur.speed.medianMinutes === null ? undefined : me.cur.speed.medianMinutes <= 60 ? C.green : me.cur.speed.medianMinutes <= 1440 ? C.amber : C.rose
              }
              sub={me.prev.speed.medianMinutes !== null ? <span className="text-[var(--color-text-tertiary)]">преди {humanMinutes(me.prev.speed.medianMinutes)}</span> : undefined}
            />
            <Big skin={skin} value={pct(me.cur.speed.within1h, me.cur.speed.touched)} label="до един час" color={C.green} sub={<span className="text-[var(--color-text-tertiary)]">{me.cur.speed.within1h} души</span>} />
            <Big skin={skin} value={pct(me.cur.speed.within24h, me.cur.speed.touched)} label="до денонощие" color={C.amber} sub={<span className="text-[var(--color-text-tertiary)]">{me.cur.speed.within24h} души</span>} />
          </div>
        </Panel>
      )}

      {/* По дни */}
      <Panel skin={skin} title="Ден по ден" hint={`действия на ден: чувания, готови задачи, обновления · средно ${perWorkday} на работен ден`}>
        <DayBars days={me.perDay} />
        <p className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">лилавото е събота и неделя · празните колони са дни без нито едно действие</p>
      </Panel>

      {/* Задачите */}
      <Panel skin={skin} title="Задачи" hint="готовите — за периода; останалите — както стоят сега">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Big skin={skin} value={String(me.cur.tasksDone)} label="готови" color={C.green} sub={<Delta value={me.deltas.tasksDone} prev={me.prev.tasksDone} />} />
          <Big skin={skin} value={String(me.tasks.overdue)} label="просрочени" color={me.tasks.overdue > 0 ? C.rose : C.green} />
          <Big skin={skin} value={String(me.tasks.today)} label="за днес" color={C.amber} />
          <Big skin={skin} value={String(me.tasks.week)} label="тази седмица" color={C.cyan} />
        </div>
        <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
          отворени общо {me.tasks.open}
          {me.tasks.nodate > 0 ? ` · без срок ${me.tasks.nodate}` : ""}
          {v.projectUpdates > 0 || role === "delivery" || role === "marketing" ? ` · обновления по проекти ${v.projectUpdates} (преди ${me.prev.volume.projectUpdates})` : ""}
          {tasksHref && (
            <>
              {" · "}
              <Link href={tasksHref} className="underline-offset-2 hover:underline">
                към задачите
              </Link>
            </>
          )}
        </p>
      </Panel>

      {/* Сравнението */}
      <Panel skin={skin} title="Спрямо другите" hint="същите числа за всеки в екипа за същия период; средното е по хората, които са работили">
        <TeamTable rows={data.team} average={data.average} meKey={me.person.key} />
      </Panel>

      <p className="text-[11px] text-[var(--color-text-tertiary)]">
        Броят се само твоите действия: натиснатите бутони в опашката, записаните срещи, отметнатите задачи, обновленията по проекти.
        Автоматиките не са ничия заслуга. Срещата, записана днес за утре, е работа от днес.
      </p>
    </div>
  );
}

/** Стълбчета по ден — кои дни е имало работа и кои са били празни. */
function DayBars({ days }: { days: PersonNapredak["perDay"] }) {
  const max = Math.max(1, ...days.map((d) => d.n));
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 56 }}>
      {days.map((d) => {
        const h = Math.round((d.n / max) * 100);
        return (
          <div
            key={d.day}
            title={`${d.day} · ${d.n}`}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${Math.max(d.n > 0 ? 8 : 2, h)}%`,
              background: d.n === 0 ? "rgba(255,255,255,0.07)" : isWeekend(d.day) ? "rgba(167,139,250,0.5)" : "var(--color-accent-cyan)",
            }}
          />
        );
      })}
    </div>
  );
}

function TeamTable({ rows, average, meKey }: { rows: TeamRow[]; average: TeamAverage | null; meKey: string }) {
  const cell = "py-2 text-right font-mono text-xs";
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <th className="pb-2 font-normal">Кой</th>
            <th className="pb-2 text-right font-normal">Обажд.</th>
            <th className="pb-2 text-right font-normal">Говор.</th>
            <th className="pb-2 text-right font-normal">Срещи</th>
            <th className="pb-2 text-right font-normal">Явяем.</th>
            <th className="pb-2 text-right font-normal">До лийда</th>
            <th className="pb-2 text-right font-normal">Хора</th>
            <th className="pb-2 text-right font-normal">Задачи ✓ / ⏰</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const mine = r.person.key === meKey;
            return (
              <tr key={r.person.key} className={`border-t border-white/5 ${mine ? "bg-[var(--color-accent-cyan)]/10" : ""}`}>
                <td className="py-2 text-xs">
                  {r.person.kind === "owner" ? "🧭 " : "👤 "}
                  {r.person.name}
                  {mine && <span className="ml-1 text-[10px] text-[var(--color-accent-cyan)]">ти</span>}
                </td>
                <td className={cell}>{r.calls}</td>
                <td className={cell}>{r.talked}</td>
                <td className={cell}>{r.meetings}</td>
                <td className={cell}>{r.showRate === null ? "—" : `${r.showRate}%`}</td>
                <td className={cell}>{humanMinutes(r.medianMinutes)}</td>
                <td className={cell}>{r.people}</td>
                <td className={cell}>
                  {r.tasksDone} / <span style={{ color: r.tasksOverdue > 0 ? C.rose : undefined }}>{r.tasksOverdue}</span>
                </td>
              </tr>
            );
          })}
          {average && (
            <tr className="border-t border-white/10 text-[var(--color-text-tertiary)]">
              <td className="py-2 text-xs">средно</td>
              <td className={cell}>{fmtNum(average.calls)}</td>
              <td className={cell}>{fmtNum(average.talked)}</td>
              <td className={cell}>{fmtNum(average.meetings)}</td>
              <td className={cell}>{average.showRate === null ? "—" : `${fmtNum(average.showRate)}%`}</td>
              <td className={cell}>{average.medianMinutes === null ? "—" : humanMinutes(Math.round(average.medianMinutes))}</td>
              <td className={cell}>{fmtNum(average.people)}</td>
              <td className={cell}>
                {fmtNum(average.tasksDone)} / {fmtNum(average.tasksOverdue)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
