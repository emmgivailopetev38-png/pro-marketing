import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { ProjectStatus, ProjectTaskStatus } from "@/lib/crm/types";

/**
 * Таблото на човека по проектите — огледалото на опашката за звънене, но за
 * доставката. Разликата е в единицата работа: сетърът работи с картон и
 * разговор, човекът по проектите — с проект и задача.
 *
 * Отговорникът живее в `projects.owner_id` (NULL = при Ивайло). Всяко
 * действие оттук оставя активност в картона на клиента с неговото име в
 * `created_by` и `metadata.project_id` — оттам идва проследимостта.
 */

/** Състоянията, които са „живи“ и стоят на екрана му. */
export const LIVE_PROJECT_STATUSES = ["planned", "in_progress", "waiting_client"] as const;

/** Активността, с която се отбелязва работа по проект. */
export const PROJECT_ACTIVITY = "project_update";

export interface BoardTask {
  id: string;
  title: string;
  status: ProjectTaskStatus;
  due_date: string | null;
  sort_order: number;
}

export interface BoardProject {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  amount_gross: number | null;
  currency: string;
  due_date: string | null;
  notes: string | null;
  owner_id: string | null;
  owner_name: string | null;
  contact_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  tasks: BoardTask[];
  done_tasks: number;
  /** Последното човешко докосване по този проект — кой и кога. */
  last_touch: { title: string; at: string; by: string | null } | null;
}

export interface DeliveryBoard {
  /** Моите живи проекти — най-напред тези със срок. */
  mine: BoardProject[];
  /** Живи проекти без отговорник — може да ги вземе с едно натискане. */
  free: BoardProject[];
  /** Живи проекти на друг от екипа — само за поглед, за да се вижда картината. */
  others: BoardProject[];
  /** Моите завършени за последните 30 дни — за да се вижда какво е свършено. */
  recentlyDone: BoardProject[];
}

interface ProjectRecord {
  id: string;
  contact_id: string | null;
  title: string;
  description: string | null;
  status: ProjectStatus;
  amount_gross: number | null;
  currency: string | null;
  due_date: string | null;
  done_at: string | null;
  notes: string | null;
  owner_id: string | null;
  updated_at: string;
}

/** Срок напред подрежда: без срок отива най-отзад. */
export function byDueDate(a: BoardProject, b: BoardProject): number {
  if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
  if (a.due_date) return -1;
  if (b.due_date) return 1;
  return a.title.localeCompare(b.title, "bg");
}

/**
 * В коя купчина отива проектът. Чиста функция, защото точно тук се бъркат
 * нещата: „свободен“ значи жив И без отговорник, а не „не е мой“.
 * `null` = не се показва (чужд завършен, отказан, стар).
 */
export function bucketFor(
  project: { status: string; owner_id: string | null; done_at: string | null; updated_at: string },
  memberId: string | null,
  doneSince: string
): keyof DeliveryBoard | null {
  const live = (LIVE_PROJECT_STATUSES as readonly string[]).includes(project.status);
  const isMine = memberId != null && project.owner_id === memberId;
  if (live && isMine) return "mine";
  if (live && !project.owner_id) return "free";
  if (live) return "others";
  if (isMine && project.status === "done" && (project.done_at ?? project.updated_at) >= doneSince) {
    return "recentlyDone";
  }
  return null;
}

