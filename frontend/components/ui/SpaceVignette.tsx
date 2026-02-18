"use client";

export default function SpaceVignette() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-30"
      style={{
        background:
          "radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.65) 100%)",
      }}
    />
  );
}
