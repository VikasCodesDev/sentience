"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SceneWrapper }  from "@/components/scene/SceneWrapper";
import OrbCursor         from "@/components/scene/OrbCursor";
import CursorTrail       from "@/components/scene/CursorTrail";
import ClickRipple       from "@/components/scene/ClickRipple";
import MagneticEffect    from "@/components/scene/MagneticEffect";
import SentienceHUD      from "@/components/ui/SentienceHUD";
import SpaceVignette     from "@/components/ui/SpaceVignette";
import NavNodes          from "@/components/ui/NavNodes";
import CommandBar        from "@/components/ui/CommandBar";
import AITerminal        from "@/components/ui/AITerminal";
import SidePanel         from "@/components/ui/SidePanel";
import Toast             from "@/components/ui/Toast";
import Footer            from "@/components/ui/Footer";
import CommandPalette    from "@/components/ui/CommandPalette";
import ThemeSwitcher     from "@/components/ui/ThemeSwitcher";
import API_BASE          from "@/lib/api";

export type Log = {
  type: "system" | "user" | "ai" | "error" | "file" | "tool";
  text: string;
  timestamp?: string;
  streaming?: boolean;
};

type ToastMsg = { id: number; message: string; type: "success" | "error" | "info" };

const IMAGE_TYPES = ["image/png","image/jpeg","image/jpg","image/webp","image/gif"];
const STORAGE_KEY = "sentience_conv_id";

async function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject("Read failed");
    reader.readAsText(file);
  });
}

