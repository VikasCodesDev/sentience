"use client";

import { useEffect, useRef, useState } from "react";
import API_BASE from "@/lib/api";

type Props = {
  hudRef?: React.RefObject<HTMLDivElement | null>;
};

export default function SentienceHUD({ hudRef }: Props) {
  const [load, setLoad] = useState(72);
  const [uptime, setUptime] = useState("0s");
  const [startTime] = useState(Date.now());
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoad(Math.floor(40 + Math.random() * 45));
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed < 60) setUptime(`${elapsed}s`);
      else if (elapsed < 3600) setUptime(`${Math.floor(elapsed / 60)}m ${elapsed % 60}s`);
      else setUptime(`${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`);
    }, 2000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    const check = async () => {
      try {
        await fetch(`${API_BASE}/`);
        setOnline(true);
      } catch {
        setOnline(false);
      }
    };
    check();
    const i = setInterval(check, 10000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 font-mono text-cyan-200">
      {/* TOP LEFT */}
      <div className="absolute top-6 left-6 bg-black/30 backdrop-blur-xl border border-cyan-400/20 rounded-xl px-5 py-3 shadow-[0_0_25px_rgba(0,255,255,0.1)]">
        <p className="text-[9px] tracking-widest opacity-50 mb-1">SYSTEM</p>
        <p className="text-sm font-semibold text-cyan-300">SENTIENCE v4.0</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
          <p className={`text-[10px] ${online ? "text-emerald-300" : "text-red-400"}`}>
            {online ? "BACKEND ONLINE" : "BACKEND OFFLINE"}
          </p>
        </div>
        <p className="text-[9px] text-cyan-400/40 mt-0.5">UPTIME: {uptime}</p>
      </div>

      {/* TOP RIGHT — wrapped in ref so page.tsx can measure height */}
      <div
        ref={hudRef}
        className="absolute top-6 right-6 bg-black/30 backdrop-blur-xl border border-cyan-400/20 rounded-xl px-5 py-3 text-right shadow-[0_0_25px_rgba(0,255,255,0.1)]"
      >
        <p className="text-[9px] tracking-widest opacity-50 mb-1">NEURAL LOAD</p>
        <p className="text-2xl font-bold text-cyan-300">{load}%</p>
        <div className="mt-1 w-full bg-cyan-900/30 rounded-full h-1">
          <div
            className="h-1 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-1000"
            style={{ width: `${load}%` }}
          />
        </div>
        <p className={`text-[9px] mt-0.5 ${load > 80 ? "text-yellow-300" : "text-emerald-300"}`}>
          {load > 80 ? "HIGH LOAD" : "STABLE"}
        </p>
      </div>

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ background: "repeating-linear-gradient(transparent, transparent 2px, rgba(0,255,255,0.5) 3px)" }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.65))]" />
    </div>
  );
}
