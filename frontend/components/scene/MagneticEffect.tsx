"use client";

import { useEffect } from "react";

export default function MagneticEffect() {
  useEffect(() => {
    const applied = new WeakSet<Element>();

    function attach(el: Element) {
      if (applied.has(el)) return;
      applied.add(el);

      let rafId: number;
      let tx = 0, ty = 0;

      const onMove = (e: Event) => {
        const me   = e as MouseEvent;
        const rect = el.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = me.clientX - cx;
        const dy   = me.clientY - cy;
        const dist = Math.hypot(dx, dy);
        const mag  = Math.max(rect.width, rect.height);

        if (dist < mag * 1.5) {
          const pull = (1 - dist / (mag * 1.5)) * 0.30;
          tx = dx * pull;
          ty = dy * pull;
          cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            (el as HTMLElement).style.transform  = `translate(${tx}px,${ty}px)`;
            (el as HTMLElement).style.transition = "transform 0.12s cubic-bezier(0.2,0.8,0.4,1)";
          });
        }
      };

      const onLeave = () => {
        tx = 0; ty = 0;
        cancelAnimationFrame(rafId);
        (el as HTMLElement).style.transform  = "translate(0,0)";
        (el as HTMLElement).style.transition = "transform 0.45s cubic-bezier(0.25,0.8,0.4,1)";
      };

      el.addEventListener("mousemove",  onMove);
      el.addEventListener("mouseleave", onLeave);
    }

    // Attach to all current interactive elements
    document.querySelectorAll("button, a").forEach(attach);

    // Watch for dynamically added elements
    const obs = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          const el = node as Element;
          if (el.matches("button, a")) attach(el);
          el.querySelectorAll?.("button, a").forEach(attach);
        });
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    return () => obs.disconnect();
  }, []);

  return null;
}
