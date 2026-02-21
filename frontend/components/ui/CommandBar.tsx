"use client";

import { useRef, useState, useEffect } from "react";

type Props = {
  onSubmit: (cmd: string, file?: File | null) => void;
  onFileAttached?: (file: File, context: string) => void;
  pendingFileName?: string | null;
  loading?: boolean;
  onOpenPalette?: () => void;   // NEW — optional, won't break existing callers
};

export default function CommandBar({ onSubmit, onFileAttached, pendingFileName, loading, onOpenPalette }: Props) {
  const [cmd,         setCmd]         = useState("");
  const [file,        setFile]        = useState<File | null>(null);
  const [isDragging,  setIsDragging]  = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SR  = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SR();
      rec.continuous     = false;
      rec.interimResults = false;
      rec.lang           = "en-US";
      rec.onresult = (e: any) => { setCmd(prev => prev + e.results[0][0].transcript); setIsListening(false); };
      rec.onerror  = () => setIsListening(false);
      rec.onend    = () => setIsListening(false);
      setRecognition(rec);
    }
  }, []);

  function handleFileSelect(f: File) { setFile(f); }

  async function send() {
    if (!cmd.trim() && !file && !pendingFileName) return;
    onSubmit(cmd, file);
    setCmd(""); setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleVoice() {
    if (!recognition) return;
    if (isListening) { recognition.stop(); setIsListening(false); }
    else             { recognition.start(); setIsListening(true); }
  }

  const hasContent    = cmd.trim() || file || pendingFileName;
  const displayName   = file?.name || pendingFileName;

  return (
    <div
      className={`w-[680px] max-w-[95vw] bg-black/50 backdrop-blur-xl border rounded-2xl p-3 flex flex-col gap-2 transition-all duration-300 ${
        isDragging
          ? "border-cyan-400/60 shadow-[0_0_30px_rgba(0,255,255,0.3)]"
          : "border-cyan-400/20 shadow-[0_0_20px_rgba(0,255,255,0.1)]"
      }`}
      onDragOver={e  => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={()=> setIsDragging(false)}
      onDrop={e      => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileSelect(f); }}
    >
      {/* File Preview — unchanged */}
      {displayName && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-cyan-500/10 border border-cyan-400/20 rounded-lg">
          <span className="text-lg">📎</span>
          <span className="text-xs text-cyan-300 font-mono flex-1 truncate">{displayName}</span>
          <button
            onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
            className="text-cyan-400/60 hover:text-red-400 transition-colors text-xs"
          >✕</button>
        </div>
      )}

      {/* Main Input Row — ⌘K button inserted between file and text input */}
      <div className="flex gap-2 items-center">
        {/* File Upload — unchanged */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 rounded-lg transition-all duration-200 hover:border-cyan-400/40 hover:shadow-[0_0_10px_rgba(0,255,255,0.2)] text-base shrink-0"
          title="Attach file (PDF, DOCX, TXT, images, code)"
        >📎</button>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".pdf,.docx,.doc,.txt,.md,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.cs,.go,.rs,.json,.yaml,.yml,.csv,.html,.css,.png,.jpg,.jpeg,.webp"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
        />

        {/* ⌘K palette shortcut — desktop only, min-width so it doesn't overflow narrow screens */}
        {onOpenPalette && (
          <button
            onClick={onOpenPalette}
            title="Command palette (Ctrl+K)"
            className="hidden md:flex items-center gap-1 text-[9px] text-cyan-400/35 hover:text-cyan-300 border border-cyan-400/10 hover:border-cyan-400/30 rounded-lg px-2 py-1.5 transition-all shrink-0 font-mono"
          >
            <span>⌘K</span>
          </button>
        )}

        {/* Text Input — unchanged */}
        <input
          ref={inputRef}
          value={cmd}
          onChange={e  => setCmd(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={
            isListening  ? "🎙 Listening..."
            : displayName ? "Add a message about the file (or press send)..."
            : "Ask SENTIENCE anything..."
          }
          disabled={loading}
          className="flex-1 bg-transparent outline-none text-cyan-100 font-mono text-sm placeholder-cyan-400/40 disabled:opacity-50"
        />

        {/* Voice Button — unchanged */}
        {recognition && (
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-lg border transition-all duration-200 text-base shrink-0 ${
              isListening
                ? "bg-red-500/20 border-red-400/40 text-red-300 animate-pulse shadow-[0_0_10px_rgba(255,80,80,0.3)]"
                : "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-400/20 hover:border-cyan-400/40"
            }`}
            title="Voice input"
          >🎙</button>
        )}

        {/* Send Button — unchanged */}
        <button
          onClick={send}
          disabled={!hasContent || loading}
          className={`px-4 py-2 rounded-lg border font-mono text-xs font-semibold transition-all duration-200 shrink-0 ${
            hasContent && !loading
              ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:border-cyan-300"
              : "bg-black/20 border-cyan-400/10 text-cyan-400/30 cursor-not-allowed"
          }`}
        >
          {loading ? "..." : "▶ SEND"}
        </button>
      </div>

      {isDragging && (
        <div className="text-center text-xs text-cyan-400 animate-pulse">Drop file to attach</div>
      )}
    </div>
  );
}
