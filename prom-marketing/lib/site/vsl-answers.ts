import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { phoneVariants } from "@/lib/contacts/repository";
import { postMessage } from "@/lib/team/messages";
import { directKey } from "@/lib/team/messages-rules";
import { notifyMessage } from "@/lib/team/notify";
import { sendTelegram } from "@/lib/notifications/telegram";
import { escapeHtml } from "@/lib/text/escape";
import { SELLERS } from "@/lib/oferti/katalog";
import { answersText, type VslContent } from "@/lib/site/vsl";

const SITE = "https://promarketing.pw";

/**
 * Въпросите преди срещата от /biznes и /pari-s-ai → при Георги.
 *
 * Човекът вече е записан (Георги му е пратил линка), затова го търсим по
 * телефона в CRM-а. Нов картон не правим тихо.
 *
 * Георги (по подразбиране):
 *   намерен → нишката на картона в /ekip („💬 Клиентът написа“ влиза и в
 *   хронологията — вижда го и асистентът му) + писмо до Георги;
 *   ненамерен → личната нишка Ивайло ↔ Георги в /ekip + писмо до Георги.
 * Ивайло (`?ot=ivailo`): нищо не минава през нишки, които Георги вижда
 * (50/50 — хората на Ивайло са скрити от екипа): намерен → само запис в
 * картона; и в двата случая — Telegram до Ивайло.
 */
export async function deliverVslAnswers(args: {
  c: VslContent;
  name: string;
  phone: string;
  answers: Record<string, string>;
  toIvailo: boolean;
}): Promise<{ ok: boolean; contactId: string | null }> {
  const sb = createServiceClient();
  const body = answersText(args.c, { name: args.name, phone: args.phone }, args.answers);
  const georgiKey = SELLERS.georgi.team_member_id;

  const { data } = await sb
    .from("contacts")
    .select("id, full_name, company")
    .in("phone", phoneVariants(args.phone))
    .order("updated_at", { ascending: false })
    .limit(1);
  const contact = ((data ?? []) as Array<{ id: string; full_name: string | null; company: string | null }>)[0] ?? null;
  const who = contact?.full_name?.trim() || contact?.company?.trim() || args.name;

  if (args.toIvailo || !georgiKey) {
    let ok = true;
    if (contact) {
      const { error } = await sb.from("contact_activities").insert({
        contact_id: contact.id,
        activity_type: "client_message",
        title: `📝 Въпроси преди срещата · видео „${args.c.name}“`,
        body,
        occurred_at: new Date().toISOString(),
        metadata: { source: "vsl", vsl: args.c.slug, from_client: true },
        created_by: who,
      });
      ok = !error;
    }
    const link = contact ? `${SITE}/admin/clients/${contact.id}` : null;
    const sent = await sendTelegram(
      `📝 <b>${escapeHtml(who)}</b> · въпроси преди срещата${contact ? "" : " (⚠️ няма картон с този телефон)"}\n${escapeHtml(
        body.length > 3500 ? `${body.slice(0, 3499)}…` : body
      )}`,
      link ? { buttons: [{ text: "Отвори картона", url: link }] } : undefined
    ).catch(() => false);
    return { ok: contact ? ok : sent !== false, contactId: contact?.id ?? null };
  }

  if (contact) {
    const key = `contact:${contact.id}`;
    const res = await postMessage({ key, authorKey: `client:${contact.id}`, authorName: who, body, fromClient: true });
    await notifyMessage({
      recipientKeys: [georgiKey],
      authorName: who,
      body,
      threadTitle: `👤 ${who} · въпроси преди срещата`,
      href: `/ekip/saobshtenia?t=${encodeURIComponent(key)}`,
    }).catch(() => {});
    return { ok: !res.error, contactId: contact.id };
  }

  // Няма картон с този телефон (друг номер, грешка в цифрите) — пак стига до
  // Георги, с името и телефона, в личната нишка с Ивайло.
  const key = directKey("owner", georgiKey);
  const res = await postMessage({
    key,
    authorKey: "site:vsl",
    authorName: `🌐 ${args.name} (от видеото)`,
    body: `${body}\n\n⚠️ Няма картон с този телефон — провери номера.`,
  });
  await notifyMessage({
    recipientKeys: [georgiKey],
    authorName: args.name,
    body,
    threadTitle: "въпроси преди срещата (няма картон)",
    href: `/ekip/saobshtenia?t=${encodeURIComponent(key)}`,
  }).catch(() => {});
  return { ok: !res.error, contactId: null };
}
