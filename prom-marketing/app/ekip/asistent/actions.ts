"use server";
import { requireTeamActor } from "@/lib/team/session";
import { createNote } from "@/lib/team/system-notes";
import { postMessage } from "@/lib/team/messages";
import { directKey } from "@/lib/team/messages-rules";
import { participantKey } from "@/lib/team/roles";
import { notifyMessage } from "@/lib/team/notify";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * „🛠 Корекция / въпрос към Ивайло“ от асистента: нещо не работи, не е ясно
 * или трябва да се поправи. Влиза в „Бележки за системата“ (/admin/belezhki) и в
 * личната нишка с Ивайло — оправя се до няколко часа, отговорът идва на имейла.
 */
export async function korekciaAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  let actor;
  try {
    actor = await requireTeamActor();
  } catch {
    return { ok: false, error: "Сесията е изтекла — влез отново." };
  }
  const text = String(formData.get("text") ?? "").trim().slice(0, 4000);
  const area = String(formData.get("area") ?? "crm");
  const page = String(formData.get("page") ?? "").trim().slice(0, 300) || null;
  if (text.length < 5) return { ok: false, error: "Напиши какво не работи или какво не е ясно — поне едно изречение." };
  const me = participantKey(actor.member);
  const note = await createNote({ authorKey: me, authorName: actor.name, area, text, page });
  if (note.error) return { ok: false, error: `Не се записа: ${note.error}` };
  if (me !== "owner") {
    const key = directKey("owner", me);
    const body = `🛠 Корекция / въпрос\n${text}${page ? `\nЕкран: ${page}` : ""}`;
    await postMessage({ key, authorKey: me, authorName: actor.name, body }).catch(() => null);
    // Telegram известията на сайта може да мълчат — имейлът стига сигурно.
    await notifyMessage({
      recipientKeys: ["owner"],
      authorName: actor.name,
      body,
      threadTitle: "🛠 корекция / въпрос за системата",
      href: `/ekip/saobshtenia?t=${encodeURIComponent(key)}`,
    }).catch(() => {});
  }
  return { ok: true, message: "Прието ✅ Ивайло и екипът го оправят до няколко часа — отговорът идва в „Съобщения“ и на имейла ти." };
}
