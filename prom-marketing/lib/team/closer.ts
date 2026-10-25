import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { ASSIGN_TYPE } from "./queue-rules";
import { listMembers } from "./repository";
import type { TeamMember } from "./types";

/**
 * Клоузърът — човекът, който води срещите и затваря (от 23.10.2026 Джордж,
 * който е и сетър, и клоузър). Правилото е просто: активният човек с роля
 * `sales`. Има ли повече от един, никой не се избира автоматично — тогава
 * срещите се разпределят с „Кой го води“ от картона, както досега.
 */
export async function activeCloser(): Promise<TeamMember | null> {
  const members = await listMembers().catch(() => [] as TeamMember[]);
  const sales = members.filter((m) => m.active && m.role === "sales");
  return sales.length === 1 ? sales[0] : null;
}

/**
 * Записана среща → картонът отива при клоузъра (contacts.owner_id), за да
 * излезе в неговите „Продажби · моите хора“ с напомнянията и съобщенията за
 * срещата. Не пипа картон, който вече има водещ (Ивайло го е дал на някого
 * нарочно). Оставя същата следа `team_assigned` kind "sales", както бутонът
 * „Кой го води“ — за да се чете еднакво в дневника.
 */
export async function assignMeetingToCloser(args: {
  contactId: string;
  reason: string;
  /** кой записа срещата — ако е самият клоузър, картонът е негов и без избор */
  byMemberId?: string | null;
  createdBy?: string | null;
}): Promise<TeamMember | null> {
  const closer = await activeCloser();
  if (!closer) return null;
  const sb = createServiceClient();
  const { data: c } = await sb.from("contacts").select("owner_id").eq("id", args.contactId).maybeSingle();
  if (!c) return null;
  if (c.owner_id) return c.owner_id === closer.id ? closer : null;
  const { error } = await sb.from("contacts").update({ owner_id: closer.id }).eq("id", args.contactId);
  if (error) return null;
  await sb.from("contact_activities").insert({
    contact_id: args.contactId,
    activity_type: ASSIGN_TYPE,
    title: `🎯 Среща → ${closer.full_name} я води`,
    body: args.reason,
    metadata: { kind: "sales", to_member_id: closer.id, to_name: closer.full_name, reason: args.reason, auto: true, by_member_id: args.byMemberId ?? null },
    created_by: args.createdBy ?? "система",
  });
  return closer;
}
