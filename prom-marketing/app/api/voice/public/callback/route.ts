import { NextResponse, after } from "next/server";
import { z } from "zod";
import { toE164 } from "@/lib/cal/create-booking";
import { upsertContactAndLog } from "@/lib/contacts/repository";
import { escapeHtml } from "@/lib/email/escape";
import { sendEmail } from "@/lib/email/resend";
import { sendTelegram } from "@/lib/notifications/telegram";
import { isOutboundConfigured, outboundNumberSpoken, placeOutboundCall } from "@/lib/voice/outbound";
import { checkVoiceBudget, isPublicVoiceEnabled } from "@/lib/voice/public-auth";
import { clientIp, openVoiceSession } from "@/lib/voice/quota";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/public/callback — „Коста да ти звънне".
 *
 * Човекът е попълнил формата на /glas, но микрофонът не тръгва (вграденият
 * браузър на Facebook/Instagram) или просто предпочита телефона. Номерът му
 * вече е при нас — Коста го набира от +1 475 426 9084 със същите динамични
 * променливи като при бутона, така че знае името, дейността и не пита за
 * имейл. Post-call webhook-ът после залепя разговора за същия картон.
 *
 * Редът е същият като при /session: първо лийдът в CRM-а, после лимитите,
 * чак тогава обаждането. Ако набирането не е възможно (няма ключ, ElevenLabs
 * откаже), човекът чува „Ивайло ще ви потърси", а Ивайло получава имейл и
 * Telegram с номера — обаждането е ръчно, но лийдът не е загубен.
 */

const schema = z.object({
  name: z.string().trim().min(2, "име").max(120),
  email: z.string().trim().email("имейл").max(160),
  phone: z.string().trim().min(6, "телефон").max(40),
  business: z.string().trim().max(200).optional(),
  channel: z.string().trim().regex(/^[a-z0-9_-]{1,40}$/i).optional(),
  page: z.string().trim().max(120).optional(),
  /** Защо иска обаждане — за отчета, не за логиката. */
  reason: z.enum(["mikrofon", "izbor"]).optional(),
});

export const VOICE_CALLBACK_ACTIVITY = "voice_callback";

type Mode = "calling" | "manual";

