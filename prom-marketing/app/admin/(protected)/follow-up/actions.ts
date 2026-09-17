"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin/require-admin";
import { FOLLOWUP_STATUSES, type ContactStage, type FollowupStatus } from "@/lib/contacts/types";
import { alignStage, dayKey } from "@/lib/contacts/followup";
import { resolveRemindAt } from "@/lib/contacts/dnevnik";
import { fmtSofia } from "@/lib/team/time";
import { giveToTeam } from "@/lib/team/assign";

/**
 * Single dispatcher for the follow-up queue quick actions. Each action records
 * an activity and/or patches the contact's follow-up state. Actions that mean
 * "Ivailo heard from them" set last_heard_from_at = now() so the contact stops
 * being counted as overdue.
 */
export async function followupQuickAction(formData: FormData) {
  const email = await requireAdmin();

  const contactId = String(formData.get("contact_id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!contactId || !action) throw new Error("Invalid input");

  const svc = createServiceClient();
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {};
  let activity: { type: string; title: string; body?: string | null; metadata?: Record<string, unknown> } | null = null;

  // Текущото състояние — за да не стои напомнянето „просрочено" след като
  // бутонът е натиснат, и за да върви етапът със статуса.
  const { data: current } = await svc
    .from("contacts")
    .select("stage, next_followup_at")
    .eq("id", contactId)
    .maybeSingle();
  const currentStage = (current?.stage ?? "lead") as ContactStage;
  const dueFulfilled =
    typeof current?.next_followup_at === "string" && dayKey(current.next_followup_at) <= dayKey(nowIso);

  switch (action) {
    case "mark_called":
      patch.last_heard_from_at = nowIso;
      patch.followup_status = "called_waiting_feedback";
      activity = { type: "call", title: "Обадихме се" };
      break;
    case "asked_feedback":
      patch.last_heard_from_at = nowIso;
      patch.followup_status = "called_waiting_feedback";
      activity = { type: "call", title: "Поискахме обратна връзка" };
      break;
    case "wants_changes":
      patch.last_heard_from_at = nowIso;
      patch.followup_status = "interested";
      activity = {
        type: "note",
        title: "Клиентът иска промени",
        body: String(formData.get("note") ?? "").trim() || null,
      };
      break;
    case "ready_to_buy":
      patch.last_heard_from_at = nowIso;
      patch.followup_status = "ready_to_close";
      patch.stage = "negotiating";
      activity = { type: "note", title: "Готов да купи 🎉" };
      break;
    case "not_interested":
      patch.last_heard_from_at = nowIso;
      patch.followup_status = "not_interested";
      patch.stage = "lost";
      activity = { type: "note", title: "Не е заинтересован" };
      break;
    case "set_next_call": {
      const raw = String(formData.get("next_call_at") ?? "").trim();
      if (!raw) throw new Error("Дата за обаждане е задължителна");
      const iso = new Date(raw).toISOString();
      patch.next_followup_at = iso;
      patch.followup_status = "needs_call";
      activity = {
        type: "note",
        title: `Насрочено обаждане: ${new Date(iso).toLocaleString("bg-BG", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Sofia",
        })}`,
      };
      break;
    }
    case "remind_preset": {
      // „Да го чуя пак“: утре / след 3 дни / седмица / 2 седмици / месец —
      // работен ден, 10:00 София, влиза в сутрешния списък.
      const iso = resolveRemindAt(String(formData.get("preset") ?? ""), String(formData.get("remind_at") ?? ""));
      if (!iso) throw new Error("Избери кога да го чуеш пак");
      patch.next_followup_at = iso;
      patch.followup_status = "needs_call";
      activity = { type: "note", title: `🔔 Да го чуя пак: ${fmtSofia(iso)}` };
      break;
    }
    case "give_to_team": {
      // Картонът отива в списъка на човека за срещите („🤝 От Ивайло“) и стои
      // там, докато той не го докосне. Тук НЕ се пипат датата и статусът —
      // обещанията на Ивайло си остават негови.
      const reason = String(formData.get("reason") ?? "").trim() || "Ивайло го дава за звънене";
      const given = await giveToTeam({ contactId, reason, createdBy: email });
      if (!given.ok) throw new Error(given.error ?? "Няма активен човек за звънене в „Екип“");
      revalidatePath("/admin/follow-up");
      revalidatePath(`/admin/clients/${contactId}`);
      revalidatePath("/ekip");
      return;
    }
    case "set_followup_status": {
      const fs = String(formData.get("followup_status") ?? "");
      if (!FOLLOWUP_STATUSES.includes(fs as FollowupStatus)) throw new Error("Invalid status");
      patch.followup_status = fs;
      break;
    }
    default:
      throw new Error("Unknown action");
  }

  // „Обадихме се" и роднините му значат, че обещаното обаждане е направено —
  // напомнянето си е свършило работата и не стои повече в сутрешния списък.
  // Досега бутонът пишеше само last_heard_from_at и контактът оставаше
  // „просрочен" завинаги.
  if (patch.last_heard_from_at && dueFulfilled && patch.next_followup_at === undefined) {
    patch.next_followup_at = null;
  }

  // Статусът дърпа етапа напред („изпратена оферта" → offer_sent), никога назад.
  if (typeof patch.followup_status === "string" && patch.stage === undefined) {
    const aligned = alignStage(currentStage, patch.followup_status);
    if (aligned !== currentStage) patch.stage = aligned;
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
      metadata: activity.metadata ?? null,
      created_by: email,
    });
  }

  revalidatePath("/admin/follow-up");
  revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/admin");
  revalidatePath("/ekip");
}