export async function loadDeliveryBoard(memberId: string | null): Promise<DeliveryBoard> {
  const sb = createServiceClient();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [{ data: projectsData }, { data: tasksData }, { data: membersData }, { data: activityData }] =
    await Promise.all([
      sb
        .from("projects")
        .select(
          "id, contact_id, title, description, status, amount_gross, currency, due_date, done_at, notes, owner_id, updated_at"
        )
        .order("updated_at", { ascending: false }),
      sb.from("project_tasks").select("id, project_id, title, status, due_date, sort_order").order("sort_order"),
      sb.from("team_members").select("id, full_name"),
      sb
        .from("contact_activities")
        .select("title, occurred_at, created_by, metadata")
        .eq("activity_type", PROJECT_ACTIVITY)
        .gte("occurred_at", since)
        .order("occurred_at", { ascending: false })
        .limit(400),
    ]);

  const projects = (projectsData ?? []) as ProjectRecord[];

  // Клиентите се теглят само за проектите, които наистина стоят на екрана.
  const contactIds = [...new Set(projects.map((p) => p.contact_id).filter((v): v is string => Boolean(v)))];
  const { data: contactsData } = contactIds.length
    ? await sb.from("contacts").select("id, full_name, company, phone").in("id", contactIds)
    : { data: [] };

  const contactById = new Map(
    ((contactsData ?? []) as { id: string; full_name: string | null; company: string | null; phone: string | null }[]).map(
      (c) => [c.id, c]
    )
  );
  const memberName = new Map(
    ((membersData ?? []) as { id: string; full_name: string }[]).map((m) => [m.id, m.full_name])
  );

  const tasksByProject = new Map<string, BoardTask[]>();
  for (const t of (tasksData ?? []) as (BoardTask & { project_id: string })[]) {
    const list = tasksByProject.get(t.project_id) ?? [];
    list.push({ id: t.id, title: t.title, status: t.status, due_date: t.due_date, sort_order: t.sort_order });
    tasksByProject.set(t.project_id, list);
  }

  // Първата активност за даден проект е и най-скорошната — списъкът е низходящ.
  const touchByProject = new Map<string, { title: string; at: string; by: string | null }>();
  for (const a of (activityData ?? []) as {
    title: string;
    occurred_at: string;
    created_by: string | null;
    metadata: Record<string, unknown> | null;
  }[]) {
    const pid = typeof a.metadata?.project_id === "string" ? (a.metadata.project_id as string) : null;
    if (!pid || touchByProject.has(pid)) continue;
    touchByProject.set(pid, { title: a.title, at: a.occurred_at, by: a.created_by });
  }

  const board: DeliveryBoard = { mine: [], free: [], others: [], recentlyDone: [] };

  for (const p of projects) {
    const tasks = tasksByProject.get(p.id) ?? [];
    const client = p.contact_id ? contactById.get(p.contact_id) : undefined;
    const row: BoardProject = {
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      amount_gross: p.amount_gross,
      currency: p.currency ?? "EUR",
      due_date: p.due_date,
      notes: p.notes,
      owner_id: p.owner_id,
      owner_name: p.owner_id ? memberName.get(p.owner_id) ?? null : null,
      contact_id: p.contact_id,
      client_name: client ? client.full_name ?? client.company : null,
      client_phone: client?.phone ?? null,
      tasks,
      done_tasks: tasks.filter((t) => t.status === "done").length,
      last_touch: touchByProject.get(p.id) ?? null,
    };

    const bucket = bucketFor(p, memberId, since);
    if (bucket) board[bucket].push(row);
  }

  board.mine.sort(byDueDate);
  board.free.sort(byDueDate);
  board.others.sort(byDueDate);
  return board;
}

/** Числата за шапката — същият поглед, но само бройки. */
export function boardCounts(board: DeliveryBoard) {
  const openTasks = board.mine.reduce((s, p) => s + p.tasks.filter((t) => t.status !== "done").length, 0);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = board.mine.filter((p) => p.due_date != null && p.due_date < today).length;
  return { mine: board.mine.length, free: board.free.length, openTasks, overdue, done: board.recentlyDone.length };
}

// ── Вид услуга → чеклист ────────────────────────────────────────────────────

import { firstActiveByRole } from "./repository";
import { SERVICE_DEFAULT_ROLE, isServiceType, tasksForService } from "./service-types";

/**
 * Прилага чеклиста за вида услуга върху нов проект: задачите със срокове от
 * старта, видимите за клиента стъпки, и отговорник по подразбиране (първият
 * активен човек с ролята за този вид), ако още няма.
 */
export async function applyServiceTemplate(args: {
  projectId: string;
  serviceType: string;
  startedAt?: string | null;
  createdBy: string;
  /** ако вече има ръчно написани задачи — не се добавят от шаблона */
  skipTasks?: boolean;
}): Promise<{ tasks: number; ownerId: string | null }> {
  if (!isServiceType(args.serviceType)) return { tasks: 0, ownerId: null };
  const sb = createServiceClient();
  const patch: Record<string, unknown> = { service_type: args.serviceType };
  let ownerId: string | null = null;
  const { data: p } = await sb.from("projects").select("owner_id").eq("id", args.projectId).maybeSingle();
  if (!p?.owner_id) {
    const role = SERVICE_DEFAULT_ROLE[args.serviceType];
    if (role !== "owner") {
      const m = await firstActiveByRole(role);
      if (m) {
        ownerId = m.id;
        patch.owner_id = m.id;
      }
    }
  } else {
    ownerId = p.owner_id as string;
  }
  await sb.from("projects").update(patch).eq("id", args.projectId);
  if (args.skipTasks) return { tasks: 0, ownerId };
  const tasks = tasksForService(args.serviceType, args.startedAt ?? new Date());
  const { error } = await sb.from("project_tasks").insert(
    tasks.map((t, i) => ({
      project_id: args.projectId,
      title: t.title,
      status: "todo",
      due_date: t.due_date,
      sort_order: i,
      client_visible: t.client_visible,
      assignee_id: ownerId,
      created_by: args.createdBy,
    }))
  );
  return { tasks: error ? 0 : tasks.length, ownerId };
}
