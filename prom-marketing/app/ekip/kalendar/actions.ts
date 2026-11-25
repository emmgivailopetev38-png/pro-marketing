"use server";
import { revalidatePath } from "next/cache";
import { getTeamActor, requireTeamActor } from "@/lib/team/session";
import { cleanMeetUrl, getMemberById, updateMember } from "@/lib/team/repository";
import { freeSlotsByCloser, type CloserSlots } from "@/lib/team/kalendar";
import { readGrafik } from "@/lib/team/grafik-rules";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * „Моят постоянен Meet линк“ — клоузърът си го слага сам. С него тръгват
 * поканите към клиента, съобщенията за срещата и копието за Fathom.
 */
export async function saveMeetUrlAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  let actor;
  try {
    actor = await requireTeamActor();
  } catch {
    return { ok: false, error: "Сесията е изтекла — влез отново." };
  }
  if (actor.kind !== "member") return { ok: false, error: "Линкът се слага от профила на клоузъра." };
  const raw = String(formData.get("meet_url") ?? "").trim();
  const url = cleanMeetUrl(raw);
  if (!url || !/^https:\/\/(meet\.google\.com|[\w.-]*zoom\.us|teams\.microsoft\.com|teams\.live\.com)\//.test(url)) {
    return { ok: false, error: "Постави целия линк — започва с https://meet.google.com/ (или Zoom / Teams)." };
  }
  const r = await updateMember(actor.member.id, { meet_url: url });
  if (r.error) return { ok: false, error: `Не се записа: ${r.error}` };
  revalidatePath("/ekip/kalendar");
  revalidatePath("/ekip/ekipat");
  return { ok: true, message: "Линкът е записан — оттук нататък всяка твоя среща е с него." };
}

/**
 * „🗓 Моят график“ — записва се при всяко цъкване (25.11.2026, Теодор). Клоузърът
 * пипа своя; Ивайло — на всеки клоузър. `grafik: null` = без график (както досега).
 */
export async function saveGrafikAction(input: { memberId?: string | null; grafik: unknown }): Promise<EkipActionResult> {
  let actor;
  try {
    actor = await requireTeamActor();
  } catch {
    return { ok: false, error: "Сесията е изтекла — влез отново." };
  }
  let targetId: string | null = null;
  if (actor.kind === "member" && actor.member.role === "sales") targetId = actor.member.id;
  else if (actor.kind === "owner") targetId = input.memberId ?? null;
  if (!targetId) return { ok: false, error: "Графикът се нагласява от профила на клоузъра." };
  const target = await getMemberById(targetId).catch(() => null);
  if (!target || !target.active || target.role !== "sales") return { ok: false, error: "Няма такъв клоузър." };
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Sofia" });
  const grafik = input.grafik === null ? null : readGrafik(input.grafik, today) ?? { week: {}, days: {} };
  const r = await updateMember(targetId, { availability: grafik });
  if (r.error) return { ok: false, error: `Не се записа: ${r.error}` };
  revalidatePath("/ekip/kalendar");
  return { ok: true, message: grafik ? "Графикът е записан." : "Графикът е махнат — могат да те записват по всяко време от 10:00." };
}

/** Свободните часове на клоузърите — под „Записах среща“ (клоузърът вижда само своите). */
export async function freeSlotsAction(): Promise<{ ok: boolean; closers: CloserSlots[] }> {
  const actor = await getTeamActor().catch(() => null);
  if (!actor) return { ok: false, closers: [] };
  const only = actor.kind === "member" && actor.member.role === "sales" ? actor.member.id : null;
  const closers = await freeSlotsByCloser(new Date(), only).catch(() => [] as CloserSlots[]);
  return { ok: true, closers };
}