async function notifyOwner(args: {
  d: z.infer<typeof schema>;
  to: string;
  mode: Mode;
  detail: string | null;
  contactId: string | null;
}): Promise<void> {
  const { d, to, mode, detail, contactId } = args;
  const owner = process.env.EMAIL_REPLY_TO || "emmgivailopetev38@gmail.com";
  const crm = contactId ? `https://promarketing.pw/admin/clients/${contactId}` : "https://promarketing.pw/admin";
  const why = d.reason === "mikrofon" ? "микрофонът не тръгна" : "предпочете телефона";

  const subject =
    mode === "calling"
      ? `📞 Коста звъни на ${d.name} · ${to}`
      : `☎️ ЗВЪННИ МУ: ${d.name} · ${to} иска обаждане от Коста`;
  const lead = `<table style="border-collapse:collapse">
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Име:</td><td><strong>${escapeHtml(d.name)}</strong></td></tr>
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Телефон:</td><td><a href="tel:${escapeHtml(to)}">${escapeHtml(to)}</a></td></tr>
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Имейл:</td><td>${escapeHtml(d.email)}</td></tr>
${d.business ? `<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Дейност:</td><td>${escapeHtml(d.business)}</td></tr>` : ""}
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Защо:</td><td>${why}</td></tr>
</table>`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1d2320;max-width:620px">
<p style="margin:0 0 12px"><strong>${
    mode === "calling"
      ? "Коста набира човека в момента. Разговорът ще влезе в картона му, когато приключи."
      : `Човекът поиска обаждане, а Коста не можа да набере — потърси го ти, обещано му е „още днес“.`
  }</strong></p>
${lead}
${mode === "manual" && detail ? `<p style="margin:12px 0 0;color:#6b7772;font-size:13px">Причина: ${escapeHtml(detail)}</p>` : ""}
<p style="margin:18px 0 0">📊 <a href="${crm}" style="color:#0b6b4a">Картонът в CRM-а →</a></p>
</div>`;
  const text = `${mode === "calling" ? "Коста звъни на" : "ЗВЪННИ МУ — иска обаждане от Коста:"} ${d.name}\nТелефон: ${to}\nИмейл: ${d.email}${d.business ? `\nДейност: ${d.business}` : ""}\nЗащо: ${why}${mode === "manual" && detail ? `\nПричина: ${detail}` : ""}\n\nCRM: ${crm}`;

  const tg =
    mode === "calling"
      ? `📞 Коста звъни на <b>${d.name.replace(/</g, "&lt;")}</b> · ${to}${d.business ? ` · ${d.business.replace(/</g, "&lt;")}` : ""}\n<a href="${crm}">Картонът</a>`
      : `☎️ <b>ЗВЪННИ МУ</b> — ${d.name.replace(/</g, "&lt;")} · ${to} иска обаждане от Коста (${why}), а набирането не тръгна${detail ? `: ${detail.replace(/</g, "&lt;")}` : ""}\n<a href="${crm}">Картонът</a>`;

  const [mail] = await Promise.all([sendEmail({ to: owner, subject, html, text }), sendTelegram(tg)]);
  if (mail.error) {
    console.error("[voice/public/callback] имейлът не тръгна", mail.error);
    await sendTelegram(`⚠️ Имейлът за обаждането на ${d.name.replace(/</g, "&lt;")} не тръгна: ${mail.error.replace(/</g, "&lt;")}`);
  }
}

export async function POST(request: Request) {
  if (!isPublicVoiceEnabled()) {
    return NextResponse.json({ error: "disabled", spoken: "Гласовото демо е спряно в момента." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", detail: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const channel = d.channel ?? "sait";

  const to = toE164(d.phone);
  if (!to) {
    return NextResponse.json(
      { error: "phone", spoken: "Провери телефона — трябват поне девет цифри, например 0888 123 456." },
      { status: 400 }
    );
  }

  let contactId: string | null = null;
  try {
    const lead = await upsertContactAndLog({
      full_name: d.name,
      email: d.email,
      phone: d.phone,
      company: d.business || null,
      source: "voice_web",
      source_ref: channel === "sait" ? null : channel,
      initial_stage: "lead",
      activity: {
        type: VOICE_CALLBACK_ACTIVITY,
        title: "Поиска Коста да му звънне",
        body: `${d.reason === "mikrofon" ? "Микрофонът не тръгна в браузъра му." : "Предпочете телефона пред микрофона."}${d.business ? ` Дейност: ${d.business}.` : ""} Номер за набиране: ${to}.`,
        created_by: "website",
        metadata: { name: d.name, email: d.email, phone: d.phone, to, business: d.business ?? null, channel, page: d.page ?? null, reason: d.reason ?? null },
      },
    });
    contactId = lead.contact_id;
    if (lead.error) console.error("[voice/public/callback] lead", lead.error);
  } catch (err) {
    console.error("[voice/public/callback] lead хвърли", err);
  }

  // Същите тавани като при бутона: това обаждане също харчи минути.
  const seat = await openVoiceSession({ email: d.email, phone: to, ip: clientIp(request), contactId, channel: "obratno" });
  if (!seat.ok) {
    return NextResponse.json({ error: `quota_${seat.reason}`, spoken: seat.spoken }, { status: 429 });
  }
  const budget = await checkVoiceBudget();
  if (!budget.ok) {
    return NextResponse.json({ error: "budget", spoken: budget.spoken }, { status: 429 });
  }

  const minutes = Math.max(1, Math.floor(seat.seconds / 60));
  let mode: Mode = "manual";
  let detail: string | null = null;

  if (isOutboundConfigured()) {
    const call = await placeOutboundCall({
      toNumber: to,
      variables: {
        ime: d.name,
        imeil: d.email,
        telefon: to,
        deynost: d.business ?? "",
        kanal: "sait",
        minuti: String(minutes),
        sesia: seat.sessionKey,
      },
    });
    if (call.ok) {
      mode = "calling";
    } else {
      detail = `${call.reason}${call.detail ? `: ${call.detail}` : ""}`;
      console.error("[voice/public/callback] набирането не тръгна", detail);
    }
  } else {
    detail = "not_configured (ELEVENLABS_API_KEY с право ElevenAgents Write липсва)";
  }

  const notify = notifyOwner({ d, to, mode, detail, contactId }).catch((e) =>
    console.error("[voice/public/callback] notify", e)
  );
  after(async () => {
    await notify;
  });
  // Изчакваме кратко, за да тръгне известието преди отговора — а ако Resend
  // се бави, `after()` го довършва след него.
  await Promise.race([notify, new Promise<void>((r) => setTimeout(r, 2500))]);

  const spoken =
    mode === "calling"
      ? `Коста ти звъни в момента от номер ${outboundNumberSpoken()}. Вдигни — номерът е чужд, но е той.`
      : "Записах, че искаш обаждане. Ивайло ще ти звънне лично на този номер още днес.";

  return NextResponse.json({ ok: true, mode, spoken, number: outboundNumberSpoken() });
}
