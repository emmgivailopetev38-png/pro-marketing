"use client";
// „Полетът" — разговорът като коридор в дълбочина.
// Дълбочината е времето, височината е добро/лошо, цветът е зоната.
// Чист CSS 3D + rAF, като Командната палуба. Уважава reduced-motion
// и спира, щом табът се скрие.

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Brain } from "lucide-react";
import { STAGES, type TimeZone } from "./data";

const ZONE: Record<TimeZone, { color: string; glow: string; x: number; y: number; label: string }> = {
  now: { color: "#94a3b8", glow: "rgba(148,163,184,0.55)", x: 0, y: 0, label: "ГАДНО СЕГА" },
  past: { color: "#f59e0b", glow: "rgba(245,158,11,0.55)", x: -230, y: 70, label: "ГАДНО МИНАЛО" },
  goodFuture: { color: "#22d3ee", glow: "rgba(34,211,238,0.55)", x: 210, y: -130, label: "ХУБАВО БЪДЕЩЕ" },
  badFuture: { color: "#f43f5e", glow: "rgba(244,63,94,0.55)", x: 210, y: 140, label: "ГАДНО БЪДЕЩЕ" },
  decision: { color: "#a855f7", glow: "rgba(168,85,247,0.55)", x: 0, y: -10, label: "РЕШЕНИЕТО" },
};

const GAP = 460; // разстояние между два етапа по Z

/** Фино разместване по етап — иначе плочите в една зона се застъпват. */
const NUDGE: Record<string, { x: number; y: number }> = {
  "00": { x: -140, y: 130 },
  "01": { x: 0, y: 0 },
  "02": { x: 90, y: -30 },
  "03": { x: 40, y: 0 },
  "04": { x: -70, y: 40 },
  "05": { x: -60, y: 0 },
  "06": { x: -60, y: 0 },
  "07": { x: 0, y: 0 },
  "08": { x: 80, y: -40 },
  "09": { x: 30, y: 40 },
};

/** Едно изречение на етап — това, което трябва да излезе на глас. */
const KEY_LINE: Record<string, string> = {
  "00": "Влизам с три факта и нула от тях на масата.",
  "01": "Какво предизвика интереса ти?",
  "02": "Кои неща минават задължително през твоите ръце?",
  "03": "Тоест [X] часа по [Y] лева — правилна ли е сметката?",
  "04": "Какво смяташ, че правиш, което води до това? …и мълчиш.",
  "05": "Ако утре е решено — какво точно се случва без теб?",
  "06": "Колко възможно е да го постигнеш, ако нищо не се промени?",
  "07": "Нека обобщя, за да съм сигурен, че съм те разбрал.",
  "08": "Това, което правим, е да поемем точно тази работа.",
  "09": "Инвестицията е [сума]. …и млъкваш.",
};

