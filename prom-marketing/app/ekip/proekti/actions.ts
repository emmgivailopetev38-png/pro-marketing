"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getTeamActor } from "@/lib/team/session";
import { PROJECT_ACTIVITY } from "@/lib/team/projects";
import { PROJECT_TASK_STATUSES, type ProjectTaskStatus } from "@/lib/crm/types";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Действията от таблото за проекти — само отбелязване на свършена работа.
 *
 * Самите проекти НЕ се местят оттук: нито се поемат, нито им се сменя
 * състоянието. Това стои при Ивайло, в /admin/projects. Тук човекът чеква
 * задачи, добавя нови и пише какво е свършил — и всяко от тези неща оставя
 * следа в картона на клиента с неговото име. Следата е смисълът на таблото.
 */

function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

function revalidate() {
  revalidatePath("/ekip/proekti");
  revalidatePath("/admin/projects");
}

/** Следата в картона. Проект без контакт не може да я остави — не е грешка. */
async function trace(
  sb: ReturnType<typeof createServiceClient>,
  projectId: string,
  by: string,
  title: string,
  body: string | null
) {
  const { data: project } = await sb.from("projects").select("contact_id, title").eq("id", projectId).maybeSingle();
  if (!project?.contact_id) return;
  await sb.from("contact_activities").insert({
    contact_id: project.contact_id,
    activity_type: PROJECT_ACTIVITY,
    title,
    body,
    occurred_at: new Date().toISOString(),
    metadata: { project_id: projectId, project_title: project.title, team: true },
    created_by: by,
  });
}

/** Задача: чака → работи се → готова, и обратно. */
export async function setTaskStatusAction(
  _prev: EkipActionResult | null,
  formData: FormData
): Promise<EkipActionResult> {
  const actor = await getTeamActor();
  if (!actor) return { ok: false, error: "Влез отново." };
  const taskId = str(formData.get("task_id"));
  const projectId = str(formData.get("project_id"));
  const status = str(formData.get("status")) as ProjectTaskStatus;
  if (!taskId || !PROJECT_TASK_STATUSES.includes(status)) return { ok: false, error: "Непознато състояние." };

  const sb = createServiceClient();
  const { data: task } = await sb.from("project_tasks").select("title").eq("id", taskId).maybeSingle();
  const patch: Record<string, unknown> = { status, done_at: status === "done" ? new Date().toISOString() : null };
  if (actor.member) patch.assignee_id = actor.member.id;
  const { error } = await sb.from("project_tasks").update(patch).eq("id", taskId);
  if (error) return { ok: false, error: `Не се записа: ${error.message}` };

  if (status === "done" && projectId) {
    await trace(sb, projectId, actor.name, `Готова задача: ${task?.title ?? "—"}`, null);
  }
  revalidate();
  return { ok: true, message: status === "done" ? "Готово." : "Записано." };
}

/** Нова задача по проекта — пише я този, който я е намерил. */
export async function addTaskAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  const actor = await getTeamActor();
  if (!actor) return { ok: false, error: "Влез отново." };
  const projectId = str(formData.get("project_id"));
  const title = str(formData.get("title"));
  if (!projectId || !title) return { ok: false, error: "Напиши какво трябва да се свърши." };

  const sb = createServiceClient();
  const { data: last } = await sb
    .from("project_tasks")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await sb.from("project_tasks").insert({
    project_id: projectId,
    title,
    status: "todo",
    due_date: str(formData.get("due_date")) || null,
    sort_order: (last?.sort_order ?? 0) + 1,
    assignee_id: actor.member?.id ?? null,
  });
  if (error) return { ok: false, error: `Не се записа: ${error.message}` };
  revalidate();
  return { ok: true, message: "Добавена." };
}

/** Бележка по проекта — влиза в картона на клиента с неговото име. */
export async function noteAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  const actor = await getTeamActor();
  if (!actor) return { ok: false, error: "Влез отново." };
  const projectId = str(formData.get("project_id"));
  const text = str(formData.get("note"));
  if (!projectId || !text) return { ok: false, error: "Празна бележка." };

  const sb = createServiceClient();
  await trace(sb, projectId, actor.name, "Бележка по проекта", text);
  revalidate();
  return { ok: true, message: "Записано в картона на клиента." };
}
