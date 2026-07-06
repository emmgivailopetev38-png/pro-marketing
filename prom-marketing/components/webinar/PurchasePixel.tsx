"use client";
/**
 * Стреля Meta Pixel „Purchase” еднократно на страницата за успешна поръчка.
 * Стойността идва от продукта в URL-а (?product=…) — така SALES кампаниите
 * се учат от реални покупки. Дедуп на повторен refresh през sessionStorage.
 */
import { useEffect } from "react";
import { track as pixelTrack } from "@/lib/meta/pixel-client";
import { CHECKOUT_PRODUCTS, isCheckoutProductId } from "@/lib/stripe/products";

export function PurchasePixel({ product, sessionId }: { product?: string; sessionId?: string }) {
  useEffect(() => {
    if (!product || !isCheckoutProductId(product)) return;
    const key = `fb_purchase_${sessionId ?? product}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
    pixelTrack("Purchase", {
      params: {
        value: CHECKOUT_PRODUCTS[product].priceEur,
        currency: "EUR",
        content_name: product,
      },
      eventID: sessionId,
    });
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode — ok */
    }
  }, [product, sessionId]);
  return null;
}
