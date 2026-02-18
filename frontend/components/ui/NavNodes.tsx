"use client";

const nodes = [
  { label: "CORE", x: "8%", y: "20%" },
  { label: "MEMORY", x: "85%", y: "28%" },
  { label: "NETWORK", x: "12%", y: "78%" },
  { label: "ANALYTICS", x: "88%", y: "75%" },
];

export default function NavNodes() {
  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {nodes.map((n, i) => (
        <button
          key={i}
          className="
            pointer-events-auto
            absolute
            -translate-x-1/2 -translate-y-1/2
            rounded-full
            border border-cyan-400/40
            bg-black/30
            px-4 py-2
            text-xs
            font-mono
            text-cyan-200
            backdrop-blur-md
            transition-all duration-300
            hover:scale-110
            hover:border-cyan-300
            hover:text-white
            hover:shadow-[0_0_18px_rgba(0,255,255,0.7)]
          "
          style={{ left: n.x, top: n.y }}
        >
          {n.label}
        </button>
      ))}
    </div>
  );
}
