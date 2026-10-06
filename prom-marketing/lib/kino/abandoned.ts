import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { allRows } from "@/lib/supabase/all-rows";
import { sendEmail } from "@/lib/email/resend";
import { sendTelegram } from "@/lib/notifications/telegram";
import { KINO } from "./config";
import { findAbandoned, type Abandoned, type IntentRow } from "./analytics";
import { sofiaShortDay, sofiaTimeLabel } from "./time";
import { isDbConfigured, kinoLog, SCREENING } from "./server";

/**
 * Изоставено плащане → сигнал. Върти се с крона на 15 минути (kino-flow).
 *
 * Натиснал „Влизам в потока“ (бутон 1) или „Пазя място“ (бутон 2) — или
 * отворил плащането в Stripe — и 15 минути по-късно няма нито плащане, нито
 * капаро: активност kino_abandoned на картона (веднъж на прожекция) и едно
 * известие до Ивайло за всички нови наведнъж — имейл (първият от
 * ALLOWED_ADMIN_EMAILS, иначе emmgivailopetev38@gmail.com) + Telegram.
 * В /admin/kino те са най-горе в списъка за Димитър, докато не платят.
 *
 * Само вътрешно известие — към човека нищо не тръгва. Изключва се с
 * KINO_ABANDONED_ALERTS=0.
 */

const TYPES = ["kino_click", "kino_checkout", "kino_payment", "kino_deposit", "kino_abandoned"];

export interface AbandonedCheck {
  found: number;
  alerted: number;
  errors: string[];
  reason?: string;
}

const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function wantsLabel(w: Abandoned["wants"]): string {
  return w === "stream" ? "„Влизам в потока“" : `„Пазя място“ (капаро ${KINO.prices.deposit} €)`;
}

export async function runAbandonedCheck(now = new Date()): Promise<AbandonedCheck> {
  const base: AbandonedCheck = { found: 0, alerted: 0, errors: [] };
  if (process.env.KINO_ABANDONED_ALERTS === "0") return { ...base, reason: "изключено (KINO_ABANDONED_ALERTS=0)" };
  if (!isDbConfigured()) return { ...base, reason: "няма база" };

  const sb = createServiceClient();
  // Бутоните излизат чак с надписите; денят преди премиерата е с резерв.
  const since = new Date(Date.parse(KINO.screening.premiereISO) - 24 * 3600_000).toISOString();
  const res = await allRows<IntentRow & { id: string }>((from, to) =>
    sb
      .from("contact_activities")
      .select("id, contact_id, activity_type, occurred_at, metadata")
      .in("activity_type", TYPES)
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  );
  if (res.error) return { ...base, errors: [res.error] };

  const list = findAbandoned(
    res.rows.filter((r) => (r.metadata ?? {}).screening === SCREENING),
    now.getTime(),
  );
  const fresh = list.filter((a) => !a.flagged);
  if (fresh.length === 0) return { ...base, found: list.length };

  const ids = fresh.map((a) => a.contactId);
  const [{ data: contacts }, { data: numbers }] = await Promise.all([
    sb.from("contacts").select("id, full_name, phone, email").in("id", ids),
    sb
      .from("contact_activities")
      .select("contact_id, metadata, occurred_at")
      .eq("activity_type", "kino_number")
      .in("contact_id", ids)
      .order("occurred_at", { ascending: true }),
  ]);
  const who = new Map((contacts ?? []).map((c) => [c.id as string, c as { id: string; full_name: string | null; phone: string | null; email: string | null }]));
  const hoursBy = new Map<string, number>();
  for (const n of numbers ?? []) {
    const m = (n.metadata ?? {}) as Record<string, unknown>;
    if (m.screening === SCREENING && typeof m.hours === "number") hoursBy.set(n.contact_id as string, m.hours);
  }

  const alerted: Array<Abandoned & { name: string; phone: string | null; hours: number | null; when: string }> = [];
  for (const a of fresh) {
    const ms = Date.parse(a.intentAt);
    const when = `${sofiaShortDay(ms)}, ${sofiaTimeLabel(ms)}`;
    const hours = hoursBy.get(a.contactId) ?? null;
    const r = await kinoLog({
      contactId: a.contactId,
      type: "kino_abandoned",
      title: `🛒 Натисна ${wantsLabel(a.wants)} и не плати — обади се`,
      body: [`Последно натискане: ${when}. 15 минути по-късно — без плащане.`, hours != null ? `Твоето число: ${hours} ч седмично.` : null]
        .filter(Boolean)
        .join("\n"),
      metadata: { wants: a.wants, intent_at: a.intentAt, hours },
      dedupeKey: `kino:abandoned:${SCREENING}`,
    });
    if (r.error && !r.activity_id) base.errors.push(`${a.contactId}: ${r.error}`);
    if (!r.created) continue;
    const c = who.get(a.contactId);
    alerted.push({ ...a, name: c?.full_name?.trim() || c?.email || "Без име", phone: c?.phone ?? null, hours, when });
  }
  if (alerted.length === 0) return { ...base, found: list.length };

  const subject =
    alerted.length === 1
      ? `🛒 ${alerted[0].name} натисна ${wantsLabel(alerted[0].wants)} и не плати`
      : `🛒 ${alerted.length} души натиснаха „купи“ в „${KINO.title}“ и не платиха`;
  const lines = alerted.map(
    (a) =>
      `${a.name}${a.phone ? ` · ${a.phone}` : ""} — ${wantsLabel(a.wants)}, ${a.when}${a.hours != null ? ` · ${a.hours} ч/седм.` : ""}`,
  );
  const adminTo = (process.env.ALLOWED_ADMIN_EMAILS ?? "emmgivailopetev38@gmail.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  if (adminTo) {
    const mail = await sendEmail({
      to: adminTo,
      subject,
      html: `<p>Натиснаха бутона за плащане в залата на „${esc(KINO.title)}“ и 15 минути по-късно още не са платили. Най-горе са в списъка за Димитър.</p>
<ul>${alerted
        .map(
          (a) =>
            `<li><a href="${KINO.site}/admin/clients/${a.contactId}"><strong>${esc(a.name)}</strong></a>${a.phone ? ` · <a href="tel:${esc(a.phone)}">${esc(a.phone)}</a>` : ""} — ${esc(wantsLabel(a.wants))}, ${esc(a.when)}${a.hours != null ? ` · <strong>${a.hours} ч/седм.</strong> в повтаряща се работа` : ""}</li>`,
        )
        .join("")}</ul>
<p><a href="${KINO.site}/admin/kino">Отвори /admin/kino</a></p>`,
      text: `${lines.join("\n")}\n\n${KINO.site}/admin/kino`,
    });
    if (mail.error) base.errors.push(`email: ${mail.error}`);
  }
  await sendTelegram(`🛒 <b>Натиснаха „купи“ и не платиха</b> (15+ мин)\n${lines.map(esc).join("\n")}`, {
    buttons: [{ text: "📞 Списъкът за Димитър", url: `${KINO.site}/admin/kino` }],
  }).catch(() => false);

  return { ...base, found: list.length, alerted: alerted.length };
}
