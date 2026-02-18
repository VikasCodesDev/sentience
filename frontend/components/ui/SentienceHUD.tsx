"use client";

export default function SentienceHUD() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 font-mono text-cyan-200">

      {/* 🌌 TOP LEFT — SYSTEM PANEL */}
      <div className="absolute top-6 left-6 bg-black/30 backdrop-blur-xl border border-cyan-400/20 rounded-xl px-5 py-3 shadow-[0_0_25px_rgba(0,255,255,0.15)]">
        <p className="text-[10px] tracking-widest opacity-60">SYSTEM</p>
        <p className="text-sm font-semibold text-cyan-300">
          SENTIENCE CORE v1.0
        </p>
        <p className="text-xs opacity-70 text-emerald-300">
          STATUS: ONLINE
        </p>
      </div>

      {/* ⚡ TOP RIGHT — METRICS */}
      <div className="absolute top-6 right-6 bg-black/30 backdrop-blur-xl border border-cyan-400/20 rounded-xl px-5 py-3 text-right shadow-[0_0_25px_rgba(0,255,255,0.15)]">
        <p className="text-[10px] tracking-widest opacity-60">
          NEURAL LOAD
        </p>
        <p className="text-lg font-bold text-cyan-300">72%</p>
        <p className="text-xs opacity-70 text-emerald-300">STABLE</p>
      </div>

      

      {/* 🛰️ SIDE SCANLINES (SUBTLE) */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          background:
            "repeating-linear-gradient(transparent, transparent 2px, rgba(0,255,255,0.4) 3px)",
        }}
      />

      {/* 🌫️ VIGNETTE */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.6))]" />

    </div>
  );
}
