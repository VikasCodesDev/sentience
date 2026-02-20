import { Router } from "express";
import { loadAnalytics } from "../utils/analytics";
import { loadFiles } from "../utils/file.memory";
import { loadMemory } from "../utils/memory.store";
import { loadConversations } from "../utils/conversation.store";

const router = Router();
const startTime = Date.now();

let requestLog: Array<{ time: string; path: string; latency: number; status: number }> = [];
let latencies: number[] = [];

export function logRequest(p: string, latency: number, status: number) {
  requestLog.unshift({ time: new Date().toLocaleTimeString(), path: p, latency, status });
  latencies.push(latency);
  if (requestLog.length > 50) requestLog = requestLog.slice(0, 50);
  if (latencies.length > 100) latencies = latencies.slice(-100);
}

router.get("/core", (_, res) => {
  const analytics = loadAnalytics();
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: "ONLINE", version: "3.0.0",
    uptime: uptime < 60 ? `${uptime}s` : uptime < 3600 ? `${Math.floor(uptime/60)}m ${uptime%60}s` : `${Math.floor(uptime/3600)}h ${Math.floor((uptime%3600)/60)}m`,
    uptimeSeconds: uptime,
    model: "llama-3.1-8b-instant / llama-3.3-70b-versatile",
    neuralLoad: Math.floor(40 + Math.random() * 40),
    memoryUsage: Math.floor((process.memoryUsage().heapUsed / 1024 / 1024) * 10) / 10,
    groqConnected: !!process.env.GROQ_API_KEY,
    messageCount: analytics.messageCount, fileCount: analytics.fileCount,
  });
});

router.get("/network", (_, res) => {
  const apis = [
    { name: "GROQ AI", status: !!process.env.GROQ_API_KEY ? "ONLINE" : "NO_KEY" },
    { name: "Weather API (wttr.in)", status: "ONLINE" },
    { name: "Joke API", status: "ONLINE" },
    { name: "IP API (ipify)", status: "ONLINE" },
    { name: "News (HackerNews)", status: "ONLINE" },
  ];
  const avgLatency = latencies.length > 0 ? Math.round(latencies.slice(-10).reduce((a,b)=>a+b,0)/Math.min(10,latencies.length)) : 0;
  res.json({ apis, requestLog: requestLog.slice(0,20), avgLatency, totalRequests: requestLog.length });
});

router.get("/memory", (_, res) => {
  const files = loadFiles();
  const conversations = loadConversations();
  const legacyMemory = loadMemory();
  const totalChars = (Array.isArray(files) ? files : []).reduce((sum: number, f: any) => sum + (typeof f === "string" ? f.length : (f.content?.length || 0)), 0);
  const convCount = Object.keys(conversations).length;
  const totalMessages = Object.values(conversations).reduce((sum, c) => sum + c.messages.length, 0);
  res.json({
    fileCount: Array.isArray(files) ? files.length : 0,
    totalChars, conversationCount: convCount, totalMessages,
    legacyMessageCount: legacyMemory.length,
    memoryUsageMB: Math.floor((process.memoryUsage().heapUsed / 1024 / 1024) * 10) / 10,
    conversations: Object.values(conversations).map(c => ({ id: c.id, title: c.title, messageCount: c.messages.length, updatedAt: c.updatedAt })),
  });
});

router.get("/analytics", (_, res) => {
  const analytics = loadAnalytics();
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    messageCount: analytics.messageCount, fileCount: analytics.fileCount,
    toolUsage: analytics.toolUsage, uptimeSeconds: uptime,
    avgLatency: latencies.length > 0 ? Math.round(latencies.reduce((a,b)=>a+b,0)/latencies.length) : 0,
    recentLatencies: latencies.slice(-20), totalRequests: requestLog.length,
  });
});

export default router;
