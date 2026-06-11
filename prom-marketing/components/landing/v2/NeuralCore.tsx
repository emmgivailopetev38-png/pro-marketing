"use client";
/* =====================================================================
   NeuralCore — the "2050" signature centerpiece.
   A slowly rotating sphere of glowing nodes (Fibonacci distribution)
   wired by faint synaptic lines, breathing, with a soft cursor parallax.
   Same DNA as the public/velko core, rebuilt declaratively on
   @react-three/fiber (the stack this project already uses).

   Usage (from any section / hero):
     import { NeuralCore } from "@/components/landing/v2/NeuralCore";
     <div className="relative h-[520px] w-[520px]">
       <NeuralCore />
     </div>
   Props let an agent retune it per placement without forking the file.
   Respects prefers-reduced-motion: renders a calm static frame instead
   of animating (and never mounts the rAF loop).
   ===================================================================== */
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import * as THREE from "three";
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

/* Build the node cloud + the synapse line segments once (memoized). */
function useCoreGeometry(nodeCount: number, radius: number, colorA: string, colorB: string) {
  return useMemo(() => {
    const cA = new THREE.Color(colorA);
    const cB = new THREE.Color(colorB);
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < nodeCount; i++) {
      // Fibonacci sphere — even, organic node spread.
      const y = 1 - (i / (nodeCount - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      positions[i * 3] = x * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = z * radius;

      const c = cA.clone().lerp(cB, (y + 1) / 2);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    // Wire near-neighbours into synapse lines (squared-distance threshold).
    const linePts: number[] = [];
    const threshold = (radius * 0.5) ** 2;
    for (let i = 0; i < nodeCount; i += 2) {
      for (let j = i + 2; j < nodeCount; j += 2) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < threshold) {
          linePts.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2],
          );
        }
      }
    }

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointsGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePts), 3));

    return { pointsGeo, lineGeo };
  }, [nodeCount, radius, colorA, colorB]);
}

/* Soft radial sprite so each node reads as a glowing dot, not a hard pixel. */
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.3, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

