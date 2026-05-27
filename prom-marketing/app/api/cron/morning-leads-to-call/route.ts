import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Vercel Cron: GET /api/cron/morning-leads-to-call
 *
 * Triggered daily at 06:00 UTC (≈ 9:00 AM Sofia summer / 8:00 AM winter).
 *
 * What it does:
 *   Извежда списък с НЕОБРАБОТЕНИ лидове за обаждане днес:
 *     - Лидове в stage='lead' без никакъв човешки контакт (call/email/note/meeting)
 *     - Подредени по дата на влизане (най-нови най-горе)
 *
 * Auth: Vercel cron сysteme sends `Authorization: Bearer ${CRON_SECRET}`.
 * Може и ръчно с INTERNAL_SEND_TOKEN за тестване.
 */

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

  const untouched = allLeads.filter((l) => !contactedIds.has(l.id));

  // Категории: нови (последни 24ч) vs по-стари
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const fresh = untouched.filter((l) => now - new Date(l.created_at).getTime() < dayMs);
  const older = untouched.filter((l) => now - new Date(l.created_at).getTime() >= dayMs);

  const recipient = process.env.EMAIL_REPLY_TO || "ivailopetev38@gmail.com";

  if (untouched.length === 0) {
    return NextResponse.json({ ok: true, message: "No untouched leads", total: 0 });
  }

  const dateStr = new Date().toLocaleDateString("bg-BG", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const subject = `📞 ${untouched.length} ${untouched.length === 1 ? "лид чака" : "лида чакат"} обаждане — ${new Date().toLocaleDateString("bg-BG", { day: "2-digit", month: "short" })}`;

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0d1221;max-width:680px">
  <h1 style="font-size:22px;margin:0 0 4px;color:#facc15">📞 Лиди за обаждане днес</h1>
  <p style="color:#666;margin:0 0 24px">${dateStr} · 9:00 AM Sofia</p>

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
    💡 <strong>След като звъннеш:</strong> отбележи в CRM-а с „📞 Разговор" — така лидът няма да го виждаш утре в този списък.
  </p>

  <p style="text-align:center;color:#999;font-size:10px;margin:24px 0 0">Автоматичен отчет · 9:00 AM Sofia · ProMarketing CRM</p>
</div>`;

  const text = `📞 ${untouched.length} лиди за обаждане днес — ${dateStr}

${
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
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "short" });
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
