"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function AmbientNodes() {
  const group = useRef<THREE.Group>(null);

  const nodes = useMemo(() => {
    const arr: {
      position: THREE.Vector3;
      speed: number;
      phase: number;
    }[] = [];

    for (let i = 0; i < 28; i++) {
      const radius = 6 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      arr.push({
        position: new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          (Math.random() - 0.5) * 4,
          radius * Math.sin(phi) * Math.sin(theta)
        ),
        speed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    return arr;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (!group.current) return;

    group.current.children.forEach((child, i) => {
      const data = nodes[i];
      if (!data) return;

      child.position.y =
        data.position.y + Math.sin(t * data.speed + data.phase) * 0.6;

      child.rotation.y += 0.003;
    });
  });

  return (
    <group ref={group}>
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial
            color="#7de2ff"
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
