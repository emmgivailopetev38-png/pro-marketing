"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ShaderOrb = dynamic(
  () => import("@/components/effects/ShaderOrb").then((m) => m.ShaderOrb),
  { ssr: false, loading: () => null }
);

export function HeroOrb() {
  // ShaderOrb is WebGL (its own GL context + rAF). It was hidden on < lg via
  // CSS, but still mounted and ran on phones/tablets. Only mount it on a real
  // desktop (fine pointer, ≥ lg) so mobile pays absolutely nothing for it.
  const [show, setShow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const apply = () => setShow(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  if (!show) return null;
  return <ShaderOrb />;
}
