"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import CoreInteraction from "../interaction/CoreInteraction";

export default function AdvancedAICore() {
  const { mouse } = useThree();

  const coreRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 🫀 Breathing pulse
    const pulse = 1 + Math.sin(t * 1.4) * 0.06;
    coreRef.current?.scale.setScalar(pulse);
    shellRef.current?.scale.setScalar(pulse);

    // 🌊 Aura expansion
    if (auraRef.current) {
      const auraScale = 1.2 + Math.sin(t * 0.9) * 0.1;
      auraRef.current.scale.setScalar(auraScale);
    }

    // 🧲 Cursor influence
    const mx = mouse.x * Math.PI * 0.5;
    const my = mouse.y * Math.PI * 0.5;

    if (ring1.current) {
      ring1.current.rotation.x = t * 0.5 + my;
      ring1.current.rotation.y = t * 0.7 + mx;
    }

    if (ring2.current) {
      ring2.current.rotation.z = t * 0.6 + mx;
      ring2.current.rotation.y = t * 0.3 + my;
    }

    // ✨ Particle halo
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.25 + mx * 0.5;
      particlesRef.current.rotation.x = Math.sin(t * 0.3) + my * 0.5;
    }

    // 🌌 Subtle world motion
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.1;
    }
  });

  return (
    <group>
      {/* 🧠 INNER CORE */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.1, 64, 64]} />
        <meshStandardMaterial
          color="#7de2ff"
          emissive="#38cfff"
          emissiveIntensity={3.2}
          roughness={0.25}
          metalness={0.7}
        />
      </mesh>

      {/* 💎 GLASS SHELL */}
      <mesh ref={shellRef}>
        <sphereGeometry args={[1.6, 64, 64]} />
        <meshPhysicalMaterial
          color="#4ccfff"
          transmission={1}
          thickness={0.6}
          roughness={0.05}
          clearcoat={1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 🌌 ENERGY AURA */}
      <mesh ref={auraRef}>
        <sphereGeometry args={[2.6, 64, 64]} />
        <meshBasicMaterial
          color="#39cfff"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
        />
      </mesh>

      {/* 🌀 RING 1 */}
      <mesh ref={ring1}>
        <torusGeometry args={[2.5, 0.07, 32, 200]} />
        <meshBasicMaterial color="#7fe6ff" />
      </mesh>

      {/* 🌀 RING 2 */}
      <mesh ref={ring2} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[3.1, 0.05, 32, 200]} />
        <meshBasicMaterial color="#5fd8ff" />
      </mesh>

      {/* ✨ NEURAL PARTICLE HALO */}
      <points ref={particlesRef}>
        <sphereGeometry args={[4.1, 40, 40]} />
        <pointsMaterial
          color="#7fe6ff"
          size={0.02}
          transparent
          opacity={0.7}
        />
      </points>
      <CoreInteraction targetRef={coreRef} />
    </group>
  );
}
