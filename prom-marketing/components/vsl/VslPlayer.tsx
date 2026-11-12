"use client";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics/track";
import { trackCustom } from "@/lib/meta/pixel-client";
import { fmtTime, type VslChapter } from "@/lib/site/vsl";

export const VSL_VIDEO_ID = "vsl-video";

/** Колко от видеото е изгледано — за да знаем дали хората стигат до края. */
const MARKS = [25, 50, 75, 95] as const;

function send(vsl: string, event: "play" | number) {
  if (event === "play") {
    track("vsl_play", { vsl });
    trackCustom("VslPlay", { vsl });
  } else {
    track("vsl_progress", { vsl, pct: event });
    trackCustom("VslProgress", { vsl, pct: event });
  }
}

/**
 * Вертикалното видео (9:16). Обикновен <video> — без външни плейъри: тръгва
 * веднага и във вградения браузър на Viber/WhatsApp, който е главният вход
 * (Георги праща линка там).
 */
export function VslPlayer({
  vsl,
  src,
  poster,
  endHref,
  endLabel,
}: {
  vsl: string;
  src: string;
  poster: string;
  endHref?: string;
  endLabel?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  // До първото пускане: корицата + един голям бутон (контролите на браузъра
  // в Viber/Android показват само въртележка, докато зареждат).
  const [started, setStarted] = useState(false);
  // Накрая видеото казва „линкът за записване е под видеото“ — даваме го
  // точно там, върху последния кадър.
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let first = true;
    const hit = new Set<number>();
    const onEnded = () => setEnded(true);
    v.addEventListener("ended", onEnded);
    const onPlay = () => {
      setStarted(true);
      setEnded(false);
      if (!first) return;
      first = false;
      send(vsl, "play");
    };
    const onTime = () => {
      if (!v.duration) return;
      const pct = (v.currentTime / v.duration) * 100;
      for (const m of MARKS) {
        if (pct >= m && !hit.has(m)) {
          hit.add(m);
          send(vsl, m);
        }
      }
    };
    v.addEventListener("play", onPlay);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [vsl]);

  return (
    // Ширината следи височината на екрана — видеото да се вижда цяло, без
    // скрол, и на телефон (под заглавието), и на лаптоп.
    <div
      className="relative mx-auto aspect-[9/16] overflow-hidden rounded-[22px] border border-white/10 bg-black shadow-[0_30px_80px_-20px_rgba(250,204,21,0.25)] [--vsl-off:290px] lg:[--vsl-off:120px]"
      style={{ width: "max(240px, min(100%, 440px, calc((100svh - var(--vsl-off)) * 9 / 16)))" }}
    >
      <video
        ref={ref}
        id={VSL_VIDEO_ID}
        className="h-full w-full object-contain"
        src={src}
        poster={poster}
        controls={started}
        playsInline
        preload="metadata"
        controlsList="nodownload"
      />
      {!started && (
        <button
          type="button"
          onClick={() => void ref.current?.play().catch(() => {})}
          className="group absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent pb-[30%]"
          aria-label="Пусни видеото"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-[#facc15] shadow-[0_0_0_10px_rgba(250,204,21,0.25)] transition group-hover:scale-105">
            <span className="ml-1.5 h-0 w-0 border-y-[14px] border-l-[22px] border-y-transparent border-l-[#0b0b0d]" />
          </span>
          <span className="mt-4 text-base font-bold text-white drop-shadow">Пусни видеото · 10 мин</span>
          <span className="mt-1 text-xs text-white/80">🔊 със звук</span>
        </button>
      )}
      {ended && endHref && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-16 pt-24">
          <a
            href={endHref}
            className="rounded-full bg-[#facc15] px-7 py-3.5 text-base font-bold text-[#0b0b0d] shadow-lg transition hover:bg-[#fde047]"
          >
            {endLabel} ↓
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * Главите под видеото — клик прескача натам и пуска видеото. Текущата глава
 * свети, за да знае човекът къде е.
 */
export function VslChapters({ chapters, duration }: { chapters: VslChapter[]; duration: number }) {
  const [now, setNow] = useState(-1);

  useEffect(() => {
    const v = document.getElementById(VSL_VIDEO_ID) as HTMLVideoElement | null;
    if (!v) return;
    const onTime = () => setNow(v.currentTime);
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, []);

  let active = -1;
  if (now >= 0) chapters.forEach((c, i) => {
    if (now >= c.t) active = i;
  });

  function jump(t: number) {
    const v = document.getElementById(VSL_VIDEO_ID) as HTMLVideoElement | null;
    if (!v) return;
    v.currentTime = t;
    void v.play().catch(() => {});
    // На телефон видеото е над главите — връщаме го в кадър.
    const r = v.getBoundingClientRect();
    if (r.bottom < 80 || r.top > window.innerHeight - 80) {
      v.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <ol className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      {chapters.map((c, i) => {
        const end = chapters[i + 1]?.t ?? duration;
        const on = i === active;
        return (
          <li key={c.t}>
            <button
              type="button"
              onClick={() => jump(c.t)}
              className={`flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-white/[0.04] ${
                on ? "bg-[#facc15]/[0.08]" : ""
              }`}
            >
              <span
                className={`w-12 shrink-0 font-mono text-sm tabular-nums ${on ? "text-[#facc15]" : "text-[#8f8f99]"}`}
              >
                {fmtTime(c.t)}
              </span>
              <span className={`flex-1 text-[15px] leading-snug ${on ? "font-semibold text-white" : "text-[#d4d4d8]"}`}>
                {c.label}
              </span>
              <span className="shrink-0 font-mono text-xs text-[#5f5f68]">{Math.max(1, Math.round((end - c.t) / 60))} мин</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Лентата „Запиши си час“ отдолу на телефона — показва се, щом видеото излезе
 * от екрана, и се крие, когато календарът е вече видим.
 */
export function VslStickyCta({ label, target }: { label: string; target: string }) {
  const [videoOut, setVideoOut] = useState(false);
  const [bookingIn, setBookingIn] = useState(false);

  useEffect(() => {
    const v = document.getElementById(VSL_VIDEO_ID);
    const b = document.getElementById(target);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === v) setVideoOut(!e.isIntersecting && e.boundingClientRect.top < 0);
        if (e.target === b) setBookingIn(e.isIntersecting);
      }
    });
    if (v) io.observe(v);
    if (b) io.observe(b);
    return () => io.disconnect();
  }, [target]);

  const show = videoOut && !bookingIn;
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0b0d]/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-300 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <a
        href={`#${target}`}
        tabIndex={show ? 0 : -1}
        className="flex w-full items-center justify-center rounded-full bg-[#facc15] px-6 py-3.5 text-base font-bold text-[#0b0b0d]"
      >
        {label} ↓
      </a>
    </div>
  );
}
