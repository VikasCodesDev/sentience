"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SceneWrapper } from "@/components/scene/SceneWrapper";
import OrbCursor from "@/components/scene/OrbCursor";
import CursorTrail from "@/components/scene/CursorTrail";
import ClickRipple from "@/components/scene/ClickRipple";
import MagneticEffect from "@/components/scene/MagneticEffect";
import SentienceHUD from "@/components/ui/SentienceHUD";
import SpaceVignette from "@/components/ui/SpaceVignette";
import NavNodes from "@/components/ui/NavNodes";
import CommandBar from "@/components/ui/CommandBar";
import AITerminal from "@/components/ui/AITerminal";
import SidePanel from "@/components/ui/SidePanel";
import Toast from "@/components/ui/Toast";
import Footer from "@/components/ui/Footer";

export type Log = {
  type: "system" | "user" | "ai" | "error" | "file" | "tool";
  text: string;
  timestamp?: string;
};

type ToastMsg = { id: number; message: string; type: "success" | "error" | "info" };

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const STORAGE_KEY = "sentience_conv_id";

async function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject("Read failed");
    reader.readAsText(file);
  });
}

export default function Home() {
  const [logs, setLogs] = useState<Log[]>([
    { type: "system", text: "SENTIENCE CORE v3.0 INITIALIZED" },
    { type: "system", text: "All systems nominal. Awaiting command..." },
  ]);
  const [loading, setLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>("");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    const ts = new Date().toLocaleTimeString();
    let savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId) {
      savedId = "conv_" + Date.now();
      localStorage.setItem(STORAGE_KEY, savedId);
    }
    setConversationId(savedId);

    fetch(`http://localhost:5000/api/conversations/${savedId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.messages && data.messages.length > 0) {
          const restored: Log[] = [
            { type: "system", text: "SENTIENCE CORE v3.0 INITIALIZED", timestamp: ts },
            { type: "system", text: `Memory restored — ${data.messages.length / 2 | 0} exchanges in context.`, timestamp: ts },
          ];
          for (const m of data.messages) {
            restored.push({ type: m.role === "user" ? "user" : "ai", text: m.content });
          }
          setLogs(restored);
        } else {
          setLogs([
            { type: "system", text: "SENTIENCE CORE v3.0 INITIALIZED", timestamp: ts },
            { type: "system", text: "All systems nominal. Awaiting command...", timestamp: ts },
          ]);
        }
      })
      .catch(() => {
        setLogs([
          { type: "system", text: "SENTIENCE CORE v3.0 INITIALIZED", timestamp: ts },
          { type: "system", text: "All systems nominal. Awaiting command...", timestamp: ts },
        ]);
      });
  }, []);

  const addLog = useCallback((log: Log) => {
    setLogs(prev => [
      ...prev,
      {
        ...log,
        timestamp: typeof window !== "undefined"
          ? log.timestamp || new Date().toLocaleTimeString()
          : undefined,
      },
    ]);
  }, []);

  function showToast(message: string, type: "success" | "error" | "info" = "info") {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }

  async function handleCommand(cmd: string, file?: File | null) {
    if (!cmd.trim() && !file) return;
    if (!conversationId) return;
    setLoading(true);

    if (cmd.trim()) addLog({ type: "user", text: cmd });
    if (file) addLog({ type: "system", text: `📎 File attached: ${file.name}` });

    try {
      if (file && file.type === "application/pdf") {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("prompt", cmd || `Analyze this PDF file: ${file.name}`);
        formData.append("conversationId", conversationId);
        const res = await fetch("http://localhost:5000/api/ai/ask-with-file", { method: "POST", body: formData });
        const data = await res.json();
        addLog({ type: "ai", text: data.reply || "No response." });
        setLoading(false);
        return;
      }

      let body: Record<string, any> = {
        prompt: cmd || (file ? `Analyze this file: ${file.name}` : ""),
        conversationId,
      };

      if (file) {
        if (IMAGE_TYPES.includes(file.type)) {
          body.fileContext = `=== IMAGE FILE: ${file.name} ===\n[Image file attached. Please describe what analysis you need.]`;
        } else {
          let text = await readAsText(file);
          if (text.length > 12000) text = text.slice(0, 12000) + "\n\n[File truncated...]";
          body.fileContext = `=== FILE: ${file.name} ===\n${text}`;
        }
      }

      const res = await fetch("http://localhost:5000/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      addLog({ type: "ai", text: data.reply || "No response." });
    } catch {
      addLog({ type: "error", text: "Connection to AI failed." });
      showToast("Backend offline — is port 5000 running?", "error");
    }

    setLoading(false);
  }

  function handleNewConversation() {
    const newId = "conv_" + Date.now();
    localStorage.setItem(STORAGE_KEY, newId);
    setConversationId(newId);
    setLogs([
      { type: "system", text: "NEW CONVERSATION INITIALIZED" },
      { type: "system", text: "Fresh session. Memory context reset." },
    ]);
    showToast("New conversation started", "success");
  }

  function handleLoadConversation(id: string, messages: Array<{ role: string; content: string }>) {
    localStorage.setItem(STORAGE_KEY, id);
    setConversationId(id);
    const newLogs: Log[] = [{ type: "system", text: "CONVERSATION LOADED" }];
    for (const m of messages) {
      newLogs.push({ type: m.role === "user" ? "user" : "ai", text: m.content });
    }
    setLogs(newLogs);
    showToast("Conversation loaded", "success");
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <OrbCursor />
      <CursorTrail />
      <MagneticEffect />
      <ClickRipple />
      <SceneWrapper />
      <SentienceHUD />
      <SpaceVignette />

      <NavNodes
        onNodeClick={(label) => setActivePanel(activePanel === label ? null : label)}
        activePanel={activePanel}
      />

      {/* LEFT — AI Terminal */}
      <div className="pointer-events-none fixed left-6 top-1/2 z-50 -translate-y-1/2">
        <div className="pointer-events-auto">
          <AITerminal
            logs={logs}
            loading={loading}
            conversationId={conversationId}
            onNewConversation={handleNewConversation}
            onLoadConversation={handleLoadConversation}
            onLog={addLog}
            onToast={showToast}
          />
        </div>
      </div>

      {/* BOTTOM — Command Bar (above footer) */}
      <div className="pointer-events-none fixed bottom-14 left-1/2 z-50 -translate-x-1/2">
        <div className="pointer-events-auto">
          <CommandBar onSubmit={handleCommand} loading={loading} />
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Side Panel */}
      {activePanel && (
        <SidePanel
          panel={activePanel}
          onClose={() => setActivePanel(null)}
          onToast={showToast}
          onLog={addLog}
          onSimMsg={(msg) => addLog({ type: "ai", text: msg })}
        />
      )}

      {/* Toasts */}
      <div className="fixed top-20 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} />)}
      </div>
    </main>
  );
}
