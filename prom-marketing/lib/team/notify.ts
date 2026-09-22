import "server-only";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { sendTelegram } from "@/lib/notifications/telegram";
import { decodeFormAnswers } from "@/lib/leads/form-labels";
import { newLeadNotifyEmails } from "./repository";
import { fmtSofia } from "./time";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw").replace(/\/$/, "");

function ownerEmail(): string {
  return (
    process.env.EMAIL_REPLY_TO?.trim() ||
    (process.env.ALLOWED_ADMIN_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean)[0] ||
    "emmgivailopetev38@gmail.com"
  );
}

function ownerAddresses(): Set<string> {
  const set = new Set<string>();
  const add = (s: string | undefined) => s && set.add(s.trim().toLowerCase());
  add(process.env.EMAIL_REPLY_TO);
  add("emmgivailopetev38@gmail.com");
  for (const a of (process.env.ALLOWED_ADMIN_EMAILS ?? "").split(",")) add(a);
  return set;
}

export interface NewLeadForTeam {
  contactId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  /** „Meta реклама“ · „сайта“ · „гласовия агент“ … — както ще се чете в изречение */
  sourceLabel: string;
  adName?: string | null;
  campaignName?: string | null;
  /** meta_leads.field_data — превежда се тук */
  fieldData?: unknown;
  /** свободен текст (форма на сайта: дейност + съобщение) */
  extra?: Array<{ label: string; value: string | null | undefined }>;
}

/**
 * Писмо до хората от екипа, които звънят на новите лийдове. Отделно от
 * писмото на собственика: линкът води към /ekip (опашката), не към /admin,
 * където те нямат вход. Никога не хвърля — известието е странично.
 */
export async function notifyTeamNewLead(lead: NewLeadForTeam): Promise<void> {
  let to: string[];
  try {
    const owners = ownerAddresses();
    to = (await newLeadNotifyEmails()).filter((e) => !owners.has(e));
  } catch {
    return;
  }
  if (to.length === 0) return;

  const name = lead.fullName?.trim() || lead.email || lead.phone || "без име";
  const answers = decodeFormAnswers(lead.fieldData);
  const rows: Array<[string, string]> = [
    ["Име", name],
    ["Телефон", lead.phone ? `<a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a>` : "—"],
    ["Имейл", lead.email ? escapeHtml(lead.email) : "—"],
    ["Откъде", escapeHtml(lead.sourceLabel) + (lead.adName ? ` · ${escapeHtml(lead.adName)}` : "")],
    ...answers.map((a): [string, string] => [escapeHtml(a.question), `<strong>${escapeHtml(a.answer)}</strong>`]),
    ...(lead.extra ?? [])
      .filter((e) => e.value && String(e.value).trim())
      .map((e): [string, string] => [escapeHtml(e.label), escapeHtml(String(e.value)).replace(/\n/g, "<br/>")]),
  ];
  const link = `${SITE}/ekip#lead-${lead.contactId}`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>Нов човек за звънене — ${escapeHtml(name)}</strong></p>
<p>Оставил е телефона си току-що. Най-топъл е сега — звънни до няколко минути.</p>
<table style="border-collapse:collapse;">
${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#777;vertical-align:top;">${k}:</td><td>${v}</td></tr>`).join("\n")}
</table>
<p style="margin-top:18px;"><a href="${link}" style="display:inline-block;background:#0891b2;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Отвори го в опашката за звънене</a></p>
<p style="color:#777;font-size:13px;">Отбележи изхода от разговора там — с какво се занимава и дали има среща.</p>
</div>`;
  const text = [
    `Нов човек за звънене: ${name}`,
    `Телефон: ${lead.phone ?? "—"}`,
    `Имейл: ${lead.email ?? "—"}`,
    `Откъде: ${lead.sourceLabel}${lead.adName ? ` · ${lead.adName}` : ""}`,
    ...answers.map((a) => `${a.question}: ${a.answer}`),
    ...(lead.extra ?? []).filter((e) => e.value).map((e) => `${e.label}: ${e.value}`),
    "",
    `Опашката: ${link}`,
  ].join("\n");

  await sendEmail({
    to,
    subject: `📞 Нов лийд за звънене · ${name}`,
    html,
    text,
  }).catch(() => {});
}

export interface CancelledBooking {
  /** null, ако картонът не е намерен — писмото пак тръгва, само без линк */
  contactId: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  scheduledAtIso: string;
  /** причината, ако човекът е написал такава в Cal.com */
  reason: string | null;
  /** кой я отмени, както ще се чете: „човекът“ · „Ивайло“ */
  by: string;
}

/**
 * Някой се отказа от среща. Научават и двамата: Ивайло — за да знае, че часът
 * му се е освободил; човекът за срещите — за да звънне и да я премести, вместо
 * срещата да се изпари тихо. Известието е странично: никога не хвърля.
 */
export async function notifyCancelledBooking(c: CancelledBooking): Promise<void> {
  const when = fmtSofia(c.scheduledAtIso);
  const tel = c.phone ? `<a href="tel:${escapeHtml(c.phone)}">${escapeHtml(c.phone)}</a>` : "—";
  const queue = c.contactId ? `${SITE}/ekip#lead-${c.contactId}` : `${SITE}/ekip`;
  const card = c.contactId ? `${SITE}/admin/clients/${c.contactId}` : `${SITE}/admin/bookings`;
  const rows: Array<[string, string]> = [
    ["Кой", `<strong>${escapeHtml(c.name)}</strong>`],
    ["Кога беше", `<strong>${escapeHtml(when)}</strong> (София)`],
    ["Телефон", tel],
    ["Имейл", c.email ? escapeHtml(c.email) : "—"],
    ["Отмени я", escapeHtml(c.by)],
    ["Причина", escapeHtml(c.reason ?? "") || "— (не е посочена)"],
  ];
  const table = `<table style="border-collapse:collapse;">${rows
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#777;vertical-align:top;">${k}:</td><td>${v}</td></tr>`)
    .join("")}</table>`;

  // 1) Човекът за срещите — той ще звънне и ще я премести.
  let team: string[] = [];
  try {
    const owners = ownerAddresses();
    team = (await newLeadNotifyEmails()).filter((e) => !owners.has(e));
  } catch {
    team = [];
  }
  const teamMail = team.length
    ? sendEmail({
        to: team,
        subject: `❌ Отказана среща · ${c.name} · ${when}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>${escapeHtml(c.name)} отказа срещата си.</strong></p>
