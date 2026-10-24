import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { giveToTeam } from "./assign";
import { ivailoClaimFor } from "./ivailo";
import { reLeadReason, reLeadVerdict, type ReLeadSkip } from "./relead-rules";

const ATTEMPT_TYPES = ["call", "meeting", "viber_sent"];

/**
 * Човек с картон отпреди пак е оставил данни на рекламата → картонът се връща
 * в „🆕 Нови“ на екипа (маркер `team_assigned`, вид `relead`), освен ако е
 * клиент, при продавач, човек на Ивайло или в тръбата му. Правилата и защо са
 * в relead-rules.ts. Никога не хвърля: входът на лийда е по-важен.
 */
export async function giveReLeadToTeam(args: {
  contactId: string;
  /** часът на новата заявка (created_time от Meta) */
  leadAt: string | null;
  metaLeadId: string;
  offer: string | null;
  offerLabel: string | null;
  adName: string | null;
}): Promise<{ given: boolean; why?: ReLeadSkip | "error"; memberName?: string | null }> {
  try {
    const sb = createServiceClient();
    const { data: c } = await sb
      .from("contacts")
      .select("id, stage, owner_id, created_at, phone")
      .eq("id", args.contactId)
      .maybeSingle();
    if (!c) return { given: false, why: "error" };
    const contact = c as { stage: string | null; owner_id: string | null; created_at: string | null; phone: string | null };
    const { count } = await sb
      .from("contact_activities")
      .select("id", { count: "exact", head: true })
      .eq("contact_id", args.contactId)
      .in("activity_type", ATTEMPT_TYPES);
    const now = new Date();
    const claim = await ivailoClaimFor(args.contactId, { now });
    const verdict = reLeadVerdict({
      stage: contact.stage,
      ownerId: contact.owner_id,
      createdAt: contact.created_at,
      hasPhone: !!contact.phone,
      attempts: count ?? 0,
      ivailo: !!claim,
      now,
    });
    if (!verdict.give) return { given: false, why: verdict.why };

    const res = await giveToTeam({
      contactId: args.contactId,
      reason: reLeadReason(args.offerLabel, args.adName),
      kind: "relead",
      createdBy: "meta_webhook",
      occurredAt: args.leadAt,
      extra: { meta_lead_id: args.metaLeadId, offer: args.offer },
    });
    return res.ok ? { given: true, memberName: res.memberName } : { given: false, why: "error" };
  } catch {
    return { given: false, why: "error" };
  }
}
