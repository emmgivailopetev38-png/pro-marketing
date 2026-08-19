import { createServiceClient } from "@/lib/supabase/service";
import { toEur } from "@/lib/crm/fx";

/**
 * Дневната картина за гласовия агент — с ЕДНА заявка навън.
 *
 * Защо не се преизползва buildDailyCrmReport(): той строи имейл (subject/html/text)
 * и вади доста повече, отколкото се чете на глас. Разговорът заеква, ако инструментът
 * се бави над ~800 ms, затова тук заявките са малко на брой и вървят успоредно.
 *
 * Връща и `spoken` — готово изречение на български. Агентът може да го каже както е,
 * вместо да съчинява числа от суров JSON (там се раждат халюцинациите за пари).
 */

const UNPAID_STATUSES = ["sent", "awaiting_payment", "partially_paid", "overdue"] as const;

export interface VoiceBrief {
  spoken: string;
  today: {
    meetings: { at: string; who: string; phone: string | null; url: string | null }[];
    followups: { who: string; company: string | null; phone: string | null }[];
    new_leads: number;
  };
  overdue_followups: number;
  money: { unpaid_count: number; unpaid_total_eur: number; overdue_count: number };
  pending_approvals: number;
}

export async function buildVoiceBrief(): Promise<VoiceBrief> {
  const supabase = createServiceClient();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const todayISO = todayStart.toISOString();
  const tomorrowISO = tomorrowStart.toISOString();

  const [meetingsQ, followupsQ, newLeadsQ, overdueQ, invoicesQ, approvalsQ] = await Promise.all([
    supabase
      .from("bookings")
      .select("scheduled_at, attendee_name, attendee_phone, meeting_url, status")
      .gte("scheduled_at", todayISO)
      .lt("scheduled_at", tomorrowISO)
      .order("scheduled_at", { ascending: true }),

    supabase
      .from("contacts")
      .select("full_name, company, phone")
      .gte("next_followup_at", todayISO)
      .lt("next_followup_at", tomorrowISO)
      .limit(20),

    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayISO),

    // Просрочените може да са хиляди — брой, не списък (лимитът на Supabase
    // е 1000 реда и тихо реже, затова тук изрично се брои).
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .lt("next_followup_at", todayISO),

    supabase
      .from("invoices")
      .select("amount_gross, currency, fx_rate, status, due_date")
      .in("status", UNPAID_STATUSES as unknown as string[]),

    supabase
      .from("manual_review_items")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .eq("type", "voice_approval"),
  ]);

  const meetings = (meetingsQ.data ?? [])
    .filter((b) => b.status !== "cancelled")
    .map((b) => ({
      at: b.scheduled_at as string,
      who: (b.attendee_name as string) || "без име",
      phone: (b.attendee_phone as string) ?? null,
      url: (b.meeting_url as string) ?? null,
    }));

  const followups = (followupsQ.data ?? []).map((c) => ({
    who: (c.full_name as string) || "без име",
    company: (c.company as string) ?? null,
    phone: (c.phone as string) ?? null,
  }));

  const todayYMD = todayStart.toISOString().slice(0, 10);
  let unpaidTotal = 0;
  let overdueCount = 0;
  for (const inv of invoicesQ.data ?? []) {
    const eur = toEur(inv.amount_gross as number, inv.currency as string, inv.fx_rate as number).amount_eur;
    if (eur !== null) unpaidTotal += eur;
    const due = inv.due_date as string | null;
    if ((due && due < todayYMD) || inv.status === "overdue") overdueCount += 1;
  }

  const brief: VoiceBrief = {
    spoken: "",
    today: { meetings, followups, new_leads: newLeadsQ.count ?? 0 },
    overdue_followups: overdueQ.count ?? 0,
    money: {
      unpaid_count: (invoicesQ.data ?? []).length,
      unpaid_total_eur: Math.round(unpaidTotal * 100) / 100,
      overdue_count: overdueCount,
    },
    pending_approvals: approvalsQ.count ?? 0,
  };
  brief.spoken = speak(brief);
  return brief;
}

/** Изречението, което агентът чете. Кратко — това се СЛУША, не се чете. */
function speak(b: VoiceBrief): string {
  const parts: string[] = [];

  if (b.today.meetings.length === 0) {
    parts.push("Днес нямаш срещи.");
  } else {
    const list = b.today.meetings
      .map((m) => `${formatHour(m.at)} с ${m.who}`)
      .join(", ");
    parts.push(`Днес имаш ${plural(b.today.meetings.length, "среща", "срещи")}: ${list}.`);
  }

  if (b.today.followups.length > 0) {
    parts.push(
      `За днес си отбелязал да се чуеш с ${plural(b.today.followups.length, "човек", "души")}: ` +
        b.today.followups.slice(0, 5).map((f) => f.who).join(", ") + "."
    );
  }

  if (b.today.new_leads > 0) {
    parts.push(`Влязоха ${plural(b.today.new_leads, "нов лийд", "нови лийда")}.`);
  }

  if (b.overdue_followups > 0) {
    parts.push(`Просрочени последващи стъпки: ${b.overdue_followups}.`);
  }

  if (b.money.unpaid_count > 0) {
    parts.push(
      `Неплатени фактури: ${b.money.unpaid_count}, общо ${formatEur(b.money.unpaid_total_eur)}` +
        (b.money.overdue_count > 0 ? `, от които ${b.money.overdue_count} с изтекъл срок.` : ".")
    );
  }

  if (b.pending_approvals > 0) {
    parts.push(`Чакат те ${plural(b.pending_approvals, "заявка", "заявки")} за одобрение.`);
  }

  return parts.length > 0 ? parts.join(" ") : "Днес е чисто — няма срещи, няма просрочени неща.";
}

/** Часът в София. Агентът говори на българин на българско време. */
function formatHour(iso: string): string {
  return new Intl.DateTimeFormat("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Sofia",
  }).format(new Date(iso));
}

/** Сумите се четат на глас — „хиляда двеста евро", не „1200.00 EUR". */
function formatEur(n: number): string {
  return new Intl.NumberFormat("bg-BG", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? `${n} ${one}` : `${n} ${many}`;
}
