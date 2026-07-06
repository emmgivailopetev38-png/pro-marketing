"use client";
import { useState } from "react";
import { track } from "@/lib/analytics/track";
import { track as pixelTrack } from "@/lib/meta/pixel-client";
import type { CheckoutProductId } from "@/lib/stripe/products";

/**
 * Бутон „Купи" → POST /api/checkout → redirect към Stripe Checkout.
 * Ако Stripe още не е конфигуриран (503), показва съобщението от API-то
 * вместо счупен поток.
 */
export function CheckoutButton({
  product,
  children,
  className,
}: {
  product: CheckoutProductId;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [notice, setNotice] = useState<string | null>(null);

  async function buy() {
    if (state === "loading") return;
    setState("loading");
    setNotice(null);
    track("checkout_clicked", { product });
    pixelTrack("InitiateCheckout", { params: { content_name: product, currency: "EUR" } });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(data.error ?? "Нещо се обърка — опитай пак след малко.");
    } catch {
      setNotice("Нещо се обърка — опитай пак след малко.");
    }
    setState("idle");
  }

  return (
    <div>
      <button
        type="button"
        onClick={buy}
        disabled={state === "loading"}
        className={
          className ??
          "group inline-flex items-center justify-center gap-2.5 rounded-full bg-[var(--color-accent-cyan)] px-8 py-4 text-base font-bold text-[var(--color-bg-void)] shadow-[0_0_44px_rgba(34,211,238,0.4)] transition hover:shadow-[0_0_70px_rgba(34,211,238,0.65)] disabled:opacity-60"
        }
      >
        {state === "loading" ? "Отваряме плащането…" : children}
      </button>
      {notice && <p className="mt-3 text-sm text-amber-400">{notice}</p>}
      <p className="mt-3 max-w-md text-xs leading-relaxed text-slate-500">
        С продължаването приемаш{" "}
        <a href="/usloviya-kursove" target="_blank" className="underline underline-offset-2 hover:text-slate-300">
          Общите условия за онлайн курсове
        </a>{" "}
        и се съгласяваш с незабавен достъп до цифровото съдържание. Важи нашата 14-дневна
        гаранция „връщане на парите".
      </p>
    </div>
  );
}
