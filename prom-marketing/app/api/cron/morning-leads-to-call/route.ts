import { NextResponse } from "next/server";
import { ATTEMPT_TYPES, followupState, type FollowupState } from "@/lib/contacts/followup";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Vercel върви на UTC — без това датата в имейла се разминава със софийската. */
const TZ = "Europe/Sofia";

/**
 * Vercel Cron: GET /api/cron/morning-leads-to-call
 *
 * Triggered daily at 06:00 UTC (≈ 9:00 AM Sofia summer / 8:00 AM winter).
 *
 * What it does:
 *   1. ОБЕЩАНИ ОБАЖДАНИЯ — контакти с `next_followup_at` до края на днес,
 *      които не са won/lost. Разделени на просрочени и за днес. Това е
 *      главната секция: тези хора вече чакат обаждане.
 *   2. НЕОБРАБОТЕНИ ЛИДОВЕ — stage='lead' без никакъв човешки контакт
 *      (call/email/note/meeting), подредени най-нови най-горе.
 *
 * Auth: Vercel cron сysteme sends `Authorization: Bearer ${CRON_SECRET}`.
 * Може и ръчно с INTERNAL_SEND_TOKEN за тестване.
 */

interface FollowUp {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  stage: string;
  next_followup_at: string;
  last_heard_from_at: string | null;
}

interface LeadToCall {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  source: string;
  created_at: string;
  notes: string | null;
}

