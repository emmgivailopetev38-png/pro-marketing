"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
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
      <icosahedronGeometry args={[1.4, 5]} />
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

export function ShaderOrb() {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={1.4} color="#06b6d4" />
        <pointLight position={[-3, -2, 2]} intensity={1.2} color="#7c3aed" />
        <Sphere />
      </Canvas>
    </div>
  );
}
