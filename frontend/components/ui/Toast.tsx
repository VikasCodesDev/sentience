"use client";

type Props = { message: string; type: "success" | "error" | "info" };

export default function Toast({ message, type }: Props) {
  const colors = {
    success: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    error: "border-red-400/40 bg-red-500/10 text-red-300",
    info: "border-cyan-400/40 bg-cyan-500/10 text-cyan-300",
  };
  const icons = { success: "✓", error: "✕", info: "◈" };

  return (
    <div className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-xl font-mono text-xs shadow-lg animate-fade-in-up ${colors[type]}`}>
      <span className="font-bold">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}
