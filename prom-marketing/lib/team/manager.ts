import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { listMembers } from "./repository";
import { loadNapredakAll } from "./napredak";
import { intakePool, rotationPool } from "./routing-rules";
import { sortClosers } from "./closer-rules";
import {
  REVSTREAM_TERMS,
  dealSplit,
  feeInstallment,
  isSalesTeam,
  phoneKey9,
  seesMoneyOf,
  statementTotals,
  type DealRow,
  type PartnerTerms,
  type StatementTotals,
  type Viewer,
} from "./manager-rules";
import { orgOf, type TeamMember } from "./types";

/** Таблото на мениджъра на продажбите (правилата и нивата — manager-rules.ts). */

export interface ManagerPerson {
  id: string;
  slug: string;
  name: string;
  role: TeamMember["role"];
  title: string | null;
  org: string;
  lastLogin: string | null;
  /** получава новите лийдове */
  intake: boolean;
  /** клоузърът по подразбиране — при него записват Ели и Cal.com */
  defaultCloser: boolean;
  hasMeetUrl: boolean;
  calls: number;
  talked: number;
  booked: number;
  completed: number;
  noShow: number;
  showRate: number | null;
  medianMinutes: number | null;
  /** отворени лийдове в опашката му (routed_to) */
  queue: number;
  /** хора, които води (owner_id), в отворените етапи */
  people: number;
  offers: number;
  won: number;
  wonValue: number;
}

export interface ManagerMeeting {
  id: string;
  at: string;
  name: string;
  business: string | null;
  status: string;
  closer: string | null;
  bookedBy: string | null;
  recording: string | null;
}

export interface ManagerBoard {
  days: number;
  people: ManagerPerson[];
  upcoming: ManagerMeeting[];
  recent: ManagerMeeting[];
  /** неразпределени отворени лийдове (никой не ги държи) — при кого ще отидат */
  unrouted: { count: number; goesTo: string | null };
  statement: { terms: PartnerTerms; rows: DealRow[]; totals: StatementTotals } | null;
}

const OPEN_STAGES = ["contacted", "discovery", "presentation_sent", "offer_sent", "negotiating"];
const DAY = 86_400_000;

function bookedByOf(raw: unknown): string | null {
  const notes = raw && typeof raw === "object" ? (raw as Record<string, unknown>).notes : null;
  const m = typeof notes === "string" ? /Записа:\s*([^·\n]+)/.exec(notes) : null;
  if (m) return m[1].trim();
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>).source : null;
  return src === "voice" || src === "voice_public" ? "Ели" : null;
}

