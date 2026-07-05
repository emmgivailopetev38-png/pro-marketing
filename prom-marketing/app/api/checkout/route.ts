import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { CHECKOUT_PRODUCTS, isCheckoutProductId } from "@/lib/stripe/products";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://promarketing.pw";

const schema = z.object({
  product: z.string(),
  email: z.string().email().optional(),
});

/**
 * POST /api/checkout — създава Stripe Checkout сесия за продукт от
 * lib/stripe/products.ts и връща { url } за redirect.
 *
 * Изисква STRIPE_SECRET_KEY (sk_live_… / sk_test_…) във Vercel env.
 * Без ключ връща 503 — бутоните на сайта показват съобщение вместо счупен checkout.
 */
export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Плащанията се активират скоро. Пиши ни или запази консултация." },
      { status: 503 },
    );
  }

  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success || !isCheckoutProductId(parsed.data.product)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }
  const product = CHECKOUT_PRODUCTS[parsed.data.product];

  const stripe = new Stripe(key);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: product.priceEur * 100,
            product_data: { name: product.name, description: product.description },
          },
        },
      ],
      customer_email: parsed.data.email,
      metadata: { product: parsed.data.product },
      allow_promotion_codes: true,
      custom_text: {
        submit: {
          message:
            "С плащането приемаш Общите условия за онлайн курсове (promarketing.pw/usloviya-kursove) и даваш изрично съгласие за незабавен достъп до цифровото съдържание. Важи 14-дневна гаранция за връщане на парите.",
        },
      },
      success_url: `${SITE}${product.successPath}${product.successPath.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}&product=${parsed.data.product}`,
      cancel_url: `${SITE}${product.cancelPath}`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[checkout] Stripe error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
