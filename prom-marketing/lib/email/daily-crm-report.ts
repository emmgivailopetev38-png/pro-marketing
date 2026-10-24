import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { ATTEMPT_TYPES, followupState } from "@/lib/contacts/followup";
import { escapeHtml } from "./escape";
import { loadTopCalls } from "@/lib/crm/top-calls";
import type { TopCallsResult } from "@/lib/crm/top-calls-rules";
import { runInvoiceReminders, type InvoiceRemindersResult } from "@/lib/crm/invoice-reminders";
import { overdueBucket } from "@/lib/crm/invoice-reminders-rules";
import { isOfferActivity } from "@/lib/crm/consistency-rules";
import { planFollowupAt, planOfferReminders, type OfferSignal } from "@/lib/crm/offer-reminders-rules";

/** Vercel върви на UTC — без това сутрешният отчет показва 08:00 вместо 11:00. */
const TZ = "Europe/Sofia";

interface ContactBrief {
  id: string;
  full_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  next_followup_at: string | null;
}

interface BookingBrief {
  id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  scheduled_at: string;
  status: string;
  meeting_url: string | null;
}

interface ActivitySummary {
  contact_id: string;
  activity_type: string;
  title: string;
  occurred_at: string;
}

interface VoiceCallRow {
  contact_id: string;
  title: string;
  body: string | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
  contacts: { id: string; full_name: string | null; phone: string | null; company: string | null } | Array<{ id: string; full_name: string | null; phone: string | null; company: string | null }> | null;
}

interface OfferReminder {
  contact: ContactBrief;
  offerSentAt: string;
  daysSince: number;
  lastActivity: { title: string; occurred_at: string } | null;
  dedupeKey: string;
  label: string;
}

const HOST = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://promarketing.pw";

