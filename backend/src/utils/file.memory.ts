import fs from "fs";
import path from "path";

const FILE_PATH = path.join(__dirname, "../../data/files.json");

export function loadFiles(): string[] {
  if (!fs.existsSync(FILE_PATH)) return [];
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
}

export function saveFiles(files: string[]) {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(files, null, 2));
}

export function addFileContent(content: string) {
  const files = loadFiles();
  files.push(content);
  saveFiles(files);
}

export function clearFiles() {
  saveFiles([]);
}

// ✅ Yeh function missing tha — ai.routes.ts isse import karta hai
export function getFilesContext(): string {
  const files = loadFiles();
  if (files.length === 0) return "";
  return "\n\n=== KNOWLEDGE BASE (Uploaded Files) ===\n" + files.join("\n\n---\n\n") + "\n=== END KNOWLEDGE BASE ===";
}