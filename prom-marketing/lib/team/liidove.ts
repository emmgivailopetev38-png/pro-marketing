import "server-only";
import { allRows } from "@/lib/supabase/all-rows";
import { createServiceClient } from "@/lib/supabase/service";
import { listMembers } from "./repository";
import { phoneKey9 } from "./manager-rules";
import { loadIvailoClaims } from "./ivailo";
import { ELI_TYPES } from "./eli-rules";
import {
  LEAD_STATUSES,
  leadStatus,
  matchesQuery,
  meetingFacts,
  sourceLabel,
  isUebinarSource,
  summarizeLeadActivities,
  type LeadActivityRow,
  type LeadBookingRef,
  type LeadStatus,
  type LeadTouch,
} from "./liidove-rules";

/**
 * „Всички лийдове“ — четенето. Всеки човек, дошъл като лийд (реклама, сайт,
 * Ели, уебинар, Академия) — без личните контакти на Ивайло (source hermes /
 * manual: партньори, приятели, стари клиенти). Всичко по страници: PostgREST
 * реже ТИХО на 1 000 реда.
 */

export interface LeadRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  business: string | null;
  source: string;
  /** записан за уебинара (ivailopetev.com) */
  uebinar: boolean;
  createdAt: string;
  status: LeadStatus;
  calls: number;
  eli: number;
  history: LeadTouch[];
  meeting: { at: string; status: string; upcoming: boolean } | null;
  held: number;
  noShow: number;
  /** кой го води (клоузър) и кой му звъни (сетър) */
  owner: string | null;
  setter: string | null;
  nextFollowup: string | null;
  /** „при Ивайло — не му звъни“ */
  ivailo: string | null;
  dealValue: number | null;
}

export interface LeadsView {
  rows: LeadRow[];
  /** колко има във всяка група (преди филтъра по група) */
  counts: Record<LeadStatus | "all", number>;
  /** колко от тях са записани за уебинара (в същия обхват: хора и търсене) */
  uebinar: number;
  total: number;
  people: Array<{ id: string; name: string }>;
}

const EXCLUDED_SOURCES = "(hermes,manual)";
const TOUCH_TYPES = ["call", "meeting", "meeting_outcome", ...ELI_TYPES];

