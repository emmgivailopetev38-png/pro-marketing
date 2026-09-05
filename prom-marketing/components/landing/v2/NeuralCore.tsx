"use client";
/* =====================================================================
   NeuralCore — the "2050" signature centerpiece.
   A slowly rotating sphere of glowing nodes (Fibonacci distribution)
   wired by faint synaptic lines, breathing, with a soft cursor parallax.

   Как се появява (преработено на 05.09.2026, защото „ядрото се бъгваше
   в началото"):

   1. ЛЕКАТА РЕШЕТКА (SVG) се рисува ВИНАГИ и се рендира и на сървъра —
      тоест е в първия HTML, преди какъвто и да е JavaScript. Без three.js:
      двете сметки на цвят са десет реда собствен код. Дотук телефонът
      сваляше 233 KB three, за да нарисува SVG, а ядрото се появяваше чак
      след хидратацията и изтеглянето на чънка — виждаше се как „изскача".

   2. На настолен браузър (fine pointer, > 820px), когато ядрото е в кадър,
      се тегли `NeuralCoreGL` (three + fiber) и след ПЪРВИЯ му нарисуван
      кадър canvas-ът се появява с кросфейд върху SVG-то, което после спира
      да се анимира. Дотук `lite` тръгваше от `true`, ефектът сменяше SVG →
      празно → WebGL в две резки стъпки, а render loop-ът стоеше на `never`,
      докато IntersectionObserver не се обади — сферата стоеше замръзнала.

   3. Дали сме на телефон се чете синхронно (`useSyncExternalStore` върху
      matchMedia), не с ефект след първото рендиране — така няма междинно
      състояние, което да се вижда.

   Респектира prefers-reduced-motion: статична решетка, без rAF, без WebGL.
   ===================================================================== */
import dynamic from "next/dynamic";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export interface NeuralCoreProps {
  /** Node count on the sphere. More = denser brain. Default 220. */
  nodeCount?: number;
  /** Sphere radius in world units. Default 1.3. */
  radius?: number;
  /** Inner accent (poles lerp from this). Default electric cyan. */
  colorA?: string;
  /** Outer accent (poles lerp toward this). Default violet. */
  colorB?: string;
  /** Synapse line color. Default a cyan-blue. */
  lineColor?: string;
  /** Base auto-rotation speed (rad/frame-ish). Default 1. */
  spin?: number;
  /** Extra className on the wrapping <div>. */
  className?: string;
}

const NeuralCoreGL = dynamic(() => import("./NeuralCoreGL").then((m) => m.NeuralCoreGL), {
  ssr: false,
  loading: () => null,
});

