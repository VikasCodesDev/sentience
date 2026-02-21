import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "data/files.json");

export interface FileRecord {
  name: string;
  type: string;
  content: string;
  uploadedAt: string;
  size: number;
}

export function loadFiles(): FileRecord[] {
  try {
    if (!fs.existsSync(FILE_PATH)) return [];
    const raw: unknown = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
    if (!Array.isArray(raw)) return [];
    // Handle legacy format (array of plain strings)
    if (raw.length > 0 && typeof raw[0] === "string") {
      return (raw as string[]).map((content, i) => ({
        name: `file_${i}`,
        type: "text/plain",
        content,
        uploadedAt: new Date().toISOString(),
        size: content.length,
      }));
    }
    return raw as FileRecord[];
  } catch {
    return [];
  }
}

export function saveFiles(files: FileRecord[]): void {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(files, null, 2));
}

export function addFileContent(record: FileRecord): void {
  const files = loadFiles();
  files.push(record);
  if (files.length > 20) files.splice(0, files.length - 20);
  saveFiles(files);
}

export function clearFiles(): void {
  saveFiles([]);
}

export function getFilesContext(): string {
  const files = loadFiles();
  if (files.length === 0) return "";
  const parts = files.map(f => `[FILE: ${f.name}]\n${f.content.slice(0, 3000)}`);
  return (
    "\n\n=== KNOWLEDGE BASE (Uploaded Files) ===\n" +
    parts.join("\n\n---\n\n") +
    "\n=== END KNOWLEDGE BASE ==="
  );
}
