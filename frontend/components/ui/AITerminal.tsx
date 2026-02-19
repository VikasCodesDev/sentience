"use client";

import { useEffect, useRef } from "react";

type Log = {
  type: "system" | "user" | "ai" | "error";
  text: string;
};

type Props = {
  logs: Log[];
  loading?: boolean;
};

export default function AITerminal({ logs, loading }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, loading]);

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 w-[420px] z-50">
      <div className="rounded-2xl border border-cyan-400/20 bg-black/40 backdrop-blur-xl shadow-[0_0_60px_rgba(0,255,255,0.15)] overflow-hidden">

        {/* HEADER */}
        <div className="px-4 py-2 text-xs text-cyan-300/80 border-b border-cyan-400/20">
          SENTIENCE CORE INITIALIZED
        </div>

        {/* LOGS */}
        <div className="p-4 space-y-2 text-sm text-cyan-200/90 font-mono max-h-[40vh] overflow-y-auto">

          {logs.map((log, i) => (
            <div
              key={i}
              className={
                log.type === "error"
                  ? "text-red-400"
                  : log.type === "ai"
                  ? "text-cyan-100"
                  : "text-cyan-300"
              }
            >
              {log.text}
            </div>
          ))}

          {loading && (
            <div className="opacity-60 text-cyan-300">
              Processing...
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
