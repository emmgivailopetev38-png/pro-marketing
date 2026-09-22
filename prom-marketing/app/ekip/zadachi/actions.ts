"use server";
import { revalidatePath } from "next/cache";
import { requireTeamActor, type TeamActor } from "@/lib/team/session";
import { createTask, deleteTask, setTaskStatus, updateTask } from "@/lib/team/tasks";
import { notifyTaskAssigned } from "@/lib/team/notify";
import { getMemberById } from "@/lib/team/repository";
import { TASK_PRIORITY_LABEL, clampDueForMember, defaultDueDate, isPriority } from "@/lib/team/tasks-rules";
import { sendTelegram } from "@/lib/notifications/telegram";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw").replace(/\/$/, "");
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Задачите — едно действие за всичко. Човек от екипа създава задачи за себе
 * си (или за друг, ако е собственик), отмята ги, мести срока. Задача от
 * Ивайло за друг → писмо на човека.
 */

function s(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function revalidate() {
  revalidatePath("/ekip/zadachi");
  revalidatePath("/ekip/proekti");
  revalidatePath("/admin/zadachi");
  revalidatePath("/admin/projects");
}

async function actorOrNull(): Promise<TeamActor | null> {
  try {
    return await requireTeamActor();
  } catch {
    return null;
  }
}

export async function taskAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  const actor = await actorOrNull();
  if (!actor) return { ok: false, error: "Сесията е изтекла — влез отново." };
  const kind = s(formData, "action");
  const isOwner = actor.kind === "owner";

  switch (kind) {
    case "create": {
      const title = s(formData, "title");
      if (!title) return { ok: false, error: "Напиши какво трябва да се свърши." };
      // Човек от екипа дава задача само на себе си; собственикът — на когото избере.
      const requested = s(formData, "assignee_id");
      const assigneeId = isOwner ? requested || null : actor.member!.id;
      const priority = isPriority(s(formData, "priority")) ? s(formData, "priority") : "normal";
      // Срокът е задължителен: собственикът избира какъвто иска (без избор → 3 дни),
      // човекът от екипа — най-много 3 дни напред.
      const dueDate = isOwner ? s(formData, "due_date") || defaultDueDate() : clampDueForMember(s(formData, "due_date"));
      const res = await createTask({
        title,
        description: s(formData, "description") || null,
        due_date: dueDate,
        priority,
        assignee_id: assigneeId,
        project_id: s(formData, "project_id") || null,
        contact_id: s(formData, "contact_id") || null,
        client_visible: s(formData, "client_visible") === "1",
        created_by: actor.name,
      });
      if (res.error) return { ok: false, error: res.error };
      const assigneeKey = assigneeId ?? "owner";
      const isSelf = (isOwner && !assigneeId) || (!isOwner && assigneeId === actor.member!.id);
      if (isSelf && !isOwner) {
        // Човекът си сложи задача сам — Ивайло я вижда в /admin/zadachi и получава един ред.
        await sendTelegram(
          `📝 <b>${actor.name} си добави задача</b>\n${title}\n📅 до ${dueDate}`,
          { buttons: [{ text: "Задачите на екипа", url: `${SITE}/admin/zadachi` }] }
        ).catch(() => false);
      }
      if (!isSelf) {
        await notifyTaskAssigned({
          assigneeKey,
          byName: actor.name,
          title,
          dueDate,
          priority: TASK_PRIORITY_LABEL[priority as keyof typeof TASK_PRIORITY_LABEL] ?? priority,
          context: s(formData, "context") || null,
        }).catch(() => {});
      }
      revalidate();
      if (s(formData, "contact_id")) revalidatePath(`/admin/clients/${s(formData, "contact_id")}`);
      return { ok: true, message: isSelf ? "Добавена." : "Добавена и човекът е уведомен." };
    }
    case "done":
    case "doing":
    case "reopen": {
      const id = s(formData, "task_id");
      if (!id) return { ok: false, error: "Липсва задача." };
      const status = kind === "done" ? "done" : kind === "doing" ? "doing" : "todo";
      const res = await setTaskStatus({ id, status, actor: actor.name, actorMemberId: actor.member?.id ?? null });
      if (res.error) return { ok: false, error: res.error };
      revalidate();
      return { ok: true, message: status === "done" ? "Готово." : status === "doing" ? "Работиш по нея." : "Върната." };
    }
    case "update": {
      const id = s(formData, "task_id");
      if (!id) return { ok: false, error: "Липсва задача." };
      const patch: Parameters<typeof updateTask>[1] = {};
      if (formData.has("due_date")) patch.due_date = isOwner ? s(formData, "due_date") || defaultDueDate() : clampDueForMember(s(formData, "due_date"));
      if (formData.has("priority")) patch.priority = s(formData, "priority");
      if (formData.has("client_visible")) patch.client_visible = s(formData, "client_visible") === "1";
      if (isOwner && formData.has("assignee_id")) patch.assignee_id = s(formData, "assignee_id") || null;
      const res = await updateTask(id, patch);
      if (res.error) return { ok: false, error: res.error };
      if (isOwner && patch.assignee_id) {
        const m = await getMemberById(patch.assignee_id);
        if (m) {
          await notifyTaskAssigned({
            assigneeKey: m.id,
            byName: actor.name,
            title: s(formData, "title") || "Задача",
            dueDate: patch.due_date ?? null,
            priority: TASK_PRIORITY_LABEL[(patch.priority ?? "normal") as keyof typeof TASK_PRIORITY_LABEL] ?? "нормална",
            context: null,
          }).catch(() => {});
        }
      }
      revalidate();
      return { ok: true, message: "Записано." };
    }
    case "delete": {
      if (!isOwner) return { ok: false, error: "Изтриването е при Ивайло — отбележи я готова или му пиши." };
      const id = s(formData, "task_id");
      const res = await deleteTask(id);
      if (res.error) return { ok: false, error: res.error };
      revalidate();
      return { ok: true, message: "Изтрита." };
    }
    default:
      return { ok: false, error: "Непознато действие" };
  }
}
