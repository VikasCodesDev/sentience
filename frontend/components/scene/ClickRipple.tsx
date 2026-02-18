"use client";

import { useEffect } from "react";

export default function ClickRipple() {
  useEffect(() => {
    const ripple = (e: MouseEvent) => {
      const el = document.createElement("div");

      el.style.position = "fixed";
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.style.transform = "translate(-50%, -50%)";
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "50%";
      el.style.border = "1px solid rgba(120,220,255,0.8)";
      el.style.pointerEvents = "none";
      el.style.zIndex = "9998";

      document.body.appendChild(el);

      el.animate(
        [
          { transform: "translate(-50%, -50%) scale(1)", opacity: 0.9 },
          { transform: "translate(-50%, -50%) scale(18)", opacity: 0 },
        ],
        { duration: 700, easing: "ease-out" }
      );

      setTimeout(() => el.remove(), 700);
    };

    window.addEventListener("mousedown", ripple);
    return () => window.removeEventListener("mousedown", ripple);
  }, []);

  return null;
}
