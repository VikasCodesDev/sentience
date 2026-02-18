"use client";

import { Scene } from "./Scene";

export function SceneContainer() {
  return (
    <div className="fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-[#030510]">
      <Scene />
    </div>
  );
}
