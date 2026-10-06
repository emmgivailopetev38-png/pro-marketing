import { describe, it, expect, vi } from "vitest";
import type Stripe from "stripe";

// Без база и без мрежа: тестваме само кое събитие е „от залата“.
vi.mock("@/lib/crm/repository", () => ({ upsertPayment: vi.fn(), recordActivity: vi.fn() }));
vi.mock("@/lib/contacts/repository", () => ({ upsertContactAndLog: vi.fn() }));
vi.mock("@/lib/email/resend", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/notifications/telegram", () => ({ sendTelegram: vi.fn() }));

import { handleKinoStripeEvent } from "./stripe";

const fakeStripe = {} as Stripe;
const ev = (type: string, object: Record<string, unknown>) => ({ type, data: { object } }) as unknown as Stripe.Event;

describe("webhook-ът на Stripe: кое е на киното", () => {
  it("чужда сесия (курсът, гласовият агент) — не се пипа, старият код продължава", async () => {
    const r = await handleKinoStripeEvent(fakeStripe, ev("checkout.session.completed", { metadata: { product: "course" }, payment_status: "paid" }));
    expect(r.handled).toBe(false);
  });

  it("чужда фактура — не се пипа", async () => {
    const r = await handleKinoStripeEvent(fakeStripe, ev("invoice.paid", { parent: { subscription_details: { metadata: { product: "lost_pro" } } } }));
    expect(r.handled).toBe(false);
  });

  it("сесия от залата, още неплатена (банков превод) — поема се, но нищо не се записва", async () => {
    const r = await handleKinoStripeEvent(fakeStripe, ev("checkout.session.completed", { metadata: { funnel: "kino", plan: "full" }, payment_status: "unpaid" }));
    expect(r).toEqual({ handled: true, info: "not paid yet" });
  });

  it("други събития — не са на киното", async () => {
    const r = await handleKinoStripeEvent(fakeStripe, ev("customer.created", {}));
    expect(r.handled).toBe(false);
  });
});
