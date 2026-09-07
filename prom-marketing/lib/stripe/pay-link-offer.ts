import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { payLinkDedupeKey } from "@/lib/stripe/pay-link";

/**
 * Офертата зад линка за плащане живее в `offers` с dedupe_key `paylink:<id>`.
 * Тук са двете малки стъпки, които не са на агента: „отвори линка" и
 * „плати" (второто го вика Stripe webhook-ът).
 */

export async function findPayLinkOffer(id: string): Promise<{ id: string; contact_id: string | null; status: string; title: string } | null> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("offers")
    .select("id, contact_id, status, title")
    .eq("dedupe_key", payLinkDedupeKey(id))
    .maybeSingle();
  return (data as { id: string; contact_id: string | null; status: string; title: string } | null) ?? null;
}

/** Човекът е отворил линка: офертата става „viewed" и в картона остава ред. */
export async function markPayLinkOpened(id: string): Promise<void> {
  const offer = await findPayLinkOffer(id);
  if (!offer) return;
  const sb = createServiceClient();
  if (offer.status === "sent") {
    await sb.from("offers").update({ status: "viewed" }).eq("id", offer.id);
  }
  if (offer.contact_id) {
    await sb.from("contact_activities").insert({
      contact_id: offer.contact_id,
      activity_type: "offer_viewed",
      title: `👀 Отвори линка за плащане · ${offer.title}`,
      body: null,
      occurred_at: new Date().toISOString(),
      metadata: { pay_link_id: id, offer_id: offer.id },
      created_by: "stripe_pay_link",
    });
  }
}
