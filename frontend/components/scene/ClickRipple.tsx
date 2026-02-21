"use client";

import { useEffect } from "react";

export default function ClickRipple() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const x = e.clientX, y = e.clientY;

      // 3 expanding rings with staggered timing
      spawnRing(x, y, { startPx: 8,  endScale: 22, dur: 550, color: "rgba(120,220,255,0.95)", border: 1.5, delay: 0   });
      spawnRing(x, y, { startPx: 10, endScale: 38, dur: 700, color: "rgba(80,180,255,0.6)",   border: 1,   delay: 60  });
      spawnRing(x, y, { startPx: 12, endScale: 55, dur: 850, color: "rgba(60,150,255,0.3)",   border: 0.8, delay: 130 });

      // Centre flash
      spawnFlash(x, y);

      // 8 sparks burst outward
      for (let i = 0; i < 8; i++) spawnSpark(x, y, i, 8);
    };

    function spawnRing(x: number, y: number, opts: {
      startPx: number; endScale: number; dur: number;
      color: string; border: number; delay: number;
    }) {
      const el = document.createElement("div");
      el.style.cssText = `
        position:fixed;
        left:${x}px; top:${y}px;
        transform:translate(-50%,-50%) scale(1);
        width:${opts.startPx}px; height:${opts.startPx}px;
        border-radius:50%;
        border:${opts.border}px solid ${opts.color};
        box-shadow:0 0 12px ${opts.color}, inset 0 0 6px ${opts.color};
        pointer-events:none;
        z-index:9993;
      `;
      document.body.appendChild(el);

      setTimeout(() => {
        el.animate(
          [
            { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
            { transform: `translate(-50%,-50%) scale(${opts.endScale})`, opacity: 0 },
          ],
          { duration: opts.dur, easing: "cubic-bezier(0.15,0.6,0.25,1)", fill: "forwards" }
        );
        setTimeout(() => el.remove(), opts.dur + 50);
      }, opts.delay);
    }

    function spawnFlash(x: number, y: number) {
      const el = document.createElement("div");
      el.style.cssText = `
        position:fixed;
        left:${x}px; top:${y}px;
        transform:translate(-50%,-50%);
        width:6px; height:6px;
        border-radius:50%;
        background:rgba(200,245,255,1);
        box-shadow:0 0 20px rgba(120,220,255,1),0 0 50px rgba(80,180,255,0.6);
        pointer-events:none;
        z-index:9999;
      `;
      document.body.appendChild(el);
      el.animate(
        [{ opacity: 1, transform: "translate(-50%,-50%) scale(1)" },
         { opacity: 0, transform: "translate(-50%,-50%) scale(4)" }],
        { duration: 300, easing: "ease-out", fill: "forwards" }
      );
      setTimeout(() => el.remove(), 320);
    }

    function spawnSpark(x: number, y: number, idx: number, total: number) {
      const angle  = (idx / total) * Math.PI * 2 + Math.random() * 0.4;
      const dist   = 28 + Math.random() * 18;
      const dx     = Math.cos(angle) * dist;
      const dy     = Math.sin(angle) * dist;
      const size   = 1.5 + Math.random() * 2;
      const dur    = 380 + Math.random() * 180;

      const sp = document.createElement("div");
      sp.style.cssText = `
        position:fixed;
        left:${x}px; top:${y}px;
        width:${size}px; height:${size * 2.5}px;
        border-radius:${size}px;
        background:rgba(180,240,255,0.95);
        box-shadow:0 0 8px rgba(120,220,255,0.9);
        pointer-events:none;
        z-index:9993;
        transform:translate(-50%,-50%) rotate(${(Math.atan2(dy,dx) * 180/Math.PI) + 90}deg);
      `;
      document.body.appendChild(sp);
      sp.animate(
        [
          { transform: `translate(-50%,-50%) rotate(${(Math.atan2(dy,dx)*180/Math.PI)+90}deg) translate(0,0)`, opacity: 1 },
          { transform: `translate(-50%,-50%) rotate(${(Math.atan2(dy,dx)*180/Math.PI)+90}deg) translate(0,${-dist}px)`, opacity: 0 },
        ],
        { duration: dur, easing: "cubic-bezier(0,0.7,0.5,1)", fill: "forwards" }
      );
      setTimeout(() => sp.remove(), dur + 20);
    }

    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  return null;
}
