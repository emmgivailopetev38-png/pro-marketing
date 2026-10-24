import { createServiceClient } from "@/lib/supabase/service";
import { tgNotify } from "@/lib/notifications/telegram";
import { isoToSofiaLocal } from "@/lib/team/time";
import { demoKeyRange } from "@/lib/crm/demo-views";
import { UEBINAR, type UebinarMilestone } from "./config";

/**
 * Кой гледа филма-уебинар и докъде стига.
 *
 * Плейърът на `/uebinar` праща маяк при пускане и при всяка четвърт. В картона
 * това е ЕДНА активност на ден на човек („🎬 Гледа уебинара — 50 %“), която се
 * обновява, докато той гледа — не по пет реда за един филм. Telegram идва два
 * пъти: когато пусне филма и когато стигне три четвърти — там вече е сериозен.
 */

export function isMilestone(n: number): n is UebinarMilestone {
  return (UEBINAR.milestones as readonly number[]).includes(n);
}

export function uebinarTitle(pct: number): string {
  if (pct >= 100) return "🎬 Изгледа уебинара „ВЪЛНАТА“ докрай";
  if (pct <= 0) return "🎬 Пусна уебинара „ВЪЛНАТА“";
  return `🎬 Гледа уебинара „ВЪЛНАТА“ — ${pct} %`;
}

/** Кога да звъннем в Telegram: при пускането и при прехода към ≥ 75 %. */
export function shouldNotify(prevMax: number | null, next: number): boolean {
  if (prevMax === null) return true;
  return prevMax < 75 && next >= 75;
}

/** Контактът, чието id започва с тези 8 знака — или null (няма или са двама). */
export async function contactByKey(
  k: string
): Promise<{ id: string; full_name: string | null; company: string | null; email: string | null } | null> {
  const range = demoKeyRange(k);
  if (!range) return null;
  const sb = createServiceClient();
  const { data } = await sb
    .from("contacts")
    .select("id, full_name, company, email")
    .gte("id", range.lo)
    .lte("id", range.hi)
    .limit(2);
  const rows = (data ?? []) as Array<{ id: string; full_name: string | null; company: string | null; email: string | null }>;
  return rows.length === 1 ? rows[0] : null;
}

export async function recordUebinarView(
  k: string,
  pct: number,
  now: Date = new Date()
): Promise<{ logged: boolean; reason?: string }> {
  if (!isMilestone(pct)) return { logged: false, reason: "bad_input" };
  const contact = await contactByKey(k);
  if (!contact) return { logged: false, reason: "unknown_key" };
  const sb = createServiceClient();

  const day = isoToSofiaLocal(now).slice(0, 10);
  const { data: today } = await sb
    .from("contact_activities")
    .select("id, metadata")
    .eq("contact_id", contact.id)
    .eq("activity_type", "webinar_view")
    .contains("metadata", { day })
    .maybeSingle();

  const name = contact.full_name || contact.company || "Лийд";
  if (today) {
    const meta = (today.metadata ?? {}) as Record<string, unknown>;
    const prev = typeof meta.max_pct === "number" ? meta.max_pct : 0;
    if (pct <= prev) return { logged: false, reason: "already" };
    await sb
      .from("contact_activities")
      .update({
        title: uebinarTitle(pct),
        body: `Стигна до ${pct} % от филма (${UEBINAR.minutes} мин).`,
        metadata: { ...meta, max_pct: pct, last_at: now.toISOString() },
      })
      .eq("id", today.id);
    if (shouldNotify(prev, pct)) await tgNotify.uebinarProgress(name, pct, contact.id);
    return { logged: true };
  }

  await sb.from("contact_activities").insert({
    contact_id: contact.id,
    activity_type: "webinar_view",
    title: uebinarTitle(pct),
    body: `Стигна до ${pct} % от филма (${UEBINAR.minutes} мин).`,
    occurred_at: now.toISOString(),
    metadata: { day, max_pct: pct, k: k.toLowerCase(), last_at: now.toISOString() },
    created_by: "uebinar_tracker",
  });
  if (shouldNotify(null, pct)) await tgNotify.uebinarProgress(name, pct, contact.id);
  return { logged: true };
}
