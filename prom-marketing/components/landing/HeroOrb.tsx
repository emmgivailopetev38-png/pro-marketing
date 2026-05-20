"use client";
import dynamic from "next/dynamic";

const ShaderOrb = dynamic(
  () => import("@/components/effects/ShaderOrb").then((m) => m.ShaderOrb),
  { ssr: false, loading: () => null }
);

export function HeroOrb() {
  return <ShaderOrb />;
}
