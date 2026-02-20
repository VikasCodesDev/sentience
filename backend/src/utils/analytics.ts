import fs from "fs";
import path from "path";

const ANALYTICS_PATH = path.join(process.cwd(), "data/analytics.json");

export interface Analytics {
  messageCount: number;
  fileCount: number;
  toolUsage: Record<string, number>;
  sessions: Array<{ start: string; messages: number }>;
  startTime: string;
}

export function loadAnalytics(): Analytics {
  try {
    if (!fs.existsSync(ANALYTICS_PATH))
      return { messageCount: 0, fileCount: 0, toolUsage: {}, sessions: [], startTime: new Date().toISOString() };
    return JSON.parse(fs.readFileSync(ANALYTICS_PATH, "utf-8"));
  } catch {
    return { messageCount: 0, fileCount: 0, toolUsage: {}, sessions: [], startTime: new Date().toISOString() };
  }
}

export function saveAnalytics(a: Analytics) {
  fs.writeFileSync(ANALYTICS_PATH, JSON.stringify(a, null, 2));
}

export function trackMessage() {
  const a = loadAnalytics();
  a.messageCount++;
  if (!a.startTime) a.startTime = new Date().toISOString();
  saveAnalytics(a);
}

export function trackFile() {
  const a = loadAnalytics();
  a.fileCount = (a.fileCount || 0) + 1;
  saveAnalytics(a);
}

export function trackTool(tool: string) {
  const a = loadAnalytics();
  a.toolUsage[tool] = (a.toolUsage[tool] || 0) + 1;
  saveAnalytics(a);
}
