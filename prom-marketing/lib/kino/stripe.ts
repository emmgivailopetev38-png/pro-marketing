import "server-only";
import type Stripe from "stripe";
import { upsertPayment } from "@/lib/crm/repository";
import { upsertContactAndLog } from "@/lib/contacts/repository";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { sendTelegram } from "@/lib/notifications/telegram";
import { KINO, KINO_SOURCE } from "./config";
import { quotePlan, planProductName, formatEur, isKinoPlan, type KinoPlan, type PlanQuote } from "./pricing";
import { welcomeEmail, depositEmail } from "./emails";
import { getContact, kinoLog, kinoEvent, kinoLinks, firstName, SCREENING, type KinoContact } from "./server";
import { kinoCapi } from "./meta";

/**
 * Плащанията от залата — Stripe Checkout с цени, подадени на място
 * (price_data): нищо не се създава ръчно в таблото на Stripe.
 *
 *  full          — еднократно плащане (една цена, с ДДС);
 *  installments  — абонамент 3 × месечно, който СПИРА САМ: след третото
 *                  платено плащане webhook-ът слага cancel_at_period_end, а
 *                  кронът /api/cron/kino-flow проверява всеки час като
 *                  предпазна мрежа (ако invoice.paid не е пристигнал);
 *  deposit       — капаро (приспада се; пази мястото в потока до разговора).
 *
 * Webhook-ът е същият /api/webhooks/stripe — kino сесиите се познават по
 * metadata.funnel = "kino" и не стигат до стария код. ⚠ В Stripe → Webhooks
 * към събитието checkout.session.completed трябва да се добави и invoice.paid.
 */

const SITE = KINO.site;

export interface KinoCheckoutResult {
  url?: string;
  sessionId?: string;
  quote?: PlanQuote;
  error?: string;
}

export async function createKinoCheckout(args: {
  stripe: Stripe;
  plan: KinoPlan;
  contact: KinoContact;
  token: string;
  depositPaidEur: number;
  from: "zala" | "plashtane";
}): Promise<KinoCheckoutResult> {
  const { stripe, plan, contact, token } = args;
  const quote = quotePlan(plan, { depositPaidEur: plan === "deposit" ? 0 : args.depositPaidEur });
  const name = planProductName(quote);
  const description =
    plan === "deposit"
      ? "Пази мястото ти в потока до разговора. Приспада се изцяло от цената."
      : plan === "installments"
        ? `${quote.count} месечни вноски по ${formatEur(quote.unitEur)}. Абонаментът спира сам след последната.`
        : "Цялата програма с едно плащане.";

  const metadata: Record<string, string> = {
    funnel: "kino",
    screening: SCREENING,
    plan,
    contact_id: contact.id,
    total_eur: String(quote.totalEur),
    unit_eur: String(quote.unitEur),
    installments: String(quote.count),
    credit_eur: String(quote.creditEur),
  };

  // Платеното капаро влиза като еднократна отстъпка в първото плащане.
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (quote.creditEur > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(quote.creditEur * 100),
      currency: "eur",
      duration: "once",
      max_redemptions: 1,
      name: "Капаро — приспада се",
      metadata: { funnel: "kino", contact_id: contact.id },
    });
    discounts = [{ coupon: coupon.id }];
  }

  // ⚠ ЧЕРНОВА — чака Ивайло + юрист: текстът над бутона за плащане (условия, отказ, капаро)
  const message =
    plan === "deposit"
      ? "Капарото се приспада изцяло от цената на потока. Цената е крайна, с ДДС. С плащането приемаш Общите условия (promarketing.pw/terms)."
      : `С плащането приемаш Общите условия за онлайн курсове (promarketing.pw/usloviya-kursove) и даваш съгласие за незабавен достъп до цифровото съдържание. Цената е крайна, с ДДС.${plan === "installments" ? " Абонаментът спира автоматично след последната вноска." : ""}`;

  const back = args.from === "plashtane" ? `${SITE}/kino/plashtane?t=${token}` : `${SITE}/kino/zala?t=${token}#oferta`;
  const session = await stripe.checkout.sessions.create({
    mode: quote.mode,
    locale: "bg",
    customer_email: contact.email ?? undefined,
    client_reference_id: contact.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(quote.unitEur * 100),
          product_data: { name, description },
          ...(quote.mode === "subscription" ? { recurring: { interval: "month" as const } } : {}),
        },
      },
    ],
    metadata,
    ...(quote.mode === "payment"
      ? { payment_intent_data: { metadata, description: name }, customer_creation: "always" as const }
      : { subscription_data: { metadata, description: name } }),
    ...(discounts ? { discounts } : {}),
    custom_text: { submit: { message } },
    success_url: `${SITE}/kino/blagodarim?plan=${plan}&t=${token}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: back,
  });
  return { url: session.url ?? undefined, sessionId: session.id, quote };
}

// ── webhook ─────────────────────────────────────────────────────────────────

function adminEmail(): string | null {
  return (
    (process.env.ALLOWED_ADMIN_EMAILS ?? "emmgivailopetev38@gmail.com")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)[0] ?? null
  );
}

async function resolveContact(meta: Stripe.Metadata | null, email: string, name: string | null): Promise<KinoContact | null> {
  const byId = meta?.contact_id ? await getContact(meta.contact_id) : null;
  if (byId) return byId;
  if (!email) return null;
  const r = await upsertContactAndLog({ full_name: name, email, source: KINO_SOURCE }).catch(() => null);
  return r?.contact_id ? { id: r.contact_id, full_name: name, email, phone: null } : null;
}

async function notifyOwner(text: string, html: string, contactId: string | null): Promise<void> {
  await sendTelegram(text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), {
    buttons: contactId ? [{ text: "👤 Картонът", url: `${SITE}/admin/clients/${contactId}` }, { text: "🎬 Кино", url: `${SITE}/admin/kino` }] : [{ text: "🎬 Кино", url: `${SITE}/admin/kino` }],
  }).catch(() => false);
  const to = adminEmail();
  if (to) await sendEmail({ to, subject: text.slice(0, 150), html, text }).catch(() => null);
}

function calUrl(): string {
  return `https://cal.com/${KINO.cal.link}`;
}

