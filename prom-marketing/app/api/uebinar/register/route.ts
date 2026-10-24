import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { phoneVariants } from "@/lib/contacts/repository";
import { notifyTeamNewLead } from "@/lib/team/notify";
import { routeNewLead } from "@/lib/team/routing";
import { sendTelegram } from "@/lib/notifications/telegram";
import { uebinarVideo } from "@/lib/uebinar/config";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** И трите полета са задължителни — правилото за всяка форма за лийдове: телефонът задължително. */
const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().regex(EMAIL_RE).max(200),
  phone: z.string().trim().min(6).max(40),
});

/**
 * POST /api/uebinar/register — входът в залата на филма-уебинар за човек,
 * който е дошъл без личен линк (от рекламата, от препратено писмо, от сайта).
 *
 * Намира или създава картона (по имейл, после по телефон — като формата на
 * сайта), вписва „Записа се за уебинара“ и връща ключа `k` + видеото. Нов
 * човек влиза в ротацията на екипа за звънене като всеки лийд от сайта.
 * Приветствено писмо НЕ тръгва — човекът получава филма на място.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Попълни име, имейл и телефон." }, { status: 400 });
  }
  const { full_name, email, phone } = parsed.data;
  const sb = createServiceClient();

  let existing: { id: string; full_name: string | null; phone: string | null } | null = null;
  const { data: byEmail } = await sb.from("contacts").select("id, full_name, phone").eq("email", email).limit(1);
  existing = byEmail?.[0] ?? null;
  if (!existing) {
    const { data: byPhone } = await sb
      .from("contacts")
      .select("id, full_name, phone")
      .in("phone", phoneVariants(phone))
      .order("created_at", { ascending: true })
      .limit(1);
    existing = byPhone?.[0] ?? null;
  }

  let contactId: string;
  if (existing) {
    contactId = existing.id;
    const patch: Record<string, string> = {};
    if (!existing.full_name) patch.full_name = full_name;
    if (!existing.phone) patch.phone = phone;
    if (Object.keys(patch).length) await sb.from("contacts").update(patch).eq("id", contactId);
  } else {
    const { data: created, error } = await sb
      .from("contacts")
      .insert({ full_name, email, phone, stage: "lead", source: "website_form", notes: "Записа се за уебинара „ВЪЛНАТА“" })
      .select("id")
      .single();
    if (error || !created) return NextResponse.json({ ok: false, error: "Опитай пак след малко." }, { status: 500 });
    contactId = created.id as string;
  }

  await sb.from("contact_activities").insert({
    contact_id: contactId,
    activity_type: "website_form",
    title: "🎬 Записа се за уебинара „ВЪЛНАТА“",
    body: `Име: ${full_name}\nИмейл: ${email}\nТелефон: ${phone}`,
    created_by: "website",
    metadata: { form: "uebinar", full_name, email, phone },
  });

  if (!existing) {
    await routeNewLead(contactId).catch(() => null);
    await notifyTeamNewLead({
      contactId,
      fullName: full_name,
      email,
      phone,
      sourceLabel: "Уебинарът „ВЪЛНАТА“",
      extra: [],
    }).catch(() => {});
  }
  await sendTelegram(`🎟 <b>${full_name.replace(/[<>&]/g, "")}</b> се записа за уебинара „ВЪЛНАТА“${existing ? " (вече е в CRM-а)" : ""}`).catch(
    () => false
  );

  return NextResponse.json({ ok: true, k: contactId.split("-")[0], video: uebinarVideo() });
}
