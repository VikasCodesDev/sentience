"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const LAYER_CONFIG = [
  { count: 8000, radius: 120, size: 0.08, opacity: 0.9, phase: 0, rotSpeed: 0.0022, tiltSpeed: 0.0009 },
  { count: 5000, radius: 200, size: 0.05, opacity: 0.6, phase: 1.2, rotSpeed: 0.0016, tiltSpeed: 0.0006 },
  { count: 3000, radius: 320, size: 0.03, opacity: 0.35, phase: 2.1, rotSpeed: 0.001, tiltSpeed: 0.0004 },
];

function useStarPositions(
  count: number,
  radius: number
): Float32Array {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.6 + Math.random() * 0.4);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, [count, radius]);
}

function StarLayer({
  count,
  radius,
  size,
  opacity,
  color,
  phase = 0,
  rotSpeed = 0.002,
  tiltSpeed = 0.0008,
}: {
  count: number;
  radius: number;
  size: number;
  opacity: number;
  color: string;
  phase?: number;
  rotSpeed?: number;
  tiltSpeed?: number;
}) {
  const positions = useStarPositions(count, radius);
  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.rotation.y = t * rotSpeed + phase;
      ref.current.rotation.x = Math.sin(t * tiltSpeed + phase) * 0.012;
      ref.current.rotation.z = Math.cos(t * tiltSpeed * 0.7 + phase) * 0.008;
    }
  });

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function StarField() {
  return (
    <group>
      {LAYER_CONFIG.map((layer, i) => (
        <StarLayer
          key={i}
          count={layer.count}
          radius={layer.radius}
          size={layer.size}
          opacity={layer.opacity}
          color={i === 0 ? "#e8f0ff" : i === 1 ? "#b8d4ff" : "#7aa8e8"}
          phase={layer.phase}
          rotSpeed={layer.rotSpeed}
          tiltSpeed={layer.tiltSpeed}
        />
      ))}
    </group>
  );
}