/** Една платена вноска / плащане — в счетоводството на CRM-а (dedupe по ключ на Stripe). */
async function bookPayment(args: { contactId: string; amountEur: number; paidAtSec: number; name: string; ref: string; dedupe: string }) {
  await upsertPayment({
    contact_id: args.contactId,
    amount: args.amountEur,
    currency: "EUR",
    paid_at: new Date(args.paidAtSec * 1000).toISOString(),
    counterparty_name: args.name,
    payment_reference_redacted: `Stripe · ${args.ref}`,
    match_status: "unmatched",
    source: "manual",
    notes: `Кино „${KINO.title}“ · ${args.ref}`,
    dedupe_key: args.dedupe,
  }).catch(() => null);
}

async function handleSession(s: Stripe.Checkout.Session): Promise<string> {
  const plan = s.metadata?.plan;
  if (!isKinoPlan(plan)) return "unknown plan";
  const email = (s.customer_details?.email ?? s.customer_email ?? "").toLowerCase();
  const fullName = s.customer_details?.name ?? null;
  const contact = await resolveContact(s.metadata, email, fullName);
  if (!contact) return "no contact";
  const name = firstName(contact.full_name ?? fullName);
  const amount = (s.amount_total ?? 0) / 100;
  const total = Number(s.metadata?.total_eur) || amount;
  const links = kinoLinks(contact.id);

  if (plan === "deposit") {
    await kinoLog({
      contactId: contact.id,
      type: "kino_deposit",
      title: `🔒 Капаро ${formatEur(amount)} · пази място в потока`,
      body: `Stripe сесия ${s.id}. Пази мястото в потока до разговора; приспада се от ${formatEur(total)}.`,
      metadata: { plan, amount_eur: amount, session_id: s.id },
      dedupeKey: `kino:deposit:${s.id}`,
      followupStatus: "ready_to_close",
      dealValueEur: Math.round(total),
    });
    await kinoEvent({ contactId: contact.id, type: "deposit", value: plan, amountEur: amount, meta: { session_id: s.id } });
    await bookPayment({ contactId: contact.id, amountEur: amount, paidAtSec: s.created, name: contact.full_name ?? fullName ?? email, ref: "Кино · капаро", dedupe: `stripe:${s.id}` });
    if (contact.email) {
      const m = depositEmail({ name, amountLine: formatEur(amount), calUrl: calUrl(), payUrl: links ? `${SITE}/kino/plashtane?t=${links.token}` : null });
      await sendEmail({ to: contact.email, ...m }).catch(() => null);
    }
    await notifyOwner(
      `🔒 Капаро ${formatEur(amount)} от ${contact.full_name ?? email} — кино „${KINO.title}“`,
      `<p><strong>${escapeHtml(contact.full_name ?? email)}</strong> плати капаро <strong>${escapeHtml(formatEur(amount))}</strong>. Следва разговор (календарът е пред него).</p>`,
      contact.id,
    );
    return "deposit";
  }

  // Поток — изцяло или първа вноска.
  const isSub = s.mode === "subscription";
  const invoiceId = typeof s.invoice === "string" ? s.invoice : (s.invoice?.id ?? null);
  const planLine = isSub
    ? `вноска 1 от ${s.metadata?.installments ?? "3"} · ${formatEur(amount)}`
    : `${formatEur(amount)} · пълно плащане`;
  await kinoLog({
    contactId: contact.id,
    type: "kino_payment",
    title: `💳 Влезе в потока · ${planLine}`,
    body: `Stripe ${isSub ? "абонамент" : "плащане"} · сесия ${s.id}. Стойност на сделката: ${formatEur(total)}.`,
    metadata: { plan, amount_eur: amount, total_eur: total, session_id: s.id, installment: isSub ? 1 : null, invoice_id: invoiceId },
    dedupeKey: isSub && invoiceId ? `kino:inst:${invoiceId}` : `kino:pay:${s.id}`,
    stage: "won",
    dealValueEur: Math.round(total),
  });
  await kinoLog({
    contactId: contact.id,
    type: "kino_academy",
    title: "🎓 Да се отключи Академията — влезе в потока",
    body: `Покана на ${contact.email ?? email} (Академия → Покани). Писмото „Добре дошъл“ обещава покана до 24 часа.`,
    dedupeKey: `kino:academy:${contact.id}`,
  });
  await kinoEvent({ contactId: contact.id, type: "payment", value: plan, amountEur: amount, meta: { session_id: s.id, total_eur: total } });
  await bookPayment({
    contactId: contact.id,
    amountEur: amount,
    paidAtSec: s.created,
    name: contact.full_name ?? fullName ?? email,
    ref: isSub ? "Кино · вноска 1" : "Кино · поток",
    dedupe: isSub && invoiceId ? `stripe:inv:${invoiceId}` : `stripe:${s.id}`,
  });
  if (contact.email) {
    await sendEmail({ to: contact.email, ...welcomeEmail({ name, planLine, calUrl: calUrl() }) }).catch(() => null);
  }
  await kinoCapi({
    event: "Purchase",
    eventId: `kino_purchase_${s.id}`,
    url: `${SITE}/kino/blagodarim`,
    contact: { id: contact.id, email: contact.email ?? email, phone: contact.phone, name: contact.full_name },
    custom: { value: total, currency: "EUR", content_ids: [`kino-${plan}`], plan },
  });
  await notifyOwner(
    `💰 Нов в потока: ${contact.full_name ?? email} · ${planLine} — кино „${KINO.title}“. Дай достъп в Академията.`,
    `<p><strong>${escapeHtml(contact.full_name ?? email)}</strong> влезе в потока: <strong>${escapeHtml(planLine)}</strong> (сделка ${escapeHtml(formatEur(total))}).</p><p>🎓 Покана за Академията на ${escapeHtml(contact.email ?? email)} — писмото обещава до 24 часа.</p>`,
    contact.id,
  );
  return isSub ? "installment-1" : "full";
}

