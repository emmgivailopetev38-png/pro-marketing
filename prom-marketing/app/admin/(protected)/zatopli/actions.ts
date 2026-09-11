"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin/require-admin";
import { nextWorkingDayAt, dayKey } from "@/lib/contacts/followup";
import { CHANNELS, CHANNEL_ACTIVITY, CHANNEL_LABEL, type Channel } from "@/lib/contacts/channels";

/**
 * Действията на опашката „Затопли".
 *
 * Опашката не праща нищо сама — месинджърът се отваря в браузъра на Ивайло с
 * готов текст, той натиска Enter. Тук се записва само следата: по кой канал е
 * минато, кога, и кога да се погледне пак.
 *
 * Затова бутонът се натиска СЛЕД отварянето на чата: единственото, което
 * знаем със сигурност, е че съобщението е било пред очите му. Ако се запишеше
 * автоматично при клика на линка, картонът щеше да лъже при всеки размислен
 * чат — а картонът, който лъже, е по-лош от празния.
 */

/** Колко дни по-късно да се погледне пак, след като сме писали. */
const RECHECK_DAYS = 3;
/** Отлагането на „не сега" — достатъчно, за да излезе от главата. */
const SNOOZE_DAYS = 30;

function isChannel(v: string): v is Channel {
  return (CHANNELS as readonly string[]).includes(v);
}

export async function zatopliAction(formData: FormData) {
  const actor = await requireAdmin();

  const contactId = String(formData.get("contact_id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!contactId || !action) throw new Error("Invalid input");

  const svc = createServiceClient();
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {};
  let activity: { type: string; title: string; body?: string | null } | null = null;

  switch (action) {
    // Съобщение по месинджър. Не значи „чут" — човекът още не е отговорил —
    // но значи, че сме действали, затова напомнянето се мести напред вместо
    // да виси просрочено.
    case "sent": {
      const channel = String(formData.get("channel") ?? "");
      if (!isChannel(channel)) throw new Error("Unknown channel");

      activity = {
        type: CHANNEL_ACTIVITY[channel],
        title: `Писано по ${CHANNEL_LABEL[channel]}`,
        body: String(formData.get("message") ?? "").trim() || null,
      };
      patch.next_followup_at = new Date(Date.now() + RECHECK_DAYS * 86_400_000).toISOString();
      patch.followup_status = "needs_call";
      break;
    }

    // Обаждане направо от опашката — топлите не се затоплят, а се чуват.
    case "called": {
      activity = { type: "call", title: `Звъннах от опашката · не вдигна` };
      patch.next_followup_at = nextWorkingDayAt(new Date()).toISOString();
      patch.followup_status = "needs_call";
      break;
    }

    case "reached": {
      activity = { type: "call", title: `Чухме се` };
      patch.last_heard_from_at = nowIso;
      patch.followup_status = "called_waiting_feedback";
      patch.next_followup_at = null;
      break;
    }

    case "snooze": {
      patch.next_followup_at = new Date(Date.now() + SNOOZE_DAYS * 86_400_000).toISOString();
      activity = {
        type: "note",
        title: `Отложен за ${new Date(patch.next_followup_at as string).toLocaleDateString("bg-BG", {
          day: "2-digit",
          month: "short",
          timeZone: "Europe/Sofia",
        })}`,
      };
      break;
    }

    case "not_interested": {
      patch.stage = "lost";
      patch.followup_status = "not_interested";
      patch.last_heard_from_at = nowIso;
      patch.next_followup_at = null;
      activity = { type: "note", title: `Не е заинтересован` };
      break;
    }

    default:
      throw new Error("Unknown action");
  }

  if (Object.keys(patch).length > 0) {
    await svc.from("contacts").update(patch).eq("id", contactId);
  }
  if (activity) {
    await svc.from("contact_activities").insert({
      contact_id: contactId,
      activity_type: activity.type,
      title: activity.title,
      body: activity.body ?? null,
      created_by: actor,
      metadata: { via: "zatopli", day: dayKey(nowIso) },
    });
  }

  revalidatePath("/admin/zatopli");
  revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/admin");
}