function CoreObject({
  nodeCount,
  radius,
  colorA,
  colorB,
  lineColor,
  spin,
  animate,
}: Required<Omit<NeuralCoreProps, "className">> & { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { pointsGeo, lineGeo } = useCoreGeometry(nodeCount, radius, colorA, colorB);
  const sprite = useGlowTexture();

  useFrame((state) => {
    const g = group.current;
    if (!g || !animate) return;
    const t = state.clock.elapsedTime;
    // breathing scale + base auto-rotation
    const breathe = 1 + Math.sin(t * 1.6) * 0.045;
    g.scale.setScalar(breathe);
    g.rotation.y += 0.0038 * spin;
    g.rotation.x += 0.0011 * spin;
    // gentle cursor parallax (pointer is normalised -1..1)
    const px = state.pointer.x;
    const py = state.pointer.y;
    g.rotation.z += (px * 0.25 - g.rotation.z) * 0.04;
    state.camera.position.x += (px * 0.6 - state.camera.position.x) * 0.04;
    state.camera.position.y += (py * 0.6 - state.camera.position.y) * 0.04;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <points geometry={pointsGeo}>
        <pointsMaterial
          size={radius * 0.1}
          map={sprite}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial
          color={lineColor}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
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
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  // Default to the lightweight (no-WebGL) variant until we confirm a capable
  // desktop — mobile/touch NEVER mounts a WebGL context (perf).
  const [lite, setLite] = useState(true);
  const [inView, setInView] = useState(false);
  const uid = useId().replace(/:/g, "");

  // Lite (mobile/touch/reduced) geometry: a Fibonacci sphere of nodes + near-
  // neighbour synapse lines, projected to a 100×100 SVG. Cheap, computed once —
  // renders as a razor-sharp neural lattice instead of a blurry CSS blob.
  const liteGeo = useMemo(() => {
    const N = Math.min(Math.max(Math.round(nodeCount * 0.5), 64), 100);
    const cA = new THREE.Color(colorA);
    const cB = new THREE.Color(colorB);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const R = 43;
    const raw: { x: number; y: number; z: number }[] = [];
    const nodes: { sx: number; sy: number; z: number; color: string }[] = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rr = Math.sqrt(Math.max(0, 1 - y * y));
      const t = golden * i;
      const x = Math.cos(t) * rr;
      const z = Math.sin(t) * rr;
      raw.push({ x, y, z });
      const c = cA.clone().lerp(cB, (y + 1) / 2);
      nodes.push({ sx: 50 + x * R, sy: 50 - y * R, z, color: `#${c.getHexString()}` });
    }
    const lines: { x1: number; y1: number; x2: number; y2: number; o: number }[] = [];
    const thr = 0.2;
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
            o: 0.18 * (1 - d2 / thr) * (0.4 + 0.6 * ((front + 1) / 2)),
          });
        }
      }
    }
    const order = nodes.map((n, idx) => ({ n, idx })).sort((a, b) => a.n.z - b.n.z);
    return { lines, order };
  }, [nodeCount, colorA, colorB]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px), (pointer: coarse)");
    const apply = () => setLite(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Mobile / touch / reduced-motion → crisp SVG neural sphere that's ALIVE:
  // the lattice slowly turns + breathes, neurons fire (staggered opacity) and
  // synapses light up — all cheap CSS keyframes (no WebGL, no rAF; the browser
  // pauses paint while off-screen). Every motion is disabled when `reduced`.
  if (lite || reduced) {
    return (
      <div ref={wrapRef} className={`absolute inset-0 ${className ?? ""}`} aria-hidden>
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
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full overflow-visible"
          style={{
            transformOrigin: "center",
            animation: reduced ? undefined : `ncAlive_${uid} 22s ease-in-out infinite`,
            filter: `drop-shadow(0 0 6px ${colorA}73) drop-shadow(0 0 16px ${colorB}45)`,
          }}
        >
          <defs>
            <radialGradient id={`ncGlow_${uid}`} cx="50%" cy="46%" r="56%">
              <stop offset="0%" stopColor={colorA} stopOpacity="0.5" />
              <stop offset="36%" stopColor={colorB} stopOpacity="0.24" />
              <stop offset="100%" stopColor={colorB} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* volumetric glow behind the lattice */}
          <circle cx="50" cy="48" r="43" fill={`url(#ncGlow_${uid})`} />

          {/* synapse lines */}
          <g stroke={lineColor} strokeLinecap="round">
            {liteGeo.lines.map((l, i) => {
              const fires = !reduced && i % 8 === 0;
              return (
                <line
                  key={i}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  strokeWidth="0.25"
                  strokeOpacity={l.o}
                  style={
                    fires
                      ? { animation: `ncSyn_${uid} ${3 + (i % 5) * 0.6}s ease-in-out ${(i % 9) * 0.5}s infinite` }
                      : undefined
                  }
                />
              );
            })}
          </g>

          {/* nodes painted back → front (front = larger, brighter, with a sheen) */}
          {liteGeo.order.map(({ n, idx }, oi) => {
            const depth = (n.z + 1) / 2;
            const r = 0.55 + depth * 1.5;
            const fires = !reduced && oi % 4 === 0 && depth > 0.35;
            return (
              <g key={idx} opacity={0.34 + depth * 0.66}>
                <circle
                  cx={n.sx}
                  cy={n.sy}
                  r={r}
                  fill={n.color}
                  style={
                    fires
                      ? { animation: `ncFire_${uid} ${2.6 + (oi % 6) * 0.5}s ease-in-out ${(oi % 11) * 0.4}s infinite` }
                      : undefined
                  }
                />
                {depth > 0.5 && (
                  <circle
                    cx={n.sx - r * 0.28}
                    cy={n.sy - r * 0.28}
                    r={r * 0.42}
                    fill="#ffffff"
                    opacity={0.9}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Desktop in-view → WebGL core, PAUSED when scrolled off-screen, capped DPR.
  return (
    <div ref={wrapRef} className={`absolute inset-0 ${className ?? ""}`} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 55 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
      >
        {/* soft fill so the dark side of nodes still glows faintly */}
        <ambientLight intensity={0.6} />
        <CoreObject
          nodeCount={nodeCount}
          radius={radius}
          colorA={colorA}
          colorB={colorB}
          lineColor={lineColor}
          spin={spin}
          animate={inView}
        />
      </Canvas>
    </div>
  );
}
