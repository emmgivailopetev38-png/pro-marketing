"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createNote, getNote, isNoteStatus, setNoteStatus, type NoteStatus } from "@/lib/team/system-notes";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Бележките от екипа — действията на Ивайло: видяна / направено / отхвърлена,
 * отговор и собствена бележка. Само зад паролата на /admin.
 */

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

function revalidate() {
  revalidatePath("/admin/belezhki");
  revalidatePath("/ekip/belezhki");
}

async function adminOrNull(): Promise<string | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

const STATUS_DONE_MSG: Record<NoteStatus, string> = {
  new: "Върната при новите.",
  seen: "Отбелязана като видяна — човекът ще научи.",
  done: "Готово — човекът ще научи.",
  dismissed: "Отхвърлена — човекът ще научи.",
};

/** „Видяна“ / „Направено“ / „Отхвърлена“ / „Върни при новите“. */
export async function setNoteStatusAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  if (!(await adminOrNull())) return { ok: false, error: "Сесията е изтекла — влез отново." };
  const id = s(formData, "id");
  const status = s(formData, "status");
  if (!id) return { ok: false, error: "Липсва бележка." };
  if (!isNoteStatus(status)) return { ok: false, error: "Непознат статус." };
  const res = await setNoteStatus(id, status);
  if (res.error) return { ok: false, error: res.error };
  revalidate();
  return { ok: true, message: res.note?.author_key === "owner" ? "Записано." : STATUS_DONE_MSG[status] };
}

/** Отговор на бележка. Нова бележка с отговор става „видяна“; иначе статусът остава. */
export async function replyNoteAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  if (!(await adminOrNull())) return { ok: false, error: "Сесията е изтекла — влез отново." };
  const id = s(formData, "id");
  const reply = s(formData, "reply");
  if (!id) return { ok: false, error: "Липсва бележка." };
  const note = await getNote(id);
  if (!note) return { ok: false, error: "Бележката не е намерена." };
  if (!reply && !note.owner_reply) return { ok: false, error: "Напиши отговор." };
  const status: NoteStatus = note.status === "new" ? "seen" : note.status;
  const res = await setNoteStatus(id, status, reply);
  if (res.error) return { ok: false, error: res.error };
  revalidate();
  if (!reply) return { ok: true, message: "Отговорът е изтрит." };
  return { ok: true, message: note.author_key === "owner" ? "Отговорът е записан." : "Отговорът е записан и пратен на човека." };
}

/** Собствена бележка на Ивайло — в същия списък, без Telegram към самия него. */
export async function ownerCreateNoteAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  const by = await adminOrNull();
  if (!by) return { ok: false, error: "Сесията е изтекла — влез отново." };
  const text = s(formData, "text");
  if (!text) return { ok: false, error: "Напиши бележката." };
  const res = await createNote({
    authorKey: "owner",
    authorName: by,
    area: s(formData, "area") || "crm",
    text,
    page: s(formData, "page") || null,
  });
  if (res.error) return { ok: false, error: res.error };
  revalidate();
  return { ok: true, message: "Записана." };
}
