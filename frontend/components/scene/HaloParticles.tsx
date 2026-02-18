"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type HaloParticlesProps = {
count?: number;
radius?: number;
thickness?: number;
size?: number;
color?: string;
};

export function HaloParticles({
count = 700,
radius = 3.3,
thickness = 0.55,
size = 0.03,
color = "#7ad7ff",
}: HaloParticlesProps) {
const pointsRef = useRef<THREE.Points>(null);
const baseDataRef = useRef<{
baseAngle: Float32Array;
baseR: Float32Array;
baseY: Float32Array;
speeds: Float32Array;
} | null>(null);

const { positions } = useMemo(() => {
const pos = new Float32Array(count * 3);
const ang = new Float32Array(count);
const r0 = new Float32Array(count);
const y0 = new Float32Array(count);
const spd = new Float32Array(count);

```
for (let i = 0; i < count; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = radius * (0.92 + Math.random() * 0.18);
  const y = (Math.random() - 0.5) * thickness;

  ang[i] = a;
  r0[i] = r;
  y0[i] = y;

  pos[i * 3] = Math.cos(a) * r;
  pos[i * 3 + 1] = y;
  pos[i * 3 + 2] = Math.sin(a) * r;

  spd[i] = 0.4 + Math.random() * 0.9;
}

baseDataRef.current = { baseAngle: ang, baseR: r0, baseY: y0, speeds: spd };
return { positions: pos };
```

}, [count, radius, thickness]);

const geometry = useMemo(() => {
const g = new THREE.BufferGeometry();
g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
return g;
}, [positions]);

useFrame((state) => {
const base = baseDataRef.current;
if (!base) return;

```
const attr = geometry.getAttribute("position");
if (!attr) return;

const p = attr as THREE.BufferAttribute;
const arr = p.array as Float32Array;

const t = state.clock.elapsedTime;
const { baseAngle, baseR, baseY, speeds } = base;

for (let i = 0; i < count; i++) {
  const ix = i * 3;
  const s = speeds[i];

  const a = baseAngle[i] + t * (0.35 * s);
  const r = baseR[i] + Math.sin(t * 0.45 + i * 0.11) * 0.06;
  const y = baseY[i] + Math.sin(t * 0.9 + i * 0.17) * (0.06 + 0.02 * s);

  arr[ix] = Math.cos(a) * r;
  arr[ix + 1] = y;
  arr[ix + 2] = Math.sin(a) * r;
}

p.needsUpdate = true;

if (pointsRef.current) {
  pointsRef.current.rotation.y = t * 0.22;
  pointsRef.current.rotation.x = Math.sin(t * 0.07) * 0.08;
}
```

});

return ( <points ref={pointsRef} geometry={geometry} frustumCulled={false}> <pointsMaterial
     color={color}
     size={size}
     sizeAttenuation
     transparent
     opacity={0.75}
     depthWrite={false}
     blending={THREE.AdditiveBlending}
   /> </points>
);
}