function subscriptionIdOf(inv: Stripe.Invoice): string | null {
  const sub = inv.parent?.subscription_details?.subscription ?? null;
  return typeof sub === "string" ? sub : (sub?.id ?? null);
}

/** Колко вноски са платени и спира ли абонаментът (≥ броя вноски → cancel_at_period_end). */
export async function enforceInstallmentLimit(stripe: Stripe, subscriptionId: string, total: number): Promise<{ paid: number; stopped: boolean }> {
  const list = await stripe.invoices.list({ subscription: subscriptionId, status: "paid", limit: 24 });
  const paid = list.data.filter((i) => (i.amount_paid ?? 0) > 0 || i.billing_reason === "subscription_create").length;
  if (paid < total) return { paid, stopped: false };
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  if (sub.status === "canceled" || sub.cancel_at_period_end) return { paid, stopped: true };
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
    metadata: { ...sub.metadata, installments_done: "1" },
  });
  return { paid, stopped: true };
}

async function handleInvoice(stripe: Stripe, inv: Stripe.Invoice): Promise<string> {
  const meta = inv.parent?.subscription_details?.metadata ?? null;
  const subId = subscriptionIdOf(inv);
  if (!subId) return "no subscription";
  const total = Number(meta?.installments) || KINO.prices.installments;
  const email = (inv.customer_email ?? "").toLowerCase();
  const contact = await resolveContact(meta, email, inv.customer_name ?? null);
  const { paid, stopped } = await enforceInstallmentLimit(stripe, subId, total);
  if (!contact) return `paid ${paid}/${total}, no contact`;
  const amount = (inv.amount_paid ?? 0) / 100;
  const n = Math.max(1, Math.min(paid, total));
  await kinoLog({
    contactId: contact.id,
    type: "kino_payment",
    title: `💳 Вноска ${n} от ${total} · ${formatEur(amount)}`,
    body: `Stripe фактура ${inv.id} · абонамент ${subId}.${stopped ? " Вноските са изплатени — абонаментът спира сам." : ""}`,
    metadata: { plan: "installments", amount_eur: amount, installment: n, invoice_id: inv.id, subscription_id: subId, total_eur: Number(meta?.total_eur) || null },
    dedupeKey: `kino:inst:${inv.id}`,
    stage: "won",
  });
  await bookPayment({
    contactId: contact.id,
    amountEur: amount,
    paidAtSec: inv.status_transitions?.paid_at ?? inv.created,
    name: contact.full_name ?? email,
    ref: `Кино · вноска ${n}`,
    dedupe: `stripe:inv:${inv.id}`,
  });
  if (inv.billing_reason !== "subscription_create") {
    await kinoEvent({ contactId: contact.id, type: "payment", value: "installments", amountEur: amount, meta: { invoice_id: inv.id, installment: n } });
  }
  return `installment ${n}/${total}${stopped ? " · stop" : ""}`;
}

