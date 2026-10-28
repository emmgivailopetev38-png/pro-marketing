"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { recordActivity } from "@/lib/crm/repository";
import { fmtSofia } from "@/lib/team/time";
import { ZV_OUTCOMES, nextCallAt, outcomePlan, type ZvOutcome } from "@/lib/zvanene/rules";

export type ZvSaveResult = { ok: true; title: string; next_at: string | null } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Един бутон от „📞 Звънене“ → обаждане в картона. Минава през `recordActivity` — същия път
 * като `/api/crm/activity`, — за да важат правилата за етап, „чут“ и обещаната дата.
 */
export async function zvaneneZapis(input: {
  contact_id: string;
  outcome: string;
  preset: string;
  note: string;
}): Promise<ZvSaveResult> {
  let actor: string;
  try {
    actor = await requireAdmin();
  } catch {
    return { ok: false, error: "Не си влязъл — презареди страницата" };
  }
  if (!UUID.test(input.contact_id)) return { ok: false, error: "Непознат картон" };
  if (!ZV_OUTCOMES.includes(input.outcome as ZvOutcome)) return { ok: false, error: "Непознат резултат" };
  const outcome = input.outcome as ZvOutcome;
  const note = (input.note ?? "").trim().slice(0, 12_000);
  if (outcome === "belezhka" && !note) return { ok: false, error: "Бележката е празна" };

  const now = new Date();
  const plan = outcomePlan(outcome);
  const nextAt = nextCallAt(input.preset || "auto", outcome, now);
  const title = plan.title + (nextAt ? ` · пак ${fmtSofia(nextAt)}` : "");

  const r = await recordActivity({
    contact_id: input.contact_id,
    activity_type: plan.activity_type,
    title,
    body: note || undefined,
    occurred_at: now.toISOString(),
    created_by: actor,
    metadata: { source: "zvanene" },
    followup_status: plan.followup_status ?? (nextAt ? "needs_call" : undefined),
    stage: plan.stage,
    mark_heard: plan.mark_heard || undefined,
    next_followup_at: nextAt ?? undefined,
  });
  if (r.error || !r.activity_id) return { ok: false, error: r.error ?? "Не се записа" };

  revalidatePath("/admin/zvanene");
  revalidatePath(`/admin/clients/${input.contact_id}`);
  revalidatePath("/admin/follow-up");
  return { ok: true, title, next_at: nextAt };
}