<p>Звънни му днес и я премести — отказът най-често е за часа, не за разговора. Ако не вдигне, натисни „Не вдигна“ и картата остава под ръка.</p>
${table}
<p style="margin-top:18px;"><a href="${queue}" style="display:inline-block;background:#0891b2;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Отвори го в опашката за звънене</a></p>
<p style="color:#777;font-size:13px;">Новият час се записва от същата карта — „Записах среща“.</p>
</div>`,
        text: [
          `${c.name} отказа срещата си (${when}, София).`,
          `Телефон: ${c.phone ?? "—"}`,
          `Имейл: ${c.email ?? "—"}`,
          `Отмени я: ${c.by}`,
          `Причина: ${c.reason ?? "— (не е посочена)"}`,
          "",
          `Звънни и я премести: ${queue}`,
        ].join("\n"),
      }).catch(() => {})
    : Promise.resolve();

  // 2) Ивайло — часът му се е освободил.
  const lines = [
    `❌ <b>Отказана среща</b>`,
    `${escapeHtml(c.name)} · ${escapeHtml(when)}`,
    c.phone ? `📞 ${escapeHtml(c.phone)}` : null,
    `Отмени я: ${escapeHtml(c.by)}`,
    c.reason ? `📝 ${escapeHtml(c.reason)}` : null,
    team.length
      ? `→ ${escapeHtml(team.join(", "))} получи известие да звънне и да я премести.`
      : `⚠️ Никой от екипа не получи известие.`,
  ].filter(Boolean) as string[];

  await Promise.all([
    teamMail,
    sendTelegram(lines.join("\n"), { buttons: [{ text: "Картонът в CRM-а", url: card }] }).catch(() => false),
    sendEmail({
      to: ownerEmail(),
      subject: `❌ Отказана среща · ${c.name} · ${when}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>${escapeHtml(c.name)} отказа срещата си.</strong> Часът ти е свободен.</p>
