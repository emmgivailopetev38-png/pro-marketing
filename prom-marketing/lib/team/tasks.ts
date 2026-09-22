import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { TeamActor } from "./session";
import { buildBoard, isPriority, type TaskBoard, type TaskLite, type TaskPriority } from "./tasks-rules";

/**
 * Задачите — четене и писане. Правилата (купчини, ред) са в tasks-rules.ts.
 *
 * Една задача може да е по проект (наследява отговорника му), по картон или
 * обща. Който я отметне, оставя следа в картона на клиента с името си.
 */

const COLS =
  "id, project_id, contact_id, title, description, status, priority, kind, due_date, sort_order, done_at, assignee_id, client_visible, client_done_at, created_by, created_at, updated_at";

export interface TaskRow extends TaskLite {
  description: string | null;
  kind: string;
  client_visible: boolean;
  client_done_at: string | null;
  created_by: string | null;
  sort_order: number;
  updated_at: string;
  created_at: string;
  /** попълва се при четене */
  project_title?: string | null;
  contact_name?: string | null;
  assignee_name?: string | null;
}

type Sb = ReturnType<typeof createServiceClient>;

async function decorate(sb: Sb, rows: TaskRow[]): Promise<TaskRow[]> {
  const projectIds = [...new Set(rows.map((t) => t.project_id).filter((v): v is string => !!v))];
  const contactIds = [...new Set(rows.map((t) => t.contact_id).filter((v): v is string => !!v))];
  const [{ data: projects }, { data: members }] = await Promise.all([
    projectIds.length
      ? sb.from("projects").select("id, title, contact_id, owner_id").in("id", projectIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string; contact_id: string | null; owner_id: string | null }> }),
    sb.from("team_members").select("id, full_name"),
  ]);
  const projectById = new Map(
    ((projects ?? []) as Array<{ id: string; title: string; contact_id: string | null; owner_id: string | null }>).map((p) => [p.id, p])
  );
  for (const p of projectById.values()) if (p.contact_id) contactIds.push(p.contact_id);
  const { data: contacts } = contactIds.length
    ? await sb.from("contacts").select("id, full_name, company").in("id", [...new Set(contactIds)])
    : { data: [] as Array<{ id: string; full_name: string | null; company: string | null }> };
  const contactById = new Map(
    ((contacts ?? []) as Array<{ id: string; full_name: string | null; company: string | null }>).map((c) => [c.id, c])
  );
  const memberName = new Map(((members ?? []) as Array<{ id: string; full_name: string }>).map((m) => [m.id, m.full_name]));

  return rows.map((t) => {
    const p = t.project_id ? projectById.get(t.project_id) : undefined;
    const c = t.contact_id ? contactById.get(t.contact_id) : p?.contact_id ? contactById.get(p.contact_id) : undefined;
    const assignee = t.assignee_id ?? p?.owner_id ?? null;
    return {
      ...t,
      project_title: p?.title ?? null,
      contact_name: c ? c.full_name ?? c.company ?? null : null,
      assignee_name: assignee ? memberName.get(assignee) ?? null : "Ивайло",
    };
  });
}

/**
 * Задачите на един човек: изрично негови + по проекти, на които е отговорник.
 * Собственикът вижда всичко.
 */
export async function loadTasksFor(actor: TeamActor): Promise<{ board: TaskBoard; rows: TaskRow[] }> {
  const sb = createServiceClient();
  let query = sb.from("project_tasks").select(COLS).order("due_date", { ascending: true, nullsFirst: false }).limit(800);
  if (actor.kind === "member") {
    const { data: mine } = await sb.from("projects").select("id").eq("owner_id", actor.member.id);
    const projectIds = ((mine ?? []) as Array<{ id: string }>).map((p) => p.id);
    const parts = [`assignee_id.eq.${actor.member.id}`];
    if (projectIds.length) parts.push(`and(assignee_id.is.null,project_id.in.(${projectIds.join(",")}))`);
    query = query.or(parts.join(","));
  }
  const { data } = await query;
  const rows = await decorate(sb, (data ?? []) as TaskRow[]);
  return { board: buildBoard(rows), rows };
}

/** Всички отворени + скорошни готови — за таблото на Ивайло по хора. */
export async function loadAllTasks(): Promise<TaskRow[]> {
  const sb = createServiceClient();
  const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const { data } = await sb
    .from("project_tasks")
    .select(COLS)
    .or(`status.neq.done,done_at.gte.${since}`)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(1000);
  return decorate(sb, (data ?? []) as TaskRow[]);
}

export async function tasksForContact(contactId: string): Promise<TaskRow[]> {
  const sb = createServiceClient();
  const { data: projects } = await sb.from("projects").select("id").eq("contact_id", contactId);
  const projectIds = ((projects ?? []) as Array<{ id: string }>).map((p) => p.id);
  const parts = [`contact_id.eq.${contactId}`];
  if (projectIds.length) parts.push(`project_id.in.(${projectIds.join(",")})`);
  const { data } = await sb.from("project_tasks").select(COLS).or(parts.join(",")).order("status").order("due_date", { ascending: true, nullsFirst: false });
  return decorate(sb, (data ?? []) as TaskRow[]);
}

