"use client";

/* Видео карта за /uspehi и секцията на началната страница.
   Нула байта видео при зареждане: само постерът; mp4 тръгва при клик. */

import Image from "next/image";
import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { track } from "@/lib/analytics/track";
import type { Video } from "@/lib/site/uspehi";

export function VideoKarta({ v, kade }: { v: Video; kade: string }) {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  const play = () => {
    setOn(true);
    track("uspehi_video_play", { clip: v.slug, kade });
    window.setTimeout(() => ref.current?.play().catch(() => {}), 0);
  };
  return (
    <figure className="v2-card flex min-w-0 flex-col overflow-hidden p-0" style={{ padding: 0 }}>
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: v.format === "4x5" ? "4 / 5" : "9 / 16", background: "var(--v2-void)" }}>
        <video
          ref={ref}
          poster={`/videa/${v.slug}.jpg`}
          preload="none"
          playsInline
          controls={on}
          className="h-full w-full object-cover"
        >
          <source src={`/videa/${v.slug}.mp4`} type="video/mp4" />
        </video>
        {!on && (
          <Image src={`/videa/${v.slug}.jpg`} alt="" fill sizes="(max-width: 640px) 100vw, 450px" className="object-cover" />
        )}
        {!on && (
          <button
            type="button"
            onClick={play}
            aria-label={`Пусни видеото: ${v.title}`}
            className="group absolute inset-0 flex items-end justify-center pb-6 transition"
            style={{ background: "linear-gradient(180deg, transparent 50%, rgba(4,6,13,0.78) 100%)" }}
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full backdrop-blur transition group-hover:scale-105"
              style={{ background: "rgba(4,6,13,0.55)", border: "1px solid var(--v2-line-bright)", boxShadow: "0 0 30px -6px var(--v2-glow-cyan)" }}
            >
              <Play className="h-6 w-6 translate-x-[2px]" style={{ color: "var(--v2-cyan)" }} fill="currentColor" />
            </span>
          </button>
        )}
      </div>
      <figcaption className="flex flex-col gap-1.5 p-4">
        <span className="v2-mono text-[10.5px] uppercase tracking-[0.18em]" style={{ color: "var(--v2-faint)" }}>
          {v.scene} · {v.len}
        </span>
        <span className="text-[15px] font-semibold leading-snug" style={{ color: "var(--v2-ink)" }}>{v.title}</span>
        {v.ai && <span className="text-[12px]" style={{ color: "var(--v2-muted)" }}>🤖 {v.ai}</span>}
      </figcaption>
    </figure>
  );
}