${table}
<p style="margin-top:18px;">📊 <a href="${card}">Картонът в CRM-а</a> · <a href="${SITE}/admin/bookings">Срещи</a></p>
<p style="color:#777;font-size:13px;">${team.length ? "Екипът е уведомен да звънне и да я премести." : "⚠️ Няма активен човек за звънене — никой не е уведомен."}</p>
</div>`,
      text: `${c.name} отказа срещата си: ${when} (София)\nТелефон: ${c.phone ?? "—"}\nОтмени я: ${c.by}\nПричина: ${c.reason ?? "—"}\n\nКартон: ${card}`,
    }).catch(() => ({ id: null, error: "send failed" })),
  ]);
}

export interface BookingByTeam {
  actorName: string;
  contactId: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  business: string | null;
  note: string | null;
  scheduledAtIso: string;
}

/** Собственикът научава веднага, когато човек от екипа запише среща. */
export async function notifyOwnerBooking(b: BookingByTeam): Promise<void> {
  const when = fmtSofia(b.scheduledAtIso);
  const card = `${SITE}/admin/clients/${b.contactId}`;
  const lines = [
    `📅 <b>${escapeHtml(b.actorName)} записа среща</b>`,
    `${escapeHtml(b.contactName)} · ${escapeHtml(when)}`,
    b.phone ? `📞 ${escapeHtml(b.phone)}` : null,
    b.email ? `✉️ ${escapeHtml(b.email)}` : null,
    b.business ? `🧭 ${escapeHtml(b.business)}` : null,
    b.note ? `📝 ${escapeHtml(b.note)}` : null,
  ].filter(Boolean) as string[];

  await Promise.all([
    sendTelegram(lines.join("\n"), { buttons: [{ text: "Картонът в CRM-а", url: card }] }).catch(() => false),
    sendEmail({
      to: ownerEmail(),
      subject: `📅 ${b.actorName} записа среща · ${b.contactName} · ${when}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>${escapeHtml(b.actorName)} уговори среща.</strong></p>
<table style="border-collapse:collapse;">
<tr><td style="padding:4px 12px 4px 0;color:#777;">Кой:</td><td><strong>${escapeHtml(b.contactName)}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Кога:</td><td><strong>${escapeHtml(when)}</strong> (София)</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Телефон:</td><td>${b.phone ? `<a href="tel:${escapeHtml(b.phone)}">${escapeHtml(b.phone)}</a>` : "—"}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Имейл:</td><td>${b.email ? escapeHtml(b.email) : "— (няма; покана не е пращана)"}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Дейност:</td><td>${escapeHtml(b.business ?? "") || "—"}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;vertical-align:top;">Бележка:</td><td>${escapeHtml(b.note ?? "").replace(/\n/g, "<br/>") || "—"}</td></tr>
</table>
<p style="margin-top:18px;">📊 <a href="${card}">Картонът в CRM-а</a> · <a href="${SITE}/admin/bookings">Срещи</a></p>
<p style="color:#777;font-size:13px;">Срещата е записана в CRM-а. Ако искаш покана с Meet линк за човека, запиши я и в календара.</p>
</div>`,
      text: `${b.actorName} записа среща: ${b.contactName} · ${when} (София)\nТелефон: ${b.phone ?? "—"}\nИмейл: ${b.email ?? "—"}\nДейност: ${b.business ?? "—"}\nБележка: ${b.note ?? "—"}\n\nКартон: ${card}`,
    }).catch(() => ({ id: null, error: "send failed" })),
  ]);
}

export interface HandoffByTeam {
  actorName: string;
  contactId: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  business: string | null;
  note: string | null;
  /** докога Ивайло да звънне (UTC ISO) */
  whenIso: string;
}

/** Човек от екипа предава лийд на собственика — той ще звъни лично. */
export async function notifyOwnerHandoff(h: HandoffByTeam): Promise<void> {
  const when = fmtSofia(h.whenIso);
  const card = `${SITE}/admin/clients/${h.contactId}`;
  const lines = [
    `🤝 <b>${escapeHtml(h.actorName)} ти предава човек — звънни му до ${escapeHtml(when)}</b>`,
    escapeHtml(h.contactName),
    h.phone ? `📞 ${escapeHtml(h.phone)}` : null,
    h.email ? `✉️ ${escapeHtml(h.email)}` : null,
    h.business ? `🧭 ${escapeHtml(h.business)}` : null,
    h.note ? `📝 ${escapeHtml(h.note)}` : null,
  ].filter(Boolean) as string[];

  await Promise.all([
    sendTelegram(lines.join("\n"), { buttons: [{ text: "Картонът в CRM-а", url: card }] }).catch(() => false),
    sendEmail({
      to: ownerEmail(),
      subject: `🤝 ${h.actorName} ти предава ${h.contactName} · звънни до ${when}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>${escapeHtml(h.actorName)} говори с човека и той иска да се чуе направо с теб.</strong></p>
