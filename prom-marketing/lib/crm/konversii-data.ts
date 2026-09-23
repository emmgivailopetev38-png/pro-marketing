import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import {
  costPer,
  countFunnel,
  groupFunnel,
  perPerson,
  traceLeads,
  weekKey,
  type FunnelCounts,
  type KActivity,
  type KBooking,
  type KLead,
  type PersonCounts,
} from "./konversii";
import { isFresh, summarize, type SpendRow, type SpendSummary } from "./ads-spend";

export interface KonversiiData {
  days: number;
  from: string;
  funnel: FunnelCounts;
  prev: FunnelCounts;
  bySource: Array<{ key: string; funnel: FunnelCounts }>;
  byWeek: Array<{ key: string; funnel: FunnelCounts }>;
  byOwner: Array<{ key: string; funnel: FunnelCounts }>;
  people: PersonCounts[];
  /** разходът за НАШИ лийдове в евро — той влиза в цената на резултата */
  adSpend: number;
  /** целият рекламен разход за периода, разделен по предназначение и по кампании */
  spend: SpendSummary;
  /** има ли данни от синхрона за вчера/днес */
  spendFresh: boolean;
  /** откъде е взет разходът: дневния синхрон или старите записи в „Разходи“ */
  spendSource: "sync" | "expenses";
  cost: ReturnType<typeof costPer>;
  /** екипът: задачи, съобщения, проектни обновления за периода */
  team: Array<{ name: string; tasksDone: number; messages: number; projectUpdates: number; commissionsDue: number }>;
}

export async function loadKonversii(days = 30, now: Date = new Date()): Promise<KonversiiData> {
  const sb = createServiceClient();
  const from = new Date(now.getTime() - days * 86_400_000);
  const prevFrom = new Date(from.getTime() - days * 86_400_000);

  const [{ data: leadRows }, { data: memberRows }] = await Promise.all([
    sb.from("contacts").select("id, source, created_at, stage, owner_id").gte("created_at", prevFrom.toISOString()).order("created_at", { ascending: true }).limit(5000),
    sb.from("team_members").select("id, full_name"),
  ]);
  const leads = (leadRows ?? []) as KLead[];
  const ids = leads.map((l) => l.id);
  const [{ data: actRows }, { data: bookRows }, { data: expRows }, { data: spendRows }, { data: taskRows }, { data: msgRows }, { data: commRows }] = await Promise.all([
    ids.length
      ? sb.from("contact_activities").select("contact_id, activity_type, occurred_at, created_by, metadata").in("contact_id", ids).order("occurred_at", { ascending: true }).limit(20000)
      : Promise.resolve({ data: [] }),
    sb.from("bookings").select("attendee_email, attendee_phone, scheduled_at, status").gte("created_at", prevFrom.toISOString()).limit(2000),
    sb.from("expenses").select("amount_gross, expense_date, category, is_personal").eq("category", "ads").gte("expense_date", from.toISOString().slice(0, 10)),
    sb
      .from("ad_spend_daily")
      .select("day, campaign_id, campaign_name, purpose, spend, spend_eur, impressions, clicks, leads")
      .gte("day", from.toISOString().slice(0, 10))
      .limit(5000),
    sb.from("project_tasks").select("assignee_id, done_at").eq("status", "done").gte("done_at", from.toISOString()),
    sb.from("team_messages").select("author_key").gte("created_at", from.toISOString()).eq("from_client", false),
    sb.from("commissions").select("member_id, amount, status"),
  ]);

  // Срещите се връзват към картона по имейл/телефон.
  const { data: contactKeys } = ids.length ? await sb.from("contacts").select("id, email, phone").in("id", ids) : { data: [] };
  const byEmail = new Map<string, string>();
  const byPhone = new Map<string, string>();
  for (const c of (contactKeys ?? []) as Array<{ id: string; email: string | null; phone: string | null }>) {
    if (c.email) byEmail.set(c.email.toLowerCase(), c.id);
    if (c.phone) byPhone.set(c.phone.replace(/\D/g, "").slice(-9), c.id);
  }
  const bookings: KBooking[] = ((bookRows ?? []) as Array<{ attendee_email: string | null; attendee_phone: string | null; scheduled_at: string; status: string }>).map((b) => ({
    contact_id: (b.attendee_email && byEmail.get(b.attendee_email.toLowerCase())) || (b.attendee_phone && byPhone.get(b.attendee_phone.replace(/\D/g, "").slice(-9))) || null,
    scheduled_at: b.scheduled_at,
    status: b.status,
  }));

  const activities = (actRows ?? []) as KActivity[];
  const traces = traceLeads(leads, activities, bookings, now);
  const fromIso = from.toISOString();
  const cur = traces.filter((t) => t.created_at >= fromIso);
  const prev = traces.filter((t) => t.created_at < fromIso);
  const memberName = new Map(((memberRows ?? []) as Array<{ id: string; full_name: string }>).map((m) => [m.id, m.full_name]));

  const funnel = countFunnel(cur);

  // Разходът идва от дневния синхрон с Meta. Докато той не е тръгвал за даден
  // период, падаме към старите ръчни записи в „Разходи“, за да не изчезнат
  // числата за минали месеци.
  const spend = summarize((spendRows ?? []) as SpendRow[]);
  const manualAds = ((expRows ?? []) as Array<{ amount_gross: number | null; is_personal: boolean }>)
    .filter((e) => !e.is_personal)
    .reduce((s, e) => s + (Number(e.amount_gross) || 0), 0);
  const hasSync = (spendRows ?? []).length > 0;
  const adSpend = hasSync ? spend.leadsEur : manualAds;

  // Екипът за периода.
  const team = new Map<string, { name: string; tasksDone: number; messages: number; projectUpdates: number; commissionsDue: number }>();
  const row = (key: string) => {
    const name = key === "owner" || key === "Ивайло" ? "Ивайло" : memberName.get(key) ?? key;
    const r = team.get(name) ?? { name, tasksDone: 0, messages: 0, projectUpdates: 0, commissionsDue: 0 };
    team.set(name, r);
    return r;
  };
  for (const t of (taskRows ?? []) as Array<{ assignee_id: string | null }>) row(t.assignee_id ?? "owner").tasksDone += 1;
  for (const m of (msgRows ?? []) as Array<{ author_key: string }>) row(m.author_key).messages += 1;
  for (const a of activities) {
    if (a.activity_type === "project_update" && a.occurred_at >= fromIso && a.created_by) row(a.created_by).projectUpdates += 1;
  }
  for (const c of (commRows ?? []) as Array<{ member_id: string; amount: number; status: string }>) {
    if (c.status === "due" || c.status === "approved") row(c.member_id).commissionsDue += Number(c.amount) || 0;
  }

  return {
    days,
    from: fromIso,
    funnel,
    prev: countFunnel(prev),
    bySource: groupFunnel(cur, (t) => t.source),
    byWeek: groupFunnel(cur, (t) => weekKey(t.created_at)).sort((a, b) => a.key.localeCompare(b.key)),
    byOwner: groupFunnel(cur, (t) => (t.owner_id ? memberName.get(t.owner_id) ?? "екип" : "Ивайло")),
    people: perPerson(cur, activities.filter((a) => a.occurred_at >= fromIso), new Set(cur.map((t) => t.id))),
    adSpend,
    spend,
    spendFresh: isFresh(spend.lastDay, now),
    spendSource: hasSync ? "sync" : "expenses",
    cost: costPer(adSpend, funnel),
    team: [...team.values()].sort((a, b) => b.tasksDone + b.projectUpdates + b.messages - (a.tasksDone + a.projectUpdates + a.messages)),
  };
}
