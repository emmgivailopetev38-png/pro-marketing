import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { boardCounts, loadDeliveryBoard } from "@/lib/team/projects";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { ProjectCard } from "@/components/ekip/ProjectCard";

export const dynamic = "force-dynamic";

/**
 * „Моите проекти“ — денят на човека по доставката, огледално на опашката за
 * звънене. Отгоре моите живи проекти (със срок най-напред), после свободните,
 * които може да поеме, най-долу чуждите — за да вижда картината, без да ги
 * пипа. Всяко докосване оттук се записва в картона на клиента с неговото име.
 */
export default async function EkipProjectsPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");

  const board = await loadDeliveryBoard(actor.member?.id ?? null);
  const n = boardCounts(board);

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} section="proekti" />

      <main className="space-y-6 px-4 py-4">
        <section className="grid grid-cols-4 gap-2 text-center">
          <Stat label="мои" value={n.mine} accent="cyan" />
          <Stat label="задачи" value={n.openTasks} accent="amber" />
          <Stat label="просрочени" value={n.overdue} accent="rose" />
          <Stat label="свободни" value={n.free} accent="violet" />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-accent-cyan)]">
            🛠 Моите проекти · {board.mine.length}
          </h2>
          {board.mine.length === 0 ? (
            <p className="rounded-2xl border border-white/10 p-6 text-center text-sm text-[var(--color-text-secondary)]">
              Още нямаш проект на свое име. Вземи някой от свободните отдолу — щом го поемеш, застава тук и всичко по
              него тръгва с твоето име.
            </p>
          ) : (
            board.mine.map((p) => <ProjectCard key={p.id} project={p} mode="mine" />)
          )}
        </section>

        {board.free.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-violet-300">
              🙋 Свободни · {board.free.length}
            </h2>
            <p className="-mt-1 text-xs text-[var(--color-text-tertiary)]">
              Живи проекти без отговорник — засега при Ивайло. Натисни „Вземам го“ и минава при теб.
            </p>
            {board.free.map((p) => (
              <ProjectCard key={p.id} project={p} mode="free" />
            ))}
          </section>
        )}

        {board.others.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
              👥 При другите · {board.others.length}
            </h2>
            {board.others.map((p) => (
              <ProjectCard key={p.id} project={p} mode="other" />
            ))}
          </section>
        )}

        {board.recentlyDone.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-300">
              ✅ Завършени от теб този месец · {board.recentlyDone.length}
            </h2>
            {board.recentlyDone.map((p) => (
              <ProjectCard key={p.id} project={p} mode="done" />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

const STAT_COLOR = {
  cyan: "var(--color-accent-cyan)",
  amber: "rgb(252 211 77)",
  rose: "rgb(253 164 175)",
  violet: "rgb(196 181 253)",
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