export async function loadManagerBoard(viewer: Viewer, days = 30, now: Date = new Date()): Promise<ManagerBoard> {
  const sb = createServiceClient();
  const from = new Date(now.getTime() - days * DAY).toISOString();
  const [members, napredak] = await Promise.all([listMembers(), loadNapredakAll(days, now)]);
  const team = members.filter(isSalesTeam);
  const teamIds = team.map((m) => m.id);
  const nameById = new Map(members.map((m) => [m.id, m.full_name]));
  const pool = rotationPool(members);
  const intakeIds = new Set(intakePool(pool).map((m) => m.id));
  const defaultCloserId = sortClosers(team.filter((m) => m.role === "sales"))[0]?.id ?? null;

  const none = "00000000-0000-0000-0000-000000000000";
  const ids = teamIds.length ? teamIds : [none];
  const terms = REVSTREAM_TERMS;
  const ownedCols = "id, full_name, phone, email, owner_id, routed_to, stage, deal_value_eur, updated_at";
  const [queueCounts, { data: owned }, { data: wonRouted }, { count: unrouted }, { data: bookings }, { data: offers }] = await Promise.all([
    // Опашката на всеки — по един брояч на човек (списък би опрял в тавана от 1 000 реда).
    Promise.all(
      team.map(async (m) => {
        const { count } = await sb
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("routed_to", m.id)
          .in("stage", ["lead", "contacted"])
          .not("phone", "is", null);
        return [m.id, count ?? 0] as const;
      })
    ),
    sb.from("contacts").select(ownedCols).in("owner_id", ids).order("updated_at", { ascending: false }).limit(1000),
    // Сделки, уговорени от сетър на екипа, но затворени от друг — за сметката по договора.
    sb.from("contacts").select(ownedCols).eq("stage", "won").gte("updated_at", terms.from).in("routed_to", ids).limit(1000),
    sb
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .is("routed_to", null)
      .is("owner_id", null)
      .in("stage", ["lead", "contacted"])
      .not("phone", "is", null)
      .or("followup_status.is.null,followup_status.neq.not_interested"),
    sb
      .from("bookings")
      .select("id, attendee_name, attendee_phone, attendee_email, scheduled_at, status, business, recording_url, raw_payload")
      .gte("scheduled_at", new Date(now.getTime() - 14 * DAY).toISOString())
      .lte("scheduled_at", new Date(now.getTime() + 21 * DAY).toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(400),
    sb.from("offers").select("contact_id, status, created_at").gte("created_at", from).limit(1000),
  ]);

  type Owned = { id: string; full_name: string | null; phone: string | null; email: string | null; owner_id: string | null; routed_to: string | null; stage: string; deal_value_eur: number | null; updated_at: string };
  const ownedRows = (owned ?? []) as Owned[];
  const queueBy = new Map<string, number>(queueCounts);
  const ownerByContact = new Map(ownedRows.map((c) => [c.id, c.owner_id]));
  const offersBy = new Map<string, number>();
  for (const o of (offers ?? []) as Array<{ contact_id: string | null; status: string | null }>) {
    const owner = o.contact_id ? ownerByContact.get(o.contact_id) : null;
    if (owner && o.status !== "draft") offersBy.set(owner, (offersBy.get(owner) ?? 0) + 1);
  }

  const people: ManagerPerson[] = team.map((m) => {
    const n = napredak.people.find((p) => p.person.memberId === m.id);
    const mine = ownedRows.filter((c) => c.owner_id === m.id);
    const won = mine.filter((c) => c.stage === "won" && c.updated_at >= from);
    return {
      id: m.id,
      slug: m.slug,
      name: m.full_name,
      role: m.role,
      title: m.title ?? null,
      org: orgOf(m),
      lastLogin: m.last_login_at,
      intake: intakeIds.has(m.id),
      defaultCloser: m.id === defaultCloserId,
      hasMeetUrl: !!(m.meet_url ?? "").trim(),
      calls: n?.cur.volume.calls ?? 0,
      talked: n?.cur.volume.talked ?? 0,
      booked: n?.cur.meetings.booked ?? 0,
      completed: n?.cur.meetings.completed ?? 0,
      noShow: n?.cur.meetings.noShow ?? 0,
      showRate: n?.cur.meetings.showRate ?? null,
      medianMinutes: n?.cur.speed.medianMinutes ?? null,
      queue: queueBy.get(m.id) ?? 0,
      people: mine.filter((c) => OPEN_STAGES.includes(c.stage)).length,
      offers: offersBy.get(m.id) ?? 0,
      won: won.length,
      wonValue: won.reduce((s, c) => s + (Number(c.deal_value_eur) || 0), 0),
    };
  });

  // Срещите: чия е — по картона (телефон или имейл) → водещия му.
  const byPhone = new Map<string, Owned>();
  const byEmail = new Map<string, Owned>();
  for (const c of ownedRows) {
    const k = phoneKey9(c.phone);
    if (k) byPhone.set(k, c);
    if (c.email) byEmail.set(c.email.toLowerCase(), c);
  }
  type B = { id: string; attendee_name: string | null; attendee_phone: string | null; attendee_email: string | null; scheduled_at: string; status: string | null; business: string | null; recording_url: string | null; raw_payload: unknown };
  const meetings: ManagerMeeting[] = [];
  for (const b of (bookings ?? []) as B[]) {
    const k = phoneKey9(b.attendee_phone);
    const c = (k ? byPhone.get(k) : undefined) ?? (b.attendee_email ? byEmail.get(b.attendee_email.toLowerCase()) : undefined);
    // Само срещите на екипа по продажбите — тези на Ивайло не са за мениджъра.
    if (!c?.owner_id || !teamIds.includes(c.owner_id)) continue;
    meetings.push({
      id: b.id,
      at: b.scheduled_at,
      name: (b.attendee_name ?? "").trim() || "Без име",
      business: b.business,
      status: String(b.status ?? ""),
      closer: nameById.get(c.owner_id) ?? null,
      bookedBy: bookedByOf(b.raw_payload),
      recording: b.recording_url,
    });
  }
  const nowIso = now.toISOString();
  const upcoming = meetings.filter((m) => m.at >= nowIso && !["cancelled", "rejected"].includes(m.status));
  const recent = meetings.filter((m) => m.at < nowIso).reverse();

  // Сделките по договора с партньора — вижда ги собственикът и мениджърът на същия партньор.
  let statement: ManagerBoard["statement"] = null;
  if (seesMoneyOf(viewer, { org: terms.org })) {
    const partner = team.filter((m) => orgOf(m) === terms.org);
    const partnerIds = new Set(partner.map((m) => m.id));
    const setters = new Set(partner.filter((m) => m.role === "setter").map((m) => m.id));
    const closers = new Set(partner.filter((m) => m.role === "sales").map((m) => m.id));
    const candidates = new Map<string, Owned>();
    for (const c of [...ownedRows, ...((wonRouted ?? []) as Owned[])]) candidates.set(c.id, c);
    const wonRows = [...candidates.values()]
      .filter((c) => c.stage === "won" && c.updated_at >= terms.from && ((c.owner_id && partnerIds.has(c.owner_id)) || (c.routed_to && partnerIds.has(c.routed_to))))
      .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
    const rows: DealRow[] = wonRows.map((c, i) => {
      const did = { setter: !!c.routed_to && setters.has(c.routed_to), closer: !!c.owner_id && closers.has(c.owner_id) };
      const amount = Number(c.deal_value_eur) || 0;
      return {
        contactId: c.id,
        name: (c.full_name ?? "").trim() || "Без име",
        wonAt: c.updated_at,
        amount,
        setterName: did.setter && c.routed_to ? nameById.get(c.routed_to) ?? null : null,
        closerName: c.owner_id ? nameById.get(c.owner_id) ?? null : null,
        split: dealSplit(amount, terms, did),
        installment: feeInstallment(i + 1, terms),
      };
    });
    statement = { terms, rows, totals: statementTotals(rows, terms) };
  }

  const goesTo = intakePool(pool)[0]?.full_name ?? null;
  return { days, people, upcoming, recent: recent.slice(0, 40), unrouted: { count: unrouted ?? 0, goesTo }, statement };
}
