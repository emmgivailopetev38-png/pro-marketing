import { after, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { phoneVariants } from "@/lib/contacts/repository";
import { normalizeBgPhone } from "@/lib/leads/obuchenie-az";
import { sendEmail } from "@/lib/email/resend";
import { ownerEmail } from "@/lib/team/notify";
import { escapeHtml } from "@/lib/text/escape";
import { NA_ZHIVO } from "@/lib/uebinar/na-zhivo";
import { sendCapiEvent } from "@/lib/meta/conversions-api";
import { UEBINAR_ORIGIN, UEBINAR_PIXEL_ID } from "@/lib/uebinar/domen";
import { clientIp, cookieValue, fbcFor, safeEventId, splitName } from "@/lib/uebinar/capi";
import { routeNewLead } from "@/lib/team/routing";
import { notifyTeamNewLead } from "@/lib/team/notify";
import { LEAD_OFFERS } from "@/lib/leads/lead-offers";
import { vednagaSledZapisvane } from "@/lib/uebinar/izprashtane";
import { eBot } from "@/lib/uebinar/zapis";

export const dynamic = "force-dynamic";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw").replace(/\/$/, "");
const SOURCE = `uebinar-${NA_ZHIVO.slug}`;

const utm = z.string().trim().max(200).optional();

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().toLowerCase().email().max(200),
  // Съгласието за напомняния по Viber, SMS и имейл е задължително.
  consent: z.literal(true),
  utm_source: utm,
  utm_medium: utm,
  utm_campaign: utm,
  utm_content: utm,
  utm_term: utm,
  fbclid: z.string().trim().max(500).optional(),
  // Същият event_id като на пиксела в браузъра — Meta брои записването веднъж.
  event_id: z.string().trim().max(100).optional(),
  // A/B тестът на лендинга — коя версия е видял (lib/uebinar/ab.ts).
  varianta: z.enum(["A", "B"]).optional(),
  // Капан за ботове: скрито поле, човек не го вижда и не го пълни.
  website: z.string().max(200).optional(),
});