/* ---- Телефон/тъч → само леката решетка. Чете се синхронно. -------------- */
const LITE_QUERY = "(max-width: 820px), (pointer: coarse)";
function subscribeLite(cb: () => void): () => void {
  const mq = window.matchMedia(LITE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getLite = () => window.matchMedia(LITE_QUERY).matches;
// Сървърът не знае устройството: рисува леката решетка. Тя е и подложката,
// върху която настолният браузър после кросфейдва WebGL-а — нищо не мига.
const getLiteServer = () => true;

/* ---- Цвят без three ------------------------------------------------------ */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerpHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

interface LiteNode { sx: number; sy: number; z: number; color: string }
interface LiteLine { x1: number; y1: number; x2: number; y2: number; o: number }

/**
 * Fibonacci сфера, проектирана в 100×100 SVG. Детерминистична — затова може
 * да се рендира на сървъра и да съвпадне 1:1 при хидратацията.
 * По-рядка от WebGL версията: телефонът рисува всяка окръжност наново при
 * всяко завъртане, а 84 възела изглеждат като 240 при този размер.
 */
/**
 * Закръгляне до 4 знака. Сървърът (Node) и браузърът смятат sin/cos/sqrt с
 * разлика в последния бит — без закръгляне React се оплаква при хидратацията,
 * че `strokeOpacity="0.03675842501499336"` не е 0.036758425014993386.
 * За SVG в кутия 100×100 четвъртият знак е под една хилядна от пиксела.
 */
const r4 = (v: number) => Math.round(v * 10_000) / 10_000;

function buildLiteGeometry(nodeCount: number, colorA: string, colorB: string) {
  const N = Math.min(Math.max(Math.round(nodeCount * 0.4), 56), 84);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const R = 43;
  const raw: { x: number; y: number; z: number }[] = [];
  const nodes: LiteNode[] = [];
  for (let i = 0; i < N; i++) {
    const y = r4(1 - (i / (N - 1)) * 2);
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const t = golden * i;
    const x = r4(Math.cos(t) * rr);
    const z = r4(Math.sin(t) * rr);
    raw.push({ x, y, z });
    nodes.push({ sx: r4(50 + x * R), sy: r4(50 - y * R), z, color: lerpHex(colorA, colorB, (y + 1) / 2) });
  }
  const lines: LiteLine[] = [];
  const thr = 0.22;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const dx = raw[i].x - raw[j].x;
      const dy = raw[i].y - raw[j].y;
      const dz = raw[i].z - raw[j].z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < thr) {
        const front = (raw[i].z + raw[j].z) / 2;
        lines.push({
          x1: nodes[i].sx, y1: nodes[i].sy, x2: nodes[j].sx, y2: nodes[j].sy,
          o: r4(0.18 * (1 - d2 / thr) * (0.4 + 0.6 * ((front + 1) / 2))),
        });
      }
    }
  }
  const order = nodes.map((n, idx) => ({ n, idx })).sort((a, b) => a.n.z - b.n.z);
  return { lines, order };
}

function LiteLattice({
  uid,
  geo,
  colorA,
  colorB,
  lineColor,
  animate,
}: {
  uid: string;
  geo: ReturnType<typeof buildLiteGeometry>;
  colorA: string;
  colorB: string;
  lineColor: string;
  animate: boolean;
}) {
  return (
    <>
      <style>{`
        @keyframes ncAlive_${uid} {
          0%   { transform: rotate(0deg)   scale(0.99); }
          50%  { transform: rotate(180deg) scale(1.025); }
          100% { transform: rotate(360deg) scale(0.99); }
        }
        @keyframes ncFire_${uid} {
          0%, 68%, 100% { opacity: 0.3; }
          14%           { opacity: 1; }
        }
        @keyframes ncSyn_${uid} {
          0%, 72%, 100% { stroke-opacity: 0.05; }
          22%           { stroke-opacity: 0.85; }
        }
      `}</style>
      {/* Сиянието е ОТДЕЛЕН статичен слой. Дотук беше `filter: drop-shadow` върху
          самия SVG — а той се върти, тоест браузърът преизчисляваше размазването
          на всеки кадър. На телефон това беше половината от цената на ядрото. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[14%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${colorA}66 0%, ${colorB}40 38%, transparent 70%)`,
          filter: "blur(18px)",
          transform: "translateZ(0)",
        }}
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="relative h-full w-full overflow-visible"
        style={{
          transformOrigin: "center",
          willChange: animate ? "transform" : undefined,
          animation: animate ? `ncAlive_${uid} 22s ease-in-out infinite` : undefined,
        }}
      >
        <defs>
          <radialGradient id={`ncGlow_${uid}`} cx="50%" cy="46%" r="56%">
            <stop offset="0%" stopColor={colorA} stopOpacity="0.5" />
            <stop offset="36%" stopColor={colorB} stopOpacity="0.24" />
            <stop offset="100%" stopColor={colorB} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="50" cy="48" r="43" fill={`url(#ncGlow_${uid})`} />

        {/* synapse lines — светят само някои, иначе телефонът анимира стотици елементи */}
        <g stroke={lineColor} strokeLinecap="round">
          {geo.lines.map((l, i) => {
            const fires = animate && i % 12 === 0;
            return (
              <line
                key={i}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                strokeWidth="0.25"
                strokeOpacity={l.o}
                style={fires ? { animation: `ncSyn_${uid} ${3 + (i % 5) * 0.6}s ease-in-out ${(i % 9) * 0.5}s infinite` } : undefined}
              />
            );
          })}
        </g>

        {/* nodes painted back → front (front = larger, brighter, with a sheen) */}
        {geo.order.map(({ n, idx }, oi) => {
          const depth = (n.z + 1) / 2;
          const r = r4(0.55 + depth * 1.5);
          const fires = animate && oi % 6 === 0 && depth > 0.35;
          return (
            <g key={idx} opacity={r4(0.34 + depth * 0.66)}>
              <circle
                cx={n.sx}
                cy={n.sy}
                r={r}
                fill={n.color}
                style={fires ? { animation: `ncFire_${uid} ${2.6 + (oi % 6) * 0.5}s ease-in-out ${(oi % 11) * 0.4}s infinite` } : undefined}
              />
              {depth > 0.5 && <circle cx={r4(n.sx - r * 0.28)} cy={r4(n.sy - r * 0.28)} r={r4(r * 0.42)} fill="#ffffff" opacity={0.9} />}
            </g>
          );
        })}
      </svg>
    </>
  );
}

