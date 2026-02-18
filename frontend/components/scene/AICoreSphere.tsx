"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HaloParticles } from "./HaloParticles";

const CORE_RADIUS = 1.8;

const COLOR_DEEP = "#1a3a6e";
const COLOR_CYAN = "#56e6ff";

const INNER_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;

uniform float uTime;
uniform float uDistort;

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
  vWorldPos = wp;

  float t = uTime * 0.55;
  float n = noise(position * 1.25 + vec3(t, -t * 0.7, t * 0.4));
  float n2 = noise(position * 2.4 + vec3(-t * 0.6, t * 0.35, t));
  float d = (n * 0.7 + n2 * 0.3);

  vec3 displaced = position + normal * (d - 0.5) * uDistort;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const INNER_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uMix;
uniform float uIntensity;
uniform float uPulse;
uniform vec3 uCameraPosition;

varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vec3 col = mix(uColorA, uColorB, uMix);

  // Fresnel-ish glow for "consciousness" energy
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCameraPosition - vWorldPos);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

  float core = 0.65 + 0.35 * uPulse;
  float glow = (0.35 + 0.9 * fres) * uIntensity;

  vec3 outCol = col * (core + glow);
  gl_FragColor = vec4(outCol, 1.0);
}
`;

const RIM_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
  vWorldPos = wp;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const RIM_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uPulse;
uniform vec3 uCameraPosition;
varying vec3 vNormal;
varying vec3 vWorldPos;
void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCameraPosition - vWorldPos);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);
  float a = fres * (0.55 + 0.45 * uPulse);
  vec3 col = uColor * uIntensity * a;
  gl_FragColor = vec4(col, a);
}
`;

export function AICoreSphere() {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const rimRef = useRef<THREE.Mesh>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);

  const colors = useMemo(() => {
    const a = new THREE.Color(COLOR_DEEP);
    const b = new THREE.Color(COLOR_CYAN);
    const tmp = new THREE.Color();
    return { a, b, tmp };
  }, []);

  const innerMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDistort: { value: 0.18 },
        uColorA: { value: new THREE.Color(COLOR_DEEP) },
        uColorB: { value: new THREE.Color(COLOR_CYAN) },
        uMix: { value: 0.0 },
        uIntensity: { value: 2.4 },
        uPulse: { value: 0.0 },
        uCameraPosition: { value: new THREE.Vector3(0, 0, 12) },
      },
      vertexShader: INNER_VERT,
      fragmentShader: INNER_FRAG,
      transparent: false,
      depthWrite: true,
    });
  }, []);

  const rimMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(COLOR_CYAN) },
        uIntensity: { value: 2.2 },
        uPulse: { value: 0.0 },
        uCameraPosition: { value: new THREE.Vector3(0, 0, 12) },
      },
      vertexShader: RIM_VERT,
      fragmentShader: RIM_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.85);
    const breath = 1 + Math.sin(t * 0.45) * 0.05;
    const mix = 0.5 + 0.5 * Math.sin(t * 0.18 + 0.7);

    if (groupRef.current) {
      groupRef.current.scale.setScalar(breath);
      groupRef.current.rotation.y = t * 0.12;
    }

    // Update camera position for shaders
    const camPos = state.camera.position;
    innerMat.uniforms.uCameraPosition.value.set(camPos.x, camPos.y, camPos.z);
    rimMat.uniforms.uCameraPosition.value.set(camPos.x, camPos.y, camPos.z);

    // Inner shader uniforms: time + pulse + color shift
    innerMat.uniforms.uTime.value = t;
    innerMat.uniforms.uPulse.value = pulse;
    innerMat.uniforms.uMix.value = mix;

    // Outer shell (physical): color/emissive drift without allocations
    if (shellRef.current) {
      const mat = shellRef.current.material as THREE.MeshPhysicalMaterial;
      colors.tmp.copy(colors.a).lerp(colors.b, mix);
      mat.color.copy(colors.tmp).multiplyScalar(0.45);
      mat.emissive.copy(colors.tmp);
      mat.emissiveIntensity = 0.35 + pulse * 0.25;
      shellRef.current.rotation.y = -t * 0.08;
    }

    // Rim glow shader pulse + color drift
    rimMat.uniforms.uPulse.value = pulse;
    (rimMat.uniforms.uColor.value as THREE.Color).copy(colors.a).lerp(colors.b, mix);

    // Core light follows the same palette for bloom interaction
    if (coreLightRef.current) {
      colors.tmp.copy(colors.a).lerp(colors.b, mix);
      coreLightRef.current.color.copy(colors.tmp);
      coreLightRef.current.intensity = 1.1 + pulse * 1.0;
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight
        ref={coreLightRef}
        position={[0, 0, 0]}
        intensity={2.0}
        color={COLOR_CYAN}
        distance={34}
        decay={2}
      />

      {/* Inner glowing energy sphere (shader distortion + bloom-friendly brightness) */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[CORE_RADIUS * 0.78, 96, 96]} />
        <primitive object={innerMat} attach="material" />
      </mesh>

      {/* Outer translucent shell (rim-lit physical layer) */}
      <mesh ref={shellRef}>
        <sphereGeometry args={[CORE_RADIUS, 64, 64]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.22}
          transmission={0.85}
          thickness={0.45}
          ior={1.18}
          roughness={0.25}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.25}
          emissive={COLOR_DEEP}
          emissiveIntensity={0.45}
        />
      </mesh>

      {/* Rim glow shell (fresnel halo for cinematic bloom) */}
      <mesh ref={rimRef} frustumCulled={false}>
        <sphereGeometry args={[CORE_RADIUS * 1.18, 48, 48]} />
        <primitive object={rimMat} attach="material" />
      </mesh>

      {/* Orbiting halo particles */}
      <HaloParticles radius={CORE_RADIUS * 1.85} thickness={0.6} size={0.03} />
    </group>
  );
}
