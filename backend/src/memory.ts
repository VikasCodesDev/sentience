import fs from "fs";
import path from "path";

const memoryFile = path.join(__dirname, "../memory.json");

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export function loadMemory(): Message[] {
  try {
    if (!fs.existsSync(memoryFile)) return [];
    const data = fs.readFileSync(memoryFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveMemory(memory: Message[]) {
  fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
}