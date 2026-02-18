"use client";

import dynamic from "next/dynamic";

const DynamicScene = dynamic(
  () => import("./SceneContainer").then((m) => ({ default: m.SceneContainer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-[#030510]">
        <div className="h-10 w-10 animate-pulse rounded-full border-2 border-[#4a7cff]/40 border-t-[#4a7cff]" />
      </div>
    ),
  }
);

export function SceneWrapper() {
  return <DynamicScene />;
}
