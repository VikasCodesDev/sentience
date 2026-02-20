"use client";

const nodes = [
  { label: "CORE",      x: "22%",  y: "16%",  icon: "⬡", desc: "System Status" },
  { label: "MEMORY",    x: "85%",  y: "28%",  icon: "◈", desc: "Knowledge Store" },
  { label: "NETWORK",   x: "12%",  y: "88%",  icon: "◉", desc: "Connectivity" },
  { label: "ANALYTICS", x: "88%",  y: "75%",  icon: "◆", desc: "Metrics" },
];

type Props = {
  onNodeClick?: (label: string) => void;
  activePanel?: string | null;
};

export default function NavNodes({ onNodeClick, activePanel }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {nodes.map((n, i) => (
        <button
          key={i}
          onClick={() => onNodeClick?.(n.label)}
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center gap-1"
          style={{ left: n.x, top: n.y }}
        >
          <div className={`
            flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-mono backdrop-blur-md
            transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.6)]
            ${activePanel === n.label
              ? "border-cyan-300 bg-cyan-900/40 text-white shadow-[0_0_20px_rgba(0,255,255,0.5)]"
              : "border-cyan-400/30 bg-black/30 text-cyan-200 group-hover:border-cyan-300 group-hover:text-white group-hover:bg-black/50"
            }
          `}>
            <span
              className={`text-base ${activePanel === n.label ? "animate-spin" : "group-hover:animate-spin"}`}
              style={{ animationDuration: "3s" }}
            >
              {n.icon}
            </span>
            <span>{n.label}</span>
          </div>
          <span className="text-[9px] text-cyan-400/40 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {n.desc}
          </span>
        </button>
      ))}
    </div>
  );
}
