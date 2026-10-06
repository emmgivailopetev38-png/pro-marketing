import { NextResponse, after } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { upsertContactAndLog } from "@/lib/contacts/repository";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { unsubscribeUrl } from "@/lib/email/unsubscribe-token";
import { sendTelegram } from "@/lib/notifications/telegram";
import { KINO, KINO_SOURCE } from "@/lib/kino/config";
import { premiereLabels } from "@/lib/kino/time";
import { normalizePhone, isKinoRole, roleLabel, seatFor, pickUtm, utmLine, isBgMobile } from "@/lib/kino/people";
import { ticketEmail } from "@/lib/kino/emails";
import { smsText } from "@/lib/kino/schedule";
import { sendSms, smsStatus } from "@/lib/kino/sms";
import { kinoCapi, safeEventId } from "@/lib/kino/meta";
import { isDbConfigured, kinoLinks, firstName, SCREENING } from "@/lib/kino/server";
import { isKinoDemoEnv } from "@/lib/kino/token";

export const dynamic = "force-dynamic";

/**
 * POST /api/kino/register — „Вземи безплатен билет“.
 *
 * 1. Картон в CRM-а (намира се по имейл, после по телефона в какъвто и да е
 *    запис) с source „kino-valnata“ и активност kino_registration — ролята,
 *    какво му яде времето, UTM-ите и съгласието вътре.
 * 2. Личният билет (подписан линк) — връща се веднага на страницата.
 * 3. След отговора (after): писмото с билета (Resend), SMS „билетът ти е
 *    запазен“ (само ако SMS-ите са включени), CompleteRegistration към Meta
 *    със същия event_id като пиксела, кратко известие към Ивайло.
 * Липсва ли env (Resend, Meta, Telegram, Twilio) — съответната стъпка мълчи.
 */

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(3).max(40),
  email: z.string().trim().max(200).toLowerCase().pipe(z.email()),
  role: z.string(),
  pain: z.string().trim().max(1000).optional(),
  consent: z.literal(true),
  utm: z.record(z.string(), z.unknown()).optional(),
  eventId: z.string().optional(),
  fbp: z.string().max(200).optional(),
  fbc: z.string().max(400).optional(),
  page: z.string().max(600).optional(),
  /** капан за ботове — човек не го вижда и не го попълва */
  website: z.string().optional(),
});

