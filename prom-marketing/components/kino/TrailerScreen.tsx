"use client";
import { useRef, useState } from "react";
import type { KinoVideoSource } from "@/lib/kino/config";
import { KinoPlayer, type PlayerApi } from "./KinoPlayer";

/**
 * Екранът на афиша: трейлърът тръгва сам и без звук (така го позволяват
 * браузърите), с бутон „Пусни звука“. Без трейлър — плакатът (children).
 */
export function TrailerScreen({ source, children, label = "Трейлър" }: { source: KinoVideoSource; children: React.ReactNode; label?: string }) {
  const ref = useRef<PlayerApi>(null);
  const [muted, setMuted] = useState(true);

  if (source.kind === "none") {
    return <div className="k-screen k-screen--poster">{children}</div>;
  }

  async function toggle() {
    const next = !muted;
    ref.current?.setMuted(next);
    if (!next) await ref.current?.play();
    setMuted(next);
  }

  return (
    <div className="k-screen">
      <KinoPlayer ref={ref} source={source} controls={false} ambient title={label} />
      <div className="k-screen-label">
        <span className="k-pill">{label}</span>
      </div>
      <div className="k-screen-corner">
        <button type="button" className="k-icon-btn" onClick={toggle} aria-pressed={!muted}>
          {muted ? "🔊 Пусни звука" : "🔇 Без звук"}
        </button>
      </div>
    </div>
  );
}
