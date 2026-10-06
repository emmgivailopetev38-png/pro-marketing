import { NextResponse, after } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { KINO } from "@/lib/kino/config";
import { isKinoPlan, isCartOpen } from "@/lib/kino/pricing";
import { contactFromTicket } from "@/lib/kino/token";
import { getContact, depositPaidEur, hasBoughtProgram, hasKinoInvite, kinoEvent, kinoLog } from "@/lib/kino/server";
import { createKinoCheckout } from "@/lib/kino/stripe";
import { kinoCapi, safeEventId } from "@/lib/kino/meta";

export const dynamic = "force-dynamic";

/**
 * POST /api/kino/checkout — бутоните под филма → Stripe Checkout.
 * { t, plan: "full" | "installments" | "deposit", from?, eventId? }
 *
 * Без STRIPE_SECRET_KEY връща 503 с { fallback: "call" } — залата тогава
 * отваря календара вместо счупено плащане (ключът във Vercel го слага Ивайло).
 * Отделен маршрут от /api/checkout: старите бутони на сайта не се пипат.
 */

const schema = z.object({
  t: z.string().min(20).max(80),
  plan: z.string(),
  from: z.enum(["zala", "plashtane"]).optional(),
  eventId: z.string().optional(),
  fbp: z.string().max(200).optional(),
  fbc: z.string().max(400).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isKinoPlan(parsed.data.plan)) {
    return NextResponse.json({ error: "Невалидна заявка." }, { status: 400 });
  }
  const { t, plan } = parsed.data;
  const contactId = contactFromTicket(t);
  if (!contactId) return NextResponse.json({ error: "Билетът не е валиден — отвори линка от имейла си." }, { status: 401 });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Плащането онлайн се отваря всеки момент. Избери час — ще го уредим на разговора.", fallback: "call" },
      { status: 503 },
    );
  }
  const contact = await getContact(contactId);
  if (!contact) return NextResponse.json({ error: "Не намерихме билета ти. Пиши ни — ще помогнем." }, { status: 404 });

  const [deposit, bought] = await Promise.all([depositPaidEur(contactId), hasBoughtProgram(contactId)]);
  if (bought) return NextResponse.json({ error: "Вече си в потока — провери пощата си за следващите стъпки.", done: true }, { status: 409 });
  if (plan === "deposit" && deposit > 0) {
    return NextResponse.json({ error: "Капарото ти вече е платено — избери час за разговора.", fallback: "call" }, { status: 409 });
  }
  // Честният срок: записването затваря с филма (нд 23:59). След това —
  // само платилите капаро и хората след разговор (по CRM-а, не по линка:
  // `from` идва от браузъра и не отваря нищо).
  const from = parsed.data.from ?? "zala";
  const openForAll = isCartOpen(Date.now(), { depositPaid: deposit > 0 });
  if (!openForAll && !(await hasKinoInvite(contactId))) {
    return NextResponse.json(
      { error: "Записването в потока затвори заедно с филма. Избери час — ще видим заедно какво следва.", fallback: "call" },
      { status: 410 },
    );
  }

  try {
    const stripe = new Stripe(key);
    const r = await createKinoCheckout({
      stripe,
      plan,
      contact,
      token: t,
      depositPaidEur: deposit,
      from,
    });
    if (!r.url || !r.quote) return NextResponse.json({ error: "Плащането не се отвори. Опитай пак." }, { status: 500 });
    const quote = r.quote;
    const eventId = safeEventId(parsed.data.eventId);
    after(async () => {
      await kinoEvent({ contactId, type: "checkout", value: plan, amountEur: quote.dueNowEur, meta: { session_id: r.sessionId, from } });
      await kinoLog({
        contactId,
        type: "kino_checkout",
        title: `🧾 Отвори плащането · ${plan === "deposit" ? "капаро" : plan === "installments" ? "3 вноски" : "пълно плащане"}`,
        body: `Stripe сесия ${r.sessionId} · ${quote.dueNowEur} € сега${quote.creditEur ? ` (приспаднато капаро ${quote.creditEur} €)` : ""}`,
        metadata: { plan, session_id: r.sessionId, due_now_eur: quote.dueNowEur, from },
        dedupeKey: `kino:checkout:${r.sessionId}`,
      });
      if (eventId) {
        await kinoCapi({
          event: "InitiateCheckout",
          eventId,
          request,
          url: `${KINO.site}/kino/zala`,
          contact: { id: contact.id, email: contact.email, phone: contact.phone, name: contact.full_name },
          fbp: parsed.data.fbp ?? null,
          fbc: parsed.data.fbc ?? null,
          custom: { value: quote.dueNowEur, currency: "EUR", plan },
        });
      }
    });
    return NextResponse.json({ url: r.url });
  } catch (e) {
    console.error("[kino/checkout]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Плащането не се отвори. Опитай пак след малко." }, { status: 500 });
  }
}