function demoContactId(email: string): string {
  const h = createHash("sha256").update(`kino-demo:${email}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path?.[0] ?? "");
    const message =
      field === "email"
        ? "Провери имейла — на него идва билетът."
        : field === "name"
          ? "Как да те запишем? Напиши името си."
          : field === "consent"
            ? "Отметни съгласието — без него не можем да ти пратим напомняне."
            : "Провери полетата и опитай пак.";
    return NextResponse.json({ error: message, field }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // бот — тихо „успех“
  if (!isKinoRole(d.role)) {
    return NextResponse.json({ error: "Избери какво описва теб най-добре.", field: "role" }, { status: 400 });
  }
  const phone = normalizePhone(d.phone);
  if (!phone.ok) return NextResponse.json({ error: phone.reason, field: "phone" }, { status: 400 });

  const utm = pickUtm(d.utm ?? null);
  const eventId = safeEventId(d.eventId) ?? `kino_reg_${Date.now()}`;
  const labels = premiereLabels();

  // Преглед без база (локално или Vercel preview): билетът работи, нищо не се записва.
  if (!isDbConfigured()) {
    if (!isKinoDemoEnv()) {
      return NextResponse.json({ error: "Записването е временно недостъпно. Опитай пак след малко." }, { status: 503 });
    }
    const links = kinoLinks(demoContactId(d.email));
    return NextResponse.json({ ok: true, demo: true, ticketUrl: links ? `/kino/bilet?t=${links.token}` : "/kino", eventId });
  }

  const bodyLines = [
    `Роля: ${roleLabel(d.role)}`,
    d.pain ? `Яде му времето: „${d.pain}“` : null,
    utmLine(utm) ? `Източник: ${utmLine(utm)}` : null,
    `Телефон: ${phone.pretty}`,
  ].filter(Boolean);

  const res = await upsertContactAndLog({
    full_name: d.name,
    email: d.email,
    phone: phone.e164,
    source: KINO_SOURCE,
    activity: {
      type: "kino_registration",
      title: `🎟️ Взе билет за „${KINO.title}“ · ${labels.short}`,
      body: bodyLines.join("\n"),
      created_by: "website",
      dedupe_key: `kino:reg:${SCREENING}`,
      metadata: {
        funnel: "kino",
        screening: SCREENING,
        role: d.role,
        pain: d.pain || null,
        utm,
        consent_at: new Date().toISOString(),
        consent_channels: ["email", "sms", "viber"],
        event_id: eventId,
        page: d.page ?? null,
      },
    },
  });
  if (!res.contact_id) {
    console.error("[kino/register]", res.error);
    return NextResponse.json({ error: "Не успяхме да запазим билета. Опитай пак след малко." }, { status: 500 });
  }
  const contactId = res.contact_id;
  const links = kinoLinks(contactId);
  if (!links) {
    console.error("[kino/register] няма ключ за билетите (KINO_TOKEN_SECRET / INTERNAL_SEND_TOKEN)");
    return NextResponse.json({ error: "Билетът е запазен, но линкът не се генерира. Пиши ни — ще ти го пратим." }, { status: 500 });
  }

  after(async () => {
    const name = firstName(d.name);
    const mail = ticketEmail({
      name,
      links,
      labels,
      seat: seatFor(contactId),
      viberUrl: KINO.viberClubUrl,
      unsubscribeUrl: unsubscribeUrl(contactId),
    });
    const sent = await sendEmail({ to: d.email, ...mail });
    if (sent.error) console.error("[kino/register] email", sent.error);

    // SMS „билетът ти е запазен“ — веднъж на човек, само при включени SMS-и.
    if (smsStatus().enabled && isBgMobile(phone.e164)) {
      const sb = createServiceClient();
      const { data: already } = await sb
        .from("contact_activities")
        .select("id")
        .eq("contact_id", contactId)
        .eq("activity_type", "kino_sms_ticket")
        .limit(1);
      if (!already?.length) {
        const text = smsText("ticket", links.short.replace(/^https?:\/\//, ""), { day: labels.short.split(" · ")[0], time: labels.time });
        const r = text ? await sendSms(phone.e164, text) : { ok: false };
        if (r.ok && text) {
          await sb.from("contact_activities").insert({
            contact_id: contactId,
            activity_type: "kino_sms_ticket",
            title: `💬 Кино SMS: ${text}`,
            created_by: "kino",
            metadata: { funnel: "kino", screening: SCREENING, stage: "ticket" },
          });
        }
      }
    }

    await kinoCapi({
      event: "CompleteRegistration",
      eventId,
      request,
      url: d.page ?? `${KINO.site}/kino`,
      contact: { id: contactId, email: d.email, phone: phone.e164, name: d.name },
      fbp: d.fbp ?? null,
      fbc: d.fbc ?? null,
      custom: { status: d.role },
    });

    if (process.env.KINO_NOTIFY_REGISTRATIONS !== "0") {
      const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      await sendTelegram(
        `🎟️ Нов билет за „${KINO.title}“: <b>${esc(d.name)}</b> · ${esc(roleLabel(d.role))} · ${esc(phone.pretty)}${d.pain ? `\n„${esc(d.pain.slice(0, 160))}“` : ""}`,
        { buttons: [{ text: "👤 Картонът", url: `${KINO.site}/admin/clients/${contactId}` }] },
      ).catch(() => false);
    }
  });

  return NextResponse.json({ ok: true, ticketUrl: `/kino/bilet?t=${links.token}`, eventId });
}