/**
 * POST /api/uebinar/register — записване за обучението на живо от /na-zhivo.
 * Публичен. Прави (или намира) картона, записва действието и известява Ивайло.
 * След отговора праща CompleteRegistration към пиксела на уебинара и от
 * сървъра (Conversions API), със същия event_id като браузъра; резултатът
 * се пази в действието (metadata.capi).
 * Екипът (25.11.2026, Ивайло: „да са обозначени, че са от уебинара… и сетърът,
 * и клоузърът, и останалите да ги виждат“): новият записан минава през
 * разпределянето като всеки нов лийд (при сетъра) и екипът получава писмото
 * „нов лийд“ със значката „🎓 Уебинар“. Клиент или човек в оферта не се
 * разпределя наново.
 * Към записалия се НЕ тръгва автоматично писмо: напомнянията (Viber, SMS,
 * имейл) се пишат отделно и се пускат, след като Ивайло ги одобри.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  // Бот: отговаряме „ок“, нищо не записваме. (eBot не брои телефоните CUBOT за ботове.)
  if (d.website || eBot(request.headers.get("user-agent"))) {
    return NextResponse.json({ ok: true });
  }

  const phone = normalizeBgPhone(d.phone);
  if (!phone) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Един човек = един картон: първо по имейл, после по телефон във всичките му записи.
  let existing: { id: string; full_name: string | null; phone: string | null; email: string | null; stage: string | null } | null = null;
  {
    const { data } = await supabase
      .from("contacts")
      .select("id, full_name, phone, email, stage")
      .eq("email", d.email)
      .limit(1)
      .maybeSingle();
    existing = data;
  }
  if (!existing) {
    const { data } = await supabase
      .from("contacts")
      .select("id, full_name, phone, email, stage")
      .in("phone", phoneVariants(phone))
      .limit(1)
      .maybeSingle();
    existing = data;
  }

  let contactId: string;
  if (existing) {
    contactId = existing.id;
    const patch: { full_name?: string; phone?: string; email?: string } = {};
    if (!existing.full_name) patch.full_name = d.name;
    if (!existing.phone) patch.phone = phone;
    if (!existing.email) patch.email = d.email;
    if (Object.keys(patch).length > 0) {
      await supabase.from("contacts").update(patch).eq("id", contactId);
    }
    // Вече е записан за същото обучение (28.11.2026): връща се от Viber, страницата е
    // заредена наново и той пуска формата пак — един човек го направи 3 пъти за 7 минути.
    // Не е ново записване: без второ действие, без втори „нов лийд“ към екипа и без второ
    // CompleteRegistration към Meta. Писмото и SMS-ът се опитват пак само ако не са тръгнали
    // (ключът в automation_events е същият).
    const { data: predi } = await supabase
      .from("contact_activities")
      .select("id, metadata")
      .eq("contact_id", contactId)
      .eq("activity_type", "uebinar_registration")
      .limit(20);
    const veche = (predi ?? []).some((a) => (a.metadata as { uebinar?: unknown } | null)?.uebinar === NA_ZHIVO.slug);
    if (veche) {
      after(async () => {
        try {
          await vednagaSledZapisvane(contactId);
        } catch (e) {
          console.error("[uebinar/register] vednaga (povtorno)", e instanceof Error ? e.message : e);
        }
      });
      return NextResponse.json({ ok: true, already: true });
    }
  } else {
    const { data: created, error } = await supabase
      .from("contacts")
      .insert({
        full_name: d.name,
        email: d.email,
        phone,
        stage: "lead",
        source: SOURCE,
        notes: `Записа се за обучението на живо „${NA_ZHIVO.name}“ (${NA_ZHIVO.dateLabel})`,
      })
      .select("id")
      .single();
    if (error || !created) {
      console.error("[uebinar/register] contact insert", error?.message);
      return NextResponse.json({ error: "Could not create contact" }, { status: 500 });
    }
    contactId = created.id;
  }

  const eventId = safeEventId(d.event_id) ?? `uebinar-${contactId}-${Date.now()}`;
  const metadata: Record<string, unknown> = {
    uebinar: NA_ZHIVO.slug,
    date_iso: NA_ZHIVO.dateISO,
    full_name: d.name,
    email: d.email,
    phone,
    consent_reminders: true,
    utm_source: d.utm_source ?? null,
    utm_medium: d.utm_medium ?? null,
    utm_campaign: d.utm_campaign ?? null,
    utm_content: d.utm_content ?? null,
    utm_term: d.utm_term ?? null,
    fbclid: d.fbclid ?? null,
    event_id: eventId,
    varianta: d.varianta ?? null,
  };
  const { data: act, error: actError } = await supabase
    .from("contact_activities")
    .insert({
      contact_id: contactId,
      activity_type: "uebinar_registration",
      title: `Записа се за обучението на живо „${NA_ZHIVO.name}“`,
      body: `Дата: ${NA_ZHIVO.dateLabel}${NA_ZHIVO.dateConfirmed ? "" : " (предварителна)"} · съгласие за напомняния по Viber, SMS и имейл: да`,
      created_by: "website",
      metadata,
    })
    .select("id")
    .single();
  if (actError) console.error("[uebinar/register] activity insert", actError.message);

  // Ивайло, 26.11.2026: „имейлът веднага да им идва, щом се запишат“ — потвърждението
  // (писмо №1) и SMS-ът при записване тръгват още сега, след отговора; кронът е резервата.
  after(async () => {
    try {
      await vednagaSledZapisvane(contactId);
    } catch (e) {
      console.error("[uebinar/register] vednaga", e instanceof Error ? e.message : e);
    }
  });

  // При екипа: само нов човек или такъв, който още е „лийд“ (не клиент, не в оферта).
  const zaEkipa = !existing || !existing.stage || existing.stage === "lead";
  if (zaEkipa) {
    after(async () => {
      await routeNewLead(contactId, { split: false }).catch(() => null);
      await notifyTeamNewLead({
        contactId,
        fullName: d.name,
        email: d.email,
        phone,
        sourceLabel: "уебинара (ivailopetev.com)",
        offerLabel: LEAD_OFFERS.uebinar.label,
        extra: [
          { label: "Записа се за", value: NA_ZHIVO.dateLabel },
          { label: "От реклама", value: d.utm_content ?? (d.utm_source ? d.utm_source : "без реклама (директно)") },
          // Ивайло, 26.11.2026: „преди вебинара няма да звъним… звъним след вебинара“.
          { label: "Кога се звъни", value: "Преди уебинара НЕ звъним. След края човекът излиза в „Звънене“ → „🎓 Уебинар“, в групата си (до офертата / излезе рано / не дойде)." },
        ],
      }).catch(() => {});
    });
  }

  // Записването и от сървъра към пиксела на уебинара (след отговора — формата не чака).
  const capiToken = process.env.META_UEBINAR_CAPI_TOKEN || process.env.META_CAPI_TOKEN;
  if (capiToken) {
    const cookie = request.headers.get("cookie");
    const { firstName, lastName } = splitName(d.name);
    const referer = request.headers.get("referer");
    const sourceUrl = referer && /^https:\/\/(www\.)?(ivailopetev\.com|promarketing\.pw)\//.test(referer) ? referer : `${UEBINAR_ORIGIN}/`;
    const userData = {
      email: d.email,
      phone,
      firstName,
      lastName,
      country: "bg",
      external_id: contactId,
      client_ip: clientIp(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip")),
      client_user_agent: request.headers.get("user-agent"),
      fbp: cookieValue(cookie, "_fbp"),
      fbc: fbcFor(cookie, d.fbclid),
    };
    const activityId = act?.id ?? null;
    after(async () => {
      const r = await sendCapiEvent(
        {
          event_name: "CompleteRegistration",
          event_id: eventId,
          event_source_url: sourceUrl,
          action_source: "website",
          user_data: userData,
          custom_data: { content_name: `uebinar-${NA_ZHIVO.slug}`, status: "registered", ...(d.varianta ? { varianta: d.varianta } : {}) },
        },
        { pixelId: UEBINAR_PIXEL_ID, token: capiToken },
      );
      if (!r.ok) console.error("[uebinar/register] capi", r.error);
      if (activityId) {
        await supabase
          .from("contact_activities")
          .update({ metadata: { ...metadata, capi: r.ok ? "ok" : `грешка: ${(r.error ?? "").slice(0, 200)}` } })
          .eq("id", activityId);
      }
    });
  }

  // Известие към Ивайло (не към записалия се). В `after`, за да не се прекъсне с края на заявката.
  after(() => sendEmail({
    to: ownerEmail(),
    subject: `🎓 Записване за „${NA_ZHIVO.name}“ · ${d.name}`,
    html: `<p><strong>${escapeHtml(d.name)}</strong> се записа за обучението на живо „${escapeHtml(NA_ZHIVO.name)}“ (${escapeHtml(NA_ZHIVO.dateLabel)}).</p>
<p>Телефон: ${escapeHtml(phone)} · Имейл: ${escapeHtml(d.email)}${d.utm_campaign ? ` · Кампания: ${escapeHtml(d.utm_campaign)}` : ""}</p>
<p><a href="${SITE}/admin/clients/${contactId}">Виж в CRM-а</a></p>`,
    text: `${d.name} се записа за „${NA_ZHIVO.name}“ (${NA_ZHIVO.dateLabel}). ${phone} / ${d.email}\nCRM: ${SITE}/admin/clients/${contactId}`,
  }).then(() => undefined, () => undefined));

  return NextResponse.json({ ok: true });
}
