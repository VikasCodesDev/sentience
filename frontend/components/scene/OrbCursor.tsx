"use client";

import { useEffect, useRef, useState } from "react";

export default function OrbCursor() {
  const orbRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);

  const pos      = useRef({ x: -100, y: -100 });
  const ringPos  = useRef({ x: -100, y: -100 });
  const target   = useRef({ x: -100, y: -100 });

  const [isHover,   setIsHover]   = useState(false);
  const [isClick,   setIsClick]   = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let raf: number;

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const interactive = el?.closest("button, a, input, textarea, select, [role='button'], label");
      setIsHover(!!interactive);
    };

    const onDown  = () => setIsClick(true);
    const onUp    = () => setIsClick(false);
    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);

    window.addEventListener("mousemove",  onMove,  { passive: true });
    window.addEventListener("mousedown",  onDown);
    window.addEventListener("mouseup",    onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    const tick = () => {
      // Orb — fast, snappy
      pos.current.x += (target.current.x - pos.current.x) * 0.25;
      pos.current.y += (target.current.y - pos.current.y) * 0.25;

      // Ring — medium lag
      ringPos.current.x += (target.current.x - ringPos.current.x) * 0.10;
      ringPos.current.y += (target.current.y - ringPos.current.y) * 0.10;

      const ox = pos.current.x, oy = pos.current.y;
      const rx = ringPos.current.x, ry = ringPos.current.y;

      if (orbRef.current)  orbRef.current.style.transform  = `translate3d(${ox}px,${oy}px,0)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      if (haloRef.current) haloRef.current.style.transform = `translate3d(${rx}px,${ry}px,0)`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("mousedown",  onDown);
      window.removeEventListener("mouseup",    onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
    };
  }, [isVisible]);

  const orbSize  = isClick ? 16 : isHover ? 30 : 22;
  const ringSize = isClick ? 52 : isHover ? 60 : 44;
  const haloSize = isClick ? 80 : isHover ? 90 : 70;

  return (
    <>
      {/* Distant slow halo */}
      <div
        ref={haloRef}
        className="pointer-events-none fixed top-0 left-0 z-[9995]"
        style={{
          width:      haloSize,
          height:     haloSize,
          marginLeft: -haloSize / 2,
          marginTop:  -haloSize / 2,
          borderRadius: "50%",
          border: `1px solid rgba(100,210,255,${isHover ? 0.18 : 0.10})`,
          transition: "width 0.3s ease, height 0.3s ease, margin 0.3s ease, opacity 0.2s",
          opacity: isVisible ? 1 : 0,
        }}
      />

      {/* Mid lagging ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9996]"
        style={{
          width:      ringSize,
          height:     ringSize,
          marginLeft: -ringSize / 2,
          marginTop:  -ringSize / 2,
          borderRadius: "50%",
          border: `1.5px solid rgba(120,220,255,${isClick ? 0.9 : isHover ? 0.7 : 0.35})`,
          boxShadow: `0 0 ${isHover ? 20 : 10}px rgba(120,220,255,${isHover ? 0.35 : 0.15}),
                      inset 0 0 ${isHover ? 10 : 5}px rgba(120,220,255,${isHover ? 0.1 : 0.05})`,
          transition: "width 0.2s ease, height 0.2s ease, margin 0.2s ease, border-color 0.15s, box-shadow 0.15s, opacity 0.2s",
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Inner ring tick marks */}
        {[0, 90, 180, 270].map(deg => (
          <div key={deg} style={{
            position: "absolute",
            width: 3,
            height: 1,
            background: `rgba(120,220,255,${isHover ? 0.8 : 0.4})`,
            top: "50%",
            left: "50%",
            transformOrigin: `${-ringSize / 2 + 3}px 0`,
            transform: `rotate(${deg}deg) translateX(${-ringSize / 2 + 3}px) translateY(-50%)`,
            transition: "background 0.15s",
          }} />
        ))}
      </div>

      {/* Core orb */}
      <div
        ref={orbRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999]"
        style={{
          width:      orbSize,
          height:     orbSize,
          marginLeft: -orbSize / 2,
          marginTop:  -orbSize / 2,
          borderRadius: "50%",
          background: isClick
            ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,1), rgba(60,200,255,0.95) 45%, rgba(0,120,255,0.5) 80%)"
            : isHover
            ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,1), rgba(100,220,255,0.9) 45%, rgba(0,160,255,0.3) 80%)"
            : "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(120,220,255,0.75) 45%, rgba(0,140,255,0.15) 80%)",
          boxShadow: isClick
            ? "0 0 30px rgba(80,200,255,1), 0 0 70px rgba(80,200,255,0.5), 0 0 130px rgba(80,200,255,0.2)"
            : isHover
            ? "0 0 22px rgba(120,220,255,0.9), 0 0 55px rgba(120,220,255,0.4)"
            : "0 0 14px rgba(120,220,255,0.7), 0 0 35px rgba(120,220,255,0.25)",
          transition: "width 0.12s ease, height 0.12s ease, margin 0.12s ease, box-shadow 0.12s, opacity 0.2s",
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Pupil */}
        <div style={{
          position: "absolute",
          inset: isClick ? "35%" : isHover ? "30%" : "32%",
          borderRadius: "50%",
          background: "rgba(0,15,40,0.8)",
          transition: "inset 0.12s ease",
        }} />
        {/* Specular shine */}
        <div style={{
          position: "absolute",
          top: "16%", left: "18%",
          width: "26%", height: "26%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.92)",
        }} />
        {/* Secondary tiny shine */}
        <div style={{
          position: "absolute",
          top: "45%", left: "55%",
          width: "12%", height: "12%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.5)",
        }} />
      </div>
    </>
  );
}
