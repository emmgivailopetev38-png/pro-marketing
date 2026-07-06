"use client";
// Command Deck — a floating 3D carousel of the CRM's boards ("табла").
// The boards drift in space; rotate with drag / wheel / arrow keys / buttons.
// Click a side board → it flies to the front. Click the front board → it
// launches forward and navigates to that route. Pure CSS 3D + rAF; respects
// reduced-motion and pauses when the tab is hidden.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Target, Calendar, FileSignature, Briefcase, Receipt, BarChart3,
  Repeat, Inbox, LineChart, Bot, Clapperboard, Lightbulb, Satellite,
  ArrowLeft, ArrowRight, CornerDownLeft, type LucideIcon,
} from "lucide-react";

export type DeckBoard = {
  key: string;
  href: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
  code: string;
  stat?: { value: string; label: string } | null;
};

const ICONS: Record<string, LucideIcon> = {
  Users, Target, Calendar, FileSignature, Briefcase, Receipt, BarChart3,
  Repeat, Inbox, LineChart, Bot, Clapperboard, Lightbulb, Satellite,
};

export function CommandDeck({ boards }: { boards: DeckBoard[] }) {
  const router = useRouter();
  const N = boards.length;
  const step = 360 / N;

  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const rotationRef = useRef(0);
  const targetRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const pausedRef = useRef(false);
  const launchingRef = useRef(false);
  const launchIdxRef = useRef(-1);
  const activeRef = useRef(0);
  const radiusRef = useRef(460);
  const reduceRef = useRef(false);

  const [active, setActive] = useState(0);
  const [launching, setLaunching] = useState<string | null>(null);

  // Responsive cylinder radius (pull boards closer on small screens).
  const computeRadius = useCallback(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1280;
    if (w < 520) return 360;
    if (w < 900) return 430;
    if (w < 1280) return 480;
    return 520;
  }, []);

  const applyTransforms = useCallback(() => {
    const rot = rotationRef.current;
    const R = radiusRef.current;
    if (ringRef.current) {
      ringRef.current.style.transform = `translateZ(-${R}px) rotateY(${rot}deg)`;
    }
    let best = 0;
    let bestAbs = Infinity;
    for (let i = 0; i < N; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      let a = (i * step + rot) % 360;
      if (a > 180) a -= 360;
      if (a < -180) a += 360;
      const abs = Math.abs(a);
      if (abs < bestAbs) {
        bestAbs = abs;
        best = i;
      }
      // The launching card is driven by its CSS keyframe — leave it alone.
      if (launchingRef.current && i === launchIdxRef.current) continue;
      const t = abs / 180; // 0 = front, 1 = directly behind
      el.style.setProperty("--r", `${R}px`);
      el.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`;
      el.style.opacity = String(Math.max(0.04, 1 - t * 1.5));
      el.style.filter = `blur(${(t * t * 4).toFixed(2)}px) brightness(${(1 - t * 0.5).toFixed(2)})`;
      el.style.zIndex = String(1000 - Math.round(abs));
      el.style.pointerEvents = abs < 82 ? "auto" : "none";
      const isFront = abs < step / 2;
      if (isFront) el.setAttribute("data-front", "true");
      else el.removeAttribute("data-front");
    }
    if (best !== activeRef.current) {
      activeRef.current = best;
      setActive(best);
    }
  }, [N, step]);

  // Snap target: nearest rotation that puts some card dead-front (multiple of step).
  const snap = useCallback(() => {
    targetRef.current = Math.round(rotationRef.current / step) * step;
  }, [step]);

  const goto = useCallback(
    (dir: number) => {
      const grid = Math.round(rotationRef.current / step);
      targetRef.current = (grid + dir) * step;
    },
    [step]
  );

  const frontFor = useCallback(
    (i: number) => {
      const base = -i * step;
      const k = Math.round((rotationRef.current - base) / 360);
      targetRef.current = base + k * 360;
    },
    [step]
  );

  const launch = useCallback(
    (i: number) => {
      if (launchingRef.current) return;
      const el = cardRefs.current[i];
      // start the flight from wherever the board is sitting right now
      if (el) el.style.setProperty("--r", `${radiusRef.current}px`);
      launchingRef.current = true;
      launchIdxRef.current = i;
      setLaunching(boards[i].href);
      window.setTimeout(() => router.push(boards[i].href), 560);
    },
    [router, boards]
  );

  // Main loop — drives ring rotation (drift / snap-tween / drag).
  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    radiusRef.current = computeRadius();
    const DRIFT = reduceRef.current ? 0 : 0.045;
    let raf = 0;

    const frame = () => {
      if (!launchingRef.current) {
        if (draggingRef.current) {
          // rotation set live by pointermove
        } else if (targetRef.current !== null) {
          const d = targetRef.current - rotationRef.current;
          if (Math.abs(d) < 0.05) {
            rotationRef.current = targetRef.current;
            targetRef.current = null;
          } else {
            rotationRef.current += d * 0.12;
          }
        } else if (!pausedRef.current) {
          rotationRef.current += DRIFT;
        }
      }
      applyTransforms();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      radiusRef.current = computeRadius();
      applyTransforms();
    };
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(frame);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [applyTransforms, computeRadius]);

  // Wheel → step through boards (throttled).
  const wheelAt = useRef(0);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = e.timeStamp;
      if (now - wheelAt.current < 260) return;
      wheelAt.current = now;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      goto(d > 0 ? -1 : 1);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [goto]);

  // Pointer drag → free rotate, snap on release.
  const drag = useRef({ x: 0, rot: 0, moved: 0 });
  const onPointerDown = (e: React.PointerEvent) => {
    if (launchingRef.current) return;
    draggingRef.current = true;
    targetRef.current = null;
    drag.current = { x: e.clientX, rot: rotationRef.current, moved: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - drag.current.x;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    rotationRef.current = drag.current.rot + dx * 0.28;
  };
  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    snap();
  };

  const onCardClick = (i: number) => {
    if (drag.current.moved > 6) return; // was a drag, not a tap
    if (i === activeRef.current) launch(i);
    else frontFor(i);
  };

  // Keyboard navigation.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { goto(1); e.preventDefault(); }
    else if (e.key === "ArrowRight") { goto(-1); e.preventDefault(); }
    else if (e.key === "Enter" || e.key === " ") { launch(activeRef.current); e.preventDefault(); }
  };

  const activeBoard = boards[active];

  return (
    <div className="deck-wrap">
      <div
        ref={stageRef}
        className="deck-stage"
        role="listbox"
        aria-label="Командна палуба — табла"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        onFocus={() => { pausedRef.current = true; }}
        onBlur={() => { pausedRef.current = false; }}
      >
        {/* central core placeholder — becomes the Brain on day 2 */}
        <div className="deck-core" aria-hidden>
          <span className="deck-core-orb" />
          <span className="deck-core-ring deck-core-ring-1" />
          <span className="deck-core-ring deck-core-ring-2" />
        </div>

        <div ref={ringRef} className="deck-ring">
          {boards.map((b, i) => {
            const Icon = ICONS[b.icon] ?? Users;
            const isLaunching = launching === b.href;
            return (
              <button
                key={b.key}
                ref={(el) => { cardRefs.current[i] = el; }}
                type="button"
                role="option"
                aria-selected={i === active}
                className={`deck-card${isLaunching ? " deck-card-launch" : ""}`}
                style={{
                  transform: `rotateY(${i * step}deg) translateZ(${radiusRef.current}px)`,
                  ["--bc" as string]: b.color,
                  ["--a" as string]: `${i * step}deg`,
                  ["--r" as string]: `${radiusRef.current}px`,
                }}
                onClick={() => onCardClick(i)}
              >
                <span className="deck-card-code">{b.code}</span>
                <span className="deck-card-ico"><Icon className="h-7 w-7" strokeWidth={1.6} /></span>
                <span className="deck-card-title">{b.label}</span>
                <span className="deck-card-desc">{b.desc}</span>
                {b.stat && (
                  <span className="deck-card-stat">
                    <b>{b.stat.value}</b> {b.stat.label}
                  </span>
                )}
                <span className="deck-card-cta">
                  {i === active ? <>Отвори <CornerDownLeft className="h-3 w-3" /></> : "избери"}
                </span>
                <span className="deck-card-shine" aria-hidden />
              </button>
            );
          })}
        </div>

        {launching && <div className="deck-flash" aria-hidden />}
      </div>

      {/* Caption + controls */}
      <div className="deck-hud">
        <button type="button" className="deck-nav" aria-label="Предишно табло" onClick={() => goto(1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="deck-caption">
          <p className="deck-caption-code" style={{ color: activeBoard?.color }}>{activeBoard?.code}</p>
          <p className="deck-caption-title">{activeBoard?.label}</p>
          <p className="deck-caption-desc">{activeBoard?.desc}</p>
        </div>
        <button type="button" className="deck-nav" aria-label="Следващо табло" onClick={() => goto(-1)}>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      <div className="deck-dots">
        {boards.map((b, i) => (
          <button
            key={b.key}
            type="button"
            aria-label={b.label}
            className={`deck-dot${i === active ? " is-active" : ""}`}
            style={{ ["--bc" as string]: b.color }}
            onClick={() => frontFor(i)}
          />
        ))}
      </div>

      <p className="deck-hint">
        завърти с влачене · колелце · ← → · клик върху предното табло за отваряне
      </p>
    </div>
  );
}
