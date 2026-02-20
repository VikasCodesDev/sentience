import fs from "fs";
import path from "path";

const TASKS_PATH = path.join(process.cwd(), "data/tasks.json");

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  progress: number;
  result?: string;
  createdAt: string;
  updatedAt: string;
  intervalMs?: number;
  nextRun?: string;
  type: "once" | "recurring";
  runCount: number;
}

export function loadTasks(): Task[] {
  try {
    if (!fs.existsSync(TASKS_PATH)) return [];
    return JSON.parse(fs.readFileSync(TASKS_PATH, "utf-8"));
  } catch { return []; }
}

export function saveTasks(tasks: Task[]) {
  fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2));
}

export function addTask(task: Omit<Task, "id" | "createdAt" | "updatedAt" | "runCount" | "progress">): Task {
  const tasks = loadTasks();
  const newTask: Task = {
    ...task,
    id: "task_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    progress: 0,
    runCount: 0,
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export function updateTask(id: string, updates: Partial<Task>) {
  const tasks = loadTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
    saveTasks(tasks);
    return tasks[idx];
  }
  return null;
}

export function deleteTask(id: string) {
  saveTasks(loadTasks().filter(t => t.id !== id));
}

export function cancelTask(id: string) {
  updateTask(id, { status: "cancelled" });
}