const HOST = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://promarketing.pw";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const internalToken = process.env.INTERNAL_SEND_TOKEN;
  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isManualTest = internalToken && authHeader === `Bearer ${internalToken}`;
  if (cronSecret && !isVercelCron && !isManualTest) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Контакти в stage='lead' (необработени)
  const { data: leads } = await supabase
    .from("contacts")
    .select("id, full_name, phone, email, company, source, created_at, notes")
    .eq("stage", "lead")
    .order("created_at", { ascending: false })
    .limit(50);

  const allLeads = (leads ?? []) as LeadToCall[];

  // Филтрираме само онези без човешки контакт активност (call/email_sent/meeting/note)
  const leadIds = allLeads.map((l) => l.id);
  let contactedIds = new Set<string>();
  if (leadIds.length > 0) {
    const { data: contactedActs } = await supabase
      .from("contact_activities")
      .select("contact_id")
      .in("contact_id", leadIds)
      .in("activity_type", ["call", "email_sent", "meeting", "note"]);
    contactedIds = new Set((contactedActs ?? []).map((a) => a.contact_id));
  }

  // ── Обещани обаждания: next_followup_at е настъпил ────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: followupRows } = await supabase
    .from("contacts")
    .select("id, full_name, phone, email, company, stage, next_followup_at, last_heard_from_at")
    .not("next_followup_at", "is", null)
    .lte("next_followup_at", todayEnd.toISOString())
    .not("stage", "in", "(won,lost)")
    .order("next_followup_at", { ascending: true })
    .limit(50);

  // Обещанието е „ще се чуем на ден X". Изпълнено е, ако на ден X или след него
  // има обаждане или среща в картона (`followupState`) — сравнението е по
  // календарен ден в София, не по секунда. Дотук се гледаше само
  // `last_heard_from_at`, което бутонът пише, а обаждането от Хермес — не, и
  // в списъка стояха 49 „просрочени", повечето отдавна направени.
  const candidates = (followupRows ?? []) as FollowUp[];
  const attempts = new Map<string, string>();
  if (candidates.length > 0) {
    const { data: att } = await supabase
      .from("contact_activities")
      .select("contact_id, occurred_at")
      .in(
        "contact_id",
        candidates.map((c) => c.id)
      )
      .in("activity_type", [...ATTEMPT_TYPES])
      .order("occurred_at", { ascending: false });
    for (const a of att ?? []) {
      if (!attempts.has(a.contact_id)) attempts.set(a.contact_id, a.occurred_at);
    }
  }
  const stateAt = new Date();
  const stateOf = new Map<string, FollowupState>();
  for (const f of candidates) stateOf.set(f.id, followupState(f, attempts.get(f.id) ?? null, stateAt));
  const followups = candidates.filter((f) => stateOf.get(f.id) === "overdue" || stateOf.get(f.id) === "due_today");

  // Последната човешка активност — за да си спомниш какво си обещал.
  const lastTouch = new Map<string, { title: string; occurred_at: string }>();
  if (followups.length > 0) {
    const { data: acts } = await supabase
      .from("contact_activities")
      .select("contact_id, title, occurred_at")
      .in(
        "contact_id",
        followups.map((f) => f.id)
      )
      .in("activity_type", ["call", "email_sent", "meeting", "note"])
      .order("occurred_at", { ascending: false });
    for (const a of acts ?? []) {
      if (!lastTouch.has(a.contact_id)) {
        lastTouch.set(a.contact_id, { title: a.title, occurred_at: a.occurred_at });
      }
    }
  }

  const overdue = followups.filter((f) => stateOf.get(f.id) === "overdue");
  const dueToday = followups.filter((f) => stateOf.get(f.id) === "due_today");

  // Лид с насрочено чуване вече е в секциите горе — не го повтаряме долу.
  const followupIds = new Set(followups.map((f) => f.id));
  const untouched = allLeads.filter((l) => !contactedIds.has(l.id) && !followupIds.has(l.id));

  // Категории: нови (последни 24ч) vs по-стари
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const fresh = untouched.filter((l) => now - new Date(l.created_at).getTime() < dayMs);
  const older = untouched.filter((l) => now - new Date(l.created_at).getTime() >= dayMs);

  const recipient = process.env.EMAIL_REPLY_TO || "emmgivailopetev38@gmail.com";

  if (untouched.length === 0 && followups.length === 0) {
    return NextResponse.json({ ok: true, message: "Nothing to call today", total: 0 });
  }

  const dateStr = new Date().toLocaleDateString("bg-BG", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: TZ,
  });

  const dayShort = new Date().toLocaleDateString("bg-BG", { day: "2-digit", month: "short", timeZone: TZ });
  const subjectParts: string[] = [];
  if (followups.length > 0) {
    subjectParts.push(
      `${followups.length} за чуване${overdue.length > 0 ? ` (${overdue.length} просрочени)` : ""}`
    );
  }
  if (untouched.length > 0) {
    subjectParts.push(`${untouched.length} ${untouched.length === 1 ? "нов лид" : "нови лида"}`);
  }
  const subject = `📞 ${subjectParts.join(" · ")} — ${dayShort}`;

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0d1221;max-width:680px">
  <h1 style="font-size:22px;margin:0 0 4px;color:#facc15">📞 За обаждане днес</h1>
  <p style="color:#666;margin:0 0 24px">${dateStr} · 9:00 AM Sofia</p>

  ${followupBlock(overdue, "⚠️ ПРОСРОЧЕНИ · обещал си да се чуете", "#fee2e2", "#dc2626", "#991b1b", lastTouch)}
  ${followupBlock(dueToday, "🗓️ ЗА ДНЕС · обещани обаждания", "#e0f2fe", "#0284c7", "#075985", lastTouch)}

  ${
    fresh.length > 0
      ? `<div style="background:#fff3cd;border-left:4px solid #facc15;border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 12px;font-size:16px;color:#92400e">🔥 НОВИ · последните 24 часа · ${fresh.length}</h2>
    ${fresh
      .map(
        (l) => `<div style="background:white;border-radius:6px;padding:10px;margin-bottom:6px">
      <p style="margin:0;font-weight:bold"><a href="${HOST}/admin/clients/${l.id}" style="color:#0066cc;text-decoration:none">${l.full_name ?? "—"}</a>${l.company ? ` <span style="color:#666;font-weight:normal">· ${l.company}</span>` : ""}</p>
      <p style="margin:4px 0 0;font-size:12px">${l.phone ? `📞 <a href="tel:${l.phone}" style="color:#22a722">${l.phone}</a>` : ""}${l.email ? `${l.phone ? " · " : ""}<a href="mailto:${l.email}" style="color:#0066cc">${l.email}</a>` : ""}</p>
      <p style="margin:2px 0 0;font-size:11px;color:#888">${formatRelative(l.created_at)} · ${sourceLabel(l.source)}</p>
    </div>`
      )
      .join("")}
  </div>`
      : ""
  }

  ${
    older.length > 0
      ? `<div style="background:#f5f7fa;border-left:4px solid #6b7280;border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 12px;font-size:16px;color:#374151">⏰ ПО-СТАРИ · все още непоследвани · ${older.length}</h2>
    ${older
      .slice(0, 15)
      .map(
        (l) => `<div style="background:white;border-radius:6px;padding:10px;margin-bottom:6px">
      <p style="margin:0;font-weight:bold"><a href="${HOST}/admin/clients/${l.id}" style="color:#0066cc;text-decoration:none">${l.full_name ?? "—"}</a>${l.company ? ` <span style="color:#666;font-weight:normal">· ${l.company}</span>` : ""}</p>
      <p style="margin:4px 0 0;font-size:12px">${l.phone ? `📞 <a href="tel:${l.phone}" style="color:#22a722">${l.phone}</a>` : ""}${l.email ? `${l.phone ? " · " : ""}<a href="mailto:${l.email}" style="color:#0066cc">${l.email}</a>` : ""}</p>
      <p style="margin:2px 0 0;font-size:11px;color:#888">${formatRelative(l.created_at)} · ${sourceLabel(l.source)}</p>
    </div>`
      )
      .join("")}
    ${older.length > 15 ? `<p style="margin:8px 0 0;font-size:11px;color:#888">... и още ${older.length - 15}. <a href="${HOST}/admin/clients?stage=lead" style="color:#0066cc">Виж всички</a></p>` : ""}
  </div>`
      : ""
  }

  <p style="text-align:center;margin:24px 0">
    <a href="${HOST}/admin" style="display:inline-block;background:#facc15;color:#0d1221;padding:10px 24px;border-radius:24px;text-decoration:none;font-weight:bold">📞 Отвори CRM-а →</a>
  </p>

  <p style="margin-top:24px;padding:12px;background:#f0f9ff;border-radius:6px;font-size:12px;color:#0c4a6e">
    💡 <strong>След като звъннеш:</strong> отбележи в CRM-а с „📞 Разговор" и сложи нова дата за следващо чуване. Без нова дата контактът изпада от този списък; с дата се връща точно тогава.
  </p>

  <p style="text-align:center;color:#999;font-size:10px;margin:24px 0 0">Автоматичен отчет · 9:00 AM Sofia · ProMarketing CRM</p>