export async function loadLeads(args: { status?: string | null; q?: string | null; who?: string | null; ot?: string | null; now?: Date }): Promise<LeadsView> {
  const sb = createServiceClient();
  const now = args.now ?? new Date();

  type C = {
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    company: string | null;
    business: string | null;
    stage: string;
    source: string | null;
    source_ref: string | null;
    created_at: string;
    owner_id: string | null;
    routed_to: string | null;
    next_followup_at: string | null;
    followup_status: string | null;
    deal_value_eur: number | null;
  };

  const [contacts, acts, bookings, metaLeads, members] = await Promise.all([
    allRows<C>((from, to) =>
      sb
        .from("contacts")
        .select("id, full_name, phone, email, company, business, stage, source, source_ref, created_at, owner_id, routed_to, next_followup_at, followup_status, deal_value_eur")
        .not("source", "in", EXCLUDED_SOURCES)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to)
    ),
    allRows<LeadActivityRow>((from, to) =>
      sb
        .from("contact_activities")
        .select("contact_id, activity_type, title, occurred_at, created_by, metadata")
        .in("activity_type", TOUCH_TYPES)
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to)
    ),
    allRows<{ status: string | null; scheduled_at: string; attendee_phone: string | null; attendee_email: string | null }>((from, to) =>
      sb.from("bookings").select("status, scheduled_at, attendee_phone, attendee_email").order("scheduled_at", { ascending: false }).order("id", { ascending: true }).range(from, to)
    ),
    allRows<{ meta_lead_id: string; campaign_name: string | null; ad_name: string | null; form_name: string | null }>((from, to) =>
      sb.from("meta_leads").select("meta_lead_id, campaign_name, ad_name, form_name").order("id", { ascending: true }).range(from, to)
    ),
    listMembers(),
  ]);

  const nameById = new Map(members.map((m) => [m.id, m.full_name]));
  const summary = summarizeLeadActivities(acts.rows);
  const adByRef = new Map(metaLeads.rows.map((m) => [m.meta_lead_id, { campaign: m.campaign_name, ad: m.ad_name, form: m.form_name }]));

  const byPhone = new Map<string, LeadBookingRef[]>();
  const byEmail = new Map<string, LeadBookingRef[]>();
  for (const b of bookings.rows) {
    const ref = { status: String(b.status ?? ""), scheduled_at: b.scheduled_at };
    const k = phoneKey9(b.attendee_phone);
    if (k) byPhone.set(k, [...(byPhone.get(k) ?? []), ref]);
    const e = (b.attendee_email ?? "").trim().toLowerCase();
    if (e) byEmail.set(e, [...(byEmail.get(e) ?? []), ref]);
  }

  // Хората на Ивайло (Академия, говорил е сам, среща с него…) — виждат се, но с надпис „не му звъни“.
  let claims = new Map<string, { label: string }>();
  try {
    claims = await loadIvailoClaims(
      contacts.rows.map((c) => ({ id: c.id, email: c.email, phone: c.phone, source: c.source, created_at: c.created_at })),
      { now },
      sb
    );
  } catch (e) {
    console.error("[liidove] ivailo claims", e instanceof Error ? e.message : e);
  }

  const all: LeadRow[] = contacts.rows.map((c) => {
    const k = phoneKey9(c.phone);
    const e = (c.email ?? "").trim().toLowerCase();
    const seen = new Set<string>();
    const mine = [...(k ? byPhone.get(k) ?? [] : []), ...(e ? byEmail.get(e) ?? [] : [])].filter((b) => {
      const key = `${b.scheduled_at}|${b.status}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const activity = summary.get(c.id) ?? null;
    const m = meetingFacts(mine, now);
    const meet = m.upcoming ?? m.last;
    return {
      id: c.id,
      name: (c.full_name ?? "").trim() || c.company?.trim() || c.phone || "Без име",
      phone: c.phone,
      email: c.email,
      company: c.company,
      business: c.business,
      source: sourceLabel(c.source, c.source_ref ? adByRef.get(c.source_ref) ?? null : null),
      uebinar: isUebinarSource(c.source),
      createdAt: c.created_at,
      status: leadStatus({ stage: c.stage, followupStatus: c.followup_status, activity, bookings: mine }, now),
      calls: activity?.calls ?? 0,
      eli: activity?.eli ?? 0,
      history: activity?.history ?? [],
      meeting: meet ? { at: meet.scheduled_at, status: meet.status, upcoming: meet === m.upcoming } : null,
      held: m.held,
      noShow: m.noShow,
      owner: c.owner_id ? nameById.get(c.owner_id) ?? null : null,
      setter: c.routed_to ? nameById.get(c.routed_to) ?? null : null,
      nextFollowup: c.next_followup_at,
      ivailo: claims.get(c.id)?.label ?? null,
      dealValue: c.deal_value_eur,
    };
  });

  const who = (args.who ?? "").trim();
  const q = (args.q ?? "").trim();
  const scoped = all.filter(
    (r) =>
      (!who || (who === "ivailo" ? !!r.ivailo || (!r.owner && !r.setter) : r.owner === who || r.setter === who)) &&
      (!q || matchesQuery(r, q))
  );

  const uebinar = scoped.filter((r) => r.uebinar).length;
  // „🎓 Уебинар“ — само записаните за уебинара (ot=uebinar); групите броят в този обхват.
  const inScope = args.ot === "uebinar" ? scoped.filter((r) => r.uebinar) : scoped;
  const counts = Object.fromEntries([["all", inScope.length], ...LEAD_STATUSES.map((s) => [s, 0])]) as Record<LeadStatus | "all", number>;
  for (const r of inScope) counts[r.status] += 1;

  const status = (LEAD_STATUSES as readonly string[]).includes(args.status ?? "") ? (args.status as LeadStatus) : null;
  const rows = status ? inScope.filter((r) => r.status === status) : inScope;

  const people = [...new Set(all.flatMap((r) => [r.owner, r.setter]).filter((n): n is string => !!n))]
    .sort((a, b) => a.localeCompare(b, "bg"))
    .map((name) => ({ id: name, name }));

  return { rows, counts, uebinar, total: all.length, people };
}
