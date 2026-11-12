import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { listActiveMembers } from "./repository";
import { leadOwner, nextInRotation, rotationPool } from "./routing-rules";
import type { TeamMember } from "./types";
import { ASSIGN_TYPE } from "./queue-rules";
import { takenMark } from "./ivailo-rules";
import { SPLIT_FROM, ivailoShare, nextToIvailo } from "./split-rules";

/** Хората, между които се редуват новите лийдове (виж routing-rules.ts). */
export async function loadRotationPool(): Promise<TeamMember[]> {
  return rotationPool(await listActiveMembers().catch(() => [] as TeamMember[]));
}

/**
 * Дава новия лийд на следващия в кръга: Димитър, Елена, Димитър… Лийд, който
 * вече е при човек от кръга (върнал се е през формата), си остава при него.
 * Никога не хвърля — входът на лийда е по-важен от ротацията; при грешка
 * лийдът остава без човек и отива при първия в кръга.
 */
export async function routeNewLead(
  contactId: string,
  opts?: { /** false = без 50/50 с Ивайло (напр. евро програмата) */ split?: boolean }
): Promise<TeamMember | null> {
  try {
    const pool = await loadRotationPool();
    if (pool.length === 0) return null;
    const sb = createServiceClient();
    const { data: c, error } = await sb.from("contacts").select("id, routed_to").eq("id", contactId).maybeSingle();
    if (error || !c) return null;
    const current = (c as { routed_to: string | null }).routed_to;
    const already = current ? pool.find((m) => m.id === current) : undefined;
    if (already) return already;

    const { data: last } = await sb
      .from("contacts")
      .select("routed_to")
      .not("routed_to", "is", null)
      .order("routed_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    const next = nextInRotation(pool, (last as { routed_to: string | null } | null)?.routed_to ?? null);
    if (!next) return null;
    const { error: upErr } = await sb
      .from("contacts")
      .update({ routed_to: next.id, routed_at: new Date().toISOString() })
      .eq("id", contactId);
    if (upErr) return null;
    // 50/50 (split-rules.ts): всеки втори нов лийд е на Ивайло — тихо, екипът не го вижда.
    if (opts?.split !== false && (await splitToIvailo(contactId))) return null;
    return next;
  } catch {
    return null;
  }
}

/** Човекът от екипа, при когото е картонът — за „дай на екипа“ и за писмата. */
export async function leadOwnerOf(
  contactId: string | null | undefined,
  pool?: TeamMember[]
): Promise<{ pool: TeamMember[]; ownerId: string | null }> {
  const members = pool ?? (await loadRotationPool());
  if (!contactId) return { pool: members, ownerId: leadOwner(null, members) };
  const sb = createServiceClient();
  const { data } = await sb.from("contacts").select("routed_to").eq("id", contactId).maybeSingle();
  const routedTo = (data as { routed_to: string | null } | null)?.routed_to ?? null;
  return { pool: members, ownerId: leadOwner(routedTo, members) };
}

/**
 * Решава дали този нов лийд е на Ивайло и ако да — оставя тихата следа
 * (takenMark split) и го слага в неговия sales follow-up за обаждане. Редува се
 * по броя от SPLIT_FROM. Никога не хвърля: при грешка лийдът остава на екипа.
 */
async function splitToIvailo(contactId: string): Promise<boolean> {
  try {
    const share = ivailoShare();
    if (share <= 0) return false;
    const sb = createServiceClient();
    const [{ count: routed }, { count: mine }] = await Promise.all([
      sb.from("contacts").select("id", { count: "exact", head: true }).gte("routed_at", SPLIT_FROM),
      sb
        .from("contact_activities")
        .select("id", { count: "exact", head: true })
        .eq("activity_type", ASSIGN_TYPE)
        .eq("metadata->>split", "true")
        .gte("created_at", SPLIT_FROM),
    ]);
    if (!nextToIvailo(routed ?? 1, mine ?? 0, share)) return false;
    const reason = "Нов лийд от рекламата · 50/50 → води Ивайло (следобед, пон–чт)";
    const { error } = await sb.from("contact_activities").insert({
      contact_id: contactId,
      activity_type: ASSIGN_TYPE,
      title: "👤 Води: Ивайло",
      body: reason,
      metadata: takenMark(reason, { split: true }),
      created_by: "система",
    });
    if (error) return false;
    // В неговия /admin/follow-up — за обаждане днес (Ели звъни първа както на всички нови).
    await sb
      .from("contacts")
      .update({ followup_status: "needs_call", next_followup_at: new Date().toISOString() })
      .eq("id", contactId)
      .is("next_followup_at", null);
    return true;
  } catch {
    return false;
  }
}