</div>`;

  const fuText = (list: FollowUp[], label: string) =>
    list.length > 0
      ? `${label} · ${list.length}\n${list
          .map(
            (f) =>
              `  • ${f.full_name ?? "—"} · ${f.phone ?? f.email ?? "—"} · ${stageLabel(f.stage)} · за ${formatDue(f.next_followup_at)}${
                lastTouch.get(f.id) ? ` · последно: ${lastTouch.get(f.id)!.title}` : ""
              }`
          )
          .join("\n")}\n\n`
      : "";

  const text = `📞 За обаждане днес — ${dateStr}

${fuText(overdue, "⚠️ ПРОСРОЧЕНИ")}${fuText(dueToday, "🗓️ ЗА ДНЕС")}${
  fresh.length > 0
    ? `🔥 НОВИ · последните 24ч · ${fresh.length}\n${fresh.map((l) => `  • ${l.full_name ?? "—"}${l.company ? ` (${l.company})` : ""} · ${l.phone ?? l.email ?? "—"} · ${formatRelative(l.created_at)}`).join("\n")}\n\n`
    : ""
}${
    older.length > 0
      ? `⏰ ПО-СТАРИ · ${older.length}\n${older.slice(0, 15).map((l) => `  • ${l.full_name ?? "—"}${l.company ? ` (${l.company})` : ""} · ${l.phone ?? l.email ?? "—"} · ${formatRelative(l.created_at)}`).join("\n")}\n\n`
      : ""
  }Виж в CRM-а: ${HOST}/admin`;

  const emailResult = await sendEmail({
    to: recipient,
    subject,
    html,
    text,
  });

  return NextResponse.json({
    ok: !emailResult.error,
    total: untouched.length,
    fresh: fresh.length,
    older: older.length,
    email: { to: recipient, id: emailResult.id, error: emailResult.error },
  });
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (days === 0) {
    if (hours === 0) return "току що";
    return `преди ${hours}ч`;
  }
  if (days === 1) return "вчера";
  if (days < 7) return `преди ${days} дни`;
  if (days < 30) return `преди ${Math.floor(days / 7)} седм.`;
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "short", timeZone: TZ });
}

function sourceLabel(s: string): string {
  const map: Record<string, string> = {
    meta_lead: "Meta реклама",
    website_form: "Уебсайт",
    cal_booking: "Cal.com",
    email: "Имейл",
    manual: "Ръчно",
  };
  return map[s] ?? s;
}

const STAGE_LABELS: Record<string, string> = {
  lead: "Нов лид",
  contacted: "Осъществен контакт",
  discovery: "Проучване",
  presentation_sent: "Изпратена презентация",
  offer_sent: "Изпратена оферта",
  negotiating: "Преговори",
};

function stageLabel(s: string): string {
  return STAGE_LABELS[s] ?? s;
}

/** „днес" / „вчера" / „преди 3 дни" за настъпила дата на следващо чуване. */
function formatDue(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "днес";
  if (days === 1) return "вчера";
  if (days < 7) return `преди ${days} дни`;
  return d.toLocaleDateString("bg-BG", { day: "2-digit", month: "short", timeZone: TZ });
}

/** Един блок с обещани обаждания — просрочени или за днес. */
function followupBlock(
  list: FollowUp[],
  heading: string,
  bg: string,
  accent: string,
  headingColor: string,
  lastTouch: Map<string, { title: string; occurred_at: string }>
): string {
  if (list.length === 0) return "";
  return `<div style="background:${bg};border-left:4px solid ${accent};border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 12px;font-size:16px;color:${headingColor}">${heading} · ${list.length}</h2>
    ${list
      .slice(0, 20)
      .map((f) => {
        const touch = lastTouch.get(f.id);
        return `<div style="background:white;border-radius:6px;padding:10px;margin-bottom:6px">
      <p style="margin:0;font-weight:bold"><a href="${HOST}/admin/clients/${f.id}" style="color:#0066cc;text-decoration:none">${f.full_name ?? "—"}</a>${f.company ? ` <span style="color:#666;font-weight:normal">· ${f.company}</span>` : ""} <span style="font-weight:normal;font-size:11px;color:#666">· ${stageLabel(f.stage)}</span></p>
      <p style="margin:4px 0 0;font-size:12px">${f.phone ? `📞 <a href="tel:${f.phone}" style="color:#22a722">${f.phone}</a>` : ""}${f.email ? `${f.phone ? " · " : ""}<a href="mailto:${f.email}" style="color:#0066cc">${f.email}</a>` : ""}</p>
      <p style="margin:2px 0 0;font-size:11px;color:#888">за ${formatDue(f.next_followup_at)}${touch ? ` · последно: ${touch.title} (${formatRelative(touch.occurred_at)})` : ""}</p>
    </div>`;
      })
      .join("")}
    ${list.length > 20 ? `<p style="margin:8px 0 0;font-size:11px;color:#888">... и още ${list.length - 20}. <a href="${HOST}/admin/follow-up" style="color:#0066cc">Виж всички</a></p>` : ""}
  </div>`;
}
