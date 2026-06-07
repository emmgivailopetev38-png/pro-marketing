// Compact, live snapshot of CRM state — fed to the AI co-pilot as grounding
// knowledge so it answers with real numbers and names, not guesses.
import { createServiceClient } from "@/lib/supabase/service";
import { STAGE_LABEL, type ContactStage } from "@/lib/contacts/types";
import { formatMoney } from "@/lib/crm/labels";

const DAY = 86400000;
const PIPE_STAGES = ["offer_sent", "negotiating", "presentation_sent"];
const UNPAID = ["sent", "awaiting_payment", "partially_paid", "overdue"];

type C = {
  full_name: string | null;
  email: string | null;
  company: string | null;
  stage: ContactStage;
  deal_value_eur: number | null;
  next_followup_at: string | null;
  last_heard_from_at: string | null;
  created_at: string;
};

export async function buildCrmSnapshot(): Promise<string> {
  const supabase = createServiceClient();
  const now = Date.now();
  const soyMs = new Date(new Date().getFullYear(), 0, 1).getTime();
  const isYtd = (iso?: string | null) => !!iso && new Date(iso).getTime() >= soyMs;

  const [contactsRes, invoicesRes, paymentsRes, bookingsRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("full_name,email,company,stage,deal_value_eur,next_followup_at,last_heard_from_at,created_at"),
    supabase.from("invoices").select("status,amount_gross"),
    supabase.from("payments").select("amount,paid_at,created_at,match_status"),
    supabase.from("bookings").select("status,scheduled_at,attendee_name,business"),
  ]);

  const contacts = (contactsRes.data ?? []) as C[];
  const active = contacts.filter((c) => c.stage !== ("lost" as ContactStage));
  const new7 = active.filter((c) => now - new Date(c.created_at).getTime() < 7 * DAY).length;
  const pipeline = active
    .filter((c) => PIPE_STAGES.includes(c.stage))
    .reduce((s, c) => s + (Number(c.deal_value_eur) || 0), 0);
  const won = contacts
    .filter((c) => c.stage === ("won" as ContactStage))
    .reduce((s, c) => s + (Number(c.deal_value_eur) || 0), 0);

  const heard = (c: C) =>
    !!c.last_heard_from_at && !!c.next_followup_at && c.last_heard_from_at >= c.next_followup_at;
  const overdue = active
    .filter((c) => c.next_followup_at && new Date(c.next_followup_at).getTime() < now - DAY && !heard(c))
    .sort((a, b) => (a.next_followup_at! > b.next_followup_at! ? 1 : -1));
  const stMidnight = new Date();
  stMidnight.setHours(0, 0, 0, 0);
  const startTomorrowMs = stMidnight.getTime() + DAY;
  const hearToday = active.filter(
    (c) => c.next_followup_at && new Date(c.next_followup_at).getTime() < startTomorrowMs && !heard(c)
  );
  const topOpps = active
    .filter((c) => PIPE_STAGES.includes(c.stage))
    .sort((a, b) => (Number(b.deal_value_eur) || 0) - (Number(a.deal_value_eur) || 0))
    .slice(0, 5);

  const invoices = (invoicesRes.data ?? []) as Array<{ status: string; amount_gross: number | null }>;
  const unpaid = invoices.filter((i) => UNPAID.includes(i.status));
  const unpaidTotal = unpaid.reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);
  const payments = (paymentsRes.data ?? []) as Array<{ amount: number | null; paid_at: string | null; created_at: string; match_status: string }>;
  const receivedYtd = payments
    .filter((p) => p.match_status !== "ignored" && isYtd(p.paid_at ?? p.created_at))
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const bookings = (bookingsRes.data ?? []) as Array<{ status: string; scheduled_at: string; attendee_name: string; business: string | null }>;
  const upcoming = bookings
    .filter((b) => b.status !== "cancelled" && new Date(b.scheduled_at).getTime() >= now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .slice(0, 5);

  const daysAgo = (iso: string) => Math.floor((now - new Date(iso).getTime()) / DAY);
  const nm = (c: C) => c.full_name || c.email || "—";
  const L: string[] = [];
  L.push("ЖИВА СНИМКА НА CRM (актуална):");
  L.push(`- Активни контакти: ${active.length} (нови за 7 дни: ${new7}); общо в базата: ${contacts.length}`);
  L.push(`- Pipeline стойност (оферти+преговори): ${formatMoney(pipeline)}; Спечелени общо: ${formatMoney(won)}`);
  L.push(`- Получени плащания тази година: ${formatMoney(receivedYtd)}`);
  L.push(`- Неплатени фактури: ${unpaid.length} бр. на стойност ${formatMoney(unpaidTotal)}`);
  L.push(`- За чуване днес: ${hearToday.length}; Просрочени follow-up: ${overdue.length}`);
  if (overdue.length)
    L.push(`- Просрочени (най-стари): ${overdue.slice(0, 8).map((c) => `${nm(c)} [${STAGE_LABEL[c.stage]}, преди ${daysAgo(c.next_followup_at!)} дни]`).join("; ")}`);
  if (hearToday.length)
    L.push(`- Имена за чуване днес: ${hearToday.slice(0, 8).map(nm).join("; ")}`);
  if (topOpps.length)
    L.push(`- Топ възможности: ${topOpps.map((c) => `${nm(c)} [${STAGE_LABEL[c.stage]}, ${formatMoney(Number(c.deal_value_eur) || 0)}]`).join("; ")}`);
  if (upcoming.length)
    L.push(`- Предстоящи срещи: ${upcoming.map((b) => `${b.attendee_name}${b.business ? ` (${b.business})` : ""} — ${new Date(b.scheduled_at).toLocaleString("bg-BG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`).join("; ")}`);
  return L.join("\n");
}