export function NeuralCore({
  nodeCount = 220,
  radius = 1.3,
  colorA = "#22d3ee",
  colorB = "#7c3aed",
  lineColor = "#3b82f6",
  spin = 1,
  className,
}: NeuralCoreProps) {
  const lite = useSyncExternalStore(subscribeLite, getLite, getLiteServer);
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");

  // В кадър ли е — за WebGL loop-а. Тръгва от `true`: героят е на екрана при
  // зареждане, а IntersectionObserver-ът само го спира, когато се скролне.
  const [inView, setInView] = useState(true);
  // WebGL се монтира чак когда ядрото е било в кадър поне веднъж — под
  // сгъвката three не се тегли за сфера, до която никой не е стигнал.
  // Много стар браузър без IntersectionObserver → монтираме направо.
  const [everInView, setEverInView] = useState(
    () => typeof window !== "undefined" && typeof IntersectionObserver === "undefined"
  );
  const [glReady, setGlReady] = useState(false);

  const liteGeo = useMemo(() => buildLiteGeometry(nodeCount, colorA, colorB), [nodeCount, colorA, colorB]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting) setEverInView(true);
      },
      { rootMargin: "120px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const wantGL = !lite && !reduced;

  return (
    <div
      ref={wrapRef}
      className={`absolute inset-0 ${className ?? ""}`}
      aria-hidden
      style={{ contain: "layout paint" }}
    >
      {/* Леката решетка: винаги в HTML-а. Щом WebGL нарисува кадър — избледнява
          и спира да се анимира (visibility: hidden спира CSS анимациите). */}
      <div
        className="absolute inset-0"
        style={{
          opacity: glReady ? 0 : 1,
          visibility: glReady ? "hidden" : "visible",
          transition: "opacity 700ms ease, visibility 0s linear 700ms",
        }}
      >
        <LiteLattice uid={uid} geo={liteGeo} colorA={colorA} colorB={colorB} lineColor={lineColor} animate={!reduced && !glReady} />
      </div>

      {wantGL && everInView && (
        <div
          className="absolute inset-0"
          style={{ opacity: glReady ? 1 : 0, transition: "opacity 700ms ease" }}
        >
          <NeuralCoreGL
            nodeCount={nodeCount}
            radius={radius}
            colorA={colorA}
            colorB={colorB}
            lineColor={lineColor}
            spin={spin}
            animate={inView}
            onReady={() => setGlReady(true)}
          />
        </div>
      )}
    </div>
  );
}
