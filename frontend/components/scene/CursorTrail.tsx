"use client";

import { useEffect, useRef } from "react";

export default function CursorTrail() {
  const lastPos  = useRef({ x: 0, y: 0 });
  const lastTime = useRef(performance.now());
  const velRef   = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt  = Math.max(now - lastTime.current, 1);

      velRef.current = {
        x: (e.clientX - lastPos.current.x) / dt,
        y: (e.clientY - lastPos.current.y) / dt,
      };
      const speed = Math.hypot(velRef.current.x, velRef.current.y);

      lastPos.current  = { x: e.clientX, y: e.clientY };
      lastTime.current = now;

      // Throttle: only spawn if moving
      if (speed < 0.04) return;

      // Count scales with speed, capped
      const count = Math.min(Math.ceil(speed * 2.5), 4);
      for (let i = 0; i < count; i++) spawn(e.clientX, e.clientY, speed);
    };

    function spawn(x: number, y: number, speed: number) {
      const size     = Math.max(2, Math.min(5, speed * 6));
      const spread   = size * 1.8;
      const duration = 350 + Math.random() * 250;

      // Slight offset so particles feel like they peel off the orb
      const ox = x + (Math.random() - 0.5) * spread;
      const oy = y + (Math.random() - 0.5) * spread;

      const dot = document.createElement("div");
      dot.style.cssText = `
        position:fixed;
        left:${ox}px;
        top:${oy}px;
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        pointer-events:none;
        z-index:9994;
        background:radial-gradient(circle,rgba(200,245,255,0.95),rgba(80,200,255,0.6));
        box-shadow:0 0 ${size * 2.5}px rgba(120,220,255,0.85);
        transform:translate(-50%,-50%);
      `;
      document.body.appendChild(dot);

      dot.animate(
        [
          { transform: "translate(-50%,-50%) scale(1)",   opacity: 0.85 },
          { transform: `translate(-50%,-50%) scale(0.08) translate(${(Math.random()-0.5)*8}px,${(Math.random()-0.5)*8}px)`, opacity: 0 },
        ],
        { duration, easing: "cubic-bezier(0.25, 0.8, 0.3, 1)", fill: "forwards" }
      );

      setTimeout(() => dot.remove(), duration + 20);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return null;
}
