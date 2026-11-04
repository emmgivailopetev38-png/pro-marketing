"use client";
import { useState } from "react";
import type { PortfolioVideo } from "@/lib/team/demo-catalog";

/**
 * Портфолиото в /ekip/demo: постер и надпис, видеото се зарежда чак при
 * натискане — иначе 14 клипа теглят десетки MB на телефона между два разговора.
 */
export function DemoPortfolio({ videos }: { videos: PortfolioVideo[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {videos.map((v) => (
        <figure key={v.src} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          <div className="relative aspect-[9/16] bg-black">
            {playing === v.src ? (
              <video src={v.src} poster={v.poster} controls autoPlay playsInline className="h-full w-full object-contain" />
            ) : (
              <button type="button" onClick={() => setPlaying(v.src)} className="group h-full w-full" aria-label={`Пусни: ${v.title}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.poster} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 group-hover:opacity-100" />
                <span className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-xl text-white">▶</span>
              </button>
            )}
            <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">🤖 {v.ai}</span>
          </div>
          <figcaption className="space-y-0.5 p-2">
            <p className="text-xs font-semibold leading-snug">{v.title}</p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">{v.who}</p>
            <a href={v.src} target="_blank" rel="noreferrer" className="text-[11px] text-[var(--color-accent-cyan)]">
              Цял екран ↗
            </a>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
