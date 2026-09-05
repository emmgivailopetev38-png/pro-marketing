"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

function Sphere() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    m.rotation.y = state.clock.elapsedTime * 0.18;
    m.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.2;
    const pointer = state.pointer;
    m.position.x = pointer.x * 0.4;
    m.position.y = pointer.y * 0.3;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.4, 4]} />
      <meshPhysicalMaterial
        color="#0e7490"
        roughness={0.15}
        metalness={0.85}
        clearcoat={1}
        clearcoatRoughness={0.1}
        iridescence={1}
        iridescenceIOR={1.6}
        iridescenceThicknessRange={[100, 800]}
        emissive="#7c3aed"
        emissiveIntensity={0.25}
      />
    </mesh>
  );
}

/**
 * Стъклената сфера вляво в героя (само настолен браузър).
 *
 * До 05.09.2026 вървеше на пълен DPR (2× на Retina), с MSAA и без спирачка
 * извън кадър — вторият WebGL контекст в героя, който тежеше повече от
 * самото ядро, а стои на 40% непрозрачност отстрани. DPR таван 1.5, без
 * antialias (материалът е гладък, ръбът не се вижда при тази прозрачност),
 * render loop-ът спи, когато героят е скролнат.
 */
export function ShaderOrb() {
  const reduced = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (reduced) return null;
  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={1.4} color="#06b6d4" />
        <pointLight position={[-3, -2, 2]} intensity={1.2} color="#7c3aed" />
        <Sphere />
      </Canvas>
    </div>
  );
}
