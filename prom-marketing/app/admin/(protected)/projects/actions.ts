"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { upsertProject, setProjectStatus, setProjectTaskStatus, addProjectTask } from "@/lib/crm/repository";
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
}

/** Ръчно създаване на проект (задачите — по една на ред). */
export async function createProjectAction(formData: FormData) {
  await requireAdmin();
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
