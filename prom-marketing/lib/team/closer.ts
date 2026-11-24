import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { ASSIGN_TYPE } from "./queue-rules";
import { CLOSER_ROTATION_FROM, FOLLOWUP_ACTIVITY_TYPES, closerForBooking, isFirstMeeting, sortClosers } from "./closer-rules";
import { listMembers } from "./repository";
import { isManualGive, isSplitToIvailo } from "./ivailo-rules";
import type { TeamMember } from "./types";

/**
 * Клоузърите — хората, които водят срещите и затварят: всеки активен с роля
 * `sales`, в реда на влизане. От 24.11.2026 са двама (Георги + клоузърът от RevStream).
 */
export async function listClosers(): Promise<TeamMember[]> {
  const members = await listMembers().catch(() => [] as TeamMember[]);
  return sortClosers(members.filter((m) => m.active && m.role === "sales"));
}

/**
 * Клоузърът по подразбиране: първият по реда на влизане. При него записват Ели и
 * Cal.com (събитието и Meet линкът в Cal.com са негови) — затова автоматичните
 * записвания не се редуват. Срещите, записани от човек, се редуват честно
 * (closerForBookingBy). Един клоузър = той, както досега.
 */
export async function activeCloser(): Promise<TeamMember | null> {
  return (await listClosers())[0] ?? null;
}

/** Постоянният Meet линк на този клоузър: неговият от профила; за клоузъра по подразбиране — и този от Vercel. */
export function meetUrlFor(closer: Pick<TeamMember, "id" | "meet_url"> | null | undefined, defaultCloserId?: string | null): string | null {
  const own = (closer?.meet_url ?? "").trim();
  if (/^https:\/\/\S+$/.test(own)) return own;
  if (closer && defaultCloserId && closer.id !== defaultCloserId) return null;
  const env = (process.env.CLOSER_MEET_URL ?? "").trim();
  return /^https:\/\/\S+$/.test(env) ? env : null;
}

/** Колко срещи е получил всеки клоузър от началото на редуването + кой е последният. */
async function closerCounts(): Promise<{ counts: Map<string, number>; lastId: string | null }> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("contact_activities")
    .select("metadata, occurred_at")
    .eq("activity_type", ASSIGN_TYPE)
    .eq("metadata->>kind", "sales")
    .eq("metadata->>auto", "true")
    .gte("occurred_at", CLOSER_ROTATION_FROM)
    .order("occurred_at", { ascending: false })
    .limit(500);
  const counts = new Map<string, number>();
  let lastId: string | null = null;
  for (const r of (data ?? []) as Array<{ metadata: Record<string, unknown> | null }>) {
    const id = typeof r.metadata?.to_member_id === "string" ? r.metadata.to_member_id : null;
    if (!id) continue;
    if (!lastId) lastId = id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return { counts, lastId };
}

/**
 * Кой води срещата, която човек от екипа записва от /ekip (правилата: closerForBooking).
 * Връща и списъка с клоузъри, за да не се чете два пъти.
 */
export async function closerForBookingBy(args: {
  contactId: string;
  actorMemberId?: string | null;
  wantedId?: string | null;
}): Promise<{ closer: TeamMember | null; closers: TeamMember[] }> {
  const closers = await listClosers();
  if (closers.length === 0) return { closer: null, closers };
  const sb = createServiceClient();
  const { data: c } = await sb.from("contacts").select("owner_id").eq("id", args.contactId).maybeSingle();
  const ownerId = (c as { owner_id: string | null } | null)?.owner_id ?? null;
  if (closers.length === 1) return { closer: closers[0], closers };
  const { counts, lastId } = await closerCounts().catch(() => ({ counts: new Map<string, number>(), lastId: null }));
  return {
    closer: closerForBooking({ closers, ownerId, actorId: args.actorMemberId, wantedId: args.wantedId, counts, lastId }),
    closers,
  };
}

/**
 * Картонът → при точно този клоузър (сетърът записа среща за него). Не пипа картон,
 * който вече има водещ. Следата е същата като на автоматичното даване.
 */
export async function assignContactToCloser(args: {
  contactId: string;
  closer: Pick<TeamMember, "id" | "full_name">;
  reason: string;
  byMemberId?: string | null;
  createdBy?: string | null;
}): Promise<boolean> {
  const sb = createServiceClient();
  const { data: c } = await sb.from("contacts").select("owner_id").eq("id", args.contactId).maybeSingle();
  if (!c) return false;
  if (c.owner_id) return c.owner_id === args.closer.id;
  const { error } = await sb.from("contacts").update({ owner_id: args.closer.id }).eq("id", args.contactId).is("owner_id", null);
  if (error) return false;
  await sb.from("contact_activities").insert({
    contact_id: args.contactId,
    activity_type: ASSIGN_TYPE,
    title: `🎯 Среща → ${args.closer.full_name} я води`,
    body: args.reason,
    metadata: { kind: "sales", to_member_id: args.closer.id, to_name: args.closer.full_name, reason: args.reason, auto: true, by_member_id: args.byMemberId ?? null },
    created_by: args.createdBy ?? "система",
  });
  return true;
}

/**
 * Чия е срещата, преди да е записана: клоузърът (първа среща) или Ивайло
 * (фолоуъп, оферта, картон с друг водещ). Нов човек без картон = първа среща.
 * Записването го пита, за да покани клоузъра в Cal.com още в момента —
 * календарната задача минава чак в 07:30/13:30/18:30.
 */
export async function closerForMeeting(contactId: string | null): Promise<TeamMember | null> {
  const closers = await listClosers();
  const closer = closers[0] ?? null;
  if (!closer) return null;
  if (!contactId) return closer;
  const sb = createServiceClient();
  const { data: c } = await sb.from("contacts").select("owner_id, stage").eq("id", contactId).maybeSingle();
  if (!c) return closer;
  // Картон с водещ клоузър остава при него (който и от двамата да е); друг водещ → не е за клоузър.
  if (c.owner_id) return closers.find((m) => m.id === c.owner_id) ?? null;
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
