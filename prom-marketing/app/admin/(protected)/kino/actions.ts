"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { giveToTeam } from "@/lib/team/assign";
import { createServiceClient } from "@/lib/supabase/service";
import { KINO } from "@/lib/kino/config";
import { SCREENING } from "@/lib/kino/server";
import { isKinoList } from "@/lib/kino/analytics";
import { parseLiveUrl } from "@/lib/kino/live-url";
import { setLiveState } from "@/lib/kino/live";

export interface GiveResult {
  ok: boolean;
  message: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * „Дай на Димитър“ — списъкът от таблото влиза в опашката му за звънене
 * (/ekip), с причината и какво да каже — и „Твоето число“, ако го има.
 * Ивайло натиска — нищо не тръгва само. Вече дадените от същия списък се пропускат.
 */
export async function giveKinoListAction(_prev: GiveResult | null, formData: FormData): Promise<GiveResult> {
  const actor = await requireAdmin();
  const list = String(formData.get("list") ?? "");
  if (!isKinoList(list)) return { ok: false, message: "Непознат списък." };
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
    list === "abandoned"
      ? `🛒 „${KINO.title}“: натисна „купи“ в залата и не плати. Обади се днес: „Видях, че искаше да влезеш — нещо спъна ли плащането?“ — помогни или запиши разговор с Ивайло.`
      : list === "dayBefore"
        ? `🎬 „${KINO.title}“ · ден −1: собственик с билет за премиерата. Обади се: „Запазили сме ти място — какво искаш да научиш?“`
        : `🎬 „${KINO.title}“: изгледа поне половината филм и още не е купил. Обади се до 1–2 часа след филма и запиши разговор с Ивайло — два конкретни часа, до 72 часа.`;

  // „Твоето число“ (сцена 9.7) — последният отговор на всеки; Димитър го вижда първо.
  const { data: nums } = await sb
    .from("contact_activities")
    .select("contact_id, metadata, occurred_at")
    .eq("activity_type", "kino_number")
    .in("contact_id", ids)
    .order("occurred_at", { ascending: true });
  const hoursBy = new Map<string, number>();
  for (const n of nums ?? []) {
    const m = (n.metadata ?? {}) as Record<string, unknown>;
    if (m.screening === SCREENING && typeof m.hours === "number") hoursBy.set(n.contact_id as string, m.hours);
  }

  let given = 0;
  let who: string | null = null;
  const errors: string[] = [];
  for (const id of ids) {
    if (skip.has(id)) continue;
    const hours = hoursBy.get(id);
    const r = await giveToTeam({
      contactId: id,
      reason: hours != null ? `🔢 ${hours} ч седмично в повтаряща се работа · ${reason}` : reason,
      kind: "given",
      createdBy: `${actor} · кино`,
      extra: { kino_list: list, kino_screening: SCREENING, ...(hours != null ? { kino_hours: hours } : {}) },
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

export interface LiveResult {
  ok: boolean;
  message: string;
}

/**
 * „Влизам на живо“ от Режисьорската кабина. on=1 с линк (https — Zoom,
 * Google Meet, YouTube Live) → залата показва бутона „НА ЖИВО“ до ~30 s;
 * on=0 → бутонът изчезва. Всяко натискане остава в kino_live_log.
 */
export async function setKinoLiveAction(_prev: LiveResult | null, formData: FormData): Promise<LiveResult> {
  const actor = await requireAdmin();
  const on = formData.get("on") === "1";
  const raw = String(formData.get("url") ?? "").trim();
  const target = parseLiveUrl(raw);
  if (on && !target) return { ok: false, message: "Сложи линк, който започва с https:// (Zoom, Google Meet или YouTube Live)." };
  const r = await setLiveState(on, target?.url ?? (raw || null), actor);
  if (!r.ok) return { ok: false, message: r.error ?? "Не стана." };
  return {
    ok: true,
    message: on ? `● На живо (${target!.label}) — залата вижда бутона до ~30 секунди.` : "■ Изключено — бутонът изчезва от залата.",
  };
}
