import Link from "next/link";
import {
  LayoutDashboard, Users, Sparkles, Calendar, Inbox, Mail, Megaphone, Target,
  BarChart3, Receipt, SearchCheck, Calculator, Repeat, Satellite, FolderOpen,
  LineChart, Share2, Bot, MessageCircle, Clapperboard, PieChart, Activity, Bell,
  AlertTriangle, CheckCircle2, Star, Phone, Clock, ExternalLink, type LucideIcon,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import {
  CONTACT_STAGES,
  STAGE_COLOR,
  STAGE_LABEL,
  type ContactRow,
  type ContactStage,
} from "@/lib/contacts/types";
import { KpiCard } from "@/components/admin/KpiCard";
import { TelemetryRail } from "@/components/admin/TelemetryRail";
import { RadialGauge } from "@/components/admin/RadialGauge";
import { LiveClock } from "@/components/admin/LiveClock";
import { CommandCore } from "@/components/admin/CommandCore";
import { formatMoney } from "@/lib/crm/labels";
import { PipelineBars } from "@/components/admin/charts/PipelineBars";
import { DonutChart } from "@/components/admin/charts/DonutChart";
import { Sparkline, type SparklinePoint } from "@/components/admin/charts/Sparkline";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const REVENUE_EXCLUDED_STATUSES = new Set(["draft", "cancelled", "excluded"]);

function isBillableInvoice(status: string): boolean {
  return !REVENUE_EXCLUDED_STATUSES.has(status);
}

const SOURCE_PALETTE: Record<string, { label: string; color: string }> = {
  meta_lead: { label: "Meta реклама", color: "#1877F2" },
  website_form: { label: "Сайт", color: "#06b6d4" },
  cal_booking: { label: "Cal.com", color: "#22c55e" },
  email: { label: "Имейл", color: "#a78bfa" },
  manual: { label: "Ръчно", color: "#facc15" },
  oferta: { label: "Оферта линк", color: "#ec4899" },
  presentation: { label: "Презентация", color: "#fb923c" },
};

function sourceMeta(source: string) {
  return SOURCE_PALETTE[source] ?? { label: source, color: "#64748b" };
}

const NAV_ICON: Record<string, LucideIcon> = {
  "/admin/clients": Users,
  "/admin/new-leads": Sparkles,
  "/admin/bookings": Calendar,
  "/admin/leads": Inbox,
  "/admin/email": Mail,
  "/admin/ads": Megaphone,
  "/admin/follow-up": Target,
  "/admin/accounting": BarChart3,
  "/admin/invoices": Receipt,
  "/admin/manual-review": SearchCheck,
  "/admin/expenses": Calculator,
  "/admin/recurring": Repeat,
  "/admin/gps": Satellite,
  "/admin/documents": FolderOpen,
  "/admin/meta-ads": LineChart,
  "/admin/social": Share2,
  "/admin/chatbots": Bot,
  "/admin/whatsapp": MessageCircle,
  "/admin/demo": Clapperboard,
};

// Build a YYYY-MM-DD bucket key in local time (Sofia). Avoids the "midnight
// UTC shifts to 02:00 local" off-by-one for activity timestamps near midnight.
function dayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildSparkline(activities: { occurred_at: string }[], days: number): SparklinePoint[] {
  const buckets = new Map<string, number>();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    buckets.set(dayKey(d.toISOString()), 0);
  }
  for (const a of activities) {
    const k = dayKey(a.occurred_at);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, value]) => ({ date, value }));
}

