"use client";

import { useEffect, useRef, useState } from "react";

type Log = {
  type: "system" | "user" | "ai" | "error" | "file" | "tool";
  text: string;
  timestamp?: string;
};

type Props = {
  logs: Log[];
  loading?: boolean;
  conversationId: string;
  onNewConversation: () => void;
  onLoadConversation: (id: string, messages: Array<{ role: string; content: string }>) => void;
  onLog?: (log: Log) => void;
  onToast?: (msg: string, type?: "success" | "error" | "info") => void;
};

const LOG_COLORS: Record<string, string> = {
  system: "text-cyan-400/70",
  user: "text-emerald-300",
  ai: "text-cyan-100",
  error: "text-red-400",
  file: "text-purple-300",
  tool: "text-yellow-300",
};

const LOG_PREFIX: Record<string, string> = {
  system: "SYS",
  user: "USR",
  ai: "AI ",
  error: "ERR",
  file: "FIL",
  tool: "TUL",
};

type Conversation = {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
  preview: string;
};

export default function AITerminal({
  logs,
  loading,
  conversationId,
  onNewConversation,
  onLoadConversation,
  onLog,
  onToast,
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConvs, setShowConvs] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mark as mounted on client — prevents hydration mismatch on timestamps
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, loading]);

  async function fetchConversations() {
    setLoadingConvs(true);
    try {
      const res = await fetch("http://localhost:5000/api/conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {}
    setLoadingConvs(false);
  }

  async function loadConversation(id: string) {
    try {
      const res = await fetch(`http://localhost:5000/api/conversations/${id}`);
      const data = await res.json();
      onLoadConversation(id, data.messages || []);
      setShowConvs(false);
    } catch {
      onToast?.("Failed to load conversation", "error");
    }
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:5000/api/conversations/${id}`, { method: "DELETE" });
      setConversations(prev => prev.filter(c => c.id !== id));
      onToast?.("Conversation deleted", "info");
    } catch {}
  }

  function toggleConvs() {
    if (!showConvs) fetchConversations();
    setShowConvs(!showConvs);
  }

  return (
    <div className="w-[420px] max-w-[95vw] z-50 font-mono">
      <div className="rounded-2xl border border-cyan-400/20 bg-black/50 backdrop-blur-xl shadow-[0_0_60px_rgba(0,255,255,0.12)] overflow-hidden">

        {/* Header */}
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-cyan-400/20 bg-black/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] tracking-widest text-cyan-300/80 font-semibold">
              SENTIENCE TERMINAL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-cyan-400/40">{logs.length} entries</span>
            <button
              onClick={onNewConversation}
              className="text-[9px] text-cyan-400/40 hover:text-emerald-300 transition-colors px-1 border border-cyan-400/10 rounded hover:border-emerald-400/30"
              title="New conversation"
            >
              +NEW
            </button>
            <button
              onClick={toggleConvs}
              className={`text-[9px] transition-colors px-1 border rounded ${
                showConvs
                  ? "text-cyan-300 border-cyan-400/40"
                  : "text-cyan-400/40 hover:text-cyan-300 border-cyan-400/10 hover:border-cyan-400/30"
              }`}
              title="Conversations"
            >
              ☰
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-cyan-400/40 hover:text-cyan-300 transition-colors text-xs px-1"
            >
              {isMinimized ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {/* Conversations dropdown */}
        {showConvs && !isMinimized && (
          <div className="border-b border-cyan-400/10 bg-black/30 max-h-48 overflow-y-auto">
            {loadingConvs && (
              <div className="px-4 py-2 text-[10px] text-cyan-400/40 text-center">Loading...</div>
            )}
            {!loadingConvs && conversations.length === 0 && (
              <div className="px-4 py-3 text-[10px] text-cyan-400/30 text-center">
                No saved conversations
              </div>
            )}
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`group flex items-start justify-between px-4 py-2 cursor-pointer border-b border-cyan-400/5 hover:bg-cyan-500/5 transition-colors ${
                  conv.id === conversationId
                    ? "bg-cyan-500/10 border-l-2 border-l-cyan-400/50"
                    : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-cyan-200 font-semibold truncate">{conv.title}</p>
                  <p className="text-[9px] text-cyan-400/30">{conv.messageCount} msgs</p>
                </div>
                <button
                  onClick={e => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 text-xs ml-1 mt-0.5"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Logs */}
        {!isMinimized && (
          <div className="p-3 space-y-1.5 text-xs max-h-[42vh] overflow-y-auto">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`flex gap-2 leading-relaxed ${LOG_COLORS[log.type] || "text-cyan-200"}`}
              >
                <span className="opacity-40 shrink-0 text-[10px] pt-0.5">
                  [{LOG_PREFIX[log.type] || "MSG"}]
                </span>
                <span className="break-words whitespace-pre-wrap flex-1">{log.text}</span>
                {/* Only render timestamp after client mount to avoid hydration mismatch */}
                {log.timestamp && mounted && (
                  <span
                    className="opacity-20 text-[9px] shrink-0 pt-0.5"
                    suppressHydrationWarning
                  >
                    {log.timestamp}
                  </span>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 text-cyan-300/60 animate-pulse">
                <span className="opacity-40 shrink-0 text-[10px] pt-0.5">[AI ]</span>
                <span className="flex gap-1 items-center">
                  Processing
                  <span className="inline-flex gap-0.5">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="animate-bounce" style={{ animationDelay: `${d}ms` }}>
                        .
                      </span>
                    ))}
                  </span>
                </span>
              </div>
            )}

            <div ref={endRef} />
          </div>
        )}

        <div className="px-4 py-1.5 border-t border-cyan-400/10 bg-black/10 flex justify-between items-center">
          <span className="text-[9px] text-cyan-400/30">NEURAL CORE ACTIVE</span>
          <span className="text-[9px] text-emerald-400/50">● ONLINE</span>
        </div>
      </div>
    </div>
  );
}
