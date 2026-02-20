import { Router } from "express";
import { loadTasks } from "../utils/task.queue";
import { loadVault } from "../utils/vault";
import { loadPersonalMemory } from "../utils/personal.memory";
import { loadFiles } from "../utils/file.memory";
import { loadAnalytics } from "../utils/analytics";

const router = Router();
const startTime = Date.now();

// Simulated system processes
const SYSTEM_PROCESSES = [
  { pid: 1001, name: "neural.core", cpu: "2.1%", mem: "128MB", status: "RUNNING" },
  { pid: 1002, name: "memory.mgr", cpu: "0.8%", mem: "64MB", status: "RUNNING" },
  { pid: 1003, name: "groq.client", cpu: "1.2%", mem: "32MB", status: "RUNNING" },
  { pid: 1004, name: "file.analyzer", cpu: "0.3%", mem: "16MB", status: "IDLE" },
  { pid: 1005, name: "tool.executor", cpu: "0.5%", mem: "24MB", status: "READY" },
  { pid: 1006, name: "conversation.mgr", cpu: "0.9%", mem: "48MB", status: "RUNNING" },
  { pid: 1007, name: "vault.service", cpu: "0.2%", mem: "8MB", status: "IDLE" },
  { pid: 1008, name: "task.scheduler", cpu: "0.4%", mem: "12MB", status: "RUNNING" },
];

const systemLogs: string[] = [
  `[${new Date().toISOString()}] SENTIENCE kernel initialized`,
  `[${new Date().toISOString()}] Neural engine online`,
  `[${new Date().toISOString()}] Memory subsystem ready`,
  `[${new Date().toISOString()}] Groq AI client connected`,
  `[${new Date().toISOString()}] File analysis service armed`,
];

export function addSystemLog(msg: string) {
  systemLogs.unshift(`[${new Date().toISOString()}] ${msg}`);
  if (systemLogs.length > 200) systemLogs.pop();
}

router.get("/overview", (_, res) => {
  const analytics = loadAnalytics();
  const tasks = loadTasks();
  const vault = loadVault();
  const memory = loadPersonalMemory();
  const files = loadFiles();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  res.json({
    uptime,
    uptimeStr: uptime < 60 ? `${uptime}s` : uptime < 3600 ? `${Math.floor(uptime/60)}m ${uptime%60}s` : `${Math.floor(uptime/3600)}h ${Math.floor((uptime%3600)/60)}m`,
    neuralLoad: Math.floor(35 + Math.random() * 45),
    memoryUsageMB: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024 * 10) / 10,
    messageCount: analytics.messageCount,
    fileCount: files.length,
    taskCount: tasks.length,
    activeTasks: tasks.filter(t => t.status === "running").length,
    vaultItems: vault.length,
    hasPersonalMemory: memory.facts.length > 0 || !!memory.name,
    groqConnected: !!process.env.GROQ_API_KEY,
  });
});

router.get("/processes", (_, res) => {
  res.json({
    processes: SYSTEM_PROCESSES.map(p => ({
      ...p,
      cpu: `${(parseFloat(p.cpu) + (Math.random() * 0.5 - 0.25)).toFixed(1)}%`,
      uptime: Math.floor((Date.now() - startTime) / 1000),
    }))
  });
});

router.get("/logs", (_, res) => {
  res.json({ logs: systemLogs.slice(0, 50) });
});

