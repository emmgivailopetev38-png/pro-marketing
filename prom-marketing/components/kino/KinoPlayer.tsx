"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { KinoVideoSource } from "@/lib/kino/config";

/**
 * Един плейър за трите източника, които Ивайло може да избере:
 *  - mp4 — обикновен файл;
 *  - hls — Bunny / Cloudflare Stream (.m3u8): Safari го пуска сам, другите
 *          браузъри — през hls.js, който се тегли само тогава;
 *  - youtube — unlisted видео през IFrame API (тегли се само тогава).
 * Залата управлява плейъра отвън (play/seek/time) — за „премиерата на живо“
 * той е без контроли, а позицията идва от часа, не от човека.
 */

export interface PlayerApi {
  /** true, ако тръгна; false, ако браузърът е блокирал звука/пускането. */
  play(): Promise<boolean>;
  pause(): void;
  seek(sec: number): void;
  time(): number;
  playing(): boolean;
  setMuted(m: boolean): void;
  muted(): boolean;
}

type PlayableSource = Exclude<KinoVideoSource, { kind: "none" }>;

interface Props {
  source: PlayableSource;
  controls: boolean;
  /** трейлърът: тръгва сам, без звук, в кръг */
  ambient?: boolean;
  onStateChange?: (playing: boolean) => void;
  onEnded?: () => void;
  title?: string;
}

// ── YouTube IFrame API (минимално) ──────────────────────────────────────────
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(s: number, allow: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  destroy(): void;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
    },
  ) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytLoading: Promise<YTNamespace> | null = null;
function loadYouTube(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytLoading) {
    ytLoading = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        if (window.YT) resolve(window.YT);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return ytLoading;
}

export const KinoPlayer = forwardRef<PlayerApi, Props>(function KinoPlayer(
  { source, controls, ambient = false, onStateChange, onEnded, title = "Видео" },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytHost = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const ytReady = useRef<Promise<void> | null>(null);
  const cb = useRef({ onStateChange, onEnded });
  useEffect(() => {
    cb.current = { onStateChange, onEnded };
  }, [onStateChange, onEnded]);

  // HLS: Safari сам, останалите през hls.js.
  useEffect(() => {
    if (source.kind !== "hls") return;
    const video = videoRef.current;
    if (!video) return;
    let destroy: (() => void) | null = null;
    let cancelled = false;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source.src;
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          const hls = new Hls({ capLevelToPlayerSize: true });
          hls.loadSource(source.src);
          hls.attachMedia(video);
          destroy = () => hls.destroy();
        } else {
          video.src = source.src;
        }
      });
    }
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [source]);

  // YouTube.
  useEffect(() => {
    if (source.kind !== "youtube" || !ytHost.current) return;
    let alive = true;
    const host = document.createElement("div");
    ytHost.current.appendChild(host);
    ytReady.current = new Promise<void>((resolve) => {
      loadYouTube().then((YT) => {
        if (!alive) return;
        yt.current = new YT.Player(host, {
          videoId: source.id,
          playerVars: {
            controls: controls ? 1 : 0,
            disablekb: controls ? 0 : 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
            fs: 1,
            ...(ambient ? { autoplay: 1, mute: 1, loop: 1, playlist: source.id } : {}),
          },
          events: {
            onReady: () => resolve(),
            onStateChange: (e) => {
              if (e.data === 1) cb.current.onStateChange?.(true);
              if (e.data === 2) cb.current.onStateChange?.(false);
              if (e.data === 0) {
                cb.current.onStateChange?.(false);
                cb.current.onEnded?.();
              }
            },
          },
        });
      });
    });
    return () => {
      alive = false;
      try {
        yt.current?.destroy();
      } catch {
        /* нищо */
      }
      yt.current = null;
      host.remove();
    };
  }, [source, controls, ambient]);

  useImperativeHandle(
    ref,
    (): PlayerApi => ({
      async play() {
        if (source.kind === "youtube") {
          await ytReady.current;
          yt.current?.playVideo();
          return true;
        }
        const v = videoRef.current;
        if (!v) return false;
        try {
          await v.play();
          return true;
        } catch {
          return false;
        }
      },
      pause() {
        if (source.kind === "youtube") yt.current?.pauseVideo();
        else videoRef.current?.pause();
      },
      seek(sec: number) {
        if (source.kind === "youtube") yt.current?.seekTo(sec, true);
        else if (videoRef.current) videoRef.current.currentTime = sec;
      },
      time() {
        if (source.kind === "youtube") return yt.current?.getCurrentTime?.() ?? 0;
        return videoRef.current?.currentTime ?? 0;
      },
      playing() {
        if (source.kind === "youtube") return yt.current?.getPlayerState?.() === 1;
        const v = videoRef.current;
        return !!v && !v.paused && !v.ended;
      },
      setMuted(m: boolean) {
        if (source.kind === "youtube") {
          if (m) yt.current?.mute();
          else yt.current?.unMute();
        } else if (videoRef.current) {
          videoRef.current.muted = m;
        }
      },
      muted() {
        if (source.kind === "youtube") return yt.current?.isMuted?.() ?? true;
        return videoRef.current?.muted ?? true;
      },
    }),
    [source],
  );

  if (source.kind === "youtube") {
    return <div ref={ytHost} className="k-yt" title={title} />;
  }
  return (
    <video
      ref={videoRef}
      src={source.kind === "mp4" ? source.src : undefined}
      playsInline
      preload={ambient ? "auto" : "metadata"}
      controls={controls}
      muted={ambient}
      autoPlay={ambient}
      loop={ambient}
      controlsList="nodownload noplaybackrate"
      disablePictureInPicture={!controls}
      aria-label={title}
      onPlay={() => cb.current.onStateChange?.(true)}
      onPause={() => cb.current.onStateChange?.(false)}
      onEnded={() => cb.current.onEnded?.()}
    />
  );
});
