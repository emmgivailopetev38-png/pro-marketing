import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

const schema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().min(6).max(40),
  message: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.message }, { status: 400 });
  }

  const { full_name, email, phone, message } = parsed.data;
  const supabase = createServiceClient();

  // Upsert contact by email — if exists, refresh missing fields.
  const { data: existing } = await supabase
    .from("contacts")
    .select("id, full_name, phone")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  let contactId: string;
  if (existing) {
    contactId = existing.id;
    const patch: { full_name?: string; phone?: string } = {};
    if (!existing.full_name) patch.full_name = full_name;
    if (!existing.phone) patch.phone = phone;
    if (Object.keys(patch).length > 0) {
      await supabase.from("contacts").update(patch).eq("id", contactId);
    }
  } else {
    const { data: created, error } = await supabase
      .from("contacts")
      .insert({
        full_name,
        email: email.toLowerCase(),
        phone,
        stage: "lead",
        source: "website_form",
        notes: message || null,
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
    activity_type: "website_form",
    title: "Изпрати форма от уебсайта",
    body: message || null,
    created_by: "website",
    metadata: { full_name, email, phone, message: message || null },
  });

  // Notify admin (fire-and-forget — don't fail the form if email is down).
  const adminTo = (process.env.ALLOWED_ADMIN_EMAILS ?? "ivailopetev38@gmail.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];

  if (adminTo) {
    sendEmail({
      to: adminTo,
      subject: `🚀 Нов lead от сайта · ${full_name}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>Нов lead от формата на promarketing.pw</strong></p>
<table style="border-collapse:collapse;">
<tr><td style="padding:4px 12px 4px 0;color:#777;">Име:</td><td><strong>${full_name}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Имейл:</td><td><a href="mailto:${email}">${email}</a></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Телефон:</td><td><a href="tel:${phone}">${phone}</a></td></tr>
${message ? `<tr><td style="padding:4px 12px 4px 0;color:#777;vertical-align:top;">Съобщение:</td><td>${message.replace(/\n/g, "<br/>")}</td></tr>` : ""}
</table>
<p style="margin-top:18px;">📊 <a href="https://promarketing.pw/admin/clients/${contactId}">Виж в CRM-а</a></p>
</div>`,
      text: `Нов lead от promarketing.pw

Име: ${full_name}
Имейл: ${email}
Телефон: ${phone}
${message ? `\nСъобщение:\n${message}` : ""}

CRM: https://promarketing.pw/admin/clients/${contactId}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