<table style="border-collapse:collapse;">
<tr><td style="padding:4px 12px 4px 0;color:#777;">Кой:</td><td><strong>${escapeHtml(h.contactName)}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Звънни до:</td><td><strong>${escapeHtml(when)}</strong> (София) — в сутрешния ти списък е</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Телефон:</td><td>${h.phone ? `<a href="tel:${escapeHtml(h.phone)}">${escapeHtml(h.phone)}</a>` : "—"}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Имейл:</td><td>${h.email ? escapeHtml(h.email) : "—"}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Дейност:</td><td>${escapeHtml(h.business ?? "") || "—"}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;vertical-align:top;">Какво каза:</td><td>${escapeHtml(h.note ?? "").replace(/\n/g, "<br/>") || "—"}</td></tr>
</table>
<p style="margin-top:18px;">📊 <a href="${card}">Картонът в CRM-а</a> · <a href="${SITE}/admin/follow-up">Списъкът за звънене</a></p>
</div>`,
      text: `${h.actorName} ти предава: ${h.contactName} · звънни до ${when} (София)\nТелефон: ${h.phone ?? "—"}\nИмейл: ${h.email ?? "—"}\nДейност: ${h.business ?? "—"}\nКакво каза: ${h.note ?? "—"}\n\nКартон: ${card}`,
    }).catch(() => ({ id: null, error: "send failed" })),
  ]);
}

// ── Напомняне за недокоснат лийд ────────────────────────────────────────────

import { createServiceClient } from "@/lib/supabase/service";
import {
  MAX_AGE_MINUTES,
  dueReminders,
  levelLabel,
  reminderKey,
  withinWorkingHours,
  type ReminderCandidate,
} from "./lead-reminders";

const ATTEMPT_TYPES = ["call", "meeting", "viber_sent"];

export interface LeadReminderResult {
  ok: boolean;
  skipped?: "quiet_hours" | "no_recipients" | "nothing_due";
  reminded: number;
  recipients: number;
  names?: string[];
}

/**
 * Проверява недокоснатите нови лийдове и праща ЕДНО писмо с всички, които
 * чакат. Извиква се от крона на всеки половин час; безопасно е да се пусне
 * пак — вече пратените напомняния се пазят в `automation_events`.
 */
export async function runLeadReminders(opts: { now?: Date; force?: boolean } = {}): Promise<LeadReminderResult> {
  const now = opts.now ?? new Date();
  if (!opts.force && !withinWorkingHours(now)) {
    return { ok: true, skipped: "quiet_hours", reminded: 0, recipients: 0 };
  }

  const to = (await newLeadNotifyEmails().catch(() => [] as string[])).filter((e) => !ownerAddresses().has(e));
  if (to.length === 0) return { ok: true, skipped: "no_recipients", reminded: 0, recipients: 0 };

  const sb = createServiceClient();
  const since = new Date(now.getTime() - MAX_AGE_MINUTES * 60_000).toISOString();
  const { data: rows } = await sb
    .from("contacts")
    .select("id, full_name, phone, email, business, source, created_at")
    .eq("stage", "lead")
    .not("phone", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);
  const fresh = (rows ?? []) as ReminderCandidate[];
  if (fresh.length === 0) return { ok: true, skipped: "nothing_due", reminded: 0, recipients: to.length };

  const ids = fresh.map((c) => c.id);
  const [{ data: touched }, { data: sent }] = await Promise.all([
    sb.from("contact_activities").select("contact_id").in("contact_id", ids).in("activity_type", ATTEMPT_TYPES),
    sb.from("automation_events").select("idempotency_key").eq("event_type", "lead_reminder").gte("created_at", since),
  ]);
  const touchedIds = new Set(((touched ?? []) as Array<{ contact_id: string }>).map((t) => t.contact_id));
  const alreadySent = new Set(
    ((sent ?? []) as Array<{ idempotency_key: string | null }>).map((s) => s.idempotency_key ?? "").filter(Boolean)
  );

  const due = dueReminders(
    fresh.filter((c) => !touchedIds.has(c.id)),
    alreadySent,
    now
  );
  if (due.length === 0) return { ok: true, skipped: "nothing_due", reminded: 0, recipients: to.length };

  const rowsHtml = due
    .map((d) => {
      const c = d.contact;
      const name = c.full_name?.trim() || c.phone || "без име";
      const bits = [levelLabel(d.level), c.business, c.source === "meta_lead" ? "от реклама" : null]
        .filter(Boolean)
        .map((b) => escapeHtml(String(b)))
        .join(" · ");
      return `<tr>
