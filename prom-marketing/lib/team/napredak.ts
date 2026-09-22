import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { listActiveMembers, slugify } from "./repository";
import { loadTasksFor } from "./tasks";
import type { TeamActor } from "./session";
import type { TeamMember, TeamRole } from "./types";
import {
  OWNER_REF,
  aggregateAll,
  dataFor,
  ownerTasksOf,
  type NapredakActivity,
  type NapredakAll,
  type NapredakBooking,
  type NapredakData,
  type NapredakLead,
  type NapredakPool,
  type NapredakTask,
  type PersonRef,
} from "./napredak-rules";

export type { NapredakAll, NapredakData, PersonNapredak, PersonRef, TeamAverage, TeamRow } from "./napredak-rules";

/**
 * „Напредък“ — четенето от базата. Правилата са в napredak-rules.ts (чисти,
 * тествани); тук само се събира материалът и се подават задачите на всеки.
 *
 * Всичко се смята за всички хора наведнъж: сравнението с екипа иска същите
 * числа за всекиго, а базата се чете еднакво скъпо за един и за трима.
 */

const OWNER_ACTOR: TeamActor = { kind: "owner", name: "Ивайло", slug: "ivailo", member: null };

function refOf(m: TeamMember): PersonRef {
  return { key: m.slug, name: m.full_name, role: m.role, kind: "team", memberId: m.id };
}

function actorOf(m: TeamMember): TeamActor {
  return { kind: "member", name: m.full_name, slug: m.slug, member: m };
}

async function loadPool(days: number, now: Date): Promise<{ pool: NapredakPool; members: TeamMember[] }> {
  const sb = createServiceClient();
  // Два периода назад: текущият и предходният равен, за делтите.
  const prevFrom = new Date(now.getTime() - 2 * days * 86_400_000).toISOString();

  const [{ data: teamRows }, { data: actRows }, { data: leadRows }, { data: bookingRows }, members] = await Promise.all([
    sb.from("team_members").select("full_name"),
    // Без горна граница нарочно: срещата, записана днес за утре, стои с
    // утрешна дата — моментът на работата се взима после (actedAt).
    sb
      .from("contact_activities")
      .select("contact_id, activity_type, occurred_at, created_at, created_by, metadata")
      .gte("occurred_at", prevFrom)
      .order("occurred_at", { ascending: true })
      .limit(20000),
    sb.from("contacts").select("id, created_at").gte("created_at", prevFrom).lte("created_at", now.toISOString()).limit(5000),
    sb.from("bookings").select("id, status, scheduled_at, created_at, raw_payload").gte("created_at", prevFrom).limit(2000),
    listActiveMembers(),
  ]);

  const bookings: NapredakBooking[] = ((bookingRows ?? []) as Array<Record<string, unknown>>).map((b) => ({
    id: String(b.id),
    status: String(b.status ?? ""),
    scheduled_at: String(b.scheduled_at),
    created_at: String(b.created_at),
    notes: ((b.raw_payload as Record<string, unknown> | null)?.notes as string | null) ?? null,
  }));

  return {
    pool: {
      activities: (actRows ?? []) as NapredakActivity[],
      leads: (leadRows ?? []) as NapredakLead[],
      bookings,
      teamNames: ((teamRows ?? []) as Array<{ full_name: string }>).map((t) => t.full_name),
    },
    members,
  };
}

/** Задачите на всеки: своите + по проектите, на които е отговорник; на Ивайло — ничиите. */
async function loadTasksByKey(persons: PersonRef[], members: TeamMember[]): Promise<Map<string, NapredakTask[]>> {
  const byId = new Map(members.map((m) => [m.id, m]));
  const entries = await Promise.all(
    persons.map(async (p): Promise<[string, NapredakTask[]]> => {
      if (p.kind === "owner") {
        const { rows } = await loadTasksFor(OWNER_ACTOR);
        return [p.key, ownerTasksOf(rows)];
      }
      const m = p.memberId ? byId.get(p.memberId) : undefined;
      if (!m) return [p.key, []];
      const { rows } = await loadTasksFor(actorOf(m));
      return [p.key, rows];
    })
  );
  return new Map(entries);
}

async function loadAllFor(persons: PersonRef[], pool: NapredakPool, members: TeamMember[], days: number, now: Date): Promise<NapredakAll> {
  const tasks = await loadTasksByKey(persons, members);
  return aggregateAll(pool, persons, tasks, { days, now });
}

/** Всички активни хора + собственикът, един до друг — за /admin/napredak. */
export async function loadNapredakAll(days = 30, now: Date = new Date()): Promise<NapredakAll> {
  const { pool, members } = await loadPool(days, now);
  const persons: PersonRef[] = [OWNER_REF, ...members.map(refOf)];
  return loadAllFor(persons, pool, members, days, now);
}

export interface LoadNapredakArgs {
  days: number;
  now?: Date;
  actorName: string;
  actorKind: "owner" | "member";
  memberId?: string | null;
  memberRole?: TeamRole | null;
  /** slug на друг човек — само собственикът може да гледа чужди числа; страницата решава дали да го подаде */
  who?: string | null;
}

/**
 * Таблото на един човек: неговите числа + всички в сравнението. Човек, който
 * вече не е сред активните (например спрян, докато сесията му е жива), пак
 * получава своите числа — по името си, както стои в активностите.
 */
export async function loadNapredak(args: LoadNapredakArgs): Promise<NapredakData> {
  const now = args.now ?? new Date();
  const { pool, members } = await loadPool(args.days, now);
  const persons: PersonRef[] = [OWNER_REF, ...members.map(refOf)];

  let key = OWNER_REF.key;
  if (args.actorKind === "member") {
    const known = members.find((m) => m.id === args.memberId);
    if (known) key = known.slug;
    else {
      const ref: PersonRef = {
        key: slugify(args.actorName),
        name: args.actorName,
        role: args.memberRole ?? "setter",
        kind: "team",
        memberId: args.memberId ?? null,
      };
      persons.push(ref);
      key = ref.key;
    }
  }
  if (args.who && persons.some((p) => p.key === args.who)) key = args.who;

  const all = await loadAllFor(persons, pool, members, args.days, now);
  const data = dataFor(all, key);
  if (!data) throw new Error(`Няма човек с ключ ${key}`);
  return data;
}

/** Таблото на човек по slug (собственикът е „ivailo“); null, ако няма такъв. */
export async function loadNapredakBySlug(slug: string, days = 30, now: Date = new Date()): Promise<NapredakData | null> {
  const all = await loadNapredakAll(days, now);
  return dataFor(all, slug);
}
