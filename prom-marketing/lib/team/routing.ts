import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { listActiveMembers } from "./repository";
import { leadOwner, nextInRotation, rotationPool } from "./routing-rules";
import type { TeamMember } from "./types";

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
export async function routeNewLead(contactId: string): Promise<TeamMember | null> {
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
    return upErr ? null : next;
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
