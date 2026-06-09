import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import { escapeHtml } from "@/lib/email/escape";

export const dynamic = "force-dynamic";

// Phone is the only required field — lowest-friction capture. Name/email are
// optional (richer forms still send them). Welcome email goes out only when we
// actually have an email address.
const schema = z.object({
  full_name: z.string().max(120).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().min(6).max(40),
  company_activity: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
});

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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

  const phone = parsed.data.phone.trim();
  const full_name = parsed.data.full_name?.trim() || "Уебсайт лийд";
  const emailRaw = parsed.data.email?.trim().toLowerCase() || "";
  const email = EMAIL_RE.test(emailRaw) ? emailRaw : null;
  const { company_activity, message } = parsed.data;
  const supabase = createServiceClient();

  // Dedup by email when present, else by phone (matches Meta lead behaviour).
  let existing: { id: string; full_name: string | null; phone: string | null; company: string | null } | null = null;
  if (email) {
    const { data } = await supabase
      .from("contacts")
      .select("id, full_name, phone, company")
      .eq("email", email)
      .maybeSingle();
    existing = data;
  }
  if (!existing && phone) {
    const { data: byPhone } = await supabase
      .from("contacts")
      .select("id, full_name, phone, company")
      .eq("phone", phone)
      .maybeSingle();
    existing = byPhone;
  }

  let contactId: string;
  if (existing) {
    contactId = existing.id;
    const patch: { full_name?: string; phone?: string; company?: string } = {};
    if (!existing.full_name && full_name) patch.full_name = full_name;
    if (!existing.phone) patch.phone = phone;
    if (!existing.company && company_activity) patch.company = company_activity;
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
        company: company_activity || null,
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
    body:
      [
        company_activity ? `Фирма/дейност: ${company_activity}` : null,
        message ? `Съобщение: ${message}` : null,
      ]
        .filter(Boolean)
        .join("\n") || null,
    created_by: "website",
    metadata: {
      full_name,
      email,
      phone,
      company_activity: company_activity || null,
      message: message || null,
    },
  });

  // Auto-welcome to the lead — only when we have an email (new contacts only).
  if (!existing && email) {
    await sendWelcomeEmail({
      supabase,
      contactId,
      to: email,
      fullName: full_name,
      source: "website",
    });
  }

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
<tr><td style="padding:4px 12px 4px 0;color:#777;">Име:</td><td><strong>${escapeHtml(full_name)}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Имейл:</td><td>${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : "—"}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Телефон:</td><td><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>
${company_activity ? `<tr><td style="padding:4px 12px 4px 0;color:#777;vertical-align:top;">Фирма/дейност:</td><td><strong>${escapeHtml(company_activity)}</strong></td></tr>` : ""}
${message ? `<tr><td style="padding:4px 12px 4px 0;color:#777;vertical-align:top;">Съобщение:</td><td>${escapeHtml(message).replace(/\n/g, "<br/>")}</td></tr>` : ""}
</table>
<p style="margin-top:18px;">📊 <a href="https://promarketing.pw/admin/clients/${contactId}">Виж в CRM-а</a></p>
</div>`,
      text: `Нов lead от promarketing.pw

Име: ${full_name}
Имейл: ${email || "—"}
Телефон: ${phone}${company_activity ? `\nФирма/дейност: ${company_activity}` : ""}${message ? `\n\nСъобщение:\n${message}` : ""}

CRM: https://promarketing.pw/admin/clients/${contactId}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
