"use client";

import { useEffect, useState } from "react";

type Conversation = {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
  preview: string;
};

type Props = {
  currentId: string;
  onNew: () => void;
  onLoad: (id: string, messages: Array<{ role: string; content: string }>) => void;
  onClose: () => void;
};

export default function ConversationSidebar({ currentId, onNew, onLoad, onClose }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    try {
      const res = await fetch("http://localhost:5000/api/conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch { }
    setLoading(false);
  }

  async function loadConversation(id: string) {
    try {
      const res = await fetch(`http://localhost:5000/api/conversations/${id}`);
      const data = await res.json();
      onLoad(id, data.messages || []);
    } catch { }
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:5000/api/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch { }
  }

  return (
    <div className="fixed inset-0 z-[90] flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-72 bg-black/80 backdrop-blur-2xl border-r border-cyan-400/20 flex flex-col font-mono shadow-[4px_0_40px_rgba(0,255,255,0.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-cyan-400/20 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-cyan-300 tracking-widest">CONVERSATIONS</h2>
            <p className="text-[9px] text-cyan-400/40 mt-0.5">{conversations.length} sessions</p>
          </div>
          <button
            onClick={onClose}
            className="text-cyan-400/40 hover:text-cyan-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* New conversation */}
        <div className="px-4 py-3 border-b border-cyan-400/10">
          <button
            onClick={() => { onNew(); onClose(); }}
            className="w-full py-2 text-xs text-cyan-300 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-400/40 transition-all duration-200 font-semibold tracking-wide"
          >
            + NEW CONVERSATION
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading && (
            <div className="px-4 py-3 text-xs text-cyan-400/40 text-center">Loading...</div>
          )}

          {!loading && conversations.length === 0 && (
            <div className="px-4 py-6 text-xs text-cyan-400/30 text-center">
              No saved conversations yet.
              <br />Start chatting!
            </div>
          )}

          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`group px-4 py-3 cursor-pointer border-b border-cyan-400/5 hover:bg-cyan-500/5 transition-all duration-200 ${
                conv.id === currentId ? "bg-cyan-500/10 border-l-2 border-l-cyan-400/50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-cyan-200 truncate font-semibold">{conv.title}</p>
                  <p className="text-[9px] text-cyan-400/40 mt-0.5 truncate">{conv.preview}</p>
                  <p className="text-[9px] text-cyan-400/30 mt-0.5">
                    {conv.messageCount} msgs · {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all text-xs mt-0.5"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
