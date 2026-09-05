"use client";
/* =====================================================================
   NeuralCoreGL — WebGL половината на „ядрото" (three + @react-three/fiber).

   Живее в отделен файл нарочно: `NeuralCore.tsx` рисува леката SVG решетка
   без нито един байт от three, а този модул се тегли с динамичен import
   САМО на настолен браузър, когато ядрото е в кадър. До 05.09.2026 и
   телефонът сваляше 233 KB three.js, за да нарисува SVG — защото леката
   решетка ползваше THREE.Color за две сметки на цвят.

   `onReady` се вика след ПЪРВИЯ нарисуван кадър — родителят тогава
   кросфейдва от SVG към canvas-а, вместо да сменя двете рязко.
   ===================================================================== */
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { NeuralCoreProps } from "./NeuralCore";

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

type CoreObjectProps = Required<Omit<NeuralCoreProps, "className">> & {
  animate: boolean;
  onReady?: () => void;
};

function CoreObject({ nodeCount, radius, colorA, colorB, lineColor, spin, animate, onReady }: CoreObjectProps) {
  const group = useRef<THREE.Group>(null);
  const ready = useRef(false);
  const { pointsGeo, lineGeo } = useCoreGeometry(nodeCount, radius, colorA, colorB);
  const sprite = useGlowTexture();

  // Геометрията и текстурата са на GPU-то — да не текат при смяна на пропс.
  useEffect(() => {
    return () => {
      pointsGeo.dispose();
      lineGeo.dispose();
    };
  }, [pointsGeo, lineGeo]);
  useEffect(() => () => sprite.dispose(), [sprite]);

  useFrame((state) => {
    // Първият кадър е нарисуван → родителят може да покаже canvas-а.
    if (!ready.current) {
      ready.current = true;
      onReady?.();
    }
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
        <lineBasicMaterial color={lineColor} transparent opacity={0.22} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
}

export interface NeuralCoreGLProps extends Required<Omit<NeuralCoreProps, "className">> {
  /** Върти се само докато е в кадър — извън него render loop-ът спи. */
  animate: boolean;
  /** След първия кадър. */
  onReady?: () => void;
}

export function NeuralCoreGL({ animate, onReady, ...core }: NeuralCoreGLProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.2], fov: 55 }}
      // Без antialias — точките са спрайтове, линиите са полупрозрачни; MSAA
      // само пали лаптопа. DPR таван 1.5: на Retina 2× е двойно повече
      // пиксели за ефект, който стои под текста при 60% непрозрачност.
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      frameloop={animate ? "always" : "never"}
    >
      <ambientLight intensity={0.6} />
      <CoreObject {...core} animate={animate} onReady={onReady} />
    </Canvas>
  );
}