/**
 * Входът от /api/webhooks/stripe. `handled: false` = не е от залата → старият
 * код продължава както досега, без никаква промяна.
 */
export async function handleKinoStripeEvent(stripe: Stripe, event: Stripe.Event): Promise<{ handled: boolean; info?: string }> {
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.metadata?.funnel !== "kino") return { handled: false };
    if (s.payment_status !== "paid") return { handled: true, info: "not paid yet" };
    // Абонаментът за вноските се ограничава при invoice.paid (виж handleInvoice).
    return { handled: true, info: await handleSession(s) };
  }
  if (event.type === "invoice.paid") {
    const inv = event.data.object as Stripe.Invoice;
    if (inv.parent?.subscription_details?.metadata?.funnel !== "kino") return { handled: false };
    return { handled: true, info: await handleInvoice(stripe, inv) };
  }
  return { handled: false };
}

/** Предпазната мрежа от крона: всички активни кино абонаменти с изплатени вноски спират. */
export async function sweepInstallmentSubscriptions(stripe: Stripe): Promise<{ checked: number; stopped: number; errors: string[] }> {
  const errors: string[] = [];
  let checked = 0;
  let stopped = 0;
  try {
    const res = await stripe.subscriptions.search({ query: "metadata['funnel']:'kino' AND status:'active'", limit: 100 });
    for (const sub of res.data) {
      if (sub.cancel_at_period_end) continue;
      checked++;
      try {
        const total = Number(sub.metadata?.installments) || KINO.prices.installments;
        const r = await enforceInstallmentLimit(stripe, sub.id, total);
        if (r.stopped) stopped++;
      } catch (e) {
        errors.push(`${sub.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }
  return { checked, stopped, errors };
}
