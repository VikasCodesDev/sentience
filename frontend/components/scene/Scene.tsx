"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { CinematicLights } from "./CinematicLights";
import { NebulaBackdrop } from "./NebulaBackdrop";
import { SentiencePostFX } from "./fx/SentiencePostFX";
import { StarField } from "./StarField";
import AmbientNodes from "./AmbientNodes";

import AdvancedAICore from "./AdvancedAICore";

const FOG_COLOR = "#030510";
const FOG_NEAR = 25;
const FOG_FAR = 200;

function CameraMotion() {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.05) * 0.08;
      group.current.rotation.x = Math.sin(t * 0.04) * 0.04;
      group.current.position.y = Math.sin(t * 0.25) * 0.15;
    }
  });

  return (
    <group ref={group}>
      <NebulaBackdrop radius={520} intensity={0.55} />
      <StarField />
      <AdvancedAICore />
      <CinematicLights />
      <AmbientNodes />

    </group>
  );
}

function Fallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#1a3a6e" wireframe />
    </mesh>
  );
}

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 55, near: 0.1, far: 400 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      frameloop="always"
    >
      <color attach="background" args={[FOG_COLOR]} />
      <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />

      <Suspense fallback={<Fallback />}>
        <CameraMotion />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={8}
        maxDistance={80}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.4}
      />

      <SentiencePostFX />
    </Canvas>
  );
}
