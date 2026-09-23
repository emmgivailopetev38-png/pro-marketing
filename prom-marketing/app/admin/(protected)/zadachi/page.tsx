import { requireTeamActor } from "@/lib/team/session";
import { loadAllTasks } from "@/lib/team/tasks";
import { buildBoard } from "@/lib/team/tasks-rules";
import { listActiveMembers } from "@/lib/team/repository";
import { TaskBoard } from "@/components/ekip/TaskBoard";

export const dynamic = "force-dynamic";

/**
 * Задачите на всички — за Ивайло. Горе: кой колко има и колко е просрочил.
 * После таблото: нова задача за когото и да е, срок, приоритет, изпълнител.
 */
export default async function AdminZadachiPage({ searchParams }: { searchParams: Promise<{ who?: string }> }) {
  const actor = await requireTeamActor();
  const sp = await searchParams;
  const [rows, members] = await Promise.all([loadAllTasks(), listActiveMembers()]);
  const who = sp.who ?? "";
  const filtered = who === "owner" ? rows.filter((r) => !r.assignee_id && !r.project_id) : who ? rows.filter((r) => r.assignee_id === who) : rows;
  const board = buildBoard(filtered);

  const perPerson = [{ id: "", name: "всички" }, { id: "owner", name: "Ивайло" }, ...members.map((m) => ({ id: m.id, name: m.full_name }))].map((p) => {
    const list = p.id === "" ? rows : p.id === "owner" ? rows.filter((r) => !r.assignee_id && !r.project_id) : rows.filter((r) => r.assignee_id === p.id);
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Sofia" });
    return {
      ...p,
      open: list.filter((r) => r.status !== "done").length,
      overdue: list.filter((r) => r.status !== "done" && r.due_date && r.due_date < today).length,
      done: list.filter((r) => r.status === "done").length,
    };
  });

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Екип</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Задачи</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Всяка задача има изпълнител, срок и приоритет. Който я отметне, оставя следа в картона на клиента. Готовите от
            последните 14 дни стоят долу, за да се вижда какво е свършено.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {perPerson.map((p) => (
              <a
                key={p.id}
                href={`/admin/zadachi${p.id ? `?who=${p.id}` : ""}`}
                className={`rounded-full border px-3 py-1.5 text-xs ${who === p.id ? "border-[var(--color-accent-cyan)] text-[var(--color-accent-cyan)]" : "border-white/10 text-[var(--color-text-secondary)]"}`}
              >
                {p.name} · {p.open}
                {p.overdue ? <span className="text-rose-300"> · {p.overdue} просрочени</span> : null}
                <span className="text-[var(--color-text-tertiary)]"> · {p.done} готови</span>
              </a>
            ))}
          </div>
        </header>
        <TaskBoard
          board={board}
          isOwner={actor.kind === "owner"}
          assignees={members.map((m) => ({ id: m.id, name: m.full_name }))}
          showAssignee
          threadBase="/admin/saobshtenia"
          defaultAssignee={who && who !== "owner" ? who : ""}
        />
      </div>
    </div>
  );
}
