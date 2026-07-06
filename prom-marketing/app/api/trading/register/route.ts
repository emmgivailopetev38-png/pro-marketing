import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { TRADING, TRADING_DISCLAIMER } from "@/lib/trading/config";

export const dynamic = "force-dynamic";

// Телефонът е ЗАДЪЛЖИТЕЛЕН тук — фунията е call-first (високобюджетна
// оферта през личен разговор), без телефон няма follow-up.
const schema = z.object({
  full_name: z.string().max(120).optional(),
  email: z.string().email().max(200),
  phone: z.string().min(6).max(40),
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
  const full_name = parsed.data.full_name?.trim() || "Трейдинг лийд";
  const phone = parsed.data.phone.trim();
  const supabase = createServiceClient();

  // Дедуп по имейл, после по телефон.
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
        source: "trading_funnel",
        notes: "Свали книгата „Трейдинг Агентът” — кандидат за трейдинг менторството",
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
    activity_type: "trading_book_download",
    title: "📕 Свали книгата „Трейдинг Агентът” (trading фуния)",
    body: "Call-first фуния: очаква обаждане/съобщение до 24ч. Цел: квалификация за менторството (4 м, 2000 €). DFY (500–1000 €/стратегия) се предлага само в разговора, ако менторството не пасва.",
    created_by: "website",
    metadata: { full_name, email, phone, funnel: "trading" },
  });

  // Книгата към лийда.
  sendEmail({
    to: email,
    subject: "📕 Книгата ти: „Трейдинг Агентът — наръчникът” (+ какво следва)",
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#0d1221;max-width:560px;">
<p>Здравей, ${escapeHtml(full_name)},</p>
<p>Ето я книгата — пълната карта как се изгражда автоматизирана търговска система:</p>
<p><a href="${SITE}${TRADING.book.pdfPath}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:bold;padding:12px 24px;border-radius:999px;text-decoration:none;">Свали книгата (PDF) →</a></p>
<p><strong>Какво следва:</strong> в следващите 24 часа ще ти пишем/позвъним за кратък 15-минутен разговор — къде си с трейдинга и има ли смисъл да работим заедно по твоя агент. Без ангажимент, без натиск.</p>
<p>Ако бързаш — запази си час директно: <a href="${SITE}/booking">${SITE}/booking</a></p>
<p>${escapeHtml(TRADING.host.name)}<br/><span style="color:#667;">${escapeHtml(TRADING.host.role)}</span></p>
<p style="margin-top:18px;font-size:11px;color:#8a8f9c;">${escapeHtml(TRADING_DISCLAIMER)}</p>
</div>`,
    text: `Здравей, ${full_name},

Книгата „Трейдинг Агентът — наръчникът”: ${SITE}${TRADING.book.pdfPath}

Какво следва: до 24 часа ще се свържем за кратък 15-мин разговор — къде си и можем ли да помогнем. Ако бързаш: ${SITE}/booking

${TRADING.host.name}

${TRADING_DISCLAIMER}`,
  }).catch(() => {});

  // Известие към админа — това е call-first лийд, звъни се!
  const adminTo = (process.env.ALLOWED_ADMIN_EMAILS ?? "ivailopetev38@gmail.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  if (adminTo) {
    sendEmail({
      to: adminTo,
      subject: `📈 ТРЕЙДИНГ лийд (звънни до 24ч) · ${full_name}`,
      html: `<p><strong>${escapeHtml(full_name)}</strong> свали книгата „Трейдинг Агентът”.</p>
<p>📞 <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a> · ✉️ ${escapeHtml(email)}</p>
<p>Цел на разговора: квалификация за менторството (2000 €). DFY се споменава само ако менторството не пасва.</p>
<p><a href="${SITE}/admin/clients/${contactId}">Виж в CRM-а</a></p>`,
      text: `ТРЕЙДИНГ лийд: ${full_name} / ${phone} / ${email}\nЗвънни до 24ч. CRM: ${SITE}/admin/clients/${contactId}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
