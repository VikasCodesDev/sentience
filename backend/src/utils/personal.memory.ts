import fs from "fs";
import path from "path";

const MEM_PATH = path.join(process.cwd(), "data/personal_memory.json");

export interface PersonalMemory {
  preferences: Record<string, string>;
  facts: string[];
  goals: string[];
  name?: string;
  context: string[];
  createdAt: string;
  updatedAt: string;
}

function defaultMem(): PersonalMemory {
  return { preferences: {}, facts: [], goals: [], context: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export function loadPersonalMemory(): PersonalMemory {
  try {
    if (!fs.existsSync(MEM_PATH)) return defaultMem();
    return JSON.parse(fs.readFileSync(MEM_PATH, "utf-8"));
  } catch { return defaultMem(); }
}

export function savePersonalMemory(m: PersonalMemory) {
  m.updatedAt = new Date().toISOString();
  fs.writeFileSync(MEM_PATH, JSON.stringify(m, null, 2));
}

export function addMemoryFact(fact: string) {
  const m = loadPersonalMemory();
  m.facts.push(fact);
  if (m.facts.length > 100) m.facts = m.facts.slice(-100);
  savePersonalMemory(m);
}

export function setPreference(key: string, value: string) {
  const m = loadPersonalMemory();
  m.preferences[key] = value;
  savePersonalMemory(m);
}

export function getMemoryContext(): string {
  const m = loadPersonalMemory();
  const parts: string[] = [];
  if (m.name) parts.push(`User's name: ${m.name}`);
  if (Object.keys(m.preferences).length > 0)
    parts.push("User preferences:\n" + Object.entries(m.preferences).map(([k,v]) => `  - ${k}: ${v}`).join("\n"));
  if (m.facts.length > 0)
    parts.push("Known facts about user:\n" + m.facts.slice(-20).map(f => `  - ${f}`).join("\n"));
  if (m.goals.length > 0)
    parts.push("User goals:\n" + m.goals.slice(-10).map(g => `  - ${g}`).join("\n"));
  if (parts.length === 0) return "";
  return "\n\n=== PERSONAL AI MEMORY ===\n" + parts.join("\n") + "\n=== END PERSONAL MEMORY ===";
}

export function clearPersonalMemory() {
  savePersonalMemory(defaultMem());
}
