"use client";

import { useEffect, useRef, useState } from "react";

type Action = { id: string; label: string; desc: string; icon: string; value?: string; cat: string };

const ACTIONS: Action[] = [
  { id:"new_chat",    label:"New Conversation",    desc:"Start a fresh chat session",           icon:"✦",  cat:"Chat",     value:undefined },
  { id:"open_panel",  label:"Open CORE Panel",     desc:"System status & simulation",           icon:"⬡",  cat:"Panels",   value:"CORE"      },
  { id:"open_panel",  label:"Open MEMORY Panel",   desc:"Personal memory & vault",              icon:"◈",  cat:"Panels",   value:"MEMORY"    },
  { id:"open_panel",  label:"Open NETWORK Panel",  desc:"Network & tool registry",              icon:"◉",  cat:"Panels",   value:"NETWORK"   },
  { id:"open_panel",  label:"Open ANALYTICS Panel",desc:"Metrics & background tasks",           icon:"◆",  cat:"Panels",   value:"ANALYTICS" },
  { id:"toggle_tts",  label:"Toggle Voice Output", desc:"Enable / disable AI speech synthesis", icon:"🔊", cat:"Settings", value:undefined },
  { id:"send_cmd",    label:"Mode: Core",          desc:"Switch to core AI personality",        icon:"◎",  cat:"Modes",    value:"mode core"     },
  { id:"send_cmd",    label:"Mode: Dev",           desc:"Switch to developer mode",             icon:"⌨",  cat:"Modes",    value:"mode dev"      },
  { id:"send_cmd",    label:"Mode: Creative",      desc:"Switch to creative mode",              icon:"✦",  cat:"Modes",    value:"mode creative" },
  { id:"send_cmd",    label:"Mode: Analyst",       desc:"Switch to analyst mode",               icon:"📊", cat:"Modes",    value:"mode analyst"  },
  { id:"send_cmd",    label:"Mode: Cyber",         desc:"Switch to cyber mode",                 icon:"⚡", cat:"Modes",    value:"mode cyber"    },
  { id:"send_cmd",    label:"Mode: Tutor",         desc:"Switch to tutor mode",                 icon:"📚", cat:"Modes",    value:"mode tutor"    },
  { id:"send_cmd",    label:"Search the Web",      desc:"Ask SENTIENCE to search in real-time", icon:"🔍", cat:"Tools",    value:"latest news today" },
  { id:"send_cmd",    label:"Clear Memory",        desc:"Wipe conversation context",            icon:"🧹", cat:"Tools",    value:"clear memory"  },
];

type Props = { onAction: (id: string, value?: string) => void; onClose: () => void };

export default function CommandPalette({ onAction, onClose }: Props) {
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = ACTIONS.filter(a =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.desc.toLowerCase().includes(query.toLowerCase())  ||
    a.cat.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => { setSelected(0); }, [query]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s+1, filtered.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s-1, 0)); }
    if (e.key === "Enter")     { const a = filtered[selected]; if (a) onAction(a.id, a.value); }
    if (e.key === "Escape")    { onClose(); }
  }

  const grouped = filtered.reduce((acc: Record<string,Action[]>, a) => {
    (acc[a.cat] ??= []).push(a); return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[14vh]"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", animation: "sentienceFadeIn 0.15s ease-out" }}
      onClick={onClose}
    >
      <div
        className="w-[540px] max-w-[94vw] bg-black/90 backdrop-blur-2xl border border-cyan-400/30 rounded-2xl overflow-hidden font-mono"
        style={{ boxShadow: "0 0 80px rgba(0,255,255,0.15), 0 0 200px rgba(0,255,255,0.05)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-cyan-400/15">
          <span className="text-cyan-400/40 text-sm shrink-0">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search commands, modes, panels..."
            className="flex-1 bg-transparent text-cyan-100 text-sm outline-none placeholder-cyan-400/30"
          />
          <kbd className="text-[9px] text-cyan-400/25 border border-cyan-400/15 rounded px-1.5 py-0.5 shrink-0">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[280px] overflow-y-auto py-1.5">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-[11px] text-cyan-400/30">No commands found</p>
          )}
          {Object.entries(grouped).map(([cat, acts]) => (
            <div key={cat}>
              <p className="px-4 py-1 text-[9px] tracking-widest text-cyan-400/25 uppercase">{cat}</p>
              {acts.map((a, i) => {
                const gi = filtered.indexOf(a);
                const active = gi === selected;
                return (
                  <button
                    key={i}
                    onClick={() => onAction(a.id, a.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75 border-l-2 ${
                      active
                        ? "bg-cyan-500/10 border-l-cyan-400 text-cyan-200"
                        : "border-l-transparent hover:bg-cyan-500/5 text-cyan-300/60 hover:text-cyan-200"
                    }`}
                  >
                    <span className="text-sm w-5 text-center shrink-0">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold">{a.label}</p>
                      <p className="text-[9px] text-cyan-400/35 truncate">{a.desc}</p>
                    </div>
                    {active && <span className="text-[9px] text-cyan-400/30 shrink-0">↵</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-cyan-400/10 flex items-center gap-4 text-[9px] text-cyan-400/20">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span className="ml-auto">Ctrl+K to open</span>
        </div>
      </div>
    </div>
  );
}
