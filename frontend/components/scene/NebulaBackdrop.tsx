"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type NebulaBackdropProps = {
  radius?: number;
  intensity?: number;
};

const VERT = /* glsl */ `
varying vec3 vDir;

void main() {
  // Sphere centered at origin: normalized position approximates direction.
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uIntensity;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;

varying vec3 vDir;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.55;
  }
  return v;
}

void main() {
  // Spherical mapping (stable, cheap)
  vec3 d = normalize(vDir);
  float pi = 3.14159265359;
  vec2 st = vec2(atan(d.z, d.x) / (2.0 * pi) + 0.5, asin(d.y) / pi + 0.5);

  float t = uTime * 0.015;
  vec2 q = st * 3.2;
  // Domain warp
  vec2 w = vec2(fbm(q + vec2(0.0, t)), fbm(q + vec2(4.0, -t)));
  float n = fbm(q + 1.8 * w + vec2(t, -t));

  // Contrast curve (nebula pockets)
  float cloud = smoothstep(0.35, 0.85, n);
  float veil = smoothstep(0.0, 1.0, fbm(q * 0.6 + vec2(-t, t)));

  // Subtle anisotropic “cosmic” streaking
  float streak = fbm(vec2(st.x * 10.0, st.y * 2.0) + vec2(t * 2.0, 0.0));
  streak = smoothstep(0.55, 0.9, streak) * 0.25;

  vec3 col = mix(uA, uB, cloud);
  col = mix(col, uC, veil * 0.55);
  col += vec3(0.15, 0.25, 0.45) * streak;

  // Darken toward “deep space”, keep subtle atmosphere
  float horizon = smoothstep(-0.2, 0.75, d.y);
  float alpha = (cloud * 0.55 + veil * 0.25 + streak) * uIntensity;
  alpha *= mix(0.55, 1.0, horizon);

  // Pre-multiplied-like output (helps additive blending look smooth)
  vec3 outCol = col * alpha;
  gl_FragColor = vec4(outCol, alpha);
}
`;

export function NebulaBackdrop({ radius = 520, intensity = 0.55 }: NebulaBackdropProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uA: { value: new THREE.Color("#06112a") },
        uB: { value: new THREE.Color("#2a1b5e") },
        uC: { value: new THREE.Color("#1f67ff") },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    return m;
  }, [intensity]);

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh frustumCulled={false}>
      <sphereGeometry args={[radius, 48, 48]} />
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}

