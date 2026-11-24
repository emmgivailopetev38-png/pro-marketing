"use server";
import { revalidatePath } from "next/cache";
import { requireTeamActor } from "@/lib/team/session";
import { cleanMeetUrl, updateMember } from "@/lib/team/repository";
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
