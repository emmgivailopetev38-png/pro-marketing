"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { getMemberById } from "@/lib/team/repository";
import { ASSIGN_TYPE } from "@/lib/team/queue-rules";
import { ensurePortalToken, setPortalEnabled } from "@/lib/portal/repository";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Екипът и порталът от картона на клиента (само Ивайло): отговорник
 * (продавач), включване на портала, изпращане на линка.
 */

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw").replace(/\/$/, "");

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

function revalidate(contactId: string) {
  revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/admin/clients");
  revalidatePath("/admin/follow-up");
  revalidatePath("/ekip/prodazhbi");
}

/** Кой води човека. Смяната оставя следа `team_assigned` (kind: sales) — не влиза в опашката за звънене. */
export async function setContactOwnerAction(formData: FormData): Promise<void> {
  const by = await requireAdmin();
  const contactId = s(formData, "contact_id");
  const ownerId = s(formData, "owner_id") || null;
  if (!contactId) return;
  const sb = createServiceClient();
  const { data: c } = await sb.from("contacts").select("owner_id, full_name").eq("id", contactId).maybeSingle();
  if (!c || c.owner_id === ownerId) return;
  await sb.from("contacts").update({ owner_id: ownerId }).eq("id", contactId);
  const member = ownerId ? await getMemberById(ownerId) : null;
  await sb
    .from("contact_activities")
    .insert({
      contact_id: contactId,
      activity_type: ASSIGN_TYPE,
      title: member ? `🤝 Даден на ${member.full_name} да го води` : "🤝 Върнат при Ивайло",
      body: s(formData, "reason") || null,
      occurred_at: new Date().toISOString(),
      metadata: { kind: "sales", to_member_id: ownerId, to_name: member?.full_name ?? "Ивайло", reason: s(formData, "reason") || null },
      created_by: by,
    })
    .then(() => null, () => null);
  if (member?.email) {
    await sendEmail({
      to: member.email,
      subject: `🤝 Нов човек за теб · ${c.full_name ?? "клиент"}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>${escapeHtml(by)}</strong> ти дава <strong>${escapeHtml(c.full_name ?? "клиент")}</strong> да го водиш.</p>
${s(formData, "reason") ? `<p>${escapeHtml(s(formData, "reason"))}</p>` : ""}
<p style="margin-top:18px;"><a href="${SITE}/ekip/prodazhbi#sales-${contactId}" style="display:inline-block;background:#0891b2;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Отвори го в продажбите си</a></p>
</div>`,
      text: `${by} ти дава ${c.full_name ?? "клиент"} да го водиш.\n${SITE}/ekip/prodazhbi`,
    }).catch(() => null);
  }
  revalidate(contactId);
}

export async function portalToggleAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  await requireAdmin();
  const contactId = s(formData, "contact_id");
  const enable = s(formData, "enable") === "1";
  if (!contactId) return { ok: false, error: "Липсва картон" };
  if (enable) {
    const r = await ensurePortalToken(contactId);
    if (r.error || !r.token) return { ok: false, error: r.error ?? "Не се създаде линк" };
    revalidate(contactId);
    return { ok: true, message: `${SITE}/klient/${r.token}` };
  }
  const r = await setPortalEnabled(contactId, false);
  if (r.error) return { ok: false, error: r.error };
  revalidate(contactId);
  return { ok: true, message: "Порталът е спрян. Линкът вече не отваря нищо." };
}

/** Писмо до клиента с линка към портала — тръгва само от този бутон, натиснат от Ивайло. */
export async function portalSendLinkAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  const by = await requireAdmin();
  const contactId = s(formData, "contact_id");
  if (!contactId) return { ok: false, error: "Липсва картон" };
  const sb = createServiceClient();
  const { data: c } = await sb.from("contacts").select("full_name, company, email, portal_token, portal_enabled").eq("id", contactId).maybeSingle();
  if (!c?.email) return { ok: false, error: "Картонът няма имейл." };
  if (!c.portal_token || !c.portal_enabled) return { ok: false, error: "Първо включи портала." };
  const link = `${SITE}/klient/${c.portal_token}`;
  const name = (c.full_name as string | null)?.trim().split(/\s+/)[0] || "";
  const res = await sendEmail({
    to: c.email as string,
    subject: "Вашият проект — напредък, стъпки и връзка с нас на едно място",
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p>Здравейте${name ? `, ${escapeHtml(name)}` : ""}!</p>
<p>Радваме се, че работим заедно. За да виждате по всяко време докъде сме, кои стъпки чакат Вас и да ни пишете с едно натискане, направихме Ваша лична страница:</p>
<p style="margin:18px 0;"><a href="${link}" style="display:inline-block;background:#0891b2;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold;">Отворете Вашия проект</a></p>
<p>Линкът е личен — пазете го за себе си. Отваря се и от телефона, без парола. Всичко, което напишете там, стига до нас в същата минута.</p>
<p>До скоро,<br/>Ивайло Петев · Pro Marketing<br/>+359 877 399 963</p>
</div>`,
    text: `Здравейте${name ? `, ${name}` : ""}!\n\nВашата лична страница с напредъка по проекта: ${link}\n\nЛинкът е личен. Всичко, което напишете там, стига до нас веднага.\n\nИвайло Петев · Pro Marketing · +359 877 399 963`,
  });
  if (res.error) return { ok: false, error: res.error };
  await sb
    .from("contact_activities")
    .insert({
      contact_id: contactId,
      activity_type: "portal_sent",
      title: "🔗 Изпратен линк към портала на клиента",
      body: link,
      occurred_at: new Date().toISOString(),
      metadata: { email: c.email },
      created_by: by,
    })
    .then(() => null, () => null);
  revalidate(contactId);
  return { ok: true, message: `Изпратено на ${c.email}.` };
}
