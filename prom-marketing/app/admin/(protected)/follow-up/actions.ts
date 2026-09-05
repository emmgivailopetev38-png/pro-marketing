"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin/require-admin";
import { FOLLOWUP_STATUSES, type FollowupStatus } from "@/lib/contacts/types";

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
  let activity: { type: string; title: string; body?: string | null } | null = null;

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
    case "set_followup_status": {
      const fs = String(formData.get("followup_status") ?? "");
      if (!FOLLOWUP_STATUSES.includes(fs as FollowupStatus)) throw new Error("Invalid status");
      patch.followup_status = fs;
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
      created_by: email,
    });
  }

  revalidatePath("/admin/follow-up");
  revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/admin");
}