export async function buildDailyCrmReport() {
  const supabase = createServiceClient();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  // Calendar yesterday (00:00–24:00) — NOT a rolling "now - 24h". The old
  // version had no upper bound, and because booking activities are stored with
  // occurred_at = the meeting time, every FUTURE meeting was counted as "вчера".
  const yesterday = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // --- 1. Yesterday's activity ---
  const { data: yesterdayActsRaw } = await supabase
    .from("contact_activities")
    .select("contact_id, activity_type, title, occurred_at")
    .gte("occurred_at", yesterday.toISOString())
    .lt("occurred_at", todayStart.toISOString())
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

  // --- 2b. Today's real Cal.com meetings ---
  // The Cal.com webhook upserts bookings into `bookings`. The report used to
  // read only contacts.next_followup_at, so actual booked meetings were
  // invisible and the email always said "0 срещи".
  const { data: todayBookingsRaw } = await supabase
    .from("bookings")
    .select("id, attendee_name, attendee_email, attendee_phone, scheduled_at, status, meeting_url")
    .gte("scheduled_at", todayStart.toISOString())
    .lt("scheduled_at", tomorrowStart.toISOString())
    .neq("status", "cancelled")
    .order("scheduled_at", { ascending: true });

  const todayBookings = (todayBookingsRaw ?? []) as BookingBrief[];

  // --- 2c. Разговори с гласовия агент (последните 24 часа) ---
  // Идват от post-call webhook-а на ElevenLabs като `voice_call`; резюмето е в
  // metadata.summary, транскриптът — в body. Тук стои резюмето, за да знае
  // Ивайло какво е питал човекът, преди да му звънне.
  const { data: voiceRaw } = await supabase
    .from("contact_activities")
    .select("contact_id, title, body, occurred_at, metadata, contacts!inner(id, full_name, phone, company)")
    .eq("activity_type", "voice_call")
    .gte("occurred_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
    .order("occurred_at", { ascending: false })
    .limit(12);
  const voiceCalls = ((voiceRaw ?? []) as unknown as VoiceCallRow[]).map((v) => {
    const meta = (v.metadata ?? {}) as Record<string, unknown>;
    const c = Array.isArray(v.contacts) ? v.contacts[0] : v.contacts;
    return {
      contactId: v.contact_id,
      name: c?.full_name ?? c?.phone ?? "непознат",
      phone: c?.phone ?? null,
      minutes: typeof meta.minutes === "number" ? meta.minutes : null,
      booked: meta.booked === true,
      channel: typeof meta.channel === "string" ? meta.channel : "sait",
      summary:
        (typeof meta.summary === "string" && meta.summary) ||
        (v.body ?? "").split("\n\n")[0] ||
        v.title,
      at: v.occurred_at,
    };
  });

  // --- 3. Overdue follow-ups ---
  // Същото правило като в списъка за обаждане (`followupState`): обещанието е
  // по календарен ден, а обаждане или среща на деня или след него го изпълнява.
  // Дотук отчетът броеше всяка минала дата, без да гледа какво е станало после.
  const { data: overdueRaw } = await supabase
    .from("contacts")
    .select("id, full_name, company, email, phone, stage, next_followup_at, last_heard_from_at")
    .lt("next_followup_at", todayStart.toISOString())
    .not("stage", "in", "(won,lost)")
    .order("next_followup_at", { ascending: true })
    .limit(300);
  const overdueCandidates = (overdueRaw ?? []) as Array<ContactBrief & { last_heard_from_at: string | null }>;
  const attempts = new Map<string, string>();
  if (overdueCandidates.length > 0) {
    const { data: att } = await supabase
      .from("contact_activities")
      .select("contact_id, occurred_at")
      .in(
        "contact_id",
        overdueCandidates.map((c) => c.id)
      )
      .in("activity_type", [...ATTEMPT_TYPES])
      .order("occurred_at", { ascending: false });
    for (const a of att ?? []) {
      if (!attempts.has(a.contact_id)) attempts.set(a.contact_id, a.occurred_at);
    }
  }
  const overdueFollowups = overdueCandidates.filter(
    (c) => followupState(c, attempts.get(c.id) ?? null, now) === "overdue"
  );

  // --- 4. Напомняния за пратена оферта — на 3-ия и на 7-ия ден ---
  // Сигналите: активности offer_sent / contract_sent / presentation_sent (или
  // ръчно пратен имейл с „оферта" в заглавието) и редове в `offers` със
  // status sent/viewed. Отговор от човека след офертата → без напомняне.
  // Всяко напомняне: бележка с dedupe_key + „да се обади" + напомняне за
  // следващата работна сутрин (10:00 София), ако няма по-ранна бъдеща дата.
  const windowFrom = new Date(todayStart.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const windowTo = new Date(todayStart.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: offerActsRaw }, { data: offerRowsRaw }, { data: offerNotesRaw }] = await Promise.all([
    supabase
      .from("contact_activities")
      .select("id, contact_id, activity_type, title, occurred_at")
      .in("activity_type", ["offer_sent", "contract_sent", "presentation_sent", "email_sent"])
      .gte("occurred_at", windowFrom)
      .lt("occurred_at", windowTo),
    supabase
      .from("offers")
      .select("id, contact_id, title, sent_at, status")
      .in("status", ["sent", "viewed"])
      .gte("sent_at", windowFrom)
      .lt("sent_at", windowTo),
    supabase.from("contact_activities").select("metadata").like("metadata->>dedupe_key", "offer-reminder:%").limit(3000),
  ]);
  const signals: OfferSignal[] = [];
  for (const a of (offerActsRaw ?? []) as Array<{ id: string; contact_id: string; activity_type: string; title: string | null; occurred_at: string }>) {
    if (!isOfferActivity(a) && a.activity_type !== "contract_sent" && a.activity_type !== "presentation_sent") continue;
    signals.push({ contact_id: a.contact_id, sent_at: a.occurred_at, label: a.title ?? activityLabel(a.activity_type) });
  }
  for (const o of (offerRowsRaw ?? []) as Array<{ id: string; contact_id: string | null; title: string; sent_at: string | null }>) {
    if (o.contact_id && o.sent_at) signals.push({ contact_id: o.contact_id, sent_at: o.sent_at, label: `Оферта „${o.title}"` });
  }
  const existingOfferKeys = new Set<string>();
  for (const n of (offerNotesRaw ?? []) as Array<{ metadata: Record<string, unknown> | null }>) {
    const k = n.metadata?.dedupe_key;
    if (typeof k === "string") existingOfferKeys.add(k);
  }
  const planned = planOfferReminders(signals, existingOfferKeys, now);

  const reminders: OfferReminder[] = [];
  for (const pl of planned) {
    const { data: contactRow } = await supabase
      .from("contacts")
      .select("id, full_name, company, email, phone, stage, next_followup_at")
      .eq("id", pl.contact_id)
      .maybeSingle();
    const contact = contactRow as ContactBrief | null;
    if (!contact || contact.stage === "lost" || contact.stage === "won") continue;

    // Отговорил ли е човекът след офертата?
    const { data: latestAct } = await supabase
      .from("contact_activities")
      .select("activity_type, title, occurred_at")
      .eq("contact_id", pl.contact_id)
      .gt("occurred_at", pl.sent_at)
      .lte("occurred_at", now.toISOString())
      .order("occurred_at", { ascending: false })
      .limit(10);
    const hasResponse = (latestAct ?? []).some(
      (la) =>
        la.activity_type === "email_received" ||
        la.title.toLowerCase().includes("email_received") ||
        la.title.includes("📨") ||
        la.title.includes("получен")
    );
    if (hasResponse) continue;

    reminders.push({
      contact,
      offerSentAt: pl.sent_at,
      daysSince: pl.day,
      lastActivity: (latestAct ?? [])[0] ?? null,
      dedupeKey: pl.dedupe_key,
      label: pl.label,
    });
  }

  // Бележка в картона (с dedupe_key) + „да се обади" + напомняне за следващата
  // работна сутрин — така офертата влиза в „Топ 10 за днес", не само в този имейл.
  for (const r of reminders) {
    const sentStr = new Date(r.offerSentAt).toLocaleDateString("bg-BG", { timeZone: TZ });
    const { error: nErr } = await supabase.from("contact_activities").insert({
      contact_id: r.contact.id,
      activity_type: "note",
      title: `🔔 ${r.daysSince} дни от изпратена оферта — звънни`,
      body: `${r.label} · пратена на ${sentStr}, без отговор. ${r.daysSince === 3 ? "Първо" : "Второ"} напомняне към Ивайло — към клиента не е пращано нищо.`,
      occurred_at: now.toISOString(),
      created_by: "auto-reminder",
      metadata: { dedupe_key: r.dedupeKey, kind: "offer_reminder", day: r.daysSince, offer_sent_at: r.offerSentAt },
    });
    if (nErr) continue;
    const nextAt = planFollowupAt(r.contact.next_followup_at, now);
    const patch: Record<string, unknown> = { followup_status: "needs_call" };
    if (nextAt) patch.next_followup_at = nextAt;
    await supabase.from("contacts").update(patch).eq("id", r.contact.id);
  }

  // --- 4b. „📞 Топ 10 за днес" — просрочените и днешните по стойност, после по давност.
  // Студените (lead/contacted без сума, needs_call > 14 дни) са само брой — за вълната.
  let topCalls: TopCallsResult = { top: [], cold: 0, warm_total: 0 };
  try {
    topCalls = await loadTopCalls(now);
  } catch {
    // отчетът е по-важен от този блок
  }

  // --- 4c. „💶 Неплатени" — просрочените фактури (3/7/14+ дни след падежа) +
  // бележка в картона на всеки праг. Нищо към клиента.
  let unpaid: InvoiceRemindersResult = { overdue: [], notes_written: 0, errors: [] };
  try {
    unpaid = await runInvoiceReminders(now);
  } catch {
    // отчетът е по-важен от този блок
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
    timeZone: TZ,
  });

  const totalYesterday = yesterdayActs.length;
  const todayCount = (todayFollowups?.length ?? 0) + todayBookings.length;
  const subject = `☀️ CRM отчет · ${now.toLocaleDateString("bg-BG", { day: "2-digit", month: "short", timeZone: TZ })} · ${todayCount} срещи, ${reminders.length} напомняния`;

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

  ${
    voiceCalls.length > 0
      ? `<!-- Voice agent calls -->
  <div style="background:#f2f7f4;border-left:4px solid #0b6b4a;border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 10px;font-size:16px;color:#0b6b4a">🎙️ Разговори с гласовия агент · ${voiceCalls.length}</h2>
    <ul style="margin:0;padding-left:20px">
      ${voiceCalls
        .map(
          (v) =>
            `<li style="margin-bottom:8px"><a href="${HOST}/admin/clients/${v.contactId}" style="color:#0066cc;font-weight:bold">${escapeHtml(v.name)}</a>${v.phone ? ` · <a href="tel:${escapeHtml(v.phone)}" style="color:#22a722">${escapeHtml(v.phone)}</a>` : ""} · <span style="color:#666;font-size:12px">${v.channel === "telefon" ? "по телефона" : "от сайта"}${v.minutes ? ` · ${v.minutes} мин` : ""}${v.booked ? " · ✅ записа си час" : ""} · ${formatRelative(v.at)}</span><br/><span style="color:#444;font-size:13px">${escapeHtml(v.summary.length > 220 ? `${v.summary.slice(0, 220)}…` : v.summary)}</span></li>`
        )
        .join("")}
    </ul>
  </div>`
      : ""
  }

  <!-- Today's plan -->
  <div style="background:${todayCount > 0 ? "#e6f7e6" : "#f5f7fa"};border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 10px;font-size:16px;color:#22a722">📅 Днес · ${todayCount} срещи / разговори</h2>
    ${
      todayBookings.length > 0
        ? `<ul style="margin:0 0 10px;padding-left:20px">${todayBookings
            .map(
              (b) => `<li style="margin-bottom:6px">📅 <strong>${formatTime(b.scheduled_at)}</strong> · ${b.attendee_name}${b.status === "rescheduled" ? ` <span style="color:#b45309">(преместена)</span>` : ""}${b.attendee_phone ? ` · <a href="tel:${b.attendee_phone}" style="color:#22a722">${b.attendee_phone}</a>` : ""}${b.meeting_url ? ` · <a href="${b.meeting_url}" style="color:#0066cc">Влез в срещата →</a>` : ""}</li>`
            )
            .join("")}</ul>`
        : ""
    }
    ${
      (todayFollowups?.length ?? 0) > 0
        ? `<ul style="margin:0;padding-left:20px">${(todayFollowups ?? [])
            .map(
              (c) => `<li style="margin-bottom:6px">📞 <strong>${formatTime(c.next_followup_at!)}</strong> · <a href="${HOST}/admin/clients/${c.id}" style="color:#0066cc">${c.full_name ?? "—"}</a>${c.company ? ` <span style="color:#666">(${c.company})</span>` : ""}</li>`
            )
            .join("")}</ul>`
        : ""
    }
    ${todayCount === 0 ? `<p style="margin:0;color:#666">Празно. Време за хладен outreach или follow-up.</p>` : ""}
  </div>`;

  // Напомнянията за оферти (3-ия / 7-ия ден)
  if (reminders.length > 0) {
    html += `<div style="background:#fff3cd;border-left:4px solid #f59e0b;border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 10px;font-size:16px;color:#b45309">🔔 Оферти без отговор — 3-ия / 7-ия ден, време за звънване</h2>
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

  // „📞 Топ 10 за днес"
  if (topCalls.top.length > 0 || topCalls.cold > 0) {
    html += `<div style="background:#eef2ff;border-left:4px solid #4f46e5;border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 10px;font-size:16px;color:#3730a3">📞 Топ ${topCalls.top.length} за днес${topCalls.warm_total > topCalls.top.length ? ` <span style="font-weight:normal;color:#666;font-size:13px">(от ${topCalls.warm_total} живи)</span>` : ""}</h2>
    <ol style="margin:0;padding-left:20px">
      ${topCalls.top
        .map(
          (r) =>
            `<li style="margin-bottom:6px"><a href="${HOST}/admin/clients/${r.id}" style="color:#0066cc;font-weight:bold">${escapeHtml(r.name)}</a>${r.company && r.company !== r.name ? ` <span style="color:#666">(${escapeHtml(r.company)})</span>` : ""}${r.amount ? ` · <strong>${r.amount.toLocaleString("bg-BG")} €</strong>` : ""} · ${stageLabel(r.stage)} · <span style="color:${r.days_overdue > 0 ? "#b91c1c" : "#22a722"}">${r.days_overdue > 0 ? `${r.days_overdue} дни просрочие` : "за днес"}</span>${r.last_activity ? ` · <span style="color:#666;font-size:12px">последно: ${activityIcon(r.last_activity.type)} ${activityLabel(r.last_activity.type)} ${formatRelative(r.last_activity.occurred_at)}</span>` : ""}${r.phone ? ` · <a href="tel:${escapeHtml(r.phone)}" style="color:#22a722">${escapeHtml(r.phone)}</a>` : ""}</li>`
        )
        .join("")}
    </ol>
    ${topCalls.cold > 0 ? `<p style="margin:10px 0 0;color:#444">❄️ студени за вълна: <strong>${topCalls.cold}</strong> (по 10 на ден)</p>` : ""}
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

  // „💶 Неплатени"
  if (unpaid.overdue.length > 0) {
    const total = unpaid.overdue.reduce((s, o) => s + o.remaining, 0);
    const buckets: Array<["14+" | "7+" | "3+" | "1+", string]> = [
      ["14+", "14+ дни"],
      ["7+", "7–13 дни"],
      ["3+", "3–6 дни"],
      ["1+", "1–2 дни"],
    ];
    html += `<div style="background:#fdf2f8;border-left:4px solid #be185d;border-radius:8px;padding:18px;margin-bottom:18px">
    <h2 style="margin:0 0 10px;font-size:16px;color:#9d174d">💶 Неплатени · ${unpaid.overdue.length} фактури · ${total.toLocaleString("bg-BG", { maximumFractionDigits: 0 })} €</h2>
    ${buckets
      .map(([b, label]) => {
        const rows = unpaid.overdue.filter((o) => overdueBucket(o.days_overdue) === b);
        if (rows.length === 0) return "";
        return `<p style="margin:8px 0 2px;font-weight:bold;color:${b === "14+" ? "#b91c1c" : b === "7+" ? "#b45309" : "#444"}">${label}</p><ul style="margin:0;padding-left:20px">${rows
          .map(
            (o) =>
              `<li style="margin-bottom:4px">${o.invoice.contact_id ? `<a href="${HOST}/admin/clients/${o.invoice.contact_id}" style="color:#0066cc">${escapeHtml(o.invoice.client_name ?? "—")}</a>` : escapeHtml(o.invoice.client_name ?? "—")} · №${escapeHtml(o.invoice.invoice_number ?? "—")} · <strong>${o.remaining.toLocaleString("bg-BG", { maximumFractionDigits: 2 })} €</strong>${o.paid > 0 ? ` <span style="color:#666;font-size:12px">(остатък, платени ${o.paid.toLocaleString("bg-BG", { maximumFractionDigits: 2 })} €)</span>` : ""} · <span style="color:#888;font-size:12px">падеж ${o.invoice.due_date ? new Date(o.invoice.due_date).toLocaleDateString("bg-BG", { timeZone: TZ }) : "—"} · ${o.days_overdue} дни</span></li>`
          )
          .join("")}</ul>`;
      })
      .join("")}
    ${unpaid.notes_written > 0 ? `<p style="margin:8px 0 0;color:#666;font-size:12px">🔔 ${unpaid.notes_written} бележки „просрочена“ записани в картоните (към клиентите не е пращано нищо).</p>` : ""}
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
${
  voiceCalls.length > 0
    ? `\n🎙️ РАЗГОВОРИ С ГЛАСОВИЯ АГЕНТ · ${voiceCalls.length}\n${voiceCalls
        .map(
          (v) =>
            `  ${v.name}${v.phone ? ` (${v.phone})` : ""} · ${v.channel === "telefon" ? "по телефона" : "от сайта"}${v.minutes ? ` · ${v.minutes} мин` : ""}${v.booked ? " · записа си час" : ""}\n    ${v.summary.length > 220 ? `${v.summary.slice(0, 220)}…` : v.summary}`
        )
        .join("\n")}\n`
    : ""
}
📅 ДНЕС · ${todayCount} срещи
${todayBookings.map((b) => `  📅 ${formatTime(b.scheduled_at)} · ${b.attendee_name}${b.status === "rescheduled" ? " (преместена)" : ""}${b.attendee_phone ? ` · ${b.attendee_phone}` : ""}`).join("\n")}
${(todayFollowups ?? []).map((c) => `  📞 ${formatTime(c.next_followup_at!)} · ${c.full_name}${c.company ? ` (${c.company})` : ""}`).join("\n")}

${
  reminders.length > 0
    ? `\n🔔 ОФЕРТИ БЕЗ ОТГОВОР (3-ия / 7-ия ден)\n${reminders.map((r) => `  ${r.contact.full_name}${r.contact.phone ? ` (${r.contact.phone})` : ""} — ${r.daysSince} дни`).join("\n")}\n`
    : ""
}
${
  topCalls.top.length > 0 || topCalls.cold > 0
    ? `\n📞 ТОП ${topCalls.top.length} ЗА ДНЕС\n${topCalls.top
        .map(
          (r, i) =>
            `  ${i + 1}. ${r.name}${r.company && r.company !== r.name ? ` (${r.company})` : ""}${r.amount ? ` · ${r.amount} €` : ""} · ${stageLabel(r.stage)} · ${r.days_overdue > 0 ? `${r.days_overdue} дни просрочие` : "за днес"}${r.last_activity ? ` · последно: ${activityLabel(r.last_activity.type)} ${formatRelative(r.last_activity.occurred_at)}` : ""}${r.phone ? ` · ${r.phone}` : ""}`
        )
        .join("\n")}${topCalls.cold > 0 ? `\n  ❄️ студени за вълна: ${topCalls.cold} (по 10 на ден)` : ""}\n`
    : ""
}
${
  (overdueFollowups?.length ?? 0) > 0
    ? `\n⚠️ ПРОСРОЧЕНИ · ${overdueFollowups?.length}\n${(overdueFollowups ?? []).slice(0, 8).map((c) => `  ${c.full_name}${c.company ? ` (${c.company})` : ""}`).join("\n")}\n`
    : ""
}
${
  unpaid.overdue.length > 0
    ? `\n💶 НЕПЛАТЕНИ · ${unpaid.overdue.length}\n${unpaid.overdue
        .map((o) => `  ${o.invoice.client_name ?? "—"} · №${o.invoice.invoice_number ?? "—"} · ${o.remaining} €${o.paid > 0 ? ` (остатък)` : ""} · ${o.days_overdue} дни след падежа`)
        .join("\n")}\n`
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
      todayBookings: todayBookings.length,
      overdueFollowups: overdueFollowups?.length ?? 0,
      sevenDayReminders: reminders.length,
      topCalls: topCalls.top.length,
      coldForWave: topCalls.cold,
      overdueInvoices: unpaid.overdue.length,
      invoiceNotes: unpaid.notes_written,
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
  return new Date(iso).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return "днес";
  if (days === 1) return "вчера";
  return `преди ${days} дни`;
}
