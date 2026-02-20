import { Router } from "express";
import Groq from "groq-sdk";
import { loadTasks, addTask, updateTask, deleteTask, cancelTask } from "../utils/task.queue";

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// Active interval registry
const activeIntervals: Record<string, NodeJS.Timeout> = {};

async function runTaskNow(taskId: string, prompt: string) {
  updateTask(taskId, { status: "running", progress: 30 });
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are SENTIENCE autonomous task engine. Execute the following background task concisely and return a structured result." },
        { role: "user", content: prompt }
      ],
      max_tokens: 512,
      temperature: 0.5,
    });
    const result = completion.choices[0]?.message?.content || "Task completed with no output.";
    const tasks = loadTasks();
    const t = tasks.find(t => t.id === taskId);
    if (t) {
      updateTask(taskId, {
        status: "completed",
        progress: 100,
        result,
        runCount: (t.runCount || 0) + 1,
        nextRun: t.type === "recurring" && t.intervalMs
          ? new Date(Date.now() + t.intervalMs).toISOString()
          : undefined,
      });
    }
  } catch (err: any) {
    updateTask(taskId, { status: "failed", progress: 0, result: `Error: ${err?.message}` });
  }
}

router.get("/", (_, res) => {
  res.json({ tasks: loadTasks() });
});

router.post("/", async (req, res) => {
  const { name, description, type, intervalMs } = req.body;
  if (!name || !description) return res.status(400).json({ error: "name and description required" });

  const task = addTask({
    name,
    description,
    status: "pending",
    type: type || "once",
    intervalMs,
  });

  // Run immediately
  runTaskNow(task.id, description);

  // Schedule recurring
  if (type === "recurring" && intervalMs && intervalMs >= 10000) {
    activeIntervals[task.id] = setInterval(() => {
      const current = loadTasks().find(t => t.id === task.id);
      if (!current || current.status === "cancelled") {
        clearInterval(activeIntervals[task.id]);
        delete activeIntervals[task.id];
        return;
      }
      updateTask(task.id, { status: "pending" });
      runTaskNow(task.id, description);
    }, intervalMs);
  }

  res.json({ success: true, task });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  if (activeIntervals[id]) {
    clearInterval(activeIntervals[id]);
    delete activeIntervals[id];
  }
  cancelTask(id);
  deleteTask(id);
  res.json({ success: true });
});

router.post("/:id/run", async (req, res) => {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  runTaskNow(task.id, task.description);
  res.json({ success: true, message: "Task triggered." });
});

export default router;
