"use client";
import { useEffect, useState, type ComponentType } from "react";

/**
 * ShaderOrb is WebGL (its own GL context + rAF) and drags in three, which is
 * an 871 KB chunk. It is desktop-only by design: on a phone it is never
 * rendered at all.
 *
 * A plain runtime import() inside the effect keeps the split without a
 * preload: the chunk is requested only once the media query has matched.
 *
 * Две добавки от 05.09.2026, защото сферата се появяваше рязко и се биеше за
 * мрежата с ядрото и текста в първата секунда:
 *   • чънкът се тегли чак когда браузърът е на празен ход
 *     (`requestIdleCallback`, таван 2,5 s) — заглавието и ядрото са първи;
 *   • сферата избледнява навътре за 900 ms, вместо да „изскочи".
 */
export function HeroOrb() {
  const [Orb, setOrb] = useState<ComponentType | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    let cancelled = false;
    let timer: number | undefined;

    const fetchOrb = () => {
      import("@/components/effects/ShaderOrb")
        .then((m) => {
          if (!cancelled) setOrb(() => m.ShaderOrb);
        })
        .catch(() => {
          // A failed decorative chunk must never break the hero.
        });
    };

    const load = () => {
      if (!mq.matches || cancelled) return;
      const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
      if (typeof w.requestIdleCallback === "function") {
        w.requestIdleCallback(fetchOrb, { timeout: 2500 });
      } else {
        timer = window.setTimeout(fetchOrb, 1200);
      }
    };

    load();
    // Covers a tablet rotating into desktop width, or an external mouse.
    mq.addEventListener?.("change", load);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      mq.removeEventListener?.("change", load);
    };
  }, []);

  useEffect(() => {
    if (!Orb) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [Orb]);

  if (!Orb) return null;
  return (
    <div className="absolute inset-0" style={{ opacity: shown ? 1 : 0, transition: "opacity 900ms ease" }}>
      <Orb />
    </div>
  );
}
