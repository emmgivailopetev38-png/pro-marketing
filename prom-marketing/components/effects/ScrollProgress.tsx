"use client";
import { useEffect, useState } from "react";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setProgress(total > 0 ? h.scrollTop / total : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed right-3 top-0 z-50 h-screen w-[2px]">
      <div
        className="origin-top transition-transform duration-150"
        style={{
          transform: `scaleY(${progress})`,
          background: "linear-gradient(to bottom, #06b6d4, #7c3aed, #ec4899)",
          height: "100%",
          boxShadow: "0 0 12px rgba(6,182,212,0.6)",
        }}
      />
    </div>
  );
}
