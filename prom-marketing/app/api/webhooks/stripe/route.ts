import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { upsertPayment } from "@/lib/crm/repository";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { CHECKOUT_PRODUCTS, isCheckoutProductId } from "@/lib/stripe/products";
import { findPayLinkOffer } from "@/lib/stripe/pay-link-offer";
import { setOfferStatus } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe — записва успешните плащания в CRM-а.
 *
 * Слуша checkout.session.completed: намира/създава контакт по имейла от
 * checkout-а, вдига stage на "client", логва activity и записва плащане
 * (dedupe по session id — Stripe праща повторения при retry).
 *
 * Настройка в Stripe Dashboard → Developers → Webhooks:
 *   endpoint: https://promarketing.pw/api/webhooks/stripe
 *   event:    checkout.session.completed
 * Env: STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET (whsec_…).
 */
export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !whSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(key);
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature ?? "", whSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ ok: true, skipped: "not paid" });
  }

  const email = (session.customer_details?.email ?? session.customer_email ?? "").toLowerCase();
  const fullName = session.customer_details?.name ?? "Stripe клиент";
  // Checkout от ключа носи metadata; Payment Link носи само client_reference_id.
  const payLinkId = session.metadata?.pay_link_id ?? session.client_reference_id ?? null;
  const viaVoice = session.metadata?.source === "voice_agent" || Boolean(session.client_reference_id);
  const productId = session.metadata?.product ?? "";
  const product = isCheckoutProductId(productId) ? CHECKOUT_PRODUCTS[productId] : null;
  // При Payment Link продуктът не е в metadata — името идва от офертата зад линка.
  const linkedOffer = payLinkId ? await findPayLinkOffer(payLinkId).catch(() => null) : null;
  const productName = product?.name ?? linkedOffer?.title ?? "Онлайн покупка";
  const amountEur = (session.amount_total ?? 0) / 100;
  const currency = (session.currency ?? "eur").toUpperCase();

  const supabase = createServiceClient();

  // Контакт по имейл (checkout-ът винаги събира имейл). Линкът от гласовия
  // агент носи и картона в metadata — той печели, ако човекът е платил от
  // друг имейл, отколкото е оставил на формата.
  let contactId: string | null = session.metadata?.contact_id ?? linkedOffer?.contact_id ?? null;
  if (contactId) {
    const { data: known } = await supabase.from("contacts").select("id").eq("id", contactId).maybeSingle();
    if (known) await supabase.from("contacts").update({ stage: "client" }).eq("id", contactId);
    else contactId = null;
  }
  if (!contactId && email) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id, stage, full_name")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      contactId = existing.id;
      const patch: Record<string, string> = { stage: "client" };
      if (!existing.full_name && fullName) patch.full_name = fullName;
      await supabase.from("contacts").update(patch).eq("id", contactId);
    } else {
      const { data: created } = await supabase
        .from("contacts")
        .insert({
          full_name: fullName,
          email,
          stage: "client",
          source: "stripe_checkout",
          notes: `Купи „${productName}” през Stripe`,
        })
        .select("id")
        .single();
      contactId = created?.id ?? null;
    }
  }

  if (contactId) {
    await supabase.from("contact_activities").insert({
      contact_id: contactId,
      activity_type: "payment",
      title: `💳 Плати ${amountEur} ${currency} · ${productName}${viaVoice ? " · затворено от гласовия агент" : ""}`,
      body: `Stripe Checkout · сесия ${session.id}`,
      created_by: "stripe_webhook",
      metadata: { product: productId, amount: amountEur, currency, session_id: session.id, source: session.metadata?.source ?? null, pay_link_id: payLinkId },
    });
  }

  /**
   * Офертата зад линка на гласовия агент става „приета“ — а това в CRM-а
   * значи проект и чернова фактура, създадени веднъж. Така кръгът
   * разговор → линк → плащане → работа се затваря без ръка на Ивайло.
   */
  if (payLinkId) {
    try {
      const offer = linkedOffer ?? (await findPayLinkOffer(payLinkId));
      if (offer && offer.status !== "accepted") {
        const r = await setOfferStatus({ id: offer.id, status: "accepted" });
        if (r.error) console.error("[webhooks/stripe] offer accepted", r.error);
      }
    } catch (e) {
      console.error("[webhooks/stripe] offer", e instanceof Error ? e.message : e);
    }
  }

  // Счетоводен запис — dedupe по session id, за да са безопасни retry-ята.
  await upsertPayment({
    contact_id: contactId ?? undefined,
    amount: amountEur,
    currency,
    paid_at: new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    counterparty_name: fullName,
    payment_reference_redacted: `Stripe · ${productName}`,
    match_status: "unmatched",
    source: "manual",
    notes: `Stripe Checkout (${productId || "unknown"}), сесия ${session.id}`,
    dedupe_key: `stripe:${session.id}`,
  });

  // Известие към админа.
  const adminTo = (process.env.ALLOWED_ADMIN_EMAILS ?? "emmgivailopetev38@gmail.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  if (adminTo) {
    sendEmail({
      to: adminTo,
      subject: `💰 Ново плащане: ${amountEur} ${currency} · ${productName}${viaVoice ? " · от гласовия агент" : ""}`,
      html: `<p><strong>${escapeHtml(fullName)}</strong> (${escapeHtml(email || "без имейл")}) плати <strong>${amountEur} ${currency}</strong> за „${escapeHtml(productName)}”.</p>
${contactId ? `<p><a href="https://promarketing.pw/admin/clients/${contactId}">Виж в CRM-а</a></p>` : ""}`,
      text: `${fullName} (${email}) плати ${amountEur} ${currency} за ${productName}.`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
