"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { giveToTeam } from "@/lib/team/assign";
import { createServiceClient } from "@/lib/supabase/service";
import { KINO } from "@/lib/kino/config";
import { SCREENING } from "@/lib/kino/server";

export interface GiveResult {
  ok: boolean;
  message: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * „Дай на Димитър“ — списъкът от таблото влиза в опашката му за звънене
 * (/ekip), с причината и какво да каже. Ивайло натиска — нищо не тръгва само.
 * Вече дадените от същия списък се пропускат.
 */
export async function giveKinoListAction(_prev: GiveResult | null, formData: FormData): Promise<GiveResult> {
  const actor = await requireAdmin();
  const list = String(formData.get("list") ?? "");
  if (list !== "dayBefore" && list !== "warm") return { ok: false, message: "Непознат списък." };
  const ids = formData
    .getAll("contact_id")
    .map(String)
    .filter((id) => UUID.test(id));
  if (ids.length === 0) return { ok: false, message: "Няма кого да дам." };

  const sb = createServiceClient();
  const { data: already } = await sb
    .from("contact_activities")
    .select("contact_id, metadata")
    .eq("activity_type", "team_assigned")
    .in("contact_id", ids);
  const skip = new Set(
    (already ?? [])
      .filter((a) => {
        const m = (a.metadata ?? {}) as Record<string, unknown>;
        return m.kino_list === list && m.kino_screening === SCREENING;
      })
      .map((a) => a.contact_id as string),
  );

  const reason =
    list === "dayBefore"
      ? `🎬 „${KINO.title}“ · ден −1: собственик с билет за премиерата. Обади се: „Запазили сме ти място — какво искаш да научиш?“`
      : `🎬 „${KINO.title}“: изгледа поне половината филм и още не е купил. Обади се до 1–2 часа след филма и запиши разговор с Ивайло — два конкретни часа, до 72 часа.`;

  let given = 0;
  let who: string | null = null;
  const errors: string[] = [];
  for (const id of ids) {
    if (skip.has(id)) continue;
    const r = await giveToTeam({
      contactId: id,
      reason,
      kind: "given",
      createdBy: `${actor} · кино`,
      extra: { kino_list: list, kino_screening: SCREENING },
    });
    if (r.ok) {
      given++;
      who = r.memberName;
    } else if (r.error) errors.push(r.error);
  }
  revalidatePath("/admin/kino");
  revalidatePath("/ekip");
  if (given === 0 && errors.length) return { ok: false, message: `Не стана: ${errors[0]}` };
  return {
    ok: true,
    message: given
      ? `Дадени: ${given}${who ? ` · при ${who}` : ""}. Излизат в опашката му в /ekip.${skip.size ? ` (${skip.size} вече бяха дадени)` : ""}`
      : "Всички от списъка вече са дадени.",
  };
}
