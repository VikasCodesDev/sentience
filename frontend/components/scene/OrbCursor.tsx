"use client";

import { useEffect, useRef } from "react";

export default function OrbCursor() {
  const orbRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };

    window.addEventListener("mousemove", move);

    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.18;
      pos.current.y += (target.current.y - pos.current.y) * 0.18;

      if (orbRef.current) {
        orbRef.current.style.transform =
          `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={orbRef}
      className="pointer-events-none fixed top-0 left-0 z-[9999]"
      style={{
        width: 36,
        height: 36,
        marginLeft: -18,
        marginTop: -18,
        borderRadius: "50%",

        background:
          "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.95), rgba(120,220,255,0.6) 35%, rgba(0,0,0,0) 70%)",

        backdropFilter: "blur(10px)",

        boxShadow: `
          0 0 25px rgba(120,220,255,0.7),
          0 0 70px rgba(120,220,255,0.3),
          0 0 140px rgba(120,220,255,0.15)
        `,
      }}
    >
      {/* AI Eye */}
      <div
        style={{
          position: "absolute",
          inset: 10,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.6)",
        }}
      />

      {/* Outer halo */}
      <div
        style={{
          position: "absolute",
          inset: -12,
          borderRadius: "50%",
          border: "1px solid rgba(120,220,255,0.25)",
          filter: "blur(1px)",
        }}
      />
    </div>
  );
}
