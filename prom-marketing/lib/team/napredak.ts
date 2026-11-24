import "server-only";
import { allRows } from "@/lib/supabase/all-rows";
import { createServiceClient } from "@/lib/supabase/service";
import { listActiveMembers, slugify } from "./repository";
import { loadTasksFor } from "./tasks";
import { napredakOutcome } from "./prospects-rules";
import { phoneKey9 } from "./manager-rules";
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
  // Два периода назад: текущият и предходният равен, за делтите. Поне 10 дни —
  // за дневния отчет (EOD) ден по ден.
  const prevFrom = new Date(now.getTime() - Math.max(2 * days + 1, 11) * 86_400_000).toISOString();

  // ⚠️ PostgREST връща най-много 1 000 реда на заявка и реже ТИХО. До 24.11.2026
  // тук стоеше `.limit(20000)` → за 30 дни се четяха само най-старите 1 000
  // действия (до 10.10), а всичко ново изчезваше от метриките. Сега — по страници.
  const [{ data: teamRows }, acts, leadsRes, bookingsRes, ownedRes, members, cold] = await Promise.all([
    sb.from("team_members").select("id, full_name"),
    // Без горна граница нарочно: срещата, записана днес за утре, стои с
    // утрешна дата — моментът на работата се взима после (actedAt).
    allRows<NapredakActivity & { id: string }>((from, to) =>
      sb
        .from("contact_activities")
        .select("id, contact_id, activity_type, occurred_at, created_at, created_by, metadata")
        .gte("occurred_at", prevFrom)
        .order("occurred_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
    ),
    allRows<NapredakLead>((from, to) =>
      sb
        .from("contacts")
        .select("id, created_at")
        .gte("created_at", prevFrom)
        .lte("created_at", now.toISOString())
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
    ),
    // Записаните в периода И тези с час в периода (за срещите, които клоузърът води).
    allRows<Record<string, unknown>>((from, to) =>
      sb
        .from("bookings")
        .select("id, status, scheduled_at, created_at, raw_payload, attendee_phone, attendee_email")
        .or(`created_at.gte.${prevFrom},scheduled_at.gte.${prevFrom}`)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
    ),
    // Чий е картонът — за „кой води срещата“.
    allRows<{ id: string; phone: string | null; email: string | null; owner_id: string | null }>((from, to) =>
      sb
        .from("contacts")
        .select("id, phone, email, owner_id")
        .not("owner_id", "is", null)
        .order("id", { ascending: true })
        .range(from, to)
    ),
    listActiveMembers(),
    // Студените обаждания без картон („не вдигна“, „не се интересува“…) — те също
    // са обаждания. „Говорихме“ и „среща“ минават през картона, затова не са тук.
    allRows<{ prospect_id: string; outcome: string; caller: string; created_at: string }>((from, to) =>
      sb
        .from("prospect_calls")
        .select("prospect_id, outcome, caller, created_at")
        .in("outcome", ["no_answer", "callback", "not_interested", "bad_number"])
        .gte("created_at", prevFrom)
        .order("created_at", { ascending: true })
        .range(from, to)
    ),
  ]);

  const coldCalls: NapredakActivity[] = cold.rows.map(
    (r) => ({
      contact_id: `prospect:${r.prospect_id}`,
      activity_type: "call",
      occurred_at: r.created_at,
      created_at: r.created_at,
      created_by: r.caller,
      metadata: { outcome: napredakOutcome(r.outcome), team: true, cold: true },
    })
  );

  const team = (teamRows ?? []) as Array<{ id: string; full_name: string }>;
  const nameById = new Map(team.map((t) => [t.id, t.full_name]));
  const ownerByPhone = new Map<string, string>();
  const ownerByEmail = new Map<string, string>();
  for (const c of ownedRes.rows) {
    const name = c.owner_id ? nameById.get(c.owner_id) : undefined;
    if (!name) continue;
    const k = phoneKey9(c.phone);
    if (k) ownerByPhone.set(k, name);
    if (c.email) ownerByEmail.set(c.email.trim().toLowerCase(), name);
  }

  const bookings: NapredakBooking[] = bookingsRes.rows.map((b) => {
    const phone = phoneKey9((b.attendee_phone as string | null) ?? null);
    const email = String(b.attendee_email ?? "").trim().toLowerCase();
    return {
      id: String(b.id),
      status: String(b.status ?? ""),
      scheduled_at: String(b.scheduled_at),
      created_at: String(b.created_at),
      notes: ((b.raw_payload as Record<string, unknown> | null)?.notes as string | null) ?? null,
      moved: !!(b.raw_payload as Record<string, unknown> | null)?.moved_to,
      closer: (phone ? ownerByPhone.get(phone) : undefined) ?? (email ? ownerByEmail.get(email) : undefined) ?? null,
    };
  });

  return {
    pool: {
      activities: [...(acts.rows as NapredakActivity[]), ...coldCalls].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at)),
      leads: leadsRes.rows,
      bookings,
      teamNames: team.map((t) => t.full_name),
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
