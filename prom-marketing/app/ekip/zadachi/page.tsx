import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { loadTasksFor } from "@/lib/team/tasks";
import { boardCounts } from "@/lib/team/tasks-rules";
import { listActiveMembers } from "@/lib/team/repository";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { TaskBoard } from "@/components/ekip/TaskBoard";

export const dynamic = "force-dynamic";

/** „Задачи“ — моите задачи по срок; собственикът вижда всички и раздава. */
export default async function ZadachiPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "zadachi")) redirect(homeFor(actor.member));

  const isOwner = actor.kind === "owner";
  const [{ board }, nav, members] = await Promise.all([loadTasksFor(actor), ekipNav(actor), isOwner ? listActiveMembers() : Promise.resolve([])]);
  const n = boardCounts(board);

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <EkipHeader name={actor.name} isOwner={isOwner} nav={nav.items} section="zadachi" unread={nav.unread} />
      <main className="space-y-5 px-4 py-4">
        <section className="grid grid-cols-4 gap-2 text-center">
          <Stat label="отворени" value={n.open} color="var(--color-accent-cyan)" />
          <Stat label="просрочени" value={n.overdue} color="rgb(253 164 175)" />
          <Stat label="за днес" value={n.today} color="rgb(252 211 77)" />
          <Stat label="готови 7д" value={n.done} color="rgb(110 231 183)" />
        </section>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Всяка задача, която отметнеш, оставя следа в картона на клиента с твоето име. Ако нещо не е ясно — „💬“ до задачата
          отваря разговор по нея.
        </p>
        <TaskBoard board={board} isOwner={isOwner} assignees={members.map((m) => ({ id: m.id, name: m.full_name }))} showAssignee={isOwner} />
      </main>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-3">
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] uppercase leading-tight tracking-[0.12em] text-[var(--color-text-tertiary)]">{label}</p>
    </div>
  );
}
