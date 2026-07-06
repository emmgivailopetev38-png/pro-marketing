import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";

export const dynamic = "force-dynamic";

/**
 * POST /api/order — мигновена поръчка/запитване за услуга от магазина.
 * Докато Stripe ключовете не са сложени, това е пътят „купувам сега”:
 * човекът оставя имейл + телефон → CRM контакт + активити „ПОРЪЧКА” +
 * имейл до админа (звънни!) + потвърждение до клиента.
 */
const schema = z.object({
  full_name: z.string().max(120).optional(),
  email: z.string().email().max(200),
  phone: z.string().min(6).max(40),
  service: z.string().min(2).max(200),
  note: z.string().max(1000).optional(),
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
  const full_name = parsed.data.full_name?.trim() || "Клиент от магазина";
  const phone = parsed.data.phone.trim();
  const { service, note } = parsed.data;
  const supabase = createServiceClient();

  // Дедуп по имейл, после телефон (същият модел като другите форми).
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
        source: "store_order",
        notes: `Поръча „${service}” от магазина`,
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
    activity_type: "store_order",
    title: `🛒 ПОРЪЧКА: ${service}`,
    body: `Гореща поръчка от /magazin — свържи се до часове!${note ? `\nБележка от клиента: ${note}` : ""}`,
    created_by: "website",
    metadata: { full_name, email, phone, service, note: note || null },
  });

  // Потвърждение към клиента.
  sendEmail({
    to: email,
    subject: `✅ Поръчката ти е приета: ${service}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#0d1221;max-width:560px;">
<p>Здравей, ${escapeHtml(full_name)},</p>
<p>Приехме поръчката ти за <strong>„${escapeHtml(service)}”</strong>. 🎉</p>
<p><strong>Какво следва:</strong> ще ти позвъним/пишем в следващите часове (най-късно до 24ч), за да уточним детайлите и стартираме. Без предварително плащане — първо се разбираме, после плащаш.</p>
<p>Ако бързаш, запази си час директно: <a href="${SITE}/booking">${SITE}/booking</a></p>
<p>Поздрави,<br/><strong>Ивайло Петев</strong><br/>ProMarketing</p>
</div>`,
    text: `Здравей, ${full_name},

Приехме поръчката ти за „${service}”. Ще се свържем в следващите часове (до 24ч), за да уточним детайлите. Без предварително плащане.

Ако бързаш: ${SITE}/booking

Ивайло Петев · ProMarketing`,
  }).catch(() => {});

  // Горещо известие към админа.
  const adminTo = (process.env.ALLOWED_ADMIN_EMAILS ?? "ivailopetev38@gmail.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  if (adminTo) {
    sendEmail({
      to: adminTo,
      subject: `🛒🔥 НОВА ПОРЪЧКА (звънни!) · ${service} · ${full_name}`,
      html: `<p><strong>${escapeHtml(full_name)}</strong> поръча <strong>„${escapeHtml(service)}”</strong> от магазина.</p>
<p>📞 <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a> · ✉️ ${escapeHtml(email)}</p>
${note ? `<p>Бележка: ${escapeHtml(note)}</p>` : ""}
<p><a href="${SITE}/admin/clients/${contactId}">Виж в CRM-а</a></p>`,
      text: `НОВА ПОРЪЧКА: ${service}\n${full_name} / ${phone} / ${email}${note ? `\nБележка: ${note}` : ""}\nCRM: ${SITE}/admin/clients/${contactId}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
