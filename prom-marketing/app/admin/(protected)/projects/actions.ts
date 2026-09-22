"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { upsertProject, setProjectStatus, setProjectTaskStatus, addProjectTask, setProjectOwner } from "@/lib/crm/repository";
import { applyServiceTemplate } from "@/lib/team/projects";
import { isServiceType } from "@/lib/team/service-types";
import {
  PROJECT_STATUSES,
  PROJECT_TASK_STATUSES,
  type ProjectStatus,
  type ProjectTaskStatus,
} from "@/lib/crm/types";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = String(v ?? "").trim();
  return s.length > 0 ? s : undefined;
}
function num(v: FormDataEntryValue | null): number | undefined {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function revalidateDelivery() {
  revalidatePath("/admin/projects");
  revalidatePath("/admin/offers");
  revalidatePath("/admin");
  revalidatePath("/ekip/proekti");
  revalidatePath("/ekip/zadachi");
  revalidatePath("/admin/zadachi");
}

/**
 * Ръчно създаване на проект. С избран вид услуга чеклистът идва от шаблона
 * (lib/team/service-types.ts) и отговорникът е човекът с ролята за този вид;
 * ако има ръчно написани задачи, те печелят.
 */
export async function createProjectAction(formData: FormData) {
  const by = await requireAdmin();
  const title = str(formData.get("title"));
  if (!title) throw new Error("Заглавието е задължително");
  const tasksRaw = String(formData.get("tasks") ?? "");
  const tasks = tasksRaw
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ title: t }));
  const res = await upsertProject({
    title,
    client_email: str(formData.get("client_email")),
    description: str(formData.get("description")),
    amount_gross: num(formData.get("amount_gross")),
    currency: str(formData.get("currency")) ?? "EUR",
    started_at: str(formData.get("started_at")),
    due_date: str(formData.get("due_date")),
    notes: str(formData.get("notes")),
    tasks: tasks.length ? tasks : undefined,
  });
  if (res.error) throw new Error(res.error);
  const serviceType = str(formData.get("service_type"));
  if (res.id && serviceType && isServiceType(serviceType)) {
    await applyServiceTemplate({
      projectId: res.id,
      serviceType,
      startedAt: str(formData.get("started_at")) ?? null,
      createdBy: by,
      skipTasks: tasks.length > 0,
    });
  }
  const ownerId = str(formData.get("owner_id"));
  if (res.id && ownerId) await setProjectOwner({ id: res.id, owner_id: ownerId });
  revalidateDelivery();
}

export async function setProjectStatusAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("project_id"));
  const status = str(formData.get("status"));
  if (!id || !status || !PROJECT_STATUSES.includes(status as ProjectStatus)) throw new Error("Invalid input");
  const res = await setProjectStatus({ id, status: status as ProjectStatus });
  if (res.error) throw new Error(res.error);
  revalidateDelivery();
}

export async function setTaskStatusAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("task_id"));
  const status = str(formData.get("status"));
  if (!id || !status || !PROJECT_TASK_STATUSES.includes(status as ProjectTaskStatus)) throw new Error("Invalid input");
  const res = await setProjectTaskStatus({ id, status: status as ProjectTaskStatus });
  if (res.error) throw new Error(res.error);
  revalidateDelivery();
}

export async function addTaskAction(formData: FormData) {
  await requireAdmin();
  const projectId = str(formData.get("project_id"));
  const title = str(formData.get("title"));
  if (!projectId || !title) throw new Error("Invalid input");
  const res = await addProjectTask({ project_id: projectId, title, due_date: str(formData.get("due_date")) });
  if (res.error) throw new Error(res.error);
  revalidateDelivery();
}

/** Отговорник по проекта — празно значи „при Ивайло“. */
export async function setProjectOwnerAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("project_id"));
  if (!id) throw new Error("Invalid input");
  const res = await setProjectOwner({ id, owner_id: str(formData.get("owner_id")) ?? null });
  if (res.error) throw new Error(res.error);
  revalidateDelivery();
}

/** Вид услуга на съществуващ проект; с „+ чеклист“ добавя и стъпките от шаблона. */
export async function setProjectServiceAction(formData: FormData) {
  const by = await requireAdmin();
  const id = str(formData.get("project_id"));
  const serviceType = str(formData.get("service_type"));
  if (!id) throw new Error("Invalid input");
  const sb = createServiceClient();
  if (!serviceType) {
    await sb.from("projects").update({ service_type: null }).eq("id", id);
  } else if (isServiceType(serviceType)) {
    const withTasks = String(formData.get("with_tasks") ?? "") === "1";
    await applyServiceTemplate({ projectId: id, serviceType, startedAt: str(formData.get("started_at")) ?? null, createdBy: by, skipTasks: !withTasks });
  }
  revalidateDelivery();
}

/** Изречението към клиента в портала. */
export async function setPortalSummaryAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("project_id"));
  if (!id) throw new Error("Invalid input");
  const sb = createServiceClient();
  await sb.from("projects").update({ portal_summary: str(formData.get("portal_summary")) ?? null }).eq("id", id);
  revalidateDelivery();
}
