import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

import aiRoutes           from "./routes/ai.routes";
import fileRoutes         from "./routes/file.routes";
import conversationRoutes from "./routes/conversation.routes";
import statusRoutes       from "./routes/status.routes";
import memoryRoutes       from "./routes/memory.routes";
import vaultRoutes        from "./routes/vault.routes";
import tasksRoutes        from "./routes/tasks.routes";
import simulationRoutes   from "./routes/simulation.routes";
import systemRoutes       from "./routes/system.routes";

const app = express();

// CORS — allow any Vercel domain + explicit FRONTEND_URL + localhost dev
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // same-origin / non-browser
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      if (origin === process.env.FRONTEND_URL) return callback(null, true);
      if (origin.startsWith("http://localhost")) return callback(null, true);
      if (origin.startsWith("http://127.0.0.1")) return callback(null, true);
      return callback(null, true); // permissive for now — tighten in prod
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Ensure data directories exist (Render ephemeral FS)
const dataDirs = ["data", "uploads"];
for (const d of dataDirs) {
  const p = path.join(process.cwd(), d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const DATA_DEFAULTS: Record<string, unknown> = {
  "data/conversations.json":   {},
  "data/analytics.json":       { messageCount: 0, fileCount: 0, toolUsage: {}, sessions: [], startTime: new Date().toISOString() },
  "data/files.json":           [],
  "data/vault.json":           [],
  "data/tasks.json":           [],
  "data/personal_memory.json": { preferences: {}, facts: [], goals: [], context: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
};
for (const [file, def] of Object.entries(DATA_DEFAULTS)) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(def, null, 2));
}

// Routes
app.use("/api/ai",            aiRoutes);
app.use("/api/files",         fileRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/status",        statusRoutes);
app.use("/api/memory",        memoryRoutes);
app.use("/api/vault",         vaultRoutes);
app.use("/api/tasks",         tasksRoutes);
app.use("/api/simulation",    simulationRoutes);
app.use("/api/system",        systemRoutes);

app.get("/", (_, res) => res.json({ status: "SENTIENCE Backend v4.0 online 🚀", ts: Date.now() }));

const PORT = parseInt(process.env.PORT ?? "5000", 10);
// Listen on 0.0.0.0 so Render can route traffic correctly
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 SENTIENCE backend on port ${PORT}`);
  console.log(`🔑 Groq API: ${process.env.GROQ_API_KEY ? "Connected ✓" : "MISSING ✗"}`);
});
