import { NextResponse } from "next/server";
import Stripe from "stripe";
import { CHECKOUT_PRODUCTS } from "@/lib/stripe/products";
import { siteOrigin, verifyPayToken } from "@/lib/stripe/pay-link";
import { markPayLinkOpened } from "@/lib/stripe/pay-link-offer";

export const dynamic = "force-dynamic";

/**
 * GET /plati/<token> — линкът, който гласовият агент е пратил на имейла.
 *
 * Проверява подписа, създава ПРЯСНА Stripe Checkout сесия и препраща към нея.
 * Сесията се прави чак тук, а не при изпращането: Stripe я държи най-много
 * 24 часа, а нашият линк живее две седмици. Всеки клик получава нова.
 *
 * Без `STRIPE_SECRET_KEY` линкът не е счупен — показва страница, че Ивайло
 * ще уреди плащането лично. Агентът в този случай изобщо не обещава линк
 * (виж /api/voice/public/pay-link), така че тук стигат само стари линкове.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const v = verifyPayToken(token);
  if (!v.ok) {
    return page(
      v.reason === "expired" ? "Този линк е изтекъл." : "Този линк не е валиден.",
      "Пиши на Ивайло или си запази час — ще ти прати нов за минута.",
      410
    );
  }
  const { payload } = v;
  const product = CHECKOUT_PRODUCTS[payload.p];

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return page(
      "Плащането онлайн се активира.",
      `${payload.n ? `${payload.n}, ` : ""}Ивайло ще ти прати начин за плащане лично на ${payload.e}. Ако бързаш — звънни му.`,
      503
    );
  }

  const site = siteOrigin();
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
      customer_email: payload.e,
      // Всичко, по което webhook-ът после познава плащането: кой продукт, чий
      // картон, кой линк. `pay_link_id` води до офертата (dedupe_key paylink:<id>).
      metadata: {
        product: payload.p,
        source: "voice_agent",
        pay_link_id: payload.id,
        ...(payload.c ? { contact_id: payload.c } : {}),
      },
      custom_text: {
        submit: {
          message:
            "С плащането възлагаш услугата на ProMarketing LTD при Общите условия (promarketing.pw/terms). Фактурата идва на имейла ти автоматично.",
        },
      },
      success_url: `${site}${product.successPath}${product.successPath.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}${product.cancelPath}`,
    });
    if (!session.url) throw new Error("Stripe не върна адрес на сесията");

    // „Отвори линка" в картона — Ивайло вижда кой е стигнал до плащането.
    markPayLinkOpened(payload.id).catch((e) => console.error("[plati] opened", e));

    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    console.error("[plati] Stripe error:", e instanceof Error ? e.message : e);
    return page("Плащането не се отвори.", "Пробвай пак след минута или пиши на Ивайло — линкът си остава валиден.", 502);
  }
}

function page(title: string, text: string, status: number): Response {
  const html = `<!doctype html><html lang="bg"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · ProMarketing</title>
<style>body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#070c10;color:#e2e8f0;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}main{max-width:460px;text-align:center}h1{font-size:26px;margin:0 0 12px}p{color:#94a3b8;line-height:1.6;margin:0 0 22px}a.b{display:inline-block;background:#22d3ee;color:#04070a;font-weight:700;border-radius:999px;padding:12px 22px;text-decoration:none;margin:4px}a.s{display:inline-block;color:#cbd5e1;border:1px solid #334155;border-radius:999px;padding:12px 22px;text-decoration:none;margin:4px}</style></head>
<body><main><h1>${esc(title)}</h1><p>${esc(text)}</p><a class="b" href="/booking">Запази час с Ивайло</a><a class="s" href="tel:+359877399963">Звънни</a></main></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
