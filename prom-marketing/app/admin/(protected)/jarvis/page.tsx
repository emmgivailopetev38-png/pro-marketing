import { createServiceClient } from "@/lib/supabase/service";
import type { ContactRow } from "@/lib/contacts/types";
import { JarvisDeck, type JarvisBriefing } from "@/components/admin/JarvisDeck";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const REVENUE_EXCLUDED_STATUSES = new Set(["draft", "cancelled", "excluded"]);

export default async function AdminJarvisPage() {
  const supabase = createServiceClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const sevenAgo = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const startOfYearIso = new Date(now.getFullYear(), 0, 1).toISOString();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday.getTime() + DAY_MS);

  const [contactsRes, bookingsRes, invoicesRes, offersRes, paymentsRes, metaLeadsRes, manualReviewRes] =
    await Promise.all([
      supabase.from("contacts").select("id, stage, deal_value_eur, next_followup_at, created_at, full_name"),
      supabase
        .from("bookings")
        .select("id, status, scheduled_at, attendee_name")
        .gte("scheduled_at", startOfToday.toISOString())
        .lt("scheduled_at", endOfToday.toISOString()),
      supabase.from("invoices").select("id, status, amount_gross"),
      supabase.from("offers").select("status, amount_gross"),
      supabase.from("payments").select("amount, paid_at").gte("paid_at", startOfYearIso),
      supabase.from("meta_leads").select("id").eq("processed", false),
      supabase.from("manual_review_items").select("id").in("status", ["open", "needs_user", "blocked"]),
    ]);

  const contacts = (contactsRes.data ?? []) as Pick<
    ContactRow,
    "id" | "stage" | "deal_value_eur" | "next_followup_at" | "created_at" | "full_name"
  >[];
  const active = contacts.filter((c) => c.stage !== "lost");
  const overdueFollowups = contacts.filter(
    (c) =>
      c.stage !== "lost" &&
      c.stage !== "won" &&
      c.next_followup_at !== null &&
      new Date(c.next_followup_at) <= now
  );
  const newLeads7d = contacts.filter(
    (c) => c.created_at && new Date(c.created_at).toISOString() >= sevenAgo
  ).length;
  const pipelineValue = contacts
    .filter((c) => c.stage !== "lost" && c.stage !== "won")
    .reduce((s, c) => s + (Number(c.deal_value_eur) || 0), 0);

  const bookingsToday = ((bookingsRes.data ?? []) as Array<{ status: string; scheduled_at: string; attendee_name: string }>)
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const invoices = (invoicesRes.data ?? []) as Array<{ status: string; amount_gross: number | null }>;
  const unpaid = invoices.filter(
    (i) => !REVENUE_EXCLUDED_STATUSES.has(i.status) && i.status !== "paid"
  );
  const unpaidSum = unpaid.reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);

  const offers = (offersRes.data ?? []) as Array<{ status: string; amount_gross: number | null }>;
  const openOffers = offers.filter((o) => o.status === "sent" || o.status === "viewed");
  const openOffersSum = openOffers.reduce((s, o) => s + (Number(o.amount_gross) || 0), 0);

  const receivedYtd = ((paymentsRes.data ?? []) as Array<{ amount: number | null }>).reduce(
    (s, p) => s + (Number(p.amount) || 0),
    0
  );

  const briefing: JarvisBriefing = {
    generatedAt: nowIso,
    activeClients: active.length,
    newLeads7d,
    overdueFollowups: overdueFollowups.length,
    overdueNames: overdueFollowups.slice(0, 3).map((c) => c.full_name ?? "—"),
    bookingsToday: bookingsToday.length,
    nextBooking: bookingsToday[0]
      ? { name: bookingsToday[0].attendee_name, at: bookingsToday[0].scheduled_at }
      : null,
    pipelineValue,
    openOffers: openOffers.length,
    openOffersSum,
    unpaidInvoices: unpaid.length,
    unpaidSum,
    receivedYtd,
    metaUnprocessed: (metaLeadsRes.data ?? []).length,
    manualReview: (manualReviewRes.data ?? []).length,
  };

  return <JarvisDeck briefing={briefing} />;
}
