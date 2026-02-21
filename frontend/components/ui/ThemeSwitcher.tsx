"use client";

import { useState, useEffect, useRef } from "react";

const THEMES = [
  { id:"cyan",   name:"NEURAL",  dot:"#00ffff" },
  { id:"purple", name:"GHOST",   dot:"#a855f7" },
  { id:"green",  name:"MATRIX",  dot:"#22c55e" },
  { id:"orange", name:"INFERNO", dot:"#f97316" },
];

const FILTERS: Record<string,string> = {
  cyan:   "none",
  purple: "hue-rotate(200deg) saturate(1.1)",
  green:  "hue-rotate(120deg) saturate(1.05)",
  orange: "hue-rotate(300deg) saturate(1.15)",
};

export default function ThemeSwitcher() {
  const [open,    setOpen]    = useState(false);
  const [current, setCurrent] = useState("cyan");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sentience_theme") || "cyan";
    setCurrent(saved);
    applyTheme(saved, false);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function applyTheme(id: string, save = true) {
    const root = document.documentElement;
    root.style.filter = FILTERS[id] || "none";
    if (save) localStorage.setItem("sentience_theme", id);
    setCurrent(id);
    setOpen(false);
  }

  const cur = THEMES.find(t => t.id === current) || THEMES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Theme switcher"
        className={`
          w-12 h-12 flex items-center justify-center rounded-xl
          border transition-all duration-200 font-mono text-xl
          ${open
            ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_18px_rgba(0,255,255,0.3)]"
            : "border-cyan-400/20 bg-black/30 text-cyan-400/60 hover:border-cyan-400/40 hover:text-cyan-300 hover:bg-black/50 hover:shadow-[0_0_12px_rgba(0,255,255,0.15)]"
          }
        `}
      >
        🎨
      </button>

      {open && (
        <div
          className="absolute top-13 right-0 bg-black/90 backdrop-blur-xl border border-cyan-400/20 rounded-xl p-2 space-y-0.5 z-50"
          style={{ boxShadow:"0 0 30px rgba(0,255,255,0.12)", minWidth:130, top: "52px" }}
        >
          <p className="text-[9px] tracking-widest text-cyan-400/25 uppercase px-2 pb-1">Theme</p>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => applyTheme(t.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                current === t.id
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "text-cyan-400/45 hover:text-cyan-300 hover:bg-cyan-500/10"
              }`}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: t.dot }} />
              <span>{t.name}</span>
              {current === t.id && <span className="ml-auto text-[9px] text-cyan-400/40">●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
