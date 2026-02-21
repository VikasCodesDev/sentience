"use client";

import API_BASE from "@/lib/api";

import { useEffect, useState, useCallback } from "react";

type Props = {
  panel: string;
  onClose: () => void;
  onClearMemory?: () => void;
};

export default function PanelModal({ panel, onClose, onClearMemory }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const endpointMap: Record<string, string> = {
    CORE: `${API_BASE}/api/status/core`,
    NETWORK: `${API_BASE}/api/status/network`,
    MEMORY: `${API_BASE}/api/status/memory`,
    ANALYTICS: `${API_BASE}/api/status/analytics`,
  };

  const fetchData = useCallback(async () => {
    const url = endpointMap[panel];
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to connect to backend. Is it running on port 5000?");
    }
    setLoading(false);
  }, [panel]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function clearMemory() {
    try {
      await fetch(`${API_BASE}/api/files/clear`, { method: "DELETE" });
      await fetch(`${API_BASE}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "clear memory" }),
      });
      onClearMemory?.();
      fetchData();
    } catch { }
  }

  const panelIcons: Record<string, string> = {
    CORE: "⬡",
    NETWORK: "◉",
    MEMORY: "◈",
    ANALYTICS: "◆",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-[600px] max-w-[95vw] max-h-[80vh] bg-black/80 backdrop-blur-2xl border border-cyan-400/30 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,255,255,0.15)] font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-400/20 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{panelIcons[panel]}</span>
            <div>
              <h2 className="text-sm font-bold text-cyan-300 tracking-widest">{panel} PANEL</h2>
              <p className="text-[10px] text-cyan-400/40">Live System Data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="text-xs text-cyan-400/60 hover:text-cyan-300 border border-cyan-400/20 hover:border-cyan-400/40 px-3 py-1 rounded-lg transition-all"
            >
              ↻ Refresh
            </button>
            <button
              onClick={onClose}
              className="text-cyan-400/60 hover:text-red-400 transition-colors w-8 h-8 flex items-center justify-center border border-cyan-400/20 rounded-lg hover:border-red-400/40"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading && (
            <div className="flex items-center gap-3 text-cyan-400/60 text-sm">
              <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              <span>Loading system data...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-400/30 rounded-xl text-red-300 text-sm">
              ❌ {error}
            </div>
          )}

          {data && !loading && (
            <>
              {panel === "CORE" && <CorePanel data={data} />}
              {panel === "NETWORK" && <NetworkPanel data={data} />}
              {panel === "MEMORY" && <MemoryPanel data={data} onClear={clearMemory} />}
              {panel === "ANALYTICS" && <AnalyticsPanel data={data} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color = "text-cyan-200" }: { label: string; value: any; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-cyan-400/10">
      <span className="text-[11px] text-cyan-400/50 tracking-wide">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{String(value)}</span>
    </div>
  );
}

function CorePanel({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-300 font-semibold">STATUS: {data.status}</span>
        </div>
        <StatRow label="VERSION" value={`v${data.version}`} />
        <StatRow label="UPTIME" value={data.uptime} color="text-emerald-300" />
        <StatRow label="MODEL" value={data.model} />
        <StatRow label="NEURAL LOAD" value={`${data.neuralLoad}%`} color={data.neuralLoad > 80 ? "text-yellow-300" : "text-emerald-300"} />
        <StatRow label="MEMORY USAGE" value={`${data.memoryUsage} MB`} />
        <StatRow label="GROQ CONNECTED" value={data.groqConnected ? "YES" : "NO"} color={data.groqConnected ? "text-emerald-300" : "text-red-400"} />
        <StatRow label="MESSAGES SENT" value={data.messageCount} />
        <StatRow label="FILES ANALYZED" value={data.fileCount} />
      </div>

      {/* Load bar */}
      <div>
        <div className="flex justify-between text-[10px] text-cyan-400/40 mb-1">
          <span>NEURAL LOAD</span>
          <span>{data.neuralLoad}%</span>
        </div>
        <div className="w-full bg-cyan-900/30 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-1000"
            style={{ width: `${data.neuralLoad}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function NetworkPanel({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* APIs */}
      <div className="p-4 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
        <h3 className="text-[10px] tracking-widest text-cyan-400/50 mb-3">CONNECTED SERVICES</h3>
        <div className="space-y-2">
          {data.apis?.map((api: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-cyan-400/10">
              <span className="text-xs text-cyan-200">{api.name}</span>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${api.status === "ONLINE" ? "bg-emerald-400" : "bg-red-400"}`} />
                <span className={`text-[10px] ${api.status === "ONLINE" ? "text-emerald-300" : "text-red-400"}`}>
                  {api.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "AVG LATENCY", value: `${data.avgLatency}ms` },
          { label: "TOTAL REQUESTS", value: data.totalRequests },
          { label: "STATUS", value: "ACTIVE" },
        ].map((s, i) => (
          <div key={i} className="p-3 bg-cyan-500/5 border border-cyan-400/20 rounded-xl text-center">
            <div className="text-lg font-bold text-cyan-300">{s.value}</div>
            <div className="text-[9px] text-cyan-400/40 tracking-wide mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Request log */}
      {data.requestLog?.length > 0 && (
        <div className="p-4 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
          <h3 className="text-[10px] tracking-widest text-cyan-400/50 mb-3">RECENT REQUESTS</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {data.requestLog.slice(0, 10).map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[10px] py-1 border-b border-cyan-400/5">
                <span className="text-cyan-400/30">{r.time}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] ${r.status < 400 ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                  {r.status}
                </span>
                <span className="text-cyan-300/60 flex-1 truncate">{r.path}</span>
                <span className="text-cyan-400/30">{r.latency}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryPanel({ data, onClear }: { data: any; onClear: () => void }) {
  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "FILES", value: data.fileCount },
          { label: "CONVERSATIONS", value: data.conversationCount },
          { label: "TOTAL MSGS", value: data.totalMessages },
        ].map((s, i) => (
          <div key={i} className="p-3 bg-cyan-500/5 border border-cyan-400/20 rounded-xl text-center">
            <div className="text-xl font-bold text-cyan-300">{s.value}</div>
            <div className="text-[9px] text-cyan-400/40 tracking-wide mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Files */}
      {data.files?.length > 0 && (
        <div className="p-4 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
          <h3 className="text-[10px] tracking-widest text-cyan-400/50 mb-3">STORED FILES</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {data.files.map((f: any, i: number) => (
              <div key={i} className="p-2 bg-black/30 rounded-lg border border-cyan-400/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-cyan-200 truncate flex-1">{f.name}</span>
                  <span className="text-[9px] text-cyan-400/40 ml-2">{(f.size / 1024).toFixed(1)}KB</span>
                </div>
                <div className="text-[9px] text-cyan-400/30 mt-0.5 truncate">{f.preview}...</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversations */}
      {data.conversations?.length > 0 && (
        <div className="p-4 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
          <h3 className="text-[10px] tracking-widest text-cyan-400/50 mb-3">CONVERSATIONS</h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {data.conversations.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-cyan-400/10">
                <span className="text-[11px] text-cyan-200 truncate flex-1">{c.title}</span>
                <span className="text-[9px] text-cyan-400/40 ml-2">{c.messageCount} msgs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory stats */}
      <div className="p-4 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
        <StatRow label="TOTAL CHARS STORED" value={data.totalChars?.toLocaleString() || 0} />
        <StatRow label="MEMORY USAGE" value={`${data.memoryUsageMB} MB`} />
        <StatRow label="LEGACY MESSAGES" value={data.legacyMessageCount} />
      </div>

      {/* Clear button */}
      <button
        onClick={onClear}
        className="w-full py-2.5 text-xs text-red-400 border border-red-400/20 rounded-xl hover:bg-red-500/10 hover:border-red-400/40 transition-all duration-200 font-semibold tracking-wide"
      >
        🧹 CLEAR ALL MEMORY
      </button>
    </div>
  );
}

function AnalyticsPanel({ data }: { data: any }) {
  const maxLatency = Math.max(...(data.recentLatencies || [1]), 1);

  return (
    <div className="space-y-4">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "MESSAGES", value: data.messageCount, icon: "💬" },
          { label: "FILES", value: data.fileCount, icon: "📎" },
          { label: "AVG LATENCY", value: `${data.avgLatency}ms`, icon: "⚡" },
          { label: "REQUESTS", value: data.totalRequests, icon: "📡" },
        ].map((s, i) => (
          <div key={i} className="p-4 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
            <div className="flex items-center gap-2">
              <span>{s.icon}</span>
              <span className="text-[10px] text-cyan-400/40 tracking-wide">{s.label}</span>
            </div>
            <div className="text-xl font-bold text-cyan-300 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tool usage */}
      {data.toolUsage && Object.keys(data.toolUsage).length > 0 && (
        <div className="p-4 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
          <h3 className="text-[10px] tracking-widest text-cyan-400/50 mb-3">TOOL USAGE</h3>
          <div className="space-y-2">
            {Object.entries(data.toolUsage)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([tool, count]: any, i) => {
                const maxCount = Math.max(...Object.values(data.toolUsage) as number[]);
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-cyan-300">{tool.toUpperCase()}</span>
                      <span className="text-cyan-400/40">{count}x</span>
                    </div>
                    <div className="w-full bg-cyan-900/20 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Latency chart */}
      {data.recentLatencies?.length > 0 && (
        <div className="p-4 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
          <h3 className="text-[10px] tracking-widest text-cyan-400/50 mb-3">LATENCY HISTORY</h3>
          <div className="flex items-end gap-1 h-16">
            {data.recentLatencies.slice(-20).map((lat: number, i: number) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-cyan-500 to-emerald-400 rounded-sm opacity-70 min-w-[4px]"
                style={{ height: `${(lat / maxLatency) * 100}%` }}
                title={`${lat}ms`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-cyan-400/30 mt-1">
            <span>OLDEST</span>
            <span>NEWEST</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value, color = "text-cyan-200" }: { label: string; value: any; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-cyan-400/10">
      <span className="text-[11px] text-cyan-400/50 tracking-wide">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{String(value)}</span>
    </div>
  );
}