export interface NewTask {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: string | null;
  assignee_id?: string | null;
  project_id?: string | null;
  contact_id?: string | null;
  client_visible?: boolean;
  kind?: "task" | "client_request";
  created_by: string;
}

export async function createTask(input: NewTask): Promise<{ id: string | null; error: string | null }> {
  const title = input.title.trim();
  if (!title) return { id: null, error: "Напиши какво трябва да се свърши." };
  const sb = createServiceClient();
  const priority: TaskPriority = isPriority(input.priority) ? input.priority : "normal";
  let sort = 0;
  if (input.project_id) {
    const { data: last } = await sb
      .from("project_tasks")
      .select("sort_order")
      .eq("project_id", input.project_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sort = (last?.sort_order ?? 0) + 1;
  }
  const { data, error } = await sb
    .from("project_tasks")
    .insert({
      project_id: input.project_id || null,
      contact_id: input.contact_id || null,
      title,
      description: input.description?.trim() || null,
      status: "todo",
      priority,
      kind: input.kind ?? "task",
      due_date: input.due_date || null,
      sort_order: sort,
      assignee_id: input.assignee_id || null,
      client_visible: input.client_visible ?? false,
      created_by: input.created_by,
    })
    .select("id")
    .single();
  if (error || !data) return { id: null, error: error?.message ?? "insert failed" };
  return { id: data.id as string, error: null };
}

export async function setTaskStatus(args: {
  id: string;
  status: "todo" | "doing" | "done";
  actor: string;
  actorMemberId?: string | null;
}): Promise<{ error: string | null; task: TaskRow | null }> {
  const sb = createServiceClient();
  const { data: t } = await sb.from("project_tasks").select(COLS).eq("id", args.id).maybeSingle();
  if (!t) return { error: "Задачата не е намерена", task: null };
  const patch: Record<string, unknown> = {
    status: args.status,
    done_at: args.status === "done" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  if (args.status === "done" && !t.assignee_id && args.actorMemberId) patch.assignee_id = args.actorMemberId;
  const { error } = await sb.from("project_tasks").update(patch).eq("id", args.id);
  if (error) return { error: error.message, task: null };

  // Следата в картона на клиента — с името на човека.
  let contactId: string | null = (t.contact_id as string | null) ?? null;
  let projectTitle: string | null = null;
  if (!contactId && t.project_id) {
    const { data: p } = await sb.from("projects").select("contact_id, title").eq("id", t.project_id).maybeSingle();
    contactId = (p?.contact_id as string | null) ?? null;
    projectTitle = (p?.title as string | null) ?? null;
  }
  if (contactId && args.status === "done") {
    await sb
      .from("contact_activities")
      .insert({
        contact_id: contactId,
        activity_type: "task_done",
        title: `✅ Готова задача: ${t.title}`,
        body: projectTitle ? `Проект: ${projectTitle}` : null,
        occurred_at: new Date().toISOString(),
        metadata: { task_id: t.id, project_id: t.project_id, team: true, client_visible: t.client_visible === true },
        created_by: args.actor,
      })
      .then(() => null, () => null);
  }
  return { error: null, task: { ...(t as TaskRow), status: args.status } };
}

export async function updateTask(
  id: string,
  patch: Partial<{
    assignee_id: string | null;
    due_date: string | null;
    priority: string;
    client_visible: boolean;
    title: string;
    description: string | null;
  }>
): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const clean: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("assignee_id" in patch) clean.assignee_id = patch.assignee_id || null;
  if ("due_date" in patch) clean.due_date = patch.due_date || null;
  if (patch.priority && isPriority(patch.priority)) clean.priority = patch.priority;
  if (typeof patch.client_visible === "boolean") clean.client_visible = patch.client_visible;
  if (patch.title?.trim()) clean.title = patch.title.trim();
  if ("description" in patch) clean.description = patch.description?.trim() || null;
  const { error } = await sb.from("project_tasks").update(clean).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteTask(id: string): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb.from("project_tasks").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/** Броят отворени задачи на човек — за шапката и сутрешното писмо. */
export async function openTaskCounts(): Promise<Map<string, { open: number; overdue: number }>> {
  const sb = createServiceClient();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Sofia" });
  const { data } = await sb.from("project_tasks").select("assignee_id, project_id, due_date").neq("status", "done").limit(2000);
  const { data: projects } = await sb.from("projects").select("id, owner_id");
  const owner = new Map(((projects ?? []) as Array<{ id: string; owner_id: string | null }>).map((p) => [p.id, p.owner_id]));
  const out = new Map<string, { open: number; overdue: number }>();
  for (const t of (data ?? []) as Array<{ assignee_id: string | null; project_id: string | null; due_date: string | null }>) {
    const who = t.assignee_id ?? (t.project_id ? owner.get(t.project_id) ?? null : null) ?? "owner";
    const row = out.get(who) ?? { open: 0, overdue: 0 };
    row.open += 1;
    if (t.due_date && t.due_date < today) row.overdue += 1;
    out.set(who, row);
  }
  return out;
}
