"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function CinematicLights() {
  const keyRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const fillRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Slow orbital motion around the core for “alive” lighting.
    const r1 = 10;
    const r2 = 14;

    if (keyRef.current) {
      keyRef.current.position.set(Math.cos(t * 0.22) * r1, 4 + Math.sin(t * 0.18) * 1.5, Math.sin(t * 0.22) * r1);
      keyRef.current.intensity = 1.6 + Math.sin(t * 0.8) * 0.15;
    }

    if (fillRef.current) {
      fillRef.current.position.set(Math.cos(t * 0.16 + 2.4) * r2, -3 + Math.sin(t * 0.12) * 1.0, Math.sin(t * 0.16 + 2.4) * r2);
      fillRef.current.intensity = 0.55 + Math.sin(t * 0.6 + 1.2) * 0.08;
    }

    if (rimRef.current) {
      rimRef.current.position.set(Math.cos(t * 0.12 - 1.4) * (r2 + 8), 2.5, Math.sin(t * 0.12 - 1.4) * (r2 + 8));
      rimRef.current.intensity = 0.9 + Math.sin(t * 0.5 - 0.7) * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={0.12} />
      <hemisphereLight intensity={0.08} color={"#7aa8ff"} groundColor={"#04040b"} />

      <pointLight
        ref={keyRef}
        intensity={1.6}
        color={"#6aa0ff"}
        distance={55}
        decay={2}
      />
      <pointLight
        ref={fillRef}
        intensity={0.55}
        color={"#7ad7ff"}
        distance={80}
        decay={2}
      />
      <pointLight
        ref={rimRef}
        intensity={0.9}
        color={"#b070ff"}
        distance={120}
        decay={2}
      />
    </>
  );
}

