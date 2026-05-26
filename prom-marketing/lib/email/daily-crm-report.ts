import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

interface ContactBrief {
  id: string;
  full_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  next_followup_at: string | null;
}

interface ActivitySummary {
  contact_id: string;
  activity_type: string;
  title: string;
  occurred_at: string;
}

interface OfferReminder {
  contact: ContactBrief;
  offerSentAt: string;
  daysSince: number;
  lastActivity: { title: string; occurred_at: string } | null;
}

const HOST = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://promarketing.pw";

export async function buildDailyCrmReport() {
  const supabase = createServiceClient();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const sevenDaysAgoStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  sevenDaysAgoStart.setHours(0, 0, 0, 0);
  const eightDaysAgoStart = new Date(sevenDaysAgoStart.getTime() - 24 * 60 * 60 * 1000);

  // --- 1. Yesterday's activity ---
  const { data: yesterdayActsRaw } = await supabase
    .from("contact_activities")
    .select("contact_id, activity_type, title, occurred_at")
    .gte("occurred_at", yesterday.toISOString())
    .order("occurred_at", { ascending: false });

  const yesterdayActs = (yesterdayActsRaw ?? []) as ActivitySummary[];

  const actsByType = new Map<string, number>();
  for (const a of yesterdayActs) {
    actsByType.set(a.activity_type, (actsByType.get(a.activity_type) ?? 0) + 1);
  }

  // --- 2. Today's follow-ups ---
  const { data: todayFollowups } = await supabase
    .from("contacts")
    .select("id, full_name, company, email, phone, stage, next_followup_at")
    .gte("next_followup_at", todayStart.toISOString())
    .lt("next_followup_at", tomorrowStart.toISOString())
    .neq("stage", "lost")
    .order("next_followup_at", { ascending: true });

  // --- 3. Overdue follow-ups ---
  const { data: overdueFollowups } = await supabase
    .from("contacts")
    .select("id, full_name, company, email, phone, stage, next_followup_at")
    .lt("next_followup_at", todayStart.toISOString())
    .neq("stage", "lost")
    .order("next_followup_at", { ascending: true });

  // --- 4. 7-day offer follow-up reminders ---
  // Намери всички 'offer_sent' / 'contract_sent' / 'presentation_sent' активности
  // отпреди ~7 дни (между 7 и 8 дни назад), след което провери дали има по-нова комуникация.
  const { data: sevenDayOffers } = await supabase
    .from("contact_activities")
    .select("contact_id, activity_type, title, occurred_at, contacts!inner(id, full_name, company, email, phone, stage, next_followup_at)")
    .in("activity_type", ["offer_sent", "contract_sent", "presentation_sent"])
    .gte("occurred_at", eightDaysAgoStart.toISOString())
    .lt("occurred_at", sevenDaysAgoStart.toISOString());

  const reminders: OfferReminder[] = [];
  const seen = new Set<string>();
  for (const a of (sevenDayOffers ?? []) as Array<{
    contact_id: string;
    title: string;
    occurred_at: string;
    activity_type: string;
    contacts: ContactBrief | ContactBrief[];
  }>) {
    if (seen.has(a.contact_id)) continue;
    const contact = Array.isArray(a.contacts) ? a.contacts[0] : a.contacts;
    if (!contact || contact.stage === "lost" || contact.stage === "won") continue;

    // Проверка: има ли по-нова активност от offer-а?
    const { data: latestAct } = await supabase
      .from("contact_activities")
      .select("title, occurred_at")
      .eq("contact_id", a.contact_id)
      .gt("occurred_at", a.occurred_at)
      .order("occurred_at", { ascending: false })
      .limit(1);

    const hasResponse = (latestAct ?? []).some(
      (la) =>
        la.title.toLowerCase().includes("email_received") ||
        la.title.includes("📨") ||
        la.title.includes("получен")
    );

    if (hasResponse) continue;

    seen.add(a.contact_id);
    const daysSince = Math.floor((now.getTime() - new Date(a.occurred_at).getTime()) / (1000 * 60 * 60 * 24));
    reminders.push({
      contact,
      offerSentAt: a.occurred_at,
      daysSince,
      lastActivity: (latestAct ?? [])[0] ?? null,
    });
  }

  // Auto-log a "reminder" note on each contact's timeline so it shows up in /admin
  for (const r of reminders) {
    await supabase.from("contact_activities").insert({
      contact_id: r.contact.id,
      activity_type: "note",
      title: `🔔 Напомняне: 7 дни от изпратена оферта — звънни`,
      body: `Изпратена оферта/презентация преди ${r.daysSince} дни (${new Date(r.offerSentAt).toLocaleDateString("bg-BG")}). Все още без отговор. Време е за follow-up разговор.`,
      occurred_at: new Date().toISOString(),
      created_by: "auto-reminder",
    });
  }

  // --- 5. Pipeline counts ---
  const { data: byStageRaw } = await supabase.from("contacts").select("stage");
  const byStage = new Map<string, number>();
  for (const r of (byStageRaw ?? []) as Array<{ stage: string }>) {
    byStage.set(r.stage, (byStage.get(r.stage) ?? 0) + 1);
  }

  // --- Render email ---
  const dateStr = now.toLocaleDateString("bg-BG", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const totalYesterday = yesterdayActs.length;
  const subject = `☀️ CRM отчет · ${now.toLocaleDateString("bg-BG", { day: "2-digit", month: "short" })} · ${(todayFollowups?.length ?? 0)} срещи, ${reminders.length} напомняния`;

  let html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0d1221;max-width:680px">
  <h1 style="font-size:24px;margin:0 0 4px;color:#0066cc">☀️ Добро утро, Ивайло!</h1>
  <p style="color:#666;margin:0 0 24px">${dateStr}</p>

  <!-- Yesterday recap -->
  <div style="background:#f5f7fa;border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 8px;font-size:16px;color:#0066cc">📊 Вчера</h2>
    <p style="margin:0 0 4px"><strong>${totalYesterday}</strong> активности на ${new Set(yesterdayActs.map((a) => a.contact_id)).size} клиента</p>
    ${
      actsByType.size > 0
        ? `<ul style="margin:6px 0 0;padding-left:20px;font-size:13px;color:#444">${Array.from(actsByType.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([t, c]) => `<li>${activityIcon(t)} ${activityLabel(t)}: <strong>${c}</strong></li>`)
            .join("")}</ul>`
        : `<p style="margin:6px 0 0;font-size:13px;color:#888">— нищо ново —</p>`
    }
  </div>

  <!-- Today's plan -->
  <div style="background:${(todayFollowups?.length ?? 0) > 0 ? "#e6f7e6" : "#f5f7fa"};border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 10px;font-size:16px;color:#22a722">📅 Днес · ${todayFollowups?.length ?? 0} срещи / разговори</h2>
    ${
      (todayFollowups?.length ?? 0) > 0
        ? `<ul style="margin:0;padding-left:20px">${(todayFollowups ?? [])
            .map(
              (c) => `<li style="margin-bottom:6px"><strong>${formatTime(c.next_followup_at!)}</strong> · <a href="${HOST}/admin/clients/${c.id}" style="color:#0066cc">${c.full_name ?? "—"}</a>${c.company ? ` <span style="color:#666">(${c.company})</span>` : ""}</li>`
            )
            .join("")}</ul>`
        : `<p style="margin:0;color:#666">Празно. Време за хладен outreach или follow-up.</p>`
    }
  </div>`;

  // 7-day reminders
  if (reminders.length > 0) {
    html += `<div style="background:#fff3cd;border-left:4px solid #f59e0b;border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 10px;font-size:16px;color:#b45309">🔔 7 дни от изпратена оферта — време за звънване</h2>
    <ul style="margin:0;padding-left:20px">
      ${reminders
        .map(
          (r) =>
            `<li style="margin-bottom:8px"><a href="${HOST}/admin/clients/${r.contact.id}" style="color:#0066cc;font-weight:bold">${r.contact.full_name ?? "—"}</a>${r.contact.company ? ` <span style="color:#666">(${r.contact.company})</span>` : ""}${
              r.contact.phone ? ` · <a href="tel:${r.contact.phone}" style="color:#22a722">${r.contact.phone}</a>` : ""
            }<br/><span style="color:#666;font-size:12px">Оферта преди ${r.daysSince} дни${r.lastActivity ? ` · последна: ${r.lastActivity.title}` : ""}</span></li>`
        )
        .join("")}
    </ul>
  </div>`;
  }

  // Overdue
  if ((overdueFollowups?.length ?? 0) > 0) {
    html += `<div style="background:#fee2e2;border-left:4px solid #ef4444;border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 10px;font-size:16px;color:#b91c1c">⚠️ Просрочени follow-up · ${overdueFollowups?.length}</h2>
    <ul style="margin:0;padding-left:20px">
      ${(overdueFollowups ?? [])
        .slice(0, 8)
        .map(
          (c) =>
            `<li style="margin-bottom:6px"><a href="${HOST}/admin/clients/${c.id}" style="color:#0066cc">${c.full_name ?? "—"}</a>${c.company ? ` <span style="color:#666">(${c.company})</span>` : ""} · <span style="color:#888;font-size:12px">${formatRelative(c.next_followup_at!)}</span></li>`
        )
        .join("")}
    </ul>
  </div>`;
  }

  // Pipeline snapshot
  const pipelineOrder = ["won", "negotiating", "offer_sent", "presentation_sent", "discovery", "contacted", "lead"];
  html += `<div style="background:#f5f7fa;border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 10px;font-size:16px;color:#0066cc">🚀 Pipeline</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      ${pipelineOrder
        .map(
          (s) =>
            `<tr><td style="padding:4px 0;color:#444">${stageLabel(s)}</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:${stageColor(s)}">${byStage.get(s) ?? 0}</td></tr>`
        )
        .join("")}
    </table>
  </div>`;

  html += `<p style="text-align:center;margin:24px 0">
    <a href="${HOST}/admin" style="display:inline-block;background:#0066cc;color:white;padding:10px 24px;border-radius:24px;text-decoration:none;font-weight:bold">Отвори CRM-а →</a>
  </p>
  <p style="text-align:center;color:#999;font-size:11px;margin:24px 0 0">Автоматичен отчет · ProMarketing CRM · ${new Date().toLocaleString("bg-BG")}</p>
</div>`;

  // Plain text version
  const text = `Добро утро, Ивайло!
${dateStr}

📊 ВЧЕРА
${totalYesterday} активности на ${new Set(yesterdayActs.map((a) => a.contact_id)).size} клиента
${Array.from(actsByType.entries())
  .map(([t, c]) => `  ${activityLabel(t)}: ${c}`)
  .join("\n")}

📅 ДНЕС · ${todayFollowups?.length ?? 0} срещи
${(todayFollowups ?? []).map((c) => `  ${formatTime(c.next_followup_at!)} · ${c.full_name}${c.company ? ` (${c.company})` : ""}`).join("\n")}

${
  reminders.length > 0
    ? `\n🔔 7-ДНЕВНИ НАПОМНЯНИЯ ЗА ОФЕРТИ\n${reminders.map((r) => `  ${r.contact.full_name}${r.contact.phone ? ` (${r.contact.phone})` : ""} — ${r.daysSince} дни`).join("\n")}\n`
    : ""
}
${
  (overdueFollowups?.length ?? 0) > 0
    ? `\n⚠️ ПРОСРОЧЕНИ · ${overdueFollowups?.length}\n${(overdueFollowups ?? []).slice(0, 8).map((c) => `  ${c.full_name}${c.company ? ` (${c.company})` : ""}`).join("\n")}\n`
    : ""
}

🚀 PIPELINE
${pipelineOrder.map((s) => `  ${stageLabel(s)}: ${byStage.get(s) ?? 0}`).join("\n")}

Виж CRM-а: ${HOST}/admin
`;

  return {
    subject,
    html,
    text,
    stats: {
      yesterdayActivities: totalYesterday,
      todayFollowups: todayFollowups?.length ?? 0,
      overdueFollowups: overdueFollowups?.length ?? 0,
      sevenDayReminders: reminders.length,
    },
  };
}

function activityIcon(t: string): string {
  const map: Record<string, string> = {
    meta_lead: "📥",
    booking: "📅",
    email_sent: "✉️",
    email_received: "📨",
    call: "📞",
    meeting: "🤝",
    note: "📝",
    presentation_sent: "🎯",
    offer_sent: "💎",
    contract_sent: "📜",
    payment_received: "💰",
    stage_change: "🔄",
  };
  return map[t] ?? "•";
}

function activityLabel(t: string): string {
  const map: Record<string, string> = {
    meta_lead: "Нови Meta лидове",
    booking: "Cal.com срещи",
    email_sent: "Изпратени имейли",
    email_received: "Получени имейли",
    call: "Разговори",
    meeting: "Срещи",
    note: "Бележки",
    presentation_sent: "Изпратени презентации",
    offer_sent: "Изпратени оферти",
    contract_sent: "Изпратени договори",
    payment_received: "Плащания",
    stage_change: "Промени на статус",
  };
  return map[t] ?? t;
}

function stageLabel(s: string): string {
  const map: Record<string, string> = {
    lead: "📥 Lead",
    contacted: "📧 В контакт",
    discovery: "🔍 Discovery",
    presentation_sent: "🎯 Презентация",
    offer_sent: "💎 Изпратена оферта",
    negotiating: "🤝 Преговори",
    won: "🏆 Спечелен",
    lost: "❌ Загубен",
  };
  return map[s] ?? s;
}

function stageColor(s: string): string {
  const map: Record<string, string> = {
    won: "#22c55e",
    negotiating: "#fb923c",
    offer_sent: "#facc15",
    presentation_sent: "#ec4899",
    discovery: "#00d4ff",
    contacted: "#a78bfa",
    lead: "#7da8cc",
  };
  return map[s] ?? "#888";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return "днес";
  if (days === 1) return "вчера";
  return `преди ${days} дни`;
}
