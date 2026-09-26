"use server";
import { revalidatePath } from "next/cache";
import { requireTeamActor, type TeamActor } from "@/lib/team/session";
import { getProspect, linkProspectContact, promoteProspect, saveProspectCall } from "@/lib/team/prospects";
import { MAX_NO_ANSWER, PROSPECT_OUTCOMES, prospectAfter, type ProspectOutcome } from "@/lib/team/prospects-rules";
import { retryFromPreset } from "@/lib/team/retry-rules";
import { defaultRetryAt, fmtSofia, sofiaLocalToIso } from "@/lib/team/time";
import type { EkipActionResult } from "@/lib/team/types";
import { ekipAction } from "./actions";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

/** Полетата от студената карта, които „говорихме“ и „среща“ предават нататък. */
const PASS_ON = ["talked_after", "meeting_at", "email", "invite"] as const;

/**
 * Студената карта. „Не вдигна“, „звънни пак“, „не се интересува“ и „грешен
 * номер“ остават в базата на студените — без картон в CRM-а, без писма.
 * „Говорихме“ и „среща“ правят картон и минават през същото действие като
 * лийдовете (ekipAction): поканата с Meet, известието до Ивайло и етапът са едни.
 */
export async function prospectAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  let actor: TeamActor;
  try {
    actor = await requireTeamActor();
  } catch {
    return { ok: false, error: "Сесията е изтекла — влез отново." };
  }

  const id = str(formData, "prospect_id");
  const outcome = str(formData, "action") as ProspectOutcome;
  if (!id || !PROSPECT_OUTCOMES.includes(outcome)) return { ok: false, error: "Невалидно действие" };

  const p = await getProspect(id);
  if (!p) return { ok: false, error: "Фирмата не е намерена" };
  const memberId = actor.kind === "member" ? actor.member.id : null;
  if (memberId && p.assigned_to !== memberId) return { ok: false, error: "Тази фирма вече не е при теб — презареди страницата." };

  const note = str(formData, "note") || null;
  const now = new Date();
  let retryAt: Date | null = null;
  let contactId: string | null = null;
  let message = "Записано.";

  if (outcome === "no_answer") {
    const preset = str(formData, "retry_preset");
    const fromPreset = preset ? retryFromPreset(preset, str(formData, "retry_at_custom")) : null;
    if (preset === "custom" && !fromPreset) return { ok: false, error: "Избери точния час за повторното звънене." };
    retryAt = fromPreset ?? defaultRetryAt(now);
  } else if (outcome === "callback") {
    const iso = sofiaLocalToIso(str(formData, "retry_at"));
    if (!iso) return { ok: false, error: "Избери кога да звъннеш пак." };
    retryAt = new Date(iso);
  } else if (outcome === "talked" || outcome === "meeting") {
    const promoted = await promoteProspect(p, memberId);
    if (!promoted.contactId) return { ok: false, error: promoted.error ?? "Картонът не се записа." };
    contactId = promoted.contactId;

    const fd = new FormData();
    fd.set("contact_id", contactId);
    fd.set("action", outcome);
    if (note) fd.set("note", note);
    if (p.sector) fd.set("business_detail", p.sector);
    for (const k of PASS_ON) {
      const v = str(formData, k);
      if (v) fd.set(k, v);
    }
    const res = await ekipAction(null, fd);
    if (!res.ok) {
      await linkProspectContact(p.id, contactId);
      return res;
    }
    message = `${res.message ?? "Записано."} Фирмата вече е картон в CRM-а.`;
  }

  const patch = prospectAfter(p, outcome, { now, retryAt, note });
  const saved = await saveProspectCall({ prospect: p, patch, contactId, memberId, caller: actor.name, outcome, note });
  if (saved.error) return { ok: false, error: `Не се записа: ${saved.error}` };

  if (outcome === "no_answer") {
    message =
      patch.status === "unreachable"
        ? `Не вдигна ${MAX_NO_ANSWER} пъти — фирмата излиза от опашката. Ивайло я вижда в „Студени обаждания“.`
        : `Отбелязано. Излиза пак на ${fmtSofia(patch.next_call_at!)}.`;
  } else if (outcome === "callback") {
    message = `Записано. Излиза пак на ${fmtSofia(patch.next_call_at!)}.`;
  } else if (outcome === "not_interested") {
    message = "Записано — не се интересува. Фирмата излиза от опашката.";
  } else if (outcome === "bad_number") {
    message = "Записано — грешен номер. Фирмата излиза от опашката; Ивайло я вижда.";
  }

  revalidatePath("/ekip");
  revalidatePath("/admin/studeni");
  return { ok: true, message };
}
