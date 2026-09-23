"use server";
import { revalidatePath } from "next/cache";
import { requireTeamActor, type TeamActor } from "@/lib/team/session";
import { actorKey, markRead, participants, postMessage, setClientVisible } from "@/lib/team/messages";
import { isThreadKind, parseMentions, parseThreadKey, recipientsOf } from "@/lib/team/messages-rules";
import { notifyMessage } from "@/lib/team/notify";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Съобщенията — писане и „прочетено“. Получателите научават по имейл
 * (Ивайло — и в Telegram). Отговорът е в CRM-а, не в писмото.
 */

function s(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

async function actorOrNull(): Promise<TeamActor | null> {
  try {
    return await requireTeamActor();
  } catch {
    return null;
  }
}

export async function postMessageAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  const actor = await actorOrNull();
  if (!actor) return { ok: false, error: "Сесията е изтекла — влез отново." };
  const key = s(formData, "thread_key");
  const body = s(formData, "body");
  if (!key || !body) return { ok: false, error: "Празно съобщение." };
  let parsed: ReturnType<typeof parseThreadKey>;
  try {
    parsed = parseThreadKey(key);
  } catch {
    return { ok: false, error: "Невалидна нишка." };
  }
  if (!isThreadKind(parsed.kind)) return { ok: false, error: "Невалидна нишка." };
  const me = actorKey(actor);
  if (parsed.kind === "direct" && !parsed.participants.includes(me)) return { ok: false, error: "Това не е твоя нишка." };

  const people = await participants();
  const mentions = parseMentions(body, people);
  const clientVisible = parsed.kind === "contact" && s(formData, "client_visible") === "1";
  const res = await postMessage({ key, authorKey: me, authorName: actor.name, body, mentions, clientVisible });
  if (res.error) return { ok: false, error: res.error };

  const recipients = recipientsOf({ thread_key: key, author_key: me, mentions }, people.map((p) => p.key));
  // По картон/проект/задача без споменаване: научава Ивайло (ако не е авторът).
  if (recipients.length === 0 && me !== "owner") recipients.push("owner");
  const href = `/ekip/saobshtenia?t=${encodeURIComponent(key)}`;
  await notifyMessage({ recipientKeys: recipients, authorName: actor.name, body, threadTitle: s(formData, "thread_title") || key, href }).catch(() => {});

  revalidatePath("/ekip/saobshtenia");
  revalidatePath("/admin/saobshtenia");
  if (parsed.kind === "contact" && parsed.ref) revalidatePath(`/admin/clients/${parsed.ref}`);
  return { ok: true, message: clientVisible ? "Изпратено. Клиентът го вижда в портала си." : "Изпратено." };
}

export async function markReadAction(formData: FormData): Promise<void> {
  const actor = await actorOrNull();
  if (!actor) return;
  const key = s(formData, "thread_key");
  if (key) await markRead(actorKey(actor), key);
  revalidatePath("/ekip/saobshtenia");
}

export async function toggleClientVisibleAction(formData: FormData): Promise<void> {
  const actor = await actorOrNull();
  if (!actor) return;
  const id = s(formData, "message_id");
  const visible = s(formData, "visible") === "1";
  if (id) await setClientVisible(id, visible);
  const contactId = s(formData, "contact_id");
  if (contactId) revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/ekip/saobshtenia");
  revalidatePath("/admin/saobshtenia");
}
