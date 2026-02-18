"use client";

import { useEffect } from "react";

export default function MagneticEffect() {
  useEffect(() => {
    const elements = document.querySelectorAll("button, a");

    elements.forEach((el) => {
      el.addEventListener("mousemove", (e: any) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        (el as HTMLElement).style.transform =
          `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });

      el.addEventListener("mouseleave", () => {
        (el as HTMLElement).style.transform = "translate(0,0)";
      });
    });
  }, []);

  return null;
}
