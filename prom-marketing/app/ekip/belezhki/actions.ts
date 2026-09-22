"use server";
import { revalidatePath } from "next/cache";
import { requireTeamActor, type TeamActor } from "@/lib/team/session";
import { participantKey } from "@/lib/team/roles";
import { createNote } from "@/lib/team/system-notes";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Нова бележка за системата от човек от екипа (или от Ивайло през /ekip).
 * Авторът е сесията, не формата — никой не пише от чуждо име.
 */

function s(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

async function actorOrNull(): Promise<TeamActor | null> {
  try {
    return await requireTeamActor();
  } catch {
    return null;
  }
}

export async function createNoteAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  const actor = await actorOrNull();
  if (!actor) return { ok: false, error: "Сесията е изтекла — влез отново." };
  const text = s(formData, "text");
  if (!text) return { ok: false, error: "Напиши какво ти пречи или какво би било по-лесно." };
  const res = await createNote({
    authorKey: participantKey(actor.member),
    authorName: actor.name,
    area: s(formData, "area") || "crm",
    text,
    page: s(formData, "page") || null,
  });
  if (res.error) return { ok: false, error: res.error };
  revalidatePath("/ekip/belezhki");
  revalidatePath("/admin/belezhki");
  return { ok: true, message: actor.kind === "owner" ? "Записана." : "Записана — Ивайло ще я види." };
}
