"use client";

import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense, useMemo } from "react";
import { Vector2 } from "three";

type SentiencePostFXProps = {
  enabled?: boolean;
};

function PostFXContent() {
  const chromaticOffset = useMemo(() => new Vector2(0.0006, 0.0002), []);

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={1.0}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={chromaticOffset}
      />
      <Vignette eskil={false} offset={0.18} darkness={0.78} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.18} />
    </EffectComposer>
  );
}

export function SentiencePostFX({ enabled = true }: SentiencePostFXProps) {
  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <PostFXContent />
    </Suspense>
  );
}

