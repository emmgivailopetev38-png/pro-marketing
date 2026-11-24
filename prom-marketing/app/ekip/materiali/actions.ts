"use server";
import { requireTeamActor } from "@/lib/team/session";
import { postMessage } from "@/lib/team/messages";
import { directKey } from "@/lib/team/messages-rules";
import { participantKey } from "@/lib/team/roles";
import { notifyMessage } from "@/lib/team/notify";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * „Предложи корекция или ново видео“ от „Материали“ → в личната нишка с
 * Ивайло (/ekip/saobshtenia) + известие до него. Така предложенията на екипа
 * за видеата преди срещата не се губят във Viber.
 */
export async function videoFeedbackAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  let actor;
  try {
    actor = await requireTeamActor();
  } catch {
    return { ok: false, error: "Сесията е изтекла — влез отново." };
  }
  const kind = String(formData.get("kind") ?? "") === "novo" ? "novo" : "korekcia";
  const which = String(formData.get("which") ?? "").trim().slice(0, 120);
  const text = String(formData.get("text") ?? "").trim().slice(0, 4000);
  if (text.length < 5) return { ok: false, error: "Напиши какво предлагаш — поне едно изречение." };

  const me = participantKey(actor.member);
  const key = directKey("owner", me);
  const body = [`🎬 ${kind === "novo" ? "Предложение за ново видео" : "Корекция на видео"}${which ? ` · ${which}` : ""}`, text].join("\n");
  const res = await postMessage({ key, authorKey: me, authorName: actor.name, body });
  if (res.error) return { ok: false, error: `Не се изпрати: ${res.error}` };
  if (me !== "owner") {
    await notifyMessage({
      recipientKeys: ["owner"],
      authorName: actor.name,
      body,
      threadTitle: "🎬 видеата за клиенти",
      href: `/ekip/saobshtenia?t=${encodeURIComponent(key)}`,
    }).catch(() => {});
  }
  return { ok: true, message: "Пратено на Ивайло — стои и в „Съобщения“, в нишката ви." };
}
