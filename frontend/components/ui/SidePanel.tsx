"use client";

import React from "react";

import API_BASE from "@/lib/api";

import { useState, useEffect, useRef } from "react";

type Log = { type: "system" | "user" | "ai" | "error" | "file" | "tool"; text: string; timestamp?: string; streaming?: boolean };
type Props = {
  panel: string;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
  onLog?: (log: { type: "system" | "user" | "ai" | "error" | "file" | "tool"; text: string; timestamp?: string; streaming?: boolean }) => void;
  onSimMsg?: (msg: string) => void;
};

const PANEL_TITLES: Record<string, string> = {
  CORE: "SYSTEM CORE",
  NETWORK: "NETWORK STATUS",
  MEMORY: "MEMORY MANAGER",
  ANALYTICS: "ANALYTICS",
};

export default function SidePanel({ panel, onClose, onToast, onLog, onSimMsg }: Props) {
  const [tab, setTab] = useState<string>(getDefaultTab(panel));

  function getDefaultTabInner(p: string) { return getDefaultTab(p); }

  useEffect(() => { setTab(getDefaultTab(panel)); }, [panel]);

  const panelIcons: Record<string, string> = { CORE: "⬡", NETWORK: "◉", MEMORY: "◈", ANALYTICS: "◆" };

  const TABS: Record<string, string[]> = {
    CORE: ["Status", "Processes", "OS Controls", "Simulation", "Reflection"],
    NETWORK: ["Status", "Requests", "Tools"],
    MEMORY: ["Personal", "Vault", "Files", "Conversations"],
    ANALYTICS: ["Metrics", "Tasks", "Logs"],
  };

  const tabs = TABS[panel] || [];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-[480px] max-w-[95vw] h-full bg-black/85 backdrop-blur-2xl border-l border-cyan-400/20 flex flex-col font-mono shadow-[-20px_0_60px_rgba(0,255,255,0.08)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-cyan-400/20 flex items-center justify-between shrink-0 bg-black/20">
          <div className="flex items-center gap-3">
            <span className="text-xl">{panelIcons[panel]}</span>
            <div>
              <h2 className="text-xs font-bold text-cyan-300 tracking-widest">{PANEL_TITLES[panel]}</h2>
              <p className="text-[9px] text-cyan-400/40 mt-0.5">SENTIENCE v4.0</p>
            </div>
          </div>
          <button onClick={onClose} className="text-cyan-400/40 hover:text-red-400 w-7 h-7 flex items-center justify-center border border-cyan-400/10 hover:border-red-400/30 rounded-lg transition-all">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cyan-400/10 shrink-0 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-[10px] tracking-wide whitespace-nowrap transition-all border-b-2 ${
                tab === t
                  ? "border-cyan-400 text-cyan-300 bg-cyan-500/5"
                  : "border-transparent text-cyan-400/40 hover:text-cyan-300"
              }`}
            >{t.toUpperCase()}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {panel === "CORE" && <CoreContent tab={tab} onToast={onToast} />}
          {panel === "NETWORK" && <NetworkContent tab={tab} onToast={onToast} />}
          {panel === "MEMORY" && <MemoryContent tab={tab} onToast={onToast} />}
          {panel === "ANALYTICS" && <AnalyticsContent tab={tab} onToast={onToast} onLog={onLog} />}
        </div>
      </div>
    </div>
  );
}

function getDefaultTab(panel: string): string {
  return { CORE: "Status", NETWORK: "Status", MEMORY: "Personal", ANALYTICS: "Metrics" }[panel] || "Status";
}

function Stat({ label, value, color = "text-cyan-200" }: { label: string; value: any; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-cyan-400/10">
      <span className="text-[10px] text-cyan-400/50 tracking-wide">{label}</span>
      <span className={`text-[11px] font-semibold ${color}`}>{String(value)}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[9px] tracking-widest text-cyan-400/40 mb-3 uppercase">{title}</h3>
      <div className="bg-cyan-500/5 border border-cyan-400/15 rounded-xl p-4">{children}</div>
    </div>
  );
}

// ─── CORE PANEL ──────────────────────────────────────────────────────────────
function CoreContent({ tab, onToast }: { tab: string; onToast: any }) {
  const [data, setData] = useState<any>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [termInput, setTermInput] = useState("");
  const [termOutput, setTermOutput] = useState<string[]>(["SENTIENCE Virtual Terminal v3.0", "Type 'help' for commands."]);
  const [simType, setSimType] = useState("interview");
  const [simTopic, setSimTopic] = useState("");
  const [simSession, setSimSession] = useState<string | null>(null);
  const [simMessages, setSimMessages] = useState<Array<{role:string;content:string}>>([]);
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [reflectInput, setReflectInput] = useState("");
  const [reflectOutput, setReflectOutput] = useState("");
  const [reflectLoading, setReflectLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/system/overview`).then(r=>r.json()).then(setData).catch(()=>{});
    if (tab === "Processes") {
      fetch(`${API_BASE}/api/system/processes`).then(r=>r.json()).then(d=>setProcesses(d.processes||[])).catch(()=>{});
    }
  }, [tab]);

  async function runCommand() {
    if (!termInput.trim()) return;
    const cmd = termInput.trim();
    setTermOutput(prev => [...prev, `$ ${cmd}`]);
    setTermInput("");
    try {
      const res = await fetch(`${API_BASE}/api/system/simulate-command`, {
        method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({command: cmd})
      });
      const d = await res.json();
      if (d.clear) setTermOutput(["SENTIENCE Virtual Terminal v3.0", "Type 'help' for commands."]);
      else setTermOutput(prev => [...prev, ...(d.output || "").split("\n")]);
    } catch { setTermOutput(prev => [...prev, "Error: Backend offline"]); }
  }

  async function startSim() {
    setSimLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/simulation/start`, {
        method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({type: simType, topic: simTopic})
      });
      const d = await res.json();
      setSimSession(d.sessionId);
      setSimMessages([{ role: "assistant", content: d.reply }]);
    } catch { onToast("Simulation failed", "error"); }
    setSimLoading(false);
  }

  async function sendSimMsg() {
    if (!simInput.trim() || !simSession) return;
    const msg = simInput.trim();
    setSimInput("");
    setSimMessages(prev => [...prev, {role:"user",content:msg}]);
    setSimLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/simulation/message`, {
        method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({sessionId:simSession, message:msg})
      });
      const d = await res.json();
      setSimMessages(prev => [...prev, {role:"assistant",content:d.reply}]);
    } catch { onToast("Simulation error", "error"); }
    setSimLoading(false);
  }

  async function reflect() {
    if (!reflectInput.trim()) return;
    setReflectLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/simulation/reflect`, {
        method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({prompt:reflectInput})
      });
      const d = await res.json();
      setReflectOutput(d.reflection || "");
    } catch { onToast("Reflection failed", "error"); }
    setReflectLoading(false);
  }

  if (tab === "Status") return data ? (
    <div>
      <Section title="System Status">
        <Stat label="STATUS" value="ONLINE" color="text-emerald-400" />
        <Stat label="VERSION" value="SENTIENCE v4.0" />
        <Stat label="UPTIME" value={data.uptimeStr} color="text-emerald-400" />
        <Stat label="NEURAL LOAD" value={`${data.neuralLoad}%`} color={data.neuralLoad > 80 ? "text-yellow-300" : "text-emerald-400"} />
        <Stat label="MEMORY HEAP" value={`${data.memoryUsageMB} MB`} />
        <Stat label="GROQ CONNECTED" value={data.groqConnected ? "YES ✓" : "NO"} color={data.groqConnected ? "text-emerald-400" : "text-red-400"} />
        <Stat label="MESSAGES" value={data.messageCount} />
        <Stat label="TASKS ACTIVE" value={data.activeTasks} />
        <Stat label="VAULT ITEMS" value={data.vaultItems} />
      </Section>
    </div>
  ) : <LoadingState />;

  if (tab === "Processes") return (
    <Section title="Active Processes">
      <div className="space-y-1">
        {processes.map((p,i) => (
          <div key={i} className="flex items-center gap-3 py-1.5 border-b border-cyan-400/5 text-[10px]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-cyan-400/60 w-10">{p.pid}</span>
            <span className="text-cyan-200 flex-1">{p.name}</span>
            <span className="text-cyan-400/40 w-12">{p.cpu}</span>
            <span className="text-cyan-400/40 w-14">{p.mem}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${p.status === "RUNNING" ? "bg-emerald-400/10 text-emerald-400" : "bg-cyan-400/10 text-cyan-400"}`}>{p.status}</span>
          </div>
        ))}
      </div>
    </Section>
  );

  if (tab === "OS Controls") return (
    <Section title="Virtual Terminal (Sandboxed)">
      <div className="bg-black/60 rounded-lg border border-cyan-400/10 p-3 h-48 overflow-y-auto mb-3 text-[10px] space-y-0.5">
        {termOutput.map((line, i) => (
          <div key={i} className={line.startsWith("$") ? "text-emerald-300" : "text-cyan-200/70"}>{line}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <span className="text-emerald-400 text-xs">$</span>
        <input
          value={termInput}
          onChange={e => setTermInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && runCommand()}
          className="flex-1 bg-transparent text-cyan-100 outline-none text-xs font-mono border-b border-cyan-400/20 pb-0.5"
          placeholder="ls, pwd, ps aux, df -h..."
        />
        <button onClick={runCommand} className="text-xs text-cyan-400 border border-cyan-400/20 rounded px-2 hover:border-cyan-400/40">RUN</button>
      </div>
    </Section>
  );

  if (tab === "Simulation") return (
    <div>
      {!simSession ? (
        <Section title="Start Simulation">
          <div className="space-y-3">
            <div>
              <label className="text-[9px] text-cyan-400/40 block mb-1">SIMULATION TYPE</label>
              <select
                value={simType}
                onChange={e => setSimType(e.target.value)}
                className="w-full bg-black/40 border border-cyan-400/20 rounded-lg px-3 py-2 text-xs text-cyan-200 outline-none"
              >
                {[["interview","Job Interview"],["startup","Startup Planning"],["coding_test","Coding Test"],["debate","Debate Mode"],["roleplay","Roleplay"],["brainstorm","Brainstorming"],["teaching","Socratic Teaching"]].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-cyan-400/40 block mb-1">TOPIC / CONTEXT (optional)</label>
              <input
                value={simTopic}
                onChange={e => setSimTopic(e.target.value)}
                className="w-full bg-black/40 border border-cyan-400/20 rounded-lg px-3 py-2 text-xs text-cyan-200 outline-none"
                placeholder="e.g. Senior React Developer, AI Startup..."
              />
            </div>
            <button
              onClick={startSim}
              disabled={simLoading}
              className="w-full py-2 text-xs text-cyan-300 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-400/40 transition-all disabled:opacity-50"
            >
              {simLoading ? "Starting..." : "▶ START SIMULATION"}
            </button>
          </div>
        </Section>
      ) : (
        <Section title={`Active Simulation — ${simType.replace("_"," ").toUpperCase()}`}>
          <div className="bg-black/40 rounded-lg border border-cyan-400/10 p-3 h-52 overflow-y-auto mb-3 space-y-2">
            {simMessages.map((m,i) => (
              <div key={i} className={`text-[10px] ${m.role === "assistant" ? "text-cyan-200" : "text-emerald-300"}`}>
                <span className="opacity-40">{m.role === "assistant" ? "[AI] " : "[YOU] "}</span>
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            ))}
            {simLoading && <div className="text-cyan-400/40 text-[10px] animate-pulse">AI responding...</div>}
          </div>
          <div className="flex gap-2">
            <input
              value={simInput}
              onChange={e => setSimInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendSimMsg()}
              className="flex-1 bg-black/40 border border-cyan-400/20 rounded-lg px-3 py-1.5 text-xs text-cyan-200 outline-none"
              placeholder="Your response..."
            />
            <button onClick={sendSimMsg} className="text-xs text-cyan-300 border border-cyan-400/20 rounded-lg px-3 hover:border-cyan-400/40">▶</button>
            <button onClick={() => { setSimSession(null); setSimMessages([]); }} className="text-xs text-red-400/60 border border-red-400/10 rounded-lg px-3 hover:border-red-400/30">END</button>
          </div>
        </Section>
      )}
    </div>
  );

  if (tab === "Reflection") return (
    <Section title="AI Self-Reflection">
      <p className="text-[10px] text-cyan-400/40 mb-3">Ask SENTIENCE to explain its reasoning process, decision paths, and confidence levels.</p>
      <textarea
        value={reflectInput}
        onChange={e => setReflectInput(e.target.value)}
        className="w-full bg-black/40 border border-cyan-400/20 rounded-lg px-3 py-2 text-xs text-cyan-200 outline-none h-20 resize-none mb-2"
        placeholder="e.g. Why did you suggest that approach? What is your confidence on your last answer?"
      />
      <button
        onClick={reflect}
        disabled={reflectLoading}
        className="w-full py-2 text-xs text-cyan-300 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/10 transition-all disabled:opacity-50 mb-3"
      >
        {reflectLoading ? "Reflecting..." : "🧠 REFLECT"}
      </button>
      {reflectOutput && (
        <div className="bg-black/40 border border-cyan-400/10 rounded-lg p-3 text-[10px] text-cyan-200/80 whitespace-pre-wrap leading-relaxed">
          {reflectOutput}
        </div>
      )}
    </Section>
  );

  return null;
}

// ─── NETWORK PANEL ────────────────────────────────────────────────────────────
function NetworkContent({ tab, onToast }: { tab: string; onToast: any }) {
  const [data, setData] = useState<any>(null);
  const [tools, setTools] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/status/network`).then(r=>r.json()).then(setData).catch(()=>{});
    fetch(`${API_BASE}/api/system/tools`).then(r=>r.json()).then(d=>setTools(d.tools||[])).catch(()=>{});
  }, []);

  if (tab === "Status") return data ? (
    <div>
      <Section title="Connected Services">
        <div className="space-y-2">
          {data.apis?.map((a: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-cyan-400/5">
              <span className="text-[11px] text-cyan-200">{a.name}</span>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${a.status==="ONLINE"?"bg-emerald-400 animate-pulse":"bg-red-400"}`} />
                <span className={`text-[10px] ${a.status==="ONLINE"?"text-emerald-300":"text-red-400"}`}>{a.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[{l:"AVG LATENCY",v:`${data.avgLatency}ms`},{l:"REQUESTS",v:data.totalRequests},{l:"STATUS",v:"ACTIVE"}].map((s,i)=>(
          <div key={i} className="p-3 bg-cyan-500/5 border border-cyan-400/10 rounded-xl text-center">
            <div className="text-base font-bold text-cyan-300">{s.v}</div>
            <div className="text-[9px] text-cyan-400/40 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  ) : <LoadingState />;

  if (tab === "Requests") return data ? (
    <Section title="Recent Requests">
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {(data.requestLog || []).slice(0,15).map((r: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-[10px] py-1.5 border-b border-cyan-400/5">
            <span className="text-cyan-400/30 w-14 shrink-0">{r.time}</span>
            <span className={`px-1 py-0.5 rounded text-[9px] shrink-0 ${r.status<400?"bg-emerald-400/10 text-emerald-400":"bg-red-400/10 text-red-400"}`}>{r.status}</span>
            <span className="text-cyan-300/60 flex-1 truncate">{r.path}</span>
            <span className="text-cyan-400/30 shrink-0">{r.latency}ms</span>
          </div>
        ))}
        {(!data.requestLog || data.requestLog.length === 0) && <div className="text-[10px] text-cyan-400/30 text-center py-4">No requests logged yet</div>}
      </div>
    </Section>
  ) : <LoadingState />;

  if (tab === "Tools") return (
    <Section title="Tool Registry">
      <div className="space-y-2">
        {tools.map((t, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-cyan-400/5">
            <div>
              <div className="text-[11px] text-cyan-200 font-semibold">{t.name}</div>
              <div className="text-[9px] text-cyan-400/30">{t.description}</div>
            </div>
            <span className={`text-[9px] px-2 py-0.5 rounded-full ${t.status==="ACTIVE"?"bg-emerald-400/10 text-emerald-400":"bg-red-400/10 text-red-400"}`}>{t.status}</span>
          </div>
        ))}
      </div>
    </Section>
  );

  return null;
}

// ─── MEMORY PANEL ─────────────────────────────────────────────────────────────
function MemoryContent({ tab, onToast }: { tab: string; onToast: any }) {
  const [personalMem, setPersonalMem] = useState<any>(null);
  const [vault, setVault] = useState<any[]>([]);
  const [newFact, setNewFact] = useState("");
  const [userName, setUserName] = useState("");
  const [newNote, setNewNote] = useState({ title: "", content: "", type: "note" });
  const [showAddNote, setShowAddNote] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    if (tab === "Personal") {
      fetch(`${API_BASE}/api/memory`).then(r=>r.json()).then(setPersonalMem).catch(()=>{});
    }
    if (tab === "Vault") {
      fetch(`${API_BASE}/api/vault`).then(r=>r.json()).then(d=>setVault(d.items||[])).catch(()=>{});
    }
    if (tab === "Conversations") {
      fetch(`${API_BASE}/api/conversations`).then(r=>r.json()).then(d=>setConversations(d.conversations||[])).catch(()=>{});
    }
    if (tab === "Files") {
      fetch(`${API_BASE}/api/files/list`).then(r=>r.json()).then(d=>setFiles(d.files||[])).catch(()=>{});
    }
  }, [tab]);

  async function addFact() {
    if (!newFact.trim()) return;
    await fetch(`${API_BASE}/api/memory/fact`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fact:newFact})});
    setNewFact("");
    fetch(`${API_BASE}/api/memory`).then(r=>r.json()).then(setPersonalMem);
    onToast("Memory stored", "success");
  }

  async function setName() {
    if (!userName.trim()) return;
    await fetch(`${API_BASE}/api/memory/name`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:userName})});
    setUserName("");
    fetch(`${API_BASE}/api/memory`).then(r=>r.json()).then(setPersonalMem);
    onToast("Name stored", "success");
  }

  async function clearPersonalMemory() {
    await fetch(`${API_BASE}/api/memory`,{method:"DELETE"});
    fetch(`${API_BASE}/api/memory`).then(r=>r.json()).then(setPersonalMem);
    onToast("Personal memory cleared","info");
  }

  async function addVaultItem() {
    if (!newNote.title || !newNote.content) return;
    await fetch(`${API_BASE}/api/vault`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(newNote)});
    setShowAddNote(false);
    setNewNote({title:"",content:"",type:"note"});
    fetch(`${API_BASE}/api/vault`).then(r=>r.json()).then(d=>setVault(d.items||[]));
    onToast("Saved to vault","success");
  }

  async function deleteVaultItem(id: string) {
    await fetch(`${API_BASE}/api/vault/${id}`,{method:"DELETE"});
    setVault(prev=>prev.filter(v=>v.id!==id));
    onToast("Deleted","info");
  }

  if (tab === "Personal") return personalMem ? (
    <div>
      <Section title="Identity">
        <div className="flex gap-2 mb-3">
          <input
            value={userName}
            onChange={e=>setUserName(e.target.value)}
            placeholder={personalMem.name || "Your name..."}
            className="flex-1 bg-black/40 border border-cyan-400/20 rounded-lg px-3 py-1.5 text-xs text-cyan-200 outline-none"
          />
          <button onClick={setName} className="text-xs text-cyan-300 border border-cyan-400/20 rounded-lg px-3 hover:border-cyan-400/40 transition-all">SET</button>
        </div>
        {personalMem.name && <Stat label="STORED NAME" value={personalMem.name} color="text-emerald-300" />}
      </Section>
      <Section title="Memory Facts">
        <div className="flex gap-2 mb-3">
          <input
            value={newFact}
            onChange={e=>setNewFact(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&addFact()}
            placeholder="I prefer TypeScript, My goal is..."
            className="flex-1 bg-black/40 border border-cyan-400/20 rounded-lg px-3 py-1.5 text-xs text-cyan-200 outline-none"
          />
          <button onClick={addFact} className="text-xs text-emerald-300 border border-emerald-400/20 rounded-lg px-3 hover:border-emerald-400/40">+ADD</button>
        </div>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {(personalMem.facts||[]).length === 0 && <div className="text-[10px] text-cyan-400/30 text-center py-2">No facts stored yet</div>}
          {(personalMem.facts||[]).map((f: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-[10px] py-1.5 border-b border-cyan-400/5">
              <span className="text-cyan-300/60 flex-1">· {f}</span>
            </div>
          ))}
        </div>
      </Section>
      <button onClick={clearPersonalMemory} className="w-full py-2 text-xs text-red-400 border border-red-400/20 rounded-xl hover:bg-red-500/10 transition-all">🧹 Clear Personal Memory</button>
    </div>
  ) : <LoadingState />;

  if (tab === "Vault") return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-cyan-400/40">{vault.length} items stored</span>
        <button onClick={()=>setShowAddNote(!showAddNote)} className="text-xs text-cyan-300 border border-cyan-400/20 rounded-lg px-3 py-1.5 hover:border-cyan-400/40 transition-all">+ ADD</button>
      </div>
      {showAddNote && (
        <div className="mb-4 p-4 bg-cyan-500/5 border border-cyan-400/15 rounded-xl space-y-2">
          <select value={newNote.type} onChange={e=>setNewNote(p=>({...p,type:e.target.value}))}
            className="w-full bg-black/40 border border-cyan-400/20 rounded-lg px-3 py-1.5 text-xs text-cyan-200 outline-none">
            {["note","link","snippet","output"].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <input value={newNote.title} onChange={e=>setNewNote(p=>({...p,title:e.target.value}))}
            placeholder="Title..." className="w-full bg-black/40 border border-cyan-400/20 rounded-lg px-3 py-1.5 text-xs text-cyan-200 outline-none" />
          <textarea value={newNote.content} onChange={e=>setNewNote(p=>({...p,content:e.target.value}))}
            placeholder="Content..." className="w-full bg-black/40 border border-cyan-400/20 rounded-lg px-3 py-2 text-xs text-cyan-200 outline-none h-20 resize-none" />
          <div className="flex gap-2">
            <button onClick={addVaultItem} className="flex-1 py-1.5 text-xs text-emerald-300 border border-emerald-400/20 rounded-lg hover:border-emerald-400/40 transition-all">SAVE</button>
            <button onClick={()=>setShowAddNote(false)} className="flex-1 py-1.5 text-xs text-cyan-400/40 border border-cyan-400/10 rounded-lg">CANCEL</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {vault.length === 0 && <div className="text-[10px] text-cyan-400/30 text-center py-6">Vault is empty. Save notes, links, and snippets here.</div>}
        {vault.map(item => (
          <div key={item.id} className="group p-3 bg-cyan-500/5 border border-cyan-400/10 rounded-xl">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400">{item.type}</span>
                  <span className="text-[11px] text-cyan-200 font-semibold truncate">{item.title}</span>
                </div>
                <p className="text-[10px] text-cyan-400/50 truncate">{item.content}</p>
              </div>
              <button onClick={()=>deleteVaultItem(item.id)} className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 text-xs ml-2 shrink-0">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === "Conversations") return (
    <Section title="Saved Conversations">
      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {conversations.length === 0 && <div className="text-[10px] text-cyan-400/30 text-center py-4">No conversations yet</div>}
        {conversations.map(c => (
          <div key={c.id} className="p-2.5 bg-black/20 border border-cyan-400/5 rounded-lg">
            <div className="text-[11px] text-cyan-200 font-semibold truncate">{c.title}</div>
            <div className="text-[9px] text-cyan-400/30">{c.messageCount} messages · {new Date(c.updatedAt).toLocaleDateString()}</div>
            {c.preview && <div className="text-[9px] text-cyan-400/40 truncate mt-0.5">{c.preview}</div>}
          </div>
        ))}
      </div>
    </Section>
  );

  if (tab === "Files") return (
    <div>
      <Section title="File Knowledge Base">
        <div className="space-y-2">
          {Array.isArray(files) && files.length === 0 && <div className="text-[10px] text-cyan-400/30 text-center py-4">No files analyzed yet. Upload files via the command bar.</div>}
          {Array.isArray(files) && files.map((f: any, i: number) => (
            <div key={i} className="p-2.5 bg-black/20 border border-cyan-400/5 rounded-lg">
              <div className="text-[11px] text-cyan-200 font-semibold truncate">{typeof f === "string" ? `File ${i+1}` : f.name || `File ${i+1}`}</div>
              <div className="text-[9px] text-cyan-400/30 truncate">{typeof f === "string" ? f.slice(0,80) : (f.preview || f.content?.slice(0,80) || "")}...</div>
            </div>
          ))}
        </div>
        {Array.isArray(files) && files.length > 0 && (
          <button
            onClick={async () => { await fetch(`${API_BASE}/api/files/clear`,{method:"DELETE"}); setFiles([]); }}
            className="w-full mt-3 py-1.5 text-xs text-red-400 border border-red-400/20 rounded-lg hover:bg-red-500/10 transition-all"
          >Clear File Memory</button>
        )}
      </Section>
    </div>
  );

  return null;
}

// ─── ANALYTICS PANEL ──────────────────────────────────────────────────────────
function AnalyticsContent({ tab, onToast, onLog }: { tab: string; onToast: any; onLog?: any }) {
  const [data, setData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [newTask, setNewTask] = useState({ name: "", description: "", type: "once", intervalMs: 30000 });
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/status/analytics`).then(r=>r.json()).then(setData).catch(()=>{});
    fetch(`${API_BASE}/api/tasks`).then(r=>r.json()).then(d=>setTasks(d.tasks||[])).catch(()=>{});
    fetch(`${API_BASE}/api/system/logs`).then(r=>r.json()).then(d=>setLogs(d.logs||[])).catch(()=>{});
  }, [tab]);

  async function createTask() {
    if (!newTask.name || !newTask.description) return;
    const res = await fetch(`${API_BASE}/api/tasks`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(newTask)});
    const d = await res.json();
    if (d.success) {
      setTasks(prev=>[...prev, d.task]);
      setShowAddTask(false);
      setNewTask({name:"",description:"",type:"once",intervalMs:30000});
      onToast("Task created","success");
    }
  }

  async function deleteTask(id: string) {
    await fetch(`${API_BASE}/api/tasks/${id}`,{method:"DELETE"});
    setTasks(prev=>prev.filter(t=>t.id!==id));
    onToast("Task cancelled","info");
  }

  async function runTask(id: string) {
    await fetch(`${API_BASE}/api/tasks/${id}/run`,{method:"POST"});
    onToast("Task triggered","success");
    setTimeout(()=>fetch(`${API_BASE}/api/tasks`).then(r=>r.json()).then(d=>setTasks(d.tasks||[])),2000);
  }

  const maxLatency = Math.max(...(data?.recentLatencies || [1]), 1);

  if (tab === "Metrics") return data ? (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[{l:"MESSAGES",v:data.messageCount,icon:"💬"},{l:"FILES",v:data.fileCount,icon:"📎"},{l:"AVG LATENCY",v:`${data.avgLatency}ms`,icon:"⚡"},{l:"REQUESTS",v:data.totalRequests,icon:"📡"}].map((s,i)=>(
          <div key={i} className="p-4 bg-cyan-500/5 border border-cyan-400/10 rounded-xl">
            <div className="flex items-center gap-2"><span>{s.icon}</span><span className="text-[9px] text-cyan-400/40">{s.l}</span></div>
            <div className="text-xl font-bold text-cyan-300 mt-1">{s.v}</div>
          </div>
        ))}
      </div>
      {data.toolUsage && Object.keys(data.toolUsage).length > 0 && (
        <Section title="Tool Usage">
          {Object.entries(data.toolUsage).sort(([,a],[,b])=>(b as number)-(a as number)).map(([tool,count]:any,i)=>{
            const max = Math.max(...Object.values(data.toolUsage) as number[]);
            return (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-[10px] mb-1"><span className="text-cyan-300">{tool.toUpperCase()}</span><span className="text-cyan-400/40">{count}x</span></div>
                <div className="w-full bg-cyan-900/20 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" style={{width:`${(count/max)*100}%`}} /></div>
              </div>
            );
          })}
        </Section>
      )}
      {data.recentLatencies?.length > 0 && (
        <Section title="Latency Chart">
          <div className="flex items-end gap-0.5 h-14">
            {data.recentLatencies.slice(-20).map((lat:number,i:number)=>(
              <div key={i} className="flex-1 bg-gradient-to-t from-cyan-500 to-emerald-400 rounded-sm opacity-70 min-w-[4px]" style={{height:`${(lat/maxLatency)*100}%`}} title={`${lat}ms`} />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-cyan-400/30 mt-1"><span>OLDEST</span><span>NEWEST</span></div>
        </Section>
      )}
    </div>
  ) : <LoadingState />;

  if (tab === "Tasks") return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-cyan-400/40">{tasks.length} tasks</span>
        <button onClick={()=>setShowAddTask(!showAddTask)} className="text-xs text-cyan-300 border border-cyan-400/20 rounded-lg px-3 py-1.5 hover:border-cyan-400/40 transition-all">+ CREATE TASK</button>
      </div>
      {showAddTask && (
        <div className="mb-4 p-4 bg-cyan-500/5 border border-cyan-400/15 rounded-xl space-y-2">
          <input value={newTask.name} onChange={e=>setNewTask(p=>({...p,name:e.target.value}))}
            placeholder="Task name..." className="w-full bg-black/40 border border-cyan-400/20 rounded-lg px-3 py-1.5 text-xs text-cyan-200 outline-none" />
          <textarea value={newTask.description} onChange={e=>setNewTask(p=>({...p,description:e.target.value}))}
            placeholder="What should SENTIENCE do? (e.g. Summarize the latest AI news, Generate a daily motivational message...)"
            className="w-full bg-black/40 border border-cyan-400/20 rounded-lg px-3 py-2 text-xs text-cyan-200 outline-none h-16 resize-none" />
          <div className="flex gap-2">
            <select value={newTask.type} onChange={e=>setNewTask(p=>({...p,type:e.target.value}))}
              className="flex-1 bg-black/40 border border-cyan-400/20 rounded-lg px-2 py-1.5 text-xs text-cyan-200 outline-none">
              <option value="once">Run Once</option>
              <option value="recurring">Recurring</option>
            </select>
            {newTask.type==="recurring" && (
              <select value={newTask.intervalMs} onChange={e=>setNewTask(p=>({...p,intervalMs:parseInt(e.target.value)}))}
                className="flex-1 bg-black/40 border border-cyan-400/20 rounded-lg px-2 py-1.5 text-xs text-cyan-200 outline-none">
                <option value={30000}>30s</option>
                <option value={60000}>1min</option>
                <option value={300000}>5min</option>
                <option value={600000}>10min</option>
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={createTask} className="flex-1 py-1.5 text-xs text-emerald-300 border border-emerald-400/20 rounded-lg hover:border-emerald-400/40 transition-all">▶ CREATE</button>
            <button onClick={()=>setShowAddTask(false)} className="flex-1 py-1.5 text-xs text-cyan-400/40 border border-cyan-400/10 rounded-lg">CANCEL</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {tasks.length === 0 && <div className="text-[10px] text-cyan-400/30 text-center py-6">No background tasks. Create one to run autonomous AI tasks.</div>}
        {tasks.map(t => (
          <div key={t.id} className="p-3 bg-cyan-500/5 border border-cyan-400/10 rounded-xl">
            <div className="flex items-start justify-between mb-1">
              <span className="text-[11px] text-cyan-200 font-semibold">{t.name}</span>
              <div className="flex items-center gap-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  t.status==="completed"?"bg-emerald-400/10 text-emerald-400":
                  t.status==="running"?"bg-yellow-400/10 text-yellow-400":
                  t.status==="failed"?"bg-red-400/10 text-red-400":
                  "bg-cyan-400/10 text-cyan-400"
                }`}>{t.status.toUpperCase()}</span>
              </div>
            </div>
            <p className="text-[9px] text-cyan-400/40 truncate">{t.description}</p>
            {t.result && <p className="text-[9px] text-cyan-200/50 mt-1 truncate">{t.result.slice(0,100)}...</p>}
            <div className="flex gap-1 mt-2">
              <button onClick={()=>runTask(t.id)} className="text-[9px] text-cyan-300 border border-cyan-400/15 rounded px-2 py-1 hover:border-cyan-400/30">RUN</button>
              <button onClick={()=>deleteTask(t.id)} className="text-[9px] text-red-400/50 border border-red-400/10 rounded px-2 py-1 hover:border-red-400/30">DELETE</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === "Logs") return (
    <Section title="System Logs">
      <div className="space-y-0.5 max-h-96 overflow-y-auto font-mono">
        {logs.length === 0 && <div className="text-[10px] text-cyan-400/30 text-center py-4">No logs yet</div>}
        {logs.map((l, i) => (
          <div key={i} className="text-[9px] text-cyan-400/50 py-0.5 border-b border-cyan-400/5 hover:text-cyan-300/60 transition-colors">{l}</div>
        ))}
      </div>
    </Section>
  );

  return null;
}

function LoadingState() {
  return (
    <div className="flex items-center gap-3 text-cyan-400/40 text-xs py-8 justify-center">
      <div className="w-4 h-4 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
      Loading...
    </div>
  );
}