export default function Home() {
  const [logs,          setLogs]          = useState<Log[]>([
    { type: "system", text: "SENTIENCE CORE v4.0 INITIALIZED" },
    { type: "system", text: "All systems nominal. Awaiting command..." },
  ]);
  const [loading,       setLoading]       = useState(false);
  const [activePanel,   setActivePanel]   = useState<string | null>(null);
  const [conversationId,setConversationId]= useState<string>("");
  const [toasts,        setToasts]        = useState<ToastMsg[]>([]);
  const [showPalette,   setShowPalette]   = useState(false);
  const [isMobile,      setIsMobile]      = useState(false);
  const [hudHeight,     setHudHeight]     = useState(148);

  const toastId      = useRef(0);
  const streamIdxRef = useRef(-1);
  const hudRef       = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Measure HUD panel height dynamically
  useEffect(() => {
    const el = hudRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (hudRef.current) {
        setHudHeight(24 + hudRef.current.offsetHeight + 20);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Ctrl+K → Command Palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setShowPalette(p => !p); }
      if (e.key === "Escape") setShowPalette(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Restore conversation on mount
  useEffect(() => {
    const ts = new Date().toLocaleTimeString();
    let savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId) { savedId = "conv_" + Date.now(); localStorage.setItem(STORAGE_KEY, savedId); }
    setConversationId(savedId);

    fetch(`${API_BASE}/api/conversations/${savedId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.messages?.length > 0) {
          const restored: Log[] = [
            { type: "system", text: "SENTIENCE CORE v4.0 INITIALIZED", timestamp: ts },
            { type: "system", text: `Memory restored — ${Math.floor(data.messages.length / 2)} exchanges in context.`, timestamp: ts },
          ];
          for (const m of data.messages)
            restored.push({ type: m.role === "user" ? "user" : "ai", text: m.content });
          setLogs(restored);
        } else {
          setLogs([
            { type: "system", text: "SENTIENCE CORE v4.0 INITIALIZED",         timestamp: ts },
            { type: "system", text: "All systems nominal. Awaiting command...", timestamp: ts },
          ]);
        }
      })
      .catch(() => {
        setLogs([
          { type: "system", text: "SENTIENCE CORE v4.0 INITIALIZED",         timestamp: ts },
          { type: "system", text: "All systems nominal. Awaiting command...", timestamp: ts },
        ]);
      });
  }, []);

  const addLog = useCallback((log: Log) => {
    setLogs(prev => [...prev, {
      ...log,
      timestamp: typeof window !== "undefined"
        ? log.timestamp || new Date().toLocaleTimeString()
        : undefined,
    }]);
  }, []);

  function showToast(message: string, type: "success" | "error" | "info" = "info") {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }

  function speakText(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean     = text.replace(/[#*`_~[\]>]/g, "").slice(0, 400);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate  = 0.92;
    utterance.pitch = 0.85;
    const voices    = window.speechSynthesis.getVoices();
    const voice     = voices.find(v => v.name.toLowerCase().includes("google") && v.lang === "en-US")
                   || voices.find(v => v.lang.startsWith("en"))
                   || voices[0];
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  async function streamResponse(prompt: string, fileContext?: string) {
    const res = await fetch(`${API_BASE}/api/ai/stream`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt, conversationId, fileContext }),
    });

    if (!res.ok || !res.body) throw new Error("Stream connection failed");

    const ts = new Date().toLocaleTimeString();
    setLogs(prev => {
      streamIdxRef.current = prev.length;
      return [...prev, { type: "ai", text: "", streaming: true, timestamp: ts }];
    });

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   buf     = "";
    let   full    = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      const lines = buf.split("\n");
      buf = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const ev = JSON.parse(line.slice(6));
          if (ev.error) throw new Error(ev.error);

          if (ev.token) {
            full += ev.token;
            setLogs(prev => {
              const next = [...prev];
              const idx  = streamIdxRef.current;
              if (idx >= 0 && next[idx]) next[idx] = { ...next[idx], text: full };
              return next;
            });
          }

          if (ev.done) {
            setLogs(prev => {
              const next = [...prev];
              const idx  = streamIdxRef.current;
              if (idx >= 0 && next[idx]) next[idx] = { ...next[idx], text: full, streaming: false };
              return next;
            });
            streamIdxRef.current = -1;
            const ttsOn = localStorage.getItem("sentience_tts") === "true";
            if (ttsOn && full) speakText(full);
          }
        } catch { /* skip bad parse */ }
      }
    }
  }

  async function handleCommand(cmd: string, file?: File | null) {
    if (!cmd.trim() && !file) return;
    if (!conversationId) return;
    setLoading(true);

    if (cmd.trim()) addLog({ type: "user", text: cmd });
    if (file)       addLog({ type: "system", text: `📎 File attached: ${file.name}` });

    try {
      if (file && file.type === "application/pdf") {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("prompt", cmd || `Analyze this PDF file: ${file.name}`);
        formData.append("conversationId", conversationId);
        const res  = await fetch(`${API_BASE}/api/ai/ask-with-file`, { method: "POST", body: formData });
        const data = await res.json();
        addLog({ type: "ai", text: data.reply || "No response." });
        const ttsOn = localStorage.getItem("sentience_tts") === "true";
        if (ttsOn && data.reply) speakText(data.reply);
        setLoading(false);
        return;
      }

      let fileContext: string | undefined;
      if (file) {
        if (IMAGE_TYPES.includes(file.type)) {
          fileContext = `=== IMAGE FILE: ${file.name} ===\n[Image file attached. Please describe what analysis you need.]`;
        } else {
          let text = await readAsText(file);
          if (text.length > 12000) text = text.slice(0, 12000) + "\n\n[File truncated...]";
          fileContext = `=== FILE: ${file.name} ===\n${text}`;
        }
      }

      await streamResponse(cmd || (file ? `Analyze this file: ${file.name}` : ""), fileContext);

    } catch {
      addLog({ type: "error", text: "Connection to AI failed." });
      showToast("Backend offline — is it running?", "error");
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
    for (const m of messages)
      newLogs.push({ type: m.role === "user" ? "user" : "ai", text: m.content });
    setLogs(newLogs);
    showToast("Conversation loaded", "success");
  }

  function handlePaletteAction(action: string, value?: string) {
    setShowPalette(false);
    switch (action) {
      case "new_chat":    handleNewConversation(); break;
      case "open_panel":  setActivePanel(value || "CORE"); break;
      case "send_cmd":    if (value) handleCommand(value); break;
      case "toggle_tts": {
        const cur = localStorage.getItem("sentience_tts") === "true";
        localStorage.setItem("sentience_tts", String(!cur));
        showToast(`Voice output ${!cur ? "ON 🔊" : "OFF 🔇"}`, "info");
        break;
      }
    }
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">

      {!isMobile && (
        <>
          <OrbCursor />
          <CursorTrail />
          <MagneticEffect />
          <ClickRipple />
        </>
      )}

      <SceneWrapper />

      <SentienceHUD hudRef={hudRef} />

      <SpaceVignette />

      <NavNodes
        onNodeClick={(label) => setActivePanel(activePanel === label ? null : label)}
        activePanel={activePanel}
      />

      {/* Theme Switcher — dynamically positioned just below HUD panel */}
      <div
        className="pointer-events-none fixed right-6 z-[60]"
        style={{ top: hudHeight }}
      >
        <div className="pointer-events-auto">
          <ThemeSwitcher />
        </div>
      </div>

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

      {/* BOTTOM — Command Bar */}
      <div className="pointer-events-none fixed bottom-14 left-1/2 z-50 -translate-x-1/2">
        <div className="pointer-events-auto">
          <CommandBar
            onSubmit={handleCommand}
            loading={loading}
            onOpenPalette={() => setShowPalette(true)}
          />
        </div>
      </div>

      {/* Ctrl+K hint */}
      <div className="pointer-events-none fixed bottom-14 right-6 z-40 hidden md:block">
        <button
          className="pointer-events-auto text-[9px] font-mono text-cyan-400/20 hover:text-cyan-400/50 transition-colors border border-cyan-400/10 hover:border-cyan-400/20 rounded-lg px-2 py-1 flex items-center gap-1"
          onClick={() => setShowPalette(true)}
        >
          <span>⌘K</span>
        </button>
      </div>

      <Footer />

      {showPalette && (
        <CommandPalette
          onAction={handlePaletteAction}
          onClose={() => setShowPalette(false)}
        />
      )}

      {activePanel && (
        <SidePanel
          panel={activePanel}
          onClose={() => setActivePanel(null)}
          onToast={showToast}
          onLog={addLog}
          onSimMsg={(msg) => addLog({ type: "ai", text: msg })}
        />
      )}

      <div className="fixed top-20 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} />)}
      </div>

    </main>
  );
}