export default async function AdminDashboard() {
  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();
  const nowMs = new Date().getTime();
  const sevenAgo = new Date(nowMs - 7 * DAY_MS).toISOString();
  const fourteenAgo = new Date(nowMs - 14 * DAY_MS).toISOString();
  const thirtyAgo = new Date(nowMs - 30 * DAY_MS).toISOString();
  const sixtyAgo = new Date(nowMs - 60 * DAY_MS).toISOString();
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const startOfYearIso = startOfYear.toISOString();
  const startOfYearDate = startOfYearIso.slice(0, 10);

  // Auto-promote stale confirmed bookings → completed (also covers the admin
  // overview when nobody opened /admin/bookings recently).
  await supabase
    .from("bookings")
    .update({ status: "completed", updated_at: nowIso })
    .eq("status", "confirmed")
    .lt("scheduled_at", nowIso);

  const [contactsRes, activitiesRes, bookingsRes, metaLeadsRes, invoicesRes, manualReviewRes, paymentsRes, expensesRes, metaReportsRes, gpsRes, recurringRes] = await Promise.all([
    supabase.from("contacts").select("*").order("updated_at", { ascending: false }),
    supabase
      .from("contact_activities")
      .select("activity_type, occurred_at, contact_id")
      .gte("occurred_at", sixtyAgo)
      .order("occurred_at", { ascending: false }),
    supabase.from("bookings").select("id, status, scheduled_at, attendee_name, attendee_email, business, meeting_url"),
    supabase.from("meta_leads").select("id, processed, created_at"),
    supabase.from("invoices").select("id, status, amount_gross, due_date, issue_date, contact_id, invoice_type, service_type, currency"),
    supabase.from("manual_review_items").select("id").in("status", ["open", "needs_user", "blocked"]),
    supabase.from("payments").select("amount, paid_at, created_at, match_status"),
    supabase.from("expenses").select("amount_gross, status, expense_date, created_at"),
    supabase
      .from("meta_ads_reports")
      .select("report_date, spend, leads, cpl, currency, raw")
      .gte("report_date", startOfYearDate)
      .order("report_date", { ascending: false }),
    supabase.from("gps_devices").select("status, monthly_fee, currency"),
    supabase.from("recurring_services").select("active, amount, currency, billing_period"),
  ]);

  const allContacts = (contactsRes.data ?? []) as ContactRow[];
  const active = allContacts.filter((c) => c.stage !== "lost");
  const allActivities = (activitiesRes.data ?? []) as Array<{ activity_type: string; occurred_at: string; contact_id: string }>;
  const allBookings = (bookingsRes.data ?? []) as Array<{
    id: string;
    status: string;
    scheduled_at: string;
    attendee_name: string;
    attendee_email: string;
    business: string | null;
    meeting_url: string | null;
  }>;
  const metaLeads = (metaLeadsRes.data ?? []) as Array<{ id: string; processed: boolean | null; created_at: string }>;
  const invoices = (invoicesRes.data ?? []) as Array<{
    id: string;
    status: string;
    amount_gross: number | null;
    due_date: string | null;
    issue_date: string | null;
    contact_id: string | null;
    invoice_type: string;
    service_type: string | null;
    currency: string;
  }>;
  const payments = (paymentsRes.data ?? []) as Array<{ amount: number | null; paid_at: string | null; created_at: string; match_status: string }>;
  const expenses = (expensesRes.data ?? []) as Array<{ amount_gross: number | null; status: string; expense_date: string | null; created_at: string | null }>;
  const metaReports = ((metaReportsRes.data ?? []) as Array<{ report_date: string; spend: number | null; leads: number | null; cpl: number | null; currency: string; raw?: Record<string, unknown> | null }>).filter((r) => r.raw?.audit_status !== "archived_duplicate" && r.currency !== "MIXED");
  const gpsDevices = (gpsRes.data ?? []) as Array<{ status: string; monthly_fee: number | null; currency: string }>;
  const recurringServices = (recurringRes.data ?? []) as Array<{ active: boolean | null; amount: number | null; currency: string; billing_period: string | null }>;

  // ── Pipeline distribution ──────────────────────────────────────────────
  const byStage = new Map<ContactStage, ContactRow[]>();
  for (const s of CONTACT_STAGES) byStage.set(s, []);
  for (const c of active) byStage.get(c.stage)?.push(c);
  const pipelineSegments = (
    ["won", "negotiating", "offer_sent", "presentation_sent", "discovery", "contacted", "lead"] as ContactStage[]
  ).map((s) => ({ stage: s, count: byStage.get(s)?.length ?? 0 }));

  // ── KPI: active contacts + 7d delta ────────────────────────────────────
  const createdLast7 = active.filter((c) => c.created_at >= sevenAgo).length;
  const createdPrev7 = active.filter((c) => c.created_at >= fourteenAgo && c.created_at < sevenAgo).length;
  const activeDelta = createdLast7 - createdPrev7;

  // ── KPI: Conversion ────────────────────────────────────────────────────
  const reachedContacted = allContacts.filter((c) =>
    ["contacted", "discovery", "presentation_sent", "offer_sent", "negotiating", "won"].includes(c.stage)
  ).length;
  const wonCount = allContacts.filter((c) => c.stage === "won").length;
  const conversionPct = reachedContacted > 0 ? Math.round((wonCount / reachedContacted) * 100) : 0;

  // ── KPI: Deal value pipeline ───────────────────────────────────────────
  const pipelineEur = active
    .filter((c) => ["offer_sent", "negotiating", "presentation_sent"].includes(c.stage))
    .reduce((sum, c) => sum + (Number(c.deal_value_eur) || 0), 0);
  const wonEur = allContacts
    .filter((c) => c.stage === "won")
    .reduce((sum, c) => sum + (Number(c.deal_value_eur) || 0), 0);

  // ── KPI: Срещи ─────────────────────────────────────────────────────────
  const upcomingBookings = allBookings.filter(
    (b) => b.status !== "cancelled" && b.scheduled_at >= nowIso
  );
  const completedThisMonth = allBookings.filter((b) => {
    if (b.status !== "completed") return false;
    const d = new Date(b.scheduled_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const completedPrevMonth = allBookings.filter((b) => {
    if (b.status !== "completed") return false;
    const d = new Date(b.scheduled_at);
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
  }).length;
  const bookingsDelta = completedThisMonth - completedPrevMonth;

  // ── KPI: Имейли пратени ────────────────────────────────────────────────
  const emailsLast7 = allActivities.filter(
    (a) => a.activity_type === "email_sent" && a.occurred_at >= sevenAgo
  ).length;
  const emailsPrev7 = allActivities.filter(
    (a) => a.activity_type === "email_sent" && a.occurred_at >= fourteenAgo && a.occurred_at < sevenAgo
  ).length;
  const emailsDelta = emailsLast7 - emailsPrev7;

  // ── KPI: Просрочени followup-и ─────────────────────────────────────────
  const heardSinceDue = (c: ContactRow) =>
    !!c.last_heard_from_at && !!c.next_followup_at && c.last_heard_from_at >= c.next_followup_at;
  const overdueFollowups = active
    .filter((c) => {
      if (!c.next_followup_at) return false;
      if (c.next_followup_at >= new Date(nowMs - DAY_MS).toISOString()) return false;
      // requirement #7 — not overdue if Ivailo has already heard from them.
      if (heardSinceDue(c)) return false;
      return true;
    })
    .sort((a, b) => (a.next_followup_at! > b.next_followup_at! ? 1 : -1));

  // ── Today/Tomorrow agenda ──────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(today.getTime() + 2 * DAY_MS);
  const todayTomorrowBookings = upcomingBookings
    .filter((b) => new Date(b.scheduled_at) < tomorrowEnd)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const todayTomorrowFollowups = active
    .filter((c) => {
      if (!c.next_followup_at) return false;
      const t = new Date(c.next_followup_at).getTime();
      return t >= today.getTime() && t < tomorrowEnd.getTime();
    })
    .sort((a, b) => (a.next_followup_at! > b.next_followup_at! ? 1 : -1));

  // ── Daily focus widget ─────────────────────────────────────────────────
  const startTomorrow = new Date(today.getTime() + DAY_MS);
  const needToHearToday = active.filter(
    (c) => c.next_followup_at && new Date(c.next_followup_at) < startTomorrow && !heardSinceDue(c)
  ).length;
  const offerSentCount = active.filter(
    (c) => c.stage === "offer_sent" || c.followup_status === "sent_offer"
  ).length;
  const presentationSentCount = active.filter(
    (c) => c.stage === "presentation_sent" || c.followup_status === "sent_presentation"
  ).length;
  const awaitingPaymentCount = invoices.filter((i) =>
    ["sent", "awaiting_payment", "partially_paid", "overdue"].includes(i.status)
  ).length;
  const manualReviewOpen = (manualReviewRes.data ?? []).length;

  // ── Accounting + Meta (YTD за обединения Преглед) ──────────────────────
  const isYtd = (iso: string | null | undefined) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d >= startOfYear && d <= new Date(nowIso);
  };
  const isGpsInvoice = (i: { invoice_type: string; service_type: string | null }) =>
    i.invoice_type === "gps_fee" || /gps/i.test(i.service_type ?? "");
  const ytdInvoices = invoices.filter((i) => isYtd(i.issue_date) && isBillableInvoice(i.status));
  const revenueYtd = ytdInvoices.reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);
  const receivedYtd = payments
    .filter((p) => p.match_status !== "ignored" && isYtd(p.paid_at ?? p.created_at))
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const expensesYtd = expenses
    .filter((e) => e.status !== "cancelled" && isYtd(e.expense_date ?? e.created_at))
    .reduce((s, e) => s + (Number(e.amount_gross) || 0), 0);
  const profitYtd = receivedYtd - expensesYtd;
  const unpaidInvoicesTotal = invoices
    .filter((i) => ["sent", "awaiting_payment", "partially_paid", "overdue"].includes(i.status))
    .reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);
  const gpsInvoicesYtd = ytdInvoices.filter(isGpsInvoice);
  const gpsRevenueYtd = gpsInvoicesYtd.reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);
  const gpsOpenYtd = gpsInvoicesYtd.filter((i) => ["sent", "awaiting_payment", "partially_paid", "overdue"].includes(i.status)).length;
  const metaSpendByCurrency = metaReports.reduce((acc, r) => {
    const cur = r.currency || "EUR";
    acc[cur] = (acc[cur] ?? 0) + (Number(r.spend) || 0);
    return acc;
  }, {} as Record<string, number>);
  const metaSpendHint = Object.entries(metaSpendByCurrency).map(([cur, amount]) => formatMoney(amount, cur)).join(" + ") || "—";
  const metaLeadsYtd = metaReports.reduce((s, r) => s + (Number(r.leads) || 0), 0);

  // ── Повтарящ се приход (MRR): GPS устройства + Абонаменти ───────────────
  const gpsActive = gpsDevices.filter((d) => d.status === "active");
  const gpsMrr = gpsActive.reduce((s, d) => s + (Number(d.monthly_fee) || 0), 0);
  const subsActive = recurringServices.filter((r) => r.active !== false);
  const monthlyEquivalent = (amount: number, period: string | null) => {
    if (period === "yearly" || period === "annual") return amount / 12;
    if (period === "quarterly") return amount / 3;
    if (period === "weekly") return amount * 4.33;
    return amount; // monthly / null
  };
  const subsMrr = subsActive.reduce((s, r) => s + monthlyEquivalent(Number(r.amount) || 0, r.billing_period), 0);
  const totalMrr = gpsMrr + subsMrr;

  // ── Lead sources donut ─────────────────────────────────────────────────
  const sourceCounts = new Map<string, number>();
  for (const c of active) {
    sourceCounts.set(c.source, (sourceCounts.get(c.source) ?? 0) + 1);
  }
  const sourceSlices = Array.from(sourceCounts.entries())
    .map(([source, value]) => ({
      label: sourceMeta(source).label,
      color: sourceMeta(source).color,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  // ── Activity 30d sparkline ─────────────────────────────────────────────
  const last30 = allActivities.filter((a) => a.occurred_at >= thirtyAgo);
  const activitySparkline = buildSparkline(last30, 30);

  // ── Top opportunities ──────────────────────────────────────────────────
  const topOpportunities = active
    .filter((c) => ["presentation_sent", "offer_sent", "negotiating"].includes(c.stage))
    .sort((a, b) => {
      const va = Number(a.deal_value_eur) || 0;
      const vb = Number(b.deal_value_eur) || 0;
      if (va !== vb) return vb - va;
      return a.updated_at < b.updated_at ? 1 : -1;
    })
    .slice(0, 5);

  // ── Raw Meta leads waiting ─────────────────────────────────────────────
  const unprocessedMetaLeads = metaLeads.filter((l) => !l.processed).length;

  // ── Date label ─────────────────────────────────────────────────────────
  const todayLabel = new Date().toLocaleDateString("bg-BG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const newLeads72h = active.filter(
    (c) => c.created_at >= new Date(nowMs - 72 * 3600 * 1000).toISOString()
  ).length;

  const marginPct = receivedYtd > 0 ? Math.round((profitYtd / receivedYtd) * 100) : 0;
  const pipelineShare =
    pipelineEur + wonEur > 0 ? Math.round((pipelineEur / (pipelineEur + wonEur)) * 100) : 0;

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-7 p-5 md:p-10">
        {/* ─── Command-center header ──────────────────────────────────── */}
        <header className="cc-panel cc-panel-accent relative overflow-hidden p-6 md:p-7">
          <div className="cc-trace" aria-hidden />
          <CommandCore />
          <div className="relative z-[1]">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Команден център</p>
              <h1 className="cc-title mt-2 font-display text-4xl font-bold md:text-5xl">Преглед на CRM</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <span className="cc-livedot" />
                <span className="hud text-emerald-300">SYSTEM ONLINE</span>
                <span className="hud text-[var(--color-text-tertiary)]">·</span>
                <LiveClock />
                <span className="hud text-[var(--color-text-tertiary)]">·</span>
                <span className="font-mono text-[11px] capitalize text-[var(--color-text-secondary)]">{todayLabel}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/clients" className="cc-btn cc-btn-primary"><Users className="h-4 w-4" strokeWidth={2} /> Всички клиенти</Link>
              <Link href="/admin/bookings" className="cc-btn"><Calendar className="h-4 w-4" strokeWidth={1.75} /> Срещи · {upcomingBookings.length}</Link>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="cc-chip"><span style={{ color: "#06b6d4" }}>●</span> Активни <b>{active.length}</b></span>
            <span className="cc-chip"><span style={{ color: "#facc15" }}>●</span> Pipeline <b>€{pipelineEur.toLocaleString("bg-BG")}</b></span>
            <span className="cc-chip"><span style={{ color: needToHearToday > 0 ? "#ef4444" : "#22c55e" }}>●</span> За чуване днес <b>{needToHearToday}</b></span>
            <span className="cc-chip"><span style={{ color: overdueFollowups.length > 0 ? "#ef4444" : "#22c55e" }}>●</span> Просрочени <b>{overdueFollowups.length}</b></span>
            <span className="cc-chip"><span style={{ color: "#22c55e" }}>●</span> Получени YTD <b>{formatMoney(receivedYtd)}</b></span>
          </div>
          <TelemetryRail nodes={active.length} />
          </div>
        </header>

        {/* ─── Instrument cluster (radial gauges) ──────────────────────── */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RadialGauge pct={conversionPct} display={`${conversionPct}%`} label="Конверсия" color="#34d399" />
          <RadialGauge pct={marginPct} display={`${marginPct}%`} label="YTD Марж" color="#22d3ee" />
          <RadialGauge pct={pipelineShare} display={`€${pipelineEur.toLocaleString("bg-BG")}`} label="Pipeline активен" color="#facc15" />
        </section>

        {/* ─── Daily focus ─────────────────────────────────────────────── */}
        <section>
          <h2 className="hud mb-3">Днес</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Днес ги чуй" value={needToHearToday} hint="просрочени + днешни, още не чути" color={needToHearToday > 0 ? "#ef4444" : "#22c55e"} href="/admin/follow-up" />
            <KpiCard label="Оферта изпратена" value={offerSentCount} hint="чакат решение" color="#facc15" href="/admin/follow-up" />
            <KpiCard label="Презентация изпратена" value={presentationSentCount} hint="чакат фийдбек" color="#ec4899" href="/admin/follow-up" />
            <KpiCard label="Чакаме плащане" value={awaitingPaymentCount} hint="неплатени фактури" color="#06b6d4" href="/admin/invoices" />
          </div>
        </section>

        {/* ─── Счетоводство YTD ────────────────────────────────────────── */}
        <section>
          <h2 className="hud mb-3">Счетоводство · от началото на годината</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="Приход" value={formatMoney(revenueYtd)} hint={`от ${startOfYearDate}`} color="#facc15" href="/admin/accounting" />
            <KpiCard label="Получени" value={formatMoney(receivedYtd)} hint="YTD плащания" color="#22c55e" href="/admin/payments" />
            <KpiCard label="Повтарящ се / мес" value={formatMoney(totalMrr)} hint={`GPS ${formatMoney(gpsMrr)} · абонаменти ${formatMoney(subsMrr)}`} color="#14b8a6" href="/admin/recurring" />
            <KpiCard label="Разходи" value={formatMoney(expensesYtd)} hint="YTD разходи" color="#fb923c" href="/admin/expenses" />
            <KpiCard label="Печалба" value={formatMoney(profitYtd)} hint="YTD получени − разходи" color={profitYtd >= 0 ? "#22c55e" : "#ef4444"} href="/admin/accounting" />
            <KpiCard label="Неплатени" value={formatMoney(unpaidInvoicesTotal)} hint="чакащи фактури" color="#fb923c" href="/admin/invoices" />
            <KpiCard label="GPS YTD" value={formatMoney(gpsRevenueYtd)} hint={`${gpsInvoicesYtd.length} фактури · ${gpsOpenYtd} чакат`} color="#06b6d4" href="/admin/gps" />
            <KpiCard label="Meta лидове YTD" value={metaLeadsYtd || "—"} hint={`Разход: ${metaSpendHint} · отделни валути`} color="#1877F2" href="/admin/meta-ads" />
          </div>
        </section>

        {/* ─── Ключови метрики ─────────────────────────────────────────── */}
        <section>
          <h2 className="hud mb-3">Ключови метрики</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Активни клиенти" value={active.length} hint={`нови 7д · общо ${allContacts.length}`} delta={activeDelta} color="#06b6d4" href="/admin/clients" />
            <KpiCard label="Превърнати в сделка" value={`${conversionPct}%`} hint={`${wonCount} спечелени от ${reachedContacted}`} color="#22c55e" />
            <KpiCard label="Pipeline стойност" value={`€${pipelineEur.toLocaleString("bg-BG")}`} hint={`оферти + преговори · спечелени €${wonEur.toLocaleString("bg-BG")}`} color="#facc15" />
            <KpiCard label="Срещи този месец" value={completedThisMonth} hint={`предстоящи ${upcomingBookings.length}`} delta={bookingsDelta} color="#a78bfa" href="/admin/bookings" />
            <KpiCard label="Имейли 7 дни" value={emailsLast7} hint="пратени към клиенти" delta={emailsDelta} color="#ec4899" href="/admin/email" />
            <KpiCard label="Просрочени" value={overdueFollowups.length} hint={overdueFollowups.length > 0 ? "нужно действие" : "всичко чисто"} color={overdueFollowups.length > 0 ? "#ef4444" : "#22c55e"} />
          </div>
        </section>

        {/* ─── Визуализации ────────────────────────────────────────────── */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="cc-panel p-5">
            <p className="hud-tag mb-2.5">{"// PIPELINE.01"}</p>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold"><BarChart3 className="h-4 w-4 text-[var(--color-accent-cyan)]" strokeWidth={1.75} /> Етапи на сделките</h3>
              <span className="hud">{active.length} активни</span>
            </div>
            <PipelineBars segments={pipelineSegments} />
          </div>

          <div className="cc-panel p-5">
            <p className="hud-tag mb-2.5">{"// SOURCES.02"}</p>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold"><PieChart className="h-4 w-4 text-[var(--color-accent-cyan)]" strokeWidth={1.75} /> Източници на лидове</h3>
              <span className="hud">всичко</span>
            </div>
            {sourceSlices.length > 0 ? (
              <DonutChart slices={sourceSlices} centerValue={String(active.length)} centerLabel="лидове" />
            ) : (
              <p className="text-sm text-[var(--color-text-tertiary)]">Няма данни още</p>
            )}
          </div>

          <div className="cc-panel p-5">
            <p className="hud-tag mb-2.5">{"// ACTIVITY.03"}</p>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold"><Activity className="h-4 w-4 text-[var(--color-accent-cyan)]" strokeWidth={1.75} /> Активност · 30 дни</h3>
              <span className="hud">{last30.length} действия</span>
            </div>
            <p className="mb-3 text-[11px] text-[var(--color-text-tertiary)]">
              Имейли, разговори, бележки, срещи — всичко по дни
            </p>
            <Sparkline points={activitySparkline} color="#06b6d4" height={80} showAxis />
            <div className="mt-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-tertiary)]">
              <span>{new Date(nowMs - 30 * DAY_MS).toLocaleDateString("bg-BG", { day: "2-digit", month: "short" })}</span>
              <span>днес</span>
            </div>
          </div>
        </section>

        {/* ─── Днес / Утре + Просрочени ────────────────────────────────── */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="cc-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold"><Bell className="h-4 w-4 text-[var(--color-accent-cyan)]" strokeWidth={1.75} /> Днес и утре</h3>
              <span className="hud">{todayTomorrowBookings.length + todayTomorrowFollowups.length} ангажимента</span>
            </div>
            {todayTomorrowBookings.length === 0 && todayTomorrowFollowups.length === 0 ? (
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Свободен график — добра възможност за outreach.
              </p>
            ) : (
              <div className="space-y-2">
                {todayTomorrowBookings.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <Calendar className="h-4 w-4 shrink-0 text-emerald-300" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{b.attendee_name}</p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{b.business ?? b.attendee_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-emerald-300">{formatBookingTime(b.scheduled_at)}</p>
                      {b.meeting_url && (
                        <a href={b.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[var(--color-accent-cyan)] hover:underline">
                          отвори <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {todayTomorrowFollowups.map((c) => (
                  <Link key={c.id} href={`/admin/clients/${c.id}`} className="flex items-center gap-3 rounded-lg border border-[var(--color-border-default)] bg-black/20 p-3 transition hover:border-[var(--color-accent-cyan)]/40">
                    <Phone className="h-4 w-4 shrink-0 text-[var(--color-accent-cyan)]" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{c.full_name || c.email || "—"}</p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{c.company ?? STAGE_LABEL[c.stage]}</p>
                    </div>
                    <p className="text-xs font-mono text-[var(--color-accent-cyan)]">{formatFollowup(c.next_followup_at!)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className={`cc-panel p-5 ${overdueFollowups.length > 0 ? "!border-red-500/35" : ""}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                {overdueFollowups.length > 0 ? (
                  <><AlertTriangle className="h-4 w-4 text-red-400" strokeWidth={1.75} /> Просрочени</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 text-emerald-400" strokeWidth={1.75} /> Всичко чисто</>
                )}
              </h3>
              <span className="hud">{overdueFollowups.length} клиента</span>
            </div>
            {overdueFollowups.length === 0 ? (
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Няма просрочени follow-up. Продължавай в същия дух.
              </p>
            ) : (
              <div className="space-y-2">
                {overdueFollowups.slice(0, 5).map((c) => (
                  <Link key={c.id} href={`/admin/clients/${c.id}`} className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 transition hover:bg-red-500/20">
                    <Clock className="h-4 w-4 shrink-0 text-red-300" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{c.full_name || c.email || "—"}</p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{STAGE_LABEL[c.stage]} · {c.company ?? "—"}</p>
                    </div>
                    <p className="text-xs font-mono text-red-300">{formatFollowup(c.next_followup_at!)}</p>
                  </Link>
                ))}
                {overdueFollowups.length > 5 && (
                  <Link href="/admin/clients" className="block py-2 text-center text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-cyan)]">
                    Виж всички {overdueFollowups.length} →
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ─── Топ възможности ─────────────────────────────────────────── */}
        {topOpportunities.length > 0 && (
          <section className="cc-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold"><Star className="h-4 w-4 text-[var(--color-accent-cyan)]" strokeWidth={1.75} /> Топ възможности</h3>
              <span className="hud">най-близо до сделка</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              {topOpportunities.map((c) => (
                <Link key={c.id} href={`/admin/clients/${c.id}`} className="cc-navcard block p-3">
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-wider" style={{ color: STAGE_COLOR[c.stage] }}>
                    {STAGE_LABEL[c.stage]}
                  </p>
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{c.full_name || c.email || "—"}</p>
                  {c.company && <p className="truncate text-[11px] text-[var(--color-text-tertiary)]">{c.company}</p>}
                  {c.deal_value_eur != null && Number(c.deal_value_eur) > 0 && (
                    <p className="mt-2 font-mono text-sm font-bold text-emerald-300">
                      €{Number(c.deal_value_eur).toLocaleString("bg-BG")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── Бърза навигация ─────────────────────────────────────────── */}
        <section className="space-y-6">
          <div>
            <h2 className="hud mb-3">CRM ядро</h2>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              <NavCard href="/admin/clients" label="Клиенти" hint="всички контакти" />
              <NavCard href="/admin/new-leads" label="Нови лидове" hint={`72ч · ${newLeads72h}`} />
              <NavCard href="/admin/bookings" label="Срещи" hint={`${upcomingBookings.length} предстоящи`} />
              <NavCard href="/admin/leads" label="Meta лидове" hint={unprocessedMetaLeads > 0 ? `${unprocessedMetaLeads} необработени` : "обработени"} />
              <NavCard href="/admin/email" label="Имейли" hint="прати към клиент" />
              <NavCard href="/admin/ads" label="Реклами" hint="Meta кампании" />
            </div>
          </div>

          <div>
            <h2 className="hud mb-3">Продажби и счетоводство</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <NavCard href="/admin/follow-up" label="Sales follow-up" hint={needToHearToday > 0 ? `${needToHearToday} за чуване днес` : "всичко чисто"} />
              <NavCard href="/admin/accounting" label="Счетоводно табло" hint="приходи и плащания" />
              <NavCard href="/admin/invoices" label="Фактури" hint={awaitingPaymentCount > 0 ? `${awaitingPaymentCount} чакат плащане` : "всичко платено"} />
              <NavCard href="/admin/manual-review" label="Ръчна проверка" hint={manualReviewOpen > 0 ? `${manualReviewOpen} отворени` : "чисто"} />
              <NavCard href="/admin/expenses" label="Разходи" hint="към доставчици" />
              <NavCard href="/admin/recurring" label="Абонаменти" hint={subsActive.length > 0 ? `${subsActive.length} активни · ${formatMoney(subsMrr)}/мес` : "месечни услуги"} />
              <NavCard href="/admin/gps" label="GPS устройства" hint={gpsActive.length > 0 ? `${gpsActive.length} активни · ${formatMoney(gpsMrr)}/мес` : "монтажи, история"} />
              <NavCard href="/admin/documents" label="Документи" hint="фактури, OCR" />
              <NavCard href="/admin/meta-ads" label="Meta анализ" hint="реклами днес" />
            </div>
          </div>

          <div>
            <h2 className="hud mb-3">Канали и автоматизация</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <NavCard href="/admin/social" label="Социални мрежи" hint="скелет · готов за свързване" />
              <NavCard href="/admin/chatbots" label="Чатботове" hint="база знания + сесии" />
              <NavCard href="/admin/whatsapp" label="WhatsApp" hint="inbox · очаква верификация" />
              <NavCard href="/admin/demo" label="Demo за клиенти" hint="публични мостри" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function NavCard({ href, label, hint }: { href: string; label: string; hint: string }) {
  const Icon = NAV_ICON[href] ?? LayoutDashboard;
  return (
    <Link href={href} className="cc-navcard block p-4">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-white/[0.03] text-[var(--color-accent-cyan)]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="mt-3 text-sm font-bold text-[var(--color-text-primary)]">{label}</p>
      <p className="text-[10px] text-[var(--color-text-tertiary)]">{hint}</p>
    </Link>
  );
}

function formatBookingTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tgt = new Date(d);
  tgt.setHours(0, 0, 0, 0);
  const diff = Math.floor((tgt.getTime() - today.getTime()) / DAY_MS);
  const time = d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return `днес ${time}`;
  if (diff === 1) return `утре ${time}`;
  return `${d.toLocaleDateString("bg-BG", { day: "2-digit", month: "short" })} ${time}`;
}

function formatFollowup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tgt = new Date(d);
  tgt.setHours(0, 0, 0, 0);
  const diff = Math.floor((tgt.getTime() - today.getTime()) / DAY_MS);
  const time = d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return `днес ${time}`;
  if (diff === 1) return `утре ${time}`;
  if (diff === -1) return `вчера ${time}`;
  if (diff < 0) return `преди ${Math.abs(diff)} дни`;
  return d.toLocaleDateString("bg-BG", { day: "2-digit", month: "short" }) + " " + time;
}
