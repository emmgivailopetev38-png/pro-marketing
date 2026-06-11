import { createServiceClient } from "@/lib/supabase/service";
import type { ProjectRow, ProjectTaskRow } from "@/lib/crm/types";
import { ProjectsManager } from "@/components/admin/ProjectsManager";
import type { ContactLite } from "@/components/admin/OffersManager";
import { formatMoney } from "@/lib/crm/labels";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const sb = createServiceClient();
  const [{ data: projectsData }, { data: tasksData }, { data: contactsData }] = await Promise.all([
    sb.from("projects").select("*").order("created_at", { ascending: false }),
    sb.from("project_tasks").select("*").order("sort_order", { ascending: true }),
    sb.from("contacts").select("id, full_name, email, company"),
  ]);
  const projects = (projectsData ?? []) as ProjectRow[];
  const tasks = (tasksData ?? []) as ProjectTaskRow[];
  const contacts = (contactsData ?? []) as ContactLite[];

  const active = projects.filter((p) => p.status === "planned" || p.status === "in_progress" || p.status === "waiting_client");
  const activeSum = active.reduce((s, p) => s + (Number(p.amount_gross) || 0), 0);

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Доставка</p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">Проекти</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {projects.length} общо · активни {active.length} ({formatMoney(activeSum)})
        </p>
      </header>

      <p className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 px-4 py-3 text-xs text-[var(--color-text-secondary)]">
        💡 Проектите идват автоматично от приета оферта или ги създаваш ръчно. Чеквай задачите докато доставяш — Hermes
        чете прогреса и напомня за зависалите.
      </p>

      <ProjectsManager projects={projects} tasks={tasks} contacts={contacts} />
    </div>
  );
}
