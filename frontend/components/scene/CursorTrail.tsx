"use client";

import { useEffect } from "react";

export default function CursorTrail() {
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const dot = document.createElement("div");

      dot.style.position = "fixed";
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      dot.style.width = "6px";
      dot.style.height = "6px";
      dot.style.borderRadius = "50%";
      dot.style.pointerEvents = "none";
      dot.style.background = "rgba(120,220,255,0.7)";
      dot.style.boxShadow = "0 0 8px rgba(120,220,255,0.8)";
      dot.style.zIndex = "9998";

      document.body.appendChild(dot);

      dot.animate(
        [
          { transform: "scale(1)", opacity: 0.9 },
          { transform: "scale(0.2)", opacity: 0 },
        ],
        { duration: 700, easing: "ease-out" }
      );

      setTimeout(() => dot.remove(), 700);
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return null;
}
