import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { ASSIGN_TYPE } from "./queue-rules";
import { FOLLOWUP_ACTIVITY_TYPES, isFirstMeeting } from "./closer-rules";
import { listMembers } from "./repository";
import { isManualGive, isSplitToIvailo } from "./ivailo-rules";
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
 * Чия е срещата, преди да е записана: клоузърът (първа среща) или Ивайло
 * (фолоуъп, оферта, картон с друг водещ). Нов човек без картон = първа среща.
 * Записването го пита, за да покани клоузъра в Cal.com още в момента —
 * календарната задача минава чак в 07:30/13:30/18:30.
 */
export async function closerForMeeting(contactId: string | null): Promise<TeamMember | null> {
  const closer = await activeCloser();
  if (!closer) return null;
  if (!contactId) return closer;
  const sb = createServiceClient();
  const { data: c } = await sb.from("contacts").select("owner_id, stage").eq("id", contactId).maybeSingle();
  if (!c) return closer;
  if (c.owner_id) return c.owner_id === closer.id ? closer : null;
  // 50/50 (split-rules.ts): лийдът е на Ивайло → срещата е при него, клоузърът не се кани.
  if (await isIvailoSplitLead(contactId)) return null;
  // Само първата среща е за клоузъра (Ивайло, 01.11.2026): фолоуъп → остава при Ивайло.
  // Има ли оферта или среща с Ивайло — човекът е негов (Ивайло, 03.11.2026), клоузърът не го получава.
  const [{ data: prior }, { count: offers }] = await Promise.all([
    sb
      .from("contact_activities")
      .select("activity_type, occurred_at")
      .eq("contact_id", contactId)
      .in("activity_type", ["meeting", ...FOLLOWUP_ACTIVITY_TYPES])
      .limit(50),
    sb.from("offers").select("id", { count: "exact", head: true }).eq("contact_id", contactId),
  ]);
  const first = isFirstMeeting({
    stage: (c as { stage?: string | null }).stage ?? null,
    activities: (prior ?? []) as { activity_type: string; occurred_at: string }[],
    hasOffer: (offers ?? 0) > 0,
  });
  return first ? closer : null;
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
  const closer = await closerForMeeting(args.contactId);
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

/**
 * Лийд на Ивайло по 50/50 (тихата следа от routeNewLead), който Ивайло не е
 * дал после на екипа. Ели и записването питат това, за да сложат срещата в
 * НЕГОВИЯ календар. При грешка — false (както досега: срещата е на клоузъра).
 */
export async function isIvailoSplitLead(contactId: string | null | undefined): Promise<boolean> {
  if (!contactId) return false;
  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from("contact_activities")
      .select("metadata, occurred_at")
      .eq("contact_id", contactId)
      .eq("activity_type", ASSIGN_TYPE)
      .order("occurred_at", { ascending: false })
      .limit(50);
    const rows = (data ?? []) as { metadata: Record<string, unknown> | null; occurred_at: string }[];
    const split = rows.find((r) => isSplitToIvailo({ activity_type: ASSIGN_TYPE, metadata: r.metadata }));
    if (!split) return false;
    // „🤝 Дай на екипа“ от Ивайло след това — вече е на екипа.
    return !rows.some(
      (r) => r.occurred_at > split.occurred_at && isManualGive({ activity_type: ASSIGN_TYPE, metadata: r.metadata })
    );
  } catch {
    return false;
  }
}
