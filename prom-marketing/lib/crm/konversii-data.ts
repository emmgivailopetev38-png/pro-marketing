import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import {
  byCampaign,
  costPer,
  countFunnel,
  groupFunnel,
  perPerson,
  traceLeads,
  weekKey,
  type CampaignRow,
  type FunnelCounts,
  type KActivity,
  type KBooking,
  type KLead,
  type LeadCampaign,
  type PersonCounts,
} from "./konversii";
import { classifyCampaign, isFresh, summarize, type SpendRow, type SpendSummary } from "./ads-spend";
import { allRows } from "@/lib/supabase/all-rows";
import { offerFor, offerLabel } from "@/lib/leads/lead-offers";
import { magnetVariantFor } from "@/lib/leads/meta-lead-rules";

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
  /** фунията САМО на лийдовете от реклами — срещу нея се смята цената */
  adFunnel: FunnelCounts;
  cost: ReturnType<typeof costPer>;
  /** екипът: задачи, съобщения, проектни обновления за периода */
  team: Array<{ name: string; tasksDone: number; messages: number; projectUpdates: number; commissionsDue: number }>;
  /** по кампания: разход, лийдове, обаждания на екипа, срещи, клиенти и цената на всяко */
  campaigns: CampaignRow[];
}

/** id-та на заявка — дългият списък в адреса се реже на парчета. */
const ID_CHUNK = 100;