router.get("/tools", (_, res) => {
  res.json({
    tools: [
      { id: "time", name: "Clock", description: "Current time and date", status: "ACTIVE", category: "system" },
      { id: "calc", name: "Calculator", description: "Math expression evaluation", status: "ACTIVE", category: "system" },
      { id: "weather", name: "Weather", description: "Real-time weather via wttr.in", status: "ACTIVE", category: "network" },
      { id: "news", name: "News Feed", description: "Top tech news from HackerNews", status: "ACTIVE", category: "network" },
      { id: "joke", name: "Joke Engine", description: "Random jokes", status: "ACTIVE", category: "misc" },
      { id: "quote", name: "Quotes", description: "Inspirational quotes", status: "ACTIVE", category: "misc" },
      { id: "ip", name: "IP Lookup", description: "Public IP detection", status: "ACTIVE", category: "network" },
      { id: "file_analyzer", name: "File Analyzer", description: "PDF, DOCX, TXT, code analysis", status: "ACTIVE", category: "files" },
      { id: "coding_engine", name: "Coding Engine", description: "Production code generation", status: "ACTIVE", category: "ai" },
      { id: "autonomous", name: "Autonomous Planner", description: "Multi-step task planning", status: "ACTIVE", category: "ai" },
      { id: "simulation", name: "Simulation Mode", description: "Interview, debate, roleplay", status: "ACTIVE", category: "ai" },
      { id: "vault", name: "Secure Vault", description: "Personal knowledge storage", status: "ACTIVE", category: "storage" },
    ]
  });
});

router.post("/simulate-command", (req, res) => {
  const { command } = req.body;
  const cmd = (command || "").toLowerCase().trim();
  
  const virtualFS: Record<string, string> = {
    "ls": "drwxr-xr-x  data/\ndrwxr-xr-x  src/\ndrwxr-xr-x  uploads/\n-rw-r--r--  .env\n-rw-r--r--  package.json\n-rw-r--r--  tsconfig.json",
    "ls -la": "total 48\ndrwxr-xr-x 6 sentience sentience 4096 Jan 1 00:00 .\ndrwxr-xr-x 2 sentience sentience 4096 Jan 1 00:00 data\ndrwxr-xr-x 2 sentience sentience 4096 Jan 1 00:00 src\ndrwxr-xr-x 2 sentience sentience 4096 Jan 1 00:00 uploads",
    "pwd": "/home/sentience/core",
    "whoami": "sentience",
    "uname -a": "SENTIENCE 2.0.0 #1 SMP PREEMPT AI Neural Kernel",
    "ps aux": SYSTEM_PROCESSES.map(p => `sentience ${p.pid} ${p.cpu} ${p.mem} ${p.name}`).join("\n"),
    "df -h": "Filesystem      Size  Used Avail Use%\n/dev/neural       1T  42G  958G   4%\n/dev/memory      64G  3.2G  60.8G   5%",
    "uptime": `up ${Math.floor((Date.now() - startTime) / 1000)}s, 1 user, load average: 0.72, 0.68, 0.61`,
    "env": `NODE_ENV=production\nSENTIENCE_VERSION=2.0\nNEURAL_ENGINE=groq\nAI_MODEL=llama-3.1-8b-instant`,
    "date": new Date().toString(),
    "echo $PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/sentience/bin",
    "cat /etc/sentience": "[SENTIENCE CORE CONFIG]\nversion=2.0.0\nmode=production\nneural_threads=16\nmemory_limit=8GB",
  };

  if (cmd.startsWith("echo ")) {
    return res.json({ output: cmd.slice(5) });
  }
  if (cmd.startsWith("mkdir ") || cmd.startsWith("touch ") || cmd.startsWith("rm ")) {
    addSystemLog(`Virtual command executed: ${cmd}`);
    return res.json({ output: `[SANDBOX] ${cmd} — simulated successfully` });
  }
  if (cmd === "clear" || cmd === "cls") {
    return res.json({ output: "", clear: true });
  }
  if (cmd === "help") {
    return res.json({ output: "Available: ls, pwd, whoami, uname, ps, df, uptime, env, date, echo, mkdir, touch, rm, cat" });
  }

  const output = virtualFS[cmd] ?? `command not found: ${cmd}\nType 'help' for available commands.`;
  addSystemLog(`Virtual command: ${cmd}`);
  res.json({ output });
});

export default router;
