"use client";
/* =====================================================================
   NeuralCoreLazy — what the four v2 sections mount instead of importing
   NeuralCore directly.

   NeuralCore pulls in three + @react-three/fiber (~600 KB of JS). It was
   imported statically by PainPointsV2, TestimonialsV2, WhyUsV2 and
   IndustriesV2, so every visitor downloaded and parsed the entire 3D stack
   before the landing page could hydrate — for four decorative spheres,
   three of which sit far below the fold.

   Two changes:

   1. `next/dynamic` with ssr:false keeps three out of the initial bundle,
      exactly how HeroOrb already treats ShaderOrb.
   2. An IntersectionObserver delays mounting until the sphere is near the
      viewport. NeuralCore already parks its render loop off-screen
      (frameloop="never"), but the WebGL context is still created on mount,
      and browsers cap how many live contexts a page may hold. Four eager
      canvases spend that budget on spheres nobody has scrolled to yet.

   Once visible it stays mounted — remounting a canvas on every scroll
   would cost more than it saves.

   The wrapper is `absolute inset-0` on purpose: NeuralCore renders itself
   absolutely positioned inside the sized box the sections give it, so the
   wrapper has to fill that same box. It must not be `display: contents`
   either — such an element generates no box at all, and an
   IntersectionObserver would never fire on it.
   ===================================================================== */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { NeuralCoreProps } from "@/components/landing/v2/NeuralCore";

const NeuralCore = dynamic(
  () => import("@/components/landing/v2/NeuralCore").then((m) => m.NeuralCore),
  { ssr: false, loading: () => null }
);

export function NeuralCoreLazy(props: NeuralCoreProps) {
  const holder = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;

    // Very old browser without IntersectionObserver → just render it.
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect(); // one-way switch: never unmount the canvas
        }
      },
      // Start fetching slightly before it scrolls in, so it is ready on arrival.
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={holder} className="absolute inset-0" aria-hidden>
      {show ? <NeuralCore {...props} /> : null}
    </div>
  );
}