function chunks<T>(list: T[], size = ID_CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/**
 * Всички редове, не първите 1000: PostgREST реже ТИХО на 1000 реда на заявка
 * (виж lib/supabase/all-rows.ts). До 07.10.2026 активностите тук се четяха с
 * `.limit(20000)` — а за последните 60 дни са над 3000, тоест таблото виждаше
 * само най-старите (до 08.09) и „говорихме“/„срещи“ за новите лийдове липсваха.
 */
async function all<T>(label: string, page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const { rows, error } = await allRows<T>(page);
  if (error) console.error(`[konversii] ${label}:`, error);
  return rows;
}

export async function loadKonversii(days = 30, now: Date = new Date()): Promise<KonversiiData> {
  const sb = createServiceClient();
  const from = new Date(now.getTime() - days * 86_400_000);
  const prevFrom = new Date(from.getTime() - days * 86_400_000);

  const [leadRows, { data: memberRows }] = await Promise.all([
    all<KLead & { source_ref: string | null }>("картоните", (a, b) =>
      sb
        .from("contacts")
        .select("id, source, source_ref, created_at, stage, owner_id")
        .gte("created_at", prevFrom.toISOString())
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(a, b)
    ),
    sb.from("team_members").select("id, full_name"),
  ]);
  const leads = leadRows as Array<KLead & { source_ref: string | null }>;
  const ids = leads.map((l) => l.id);
  const [actParts, bookRows, { data: expRows }, spendRows, metaRows, { data: taskRows }, { data: msgRows }, { data: commRows }] = await Promise.all([
    Promise.all(
      chunks(ids).map((part) =>
        all<KActivity>("активностите", (a, b) =>
          sb
            .from("contact_activities")
            .select("contact_id, activity_type, occurred_at, created_by, metadata")
            .in("contact_id", part)
            .order("occurred_at", { ascending: true })
            .order("id", { ascending: true })
            .range(a, b)
        )
      )
    ),
    all<{ attendee_email: string | null; attendee_phone: string | null; scheduled_at: string; status: string }>("срещите", (a, b) =>
      sb
        .from("bookings")
        .select("attendee_email, attendee_phone, scheduled_at, status")
        .gte("created_at", prevFrom.toISOString())
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(a, b)
    ),
    sb.from("expenses").select("amount_gross, expense_date, category, is_personal").eq("category", "ads").gte("expense_date", from.toISOString().slice(0, 10)),
    all<SpendRow>("разхода", (a, b) =>
      sb
        .from("ad_spend_daily")
        .select("day, campaign_id, campaign_name, purpose, spend, spend_eur, impressions, clicks, leads")
        .gte("day", from.toISOString().slice(0, 10))
        .order("day", { ascending: true })
        .order("id", { ascending: true })
        .range(a, b)
    ),
    // Кампанията и формата на всяка Meta заявка — за разбивката по кампания.
    all<{ meta_lead_id: string; campaign_id: string | null; campaign_name: string | null; form_id: string | null; form_name: string | null }>(
      "Meta заявките",
      (a, b) =>
        sb
          .from("meta_leads")
          .select("meta_lead_id, campaign_id, campaign_name, form_id, form_name")
          .gte("created_time", new Date(prevFrom.getTime() - 86_400_000).toISOString())
          .order("created_time", { ascending: true })
          .order("meta_lead_id", { ascending: true })
          .range(a, b)
    ),
    sb.from("project_tasks").select("assignee_id, done_at").eq("status", "done").gte("done_at", from.toISOString()),
    sb.from("team_messages").select("author_key").gte("created_at", from.toISOString()).eq("from_client", false),
    sb.from("commissions").select("member_id, amount, status"),
  ]);
  const actRows = actParts.flat().sort((x, y) => x.occurred_at.localeCompare(y.occurred_at));

  // Срещите се връзват към картона по имейл/телефон.
  const contactKeys = (
    await Promise.all(chunks(ids).map((part) => sb.from("contacts").select("id, email, phone").in("id", part)))
  ).flatMap((r) => r.data ?? []);
  const byEmail = new Map<string, string>();
  const byPhone = new Map<string, string>();
  for (const c of (contactKeys ?? []) as Array<{ id: string; email: string | null; phone: string | null }>) {
    if (c.email) byEmail.set(c.email.toLowerCase(), c.id);
    if (c.phone) byPhone.set(c.phone.replace(/\D/g, "").slice(-9), c.id);
  }
  const bookings: KBooking[] = bookRows.map((b) => ({
    contact_id: (b.attendee_email && byEmail.get(b.attendee_email.toLowerCase())) || (b.attendee_phone && byPhone.get(b.attendee_phone.replace(/\D/g, "").slice(-9))) || null,
    scheduled_at: b.scheduled_at,
    status: b.status,
  }));

  const activities = actRows;
  const traces = traceLeads(leads, activities, bookings, now);
  const fromIso = from.toISOString();
  const cur = traces.filter((t) => t.created_at >= fromIso);
  const prev = traces.filter((t) => t.created_at < fromIso);
  const memberName = new Map(((memberRows ?? []) as Array<{ id: string; full_name: string }>).map((m) => [m.id, m.full_name]));

  const funnel = countFunnel(cur);

  // Разходът идва от дневния синхрон с Meta. Докато той не е тръгвал за даден
  // период, падаме към старите ръчни записи в „Разходи“, за да не изчезнат
  // числата за минали месеци.
  // Предназначението се смята наново по днешните правила: кампания, синхронизирана
  // преди да я познаваме (лийд магнитът на 07.10), не остава „неразпределена“.
  const spend = summarize(spendRows.map((r) => ({ ...r, purpose: classifyCampaign(r.campaign_name) })));
  const manualAds = ((expRows ?? []) as Array<{ amount_gross: number | null; is_personal: boolean }>)
    .filter((e) => !e.is_personal)
    .reduce((s, e) => s + (Number(e.amount_gross) || 0), 0);
  const hasSync = spendRows.length > 0;
  const adSpend = hasSync ? spend.leadsEur : manualAds;

  // Цената се смята срещу лийдовете ОТ РЕКЛАМИ, не срещу всички. Иначе
  // лийдовете, които Хермес е намерил сам или са дошли от сайта, свалят
  // цената на лийда и тя излиза по-евтина, отколкото е в действителност.
  const adFunnel = countFunnel(cur.filter((t) => t.source === "meta_lead"));

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

  // Кампанията на всеки картон от реклама — по първата му Meta заявка (source_ref).
  const metaById = new Map(metaRows.map((m) => [m.meta_lead_id, m]));
  const campaignOf = new Map<string, LeadCampaign>();
  for (const l of leads) {
    if (l.source !== "meta_lead" || !l.source_ref) continue;
    const m = metaById.get(l.source_ref);
    if (!m?.campaign_id) continue;
    const offer = offerFor({
      magnetVariant: magnetVariantFor(m.form_id),
      formName: m.form_name,
      campaignName: m.campaign_name,
      source: "meta_lead",
    });
    campaignOf.set(l.id, { id: m.campaign_id, name: m.campaign_name, offer: offer === "reklama" ? null : offerLabel(offer) });
  }
  const campaigns = byCampaign({
    traces: cur.filter((t) => t.source === "meta_lead"),
    campaignOf,
    spend: spend.byCampaign,
    activities,
  });

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
    adFunnel,
    cost: costPer(adSpend, adFunnel),
    team: [...team.values()].sort((a, b) => b.tasksDone + b.projectUpdates + b.messages - (a.tasksDone + a.projectUpdates + a.messages)),
    campaigns,
  };
}
