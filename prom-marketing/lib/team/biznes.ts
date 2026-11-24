import "server-only";
import { allRows } from "@/lib/supabase/all-rows";
import { createServiceClient } from "@/lib/supabase/service";
import { loadKonversii, type KonversiiData } from "@/lib/crm/konversii-data";
import { phoneKey9 } from "./manager-rules";
import { emptyMonth, monthKey, totalsOf, type AdRow, type MonthAgg, type Totals } from "./biznes-rules";

/** Откогато има рекламен разход в CRM-а (ad_spend_daily започва на 12.05.2026). */
export const BIZNES_FROM = "2026-05-01";

export interface BiznesData {
  months: MonthAgg[];
  totals: Totals;
  /** фунията и цената по кампания — същото като /admin/konversii, за целия период */
  konversii: KonversiiData;
  ads: AdRow[];
  /** има ли разход по реклами (синхронът по ниво „реклама“) */
  adSpendKnown: boolean;
  /** последният ден с разход в синхрона */
  lastSpendDay: string | null;
}

export async function loadBiznes(now: Date = new Date()): Promise<BiznesData> {
  const sb = createServiceClient();
  const days = Math.ceil((now.getTime() - new Date(`${BIZNES_FROM}T00:00:00Z`).getTime()) / 86_400_000);

  const [konversii, spend, contacts, bookings, metaLeads, adSpend] = await Promise.all([
    loadKonversii(days, now),
    allRows<{ day: string; purpose: string | null; spend: number | null; spend_eur: number | null }>((from, to) =>
      sb.from("ad_spend_daily").select("day, purpose, spend, spend_eur").order("day", { ascending: true }).order("id", { ascending: true }).range(from, to)
    ),
    allRows<{ id: string; source: string | null; source_ref: string | null; phone: string | null; email: string | null; stage: string; created_at: string; updated_at: string; deal_value_eur: number | null }>((from, to) =>
      sb
        .from("contacts")
        .select("id, source, source_ref, phone, email, stage, created_at, updated_at, deal_value_eur")
        .eq("source", "meta_lead")
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
    ),
    allRows<{ status: string | null; scheduled_at: string; created_at: string; attendee_phone: string | null; attendee_email: string | null }>((from, to) =>
      sb.from("bookings").select("status, scheduled_at, created_at, attendee_phone, attendee_email").order("scheduled_at", { ascending: true }).order("id", { ascending: true }).range(from, to)
    ),
    allRows<{ meta_lead_id: string; ad_id: string | null; ad_name: string | null; campaign_name: string | null; created_time: string | null; created_at: string }>((from, to) =>
      sb.from("meta_leads").select("meta_lead_id, ad_id, ad_name, campaign_name, created_time, created_at").order("id", { ascending: true }).range(from, to)
    ),
    // Разходът по реклами (не по кампании) — таблицата се пълни от синхрона на VPS-а.
    allRows<{ ad_id: string; spend: number | null; spend_eur: number | null }>((from, to) =>
      sb.from("ad_spend_ads_daily").select("ad_id, spend, spend_eur").order("id", { ascending: true }).range(from, to)
    ),
  ]);

  const months = new Map<string, MonthAgg>();
  const month = (iso: string) => {
    const k = monthKey(iso);
    let m = months.get(k);
    if (!m) {
      m = emptyMonth(k);
      months.set(k, m);
    }
    return m;
  };

  let lastSpendDay: string | null = null;
  for (const r of spend.rows) {
    if (r.purpose !== "leads") continue;
    const m = month(`${r.day}T12:00:00Z`);
    m.usd += Number(r.spend) || 0;
    m.eur += Number(r.spend_eur) || 0;
    if (!lastSpendDay || r.day > lastSpendDay) lastSpendDay = r.day;
  }
  for (const l of metaLeads.rows) month(l.created_time ?? l.created_at).metaLeads += 1;

  // Срещите на хората от реклами — по телефон или имейл на картона.
  const adContact = new Map<string, (typeof contacts.rows)[number]>();
  const byPhone = new Map<string, string>();
  const byEmail = new Map<string, string>();
  for (const c of contacts.rows) {
    adContact.set(c.id, c);
    const k = phoneKey9(c.phone);
    if (k) byPhone.set(k, c.id);
    if (c.email) byEmail.set(c.email.trim().toLowerCase(), c.id);
    const m = month(c.created_at);
    m.leads += 1;
    // Клиентът се брои в месеца, в който е ДОШЪЛ като лийд — updated_at се мести при всяка
    // редакция на картона и на 24.11.2026 показваше всичките 9 клиента в ноември.
    if (c.stage === "won") {
      m.won += 1;
      m.wonValue += Number(c.deal_value_eur) || 0;
    }
  }
  const heldBy = new Map<string, number>();
  for (const b of bookings.rows) {
    const k = phoneKey9(b.attendee_phone);
    const id = (k ? byPhone.get(k) : undefined) ?? (b.attendee_email ? byEmail.get(b.attendee_email.trim().toLowerCase()) : undefined);
    if (!id) continue;
    const st = String(b.status ?? "");
    if (st === "cancelled" || st === "rejected") continue;
    month(b.created_at).booked += 1;
    if (st === "completed") {
      month(b.scheduled_at).held += 1;
      heldBy.set(id, (heldBy.get(id) ?? 0) + 1);
    } else if (st === "no_show") month(b.scheduled_at).noShow += 1;
  }

  const monthList = [...months.values()].filter((m) => m.month >= BIZNES_FROM.slice(0, 7)).sort((a, b) => b.month.localeCompare(a.month));
  for (const m of monthList) {
    m.usd = Math.round(m.usd * 100) / 100;
    m.eur = Math.round(m.eur * 100) / 100;
  }

  // По реклама: лийдове, дошли на среща, клиенти (+ разход, ако синхронът по реклами го има).
  const contactByRef = new Map<string, string>();
  for (const c of contacts.rows) if (c.source_ref) contactByRef.set(c.source_ref, c.id);
  const spendByAd = new Map<string, { usd: number; eur: number }>();
  for (const r of adSpend.rows) {
    const cur = spendByAd.get(r.ad_id) ?? { usd: 0, eur: 0 };
    cur.usd += Number(r.spend) || 0;
    cur.eur += Number(r.spend_eur) || 0;
    spendByAd.set(r.ad_id, cur);
  }
  const ads = new Map<string, AdRow>();
  const adIdOf = new Map<string, string | null>();
  for (const l of metaLeads.rows) {
    const key = l.ad_id || l.ad_name || "—";
    const at = l.created_time ?? l.created_at;
    let a = ads.get(key);
    if (!a) {
      a = { ad: (l.ad_name ?? "").trim() || "без име", campaign: (l.campaign_name ?? "").trim() || "—", leads: 0, held: 0, won: 0, first: at, last: at, usd: null, eur: null };
      ads.set(key, a);
      adIdOf.set(key, l.ad_id);
    }
    a.leads += 1;
    if (at < a.first) a.first = at;
    if (at > a.last) a.last = at;
    const cid = contactByRef.get(l.meta_lead_id);
    if (cid) {
      if ((heldBy.get(cid) ?? 0) > 0) a.held += 1;
      if (adContact.get(cid)?.stage === "won") a.won += 1;
    }
  }
  for (const [key, a] of ads) {
    const id = adIdOf.get(key);
    const s = id ? spendByAd.get(id) : undefined;
    if (s) {
      a.usd = Math.round(s.usd * 100) / 100;
      a.eur = Math.round(s.eur * 100) / 100;
    }
  }

  return {
    months: monthList,
    totals: totalsOf(monthList),
    konversii,
    ads: [...ads.values()].sort((a, b) => b.last.localeCompare(a.last)),
    adSpendKnown: spendByAd.size > 0,
    lastSpendDay,
  };
}
