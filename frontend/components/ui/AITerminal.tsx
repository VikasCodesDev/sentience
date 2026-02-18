"use client";

type Props = {
  logs: string[];
};

export default function AITerminal({ logs }: Props) {
  return (
    <div className="fixed left-6 top-1/2 z-[60] w-[420px] -translate-y-1/2">

      <div className="rounded-2xl border border-cyan-400/20 bg-black/40 backdrop-blur-xl shadow-[0_0_60px_rgba(0,255,255,0.15)]">

        {/* HEADER */}
        <div className="px-4 py-2 text-xs text-cyan-300/80 border-b border-cyan-400/20">
          SENTIENCE CORE INITIALIZED
        </div>

        {/* LOGS */}
        <div className="p-4 space-y-2 text-sm text-cyan-200/90 font-mono overflow-y-auto max-h-[40vh]">

          {logs.length === 0 ? (
            <div className="opacity-50">Awaiting command...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap">
                {log}
              </div>
            ))
          )}

          <div className="opacity-40">▌</div>
        </div>
      </div>
    </div>
  );
}