<td style="padding:6px 12px 6px 0;vertical-align:top;"><strong>${escapeHtml(name)}</strong><br/><span style="color:#777;font-size:13px;">${bits}</span></td>
<td style="padding:6px 0;vertical-align:top;">${c.phone ? escapeHtml(c.phone) : "—"}<br/>
<a href="${SITE}/ekip#lead-${c.id}" style="color:#0891b2;font-size:13px;">отвори картата</a></td>
</tr>`;
    })
    .join("\n");

  const subject =
    due.length === 1
      ? `🔔 ${due[0].contact.full_name?.trim() || due[0].contact.phone || "Лийд"} още чака обаждане`
      : `🔔 ${due.length} души чакат обаждане`;

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>${due.length === 1 ? "Един човек" : `${due.length} души`} от рекламите още не е чул нищо от нас.</strong></p>
<p>Най-топли са през първия час — колкото по-късно звъннеш, толкова по-студен е разговорът.</p>
<table style="border-collapse:collapse;">
${rowsHtml}
</table>
<p style="margin-top:18px;"><a href="${SITE}/ekip" style="display:inline-block;background:#0891b2;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Отвори опашката за звънене</a></p>
<p style="color:#777;font-size:13px;">Ако вече си звънял и не са вдигнали, натисни „Не вдигна“ — картата остава при теб и напомнянето спира.</p>
</div>`;

  const text = [
    `${due.length} души чакат обаждане:`,
    ...due.map((d) => `• ${d.contact.full_name ?? d.contact.phone ?? "без име"} · ${d.contact.phone ?? "—"} · ${levelLabel(d.level)}`),
    "",
    `Опашката: ${SITE}/ekip`,
  ].join("\n");

  const res = await sendEmail({ to, subject, html, text }).catch(() => ({ id: null, error: "send failed" }));
  if (res.error) return { ok: false, reminded: 0, recipients: to.length };

  await sb
    .from("automation_events")
    .insert(
      due.map((d) => ({
        event_type: "lead_reminder",
        status: "done",
        related_contact_id: d.contact.id,
        summary: `Напомняне ниво ${d.level} — ${d.contact.full_name ?? d.contact.phone ?? "лийд"} ${levelLabel(d.level)}`,
        detail: { level: d.level, age_minutes: d.ageMinutes, to },
        idempotency_key: reminderKey(d.contact.id, d.level),
      }))
    )
    .then(() => null, () => null);

  return { ok: true, reminded: due.length, recipients: to.length, names: due.map((d) => d.contact.full_name ?? d.contact.phone ?? "—") };
}