export function Flight({
  active,
  onPick,
}: {
  active: number;
  onPick: (index: number) => void;
}) {
  const worldRef = useRef<HTMLDivElement>(null);
  const plateRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const zRef = useRef(0);
  const targetRef = useRef(0);
  const rotRef = useRef(0);
  const rotTargetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const reduceRef = useRef(false);
  const firstRef = useRef(true);
  const [ready, setReady] = useState(false);

  const apply = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    world.style.transform = `translateZ(${zRef.current}px) rotateY(${rotRef.current}deg)`;
    const camIndex = zRef.current / GAP;
    plateRefs.current.forEach((el, i) => {
      if (!el) return;
      const rel = i - camIndex; // < 0 = вече е минат, зад камерата
      const d = Math.abs(rel);
      const op =
        rel < 0
          ? Math.max(0, 1 - d * 1.05) // миналото изчезва, иначе се застъпва
          : Math.max(0.05, 1 - d * 0.44);
      el.style.opacity = String(op);
      el.style.filter = d > 1.2 ? `blur(${Math.min(5, (d - 1.2) * 2.6)}px)` : "none";
      el.style.pointerEvents = op < 0.18 ? "none" : "auto";
      el.style.zIndex = String(200 - Math.round(d * 12));
    });
  }, []);

  const tick = useCallback(() => {
    const dz = targetRef.current - zRef.current;
    const dr = rotTargetRef.current - rotRef.current;
    if (Math.abs(dz) < 0.4 && Math.abs(dr) < 0.05) {
      zRef.current = targetRef.current;
      rotRef.current = rotTargetRef.current;
      apply();
      rafRef.current = null;
      return;
    }
    zRef.current += dz * 0.11;
    rotRef.current += dr * 0.11;
    apply();
    rafRef.current = requestAnimationFrame(tick);
  }, [apply]);

  const flyTo = useCallback(
    (i: number) => {
      targetRef.current = i * GAP;
      const z = ZONE[STAGES[i].zone];
      rotTargetRef.current = -z.x / 42;
      // Първото позициониране е мигновено: rAF не се вика в скрит таб и
      // сцената щеше да остане на нулата, докато Ивайло не я погледне.
      if (reduceRef.current || firstRef.current || document.hidden) {
        firstRef.current = false;
        zRef.current = targetRef.current;
        rotRef.current = rotTargetRef.current;
        apply();
        return;
      }
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    },
    [apply, tick],
  );

  useEffect(() => {
    reduceRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    apply(); // стилове още на първия рендер, не чакаме кадър
    flyTo(active);
  }, [active, ready, flyTo, apply]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden && rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (!document.hidden && rafRef.current == null) {
        // върнахме се на таба — довърши полета
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null; // БЕЗ това следващият flyTo не пуска нов кадър
      }
    };
  }, [tick]);

  const s = STAGES[active];
  const zone = ZONE[s.zone];

  return (
    <div className="relative">
      {/* ---------- сцената ---------- */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10"
        style={{
          height: 520,
          perspective: "1250px",
          perspectiveOrigin: "50% 44%",
          background:
            "radial-gradient(120% 90% at 50% 40%, rgba(12,14,32,0.2) 0%, #04040c 72%)",
        }}
      >
        {/* под и таван — усещането за коридор */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            height: 260,
            transform: "perspective(700px) rotateX(72deg)",
            transformOrigin: "bottom center",
            backgroundImage:
              "linear-gradient(rgba(124,58,237,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.22) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "linear-gradient(to top, #000 5%, transparent 92%)",
            WebkitMaskImage: "linear-gradient(to top, #000 5%, transparent 92%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: 200,
            transform: "perspective(700px) rotateX(-72deg)",
            transformOrigin: "top center",
            backgroundImage:
              "linear-gradient(rgba(6,182,212,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.14) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "linear-gradient(to bottom, #000 5%, transparent 90%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 5%, transparent 90%)",
          }}
        />

        {/* светлината на текущата зона */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-all duration-700"
          style={{
            background: `radial-gradient(46% 60% at ${50 + zone.x / 26}% ${48 + zone.y / 22}%, ${zone.glow.replace("0.55", "0.20")} 0%, transparent 68%)`,
          }}
        />

        {/* ---------- светът ---------- */}
        <div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            ref={worldRef}
            className="absolute left-1/2 top-1/2"
            style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          >
            {STAGES.map((st, i) => {
              const z = ZONE[st.zone];
              const on = i === active;
              return (
                <button
                  key={st.id}
                  ref={(el) => {
                    plateRefs.current[i] = el;
                  }}
                  onClick={() => onPick(i)}
                  aria-label={`${st.num} ${st.title}`}
                  className="absolute transition-[box-shadow,border-color] duration-300"
                  style={{
                    width: 268,
                    marginLeft: -134,
                    marginTop: -78,
                    transform: `translate3d(${z.x + (NUDGE[st.num]?.x ?? 0)}px, ${z.y + (NUDGE[st.num]?.y ?? 0)}px, ${-i * GAP}px) scale(${on ? 1.08 : 1})`,
                    transformStyle: "preserve-3d",
                    borderRadius: 14,
                    border: `1px solid ${on ? z.color : "rgba(255,255,255,0.12)"}`,
                    background: on
                      ? `linear-gradient(160deg, ${z.color}26, rgba(6,6,18,0.94))`
                      : "rgba(8,8,22,0.86)",
                    boxShadow: on
                      ? `0 0 0 1px ${z.color}55, 0 18px 60px -12px ${z.glow}`
                      : "0 10px 30px -18px rgba(0,0,0,0.9)",
                    padding: "14px 16px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <span
                    className="block font-mono text-[10px] font-bold tracking-[0.18em]"
                    style={{ color: z.color }}
                  >
                    {z.label}
                  </span>
                  <span className="mt-1.5 flex items-baseline gap-2">
                    <span
                      className="font-mono text-2xl font-bold"
                      style={{ color: on ? "#fff" : z.color }}
                    >
                      {st.num}
                    </span>
                    <span
                      className="text-[14px] font-bold"
                      style={{ color: on ? "#fff" : "rgba(245,247,255,0.72)" }}
                    >
                      {st.title}
                    </span>
                  </span>
                  <span
                    className="mt-2 block text-[11.5px] leading-snug"
                    style={{ color: on ? "rgba(245,247,255,0.9)" : "rgba(160,168,192,0.75)" }}
                  >
                    {KEY_LINE[st.num]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------- мисълта на клиента (петият слой) ---------- */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
          <div
            className="mx-auto max-w-2xl rounded-xl border px-4 py-3 backdrop-blur transition-all duration-500"
            style={{
              borderColor: "rgba(240,171,252,0.35)",
              background: "rgba(24,8,32,0.72)",
            }}
          >
            <p className="mb-1 flex items-center gap-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#f0abfc]">
              <Brain className="size-3" /> в главата му точно сега
            </p>
            <p className="text-[13.5px] leading-relaxed text-[#f5d0fe]">{s.themThink}</p>
          </div>
        </div>

        {/* ---------- управление ---------- */}
        <button
          onClick={() => onPick(Math.max(0, active - 1))}
          disabled={active === 0}
          aria-label="Предишен етап"
          className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur transition hover:border-white/40 hover:text-white disabled:opacity-25"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => onPick(Math.min(STAGES.length - 1, active + 1))}
          disabled={active === STAGES.length - 1}
          aria-label="Следващ етап"
          className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur transition hover:border-white/40 hover:text-white disabled:opacity-25"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* ---------- лентата с етапите ---------- */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
        {STAGES.map((st, i) => {
          const z = ZONE[st.zone];
          const on = i === active;
          return (
            <button
              key={st.id}
              onClick={() => onPick(i)}
              className="shrink-0 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] font-bold transition"
              style={{
                borderColor: on ? z.color : "rgba(120,160,220,0.2)",
                background: on ? `${z.color}22` : "transparent",
                color: on ? "#fff" : z.color,
              }}
            >
              {st.num}
            </button>
          );
        })}
        <span className="ml-2 shrink-0 text-[12px] text-[var(--color-text-tertiary)]">
          дълбочината е времето · височината е добро/лошо · цветът е зоната
        </span>
      </div>
    </div>
  );
}
