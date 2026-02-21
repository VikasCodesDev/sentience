"use client";

import React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function CoreInteraction({
  targetRef,
}: {
  targetRef: React.RefObject<THREE.Object3D | null>;
}) {
  const { mouse } = useThree();
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!targetRef.current || !glowRef.current) return;

    const t = clock.getElapsedTime();

    const intensity = 1 - Math.min(1, Math.hypot(mouse.x, mouse.y));

    const scale = 1.2 + intensity * 0.6 + Math.sin(t * 2) * 0.05;
    glowRef.current.scale.setScalar(scale);

    (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.08 + intensity * 0.25;
  });

  return (
    <mesh ref={glowRef}>
      <sphereGeometry args={[3.8, 64, 64]} />
      <meshBasicMaterial
        color="#59e1ff"
        transparent
        opacity={0.12}
        side={THREE.BackSide}
      />
    </mesh>
  );
}
