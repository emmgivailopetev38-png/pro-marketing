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
