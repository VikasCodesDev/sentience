import fs from "fs";
import path from "path";

const memoryPath = path.join(process.cwd(), "memory.json");

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export function loadMemory(): Message[] {
  try {
    if (!fs.existsSync(memoryPath)) return [];
    const data = fs.readFileSync(memoryPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveMemory(memory: Message[]) {
  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
}

export function clearMemory() {
  if (fs.existsSync(memoryPath)) fs.unlinkSync(memoryPath);
}
