"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function CursorField() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mouse = state.mouse;
    const camera = state.camera;

    const vec = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vec.unproject(camera);

    if (meshRef.current) {
      meshRef.current.position.lerp(vec, 0.15);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}
