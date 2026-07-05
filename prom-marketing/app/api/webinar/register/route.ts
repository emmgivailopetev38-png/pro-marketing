import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { WEBINAR, GIFT, webinarDateLabel } from "@/lib/webinar/config";

export const dynamic = "force-dynamic";

// Имейлът е задължителен — там пращаме подаръка и Zoom линка.
// Телефонът е желателен (SMS/обаждане напомняне), но не блокира записването.
const schema = z.object({
  full_name: z.string().max(120).optional(),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional(),
});

const SITE = "https://promarketing.pw";

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

  const email = parsed.data.email.trim().toLowerCase();
  const full_name = parsed.data.full_name?.trim() || "Участник в уебинара";
  const phone = parsed.data.phone?.trim() || null;
  const supabase = createServiceClient();

  // Дедуп по имейл, после по телефон — както при останалите форми.
  let existing: { id: string; full_name: string | null; phone: string | null } | null = null;
  {
    const { data } = await supabase
      .from("contacts")
      .select("id, full_name, phone")
      .eq("email", email)
      .maybeSingle();
    existing = data;
  }
  if (!existing && phone) {
    const { data: byPhone } = await supabase
      .from("contacts")
      .select("id, full_name, phone")
      .eq("phone", phone)
      .maybeSingle();
    existing = byPhone;
  }

  let contactId: string;
  if (existing) {
    contactId = existing.id;
    const patch: { full_name?: string; phone?: string } = {};
    if (!existing.full_name && full_name) patch.full_name = full_name;
    if (!existing.phone && phone) patch.phone = phone;
    if (Object.keys(patch).length > 0) {
      await supabase.from("contacts").update(patch).eq("id", contactId);
    }
  } else {
    const { data: created, error } = await supabase
      .from("contacts")
      .insert({
        full_name,
        email,
        phone,
        stage: "lead",
        source: "webinar",
        notes: `Записа се за уебинар „${WEBINAR.title}”`,
      })
      .select("id")
      .single();
    if (error || !created) {
      return NextResponse.json({ error: "Could not create contact" }, { status: 500 });
    }
    contactId = created.id;
  }

  await supabase.from("contact_activities").insert({
    contact_id: contactId,
    activity_type: "webinar_registration",
    title: `Записа се за уебинар „${WEBINAR.title}”`,
    body: webinarDateLabel() ? `Дата: ${webinarDateLabel()}` : "Дата: очаква обявяване",
    created_by: "website",
    metadata: { full_name, email, phone, webinar: WEBINAR.title },
  });

  // Потвърждение + подарък към участника.
  const dateLine = webinarDateLabel()
    ? `<p>📅 <strong>${escapeHtml(webinarDateLabel()!)}</strong> · онлайн в Zoom</p>`
    : `<p>📅 Датата се обявява всеки момент — ще я получиш <strong>първи на този имейл</strong>, заедно със Zoom линка.</p>`;
  const zoomLine = WEBINAR.zoomJoinUrl
    ? `<p>🔗 Твоят Zoom линк: <a href="${WEBINAR.zoomJoinUrl}">${WEBINAR.zoomJoinUrl}</a><br/><em>Запази този имейл — с него влизаш.</em></p>`
    : "";

  sendEmail({
    to: email,
    subject: `✅ Записан си: ${WEBINAR.title} (+ подаръкът ти е вътре)`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#0d1221;max-width:560px;">
<p>Здравей, ${escapeHtml(full_name)},</p>
<p>Мястото ти за безплатното онлайн обучение <strong>„${WEBINAR.title}”</strong> е запазено. 🎉</p>
${dateLine}
${zoomLine}
<div style="margin:22px 0;padding:18px 20px;border:2px solid #06b6d4;border-radius:12px;background:#f0fdff;">
<p style="margin:0 0 8px;"><strong>🎁 Подаръкът ти: „${GIFT.title}”</strong></p>
<p style="margin:0 0 12px;color:#334;">${GIFT.bullets.map((b) => `• ${escapeHtml(b)}`).join("<br/>")}</p>
<p style="margin:0;"><a href="${SITE}${GIFT.pdfPath}" style="display:inline-block;background:#06b6d4;color:#03121a;font-weight:bold;padding:11px 22px;border-radius:999px;text-decoration:none;">Свали пакета (PDF) →</a></p>
</div>
<p>До скоро на живо,<br/><strong>${WEBINAR.host.name}</strong><br/>${WEBINAR.host.role}</p>
</div>`,
    text: `Здравей, ${full_name},

Мястото ти за „${WEBINAR.title}” е запазено.
${webinarDateLabel() ? `Дата: ${webinarDateLabel()} (Zoom)` : "Датата се обявява скоро — ще я получиш първи на този имейл."}
${WEBINAR.zoomJoinUrl ? `Zoom линк: ${WEBINAR.zoomJoinUrl}` : ""}

Подаръкът ти „${GIFT.title}”: ${SITE}${GIFT.pdfPath}

До скоро,
${WEBINAR.host.name}`,
  }).catch(() => {});

  // Известие към админа (fire-and-forget).
  const adminTo = (process.env.ALLOWED_ADMIN_EMAILS ?? "ivailopetev38@gmail.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  if (adminTo) {
    sendEmail({
      to: adminTo,
      subject: `🎓 Ново записване за уебинара · ${full_name}`,
      html: `<p><strong>${escapeHtml(full_name)}</strong> се записа за „${WEBINAR.title}”.</p>
<p>Имейл: ${escapeHtml(email)}${phone ? ` · Телефон: ${escapeHtml(phone)}` : ""}</p>
<p><a href="${SITE}/admin/clients/${contactId}">Виж в CRM-а</a></p>`,
      text: `${full_name} се записа за уебинара. ${email}${phone ? ` / ${phone}` : ""}\nCRM: ${SITE}/admin/clients/${contactId}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
