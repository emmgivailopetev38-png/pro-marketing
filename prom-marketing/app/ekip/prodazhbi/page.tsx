import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { loadSalesBoard } from "@/lib/team/sales";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { STAGE_COLOR, STAGE_LABEL, type ContactStage } from "@/lib/contacts/types";
import { fmtSofia } from "@/lib/team/time";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { SalesCard } from "@/components/ekip/SalesCard";
import { NapredakStrip } from "@/components/ekip/NapredakStrip";

export const dynamic = "force-dynamic";

/**
 * „Продажби“ — денят на продавача. Единицата е картонът, който той води:
 * кого да чуе днес, кой е просрочен, кой му е предаден, докъде е всеки в
 * тръбата, срещите му и какво е затворил този месец.
 */
export default async function ProdazhbiPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "prodazhbi")) redirect(homeFor(actor.member));

  const [board, nav] = await Promise.all([loadSalesBoard(actor), ekipNav(actor)]);
  const isOwner = actor.kind === "owner";
  const s = board.score;

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <EkipHeader name={actor.name} isOwner={isOwner} nav={nav.items} section="prodazhbi" unread={nav.unread} />

      <main className="space-y-6 px-4 py-4">
        <section className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          <Stat label="днес" value={board.today.length} accent="amber" />
          <Stat label="просрочени" value={board.overdue.length} accent="rose" />
          <Stat label="предадени" value={board.handed.length} accent="violet" />
          <Stat label="в тръбата" value={board.pipeline.length} accent="cyan" />
          <Stat label="срещи 14 дни" value={board.meetings.length} accent="emerald" />
          <Stat label="спечелени 30д" value={board.won.length} accent="emerald" />
        </section>

        <NapredakStrip actor={actor} />

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">Тръбата ти сега</p>
          <div className="mt-2 space-y-1.5">
            {board.steps.map((st) => {
              const max = Math.max(1, ...board.steps.map((x) => x.count));
              const color = STAGE_COLOR[st.stage as ContactStage] ?? "#7da8cc";
              return (
                <div key={st.stage} className="flex items-center gap-2 text-xs">
                  <span className="w-28 shrink-0 text-[var(--color-text-secondary)]">{STAGE_LABEL[st.stage as ContactStage]}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-white/5">
                    <div className="h-full rounded" style={{ width: `${Math.max(3, Math.round((st.count / max) * 100))}%`, background: `${color}66` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right font-mono text-[var(--color-text-secondary)]">
                    {st.count}
                    {st.value > 0 ? ` · ${st.value.toLocaleString("bg-BG")} €` : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
            За 30 дни: {s.calls} разговора · {s.meetings} срещи · {s.offers} оферти · {s.won} спечелени за {s.value.toLocaleString("bg-BG")} €
            {s.closeRate !== null ? ` · затваряш ${s.closeRate}% от срещите` : ""}
          </p>
        </section>

        {board.handed.length > 0 && (
          <Section title={`🤝 Предадени на теб · ${board.handed.length}`} tone="text-violet-300" hint="Някой е говорил с човека и го е дал на теб. Звънни днес — влизаш с повода от бележката.">
            {board.handed.map((r) => (
              <SalesCard key={r.id} row={r} mode="handed" isOwner={isOwner} />
            ))}
          </Section>
        )}

        {board.overdue.length > 0 && (
          <Section title={`⏰ Просрочени · ${board.overdue.length}`} tone="text-rose-300" hint="Обещал си чуване и денят мина. Първо тях — обещанието е обещание.">
            {board.overdue.map((r) => (
              <SalesCard key={r.id} row={r} mode="overdue" isOwner={isOwner} />
            ))}
          </Section>
        )}

        <Section title={`📌 За днес · ${board.today.length}`} tone="text-amber-300" hint={board.today.length === 0 ? "Никой не чака чуване днес. Вземи някого от тръбата." : undefined}>
          {board.today.map((r) => (
            <SalesCard key={r.id} row={r} mode="today" isOwner={isOwner} />
          ))}
        </Section>

        {board.meetings.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-300">📅 Срещи · следващите 14 дни</h2>
            <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
              {board.meetings.map((m) => (
                <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-2 text-sm">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-[var(--color-text-secondary)]">{fmtSofia(m.at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Section title={`💼 В тръбата · ${board.pipeline.length}`} tone="text-[var(--color-accent-cyan)]" hint={board.pipeline.length === 0 ? "Още нямаш картони на свое име. Ивайло ги дава от картона на клиента — „Отговорник“." : undefined}>
          {board.pipeline.map((r) => (
            <SalesCard key={r.id} row={r} mode="pipeline" isOwner={isOwner} />
          ))}
        </Section>

        {board.won.length > 0 && (
          <Section title={`🏆 Спечелени · 30 дни · ${board.won.length}`} tone="text-emerald-300">
            {board.won.map((r) => (
              <SalesCard key={r.id} row={r} mode="won" isOwner={isOwner} />
            ))}
          </Section>
        )}

        {board.lost.length > 0 && (
          <details className="rounded-2xl border border-white/10 p-3">
            <summary className="cursor-pointer text-sm text-[var(--color-text-tertiary)]">✕ Загубени · 30 дни · {board.lost.length}</summary>
            <div className="mt-3 space-y-3">
              {board.lost.map((r) => (
                <SalesCard key={r.id} row={r} mode="lost" isOwner={isOwner} />
              ))}
            </div>
          </details>
        )}
      </main>
    </div>
  );
}

function Section({ title, tone, hint, children }: { title: string; tone: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className={`text-sm font-semibold uppercase tracking-[0.15em] ${tone}`}>{title}</h2>
      {hint && <p className="-mt-1 text-xs text-[var(--color-text-tertiary)]">{hint}</p>}
      {children}
    </section>
  );
}

const STAT_COLOR = {
  cyan: "var(--color-accent-cyan)",
  amber: "rgb(252 211 77)",
  emerald: "rgb(110 231 183)",
  violet: "rgb(196 181 253)",
  rose: "rgb(253 164 175)",
} as const;

function Stat({ label, value, accent }: { label: string; value: number; accent: keyof typeof STAT_COLOR }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-3">
      <p className="text-2xl font-bold" style={{ color: STAT_COLOR[accent] }}>
        {value}
      </p>
      <p className="text-[10px] uppercase leading-tight tracking-[0.12em] text-[var(--color-text-tertiary)]">{label}</p>
    </div>
  );
}
