"use client";
import { useEffect, useState, type ComponentType } from "react";

/**
 * ShaderOrb is WebGL (its own GL context + rAF) and drags in three, which is
 * an 871 KB chunk. It is desktop-only by design: on a phone it is never
 * rendered at all.
 *
 * It used to be pulled in with next/dynamic. That code-splits, but because
 * HeroV2 imports this component statically and the hero is above the fold,
 * Next emitted the dynamic chunk as an eager <script async> in the initial
 * HTML — so every phone downloaded and parsed all 871 KB of three for an orb
 * it would never draw.
 *
 * A plain runtime import() inside the effect keeps the same split without the
 * preload: the chunk is requested only once the media query has actually
 * matched, i.e. only on a real desktop.
 */
export function HeroOrb() {
  const [Orb, setOrb] = useState<ComponentType | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    let cancelled = false;

    const load = () => {
      // Only fetch on a desktop, and only once.
      if (!mq.matches || cancelled) return;
      import("@/components/effects/ShaderOrb")
        .then((m) => {
          if (!cancelled) setOrb(() => m.ShaderOrb);
        })
        .catch(() => {
          // A failed decorative chunk must never break the hero.
        });
    };

    load();
    // Covers a tablet rotating into desktop width, or an external mouse.
    mq.addEventListener?.("change", load);
    return () => {
      cancelled = true;
      mq.removeEventListener?.("change", load);
    };
  }, []);

  return Orb ? <Orb /> : null;
}
